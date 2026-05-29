const express = require("express");
const { v4: uuid } = require("uuid");
const {
  nowIso,
  readDb,
  writeDb,
  getOrCreateCart,
  calculateCartTotals
} = require("../data/store");
const { adminOnly } = require("../middleware/auth");

const router = express.Router();

const ORDER_STATUSES = [
  "Pending",
  "Paid",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled"
];

function hydrateOrder(order, db) {
  const customer = db.users.find((entry) => entry.id === order.userId);
  return {
    ...order,
    customer: customer
      ? {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          role: customer.role
        }
      : null
  };
}

function generateOrderNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 90000) + 10000);
  return `DTMK-${y}${m}${d}-${rand}`;
}

function computeDiscount(items, couponCode) {
  const code = String(couponCode || "").trim().toUpperCase();
  if (!code) {
    return { code: null, amount: 0, label: "No coupon" };
  }

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const serviceSubtotal = items
    .filter((item) => item.type === "service")
    .reduce((sum, item) => sum + item.subtotal, 0);

  if (code === "TECH10") {
    return {
      code,
      amount: Number((subtotal * 0.1).toFixed(2)),
      label: "10% off order"
    };
  }

  if (code === "HOST20") {
    return {
      code,
      amount: Number((serviceSubtotal * 0.2).toFixed(2)),
      label: "20% off hosting/services"
    };
  }

  if (code === "WELCOME5") {
    return {
      code,
      amount: Number(Math.min(5, subtotal).toFixed(2)),
      label: "M5 welcome discount"
    };
  }

  return {
    code: null,
    amount: 0,
    label: "Invalid coupon"
  };
}

function calculateTotals(items, couponCode) {
  const subtotal = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const physicalItems = items.filter((item) => item.type !== "service");
  const deliveryFee = physicalItems.length > 0 ? (subtotal >= 800 ? 0 : 25) : 0;
  const tax = Number((subtotal * 0.15).toFixed(2));
  const discount = computeDiscount(items, couponCode);
  const grandTotal = Number(
    Math.max(0, subtotal + deliveryFee + tax - Number(discount.amount || 0)).toFixed(2)
  );

  return {
    subtotal,
    tax,
    deliveryFee,
    discountAmount: Number(discount.amount || 0),
    couponCode: discount.code,
    couponLabel: discount.label,
    grandTotal
  };
}

const PAYMENT_METHODS = ["Mpesa", "Ecocash", "Debit card"];

function normalizePaymentMethod(value) {
  const candidate = String(value || "").trim().toLowerCase();
  return PAYMENT_METHODS.find((method) => method.toLowerCase() === candidate) || "";
}

function isMobileMoney(method) {
  return method === "Mpesa" || method === "Ecocash";
}

function getLesothoDigits(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.startsWith("266") ? digits.slice(3) : digits;
}

function isValidLesothoNumber(value) {
  return /^[56]\d{7}$/.test(getLesothoDigits(value));
}

function normalizePaymentDetails(method, rawDetails = {}, expectedAmount = 0) {
  const details = rawDetails && typeof rawDetails === "object" ? rawDetails : {};

  if (!PAYMENT_METHODS.includes(method)) {
    return {
      error: "Payment method must be one of: Mpesa, Ecocash, Debit card."
    };
  }

  if (isMobileMoney(method)) {
    const lesothoNumber = getLesothoDigits(details.lesothoNumber);
    const amount = Number(expectedAmount);

    if (!isValidLesothoNumber(lesothoNumber)) {
      return { error: "A valid Lesotho mobile number is required." };
    }

    if (!(amount > 0)) {
      return { error: "Payment amount could not be calculated from the order total." };
    }

    return {
      details: {
        lesothoNumber: `+266${lesothoNumber}`,
        amount
      }
    };
  }

  const cardNumber = String(details.cardNumber || "").replace(/\D/g, "");
  const cvc = String(details.cvc || "").trim();

  if (!/^\d{13,19}$/.test(cardNumber)) {
    return { error: "A valid debit card number is required." };
  }

  if (!/^\d{3,4}$/.test(cvc)) {
    return { error: "A valid CVC is required." };
  }

  return {
    details: {
      cardLast4: cardNumber.slice(-4)
    }
  };
}

router.post("/checkout", async (req, res) => {
  const { paymentMethod, paymentDetails, shippingAddress, billingAddress, couponCode } = req.body;

  const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);
  if (!normalizedPaymentMethod) {
    return res.status(400).json({ message: "paymentMethod is required." });
  }

  const db = await readDb();
  const cart = getOrCreateCart(db, req.user.id);
  const detailedCart = calculateCartTotals(cart.items, db.products);

  if (detailedCart.items.length === 0) {
    return res.status(400).json({ message: "Cart is empty." });
  }

  for (const item of detailedCart.items) {
    const product = db.products.find((entry) => entry.id === item.productId);
    if (!product || (item.type !== "service" && product.stock < item.quantity)) {
      return res.status(400).json({
        message: `Insufficient stock for ${item.name}.`
      });
    }
  }

  detailedCart.items.forEach((item) => {
    const product = db.products.find((entry) => entry.id === item.productId);
    if (item.type !== "service") {
      product.stock -= item.quantity;
    }
    product.popularity = Math.min(999, Number(product.popularity || 0) + item.quantity);
    product.updatedAt = nowIso();
  });

  const timestamp = nowIso();
  const totals = calculateTotals(detailedCart.items, couponCode);
  const normalizedPayment = normalizePaymentDetails(
    normalizedPaymentMethod,
    paymentDetails,
    totals.grandTotal
  );
  if (normalizedPayment.error) {
    return res.status(400).json({ message: normalizedPayment.error });
  }

  const order = {
    id: uuid(),
    orderNumber: generateOrderNumber(),
    userId: req.user.id,
    items: detailedCart.items,
    totals,
    total: totals.grandTotal,
    status: "Paid",
    statusHistory: [
      {
        status: "Pending",
        note: "Order created.",
        timestamp
      },
      {
        status: "Paid",
        note: "Simulated payment approved.",
        timestamp
      }
    ],
    payment: {
      method: normalizedPaymentMethod,
      transactionRef: `TX-${Date.now()}`,
      simulated: true,
      amount: totals.grandTotal,
      details: normalizedPayment.details
    },
    shippingAddress: String(shippingAddress || "Not required").trim(),
    billingAddress: String(billingAddress || "").trim(),
    createdAt: timestamp,
    updatedAt: timestamp
  };

  db.orders.push(order);
  cart.items = [];
  await writeDb(db);

  return res.status(201).json({
    message: "Checkout complete. Payment was simulated successfully.",
    order
  });
});

router.get("/orders", async (req, res) => {
  const db = await readDb();
  const orders =
    req.user.role === "admin"
      ? db.orders
      : db.orders.filter((order) => order.userId === req.user.id);

  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return res.json({
    orders:
      req.user.role === "admin"
        ? sortedOrders.map((order) => hydrateOrder(order, db))
        : sortedOrders
  });
});

router.get("/orders/:id", async (req, res) => {
  const db = await readDb();
  const order = db.orders.find((entry) => entry.id === req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }
  if (req.user.role !== "admin" && order.userId !== req.user.id) {
    return res.status(403).json({ message: "Access denied for this order." });
  }
  return res.json({
    order: req.user.role === "admin" ? hydrateOrder(order, db) : order
  });
});

router.patch("/orders/:id/status", adminOnly, async (req, res) => {
  const { status, note } = req.body;
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Status must be one of: ${ORDER_STATUSES.join(", ")}`
    });
  }

  const db = await readDb();
  const order = db.orders.find((entry) => entry.id === req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }

  order.status = status;
  order.updatedAt = nowIso();
  order.statusHistory.push({
    status,
    note: note ? String(note).trim() : `Status changed to ${status}.`,
    timestamp: order.updatedAt
  });

  await writeDb(db);
  return res.json({
    message: "Order status updated.",
    order: hydrateOrder(order, db)
  });
});

module.exports = router;

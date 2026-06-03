const express = require("express");
const { adminOnly } = require("../middleware/auth");
const { readDb, writeDb, sanitizeUser } = require("../data/store");

const router = express.Router();

router.use(adminOnly);

function isCypressTestUser(user) {
  return /^cypress\.user\.\d+@example\.com$/i.test(String(user?.email || ""));
}

function getMonthlySales(orders) {
  const map = new Map();
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, 0);
  }

  orders.forEach((order) => {
    const dt = new Date(order.createdAt);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    if (map.has(key)) {
      map.set(key, Number((map.get(key) + Number(order.total || 0)).toFixed(2)));
    }
  });

  return Array.from(map.entries()).map(([month, total]) => ({ month, total }));
}

function getTopSellingProducts(orders, products) {
  const counts = new Map();
  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const current = counts.get(item.productId) || { quantity: 0, revenue: 0 };
      counts.set(item.productId, {
        quantity: current.quantity + Number(item.quantity || 0),
        revenue: Number((current.revenue + Number(item.subtotal || 0)).toFixed(2))
      });
    });
  });

  return Array.from(counts.entries())
    .map(([productId, stats]) => {
      const product = products.find((entry) => entry.id === productId);
      return {
        productId,
        name: product ? product.name : "Deleted Product",
        category: product ? product.category : "Unknown",
        ...stats
      };
    })
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);
}

router.get("/summary", async (req, res) => {
  const db = await readDb();
  const visibleUsers = db.users.filter((user) => !isCypressTestUser(user));
  const totalRevenue = db.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const ordersByStatus = db.orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const categoryDistribution = db.products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});

  const lowStockProducts = db.products
    .filter((product) => product.type !== "service" && product.stock <= 5)
    .sort((a, b) => a.stock - b.stock);

  const recentOrders = [...db.orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt
    }));

  return res.json({
    users: visibleUsers.length,
    products: db.products.length,
    orders: db.orders.length,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    ordersByStatus,
    categoryDistribution,
    lowStockProducts,
    topSellingProducts: getTopSellingProducts(db.orders, db.products),
    monthlySales: getMonthlySales(db.orders),
    recentOrders
  });
});

router.get("/users", async (req, res) => {
  const db = await readDb();
  const users = db.users
    .filter((user) => !isCypressTestUser(user))
    .map((user) => sanitizeUser(user))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return res.json({ users });
});

router.patch("/users/:id/role", async (req, res) => {
  const { role } = req.body;
  if (!["admin", "customer"].includes(role)) {
    return res.status(400).json({ message: "role must be admin or customer." });
  }

  const db = await readDb();
  const user = db.users.find((entry) => entry.id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }
  user.role = role;
  user.updatedAt = new Date().toISOString();
  await writeDb(db);
  return res.json({ message: "User role updated.", user: sanitizeUser(user) });
});

module.exports = router;

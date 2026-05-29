import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatMoney } from "../utils/currency";
import {
  INVALID_NUMERIC_INPUT_MESSAGE,
  getNumericInputError
} from "../utils/numericValidation";

const CART_FLOW = [
  { label: "Cart", icon: "cart" },
  { label: "Delivery", icon: "truck" },
  { label: "Payment", icon: "card" },
  { label: "Confirmation", icon: "check" }
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function CartIcon({ name, className = "cart-page-icon" }) {
  const paths = {
    cart: (
      <>
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L21 8H7" />
      </>
    ),
    truck: (
      <>
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    card: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12.4 2.6 2.6L16.5 9" />
      </>
    ),
    monitor: (
      <>
        <rect x="4" y="5" width="16" height="11" rx="1.5" />
        <path d="M9 20h6" />
        <path d="M12 16v4" />
      </>
    ),
    chip: (
      <>
        <rect x="7" y="7" width="10" height="10" rx="1.5" />
        <path d="M4 9h3M4 15h3M17 9h3M17 15h3M9 4v3M15 4v3M9 17v3M15 17v3" />
      </>
    ),
    memory: (
      <>
        <rect x="5" y="8" width="14" height="8" rx="1.5" />
        <path d="M8 16v3M12 16v3M16 16v3M8 5v3M12 5v3M16 5v3" />
      </>
    ),
    drive: (
      <>
        <rect x="6" y="4" width="12" height="16" rx="2" />
        <circle cx="12" cy="15" r="1.5" />
        <path d="M9 8h6" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5.5c0 4.2 2.9 8 7 9.5 4.1-1.5 7-5.3 7-9.5V6z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M10 11v6M14 11v6" />
        <path d="M6 7l1 13h10l1-13" />
        <path d="M9 7V4h6v3" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <path d="M12 14v3" />
      </>
    ),
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    clipboard: (
      <>
        <path d="M9 4h6l1 2h2v15H6V6h2z" />
        <path d="M9 10h6M9 14h6" />
      </>
    ),
    cloud: (
      <>
        <path d="M17.5 17H8a5 5 0 0 1-.8-9.9A6 6 0 0 1 18.6 9.5 3.8 3.8 0 0 1 17.5 17z" />
        <path d="M12 11v7" />
      </>
    ),
    server: (
      <>
        <rect x="5" y="4" width="14" height="6" rx="1.5" />
        <rect x="5" y="14" width="14" height="6" rx="1.5" />
        <path d="M8 7h.01M8 17h.01" />
      </>
    ),
    package: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
        <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
      </>
    )
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      {paths[name] || paths.package}
    </svg>
  );
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatEstimateRange() {
  const start = addDays(new Date(), 3);
  const end = addDays(new Date(), 5);
  const startMonth = MONTH_NAMES[start.getMonth()];
  const endMonth = MONTH_NAMES[end.getMonth()];

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${start.getDate()} - ${end.getDate()} ${endMonth} ${end.getFullYear()}`;
  }

  if (start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${end.getFullYear()}`;
  }

  return `${start.getDate()} ${startMonth} ${start.getFullYear()} - ${end.getDate()} ${endMonth} ${end.getFullYear()}`;
}

function getItemSpecs(item) {
  const lowerText = `${item.name || ""} ${item.category || ""} ${item.subcategory || ""}`.toLowerCase();

  if (item.type === "service") {
    return [
      { icon: "server", label: item.provider || item.brand || "Managed service" },
      { icon: "cloud", label: "Instant activation" },
      { icon: "shield", label: "Secure setup" },
      { icon: "package", label: item.subcategory || item.category || "Service plan" }
    ];
  }

  if (lowerText.includes("laptop")) {
    return [
      { icon: "monitor", label: lowerText.includes("14") ? "14 inch FHD Display" : "15.6 inch FHD Display" },
      { icon: "chip", label: lowerText.includes("gaming") ? "Gaming performance" : "Intel Core i5" },
      { icon: "memory", label: lowerText.includes("elitebook") ? "16GB RAM" : "8GB RAM" },
      { icon: "drive", label: "512GB SSD" }
    ];
  }

  if (lowerText.includes("desktop") || lowerText.includes("workstation") || lowerText.includes("mini")) {
    return [
      { icon: "chip", label: "Intel Core CPU" },
      { icon: "memory", label: "16GB RAM" },
      { icon: "drive", label: "512GB SSD" },
      { icon: "monitor", label: item.subcategory || "Desktop system" }
    ];
  }

  if (lowerText.includes("monitor") || lowerText.includes("display")) {
    return [
      { icon: "monitor", label: "Sharp display" },
      { icon: "shield", label: "1 Year Warranty" },
      { icon: "package", label: item.brand || item.category || "Display" },
      { icon: "drive", label: item.subcategory || "Office ready" }
    ];
  }

  return [
    { icon: "package", label: item.subcategory || item.category || "Product" },
    { icon: "shield", label: item.brand || "Quality checked" },
    { icon: "drive", label: item.type === "service" ? "Digital item" : `${item.stock || 0} available` },
    { icon: "monitor", label: "Ready to ship" }
  ];
}

export default function CartPage() {
  const { cart, refreshCart, updateQuantity, removeItem, getErrorMessage } = useCart();
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const totals = useMemo(() => {
    const subtotal = Number(cart.summary?.subtotal ?? cart.total ?? 0);
    const tax = Number(cart.summary?.tax ?? 0);
    const deliveryFee = Number(cart.summary?.deliveryFee ?? 0);
    const grandTotal = Number(cart.summary?.grandTotal ?? cart.total ?? 0);
    const itemCount = cart.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    return { subtotal, tax, deliveryFee, grandTotal, itemCount };
  }, [cart.items, cart.summary, cart.total]);

  useEffect(() => {
    refreshCart().catch((fetchError) => setError(getErrorMessage(fetchError)));
  }, []);

  const onUpdateQty = async (productId, quantity) => {
    const inputError = getNumericInputError(quantity, "digits");
    if (inputError) {
      setError(INVALID_NUMERIC_INPUT_MESSAGE);
      return;
    }

    const nextQuantity = Number(quantity);
    if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
      return;
    }
    setBusyId(productId);
    setError("");
    try {
      await updateQuantity(productId, nextQuantity);
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setBusyId("");
    }
  };

  const onRemove = async (productId) => {
    setBusyId(productId);
    setError("");
    try {
      await removeItem(productId);
    } catch (removeError) {
      setError(getErrorMessage(removeError));
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="cart-neon" data-cy="cart-page">
      <div className="cart-shell">
        <div className="cart-progress" aria-label="Checkout progress">
          {CART_FLOW.map((step, index) => (
            <div
              className={index === 0 ? "cart-progress-step active" : "cart-progress-step"}
              key={step.label}
            >
              <span className="cart-progress-node">
                <CartIcon name={step.icon} />
              </span>
              <strong>
                {index + 1}. {step.label}
              </strong>
            </div>
          ))}
        </div>

        {error && <p className="cart-error">{error}</p>}

        {cart.items.length === 0 ? (
          <section className="cart-empty-panel" data-cy="cart-empty-state">
            <span className="cart-panel-icon">
              <CartIcon name="cart" />
            </span>
            <h1>Your cart is empty</h1>
            <p>Browse the catalog and add products to continue.</p>
            <Link className="cart-checkout-btn" to="/catalog">
              Explore Catalog
              <CartIcon name="arrow" />
            </Link>
          </section>
        ) : (
          <div className="cart-layout">
            <section className="cart-main-panel">
              <div className="cart-panel-heading">
                <span className="cart-panel-icon">
                  <CartIcon name="cart" />
                </span>
                <div>
                  <h1>Your Shopping Cart</h1>
                  <p>Review your items and proceed to secure checkout</p>
                </div>
              </div>

              <div className="cart-list">
                {cart.items.map((item) => {
                  const inStock = item.type === "service" || Number(item.stock || 0) > 0;
                  const deliveryCopy =
                    item.type === "service" ? "Digital activation: Instant" : `Estimated delivery: ${formatEstimateRange()}`;
                  const isPlusDisabled =
                    busyId === item.productId ||
                    (item.type !== "service" && Number(item.quantity || 0) >= Number(item.stock || 0));

                  return (
                    <article
                      key={item.productId}
                      className="cart-item cart-item-card"
                      data-cy="cart-item"
                      data-product-id={item.productId}
                    >
                      <div className="cart-item-media">
                        <img src={item.imageUrl} alt={item.name} />
                      </div>

                      <div className="cart-info">
                        <span className={inStock ? "cart-stock-pill" : "cart-stock-pill out"}>
                          {inStock ? "In Stock" : "Out of Stock"}
                        </span>
                        <h2>{item.name}</h2>
                        <p className="cart-category-trail">
                          <span>{item.category}</span>
                          {item.subcategory && (
                            <>
                              <em aria-hidden="true">&gt;</em>
                              <span>{item.subcategory}</span>
                            </>
                          )}
                        </p>

                        <div className="cart-spec-grid">
                          {getItemSpecs(item).map((spec) => (
                            <span className="cart-spec" key={`${item.productId}-${spec.icon}-${spec.label}`}>
                              <CartIcon name={spec.icon} />
                              {spec.label}
                            </span>
                          ))}
                        </div>

                        <p className="cart-detail-line">
                          <CartIcon name="shield" />
                          <span>1 Year Warranty</span>
                        </p>
                        <p className="cart-detail-line">
                          <CartIcon name={item.type === "service" ? "cloud" : "truck"} />
                          <span>{deliveryCopy}</span>
                        </p>
                      </div>

                      <div className="cart-actions">
                        <strong className="cart-line-price">
                          {formatMoney(item.subtotal ?? item.price * item.quantity)}
                        </strong>

                        <div className="cart-quantity-control">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.productId, Number(item.quantity) - 1)}
                            disabled={busyId === item.productId || Number(item.quantity) <= 1}
                            aria-label={`Decrease ${item.name} quantity`}
                            title="Decrease quantity"
                          >
                            -
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            min="1"
                            max={item.type === "service" ? undefined : item.stock}
                            value={item.quantity}
                            onChange={(event) =>
                              onUpdateQty(item.productId, event.target.value)
                            }
                            disabled={busyId === item.productId}
                            aria-label={`${item.name} quantity`}
                            data-cy="cart-item-quantity-input"
                          />
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.productId, Number(item.quantity) + 1)}
                            disabled={isPlusDisabled}
                            aria-label={`Increase ${item.name} quantity`}
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="cart-remove-btn"
                          onClick={() => onRemove(item.productId)}
                          disabled={busyId === item.productId}
                          aria-label={`Remove ${item.name}`}
                          title="Remove item"
                        >
                          <CartIcon name="trash" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <aside className="checkout-panel cart-summary-panel">
              <div className="cart-summary-heading">
                <h2>Order Summary</h2>
                <span>
                  <CartIcon name="clipboard" />
                </span>
              </div>

              <div className="cart-summary-lines">
                <p className="summary-line">
                  <span>Subtotal ({totals.itemCount} {totals.itemCount === 1 ? "item" : "items"})</span>
                  <strong>{formatMoney(totals.subtotal)}</strong>
                </p>
                <p className="summary-line">
                  <span>Tax (15%)</span>
                  <strong>{formatMoney(totals.tax)}</strong>
                </p>
                <p className="summary-line">
                  <span>Delivery</span>
                  <strong className={totals.deliveryFee === 0 ? "cart-free-delivery" : ""}>
                    {totals.deliveryFee === 0 ? "FREE" : formatMoney(totals.deliveryFee)}
                  </strong>
                </p>
              </div>

              <p className="summary-line total-row">
                <span>Grand Total</span>
                <strong>{formatMoney(totals.grandTotal)}</strong>
              </p>

              <Link className="cart-checkout-btn" to="/checkout" data-cy="proceed-to-checkout-button">
                <CartIcon name="lock" />
                Proceed to Checkout
                <CartIcon name="arrow" />
              </Link>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

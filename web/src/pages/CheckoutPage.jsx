import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import Breadcrumbs from "../components/Breadcrumbs";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatMoney } from "../utils/currency";
import {
  INVALID_NUMERIC_INPUT_MESSAGE,
  getNumericInputError
} from "../utils/numericValidation";

const CHECKOUT_FLOW = [
  { label: "Cart", copy: "Cart", icon: "cart" },
  { label: "Delivery", copy: "Delivery details", icon: "pin" },
  { label: "Payment", copy: "Payment method", icon: "card" },
  { label: "Confirmation", copy: "Final check", icon: "check" }
];

const PAYMENT_METHODS = [
  {
    value: "Mpesa",
    label: "Mpesa",
    icon: "/images/payments/mpesa.png",
    helper: "Mobile money"
  },
  {
    value: "Ecocash",
    label: "Ecocash",
    icon: "/images/payments/ecocash.png",
    helper: "Mobile money"
  },
  {
    value: "Debit card",
    label: "Debit Card",
    icon: "/images/payments/debit-card.png",
    helper: "Visa or Mastercard"
  }
];

const DELIVERY_OPTIONS = [
  {
    value: "standard",
    title: "Standard Delivery",
    details: "3 - 5 working days",
    price: "Current rate",
    icon: "truck"
  },
  {
    value: "express",
    title: "Express Delivery",
    details: "1 - 2 working days",
    price: "M80 estimate",
    icon: "bolt"
  },
  {
    value: "digital",
    title: "Digital Delivery",
    details: "For web hosting services",
    price: "Instant activation",
    icon: "cloud"
  }
];

const NUMERIC_FORM_FIELDS = {
  phoneNumber: "phone",
  postalCode: "digits",
  lesothoNumber: "phone",
  cardNumber: "card",
  expiryDate: "expiry",
  cvc: "digits"
};

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

function isValidCardNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return /^\d{13,19}$/.test(digits);
}

function isValidCvc(value) {
  return /^\d{3,4}$/.test(String(value || "").trim());
}

function maskCardNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? `**** ${digits.slice(-4)}` : "";
}

function CheckoutIcon({ name }) {
  const paths = {
    cart: (
      <>
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L21 8H7" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12z" />
        <circle cx="12" cy="9" r="2.2" />
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
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
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
    bolt: <path d="M13 2 5 14h6l-1 8 8-12h-6z" />,
    cloud: (
      <>
        <path d="M17.5 17H8a5 5 0 0 1-.8-9.9A6 6 0 0 1 18.6 9.5 3.8 3.8 0 0 1 17.5 17z" />
        <path d="M12 11v7" />
        <path d="m9 15 3 3 3-3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5.5c0 4.2 2.9 8 7 9.5 4.1-1.5 7-5.3 7-9.5V6z" />
        <path d="m9 12 2 2 4-5" />
      </>
    )
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="checkout-icon">
      {paths[name]}
    </svg>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, getErrorMessage } = useCart();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    fullName: user?.name || "",
    emailAddress: user?.email || "",
    phoneNumber: "",
    deliveryAddress: "",
    city: "",
    postalCode: "",
    saveAddress: true,
    deliveryMethod: "standard",
    paymentMethod: "Mpesa",
    lesothoNumber: "",
    cardholderName: user?.name || "",
    cardNumber: "",
    expiryDate: "",
    cvc: ""
  });

  const previewTotals = useMemo(() => {
    const subtotal = Number(cart.summary?.subtotal ?? cart.total ?? 0);
    const tax = Number(cart.summary?.tax ?? (subtotal * 0.15).toFixed(2));
    const deliveryFee = Number(cart.summary?.deliveryFee ?? 0);
    const grandTotal = Number(
      cart.summary?.grandTotal ?? Math.max(0, subtotal + tax + deliveryFee).toFixed(2)
    );
    return { subtotal, tax, deliveryFee, grandTotal };
  }, [cart.total, cart.summary]);

  if (!cart.items.length) {
    return (
      <section className="checkout-neon checkout-empty">
        <h1>No items for checkout</h1>
        <p>Add products to your cart before starting checkout.</p>
      </section>
    );
  }

  const selectedPayment = PAYMENT_METHODS.find((method) => method.value === form.paymentMethod);
  const paymentIsMobileMoney = isMobileMoney(form.paymentMethod);
  const selectedDelivery =
    DELIVERY_OPTIONS.find((option) => option.value === form.deliveryMethod) || DELIVERY_OPTIONS[0];
  const progressIndex = step === 0 ? 1 : 3;

  const updateForm = (field, value) => {
    const numericMode = NUMERIC_FORM_FIELDS[field];
    if (numericMode) {
      const inputError = getNumericInputError(value, numericMode);
      if (inputError) {
        setFieldErrors((current) => ({ ...current, [field]: inputError }));
        return;
      }
      setFieldErrors((current) => {
        const nextErrors = { ...current };
        delete nextErrors[field];
        return nextErrors;
      });
    }

    setForm((current) => ({ ...current, [field]: value }));
  };

  const selectPaymentMethod = (method) => {
    setError("");
    setFieldErrors({});
    setForm((current) => ({ ...current, paymentMethod: method }));
  };

  const validatePayment = () => {
    const mobileMoneyNumber = form.lesothoNumber || form.phoneNumber;
    const nextFieldErrors = {};

    const phoneInputError = getNumericInputError(form.phoneNumber, "phone");
    if (phoneInputError) {
      nextFieldErrors.phoneNumber = phoneInputError;
    }

    const postalInputError = getNumericInputError(form.postalCode, "digits");
    if (postalInputError) {
      nextFieldErrors.postalCode = postalInputError;
    }

    if (paymentIsMobileMoney) {
      const mobileMoneyInputError = getNumericInputError(mobileMoneyNumber, "phone");
      if (mobileMoneyInputError) {
        nextFieldErrors[form.lesothoNumber ? "lesothoNumber" : "phoneNumber"] = mobileMoneyInputError;
      }

      if (!isValidLesothoNumber(mobileMoneyNumber)) {
        setFieldErrors(nextFieldErrors);
        return "Enter a valid Lesotho mobile number, for example +266 5xxx xxxx.";
      }
    }

    if (form.paymentMethod === "Debit card") {
      const cardInputError = getNumericInputError(form.cardNumber, "card");
      if (cardInputError) {
        nextFieldErrors.cardNumber = cardInputError;
      }

      const expiryInputError = getNumericInputError(form.expiryDate, "expiry");
      if (expiryInputError) {
        nextFieldErrors.expiryDate = expiryInputError;
      }

      const cvcInputError = getNumericInputError(form.cvc, "digits");
      if (cvcInputError) {
        nextFieldErrors.cvc = cvcInputError;
      }

      if (!isValidCardNumber(form.cardNumber)) {
        setFieldErrors(nextFieldErrors);
        return "Enter a valid debit card number.";
      }
      if (!isValidCvc(form.cvc)) {
        setFieldErrors(nextFieldErrors);
        return "Enter a valid CVC.";
      }
    }

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length) {
      return INVALID_NUMERIC_INPUT_MESSAGE;
    }

    return "";
  };

  const getShippingAddress = () => {
    const address = [form.deliveryAddress, form.city, form.postalCode]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(", ");
    const contact = [form.fullName, form.emailAddress, form.phoneNumber]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(" | ");

    return [
      address || "Not required",
      contact ? `Contact: ${contact}` : "",
      `Delivery: ${selectedDelivery.title}`
    ]
      .filter(Boolean)
      .join(" | ");
  };

  const getPaymentDetails = () => {
    if (paymentIsMobileMoney) {
      return {
        lesothoNumber: getLesothoDigits(form.lesothoNumber || form.phoneNumber),
        amount: previewTotals.grandTotal
      };
    }

    return {
      cardNumber: String(form.cardNumber || "").replace(/\D/g, ""),
      cvc: String(form.cvc || "").trim()
    };
  };

  const nextStep = () => {
    const validationError = validatePayment();
    if (validationError) {
      if (validationError !== INVALID_NUMERIC_INPUT_MESSAGE) {
        setError(validationError);
      }
      return;
    }

    setError("");
    setStep((current) => Math.min(1, current + 1));
  };
  const previousStep = () => setStep((current) => Math.max(0, current - 1));

  const placeOrder = async () => {
    const validationError = validatePayment();
    if (validationError) {
      if (validationError !== INVALID_NUMERIC_INPUT_MESSAGE) {
        setError(validationError);
      }
      setStep(0);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/checkout", {
        shippingAddress: getShippingAddress(),
        paymentMethod: form.paymentMethod,
        paymentDetails: getPaymentDetails()
      });
      navigate(`/checkout/success/${data.order.id}`, { state: { order: data.order } });
    } catch (checkoutError) {
      setError(getErrorMessage(checkoutError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="checkout-neon" data-cy="checkout-page">
      <div className="checkout-shell">
        <div className="checkout-navline">
          <button
            type="button"
            className="checkout-back"
            onClick={() => navigate("/cart")}
            aria-label="Back to cart"
            title="Back to cart"
          >
            <span aria-hidden="true">&larr;</span>
          </button>
          <Breadcrumbs
            items={[
              { label: "Home", to: "/" },
              { label: "Cart", to: "/cart" },
              { label: "Checkout" }
            ]}
          />
        </div>

        <section className="checkout-glass">
          <div className="checkout-flow" aria-label="Checkout progress">
            {CHECKOUT_FLOW.map((item, index) => {
              const className =
                index < progressIndex
                  ? "checkout-flow-step complete"
                  : index === progressIndex
                    ? "checkout-flow-step active"
                    : "checkout-flow-step";

              return (
                <div className={className} key={item.label}>
                  <span className="checkout-flow-node">
                    <CheckoutIcon name={item.icon} />
                  </span>
                  <strong>
                    {index + 1}. {item.label}
                  </strong>
                  <small>{item.copy}</small>
                </div>
              );
            })}
          </div>

          {error && <p className="checkout-error">{error}</p>}

          <div className="checkout-grid">
            <section className="checkout-stage">
              {step === 0 && (
                <div className="checkout-form">
                  <section className="checkout-card-section">
                    <div className="checkout-section-heading">
                      <span className="checkout-section-icon">
                        <CheckoutIcon name="user" />
                      </span>
                      <div>
                        <h2>Customer Details</h2>
                        <p>Enter your details for delivery</p>
                      </div>
                    </div>

                    <div className="checkout-customer-grid">
                      <label>
                        <span>Full Name</span>
                        <input
                          type="text"
                          value={form.fullName}
                          onChange={(event) => updateForm("fullName", event.target.value)}
                          placeholder="Teboho Mokone"
                          autoComplete="name"
                        />
                      </label>
                      <label>
                        <span>Email Address</span>
                        <input
                          type="email"
                          value={form.emailAddress}
                          onChange={(event) => updateForm("emailAddress", event.target.value)}
                          placeholder="teboho.mokone@example.com"
                          autoComplete="email"
                        />
                      </label>
                      <label>
                        <span>Phone Number</span>
                        <input
                          type="tel"
                          inputMode="tel"
                          value={form.phoneNumber}
                          onChange={(event) => updateForm("phoneNumber", event.target.value)}
                          placeholder="+266 5800 0000"
                          autoComplete="tel"
                        />
                        {fieldErrors.phoneNumber && <small className="checkout-field-error">{fieldErrors.phoneNumber}</small>}
                      </label>
                      <label className="checkout-address-field">
                        <span>Delivery Address</span>
                        <input
                          type="text"
                          value={form.deliveryAddress}
                          onChange={(event) => updateForm("deliveryAddress", event.target.value)}
                          placeholder="123 Unit 5, Block A, Maseru West"
                          autoComplete="street-address"
                        />
                      </label>
                      <label>
                        <span>City / District</span>
                        <input
                          type="text"
                          value={form.city}
                          onChange={(event) => updateForm("city", event.target.value)}
                          placeholder="Maseru"
                          autoComplete="address-level2"
                        />
                      </label>
                      <label>
                        <span>Postal Code</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={form.postalCode}
                          onChange={(event) => updateForm("postalCode", event.target.value)}
                          placeholder="100"
                          autoComplete="postal-code"
                        />
                        {fieldErrors.postalCode && <small className="checkout-field-error">{fieldErrors.postalCode}</small>}
                      </label>
                    </div>

                    <label className="checkout-save-address">
                      <input
                        type="checkbox"
                        checked={form.saveAddress}
                        onChange={(event) => updateForm("saveAddress", event.target.checked)}
                      />
                      <span>Save this address for future use</span>
                    </label>
                  </section>

                  <section className="checkout-card-section">
                    <div className="checkout-section-heading">
                      <span className="checkout-section-icon">
                        <CheckoutIcon name="truck" />
                      </span>
                      <div>
                        <h2>Delivery Method</h2>
                        <p>Choose how you want your order delivered</p>
                      </div>
                    </div>

                    <div className="delivery-method-grid">
                      {DELIVERY_OPTIONS.map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          className={
                            form.deliveryMethod === option.value
                              ? "delivery-method-card active"
                              : "delivery-method-card"
                          }
                          onClick={() => updateForm("deliveryMethod", option.value)}
                        >
                          <span className="delivery-method-icon">
                            <CheckoutIcon name={option.icon} />
                          </span>
                          <span className="delivery-method-copy">
                            <strong>{option.title}</strong>
                            <small>{option.details}</small>
                            <em>
                              {option.value === "standard"
                                ? previewTotals.deliveryFee > 0
                                  ? formatMoney(previewTotals.deliveryFee)
                                  : "Free"
                                : option.price}
                            </em>
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="checkout-card-section">
                    <div className="checkout-section-heading">
                      <span className="checkout-section-icon">
                        <CheckoutIcon name="card" />
                      </span>
                      <div>
                        <h2>Payment Method</h2>
                        <p>Select your preferred payment method</p>
                      </div>
                    </div>

                    <div className="payment-layout">
                      <div className="payment-method-list" data-cy="checkout-payment-method">
                        {PAYMENT_METHODS.map((method) => (
                          <button
                            type="button"
                            key={method.value}
                            className={
                              form.paymentMethod === method.value
                                ? "payment-method-card active"
                                : "payment-method-card"
                            }
                            onClick={() => selectPaymentMethod(method.value)}
                          >
                            <span className="payment-method-logo">
                              <img src={method.icon} alt="" />
                            </span>
                            <span>
                              <strong>{method.label}</strong>
                              <small>{method.helper}</small>
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="payment-detail-panel">
                        {paymentIsMobileMoney && (
                          <div className="checkout-field-grid">
                            <label>
                              <span>Lesotho Number</span>
                              <input
                                type="tel"
                                inputMode="tel"
                                value={form.lesothoNumber}
                                onChange={(event) => updateForm("lesothoNumber", event.target.value)}
                                placeholder="+266 5xxx xxxx"
                                autoComplete="tel"
                                data-cy="checkout-lesotho-number"
                              />
                              {fieldErrors.lesothoNumber && (
                                <small className="checkout-field-error">{fieldErrors.lesothoNumber}</small>
                              )}
                            </label>
                            <div className="checkout-payment-total" data-cy="checkout-payment-total">
                              <span>Amount</span>
                              <strong>{formatMoney(previewTotals.grandTotal)}</strong>
                            </div>
                            <p className="checkout-simulated-note">
                              <CheckoutIcon name="shield" />
                              This is a simulated payment for testing purposes.
                            </p>
                          </div>
                        )}

                        {form.paymentMethod === "Debit card" && (
                          <div className="checkout-field-grid checkout-card-fields">
                            <label>
                              <span>Account Name</span>
                              <input
                                type="text"
                                value={form.cardholderName}
                                onChange={(event) => updateForm("cardholderName", event.target.value)}
                                placeholder="Teboho Mokone"
                                name="simulated-account-name"
                                autoComplete="new-password"
                                data-form-type="other"
                              />
                            </label>
                            <label>
                              <span>Payment Reference</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={form.cardNumber}
                                onChange={(event) => updateForm("cardNumber", event.target.value)}
                                placeholder="0000 0000 0000 0000"
                                name="simulated-payment-reference"
                                autoComplete="new-password"
                                data-form-type="other"
                                data-cy="checkout-card-number"
                              />
                              {fieldErrors.cardNumber && (
                                <small className="checkout-field-error">{fieldErrors.cardNumber}</small>
                              )}
                            </label>
                            <label>
                              <span>Reference Date</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={form.expiryDate}
                                onChange={(event) => updateForm("expiryDate", event.target.value)}
                                placeholder="MM/YY"
                                name="simulated-reference-date"
                                autoComplete="new-password"
                                data-form-type="other"
                              />
                              {fieldErrors.expiryDate && (
                                <small className="checkout-field-error">{fieldErrors.expiryDate}</small>
                              )}
                            </label>
                            <label>
                              <span>Security Code</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength="4"
                                value={form.cvc}
                                onChange={(event) => updateForm("cvc", event.target.value)}
                                placeholder="000"
                                name="simulated-security-code"
                                autoComplete="new-password"
                                data-form-type="other"
                                data-cy="checkout-card-cvc"
                              />
                              {fieldErrors.cvc && <small className="checkout-field-error">{fieldErrors.cvc}</small>}
                            </label>
                            <p className="checkout-simulated-note">
                              <CheckoutIcon name="shield" />
                              This is a simulated payment for testing purposes. No real money will be charged.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {step === 1 && (
                <div className="checkout-review">
                  <h2>Order Review</h2>
                  <div className="checkout-payment-review">
                    {selectedPayment ? <img src={selectedPayment.icon} alt="" /> : null}
                    <span>{selectedPayment?.label || form.paymentMethod}</span>
                    {paymentIsMobileMoney ? (
                      <small>
                        +266 {getLesothoDigits(form.lesothoNumber || form.phoneNumber)} -{" "}
                        {formatMoney(previewTotals.grandTotal)}
                      </small>
                    ) : (
                      <small>{maskCardNumber(form.cardNumber)}</small>
                    )}
                  </div>
                  <div className="checkout-delivery-review">
                    <strong>{selectedDelivery.title}</strong>
                    <span>{getShippingAddress()}</span>
                  </div>
                  <ul className="checkout-items">
                    {cart.items.map((item) => (
                      <li key={item.productId}>
                        <span>
                          {item.name} <small>x {item.quantity}</small>
                        </span>
                        <strong>{formatMoney(item.subtotal)}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="checkout-actions">
                {step > 0 && (
                  <button
                    type="button"
                    className="checkout-secondary"
                    onClick={previousStep}
                    data-cy="checkout-back-button"
                  >
                    Back
                  </button>
                )}
                {step < 1 && (
                  <button
                    type="button"
                    className="checkout-primary"
                    onClick={nextStep}
                    data-cy="checkout-continue-button"
                  >
                    Continue
                  </button>
                )}
                {step === 1 && (
                  <button
                    type="button"
                    className="checkout-primary"
                    onClick={placeOrder}
                    disabled={busy}
                    data-cy="checkout-place-order-button"
                  >
                    {busy ? "Processing..." : "Place Order"}
                  </button>
                )}
              </div>
            </section>

            <aside className="checkout-summary">
              <h2>Order Summary</h2>
              <div className="review-totals">
                <p className="summary-line">
                  <span>Subtotal</span>
                  <strong>{formatMoney(previewTotals.subtotal)}</strong>
                </p>
                <p className="summary-line">
                  <span>Tax</span>
                  <strong>{formatMoney(previewTotals.tax)}</strong>
                </p>
                <p className="summary-line">
                  <span>Delivery</span>
                  <strong>{formatMoney(previewTotals.deliveryFee)}</strong>
                </p>
                <p className="summary-line total-row">
                  <span>Grand Total</span>
                  <strong>{formatMoney(previewTotals.grandTotal)}</strong>
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </section>
  );
}

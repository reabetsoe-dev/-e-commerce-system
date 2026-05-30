import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import Breadcrumbs from "../components/Breadcrumbs";
import { formatMoney } from "../utils/currency";

function SuccessIcon({ name }) {
  const paths = {
    arrow: <path d="M15 18 9 12l6-6" />,
    check: <path d="m7.8 12.3 2.8 2.8 5.7-6.2" />,
    receipt: (
      <>
        <path d="M7 3h10v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2V3z" />
        <path d="M9.5 8h5" />
        <path d="M9.5 12h5" />
      </>
    ),
    hash: (
      <>
        <path d="M10 4 8 20" />
        <path d="M16 4l-2 16" />
        <path d="M4 9h16" />
        <path d="M3 15h16" />
      </>
    ),
    bag: (
      <>
        <path d="M6 8h12l-1 12H7L6 8z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
      </>
    ),
    card: (
      <>
        <rect x="3.5" y="6" width="17" height="12" rx="2" />
        <path d="M3.5 10h17" />
        <path d="M7.5 14.5h4" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3.5 5.5 6.2v5.2c0 4 2.6 7.4 6.5 9.1 3.9-1.7 6.5-5.1 6.5-9.1V6.2L12 3.5z" />
        <path d="m9.2 12 1.9 1.9 3.9-4.2" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M5 15V7a2 2 0 0 1 2-2h8" />
      </>
    ),
    file: (
      <>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h4" />
        <path d="M9.5 13h5" />
        <path d="M9.5 16h5" />
      </>
    ),
    cart: (
      <>
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
        <path d="M3.5 4.5h2l2.1 10.1a2 2 0 0 0 2 1.6H17a2 2 0 0 0 1.9-1.4L21 8H7" />
      </>
    )
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="success-icon">
      {paths[name]}
    </svg>
  );
}

function SummaryRow({ icon, label, value, copyValue, copied, onCopy }) {
  return (
    <div className="success-summary-row">
      <span className="success-row-icon">
        <SuccessIcon name={icon} />
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      {copyValue ? (
        <button type="button" className="success-copy" onClick={() => onCopy(copyValue)} aria-label={`Copy ${label}`}>
          <SuccessIcon name="copy" />
          {copied === copyValue ? <span>Copied</span> : null}
        </button>
      ) : (
        <span className="success-copy-placeholder" aria-hidden="true" />
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(location.state?.order || null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (order || !orderId) {
      return;
    }

    async function fetchOrder() {
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        setOrder(data.order);
      } catch (fetchError) {
        setOrder(null);
      }
    }

    fetchOrder();
  }, [order, orderId]);

  const displayOrderId = order?.id || orderId || "Generated";
  const orderNumber = order?.orderNumber || "Generated";
  const amountPaid = formatMoney(order?.total || 0);
  const transactionRef = order?.payment?.transactionRef || "N/A";
  const detailsPath = `/orders/${displayOrderId}`;

  async function copyValue(value) {
    if (!value || value === "N/A" || value === "Generated") {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      window.setTimeout(() => setCopied(""), 1400);
    } catch (copyError) {
      setCopied("");
    }
  }

  return (
    <section className="checkout-success-screen" data-cy="checkout-success-page">
      <div className="checkout-success-shell">
        <div className="checkout-navline">
          <button type="button" className="checkout-back" onClick={() => navigate("/checkout")} aria-label="Back">
            <SuccessIcon name="arrow" />
          </button>
          <Breadcrumbs
            items={[
              { label: "Home", to: "/" },
              { label: "Checkout", to: "/checkout" },
              { label: "Success" }
            ]}
          />
        </div>

        <header className="success-hero">
          <span className="success-spark" aria-hidden="true" />
          <div className="success-check">
            <SuccessIcon name="check" />
          </div>
          <div>
            <h1>Order Successful</h1>
            <p>
              Your order has been placed successfully. Tracking updates are now available in your{" "}
              <Link to="/orders">orders dashboard</Link>.
            </p>
          </div>
        </header>

        <div className="success-card" data-cy="checkout-success-invoice">
          <div className="success-card-title">
            <span>
              <SuccessIcon name="receipt" />
            </span>
            <h2>Order Summary</h2>
          </div>

          <div className="success-summary-list">
            <SummaryRow
              icon="hash"
              label="Order ID"
              value={displayOrderId}
              copyValue={displayOrderId}
              copied={copied}
              onCopy={copyValue}
            />
            <SummaryRow
              icon="bag"
              label="Order Number"
              value={orderNumber}
              copyValue={orderNumber}
              copied={copied}
              onCopy={copyValue}
            />
            <SummaryRow icon="card" label="Amount Paid" value={amountPaid} copied={copied} onCopy={copyValue} />
            <SummaryRow
              icon="shield"
              label="Transaction Ref"
              value={transactionRef}
              copyValue={transactionRef}
              copied={copied}
              onCopy={copyValue}
            />
          </div>

          <div className="success-actions">
            <Link className="success-button success-button-primary" to={detailsPath} data-cy="view-order-details-button">
              <SuccessIcon name="file" />
              <span>View Order Details</span>
            </Link>
            <Link className="success-button success-button-secondary" to="/catalog">
              <SuccessIcon name="cart" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

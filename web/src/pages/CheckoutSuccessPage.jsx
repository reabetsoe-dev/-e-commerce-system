import { Link, useLocation, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { formatMoney } from "../utils/currency";

export default function CheckoutSuccessPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const order = location.state?.order;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: "Checkout", to: "/checkout" },
          { label: "Success" }
        ]}
        title="Payment Successful"
        subtitle="Your order has been placed successfully. Tracking updates are now available in your orders dashboard."
        fallback="/orders"
      />
      <section className="panel success-panel" data-cy="checkout-success-page">
        <div className="invoice-card" data-cy="checkout-success-invoice">
          <p>
            <strong>Order ID:</strong> {order?.id || orderId}
          </p>
          <p>
            <strong>Order Number:</strong> {order?.orderNumber || "Generated"}
          </p>
          <p>
            <strong>Amount Paid:</strong> {formatMoney(order?.total || 0)}
          </p>
          <p>
            <strong>Transaction Ref:</strong> {order?.payment?.transactionRef || "N/A"}
          </p>
        </div>
        <div className="hero-cta-row">
          <Link
            className="btn btn-primary"
            to={`/orders/${order?.id || orderId}`}
            data-cy="view-order-details-button"
          >
            View Order Details
          </Link>
          <Link className="btn btn-light" to="/catalog">
            Continue Shopping
          </Link>
        </div>
      </section>
    </>
  );
}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";
import PageHeader from "../components/PageHeader";
import { formatMoney } from "../utils/currency";

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      setError("");
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data.order);
      } catch (fetchError) {
        setError(fetchError?.response?.data?.message || "Failed to load order details.");
      }
    }
    fetchOrder();
  }, [id]);

  if (error) {
    return (
      <>
        <PageHeader
          breadcrumbs={[{ label: "Home", to: "/" }, { label: "Orders", to: "/orders" }, { label: "Order" }]}
          title="Order Details"
          subtitle="Review invoice, payment, delivery, and status timeline information."
          fallback="/orders"
        />
        <section className="panel">
          <p className="error notice">{error}</p>
        </section>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <PageHeader
          breadcrumbs={[{ label: "Home", to: "/" }, { label: "Orders", to: "/orders" }, { label: "Order" }]}
          title="Order Details"
          subtitle="Review invoice, payment, delivery, and status timeline information."
          fallback="/orders"
        />
        <section className="panel">Loading order details...</section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: "Orders", to: "/orders" },
          { label: order.orderNumber || `Order ${order.id.slice(0, 8)}` }
        ]}
        title={order.orderNumber || `Order #${order.id.slice(0, 8)}`}
        subtitle={`Placed on ${formatDate(order.createdAt)}`}
        fallback="/orders"
      />

      <section className="panel" data-cy="order-details-status-panel">
        <span className="status-chip" data-cy="order-details-status">
          {order.status}
        </span>
      </section>

      <section className="panel invoice-layout">
        <article>
          <h2>Invoice Summary</h2>
          <p className="summary-line">
            <span>Subtotal</span>
            <strong>{formatMoney(order.totals?.subtotal || order.total)}</strong>
          </p>
          <p className="summary-line">
            <span>Tax</span>
            <strong>{formatMoney(order.totals?.tax || 0)}</strong>
          </p>
          <p className="summary-line">
            <span>Delivery</span>
            <strong>{formatMoney(order.totals?.deliveryFee || 0)}</strong>
          </p>
          <p className="summary-line">
            <span>Discount</span>
            <strong>-{formatMoney(order.totals?.discountAmount || 0)}</strong>
          </p>
          <p className="summary-line total-row">
            <span>Grand Total</span>
            <strong>{formatMoney(order.total)}</strong>
          </p>
        </article>
        <article>
          <h2>Payment & Delivery</h2>
          <p>
            <strong>Payment Method:</strong> {order.payment.method}
          </p>
          <p>
            <strong>Transaction Ref:</strong> {order.payment.transactionRef}
          </p>
          <p>
            <strong>Shipping Address:</strong> {order.shippingAddress}
          </p>
          <p>
            <strong>Billing Address:</strong> {order.billingAddress || "Not provided"}
          </p>
        </article>
      </section>

      <section className="panel">
        <h2>Order Items</h2>
        <ul className="order-items">
          {order.items.map((item) => (
            <li key={item.productId}>
              {item.name} x {item.quantity} = {formatMoney(item.subtotal)}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" data-cy="order-status-timeline">
        <h2>Status Timeline</h2>
        <ul className="status-timeline">
          {order.statusHistory.map((entry, index) => (
            <li key={`${entry.timestamp}-${index}`} data-cy="order-timeline-item">
              <span>{formatDate(entry.timestamp)}</span>
              <strong>{entry.status}</strong>
              <p>{entry.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

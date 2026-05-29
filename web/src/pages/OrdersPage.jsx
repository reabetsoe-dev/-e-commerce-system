import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import PageHeader from "../components/PageHeader";
import { formatMoney } from "../utils/currency";

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/orders");
        setOrders(data.orders || []);
      } catch (fetchError) {
        setError(fetchError?.response?.data?.message || "Failed to load orders.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (loading) {
    return <section className="panel">Loading your orders...</section>;
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Orders" }]}
        title="Order Tracking"
        subtitle="Track each order from payment to delivery."
        fallback="/catalog"
      >
        {error && <p className="error notice">{error}</p>}
      </PageHeader>

      {orders.length === 0 && (
        <section className="panel empty-state" data-cy="orders-empty-state">
          <h2>No orders yet</h2>
          <p className="muted">Complete checkout to create and track your first order.</p>
        </section>
      )}

      <div className="order-list" data-cy="orders-list">
        {orders.map((order) => (
          <article key={order.id} className="order-card" data-cy="order-card" data-order-id={order.id}>
            <div className="order-head">
              <h3>{order.orderNumber || `Order #${order.id.slice(0, 8)}`}</h3>
              <span className="status-chip" data-cy="order-status">
                {order.status}
              </span>
            </div>
            <div className="order-meta-grid">
              <p>
                <strong>Total:</strong> {formatMoney(order.total)}
              </p>
              <p>
                <strong>Placed:</strong> {formatDate(order.createdAt)}
              </p>
              <p>
                <strong>Payment:</strong> {order.payment.method}
              </p>
              <p>
                <strong>Address:</strong> {order.shippingAddress}
              </p>
            </div>
            <Link className="btn btn-light" to={`/orders/${order.id}`} data-cy="view-order-button">
              View Full Details
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}

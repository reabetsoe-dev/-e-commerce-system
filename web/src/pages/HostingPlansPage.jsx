import { useEffect, useState } from "react";
import MessageDialog from "../components/MessageDialog";
import PageHeader from "../components/PageHeader";
import api from "../api/client";
import { useCart } from "../context/CartContext";
import { formatMoney } from "../utils/currency";

export default function HostingPlansPage() {
  const { addToCart, getErrorMessage } = useCart();
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await api.get("/products/hosting-plans");
        setPlans(response.data.plans || []);
      } catch (fetchError) {
        setError("Failed to load hosting plans.");
      }
    }
    fetchPlans();
  }, []);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Hosting Plans" }]}
        eyebrow="Web Hosting Services"
        title="Shared, VPS, and Business Hosting Packages"
        subtitle="Compare resources, reliability, and pricing. Add hosting plans directly to your cart and checkout alongside hardware and software products."
        fallback="/catalog"
      />
      {status && <p className="hint notice">{status}</p>}
      {error && <p className="error notice">{error}</p>}
      <section className="hosting-grid">
        {plans.map((plan) => (
          <article key={plan.id} className="panel hosting-card">
            <span className="tag">{plan.subcategory}</span>
            <h2>{plan.name}</h2>
            <p className="muted">{plan.description}</p>
            <p className="price-row large">
              {plan.discountPercent > 0 && <span className="old-price">{formatMoney(plan.price)}</span>}
              <strong>
                {formatMoney(
                  Number((plan.price * (1 - Number(plan.discountPercent || 0) / 100)).toFixed(2))
                )}
              </strong>
              <em>/ month</em>
            </p>
            <ul className="order-items">
              {(plan.specifications || []).map((spec) => (
                <li key={`${plan.id}-${spec.label}`}>
                  {spec.label}: {spec.value}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                try {
                  await addToCart(plan.id, 1);
                  setDialogMessage("Product added to cart.");
                } catch (actionError) {
                  setStatus(getErrorMessage(actionError));
                }
              }}
            >
              Buy Plan
            </button>
          </article>
        ))}
      </section>
      <MessageDialog message={dialogMessage} onClose={() => setDialogMessage("")} />
    </>
  );
}

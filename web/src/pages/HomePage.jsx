import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const TRUST_ITEMS = [
  { title: "Secure Payments", text: "100% secure checkout" },
  { title: "Fast Delivery", text: "Across Lesotho" },
  { title: "Quality Products", text: "Genuine and reliable" },
  { title: "24/7 Support", text: "We're here to help" }
];

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="market-home">
      <div className="market-home-grid">
        <main className="home-showcase">
          <section className="home-combined-card">
            <header className="home-card-header">
              <Link to="/" className="logo market-logo home-card-logo">
                <span className="logo-mark">D</span>
                <span className="logo-copy">
                  <strong>Datamak Technologies</strong>
                  <small>Shop Smart. Build Fast. Host Secure.</small>
                </span>
              </Link>

              <div className="home-card-actions">
                {!user && <Link to="/auth">Login / Register</Link>}
                {user && (
                  <>
                    <Link to="/profile" data-cy="home-user-chip">
                      Hi, {user.name}
                    </Link>
                    <button type="button" onClick={logout}>
                      Logout
                    </button>
                  </>
                )}
              </div>
            </header>

            <section className="home-main-hero">
              <div className="home-hero-copy">
                <h1>
                  Power Your World
                  <br />
                  with Reliable Technology
                </h1>
                <p>Shop the latest computers, ICT products and web hosting solutions.</p>
                <Link to="/catalog">Shop Now</Link>
              </div>
              <img
                className="home-hero-image"
                src="/images/tech-e-comm.jpg"
                alt="Technology e-commerce services"
              />
            </section>
          </section>
        </main>
      </div>

      <section className="home-trust-strip">
        {TRUST_ITEMS.map((item) => (
          <article key={item.title}>
            <span aria-hidden="true">D</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

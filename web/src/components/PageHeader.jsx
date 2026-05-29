import { useNavigate } from "react-router-dom";
import Breadcrumbs from "./Breadcrumbs";

export default function PageHeader({
  breadcrumbs = [],
  title,
  subtitle,
  eyebrow,
  fallback = "/",
  actions = null,
  children = null,
  className = "",
  showBack = true
}) {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallback);
  };

  return (
    <>
      <div className="page-navline">
        {showBack && (
          <button
            type="button"
            className="page-back"
            onClick={goBack}
            aria-label="Go back"
            title="Go back"
          >
            <span aria-hidden="true">&larr;</span>
          </button>
        )}
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <section
        className={`panel page-hero-panel ${actions ? "page-hero-panel-has-actions" : ""} ${className}`.trim()}
      >
        <div className="page-hero-copy">
          {eyebrow && <span className="page-hero-kicker">{eyebrow}</span>}
          {title && <h1>{title}</h1>}
          {subtitle && <p className="muted">{subtitle}</p>}
          {children}
        </div>
        {actions && <div className="page-hero-actions">{actions}</div>}
      </section>
    </>
  );
}

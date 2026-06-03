import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useShop } from "../context/ShopContext";

function HeaderIcon({ name }) {
  const paths = {
    cart: (
      <>
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L21 8H7" />
      </>
    ),
    orders: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
        <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),
    logout: (
      <>
        <path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" />
        <path d="M9 12h11M16 8l4 4-4 4" />
      </>
    ),
    chevron: <path d="m6 9 6 6 6-6" />
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}

export default function NavBar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { wishlistIds } = useShop();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const navClassName = ({ isActive }) => (isActive ? "nav-item nav-item-active" : "nav-item");
  const actionClassName = ({ isActive }) =>
    isActive ? "market-action market-action-active" : "market-action";

  return (
    <header className="topbar market-topbar">
      <div className="container market-header">
        <Link to={isAdmin ? "/admin" : "/"} className="logo market-logo" onClick={() => setOpen(false)}>
          <span className="logo-mark">D</span>
          <span className="logo-copy">
            <strong>Datamak Technologies</strong>
            <small>Shop Smart. Build Fast. Host Secure.</small>
          </span>
        </Link>

        <div className="market-actions">
          {user && !isAdmin && (
            <>
              <NavLink
                to="/cart"
                className={actionClassName}
                onClick={() => setOpen(false)}
                data-cy="nav-cart-link"
              >
                <span className="market-action-icon">
                  <HeaderIcon name="cart" />
                  {cartCount > 0 && <em>{cartCount}</em>}
                </span>
                <span className="market-action-label">Cart</span>
              </NavLink>
              <NavLink
                to="/orders"
                className={actionClassName}
                onClick={() => setOpen(false)}
                data-cy="nav-orders-link"
              >
                <span className="market-action-icon">
                  <HeaderIcon name="orders" />
                </span>
                <span className="market-action-label">Orders</span>
              </NavLink>
            </>
          )}

          <div className="auth">
            {!user && (
              <Link to="/auth" data-cy="nav-auth-link">
                Login / Register
              </Link>
            )}
            {user && (
              <>
                {isAdmin ? (
                  <span className="user-chip" data-cy="nav-user-chip">
                    <span className="market-user-avatar">
                      <HeaderIcon name="user" />
                    </span>
                    <span className="market-user-name">Hi, {user.name}</span>
                    <span className="market-user-chevron">
                      <HeaderIcon name="chevron" />
                    </span>
                  </span>
                ) : (
                  <Link to="/profile" className="user-chip" data-cy="nav-user-chip">
                    <span className="market-user-avatar">
                      <HeaderIcon name="user" />
                    </span>
                    <span className="market-user-name">Hi, {user.name}</span>
                    <span className="market-user-chevron">
                      <HeaderIcon name="chevron" />
                    </span>
                  </Link>
                )}
                <button
                  type="button"
                  className="btn btn-light market-logout-btn"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  data-cy="nav-logout-button"
                >
                  <HeaderIcon name="logout" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>

        <button type="button" className="menu-btn" onClick={() => setOpen((state) => !state)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <div className="container market-nav">
        <nav className={`links ${open ? "open" : ""}`}>
          <NavLink end to="/" className={navClassName} onClick={() => setOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/catalog" className={navClassName} onClick={() => setOpen(false)}>
            Catalog
          </NavLink>
          <NavLink to="/hosting" className={navClassName} onClick={() => setOpen(false)}>
            Hosting
          </NavLink>
          <NavLink to="/about" className={navClassName} onClick={() => setOpen(false)}>
            About
          </NavLink>
          <NavLink to="/contact" className={navClassName} onClick={() => setOpen(false)}>
            Contact
          </NavLink>
          {user && !isAdmin && (
            <NavLink to="/wishlist" className={navClassName} onClick={() => setOpen(false)}>
              Wishlist ({wishlistIds.length})
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

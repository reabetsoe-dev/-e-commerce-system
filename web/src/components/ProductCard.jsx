import { Link } from "react-router-dom";
import { formatMoney } from "../utils/currency";

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6.5 6.5h14l-1.6 7.1a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.6L5.8 3.8H3.5" />
      <circle cx="9.5" cy="19" r="1.2" />
      <circle cx="17.2" cy="19" r="1.2" />
    </svg>
  );
}

export default function ProductCard({
  product,
  onAddToCart,
  onQuickView,
  onWishlist,
  busy,
  wishlisted
}) {
  const discountedPrice = Number(
    (product.price * (1 - Number(product.discountPercent || 0) / 100)).toFixed(2)
  );
  const isService = product.type === "service";
  const isOutOfStock = !isService && product.stock <= 0;
  const brandOrProvider = product.provider || product.brand;
  const availability = product.availabilityStatus || (isOutOfStock ? "Out of Stock" : "In Stock");

  return (
    <article className="product-card" data-cy="product-card" data-product-id={product.id}>
      <button
        type="button"
        className={`wishlist-btn ${wishlisted ? "active" : ""}`}
        onClick={() => onWishlist(product.id)}
        aria-label="Toggle wishlist"
      >
        &hearts;
      </button>
      <div className="product-image-frame">
        <img src={product.imageUrl} alt={product.name} />
      </div>
      <div className="product-content">
        <h3 data-cy="product-name">{product.name}</h3>
        <div className="product-meta">
          {brandOrProvider && <span>{brandOrProvider}</span>}
          <span>{availability}</span>
        </div>
        <strong className="product-price">{formatMoney(discountedPrice)}</strong>
        <div className="product-savings">
          {product.discountPercent > 0 && (
            <>
              <span className="old-price">{formatMoney(product.price)}</span>
              <span className="discount-pill">{product.discountPercent}% OFF</span>
            </>
          )}
        </div>
        <div className="card-actions">
          <button type="button" onClick={() => onQuickView(product)}>
            Quick View
          </button>
          <Link to={`/products/${product.id}`}>Details</Link>
        </div>
        <button
          type="button"
          className="product-cart-btn"
          disabled={busy || isOutOfStock}
          onClick={() => onAddToCart(product.id)}
          data-cy="add-to-cart-button"
        >
          {!busy && !isOutOfStock && <CartIcon />}
          {busy ? "Adding..." : isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}

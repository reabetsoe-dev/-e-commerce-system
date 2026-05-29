import { formatMoney } from "../utils/currency";
import { applyImageFallback, getImageSource } from "../utils/imageFallbacks";

export default function QuickViewModal({ product, onClose, onAddToCart, busy }) {
  if (!product) {
    return null;
  }

  const discountedPrice = Number(
    (product.price * (1 - Number(product.discountPercent || 0) / 100)).toFixed(2)
  );
  const isService = product.type === "service";
  const isOutOfStock = !isService && product.stock <= 0;
  const brandLabel = isService ? "Provider" : "Brand";
  const brandOrProvider = product.provider || product.brand;
  const availability = product.availabilityStatus || (isService ? "Available" : isOutOfStock ? "Out of Stock" : "In Stock");

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <article className="modal-card">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          x
        </button>
        <div className="modal-layout">
          <img
            src={getImageSource(product.imageUrl, product.category)}
            alt={product.name}
            onError={(event) => applyImageFallback(event, product.category)}
          />
          <div>
            <div className="tag-row">
              <span className="tag">{product.category}</span>
              {product.subcategory && <span className="tag tag-muted">{product.subcategory}</span>}
            </div>
            <h2>{product.name}</h2>
            {brandOrProvider && (
              <p className="muted">
                {brandLabel}: {brandOrProvider}
              </p>
            )}
            <p className="muted">{product.description}</p>
            <p className="price-row">
              {product.discountPercent > 0 && (
                <span className="old-price">{formatMoney(product.price)}</span>
              )}
              <strong>{formatMoney(discountedPrice)}</strong>
            </p>
            <p className="muted">
              Rating: {product.rating} / 5 ({product.reviewsCount} reviews)
            </p>
            <p className={isService ? "muted" : product.stock <= 5 ? "stock-warn" : "muted"}>
              {isService ? availability : `${availability} - Stock: ${product.stock}`}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || isOutOfStock}
              onClick={() => onAddToCart(product.id)}
            >
              {busy ? "Adding..." : isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

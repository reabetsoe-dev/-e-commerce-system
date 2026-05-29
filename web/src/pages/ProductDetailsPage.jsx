import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import MessageDialog from "../components/MessageDialog";
import PageHeader from "../components/PageHeader";
import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";
import { formatMoney } from "../utils/currency";

const SAMPLE_REVIEWERS = ["A. Molefe", "P. Ndlovu", "K. Dlamini", "R. Sithole"];

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, getErrorMessage } = useCart();
  const { wishlistIds, toggleWishlist, markViewed } = useShop();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const discountedPrice = useMemo(() => {
    if (!product) {
      return 0;
    }
    return Number((product.price * (1 - Number(product.discountPercent || 0) / 100)).toFixed(2));
  }, [product]);
  const isService = product?.type === "service";
  const isOutOfStock = product ? !isService && product.stock <= 0 : false;
  const brandLabel = isService ? "Provider" : "Brand";
  const brandOrProvider = product?.provider || product?.brand;
  const availability =
    product?.availabilityStatus || (isService ? "Available" : isOutOfStock ? "Out of Stock" : "In Stock");

  useEffect(() => {
    async function fetchProductDetails() {
      setError("");
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
        setRelated(data.related || []);
        setSelectedImage(data.product?.gallery?.[0] || data.product?.imageUrl || "");
      } catch (fetchError) {
        setError(fetchError?.response?.data?.message || "Failed to load product details.");
      }
    }
    fetchProductDetails();
  }, [id]);

  useEffect(() => {
    if (user && id) {
      markViewed(id);
    }
  }, [user?.id, id]);

  const handleAddToCart = async () => {
    if (!product || isOutOfStock) {
      return;
    }
    if (!user) {
      setStatus("Please login to add products to cart.");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      await addToCart(product.id, 1);
      setDialogMessage("Product added to cart.");
    } catch (actionError) {
      setStatus(getErrorMessage(actionError));
    } finally {
      setBusy(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    if (user && !isOutOfStock) {
      navigate("/checkout");
    }
  };

  const handleWishlist = async () => {
    if (!product) {
      return;
    }
    try {
      await toggleWishlist(product.id);
      setStatus("Wishlist updated.");
    } catch (actionError) {
      setStatus(getErrorMessage(actionError));
    }
  };

  if (error) {
    return (
      <>
        <PageHeader
          breadcrumbs={[{ label: "Home", to: "/" }, { label: "Catalog", to: "/catalog" }, { label: "Product" }]}
          title="Product Details"
          subtitle="Review product information, pricing, and availability."
          fallback="/catalog"
        />
        <section className="panel">
          <p className="error notice">{error}</p>
        </section>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <PageHeader
          breadcrumbs={[{ label: "Home", to: "/" }, { label: "Catalog", to: "/catalog" }, { label: "Product" }]}
          title="Product Details"
          subtitle="Review product information, pricing, and availability."
          fallback="/catalog"
        />
        <section className="panel">Loading product details...</section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: "Catalog", to: "/catalog" },
          { label: product.name }
        ]}
        title={product.name}
        subtitle={`${product.category}${product.subcategory ? ` / ${product.subcategory}` : ""}`}
        fallback="/catalog"
      />
      <section className="panel details-layout">
        <div className="gallery-col">
          <img className="main-image" src={selectedImage || product.imageUrl} alt={product.name} />
          <div className="thumb-row">
            {(product.gallery?.length ? product.gallery : [product.imageUrl]).map((image) => (
              <button
                key={image}
                type="button"
                className={`thumb-btn ${selectedImage === image ? "active" : ""}`}
                onClick={() => setSelectedImage(image)}
              >
                <img src={image} alt={product.name} />
              </button>
            ))}
          </div>
        </div>
        <div className="details-col">
          <div className="tag-row">
            <span className="tag">{product.category}</span>
            {product.subcategory && <span className="tag tag-muted">{product.subcategory}</span>}
          </div>
          <h1>{product.name}</h1>
          {brandOrProvider && (
            <p className="muted">
              {brandLabel}: {brandOrProvider}
            </p>
          )}
          <p className="muted">{product.description}</p>
          <p className="rating-line">
            Rating {product.rating} ({product.reviewsCount} reviews)
          </p>
          <p className={!isService && product.stock <= 5 ? "stock-warn" : "muted"}>
            {isService
              ? availability
              : product.stock <= 5
              ? `${availability} (${product.stock} left)`
              : `${availability} (${product.stock})`}
          </p>
          <div className="price-row large">
            {product.discountPercent > 0 && (
              <span className="old-price">{formatMoney(product.price)}</span>
            )}
            <strong>{formatMoney(discountedPrice)}</strong>
            {product.discountPercent > 0 && <em>{product.discountPercent}% OFF</em>}
          </div>
          <div className="action-row">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || isOutOfStock}
              onClick={handleAddToCart}
            >
              {busy ? "Adding..." : isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
            <button
              type="button"
              className="btn btn-light"
              disabled={busy || isOutOfStock}
              onClick={handleBuyNow}
            >
              Buy Now
            </button>
            <button type="button" className="btn btn-light" onClick={handleWishlist}>
              {wishlistIds.includes(product.id) ? "Remove Wishlist" : "Add Wishlist"}
            </button>
          </div>
          {status && <p className="hint notice">{status}</p>}
        </div>
      </section>

      <section className="panel">
        <h2>Specifications</h2>
        {product.specifications?.length ? (
          <div className="spec-grid">
            {product.specifications.map((spec) => (
              <article key={`${spec.label}-${spec.value}`} className="spec-card">
                <span>{spec.label}</span>
                <strong>{spec.value}</strong>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">No specifications provided.</p>
        )}
      </section>

      <section className="panel">
        <h2>Customer Reviews</h2>
        <div className="review-list">
          {SAMPLE_REVIEWERS.map((reviewer, index) => (
            <article key={reviewer} className="review-card">
              <strong>{reviewer}</strong>
              <p>Rating {Math.max(4, Number(product.rating) - (index % 2) * 0.3).toFixed(1)}</p>
              <p className="muted">
                Excellent purchase experience with Datamak Technologies. Product quality and support
                were outstanding.
              </p>
            </article>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="panel">
          <div className="section-head">
            <h2>Related Products</h2>
            <Link to="/catalog" className="section-link">
              Browse More
            </Link>
          </div>
          <div className="product-grid">
            {related.map((entry) => (
              <ProductCard
                key={entry.id}
                product={entry}
                onAddToCart={async (productId) => {
                  if (!user) {
                    setStatus("Please login to add products to cart.");
                    return;
                  }
                  await addToCart(productId, 1);
                  setDialogMessage("Product added to cart.");
                }}
                onQuickView={() => navigate(`/products/${entry.id}`)}
                onWishlist={toggleWishlist}
                busy={false}
                wishlisted={wishlistIds.includes(entry.id)}
              />
            ))}
          </div>
        </section>
      )}
      <MessageDialog message={dialogMessage} onClose={() => setDialogMessage("")} />
    </>
  );
}

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/client";
import MessageDialog from "../components/MessageDialog";
import PageHeader from "../components/PageHeader";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useShop } from "../context/ShopContext";
import { SHOP_CATEGORIES } from "../data/shopCategories";
import { applyImageFallback, getImageSource } from "../utils/imageFallbacks";

const DEFAULT_FILTERS = {
  search: "",
  category: "",
  categoryFilter: "",
  subcategory: "",
  type: "",
  minPrice: "",
  maxPrice: "",
  priceRange: "",
  brand: "",
  availability: "",
  sort: "newest"
};

const CATEGORY_FILTERS = [
  {
    value: "laptops",
    label: "Laptops",
    params: { category: "Computers", subcategory: "Laptops" }
  },
  {
    value: "printers",
    label: "Printers",
    params: { category: "ICT Products", subcategory: "Printers & Scanners" }
  },
  {
    value: "keyboards",
    label: "Keyboards",
    params: { category: "ICT Products", search: "keyboard" }
  },
  {
    value: "hosting",
    label: "Hosting Services",
    params: { category: "Web Hosting Services" }
  }
];

const PRICE_FILTERS = [
  { value: "below-5000", label: "Below M5,000", params: { maxPrice: "5000" } },
  {
    value: "5000-10000",
    label: "M5,000-M10,000",
    params: { minPrice: "5000", maxPrice: "10000" }
  },
  { value: "above-10000", label: "Above M10,000", params: { minPrice: "10000" } }
];

const BRAND_FILTERS = ["HP", "Dell", "Lenovo", "Asus"];

const AVAILABILITY_FILTERS = [
  { value: "in-stock", label: "In Stock" },
  { value: "out-of-stock", label: "Out of Stock" }
];

const FILTER_COUNT_KEYS = [
  "search",
  "category",
  "categoryFilter",
  "subcategory",
  "type",
  "minPrice",
  "maxPrice",
  "priceRange",
  "brand",
  "availability"
];

function getOptionParams(options, value) {
  return options.find((option) => option.value === value)?.params || {};
}

function applyClientFilters(items, currentFilters) {
  return items.filter((product) => {
    if (currentFilters.brand) {
      const haystack = [
        product.name,
        product.description,
        product.brand,
        product.provider,
        ...(product.badges || []),
        ...(product.specifications || []).map((spec) => `${spec.label} ${spec.value}`)
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(currentFilters.brand.toLowerCase())) {
        return false;
      }
    }

    if (currentFilters.availability === "in-stock") {
      return product.type === "service" || Number(product.stock || 0) > 0;
    }

    if (currentFilters.availability === "out-of-stock") {
      return product.type !== "service" && Number(product.stock || 0) <= 0;
    }

    return true;
  });
}

export default function ProductsPage() {
  const { user } = useAuth();
  const { addToCart, getErrorMessage } = useCart();
  const { wishlistIds, toggleWishlist } = useShop();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    categoryFilter: searchParams.get("categoryFilter") || "",
    subcategory: searchParams.get("subcategory") || "",
    type: searchParams.get("type") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    priceRange: searchParams.get("priceRange") || "",
    brand: searchParams.get("brand") || "",
    availability: searchParams.get("availability") || "",
    sort: searchParams.get("sort") || DEFAULT_FILTERS.sort
  }));
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [status, setStatus] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [error, setError] = useState("");
  const [quickView, setQuickView] = useState(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const activeFilterCount = FILTER_COUNT_KEYS.filter(
    (key) => filters[key] && filters[key] !== DEFAULT_FILTERS[key]
  ).length;

  const syncSearchParams = (nextFilters) => {
    const next = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value && value !== DEFAULT_FILTERS[key]) {
        next.set(key, value);
      }
    });
    setSearchParams(next);
  };

  const fetchProducts = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const categoryParams = getOptionParams(CATEGORY_FILTERS, nextFilters.categoryFilter);
      const priceParams = getOptionParams(PRICE_FILTERS, nextFilters.priceRange);
      const apiFilters = {
        ...nextFilters,
        ...categoryParams,
        ...priceParams
      };
      const sortMap = {
        newest: "newest",
        price_asc: "price_asc",
        price_desc: "price_desc",
        popularity: "popularity_desc",
        rating: "rating_desc",
        name: "name_asc"
      };

      const { data } = await api.get("/products", {
        params: {
          search: apiFilters.search || undefined,
          category: apiFilters.category || undefined,
          subcategory: apiFilters.subcategory || undefined,
          type: apiFilters.type || undefined,
          minPrice: apiFilters.minPrice || undefined,
          maxPrice: apiFilters.maxPrice || undefined,
          pageSize: 60,
          sort: sortMap[nextFilters.sort] || "newest"
        }
      });
      setProducts(applyClientFilters(data.products || [], nextFilters));
    } catch (fetchError) {
      setError(fetchError?.response?.data?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onDropdownFilterSelect = (patch) => {
    const nextFilters = {
      ...filters,
      ...patch
    };

    if (patch.categoryFilter !== undefined) {
      nextFilters.category = "";
      nextFilters.subcategory = "";
      nextFilters.type = "";
    }

    if (patch.priceRange !== undefined) {
      nextFilters.minPrice = "";
      nextFilters.maxPrice = "";
    }

    setFilters(nextFilters);
    syncSearchParams(nextFilters);
    fetchProducts(nextFilters);
  };

  const onCategorySelect = (category) => {
    const nextFilters = {
      ...DEFAULT_FILTERS,
      category
    };
    setFilters(nextFilters);
    syncSearchParams(nextFilters);
    fetchProducts(nextFilters);
  };

  const onSearchSubmit = (event) => {
    event.preventDefault();
    const nextFilters = {
      ...filters,
      search: filters.search.trim()
    };
    setFilters(nextFilters);
    syncSearchParams(nextFilters);
    fetchProducts(nextFilters);
  };

  const onSearchChange = (event) => {
    setFilters((current) => ({
      ...current,
      search: event.target.value
    }));
  };

  const onClearFilters = () => {
    const nextFilters = { ...DEFAULT_FILTERS };
    setFilters(nextFilters);
    syncSearchParams(nextFilters);
    fetchProducts(nextFilters);
  };

  const onAddToCart = async (productId) => {
    if (!user) {
      setStatus("Please login or register to add products to cart.");
      return;
    }
    setStatus("");
    setBusyId(productId);
    try {
      await addToCart(productId, 1);
      setDialogMessage("Product added to cart.");
    } catch (addError) {
      setStatus(getErrorMessage(addError));
    } finally {
      setBusyId("");
    }
  };

  const onToggleWishlist = async (productId) => {
    try {
      await toggleWishlist(productId);
      setStatus("Wishlist updated.");
    } catch (actionError) {
      setStatus(getErrorMessage(actionError));
    }
  };

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Catalog" }]}
        eyebrow="Datamak Marketplace"
        title="Product Catalog"
        subtitle="Find computers, ICT gear, networking devices, software licenses, and cloud hosting packages from one curated catalog."
        fallback="/"
        actions={
          <div
            className="catalog-sort"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setSortMenuOpen(false);
              }
            }}
          >
            <button
              type="button"
              className="catalog-sort-trigger"
              aria-haspopup="menu"
              aria-expanded={sortMenuOpen}
              onClick={() => setSortMenuOpen((open) => !open)}
              data-cy="catalog-sort-trigger"
            >
              <span className="catalog-sort-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img">
                  <path d="M4 6h16M7 12h10M10 18h4" />
                </svg>
              </span>
              <span>
                Sort
                <small>
                  {activeFilterCount > 0
                    ? `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"}`
                    : "Filters"}
                </small>
              </span>
            </button>
            {sortMenuOpen && (
              <div className="catalog-sort-menu catalog-filter-menu" role="menu" data-cy="catalog-filter-menu">
                <section className="catalog-filter-section" aria-label="Filter by category">
                  <h3>Category</h3>
                  <div className="catalog-filter-options">
                    {CATEGORY_FILTERS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="menuitem"
                        className={`catalog-sort-option ${
                          filters.categoryFilter === option.value ? "is-active" : ""
                        }`}
                        onClick={() =>
                          onDropdownFilterSelect({
                            categoryFilter:
                              filters.categoryFilter === option.value ? "" : option.value
                          })
                        }
                        data-cy={`catalog-filter-category-${option.value}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="catalog-filter-section" aria-label="Filter by price">
                  <h3>Price</h3>
                  <div className="catalog-filter-options">
                    {PRICE_FILTERS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="menuitem"
                        className={`catalog-sort-option ${
                          filters.priceRange === option.value ? "is-active" : ""
                        }`}
                        onClick={() =>
                          onDropdownFilterSelect({
                            priceRange: filters.priceRange === option.value ? "" : option.value
                          })
                        }
                        data-cy={`catalog-filter-price-${option.value}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="catalog-filter-section" aria-label="Filter by brand">
                  <h3>Brand</h3>
                  <div className="catalog-filter-options">
                    {BRAND_FILTERS.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        role="menuitem"
                        className={`catalog-sort-option ${filters.brand === brand ? "is-active" : ""}`}
                        onClick={() =>
                          onDropdownFilterSelect({
                            brand: filters.brand === brand ? "" : brand
                          })
                        }
                        data-cy={`catalog-filter-brand-${brand.toLowerCase()}`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="catalog-filter-section" aria-label="Filter by availability">
                  <h3>Availability</h3>
                  <div className="catalog-filter-options">
                    {AVAILABILITY_FILTERS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="menuitem"
                        className={`catalog-sort-option ${
                          filters.availability === option.value ? "is-active" : ""
                        }`}
                        onClick={() =>
                          onDropdownFilterSelect({
                            availability:
                              filters.availability === option.value ? "" : option.value
                          })
                        }
                        data-cy={`catalog-filter-availability-${option.value}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <button
                  type="button"
                  className="catalog-clear-filters"
                  onClick={onClearFilters}
                  data-cy="catalog-clear-filters"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        }
      />

      <section
        className="panel shop-category-panel"
        aria-labelledby="catalog-shop-category-title"
        data-cy="catalog-page"
      >
        <form className="catalog-search" onSubmit={onSearchSubmit} data-cy="catalog-search-form">
          <label htmlFor="catalog-search-input">
            <span>Search products</span>
            <input
              id="catalog-search-input"
              type="search"
              value={filters.search}
              onChange={onSearchChange}
              placeholder="Search laptops, hosting, printers..."
              data-cy="catalog-search-input"
            />
          </label>
          <button type="submit" className="btn btn-primary" data-cy="catalog-search-submit">
            Search
          </button>
          {filters.search && (
            <button
              type="button"
              className="btn btn-light"
              onClick={onClearFilters}
              data-cy="catalog-search-clear"
            >
              Clear
            </button>
          )}
        </form>

        <div className="shop-category-heading">
          <h2 id="catalog-shop-category-title">Shop by Category</h2>
          <button
            type="button"
            className="shop-category-view"
            onClick={onClearFilters}
          >
            View all <span aria-hidden="true">-&gt;</span>
          </button>
        </div>
        <div className="shop-category-grid">
          {SHOP_CATEGORIES.map((item) => (
            <button
              key={item.title}
              type="button"
              className={`shop-category-card ${
                filters.category === item.category ? "is-active" : ""
              }`}
              aria-pressed={filters.category === item.category}
              onClick={() => onCategorySelect(item.category)}
            >
              <img
                src={getImageSource(item.imageUrl, item.category)}
                alt={item.imageAlt}
                onError={(event) => applyImageFallback(event, item.category)}
              />
              <span className="shop-category-copy">
                <strong>{item.title}</strong>
              </span>
              <span className="shop-category-action">View all <span aria-hidden="true">-&gt;</span></span>
            </button>
          ))}
        </div>
      </section>

      {(status || error) && (
        <section className="panel">
          {status && <p className="hint notice">{status}</p>}
          {error && <p className="error notice">{error}</p>}
        </section>
      )}

      {loading ? (
        <section className="panel">Loading products...</section>
      ) : products.length === 0 ? (
        <section className="panel empty-state" data-cy="catalog-empty-state">
          <h2>No products found</h2>
          <p className="muted">Adjust the category, subcategory, search, or price filters.</p>
          <button type="button" className="btn btn-primary" onClick={onClearFilters}>
            Clear Filters
          </button>
        </section>
      ) : (
        <section className="product-grid" data-cy="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onQuickView={setQuickView}
              onWishlist={onToggleWishlist}
              busy={busyId === product.id}
              wishlisted={wishlistIds.includes(product.id)}
            />
          ))}
        </section>
      )}

      <QuickViewModal
        product={quickView}
        onClose={() => setQuickView(null)}
        onAddToCart={onAddToCart}
        busy={busyId === quickView?.id}
      />
      <MessageDialog message={dialogMessage} onClose={() => setDialogMessage("")} />
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import PageHeader from "../components/PageHeader";
import {
  PRODUCT_CATEGORIES,
  getAllSubcategories,
  getDefaultProductType,
  getDefaultSubcategory,
  getSubcategoriesForCategory
} from "../data/shopCategories";
import { formatMoney } from "../utils/currency";
import {
  INVALID_NUMERIC_INPUT_MESSAGE,
  getNumericInputError
} from "../utils/numericValidation";

function formatDate(value) {
  return new Date(value).toLocaleString();
}

const INITIAL_PRODUCT = {
  name: "",
  description: "",
  category: "Computers",
  type: "physical",
  subcategory: "Laptops",
  price: "",
  stock: "",
  imageUrl: "",
  discountPercent: "0",
  isFeatured: false,
  popularity: "50",
  rating: "4.5",
  reviewsCount: "0",
  badges: "",
  specifications: ""
};

const ADMIN_SECTIONS = [
  {
    id: "products",
    label: "Products",
    description: "Add products, upload images, manage stock, and edit categories."
  },
  {
    id: "orders",
    label: "Orders",
    description: "Track orders and update order statuses."
  },
  {
    id: "summary",
    label: "Summary",
    description: "View totals, revenue, order status, and sales activity."
  },
  {
    id: "users",
    label: "Users",
    description: "Review customer accounts and manage user roles."
  }
];

function parseSpecifications(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(":");
      return { label: label?.trim(), value: rest.join(":").trim() };
    })
    .filter((entry) => entry.label && entry.value);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

export default function AdminPage() {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newProduct, setNewProduct] = useState(INITIAL_PRODUCT);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productSubcategoryFilter, setProductSubcategoryFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, productsRes, usersRes, ordersRes] = await Promise.all([
        api.get("/admin/summary"),
        api.get("/products", { params: { pageSize: 100 } }),
        api.get("/admin/users"),
        api.get("/orders")
      ]);
      setSummary(summaryRes.data);
      setProducts(productsRes.data.products || []);
      setUsers(usersRes.data.users || []);
      setOrders(ordersRes.data.orders || []);
    } catch (fetchError) {
      setError(fetchError?.response?.data?.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [imagePreviews]);

  const newProductSubcategories = getSubcategoriesForCategory(newProduct.category);
  const filterSubcategories = productCategoryFilter
    ? getSubcategoriesForCategory(productCategoryFilter)
    : getAllSubcategories();
  const activeSection = ADMIN_SECTIONS.find((section) => section.id === activeTab);

  const filteredProducts = useMemo(() => {
    const term = productSearch.toLowerCase().trim();
    return products.filter((product) => {
      const matchesTerm =
        !term ||
        `${product.name} ${product.category} ${product.subcategory || ""} ${product.type || ""}`
          .toLowerCase()
          .includes(term);
      const matchesCategory =
        !productCategoryFilter || product.category === productCategoryFilter;
      const matchesSubcategory =
        !productSubcategoryFilter || product.subcategory === productSubcategoryFilter;
      return matchesTerm && matchesCategory && matchesSubcategory;
    });
  }, [products, productSearch, productCategoryFilter, productSubcategoryFilter]);

  const filteredUsers = useMemo(() => {
    const term = userSearch.toLowerCase().trim();
    if (!term) {
      return users;
    }
    return users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(term));
  }, [users, userSearch]);

  const filteredOrders = useMemo(() => {
    const term = orderSearch.toLowerCase().trim();
    return orders.filter((order) => {
      const matchesTerm =
        !term ||
        `${order.orderNumber || ""} ${order.id} ${order.customer?.email || order.userId}`
          .toLowerCase()
          .includes(term);
      const matchesStatus = !orderStatusFilter || order.status === orderStatusFilter;
      return matchesTerm && matchesStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const setNumericProductField = (field, value, mode = "digits") => {
    const inputError = getNumericInputError(value, mode);
    if (inputError) {
      setError(inputError);
      return;
    }

    setError((current) => (current === INVALID_NUMERIC_INPUT_MESSAGE ? "" : current));
    setNewProduct((current) => ({ ...current, [field]: value }));
  };

  const getProductFormNumericError = () => {
    const productNumericError =
      getNumericInputError(newProduct.price, "decimal") ||
      getNumericInputError(newProduct.discountPercent, "decimal") ||
      (newProduct.type === "service" ? "" : getNumericInputError(newProduct.stock, "digits"));

    return productNumericError ? INVALID_NUMERIC_INPUT_MESSAGE : "";
  };

  const onCreateProduct = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    const productNumericError = getProductFormNumericError();
    if (productNumericError) {
      setError(productNumericError);
      return;
    }

    try {
      let uploadedImageUrls = [];
      if (selectedImages.length) {
        const images = await Promise.all(
          selectedImages.map(async (file) => ({
            name: file.name,
            type: file.type,
            dataUrl: await readFileAsDataUrl(file)
          }))
        );
        const uploadResponse = await api.post("/uploads/images", { images });
        uploadedImageUrls = (uploadResponse.data.images || []).map((image) => image.url);
      }

      const payload = {
        ...newProduct,
        imageUrl: uploadedImageUrls[0] || newProduct.imageUrl,
        gallery: uploadedImageUrls.length ? uploadedImageUrls : undefined,
        badges: newProduct.badges
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
        specifications: parseSpecifications(newProduct.specifications),
        price: Number(newProduct.price),
        stock: newProduct.type === "service" ? undefined : Number(newProduct.stock),
        popularity: Number(newProduct.popularity),
        rating: Number(newProduct.rating),
        reviewsCount: Number(newProduct.reviewsCount),
        discountPercent: Number(newProduct.discountPercent)
      };
      await api.post("/products", payload);
      setNewProduct(INITIAL_PRODUCT);
      setSelectedImages([]);
      setImagePreviews((current) => {
        current.forEach((preview) => URL.revokeObjectURL(preview.url));
        return [];
      });
      setMessage("Product created successfully.");
      await loadData();
    } catch (createError) {
      setError(createError?.response?.data?.message || "Failed to create product.");
    }
  };

  const onImageFilesChange = (event) => {
    const files = Array.from(event.target.files || []).filter((file) =>
      file.type.startsWith("image/")
    );
    setSelectedImages(files);
    setImagePreviews((current) => {
      current.forEach((preview) => URL.revokeObjectURL(preview.url));
      return files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file)
      }));
    });
  };

  const removeSelectedImage = (index) => {
    setSelectedImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setImagePreviews((current) => {
      const removed = current[index];
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const onDeleteProduct = async (id) => {
    setMessage("");
    setError("");
    try {
      await api.delete(`/products/${id}`);
      setMessage("Product deleted.");
      await loadData();
    } catch (deleteError) {
      setError(deleteError?.response?.data?.message || "Failed to delete product.");
    }
  };

  const onProductUpdate = async (product, updates) => {
    setMessage("");
    setError("");
    try {
      await api.put(`/products/${product.id}`, updates);
      setMessage("Product updated.");
      await loadData();
    } catch (updateError) {
      setError(updateError?.response?.data?.message || "Failed to update product.");
    }
  };

  const onRestock = async (product) => {
    if (product.type === "service") {
      return;
    }
    setMessage("");
    setError("");
    try {
      await api.put(`/products/${product.id}`, { stock: Number(product.stock) + 5 });
      setMessage("Product stock increased by 5.");
      await loadData();
    } catch (updateError) {
      setError(updateError?.response?.data?.message || "Failed to update stock.");
    }
  };

  const onRoleChange = async (userId, role) => {
    setMessage("");
    setError("");
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      setMessage("User role updated.");
      await loadData();
    } catch (roleError) {
      setError(roleError?.response?.data?.message || "Failed to update user role.");
    }
  };

  const onOrderStatusChange = async (orderId, status) => {
    setMessage("");
    setError("");
    try {
      await api.patch(`/orders/${orderId}/status`, {
        status,
        note: `Updated from admin dashboard to ${status}.`
      });
      setMessage("Order status updated.");
      await loadData();
    } catch (statusError) {
      setError(statusError?.response?.data?.message || "Failed to update order status.");
    }
  };

  if (loading) {
    return <section className="panel">Loading admin dashboard...</section>;
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Admin Home" }]}
        title="Admin Control Center"
        subtitle="Manage products, users, orders, inventory, and commerce insights."
        fallback="/admin"
        showBack={false}
      >
        {error && <p className="error notice">{error}</p>}
        {message && <p className="hint notice">{message}</p>}
      </PageHeader>

      {!activeTab && (
        <section className="panel admin-dashboard-card-panel" aria-label="Admin dashboard sections">
          <div className="admin-dashboard-grid">
            {ADMIN_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className="admin-dashboard-tile"
                onClick={() => setActiveTab(section.id)}
              >
                <strong>{section.label}</strong>
                <span>{section.description}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {activeTab && (
        <section className="panel admin-detail-panel">
          <div className="admin-section-head">
            <button
              type="button"
              className="admin-back-button"
              aria-label="Back to admin dashboard"
              onClick={() => setActiveTab("")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div>
              <span>Admin Dashboard</span>
              <h2>{activeSection?.label}</h2>
            </div>
          </div>
        <div className="admin-content">
          {activeTab === "summary" && summary && (
            <div className="summary-grid">
              <article className="summary-card">
                <h3>Users</h3>
                <p>{summary.users}</p>
              </article>
              <article className="summary-card">
                <h3>Products</h3>
                <p>{summary.products}</p>
              </article>
              <article className="summary-card">
                <h3>Orders</h3>
                <p>{summary.orders}</p>
              </article>
              <article className="summary-card">
                <h3>Revenue</h3>
                <p>{formatMoney(summary.totalRevenue)}</p>
              </article>

              <article className="summary-card full">
                <h3>Orders By Status</h3>
                <div className="status-strip">
                  {Object.entries(summary.ordersByStatus || {}).map(([status, count]) => (
                    <span key={status} className="status-chip">
                      {status}: {count}
                    </span>
                  ))}
                </div>
              </article>

              <article className="summary-card full">
                <h3>Monthly Sales</h3>
                <div className="chart-bars">
                  {(summary.monthlySales || []).map((entry) => (
                    <div key={entry.month} className="bar-wrap">
                      <div
                        className="bar"
                        style={{
                          height: `${Math.max(8, Math.round((entry.total / (summary.totalRevenue || 1)) * 160))}px`
                        }}
                      />
                      <small>{entry.month}</small>
                    </div>
                  ))}
                </div>
              </article>

              <article className="summary-card full">
                <h3>Top Selling Products</h3>
                <ul className="order-items">
                  {(summary.topSellingProducts || []).map((product) => (
                    <li key={product.productId}>
                      {product.name} - {product.quantity} sold ({formatMoney(product.revenue)})
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          )}

          {activeTab === "products" && (
            <div className="admin-section">
              <form className="form-grid" onSubmit={onCreateProduct}>
                <h2>Add Product</h2>
                <label>
                  Name
                  <input
                    value={newProduct.name}
                    onChange={(event) =>
                      setNewProduct((current) => ({ ...current, name: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Description
                  <input
                    value={newProduct.description}
                    onChange={(event) =>
                      setNewProduct((current) => ({ ...current, description: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Category
                  <select
                    value={newProduct.category}
                    onChange={(event) => {
                      const category = event.target.value;
                      const type = getDefaultProductType(category);
                      setNewProduct((current) => ({
                        ...current,
                        category,
                        type,
                        subcategory: getDefaultSubcategory(category),
                        stock: type === "service" ? "" : current.stock
                      }));
                    }}
                    required
                  >
                    {PRODUCT_CATEGORIES.map((category) => (
                      <option key={category.category} value={category.category}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Subcategory
                  <select
                    value={newProduct.subcategory}
                    onChange={(event) =>
                      setNewProduct((current) => ({ ...current, subcategory: event.target.value }))
                    }
                    required
                  >
                    {newProductSubcategories.map((subcategory) => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Price
                  <input
                    type="text"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(event) => setNumericProductField("price", event.target.value, "decimal")}
                    required
                  />
                </label>
                <label>
                  Stock
                  <input
                    type="text"
                    inputMode="numeric"
                    min="0"
                    value={newProduct.stock}
                    onChange={(event) => setNumericProductField("stock", event.target.value, "digits")}
                    required={newProduct.type !== "service"}
                    disabled={newProduct.type === "service"}
                    placeholder={
                      newProduct.type === "service" ? "Not required for services" : "Stock quantity"
                    }
                  />
                </label>
                <label>
                  Discount %
                  <input
                    type="text"
                    inputMode="decimal"
                    min="0"
                    max="90"
                    value={newProduct.discountPercent}
                    onChange={(event) =>
                      setNumericProductField("discountPercent", event.target.value, "decimal")
                    }
                  />
                </label>
                <label>
                  Specifications (one per line, Label:Value)
                  <textarea
                    rows="4"
                    value={newProduct.specifications}
                    onChange={(event) =>
                      setNewProduct((current) => ({ ...current, specifications: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Product Pictures
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onImageFilesChange}
                  />
                  <span className="muted">
                    Upload up to 8 images from this device. The first image becomes the main catalog
                    picture; all selected images appear in the product gallery.
                  </span>
                </label>
                {imagePreviews.length > 0 && (
                  <div className="admin-image-preview-grid">
                    {imagePreviews.map((preview, index) => (
                      <article key={preview.url} className="admin-image-preview">
                        <img src={preview.url} alt={preview.name} />
                        <div>
                          <strong>{index === 0 ? "Main image" : `Gallery image ${index + 1}`}</strong>
                          <span>{preview.name}</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-light"
                          onClick={() => removeSelectedImage(index)}
                        >
                          Remove
                        </button>
                      </article>
                    ))}
                  </div>
                )}
                <button type="submit" className="btn btn-primary">
                  Add Product
                </button>
              </form>

              <div className="table-controls">
                <input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                />
                <select
                  value={productCategoryFilter}
                  onChange={(event) => {
                    setProductCategoryFilter(event.target.value);
                    setProductSubcategoryFilter("");
                  }}
                >
                  <option value="">All categories</option>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <option key={category.category} value={category.category}>
                      {category.title}
                    </option>
                  ))}
                </select>
                <select
                  value={productSubcategoryFilter}
                  onChange={(event) => setProductSubcategoryFilter(event.target.value)}
                >
                  <option value="">All subcategories</option>
                  {filterSubcategories.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Subcategory</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>
                          <select
                            value={product.category}
                            onChange={(event) => {
                              const category = event.target.value;
                              const type = getDefaultProductType(category);
                              onProductUpdate(product, {
                                category,
                                subcategory: getDefaultSubcategory(category),
                                type
                              });
                            }}
                          >
                            {PRODUCT_CATEGORIES.map((category) => (
                              <option key={category.category} value={category.category}>
                                {category.title}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={product.subcategory || getDefaultSubcategory(product.category)}
                            onChange={(event) =>
                              onProductUpdate(product, { subcategory: event.target.value })
                            }
                          >
                            {getSubcategoriesForCategory(product.category).map((subcategory) => (
                              <option key={subcategory} value={subcategory}>
                                {subcategory}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={product.type}
                            disabled={getDefaultProductType(product.category) === "service"}
                            onChange={(event) =>
                              onProductUpdate(product, { type: event.target.value })
                            }
                          >
                            <option value="physical">Physical</option>
                            <option value="service">Service</option>
                          </select>
                        </td>
                        <td>{formatMoney(product.price)}</td>
                        <td>{product.type === "service" ? "Service" : product.stock}</td>
                        <td>{product.rating}</td>
                        <td className="row-actions">
                          <button
                            type="button"
                            className="btn btn-light"
                            onClick={() => onRestock(product)}
                            disabled={product.type === "service"}
                          >
                            Restock +5
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => onDeleteProduct(product.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <>
              <div className="table-controls">
                <input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                />
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td className="row-actions">
                          <button
                            type="button"
                            className="btn btn-light"
                            onClick={() =>
                              onRoleChange(user.id, user.role === "admin" ? "customer" : "admin")
                            }
                          >
                            Set {user.role === "admin" ? "Customer" : "Admin"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "orders" && (
            <>
              <div className="table-controls">
                <input
                  placeholder="Search orders..."
                  value={orderSearch}
                  onChange={(event) => setOrderSearch(event.target.value)}
                />
                <select
                  value={orderStatusFilter}
                  onChange={(event) => setOrderStatusFilter(event.target.value)}
                >
                  <option value="">All statuses</option>
                  {["Pending", "Paid", "Processing", "Shipped", "Delivered", "Cancelled"].map(
                    (status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Order No.</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Placed</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.orderNumber || order.id.slice(0, 8)}</td>
                        <td>{order.customer ? order.customer.email : order.userId}</td>
                        <td>{formatMoney(order.total)}</td>
                        <td>{order.status}</td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td className="row-actions">
                          <select
                            defaultValue={order.status}
                            onChange={(event) => onOrderStatusChange(order.id, event.target.value)}
                          >
                            {[
                              "Pending",
                              "Paid",
                              "Processing",
                              "Shipped",
                              "Delivered",
                              "Cancelled"
                            ].map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
      )}
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
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

const ADMIN_NAV_ITEMS = [
  { id: "", label: "Dashboard", icon: "dashboard" },
  { id: "products", label: "Products", icon: "products" },
  { id: "orders", label: "Orders", icon: "orders" },
  { id: "users", label: "Customers", icon: "users" },
  { id: "summary", label: "Analytics", icon: "analytics" }
];

const STATUS_COLORS = {
  Paid: "#12b886",
  Pending: "#f59f00",
  Failed: "#f03e3e",
  Refunded: "#94a3b8",
  Processing: "#3b82f6",
  Shipped: "#8b5cf6",
  Delivered: "#0ca678",
  Cancelled: "#64748b"
};

const ORDER_STATUSES = ["Pending", "Paid", "Processing", "Shipped", "Delivered", "Cancelled", "Failed", "Refunded"];
const USER_ROLES = ["customer", "admin"];

function formatShortDate(value) {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatMonthLabel(value) {
  if (!value) {
    return "";
  }

  const [year, month] = String(value).split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short" });
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getLastSixMonthKeys() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return getMonthKey(date);
  });
}

function getOrderCustomer(order) {
  return order?.customer?.name || order?.customer?.email || order?.user?.name || order?.userId || "Customer";
}

function getOrderCustomerEmail(order) {
  return order?.customer?.email || order?.user?.email || order?.userId || "Customer";
}

function getOrderNumber(order) {
  return order?.orderNumber || (order?.id ? `#${order.id.slice(0, 8)}` : "#ORDER");
}

function formatOrderDateParts(value) {
  if (!value) {
    return { date: "No date", time: "" };
  }

  const date = new Date(value);
  return {
    date: date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  };
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function getProductSku(product) {
  const source = product?.sku || product?.id || product?.name || "PRODUCT";
  return `SKU-${String(source).slice(0, 8).toUpperCase()}`;
}

function getCustomerId(user, index) {
  return user?.customerId || `CUS-${String(index + 1).padStart(6, "0")}`;
}

function getUserInitials(user) {
  const source = user?.name || user?.email || "Customer";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function AdminIcon({ name, className = "admin-ui-icon" }) {
  const commonProps = {
    className,
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
    focusable: "false"
  };

  if (name === "dashboard") {
    return (
      <svg {...commonProps}>
        <rect x="4" y="4" width="7" height="7" rx="2" />
        <rect x="13" y="4" width="7" height="7" rx="2" />
        <rect x="4" y="13" width="7" height="7" rx="2" />
        <rect x="13" y="13" width="7" height="7" rx="2" />
      </svg>
    );
  }

  if (name === "products") {
    return (
      <svg {...commonProps}>
        <path d="M6.5 8h11l1 12h-13l1-12Z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
        <path d="M9 14h6" />
      </svg>
    );
  }

  if (name === "orders") {
    return (
      <svg {...commonProps}>
        <path d="M7 4h10l1 16H6L7 4Z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg {...commonProps}>
        <circle cx="9" cy="9" r="3" />
        <path d="M3.8 19a5.4 5.4 0 0 1 10.4 0" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M15.2 18.5a4.5 4.5 0 0 1 5 0" />
      </svg>
    );
  }

  if (name === "analytics") {
    return (
      <svg {...commonProps}>
        <path d="M4 19 9 13l4 3 7-10" />
        <path d="M4 19h16" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...commonProps}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...commonProps}>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </svg>
    );
  }

  if (name === "filter") {
    return (
      <svg {...commonProps}>
        <path d="M4 6h16" />
        <path d="M7 12h10" />
        <path d="M10 18h4" />
      </svg>
    );
  }

  if (name === "refresh") {
    return (
      <svg {...commonProps}>
        <path d="M20 12a8 8 0 0 1-13.7 5.7" />
        <path d="M4 12a8 8 0 0 1 13.7-5.7" />
        <path d="M7 18H4v-3" />
        <path d="M17 6h3v3" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg {...commonProps}>
        <path d="M5 7h14" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M7 7l1 13h8l1-13" />
        <path d="M9 7V4h6v3" />
      </svg>
    );
  }

  if (name === "download") {
    return (
      <svg {...commonProps}>
        <path d="M12 4v10" />
        <path d="m8 10 4 4 4-4" />
        <path d="M5 20h14" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...commonProps}>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M4 10h16" />
      </svg>
    );
  }

  if (name === "copy") {
    return (
      <svg {...commonProps}>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M4 16V6a2 2 0 0 1 2-2h10" />
      </svg>
    );
  }

  if (name === "more") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    );
  }

  if (name === "customer") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="8" r="3" />
        <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      </svg>
    );
  }

  if (name === "mail") {
    return (
      <svg {...commonProps}>
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="m5 8 7 5 7-5" />
      </svg>
    );
  }

  if (name === "chevron-down") {
    return (
      <svg {...commonProps}>
        <path d="m6 9 6 6 6-6" />
      </svg>
    );
  }

  if (name === "revenue") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v10" />
        <path d="M9 10.5c0-1.4 1.3-2.3 3-2.3s3 .9 3 2.3c0 3-6 1.3-6 4.1 0 1.3 1.3 2.2 3 2.2s3-.9 3-2.2" />
      </svg>
    );
  }

  if (name === "chevron") {
    return (
      <svg {...commonProps}>
        <path d="m9 6 6 6-6 6" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

function MetricCard({ icon, label, value, tone }) {
  return (
    <article className={`admin-metric-card admin-metric-${tone}`}>
      <div className="admin-metric-head">
        <span className="admin-metric-icon">
          <AdminIcon name={icon} />
        </span>
        <div>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      </div>
    </article>
  );
}

function buildConicGradient(entries) {
  const total = entries.reduce((sum, entry) => sum + Number(entry.value || 0), 0);
  if (!total) {
    return "#edf4f3";
  }

  let cursor = 0;
  return `conic-gradient(${entries
    .map((entry) => {
      const start = cursor;
      const size = (Number(entry.value || 0) / total) * 360;
      cursor += size;
      return `${entry.color} ${start}deg ${cursor}deg`;
    })
    .join(", ")})`;
}

function DonutCard({ title, centerValue, centerLabel, entries, valueFormatter = (value) => value }) {
  const total = entries.reduce((sum, entry) => sum + Number(entry.value || 0), 0);

  return (
    <article className="admin-chart-card admin-donut-card">
      <div className="admin-card-head">
        <h3>{title}</h3>
        <button type="button">This Month</button>
      </div>
      <div className="admin-donut-layout">
        <div className="admin-donut" style={{ background: buildConicGradient(entries) }}>
          <div>
            <strong>{centerValue}</strong>
            <span>{centerLabel}</span>
          </div>
        </div>
        <div className="admin-donut-legend">
          {entries.map((entry) => {
            const percent = total ? Math.round((Number(entry.value || 0) / total) * 100) : 0;
            return (
              <div key={entry.label}>
                <span style={{ backgroundColor: entry.color }} />
                <strong>{entry.label}</strong>
                <em>
                  {valueFormatter(entry.value)} ({percent}%)
                </em>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function MonthlySalesChart({ data }) {
  const safeData = data.length ? data : getLastSixMonthKeys().map((month) => ({ month, total: 0 }));
  const width = 680;
  const height = 238;
  const padding = { top: 24, right: 22, bottom: 36, left: 58 };
  const maxTotal = Math.max(...safeData.map((entry) => Number(entry.total || 0)), 1);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const points = safeData.map((entry, index) => {
    const x = padding.left + (safeData.length === 1 ? 0 : (index / (safeData.length - 1)) * plotWidth);
    const y = padding.top + plotHeight - (Number(entry.total || 0) / maxTotal) * plotHeight;
    return { ...entry, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const baselineY = padding.top + plotHeight;
  const areaPath = `${path} L ${points.at(-1)?.x || padding.left} ${baselineY} L ${padding.left} ${baselineY} Z`;
  const highlight = points.reduce(
    (best, point) => (Number(point.total || 0) > Number(best.total || 0) ? point : best),
    points[0]
  );
  const yTicks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <article className="admin-chart-card admin-sales-card">
      <div className="admin-card-head">
        <h3>Monthly Sales</h3>
        <button type="button">This Year</button>
      </div>
      <svg className="admin-line-chart" viewBox={`0 0 ${width} ${height}`} aria-label="Monthly sales chart">
        {yTicks.map((tick) => {
          const y = padding.top + plotHeight - tick * plotHeight;
          return (
            <g key={tick}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
              <text x={padding.left - 12} y={y + 4}>
                {formatMoney(maxTotal * tick).replace(".00", "")}
              </text>
            </g>
          );
        })}
        <path className="admin-line-chart-area" d={areaPath} />
        <path className="admin-line-chart-line" d={path} />
        {points.map((point) => (
          <g key={point.month}>
            <circle cx={point.x} cy={point.y} r="4" />
            <text className="admin-line-chart-month" x={point.x} y={height - 10}>
              {formatMonthLabel(point.month)}
            </text>
          </g>
        ))}
        {highlight && (
          <g className="admin-chart-tooltip">
            <rect x={Math.min(highlight.x + 10, width - 150)} y={Math.max(highlight.y - 58, 8)} width="128" height="48" rx="8" />
            <text x={Math.min(highlight.x + 24, width - 136)} y={Math.max(highlight.y - 38, 28)}>
              {formatMonthLabel(highlight.month)}
            </text>
            <text x={Math.min(highlight.x + 24, width - 136)} y={Math.max(highlight.y - 18, 48)}>
              {formatMoney(highlight.total)}
            </text>
          </g>
        )}
      </svg>
    </article>
  );
}

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
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productSubcategoryFilter, setProductSubcategoryFilter] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
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
  const activeSection = ADMIN_NAV_ITEMS.find((section) => section.id === activeTab);

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
      const matchesType = !productTypeFilter || product.type === productTypeFilter;
      return matchesTerm && matchesCategory && matchesSubcategory && matchesType;
    });
  }, [products, productSearch, productCategoryFilter, productSubcategoryFilter, productTypeFilter]);

  const filteredUsers = useMemo(() => {
    const term = userSearch.toLowerCase().trim();
    return users.filter((user) => {
      const matchesTerm = !term || `${user.name} ${user.email}`.toLowerCase().includes(term);
      const matchesRole = !userRoleFilter || user.role === userRoleFilter;
      return matchesTerm && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

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

  const monthlySalesData = useMemo(
    () =>
      (summary?.monthlySales?.length ? summary.monthlySales : getLastSixMonthKeys().map((month) => ({ month, total: 0 }))).map(
        (entry) => ({ month: entry.month, total: Number(entry.total || 0) })
      ),
    [summary]
  );

  const metricCards = useMemo(
    () => [
      {
        icon: "users",
        label: "Users",
        value: summary?.users ?? users.length,
        tone: "teal"
      },
      {
        icon: "products",
        label: "Products",
        value: summary?.products ?? products.length,
        tone: "blue"
      },
      {
        icon: "orders",
        label: "Orders",
        value: summary?.orders ?? orders.length,
        tone: "purple"
      },
      {
        icon: "revenue",
        label: "Revenue",
        value: formatMoney(summary?.totalRevenue || 0),
        tone: "green"
      }
    ],
    [orders.length, products.length, summary, users.length]
  );

  const statusEntries = useMemo(() => {
    const counts = summary?.ordersByStatus || {};
    const hiddenStatuses = ["Pending", "Refunded"];
    const preferredStatuses = ["Paid", "Failed"];
    const labels = [
      ...preferredStatuses,
      ...Object.keys(counts).filter(
        (status) => !preferredStatuses.includes(status) && !hiddenStatuses.includes(status)
      )
    ];

    return labels.map((label) => ({
      label,
      value: Number(counts[label] || 0),
      color: STATUS_COLORS[label] || "#14b8a6"
    }));
  }, [summary]);

  const recentOrderRows = useMemo(() => {
    const sourceOrders = orders.length ? orders : summary?.recentOrders || [];
    return [...sourceOrders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);
  }, [orders, summary]);

  const lowStockRows = useMemo(() => {
    const sourceProducts =
      summary?.lowStockProducts?.length
        ? summary.lowStockProducts
        : products.filter((product) => product.type !== "service" && Number(product.stock || 0) <= 5);

    return sourceProducts
      .slice(0, 4)
      .map((product) => ({
        id: product.id,
        name: product.name,
        detail: `${product.stock ?? 0} in stock`,
        amount: formatMoney(product.price),
        imageUrl: product.imageUrl
      }));
  }, [products, summary]);

  const recentUserRows = useMemo(
    () =>
      [...users]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4),
    [users]
  );

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
      setShowProductForm(false);
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

  const onExportCustomers = () => {
    const headers = ["Customer ID", "Name", "Email", "Role", "Created"];
    const rows = filteredUsers.map((user, index) => [
      getCustomerId(user, users.findIndex((entry) => entry.id === user.id) >= 0 ? users.findIndex((entry) => entry.id === user.id) : index),
      user.name,
      user.email,
      user.role,
      formatDate(user.createdAt)
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "customers.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("Customers exported.");
  };

  const onExportOrders = () => {
    const headers = ["Order No.", "Customer", "Total", "Status", "Placed"];
    const rows = filteredOrders.map((order) => [
      getOrderNumber(order),
      getOrderCustomerEmail(order),
      formatMoney(order.total),
      order.status,
      formatDate(order.createdAt)
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "orders.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("Orders exported.");
  };

  const onCopyOrderNumber = async (order) => {
    const orderNumber = getOrderNumber(order);
    try {
      await navigator.clipboard.writeText(orderNumber);
      setMessage("Order number copied.");
    } catch {
      setMessage(orderNumber);
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
    <section className="admin-shell" aria-label="Admin dashboard">
      <aside className="admin-shell-sidebar">
        <div className="admin-shell-brand">
          <span>MS</span>
          <strong>Admin</strong>
        </div>
        <nav className="admin-shell-nav" aria-label="Admin sections">
          {ADMIN_NAV_ITEMS.map((item) => (
            <button
              key={`${item.id}-${item.label}`}
              type="button"
              className={activeTab === item.id ? "is-active" : ""}
              onClick={() => setActiveTab(item.id)}
            >
              <AdminIcon name={item.icon} />
              <span>{item.label}</span>
              <AdminIcon name="chevron" className="admin-shell-chevron" />
            </button>
          ))}
        </nav>
      </aside>

      <div className="admin-shell-main">
        {(error || message) && (
          <div className="admin-dashboard-notices">
            {error && <p className="error notice">{error}</p>}
            {message && <p className="hint notice">{message}</p>}
          </div>
        )}

        {!activeTab && (
          <div className="admin-dashboard-view">
            <section className="admin-metric-grid" aria-label="Store totals">
              {metricCards.map((card) => (
                <MetricCard key={card.label} {...card} />
              ))}
            </section>

            <section className="admin-dashboard-lower admin-dashboard-overview">
              <article className="admin-table-card">
                <div className="admin-card-head">
                  <h3>Recent Orders</h3>
                  <button type="button" onClick={() => setActiveTab("orders")}>View All</button>
                </div>
                <div className="admin-mini-list">
                  {recentOrderRows.map((order) => (
                    <div key={order.id} className="admin-order-row">
                      <div>
                        <strong>{getOrderNumber(order)}</strong>
                        <small>{getOrderCustomer(order)}</small>
                      </div>
                      <em>{formatMoney(order.total)}</em>
                      <span className={`admin-status-pill admin-status-${String(order.status || "").toLowerCase()}`}>
                        {order.status}
                      </span>
                      <small>{formatShortDate(order.createdAt)}</small>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-table-card">
                <div className="admin-card-head">
                  <h3>Low Stock Products</h3>
                  <button type="button" onClick={() => setActiveTab("products")}>Manage</button>
                </div>
                <div className="admin-mini-list">
                  {lowStockRows.map((product, index) => (
                    <div key={product.id} className="admin-product-row">
                      <span className="admin-rank">{String(index + 1).padStart(2, "0")}</span>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" />
                      ) : (
                        <span className="admin-product-fallback">{product.name.slice(0, 2).toUpperCase()}</span>
                      )}
                      <div>
                        <strong>{product.name}</strong>
                        <small>{product.detail}</small>
                      </div>
                      <em>{product.amount}</em>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-table-card">
                <div className="admin-card-head">
                  <h3>Recent Customers</h3>
                  <button type="button" onClick={() => setActiveTab("users")}>View All</button>
                </div>
                <div className="admin-mini-list">
                  {recentUserRows.map((user) => (
                    <div key={user.id} className="admin-user-row">
                      <span className="admin-user-avatar">{String(user.name || user.email || "U").slice(0, 1).toUpperCase()}</span>
                      <div>
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </div>
                      <span className="admin-status-pill">{user.role}</span>
                      <small>{formatShortDate(user.createdAt)}</small>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </div>
        )}

        {activeTab && (
          <section className="admin-detail-panel">
            <div className="admin-section-head">
              <div>
                <span>Admin Dashboard</span>
                <h2>{activeSection?.label || "Dashboard"}</h2>
              </div>
            </div>
            <div className="admin-content">
          {activeTab === "summary" && (
            <div className="admin-analytics-view">
              <section className="admin-metric-grid admin-analytics-metrics" aria-label="Analytics totals">
                {metricCards.map((card) => (
                  <MetricCard key={card.label} {...card} />
                ))}
              </section>

              <section className="admin-dashboard-charts">
                <DonutCard
                  title="Orders By Status"
                  centerValue={summary?.orders ?? orders.length}
                  centerLabel="Total Orders"
                  entries={statusEntries}
                />
                <MonthlySalesChart data={monthlySalesData} />
              </section>

            </div>
          )}

          {activeTab === "products" && (
            <div className="admin-section">
              <div className="admin-products-header">
                <div>
                  <h3>Products</h3>
                  <p>Manage your store products, inventory and details.</p>
                </div>
                <button
                  type="button"
                  className="admin-add-product-button"
                  onClick={() => setShowProductForm((current) => !current)}
                >
                  <AdminIcon name="plus" />
                  <span>{showProductForm ? "Close Form" : "Add Product"}</span>
                </button>
              </div>

              {showProductForm && (
              <form className="admin-product-form form-grid" onSubmit={onCreateProduct}>
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
              )}

              <div className="admin-product-toolbar">
                <label className="admin-product-search">
                  <AdminIcon name="search" />
                  <input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                  />
                </label>
                <select
                  className="admin-product-filter"
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
                  className="admin-product-filter"
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
                <select
                  className="admin-product-filter"
                  value={productTypeFilter}
                  onChange={(event) => setProductTypeFilter(event.target.value)}
                >
                  <option value="">All types</option>
                  <option value="physical">Physical</option>
                  <option value="service">Service</option>
                </select>
                <button type="button" className="admin-filter-button">
                  <AdminIcon name="filter" />
                  <span>Filter</span>
                </button>
              </div>
              <div className="table-wrap admin-products-table-wrap">
                <table className="admin-products-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Subcategory</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="admin-product-cell">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt="" />
                            ) : (
                              <span className="admin-product-thumb-fallback">
                                {product.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                            <div>
                              <strong>{product.name}</strong>
                              <small>{getProductSku(product)}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            className="admin-product-pill admin-product-pill-category"
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
                            className="admin-product-pill admin-product-pill-subcategory"
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
                            className="admin-product-pill admin-product-pill-type"
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
                        <td className="admin-product-price">{formatMoney(product.price)}</td>
                        <td>
                          {product.type === "service" ? (
                            <span className="admin-stock-badge admin-stock-service">Service</span>
                          ) : (
                            <span className={`admin-stock-badge ${Number(product.stock || 0) > 0 ? "" : "is-empty"}`}>
                              <strong>{product.stock}</strong>
                              <small>{Number(product.stock || 0) > 0 ? "In Stock" : "Out"}</small>
                            </span>
                          )}
                        </td>
                        <td className="admin-product-actions">
                          <button
                            type="button"
                            className="admin-table-action"
                            onClick={() => onRestock(product)}
                            disabled={product.type === "service"}
                          >
                            <AdminIcon name="refresh" />
                            <span>Restock +5</span>
                          </button>
                          <button
                            type="button"
                            className="admin-table-action admin-table-action-danger"
                            onClick={() => onDeleteProduct(product.id)}
                          >
                            <AdminIcon name="trash" />
                            <span>Delete</span>
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
            <div className="admin-section admin-customers-section">
              <div className="admin-customers-header">
                <div>
                  <span>Customers</span>
                  <h3>Customers</h3>
                  <p>Manage and view all registered customers in your store.</p>
                </div>
                <div className="admin-customers-header-actions">
                  <button type="button" className="admin-export-button" onClick={onExportCustomers}>
                    <AdminIcon name="download" />
                    <span>Export</span>
                  </button>
                  <button
                    type="button"
                    className="admin-new-order-button"
                    onClick={() => setMessage("Customers are added when users register.")}
                  >
                    <AdminIcon name="plus" />
                    <span>Add Customer</span>
                  </button>
                </div>
              </div>

              <div className="admin-customer-toolbar">
                <label className="admin-product-search admin-customer-search">
                  <AdminIcon name="search" />
                  <input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                  />
                </label>
                <label className="admin-customer-filter-control">
                  <AdminIcon name="filter" />
                  <select
                    value={userRoleFilter}
                    onChange={(event) => setUserRoleFilter(event.target.value)}
                  >
                    <option value="">Filter</option>
                    {USER_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role === "admin" ? "Admins" : "Customers"}
                      </option>
                    ))}
                  </select>
                  <AdminIcon name="chevron-down" />
                </label>
              </div>

              <div className="table-wrap admin-customers-table-wrap">
                <table className="admin-customers-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => {
                      const sourceIndex = users.findIndex((entry) => entry.id === user.id);
                      const customerIndex = sourceIndex >= 0 ? sourceIndex : index;
                      const created = formatOrderDateParts(user.createdAt);
                      const nextRole = user.role === "admin" ? "customer" : "admin";
                      return (
                        <tr key={user.id}>
                          <td>
                            <div className="admin-customer-cell">
                              <span className={`admin-customer-avatar ${user.role === "admin" ? "is-admin" : ""}`}>
                                {getUserInitials(user)}
                                <i aria-hidden="true" />
                              </span>
                              <div>
                                <strong>{user.name}</strong>
                                <small>ID: {getCustomerId(user, customerIndex)}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="admin-customer-email-cell">
                              <span>
                                <AdminIcon name="mail" />
                              </span>
                              <strong>{user.email}</strong>
                            </div>
                          </td>
                          <td>
                            <span className={`admin-customer-role admin-customer-role-${String(user.role || "").toLowerCase()}`}>
                              <AdminIcon name="customer" />
                              {user.role === "admin" ? "Admin" : "Customer"}
                            </span>
                          </td>
                          <td>
                            <div className="admin-customer-date-cell">
                              <AdminIcon name="calendar" />
                              <div>
                                <strong>{created.date}</strong>
                                <small>{created.time}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="admin-customer-actions">
                              <button
                                type="button"
                                className="admin-customer-role-button"
                                onClick={() => onRoleChange(user.id, nextRole)}
                              >
                                Set {nextRole === "admin" ? "Admin" : "Customer"}
                              </button>
                              <button type="button" className="admin-more-button" aria-label="More customer actions">
                                <AdminIcon name="more" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="admin-section admin-orders-section">
              <div className="admin-orders-header">
                <div>
                  <span>Orders</span>
                  <h3>Orders</h3>
                  <p>Manage and track all customer orders in one place.</p>
                </div>
                <div className="admin-orders-header-actions">
                  <button type="button" className="admin-export-button" onClick={onExportOrders}>
                    <AdminIcon name="download" />
                    <span>Export</span>
                  </button>
                  <button
                    type="button"
                    className="admin-new-order-button"
                    onClick={() => setMessage("New orders are created from customer checkout.")}
                  >
                    <AdminIcon name="plus" />
                    <span>New Order</span>
                  </button>
                </div>
              </div>

              <div className="admin-order-toolbar">
                <label className="admin-product-search admin-order-search">
                  <AdminIcon name="search" />
                  <input
                    placeholder="Search orders..."
                    value={orderSearch}
                    onChange={(event) => setOrderSearch(event.target.value)}
                  />
                </label>
                <select
                  className="admin-product-filter admin-order-filter"
                  value={orderStatusFilter}
                  onChange={(event) => setOrderStatusFilter(event.target.value)}
                >
                  <option value="">All statuses</option>
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button type="button" className="admin-filter-button admin-order-filter-button">
                  <AdminIcon name="filter" />
                  <span>Filter</span>
                </button>
              </div>

              <div className="table-wrap admin-orders-table-wrap">
                <table className="admin-orders-table">
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
                    {filteredOrders.map((order) => {
                      const placed = formatOrderDateParts(order.createdAt);
                      return (
                        <tr key={order.id}>
                          <td>
                            <div className="admin-order-number-cell">
                              <span className="admin-order-icon">
                                <AdminIcon name="orders" />
                              </span>
                              <strong>{getOrderNumber(order)}</strong>
                              <button
                                type="button"
                                className="admin-copy-button"
                                onClick={() => onCopyOrderNumber(order)}
                                aria-label={`Copy ${getOrderNumber(order)}`}
                              >
                                <AdminIcon name="copy" />
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="admin-order-customer-cell">
                              <span className="admin-order-customer-avatar">
                                <AdminIcon name="customer" />
                              </span>
                              <div>
                                <strong>{getOrderCustomerEmail(order)}</strong>
                                <small>{getOrderCustomer(order) === getOrderCustomerEmail(order) ? "Customer" : getOrderCustomer(order)}</small>
                              </div>
                            </div>
                          </td>
                          <td className="admin-order-total">{formatMoney(order.total)}</td>
                          <td>
                            <span className={`admin-order-status admin-order-status-${String(order.status || "").toLowerCase()}`}>
                              <span />
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <div className="admin-order-date-cell">
                              <AdminIcon name="calendar" />
                              <div>
                                <strong>{placed.date}</strong>
                                <small>{placed.time}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="admin-order-actions">
                              <select
                                value={order.status}
                                onChange={(event) => onOrderStatusChange(order.id, event.target.value)}
                              >
                                {ORDER_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                              <button type="button" className="admin-more-button" aria-label="More order actions">
                                <AdminIcon name="more" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}

const CATALOG_VERSION = 10;
const { COMPUTER_PRODUCTS, ICT_PRODUCTS, HOSTING_PRODUCTS } = require("./products");

const CATEGORY_TREE = [
  {
    name: "Computers",
    defaultType: "physical",
    subcategories: ["Laptops", "Desktops", "Components", "Monitors", "Computer Bundles"]
  },
  {
    name: "ICT Products",
    defaultType: "physical",
    subcategories: [
      "Accessories",
      "Storage Devices",
      "Printers & Scanners",
      "Networking Equipment",
      "Power & Protection",
      "Audio & Video",
      "Smart Devices",
      "Office Equipment",
      "Security Products"
    ]
  },
  {
    name: "Web Hosting Services",
    defaultType: "service",
    subcategories: [
      "Hosting Packages",
      "Domain Services",
      "Website Services",
      "Email Hosting",
      "Server Services",
      "Security Services",
      "Cloud Services",
      "Developer Services",
      "Ecommerce Services"
    ]
  }
];

const CATEGORY_ALIASES = {
  "ICT Accessories": "ICT Products",
  "Networking Devices": "ICT Products",
  Software: "ICT Products",
  "Web Hosting": "Web Hosting Services"
};

const SUBCATEGORY_ALIASES = {
  Computers: {
    "Gaming Laptops": "Laptops",
    Workstations: "Desktops",
    "All-in-One PCs": "Desktops"
  },
  "ICT Products": {
    Keyboards: "Accessories",
    "Pointing Devices": "Accessories",
    Accessories: "Accessories",
    Storage: "Storage Devices",
    Switches: "Networking Equipment",
    Routers: "Networking Equipment",
    Productivity: "Office Equipment",
    Security: "Security Products"
  },
  "Web Hosting Services": {
    "Shared Hosting": "Hosting Packages",
    "VPS Hosting": "Server Services",
    "Business Hosting": "Cloud Services",
    Domain: "Domain Services"
  }
};

const DEMO_PRODUCTS = [
  ...COMPUTER_PRODUCTS,
  ...ICT_PRODUCTS,
  ...HOSTING_PRODUCTS,
];

const PRODUCT_IMAGE_PATHS = new Map(
  DEMO_PRODUCTS.map((product) => [product.name.toLowerCase(), product.imagePath])
);

function getLocalProductImage(product = {}) {
  if (product.imagePath) {
    return product.imagePath;
  }

  const exactImage = PRODUCT_IMAGE_PATHS.get(String(product.name || "").toLowerCase());
  if (exactImage) {
    return exactImage;
  }

  const haystack = [
    product.name,
    product.description,
    product.category,
    product.subcategory,
    product.type,
    product.brand,
    product.provider,
    ...(Array.isArray(product.badges) ? product.badges : [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const category = normalizeCategory(product.category);
  const subcategory = String(product.subcategory || "").trim();

  if (category === "Web Hosting Services") {
    const subcategoryImages = {
      "Hosting Packages": "/images/bluehost-basic-shared-hosting.jpg",
      "Domain Services": "/images/cloudflare-registrar-domain-registration.jpg",
      "Website Services": "/images/wix-core-plan.jpg",
      "Email Hosting": "/images/google-workspace-business-starter.jpg",
      "Server Services": "/images/digitalocean-basic-droplet.jpg",
      "Security Services": "/images/cloudflare-pro-plan.jpg",
      "Cloud Services": "/images/aws-lightsail-linux-instance.jpg",
      "Developer Services": "/images/digitalocean-basic-droplet.jpg",
      "Ecommerce Services": "/images/shopify-basic-plan.jpg"
    };
    return subcategoryImages[subcategory] || "/images/bluehost-basic-shared-hosting.jpg";
  }

  if (category === "ICT Products") {
    const subcategoryImages = {
      Accessories: "/images/logitech-mx-keys-s-wireless-keyboard.jpg",
      "Storage Devices": "/images/samsung-t7-shield-2tb-portable-ssd.jpg",
      "Printers & Scanners": "/images/canon-pixma-g6040-megatank-printer.jpg",
      "Networking Equipment": "/images/cisco-catalyst-1300-24t-4g-switch.jpg",
      "Power & Protection": "/images/apc-back-ups-bx1200mi-1200va.jpg",
      "Audio & Video": "/images/jabra-speak-510-conference-speakerphone.jpg",
      "Smart Devices": "/images/samsung-galaxy-tab-s9-fe-10-9-inch.jpg",
      "Office Equipment": "/images/microsoft-365-business-basic.jpg",
      "Security Products": "/images/hikvision-ds-2cd2143g2-i-acusense-dome-camera.jpg"
    };
    return subcategoryImages[subcategory] || "/images/ict.jpg";
  }

  if (category === "Computers") {
    if (subcategory === "Components") {
      return hasAny(haystack, ["ssd", "nvme"]) ? "/images/samsung-990-pro-2tb-nvme-ssd.jpg" : "/images/kingston-fury-beast-32gb-ddr5-kit.jpg";
    }
    if (subcategory === "Monitors") {
      return hasAny(haystack, ["asus", "proart"]) ? "/images/asus-proart-display-pa278cv.jpg" : "/images/dell-ultrasharp-u2723qe-27-inch-4k-usb-c-monitor.jpg";
    }
    if (subcategory === "Laptops") {
      return "/images/lenovo-thinkpad-x1-carbon-gen-12.jpg";
    }
    if (subcategory === "Desktops") {
      return hasAny(haystack, ["workstation", "z2"]) ? "/images/hp-z2-tower-g9-workstation.jpg" : "/images/dell-optiplex-7020-tower.jpg";
    }
    return "/images/dell-optiplex-7020-tower.jpg";
  }

  return "/images/tech-e-comm.jpg";
}

function hasAny(value, terms) {
  return terms.some((term) => value.includes(term));
}

function getCategory(categoryName) {
  return CATEGORY_TREE.find((entry) => entry.name === categoryName);
}

function getCategoryNames() {
  return CATEGORY_TREE.map((entry) => entry.name);
}

function getSubcategories(categoryName) {
  return getCategory(categoryName)?.subcategories || [];
}

function normalizeCategory(category) {
  const trimmed = String(category || "").trim();
  return CATEGORY_ALIASES[trimmed] || trimmed;
}

function normalizeSubcategory(category, subcategory) {
  const normalizedCategory = normalizeCategory(category);
  const trimmed = String(subcategory || "").trim();
  const mapped = SUBCATEGORY_ALIASES[normalizedCategory]?.[trimmed] || trimmed;
  const allowed = getSubcategories(normalizedCategory);
  return allowed.includes(mapped) ? mapped : allowed[0] || mapped || "General";
}

function normalizeProductTaxonomy(product) {
  let category = normalizeCategory(product.category);
  let subcategory = String(product.subcategory || "").trim();

  if (category === "ICT Products" && subcategory === "Monitors") {
    category = "Computers";
  }

  subcategory = normalizeSubcategory(category, subcategory || product.category);
  const defaultType = getCategory(category)?.defaultType || "physical";
  const type = product.type === "service" || defaultType === "service" ? "service" : "physical";

  return { category, subcategory, type };
}

function isValidCategory(category) {
  return getCategoryNames().includes(category);
}

function isValidSubcategory(category, subcategory) {
  return getSubcategories(category).includes(subcategory);
}

function deriveAvailabilityStatus(type, stock, fallback = "") {
  if (fallback) {
    return String(fallback).trim();
  }

  if (type === "service") {
    return "Available";
  }

  return Number(stock || 0) > 0 ? "In Stock" : "Out of Stock";
}

function buildSpecifications(product, type, availabilityStatus) {
  const brand = product.brand || product.provider || "";
  const brandLabel = type === "service" ? "Provider" : "Brand";
  const baseSpecs = [
    brand ? { label: brandLabel, value: brand } : null,
    { label: "Category", value: product.category },
    { label: "Subcategory", value: product.subcategory },
    { label: "Availability", value: availabilityStatus }
  ].filter(Boolean);

  const extraSpecs = Array.isArray(product.specifications) ? product.specifications : [];
  return [...baseSpecs, ...extraSpecs];
}

function buildDemoProducts(timestamp, idFactory) {
  const baseTime = Date.parse(timestamp) || Date.now();

  return DEMO_PRODUCTS.map((product, index) => {
    const type = product.type || getCategory(product.category)?.defaultType || "physical";
    const stock = type === "service" ? 0 : Number(product.stock || 0);
    const availabilityStatus = deriveAvailabilityStatus(type, stock, product.availabilityStatus);
    const imageUrl = getLocalProductImage(product);
    const createdAt = new Date(baseTime - index * 60 * 1000).toISOString();
    const brand = product.brand || product.provider || "";

    return {
      id: idFactory(),
      type,
      rating: Number((4.3 + (index % 6) * 0.1).toFixed(1)),
      reviewsCount: 42 + index * 8,
      popularity: 95 - (index % 10) * 4,
      discountPercent: index % 7 === 0 ? 6 : 0,
      isFeatured: index < 9,
      createdAt,
      updatedAt: createdAt,
      ...product,
      sourceId: product.id || "",
      id: idFactory(),
      brand,
      provider: product.provider || brand,
      availabilityStatus,
      imageUrl,
      gallery: [imageUrl],
      specifications: buildSpecifications(product, type, availabilityStatus),
      stock
    };
  });
}

module.exports = {
  CATALOG_VERSION,
  CATEGORY_TREE,
  buildDemoProducts,
  deriveAvailabilityStatus,
  getLocalProductImage,
  getCategory,
  getCategoryNames,
  getSubcategories,
  isValidCategory,
  isValidSubcategory,
  normalizeProductTaxonomy
};



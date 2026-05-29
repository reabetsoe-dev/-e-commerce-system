const express = require("express");
const { v4: uuid } = require("uuid");
const { adminOnly, authRequired } = require("../middleware/auth");
const { nowIso, readDb, writeDb, getOrCreateRecentView } = require("../data/store");
const {
  CATEGORY_TREE,
  deriveAvailabilityStatus,
  getCategory,
  getCategoryNames,
  getLocalProductImage,
  getSubcategories,
  isValidCategory,
  isValidSubcategory
} = require("../data/catalog");

const router = express.Router();

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function normalizeSpecs(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        label: String(item.label || "").trim(),
        value: String(item.value || "").trim()
      }))
      .filter((item) => item.label && item.value);
  }
  return [];
}

function normalizeGallery(imageUrl) {
  return [String(imageUrl).trim()];
}

router.get("/meta/categories", async (req, res) => {
  const db = await readDb();
  const categories = getCategoryNames();
  const subcategories = CATEGORY_TREE.reduce((acc, category) => {
    acc[category.name] = category.subcategories;
    return acc;
  }, {});
  const types = Array.from(new Set(db.products.map((product) => product.type))).sort();

  return res.json({ categories, subcategories, categoryTree: CATEGORY_TREE, types });
});

router.get("/hosting-plans", async (req, res) => {
  const db = await readDb();
  const plans = db.products
    .filter((product) => product.category === "Web Hosting Services")
    .sort((a, b) => a.price - b.price);

  return res.json({ plans });
});

router.get("/", async (req, res) => {
  const {
    search,
    category,
    subcategory,
    type,
    minPrice,
    maxPrice,
    sort,
    featured,
    page = 1,
    pageSize = 24
  } = req.query;

  const db = await readDb();
  let products = [...db.products];

  if (search) {
    const searchTerm = String(search).toLowerCase().trim();
    products = products.filter((product) => {
      const haystack = [
        product.name,
        product.description,
        product.category,
        product.subcategory,
        product.type,
        product.brand,
        product.provider,
        ...(product.badges || []),
        ...(product.specifications || []).map((spec) => `${spec.label} ${spec.value}`)
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchTerm);
    });
  }

  if (category) {
    const categoryFilter = String(category).toLowerCase().trim();
    products = products.filter(
      (product) => String(product.category).toLowerCase() === categoryFilter
    );
  }

  if (subcategory) {
    const subcategoryFilter = String(subcategory).toLowerCase().trim();
    products = products.filter(
      (product) => String(product.subcategory).toLowerCase() === subcategoryFilter
    );
  }

  if (type) {
    const typeFilter = String(type).toLowerCase().trim();
    products = products.filter((product) => String(product.type).toLowerCase() === typeFilter);
  }

  if (featured === "true") {
    products = products.filter((product) => Boolean(product.isFeatured));
  }

  const parsedMin = Number(minPrice);
  const parsedMax = Number(maxPrice);

  if (!Number.isNaN(parsedMin)) {
    products = products.filter((product) => product.price >= parsedMin);
  }

  if (!Number.isNaN(parsedMax)) {
    products = products.filter((product) => product.price <= parsedMax);
  }

  if (sort === "price_asc") {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === "price_desc") {
    products.sort((a, b) => b.price - a.price);
  } else if (sort === "name_asc") {
    products.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "rating_desc") {
    products.sort((a, b) => b.rating - a.rating);
  } else if (sort === "popularity_desc") {
    products.sort((a, b) => b.popularity - a.popularity);
  } else {
    products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const parsedPage = Math.max(1, Math.trunc(Number(page) || 1));
  const parsedPageSize = Math.min(60, Math.max(1, Math.trunc(Number(pageSize) || 24)));
  const start = (parsedPage - 1) * parsedPageSize;
  const pagedProducts = products.slice(start, start + parsedPageSize);

  return res.json({
    products: pagedProducts,
    count: products.length,
    page: parsedPage,
    pageSize: parsedPageSize,
    totalPages: Math.ceil(products.length / parsedPageSize)
  });
});

router.get("/:id", async (req, res) => {
  const db = await readDb();
  const product = db.products.find((entry) => entry.id === req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  const related = db.products
    .filter(
      (entry) =>
        entry.id !== product.id &&
        (entry.category === product.category || entry.subcategory === product.subcategory)
    )
    .slice(0, 6);

  return res.json({ product, related });
});

router.post("/:id/view", authRequired, async (req, res) => {
  const db = await readDb();
  const product = db.products.find((entry) => entry.id === req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  const recent = getOrCreateRecentView(db, req.user.id);
  recent.productIds = [
    product.id,
    ...recent.productIds.filter((entry) => entry !== product.id)
  ].slice(0, 12);

  await writeDb(db);
  return res.json({ message: "View tracked." });
});

router.post("/", authRequired, adminOnly, async (req, res) => {
  const {
    name,
    description,
    category,
    brand,
    provider,
    type,
    subcategory,
    price,
    stock,
    availabilityStatus,
    rating,
    reviewsCount,
    popularity,
    discountPercent,
    isFeatured,
    badges,
    specifications
  } = req.body;

  const finalName = String(name || "").trim();
  const finalCategory = String(category || "").trim();
  const finalSubcategory = String(subcategory || "").trim();
  const finalBrand = String(brand || provider || "").trim();
  const finalProvider = String(provider || brand || "").trim();
  const productType =
    type === "service" || getCategory(finalCategory)?.defaultType === "service"
      ? "service"
      : "physical";
  const requiresStock = productType !== "service";

  if (!finalName || price === undefined || price === "" || !finalCategory || !finalSubcategory) {
    return res
      .status(400)
      .json({ message: "Name, price, category, and subcategory are required." });
  }

  if (!isValidCategory(finalCategory)) {
    return res.status(400).json({
      message: `Category must be one of: ${getCategoryNames().join(", ")}.`
    });
  }

  if (!isValidSubcategory(finalCategory, finalSubcategory)) {
    return res.status(400).json({
      message: `Subcategory must be one of: ${getSubcategories(finalCategory).join(", ")}.`
    });
  }

  if (requiresStock && (stock === undefined || stock === "")) {
    return res.status(400).json({ message: "Stock is required for physical products." });
  }

  const parsedPrice = Number(price);
  const parsedStock = requiresStock ? Number(stock) : 0;
  if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ message: "Price must be a valid number." });
  }

  if (requiresStock && (Number.isNaN(parsedStock) || parsedStock < 0)) {
    return res.status(400).json({ message: "Stock must be a valid number." });
  }

  const timestamp = nowIso();
  const finalDescription = String(description || "").trim();
  const finalAvailabilityStatus = deriveAvailabilityStatus(
    productType,
    productType === "service" ? 0 : Math.max(0, Math.trunc(parsedStock)),
    availabilityStatus
  );
  const finalImage = getLocalProductImage({
    name: finalName,
    description: finalDescription,
    category: finalCategory,
    subcategory: finalSubcategory,
    type: productType,
    brand: finalBrand,
    provider: finalProvider,
    badges
  });

  const product = {
    id: uuid(),
    name: finalName,
    description: finalDescription,
    category: finalCategory,
    brand: finalBrand,
    provider: finalProvider,
    type: productType,
    subcategory: finalSubcategory,
    price: Number(parsedPrice.toFixed(2)),
    stock: productType === "service" ? 0 : Math.max(0, Math.trunc(parsedStock)),
    availabilityStatus: finalAvailabilityStatus,
    imageUrl: finalImage,
    gallery: normalizeGallery(finalImage),
    rating: Number(toNumber(rating, 4.5).toFixed(1)),
    reviewsCount: Math.max(0, Math.trunc(toNumber(reviewsCount, 0))),
    popularity: Math.max(0, Math.trunc(toNumber(popularity, 50))),
    discountPercent: Math.max(0, Math.min(90, Math.trunc(toNumber(discountPercent, 0)))),
    isFeatured: Boolean(isFeatured),
    badges: Array.isArray(badges)
      ? badges.map((entry) => String(entry).trim()).filter(Boolean)
      : [],
    specifications: normalizeSpecs(specifications),
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const db = await readDb();
  db.products.push(product);
  await writeDb(db);
  return res.status(201).json({ message: "Product created successfully.", product });
});

router.put("/:id", authRequired, adminOnly, async (req, res) => {
  const db = await readDb();
  const product = db.products.find((entry) => entry.id === req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  const updates = req.body || {};
  const nextCategory =
    updates.category !== undefined ? String(updates.category).trim() : product.category;
  let nextSubcategory =
    updates.subcategory !== undefined
      ? String(updates.subcategory).trim()
      : product.subcategory;

  if (updates.category !== undefined && updates.subcategory === undefined) {
    nextSubcategory = getSubcategories(nextCategory)[0] || "";
  }

  const nextType =
    updates.type === "service" || getCategory(nextCategory)?.defaultType === "service"
      ? "service"
      : "physical";

  if (!isValidCategory(nextCategory)) {
    return res.status(400).json({
      message: `Category must be one of: ${getCategoryNames().join(", ")}.`
    });
  }

  if (!isValidSubcategory(nextCategory, nextSubcategory)) {
    return res.status(400).json({
      message: `Subcategory must be one of: ${getSubcategories(nextCategory).join(", ")}.`
    });
  }

  if (updates.name !== undefined) {
    if (!String(updates.name).trim()) {
      return res.status(400).json({ message: "Product name is required." });
    }
    product.name = String(updates.name).trim();
  }
  if (updates.description !== undefined) {
    product.description = String(updates.description).trim();
  }
  if (updates.brand !== undefined) {
    product.brand = String(updates.brand).trim();
  }
  if (updates.provider !== undefined) {
    product.provider = String(updates.provider).trim();
  }
  if (updates.category !== undefined) {
    product.category = nextCategory;
  }
  if (updates.type !== undefined) {
    product.type = nextType;
  }
  if (updates.subcategory !== undefined) {
    product.subcategory = nextSubcategory;
  }
  if (updates.price !== undefined) {
    if (updates.price === "") {
      return res.status(400).json({ message: "Price is required." });
    }
    const parsedPrice = Number(updates.price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: "Price must be a valid number." });
    }
    product.price = Number(parsedPrice.toFixed(2));
  }
  if (updates.stock !== undefined) {
    if (nextType !== "service" && updates.stock === "") {
      return res.status(400).json({ message: "Stock is required for physical products." });
    }
    const parsedStock = Number(updates.stock);
    if (nextType !== "service" && (Number.isNaN(parsedStock) || parsedStock < 0)) {
      return res.status(400).json({ message: "Stock must be a valid number." });
    }
    product.stock = nextType === "service" ? 0 : Math.max(0, Math.trunc(parsedStock));
  }
  if (updates.category !== undefined || updates.subcategory !== undefined || updates.type !== undefined) {
    product.category = nextCategory;
    product.subcategory = nextSubcategory;
    product.type = nextType;
  }
  if (nextType === "service") {
    product.stock = 0;
  }
  if (updates.availabilityStatus !== undefined) {
    product.availabilityStatus = String(updates.availabilityStatus).trim();
  }
  product.availabilityStatus = deriveAvailabilityStatus(
    product.type,
    product.stock,
    updates.availabilityStatus !== undefined ? product.availabilityStatus : ""
  );
  product.imageUrl = getLocalProductImage(product);
  product.gallery = normalizeGallery(product.imageUrl);
  if (updates.rating !== undefined) {
    product.rating = Number(toNumber(updates.rating, product.rating).toFixed(1));
  }
  if (updates.reviewsCount !== undefined) {
    product.reviewsCount = Math.max(0, Math.trunc(toNumber(updates.reviewsCount, 0)));
  }
  if (updates.popularity !== undefined) {
    product.popularity = Math.max(0, Math.trunc(toNumber(updates.popularity, 0)));
  }
  if (updates.discountPercent !== undefined) {
    product.discountPercent = Math.max(
      0,
      Math.min(90, Math.trunc(toNumber(updates.discountPercent, product.discountPercent)))
    );
  }
  if (updates.isFeatured !== undefined) {
    product.isFeatured = Boolean(updates.isFeatured);
  }
  if (updates.badges !== undefined) {
    product.badges = Array.isArray(updates.badges)
      ? updates.badges.map((entry) => String(entry).trim()).filter(Boolean)
      : [];
  }
  if (updates.specifications !== undefined) {
    product.specifications = normalizeSpecs(updates.specifications);
  }

  product.updatedAt = nowIso();
  await writeDb(db);
  return res.json({ message: "Product updated successfully.", product });
});

router.delete("/:id", authRequired, adminOnly, async (req, res) => {
  const db = await readDb();
  const productIndex = db.products.findIndex((entry) => entry.id === req.params.id);
  if (productIndex === -1) {
    return res.status(404).json({ message: "Product not found." });
  }

  const [deletedProduct] = db.products.splice(productIndex, 1);
  db.carts.forEach((cart) => {
    cart.items = cart.items.filter((item) => item.productId !== deletedProduct.id);
  });
  db.wishlists.forEach((wishlist) => {
    wishlist.productIds = wishlist.productIds.filter((id) => id !== deletedProduct.id);
  });
  db.recentViews.forEach((recent) => {
    recent.productIds = recent.productIds.filter((id) => id !== deletedProduct.id);
  });
  await writeDb(db);
  return res.json({ message: "Product deleted successfully." });
});

module.exports = router;

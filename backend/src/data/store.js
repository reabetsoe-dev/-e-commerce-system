const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const { v4: uuid } = require("uuid");
const { DATABASE_URL, PG_SSL } = require("../config");
const {
  CATALOG_VERSION,
  buildDemoProducts,
  deriveAvailabilityStatus,
  getLocalProductImage,
  normalizeProductTaxonomy
} = require("./catalog");

const DB_PATH = path.join(__dirname, "../../data/db.json");

const REQUIRED_KEYS = [
  "users",
  "products",
  "carts",
  "orders",
  "wishlists",
  "passwordResets",
  "recentViews"
];

let pool;
let initialized = false;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: PG_SSL ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

function nowIso() {
  return new Date().toISOString();
}

function toIso(value) {
  if (!value) {
    return nowIso();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date(value).toISOString();
}

function seedProducts() {
  return buildDemoProducts(nowIso(), uuid);
}

function createSeedData() {
  const timestamp = nowIso();
  const adminId = uuid();
  const userId = uuid();

  return {
    catalogVersion: CATALOG_VERSION,
    users: [
      {
        id: adminId,
        name: "System Admin",
        email: "admin@datamak.local",
        passwordHash: bcrypt.hashSync("Admin@123", 10),
        role: "admin",
        createdAt: timestamp,
        updatedAt: timestamp
      },
      {
        id: userId,
        name: "Sample Customer",
        email: "customer@datamak.local",
        passwordHash: bcrypt.hashSync("Customer@123", 10),
        role: "customer",
        createdAt: timestamp,
        updatedAt: timestamp
      }
    ],
    products: seedProducts(),
    carts: [{ userId, items: [] }],
    orders: [],
    wishlists: [{ userId, productIds: [] }],
    passwordResets: [],
    recentViews: [{ userId, productIds: [] }]
  };
}

function isValidDbShape(db) {
  return db && REQUIRED_KEYS.every((key) => Array.isArray(db[key]));
}

function readLegacyJsonData() {
  if (!fs.existsSync(DB_PATH)) {
    return createSeedData();
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    return isValidDbShape(parsed) ? normalizeDb(parsed) : createSeedData();
  } catch (error) {
    return createSeedData();
  }
}

function normalizeProduct(product) {
  const normalized = { ...product };
  const taxonomy = normalizeProductTaxonomy(normalized);
  normalized.category = taxonomy.category;
  normalized.subcategory = taxonomy.subcategory;
  normalized.type = taxonomy.type;
  normalized.brand = String(normalized.brand || normalized.provider || "").trim();
  normalized.provider = String(normalized.provider || normalized.brand || "").trim();
  normalized.imageUrl = getLocalProductImage(normalized);
  normalized.gallery = [normalized.imageUrl];
  normalized.stock =
    normalized.type === "service"
      ? 0
      : Math.max(0, Math.trunc(Number(normalized.stock) || 0));
  normalized.availabilityStatus = deriveAvailabilityStatus(
    normalized.type,
    normalized.stock,
    normalized.availabilityStatus || normalized.availability_status
  );
  normalized.rating = Number(normalized.rating || 4.5);
  normalized.reviewsCount = Number(normalized.reviewsCount || normalized.reviews_count || 0);
  normalized.popularity = Number(normalized.popularity || 50);
  normalized.discountPercent = Number(
    normalized.discountPercent || normalized.discount_percent || 0
  );
  normalized.isFeatured = Boolean(normalized.isFeatured ?? normalized.is_featured);
  normalized.badges = Array.isArray(normalized.badges) ? normalized.badges : [];
  normalized.specifications = Array.isArray(normalized.specifications)
    ? normalized.specifications
    : [];
  normalized.updatedAt = normalized.updatedAt || normalized.updated_at || normalized.createdAt || nowIso();
  normalized.createdAt = normalized.createdAt || normalized.created_at || normalized.updatedAt;
  return normalized;
}

function migrateCatalogProducts(db) {
  const timestamp = nowIso();
  db.products = buildDemoProducts(timestamp, uuid);
  db.carts = db.carts.map((cart) => ({ ...cart, items: [] }));
  db.wishlists = db.wishlists.map((wishlist) => ({ ...wishlist, productIds: [] }));
  db.recentViews = db.recentViews.map((recentView) => ({ ...recentView, productIds: [] }));

  db.catalogVersion = CATALOG_VERSION;
  return db;
}

function normalizeDb(db) {
  const normalized = { ...db };
  REQUIRED_KEYS.forEach((key) => {
    if (!Array.isArray(normalized[key])) {
      normalized[key] = [];
    }
  });

  normalized.catalogVersion = Number(normalized.catalogVersion ?? 0);
  normalized.users = normalized.users.map((user) => ({
    ...user,
    updatedAt: user.updatedAt || user.updated_at || user.createdAt || nowIso(),
    createdAt: user.createdAt || user.created_at || nowIso()
  }));

  normalized.products = normalized.products.map(normalizeProduct);
  normalized.carts = normalized.carts.map((cart) => ({
    userId: cart.userId || cart.user_id,
    items: Array.isArray(cart.items)
      ? cart.items
          .map((item) => ({
            productId: item.productId || item.product_id,
            quantity: Math.max(1, Math.trunc(Number(item.quantity) || 1))
          }))
          .filter((item) => item.productId)
      : []
  }));

  normalized.wishlists = normalized.wishlists.map((entry) => ({
    userId: entry.userId || entry.user_id,
    productIds: Array.from(new Set(Array.isArray(entry.productIds) ? entry.productIds : []))
  }));

  normalized.recentViews = normalized.recentViews.map((entry) => ({
    userId: entry.userId || entry.user_id,
    productIds: Array.from(new Set(Array.isArray(entry.productIds) ? entry.productIds : [])).slice(
      0,
      20
    )
  }));

  normalized.passwordResets = normalized.passwordResets.filter(
    (entry) => entry && entry.token && (entry.userId || entry.user_id)
  );

  return normalized;
}

async function createSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'customer')),
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('physical', 'service')),
      subcategory TEXT NOT NULL,
      brand TEXT NOT NULL DEFAULT '',
      provider TEXT NOT NULL DEFAULT '',
      price NUMERIC(12, 2) NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      availability_status TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
      rating NUMERIC(3, 1) NOT NULL DEFAULT 4.5,
      reviews_count INTEGER NOT NULL DEFAULT 0,
      popularity INTEGER NOT NULL DEFAULT 50,
      discount_percent INTEGER NOT NULL DEFAULT 0,
      is_featured BOOLEAN NOT NULL DEFAULT false,
      badges JSONB NOT NULL DEFAULT '[]'::jsonb,
      specifications JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS carts (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      user_id UUID NOT NULL REFERENCES carts(user_id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      PRIMARY KEY (user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS wishlists (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
      user_id UUID NOT NULL REFERENCES wishlists(user_id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      position INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS recent_views (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS recent_view_items (
      user_id UUID NOT NULL REFERENCES recent_views(user_id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      position INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      items JSONB NOT NULL DEFAULT '[]'::jsonb,
      totals JSONB NOT NULL DEFAULT '{}'::jsonb,
      total NUMERIC(12, 2) NOT NULL,
      status TEXT NOT NULL,
      status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
      payment JSONB NOT NULL DEFAULT '{}'::jsonb,
      shipping_address TEXT NOT NULL DEFAULT '',
      billing_address TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  `);

  await client.query(`
    ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT NOT NULL DEFAULT '';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT '';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT '';
  `);
}

async function replaceDb(client, sourceDb) {
  const db = normalizeDb(sourceDb);
  const userIds = new Set(db.users.map((user) => user.id));
  const productIdSet = new Set(db.products.map((product) => product.id));

  await client.query("BEGIN");
  try {
    await client.query(`
      TRUNCATE TABLE
        cart_items,
        wishlist_items,
        recent_view_items,
        password_resets,
        orders,
        carts,
        wishlists,
        recent_views,
        products,
        users
      CASCADE
    `);

    for (const user of db.users) {
      await client.query(
        `INSERT INTO users
          (id, name, email, password_hash, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          user.id,
          user.name,
          user.email,
          user.passwordHash,
          user.role,
          user.createdAt,
          user.updatedAt
        ]
      );
    }

    for (const product of db.products) {
      await client.query(
        `INSERT INTO products
          (
            id, name, description, category, type, subcategory, brand, provider, price,
            stock, availability_status, image_url, gallery, rating, reviews_count, popularity,
            discount_percent, is_featured,
            badges, specifications, created_at, updated_at
          )
         VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15,
           $16, $17, $18, $19::jsonb, $20::jsonb, $21, $22)`,
        [
          product.id,
          product.name,
          product.description,
          product.category,
          product.type,
          product.subcategory,
          product.brand,
          product.provider,
          product.price,
          product.stock,
          product.availabilityStatus,
          product.imageUrl,
          JSON.stringify(product.gallery || []),
          product.rating,
          product.reviewsCount,
          product.popularity,
          product.discountPercent,
          product.isFeatured,
          JSON.stringify(product.badges || []),
          JSON.stringify(product.specifications || []),
          product.createdAt,
          product.updatedAt
        ]
      );
    }

    const cartMap = new Map(db.carts.map((cart) => [cart.userId, cart.items || []]));
    for (const user of db.users) {
      const cartItems = cartMap.get(user.id) || [];
      await client.query("INSERT INTO carts (user_id) VALUES ($1)", [user.id]);
      for (const item of cartItems) {
        if (!productIdSet.has(item.productId)) {
          continue;
        }
        await client.query(
          `INSERT INTO cart_items (user_id, product_id, quantity)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
          [user.id, item.productId, item.quantity]
        );
      }
    }

    const wishlistMap = new Map(
      db.wishlists.map((wishlist) => [wishlist.userId, wishlist.productIds || []])
    );
    for (const user of db.users) {
      const productIds = wishlistMap.get(user.id) || [];
      await client.query("INSERT INTO wishlists (user_id) VALUES ($1)", [user.id]);
      for (let index = 0; index < productIds.length; index += 1) {
        if (!productIdSet.has(productIds[index])) {
          continue;
        }
        await client.query(
          `INSERT INTO wishlist_items (user_id, product_id, position)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, product_id) DO UPDATE SET position = EXCLUDED.position`,
          [user.id, productIds[index], index]
        );
      }
    }

    const recentMap = new Map(
      db.recentViews.map((recent) => [recent.userId, recent.productIds || []])
    );
    for (const user of db.users) {
      const productIds = recentMap.get(user.id) || [];
      await client.query("INSERT INTO recent_views (user_id) VALUES ($1)", [user.id]);
      for (let index = 0; index < productIds.length; index += 1) {
        if (!productIdSet.has(productIds[index])) {
          continue;
        }
        await client.query(
          `INSERT INTO recent_view_items (user_id, product_id, position)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, product_id) DO UPDATE SET position = EXCLUDED.position`,
          [user.id, productIds[index], index]
        );
      }
    }

    for (const reset of db.passwordResets) {
      if (!userIds.has(reset.userId || reset.user_id)) {
        continue;
      }
      await client.query(
        `INSERT INTO password_resets
          (id, user_id, token, expires_at, used_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          reset.id || uuid(),
          reset.userId || reset.user_id,
          reset.token,
          reset.expiresAt || reset.expires_at,
          reset.usedAt || reset.used_at || null,
          reset.createdAt || reset.created_at || nowIso()
        ]
      );
    }

    for (const order of db.orders) {
      if (!userIds.has(order.userId || order.user_id)) {
        continue;
      }
      await client.query(
        `INSERT INTO orders
          (
            id, order_number, user_id, items, totals, total, status, status_history,
            payment, shipping_address, billing_address, created_at, updated_at
          )
         VALUES
          ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8::jsonb, $9::jsonb, $10, $11, $12, $13)`,
        [
          order.id,
          order.orderNumber || order.order_number,
          order.userId || order.user_id,
          JSON.stringify(order.items || []),
          JSON.stringify(order.totals || {}),
          order.total,
          order.status,
          JSON.stringify(order.statusHistory || order.status_history || []),
          JSON.stringify(order.payment || {}),
          order.shippingAddress || order.shipping_address || "",
          order.billingAddress || order.billing_address || "",
          order.createdAt || order.created_at || nowIso(),
          order.updatedAt || order.updated_at || nowIso()
        ]
      );
    }

    await client.query(
      `INSERT INTO app_meta (key, value)
       VALUES ('catalogVersion', $1::jsonb)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [JSON.stringify(db.catalogVersion || CATALOG_VERSION)]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function ensureDb() {
  if (initialized) {
    return;
  }

  const client = await getPool().connect();
  try {
    await createSchema(client);
    const { rows } = await client.query("SELECT COUNT(*)::int AS count FROM users");
    if (rows[0].count === 0) {
      await replaceDb(client, readLegacyJsonData());
    }
    initialized = true;
  } finally {
    client.release();
  }
}

async function readPostgresDb() {
  const client = await getPool().connect();
  try {
    const usersResult = await client.query("SELECT * FROM users ORDER BY created_at ASC");
    const productsResult = await client.query("SELECT * FROM products ORDER BY created_at DESC");
    const cartsResult = await client.query("SELECT * FROM carts ORDER BY created_at ASC");
    const cartItemsResult = await client.query("SELECT * FROM cart_items");
    const ordersResult = await client.query("SELECT * FROM orders ORDER BY created_at DESC");
    const wishlistsResult = await client.query("SELECT * FROM wishlists ORDER BY created_at ASC");
    const wishlistItemsResult = await client.query(
      "SELECT * FROM wishlist_items ORDER BY position ASC"
    );
    const passwordResetsResult = await client.query(
      "SELECT * FROM password_resets ORDER BY created_at DESC"
    );
    const recentViewsResult = await client.query(
      "SELECT * FROM recent_views ORDER BY created_at ASC"
    );
    const recentViewItemsResult = await client.query(
      "SELECT * FROM recent_view_items ORDER BY position ASC"
    );
    const metaResult = await client.query(
      "SELECT value FROM app_meta WHERE key = 'catalogVersion'"
    );

    const users = usersResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at)
    }));

    const products = productsResult.rows.map((row) =>
      normalizeProduct({
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        type: row.type,
        subcategory: row.subcategory,
        brand: row.brand,
        provider: row.provider,
        price: Number(row.price),
        stock: Number(row.stock),
        availabilityStatus: row.availability_status,
        imageUrl: row.image_url,
        gallery: row.gallery,
        rating: Number(row.rating),
        reviewsCount: Number(row.reviews_count),
        popularity: Number(row.popularity),
        discountPercent: Number(row.discount_percent),
        isFeatured: row.is_featured,
        badges: row.badges,
        specifications: row.specifications,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at)
      })
    );

    const cartMap = new Map(
      cartsResult.rows.map((row) => [row.user_id, { userId: row.user_id, items: [] }])
    );
    users.forEach((user) => {
      if (!cartMap.has(user.id)) {
        cartMap.set(user.id, { userId: user.id, items: [] });
      }
    });
    cartItemsResult.rows.forEach((row) => {
      if (cartMap.has(row.user_id)) {
        cartMap.get(row.user_id).items.push({
          productId: row.product_id,
          quantity: Number(row.quantity)
        });
      }
    });

    const wishlistMap = new Map(
      wishlistsResult.rows.map((row) => [row.user_id, { userId: row.user_id, productIds: [] }])
    );
    users.forEach((user) => {
      if (!wishlistMap.has(user.id)) {
        wishlistMap.set(user.id, { userId: user.id, productIds: [] });
      }
    });
    wishlistItemsResult.rows.forEach((row) => {
      if (wishlistMap.has(row.user_id)) {
        wishlistMap.get(row.user_id).productIds.push(row.product_id);
      }
    });

    const recentMap = new Map(
      recentViewsResult.rows.map((row) => [row.user_id, { userId: row.user_id, productIds: [] }])
    );
    users.forEach((user) => {
      if (!recentMap.has(user.id)) {
        recentMap.set(user.id, { userId: user.id, productIds: [] });
      }
    });
    recentViewItemsResult.rows.forEach((row) => {
      if (recentMap.has(row.user_id)) {
        recentMap.get(row.user_id).productIds.push(row.product_id);
      }
    });

    const orders = ordersResult.rows.map((row) => ({
      id: row.id,
      orderNumber: row.order_number,
      userId: row.user_id,
      items: row.items || [],
      totals: row.totals || {},
      total: Number(row.total),
      status: row.status,
      statusHistory: row.status_history || [],
      payment: row.payment || {},
      shippingAddress: row.shipping_address,
      billingAddress: row.billing_address,
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at)
    }));

    const passwordResets = passwordResetsResult.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: toIso(row.expires_at),
      usedAt: row.used_at ? toIso(row.used_at) : undefined,
      createdAt: toIso(row.created_at)
    }));

    return normalizeDb({
      catalogVersion: Number(metaResult.rows[0]?.value ?? 0),
      users,
      products,
      carts: Array.from(cartMap.values()),
      orders,
      wishlists: Array.from(wishlistMap.values()),
      passwordResets,
      recentViews: Array.from(recentMap.values())
    });
  } finally {
    client.release();
  }
}

async function readDb() {
  await ensureDb();
  const db = await readPostgresDb();
  if (db.catalogVersion !== CATALOG_VERSION) {
    migrateCatalogProducts(db);
    await writeDb(db);
  }
  return db;
}

async function writeDb(db) {
  await ensureDb();
  const client = await getPool().connect();
  try {
    await replaceDb(client, db);
  } finally {
    client.release();
  }
}

async function withDb(mutator) {
  const db = await readDb();
  const result = await mutator(db);
  await writeDb(db);
  return result;
}

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function getOrCreateCart(db, userId) {
  let cart = db.carts.find((entry) => entry.userId === userId);
  if (!cart) {
    cart = { userId, items: [] };
    db.carts.push(cart);
  }
  return cart;
}

function getOrCreateWishlist(db, userId) {
  let wishlist = db.wishlists.find((entry) => entry.userId === userId);
  if (!wishlist) {
    wishlist = { userId, productIds: [] };
    db.wishlists.push(wishlist);
  }
  return wishlist;
}

function getOrCreateRecentView(db, userId) {
  let recentView = db.recentViews.find((entry) => entry.userId === userId);
  if (!recentView) {
    recentView = { userId, productIds: [] };
    db.recentViews.push(recentView);
  }
  return recentView;
}

function calculateCartTotals(cartItems, products) {
  const detailedItems = cartItems
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return null;
      }
      const listPrice = Number(product.price || 0);
      const discountPercent = Number(product.discountPercent || 0);
      const unitPrice = Number((listPrice * (1 - discountPercent / 100)).toFixed(2));
      const subtotal = Number((unitPrice * item.quantity).toFixed(2));
      return {
        productId: product.id,
        name: product.name,
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        provider: product.provider,
        type: product.type,
        listPrice,
        price: unitPrice,
        discountPercent,
        quantity: item.quantity,
        stock: product.stock,
        availabilityStatus: product.availabilityStatus,
        imageUrl: product.imageUrl,
        subtotal
      };
    })
    .filter(Boolean);

  const total = Number(detailedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));

  return { items: detailedItems, total };
}

module.exports = {
  nowIso,
  readDb,
  writeDb,
  withDb,
  sanitizeUser,
  getOrCreateCart,
  getOrCreateWishlist,
  getOrCreateRecentView,
  calculateCartTotals
};

const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const { HOST, PORT } = require("./config");
const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const wishlistRoutes = require("./routes/wishlist");
const uploadsRoutes = require("./routes/uploads");
const { authRequired } = require("./middleware/auth");
const { readDb } = require("./data/store");

const app = express();

app.use(
  cors({
    origin: "*"
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/images", express.static(path.join(__dirname, "../../web/public/images")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "group-project-2026-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/cart", authRequired, cartRoutes);
app.use("/api", authRequired, orderRoutes);
app.use("/api", authRequired, wishlistRoutes);
app.use("/api/uploads", authRequired, uploadsRoutes);
app.use("/api/admin", authRequired, adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found." });
});

app.use((error, req, res, next) => {
  console.error(error);
  return res.status(500).json({ message: "Internal server error." });
});

async function start() {
  await readDb();
  app.listen(PORT, HOST, () => {
    const displayHost = HOST === "0.0.0.0" ? "localhost" : HOST;
    console.log(`Backend server running on http://${displayHost}:${PORT}`);
    if (HOST === "0.0.0.0") {
      console.log("Backend is listening on all network interfaces for Expo Go.");
    }
  });
}

start().catch((error) => {
  console.error("Failed to start backend server:", error.message);
  process.exit(1);
});

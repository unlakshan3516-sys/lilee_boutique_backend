require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const productsRouter = require("./routes/products");
const cartRouter = require("./routes/cart");
const checkoutRouter = require("./routes/checkout");
const ordersRouter = require("./routes/orders");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || true, // reflect request origin in dev; set explicitly in production
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve the admin panel's static files (simple HTML/JS, no build step)
app.use("/admin", express.static(path.join(__dirname, "public/admin")));

app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/orders", ordersRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`lilee boutique backend running on port ${PORT}`);
});

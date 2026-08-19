const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const db = require("../db/connection");

const CART_COOKIE = "lilee_cart_id";

// Ensures every visitor has a cart row, identified by a cookie.
// This is what makes the cart "real" — it lives in the database,
// not in the visitor's browser, so it can't just vanish.
function ensureCart(req, res) {
  let cartId = req.cookies[CART_COOKIE];
  const existing = cartId && db.prepare("SELECT id FROM carts WHERE id = ?").get(cartId);

  if (!existing) {
    cartId = crypto.randomUUID();
    db.prepare("INSERT INTO carts (id) VALUES (?)").run(cartId);
    res.cookie(CART_COOKIE, cartId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
    });
  }
  return cartId;
}

function getCartWithDetails(cartId) {
  const items = db.prepare(`
    SELECT ci.id, ci.product_id, ci.size, ci.qty,
           p.name, p.price, p.fabric, p.art
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = ?
  `).all(cartId);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return { items, subtotal, count: items.reduce((sum, i) => sum + i.qty, 0) };
}

// GET /api/cart — current visitor's cart contents
router.get("/", (req, res) => {
  const cartId = ensureCart(req, res);
  res.json(getCartWithDetails(cartId));
});

// POST /api/cart — add an item { productId, size, qty }
router.post("/", (req, res) => {
  const cartId = ensureCart(req, res);
  const { productId, size, qty } = req.body;

  if (!productId || !size || !qty || qty < 1) {
    return res.status(400).json({ error: "productId, size, and qty are required" });
  }

  const product = db.prepare("SELECT id FROM products WHERE id = ? AND active = 1").get(productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const existing = db.prepare(
    "SELECT id, qty FROM cart_items WHERE cart_id = ? AND product_id = ? AND size = ?"
  ).get(cartId, productId, size);

  if (existing) {
    db.prepare("UPDATE cart_items SET qty = ? WHERE id = ?").run(existing.qty + qty, existing.id);
  } else {
    db.prepare("INSERT INTO cart_items (cart_id, product_id, size, qty) VALUES (?, ?, ?, ?)")
      .run(cartId, productId, size, qty);
  }

  res.json(getCartWithDetails(cartId));
});

// PUT /api/cart/:itemId — update quantity { qty }
router.put("/:itemId", (req, res) => {
  const cartId = ensureCart(req, res);
  const { qty } = req.body;

  if (qty <= 0) {
    db.prepare("DELETE FROM cart_items WHERE id = ? AND cart_id = ?").run(req.params.itemId, cartId);
  } else {
    db.prepare("UPDATE cart_items SET qty = ? WHERE id = ? AND cart_id = ?")
      .run(qty, req.params.itemId, cartId);
  }
  res.json(getCartWithDetails(cartId));
});

// DELETE /api/cart/:itemId — remove one line item
router.delete("/:itemId", (req, res) => {
  const cartId = ensureCart(req, res);
  db.prepare("DELETE FROM cart_items WHERE id = ? AND cart_id = ?").run(req.params.itemId, cartId);
  res.json(getCartWithDetails(cartId));
});

// DELETE /api/cart — clear the whole cart
router.delete("/", (req, res) => {
  const cartId = ensureCart(req, res);
  db.prepare("DELETE FROM cart_items WHERE cart_id = ?").run(cartId);
  res.json(getCartWithDetails(cartId));
});

module.exports = router;

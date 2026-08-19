const express = require("express");
const router = express.Router();
const db = require("../db/connection");

const CART_COOKIE = "lilee_cart_id";

// POST /api/checkout — creates a real order from the current cart.
// Phase 1: Cash on Delivery / Bank Transfer only. A card payment gateway
// (PayHere, Stripe, etc.) can be added here later without changing the
// front end much — this endpoint is the seam where that would plug in.
router.post("/", (req, res) => {
  const cartId = req.cookies[CART_COOKIE];
  if (!cartId) return res.status(400).json({ error: "No cart found" });

  const items = db.prepare(`
    SELECT ci.product_id, ci.size, ci.qty, p.name, p.price
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = ?
  `).all(cartId);

  if (items.length === 0) {
    return res.status(400).json({ error: "Your bag is empty" });
  }

  const { name, email, phone, address, paymentMethod } = req.body;
  if (!name || !email || !address) {
    return res.status(400).json({ error: "Name, email, and shipping address are required" });
  }

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const createOrder = db.transaction(() => {
    const orderResult = db.prepare(`
      INSERT INTO orders (customer_name, customer_email, customer_phone, shipping_address, payment_method, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, email, phone || "", address, paymentMethod || "cod", total);

    const orderId = orderResult.lastInsertRowid;
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, size, qty, price)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const i of items) {
      insertItem.run(orderId, i.product_id, i.name, i.size, i.qty, i.price);
    }

    // Empty the cart now that it's been turned into an order
    db.prepare("DELETE FROM cart_items WHERE cart_id = ?").run(cartId);

    return orderId;
  });

  const orderId = createOrder();
  res.status(201).json({ ok: true, orderId, total });
});

// GET /api/checkout/:orderId — order confirmation lookup
router.get("/:orderId", (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(req.params.orderId);
  res.json({ ...order, items });
});

module.exports = router;

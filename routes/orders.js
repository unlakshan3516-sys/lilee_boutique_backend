const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const { requireAdmin } = require("./admin-auth");

// GET /api/orders — admin-only list of all orders
router.get("/", requireAdmin, (req, res) => {
  const orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?");
  res.json(orders.map(o => ({ ...o, items: items.all(o.id) })));
});

// PUT /api/orders/:id — admin updates order status (e.g. "shipped")
router.put("/:id", requireAdmin, (req, res) => {
  const { status } = req.body;
  const result = db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Order not found" });
  res.json({ ok: true });
});

module.exports = router;

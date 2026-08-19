const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const { requireAdmin } = require("./admin-auth");

function attachSizes(product) {
  const sizes = db.prepare("SELECT size, in_stock FROM product_sizes WHERE product_id = ?").all(product.id);
  return { ...product, sizes };
}

// GET /api/products — list all active products (used by the shop homepage)
router.get("/", (req, res) => {
  const products = db.prepare("SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC").all();
  res.json(products.map(attachSizes));
});

// GET /api/products/:id — single product detail (used by the product page)
router.get("/:id", (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ? AND active = 1").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(attachSizes(product));
});

// ---- Admin-only routes below (require basic auth) ----

// POST /api/products — create a new product
router.post("/", requireAdmin, (req, res) => {
  const p = req.body;
  if (!p.id || !p.name || !p.price) {
    return res.status(400).json({ error: "id, name, and price are required" });
  }
  try {
    db.prepare(`
      INSERT INTO products (id, name, price, tag, fabric, description, composition, origin, care, fit, art)
      VALUES (@id, @name, @price, @tag, @fabric, @description, @composition, @origin, @care, @fit, @art)
    `).run({
      id: p.id, name: p.name, price: p.price, tag: p.tag || "",
      fabric: p.fabric || "", description: p.description || "",
      composition: p.composition || "", origin: p.origin || "",
      care: p.care || "", fit: p.fit || "", art: p.art || ""
    });
    if (Array.isArray(p.sizes)) {
      const insertSize = db.prepare("INSERT INTO product_sizes (product_id, size, in_stock) VALUES (?, ?, ?)");
      for (const s of p.sizes) insertSize.run(p.id, s.size, s.in_stock ? 1 : 0);
    }
    res.status(201).json({ ok: true, id: p.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/products/:id — update an existing product
router.put("/:id", requireAdmin, (req, res) => {
  const p = req.body;
  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found" });

  db.prepare(`
    UPDATE products SET name=@name, price=@price, tag=@tag, fabric=@fabric,
      description=@description, composition=@composition, origin=@origin,
      care=@care, fit=@fit, art=@art WHERE id=@id
  `).run({ ...p, id: req.params.id });

  if (Array.isArray(p.sizes)) {
    db.prepare("DELETE FROM product_sizes WHERE product_id = ?").run(req.params.id);
    const insertSize = db.prepare("INSERT INTO product_sizes (product_id, size, in_stock) VALUES (?, ?, ?)");
    for (const s of p.sizes) insertSize.run(req.params.id, s.size, s.in_stock ? 1 : 0);
  }
  res.json({ ok: true });
});

// DELETE /api/products/:id — soft-delete (hides from shop, keeps order history intact)
router.delete("/:id", requireAdmin, (req, res) => {
  const result = db.prepare("UPDATE products SET active = 0 WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Product not found" });
  res.json({ ok: true });
});

module.exports = router;

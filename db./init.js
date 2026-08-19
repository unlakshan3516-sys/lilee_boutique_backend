/* ============================================================
   lilee boutique — DATABASE SETUP
   Run this once with: npm run seed
   It creates lilee.db (a single SQLite file) with all tables,
   and loads your starting products into it.

   After this runs, products are managed through the admin
   panel (/admin) instead of by editing a file.
   ============================================================ */

const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "lilee.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    tag TEXT DEFAULT '',
    fabric TEXT NOT NULL,
    description TEXT NOT NULL,
    composition TEXT NOT NULL,
    origin TEXT NOT NULL,
    care TEXT NOT NULL,
    fit TEXT NOT NULL,
    art TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS product_sizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    size TEXT NOT NULL,
    in_stock INTEGER DEFAULT 1,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS carts (
    id TEXT PRIMARY KEY,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    size TEXT NOT NULL,
    qty INTEGER NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address TEXT NOT NULL,
    payment_method TEXT DEFAULT 'cod',
    status TEXT DEFAULT 'pending',
    total REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    size TEXT NOT NULL,
    qty INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );
`);

// --- Seed starting products (same catalog as before) ---
const seedProducts = [
  {
    id: "weekday-tee",
    name: "Cotton Weekday Tee",
    price: 68,
    tag: "New",
    fabric: "100% Cotton",
    description: "A heavyweight cotton tee built for daily rotation — dense enough to hold its shape wash after wash, soft enough to wear straight off the line.",
    composition: "100% Cotton",
    origin: "Cut & Sewn — Porto, PT",
    care: "Cold Wash, Line Dry",
    fit: "True to Size, Relaxed",
    art: `<path d="M30 20 L45 10 L75 10 L90 20 L108 32 L98 55 L82 45 L82 135 L38 135 L38 45 L22 55 L12 32 Z" stroke="#2b1a10" stroke-width="1.3"/>`,
    sizes: [
      { size: "XS", in_stock: 1 }, { size: "S", in_stock: 1 }, { size: "M", in_stock: 1 },
      { size: "L", in_stock: 1 }, { size: "XL", in_stock: 1 }
    ]
  },
  {
    id: "cotton-crewneck",
    name: "Cotton Crewneck",
    price: 118,
    tag: "",
    fabric: "100% Cotton",
    description: "A brushed cotton crewneck with a substantial hand-feel — layers cleanly under the overshirt or stands alone on its own.",
    composition: "100% Cotton",
    origin: "Cut & Sewn — Porto, PT",
    care: "Cold Wash, Line Dry",
    fit: "True to Size, Relaxed",
    art: `<path d="M35 15 H85 V30 H95 L100 60 H85 V135 H35 V60 H20 L25 30 H35 Z" stroke="#2b1a10" stroke-width="1.3"/><line x1="60" y1="30" x2="60" y2="135" stroke="#8c7256" stroke-width="0.6" stroke-dasharray="2 4"/>`,
    sizes: [
      { size: "XS", in_stock: 0 }, { size: "S", in_stock: 1 }, { size: "M", in_stock: 1 },
      { size: "L", in_stock: 1 }, { size: "XL", in_stock: 1 }
    ]
  },
  {
    id: "linen-trouser",
    name: "Linen Tapered Trouser",
    price: 168,
    tag: "",
    fabric: "100% Linen",
    description: "A tapered linen trouser cut for warm-weather tailoring — breathable, softly structured, and finished with a clean waistband.",
    composition: "100% Linen",
    origin: "Cut & Sewn — Porto, PT",
    care: "Cold Wash, Line Dry, Warm Iron",
    fit: "True to Size, Tapered Leg",
    art: `<path d="M40 12 H80 L84 30 H36 Z" stroke="#2b1a10" stroke-width="1.3"/><path d="M42 30 H78 L80 140 H40 Z" stroke="#2b1a10" stroke-width="1.3"/><line x1="60" y1="30" x2="60" y2="140" stroke="#8c7256" stroke-width="0.6" stroke-dasharray="2 4"/>`,
    sizes: [
      { size: "28", in_stock: 0 }, { size: "30", in_stock: 1 }, { size: "32", in_stock: 1 },
      { size: "34", in_stock: 1 }, { size: "36", in_stock: 1 }
    ]
  },
  {
    id: "linen-overshirt",
    name: "Linen Overshirt",
    price: 188,
    tag: "Restock",
    fabric: "100% Linen",
    description: "A relaxed linen overshirt, structured enough to layer over a tee, soft enough to wear on its own once the weather turns.",
    composition: "100% Linen",
    origin: "Cut & Sewn — Porto, PT",
    care: "Cold Wash, Line Dry, Warm Iron",
    fit: "True to Size, Relaxed",
    art: `<path d="M25 25 L60 12 L95 25 L100 60 L85 65 L88 135 H32 L35 65 L20 60 Z" stroke="#2b1a10" stroke-width="1.3"/>`,
    sizes: [
      { size: "S", in_stock: 1 }, { size: "M", in_stock: 1 },
      { size: "L", in_stock: 1 }, { size: "XL", in_stock: 1 }
    ]
  }
];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (id, name, price, tag, fabric, description, composition, origin, care, fit, art)
  VALUES (@id, @name, @price, @tag, @fabric, @description, @composition, @origin, @care, @fit, @art)
`);
const insertSize = db.prepare(`
  INSERT INTO product_sizes (product_id, size, in_stock) VALUES (?, ?, ?)
`);

const alreadySeeded = db.prepare("SELECT COUNT(*) as c FROM products").get().c > 0;

if (!alreadySeeded) {
  const insertAll = db.transaction((products) => {
    for (const p of products) {
      insertProduct.run(p);
      for (const s of p.sizes) {
        insertSize.run(p.id, s.size, s.in_stock);
      }
    }
  });
  insertAll(seedProducts);
  console.log(`Seeded ${seedProducts.length} products into lilee.db`);
} else {
  console.log("Products already exist — skipping seed. Delete lilee.db to reseed from scratch.");
}

db.close();

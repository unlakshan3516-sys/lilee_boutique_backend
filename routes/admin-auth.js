/* Simple HTTP Basic Auth for the admin routes.
   Credentials come from environment variables — set these in your .env file.
   This is intentionally lightweight since it's a single-owner shop, not a
   multi-user system. For anything customer-facing, no auth is required. */

function requireAdmin(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Basic ")) {
    res.set("WWW-Authenticate", 'Basic realm="lilee boutique admin"');
    return res.status(401).json({ error: "Admin login required" });
  }

  const decoded = Buffer.from(header.split(" ")[1], "base64").toString("utf8");
  const [user, pass] = decoded.split(":");

  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPass = process.env.ADMIN_PASS || "changeme";

  if (user === expectedUser && pass === expectedPass) {
    return next();
  }

  res.set("WWW-Authenticate", 'Basic realm="lilee boutique admin"');
  return res.status(401).json({ error: "Invalid credentials" });
}

module.exports = { requireAdmin };

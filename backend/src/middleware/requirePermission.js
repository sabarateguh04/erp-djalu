// Must run after requireAuth (needs req.role). Blocks the request unless the
// caller's role has the exact permission code or the super-permission "*".
export default function requirePermission(code) {
  return (req, res, next) => {
    const permissions = req.role?.permissions || [];
    if (permissions.includes("*") || permissions.includes(code)) {
      return next();
    }
    res.status(403).json({ error: "Anda tidak punya akses ke modul ini" });
  };
}

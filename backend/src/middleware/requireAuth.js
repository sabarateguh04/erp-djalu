import { getSessions, saveSessions, getUsers, getRoles, sanitizeUser } from "../lib/authStore.js";

// Reads "Authorization: Bearer <token>", resolves it against sessions.json,
// and attaches req.user / req.role / req.session when valid.
export default async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Token tidak ditemukan" });
    }

    const sessions = await getSessions();
    const session = sessions.find((s) => s.token === token);
    if (!session) {
      return res.status(401).json({ error: "Sesi tidak valid atau kadaluarsa" });
    }
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await saveSessions(sessions.filter((s) => s.token !== token));
      return res.status(401).json({ error: "Sesi tidak valid atau kadaluarsa" });
    }

    const users = await getUsers();
    const user = users.find((u) => u.id === session.userId && !u.deletedAt);
    if (!user) {
      return res.status(401).json({ error: "Sesi tidak valid atau kadaluarsa" });
    }
    // Re-check status on every request (not just at login) — kalau admin
    // menonaktifkan user, akses harus putus seketika, bukan nunggu token
    // lama expired (sampai 7 hari).
    if (user.status !== "Aktif") {
      await saveSessions(sessions.filter((s) => s.token !== token));
      return res.status(403).json({ error: "Akun nonaktif" });
    }

    const roles = await getRoles();
    const role = roles.find((r) => r.id === user.roleId) || { permissions: [] };

    req.user = sanitizeUser(user);
    req.role = role;
    req.session = session;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

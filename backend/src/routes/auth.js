import { Router } from "express";
import { randomUUID, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import {
  getUsers,
  saveUsers,
  getRoles,
  getSessions,
  saveSessions,
  getSettings,
  sanitizeUser,
  avatarInisial,
} from "../lib/authStore.js";
import requireAuth from "../middleware/requireAuth.js";
import { logActivity } from "../lib/activityLogger.js";

const router = Router();

const USERNAME_RE = /^[a-z0-9_.]{4,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

function findByIdentifier(users, identifier) {
  const needle = String(identifier || "").toLowerCase();
  return users.find(
    (u) => !u.deletedAt && (u.username.toLowerCase() === needle || u.email.toLowerCase() === needle)
  );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { nama, email, username, password, confirmPassword } = req.body || {};

    if (!nama || !email || !username || !password || !confirmPassword) {
      return res.status(400).json({ error: "Semua field wajib diisi" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password minimal 8 karakter" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Konfirmasi password tidak cocok" });
    }
    const usernameNormalized = String(username).toLowerCase().trim();
    if (!USERNAME_RE.test(usernameNormalized)) {
      return res
        .status(400)
        .json({ error: "Username harus 4-20 karakter huruf kecil/angka tanpa spasi" });
    }
    const emailNormalized = String(email).toLowerCase().trim();
    if (!EMAIL_RE.test(emailNormalized)) {
      return res.status(400).json({ error: "Format email tidak valid" });
    }

    const users = await getUsers();
    if (users.some((u) => u.username.toLowerCase() === usernameNormalized)) {
      return res.status(400).json({ error: "Username sudah dipakai" });
    }
    if (users.some((u) => u.email.toLowerCase() === emailNormalized)) {
      return res.status(400).json({ error: "Email sudah dipakai" });
    }

    const settings = await getSettings();
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const newUser = {
      id: randomUUID(),
      nama: nama.trim(),
      username: usernameNormalized,
      email: emailNormalized,
      passwordHash,
      roleId: settings.defaultRoleId,
      avatarInisial: avatarInisial(nama),
      status: settings.requireApproval ? "Menunggu Verifikasi" : "Aktif",
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    users.unshift(newUser);
    await saveUsers(users);
    await logActivity(newUser, "auth", "create", newUser.id, `Registrasi user baru: ${newUser.nama} (${newUser.username})`);

    res.status(201).json(sanitizeUser(newUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ error: "Identifier dan password wajib diisi" });
    }

    const users = await getUsers();
    const user = findByIdentifier(users, identifier);
    if (!user) {
      return res.status(401).json({ error: "Username/email atau password salah" });
    }
    if (user.status === "Menunggu Verifikasi") {
      return res.status(403).json({ error: "Akun belum diverifikasi, hubungi admin" });
    }
    if (user.status === "Nonaktif") {
      return res.status(403).json({ error: "Akun nonaktif" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Username/email atau password salah" });
    }

    const roles = await getRoles();
    const role = roles.find((r) => r.id === user.roleId);

    const token = randomBytes(32).toString("hex");
    const now = new Date();
    const session = {
      token,
      userId: user.id,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    };
    const sessions = await getSessions();
    sessions.push(session);
    await saveSessions(sessions);

    user.lastLoginAt = now.toISOString();
    user.updatedAt = now.toISOString();
    await saveUsers(users);
    await logActivity(sanitizeUser(user), "auth", "login", user.id, `${user.nama} login`);

    res.json({
      token,
      user: sanitizeUser(user),
      role: role ? { id: role.id, nama: role.nama, permissions: role.permissions } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const [, token] = header.split(" ");
    if (token) {
      const sessions = await getSessions();
      const session = sessions.find((s) => s.token === token);
      await saveSessions(sessions.filter((s) => s.token !== token));
      if (session) {
        const users = await getUsers();
        const user = users.find((u) => u.id === session.userId);
        if (user) await logActivity(sanitizeUser(user), "auth", "logout", user.id, `${user.nama} logout`);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  res.json({
    user: req.user,
    role: { id: req.role.id, nama: req.role.nama, permissions: req.role.permissions },
  });
});

// PUT /api/auth/me — user ubah nama/password sendiri (bukan lewat /api/users)
router.put("/me", requireAuth, async (req, res) => {
  try {
    const { nama, currentPassword, newPassword } = req.body || {};
    const users = await getUsers();
    const user = users.find((u) => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

    if (nama !== undefined && nama.trim()) {
      user.nama = nama.trim();
      user.avatarInisial = avatarInisial(user.nama);
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Password saat ini wajib diisi" });
      }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return res.status(400).json({ error: "Password saat ini salah" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password baru minimal 8 karakter" });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    user.updatedAt = new Date().toISOString();
    await saveUsers(users);
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

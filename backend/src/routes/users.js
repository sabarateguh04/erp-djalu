import { Router } from "express";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import {
  getUsers,
  saveUsers,
  getRoles,
  sanitizeUser,
  avatarInisial,
} from "../lib/authStore.js";
import requireAuth from "../middleware/requireAuth.js";
import requirePermission from "../middleware/requirePermission.js";
import { logActivity } from "../lib/activityLogger.js";

const router = Router();
const USERNAME_RE = /^[a-z0-9_.]{4,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUS = ["Aktif", "Nonaktif", "Menunggu Verifikasi"];

router.use(requireAuth, requirePermission("users:manage"));

// GET /api/users?includeDeleted=1
router.get("/", async (req, res) => {
  try {
    const users = await getUsers();
    const list = req.query.includeDeleted ? users : users.filter((u) => !u.deletedAt);
    res.json(list.map(sanitizeUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users — dibuat langsung oleh admin (tanpa alur approval)
router.post("/", async (req, res) => {
  try {
    const { nama, email, username, password, roleId, status } = req.body || {};
    if (!nama || !email || !username || !password || !roleId) {
      return res.status(400).json({ error: "Nama, email, username, password, dan role wajib diisi" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password minimal 8 karakter" });
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

    const roles = await getRoles();
    if (!roles.some((r) => r.id === roleId)) {
      return res.status(400).json({ error: "Role tidak ditemukan" });
    }

    const users = await getUsers();
    if (users.some((u) => u.username.toLowerCase() === usernameNormalized)) {
      return res.status(400).json({ error: "Username sudah dipakai" });
    }
    if (users.some((u) => u.email.toLowerCase() === emailNormalized)) {
      return res.status(400).json({ error: "Email sudah dipakai" });
    }

    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: randomUUID(),
      nama: nama.trim(),
      username: usernameNormalized,
      email: emailNormalized,
      passwordHash,
      roleId,
      avatarInisial: avatarInisial(nama),
      status: VALID_STATUS.includes(status) ? status : "Aktif",
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    users.unshift(newUser);
    await saveUsers(users);
    await logActivity(req.user, "auth", "create", newUser.id, `Menambahkan user: ${newUser.nama}`);
    res.status(201).json(sanitizeUser(newUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id — update profil, ubah role, approve/nonaktifkan, reset password
router.put("/:id", async (req, res) => {
  try {
    const users = await getUsers();
    const user = users.find((u) => u.id === req.params.id);
    if (!user || user.deletedAt) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    const { nama, email, username, roleId, status, password } = req.body || {};
    const oldStatus = user.status;

    // Cegah last active Super Admin kehilangan akses lewat PUT ini (nonaktif
    // atau ganti role) — DELETE sudah punya guard serupa, PUT belum.
    const allRoles = await getRoles();
    const currentRole = allRoles.find((r) => r.id === user.roleId);
    if (currentRole?.isSystemRole && user.status === "Aktif") {
      const activeSuperAdmins = users.filter(
        (u) => !u.deletedAt && u.status === "Aktif" && u.roleId === currentRole.id
      );
      const losingStatus = status !== undefined && status !== "Aktif";
      const losingRole = roleId !== undefined && roleId !== user.roleId;
      if (activeSuperAdmins.length <= 1 && (losingStatus || losingRole)) {
        return res.status(400).json({ error: "Tidak bisa menonaktifkan/mengubah role satu-satunya Super Admin aktif" });
      }
    }

    if (username !== undefined) {
      const usernameNormalized = String(username).toLowerCase().trim();
      if (!USERNAME_RE.test(usernameNormalized)) {
        return res
          .status(400)
          .json({ error: "Username harus 4-20 karakter huruf kecil/angka tanpa spasi" });
      }
      if (users.some((u) => u.id !== user.id && u.username.toLowerCase() === usernameNormalized)) {
        return res.status(400).json({ error: "Username sudah dipakai" });
      }
      user.username = usernameNormalized;
    }

    if (email !== undefined) {
      const emailNormalized = String(email).toLowerCase().trim();
      if (!EMAIL_RE.test(emailNormalized)) {
        return res.status(400).json({ error: "Format email tidak valid" });
      }
      if (users.some((u) => u.id !== user.id && u.email.toLowerCase() === emailNormalized)) {
        return res.status(400).json({ error: "Email sudah dipakai" });
      }
      user.email = emailNormalized;
    }

    if (nama !== undefined && nama.trim()) {
      user.nama = nama.trim();
      user.avatarInisial = avatarInisial(user.nama);
    }

    if (roleId !== undefined) {
      if (!allRoles.some((r) => r.id === roleId)) {
        return res.status(400).json({ error: "Role tidak ditemukan" });
      }
      user.roleId = roleId;
    }

    if (status !== undefined) {
      if (!VALID_STATUS.includes(status)) {
        return res.status(400).json({ error: "Status tidak valid" });
      }
      user.status = status;
    }

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ error: "Password minimal 8 karakter" });
      }
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    user.updatedAt = new Date().toISOString();
    await saveUsers(users);

    const isApproval = oldStatus === "Menunggu Verifikasi" && user.status === "Aktif";
    await logActivity(
      req.user,
      "auth",
      isApproval ? "approve" : "update",
      user.id,
      isApproval ? `Approve user: ${user.nama}` : `Mengubah user: ${user.nama}`
    );
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id — soft delete
router.delete("/:id", async (req, res) => {
  try {
    const users = await getUsers();
    const user = users.find((u) => u.id === req.params.id);
    if (!user || user.deletedAt) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    const roles = await getRoles();
    const role = roles.find((r) => r.id === user.roleId);
    if (role?.isSystemRole && user.status === "Aktif") {
      const activeSuperAdmins = users.filter(
        (u) => !u.deletedAt && u.status === "Aktif" && u.roleId === role.id
      );
      if (activeSuperAdmins.length <= 1) {
        return res.status(400).json({ error: "Tidak bisa menghapus satu-satunya Super Admin aktif" });
      }
    }

    user.deletedAt = new Date().toISOString();
    user.updatedAt = user.deletedAt;
    await saveUsers(users);
    await logActivity(req.user, "auth", "delete", user.id, `Menghapus user: ${user.nama}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

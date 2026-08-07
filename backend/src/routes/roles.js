import { Router } from "express";
import { randomUUID } from "crypto";
import { getRoles, saveRoles, getUsers, getSettings } from "../lib/authStore.js";
import requireAuth from "../middleware/requireAuth.js";
import requirePermission from "../middleware/requirePermission.js";
import { logActivity } from "../lib/activityLogger.js";

const router = Router();

router.use(requireAuth, requirePermission("users:manage"));

// GET /api/roles
router.get("/", async (req, res) => {
  try {
    const roles = await getRoles();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/roles
router.post("/", async (req, res) => {
  try {
    const { nama, deskripsi, permissions } = req.body || {};
    if (!nama || !nama.trim()) {
      return res.status(400).json({ error: "Nama role wajib diisi" });
    }
    const roles = await getRoles();
    if (roles.some((r) => r.nama.toLowerCase() === nama.trim().toLowerCase())) {
      return res.status(400).json({ error: "Nama role sudah dipakai" });
    }

    const now = new Date().toISOString();
    const newRole = {
      id: randomUUID(),
      nama: nama.trim(),
      deskripsi: deskripsi || "",
      permissions: Array.isArray(permissions) ? permissions : [],
      isSystemRole: false,
      createdAt: now,
      updatedAt: now,
    };
    roles.push(newRole);
    await saveRoles(roles);
    await logActivity(req.user, "auth", "create", newRole.id, `Menambahkan role: ${newRole.nama}`);
    res.status(201).json(newRole);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/roles/:id
router.put("/:id", async (req, res) => {
  try {
    const roles = await getRoles();
    const role = roles.find((r) => r.id === req.params.id);
    if (!role) return res.status(404).json({ error: "Role tidak ditemukan" });

    const { nama, deskripsi, permissions } = req.body || {};
    if (nama !== undefined && nama.trim()) {
      if (roles.some((r) => r.id !== role.id && r.nama.toLowerCase() === nama.trim().toLowerCase())) {
        return res.status(400).json({ error: "Nama role sudah dipakai" });
      }
      role.nama = nama.trim();
    }
    if (deskripsi !== undefined) role.deskripsi = deskripsi;
    if (permissions !== undefined) {
      if (role.isSystemRole) {
        return res.status(400).json({ error: "Permission Super Admin tidak bisa diubah" });
      }
      role.permissions = Array.isArray(permissions) ? permissions : role.permissions;
    }
    role.updatedAt = new Date().toISOString();
    await saveRoles(roles);
    await logActivity(req.user, "auth", "update", role.id, `Mengubah role: ${role.nama}`);
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/roles/:id
router.delete("/:id", async (req, res) => {
  try {
    const roles = await getRoles();
    const role = roles.find((r) => r.id === req.params.id);
    if (!role) return res.status(404).json({ error: "Role tidak ditemukan" });

    if (role.isSystemRole) {
      return res.status(400).json({ error: "Role sistem tidak boleh dihapus" });
    }

    const settings = await getSettings();
    if (settings.defaultRoleId === role.id) {
      return res.status(400).json({ error: "Role ini dipakai sebagai role default user baru" });
    }

    const users = await getUsers();
    if (users.some((u) => !u.deletedAt && u.roleId === role.id)) {
      return res.status(400).json({ error: "Role masih dipakai oleh user, ubah role user tersebut dulu" });
    }

    await saveRoles(roles.filter((r) => r.id !== role.id));
    await logActivity(req.user, "auth", "delete", role.id, `Menghapus role: ${role.nama}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

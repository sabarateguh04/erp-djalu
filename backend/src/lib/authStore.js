import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../../data/auth");

function fileFor(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readJson(name, fallback) {
  try {
    const raw = await readFile(fileFor(name), "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJson(name, data) {
  await ensureDir();
  await writeFile(fileFor(name), JSON.stringify(data, null, 2), "utf-8");
}

// ---- Users ----
export const getUsers = () => readJson("users", []);
export const saveUsers = (users) => writeJson("users", users);

// ---- Roles ----
export const getRoles = () => readJson("roles", []);
export const saveRoles = (roles) => writeJson("roles", roles);

// ---- Sessions ----
export const getSessions = () => readJson("sessions", []);
export const saveSessions = (sessions) => writeJson("sessions", sessions);

// ---- Settings ----
export const getSettings = () => readJson("settings", { requireApproval: true, defaultRoleId: null });
export const saveSettings = (settings) => writeJson("settings", settings);

export function sanitizeUser(user) {
  if (!user) return user;
  const { passwordHash, ...rest } = user;
  return rest;
}

export function avatarInisial(nama) {
  if (!nama) return "??";
  const parts = nama.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Creates the default Super Admin / Manager / Staff roles, a default Super
// Admin account, and auth settings the first time the app runs — so the
// system is usable out of the box without manual seeding steps.
export async function ensureSeedData() {
  let roles = await getRoles();
  if (roles.length === 0) {
    const now = new Date().toISOString();
    roles = [
      {
        id: randomUUID(),
        nama: "Super Admin",
        deskripsi: "Akses penuh ke seluruh modul sistem",
        permissions: ["*"],
        isSystemRole: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        nama: "Manager",
        deskripsi: "Akses lihat & kelola modul operasional utama",
        permissions: [
          "dashboard",
          "karyawan:view",
          "karyawan:edit",
          "aset:view",
          "aset:edit",
          "project:view",
          "project:edit",
          "finance:view",
          "finance:edit",
          "sales:view",
          "sales:edit",
          "operasional:view",
          "operasional:edit",
          "inventory:view",
          "inventory:edit",
          "procurement:view",
          "procurement:edit",
          "crm:view",
          "crm:edit",
          "hr:view",
          "hr:edit",
          "report:view",
        ],
        isSystemRole: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        nama: "Staff",
        deskripsi: "Akses dasar, role default untuk user baru yang mendaftar",
        permissions: ["dashboard"],
        isSystemRole: false,
        createdAt: now,
        updatedAt: now,
      },
    ];
    await saveRoles(roles);
  }

  let settings = await getSettings();
  const staffRole = roles.find((r) => r.nama === "Staff") || roles[roles.length - 1];
  if (!settings || settings.defaultRoleId === undefined) {
    settings = { requireApproval: true, defaultRoleId: staffRole?.id || null };
    await saveSettings(settings);
  } else if (!settings.defaultRoleId && staffRole) {
    settings.defaultRoleId = staffRole.id;
    await saveSettings(settings);
  }

  const users = await getUsers();
  if (users.length === 0) {
    const superAdminRole = roles.find((r) => r.isSystemRole) || roles[0];
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash("Admin@123", 10);
    const admin = {
      id: randomUUID(),
      nama: "Super Admin",
      username: "superadmin",
      email: "admin@djalu.co.id",
      passwordHash,
      roleId: superAdminRole.id,
      avatarInisial: avatarInisial("Super Admin"),
      status: "Aktif",
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await saveUsers([admin]);
    console.log(
      "[auth] Akun Super Admin default dibuat -> username: superadmin | password: Admin@123 (segera ganti password ini)"
    );
  }

  const sessions = await getSessions();
  if (!Array.isArray(sessions)) {
    await saveSessions([]);
  }
}

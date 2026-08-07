import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { getUsers, getRoles } from "./authStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, "../../../data/notifications.json");

export async function getNotifications() {
  try {
    const raw = await readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

export async function saveNotifications(list) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(list, null, 2), "utf-8");
}

// Modul 14 (BIG_SCOPE_DETAIL.md): notifikasi bisa global (userId: null) atau
// khusus satu user. `icon`/`color` dipertahankan supaya kompatibel dengan
// widget notifikasi dashboard yang sudah ada.
export async function addNotification({
  userId = null,
  tipe = "info",
  text,
  link = null,
  icon = "bell",
  color = "blue",
}) {
  const list = await getNotifications();
  const notif = {
    id: randomUUID(),
    userId,
    tipe,
    text,
    link,
    icon,
    color,
    sudahDibaca: false,
    createdAt: new Date().toISOString(),
  };
  list.unshift(notif);
  await saveNotifications(list);
  return notif;
}

// Sends one notification per active user whose role has `permissionCode`
// (or "*") — e.g. notify everyone who can approve PO when one is submitted.
export async function addNotificationForPermission(permissionCode, payload) {
  const [users, roles] = await Promise.all([getUsers(), getRoles()]);
  const allowedRoleIds = new Set(
    roles.filter((r) => r.permissions.includes("*") || r.permissions.includes(permissionCode)).map((r) => r.id)
  );
  const targets = users.filter((u) => !u.deletedAt && u.status === "Aktif" && allowedRoleIds.has(u.roleId));
  for (const u of targets) {
    await addNotification({ ...payload, userId: u.id });
  }
  return targets.length;
}

// One-time migration: the app shipped with 4 static demo entries that use
// numeric ids and lack the modul-14 fields. Upgrade them in place so old and
// new entries share one consistent shape.
export async function ensureNotificationSeedShape() {
  const list = await getNotifications();
  let changed = false;
  for (const n of list) {
    if (typeof n.id === "number") {
      n.id = randomUUID();
      changed = true;
    }
    if (n.userId === undefined) {
      n.userId = null;
      changed = true;
    }
    if (n.sudahDibaca === undefined) {
      n.sudahDibaca = false;
      changed = true;
    }
    if (n.link === undefined) {
      n.link = null;
      changed = true;
    }
    if (n.tipe === undefined) {
      n.tipe = "info";
      changed = true;
    }
  }
  if (changed) await saveNotifications(list);
}

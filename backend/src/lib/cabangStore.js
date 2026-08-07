import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, "../../../data/cabang.json");

export async function getCabang() {
  try {
    const raw = await readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

export async function saveCabang(list) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(list, null, 2), "utf-8");
}

// Modul 15 (paling akhir per BIG_SCOPE_DETAIL.md) — seed 1 cabang default
// supaya dropdown cabangId di modul lain tidak kosong dari awal.
export async function ensureCabangSeed() {
  const existing = await getCabang();
  if (existing.length > 0) return;
  await saveCabang([{ id: randomUUID(), nama: "Kantor Pusat", alamat: "" }]);
}

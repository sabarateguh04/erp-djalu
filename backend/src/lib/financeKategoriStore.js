import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, "../../../data/management/finance-kategori.json");

export async function getFinanceKategori() {
  try {
    const raw = await readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

export async function saveFinanceKategori(list) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(list, null, 2), "utf-8");
}

// Seed a few sensible defaults on first run so the Finance form's kategori
// dropdown isn't empty before an admin curates it.
export async function ensureFinanceKategoriSeed() {
  const existing = await getFinanceKategori();
  if (existing.length > 0) return;
  const defaults = [
    { nama: "Penjualan Produk", kelompok: "Pemasukan" },
    { nama: "Jasa", kelompok: "Pemasukan" },
    { nama: "Gaji", kelompok: "Pengeluaran" },
    { nama: "Operasional", kelompok: "Pengeluaran" },
    { nama: "Sewa", kelompok: "Pengeluaran" },
    { nama: "Pemasaran", kelompok: "Pengeluaran" },
  ].map((d) => ({ id: randomUUID(), ...d }));
  await saveFinanceKategori(defaults);
}

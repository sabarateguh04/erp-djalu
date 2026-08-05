import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../../data");

export async function readJson(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

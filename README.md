# ERP Djalu — Dashboard Progress Development Produk (Dummy)

Replika dummy dashboard "Djalu.Co.Id Enterprise Suite" — halaman
**Dashboard > Produk > Development Progress**. Data disimpan di file JSON
(`data/`), disajikan lewat backend Express, dan dirender di frontend
React + Vite + TailwindCSS.

## Struktur

```
erp-djalu/
├── backend/    # Express API, baca file JSON dari ../data
├── frontend/   # React + Vite + Tailwind
└── data/       # "Database" dummy dalam bentuk file JSON
```

## Cara Menjalankan

Butuh Node.js 20+.

**Terminal 1 — backend (port 4000)**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — frontend (port 5173)**
```bash
cd frontend
npm install
npm run dev
```

Buka http://localhost:5173 — request ke `/api/*` otomatis di-proxy ke backend
port 4000 (lihat `frontend/vite.config.js`).

## Endpoint API

| Endpoint | Sumber data |
|---|---|
| `GET /api/summary` | `data/executive-summary.json` |
| `GET /api/products` | `data/products.json` |
| `GET /api/trend` | `data/trend.json` |
| `GET /api/notifications` | `data/notifications.json` |
| `GET /api/ai-recommendations` | `data/ai-recommendations.json` |
| `GET /api/next-release` | `data/next-release.json` |
| `GET /api/final-products` | `data/final-products.json` |

## Mengubah Data Dummy

Cukup edit file JSON di folder `data/`, lalu restart backend (`npm run dev`).
Belum ada endpoint write (read-only) di versi dummy ini.

## Scope

- 1 halaman dashboard (sidebar & topbar statis, menu lain baru styled/placeholder)
- Tanpa auth/login
- Tanpa database — file JSON sebagai sumber data

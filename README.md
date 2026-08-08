# ERP Djalu — Dummy Enterprise Suite

Replika dummy "Djalu.Co.Id Enterprise Suite" — dashboard produk + modul-modul
operasional (Inventory, Procurement, CRM, HR/Payroll, Reporting, dst).
Data disimpan di file JSON (`data/`, tanpa database), disajikan lewat backend
Express, dan dirender di frontend React + Vite + TailwindCSS. Detail scope
lengkap tiap modul ada di `BIG_SCOPE_DETAIL.md`.

## Struktur

```
erp-djalu/
├── backend/    # Express API, baca/tulis file JSON dari ../data
├── frontend/   # React + Vite + Tailwind
└── data/       # "Database" dummy dalam bentuk file JSON
```

## Cara Menjalankan

Butuh Node.js 20+.

### Opsi A — satu port saja (disarankan, terutama di server)

Backend nge-build frontend jadi file statis lalu ikut menyajikannya di port
yang sama — jadi cuma ada **1 port** yang perlu dibuka/diakses, nggak perlu
dua terminal atau khawatir soal proxy.

```bash
cd backend
npm install
npm run serve
```

Buka http://localhost:4001 (atau `$PORT` kalau di-set) — itu saja, frontend
dan API sama-sama nyala di port itu. Setiap kali ada perubahan kode di
`frontend/`, jalankan ulang `npm run serve` (atau `npm run build` di
`frontend/` lalu restart backend) supaya build statisnya ke-update.

### Opsi B — dua port terpisah (buat development aktif di frontend)

Dipakai kalau lagi aktif ngedit UI dan mau hot-reload instan tanpa build
ulang tiap ganti kode.

**Terminal 1 — backend**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — frontend**
```bash
cd frontend
npm install
npm run dev
```

Buka URL yang ditampilkan Vite (default port 5173) — request ke `/api/*`
otomatis di-proxy ke backend (lihat `frontend/vite.config.js`, sesuaikan
`target`-nya kalau port backend kamu bukan default).

---

Port backend default `4001` (bisa diubah lewat env var `PORT`). Semua
halaman butuh login (lihat bagian **Auth & RBAC** di bawah) — akun Super
Admin default dibuat otomatis saat backend pertama kali jalan.

## Auth & RBAC

Seluruh aplikasi (termasuk API) ada di balik login. Saat backend pertama kali
jalan dan `data/auth/` belum ada, backend otomatis membuat:

- 3 role default: **Super Admin** (`permissions: ["*"]`, akses penuh),
  **Manager** (akses lihat+kelola sebagian besar modul operasional), **Staff**
  (hanya `dashboard`, jadi role default user baru yang mendaftar sendiri)
- 1 akun Super Admin: `username: superadmin` / `password: Admin@123`
  (segera ganti passwordnya lewat halaman Profile setelah login pertama)

**Alur:**
- `/register` — user baru langsung masuk status **"Menunggu Verifikasi"**
  dan belum bisa login sampai di-approve Super Admin/user dengan permission
  `users:manage` lewat halaman **Kelola User** (`/management/users`) — sesuai
  flag `requireApproval: true` di `data/auth/settings.json`.
- `/login` — pakai username atau email. Sesi disimpan di `data/auth/sessions.json`
  (token berlaku 7 hari), token disimpan di `localStorage` browser supaya login
  bertahan setelah refresh.
- Sidebar otomatis menyembunyikan menu yang tidak diizinkan sesuai
  `permissions` role user yang login; akses langsung ke URL yang tidak
  diizinkan diarahkan ke halaman **403**.
- Semua route backend (dashboard, management, inventory, procurement, crm,
  hr, report, system, notifications, cabang, users, roles) dibungkus
  middleware `requireAuth` + `requirePermission(code)` — permission dicek di
  backend juga, bukan cuma disembunyikan di UI.
- **Kelola User** (`/management/users`, perlu `users:manage`): approve/
  nonaktifkan/aktifkan user, ubah role, tambah user baru langsung (tanpa
  approval), hapus (soft delete).
- **Kelola Role** (`/management/roles`, perlu `users:manage`): CRUD role +
  checklist permission per modul. Role sistem (Super Admin) tidak bisa
  dihapus/diubah permission-nya.
- **Profile** (`/profile`): user ubah nama & password sendiri.

Kode permission mengikuti `BIG_SCOPE_DETAIL.md` §0.2, mis. `karyawan:view`,
`karyawan:edit`, `inventory:edit`, `procurement:approve`, `users:manage`,
`system-log:view`, `report:view`, `cabang:manage`, dst.

## Modul yang Sudah Diimplementasikan

Selain Auth (di atas), semua modul di `BIG_SCOPE_DETAIL.md` sudah jadi:

- **Management** (`/management/karyawan|aset|operasional|project|finance|sales`) —
  CRUD dasar + field tambahan per modul (mis. Karyawan punya `gajiPokok` buat
  Payroll, Finance punya `kategoriId` yang dikelola lewat `data/management/finance-kategori.json`).
- **Inventory** (`/inventory/items`, `/inventory/movements`) — kartu stok,
  validasi stok tidak boleh minus, badge stok di bawah minimum di sidebar,
  notifikasi otomatis kalau stok menipis.
- **Procurement** (`/procurement/vendors`, `/procurement/purchase-orders`) —
  alur PO Draft → Submit → Approve/Reject (`procurement:approve`) → Terima
  Barang (otomatis bikin movement "Masuk" di Inventory).
- **CRM** (`/crm/customers`, `/crm/pipeline`) — customer + deal pipeline
  (tabel dengan dropdown ganti tahap, bukan kanban drag-drop di versi ini).
- **HR — Payroll & Absensi** (`/hr/attendance`, `/hr/payroll`) — generate
  payroll per periode otomatis dari karyawan aktif + potongan "Alpha"
  (rumus: `gajiPokok / 22 hari kerja` per hari Alpha — konstanta gampang
  diubah di `backend/src/lib/hrStore.js`), alur Draft → Disetujui → Dibayar.
- **Activity Log** (`/system-log`, perlu `system-log:view`) — semua aksi
  create/update/delete/login/approve/reject di modul lain tercatat otomatis
  lewat helper `logActivity()`.
- **Report & Export** (`/report`) — preview tabel + export CSV per modul
  dengan filter rentang tanggal, murni agregasi (tidak punya data sendiri).
- **Notifikasi** — `data/notifications.json` diperluas (userId, sudahDibaca,
  link, tipe); notifikasi otomatis untuk stok menipis, PO menunggu approval
  (dikirim ke semua user dengan `procurement:approve`), dan payroll siap
  direview. Bell icon di Topbar menampilkan daftar real & bisa ditandai dibaca.
- **Multi-cabang** (`/management/cabang`, perlu `cabang:manage`) — CRUD
  cabang + field `cabangId` di Karyawan/Aset/Finance/Inventory item. Dropdown
  "Semua Cabang" di Topbar memfilter tabel-tabel tersebut secara real (data
  lama yang belum diisi cabangnya hanya muncul saat "Semua Cabang" dipilih).

## Endpoint API

| Endpoint | Keterangan |
|---|---|
| `GET /api/summary` `/products` `/trend` `/ai-recommendations` `/next-release` `/final-products` | Data dashboard statis (`data/*.json`) |
| `POST /api/auth/register` `/login` `/logout` | Auth |
| `GET/PUT /api/auth/me` | Profil user yang sedang login |
| `GET/POST/PUT/DELETE /api/users` | Kelola user (perlu `users:manage`) |
| `GET/POST/PUT/DELETE /api/roles` | Kelola role (perlu `users:manage`) |
| `GET/POST /api/management/:category`, `PUT/DELETE /api/management/:category/:id` | CRUD Karyawan/Aset/Operasional/Project/Finance/Sales |
| `GET/POST/PUT/DELETE /api/finance-kategori` | Kategori transaksi Finance |
| `GET/POST /api/inventory/items`, `PUT/DELETE /api/inventory/items/:id`, `GET /api/inventory/items/:id/kartu-stok` | Inventory item |
| `GET/POST /api/inventory/movements` | Barang masuk/keluar |
| `GET/POST/PUT/DELETE /api/procurement/vendors` | Vendor |
| `GET/POST /api/procurement/purchase-orders`, `PUT .../submit\|approve\|reject\|receive` | Purchase Order |
| `GET/POST/PUT/DELETE /api/crm/customers` | Customer |
| `GET/POST/PUT /api/crm/pipeline`, `PUT .../tahap`, `DELETE` | Pipeline/deal |
| `GET/POST/PUT/DELETE /api/hr/attendance` | Absensi |
| `GET/POST /api/hr/payroll`, `POST .../generate`, `PUT .../:id`, `.../approve`, `.../bayar` | Payroll |
| `GET /api/system/activity-log?modul=&userId=&from=&to=` | Activity log (perlu `system-log:view`) |
| `GET /api/report/modules`, `GET /api/report/:modul?from=&to=`, `GET /api/report/:modul/export` | Report & CSV export (perlu `report:view`) |
| `GET /api/notifications`, `PUT /api/notifications/:id/read` | Notifikasi milik user yang login + global |
| `GET/POST/PUT/DELETE /api/cabang` | Cabang (perlu `cabang:manage` utk tulis) |

`:category` yang valid: `karyawan`, `aset`, `operasional`, `project`, `finance`, `sales`.
Semua endpoint di atas (kecuali `/api/auth/register` dan `/api/auth/login`) butuh
header `Authorization: Bearer <token>` dari hasil login.

## Mengubah Data Dummy

Untuk data non-auth statis (produk dashboard dll), edit langsung file JSON di
folder `data/` lalu restart backend. Untuk semua data transaksional (management,
inventory, procurement, crm, hr, user, role, cabang) sudah ada endpoint CRUD
lewat UI, jadi tidak perlu edit manual — dan sebagian besar (item, PO, karyawan
dst.) menulis snapshot harian otomatis ke folder `history/` masing-masing.

## Scope

Semua modul di `BIG_SCOPE_DETAIL.md` (Auth, Karyawan/Aset/Project/Finance/Sales,
Inventory, Procurement, CRM, Payroll & Absensi, Activity Log, Report & Export,
Notifikasi & Approval Workflow, Multi-cabang) sudah diimplementasikan.
Tanpa database — file JSON sebagai sumber data, dengan snapshot harian otomatis
di modul-modul transaksional.

**Simplifikasi yang disengaja** (karena ini dummy app JSON-only, bukan
keputusan bisnis tersembunyi):
- Notifikasi global (`userId: null`) memakai satu flag `sudahDibaca` yang
  dipakai bersama semua user — bukan status baca per-user.
- Pipeline CRM pakai tabel + dropdown ganti tahap, bukan kanban drag-drop.
- Rumus potongan payroll Alpha adalah konstanta sederhana di kode
  (`HARI_KERJA_PER_BULAN = 22`), belum ada input dari HR untuk kustomisasi.

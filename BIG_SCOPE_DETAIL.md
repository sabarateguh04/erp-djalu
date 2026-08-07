# ERP Djalu — Full Detailed Scope (v2)

Dokumen scope super detail: setiap modul dirinci sampai level field JSON, endpoint API,
halaman UI, dan business rule. Semua data tekstual/transaksional tetap di **file JSON**
(tidak ada database). Dokumen ini menggantikan/melengkapi `BIG_SCOPE.md` sebelumnya dengan
level detail yang siap langsung dieksekusi Claude Code modul per modul.

**Konvensi yang dipakai di semua modul:**
- Semua entity punya `id` (UUID), `createdAt`, `updatedAt` (ISO string)
- Semua modul transaksional punya field `tanggal` dan disimpan dengan pola:
  `data/<modul>/<entity>.json` (state terkini) + `data/<modul>/<entity>/history/<YYYY-MM-DD>.json`
  (snapshot harian, ditulis ulang tiap ada perubahan di hari itu)
- Semua endpoint list mendukung query `?search=&page=&limit=` (opsional, bisa menyusul belakangan)
- Response error konsisten: `{ "error": "pesan dalam bahasa Indonesia" }`
- Field `deletedAt` dipakai untuk **soft delete** di modul yang datanya sensitif (User, Karyawan,
  Finance) — supaya histori tidak hilang; modul lain boleh hard delete

---

## 0. MODUL AUTH — Register, Login, Session, RBAC

Ini fondasi sebelum modul lain dibatasi aksesnya. Dibuat paling detail karena jadi gerbang
semua modul lain.

### 0.1 Entity: User
File: `data/auth/users.json`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| id | string (UUID) | ✓ | |
| nama | string | ✓ | Nama lengkap |
| username | string | ✓ | Unik, lowercase, tanpa spasi, 4–20 karakter |
| email | string | ✓ | Unik, format email valid |
| passwordHash | string | ✓ | Hash bcrypt, **tidak pernah dikirim ke frontend** |
| roleId | string | ✓ | FK ke `data/auth/roles.json` |
| avatarInisial | string | — | 2 huruf inisial, auto-generate dari nama (bukan upload foto — tetap JSON-only) |
| status | enum | ✓ | `"Aktif"` \| `"Nonaktif"` \| `"Menunggu Verifikasi"` |
| lastLoginAt | string (ISO) | — | Diupdate tiap login sukses |
| createdAt / updatedAt | string (ISO) | ✓ | |
| deletedAt | string (ISO) \| null | — | Soft delete |

### 0.2 Entity: Role
File: `data/auth/roles.json`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| id | string | ✓ | |
| nama | string | ✓ | Contoh: "Direktur", "Manager Keuangan", "Staff Gudang" |
| deskripsi | string | — | |
| permissions | string[] | ✓ | Daftar kode modul yang boleh diakses, contoh: `["dashboard","karyawan","finance:view","finance:edit"]` |
| isSystemRole | boolean | ✓ | `true` untuk role default (Super Admin) yang tidak boleh dihapus |
| createdAt / updatedAt | string | ✓ | |

**Skema permission code** (per modul, granular view vs edit):
```
dashboard
karyawan:view / karyawan:edit
aset:view / aset:edit
project:view / project:edit
finance:view / finance:edit
sales:view / sales:edit
operasional:view / operasional:edit
inventory:view / inventory:edit
procurement:view / procurement:edit
crm:view / crm:edit
hr:view / hr:edit
report:view
users:manage        # kelola user & role — biasanya cuma Super Admin/Direktur
system-log:view
```
Role "Super Admin" otomatis punya semua permission (`["*"]`).

### 0.3 Entity: Session (opsional tapi disarankan)
File: `data/auth/sessions.json` — simpan token aktif supaya login bertahan setelah refresh
tanpa perlu login ulang terus.

| Field | Tipe | Keterangan |
|---|---|---|
| token | string | Random string (mis. `crypto.randomUUID()` digabung), dipakai sebagai session key |
| userId | string | FK ke users |
| createdAt | string | |
| expiresAt | string | Default 7 hari dari createdAt |

### 0.4 Alur Register
1. User isi form: nama, email, username, password, konfirmasi password
2. Validasi frontend: semua wajib, password ≥ 8 karakter, konfirmasi cocok
3. Backend validasi ulang + cek `username`/`email` belum dipakai (case-insensitive)
4. Password di-hash pakai bcrypt (`bcryptjs`, tidak perlu native binding)
5. User baru dibuat dengan `status: "Menunggu Verifikasi"` dan `roleId` default ke role
   paling rendah (mis. "Staff") — **atau** langsung `"Aktif"` kalau tidak butuh approval
   (keputusan bisnis, jadikan flag di `data/auth/settings.json`: `{ "requireApproval": true|false }`)
6. Kalau `requireApproval: true` → user baru **tidak bisa login** sampai Super Admin approve
   lewat halaman "Kelola User" (ubah status jadi "Aktif")
7. Kalau `requireApproval: false` → langsung bisa login setelah register

**Endpoint:**
```
POST /api/auth/register
Body: { nama, email, username, password, confirmPassword }
Response 201: { id, nama, username, email, status }   // tanpa passwordHash
Response 400: { error: "Username sudah dipakai" } dst
```

### 0.5 Alur Login
1. User isi username/email + password
2. Backend cari user by username **atau** email, cek `status !== "Nonaktif"` dan
   `status !== "Menunggu Verifikasi"`
3. Bandingkan password pakai `bcrypt.compare`
4. Kalau cocok → generate session token, simpan ke `sessions.json`, update `lastLoginAt`
5. Response kirim token + data user (tanpa passwordHash) + role + permissions
6. Frontend simpan token di memory/React context (bukan localStorage kalau mau strict, tapi
   untuk dummy app localStorage cukup dan lazim dipakai untuk persist login antar refresh)

**Endpoint:**
```
POST /api/auth/login
Body: { identifier, password }   // identifier = username atau email
Response 200: { token, user: {id, nama, username, email, roleId}, role: {nama, permissions} }
Response 401: { error: "Username/email atau password salah" }
Response 403: { error: "Akun belum diverifikasi, hubungi admin" }  // kalau status Menunggu Verifikasi
Response 403: { error: "Akun nonaktif" }
```

### 0.6 Endpoint lain
```
POST /api/auth/logout          # hapus session token dari sessions.json
GET  /api/auth/me              # Header: Authorization: Bearer <token> → return user + permissions
GET/POST/PUT/DELETE /api/users # CRUD user, hanya bisa diakses role dgn permission "users:manage"
GET/POST/PUT/DELETE /api/roles # CRUD role, hanya "users:manage"
```

### 0.7 Middleware Backend
- `requireAuth` — cek header `Authorization: Bearer <token>`, validasi ke `sessions.json`
  (cek juga `expiresAt` belum lewat), attach `req.user` + `req.role`
- `requirePermission(code)` — cek `req.role.permissions` mengandung `code` atau `"*"`,
  kalau tidak → 403 `{ error: "Anda tidak punya akses ke modul ini" }`
- Semua route modul (Karyawan, Finance, dst) dibungkus middleware ini

### 0.8 Halaman UI Auth
| Halaman | Route | Deskripsi |
|---|---|---|
| Login | `/login` | Form identifier + password, link ke Register |
| Register | `/register` | Form nama, email, username, password, konfirmasi |
| Lupa Password *(opsional P2)* | `/forgot-password` | Karena tanpa email server sungguhan, versi dummy cukup halaman "hubungi admin" |
| Kelola User | `/management/users` | Tabel semua user + tombol approve/nonaktifkan/ubah role (hanya utk `users:manage`) |
| Kelola Role | `/management/roles` | CRUD role + checklist permission per modul |
| Profile saya | `/profile` | User lihat/ubah nama, ganti password sendiri |

### 0.9 Perilaku Frontend Setelah Login
- Sidebar merender menu **sesuai `permissions`** user yang login — modul yang tidak
  diizinkan disembunyikan total (bukan cuma disabled)
- Kalau user coba akses URL modul yang tidak diizinkan langsung (ketik manual) →
  redirect ke halaman "403 - Tidak punya akses"
- Topbar profile dropdown: nama asli user yang login (bukan hardcode "Raka A." lagi),
  tombol Logout

---

## 1. MODUL DASHBOARD (sudah ada — tambahan kecil)
- Tambah pengecekan `dashboard` permission
- Opsional: sapaan personalisasi "Selamat datang, {nama user login}"

Tidak ada perubahan struktur data besar di sini — sudah cukup detail di scope sebelumnya.

---

## 2. MODUL KARYAWAN (HR) — perluasan dari CRUD dasar

File: `data/management/karyawan.json` (sudah ada, ditambah field)

| Field tambahan | Tipe | Keterangan |
|---|---|---|
| nomorInduk | string | NIK/NIP internal, unik |
| jabatan | string | Beda dari `tipe` (departemen) — jabatan lebih spesifik, mis. "Backend Engineer" |
| tanggalMasuk | string (date) | Tanggal join |
| tanggalKeluar | string (date) \| null | Diisi kalau resign |
| gajiPokok | number \| null | Untuk keperluan Payroll (modul 11) |
| userId | string \| null | FK opsional ke `auth/users.json` kalau karyawan ini juga punya akun login |

Field lama (`tipe` sbg departemen, `status`, `catatan`, dst) tetap dipakai.

---

## 3. MODUL ASET (sudah cukup detail, tambahan kecil)
| Field tambahan | Tipe | Keterangan |
|---|---|---|
| lokasi | string | Ruangan/cabang tempat aset berada |
| penanggungJawab | string | Nama karyawan yang pegang/pakai aset (free text atau FK ke karyawan) |
| tanggalPembelian | string (date) | Beda dari `tanggal` (tanggal input record) |
| masaGaransi | string (date) \| null | |

---

## 4. MODUL PROJECT (tambahan kecil)
| Field tambahan | Tipe | Keterangan |
|---|---|---|
| tanggalMulai | string (date) | |
| tanggalSelesai | string (date) \| null | |
| anggota | string[] | Daftar nama karyawan yang terlibat |
| budget | number \| null | |

---

## 5. MODUL FINANCE — perluasan jadi double-entry ringan
Struktur sekarang (Pemasukan/Pengeluaran flat) dipertahankan untuk kompatibilitas, ditambah:

File baru: `data/management/finance-kategori.json` — supaya tipe transaksi tidak hardcode
```
[{ "id": "...", "nama": "Gaji", "kelompok": "Pengeluaran" }, ...]
```
| Field tambahan di transaksi | Tipe | Keterangan |
|---|---|---|
| kategoriId | string | FK ke finance-kategori |
| metodePembayaran | enum | "Transfer" \| "Cash" \| "Kartu" |
| nomorReferensi | string | No. invoice/kwitansi |

---

## 6. MODUL SALES (tambahan kecil, nyambung ke CRM di modul 10)
| Field tambahan | Tipe | Keterangan |
|---|---|---|
| customerId | string \| null | FK ke `data/crm/customers.json` kalau modul CRM sudah aktif |
| produkId | string \| null | FK ke `data/products.json` (produk dashboard yang sudah ada) |

---

## 7. MODUL OPERASIONAL (tetap seperti sekarang, tidak ada perluasan besar)

---

## 8. MODUL INVENTORY / GUDANG

### 8.1 Entity: Item
File: `data/inventory/items.json`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| id | string | ✓ | |
| sku | string | ✓ | Unik |
| nama | string | ✓ | |
| kategori | string | ✓ | |
| satuan | string | ✓ | pcs, unit, box, dll |
| stokMinimum | number | ✓ | Untuk alert |
| stokSaatIni | number | ✓ | Dihitung otomatis dari total movements, bukan diedit manual |
| lokasiGudang | string | — | Kalau multi-gudang |
| createdAt / updatedAt | string | ✓ | |

### 8.2 Entity: Movement
File: `data/inventory/movements.json`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| id | string | ✓ | |
| tanggal | string (date) | ✓ | |
| itemId | string | ✓ | FK ke items |
| tipe | enum | ✓ | "Masuk" \| "Keluar" |
| qty | number | ✓ | Selalu positif, arah ditentukan `tipe` |
| referensi | string | — | No. PO / No. project terkait |
| catatan | string | — | |
| createdBy | string | ✓ | userId yang input |
| createdAt | string | ✓ | |

**Business rule:** Saat POST movement, backend:
1. Baca item terkait
2. Kalau `tipe: "Keluar"` dan `qty > stokSaatIni` → tolak dengan error "Stok tidak cukup"
3. Update `stokSaatIni` di item (+qty kalau Masuk, -qty kalau Keluar)
4. Simpan movement + tulis snapshot harian ke `data/inventory/items/history/<tanggal>.json`
5. Kalau `stokSaatIni <= stokMinimum` setelah update → buat entri baru di
   `data/notifications.json` otomatis ("Stok {nama item} di bawah minimum")

**Endpoint:**
```
GET/POST   /api/inventory/items
PUT/DELETE /api/inventory/items/:id
GET        /api/inventory/items/:id/kartu-stok    # riwayat movement khusus item ini
GET/POST   /api/inventory/movements
```

**Halaman UI:** `/inventory/items` (tabel + tambah/edit item), `/inventory/movements`
(form input barang masuk/keluar + tabel riwayat), badge merah di sidebar kalau ada item
di bawah stok minimum.

---

## 9. MODUL PROCUREMENT (Purchasing)

### 9.1 Entity: Vendor
File: `data/procurement/vendors.json`

| Field | Tipe | Wajib |
|---|---|---|
| id | string | ✓ |
| nama | string | ✓ |
| kontakNama | string | — |
| kontakTelepon | string | — |
| email | string | — |
| alamat | string | — |
| catatan | string | — |

### 9.2 Entity: Purchase Order
File: `data/procurement/purchase-orders.json`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| id | string | ✓ | |
| nomorPO | string | ✓ | Auto-generate format `PO-2026-0001` |
| tanggal | string (date) | ✓ | |
| vendorId | string | ✓ | FK vendor |
| items | array | ✓ | `[{ itemId, nama, qty, hargaSatuan, subtotal }]` |
| total | number | ✓ | Sum semua subtotal |
| status | enum | ✓ | "Draft" \| "Menunggu Approval" \| "Disetujui" \| "Ditolak" \| "Diterima" |
| requestedBy | string | ✓ | userId pembuat |
| approvedBy | string \| null | — | userId yang approve |
| catatanApproval | string | — | Alasan kalau ditolak |

**Business rule:**
- Status awal selalu "Draft" → user submit jadi "Menunggu Approval"
- Approve/reject hanya bisa oleh role dengan permission `procurement:approve`
  (tambahkan kode permission baru khusus approval)
- Saat status jadi "Diterima" → otomatis buat `movement` "Masuk" di Inventory untuk
  tiap item di PO (integrasi antar modul)

**Endpoint:**
```
GET/POST   /api/procurement/vendors
PUT/DELETE /api/procurement/vendors/:id
GET/POST   /api/procurement/purchase-orders
PUT        /api/procurement/purchase-orders/:id/submit
PUT        /api/procurement/purchase-orders/:id/approve
PUT        /api/procurement/purchase-orders/:id/reject
PUT        /api/procurement/purchase-orders/:id/receive   # trigger inventory movement
```

---

## 10. MODUL CRM

### 10.1 Entity: Customer
File: `data/crm/customers.json`

| Field | Tipe | Wajib |
|---|---|---|
| id | string | ✓ |
| nama | string | ✓ |
| perusahaan | string | — |
| email | string | — |
| telepon | string | — |
| alamat | string | — |
| sumber | enum | — | "Referral" \| "Website" \| "Event" \| "Lainnya" |
| catatan | string | — |

### 10.2 Entity: Pipeline (deal tracker)
File: `data/crm/pipeline.json`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| id | string | ✓ | |
| customerId | string | ✓ | FK customer |
| judul | string | ✓ | Nama deal |
| tahap | enum | ✓ | "Prospek" → "Kualifikasi" → "Proposal" → "Negosiasi" → "Menang" \| "Kalah" |
| nilaiEstimasi | number | ✓ | |
| tanggalTarget | string (date) | — | Perkiraan closing |
| picId | string | ✓ | userId sales yang pegang |

**UI:** halaman `/crm/pipeline` idealnya kanban board per tahap (drag antar kolom), tapi
untuk versi awal boleh tabel biasa dulu dengan dropdown ganti tahap.

**Endpoint:**
```
GET/POST   /api/crm/customers
PUT/DELETE /api/crm/customers/:id
GET/POST   /api/crm/pipeline
PUT/DELETE /api/crm/pipeline/:id
PUT        /api/crm/pipeline/:id/tahap     # khusus update tahap (dipakai drag-drop kanban)
```

---

## 11. MODUL PAYROLL & ABSENSI

### 11.1 Entity: Attendance
File: `data/hr/attendance.json`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| id | string | ✓ | |
| karyawanId | string | ✓ | FK karyawan |
| tanggal | string (date) | ✓ | |
| jamMasuk | string (HH:mm) | — | |
| jamPulang | string (HH:mm) | — | |
| status | enum | ✓ | "Hadir" \| "Izin" \| "Sakit" \| "Cuti" \| "Alpha" |
| catatan | string | — | |

### 11.2 Entity: Payroll
File: `data/hr/payroll.json`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| id | string | ✓ | |
| karyawanId | string | ✓ | |
| periode | string | ✓ | Format "2026-08" |
| gajiPokok | number | ✓ | Diambil dari `karyawan.gajiPokok` saat generate |
| tunjangan | number | ✓ | Default 0 |
| potongan | number | ✓ | Default 0 (termasuk potongan alpha, dihitung dari attendance) |
| totalGaji | number | ✓ | `gajiPokok + tunjangan - potongan` |
| status | enum | ✓ | "Draft" \| "Disetujui" \| "Dibayar" |

**Business rule:** Generate payroll per periode = looping semua karyawan aktif, hitung
otomatis dari `attendance` bulan itu (mis. tiap "Alpha" potong sekian % gaji harian —
aturan pastinya didiskusikan belakangan, buat konstanta yang gampang diubah).

**Endpoint:**
```
GET/POST /api/hr/attendance
GET/POST /api/hr/payroll
POST     /api/hr/payroll/generate      # body: { periode: "2026-08" } → generate utk semua karyawan
PUT      /api/hr/payroll/:id/approve
PUT      /api/hr/payroll/:id/bayar
```

---

## 12. MODUL REPORTING & EXPORT

Tidak punya entity sendiri — modul ini murni agregasi dari data modul lain + snapshot
`history/` yang sudah ada di semua modul.

**Fitur:**
- Halaman `/report` dengan filter: Modul (dropdown), Rentang tanggal (date range picker)
- Preview hasil sebagai tabel di layar
- Tombol "Export CSV" — generate CSV di backend dari data yang difilter, kirim sebagai
  file download (pakai library ringan seperti `json2csv`, tetap tidak butuh database)

**Endpoint:**
```
GET /api/report/:modul?from=2026-08-01&to=2026-08-31        # data untuk preview
GET /api/report/:modul/export?from=...&to=...&format=csv    # download file
```

---

## 13. MODUL AUDIT LOG / ACTIVITY LOG

File: `data/system/activity-log.json`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| id | string | ✓ | |
| timestamp | string (ISO) | ✓ | |
| userId | string | ✓ | Siapa yang melakukan aksi |
| modul | string | ✓ | mis. "karyawan", "finance", "auth" |
| aksi | enum | ✓ | "create" \| "update" \| "delete" \| "login" \| "logout" \| "approve" \| "reject" |
| targetId | string | — | id record yang diubah |
| ringkasan | string | ✓ | Deskripsi singkat human-readable, mis. "Menambahkan karyawan Fajar R." |

**Implementasi:** dibuat sebagai **middleware/helper generik** di backend
(`logActivity(req.user, modul, aksi, targetId, ringkasan)`) yang dipanggil di setiap route
CRUD modul lain setelah operasi sukses — bukan modul terpisah yang berdiri sendiri secara UI,
tapi "mendengarkan" semua modul lain.

**Halaman UI:** `/system-log` (yang sekarang masih placeholder di sidebar) — tabel log,
filter per modul/user/tanggal, hanya bisa diakses role dengan `system-log:view`.

**Endpoint:**
```
GET /api/system/activity-log?modul=&userId=&from=&to=
```

---

## 14. MODUL NOTIFIKASI & APPROVAL WORKFLOW

Perluasan dari `data/notifications.json` yang sudah ada (sekarang masih statis/global).

| Field tambahan | Tipe | Keterangan |
|---|---|---|
| userId | string \| null | `null` = notifikasi global (semua user), diisi = khusus user itu |
| sudahDibaca | boolean | Default `false` |
| link | string | Path frontend yang dituju kalau notif diklik, mis. `/procurement/purchase-orders/xxx` |
| tipe | enum | "info" \| "warning" \| "approval-request" |

**Sumber notifikasi otomatis (contoh):**
- Stok di bawah minimum (dari Inventory)
- PO menunggu approval (dari Procurement, dikirim ke user dengan permission `procurement:approve`)
- Payroll siap direview (dari HR)

**Endpoint:**
```
GET /api/notifications?userId=          # gabungan notif global + khusus user
PUT /api/notifications/:id/read
```

---

## 15. MODUL MULTI-CABANG (opsional, paling belakang)

File baru: `data/cabang.json` — `{ id, nama, alamat }`

Tambahkan field `cabangId` ke: Karyawan, Aset, Inventory items, Finance transaksi.
Dashboard dapat filter dropdown "Semua Cabang" / pilih satu cabang.
**Ini paling terakhir dikerjakan** — banyak modul lain harus sudah stabil dulu supaya
tidak bolak-balik migrasi data JSON yang sudah ada.

---

## 16. Struktur Folder Backend (target akhir, semua modul)

```
backend/src/
├── server.js
├── middleware/
│   ├── requireAuth.js
│   └── requirePermission.js
├── lib/
│   ├── readData.js
│   ├── managementStore.js        # generic read/write + snapshot, dipakai ulang semua modul
│   └── activityLogger.js
└── routes/
    ├── dashboard.js
    ├── management.js             # karyawan, aset, project, finance, sales, operasional
    ├── auth.js
    ├── users.js
    ├── roles.js
    ├── inventory.js
    ├── procurement.js
    ├── crm.js
    ├── hr.js                     # attendance + payroll
    ├── report.js
    └── system.js                 # activity log
```

## 17. Struktur Folder Frontend (target akhir)

```
frontend/src/
├── context/
│   └── AuthContext.jsx           # simpan user login, permissions, fungsi login/logout
├── components/
│   ├── ProtectedRoute.jsx        # cek permission sebelum render halaman
│   └── ... (komponen yang sudah ada)
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Forbidden.jsx             # halaman 403
│   ├── ManagementPage.jsx        # sudah ada, generic
│   ├── inventory/
│   │   ├── ItemsPage.jsx
│   │   └── MovementsPage.jsx
│   ├── procurement/
│   │   ├── VendorsPage.jsx
│   │   └── PurchaseOrdersPage.jsx
│   ├── crm/
│   │   ├── CustomersPage.jsx
│   │   └── PipelinePage.jsx
│   ├── hr/
│   │   ├── AttendancePage.jsx
│   │   └── PayrollPage.jsx
│   ├── ReportPage.jsx
│   └── SystemLogPage.jsx
```

---

## 18. Urutan Implementasi (final, gabungan semua di atas)

1. **Auth (Register, Login, RBAC)** — wajib paling awal, jadi fondasi akses semua modul lain
2. **Inventory** (nyambung ke Aset yang sudah ada)
3. **Procurement** (butuh Auth utk approval + Inventory utk penerimaan barang)
4. **CRM** (perluasan Sales)
5. **Payroll & Absensi** (butuh data Karyawan yang sudah ada)
6. **Activity Log** (dipasang sebagai middleware ke semua modul yang sudah jadi)
7. **Reporting & Export**
8. **Notifikasi & Approval Workflow** (perluasan dari yang sudah ada + terintegrasi ke Procurement/Inventory)
9. **Multi-cabang** (paling akhir)

---

## 19. Hal yang Masih Perlu Diputuskan

- **Approval register**: user baru langsung aktif atau perlu di-approve admin dulu?
- **Role default**: role apa saja yang dibuat dari awal? (usul minimal: Super Admin, Manager, Staff)
- **Potongan payroll**: rumus potongan alpha/izin — persentase per hari atau nominal tetap?
- **Multi-gudang**: aktifkan `lokasiGudang` dari awal atau anggap 1 gudang dulu?
- **Retensi activity log**: disimpan selamanya di 1 file, atau di-rotate per bulan seperti
  snapshot supaya file tidak membengkak?

Jawaban ke poin-poin ini menentukan detail final sebelum mulai coding tiap modul.

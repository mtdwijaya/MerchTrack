# MerchTrack REST API

Dokumentasi REST API untuk pengujian di Postman. Semua endpoint diawali prefix `/api`.

- **Base URL (lokal):** `http://localhost:3000`
- **Format data:** JSON (request & response)
- **Autentikasi:** JWT **Bearer token** (kecuali `POST /api/auth/login`)

> Catatan: aplikasi web memakai Server Components + Server Actions (cookie httpOnly). Endpoint REST ini untuk Postman / integrasi eksternal. Keduanya memakai database & aturan bisnis yang sama. Domain saat ini memakai **`id_tujuan`** (bukan `id_kategori`).

---

## 1. Autentikasi

### Cara pakai
1. Panggil `POST /api/auth/login` dengan email & password → dapat `token`.
2. Untuk endpoint lain, kirim header:

```
Authorization: Bearer <token>
```

Token berlaku **1 hari** (`expiresIn: 1d`).

### Format response standar
```jsonc
// sukses
{ "success": true, "data": { /* ... */ } }

// gagal
{ "success": false, "message": "Pesan error" }
```

### Kode status
| Status | Arti |
|--------|------|
| 200 | Sukses |
| 201 | Data berhasil dibuat |
| 400 | Input tidak valid / aturan bisnis dilanggar |
| 401 | Token tidak ada / tidak valid / login salah |
| 403 | Butuh role ADMIN |
| 404 | Data tidak ditemukan |
| 500 | Error server |

### Role
- **PETUGAS / ADMIN:** dashboard, monitoring, tujuan, unit, merchandise (baca), stasiun (baca), barang-keluar, riwayat.
- **ADMIN saja:** CRUD merchandise + restock, CRUD stasiun, semua endpoint pengguna.

---

## 2. Daftar Endpoint

### Auth
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| POST | `/api/auth/login` | Publik | Login, balikin token + user |
| GET | `/api/auth/me` | User | Info user dari token |

Akun seed: `admin@lrt.co.id` / `password123`, `petugas@lrt.co.id` / `password123`.

---

### Dashboard & Monitoring
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/dashboard` | User | Statistik dashboard (KPI all-time + chart) |
| GET | `/api/monitoring` | User | Overview monitoring merchandise |
| GET | `/api/monitoring/stok` | User | List stok paginasi + filter status |
| GET | `/api/monitoring/aktivitas` | User | Feed aktivitas terbaru (paginated) |

**Query `/api/dashboard`:** `chartTahun` (tahun stacked bar), `sankeyBulan` + `sankeyTahun` (opsional — kosong = sankey all-time).

**Response monitoring overview (ringkas):** `summary.{totalStokAktif,jenisMerchandise,peringatanStokRendah}`, `merchandiseStock[]` (`foto_path`, `stokDipakai`, `stokSisa`, `status`), `lowStockItems[]`.

**Query `/api/monitoring/stok`:** `page`, `limit`, `search`, `sort`, `status` (`habis` \| `rendah` \| `normal`).

**Query `/api/monitoring/aktivitas`:** `page`, `limit`.

---

### Tujuan & Unit
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/tujuan` | User | Tanpa `page`: semua (dropdown). Dengan `page`: list + summary |
| POST | `/api/tujuan` | Admin | Tambah kategori tujuan |
| GET | `/api/tujuan/:id` | User | Detail |
| PUT | `/api/tujuan/:id` | Admin | Ubah |
| DELETE | `/api/tujuan/:id` | Admin | Hapus (gagal jika masih dipakai transaksi) |
| GET | `/api/unit` | User | Tanpa `page`: semua (dropdown). Dengan `page`: list + summary |
| POST | `/api/unit` | Admin | Tambah unit |
| GET | `/api/unit/:id` | User | Detail |
| PUT | `/api/unit/:id` | Admin | Ubah |
| DELETE | `/api/unit/:id` | Admin | Hapus (gagal jika masih dipakai transaksi) |

**Query GET list tujuan (paginated):** `page`, `limit`, `search`, `sort` (`nama_tujuan:asc` \| `jenis_detail:asc`), `jenis_detail` (`STASIUN` \| `UNIT` \| `TEKS` \| `TIDAK_ADA`).

**Query GET list unit (paginated):** `page`, `limit`, `search`, `sort` (`nama_unit:asc` \| `kode_unit:asc`).

Body create/update tujuan:
```json
{
  "nama_tujuan": "Event",
  "jenis_detail": "TEKS",
  "label_detail": "Nama event",
  "boleh_return": false
}
```

Body create/update unit:
```json
{ "kode_unit": "OPS", "nama_unit": "Operasi" }
```

> UI master: `/tujuan` (kategori), nested `/tujuan/stasiun` & `/tujuan/unit`. Endpoint REST stasiun tetap `/api/stasiun`.

---

### Merchandise
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/merchandise` | User | List + summary (+ pergerakan stok) |
| POST | `/api/merchandise` | Admin | Tambah merchandise (+ stok awal) |
| GET | `/api/merchandise/:id` | User | Detail |
| PUT | `/api/merchandise/:id` | Admin | Ubah nama/deskripsi |
| DELETE | `/api/merchandise/:id` | Admin | Hapus (gagal jika ada transaksi) |
| POST | `/api/merchandise/:id/restock` | Admin | Tambah stok + catat barang masuk |

**Query GET list:** `page`, `limit`, `search`, `sort` (`nama_merch:asc` \| `jumlah_stok:desc`).

Body create (JSON):
```json
{ "nama_merch": "Topi LRT", "deskripsi": "Topi katun", "jumlah_stok": 100 }
```

> **Foto merchandise:** di UI diunggah lewat FormData field `foto` (JPG/PNG/WEBP, max 5MB) saat create/edit. REST JSON di atas tidak mengirim binary; response GET list/detail/monitoring menyertakan `foto_path` bila ada. Upload foto via REST multipart belum tersedia (pakai UI master merchandise).

Body restock:
```json
{ "nama_petugas": "Andi Wijaya", "jumlah": 50, "keterangan": "Restock gudang pusat" }
```

---

### Stasiun
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/stasiun` | User | List + summary |
| POST | `/api/stasiun` | Admin | Tambah |
| GET | `/api/stasiun/:id` | User | Detail |
| PUT | `/api/stasiun/:id` | Admin | Ubah |
| DELETE | `/api/stasiun/:id` | Admin | Hapus |

**Query GET list:** `page`, `limit`, `search`, `sort` (`nama_stasiun:asc` \| `kode_stasiun:asc`).

> Halaman UI di `/tujuan/stasiun` (redirect `/stasiun` → `/tujuan/stasiun`).

---

### Pengguna (Admin)
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/pengguna` | Admin | List + summary |
| POST | `/api/pengguna` | Admin | Tambah |
| GET | `/api/pengguna/:id` | Admin | Detail |
| PUT | `/api/pengguna/:id` | Admin | Ubah |
| DELETE | `/api/pengguna/:id` | Admin | Hapus |

---

### Barang Keluar
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/barang-keluar` | User | List **grup** transaksi + summary |
| POST | `/api/barang-keluar` | User | Single atau batch (`items`) |
| GET | `/api/barang-keluar/:id` | User | Detail grup + riwayat kembali |
| PUT | `/api/barang-keluar/:id` | User | Update single atau batch |
| DELETE | `/api/barang-keluar/:id` | User | Hapus (grup ikut terhapus jika ada) |
| POST | `/api/barang-keluar/:id/return` | User | Catat pengembalian |

**Query GET list:** `page`, `limit`, `search`, `sort`, `id_tujuan`.

Body create single:
```json
{
  "nama_petugas": "Andi Wijaya",
  "id_merch": 1,
  "id_tujuan": 1,
  "id_stasiun": 1,
  "jumlah": 5,
  "tanggal_keluar": "2026-07-02",
  "keterangan": "Dibagikan saat event"
}
```

Body create batch:
```json
{
  "nama_petugas": "Andi Wijaya",
  "id_tujuan": 1,
  "id_stasiun": 1,
  "tanggal_keluar": "2026-07-02",
  "items": [
    { "id_merch": 1, "jumlah": 5 },
    { "id_merch": 2, "jumlah": 3 }
  ]
}
```

Body return (single item):
```json
{
  "jumlah_kembali": 2,
  "tanggal_kembali": "2026-07-03",
  "pengembali": "Budi Santoso",
  "asal": "Stasiun Bekasi",
  "keterangan": "Sisa event dikembalikan"
}
```

Body return (batch multi-merch dalam grup — `:id` = anchor transaksi):
```json
{
  "tanggal_kembali": "2026-07-03",
  "pengembali": "Budi Santoso",
  "asal": "Unit IT",
  "keterangan": "Pengembalian sisa",
  "items": [
    { "id_keluar": 12, "jumlah_kembali": 10 },
    { "id_keluar": 13, "jumlah_kembali": 5 }
  ]
}
```

> Field `nama_petugas` wajib: nama orang yang melakukan transaksi di perangkat bersama (bukan akun login). Field detail (`id_stasiun` / `id_unit` / `detail_teks`) tergantung `jenis_detail` tujuan. Stok kurang → `400`.

---

### Riwayat Transaksi
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/riwayat-transaksi` | User | Unified masuk + keluar |

**Query:** `page`, `limit`, `search`, `jenis` (`KELUAR` \| `MASUK` \| `RESTOCK`), `id_merch`, `tanggal_dari`, `tanggal_sampai` (`YYYY-MM-DD`).

Response: `{ data, total, currentPage, totalPages }` — item unified dengan `jenis`, `petugas` (dari `nama_petugas` form), `items[]` (grup keluar multi-merch), `tujuan`.

---

## 3. Cara Testing di Postman

1. Import `postman/MerchTrack.postman_collection.json`.
2. Variabel collection: `baseUrl` = `http://localhost:3000`, `token` terisi otomatis setelah **Login**.
3. Jalankan `npm run dev`, lalu **Auth > Login**, baru endpoint lain.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lrt.co.id","password":"password123"}'

curl http://localhost:3000/api/barang-keluar \
  -H "Authorization: Bearer <token>"
```

---

## 4. Gap UI akses cepat (tablet & desktop)

Halaman akses cepat `/` (login `/login`) responsif untuk **tablet** dan **desktop**, memakai **Server Actions**, belum punya endpoint REST khusus:

| Mode | Aksi UI | Domain yang dipakai |
|------|---------|---------------------|
| OUT | Keranjang multi-merch + confirm | `createBarangKeluarBatch` (sama `POST /api/barang-keluar` batch) |
| RETURN | Keranjang multi-merch + confirm | `restockMerchandise` per item (sama `POST /api/merchandise/:id/restock`) |

**Tujuan `TEKS` (Event / Lainnya):** tetap bisa dipilih di akses cepat. Field detail teks **tidak** ditampilkan di tablet — `detail_teks` boleh kosong saat create, lalu dilengkapi lewat form admin barang keluar. Schema DB tidak berubah (`detail_teks` tetap nullable).

Admin panel: `/admin` (login `/admin/login`).
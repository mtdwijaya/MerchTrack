# MerchTrack REST API

Dokumentasi REST API untuk pengujian di Postman. Semua endpoint diawali prefix `/api`.

- **Base URL (lokal):** `http://localhost:3000`
- **Format data:** JSON (request & response)
- **Autentikasi:** JWT **Bearer token** (kecuali `POST /api/auth/login`)

> Catatan: aplikasi web-nya sendiri tetap memakai Server Components + Server Actions (cookie httpOnly). Endpoint REST di bawah ini adalah lapisan tambahan khusus supaya bisa dites lewat Postman / integrasi eksternal. Keduanya memakai database & aturan bisnis (validasi, transaksi stok) yang sama.

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
Semua endpoint mengembalikan bentuk konsisten:

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
| 400 | Input tidak valid / aturan bisnis dilanggar (mis. stok kurang) |
| 401 | Token tidak ada / tidak valid / login salah |
| 403 | Butuh role ADMIN |
| 404 | Data tidak ditemukan |
| 500 | Error server |

### Role
- **PETUGAS / ADMIN (semua user login):** dashboard, monitoring, kategori, merchandise (baca), stasiun (baca), barang-keluar (semua), riwayat-transaksi.
- **ADMIN saja:** buat/ubah/hapus merchandise, restock, buat/ubah/hapus stasiun, semua endpoint pengguna.

---

## 2. Daftar Endpoint

### Auth
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| POST | `/api/auth/login` | Publik | Login, balikin token + user |
| GET | `/api/auth/me` | User | Info user dari token |

#### `POST /api/auth/login`
Akun default (dari seed): `admin@lrt.co.id` / `password123` (ADMIN), `petugas@lrt.co.id` / `password123` (PETUGAS).

Request body:
```json
{ "email": "admin@lrt.co.id", "password": "password123" }
```
Response `200`:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJI...",
    "user": {
      "id_user": 1,
      "email": "admin@lrt.co.id",
      "role": "ADMIN",
      "nama_user": "Administrator",
      "id_stasiun": null
    }
  }
}
```

---

### Dashboard & Monitoring
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/dashboard` | User | Statistik ringkas, top merchandise, distribusi stasiun, stok gudang |
| GET | `/api/monitoring` | User | Daftar stok + status (habis/rendah/normal) |

**Query `/api/monitoring`:** `page`, `limit`, `search`, `sort` (`jumlah_stok:asc` / `nama_merch:desc`), `status` (`habis` \| `rendah` \| `normal`).

---

### Kategori
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/kategori` | User | Semua kategori penggunaan |

---

### Merchandise
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/merchandise` | User | List paginasi + summary |
| POST | `/api/merchandise` | Admin | Tambah merchandise (+ stok awal) |
| GET | `/api/merchandise/:id` | User | Detail |
| PUT | `/api/merchandise/:id` | Admin | Ubah nama/deskripsi |
| DELETE | `/api/merchandise/:id` | Admin | Hapus (gagal jika ada transaksi) |
| POST | `/api/merchandise/:id/restock` | Admin | Tambah stok + catat barang masuk |

**Query GET list:** `page`, `limit`, `search`, `sort` (`nama_merch:asc` \| `jumlah_stok:desc` \| `id_merch:asc`).

Body `POST /api/merchandise`:
```json
{ "nama_merch": "Topi LRT", "deskripsi": "Topi katun", "jumlah_stok": 100 }
```
Body `PUT /api/merchandise/:id`:
```json
{ "nama_merch": "Topi LRT Premium", "deskripsi": "Bahan premium" }
```
Body `POST /api/merchandise/:id/restock`:
```json
{ "jumlah": 50, "keterangan": "Restock gudang pusat" }
```

---

### Stasiun
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/stasiun` | User | List paginasi + summary |
| POST | `/api/stasiun` | Admin | Tambah stasiun |
| GET | `/api/stasiun/:id` | User | Detail |
| PUT | `/api/stasiun/:id` | Admin | Ubah |
| DELETE | `/api/stasiun/:id` | Admin | Hapus (gagal jika masih dipakai) |

**Query GET list:** `page`, `limit`, `search`, `sort` (`nama_stasiun:asc` \| `kode_stasiun:desc`).

Body `POST/PUT`:
```json
{
  "kode_stasiun": "LRT-DKK",
  "nama_stasiun": "Dukuh Atas",
  "alamat": "Jakarta Pusat",
  "kontak": "08123456789"
}
```

---

### Pengguna (Admin)
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/pengguna` | Admin | List paginasi + summary |
| POST | `/api/pengguna` | Admin | Tambah pengguna |
| GET | `/api/pengguna/:id` | Admin | Detail (tanpa password) |
| PUT | `/api/pengguna/:id` | Admin | Ubah (password opsional) |
| DELETE | `/api/pengguna/:id` | Admin | Hapus |

**Query GET list:** `page`, `limit`, `search`, `sort` (`nama_user:asc` \| `email` \| `role`), `role` (`ADMIN` \| `PETUGAS`).

Body `POST /api/pengguna`:
```json
{
  "nama_user": "Budi",
  "email": "budi@merchtrack.com",
  "password": "rahasia123",
  "role": "PETUGAS",
  "id_stasiun": 1
}
```
Body `PUT /api/pengguna/:id` (kosongkan `password` jika tidak diubah):
```json
{
  "nama_user": "Budi Santoso",
  "email": "budi@merchtrack.com",
  "password": "",
  "role": "PETUGAS",
  "id_stasiun": 2
}
```

---

### Barang Keluar
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/barang-keluar` | User | List paginasi + summary |
| POST | `/api/barang-keluar` | User | Catat barang keluar (stok otomatis berkurang) |
| GET | `/api/barang-keluar/:id` | User | Detail |
| PUT | `/api/barang-keluar/:id` | User | Ubah (stok lama dikembalikan, dipotong ulang) |
| DELETE | `/api/barang-keluar/:id` | User | Hapus (stok otomatis dikembalikan) |

**Query GET list:** `page`, `limit`, `search`, `sort` (`tanggal_keluar:desc` \| `jumlah` \| `nama_merch` \| `nama_stasiun` \| `nama_kategori`), `id_stasiun`, `id_kategori`.

Body `POST` (`tanggal_keluar` opsional, format `YYYY-MM-DD`; kosong = hari ini):
```json
{
  "id_merch": 1,
  "id_stasiun": 1,
  "id_kategori": 1,
  "jumlah": 5,
  "tanggal_keluar": "2026-07-02",
  "keterangan": "Dibagikan saat event"
}
```
Body `PUT` sama seperti di atas, tetapi `tanggal_keluar` **wajib** diisi.

> Aturan bisnis: jika stok tidak mencukupi, response `400` dengan pesan `"Stok tidak mencukupi"`.

---

### Riwayat Transaksi
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/riwayat-transaksi` | User | List barang keluar + filter |

**Query:** `page`, `limit`, `search`, `sort`, `id_kategori`, `tanggal` (`YYYY-MM-DD`).

---

## 3. Cara Testing di Postman

1. Import file `postman/MerchTrack.postman_collection.json`.
2. Di collection ada variabel:
   - `baseUrl` → `http://localhost:3000`
   - `token` → otomatis terisi setelah menjalankan request **Login** (ada script di tab *Tests*).
3. Jalankan `npm run dev` lalu jalankan request **Login** dulu, baru endpoint lainnya.

Contoh manual dengan cURL:
```bash
# 1. login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lrt.co.id","password":"password123"}'

# 2. pakai token
curl http://localhost:3000/api/barang-keluar \
  -H "Authorization: Bearer <token>"
```

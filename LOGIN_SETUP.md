# 🔐 Dynamic Login Implementation Guide

## ✅ Sistem yang Telah Dibuat

### 1. **Database Schema (Prisma)**
- ✓ Model `User` dengan fields: id_user, nama_user, email, password, role
- ✓ Model `Stasiun` untuk mengelola stasiun
- ✓ Relationship antara User dan Stasiun

### 2. **API Routes**
- ✓ **POST `/api/auth/login`** - Login dengan email & password
- ✓ **POST `/api/auth/logout`** - Logout dan hapus token

### 3. **Frontend**
- ✓ Login page dinamis dengan form handling
- ✓ Email & password input dengan validasi
- ✓ Password visibility toggle
- ✓ Error handling dan loading states
- ✓ Redirect ke dashboard setelah login berhasil

### 4. **Security**
- ✓ JWT token generation & verification
- ✓ Password hashing dengan bcrypt
- ✓ HTTP-only cookies untuk token storage
- ✓ Middleware untuk route protection

### 5. **Utilities**
- ✓ Seed script untuk membuat test users
- ✓ Environment configuration (.env.local)

---

## 🚀 Setup Instructions

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Setup Environment Variables**
Edit `.env.local` dengan konfigurasi database Anda:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/merchtrack"
JWT_SECRET="your_jwt_secret_key_change_this_in_production"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 3. **Setup Database**
```bash
# Jalankan migrations
npx prisma migrate dev

# Seed data (buat test users)
npm run seed
```

### 4. **Run Development Server**
```bash
npm run dev
```

Visit: [http://localhost:3000/login](http://localhost:3000/login)

---

## 👤 Test Credentials

Setelah menjalankan seed script, gunakan credentials berikut:

### Admin User
- **Email:** admin@lrt.co.id
- **Password:** admin123
- **Role:** ADMIN

### Petugas User
- **Email:** petugas@lrt.co.id
- **Password:** admin123
- **Role:** PETUGAS

---

## 📋 API Documentation

### Login Endpoint
```
POST /api/auth/login
```

**Request:**
```json
{
  "email": "admin@lrt.co.id",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id_user": 1,
    "nama_user": "Admin",
    "email": "admin@lrt.co.id",
    "role": "ADMIN",
    "id_stasiun": 1
  }
}
```

**Error Response (401):**
```json
{
  "message": "Email tidak ditemukan" // atau "Password salah"
}
```

### Logout Endpoint
```
POST /api/auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

---

## 🔒 Protected Routes

Middleware telah dikonfigurasi untuk:
- ✓ Melindungi semua routes kecuali `/login` dan `/forgot-password`
- ✓ Redirect ke login jika token tidak valid
- ✓ Redirect ke dashboard jika sudah login dan mengakses halaman login

---

## 🛠️ File yang Dibuat/Diubah

### Baru Dibuat:
- `middleware.ts` - Route protection middleware
- `api/auth/logout/route.ts` - Logout endpoint
- `scripts/seed.ts` - Database seeding script
- `.env.local` - Environment configuration
- `.env.example` - Environment template

### Diubah:
- `app/(auth)/login/page.tsx` - Integrated dengan API
- `api/auth/login/route.ts` - Improved dengan validation
- `package.json` - Added seed script dan dependencies

---

## 🔄 Flow Diagram

```
User Input
    ↓
[Login Form] (/login/page.tsx)
    ↓
Validate Input
    ↓
POST /api/auth/login
    ↓
Verify Email & Password
    ↓
Generate JWT Token
    ↓
Set HTTP-Only Cookie
    ↓
Redirect to /dashboard
    ↓
Middleware Validates Token
    ↓
Access Granted
```

---

## 📚 Next Steps (Optional)

1. **Forgot Password** - Implement password reset feature
2. **Refresh Token** - Add refresh token functionality
3. **2FA** - Add two-factor authentication
4. **Session Management** - Track user sessions
5. **Audit Logs** - Log login/logout attempts

---

## ⚠️ Important Notes

- Ubah `JWT_SECRET` di production dengan value yang aman
- Set `secure: true` untuk cookies di production (HTTPS only)
- Implementasikan rate limiting pada login endpoint
- Regular backup database Anda
- Monitor failed login attempts

---

## 🐛 Troubleshooting

**Q: "Email tidak ditemukan" error**
- A: Pastikan sudah menjalankan `npm run seed` untuk membuat test users

**Q: Token tidak valid**
- A: Pastikan `JWT_SECRET` di .env.local sama dengan yang digunakan API

**Q: Database connection error**
- A: Verifikasi `DATABASE_URL` di .env.local dan pastikan PostgreSQL running

**Q: CORS error**
- A: Login endpoint harus di-access dari same-origin (sudah dikonfigurasi)

---

Last Updated: June 17, 2026

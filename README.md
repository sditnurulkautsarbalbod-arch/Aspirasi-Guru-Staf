# ASPIRASI & UMPAN BALIK INTERNAL SD IT Nurul Kautsar

Aplikasi web *production-ready* sebagai ruang anonim bagi **GURU** dan **STAF** SD IT Nurul Kautsar untuk menyampaikan aspirasi, pertanyaan, kritik, saran, apresiasi, atau umpan balik terkait lingkungan kerja dan pengembangan profesional rekan kerja.

---

## 📌 PRINSIP UTAMA APLIKASI
- **100% Bebas Rating & Skor**: BUKAN sistem penilaian kinerja guru. Tidak ada angka, skor, ranking, maupun leaderboard.
- **Anonim Sejati**: Tidak meminta nama, email, nomor HP, IP address, user-agent, atau identitas pengirim lainnya.
- **Tanpa Akun Guru/Staf**: Guru & staf langsung menyampaikan aspirasi melalui satu kotak teks pada halaman publik.
- **Akses Pengelola Terproteksi**: Seluruh aspirasi hanya dapat dibaca & ditindaklanjuti oleh pengelola berwenang:
  1. **ADMIN**
  2. **WAKASEK**
  3. **KEPALA SEKOLAH**

---

## 🚀 TECH STACK

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Lucide React icons, React Router v7.
- **Backend**: Hono Framework, TypeScript, Node.js serverless-friendly adapter for Vercel.
- **Database**: Neon PostgreSQL Serverless, Drizzle ORM, `drizzle-kit` for schema migrations.
- **Authentication**: JWT / HttpOnly Cookie Session, `bcryptjs` password hashing.
- **Export**: XLSX Excel exporter.
- **Deployment**: Vercel & GitHub compatible.

---

## 📁 STRUKTUR PROJECT

```
├── api/
│   └── index.ts                 # Entry point Vercel Serverless Functions
├── drizzle/                     # File migrasi Drizzle ORM
├── server/
│   ├── db/
│   │   ├── schema.ts            # Skema database Drizzle (users, aspirations, audit_logs)
│   │   ├── index.ts             # Koneksi Neon DB + Fallback In-Memory DB
│   │   └── seed.ts              # Seeding awal akun pengelola
│   ├── middleware/
│   │   ├── auth.ts              # Middleware JWT & Server-Side RBAC
│   │   └── rateLimit.ts         # Middleware rate limit anti-spam
│   ├── routes/
│   │   ├── auth.ts              # Endpoint Login/Logout/Me
│   │   ├── public.ts            # Endpoint Publik POST Aspirasi
│   │   ├── admin.ts             # Endpoint Admin (Aspirasi + User Management)
│   │   ├── wakasek.ts           # Endpoint Wakasek
│   │   └── kepalaSekolah.ts     # Endpoint Kepala Sekolah
│   ├── services/
│   │   └── aspirationService.ts # Business logic & Excel Exporter
│   └── index.ts                 # Hono Router Utama (/api)
├── src/
│   ├── components/              # Komponen UI React (Header, Footer, Form, Modals)
│   ├── context/                 # Context (Auth, Theme, Toast)
│   ├── lib/                     # API Client & Utilities
│   ├── pages/                   # Halaman (PublicPage, Admin, Wakasek, Kepsek, 404)
│   ├── types/                   # Definisi tipe TypeScript
│   ├── App.tsx                  # App entry point + Routing
│   └── main.tsx
├── .env.example
├── drizzle.config.ts
├── package.json
├── server.ts                    # Local server (Express + Vite + Hono bridge)
├── vercel.json                  # Konfigurasi Vercel Serverless
└── vite.config.ts
```

---

## 🔑 DEFAULT CREDENTIALS (PENGELOLA)

> **PENTING**: Ganti password default ini segera setelah deployment pertama ke production.

| Role | Username | Password Default |
| :--- | :--- | :--- |
| **ADMIN** | `admin` | `admin890` *(Admin Utama)* |
| **WAKASEK** | `wakasek` | `wakasek890` |
| **KEPALA SEKOLAH** | `kepsek` | `kepsek890` |

---

## 💻 PANDUAN INSTALASI LOKAL

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/username/aspirasi-internal-sdit-nurul-kautsar.git
cd aspirasi-internal-sdit-nurul-kautsar
npm install
```

### 2. Konfigurasi Environment Variable
Buat file `.env` berdasarkan `.env.example`:
```env
DATABASE_URL=postgres://user:password@ep-example.region.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=ganti_dengan_secret_key_panjang_dan_acak_2026
```

### 3. Database Migration & Seed
```bash
# Push skema ke Neon DB
npm run db:push

# Seed data awal (Admin, Wakasek, Kepsek)
npm run db:seed
```

### 4. Jalankan Server Development
```bash
npm run dev
```
Aplikasi akan dapat diakses di: `http://localhost:3000`

---

## 🌐 DEPLOYMENT KE VERCEL & NEON

1. **Buat Database Neon**:
   - Dapatkan `DATABASE_URL` dari dashboard Neon.tech.
2. **Push Repository ke GitHub**:
   - Pastikan `.env` tidak ter-commit ke GitHub.
3. **Import Project ke Vercel**:
   - Atur Environment Variables di Vercel:
     - `DATABASE_URL`
     - `SESSION_SECRET`
4. **Deploy**:
   - Vercel akan otomatis mengenali `api/index.ts` dan membangun frontend Vite.

---

## 🛠️ TROUBLESHOOTING DEPLOYMENT
- **Pesan error `ERR_MODULE_NOT_FOUND` pada Vercel**:
  Pastikan `vercel.json` menggunakan rewrite `/api/(.*)` ke `/api`, dan `api/index.ts` mengeksport `handle(app)` dari `hono/vercel`.
- **Database Connection Failure**:
  Pastikan `sslmode=require` disertakan pada query parameter `DATABASE_URL` di Neon.

---

## 🔒 CATATAN KEAMANAN & PRIVASI
- Password di-hash menggunakan **bcrypt** (salt 10 rounds).
- Token autentikasi JWT dikirim via HttpOnly / Secure Cookie atau Authorization Header.
- Form publik dilindungi dengan **Rate Limiter** untuk mencegah spam attack.
- Server-side RBAC memverifikasi setiap request ke endpoint pengelola.

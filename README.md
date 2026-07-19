# Livyn — Faith. Every Day.

Aplikasi pendamping rohani harian: renungan, Alkitab, pengingat doa, dan khotbah — tanpa like, follower, atau scroll tanpa akhir. Dibangun sebagai aplikasi web responsif (mobile-first) dengan Next.js App Router, dengan backend, autentikasi, dan RBAC yang berjalan penuh (bukan mockup).

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env          # sudah berisi default yang aman untuk dev lokal
npx prisma migrate dev        # membuat prisma/dev.db (SQLite)
npm run db:seed               # mengisi data contoh (kategori, Alkitab, renungan, khotbah, pengguna)
npm run dev
```

Buka http://localhost:3000.

### Akun demo (password sama untuk semua: `Livyn123!`)

| Peran | Email |
|---|---|
| Super Admin | `superadmin@livyn.app` |
| Admin | `admin@livyn.app` |
| Moderator | `moderator@livyn.app` |
| Kontributor | `kontributor@livyn.app`, `kontributor2@livyn.app` |
| Jemaat (user) | `warga@livyn.app` |

## Arsitektur

- **Next.js 16 App Router + TypeScript + Tailwind v4** — satu aplikasi full-stack (UI, API routes, dan proxy/middleware) dalam satu deploy unit.
- **Prisma + SQLite** untuk pengembangan lokal; skema ditulis Postgres-ready (tanpa fitur khusus SQLite) — ganti `datasource.url` ke `postgresql://...` (mis. Supabase) untuk produksi.
- **Autentikasi kustom**: hashing kata sandi Argon2id (`@node-rs/argon2`), JWT access token (15 menit, `jose`) di cookie httpOnly, refresh token rotation dengan deteksi reuse (family revocation) tersimpan sebagai hash di database.
- **RBAC**: `user < contributor < moderator < admin < super_admin`, ditegakkan di `src/proxy.ts` (proteksi route) *dan* di setiap route handler API (defense in depth).
- **Keamanan**: rate limiting in-memory pada endpoint auth, security headers + CSP di `src/proxy.ts`, validasi input Zod di semua route mutasi, audit log (`AuditLog`) untuk aksi sensitif, riwayat login (`LoginEvent`), refresh-token-reuse detection.

## Struktur fitur

- `/`, `/onboarding` — splash screen animasi + onboarding carousel (Bahasa Indonesia)
- `/masuk`, `/daftar`, `/lupa-sandi` — autentikasi
- `/app` — dashboard (ayat hari ini, renungan hari ini, pengingat doa, khotbah terbaru, peristiwa Kristiani mendatang — dihitung otomatis termasuk Paskah dll.)
- `/app/devosi` — renungan harian per kategori, bookmark, simpan offline (localStorage), ukuran huruf
- `/app/alkitab` — 66 kitab lengkap (struktur navigasi penuh), sorot ayat, catatan pribadi, pencarian
- `/app/doa` — pengingat doa custom (pagi/siang/malam/tengah malam), streak, notifikasi browser best-effort
- `/app/khotbah` — streaming video, lanjutkan menonton, mode audio saja, transkrip
- `/app/cari` — pencarian lintas renungan/ayat/khotbah/topik
- `/contributor` — dasbor kontributor: statistik, buat/kirim renungan & khotbah (autosave draft lokal)
- `/admin` — dasbor admin: moderasi konten, manajemen pengguna & peran, kategori, log audit

## Keterbatasan build ini (transparansi)

Master prompt aslinya meminta stack yang jauh lebih besar (aplikasi native Flutter, backend NestJS terpisah, provisioning cloud sungguhan, dsb). Untuk build yang bisa benar-benar dijalankan dan diverifikasi dalam satu sesi, cakupannya difokuskan pada satu aplikasi web full-stack yang solid. Yang **belum** termasuk:

- **Teks Alkitab**: struktur 66 kitab/pasal lengkap sudah ada, tapi isi ayat baru tersedia untuk kumpulan pasal pilihan (lihat `prisma/bible-verses.ts`) yang ditulis ulang secara orisinal — bukan salinan verbatim dari terjemahan berhak cipta (mis. Terjemahan Baru LAI). Untuk teks lengkap 66 kitab, sambungkan ke sumber berlisensi resmi (API.Bible, YouVersion, atau data resmi LAI).
- **Aplikasi mobile native** (Flutter/Android/iOS) belum dibangun — aplikasi web ini responsif dan terasa seperti aplikasi native di browser mobile, tapi bukan build native/App Store.
- **Push notification & alarm native**: pengingat doa memakai Web Notification API (aktif hanya selagi tab terbuka). Alarm background sungguhan butuh aplikasi native.
- **Google/Apple Login**: tombolnya ada di UI tapi memerlukan kredensial OAuth produksi untuk diaktifkan.
- **Upload & transcoding video/gambar**: kontributor menempelkan URL video yang sudah dihosting (belum ada pipeline upload + transcoding + virus scan).
- **Email transaksional**: reset kata sandi membuat token yang valid tapi baru di-log ke konsol server (belum ada provider email).
- **2FA, device fingerprinting, deteksi impossible-travel**: kolom skema sudah disiapkan (`twoFactorEnabled`, `Device` model) tapi alur lengkapnya belum diimplementasikan.
- **Video khotbah**: memakai klip placeholder yang di-generate lokal (`public/media/sample-sermon.webm`), bukan konten khotbah sungguhan.

## Deploy ke produksi

1. Provisioning Postgres (mis. Supabase/Cloud SQL), set `DATABASE_URL`, ganti `datasource.provider` di `prisma/schema.prisma` ke `postgresql`.
2. Set `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` yang kuat (`openssl rand -base64 48`).
3. Deploy ke platform Node.js (Vercel/Cloud Run/dll). `NODE_ENV=production` otomatis mengaktifkan HSTS dan cookie `secure`.

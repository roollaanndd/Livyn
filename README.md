# Livyn — Faith. Every Day.

Aplikasi pendamping rohani harian: renungan, Alkitab, pengingat doa, dan khotbah — tanpa like, follower, atau scroll tanpa akhir. Dibangun sebagai aplikasi web responsif (mobile-first) dengan Next.js App Router, dengan backend, autentikasi, dan RBAC yang berjalan penuh (bukan mockup).

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env          # isi DATABASE_URL dengan connection string Postgres (mis. Supabase)
npx prisma migrate deploy     # menerapkan skema ke database
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
| Anak Tuhan (user) | `anaktuhan@livyn.app` |

## Arsitektur

- **Next.js 16 App Router + TypeScript + Tailwind v4** — satu aplikasi full-stack (UI, API routes, dan proxy/middleware) dalam satu deploy unit.
- **Prisma + PostgreSQL (Supabase)** — satu database yang sama dipakai untuk dev dan produksi lewat `DATABASE_URL`. Row-Level Security aktif di semua tabel (deny-all secara default) untuk mengunci REST API bawaan Supabase; aplikasi ini sendiri hanya terhubung lewat koneksi Postgres langsung via Prisma, bukan lewat API tersebut.
- **Autentikasi kustom**: hashing kata sandi Argon2id (`@node-rs/argon2`), JWT access token (15 menit, `jose`) di cookie httpOnly, refresh token rotation dengan deteksi reuse (family revocation) tersimpan sebagai hash di database.
- **RBAC**: `user < contributor < moderator < admin < super_admin`, ditegakkan di `src/proxy.ts` (proteksi route) *dan* di setiap route handler API (defense in depth).
- **Keamanan**: rate limiting in-memory pada endpoint auth, security headers + CSP di `src/proxy.ts`, validasi input Zod di semua route mutasi, audit log (`AuditLog`) untuk aksi sensitif, riwayat login (`LoginEvent`), refresh-token-reuse detection.

## Struktur fitur

### Inti

- `/`, `/onboarding` — splash screen animasi + onboarding carousel (Bahasa Indonesia)
- `/masuk`, `/daftar`, `/lupa-sandi` — autentikasi
- `/app` — dashboard: ayat hari ini (ayat kurasi dengan rotasi acak harian), renungan tematik, pengingat doa, khotbah terbaru, peristiwa Kristiani (dihitung otomatis termasuk Paskah dll.)
- `/app/devosi` — renungan harian tematik dengan alur khotbah singkat (pembuka, merenungkan firman, aplikasi, refleksi, doa penutup), berbeda setiap hari, tombol bagikan
- `/app/alkitab` — 66 kitab lengkap (struktur navigasi penuh), sorot ayat, catatan pribadi, pencarian
- `/app/doa` — pengingat doa custom (pagi/siang/malam/tengah malam), streak, notifikasi push
- `/app/khotbah` — streaming video, lanjutkan menonton, mode audio saja, transkrip
- `/app/ai-pastor` — pendamping rohani AI: tanya tentang Alkitab, doa, curhat, topik rohani (OpenRouter LLM dengan pemilihan model gratis yang self-healing, konfigurasikan lewat `AI_PASTOR_MODEL`)
- `/app/jurnal` — jurnal "Curhat kepada Tuhan": tulis catatan harian dengan mood, dapatkan ayat penguat otomatis
- `/app/tantangan` — tantangan baca Alkitab bulanan: tandai pasal selesai, poin + streak, level rohani
- `/app/rencana-baca` — rencana bacaan Alkitab terstruktur harian
- `/app/cari` — pencarian lintas renungan/ayat/khotbah/topik

### Komunitas

- `/app/teman` — undang teman via kode unik (`LVN-XXXX`), kirim ayat (Verse Ping), inbox ayat masuk
- `/app/circle` — kelompok bertumbuh: buat/gabung circle via kode (`XXXX-XXXX`), emoji kustom
- `/app/circle/[id]` — detail circle: doa bersama, weekly mission, broadcast, daftar anggota
- `/app/pemimpin` — pendaftaran leader (pendeta/pelayan firman) untuk tools pastoral khusus
- Fitur leader: hingga 20 circle, 100 anggota/circle, buat weekly mission, kirim broadcast

### Administrasi

- `/contributor` — dasbor kontributor: statistik, buat/kirim renungan & khotbah (autosave draft lokal)
- `/admin` — dasbor admin: moderasi konten, manajemen pengguna & peran, kategori, tantangan bulanan, verifikasi leader, log audit
- Notifikasi push (Web Push/VAPID) untuk pengingat doa dan ayat harian — lihat `PushToggle` di `/app/profil` untuk mengaktifkan, dan bagian "Push notification" di bawah untuk setelan server

## Keterbatasan build ini (transparansi)

Master prompt aslinya meminta stack yang jauh lebih besar (aplikasi native Flutter, backend NestJS terpisah, provisioning cloud sungguhan, dsb). Untuk build yang bisa benar-benar dijalankan dan diverifikasi dalam satu sesi, cakupannya difokuskan pada satu aplikasi web full-stack yang solid. Yang **belum** termasuk:

- **Teks Alkitab**: struktur 66 kitab/pasal lengkap sudah ada, tapi isi ayat baru tersedia untuk kumpulan pasal pilihan (lihat `prisma/bible-verses.ts`) yang ditulis ulang secara orisinal — bukan salinan verbatim dari terjemahan berhak cipta (mis. Terjemahan Baru LAI). Untuk teks lengkap 66 kitab, sambungkan ke sumber berlisensi resmi (API.Bible, YouVersion, atau data resmi LAI).
- **Aplikasi mobile native** (Flutter/Android/iOS) belum dibangun — aplikasi web ini responsif dan terasa seperti aplikasi native di browser mobile, tapi bukan build native/App Store.
- **Alarm background native**: pengingat doa di tab yang terbuka memakai Web Notification API secara lokal. Pengiriman notifikasi sungguhan saat aplikasi tertutup memakai Web Push (VAPID) sungguhan — lihat bagian "Push notification" di bawah untuk keterbatasan penjadwalan di paket Vercel Hobby.
- **AI Pastor**: menggunakan LLM sungguhan lewat OpenRouter. Slug model gratis sering dipensiunkan, jadi `src/lib/ai-pastor/model.ts` memakai daftar kandidat dan menyaringnya terhadap katalog OpenRouter saat runtime — model yang sudah tidak ada otomatis dilewati. Dilengkapi intent engine, safety filter, dan doctrine rules untuk menjaga konteks rohani. Memerlukan `OPENROUTER_API_KEY` di environment.
- **Ayat penguat jurnal**: ayat penguat yang muncul setelah menulis jurnal dipilih lewat pencocokan kata kunci deterministik terhadap ~130 ayat kurasi (`src/lib/journal/verse-matcher.ts`). Cukup akurat untuk tema-tema umum (takut, sedih, cemas, syukur, dll.) tapi tidak memahami konteks bebas seperti LLM.
- **Google/Apple Login**: tombolnya ada di UI tapi memerlukan kredensial OAuth produksi untuk diaktifkan.
- **Upload & transcoding video/gambar**: kontributor menempelkan URL video yang sudah dihosting (belum ada pipeline upload + transcoding + virus scan).
- **Email transaksional**: reset kata sandi membuat token yang valid tapi baru di-log ke konsol server (belum ada provider email).
- **Notifikasi push memerlukan konfigurasi yang belum terpasang.** Kodenya lengkap, tapi tidak akan mengirim apa pun sampai empat hal ini ada — lihat "Menyalakan notifikasi" di bawah.
- **2FA, device fingerprinting, deteksi impossible-travel**: kolom skema sudah disiapkan (`twoFactorEnabled`, `Device` model) tapi alur lengkapnya belum diimplementasikan.
- **Video khotbah**: memakai klip placeholder yang di-generate lokal (`public/media/sample-sermon.webm`), bukan konten khotbah sungguhan.

## Deploy ke produksi

Database Postgres (Supabase, proyek `livyn`, region `ap-southeast-1`) sudah disiapkan dan diisi data awal yang sama seperti di atas.

1. Set `DATABASE_URL` di Vercel ke connection string Supabase (Project Settings → Database → Connection string; gunakan mode "Transaction" / connection pooling untuk fungsi serverless).
2. Set `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` yang kuat (`openssl rand -base64 48`) sebagai environment variable di Vercel — jangan pakai nilai dev.
3. Untuk AI Pastor, set `OPENROUTER_API_KEY` (dapatkan di https://openrouter.ai/keys). Opsional: set `AI_PASTOR_MODEL` (comma-separated, terbaik dulu) untuk mengarahkan pilihan model; defaultnya memakai daftar kandidat gratis di `src/lib/ai-pastor/model.ts`.
4. Untuk notifikasi push, set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (generate dengan `npx web-push generate-vapid-keys`), `VAPID_SUBJECT` (`mailto:...`), dan `CRON_SECRET` (string acak apa saja — Vercel Cron otomatis mengirimkannya sebagai header `Authorization: Bearer $CRON_SECRET` ke endpoint cron bila env var ini bernama persis `CRON_SECRET`).
5. Deploy ke Vercel. `NODE_ENV=production` otomatis mengaktifkan HSTS dan cookie `secure`.

### Menyalakan notifikasi

Notifikasi tidak akan terkirim sampai keempat hal ini terpasang. Ini murni konfigurasi
— kodenya sudah lengkap. Diagnosis 2026-07-30: workflow pengingat gagal **78 kali
berturut-turut** karena `CRON_SECRET` tidak pernah di-set di GitHub, dan tabel
`PushSubscription` masih kosong karena kunci VAPID belum ada sehingga tombol
notifikasi di Profil tidak pernah bisa mendaftarkan perangkat.

1. **Kunci VAPID di Vercel.** Generate dengan `npx web-push generate-vapid-keys`, lalu
   set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:...`), dan
   `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (nilainya sama dengan `VAPID_PUBLIC_KEY`). Yang
   terakhir masuk ke bundel klien saat build, jadi **wajib redeploy** setelah ditambah.
2. **`CRON_SECRET` di Vercel.** String acak apa saja, mis. `openssl rand -hex 32`.
3. **`CRON_SECRET` yang sama di GitHub** — Settings → Secrets and variables → Actions.
   Nilainya harus identik dengan yang di Vercel; kalau berbeda, endpoint menolak 401.
4. **Aktifkan di aplikasi.** Tiap pengguna harus menyalakan sendiri tombol notifikasi di
   `/app/profil` dan mengizinkan permintaan browser — tanpa itu tidak ada perangkat yang
   terdaftar dan tidak ada yang bisa dikirimi.

Untuk memastikan sudah benar: jalankan workflow "Prayer reminder push" secara manual
(Actions → Run workflow). Kalau konfigurasinya kurang, pesannya sekarang menyebut
persis apa yang hilang, bukan `401` telanjang.

### Push notification (Web Push)

`vercel.json` mendaftarkan cron job harian (`0 6 * * *`, jam 06:00) yang memanggil `/api/cron/push`. Endpoint ini:

- Selalu mengirim **ayat hari ini** sekali per hari (dedup lewat tabel `Setting`), ke semua pengguna yang sudah subscribe push — jadi ini tetap jalan penuh di paket Vercel **Hobby**, walau cron di sana dibatasi maksimal 1x/hari.
- Mengirim **pengingat doa** ke pengguna yang jadwalnya jatuh dalam jendela waktu (default 15 menit) sebelum cron berjalan — karena cron Hobby cuma jalan sekali sehari, dalam praktiknya ini hanya benar-benar akurat untuk pengingat yang jadwalnya berdekatan dengan jam 06:00.

Untuk pengingat doa real-time di jam berapa pun (bukan cuma sekitar jam 06:00), pilih salah satu:

- Upgrade ke Vercel **Pro** dan ubah jadwal di `vercel.json` menjadi lebih sering, mis. `*/5 * * * *`.
- Pakai scheduler eksternal gratis (cron-job.org, GitHub Actions `schedule`, dll.) yang memanggil `GET https://<domain>/api/cron/push` setiap beberapa menit dengan header `Authorization: Bearer <CRON_SECRET>`.

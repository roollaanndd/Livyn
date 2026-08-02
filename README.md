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

- `/` — landing page publik: satu penurunan sinematik dari orbit bumi sampai ke pintu gereja yang dilewati sambil menggulir, dengan pintu masuk ke aplikasi (lihat "Landing page" di bawah)
- `/mulai`, `/onboarding` — splash screen animasi + onboarding carousel (Bahasa Indonesia). `/mulai` adalah pintu masuk aplikasi yang sebelumnya ada di `/`; perilakunya tidak berubah (masuk → `/app`, kunjungan pertama → `/onboarding`, selebihnya → `/masuk`)
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

## Landing page (`/`)

Halaman depan publik dibangun dengan **scroll-world** ([github.com/oso95/scroll-world](https://github.com/oso95/scroll-world), MIT): saat pengunjung menggulir, kamera **turun tanpa putus dari orbit bumi sampai ke pintu sebuah gereja** — bumi dari luar angkasa, menembus atmosfer, kota dari ketinggian, atap-atap dan jendela yang menyala, gereja di antara gedung-gedung, mukanya, lalu pintunya yang terbuka. Pintu itu sekaligus pintu masuk aplikasi.

Urutan tujuh adegan itu adalah ketinggian kamera, jadi tidak bisa ditukar: `terang` (orbit) → `renungan` (atmosfer) → `alkitab` (kota dari atas) → `doa` (kota dari rendah) → `pastor` (jalan menuju gereja) → `circle` (halaman gereja) → `mulai` (pintunya). Teks tiap adegan tetap bicara soal fiturnya.

- `src/lib/scroll-world/scrub-engine.js` — mesin scroll-scrub dari skill itu, di-vendor apa adanya. Modifikasi lokal hanya dua (didokumentasikan di header file): `mountScrollWorld` mengembalikan `destroy()` dan ada ESM export, keduanya supaya navigasi client-side Next.js tidak meninggalkan rAF loop dan CSS global yang menempel.
- `src/lib/scroll-world/livyn-world.ts` — isi dunia: adegan, teks, dan tujuan tombol masuk. Tombol menyesuaikan pengunjung: yang belum masuk diarahkan ke `/mulai` (splash → onboarding/login), yang sudah masuk langsung ke `/app`, plus pintasan ke `/admin` atau `/contributor` sesuai peran.
- `scripts/build-scenes.mjs` → `public/scroll-world/scenes/*.svg` — gambar adegannya. Jalankan `node scripts/build-scenes.mjs` setelah mengubah skrip; hasilnya ikut di-commit. Adegan 3–7 bukan tujuh gambar terpisah: satu model kota yang sama difoto kamera pinhole yang sama dari lima ketinggian, jadi gereja yang cuma beberapa piksel di foto udara adalah gereja yang sama yang kamu berdiri di depannya di akhir. Adegan 1–2 (bumi dan atmosfer) digambar terpisah, memakai palet dan arah cahaya yang sama. Tiap adegan dirender dua kali: 16:9 untuk desktop dan **9:16 asli** untuk ponsel (`*-m.svg`, dipakai otomatis lewat `stillMobile`) — bukan hasil crop, karena crop 16:9 di layar ponsel cuma menampilkan sebagian kecil framenya.
- `src/lib/scroll-world/scene-manifest.json` — menentukan berkas mana yang dipakai tiap adegan. Defaultnya SVG di atas.

### Membangkitkan gambar adegan (versi fotografis)

Ada dua jalur, keduanya menghasilkan berkas yang sama dan diimpor dengan skrip yang sama.

**1. Lewat API Google (tidak butuh GPU) — `scripts/generate-scenes.mjs`**

```bash
export GEMINI_API_KEY=...          # gratis di https://aistudio.google.com/apikey
node scripts/generate-scenes.mjs                      # 7 adegan x 2 potongan
node scripts/generate-scenes.mjs --only mulai         # satu adegan saja
node scripts/generate-scenes.mjs --dry-run            # lihat promptnya, tanpa memanggil apa pun
node scripts/adopt-scenes.mjs .scene-renders/<tanggal>
```

Skrip ini mengirim isi `tools/fooocus/prompts/` — style preamble yang sama persis di depan tiap prompt — **plus frame SVG-nya sendiri sebagai referensi komposisi**. Referensi itu intinya: penurunan ini hanya jalan kalau tiap frame lebih rendah dari sebelumnya, dan menyerahkan geometri yang sudah dihitung ke model itulah yang menjaga gerejanya tetap di tempat yang sama, bukan kota baru tiap adegan. Pakai `--no-reference` untuk teks saja.

Model tidak di-hardcode: skrip menanyakan model gambar apa yang bisa dipakai kunci itu (`--list-models`) dan memilih yang paling berat. Adegan yang gagal tetap memakai SVG-nya, jadi run separuh jalan pun meninggalkan halaman yang utuh.

**2. Lewat Fooocus (butuh GPU, gratis, offline)**

SVG itu **placeholder** — dibuat dengan kode karena membangkitkan gambar butuh kredit atau GPU. [Fooocus](https://github.com/lllyasviel/Fooocus) menjalankan langkah itu secara lokal dan gratis di mesin ber-GPU; kitnya ada di `tools/fooocus/`. Prompt-nya sama dengan yang dipakai jalur pertama.

1. Bangkitkan tiap adegan memakai prompt di `tools/fooocus/prompts/` — **satu style preamble yang sama persis** di depan setiap prompt, karena pengulangan itulah yang membuat tujuh gambar terpisah terbaca sebagai satu dunia. Setelan lengkap ada di `tools/fooocus/prompts/README.md`.
2. Render dua kali: 1344×768 (desktop) dan 768×1344 (ponsel), namanya `<adegan>.png` dan `<adegan>-m.png`.
3. Impor:

   ```bash
   node scripts/adopt-scenes.mjs ~/fooocus/outputs/2026-08-01
   node scripts/adopt-scenes.mjs --reset    # kembali ke SVG
   ```

Skrip memvalidasi tiap berkas (termasuk menolak gambar landscape yang ditaruh di slot potret), menyalinnya ke `public/scroll-world/scenes/`, dan memperbarui manifest. Adegan yang belum dibangkitkan tetap memakai SVG-nya, jadi bisa dicicil satu per satu.
- Tidak ada perubahan apa pun di `/app`, `/admin`, atau `/contributor`.

### Yang belum ada: klip kamera

Bentuk penuh scroll-world memakai klip video hasil generasi AI yang di-*scrub* oleh posisi scroll — kamera betul-betul terbang masuk ke tiap adegan tanpa potongan. Klip itu **belum dibuat**: pipeline-nya butuh Monid/Higgsfield berbayar (≈ $27 untuk rantai 1080p tujuh adegan) plus `ffmpeg`, dan keduanya tidak tersedia di lingkungan build ini. Yang berjalan sekarang adalah lapisan still-nya: tiap adegan mendorong kameranya perlahan (`scale`) dan saling melarut di perbatasan — jadi halamannya tetap utuh, hanya belum sinematik.

Menambahkan klipnya nanti bersifat aditif — ikuti `SKILL.md` di repo scroll-world, lalu:

1. Taruh hasil encode di `public/scroll-world/clips/`.
2. Isi `clip` (dan `clipMobile`) di tiap adegan pada `livyn-world.ts`, dan isi `connectors` sepanjang `sections.length - 1`.
3. Tambahkan `blob:` ke direktif `media-src` di CSP (`src/proxy.ts`). Mesin ini memuat tiap klip sebagai `Blob` supaya selalu bisa di-*seek*, dan CSP saat ini (`media-src 'self' https:`) akan memblokirnya. Ini satu-satunya perubahan di luar folder landing page yang diperlukan.

Selama `clip` kosong, mesin memang sengaja tidak memuat video sama sekali.

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

**Region fungsi.** `vercel.json` menyetel `"regions": ["sin1"]` (Singapura) supaya fungsi
berjalan bersebelahan dengan database Supabase di `ap-southeast-1`. Aplikasi ini
berbicara ke database lewat HTTP (PostgREST), jadi setiap query membayar satu round
trip penuh; ketika fungsi masih di `iad1` (US East) setiap query menanggung ~220ms
latensi lintas Pasifik dan halaman yang melakukan beberapa query berurutan kehilangan
hampir satu detik hanya di jaringan. Kalau database dipindah region, ubah nilai ini
mengikutinya.

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

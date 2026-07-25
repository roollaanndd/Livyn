# Changelog

Semua perubahan penting pada proyek Livyn didokumentasikan di sini.

## [0.6.0] - 2026-07-25

### Ayat Harian Random & Polish UI

- **Ayat harian kurasi**: 160+ ayat pilihan dari seluruh Alkitab (Mazmur, Yohanes, Roma, Yesaya, Amsal, Filipi, dll.) dengan rotasi acak harian — tidak lagi berurutan dari Kejadian 1:1
- **Icon komunitas di home grid**: Grid quick-action diperluas jadi 2 baris — baris atas: Alkitab, Renungan, Doa, Jurnal; baris bawah: Teman, Circle, Bacaan, Tantangan
- **Rename "warga" menjadi "anak Tuhan"**: Akun demo diganti dari `warga@livyn.app` ke `anaktuhan@livyn.app`
- **Polish halaman home**: Spacing header dirapikan, card Reading Plan yang redundan dihapus (sudah di grid), section komunitas hanya muncul saat ada aktivitas

## [0.5.0] - 2026-07-24

### Sistem Komunitas

- **Pertemanan**: Undang teman via kode unik (`LVN-XXXX`), lihat daftar teman, hapus pertemanan
- **Verse Ping**: Kirim ayat ke teman sebagai pengingat rohani, inbox ayat masuk dengan status baca
- **Circle (Kelompok Bertumbuh)**: Buat atau gabung lingkaran via kode (`XXXX-XXXX`), emoji kustom, deskripsi
- **Doa Bersama**: Ajukan permintaan doa di circle, tandai sudah mendoakan, mode anonim, tandai terjawab
- **Weekly Mission**: Leader bisa membuat misi mingguan dengan kategori (baca, doa, puasa, penginjilan, pelayanan, kustom), anggota check-in dengan catatan
- **Broadcast**: Leader kirim pengumuman, catatan khotbah, atau fokus doa ke seluruh circle
- **Leader Role**: Pendeta/pelayan firman bisa mendaftar sebagai leader, admin memverifikasi, leader mendapat tools pastoral khusus (hingga 20 circle, 100 anggota per circle)
- **12 tabel database baru**: Friendship, FriendInviteCode, LeaderProfile, Circle, CircleMember, PrayerRequest, PrayerIntercession, VersePing, WeeklyMission, MissionCheckIn, CircleBroadcast
- **Halaman admin pemimpin**: Review queue untuk aplikasi leader

## [0.4.0] - 2026-07-24

### Redesign Renungan & Login

- **Renungan harian tematik**: 30 renungan kurasi dengan alur khotbah singkat (pembuka, merenungkan firman, aplikasi, refleksi, doa penutup)
- **Satu renungan per hari**: Tidak lagi daftar renungan — satu renungan tematik yang otomatis berubah setiap hari
- **Fitur bagikan**: Tombol share dengan Web Share API (mobile) dan clipboard fallback
- **Demo callout di login**: Arahkan pengguna baru untuk mencoba akun demo terlebih dahulu

## [0.3.0] - 2026-07-24

### Optimasi Kecepatan

- **SSR redirect**: Pengguna yang sudah login langsung ke `/app`, skip splash screen
- **Streaming home page**: Setiap section data di-wrap `<Suspense>` — header dan quick actions render langsung
- **Cache berlapis**: `unstable_cache` untuk data global (ayat, renungan, khotbah) + `React.cache()` untuk dedup per-request
- **Splash lebih cepat**: Waktu tunggu mandatory 2200ms turun ke 700ms, max auth wait 5000ms turun ke 2500ms
- **Bundle optimization**: `optimizePackageImports` untuk lucide-react, framer-motion, date-fns, recharts, sonner
- **Console stripping**: `removeConsole` di production (kecuali error dan warn)

## [0.2.0] - 2026-07-24

### AI Pastor (OpenRouter)

- **Model gratis**: Menggunakan `meta-llama/llama-4-maverick:free` via OpenRouter (sebelumnya Google Gemini)
- **Model konfigurasikan**: Env var `AI_PASTOR_MODEL` untuk mengganti model tanpa deploy ulang
- **Intent engine**: Deteksi otomatis apakah pengguna bertanya tentang Alkitab, doa, curhat, atau topik umum
- **Safety filter**: Perlindungan terhadap pertanyaan di luar konteks rohani
- **Doctrine rules**: Knowledge base doktrin Kristen untuk menjaga akurasi teologis

## [0.1.0] - 2026-07-23

### Rilis Awal

- Splash screen animasi + onboarding carousel (Bahasa Indonesia)
- Autentikasi lengkap: login, register, lupa sandi, demo account
- Dashboard home: ayat hari ini, renungan, pengingat doa, khotbah, peristiwa Kristiani
- Alkitab 66 kitab lengkap dengan navigasi, sorot ayat, catatan, pencarian
- Renungan per kategori dengan bookmark dan simpan offline
- Pengingat doa custom dengan streak dan notifikasi push (Web Push/VAPID)
- Khotbah video: streaming, lanjutkan menonton, mode audio, transkrip
- Jurnal "Curhat kepada Tuhan" dengan mood dan ayat penguat otomatis
- Tantangan baca Alkitab bulanan dengan poin dan level rohani
- Gambar ayat: generate dan share ke media sosial
- Dasbor kontributor: buat dan kirim renungan & khotbah
- Dasbor admin: moderasi, pengguna, kategori, tantangan, log audit
- RBAC: user, contributor, moderator, admin, super_admin
- Keamanan: Argon2id, JWT rotation, rate limiting, CSP, audit log

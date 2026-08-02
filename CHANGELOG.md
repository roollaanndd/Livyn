# Changelog

Semua perubahan penting pada proyek Livyn didokumentasikan di sini.

## [0.8.5] - 2026-08-02

### Halaman depan lancar di HP kentang

Diukur di emulasi ponsel dengan CPU di-throttle 6x, build produksi, scroll penuh dari orbit sampai pintu:

| | sebelum | sesudah |
|---|---|---|
| FPS saat menggulir | 19,7 | **50,4** |
| Frame terburuk | 650 ms | **133 ms** |
| Long task terburuk | 8,2 s | **1,07 s** |
| Total long task | 19,4 s | **3,3 s** |
| Waktu muat | 3,4 s | **1,0 s** |

- **Biang keroknya: `feGaussianBlur`.** Tiap halo lampu, bloom, dan kabut di adegan dibuat dengan filter blur SVG — satu adegan kota berisi **432** di antaranya. Tiap filter memaksa renderer mengalokasikan buffer terpisah dan mengonvolusinya saat gambar diraster; di HP lemah itu berarti main thread beku 8 detik. Semua diganti **gradien radial dengan stop luar transparan**: tampilannya sama pada radius segitu, biayanya cuma satu fill biasa. Sekarang nol filter di seluruh adegan.
- **Poster dipasang saat dibutuhkan, bukan semuanya sekaligus.** Mesin scroll-world dulu memberi `src` ke ketujuh gambar saat mount, jadi ponsel men-decode tujuh still detail dalam satu tugas. Kini `src` menyusul begitu adegannya mendekat (jendela 1,6 layar, sama seperti pemuatan klip), jadi ongkosnya dicicil sambil turun. Diuji dengan lompatan scroll cepat: tidak ada adegan yang kosong.
- **Adegan yang sudah lewat disembunyikan** (`visibility: hidden`, bukan cuma `opacity: 0`), jadi kompositor tidak lagi menahan tujuh lapisan selayar penuh di memori.
- **Loop rAF hanya jalan kalau ada klip video.** Selama belum ada klip, loop itu bangun tiap frame hanya untuk tidak melakukan apa-apa — di ponsel murah itu jank dan baterai.
- **Potongan potret (yang dipakai ponsel) dapat anggaran lebih kecil**: 700 jendela menyala (dari 1200), 130 lampu jalan (dari 300), bintang lebih sedikit, dan gedung di bawah 3,5 px dilewati. Berkasnya ikut turun ~15%.

## [0.8.4] - 2026-08-02

### Latar baru sudah ter-deploy tapi tidak kelihatan

- **Service worker menyandera gambar adegan.** `sw.js` memperlakukan **semua** `.svg` sebagai aset abadi dan menyajikannya *cache-first*, sementara berkas adegan memakai nama tetap (`/scroll-world/scenes/terang.svg`) yang isinya ditimpa tiap kali digambar ulang. Akibatnya siapa pun yang pernah membuka halaman depan akan terus melihat gambar lama selamanya — desain baru ter-deploy, tapi tidak ada yang bisa melihatnya. Aset di `/scroll-world/` sekarang memakai *stale-while-revalidate*: tampil instan dari cache, disegarkan di latar, jadi muatan berikutnya sudah gambar baru dengan sendirinya.
- `CACHE_NAME` dinaikkan ke `livyn-v3`, yang menghapus cache lama di `activate` — ini yang membebaskan perangkat yang sudah terlanjur menyimpan gambar lama.
- **URL adegan sekarang membawa hash isinya** (`terang.svg?v=996ec16d`), ditulis ke manifest oleh `build-scenes.mjs` dan `adopt-scenes.mjs`. Nama berkasnya tidak pernah berubah, jadi tanpa ini setiap lapis cache — service worker, browser, CDN — tetap menyajikan gambar sebelumnya. Entri yang sudah diarahkan ke hasil generate dibiarkan apa adanya, jadi halaman yang baru separuh digenerate tidak ikut kereset.

## [0.8.3] - 2026-08-02

### Landing page: satu penurunan dari orbit sampai pintu gereja

- **Latar halaman depan diganti total.** Sebelumnya tujuh diorama isometrik yang berdiri sendiri-sendiri; sekarang satu penurunan tanpa putus: bumi dari orbit (dengan Nusantara di tengah piringannya dan lampu-lampu kota di sisi malam) → menembus atmosfer di atas lapisan awan → kota dari ketinggian → atap dan jendela yang menyala → gereja di antara gedung-gedung → mukanya dengan mawar kaca dan salib yang menyala → pintunya yang terbuka. Pintu itu pintu masuk aplikasi.
- **Zoom-nya betulan, bukan tumpukan gambar.** Adegan 3–7 adalah satu model kota yang sama difoto kamera pinhole yang sama dari lima ketinggian (900 m → 6 m), jadi gereja yang cuma beberapa piksel di foto udara adalah gereja yang sama yang kamu berdiri di depannya di akhir. Push-in bawaan mesin scroll-world menutup jarak antar ketinggian, jadi sambungannya terbaca sebagai satu gerakan.
- Urutan adegan sekarang punya arti: ia adalah ketinggian kamera dan tidak bisa ditukar. Warna aksen tiap bagian mengikuti cahaya di ketinggian itu — biru dingin di orbit, menghangat sepanjang turun, emas di pintu.
- Tiap adegan tetap dirender dua kali, 16:9 dan 9:16 asli untuk ponsel, dan potret bukan hasil crop: bidang pandang horizontalnya sama sehingga gerejanya selebar itu juga di layar ponsel, hanya langit dan halamannya yang lebih banyak terlihat.
- Prompt Fooocus di `tools/fooocus/prompts/` ikut ditulis ulang mengikuti penurunan yang sama, jadi hasil generate nanti menggantikan SVG tanpa mengubah ceritanya.
- **`scripts/generate-scenes.mjs` baru**: membangkitkan ketujuh adegan sebagai foto lewat API gambar Google — tidak butuh GPU, tinggal `GEMINI_API_KEY`. Ia mengirim style preamble yang sama persis di depan tiap prompt **plus frame SVG-nya sebagai referensi komposisi**, supaya hasilnya tetap satu penurunan (kamera tidak pindah, gerejanya tidak berpindah blok) dan bukan tujuh kota yang berbeda. Model tidak di-hardcode — skripnya menanyakan model apa yang bisa dipakai kunci itu, lalu memilih yang paling berat. Adegan yang gagal tetap memakai SVG-nya, jadi run separuh jalan pun meninggalkan halaman yang utuh.
- Tidak ada perubahan di `/app`, `/admin`, atau `/contributor`.

## [0.8.2] - 2026-07-30

### Tantangan bulanan akhirnya benar-benar menghitung

- **Poin tidak pernah bertambah.** Adapter database membuang operand `{ increment: n }` — penulisannya sukses, tapi angkanya tidak pernah bergerak. Bukti di produksi: satu anggota sudah menandai 4 pasal, `pointsEarned`-nya mentok di 12 (nilai dari penandaan pertama, satu-satunya yang lewat jalur `create`), dan `User.points` masih **0**. Level dan progress bar karena itu tidak pernah naik. Increment/decrement kini diselesaikan terhadap nilai baris saat itu sebelum ditulis.
- **Dashboard kontributor crash setiap dibuka**: `prisma.devotion.aggregate` dipanggil padahal method itu tidak pernah ada di adapter. Kini diimplementasikan (`_sum`, `_avg`, `_min`, `_max`, `_count`).
- Daftar tabel `updatedAt` disamakan dengan schema: sebelumnya memuat `PasswordResetToken` yang tidak punya kolom itu (penulisan ke tabel itu akan ditolak database) dan melewatkan `User`, `Devotion`, `Sermon`, `Circle` yang punya — sehingga `updatedAt` keempatnya tidak pernah bergerak dari nilai saat dibuat.
- Ditambah 9 test untuk perilaku adapter ini (`npm test`).

### Loading antar menu

- **Fungsi dipindah ke region Singapura** (`sin1`). Database Supabase ada di `ap-southeast-1`, sementara fungsi berjalan di `iad1` (US East) — setiap query menyeberangi Pasifik dengan ~220ms round trip, dan satu halaman melakukan beberapa query berurutan. Ini penyebab terbesar lambatnya membuka menu.
- **Tab bawah kini prefetch penuh.** Semua route di aplikasi ini dinamis, dan Next.js hanya prefetch route dinamis sampai boundary `loading.tsx` — artinya yang tersimpan cuma spinner-nya, bukan datanya, jadi setiap ketukan tab menunggu render server dari nol.

### Notifikasi

- **Penyebab matinya notifikasi teridentifikasi, tapi perbaikannya ada di konfigurasi, bukan kode** — lihat README. Ringkasnya: `CRON_SECRET` tidak pernah di-set di GitHub Actions secrets, jadi workflow pengingat mengirim `Authorization: Bearer ` kosong dan ditolak 401 — **78 run gagal berturut-turut**. Selain itu belum ada satu pun `PushSubscription`, yang konsisten dengan kunci VAPID belum terpasang sehingga tombol notifikasi tidak pernah bisa mendaftar.
- Kegagalannya kini bisa didiagnosis: workflow berhenti dengan pesan eksplisit bila secret-nya kosong, dan `/api/cron/push` membedakan "secret server belum di-set" (503) dari "secret pemanggil salah" (401), serta melaporkan kunci VAPID mana yang hilang alih-alih melempar 500 di tengah jalan.
- Jadwal cron Vercel digeser ke `0 23 * * *` (06:00 WIB). Sebelumnya `0 6 * * *` UTC, yang berarti ayat pagi terkirim jam 13:00 WIB.

## [0.8.1] - 2026-07-28

### Gambar ayat dari koleksi favorit

- **Setiap ayat favorit bisa dibuatkan gambar**, sama seperti Ayat Hari Ini — format 9:16 siap untuk Story Instagram dan Status WhatsApp, lengkap dengan tombol simpan, bagikan, dan generate ulang.
- Generator dipakai ulang apa adanya, jadi hasilnya identik dengan kartu ayat harian. Ditambah varian **ringkas**: chip kecil di tiap kartu favorit, bukan tombol selebar layar yang akan mengubur ayat-ayatnya. Panel pratinjaunya tetap mengembang selebar kartu supaya gambar 9:16 tidak terjepit.
- **Teks generator ikut dwibahasa.** Sebelumnya semua labelnya — "Buat Gambar Ayat", "Membuat gambar...", "Simpan", "Bagikan", pesan galat — masih Indonesia walau aplikasi diatur ke English.

## [0.8.0] - 2026-07-28

### Home dirapikan

- **Kartu identitas tunggal**: sapaan, nama, level, poin, dan streak digabung ke satu kartu di paling atas. Sebelumnya kartu Poin/Level (gradien hijau) bersaing dengan kartu Ayat (gradien gelap) — dua hero yang saling melemahkan. Sekarang Ayat jadi satu-satunya hero.
- **Strip "Ritme hari ini"**: empat lingkaran (Ayat, Renungan, Doa, Jurnal) yang menjawab "hari ini aku sudah apa saja?". Statusnya diambil dari data nyata, bukan tebakan — doa dari `PrayerLog`, jurnal dari `JournalEntry`, ayat dan renungan dari tabel `DailyActivity` baru yang dicatat saat isinya benar-benar tampil di layar.
- **Kartu ganda dihapus**: Jurnal, Renungan, dan Tantangan sebelumnya muncul dua kali — sebagai ikon *dan* sebagai kartu. Kini masing-masing sekali.
- **8 ikon jadi 4 + "Lainnya"**: Alkitab, Doa, Circle, Khotbah tetap terlihat; sisanya lewat "Lainnya →" ke Profil.
- **Label pemisah**: "Ritme hari ini", "Lanjutkan", "Jelajahi" memecah tumpukan kartu jadi kelompok yang bisa dipindai.
- **Komunitas jadi satu kartu ringkas** dengan angka, bukan dua kartu terpisah.

### Dwibahasa Indonesia / English

- **Pemilih bahasa di Profil** (ID/EN), tersimpan di cookie sekaligus di kolom `User.language`, jadi pilihannya ikut ke perangkat lain saat login.
- **Urutan penentuan bahasa**: cookie → header `Accept-Language` browser → Indonesia.
- **Cakupan terjemahan**: Home, bottom nav, Profil, Doa, Ayat Favorit, layar persetujuan, S&K, dan Kebijakan Privasi. Dasbor admin/kontributor dan isi konten (renungan, ayat, khotbah) masih Indonesia — lihat README.
- Tidak memakai routing `/[lang]/…` supaya seluruh direktori `src/app` tidak perlu dipindah.

### Syarat & Ketentuan

- **Layar persetujuan sekali di awal** dengan satu centang, muncul sebelum masuk `/app`.
- **Disimpan di database** (`termsAcceptedAt` + `termsVersion`), bukan localStorage — persetujuan tidak hilang saat ganti perangkat, dan perubahan wording nanti bisa meminta persetujuan ulang hanya untuk yang belum setuju versi baru.
- **Ditegakkan di server** pada layout `/app`, bukan disembunyikan di UI.
- **Draf S&K dan Kebijakan Privasi** dalam dua bahasa, ditulis dari apa yang aplikasi ini benar-benar lakukan. Belum ditinjau ahli hukum.

### Fitur baru

- **Ayat Favorit**: simpan ayat dari kartu Ayat Hari Ini maupun dari pembaca Alkitab, beri catatan pribadi, lihat koleksinya di `/app/favorit`.
- **Doa pribadi & doa terjawab**: tulis doa pribadi (terpisah dari doa Circle), tandai terjawab beserta ceritanya, dan lihat daftar doa yang sudah dijawab.
- **Pengingat pintar**: Livyn mencatat jam kamu biasanya membuka aplikasi (histogram 24 jam di `User.habitHours`), lalu menawarkan memindahkan pengingat ke jam itu — atau mengambil alih penjadwalannya sepenuhnya lewat sakelar "ikuti jam kebiasaanku". Cron push menghormati setelan ini.
- **Popup notifikasi**: ajakan halus mengaktifkan notifikasi, muncul sekali dan hanya selama izin browser masih netral.

### Basis data

- Kolom baru pada `User`: `termsAcceptedAt`, `termsVersion`, `habitHours`.
- Kolom baru pada `PrayerReminder`: `autoAdjust`.
- Tabel baru: `FavoriteVerse`, `PersonalPrayer`, `DailyActivity`.

### Lain-lain

- `package.json` dinaikkan dari `0.1.0` ke `0.8.0`. Sebelumnya versi di `package.json` dan CHANGELOG tidak pernah disinkronkan.

## [0.7.0] - 2026-07-26

### Perbaikan PWA

- **Aplikasi tidak lagi basi setelah deploy**: service worker berhenti menyimpan halaman HTML ke cache. Sebelumnya setiap navigasi ikut di-cache, sehingga pengguna terus melihat versi lama aplikasi walau sudah ada rilis baru.
- **Kebocoran halaman antar akun ditutup**: halaman yang sudah login tidak lagi tersimpan di CacheStorage, jadi akun lain di perangkat bersama tidak bisa melihatnya.
- **Cache dinaikkan ke `livyn-v2`**: instalasi lama otomatis membuang cache basi saat service worker baru aktif.
- **Halaman offline benar-benar muncul**: memperbaiki `caches.match(...) || ...` yang tidak pernah jalan karena Promise selalu truthy — sebelumnya kondisi offline bisa berujung layar error, bukan halaman offline.
- **Instalasi service worker lebih tahan gagal**: satu URL precache yang gagal tidak lagi membatalkan seluruh instalasi.
- **Request RSC dan lintas-origin dilewati**: mencegah hydration mismatch setelah deploy.
- **Notifikasi**: klik notifikasi kini mengarahkan ulang window yang sudah terbuka, bukan menumpuk window baru.
- **Manifest dilengkapi**: `id`, `scope`, `lang`, `dir`, `display_override`, dan `launch_handler`. `id` disetel ke `/app` agar instalasi lama tidak dianggap aplikasi baru.
- **Service worker didaftarkan di root layout**: kini aktif juga di splash, onboarding, dan halaman login — bukan hanya setelah masuk `/app`.
- **Perbaikan font**: kelas `font-heading` tidak pernah didefinisikan di `globals.css`; diganti `font-display` di halaman offline, prompt instalasi, dan kartu rencana baca.

## [0.6.0] - 2026-07-25

### Ayat Harian Random & Polish UI

- **Ayat harian kurasi**: ayat pilihan bernilai renungan kuat (Mazmur, Yohanes, Roma, Yesaya, Amsal, Filipi, dll.) dengan rotasi acak harian — tidak lagi berurutan dari Kejadian 1:1. Daftar dibatasi pada ayat yang benar-benar ada di database, dengan fallback deterministik supaya kartu ayat dan image generator tidak pernah hilang dari home.
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

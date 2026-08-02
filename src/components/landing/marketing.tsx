import Link from "next/link";
import {
  BookOpen,
  BookMarked,
  Bell,
  MessageCircleHeart,
  NotebookPen,
  Video,
  Target,
  Users,
} from "lucide-react";
import { TryDemoButton } from "@/components/auth/try-demo-button";
import { LivynMark, LivynWordmark } from "@/components/brand/logo";
import "./marketing.css";

/**
 * Everything below the scroll cinematic.
 *
 * The flight is the hook; this is the part that answers "what is it, can I
 * try it, and can I trust it". It is deliberately ordinary server-rendered
 * HTML in normal flow — the cinematic above is one fixed canvas with its copy
 * injected by script, which reads beautifully and indexes badly, so the
 * substance lives here where crawlers and link previews can see it.
 */

const FEATURES = [
  {
    icon: BookOpen,
    title: "Renungan harian",
    body: "Alur khotbah singkat setiap hari — pembuka, merenungkan firman, aplikasi, dan doa penutup.",
  },
  {
    icon: BookMarked,
    title: "Alkitab",
    body: "Navigasi 66 kitab, sorot ayat yang menguatkan, dan tulis catatan pribadimu sendiri.",
  },
  {
    icon: Bell,
    title: "Pengingat doa",
    body: "Tentukan waktumu sendiri — pagi, siang, malam. Livyn menjaga ritmenya, bukan mengganggumu.",
  },
  {
    icon: MessageCircleHeart,
    title: "AI Pastor",
    body: "Tanya tentang Alkitab, minta ditemani berdoa, atau bicara soal apa yang sedang berat.",
  },
  {
    icon: NotebookPen,
    title: "Jurnal",
    body: "Curhat kepada Tuhan lewat tulisan, catat suasana hatimu, dan pulang membawa satu ayat penguat.",
  },
  {
    icon: Video,
    title: "Khotbah",
    body: "Tonton atau dengarkan saja, lanjutkan dari tempat terakhir, lengkap dengan transkrip.",
  },
  {
    icon: Target,
    title: "Tantangan & rencana baca",
    body: "Rencana bacaan harian yang terstruktur dan tantangan bulanan untuk menjaga langkahmu.",
  },
  {
    icon: Users,
    title: "Teman & circle",
    body: "Undang teman lewat kode unik, kirim ayat penguat, dan berdoa bersama dalam circle kecil.",
  },
];

const FAQ = [
  {
    q: "Apakah Livyn gratis?",
    a: "Ya. Buat akun gratis, atau coba dulu tanpa mendaftar sama sekali lewat akun demo.",
  },
  {
    q: "Perlu mengunduh aplikasi?",
    a: "Tidak. Livyn berjalan di browser dan bisa dipasang ke layar utama ponsel seperti aplikasi biasa.",
  },
  {
    q: "Bisa dipakai tanpa sinyal?",
    // The offline feature is a one-time download of the whole Bible into
    // IndexedDB (src/lib/bible/offline-store.ts), not a per-chapter save —
    // an earlier draft of this answer said chapters, which was wrong.
    a: "Bisa. Unduh Alkitab sekali dari halaman Alkitab, dan setelah itu teks yang tersimpan tetap terbaca tanpa koneksi. Fitur lain memerlukan sinyal.",
  },
  {
    q: "Apakah jurnal dan doaku bersifat pribadi?",
    a: "Jurnal dan pengingat doamu hanya untukmu. Yang kamu bagikan ke circle hanya yang kamu pilih sendiri.",
  },
  {
    q: "Bagaimana dengan notifikasi?",
    a: "Notifikasi harus kamu aktifkan sendiri di halaman Profil, dan bisa dimatikan kapan saja.",
  },
  {
    q: "Apakah ada iklan atau feed tanpa akhir?",
    a: "Tidak ada iklan, tidak ada like, tidak ada follower. Livyn sengaja dibuat untuk selesai, lalu kamu tutup.",
  },
];

export function Marketing({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="lv-page">
      <section className="lv-section" id="fitur" aria-labelledby="fitur-judul">
        <p className="lv-eyebrow">Isi aplikasinya</p>
        <h2 className="lv-h2" id="fitur-judul">
          Semua yang kamu butuhkan untuk berjalan setiap hari.
        </h2>
        <ul className="lv-grid">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li className="lv-card" key={title}>
              <span className="lv-card__icon" aria-hidden="true">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="lv-card__title">{title}</h3>
              <p className="lv-card__body">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="lv-section lv-cta" aria-labelledby="coba-judul">
        {/* The demo account is the shortest path into the product, so it leads
            here rather than sitting behind the sign-up form. */}
        <h2 className="lv-h2" id="coba-judul">
          {signedIn ? "Lanjutkan perjalananmu." : "Lihat sendiri, tanpa mendaftar."}
        </h2>
        <p className="lv-lede">
          {signedIn
            ? "Renungan hari ini, pengingat doamu, dan circle-mu sudah menunggu di dalam."
            : "Masuk ke akun demo dan telusuri seluruh aplikasi. Kalau cocok, buat akunmu sendiri — gratis."}
        </p>
        <div className="lv-actions">
          {signedIn ? (
            <Link className="lv-btn lv-btn--primary" href="/app">
              Buka Livyn
            </Link>
          ) : (
            <>
              <TryDemoButton variant="primary" className="lv-demo" />
              <Link className="lv-btn lv-btn--ghost" href="/daftar">
                Buat akun gratis
              </Link>
            </>
          )}
        </div>
        {/* The product's own line, kept as-is. No invented testimonials,
            numbers, or logos live on this page. */}
        <p className="lv-proof">Ribuan orang telah bertumbuh bersama Livyn.</p>
      </section>

      <section className="lv-section" id="tanya" aria-labelledby="tanya-judul">
        <p className="lv-eyebrow">Pertanyaan umum</p>
        <h2 className="lv-h2" id="tanya-judul">
          Hal-hal yang biasanya ditanyakan.
        </h2>
        <div className="lv-faq">
          {FAQ.map(({ q, a }) => (
            <details className="lv-faq__item" key={q}>
              <summary className="lv-faq__q">{q}</summary>
              <p className="lv-faq__a">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="lv-footer">
        <div className="lv-footer__brand">
          <LivynMark className="h-8 w-8" gradientId="footer-mark" />
          <div>
            <LivynWordmark className="text-lg text-white" />
            <p className="lv-footer__tag">Faith. Every Day. Every Step.</p>
          </div>
        </div>
        <nav className="lv-footer__links" aria-label="Tautan footer">
          {signedIn ? (
            <Link href="/app">Buka aplikasi</Link>
          ) : (
            <>
              <Link href="/masuk">Masuk</Link>
              <Link href="/daftar">Daftar</Link>
            </>
          )}
          <Link href="/syarat-ketentuan">Syarat &amp; Ketentuan</Link>
          <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
        </nav>
        <p className="lv-footer__legal">
          © {new Date().getFullYear()} Livyn. Dibuat untuk menemani, bukan untuk merebut waktumu.
        </p>
      </footer>
    </div>
  );
}

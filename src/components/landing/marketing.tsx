import Link from "next/link";
import {
  LivynBell,
  LivynBible,
  LivynCircle,
  LivynDevotion,
  LivynHeart,
  LivynJournal,
  LivynMoonStar,
  LivynOffline,
  LivynPrayer,
  LivynSermon,
  LivynShieldCheck,
  LivynSun,
  LivynSunrise,
  LivynTarget,
} from "@/components/icons/livyn-icons";
import { TryDemoButton } from "@/components/auth/try-demo-button";
import { LivynMark, LivynWordmark } from "@/components/brand/logo";
import { SiteHeader } from "./site-header";
import { RevealOnScroll } from "./reveal";
import "./marketing.css";

/**
 * Everything below the scroll cinematic.
 *
 * The flight is the hook; this is the part that answers "what is it, can I
 * try it, and can I trust it". It is deliberately ordinary server-rendered
 * HTML in normal flow — the cinematic above is one fixed canvas with its copy
 * injected by script, which reads beautifully and indexes badly, so the
 * substance lives here where crawlers and link previews can see it.
 *
 * It also has to stand on its own: a visitor who arrives on a slow phone, or
 * who skips the flight entirely, should still meet the promise, the proof and
 * the entrance. That is why the page opens with its own headline and call to
 * action rather than starting cold on a feature grid.
 *
 * Nothing here is invented. No testimonials, no customer logos, no numbers we
 * cannot point at inside the product.
 */

/** The three beats of a day with Livyn — the product's whole shape in one read. */
const RHYTHM = [
  {
    icon: LivynSunrise,
    when: "Pagi",
    title: "Mulai dengan satu firman.",
    body: "Renungan hari ini dengan alur khotbah singkat — pembuka, merenungkan firman, aplikasi, doa penutup. Selesai sebelum kopimu dingin.",
    where: ["Renungan harian", "Ayat hari ini"],
  },
  {
    icon: LivynSun,
    when: "Siang",
    title: "Berhenti sejenak.",
    body: "Pengingat doa di waktu yang kamu tentukan sendiri, dan ayat penguat yang dikirim teman satu circle-mu saat kamu sedang berat.",
    where: ["Pengingat doa", "Verse Ping"],
  },
  {
    icon: LivynMoonStar,
    when: "Malam",
    title: "Tutup harimu dengan jujur.",
    body: "Tulis apa adanya di jurnal, catat suasana hatimu, atau bicara dengan AI Pastor — dan pulang membawa satu ayat untuk besok.",
    where: ["Jurnal & mood", "AI Pastor"],
  },
];

/** The two surfaces people open every day lead; the rest follow. */
const FEATURES = [
  {
    icon: LivynDevotion,
    title: "Renungan harian",
    body: "Alur khotbah singkat setiap hari — pembuka, merenungkan firman, aplikasi, dan doa penutup. Berbeda setiap hari, siap dibagikan sebagai kartu.",
    lead: true,
  },
  {
    icon: LivynBible,
    title: "Alkitab",
    body: "Navigasi 66 kitab, sorot ayat yang menguatkan, tulis catatan pribadimu sendiri, dan cari apa pun. Unduh sekali untuk dibaca tanpa sinyal.",
    lead: true,
  },
  {
    icon: LivynBell,
    title: "Pengingat doa",
    body: "Tentukan waktumu sendiri — pagi, siang, malam. Livyn menjaga ritmenya, bukan mengganggumu.",
  },
  {
    icon: LivynPrayer,
    title: "AI Pastor",
    body: "Tanya tentang Alkitab, minta ditemani berdoa, atau bicara soal apa yang sedang berat.",
  },
  {
    icon: LivynJournal,
    title: "Jurnal",
    body: "Curhat kepada Tuhan lewat tulisan, catat suasana hatimu, dan pulang membawa satu ayat penguat.",
  },
  {
    icon: LivynSermon,
    title: "Khotbah",
    body: "Tonton atau dengarkan saja, lanjutkan dari tempat terakhir, lengkap dengan transkrip.",
  },
  {
    icon: LivynTarget,
    title: "Tantangan & rencana baca",
    body: "Rencana bacaan harian yang terstruktur dan tantangan bulanan untuk menjaga langkahmu.",
  },
  {
    icon: LivynCircle,
    title: "Teman & circle",
    body: "Undang teman lewat kode unik, kirim ayat penguat, dan berdoa bersama dalam circle kecil.",
  },
];

/** The product's oldest promise, stated as a list instead of a clause. */
const ABSENT = [
  "Tidak ada iklan.",
  "Tidak ada like, tidak ada follower.",
  "Tidak ada feed tanpa akhir.",
  "Tidak ada notifikasi yang tidak kamu minta.",
];

const PRESENT = [
  "Satu firman untuk hari ini.",
  "Ritme doa yang kamu atur sendiri.",
  "Tempat jujur untuk menulis dan bertanya.",
  "Beberapa orang yang benar-benar mendoakanmu.",
];

/** Each of these is a behaviour of the app, not a slogan. */
const TRUST = [
  {
    icon: LivynShieldCheck,
    title: "Jurnal dan doamu pribadi.",
    body: "Isi jurnal dan pengingat doamu hanya untukmu. Yang sampai ke circle hanya yang kamu pilih sendiri untuk dibagikan.",
  },
  {
    icon: LivynBell,
    title: "Notifikasi kamu yang menyalakan.",
    body: "Tidak ada notifikasi sampai kamu mengaktifkannya sendiri di halaman Profil — dan bisa dimatikan lagi kapan saja.",
  },
  {
    icon: LivynOffline,
    title: "Tetap terbaca tanpa sinyal.",
    body: "Unduh Alkitab sekali dari halaman Alkitab, lalu teks yang tersimpan tetap bisa dibaca saat koneksi hilang.",
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

/** Facts, each one checkable inside the product. */
const CHIPS = ["66 kitab, bisa offline", "Renungan baru setiap hari", "Tanpa iklan", "Gratis"];

export { FAQ as LANDING_FAQ };

export function Marketing({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="lv-page">
      <RevealOnScroll />
      <SiteHeader signedIn={signedIn} />

      {/* The seam. The flight ends here, so the page restates the promise in
          plain HTML and puts the entrance within reach immediately — a visitor
          who skipped the cinematic has still met the product by this point. */}
      <section className="lv-section lv-intro" aria-labelledby="intro-judul">
        <p className="lv-eyebrow" data-reveal>
          Faith. Every Day. Every Step.
        </p>
        <h1 className="lv-h1" id="intro-judul" data-reveal>
          Iman yang ditemani, <span className="lv-gold">setiap hari</span>.
        </h1>
        <p className="lv-lede" data-reveal>
          Renungan, Alkitab, pengingat doa, jurnal, khotbah, dan circle kecil untuk bertumbuh
          bersama — dalam satu tempat yang tenang, berbahasa Indonesia.
        </p>
        <div className="lv-actions lv-actions--start" data-reveal>
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
        <ul className="lv-chips" data-reveal>
          {CHIPS.map((chip) => (
            <li className="lv-chip" key={chip}>
              {chip}
            </li>
          ))}
        </ul>
      </section>

      <section className="lv-section" id="ritme" aria-labelledby="ritme-judul">
        <p className="lv-eyebrow" data-reveal>
          Sehari bersama Livyn
        </p>
        <h2 className="lv-h2" id="ritme-judul" data-reveal>
          Dibuat untuk selesai, lalu kamu tutup.
        </h2>
        <p className="lv-lede" data-reveal>
          Livyn tidak meminta waktumu seharian. Tiga perhentian singkat, lalu kembali ke hidupmu.
        </p>
        <ol className="lv-rhythm">
          {RHYTHM.map(({ icon: Icon, when, title, body, where }, i) => (
            <li className="lv-beat" key={when} data-reveal style={{ "--i": i } as React.CSSProperties}>
              <span className="lv-beat__icon" aria-hidden="true">
                <Icon className="h-5 w-5" />
              </span>
              <p className="lv-beat__when">{when}</p>
              <h3 className="lv-beat__title">{title}</h3>
              <p className="lv-beat__body">{body}</p>
              <ul className="lv-beat__where">
                {where.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="lv-section" id="fitur" aria-labelledby="fitur-judul">
        <p className="lv-eyebrow" data-reveal>
          Isi aplikasinya
        </p>
        <h2 className="lv-h2" id="fitur-judul" data-reveal>
          Semua yang kamu butuhkan untuk berjalan setiap hari.
        </h2>
        <ul className="lv-grid">
          {FEATURES.map(({ icon: Icon, title, body, lead }, i) => (
            <li
              className={lead ? "lv-card lv-card--lead" : "lv-card"}
              key={title}
              data-reveal
              style={{ "--i": i % 4 } as React.CSSProperties}
            >
              <span className="lv-card__icon" aria-hidden="true">
                <Icon className={lead ? "h-6 w-6" : "h-5 w-5"} />
              </span>
              <h3 className="lv-card__title">{title}</h3>
              <p className="lv-card__body">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* The anti-feed promise has been in the copy since the first version as
          a subordinate clause. It is the reason most people stay, so it gets
          its own moment. */}
      <section className="lv-section lv-contrast" aria-labelledby="tenang-judul">
        <div className="lv-contrast__head">
          <p className="lv-eyebrow" data-reveal>
            Yang sengaja tidak ada
          </p>
          <h2 className="lv-h2" id="tenang-judul" data-reveal>
            Aplikasi rohani yang tidak berusaha merebut waktumu.
          </h2>
        </div>
        <div className="lv-contrast__cols">
          <ul className="lv-list lv-list--absent" data-reveal>
            {ABSENT.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <ul className="lv-list lv-list--present" data-reveal>
            {PRESENT.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lv-section" id="ketenangan" aria-labelledby="privasi-judul">
        <p className="lv-eyebrow" data-reveal>
          Privasi & ketenangan
        </p>
        <h2 className="lv-h2" id="privasi-judul" data-reveal>
          Yang kamu tulis tetap milikmu.
        </h2>
        <ul className="lv-trust">
          {TRUST.map(({ icon: Icon, title, body }, i) => (
            <li className="lv-trust__item" key={title} data-reveal style={{ "--i": i } as React.CSSProperties}>
              <span className="lv-trust__icon" aria-hidden="true">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="lv-trust__title">{title}</h3>
                <p className="lv-trust__body">{body}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="lv-note" data-reveal>
          Selengkapnya di{" "}
          <Link href="/kebijakan-privasi">Kebijakan Privasi</Link> dan{" "}
          <Link href="/syarat-ketentuan">Syarat &amp; Ketentuan</Link>.
        </p>
      </section>

      <section className="lv-section lv-cta" aria-labelledby="coba-judul">
        {/* The demo account is the shortest path into the product, so it leads
            here rather than sitting behind the sign-up form. */}
        <h2 className="lv-h2" id="coba-judul" data-reveal>
          {signedIn ? "Lanjutkan perjalananmu." : "Lihat sendiri, tanpa mendaftar."}
        </h2>
        <p className="lv-lede" data-reveal>
          {signedIn
            ? "Renungan hari ini, pengingat doamu, dan circle-mu sudah menunggu di dalam."
            : "Masuk ke akun demo dan telusuri seluruh aplikasi. Kalau cocok, buat akunmu sendiri — gratis."}
        </p>
        <div className="lv-actions" data-reveal>
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
        {/* Only things that are true of the product itself. The line that used
            to sit here claimed a user count nobody could check. */}
        <p className="lv-proof" data-reveal>
          Gratis, tanpa iklan, dan bisa dicoba tanpa membuat akun.
        </p>
      </section>

      <section className="lv-section" id="tanya" aria-labelledby="tanya-judul">
        <p className="lv-eyebrow" data-reveal>
          Pertanyaan umum
        </p>
        <h2 className="lv-h2" id="tanya-judul" data-reveal>
          Hal-hal yang biasanya ditanyakan.
        </h2>
        <div className="lv-faq">
          {FAQ.map(({ q, a }) => (
            <details className="lv-faq__item" key={q} data-reveal>
              <summary className="lv-faq__q">
                <span>{q}</span>
                <span className="lv-faq__sign" aria-hidden="true" />
              </summary>
              <p className="lv-faq__a">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="lv-footer">
        <div className="lv-footer__top">
          <div className="lv-footer__brand">
            <LivynMark className="h-9 w-9" gradientId="footer-mark" />
            <div>
              <LivynWordmark className="text-lg text-[color:var(--lv-text)]" />
              <p className="lv-footer__tag">Faith. Every Day. Every Step.</p>
            </div>
          </div>

          <nav className="lv-footer__cols" aria-label="Tautan footer">
            <div className="lv-footer__col">
              <h2 className="lv-footer__h">Halaman</h2>
              <a href="#ritme">Ritme harian</a>
              <a href="#fitur">Fitur</a>
              <a href="#ketenangan">Privasi &amp; ketenangan</a>
              <a href="#tanya">Pertanyaan umum</a>
            </div>
            <div className="lv-footer__col">
              <h2 className="lv-footer__h">Aplikasi</h2>
              {signedIn ? (
                <>
                  <Link href="/app">Buka aplikasi</Link>
                  <Link href="/app/devosi">Renungan hari ini</Link>
                  <Link href="/app/alkitab">Alkitab</Link>
                </>
              ) : (
                <>
                  <Link href="/mulai">Mulai gratis</Link>
                  <Link href="/masuk">Masuk</Link>
                  <Link href="/daftar">Buat akun</Link>
                </>
              )}
            </div>
            <div className="lv-footer__col">
              <h2 className="lv-footer__h">Legal</h2>
              <Link href="/syarat-ketentuan">Syarat &amp; Ketentuan</Link>
              <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
            </div>
          </nav>
        </div>

        <p className="lv-footer__legal">
          <LivynHeart className="h-3.5 w-3.5" />© {new Date().getFullYear()} Livyn.
          Dibuat untuk menemani, bukan untuk merebut waktumu.
        </p>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { LivynMark, LivynWordmark } from "@/components/brand/logo";

/**
 * The bar that takes over when the cinematic retires.
 *
 * It is `position: sticky` at the top of `.lv-page`, which means it appears at
 * exactly the same instant the flight hands the screen over — the engine's own
 * fixed top bar is retired by the `.sw-done` class the moment `.lv-page` hits
 * the top of the viewport, which is also the moment this starts sticking. No
 * scroll listener, no JS, and nothing to fall out of sync.
 *
 * Before this existed, everything below the flight had no navigation at all:
 * the only way back to the entrance was the footer at the very bottom.
 */
export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="lv-bar">
      <div className="lv-bar__inner">
        <Link className="lv-bar__brand" href="/" aria-label="Livyn — beranda">
          <LivynMark className="h-7 w-7" gradientId="bar-mark" />
          <LivynWordmark className="text-base text-[color:var(--lv-text)]" />
        </Link>

        <nav className="lv-bar__nav" aria-label="Bagian halaman">
          <a href="#ritme">Ritme</a>
          <a href="#fitur">Fitur</a>
          <a href="#ketenangan">Ketenangan</a>
          <a href="#tanya">Tanya</a>
        </nav>

        <div className="lv-bar__actions">
          {signedIn ? (
            <Link className="lv-btn lv-btn--primary lv-btn--sm" href="/app">
              Buka Livyn
            </Link>
          ) : (
            <>
              <Link className="lv-bar__link" href="/masuk">
                Masuk
              </Link>
              <Link className="lv-btn lv-btn--primary lv-btn--sm" href="/mulai">
                Mulai gratis
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

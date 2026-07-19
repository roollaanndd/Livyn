// Computes upcoming Christian holidays relative to "now", including movable
// feasts derived from Easter (Anonymous Gregorian algorithm).

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export type ChristianEvent = { name: string; date: Date };

function eventsForYear(year: number): ChristianEvent[] {
  const easter = easterSunday(year);
  return [
    { name: "Tahun Baru", date: new Date(year, 0, 1) },
    { name: "Jumat Agung", date: addDays(easter, -2) },
    { name: "Paskah", date: easter },
    { name: "Kenaikan Isa Almasih", date: addDays(easter, 39) },
    { name: "Pentakosta", date: addDays(easter, 49) },
    { name: "Malam Natal", date: new Date(year, 11, 24) },
    { name: "Natal", date: new Date(year, 11, 25) },
  ];
}

export function upcomingChristianEvents(count = 3, from: Date = new Date()): ChristianEvent[] {
  const all = [...eventsForYear(from.getFullYear()), ...eventsForYear(from.getFullYear() + 1)];
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return all
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, count);
}

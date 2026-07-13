// Dini günler ve geceler — Hicri tarihlerinden hesaplanır.
// Kandil geceleri, ilgili Hicri günün bir önceki akşamı başlar;
// listede Diyanet takvimindeki gibi gecenin yaşandığı akşamın tarihi gösterilir.

import { nextOccurrence, fromHijri, toHijri, DAY_MS } from "./hijri.js";

// eve: true => gece bir önceki akşam idrak edilir (kandiller)
const FIXED_DAYS = [
  { month: 1, day: 1,  name: "Hicri Yılbaşı",            type: "gun",    eve: false },
  { month: 1, day: 10, name: "Aşure Günü",               type: "gun",    eve: false },
  { month: 3, day: 12, name: "Mevlid Kandili",           type: "kandil", eve: true },
  { month: 7, day: 1,  name: "Üç Ayların Başlangıcı",    type: "gun",    eve: false },
  { month: 7, day: 27, name: "Mirac Kandili",            type: "kandil", eve: true },
  { month: 8, day: 15, name: "Berat Kandili",            type: "kandil", eve: true },
  { month: 9, day: 1,  name: "Ramazan'ın Başlangıcı",    type: "gun",    eve: false },
  { month: 9, day: 27, name: "Kadir Gecesi",             type: "kandil", eve: true },
  { month: 10, day: 1, name: "Ramazan Bayramı 1. Gün",   type: "bayram", eve: false },
  { month: 10, day: 2, name: "Ramazan Bayramı 2. Gün",   type: "bayram", eve: false },
  { month: 10, day: 3, name: "Ramazan Bayramı 3. Gün",   type: "bayram", eve: false },
  { month: 12, day: 9,  name: "Arefe Günü",              type: "gun",    eve: false },
  { month: 12, day: 10, name: "Kurban Bayramı 1. Gün",   type: "bayram", eve: false },
  { month: 12, day: 11, name: "Kurban Bayramı 2. Gün",   type: "bayram", eve: false },
  { month: 12, day: 12, name: "Kurban Bayramı 3. Gün",   type: "bayram", eve: false },
  { month: 12, day: 13, name: "Kurban Bayramı 4. Gün",   type: "bayram", eve: false },
];

// Regaib Kandili: Recep ayının ilk cuma gecesi (perşembeyi cumaya bağlayan gece)
function regaibDate(afterDate) {
  const hNow = toHijri(afterDate);
  for (let y = hNow.year; y <= hNow.year + 2; y++) {
    const recep1 = fromHijri(y, 7, 1);
    if (!recep1) continue;
    // 1 Recep'ten itibaren ilk perşembe (gecesi cuma)
    const d = new Date(recep1);
    while (d.getDay() !== 4) d.setDate(d.getDate() + 1);
    if (d.getTime() >= afterDate.getTime() - DAY_MS / 2) return d;
  }
  return null;
}

// Bugünden itibaren yaklaşan dini günler (tarihe göre sıralı)
export function upcomingDays(now, count = 8) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const list = [];

  for (const f of FIXED_DAYS) {
    let g = nextOccurrence(f.month, f.day, today);
    if (!g) continue;
    if (f.eve) g = new Date(g.getTime() - DAY_MS); // gecenin yaşandığı akşam
    if (g.getTime() < today.getTime()) {
      // akşam kaydırması geçmişe düştüyse bir sonraki yılı al
      const next = nextOccurrence(f.month, f.day, new Date(today.getTime() + 30 * DAY_MS));
      if (!next) continue;
      g = new Date(next.getTime() - (f.eve ? DAY_MS : 0));
    }
    list.push({ ...f, date: g });
  }

  const regaib = regaibDate(today);
  if (regaib) list.push({ name: "Regaib Kandili", type: "kandil", date: regaib, eve: true });

  list.sort((a, b) => a.date - b.date);
  return list.slice(0, count);
}

export function daysUntil(now, date) {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((date - a) / DAY_MS);
}

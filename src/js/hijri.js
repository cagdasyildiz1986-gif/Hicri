// Hicri takvim dönüşümleri — tarayıcıya gömülü Umm al-Qura (islamic-umalqura)
// takvimi üzerinden çalışır. Diyanet takvimiyle nadiren 1 gün fark olabilir.

const HIJRI_MONTHS = [
  "Muharrem", "Safer", "Rebiülevvel", "Rebiülahir",
  "Cemaziyelevvel", "Cemaziyelahir", "Recep", "Şaban",
  "Ramazan", "Şevval", "Zilkade", "Zilhicce",
];

const partsFmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
  day: "numeric", month: "numeric", year: "numeric",
  timeZone: "Europe/Istanbul",
});

// Miladi -> Hicri: { day, month (1-12), year }
export function toHijri(date) {
  const parts = {};
  for (const p of partsFmt.formatToParts(date)) {
    if (p.type === "day" || p.type === "month") parts[p.type] = Number(p.value);
    if (p.type === "year") parts.year = parseInt(p.value, 10);
  }
  return { day: parts.day, month: parts.month, year: parts.year };
}

export function hijriMonthName(month) {
  return HIJRI_MONTHS[month - 1];
}

export function formatHijri(h) {
  return `${h.day} ${hijriMonthName(h.month)} ${h.year}`;
}

export const DAY_MS = 24 * 60 * 60 * 1000;

// Hicri yılın Miladi karşılığı yaklaşık: hicriYıl * 354.367 + epoch.
// Buradan tahmin yürütüp Intl ile doğrulayarak Hicri -> Miladi çevrilir.
export function fromHijri(hYear, hMonth, hDay) {
  // Kaba tahmin: Hicri epoch 16 Temmuz 622, ortalama yıl 354.367 gün
  const approxDays = (hYear - 1) * 354.367 + (hMonth - 1) * 29.53 + (hDay - 1);
  let guess = new Date(Date.UTC(622, 6, 16) + Math.round(approxDays) * DAY_MS);
  // Tahminin etrafında ±3 gün tarayarak tam eşleşmeyi bul
  for (let i = 0; i < 90; i++) {
    const h = toHijri(guess);
    if (h.year === hYear && h.month === hMonth && h.day === hDay) return guess;
    const diff =
      (hYear - h.year) * 354 + (hMonth - h.month) * 29.5 + (hDay - h.day);
    guess = new Date(guess.getTime() + Math.round(diff || Math.sign(diff) || 1) * DAY_MS);
  }
  return null;
}

// Verilen Hicri ay/günün, verilen tarihten sonraki ilk Miladi karşılığı
export function nextOccurrence(hMonth, hDay, after) {
  const hNow = toHijri(after);
  for (let y = hNow.year; y <= hNow.year + 2; y++) {
    const g = fromHijri(y, hMonth, hDay);
    if (g && g.getTime() >= after.getTime() - DAY_MS / 2) return g;
  }
  return null;
}

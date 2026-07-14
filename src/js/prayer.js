// Namaz vakitleri — güneş konumu astronomik formüllerle cihazda hesaplanır.
// Yöntem: Diyanet'e uyumlu açılar (İmsak 18°, Yatsı 17°), İkindi gölge katsayısı 1.
// Diyanet'in yayımladığı vakitlerle birkaç dakikalık temkin farkı olabilir.

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

// Gün numarası (J2000'den itibaren), UTC öğlen referanslı
function julianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// Güneşin deklinasyonu ve zaman denklemi (dakika) — NOAA yaklaşımı
function solarParams(jd) {
  const d = jd - 2451545.0;
  const g = rad((357.529 + 0.98560028 * d) % 360);
  const q = (280.459 + 0.98564736 * d) % 360;
  const L = rad((q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) % 360);
  const e = rad(23.439 - 0.00000036 * d);
  const decl = Math.asin(Math.sin(e) * Math.sin(L));
  let RA = deg(Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L))) / 15;
  RA = (RA + 24) % 24;
  const eqt = ((q / 15 - RA + 12) % 24 - 12) * 60; // dakika
  return { decl, eqt };
}

// Güneşin verilen açı kadar ufkun altında olduğu saat açısı (saat cinsinden)
function hourAngle(angle, lat, decl) {
  const cosH =
    (-Math.sin(rad(angle)) - Math.sin(rad(lat)) * Math.sin(decl)) /
    (Math.cos(rad(lat)) * Math.cos(decl));
  if (cosH < -1 || cosH > 1) return null; // kutup bölgeleri
  return deg(Math.acos(cosH)) / 15;
}

// İkindi: gölge = cisim boyu * katsayı + öğlen gölgesi olduğu an
function asrHourAngle(factor, lat, decl) {
  const tanAlt = 1 / (factor + Math.tan(Math.abs(rad(lat) - decl)));
  const alt = Math.atan(tanAlt);
  const cosH =
    (Math.sin(alt) - Math.sin(rad(lat)) * Math.sin(decl)) /
    (Math.cos(rad(lat)) * Math.cos(decl));
  if (cosH < -1 || cosH > 1) return null;
  return deg(Math.acos(cosH)) / 15;
}

// Bir günün vakitleri. tzOffset: saat (Türkiye için 3).
export function prayerTimes(date, lat, lon, tzOffset = 3) {
  // Yerel öğlen civarını referans al
  const noonUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12 - tzOffset);
  const { decl, eqt } = solarParams(julianDay(new Date(noonUTC)));

  // Güneşin meridyen geçişi (yerel saat, ondalık)
  const transit = 12 + tzOffset - lon / 15 - eqt / 60;

  const sunH = hourAngle(0.833, lat, decl); // doğuş/batış (kırılma + yarıçap)
  const fajrH = hourAngle(18, lat, decl);
  const ishaH = hourAngle(17, lat, decl);
  const asrH = asrHourAngle(1, lat, decl);

  const t = (h) => {
    if (h == null) return null;
    const dt = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    dt.setMinutes(Math.round(h * 60));
    return dt;
  };

  return {
    imsak: t(fajrH != null ? transit - fajrH : null),
    gunes: t(sunH != null ? transit - sunH : null),
    ogle: t(transit + 5 / 60), // küçük temkin payı
    ikindi: t(asrH != null ? transit + asrH : null),
    aksam: t(sunH != null ? transit + sunH + 7 / 60 : null), // Diyanet temkini ~7 dk
    yatsi: t(ishaH != null ? transit + ishaH : null),
  };
}

export const PRAYER_NAMES = [
  ["imsak", "İmsak"],
  ["gunes", "Güneş"],
  ["ogle", "Öğle"],
  ["ikindi", "İkindi"],
  ["aksam", "Akşam"],
  ["yatsi", "Yatsı"],
];

// Şu andan önceki son vakit; gün başındaysa dünün yatsısı
export function prevPrayer(now, lat, lon) {
  const today = prayerTimes(now, lat, lon);
  let son = null;
  for (const [key, name] of PRAYER_NAMES) {
    if (today[key] && today[key] <= now) son = { key, name, time: today[key] };
  }
  if (son) return son;
  const dun = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const t = prayerTimes(dun, lat, lon);
  return { key: "yatsi", name: "Yatsı", time: t.yatsi };
}

// Şu andan sonraki ilk vakit; gün bittiyse yarının imsağı
export function nextPrayer(now, lat, lon) {
  const today = prayerTimes(now, lat, lon);
  for (const [key, name] of PRAYER_NAMES) {
    if (today[key] && today[key] > now) return { key, name, time: today[key] };
  }
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const t = prayerTimes(tomorrow, lat, lon);
  return { key: "imsak", name: "İmsak", time: t.imsak };
}

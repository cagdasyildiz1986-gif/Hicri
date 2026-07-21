// Kandil/bayram hatırlatması — uygulama AÇIKKEN, yaklaşan kandil/bayram için
// "1 gün önce" ve "aynı gün" bir kez bilgilendirir (Ayarlar'da açık/kapalı).
// Arka planda (uygulama kapalı) bildirim, Capacitor sürümüne aittir.
import { upcomingDays, daysUntil } from "./religiousDays.js";

function isoGun(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function kandilBanner(metin) {
  let el = document.getElementById("hatirlatma-banner");
  if (!el) {
    el = document.createElement("div");
    el.id = "hatirlatma-banner";
    el.className = "hatirlatma-banner";
    el.addEventListener("click", () => el.classList.remove("acik"));
    document.body.appendChild(el);
  }
  el.textContent = metin;
  el.classList.add("acik");
  clearTimeout(kandilBanner._z);
  kandilBanner._z = setTimeout(() => el.classList.remove("acik"), 12000);
}

// now: şu an; ayarlar: getAyarlar() sonucu (kandilHatirlatma bayrağı).
export function kandilKontrol(now, ayarlar) {
  if (!ayarlar || ayarlar.kandilHatirlatma === false) return;
  const liste = upcomingDays(now, 8).filter(
    (d) => d.type === "kandil" || d.type === "bayram"
  );
  for (const g of liste) {
    const fark = daysUntil(now, g.date);
    if (fark !== 0 && fark !== 1) continue;
    const anahtar = `hicri.hat.${g.name}.${isoGun(g.date)}.${fark}`;
    if (localStorage.getItem(anahtar)) continue; // bir kez göster
    let metin;
    if (fark === 1) metin = `🌙 Yarın ${g.name}`;
    else metin = g.eve ? `🌙 Bu akşam ${g.name}` : `🌙 Bugün ${g.name}`;
    kandilBanner(metin);
    localStorage.setItem(anahtar, "1");
    return; // aynı anda tek hatırlatma yeter
  }
}

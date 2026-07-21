// Vakit/ezan uyarısı — uygulama AÇIKKEN vakit girince, Ayarlar'daki vakit
// tercihine göre ses/titreşim/banner gösterir.
//
// Kapsam notu: Tam ezan kaydı (telifsiz) ve uygulama KAPALIYKEN çalışan arka
// plan bildirimi, Capacitor (Android/iOS) sürümüne aittir. Web'de şimdilik:
//   ses    → kısa çan + banner        titresim → titreşim + banner
//   ezan   → kısa çan + banner (tam ezan mobilde)   sessiz → hiçbir şey
import { PRAYER_NAMES, prayerTimes } from "./prayer.js";

let sesCtx = null;

// Kısa iki tonlu çan (E5 → A5). Paylaşılan AudioContext varsa onu kullanır.
export function calCan() {
  try {
    const ctx = sesCtx || new (window.AudioContext || window.webkitAudioContext)();
    sesCtx = ctx;
    if (ctx.state === "suspended") ctx.resume();
    const notalar = [[659.25, 0], [880, 0.18]];
    for (const [frekans, gecikme] of notalar) {
      const osc = ctx.createOscillator();
      const kazanc = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frekans;
      const t = ctx.currentTime + gecikme;
      kazanc.gain.setValueAtTime(0, t);
      kazanc.gain.linearRampToValueAtTime(0.25, t + 0.02);
      kazanc.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      osc.connect(kazanc).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.8);
    }
  } catch { /* ses desteklenmiyorsa sessizce geç */ }
}

// Ses iznini kullanıcı hareketiyle hazırla (mobilde otomatik ses engelini aşar).
export function sesHazirla() {
  try {
    sesCtx = sesCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (sesCtx.state === "suspended") sesCtx.resume();
  } catch { /* yok say */ }
}

// Ekranın üstünde kısa süreli banner.
function banner(metin) {
  let el = document.getElementById("ezan-banner");
  if (!el) {
    el = document.createElement("div");
    el.id = "ezan-banner";
    el.className = "ezan-banner";
    el.addEventListener("click", () => el.classList.remove("acik"));
    document.body.appendChild(el);
  }
  el.textContent = metin;
  el.classList.add("acik");
  clearTimeout(banner._z);
  banner._z = setTimeout(() => el.classList.remove("acik"), 8000);
}

// Bir vakit girdiğinde tercihe göre uyarı ver.
export function vakitUyar(vakitAd, mod) {
  if (mod === "sessiz") return;
  banner(`🕌 ${vakitAd} vakti girdi`);
  if (mod === "titresim") { navigator.vibrate?.([120, 60, 120]); return; }
  calCan(); // "ses" ve "ezan" için (tam ezan mobil sürümde)
}

let sonKontrol = null;

// app.js'in saniyelik döngüsünden çağrılır. sonKontrol ile şimdi arasında
// bir vakit sınırı geçildiyse o vakti bir kez bildirir.
export function vakitDenetle(now, city, ayarlar) {
  const t = now.getTime();
  if (sonKontrol === null) { sonKontrol = t; return; } // ilk çağrıda geçmişi tetikleme
  if (t <= sonKontrol) { sonKontrol = t; return; }
  const vakitler = prayerTimes(now, city.lat, city.lon);
  for (const [key, ad] of PRAYER_NAMES) {
    const vt = vakitler[key];
    if (vt && vt.getTime() > sonKontrol && vt.getTime() <= t) {
      vakitUyar(ad, ayarlar.sesler?.[key] || "sessiz");
    }
  }
  sonKontrol = t;
}

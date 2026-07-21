// Vakit/ezan uyarısı — uygulama AÇIKKEN vakit girince, Ayarlar'daki vakit
// tercihine göre ses/titreşim/banner gösterir.
//
// Ses tasarımı:
//   ses    → kısa iki tonlu çan
//   ezan   → varsa bundled gerçek kayıt (sounds/ezan.mp3); yoksa uzunca,
//            saygılı bir hatırlatma ezgisi (WebAudio). Banner'da "Durdur".
//   titresim → titreşim
//   sessiz → hiçbir şey
//
// Kapsam notu: uygulama KAPALIYKEN çalışan arka plan bildirimi Capacitor
// (Android/iOS) sürümüne aittir.
import { PRAYER_NAMES, prayerTimes } from "./prayer.js";

let sesCtx = null;
let aktifDurdur = null; // o an çalan sesi durdurma fonksiyonu

function ctxAl() {
  sesCtx = sesCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (sesCtx.state === "suspended") sesCtx.resume();
  return sesCtx;
}

// Ses iznini kullanıcı hareketiyle hazırla (mobilde otomatik ses engelini aşar).
export function sesHazirla() {
  try { ctxAl(); } catch { /* yok say */ }
}

// Kısa iki tonlu çan (E5 → A5).
export function calKisa() {
  try {
    const ctx = ctxAl();
    for (const [frekans, gecikme] of [[659.25, 0], [880, 0.18]]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frekans;
      const t = ctx.currentTime + gecikme;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.8);
    }
  } catch { /* ses desteklenmiyorsa sessizce geç */ }
}
// Geriye dönük ad (Ayarlar önizlemesi kısa sesi kullanır).
export const calCan = calKisa;

// Uzunca hatırlatma ezgisi (Hicaz benzeri, yumuşak çan). Gerçek ezan kaydı
// eklenene kadar "ezan" modunda çalar. Durdurma fonksiyonu döndürür.
function ezgiCal() {
  try {
    const ctx = ctxAl();
    const t0 = ctx.currentTime + 0.05;
    const usta = ctx.createGain();
    usta.gain.value = 0.3;
    usta.connect(ctx.destination);
    const nota = (f, dt, sure) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      const t = t0 + dt;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.9, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + sure);
      osc.connect(g).connect(usta);
      osc.start(t);
      osc.stop(t + sure + 0.05);
      return osc;
    };
    const D = 293.66, Eb = 311.13, Fs = 369.99, G = 392.0;
    const dizi = [
      [D, 0, 1.1], [Eb, 0.55, 1.0], [Fs, 1.15, 1.3], [G, 1.95, 1.1],
      [Fs, 2.6, 1.1], [Eb, 3.2, 1.2], [D, 3.95, 1.8],
    ];
    const oscs = dizi.map(([f, dt, sure]) => nota(f, dt, sure));
    return () => {
      try {
        usta.gain.cancelScheduledValues(ctx.currentTime);
        usta.gain.setValueAtTime(0.0001, ctx.currentTime);
        oscs.forEach((o) => { try { o.stop(); } catch { /* zaten durdu */ } });
      } catch { /* yok say */ }
    };
  } catch {
    return () => {};
  }
}

// "ezan" modu: önce gerçek kayıt (sounds/ezan.mp3), yoksa ezgi. Durdurma döndürür.
function calEzan() {
  let ezgiDurdur = null;
  let audio = null;
  try {
    audio = new Audio(new URL("sounds/ezan.mp3", document.baseURI).href);
    audio.addEventListener("error", () => { if (!ezgiDurdur) ezgiDurdur = ezgiCal(); });
    audio.play().catch(() => { if (!ezgiDurdur) ezgiDurdur = ezgiCal(); });
  } catch {
    ezgiDurdur = ezgiCal();
  }
  return () => {
    try { if (audio) { audio.pause(); audio.currentTime = 0; } } catch { /* yok say */ }
    if (ezgiDurdur) ezgiDurdur();
  };
}

// Ekranın üstünde kısa süreli banner; uzun ses çalarken "Durdur" düğmesi.
function banner(metin, durdur) {
  let el = document.getElementById("ezan-banner");
  if (!el) {
    el = document.createElement("div");
    el.id = "ezan-banner";
    el.className = "ezan-banner";
    document.body.appendChild(el);
  }
  el.innerHTML = `<span class="ezan-banner-metin"></span>`
    + (durdur ? `<button class="ezan-durdur" type="button">Durdur</button>` : "");
  el.querySelector(".ezan-banner-metin").textContent = metin;
  el.classList.add("acik");
  const kapat = () => el.classList.remove("acik");
  el.onclick = kapat;
  if (durdur) {
    el.querySelector(".ezan-durdur").addEventListener("click", (e) => {
      e.stopPropagation();
      durdur();
      aktifDurdur = null;
      kapat();
    });
  }
  clearTimeout(banner._z);
  banner._z = setTimeout(kapat, durdur ? 20000 : 8000);
}

// Çalan sesi durdur (yeni uyarı gelince veya kullanıcı isteyince).
export function ezanDurdur() {
  if (aktifDurdur) { aktifDurdur(); aktifDurdur = null; }
}

// Bir vakit girdiğinde tercihe göre uyarı ver.
export function vakitUyar(vakitAd, mod) {
  if (mod === "sessiz") return;
  ezanDurdur(); // önceki sesi kes
  if (mod === "titresim") {
    banner(`🕌 ${vakitAd} vakti girdi`);
    navigator.vibrate?.([120, 60, 120]);
    return;
  }
  if (mod === "ezan") {
    aktifDurdur = calEzan();
    banner(`🕌 ${vakitAd} vakti — ezan`, ezanDurdur);
    navigator.vibrate?.(200);
    return;
  }
  banner(`🕌 ${vakitAd} vakti girdi`); // "ses"
  calKisa();
}

// Ayarlar önizlemesi için: seçilen modu bir kez çalıştır (banner'sız ses/titreşim).
export function moduOnizle(mod) {
  if (mod === "ses") return calKisa();
  if (mod === "titresim") return void navigator.vibrate?.([120, 60, 120]);
  if (mod === "ezan") { ezanDurdur(); aktifDurdur = calEzan(); }
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

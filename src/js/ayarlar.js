// Ayarlar — vakit başına ezan/bildirim tercihleri (Aşama 6 altyapısı).
// Sesli bildirimlerin kendisi mobil (Capacitor) sürümde etkinleşecek;
// tercihler şimdiden saklanır.

import { PRAYER_NAMES } from "./prayer.js";

const SES_SECENEKLERI = [
  ["ezan", "Ezan"],
  ["ses", "Kısa Ses"],
  ["titresim", "Titreşim"],
  ["sessiz", "Sessiz"],
];

const VARSAYILAN = {
  sesler: {
    imsak: "ses", gunes: "sessiz", ogle: "ezan",
    ikindi: "ezan", aksam: "ezan", yatsi: "ezan",
  },
  kandilHatirlatma: true,
};

export function getAyarlar() {
  try {
    const s = JSON.parse(localStorage.getItem("hicri.ayarlar") || "{}");
    return {
      ...VARSAYILAN, ...s,
      sesler: { ...VARSAYILAN.sesler, ...(s.sesler || {}) },
    };
  } catch {
    return { ...VARSAYILAN, sesler: { ...VARSAYILAN.sesler } };
  }
}

function kaydet(a) {
  localStorage.setItem("hicri.ayarlar", JSON.stringify(a));
}

// Kısa bildirim sesi önizlemesi — WebAudio ile iki tonlu zarif bir çan
function onizlemeSesi() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notalar = [[659.25, 0], [880, 0.18]]; // E5 → A5
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

export function initAyarlar(root, kapat) {
  const a = getAyarlar();

  function ciz() {
    root.innerHTML = `
      <div class="og-geri-bar">
        <button class="tk-btn" id="ay-kapat" aria-label="Kapat">‹</button>
        <span class="og-baslik">Ayarlar</span>
        <span class="tk-btn gizli"></span>
      </div>

      <h3 class="og-bolum-baslik">Vakit Bildirimleri</h3>
      <p class="footnote" style="text-align:left">
        Sesli bildirimler ve ezan, uygulamanın Android/iOS sürümünde çalışacak;
        tercihlerin şimdiden kaydediliyor.</p>
      <div class="ay-liste">
        ${PRAYER_NAMES.map(([key, ad]) => `
          <div class="ay-satir">
            <span class="ay-vakit">${ad}</span>
            <div class="chips ay-chips">
              ${SES_SECENEKLERI.map(([sid, sad]) => `
                <button class="chip${a.sesler[key] === sid ? " on" : ""}"
                        data-vakit="${key}" data-ses="${sid}">${sad}</button>`).join("")}
            </div>
          </div>`).join("")}
      </div>

      <div class="bosluk"></div>
      <button class="tk-bugun-btn" id="ay-onizle">Kısa Sesi Dinle</button>

      <h3 class="og-bolum-baslik" style="margin-top:1.2rem">Dini Gün Hatırlatmaları</h3>
      <div class="ay-satir">
        <span class="ay-vakit">Kandil ve bayramlardan bir gün önce hatırlat</span>
        <button class="chip${a.kandilHatirlatma ? " on" : ""}" id="ay-kandil">
          ${a.kandilHatirlatma ? "Açık" : "Kapalı"}</button>
      </div>

      <p class="footnote">Ezan kaydı, telif durumu netleşmiş bir kayıtla
      mobil sürümde eklenecektir (bkz. PLAN.md, Aşama 6).</p>
    `;

    root.querySelector("#ay-kapat").addEventListener("click", kapat);
    root.querySelector("#ay-onizle").addEventListener("click", onizlemeSesi);
    root.querySelector("#ay-kandil").addEventListener("click", () => {
      a.kandilHatirlatma = !a.kandilHatirlatma;
      kaydet(a);
      ciz();
    });
    root.querySelectorAll("[data-vakit]").forEach((b) =>
      b.addEventListener("click", () => {
        a.sesler[b.dataset.vakit] = b.dataset.ses;
        kaydet(a);
        if (b.dataset.ses === "titresim") navigator.vibrate?.(60);
        if (b.dataset.ses === "ses") onizlemeSesi();
        ciz();
      })
    );
  }

  ciz();
}

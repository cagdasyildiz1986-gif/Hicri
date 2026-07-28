// Ayarlar — vakit başına ezan/bildirim tercihleri (Aşama 6 altyapısı).
// Sesli bildirimlerin kendisi mobil (Capacitor) sürümde etkinleşecek;
// tercihler şimdiden saklanır.

import { PRAYER_NAMES } from "./prayer.js";
import { calKisa, moduOnizle, ezanOnizle } from "./ezan.js";

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

// İl bazında vakit ince ayarı (dakika) — il adına göre saklanır.
const KAL_BOS = { imsak: 0, gunes: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0 };

export function getKalibrasyon(il) {
  try {
    const hepsi = JSON.parse(localStorage.getItem("hicri.kalibrasyon") || "{}");
    return { ...KAL_BOS, ...(hepsi[il] || {}) };
  } catch {
    return { ...KAL_BOS };
  }
}

function kaydetKalibrasyon(il, o) {
  let hepsi = {};
  try { hepsi = JSON.parse(localStorage.getItem("hicri.kalibrasyon") || "{}"); } catch { /* boş */ }
  hepsi[il] = o;
  localStorage.setItem("hicri.kalibrasyon", JSON.stringify(hepsi));
}

// Kısa bildirim sesi önizlemesi — çan sesi ezan.js'te paylaşılır.
const onizlemeSesi = calKisa;

export function initAyarlar(root, kapat, il = "", onKalibre = () => {}) {
  const a = getAyarlar();
  let kal = getKalibrasyon(il);
  let ezanDur = null; // çalan ezan önizlemesini durdurma fonksiyonu

  const isaretli = (dk) => (dk > 0 ? `+${dk}` : `${dk}`) + " dk";

  function ezanOnizleDurdur() {
    if (ezanDur) { ezanDur(); ezanDur = null; }
  }

  function ciz() {
    ezanOnizleDurdur(); // yeniden çizimde çalan önizlemeyi kes
    root.innerHTML = `
      <div class="og-geri-bar">
        <button class="tk-btn" id="ay-kapat" aria-label="Kapat">‹</button>
        <span class="og-baslik">Ayarlar</span>
        <span class="tk-btn gizli"></span>
      </div>

      <h3 class="og-bolum-baslik">Vakit Bildirimleri</h3>
      <p class="footnote" style="text-align:left">
        Uygulama açıkken vakit girince, seçtiğin tercihe göre ses/titreşim çalar
        ve ekranda uyarı çıkar. Uygulama kapalıyken bildirim, Android/iOS
        sürümünde eklenecek.</p>
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
      <div class="ay-dinle">
        <button class="tk-bugun-btn" id="ay-onizle">Kısa Sesi Dinle</button>
        <button class="tk-bugun-btn" id="ay-ezan-dinle">Ezanı Dinle</button>
      </div>
      <p class="footnote" style="text-align:left">"Ezan" seçeneğinde vakit girince
      ezan kaydı çalar; ekrandaki ve buradaki düğmeyle durdurabilirsin.</p>

      <h3 class="og-bolum-baslik" style="margin-top:1.2rem">Vakit İnce Ayarı${il ? ` — ${il}` : ""}</h3>
      <p class="footnote" style="text-align:left">Vakitler cihazda hesaplanır.
      İlinin Diyanet takvimiyle birkaç dakika farkı olursa buradan vakit vakit
      düzelt; ayar ${il ? il : "bu il"} için kaydedilir.</p>
      <div class="ay-liste">
        ${PRAYER_NAMES.map(([key, ad]) => `
          <div class="ay-satir">
            <span class="ay-vakit">${ad}</span>
            <div class="kal-adim">
              <button class="kal-btn" data-kal="${key}" data-delta="-1" aria-label="${ad} bir dakika azalt">−</button>
              <span class="kal-deger" data-kal-deger="${key}">${isaretli(kal[key])}</span>
              <button class="kal-btn" data-kal="${key}" data-delta="1" aria-label="${ad} bir dakika artır">+</button>
            </div>
          </div>`).join("")}
      </div>
      <button class="chip" id="ay-kal-sifirla" style="margin-top:0.2rem">Sıfırla</button>

      <h3 class="og-bolum-baslik" style="margin-top:1.2rem">Dini Gün Hatırlatmaları</h3>
      <div class="ay-satir">
        <span class="ay-vakit">Kandil ve bayramlardan bir gün önce hatırlat</span>
        <button class="chip${a.kandilHatirlatma ? " on" : ""}" id="ay-kandil">
          ${a.kandilHatirlatma ? "Açık" : "Kapalı"}</button>
      </div>

      <h3 class="og-bolum-baslik" style="margin-top:1.2rem">Hakkında</h3>
      <div class="ay-baglantilar">
        <a class="ay-baglanti" href="./gizlilik.html" target="_blank" rel="noopener">Gizlilik Politikası ›</a>
        <a class="ay-baglanti" href="./kosullar.html" target="_blank" rel="noopener">Kullanım Koşulları ›</a>
      </div>
    `;

    root.querySelector("#ay-kapat").addEventListener("click", () => {
      ezanOnizleDurdur();
      kapat();
    });
    root.querySelector("#ay-onizle").addEventListener("click", onizlemeSesi);

    const ezanBtn = root.querySelector("#ay-ezan-dinle");
    ezanBtn.addEventListener("click", () => {
      if (ezanDur) { ezanOnizleDurdur(); return; } // çalıyorsa durdur
      ezanBtn.textContent = "Ezanı Durdur ⏹";
      ezanBtn.classList.add("on");
      ezanDur = ezanOnizle(() => {
        ezanDur = null;
        ezanBtn.textContent = "Ezanı Dinle";
        ezanBtn.classList.remove("on");
      });
    });
    root.querySelectorAll(".kal-btn").forEach((b) =>
      b.addEventListener("click", () => {
        const key = b.dataset.kal;
        const d = Number(b.dataset.delta);
        kal[key] = Math.max(-30, Math.min(30, (kal[key] || 0) + d));
        kaydetKalibrasyon(il, kal);
        root.querySelector(`[data-kal-deger="${key}"]`).textContent = isaretli(kal[key]);
        onKalibre(); // vakitleri ve ezanı yeni ayara göre tazele
      }));
    root.querySelector("#ay-kal-sifirla").addEventListener("click", () => {
      kal = { ...KAL_BOS };
      kaydetKalibrasyon(il, kal);
      onKalibre();
      ciz();
    });
    root.querySelector("#ay-kandil").addEventListener("click", () => {
      a.kandilHatirlatma = !a.kandilHatirlatma;
      kaydet(a);
      ciz();
    });
    root.querySelectorAll("[data-vakit]").forEach((b) =>
      b.addEventListener("click", () => {
        a.sesler[b.dataset.vakit] = b.dataset.ses;
        kaydet(a);
        moduOnizle(b.dataset.ses);
        ciz();
      })
    );
  }

  ciz();
}

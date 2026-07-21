// Birlikte Hadis Öğreniyoruz — çevrimdışı, cihazda çalışan hadis öğrenme.
// Sahih kaynaklardan seçilmiş hadisleri okur, "Öğrendim" ile işaretler,
// ilerlemeni görürsün. Sunucu/hesap gerekmez.
import { HADISLER } from "./daily.js";

function hadisYukle() {
  try {
    const s = JSON.parse(localStorage.getItem("hicri.hadis") || "{}");
    return { ogrenilen: {}, ...s };
  } catch {
    return { ogrenilen: {} };
  }
}
function hadisKaydet(s) { localStorage.setItem("hicri.hadis", JSON.stringify(s)); }

// Güne göre değişen "günün hadisi" indeksi (kararlı).
function gununHadisi(now = new Date()) {
  const baslangic = new Date(now.getFullYear(), 0, 0);
  const gun = Math.floor((now - baslangic) / 86400000);
  return gun % HADISLER.length;
}

export function initZincir(root, kapat) {
  const veri = hadisYukle();
  const bugun = gununHadisi();

  function geriBar(baslik, hedef) {
    return `<div class="og-geri-bar">
      <button class="tk-btn" id="hd-geri" data-hedef="${hedef}" aria-label="Geri">‹</button>
      <span class="og-baslik">${baslik}</span>
      <span class="tk-btn gizli"></span>
    </div>`;
  }
  function baglaGeri() {
    root.querySelector("#hd-geri")?.addEventListener("click", (e) => {
      if (e.currentTarget.dataset.hedef === "kapat") kapat();
      else listeCiz();
    });
  }

  function listeCiz() {
    const ogrenilenSayi = HADISLER.filter((_, i) => veri.ogrenilen[i]).length;
    const oran = Math.round((ogrenilenSayi / HADISLER.length) * 100);
    root.innerHTML = `
      ${geriBar("Birlikte Hadis Öğreniyoruz", "kapat")}
      <p class="footnote" style="text-align:left">Her gün bir hadis okuyup öğrenelim,
      birlikte yaşatalım. Okuduğunu "Öğrendim" ile işaretle; ilerlemen aşağıda.</p>
      <div class="hatim-ozet">
        <div class="hatim-sayac"><span>${ogrenilenSayi}</span><label>Öğrenilen</label></div>
        <div class="hatim-ilerleme">
          <div class="hatim-cubuk"><div class="hatim-dolu" style="width:${oran}%"></div></div>
          <span class="footnote">${ogrenilenSayi}/${HADISLER.length} hadis</span>
        </div>
      </div>
      <button class="zn-baslat-btn" id="hd-gunun">🌟 Günün Hadisini Oku</button>
      <h3 class="og-bolum-baslik">Hadisler</h3>
      <ul class="og-menu">
        ${HADISLER.map((h, i) => {
          const ogr = !!veri.ogrenilen[i];
          return `<li><button class="og-madde" data-i="${i}">
            <div class="og-madde-metin">
              <span class="og-ad">${h[1]}${i === bugun ? " · <b>bugün</b>" : ""}</span>
              <span class="og-alt">“${h[0].slice(0, 64)}${h[0].length > 64 ? "…" : ""}”</span>
            </div>
            <span class="hd-rozet${ogr ? " on" : ""}">${ogr ? "✓" : ""}</span>
          </button></li>`;
        }).join("")}
      </ul>`;
    baglaGeri();
    root.querySelector("#hd-gunun").addEventListener("click", () => detayCiz(bugun));
    root.querySelectorAll(".og-madde").forEach((b) =>
      b.addEventListener("click", () => detayCiz(Number(b.dataset.i))));
  }

  function detayCiz(i) {
    const h = HADISLER[i];
    const ogr = !!veri.ogrenilen[i];
    root.innerHTML = `
      ${geriBar("Hadis", "liste")}
      <article class="og-detay">
        <div class="daily-card">
          <div class="daily-tur">${i === bugun ? "Günün Hadisi" : "Hadis"}</div>
          <p class="daily-metin">“${h[0]}”</p>
          <div class="daily-kaynak">${h[1]}</div>
        </div>
        <button class="zn-eylem" id="hd-ogren">${ogr ? "Öğrendim ✓ (geri al)" : "Öğrendim ✓"}</button>
        <button class="ys-kopya" id="hd-kopya" style="align-self:center">Kopyala / Paylaş</button>
      </article>`;
    baglaGeri();
    root.querySelector("#hd-ogren").addEventListener("click", () => {
      veri.ogrenilen[i] = !veri.ogrenilen[i];
      hadisKaydet(veri);
      navigator.vibrate?.(30);
      detayCiz(i);
    });
    root.querySelector("#hd-kopya").addEventListener("click", async (e) => {
      const b = e.currentTarget;
      const metin = `“${h[0]}”\n— ${h[1]}`;
      try { await navigator.clipboard.writeText(metin); b.textContent = "Kopyalandı ✓"; }
      catch { b.textContent = "Kopyalanamadı"; }
      setTimeout(() => (b.textContent = "Kopyala / Paylaş"), 1500);
    });
  }

  listeCiz();
}

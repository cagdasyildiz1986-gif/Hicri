// Hadis Zinciri — ÖNİZLEME MODU
// Arayüz ve akış tasarımı: zincir listesi, katılım, okuma onayı, zincir başlatma.
// Veriler şimdilik yalnızca bu cihazda tutulur (localStorage). Gerçek çok
// kullanıcılı sürüm, hesap sistemi ve sunucuyla Aşama 7'de gelecek (PLAN.md).

import { HADISLER } from "./daily.js";

const SAAT_MS = 3600000;
const znTarihFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
});

function simdi() { return Date.now(); }

// Örnek zincirler — gerçek sürümde sunucudan gelecek
function ornekZincirler() {
  const t = simdi();
  return [
    {
      id: "ornek-1",
      hadis: HADISLER[0],
      baslatan: "Gülbahçe",
      baslangic: t - 2 * SAAT_MS,
      bitis: t + 22 * SAAT_MS,
      katilimci: 128,
      onay: 97,
    },
    {
      id: "ornek-2",
      hadis: HADISLER[3],
      baslatan: "Seher Yeli",
      baslangic: t + 3 * 24 * SAAT_MS,
      bitis: t + 4 * 24 * SAAT_MS,
      katilimci: 42,
      onay: 0,
    },
    {
      id: "ornek-3",
      hadis: HADISLER[8],
      baslatan: "Kandil",
      baslangic: t - 30 * SAAT_MS,
      bitis: t - 6 * SAAT_MS,
      katilimci: 311,
      onay: 289,
    },
  ];
}

function yerelYukle() {
  try {
    return JSON.parse(localStorage.getItem("hicri.zincir") || "{}");
  } catch { return {}; }
}
function yerelKaydet(s) { localStorage.setItem("hicri.zincir", JSON.stringify(s)); }

function durum(z) {
  const t = simdi();
  if (t < z.baslangic) return "bekliyor";
  if (t <= z.bitis) return "aktif";
  return "bitti";
}

const DURUM_ADI = { bekliyor: "Başlamadı", aktif: "Devam ediyor", bitti: "Tamamlandı" };

export function initZincir(root, kapat) {
  // yerel: { katilinan: {id:true}, okunan: {id:true}, olusturulan: [zincir...] }
  const yerel = Object.assign({ katilinan: {}, okunan: {}, olusturulan: [] }, yerelYukle());

  function zincirler() {
    return [...ornekZincirler(), ...yerel.olusturulan];
  }

  function geriBar(baslik, hedef) {
    return `<div class="og-geri-bar">
      <button class="tk-btn" id="zn-geri" data-hedef="${hedef}" aria-label="Geri">‹</button>
      <span class="og-baslik">${baslik}</span>
      <span class="tk-btn gizli"></span>
    </div>`;
  }

  function listeCiz() {
    const liste = zincirler().sort((a, b) => a.baslangic - b.baslangic);
    root.innerHTML = `
      ${geriBar("Hadis Zinciri", "kapat")}
      <div class="zn-uyari">Önizleme modu — veriler yalnızca bu cihazda.
        Gerçek katılımcılar hesap sistemiyle birlikte gelecek.</div>
      <button class="zn-baslat-btn" id="zn-yeni">＋ Yeni Zincir Başlat</button>
      <h3 class="og-bolum-baslik">Başlatılan Hadis Zincirleri</h3>
      <ul class="og-menu">
        ${liste.map((z) => {
          const d = durum(z);
          const katildi = yerel.katilinan[z.id];
          return `<li><button class="og-madde" data-id="${z.id}">
            <div class="og-madde-metin">
              <span class="og-ad">${z.hadis[1]}</span>
              <span class="og-alt">“${z.hadis[0].slice(0, 60)}${z.hadis[0].length > 60 ? "…" : ""}”</span>
              <span class="zn-meta">
                <span class="zn-durum ${d}">${DURUM_ADI[d]}</span>
                · ${z.katilimci + (katildi ? 1 : 0)} katılımcı
                ${katildi ? " · <b>katıldın</b>" : ""}
              </span>
            </div>
            <span class="og-ok">›</span>
          </button></li>`;
        }).join("")}
      </ul>`;
    baglaGeri();
    root.querySelector("#zn-yeni").addEventListener("click", formCiz);
    root.querySelectorAll(".og-madde").forEach((b) =>
      b.addEventListener("click", () => detayCiz(b.dataset.id))
    );
  }

  function detayCiz(id) {
    const z = zincirler().find((x) => x.id === id);
    if (!z) return listeCiz();
    const d = durum(z);
    const katildi = !!yerel.katilinan[id];
    const okudu = !!yerel.okunan[id];
    const katilimci = z.katilimci + (katildi ? 1 : 0);
    const onay = z.onay + (okudu ? 1 : 0);

    let eylem = "";
    if (d === "bekliyor") {
      eylem = katildi
        ? `<p class="zn-bilgi">Zincire katıldın. Başlamadan <b>5 dakika önce</b> bildirim alacaksın
           <span class="zn-not">(bildirimler mobil sürümde)</span>.</p>`
        : `<button class="zn-eylem" id="zn-katil">Zincire Katıl</button>`;
    } else if (d === "aktif") {
      if (!katildi) {
        eylem = `<button class="zn-eylem" id="zn-katil">Zincire Katıl ve Oku</button>`;
      } else if (!okudu) {
        eylem = `<button class="zn-eylem" id="zn-okudum">Okudum ✓</button>`;
      } else {
        eylem = `<p class="zn-bilgi">Okuman kaydedildi. Allah kabul etsin. 🤲</p>`;
      }
    } else {
      eylem = `<p class="zn-bilgi">Bu zincir tamamlandı.</p>`;
    }

    root.innerHTML = `
      ${geriBar("Zincir", "liste")}
      <article class="og-detay">
        <div class="zn-sayaclar">
          <div class="zikir-stat"><span>${katilimci}</span><label>Katılımcı</label></div>
          <div class="zikir-stat"><span>${onay}</span><label>Okudu</label></div>
          <div class="zikir-stat"><span class="zn-durum ${d}">${DURUM_ADI[d]}</span><label>Durum</label></div>
        </div>
        <div class="daily-card">
          <div class="daily-tur">Zincirin Hadisi</div>
          <p class="daily-metin">“${z.hadis[0]}”</p>
          <div class="daily-kaynak">${z.hadis[1]}</div>
        </div>
        <div class="zn-zaman">
          <div><span class="zn-zaman-ad">Başlangıç</span> ${znTarihFmt.format(z.baslangic)}</div>
          <div><span class="zn-zaman-ad">Bitiş</span> ${znTarihFmt.format(z.bitis)}</div>
          <div><span class="zn-zaman-ad">Başlatan</span> ${z.baslatan}</div>
        </div>
        ${eylem}
      </article>`;
    baglaGeri();

    root.querySelector("#zn-katil")?.addEventListener("click", () => {
      yerel.katilinan[id] = true;
      yerelKaydet(yerel);
      navigator.vibrate?.(30);
      detayCiz(id);
    });
    root.querySelector("#zn-okudum")?.addEventListener("click", () => {
      yerel.okunan[id] = true;
      yerelKaydet(yerel);
      navigator.vibrate?.([40, 30, 40]);
      detayCiz(id);
    });
  }

  function formCiz() {
    const simdiISO = new Date(simdi() + SAAT_MS).toISOString().slice(0, 16);
    const yarinISO = new Date(simdi() + 25 * SAAT_MS).toISOString().slice(0, 16);
    root.innerHTML = `
      ${geriBar("Yeni Zincir", "liste")}
      <form class="zn-form" id="zn-form">
        <label class="zn-etiket">Hadis Seç
          <select class="zn-girdi" id="zn-hadis">
            ${HADISLER.map((h, i) => `<option value="${i}">${h[1]} — ${h[0].slice(0, 40)}…</option>`).join("")}
          </select>
        </label>
        <label class="zn-etiket">Başlangıç Tarihi ve Saati
          <input class="zn-girdi" type="datetime-local" id="zn-bas" value="${simdiISO}" required />
        </label>
        <label class="zn-etiket">Bitiş Tarihi ve Saati
          <input class="zn-girdi" type="datetime-local" id="zn-bit" value="${yarinISO}" required />
        </label>
        <label class="zn-etiket">Rumuzun
          <input class="zn-girdi" type="text" id="zn-rumuz" maxlength="20" placeholder="ör. Gülbahçe" required />
        </label>
        <p class="zn-not" id="zn-hata"></p>
        <button class="zn-eylem" type="submit">Zinciri Başlat</button>
      </form>`;
    baglaGeri();

    root.querySelector("#zn-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const bas = new Date(root.querySelector("#zn-bas").value).getTime();
      const bit = new Date(root.querySelector("#zn-bit").value).getTime();
      const hata = root.querySelector("#zn-hata");
      if (!(bas > simdi() - 60000)) { hata.textContent = "Başlangıç geçmişte olamaz."; return; }
      if (!(bit > bas)) { hata.textContent = "Bitiş, başlangıçtan sonra olmalı."; return; }
      const z = {
        id: "yerel-" + Date.now(),
        hadis: HADISLER[Number(root.querySelector("#zn-hadis").value)],
        baslatan: root.querySelector("#zn-rumuz").value.trim() || "İsimsiz",
        baslangic: bas,
        bitis: bit,
        katilimci: 0,
        onay: 0,
      };
      yerel.olusturulan.push(z);
      yerel.katilinan[z.id] = true; // başlatan otomatik katılır
      yerelKaydet(yerel);
      detayCiz(z.id);
    });
  }

  function baglaGeri() {
    root.querySelector("#zn-geri")?.addEventListener("click", (e) => {
      if (e.currentTarget.dataset.hedef === "kapat") kapat();
      else listeCiz();
    });
  }

  listeCiz();
}

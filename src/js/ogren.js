// Öğren sekmesi — Esmaü'l-Hüsna, sureler, dualar, namaz rehberi, Yasin

import { initEsma } from "./esma.js";
import { NAMAZ_SURELERI, NAMAZ_DUALARI, GUNLUK_DUALAR } from "./dualar.js";
import { REKAT_TABLOSU, ABDEST_ADIMLARI, NAMAZ_ADIMLARI, NAMAZ_NOTLARI } from "./rehber.js";
import { YASIN } from "./yasinData.js";

const MENU = [
  { id: "esma", ad: "Esmaü'l-Hüsna", alt: "Allah'ın 99 güzel ismi" },
  { id: "sureler", ad: "Namaz Sureleri", alt: "Fâtiha, İhlâs, Kevser, Felâk, Nâs" },
  { id: "namazdua", ad: "Namaz Duaları", alt: "Sübhâneke, Ettehiyyâtü, salavatlar, Kunut" },
  { id: "gunlukdua", ad: "Dua Öğreniyorum", alt: "Günlük hayatın duaları" },
  { id: "rehber", ad: "Namaz Nasıl Kılınır?", alt: "Abdest, rekâtlar ve adım adım kılınış" },
  YASIN
    ? { id: "yasin", ad: "Yasin-i Şerif", alt: "83 ayet — Arapça ve iki meal" }
    : { id: "yasin", ad: "Yasin-i Şerif", alt: "Hazırlanıyor", rozet: "yakında" },
];

const LISTELER = {
  sureler: { baslik: "Namaz Sureleri", veri: NAMAZ_SURELERI },
  namazdua: { baslik: "Namaz Duaları", veri: NAMAZ_DUALARI },
  gunlukdua: { baslik: "Dua Öğreniyorum", veri: GUNLUK_DUALAR },
};

export function initOgren(root) {
  let gecmis = []; // görünüm yığını: geri tuşu için

  function geriBar(baslik) {
    return `<div class="og-geri-bar">
      <button class="tk-btn" id="og-geri" aria-label="Geri">‹</button>
      <span class="og-baslik">${baslik}</span>
      <span class="tk-btn gizli"></span>
    </div>`;
  }

  function baglaGeri() {
    root.querySelector("#og-geri")?.addEventListener("click", () => {
      gecmis.pop();
      cizim(gecmis[gecmis.length - 1] || { gorunum: "menu" });
    });
  }

  function menuCiz() {
    root.innerHTML = `<ul class="og-menu">
      ${MENU.map((m) => `
        <li><button class="og-madde" data-id="${m.id}">
          <div class="og-madde-metin">
            <span class="og-ad">${m.ad}</span>
            <span class="og-alt">${m.alt}</span>
          </div>
          ${m.rozet ? `<span class="og-rozet">${m.rozet}</span>` : `<span class="og-ok">›</span>`}
        </button></li>`).join("")}
    </ul>`;
    root.querySelectorAll(".og-madde").forEach((b) =>
      b.addEventListener("click", () => git({ gorunum: b.dataset.id }))
    );
  }

  function listeCiz(id) {
    const { baslik, veri } = LISTELER[id];
    root.innerHTML = `
      ${geriBar(baslik)}
      <ul class="og-menu">
        ${veri.map((d, i) => `
          <li><button class="og-madde" data-i="${i}">
            <div class="og-madde-metin">
              <span class="og-ad">${d.ad}</span>
              <span class="og-alt">${d.nerede}</span>
            </div>
            <span class="og-ok">›</span>
          </button></li>`).join("")}
      </ul>`;
    baglaGeri();
    root.querySelectorAll(".og-madde").forEach((b) =>
      b.addEventListener("click", () => git({ gorunum: "detay", liste: id, i: Number(b.dataset.i) }))
    );
  }

  function detayCiz(liste, i) {
    const d = LISTELER[liste].veri[i];
    const kelimeler = d.okunus.split(" ");
    root.innerHTML = `
      ${geriBar(d.ad)}
      <article class="og-detay">
        <p class="og-arapca">${d.arapca}</p>
        <div class="divider" aria-hidden="true"><svg class="star" width="12" height="12" viewBox="0 0 24 24"><g fill="none" stroke="#cda85c" stroke-width="1.4"><rect x="6" y="6" width="12" height="12"/><rect x="6" y="6" width="12" height="12" transform="rotate(45 12 12)"/></g></svg></div>
        <h3 class="og-bolum-baslik">Okunuşu</h3>
        <p class="og-okunus" id="og-okunus">${kelimeler
          .map((k, ki) => `<span class="og-kelime" data-k="${ki}">${k}</span>`)
          .join(" ")}</p>
        <button class="tk-bugun-btn" id="og-ezber">Ezber Modu</button>
        <h3 class="og-bolum-baslik">Anlamı</h3>
        <p class="og-anlam">${d.anlam}</p>
        <p class="og-nerede">${d.nerede}</p>
      </article>`;
    baglaGeri();

    // Ezber modu: kelimeler gizlenir, sırayla dokunarak açılır
    let ezber = false;
    let acilan = 0;
    const okunusEl = root.querySelector("#og-okunus");
    root.querySelector("#og-ezber").addEventListener("click", (e) => {
      ezber = !ezber;
      acilan = 0;
      okunusEl.classList.toggle("ezber", ezber);
      okunusEl.querySelectorAll(".og-kelime").forEach((k) => k.classList.toggle("gizli", ezber));
      e.target.textContent = ezber ? "Ezber Modunu Kapat" : "Ezber Modu";
    });
    okunusEl.addEventListener("click", () => {
      if (!ezber) return;
      const k = okunusEl.querySelector(`[data-k="${acilan}"]`);
      if (k) { k.classList.remove("gizli"); acilan++; }
    });
  }

  function rehberCiz() {
    root.innerHTML = `
      ${geriBar("Namaz Nasıl Kılınır?")}
      <div class="og-rehber">
        <h3 class="og-bolum-baslik">Rekâtlar</h3>
        <div class="im-tablo-kap"><table class="im-tablo">
          <thead><tr><th>Vakit</th><th>Diziliş</th></tr></thead>
          <tbody>${REKAT_TABLOSU.map((r) => `<tr><td>${r.vakit}</td><td>${r.dizilis}</td></tr>`).join("")}</tbody>
        </table></div>

        <h3 class="og-bolum-baslik">Önce Abdest</h3>
        <ol class="og-adimlar">${ABDEST_ADIMLARI.map((a) => `<li>${a}</li>`).join("")}</ol>

        <h3 class="og-bolum-baslik">Adım Adım: 2 Rekât Farz (Sabah)</h3>
        <ol class="og-namaz-adimlar">
          ${NAMAZ_ADIMLARI.map((a, i) => `
            <li class="og-adim">
              <span class="og-adim-no">${i + 1}</span>
              <div class="og-adim-govde">
                <span class="og-adim-baslik">${a.baslik}</span>
                <span class="og-adim-metin">${a.metin}</span>
                ${a.okunan ? `<span class="og-adim-okunan">${a.okunan}</span>` : ""}
              </div>
            </li>`).join("")}
        </ol>

        <h3 class="og-bolum-baslik">Bilinmesi Gerekenler</h3>
        <ul class="og-adimlar">${NAMAZ_NOTLARI.map((n) => `<li>${n}</li>`).join("")}</ul>

        <p class="footnote">Dualara ve surelere bu bölümün "Namaz Duaları" ve
        "Namaz Sureleri" sayfalarından ulaşabilirsiniz.</p>
      </div>`;
    baglaGeri();
  }

  function yasinCiz() {
    if (!YASIN) {
      root.innerHTML = `
        ${geriBar("Yasin-i Şerif")}
        <div class="og-detay">
          <p class="og-arapca" style="font-size:2rem">يٰسٓ</p>
          <p class="og-anlam" style="text-align:center">
            Yasin-i Şerif'in 83 ayetlik tam metni (Arapça ve mealler),
            doğrulanmış kaynaktan yüklenerek eklenecektir. Kur'an metninde tek
            harflik hataya dahi yer olmadığı için bu bölüm, metin harf harf
            doğrulanmadan yayımlanmayacaktır.
          </p>
          <p class="footnote">Bkz. PLAN.md — Aşama 5: Kur'an verisi hazırlığı.</p>
        </div>`;
      baglaGeri();
      return;
    }

    let meal = localStorage.getItem("hicri.yasin.meal") || "diyanet";
    const MEAL_ADI = { diyanet: "Diyanet İşleri", elmalili: "Elmalılı Hamdi Yazır" };

    function icerikCiz() {
      root.innerHTML = `
        ${geriBar("Yasin-i Şerif")}
        <div class="chips" style="margin-top:0">
          <button class="chip${meal === "diyanet" ? " on" : ""}" data-meal="diyanet">Diyanet Meali</button>
          <button class="chip${meal === "elmalili" ? " on" : ""}" data-meal="elmalili">Elmalılı Meali</button>
        </div>
        <p class="footnote">Bismillâhirrahmânirrahîm</p>
        <ol class="ys-liste">
          ${YASIN.ayetler.map((a) => `
            <li class="ys-ayet">
              <span class="esma-no">${a.no}</span>
              <div class="ys-govde">
                <p class="ys-arapca">${a.arapca}</p>
                <p class="ys-meal">${a[meal]}</p>
              </div>
            </li>`).join("")}
        </ol>
        <p class="footnote">Meal: ${MEAL_ADI[meal]} · Kaynak: api.alquran.cloud</p>`;
      baglaGeri();
      root.querySelectorAll("[data-meal]").forEach((b) =>
        b.addEventListener("click", () => {
          meal = b.dataset.meal;
          localStorage.setItem("hicri.yasin.meal", meal);
          const y = window.scrollY;
          icerikCiz();
          window.scrollTo(0, y);
        })
      );
    }
    icerikCiz();
  }

  function cizim(durum) {
    if (durum.gorunum === "menu") menuCiz();
    else if (durum.gorunum === "esma") {
      root.innerHTML = geriBar("Esmaü'l-Hüsna") + `<div id="og-esma"></div>`;
      baglaGeri();
      initEsma(root.querySelector("#og-esma"));
    } else if (durum.gorunum === "detay") detayCiz(durum.liste, durum.i);
    else if (durum.gorunum === "rehber") rehberCiz();
    else if (durum.gorunum === "yasin") yasinCiz();
    else listeCiz(durum.gorunum);
    root.scrollIntoView?.({ block: "start" });
    window.scrollTo(0, 0);
  }

  function git(durum) {
    gecmis.push(durum);
    cizim(durum);
  }

  gecmis = [{ gorunum: "menu" }];
  cizim(gecmis[0]);
}

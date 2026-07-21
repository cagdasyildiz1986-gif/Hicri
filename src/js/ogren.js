// Öğren sekmesi — Esmaü'l-Hüsna, sureler, dualar, namaz rehberi, Yasin

import { initEsma } from "./esma.js";
import { NAMAZ_SURELERI, NAMAZ_DUALARI, GUNLUK_DUALAR } from "./dualar.js";
import { REKAT_TABLOSU, ABDEST_ADIMLARI, NAMAZ_ADIMLARI, NAMAZ_NOTLARI } from "./rehber.js";
import { YASIN } from "./yasinData.js";
import { SURE_META } from "./sureMeta.js";
import { CUZLER } from "./cuz.js";

const MENU = [
  { id: "kuran", ad: "Kur'an-ı Kerim", alt: "114 sure — Arapça ve iki meal" },
  { id: "hatim", ad: "Hatim Takibi", alt: "Kur'an'ı hatmet — 30 cüz ilerleme" },
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

// Tam Kur'an verisi (kuran.json) bir kez indirilip burada saklanır;
// Öğren sekmesi yeniden açılsa da tekrar indirilmez.
let KURAN_CACHE = null;
const MEAL_IDX = { diyanet: 1, elmalili: 2 };
const MEAL_AD = { diyanet: "Diyanet İşleri", elmalili: "Elmalılı Hamdi Yazır" };

// Öznitelik değeri için kaçış (kopya metnini data-kopya'ya güvenle koymak için).
const attrKac = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/\n/g, "&#10;");

// Hatim niyeti/hediye seçenekleri.
const HATIM_HEDEFLER = [
  ["kendim", "Kendim için"],
  ["vefat", "Vefat edenler için"],
  ["sehit", "Şehitler için"],
  ["ummet", "Tüm ümmet için"],
];
const HATIM_HEDEF_ADI = Object.fromEntries(HATIM_HEDEFLER);

function hatimYukle() {
  try {
    const h = JSON.parse(localStorage.getItem("hicri.hatim") || "{}");
    return { tamamlanan: 0, cuzler: {}, hedef: "kendim", ...h };
  } catch {
    return { tamamlanan: 0, cuzler: {}, hedef: "kendim" };
  }
}
function hatimKaydet(h) {
  localStorage.setItem("hicri.hatim", JSON.stringify(h));
}

// Diyanet ve Elmalılı mealleri bazı ayetleri birleştirerek çevirir; kaynak,
// aynı meali o ayet grubunun her numarasına tekrar yazar. Aynı meali paylaşan
// ardışık ayetleri tek kartta gruplarız: Arapçalar alt alta, meal bir kez,
// numara aralık ("2–4"). Her kartta kopyala/paylaş düğmesi bulunur.
// satirlar: [{ no, ar, meal }] ; sureAd: kopya metni başlığı için
function mealGruplariHTML(satirlar, sureAd) {
  const gruplar = [];
  for (const s of satirlar) {
    const son = gruplar[gruplar.length - 1];
    if (son && son.meal === s.meal) { son.arlar.push(s.ar); son.sonNo = s.no; }
    else gruplar.push({ ilkNo: s.no, sonNo: s.no, meal: s.meal, arlar: [s.ar] });
  }
  return gruplar.map((g) => {
    const aralik = g.ilkNo !== g.sonNo;
    const no = aralik ? `${g.ilkNo}–${g.sonNo}` : g.ilkNo;
    const kopya = `${sureAd} suresi, ${no}. ${aralik ? "ayetler" : "ayet"}\n\n`
      + `${g.arlar.join("\n")}\n\n${g.meal}`;
    return `<li class="ys-ayet">
      <span class="esma-no${aralik ? " kr-no-aralik" : ""}">${no}</span>
      <div class="ys-govde">
        ${g.arlar.map((ar) => `<p class="ys-arapca">${ar}</p>`).join("")}
        <p class="ys-meal">${g.meal}</p>
        <button class="ys-kopya" data-kopya="${attrKac(kopya)}" aria-label="Ayeti kopyala">Kopyala</button>
      </div>
    </li>`;
  }).join("");
}

// Kopyala düğmelerini bağlar (panoya yazar, kısa geri bildirim gösterir).
function baglaKopya(root) {
  root.querySelectorAll(".ys-kopya").forEach((b) =>
    b.addEventListener("click", async () => {
      const eski = b.textContent;
      try {
        await navigator.clipboard.writeText(b.dataset.kopya);
        b.textContent = "Kopyalandı ✓";
      } catch {
        b.textContent = "Kopyalanamadı";
      }
      setTimeout(() => (b.textContent = eski), 1500);
    }));
}

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
        <ol class="ys-liste">${mealGruplariHTML(
          YASIN.ayetler.map((a) => ({ no: a.no, ar: a.arapca, meal: a[meal] })),
          "Yâsîn"
        )}</ol>
        <p class="footnote">Meal: ${MEAL_ADI[meal]} · Kaynak: api.alquran.cloud</p>`;
      baglaGeri();
      baglaKopya(root);
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

  // --- Kur'an-ı Kerim gezgini ---

  async function kuranYukle() {
    if (KURAN_CACHE) return KURAN_CACHE;
    const url = new URL("kuran.json", document.baseURI).href;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    KURAN_CACHE = await res.json();
    return KURAN_CACHE;
  }

  function sureSatiri(s) {
    const ar = s.arapca.split(" ").slice(1).join(" ") || s.arapca;
    return `<li><button class="og-madde kr-sure" data-no="${s.no}">
      <span class="kr-no">${s.no}</span>
      <div class="og-madde-metin">
        <span class="og-ad">${s.ad}</span>
        <span class="og-alt">${s.ayet} ayet · ${s.inis}</span>
      </div>
      <span class="kr-ad-ar">${ar}</span>
    </button></li>`;
  }

  function baglaSatir(kap) {
    kap.querySelectorAll(".kr-sure").forEach((b) =>
      b.addEventListener("click", () => git({ gorunum: "sure", no: Number(b.dataset.no) })));
  }

  // Aramada şapka (â, î, û) ve kesme işaretini yok say: "yasin" → "Yâsîn",
  // "enam" → "En'âm" eşleşsin.
  const sadelestir = (t) =>
    t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "")
      .toLocaleLowerCase("tr");

  function kuranListeCiz() {
    const son = JSON.parse(localStorage.getItem("hicri.kuran.son") || "null");
    root.innerHTML = `
      ${geriBar("Kur'an-ı Kerim")}
      <div class="kr-ust">
        ${son ? `<button class="kr-kaldigin" id="kr-devam">
          <span class="kr-kaldigin-et">Kaldığın yer</span>
          <span class="kr-kaldigin-ad">${son.no}. ${son.ad} suresi ›</span>
        </button>` : ""}
        <input class="kr-arama" id="kr-arama" type="search"
          placeholder="Sure ara (ad ya da numara)" aria-label="Sure ara" />
      </div>
      <ul class="og-menu" id="kr-liste">${SURE_META.map(sureSatiri).join("")}</ul>`;
    baglaGeri();
    const liste = root.querySelector("#kr-liste");
    root.querySelector("#kr-devam")?.addEventListener("click", () =>
      git({ gorunum: "sure", no: son.no }));
    root.querySelector("#kr-arama").addEventListener("input", (e) => {
      const ham = e.target.value.trim();
      const q = sadelestir(ham);
      const sonuc = q
        ? SURE_META.filter((s) => String(s.no) === ham || sadelestir(s.ad).includes(q))
        : SURE_META;
      liste.innerHTML = sonuc.length
        ? sonuc.map(sureSatiri).join("")
        : `<li class="kr-bos">Sure bulunamadı.</li>`;
      baglaSatir(liste);
    });
    baglaSatir(liste);
  }

  async function sureCiz(no) {
    const m = SURE_META.find((s) => s.no === no);
    if (!m) return;
    localStorage.setItem("hicri.kuran.son", JSON.stringify({ no, ad: m.ad }));
    let meal = localStorage.getItem("hicri.kuran.meal") || "diyanet";

    root.innerHTML = `${geriBar(m.ad + " Suresi")}
      <p class="og-anlam" style="text-align:center" id="kr-durum">Sure yükleniyor…</p>`;
    baglaGeri();

    let kuran;
    try {
      kuran = await kuranYukle();
    } catch {
      const d = root.querySelector("#kr-durum");
      if (d) d.innerHTML = `Sure verisi indirilemedi. İnternet bağlantısını
        kontrol edip tekrar deneyin.`;
      return;
    }
    const ayetler = kuran.sureler[no];
    if (!ayetler) return;
    const besmele = no !== 1 && no !== 9;

    function ciz() {
      root.innerHTML = `
        ${geriBar(m.ad + " Suresi")}
        <div class="chips" style="margin-top:0">
          <button class="chip${meal === "diyanet" ? " on" : ""}" data-meal="diyanet">Diyanet Meali</button>
          <button class="chip${meal === "elmalili" ? " on" : ""}" data-meal="elmalili">Elmalılı Meali</button>
        </div>
        <p class="footnote">${m.no}. sure · ${m.ayet} ayet · ${m.inis}</p>
        ${besmele ? `<p class="footnote">Bismillâhirrahmânirrahîm</p>` : ""}
        <ol class="ys-liste">${mealGruplariHTML(
          ayetler.map((a, i) => ({ no: i + 1, ar: a[0], meal: a[MEAL_IDX[meal]] })),
          m.ad
        )}</ol>
        <p class="footnote">Meal: ${MEAL_AD[meal]} · Kaynak: api.alquran.cloud</p>
        <div class="kr-gezinme">
          ${no > 1
            ? `<button class="kr-nav" data-git="${no - 1}">‹ ${SURE_META[no - 2].ad}</button>`
            : `<span></span>`}
          ${no < 114
            ? `<button class="kr-nav kr-nav-sag" data-git="${no + 1}">${SURE_META[no].ad} ›</button>`
            : `<span></span>`}
        </div>`;
      baglaGeri();
      baglaKopya(root);
      root.querySelectorAll(".kr-nav").forEach((b) =>
        b.addEventListener("click", () => git({ gorunum: "sure", no: Number(b.dataset.git) })));
      root.querySelectorAll("[data-meal]").forEach((b) =>
        b.addEventListener("click", () => {
          meal = b.dataset.meal;
          localStorage.setItem("hicri.kuran.meal", meal);
          const y = window.scrollY;
          ciz();
          window.scrollTo(0, y);
        }));
    }
    ciz();
  }

  // --- Hatim Takibi (kişisel, çevrimdışı) ---
  function hatimCiz() {
    const h = hatimYukle();

    function ciz(kutlama) {
      const okunan = CUZLER.filter((_, i) => h.cuzler[i + 1]).length;
      const oran = Math.round((okunan / 30) * 100);
      root.innerHTML = `
        ${geriBar("Hatim Takibi")}
        <div class="og-detay" style="padding-top:0">
          ${kutlama ? `<div class="hatim-kutla">🎉 1 Hatim tamamlandı<br>
            <span>${HATIM_HEDEF_ADI[h.hedef]} niyetine — Allah kabul etsin 🤲</span></div>` : ""}
          <div class="hatim-ozet">
            <div class="hatim-sayac"><span>${h.tamamlanan}</span><label>Tamamlanan hatim</label></div>
            <div class="hatim-ilerleme">
              <div class="hatim-cubuk"><div class="hatim-dolu" style="width:${oran}%"></div></div>
              <span class="footnote">${okunan}/30 cüz okundu</span>
            </div>
          </div>
          <h3 class="og-bolum-baslik">Niyet / Hediye</h3>
          <div class="chips">
            ${HATIM_HEDEFLER.map(([id, ad]) =>
              `<button class="chip${h.hedef === id ? " on" : ""}" data-hedef="${id}">${ad}</button>`).join("")}
          </div>
          <h3 class="og-bolum-baslik">Cüzler</h3>
          <ol class="hatim-liste">
            ${CUZLER.map((c, i) => {
              const no = i + 1;
              const sure = SURE_META.find((s) => s.no === c[0]);
              const okundu = !!h.cuzler[no];
              return `<li class="hatim-cuz${okundu ? " okundu" : ""}">
                <button class="hatim-tik" data-cuz="${no}" aria-label="${no}. cüz okundu işaretle">${okundu ? "✓" : ""}</button>
                <button class="hatim-git" data-sure="${c[0]}">
                  <span class="hatim-cuz-no">${no}. Cüz</span>
                  <span class="hatim-cuz-yer">${sure ? sure.ad : ""} · ${c[1]}. ayet</span>
                </button>
              </li>`;
            }).join("")}
          </ol>
          <p class="footnote">Bir cüzü açıp okuduktan sonra soldaki ✓ ile işaretle.
          30 cüz tamamlanınca hatim sayılır ve sayaç bir artar.</p>
        </div>`;
      baglaGeri();
      root.querySelectorAll("[data-hedef]").forEach((b) =>
        b.addEventListener("click", () => { h.hedef = b.dataset.hedef; hatimKaydet(h); ciz(); }));
      root.querySelectorAll(".hatim-git").forEach((b) =>
        b.addEventListener("click", () => git({ gorunum: "sure", no: Number(b.dataset.sure) })));
      root.querySelectorAll(".hatim-tik").forEach((b) =>
        b.addEventListener("click", () => {
          const no = b.dataset.cuz;
          h.cuzler[no] = !h.cuzler[no];
          navigator.vibrate?.(20);
          const okunanYeni = CUZLER.filter((_, i) => h.cuzler[i + 1]).length;
          if (okunanYeni === 30) {
            h.tamamlanan = (h.tamamlanan || 0) + 1;
            h.cuzler = {};
            hatimKaydet(h);
            const y = window.scrollY;
            ciz(true);
            window.scrollTo(0, y);
          } else {
            hatimKaydet(h);
            const y = window.scrollY;
            ciz();
            window.scrollTo(0, y);
          }
        }));
    }
    ciz(false);
  }

  function cizim(durum) {
    if (durum.gorunum === "menu") menuCiz();
    else if (durum.gorunum === "kuran") kuranListeCiz();
    else if (durum.gorunum === "sure") sureCiz(durum.no);
    else if (durum.gorunum === "hatim") hatimCiz();
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

// Takvim — ay görünümlü Miladi/Hicri takvim, dini gün işaretleri ve
// Ramazan imsakiyesi tablosu

import { toHijri, fromHijri, hijriMonthName } from "./hijri.js";
import { prayerTimes } from "./prayer.js";
import { religiousDaysBetween } from "./religiousDays.js";

const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const ayFmt = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" });
const tarihFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "short" });
const saatFmt = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" });

export function initCalendar(root, getCity) {
  const bugun = new Date();
  let gorunum = { y: bugun.getFullYear(), m: bugun.getMonth() };
  let mod = "takvim"; // takvim | imsakiye

  function hijriBaslik(ilk, son) {
    const h1 = toHijri(ilk);
    const h2 = toHijri(son);
    if (h1.month === h2.month && h1.year === h2.year) {
      return `${hijriMonthName(h1.month)} ${h1.year}`;
    }
    if (h1.year === h2.year) {
      return `${hijriMonthName(h1.month)} – ${hijriMonthName(h2.month)} ${h1.year}`;
    }
    return `${hijriMonthName(h1.month)} ${h1.year} – ${hijriMonthName(h2.month)} ${h2.year}`;
  }

  function renderTakvim() {
    const { y, m } = gorunum;
    const ilk = new Date(y, m, 1);
    const son = new Date(y, m + 1, 0);
    const kayma = (ilk.getDay() + 6) % 7; // Pazartesi = 0
    const dinigunler = religiousDaysBetween(ilk, son);
    const isaretli = new Map(dinigunler.map((d) => [d.date.getDate(), d]));

    let hucre = "";
    for (let i = 0; i < kayma; i++) hucre += `<div class="tk-cell bos"></div>`;
    for (let g = 1; g <= son.getDate(); g++) {
      const d = new Date(y, m, g);
      const h = toHijri(d);
      const ozel = isaretli.get(g);
      const bugunMu =
        g === bugun.getDate() && m === bugun.getMonth() && y === bugun.getFullYear();
      hucre += `<div class="tk-cell${bugunMu ? " bugun" : ""}${ozel ? " ozel " + ozel.type : ""}"
        ${ozel ? `title="${ozel.name}"` : ""}>
        <span class="tk-miladi">${g}</span>
        <span class="tk-hicri">${h.day === 1 ? hijriMonthName(h.month).slice(0, 3) : h.day}</span>
        ${ozel ? `<span class="tk-nokta"></span>` : ""}
      </div>`;
    }

    root.innerHTML = `
      <div class="tk-nav">
        <button class="tk-btn" id="tk-geri" aria-label="Önceki ay">‹</button>
        <div class="tk-baslik">
          <div class="tk-ay">${ayFmt.format(ilk)}</div>
          <div class="tk-hicri-ay">${hijriBaslik(ilk, son)}</div>
        </div>
        <button class="tk-btn" id="tk-ileri" aria-label="Sonraki ay">›</button>
      </div>
      <div class="tk-grid tk-head">${GUNLER.map((g) => `<div>${g}</div>`).join("")}</div>
      <div class="tk-grid" id="tk-gunler">${hucre}</div>
      ${dinigunler.length ? `
      <ul class="days-list tk-liste">
        ${dinigunler.map((dg) => `
          <li class="day-row ${dg.type}">
            <div class="day-info">
              <span class="day-name">${dg.name}</span>
              <span class="day-date">${tarihFmt.format(dg.date)}${dg.eve ? " akşamı" : ""}</span>
            </div>
          </li>`).join("")}
      </ul>` : ""}
      <div class="tk-alt-butonlar">
        <button class="tk-bugun-btn" id="tk-bugun">Bugüne Dön</button>
        <button class="tk-bugun-btn" id="tk-imsakiye">Ramazan İmsakiyesi</button>
      </div>
    `;

    root.querySelector("#tk-geri").addEventListener("click", () => {
      gorunum.m--;
      if (gorunum.m < 0) { gorunum.m = 11; gorunum.y--; }
      renderTakvim();
    });
    root.querySelector("#tk-ileri").addEventListener("click", () => {
      gorunum.m++;
      if (gorunum.m > 11) { gorunum.m = 0; gorunum.y++; }
      renderTakvim();
    });
    root.querySelector("#tk-bugun").addEventListener("click", () => {
      gorunum = { y: bugun.getFullYear(), m: bugun.getMonth() };
      renderTakvim();
    });
    root.querySelector("#tk-imsakiye").addEventListener("click", () => {
      mod = "imsakiye";
      renderImsakiye();
    });
  }

  function renderImsakiye() {
    const city = getCity();
    const h = toHijri(bugun);
    // İçinde bulunulan ya da gelecek Ramazan
    const rYil = h.month <= 9 ? h.year : h.year + 1;
    const baslangic = fromHijri(rYil, 9, 1);
    if (!baslangic) {
      root.innerHTML = `<p class="footnote">Ramazan tarihi hesaplanamadı.</p>`;
      return;
    }

    const satirlar = [];
    for (let g = 0; g < 30; g++) {
      const d = new Date(baslangic.getFullYear(), baslangic.getMonth(), baslangic.getDate() + g);
      if (toHijri(d).month !== 9) break;
      const t = prayerTimes(d, city.lat, city.lon);
      const bugunMu = d.toDateString() === bugun.toDateString();
      satirlar.push(`<tr${bugunMu ? ' class="bugun"' : ""}>
        <td>${g + 1}</td>
        <td>${tarihFmt.format(d)}</td>
        <td>${saatFmt.format(t.imsak)}</td>
        <td>${saatFmt.format(t.aksam)}</td>
      </tr>`);
    }

    root.innerHTML = `
      <div class="tk-nav">
        <button class="tk-btn" id="im-geri" aria-label="Takvime dön">‹</button>
        <div class="tk-baslik">
          <div class="tk-ay">Ramazan İmsakiyesi</div>
          <div class="tk-hicri-ay">${rYil} · ${city.name}</div>
        </div>
        <span class="tk-btn gizli"></span>
      </div>
      <div class="im-tablo-kap">
        <table class="im-tablo">
          <thead><tr><th>Gün</th><th>Tarih</th><th>İmsak</th><th>İftar</th></tr></thead>
          <tbody>${satirlar.join("")}</tbody>
        </table>
      </div>
    `;
    root.querySelector("#im-geri").addEventListener("click", () => {
      mod = "takvim";
      renderTakvim();
    });
  }

  function render() {
    if (mod === "imsakiye") renderImsakiye();
    else renderTakvim();
  }

  render();
  return { refresh: render };
}

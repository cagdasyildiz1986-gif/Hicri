// Ana ekran — Hicri tarih, sıradaki vakte geri sayım, günün vakitleri, dini günler

import { toHijri, formatHijri } from "./hijri.js";
import { prayerTimes, nextPrayer, PRAYER_NAMES } from "./prayer.js";
import { CITIES } from "./cities.js";
import { upcomingDays, daysUntil } from "./religiousDays.js";

const $ = (sel) => document.querySelector(sel);

const gregorianFmt = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});
const clockFmt = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit", minute: "2-digit",
});
const dayFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric", month: "long", weekday: "long",
});

function getCity() {
  const saved = localStorage.getItem("hicri.city");
  return CITIES.find((c) => c.name === saved) || CITIES.find((c) => c.name === "İstanbul");
}

function setCity(name) {
  localStorage.setItem("hicri.city", name);
  render();
}

const TYPE_LABELS = { kandil: "Kandil", bayram: "Bayram", gun: "Mübarek Gün" };

function renderStatic() {
  const now = new Date();
  const city = getCity();
  const h = toHijri(now);

  $("#hijri-date").textContent = formatHijri(h);
  $("#gregorian-date").textContent = gregorianFmt.format(now);

  // Şehir seçici
  const sel = $("#city-select");
  sel.innerHTML = CITIES.map(
    (c) => `<option value="${c.name}" ${c.name === city.name ? "selected" : ""}>${c.name}</option>`
  ).join("");

  // Günün vakitleri
  const times = prayerTimes(now, city.lat, city.lon);
  const next = nextPrayer(now, city.lat, city.lon);
  $("#times").innerHTML = PRAYER_NAMES.map(([key, name]) => {
    const active = next.key === key && times[key] && times[key] > now;
    return `<div class="time-cell${active ? " active" : ""}">
      <span class="time-name">${name}</span>
      <span class="time-value">${times[key] ? clockFmt.format(times[key]) : "—"}</span>
    </div>`;
  }).join("");

  // Yaklaşan dini günler
  const days = upcomingDays(now, 8);
  $("#days-list").innerHTML = days.map((d) => {
    const n = daysUntil(now, d.date);
    const when = n === 0 ? "Bugün" : n === 1 ? "Yarın" : `${n} gün`;
    return `<li class="day-row ${d.type}">
      <div class="day-info">
        <span class="day-name">${d.name}</span>
        <span class="day-date">${dayFmt.format(d.date)}${d.eve ? " akşamı" : ""}</span>
      </div>
      <div class="day-when">
        <span class="day-count${n === 0 ? " today" : ""}">${when}</span>
        <span class="day-type">${TYPE_LABELS[d.type] || ""}</span>
      </div>
    </li>`;
  }).join("");
}

function renderCountdown() {
  const now = new Date();
  const city = getCity();
  const next = nextPrayer(now, city.lat, city.lon);
  const ms = next.time - now;
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const pad = (x) => String(x).padStart(2, "0");

  $("#next-name").textContent = `${next.name} vaktine`;
  $("#countdown").textContent = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  $("#next-time").textContent = `${next.name}: ${clockFmt.format(next.time)}`;
}

let lastMinute = -1;
function render() {
  renderStatic();
  renderCountdown();
}

export function start() {
  $("#city-select").addEventListener("change", (e) => setCity(e.target.value));
  render();
  setInterval(() => {
    renderCountdown();
    const m = new Date().getMinutes();
    if (m !== lastMinute) {
      lastMinute = m;
      renderStatic(); // vakit geçişlerinde listeyi tazele
    }
  }, 1000);
}

start();

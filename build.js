// Basit derleyici: modülleri tek HTML dosyasında birleştirir (npm gerekmez).
// Kullanım: node build.js [çıktı-dizini]
// Üretilen: dist/index.html (bağımsız) ve dist/body.html (önizleme gövdesi)

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = dirname(fileURLToPath(import.meta.url));
const outDir = process.argv[2] || join(root, "dist");

// Bağımlılık sırasına göre; import/export satırları ayıklanarak birleştirilir
const MODULES = [
  "hijri.js", "prayer.js", "cities.js", "religiousDays.js",
  "daily.js", "zikir.js", "esma.js", "dualar.js", "rehber.js", "yasinData.js",
  "sureMeta.js", "cuz.js",
  "ogren.js",
  "calendar.js", "qibla.js", "ezan.js", "ayarlar.js", "hatirlatma.js", "zincir.js", "app.js",
];

const js = MODULES.map((f) => {
  const src = readFileSync(join(root, "src/js", f), "utf8");
  return (
    `// ---- ${f} ----\n` +
    src
      .split("\n")
      .filter((line) => !line.startsWith("import "))
      .map((line) => line.replace(/^export (default )?/, ""))
      .join("\n")
  );
}).join("\n\n");

const css = readFileSync(join(root, "src/style.css"), "utf8");
const body = readFileSync(join(root, "src/body.html"), "utf8");

const inner = `${body}\n<style>\n${css}</style>\n<script>\n"use strict";\n(() => {\n${js}\n})();\n</script>\n`;

const standalone = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="theme-color" content="#0b2f24" />
${inner}</head>
<body></body>
</html>`;

mkdirSync(outDir, { recursive: true });

// Tam Kur'an verisi ana pakete gömülmez; statik dosya olarak kopyalanır,
// sure açılınca lazy indirilir. (Yoksa uyarı verir, derleme yine tamamlanır.)
let kuranBoyut = 0;
if (existsSync(join(root, "kuran.json"))) {
  copyFileSync(join(root, "kuran.json"), join(outDir, "kuran.json"));
  kuranBoyut = statSync(join(root, "kuran.json")).size;
  console.log("kuran.json kopyalandı.");
} else {
  console.warn("UYARI: kuran.json yok — 'node scripts/kuran-indir.js' çalıştırın.");
}

// Sesler (ör. telifsiz ezan kaydı) — sounds/ varsa dist'e kopyalanır.
let seslerImza = "";
if (existsSync(join(root, "sounds"))) {
  mkdirSync(join(outDir, "sounds"), { recursive: true });
  for (const dosya of readdirSync(join(root, "sounds"))) {
    copyFileSync(join(root, "sounds", dosya), join(outDir, "sounds", dosya));
    seslerImza += dosya + statSync(join(root, "sounds", dosya)).size;
  }
  console.log("sounds/ kopyalandı.");
}

// Bağımsız sayfalar (gizlilik, kullanım koşulları) — src/sayfalar/*.html → dist/
let sayfalarImza = "";
const sayfaDizin = join(root, "src/sayfalar");
if (existsSync(sayfaDizin)) {
  for (const dosya of readdirSync(sayfaDizin)) {
    if (!dosya.endsWith(".html")) continue;
    const icerik = readFileSync(join(sayfaDizin, dosya), "utf8");
    writeFileSync(join(outDir, dosya), icerik);
    sayfalarImza += dosya + icerik.length;
  }
  console.log("src/sayfalar/ kopyalandı.");
}

// Sürüm damgası: içerik değişince değişir (gereksiz güncelleme tetiklemez).
const SURUM = createHash("sha1").update(inner).update(String(kuranBoyut)).update(seslerImza).update(sayfalarImza).digest("hex").slice(0, 12);

// Çevrimdışı + taze sürüm için service worker. HTML gezinmesi ağ öncelikli
// (yeni yayın hemen görünür), kuran.json önbellek öncelikli; sürüm değişince
// eski önbellek silinir ve sayfa yenilenir.
const sw = `// OTOMATİK ÜRETİLDİ — build.js
const SURUM = "${SURUM}";
const CACHE = "hicri-" + SURUM;
const KABUK = ["./", "./index.html"];
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(KABUK)).catch(() => {}));
});
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const anahtarlar = await caches.keys();
    await Promise.all(anahtarlar.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (e) => {
  const istek = e.request;
  if (istek.method !== "GET") return;
  const url = new URL(istek.url);
  if (url.origin !== location.origin) return;
  if (istek.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const net = await fetch(istek);
        const c = await caches.open(CACHE);
        c.put(istek, net.clone());
        if (url.pathname.endsWith("/") || url.pathname.endsWith("/index.html")) c.put("./index.html", net.clone());
        return net;
      } catch {
        return (await caches.match(istek)) || (await caches.match("./index.html")) || (await caches.match("./")) || Response.error();
      }
    })());
    return;
  }
  e.respondWith((async () => {
    const onbellek = await caches.match(istek);
    if (onbellek) return onbellek;
    try {
      const net = await fetch(istek);
      const c = await caches.open(CACHE);
      c.put(istek, net.clone());
      return net;
    } catch {
      return onbellek || Response.error();
    }
  })());
});
`;
writeFileSync(join(outDir, "sw.js"), sw);

// Sayfaya service worker kaydı: yeni sürüm devralınca bir kez yenile
// (ilk yüklemede denetleyici yoksa yenileme yapılmaz).
const swKayit = `<script>
if ("serviceWorker" in navigator) {
  addEventListener("load", () => {
    const vardi = !!navigator.serviceWorker.controller;
    let yenilendi = false;
    navigator.serviceWorker.register("./sw.js").catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!vardi || yenilendi) return;
      yenilendi = true;
      location.reload();
    });
  });
}
</script>`;

// Bağımsız sürümde gövde etiketleri <head> yerine <body> içinde olmalı:
const bodyStandalone = standalone
  .replace(inner, "")
  .replace("<body></body>", `<body>\n${inner}${swKayit}\n</body>`);

writeFileSync(join(outDir, "index.html"), bodyStandalone);
writeFileSync(join(outDir, "body.html"), inner);

console.log(`dist yazıldı: ${outDir} (sürüm ${SURUM})`);

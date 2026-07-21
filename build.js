// Basit derleyici: modülleri tek HTML dosyasında birleştirir (npm gerekmez).
// Kullanım: node build.js [çıktı-dizini]
// Üretilen: dist/index.html (bağımsız) ve dist/body.html (önizleme gövdesi)

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const outDir = process.argv[2] || join(root, "dist");

// Bağımlılık sırasına göre; import/export satırları ayıklanarak birleştirilir
const MODULES = [
  "hijri.js", "prayer.js", "cities.js", "religiousDays.js",
  "daily.js", "zikir.js", "esma.js", "dualar.js", "rehber.js", "yasinData.js",
  "sureMeta.js",
  "ogren.js",
  "calendar.js", "qibla.js", "ayarlar.js", "zincir.js", "app.js",
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

// Bağımsız sürümde gövde etiketleri <head> yerine <body> içinde olmalı:
const bodyStandalone = standalone.replace(inner, "").replace("<body></body>", `<body>\n${inner}</body>`);

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "index.html"), bodyStandalone);
writeFileSync(join(outDir, "body.html"), inner);

// Tam Kur'an verisi ana pakete gömülmez; statik dosya olarak kopyalanır,
// sure açılınca lazy indirilir. (Yoksa uyarı verir, derleme yine tamamlanır.)
if (existsSync(join(root, "kuran.json"))) {
  copyFileSync(join(root, "kuran.json"), join(outDir, "kuran.json"));
  console.log("kuran.json kopyalandı.");
} else {
  console.warn("UYARI: kuran.json yok — 'node scripts/kuran-indir.js' çalıştırın.");
}

console.log("dist yazıldı:", outDir);

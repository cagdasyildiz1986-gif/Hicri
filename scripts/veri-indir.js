// Yasin-i Şerif verisini doğrulanmış kaynaktan indirir ve
// src/js/yasinData.js dosyasını üretir.
//
// Kullanım (ağ erişimi açık bir oturumda):
//   node scripts/veri-indir.js
//
// Kaynak: api.alquran.cloud — quran-uthmani (Arapça, Medine imlası),
// tr.diyanet (Diyanet İşleri meali), tr.yazir (Elmalılı Hamdi Yazır).
// Doğrulamalar: 83 ayet, her ayette Arapça harf, boş metin yok.

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const URL_ = "https://api.alquran.cloud/v1/surah/36/editions/quran-uthmani,tr.diyanet,tr.yazir";

const ARAPCA_HARF = /[؀-ۿ]/;

// quran-uthmani sürümünde surenin ilk ayetine Besmele başa eklenir.
// Arayüzde ayrı bir "Bismillâhirrahmânirrahîm" başlığı olduğundan, ilk
// ayetteki bu tekrarı ayıklarız (Fâtiha ve Tevbe hariç, ki Yâsîn ikisi
// de değil). Diakritikler sürümden sürüme değiştiği için birebir metin
// yerine, diakritikleri sıyırıp ilk 4 kelimeyi Besmele ile karşılaştırırız.
const diakritikSiz = (t) => t.replace(/[ً-ْٓ-ٰٟـ]/g, "").replace(/ٱ/g, "ا");
const BESMELE_SADE = diakritikSiz("بسم الله الرحمن الرحيم");

function besmeleyiAyikla(metin) {
  const kelimeler = metin.split(" ");
  if (diakritikSiz(kelimeler.slice(0, 4).join(" ")) === BESMELE_SADE) {
    return kelimeler.slice(4).join(" ").trim();
  }
  return metin;
}

async function main() {
  console.log("İndiriliyor:", URL_);
  const res = await fetch(URL_);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ağ izni açık mı?`);
  const json = await res.json();
  if (json.code !== 200 || !Array.isArray(json.data) || json.data.length !== 3) {
    throw new Error("Beklenmeyen yanıt yapısı");
  }

  const [arapca, diyanet, elmalili] = json.data;

  // --- Doğrulamalar ---
  for (const [ad, e] of [["Arapça", arapca], ["Diyanet", diyanet], ["Elmalılı", elmalili]]) {
    if (e.numberOfAyahs !== 83 || e.ayahs.length !== 83) {
      throw new Error(`${ad}: ayet sayısı 83 değil (${e.ayahs.length})`);
    }
    for (const a of e.ayahs) {
      if (!a.text || !a.text.trim()) throw new Error(`${ad}: ${a.numberInSurah}. ayet boş`);
    }
  }
  for (const a of arapca.ayahs) {
    if (!ARAPCA_HARF.test(a.text)) {
      throw new Error(`Arapça metinde Arap harfi yok: ayet ${a.numberInSurah}`);
    }
  }

  const ayetler = arapca.ayahs.map((a, i) => ({
    no: a.numberInSurah,
    arapca: a.text.trim(),
    diyanet: diyanet.ayahs[i].text.trim(),
    elmalili: elmalili.ayahs[i].text.trim(),
  }));

  // İlk ayetin başındaki Besmele'yi ayıkla (arayüzde ayrı başlık var).
  ayetler[0].arapca = besmeleyiAyikla(ayetler[0].arapca);
  if (!ARAPCA_HARF.test(ayetler[0].arapca)) {
    throw new Error("Besmele ayıklandıktan sonra 1. ayet boş kaldı");
  }

  const icerik = `// OTOMATİK ÜRETİLDİ — scripts/veri-indir.js
// Kaynak: api.alquran.cloud (quran-uthmani, tr.diyanet, tr.yazir)
// Üretim tarihi: ${new Date().toISOString()}
// Elle düzenlemeyin; güncellemek için betiği yeniden çalıştırın.
export const YASIN = ${JSON.stringify({ ayetler }, null, 1)};
`;

  const hedef = join(root, "src/js/yasinData.js");
  writeFileSync(hedef, icerik);
  console.log(`✓ 83 ayet doğrulandı ve yazıldı: ${hedef}`);
  console.log("Şimdi 'node build.js' çalıştırıp önizlemeyi yenileyin.");
}

main().catch((e) => {
  console.error("HATA:", e.message);
  process.exit(1);
});

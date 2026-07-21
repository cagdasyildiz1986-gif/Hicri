// Tam Kur'an-ı Kerim verisini doğrulanmış kaynaktan indirir ve iki dosya üretir:
//   1) src/js/sureMeta.js  — 114 surenin listesi (no, ad, Arapça ad, ayet sayısı,
//      iniş yeri). Küçük; arayüze gömülür (sure listesi + arama için).
//   2) kuran.json          — ayet içerikleri (Arapça + Diyanet + Elmalılı).
//      Büyük (~birkaç MB); sure açılınca lazy indirilir, ana pakete gömülmez.
//
// Kullanım (ağ erişimi açık; Node >= 22.21):
//   NODE_USE_ENV_PROXY=1 node scripts/kuran-indir.js
//
// Kaynak: api.alquran.cloud — quran-uthmani (Arapça, Medine imlası),
// tr.diyanet (Diyanet İşleri meali), tr.yazir (Elmalılı Hamdi Yazır).

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const TABAN = "https://api.alquran.cloud/v1/quran";
const SURUMLER = ["quran-uthmani", "tr.diyanet", "tr.yazir"];

const ARAPCA_HARF = /[؀-ۿ]/;
const TOPLAM_SURE = 114;
const TOPLAM_AYET = 6236;

// Diyanet imlasıyla 114 surenin Türkçe adları.
const TR_ADLAR = [
  "Fâtiha", "Bakara", "Âl-i İmrân", "Nisâ", "Mâide", "En'âm", "A'râf", "Enfâl",
  "Tevbe", "Yûnus", "Hûd", "Yûsuf", "Ra'd", "İbrâhim", "Hicr", "Nahl", "İsrâ",
  "Kehf", "Meryem", "Tâhâ", "Enbiyâ", "Hac", "Mü'minûn", "Nûr", "Furkân",
  "Şuarâ", "Neml", "Kasas", "Ankebût", "Rûm", "Lokmân", "Secde", "Ahzâb",
  "Sebe'", "Fâtır", "Yâsîn", "Sâffât", "Sâd", "Zümer", "Mü'min", "Fussilet",
  "Şûrâ", "Zuhruf", "Duhân", "Câsiye", "Ahkâf", "Muhammed", "Fetih", "Hucurât",
  "Kâf", "Zâriyât", "Tûr", "Necm", "Kamer", "Rahmân", "Vâkıa", "Hadîd",
  "Mücâdele", "Haşr", "Mümtehine", "Saff", "Cumâ", "Münâfikûn", "Teğâbün",
  "Talâk", "Tahrîm", "Mülk", "Kalem", "Hâkka", "Meâric", "Nûh", "Cin",
  "Müzzemmil", "Müddessir", "Kıyâme", "İnsân", "Mürselât", "Nebe'", "Nâziât",
  "Abese", "Tekvîr", "İnfitâr", "Mutaffifîn", "İnşikâk", "Bürûc", "Târık",
  "A'lâ", "Gâşiye", "Fecr", "Beled", "Şems", "Leyl", "Duhâ", "İnşirâh", "Tîn",
  "Alak", "Kadir", "Beyyine", "Zilzâl", "Âdiyât", "Kâria", "Tekâsür", "Asr",
  "Hümeze", "Fîl", "Kureyş", "Mâûn", "Kevser", "Kâfirûn", "Nasr", "Tebbet",
  "İhlâs", "Felâk", "Nâs",
];

// Surenin ilk ayetine eklenen Besmele'yi ayıklar (Fâtiha ve Tevbe hariç).
// Diakritikler sürümden sürüme değişebildiği için birebir metin yerine,
// diakritikleri sıyırıp ilk dört kelimeyi Besmele ile karşılaştırırız.
const diakritikSiz = (t) => t.replace(/[ً-ْٓ-ٰٟـ]/g, "").replace(/ٱ/g, "ا");
const BESMELE_SADE = diakritikSiz("بسم الله الرحمن الرحيم");

function besmeleyiAyikla(metin) {
  const kelimeler = metin.split(" ");
  if (diakritikSiz(kelimeler.slice(0, 4).join(" ")) === BESMELE_SADE) {
    return kelimeler.slice(4).join(" ").trim();
  }
  return metin;
}

async function surumIndir(surum) {
  const url = `${TABAN}/${surum}`;
  console.log("İndiriliyor:", url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} (${surum}) — ağ izni açık mı?`);
  const json = await res.json();
  if (json.code !== 200 || !json.data || !Array.isArray(json.data.surahs)) {
    throw new Error(`Beklenmeyen yanıt yapısı (${surum})`);
  }
  const sureler = json.data.surahs;
  if (sureler.length !== TOPLAM_SURE) {
    throw new Error(`${surum}: sure sayısı ${TOPLAM_SURE} değil (${sureler.length})`);
  }
  const toplam = sureler.reduce((n, s) => n + s.ayahs.length, 0);
  if (toplam !== TOPLAM_AYET) {
    throw new Error(`${surum}: ayet sayısı ${TOPLAM_AYET} değil (${toplam})`);
  }
  return sureler;
}

async function main() {
  const [arapca, diyanet, elmalili] = await Promise.all(SURUMLER.map(surumIndir));

  const meta = [];
  const icerik = {}; // sureNo -> [[arapca, diyanet, elmalili], ...]

  for (let i = 0; i < TOPLAM_SURE; i++) {
    const sa = arapca[i], sd = diyanet[i], se = elmalili[i];
    const sureNo = sa.number;
    if (sa.ayahs.length !== sd.ayahs.length || sa.ayahs.length !== se.ayahs.length) {
      throw new Error(`Sure ${sureNo}: sürümler arası ayet sayısı uyuşmuyor`);
    }

    const ayetler = sa.ayahs.map((a, j) => {
      const ar = a.text.trim();
      const di = sd.ayahs[j].text.trim();
      const el = se.ayahs[j].text.trim();
      if (!ar || !di || !el) throw new Error(`Sure ${sureNo}, ayet ${j + 1}: boş metin`);
      if (!ARAPCA_HARF.test(ar)) throw new Error(`Sure ${sureNo}, ayet ${j + 1}: Arap harfi yok`);
      return [ar, di, el];
    });

    // Fâtiha'da Besmele zaten 1. ayettir; ayıklama; diğer surelerde başa
    // eklenen Besmele'yi 1. ayetten ayıkla (Tevbe'de Besmele yoktur, no-op).
    if (sureNo !== 1) {
      ayetler[0][0] = besmeleyiAyikla(ayetler[0][0]);
      if (!ARAPCA_HARF.test(ayetler[0][0])) {
        throw new Error(`Sure ${sureNo}: Besmele ayıklanınca 1. ayet boş kaldı`);
      }
    }

    icerik[sureNo] = ayetler;
    meta.push({
      no: sureNo,
      ad: TR_ADLAR[i],
      arapca: sa.name,
      ayet: ayetler.length,
      inis: sa.revelationType === "Meccan" ? "Mekkî" : "Medenî",
    });
  }

  const uretim = new Date().toISOString();

  const metaJs = `// OTOMATİK ÜRETİLDİ — scripts/kuran-indir.js
// 114 sure listesi (ayet içerikleri kuran.json'da, lazy yüklenir).
// Üretim tarihi: ${uretim}
// Elle düzenlemeyin; güncellemek için betiği yeniden çalıştırın.
export const SURE_META = ${JSON.stringify(meta)};
`;
  writeFileSync(join(root, "src/js/sureMeta.js"), metaJs);

  const jsonMeta = { uretim, kaynak: "api.alquran.cloud", duzen: ["arapca", "diyanet", "elmalili"] };
  writeFileSync(join(root, "kuran.json"), JSON.stringify({ meta: jsonMeta, sureler: icerik }));

  const boyut = (JSON.stringify({ sureler: icerik }).length / 1048576).toFixed(1);
  console.log(`✓ ${TOPLAM_SURE} sure, ${TOPLAM_AYET} ayet doğrulandı.`);
  console.log(`✓ src/js/sureMeta.js yazıldı (${meta.length} sure).`);
  console.log(`✓ kuran.json yazıldı (~${boyut} MB).`);
  console.log("Şimdi 'node build.js' çalıştırıp önizlemeyi yenileyin.");
}

main().catch((e) => {
  console.error("HATA:", e.message);
  process.exit(1);
});

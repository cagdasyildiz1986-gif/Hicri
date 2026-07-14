# Hicri — Claude Code proje rehberi

Türkçe, tamamen çevrimdışı çalışan İslami yaşam uygulaması: Hicri takvim,
namaz vakitleri, kıble pusulası, zikirmatik, dualar ve öğrenme bölümü.
Aşama 1–4 tamamlandı; yol haritası ve mimari kararlar için `PLAN.md`,
genel bakış için `README.md`.

## Derleme ve doğrulama

```sh
node build.js        # dist/index.html üretir (tek dosya, bağımsız)
```

- **npm YOK, bağımlılık YOK.** `package.json` dosyası yoktur ve eklenmemelidir;
  `node build.js` tek başına yeterlidir.
- Her değişiklikten sonra `node build.js` hatasız çalışmalı. Mümkünse
  `dist/index.html` tarayıcıda (ör. Playwright ile) açılıp konsol hatası
  olmadığı doğrulanmalı.
- Geliştirme sırasında kökteki `index.html`, `src/` modüllerini doğrudan
  yükler (statik sunucu gerekir, ör. `npx http-server`).

## Dizin yapısı

```
src/js/hijri.js          Hicri ↔ Miladi dönüşümler (Intl islamic-umalqura)
src/js/prayer.js         Namaz vakti hesaplamaları (güneş konumu)
src/js/cities.js         81 il merkezi koordinatları
src/js/religiousDays.js  Kandiller, bayramlar, mübarek günler
src/js/daily.js          Günlük ayet/hadis
src/js/zikir.js          Zikirmatik
src/js/esma.js           Esmaü'l-Hüsna
src/js/dualar.js         Dualar
src/js/rehber.js         Namaz rehberi
src/js/ogren.js          Öğren bölümü (ezber modu vb.)
src/js/calendar.js       Ay görünümlü takvim
src/js/qibla.js          Kıble pusulası
src/js/app.js            Ana ekran arayüzü ve sekmeli gezinme
src/style.css            Tezhip esintili tema (zümrüt + altın)
src/body.html            Uygulama gövdesi
build.js                 Tek dosyalık derleme
```

**Kritik kural:** `src/js/` altına yeni bir modül eklenirse, `build.js`
içindeki `MODULES` dizisine **bağımlılık sırasına göre** eklenmelidir;
aksi halde derlenmiş dosyada yer almaz.

## Derleme modeli (dikkat edilecekler)

- `build.js`, modüllerdeki `import` satırlarını atar ve `export` önekini
  siler; tüm modüller derlenmiş dosyada **tek bir IIFE kapsamında**
  birleşir. Bu yüzden modüller arası üst-düzey isim çakışmasından kaçının
  (aynı adlı fonksiyon/sabit iki modülde tanımlanamaz).
- `import/export` yalnızca satır başında ve tek satırda olmalı (ayıklama
  satır bazlıdır).

## Proje kuralları

- **Dil:** Kod yorumları, commit mesajları ve tüm arayüz metinleri Türkçe.
  Commit stili: `Aşama N: kısa açıklama` (aşama dışı işlerde kısa Türkçe
  özet yeterli).
- **Bağımlılık eklenmez:** Çekirdek hesaplamalar cihaz üzerinde yapılır —
  namaz vakitleri astronomik formüllerle (İmsak 18°, Yatsı 17°, İkindi
  gölge katsayısı 1 — Diyanet uyumlu), Hicri dönüşüm tarayıcıya gömülü
  Umm al-Qura takvimiyle. İnternet bağlantısı gerektiren özellik eklemeyin
  (Aşama 7'deki sosyal özellik hariç, o ayrıca planlanacak).
- **Tema:** Tezhip esintili (zümrüt `#0b2f24` + altın); stiller
  `src/style.css` içinde, mevcut CSS değişkenleri ve sınıf adlandırması
  izlenmeli.

## Doğruluk notları

- Vakitlerde Diyanet takvimine göre birkaç dakikalık temkin farkı olabilir;
  il il kalibrasyon ileriki aşamada yapılacak.
- Umm al-Qura, Diyanet Hicri takviminden nadiren 1 gün sapabilir.
- Kandil geceleri, gecenin idrak edildiği akşamın tarihiyle gösterilir.

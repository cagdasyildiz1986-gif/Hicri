# Hicri

Türkçe, çevrimdışı çalışan İslami yaşam uygulaması: Hicri takvim, dini günler,
namaz vakitleri, kıble, zikirmatik ve Kur'an — hepsi bir arada.

## Vizyon ve yol haritası

Ayrıntılı plan için [PLAN.md](PLAN.md) dosyasına bakın.

| Aşama | Kapsam | Durum |
|-------|--------|-------|
| 1 | Ana ekran: Hicri tarih, namaz vakitleri ve geri sayım, dini günler | ✅ İlk sürüm |
| 2 | Sekmeli gezinme, zikirmatik, Esmaü'l-Hüsna, günlük ayet/hadis | Planlandı |
| 3 | Ay görünümlü takvim, kıble pusulası, Ramazan imsakiyesi | Planlandı |
| 4 | Yasin-i Şerif, dua/namaz duaları öğreniyorum, namaz rehberi | Planlandı |
| 5 | Kur'an öğreniyorum: Arapça metin + çoklu meal | Planlandı |
| 6 | Ezan sesi, bildirimler, Capacitor ile Android/iOS paketleme | Planlandı |
| 7 | Hadis zinciri (hesap + sunucu gerektiren sosyal özellik) | Planlandı |
| 8 | Mağaza yayını (Google Play + App Store) | Planlandı |

## Teknik yaklaşım

- **Bağımlılıksız çekirdek:** Namaz vakitleri cihaz üzerinde astronomik
  formüllerle hesaplanır (İmsak 18°, Yatsı 17°, İkindi gölge katsayısı 1 —
  Diyanet'e uyumlu). Hicri dönüşüm, tarayıcıya gömülü Umm al-Qura takvimiyle
  (`Intl` islamic-umalqura) yapılır. İnternet bağlantısı gerekmez.
- **Web öncelikli:** Uygulama önce web'de geliştirilir ve test edilir; mağaza
  sürümleri Capacitor ile aynı kod tabanından paketlenecek.
- **Şu an npm gerekmez:** `node build.js` tek başına yeterlidir.

## Derleme ve çalıştırma

```sh
node build.js        # dist/index.html üretir (tek dosya, bağımsız)
```

`dist/index.html` dosyasını tarayıcıda açmak yeterlidir. Geliştirme sırasında
`index.html` kök dosyası, `src/` altındaki modülleri doğrudan yükler
(bir statik sunucu gerekir, ör. `npx http-server`).

## Dizin yapısı

```
src/js/hijri.js          Hicri ↔ Miladi dönüşümler
src/js/prayer.js         Namaz vakti hesaplamaları (güneş konumu)
src/js/cities.js         81 il merkezi koordinatları
src/js/religiousDays.js  Kandiller, bayramlar, mübarek günler
src/js/app.js            Ana ekran arayüzü
src/style.css            Tezhip esintili tema (zümrüt + altın)
src/body.html            Uygulama gövdesi
build.js                 Tek dosyalık derleme (npm gerekmez)
```

## Doğruluk notları

- Vakitlerde Diyanet'in yayımladığı takvime göre birkaç dakikalık temkin
  farkı olabilir; il il kalibrasyon 4. aşamada yapılacak.
- Umm al-Qura takvimi, Diyanet Hicri takviminden nadiren 1 gün sapabilir.
- Kandil geceleri, Diyanet'teki gibi gecenin idrak edildiği akşamın
  tarihiyle gösterilir.

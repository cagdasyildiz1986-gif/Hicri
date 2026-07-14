# Hicri — Uygulama Planı

Türkçe, tezhip esintili, çevrimdışı öncelikli İslami yaşam uygulaması.
Web'de geliştirilir ve canlı test edilir; Capacitor ile Android + iOS'a paketlenir.

## Mimari: iki katman

**Katman 1 — Çevrimdışı çekirdek (sunucu gerekmez):**
Vakitler, takvim, kıble, zikirmatik, Yasin, dualar, Kur'an ve mealler tamamen
cihazda çalışır. İnternet yokken de uygulama eksiksiz kullanılır.

**Katman 2 — Sosyal özellikler (sunucu gerekir):**
Hadis zinciri; kullanıcı hesabı, veritabanı ve zamanlanmış bildirim ister.

> **Karar (önerilen):** Arka uç olarak **Supabase** (giriş: Google + e-posta).
> Alternatif: Firebase. Sosyal aşamaya gelince kesinleştirilecek.

## Aşamalar

### Aşama 1 — Ana ekran ✅ (tamamlandı)
- Hicri/Miladi tarih, 81 il için namaz vakitleri, sıradaki vakte geri sayım
- Yaklaşan dini günler (kandil/bayram/mübarek gün) geri sayımı

### Aşama 2 — İskelet + Zikirmatik + Esmaü'l-Hüsna
- Alt sekmeli gezinme: Ana Sayfa · Takvim · İbadet · Öğren · (ileride) Zincir
- **Zikirmatik:** dokunmatik sayaç, hedef seçimi (33/99/serbest), titreşim,
  tur takibi, günlük/toplam istatistik, zikir ön tanımları (Sübhanallah,
  Elhamdülillah, Allahu Ekber, salavat, kelime-i tevhid…)
- **Esmaü'l-Hüsna:** 99 isim — Arapça, okunuş, Türkçe anlam
- Günlük ayet/hadis kartı (ana ekranda her gün değişir)

### Aşama 3 — Takvim + Kıble
- Ay görünümlü Hicri ↔ Miladi takvim, dini günler işaretli, yıl listesi
- Kıble pusulası (cihaz pusulası + Kâbe yönü hesabı; harita yedeği)
- Ramazan imsakiyesi görünümü (tüm ay sahur/iftar tablosu)

### Aşama 4 — İbadet rehberi: Yasin, dualar, namaz
- **Yasin-i Şerif:** Arapça metin + okunuş + meal, ayet ayet gezinme
- **Namaz duaları öğreniyorum:** Sübhaneke, Ettehiyyatü, Allahümme salli/barik,
  Rabbena duaları, Kunut duaları… Arapça + okunuş + anlam, ezber modu
  (kelime kelime üzeri kapatarak çalışma)
- **Dua öğreniyorum:** günlük hayat duaları (yemek, uyku, yolculuk, ezan
  duası…) aynı üçlü formatta
- **Namaz nasıl kılınır:** rekât rekât resimli/şematik akış — hangi rükünde
  hangi dua okunur, kadın/erkek farkları, 5 vakit + cuma + bayram namazı

### Aşama 5 — Kur'an öğreniyorum
- Sure/ayet gezgini: Arapça metin + üç meal yan yana
- **Mealler:** Diyanet meali + Elmalılı Hamdi Yazır (kamu malı).
  > **Karar (önerilen):** Üçüncü meal telif izni netleşince eklenecek
  > (aday: Hasan Basri Çantay / Ömer Nasuhi Bilmen — telif araştırılacak;
  > ya da izin alınan çağdaş bir meal).
- Sure arama, son okunan yeri hatırlama, ayet paylaşma (metin olarak)

### Aşama 6 — Bildirimler + Ezan + paketleme
- Capacitor ile Android/iOS projesi; yerel bildirimler
- **Ezan:** vakit girince ezan okunması.
  > **Karar (önerilen):** Vakit başına ayarlanabilir — tam ezan / kısa ses /
  > titreşim / sessiz. Telifsiz ezan kaydı kullanılacak (imsak için ayrı ses).
- Kandil/bayram öncesi hatırlatma bildirimi (1 gün önce + aynı gün)
- Vakit hassasiyeti: il bazında Diyanet takvimiyle kalibrasyon

### Aşama 7 — Hadis zinciri (sosyal)
> **Durum notu:** Arayüz önizlemesi hazırlandı (zincir listesi, katılım,
> "Okudum" onayı, canlı sayaçlar, zincir başlatma formu) — şimdilik örnek
> veriyle, yalnızca cihazda çalışıyor. Sunucu + hesap sistemi eklenince
> gerçek çok kullanıcılı hâle gelecek.
- **Zincir başlatma:** hadis seçimi (uygulamadaki onaylı hadis havuzundan),
  başlangıç tarihi-saati (ileri tarih olabilir), bitiş tarihi-saati
- **Katılım:** zincir başlamadan önce katılım açık; "Başlatılan Hadis
  Zincirleri" listesinde açık zincirler görünür
- **Bildirim:** başlangıca 5 dakika kala tüm katılımcılara anlık bildirim
- **Okuma + onay:** katılımcı hadisi okur, "Okudum" onayı verir
- **Sayaç:** başlatan ve tüm katılımcılar toplam katılımcı ve onay sayısını
  canlı görür; zincir bitişinde özet ekranı
- Hesap sistemi, kötüye kullanım önleme (hadis havuzu sabit olduğu için
  içerik riski düşük), gizlilik: katılımcılar isimle değil rumuzla görünür
- İleride: zikir zinciri, hatim zinciri (cüz paylaşımı) aynı altyapıyla

### Aşama 8 — Mağaza yayını
- Google Play + App Store başvuruları, mağaza görselleri, gizlilik politikası
- Açık analitik olmadan sade kullanım ölçümü (isteğe bağlı)

## Veri kaynakları ve telif notları
- **Vakitler:** cihazda astronomik hesap (Diyanet uyumlu açılar) — telif yok
- **Kur'an Arapça metni:** telif yok (standart Medine imlası kaynaklı metin)
- **Diyanet meali:** Diyanet yayını; kullanım koşulları yayın öncesi teyit edilecek
- **Elmalılı meali (orijinal):** kamu malı (vefat 1942)
- **Hadisler:** kaynak belirtilerek (Buhârî, Müslim…) güvenilir çevirilerden
  derlenecek; her hadiste kaynak gösterilecek
- **Ezan kaydı:** telifsiz/izinli kayıt kullanılacak
- **Namaz rehberi görselleri:** kendi çizimlerimiz (şematik SVG)

## Teknik notlar
- Çekirdek bağımlılıksız JS/CSS; npm yalnızca Capacitor aşamasında gerekecek
  (ortam ağ ayarlarında `registry.npmjs.org` iznine ihtiyaç var)
- Sesler ve Kur'an verisi uygulama paketine gömülür (çevrimdışı garanti)
- Tema: zümrüt + altın tezhip; ileride açık tema seçeneği değerlendirilir

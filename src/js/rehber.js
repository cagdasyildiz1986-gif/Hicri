// Namaz rehberi — rekât tablosu ve adım adım kılınış

export const REKAT_TABLOSU = [
  { vakit: "Sabah", dizilis: "2 sünnet + 2 farz" },
  { vakit: "Öğle", dizilis: "4 sünnet + 4 farz + 2 son sünnet" },
  { vakit: "İkindi", dizilis: "4 sünnet + 4 farz" },
  { vakit: "Akşam", dizilis: "3 farz + 2 sünnet" },
  { vakit: "Yatsı", dizilis: "4 sünnet + 4 farz + 2 son sünnet + 3 vitir" },
  { vakit: "Cuma", dizilis: "4 sünnet + 2 farz (cemaatle) + 4 son sünnet" },
];

export const ABDEST_ADIMLARI = [
  "Niyet edilir ve \"Bismillâh\" denir.",
  "Eller bileklere kadar üç kez yıkanır.",
  "Ağza üç kez su verilir.",
  "Buruna üç kez su çekilir.",
  "Yüz üç kez yıkanır.",
  "Önce sağ, sonra sol kol dirseklerle birlikte üç kez yıkanır.",
  "Eller ıslatılıp başın üstü mesh edilir; kulaklar ve boyun mesh edilir.",
  "Önce sağ, sonra sol ayak topuklarla birlikte üç kez yıkanır.",
];

// İki rekâtlık farz namaz örneği (sabah namazının farzı)
export const NAMAZ_ADIMLARI = [
  {
    baslik: "Niyet",
    metin: "Kıbleye dönülür ve kalpten niyet edilir: \"Niyet ettim Allah rızası için bugünkü sabah namazının farzını kılmaya.\"",
    okunan: null,
  },
  {
    baslik: "İftitah Tekbiri",
    metin: "Eller kaldırılır (erkekler kulak, kadınlar omuz hizasına) ve \"Allâhü Ekber\" denerek namaza başlanır. Eller bağlanır (erkekler göbek altında, kadınlar göğüs üstünde).",
    okunan: "Allâhü Ekber",
  },
  {
    baslik: "Kıyam (1. Rekât)",
    metin: "Ayakta sırasıyla okunur:",
    okunan: "Sübhâneke → Eûzü-Besmele → Fâtiha → Zamm-ı sure (ör. İhlâs)",
  },
  {
    baslik: "Rükû",
    metin: "\"Allâhü Ekber\" denerek eğilir, eller dizlere konur ve üç kez söylenir:",
    okunan: "Sübhâne Rabbiyel-Azîm (×3)",
  },
  {
    baslik: "Doğrulma (Kavme)",
    metin: "Rükûdan doğrulurken söylenir:",
    okunan: "Semiallâhü limen hamideh · Rabbenâ lekel-hamd",
  },
  {
    baslik: "Secde",
    metin: "\"Allâhü Ekber\" denerek secdeye varılır ve üç kez söylenir:",
    okunan: "Sübhâne Rabbiyel-A'lâ (×3)",
  },
  {
    baslik: "Oturuş ve İkinci Secde",
    metin: "\"Allâhü Ekber\" denerek oturulur, kısa bir bekleyişten sonra tekrar \"Allâhü Ekber\" denerek ikinci secde yapılır (yine ×3 Sübhâne Rabbiyel-A'lâ).",
    okunan: null,
  },
  {
    baslik: "Kıyam (2. Rekât)",
    metin: "\"Allâhü Ekber\" denerek ayağa kalkılır. Bu rekâtta Sübhâneke okunmaz:",
    okunan: "Besmele → Fâtiha → Zamm-ı sure (ör. Kevser)",
  },
  {
    baslik: "Rükû ve Secdeler",
    metin: "Birinci rekâttaki gibi rükû, kavme ve iki secde yapılır.",
    okunan: null,
  },
  {
    baslik: "Son Oturuş (Ka'de-i Ahîre)",
    metin: "İkinci secdeden sonra oturulur ve sırasıyla okunur:",
    okunan: "Ettehiyyâtü → Allâhümme Salli → Allâhümme Bârik → Rabbenâ Âtinâ → Rabbenağfirlî",
  },
  {
    baslik: "Selâm",
    metin: "Önce sağa, sonra sola baş çevrilerek söylenir:",
    okunan: "Esselâmü aleyküm ve rahmetullâh (sağa ve sola)",
  },
];

export const NAMAZ_NOTLARI = [
  "3 ve 4 rekâtlı farzlarda: ikinci rekâtın sonunda ilk oturuşta yalnız Ettehiyyâtü okunup kalkılır; 3. ve 4. rekâtlarda yalnız Fâtiha okunur.",
  "Sünnet namazlarının her rekâtında Fâtiha'dan sonra zamm-ı sure okunur.",
  "Vitir namazının 3. rekâtında Fâtiha ve sureden sonra tekbir alınıp Kunut duaları okunur.",
  "Kadınlar secdede kollarını yere yayar, erkekler dirseklerini yerden kaldırır; oturuşlarda kadınlar ayaklarını sağa yatırarak oturur.",
  "Namaz vakitleri için Ana Sayfa'daki, kıble için Kıble sekmesindeki bilgiler kullanılabilir.",
];

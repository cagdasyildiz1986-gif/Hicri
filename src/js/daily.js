// Günün ayeti / hadisi — güne göre dönüşümlü içerik.
// NOT: Ayet mealleri kısa, kaynak gösterilen serbest çevirilerdir; yayın
// öncesi Diyanet mealiyle birebir gözden geçirilecek (bkz. PLAN.md).

const AYETLER = [
  ["Öyleyse siz beni anın ki ben de sizi anayım. Bana şükredin, nankörlük etmeyin.", "Bakara, 152"],
  ["Kullarım sana beni sorarsa: Ben pek yakınım; bana dua edenin duasına karşılık veririm.", "Bakara, 186"],
  ["Şüphesiz güçlükle beraber bir kolaylık vardır. Evet, güçlükle beraber bir kolaylık vardır.", "İnşirâh, 5-6"],
  ["Bilesiniz ki kalpler ancak Allah'ı anmakla huzur bulur.", "Ra'd, 28"],
  ["De ki: Ey kendi aleyhlerine haddi aşan kullarım! Allah'ın rahmetinden ümit kesmeyin.", "Zümer, 53"],
  ["Kim Allah'a karşı gelmekten sakınırsa, Allah ona bir çıkış yolu açar ve onu ummadığı yerden rızıklandırır.", "Talâk, 2-3"],
  ["Sabır ve namazla Allah'tan yardım isteyin.", "Bakara, 45"],
  ["Sen onlara sırf Allah'ın rahmeti sayesinde yumuşak davrandın.", "Âl-i İmrân, 159"],
  ["Şüphesiz Allah katında en değerliniz, O'na karşı gelmekten en çok sakınanınızdır.", "Hucurât, 13"],
  ["Andolsun zamana ki insan gerçekten ziyandadır; ancak iman edip salih amel işleyenler başka.", "Asr, 1-3"],
  ["Andolsun, şükrederseniz elbette size nimetimi artırırım.", "İbrâhîm, 7"],
  ["Şüphesiz Allah adaleti, iyiliği ve yakınlara yardım etmeyi emreder.", "Nahl, 90"],
  ["Muhakkak ki namaz, hayâsızlıktan ve kötülükten alıkoyar.", "Ankebût, 45"],
  ["Rabbinin nimetini minnet ve şükranla an.", "Duhâ, 11"],
  ["O, hanginizin daha güzel amel yapacağını sınamak için ölümü ve hayatı yaratandır.", "Mülk, 2"],
];

const HADISLER = [
  ["Ameller niyetlere göredir; herkese niyet ettiği şey vardır.", "Buhârî, Bed'ü'l-Vahy 1"],
  ["Müslüman, elinden ve dilinden diğer müslümanların güvende olduğu kimsedir.", "Buhârî, Îmân 4"],
  ["Kolaylaştırın, zorlaştırmayın; müjdeleyin, nefret ettirmeyin.", "Buhârî, İlim 11"],
  ["Sizin en hayırlınız, Kur'an'ı öğrenen ve öğretendir.", "Buhârî, Fedâilü'l-Kur'ân 21"],
  ["Kim bir hayra öncülük ederse, ona o hayrı yapanın ecri kadar sevap vardır.", "Müslim, İmâre 133"],
  ["Temizlik imanın yarısıdır.", "Müslim, Tahâret 1"],
  ["Allah sizin bedenlerinize ve suretlerinize değil, kalplerinize ve amellerinize bakar.", "Müslim, Birr 34"],
  ["Kardeşine tebessüm etmen senin için bir sadakadır.", "Tirmizî, Birr 36"],
  ["İnsanlara merhamet etmeyene Allah da merhamet etmez.", "Buhârî, Edeb 18"],
  ["Güzel söz sadakadır.", "Buhârî, Edeb 34"],
  ["Bir müslüman bir ağaç diker de ondan insan, hayvan veya kuş yerse, bu onun için sadaka olur.", "Buhârî, Edeb 27"],
  ["Cennet annelerin ayakları altındadır.", "Nesâî, Cihâd 6"],
  ["Sizin en hayırlınız, ahlâkı en güzel olanınızdır.", "Buhârî, Edeb 39"],
  ["Kendisi için istediğini kardeşi için de istemedikçe hiçbiriniz gerçek mümin olamaz.", "Buhârî, Îmân 7"],
  ["Kim Allah'a ve ahiret gününe inanıyorsa ya hayır söylesin ya da sussun.", "Buhârî, Edeb 31"],
];

// Gün numarasına göre dönüşümlü: çift gün ayet, tek gün hadis
export function gununIcerigi(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const gun = Math.floor((date - start) / 86400000);
  if (gun % 2 === 0) {
    const [metin, kaynak] = AYETLER[Math.floor(gun / 2) % AYETLER.length];
    return { tur: "Günün Ayeti", metin, kaynak };
  }
  const [metin, kaynak] = HADISLER[Math.floor(gun / 2) % HADISLER.length];
  return { tur: "Günün Hadisi", metin, kaynak };
}

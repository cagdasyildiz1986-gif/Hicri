// Hatim halkası uçları (çok-kullanıcılı). Tümü JWT korumalı.
const express = require("express");
const havuz = require("../db");
const { korumali } = require("../middleware/auth");

const router = express.Router();
router.use(korumali);

// Karışması güç, benzeşen harf içermeyen katılım kodu
const KOD_ALFABE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function kodUret(uzunluk = 6) {
  let k = "";
  for (let i = 0; i < uzunluk; i++) k += KOD_ALFABE[Math.floor(Math.random() * KOD_ALFABE.length)];
  return k;
}

async function uyeMi(halkaId, userId) {
  const [s] = await havuz.query(
    "SELECT 1 FROM halka_uyeler WHERE halka_id = ? AND user_id = ?",
    [halkaId, userId]
  );
  return s.length > 0;
}

// Halka özeti (liste için): okunan sayısı ile
async function halkaOzet(halkaId) {
  const [[halka]] = await havuz.query("SELECT * FROM halkalar WHERE id = ?", [halkaId]);
  if (!halka) return null;
  const [[say]] = await havuz.query(
    "SELECT COUNT(*) AS okunan FROM cuz_atama WHERE halka_id = ? AND okundu = 1",
    [halkaId]
  );
  return {
    id: halka.id, ad: halka.ad, hedef: halka.hedef, kod: halka.katilim_kodu,
    tamamlanan: halka.tamamlanan, okunan: say.okunan, sahipMi: undefined,
  };
}

// Yeni halka oluştur → 30 cüz satırı + sahip üyeliği
router.post("/", async (req, res) => {
  const ad = String(req.body.ad || "").trim().slice(0, 80);
  const hedef = ["kendim", "vefat", "sehit", "ummet"].includes(req.body.hedef) ? req.body.hedef : "kendim";
  if (!ad) return res.status(400).json({ hata: "Halka adı gerekli." });

  const baglanti = await havuz.getConnection();
  try {
    await baglanti.beginTransaction();
    let halkaId, kod;
    for (let deneme = 0; deneme < 5; deneme++) {
      kod = kodUret();
      try {
        const [ins] = await baglanti.query(
          "INSERT INTO halkalar (ad, hedef, sahip_user_id, katilim_kodu) VALUES (?, ?, ?, ?)",
          [ad, hedef, req.userId, kod]
        );
        halkaId = ins.insertId;
        break;
      } catch (e) {
        if (e.code !== "ER_DUP_ENTRY") throw e; // kod çakıştı, tekrar dene
      }
    }
    if (!halkaId) throw new Error("kod");
    await baglanti.query(
      "INSERT INTO halka_uyeler (halka_id, user_id, rol) VALUES (?, ?, 'sahip')",
      [halkaId, req.userId]
    );
    // 30 cüz satırı
    const degerler = [];
    for (let n = 1; n <= 30; n++) degerler.push([halkaId, n]);
    await baglanti.query("INSERT INTO cuz_atama (halka_id, cuz_no) VALUES ?", [degerler]);
    await baglanti.commit();
    res.json({ id: halkaId, kod });
  } catch (e) {
    await baglanti.rollback();
    res.status(500).json({ hata: "Halka oluşturulamadı." });
  } finally {
    baglanti.release();
  }
});

// Kod ile katıl
router.post("/katil", async (req, res) => {
  const kod = String(req.body.kod || "").trim().toUpperCase();
  if (!kod) return res.status(400).json({ hata: "Katılım kodu girin." });
  const [[halka]] = await havuz.query("SELECT id FROM halkalar WHERE katilim_kodu = ?", [kod]);
  if (!halka) return res.status(404).json({ hata: "Böyle bir halka yok." });
  await havuz.query(
    "INSERT IGNORE INTO halka_uyeler (halka_id, user_id, rol) VALUES (?, ?, 'uye')",
    [halka.id, req.userId]
  );
  res.json({ id: halka.id });
});

// Üyesi olduğum halkalar
router.get("/", async (req, res) => {
  const [satirlar] = await havuz.query(
    `SELECT h.id, h.ad, h.hedef, h.katilim_kodu AS kod, h.tamamlanan, h.sahip_user_id,
            (SELECT COUNT(*) FROM cuz_atama c WHERE c.halka_id = h.id AND c.okundu = 1) AS okunan
     FROM halka_uyeler u JOIN halkalar h ON h.id = u.halka_id
     WHERE u.user_id = ? ORDER BY h.olusturma DESC`,
    [req.userId]
  );
  res.json({
    halkalar: satirlar.map((h) => ({
      id: h.id, ad: h.ad, hedef: h.hedef, kod: h.kod,
      tamamlanan: h.tamamlanan, okunan: h.okunan, sahipMi: h.sahip_user_id === req.userId,
    })),
  });
});

// Halka detayı: 30 cüz (atanan rumuz + okundu) + sayımlar
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!(await uyeMi(id, req.userId))) return res.status(403).json({ hata: "Bu halkanın üyesi değilsin." });
  const [[halka]] = await havuz.query("SELECT * FROM halkalar WHERE id = ?", [id]);
  if (!halka) return res.status(404).json({ hata: "Halka yok." });
  const [cuzler] = await havuz.query(
    `SELECT c.cuz_no, c.okundu, c.alan_user_id, u.rumuz AS alan_rumuz
     FROM cuz_atama c LEFT JOIN users u ON u.id = c.alan_user_id
     WHERE c.halka_id = ? ORDER BY c.cuz_no`,
    [id]
  );
  const [[uyeSay]] = await havuz.query(
    "SELECT COUNT(*) AS n FROM halka_uyeler WHERE halka_id = ?", [id]
  );
  res.json({
    id: halka.id, ad: halka.ad, hedef: halka.hedef, kod: halka.katilim_kodu,
    tamamlanan: halka.tamamlanan, sahipMi: halka.sahip_user_id === req.userId,
    uyeSayisi: uyeSay.n,
    okunan: cuzler.filter((c) => c.okundu).length,
    cuzler: cuzler.map((c) => ({
      no: c.cuz_no, okundu: !!c.okundu,
      benimMi: c.alan_user_id === req.userId,
      kim: c.alan_rumuz || null,
    })),
  });
});

// Cüzü üstlen (boşsa ya da zaten benimse)
router.post("/:id/cuz/:no/al", async (req, res) => {
  const id = Number(req.params.id), no = Number(req.params.no);
  if (no < 1 || no > 30) return res.status(400).json({ hata: "Geçersiz cüz." });
  if (!(await uyeMi(id, req.userId))) return res.status(403).json({ hata: "Üye değilsin." });
  const [sonuc] = await havuz.query(
    "UPDATE cuz_atama SET alan_user_id = ? WHERE halka_id = ? AND cuz_no = ? AND (alan_user_id IS NULL OR alan_user_id = ?)",
    [req.userId, id, no, req.userId]
  );
  if (!sonuc.affectedRows) return res.status(409).json({ hata: "Bu cüz başkası tarafından alınmış." });
  res.json({ ok: true });
});

// Cüzü bırak (yalnız benimse)
router.post("/:id/cuz/:no/birak", async (req, res) => {
  const id = Number(req.params.id), no = Number(req.params.no);
  await havuz.query(
    "UPDATE cuz_atama SET alan_user_id = NULL, okundu = 0 WHERE halka_id = ? AND cuz_no = ? AND alan_user_id = ?",
    [id, no, req.userId]
  );
  res.json({ ok: true });
});

// Okundu işaretle/geri al (yalnız cüzü üstlenen)
router.post("/:id/cuz/:no/okundu", async (req, res) => {
  const id = Number(req.params.id), no = Number(req.params.no);
  if (!(await uyeMi(id, req.userId))) return res.status(403).json({ hata: "Üye değilsin." });
  const [sonuc] = await havuz.query(
    "UPDATE cuz_atama SET okundu = 1 - okundu WHERE halka_id = ? AND cuz_no = ? AND alan_user_id = ?",
    [id, no, req.userId]
  );
  if (!sonuc.affectedRows) return res.status(409).json({ hata: "Önce cüzü üstlenmelisin." });

  // 30 cüz de okunduysa: hatim tamamlandı → sayaç +1, yeni tur için sıfırla
  const [[say]] = await havuz.query(
    "SELECT COUNT(*) AS okunan FROM cuz_atama WHERE halka_id = ? AND okundu = 1", [id]
  );
  let tamamlandi = false;
  if (say.okunan === 30) {
    await havuz.query("UPDATE halkalar SET tamamlanan = tamamlanan + 1 WHERE id = ?", [id]);
    await havuz.query("UPDATE cuz_atama SET okundu = 0 WHERE halka_id = ?", [id]);
    tamamlandi = true;
  }
  res.json({ ok: true, tamamlandi });
});

// Halkayı sil (yalnız sahip)
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [sonuc] = await havuz.query(
    "DELETE FROM halkalar WHERE id = ? AND sahip_user_id = ?", [id, req.userId]
  );
  if (!sonuc.affectedRows) return res.status(403).json({ hata: "Yalnız sahibi silebilir." });
  res.json({ ok: true });
});

module.exports = router;

// Kimlik doğrulama uçları: e-posta/parola kayıt & giriş, Google ile giriş, /me.
const express = require("express");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const havuz = require("../db");
const { jwtUret, korumali } = require("../middleware/auth");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const epostaGecerli = (e) => typeof e === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && e.length <= 190;
const rumuzTemizle = (r) => (typeof r === "string" ? r.trim().slice(0, 40) : "");

function kullaniciCik(user) {
  return { id: user.id, eposta: user.eposta, rumuz: user.rumuz };
}

// E-posta + parola ile kayıt
router.post("/register", async (req, res) => {
  try {
    const eposta = String(req.body.eposta || "").trim().toLowerCase();
    const parola = String(req.body.parola || "");
    let rumuz = rumuzTemizle(req.body.rumuz);
    if (!epostaGecerli(eposta)) return res.status(400).json({ hata: "Geçerli bir e-posta girin." });
    if (parola.length < 8) return res.status(400).json({ hata: "Parola en az 8 karakter olmalı." });
    if (!rumuz) rumuz = eposta.split("@")[0].slice(0, 40);

    const [mevcut] = await havuz.query("SELECT id FROM users WHERE eposta = ?", [eposta]);
    if (mevcut.length) return res.status(409).json({ hata: "Bu e-posta zaten kayıtlı." });

    const hash = await bcrypt.hash(parola, 10);
    const [sonuc] = await havuz.query(
      "INSERT INTO users (eposta, parola_hash, rumuz) VALUES (?, ?, ?)",
      [eposta, hash, rumuz]
    );
    const user = { id: sonuc.insertId, eposta, rumuz };
    await havuz.query(
      "INSERT INTO identities (user_id, provider, provider_uid) VALUES (?, 'email', ?)",
      [user.id, eposta]
    );
    res.json({ jeton: jwtUret(user), kullanici: kullaniciCik(user) });
  } catch (e) {
    res.status(500).json({ hata: "Sunucu hatası." });
  }
});

// E-posta + parola ile giriş
router.post("/login", async (req, res) => {
  try {
    const eposta = String(req.body.eposta || "").trim().toLowerCase();
    const parola = String(req.body.parola || "");
    const [satirlar] = await havuz.query("SELECT * FROM users WHERE eposta = ?", [eposta]);
    const user = satirlar[0];
    if (!user || !user.parola_hash) return res.status(401).json({ hata: "E-posta ya da parola hatalı." });
    const uyum = await bcrypt.compare(parola, user.parola_hash);
    if (!uyum) return res.status(401).json({ hata: "E-posta ya da parola hatalı." });
    res.json({ jeton: jwtUret(user), kullanici: kullaniciCik(user) });
  } catch (e) {
    res.status(500).json({ hata: "Sunucu hatası." });
  }
});

// Google ile giriş — istemciden gelen ID token doğrulanır.
router.post("/google", async (req, res) => {
  try {
    const credential = String(req.body.credential || "");
    if (!credential) return res.status(400).json({ hata: "Google jetonu yok." });
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload();
    if (!p || !p.sub) return res.status(401).json({ hata: "Google doğrulaması başarısız." });
    const sub = p.sub;
    const eposta = (p.email || "").toLowerCase();

    // Önce google kimliği, sonra e-posta ile eşleştir
    const [kimlik] = await havuz.query(
      "SELECT user_id FROM identities WHERE provider = 'google' AND provider_uid = ?",
      [sub]
    );
    let userId;
    if (kimlik.length) {
      userId = kimlik[0].user_id;
    } else {
      const [epostaEsle] = eposta
        ? await havuz.query("SELECT id FROM users WHERE eposta = ?", [eposta])
        : [[]];
      if (epostaEsle.length) {
        userId = epostaEsle[0].id;
      } else {
        const rumuz = rumuzTemizle(p.name) || (eposta ? eposta.split("@")[0].slice(0, 40) : "Kullanıcı");
        const [ins] = await havuz.query(
          "INSERT INTO users (eposta, parola_hash, rumuz) VALUES (?, NULL, ?)",
          [eposta || `google_${sub}@yok.local`, rumuz]
        );
        userId = ins.insertId;
      }
      await havuz.query(
        "INSERT IGNORE INTO identities (user_id, provider, provider_uid) VALUES (?, 'google', ?)",
        [userId, sub]
      );
    }
    const [uSatir] = await havuz.query("SELECT * FROM users WHERE id = ?", [userId]);
    const user = uSatir[0];
    res.json({ jeton: jwtUret(user), kullanici: kullaniciCik(user) });
  } catch (e) {
    res.status(401).json({ hata: "Google girişi doğrulanamadı." });
  }
});

// Oturum sahibinin profili
router.get("/me", korumali, async (req, res) => {
  try {
    const [satir] = await havuz.query("SELECT * FROM users WHERE id = ?", [req.userId]);
    if (!satir.length) return res.status(404).json({ hata: "Kullanıcı yok." });
    res.json({ kullanici: kullaniciCik(satir[0]) });
  } catch {
    res.status(500).json({ hata: "Sunucu hatası." });
  }
});

// Rumuz güncelle
router.post("/rumuz", korumali, async (req, res) => {
  const rumuz = rumuzTemizle(req.body.rumuz);
  if (!rumuz) return res.status(400).json({ hata: "Rumuz boş olamaz." });
  await havuz.query("UPDATE users SET rumuz = ? WHERE id = ?", [rumuz, req.userId]);
  res.json({ ok: true, rumuz });
});

module.exports = router;

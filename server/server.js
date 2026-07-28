// Hicri API — cPanel Node.js (Passenger) uyumlu Express uygulaması.
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const halkaRoutes = require("./routes/halka");

const app = express();
app.set("trust proxy", 1); // cPanel/Passenger ters vekil arkasında

// CORS — yalnız izin verilen köken (istemcinin çalıştığı adres)
const izinliKoken = process.env.ALLOWED_ORIGIN || "*";
app.use(cors({ origin: izinliKoken === "*" ? true : izinliKoken.split(",").map((s) => s.trim()) }));
app.use(express.json({ limit: "64kb" }));

// Hız sınırı: auth ve yazma uçları için makul bir tavan
const genelSinir = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });
const authSinir = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false });
app.use(genelSinir);

app.get("/health", (req, res) => res.json({ ok: true, ad: "hicri-sunucu", zaman: new Date().toISOString() }));

app.use("/auth", authSinir, authRoutes);
app.use("/halka", halkaRoutes);

app.use((req, res) => res.status(404).json({ hata: "Bulunamadı." }));
// Genel hata yakalayıcı
app.use((err, req, res, _next) => {
  res.status(500).json({ hata: "Sunucu hatası." });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Hicri API ${port} portunda çalışıyor`));

module.exports = app;

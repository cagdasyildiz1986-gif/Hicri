// JWT doğrulama ara katmanı. Authorization: Bearer <jeton> başlığını çözer.
const jwt = require("jsonwebtoken");

function jwtUret(user) {
  return jwt.sign(
    { sub: user.id, rumuz: user.rumuz },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "30d" }
  );
}

function korumali(req, res, next) {
  const bas = req.headers.authorization || "";
  const jeton = bas.startsWith("Bearer ") ? bas.slice(7) : null;
  if (!jeton) return res.status(401).json({ hata: "Giriş gerekli." });
  try {
    const veri = jwt.verify(jeton, process.env.JWT_SECRET);
    req.userId = Number(veri.sub);
    req.rumuz = veri.rumuz;
    next();
  } catch {
    return res.status(401).json({ hata: "Oturum geçersiz ya da süresi dolmuş." });
  }
}

module.exports = { jwtUret, korumali };

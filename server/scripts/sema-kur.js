// schema.sql'i MySQL'e uygular. Kullanım: node scripts/sema-kur.js
// (cPanel'de phpMyAdmin ile içe aktarmayı tercih ederseniz bu gerekmez.)
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "..", "schema.sql"), "utf8");
  const baglanti = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });
  await baglanti.query(sql);
  await baglanti.end();
  console.log("✓ Şema uygulandı.");
}

main().catch((e) => { console.error("HATA:", e.message); process.exit(1); });

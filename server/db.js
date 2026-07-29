// MySQL bağlantı havuzu (mysql2/promise). Ortam değişkenlerinden yapılandırılır.
const mysql = require("mysql2/promise");

const havuz = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  charset: "utf8mb4_unicode_ci",
  namedPlaceholders: false,
});

module.exports = havuz;

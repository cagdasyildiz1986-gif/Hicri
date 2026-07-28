-- Hicri sunucu — MySQL şeması
-- cPanel phpMyAdmin'de bu SQL'i içe aktarın ya da `npm run sema` betiğini çalıştırın.
-- utf8mb4: Türkçe ve emoji dahil tam Unicode desteği.

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  eposta        VARCHAR(190) NOT NULL,
  parola_hash   VARCHAR(255) NULL,           -- yalnız Google ile kayıtta NULL olabilir
  rumuz         VARCHAR(40)  NOT NULL,
  olusturma     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_eposta (eposta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS identities (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  provider      VARCHAR(20) NOT NULL,        -- 'email' | 'google'
  provider_uid  VARCHAR(190) NOT NULL,       -- e-posta ya da Google 'sub'
  PRIMARY KEY (id),
  UNIQUE KEY uq_provider (provider, provider_uid),
  KEY k_identity_user (user_id),
  CONSTRAINT fk_identity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS halkalar (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ad            VARCHAR(80) NOT NULL,
  hedef         VARCHAR(20) NOT NULL DEFAULT 'kendim',  -- niyet: kendim|vefat|sehit|ummet
  sahip_user_id BIGINT UNSIGNED NOT NULL,
  katilim_kodu  VARCHAR(12) NOT NULL,
  durum         VARCHAR(20) NOT NULL DEFAULT 'aktif',   -- aktif|tamamlandi
  tamamlanan    INT NOT NULL DEFAULT 0,
  olusturma     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_halka_kod (katilim_kodu),
  KEY k_halka_sahip (sahip_user_id),
  CONSTRAINT fk_halka_sahip FOREIGN KEY (sahip_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS halka_uyeler (
  halka_id      BIGINT UNSIGNED NOT NULL,
  user_id       BIGINT UNSIGNED NOT NULL,
  rol           VARCHAR(20) NOT NULL DEFAULT 'uye',     -- sahip|uye
  katilma       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (halka_id, user_id),
  KEY k_uye_user (user_id),
  CONSTRAINT fk_uye_halka FOREIGN KEY (halka_id) REFERENCES halkalar(id) ON DELETE CASCADE,
  CONSTRAINT fk_uye_user  FOREIGN KEY (user_id)  REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cuz_atama (
  halka_id      BIGINT UNSIGNED NOT NULL,
  cuz_no        TINYINT UNSIGNED NOT NULL,               -- 1..30
  alan_user_id  BIGINT UNSIGNED NULL,
  okundu        TINYINT(1) NOT NULL DEFAULT 0,
  guncelleme    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (halka_id, cuz_no),
  KEY k_atama_alan (alan_user_id),
  CONSTRAINT fk_atama_halka FOREIGN KEY (halka_id)     REFERENCES halkalar(id) ON DELETE CASCADE,
  CONSTRAINT fk_atama_alan  FOREIGN KEY (alan_user_id) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

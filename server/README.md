# Hicri Sunucu (API) — Kurulum ve Deploy

Bu klasör, Hicri'nin **hesap sistemi** ve **çok-kullanıcılı hatim halkası** için
Node.js + MySQL API'sidir. İstemci (uygulama) GitHub Pages'te kalır; bu API cPanel
hosting'inizde ayrı çalışır ve uygulama ona internet üzerinden bağlanır.

> Not: Bu API kişisel/gizli değerlerle çalışır (veritabanı parolası, JWT sırrı).
> Bunlar yalnızca sunucudaki `.env` dosyasında kalır; **asla depoya ya da istemciye
> girmez.**

---

## Genel bakış (ne nerede)

| Parça | Nerede | Ne yapar |
|------|--------|----------|
| Uygulama (istemci) | GitHub Pages | Kullanıcı arayüzü; API'ye bağlanır |
| API (bu klasör) | cPanel Node.js | Giriş, hesap, hatim halkası |
| Veritabanı | cPanel MySQL | Kullanıcılar, halkalar, cüzler |
| Google girişi | Google Cloud | Kimlik doğrulama sağlayıcısı |

---

## Ön koşullar (bir kez yapılır)

### 1) cPanel'de MySQL veritabanı
1. cPanel → **MySQL® Databases**.
2. **Yeni veritabanı** oluştur (ör. `kullanici_hicri`).
3. **Yeni kullanıcı** oluştur + güçlü parola.
4. Kullanıcıyı veritabanına ekle, **ALL PRIVILEGES** ver.
5. Şu üç değeri not al: veritabanı adı, kullanıcı adı, parola. (Host genelde `localhost`.)

### 2) Google OAuth Client ID (Google ile giriş için)
1. https://console.cloud.google.com → yeni proje oluştur.
2. **APIs & Services → OAuth consent screen**: External seç, uygulama adı "Hicri",
   destek e-postası gir, kaydet (test aşamasında kalabilir).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. Application type: **Web application**.
5. **Authorized JavaScript origins** kısmına şunu ekle:
   `https://cagdasyildiz1986-gif.github.io`
6. Oluştur; verilen **Client ID**'yi (…apps.googleusercontent.com) not al.
   Bu değer herkese açıktır; hem sunucuda hem istemcide kullanılır.

### 3) cPanel'de Node.js uygulaması
1. cPanel → **Setup Node.js App → Create Application**.
2. **Node.js version**: 18 ya da üzeri.
3. **Application mode**: Production.
4. **Application root**: kodun yükleneceği klasör (ör. `hicri-api`).
5. **Application URL**: API için bir alt alan adı (ör. `api.alanadınız.com`).
6. **Application startup file**: `server.js`.
7. Oluştur. (Kodu yükledikten sonra buraya dönüp yeniden başlatacağız.)

---

## Kurulum (kodu sunucuya alma)

`server/` klasörünün içeriğini cPanel'deki **Application root**'a yükleyin.
İki yol var:

**A) cPanel Git ile (önerilen):** cPanel → Git Version Control ile bu depoyu
çekin; sonra Application root'u `server` klasörünü gösterecek şekilde ayarlayın
(ya da `server` içeriğini root'a kopyalayın).

**B) Dosya Yöneticisi/FTP ile:** `server/` içindeki dosyaları Application root'a
yükleyin. `node_modules` ve `.env` yüklemeyin.

Ardından:

1. **`.env` oluştur:** `.env.example` dosyasını `.env` olarak kopyalayıp doldurun
   (DB bilgileri, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `ALLOWED_ORIGIN`).
   `JWT_SECRET` için uzun rastgele bir değer üretin (ör. `openssl rand -hex 48`).
2. **Bağımlılıkları kur:** cPanel → Setup Node.js App → uygulamanızın satırında
   **"Run NPM Install"** düğmesine basın (ya da terminalde `npm install`).
3. **Şemayı kur:** iki seçenek —
   - cPanel → phpMyAdmin → veritabanını seç → **Import** → `schema.sql`; **ya da**
   - Terminalde `npm run sema` (`.env` dolu olmalı).
4. **Başlat/yeniden başlat:** Setup Node.js App ekranında **Restart**.

---

## Doğrulama

Tarayıcıda `https://<API-URL>/health` adresini açın; şu yanıtı görmelisiniz:

```json
{ "ok": true, "ad": "hicri-sunucu", "zaman": "..." }
```

Kayıt denemesi (terminalde):

```sh
curl -X POST https://<API-URL>/auth/register \
  -H "Content-Type: application/json" \
  -d '{"eposta":"deneme@ornek.com","parola":"parola1234","rumuz":"Deneme"}'
```

`jeton` ve `kullanici` dönerse auth çalışıyor demektir.

---

## Uç noktalar (özet)

| Yöntem | Yol | Açıklama |
|--------|-----|----------|
| GET  | `/health` | Sağlık kontrolü |
| POST | `/auth/register` | E-posta + parola kayıt |
| POST | `/auth/login` | E-posta + parola giriş |
| POST | `/auth/google` | Google ID token ile giriş |
| GET  | `/auth/me` | Oturum sahibinin profili (jeton gerekli) |
| POST | `/auth/rumuz` | Rumuz güncelle |
| POST | `/halka` | Halka oluştur → katılım kodu |
| POST | `/halka/katil` | Kod ile katıl |
| GET  | `/halka` | Üyesi olduğum halkalar |
| GET  | `/halka/:id` | Halka detayı (30 cüz + sayımlar) |
| POST | `/halka/:id/cuz/:no/al` | Cüzü üstlen |
| POST | `/halka/:id/cuz/:no/okundu` | Okundu işaretle |
| DELETE | `/halka/:id` | Halkayı sil (sahip) |

Korumalı uçlar `Authorization: Bearer <jeton>` başlığı ister.

---

## Güvenlik notları
- Parolalar bcrypt ile hash'lenir; düz metin saklanmaz.
- Tüm SQL parametrelidir (enjeksiyon koruması).
- CORS yalnız `ALLOWED_ORIGIN`'e izin verir.
- `.env` ve `node_modules` depoya girmez (`.gitignore`).
- Yalnızca HTTPS üzerinden yayınlayın (cPanel AutoSSL).

## Sonraki adımlar
- İstemci tarafı (uygulamada Hesap/Giriş ekranı ve halkanın sunucuya bağlanması)
  ayrı olarak eklenecek.
- Apple ile giriş, iOS/Capacitor paketlemeyle birlikte gelecek.

// Kıble pusulası — Kâbe yönü hesabı ve cihaz pusulasıyla canlı yön gösterimi

const KABE = { lat: 21.4225, lon: 39.8262 };
const radyan = (d) => (d * Math.PI) / 180;
const derece = (r) => (r * 180) / Math.PI;

// Büyük daire yöntemiyle kuzeyden saat yönünde kıble açısı
export function qiblaBearing(lat, lon) {
  const dLon = radyan(KABE.lon - lon);
  const y = Math.sin(dLon);
  const x =
    Math.cos(radyan(lat)) * Math.tan(radyan(KABE.lat)) -
    Math.sin(radyan(lat)) * Math.cos(dLon);
  return (derece(Math.atan2(y, x)) + 360) % 360;
}

function yonAdi(a) {
  const adlar = ["kuzey", "kuzeydoğu", "doğu", "güneydoğu", "güney", "güneybatı", "batı", "kuzeybatı"];
  return adlar[Math.round(a / 45) % 8];
}

export function initQibla(root, getCity) {
  let heading = null;
  let dinleniyor = false;
  let hizalandi = false;

  function bearing() {
    const c = getCity();
    return qiblaBearing(c.lat, c.lon);
  }

  function renderStatik() {
    const b = bearing();
    root.querySelector("#kb-aci").textContent =
      `${getCity().name} için kıble: ${Math.round(b)}° (${yonAdi(b)})`;
  }

  function draw() {
    const b = bearing();
    const dial = root.querySelector("#kb-dial");
    const kabe = root.querySelector("#kb-kabe");
    const durum = root.querySelector("#kb-durum");
    kabe.setAttribute("transform", `rotate(${b} 100 100)`);
    if (heading == null) return;
    dial.setAttribute("transform", `rotate(${-heading} 100 100)`);
    const fark = Math.abs(((b - heading + 540) % 360) - 180);
    const uyum = fark <= 5;
    root.querySelector(".kb-pusula").classList.toggle("uyumlu", uyum);
    durum.textContent = uyum
      ? "Kıbleye yöneldiniz"
      : `Kıble ${Math.round(((b - heading + 360) % 360))}° ${((b - heading + 360) % 360) <= 180 ? "sağınızda" : "solunuzda"}`;
    if (uyum && !hizalandi) navigator.vibrate?.([80, 60, 80]);
    hizalandi = uyum;
  }

  function olayla(e) {
    if (typeof e.webkitCompassHeading === "number") {
      heading = e.webkitCompassHeading; // iOS
    } else if (e.absolute && typeof e.alpha === "number") {
      heading = (360 - e.alpha) % 360; // Android (mutlak)
    } else if (typeof e.alpha === "number") {
      heading = (360 - e.alpha) % 360; // en iyi tahmin
    }
    draw();
  }

  async function baslat() {
    const btn = root.querySelector("#kb-baslat");
    try {
      if (typeof DeviceOrientationEvent !== "undefined" &&
          typeof DeviceOrientationEvent.requestPermission === "function") {
        const izin = await DeviceOrientationEvent.requestPermission();
        if (izin !== "granted") throw new Error("izin verilmedi");
      }
      window.addEventListener("deviceorientationabsolute", olayla, true);
      window.addEventListener("deviceorientation", olayla, true);
      dinleniyor = true;
      btn.textContent = "Pusula çalışıyor…";
      btn.disabled = true;
      setTimeout(() => {
        if (heading == null) {
          root.querySelector("#kb-durum").textContent =
            "Cihaz pusulası bulunamadı — yukarıdaki açıyı kullanarak yönelebilirsiniz.";
          btn.textContent = "Pusula desteklenmiyor";
        }
      }, 3000);
    } catch {
      root.querySelector("#kb-durum").textContent =
        "Pusula izni verilmedi — yukarıdaki açıyı kullanarak yönelebilirsiniz.";
    }
  }

  root.innerHTML = `
    <p class="kb-aci" id="kb-aci"></p>
    <div class="kb-pusula">
      <svg viewBox="0 0 200 200" aria-label="Kıble pusulası">
        <g id="kb-dial">
          <circle cx="100" cy="100" r="92" class="kb-cember" />
          <circle cx="100" cy="100" r="78" class="kb-cember ince" />
          <g class="kb-harfler">
            <text x="100" y="26">K</text>
            <text x="178" y="105">D</text>
            <text x="100" y="186">G</text>
            <text x="22" y="105">B</text>
          </g>
          <g id="kb-kabe">
            <path d="M100 10 L106 24 L100 21 L94 24 Z" class="kb-kabe-isaret" />
            <rect x="96" y="26" width="8" height="8" class="kb-kabe-kutu" />
          </g>
        </g>
        <path d="M100 40 L105 58 L100 54 L95 58 Z" class="kb-ibre" />
        <circle cx="100" cy="100" r="3" class="kb-merkez" />
      </svg>
    </div>
    <p class="kb-durum" id="kb-durum">Canlı yön için pusulayı başlatın.</p>
    <button class="tk-bugun-btn" id="kb-baslat">Pusulayı Başlat</button>
    <p class="footnote">Pusula, telefonun sensörünü kullanır; metal cisimlerden
    uzak tutun ve telefonu 8 çizerek kalibre edin. Açı, seçili il merkezine göredir.</p>
  `;

  root.querySelector("#kb-baslat").addEventListener("click", baslat);
  renderStatik();
  draw();

  return {
    refresh() {
      renderStatik();
      draw();
    },
  };
}

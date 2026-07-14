// Zikirmatik — dokunmatik sayaç, hedef, tur ve günlük istatistik

const ZIKIR_PRESETS = [
  { id: "subhanallah", ad: "Sübhânallah", arapca: "سُبْحَانَ الله" },
  { id: "elhamdulillah", ad: "Elhamdülillâh", arapca: "اَلْحَمْدُ لِلّٰهِ" },
  { id: "allahuekber", ad: "Allâhu Ekber", arapca: "اَللهُ أَكْبَرُ" },
  { id: "kelimeitevhid", ad: "Lâ ilâhe illallah", arapca: "لَا إِلٰهَ إِلَّا الله" },
  { id: "salavat", ad: "Salavât", arapca: "اَللّٰهُمَّ صَلِّ عَلٰى مُحَمَّدٍ" },
  { id: "istigfar", ad: "Estağfirullah", arapca: "أَسْتَغْفِرُ الله" },
  { id: "serbest", ad: "Serbest Zikir", arapca: "" },
];

const TARGETS = [33, 99, 100, 500, 1000, 0]; // 0 = serbest

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

// Son 7 günün zikir sayıları — bugün son sırada
function haftaVerisi(stats) {
  const veri = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    veri.push({
      gun: GUN_KISA[d.getDay()],
      sayi: stats[todayKey(d)] || 0,
      bugun: i === 0,
    });
  }
  return veri;
}

// Haftalık çubuk grafik: tek seri, bugün vurgulu, yalnız bugünün değeri etiketli
function haftaGrafigiSVG(stats) {
  const veri = haftaVerisi(stats);
  const W = 300, H = 96, taban = 72, solPay = 6;
  const adim = (W - solPay * 2) / 7;
  const cubukW = 22;
  const max = Math.max(1, ...veri.map((v) => v.sayi));

  const cubuklar = veri.map((v, i) => {
    const x = solPay + i * adim + (adim - cubukW) / 2;
    const h = v.sayi === 0 ? 2 : Math.max(3, (v.sayi / max) * 54);
    const y = taban - h;
    return `
      <g>
        <rect class="zg-bar${v.bugun ? " bugun" : ""}${v.sayi === 0 ? " bos" : ""}"
              x="${x}" y="${y}" width="${cubukW}" height="${h}" rx="3">
          <title>${v.gun}: ${v.sayi} zikir</title>
        </rect>
        ${v.bugun && v.sayi > 0 ? `<text class="zg-deger" x="${x + cubukW / 2}" y="${y - 6}">${v.sayi}</text>` : ""}
        <text class="zg-gun${v.bugun ? " bugun" : ""}" x="${x + cubukW / 2}" y="${taban + 16}">${v.gun}</text>
      </g>`;
  }).join("");

  return `<svg viewBox="0 0 ${W} ${H}" class="zg-grafik" role="img"
    aria-label="Son 7 günün zikir sayıları">
    <line class="zg-taban" x1="${solPay}" y1="${taban}" x2="${W - solPay}" y2="${taban}" />
    ${cubuklar}
  </svg>`;
}

function loadZikirState() {
  try {
    return JSON.parse(localStorage.getItem("hicri.zikir") || "{}");
  } catch {
    return {};
  }
}

function saveZikirState(s) {
  localStorage.setItem("hicri.zikir", JSON.stringify(s));
}

export function initZikir(root) {
  const st = Object.assign(
    { zikirId: "subhanallah", target: 33, count: 0, tur: 0, stats: {} },
    loadZikirState()
  );

  root.innerHTML = `
    <div class="zikir-head">
      <div class="zikir-arapca" id="zikir-arapca"></div>
      <div class="zikir-ad" id="zikir-ad"></div>
    </div>

    <button class="zikir-pad" id="zikir-pad" aria-label="Zikir say">
      <svg viewBox="0 0 100 100" class="zikir-ring" aria-hidden="true">
        <circle cx="50" cy="50" r="46" class="ring-bg" />
        <circle cx="50" cy="50" r="46" class="ring-fg" id="zikir-ring" />
      </svg>
      <span class="zikir-sayi" id="zikir-sayi">0</span>
      <span class="zikir-hedef" id="zikir-hedef"></span>
    </button>

    <div class="zikir-alt">
      <div class="zikir-stat"><span id="zikir-tur">0</span><label>Tur</label></div>
      <button class="zikir-sifirla" id="zikir-sifirla">Sıfırla</button>
      <div class="zikir-stat"><span id="zikir-bugun">0</span><label>Bugün</label></div>
    </div>

    <div class="chips" id="zikir-secim"></div>
    <div class="chips" id="hedef-secim"></div>

    <div class="bosluk"></div>
    <h3 class="og-bolum-baslik">Son 7 Gün</h3>
    <div id="zikir-grafik"></div>
    <p class="zg-toplam">Toplam <span id="zikir-toplam">0</span> zikir</p>
  `;

  const $ = (id) => root.querySelector("#" + id);
  const ring = $("zikir-ring");
  const RING_LEN = 2 * Math.PI * 46;
  ring.style.strokeDasharray = RING_LEN;

  function persist() {
    saveZikirState(st);
  }

  function renderChips() {
    $("zikir-secim").innerHTML = ZIKIR_PRESETS.map(
      (z) => `<button class="chip${z.id === st.zikirId ? " on" : ""}" data-zikir="${z.id}">${z.ad}</button>`
    ).join("");
    $("hedef-secim").innerHTML = TARGETS.map(
      (t) => `<button class="chip${t === st.target ? " on" : ""}" data-target="${t}">${t === 0 ? "∞" : t}</button>`
    ).join("");
  }

  function render() {
    const z = ZIKIR_PRESETS.find((x) => x.id === st.zikirId) || ZIKIR_PRESETS[0];
    $("zikir-arapca").textContent = z.arapca;
    $("zikir-ad").textContent = z.ad;
    $("zikir-sayi").textContent = st.count;
    $("zikir-hedef").textContent = st.target ? `/ ${st.target}` : "";
    $("zikir-tur").textContent = st.tur;
    $("zikir-bugun").textContent = st.stats[todayKey()] || 0;
    $("zikir-grafik").innerHTML = haftaGrafigiSVG(st.stats);
    $("zikir-toplam").textContent = Object.values(st.stats)
      .reduce((a, b) => a + b, 0);
    const oran = st.target ? Math.min(st.count / st.target, 1) : 0;
    ring.style.strokeDashoffset = RING_LEN * (1 - oran);
  }

  $("zikir-pad").addEventListener("click", () => {
    st.count++;
    st.stats[todayKey()] = (st.stats[todayKey()] || 0) + 1;
    if (st.target && st.count >= st.target) {
      st.count = 0;
      st.tur++;
      navigator.vibrate?.([60, 40, 60]); // hedef tamamlandı
    } else {
      navigator.vibrate?.(12);
    }
    persist();
    render();
  });

  $("zikir-sifirla").addEventListener("click", () => {
    st.count = 0;
    st.tur = 0;
    persist();
    render();
  });

  root.addEventListener("click", (e) => {
    const zikirBtn = e.target.closest("[data-zikir]");
    const targetBtn = e.target.closest("[data-target]");
    if (zikirBtn) {
      st.zikirId = zikirBtn.dataset.zikir;
      st.count = 0;
      st.tur = 0;
    } else if (targetBtn) {
      st.target = Number(targetBtn.dataset.target);
      st.count = 0;
      st.tur = 0;
    } else {
      return;
    }
    persist();
    renderChips();
    render();
  });

  renderChips();
  render();
}

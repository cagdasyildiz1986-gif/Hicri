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

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

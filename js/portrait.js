// ================= portrait: code typed → noise → decodes; then rows re-type
// Exposes window.Portrait; site.js drives its timeline.
window.Portrait = (() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PBOX = { x: 740.5, y: 110.5, w: 1127.2, h: 970.0 };   // portrait, placed to match the Illustrator sheet
  const W = 640, H = 554;
  // candidate character sets for the portrait; each is ordered by measured ink at load time
  const RAMPS = {
    ascii:   { label: "ASCII",   chars: " '`.,:;=+?7>3$xZ#&8@EHNM" },
    letters: { label: "Letters", chars: " .,:ilrtcjvxzsnoaeuhkdbqpgyfwmAVTXZLEFHKNRBGDOQMW" },
    math:    { label: "Math",    chars: " ·'-∘=+×÷<≈≠∫√∂πΣ∇Ω∞±∏" },
    digits:  { label: "Digits",  chars: " .,:;1742358690" },
    greek:   { label: "Greek",   chars: " ·ιντρσοεαυκγζλδθβφψξηωμΔΛΓΣΠΦΨΘΞΩ" },
    name:    { label: "Name",    chars: " .:,ietqnagkKTIAQNEG" }
  };
  let rampKey = "letters", RAMP = RAMPS.letters.chars, rawG = null;
  const NOISE = "!\"#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_{|}~";
  const COLS = 130, LINE = 1.1;
  const CODE = [
    "# portrait.py  -  Keqing Tantai",
    "import numpy as np",
    "RAMP = \" '`.,:;=+?7>3$xZ#&8@EHNM\"",
    "img  = load('portrait.png').convert('L')",
    "dark = 1.0 - clahe(img, clip=0.02)",
    "grid = resample(dark, cols=130, aspect=1.1)",
    "for row in grid:",
    "    line = ''",
    "    for v in row:",
    "        k = int(round(v ** 0.8 * (len(RAMP) - 1)))",
    "        line += RAMP[k]",
    "    type(line)",
    "",
    "# to each age its questions;",
    "# to each question the methods of its age.",
    ""
  ];
  const cv = document.getElementById("cv"), ctx = cv.getContext("2d");
  let rows = 0, finalGrid = [], codeGrid = [], adv = 0.6, rnd = null;

  const pbox = document.getElementById("pbox");
  Object.assign(pbox.style, { left: PBOX.x + "px", top: PBOX.y + "px", width: PBOX.w + "px", height: PBOX.h + "px" });

  // darkness map (white = dark) → 0..1 per pixel; needs the image served from the same origin
  function load(src) {
    return new Promise(ok => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas"); c.width = W; c.height = H;
        const k = c.getContext("2d"); k.drawImage(img, 0, 0);
        const px = k.getImageData(0, 0, W, H).data, raw = new Float32Array(W * H);
        for (let i = 0; i < raw.length; i++) raw[i] = px[i * 4] / 255;
        rawG = raw;
        ok(raw);
      };
      img.src = src;
    });
  }

  // The grid keeps the proportions of the typewriter version (cell = 0.6 em wide, 1.1 em high);
  // each serif glyph is centred in its own cell, at GLYPH x the cell width.
  const GLYPH = 0.85 / 0.72;           // 15 % smaller than the first serif version
  // font size for one character: never wider than 94 % of its cell, so neighbours never touch
  function fitSize(k, ch, cw, face) {
    const base = cw * GLYPH;
    k.font = `${base}px ${face}`;
    const w = k.measureText(ch).width;
    return w > cw * 0.94 ? base * cw * 0.94 / w : base;
  }
  function measureRamp(face) {
    const cw = 40, chh = Math.round(cw * LINE / 0.6), c = document.createElement("canvas"), k = c.getContext("2d", { willReadFrequently: true });
    c.width = cw; c.height = chh;
    const list = [];
    for (const ch of RAMP) {
      k.clearRect(0, 0, c.width, c.height); k.fillStyle = "#000"; k.font = `${fitSize(k, ch, cw, face)}px ${face}`; k.textAlign = "center"; k.fillText(ch, cw / 2, chh * 0.78);
      const px = k.getImageData(0, 0, c.width, c.height).data; let sum = 0;
      for (let i = 3; i < px.length; i += 4) sum += px[i];
      list.push([ch, sum / (px.length / 4) / 255]);
    }
    list.sort((p, q) => p[1] - q[1]);
    const lo = list[0][1], hi = list[list.length - 1][1];
    return { chars: list.map(p => p[0]), covs: list.map(p => (p[1] - lo) / (hi - lo)), adv: 0.6 };
  }
  function build(raw, mono) {
    const m = measureRamp(mono); adv = m.adv;
    POOL = rampKey === "ascii" ? NOISE : [...RAMP.replace(/ /g, "")].join("");
    const cw = W / COLS, chh = cw * LINE / adv;
    rows = Math.floor(H / chh);
    finalGrid = [];
    for (let r = 0; r < rows; r++) {
      let line = "";
      for (let k = 0; k < COLS; k++) {
        const x0 = Math.floor(k * cw), x1 = Math.max(x0 + 1, Math.floor((k + 1) * cw));
        const y0 = Math.floor(r * chh), y1 = Math.max(y0 + 1, Math.floor((r + 1) * chh));
        let s = 0, n = 0;
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { s += raw[y * W + x]; n++; }
        const v = Math.pow(s / n, 0.8);
        let best = 0, d = 9;
        for (let i = 0; i < m.covs.length; i++) { const e = Math.abs(m.covs[i] - v); if (e < d) { d = e; best = i; } }
        line += m.chars[best];
      }
      finalGrid.push(line);
    }
    codeGrid = [];
    for (let i = 0; codeGrid.length < rows; i++) codeGrid.push(("      " + CODE[i % CODE.length]).padEnd(COLS, " ").slice(0, COLS));   // indented clear of the title
    rnd = new Float32Array(rows * COLS);
    for (let j = 0; j < rnd.length; j++) rnd[j] = Math.random();
  }
  let POOL = NOISE;
  const noiseAt = (j, t) => POOL[Math.floor((rnd[j] * 997 + t * 30)) % POOL.length];
  const DUR = 5.4;
  function cell(r, k, j, t) {
    const fin = finalGrid[r][k], code = codeGrid[r][k];
    const typeEnd = r * 0.024 + k * 0.004;
    if (t < typeEnd) return [" ", 0];
    const sw = 1.9 + 1.2 * ((k / COLS) * 0.45 + (r / rows) * 0.55) + rnd[j] * 0.25;
    if (t < sw) return [code, 0];
    if (fin === " ") return t < sw + 0.12 && code !== " " ? [noiseAt(j, t), 0] : [" ", 1];
    const dx = k / COLS - 0.5, dy = (r / rows - 0.42) * 0.9;
    const settle = Math.max(sw + 0.3, 2.6 + 1.9 * Math.min(1, Math.hypot(dx, dy) / 0.62) + rnd[j] * 0.4);
    if (t < settle) return [noiseAt(j, t), 0];
    return [fin, 1];
  }
  // resting state: three rows at a time, a short run of scrambled characters travelling left to right
  const LANES = 3, SPEED = 75, TRAIL = 7;
  let lanes = [], rowCells = [], colIdx = [];
  function prepLanes() {
    rowCells = finalGrid.map(line => { const c = []; for (let k = 0; k < line.length; k++) if (line[k] !== " ") c.push(k); return c; });
    colIdx = rowCells.map(c => { const m = new Int16Array(COLS).fill(-1); c.forEach((k, i) => { m[k] = i; }); return m; });
    lanes = [];
  }
  function laneHeads(now) {
    const heads = new Map();
    for (let i = lanes.length - 1; i >= 0; i--) {
      const L = lanes[i], idx = Math.floor((now - L.start) * SPEED);
      if (idx >= rowCells[L.r].length + TRAIL) { lanes.splice(i, 1); continue; }
      if (idx >= 0) heads.set(L.r, idx);
    }
    while (lanes.length < LANES) {
      const busy = new Set(lanes.map(l => l.r)); let r, n = 0;
      do { r = Math.floor(Math.random() * rows); n++; } while ((rowCells[r].length < 8 || busy.has(r)) && n < 50);
      lanes.push({ r, start: now + Math.random() * 0.6 });
    }
    return heads;
  }
  let dpr = 1, fontPx = 10;
  // glyph atlas: every character used, pre-drawn once per colour; frames then only copy tiles
  let atlas = null, tile = null, slot = new Map();
  function buildAtlas() {
    const css = getComputedStyle(document.body), face = css.getPropertyValue("--serif");
    const pxW = cv.width / COLS, pxH = pxW * LINE / 0.6;
    const tw = Math.ceil(pxW * 2), th = Math.ceil(pxH);
    const chars = [...new Set((Object.values(RAMPS).map(r => r.chars).join("") + NOISE + CODE.join("")).replace(/ /g, ""))];
    atlas = document.createElement("canvas"); atlas.width = tw * chars.length; atlas.height = th * 2;
    const a = atlas.getContext("2d");
    a.textAlign = "center"; a.textBaseline = "alphabetic";
    const sizes = chars.map(ch => fitSize(a, ch, pxW, face));
    [css.getPropertyValue("--code").trim(), css.getPropertyValue("--ink").trim()].forEach((col, layer) => {
      a.fillStyle = col;
      chars.forEach((ch, i) => { a.font = `${sizes[i]}px ${face}`; a.fillText(ch, i * tw + tw / 2, layer * th + th * 0.78); });
    });
    chars.forEach((ch, i) => slot.set(ch, i));
    tile = { tw, th, pxW, pxH };
  }
  function sizeCanvas(S) {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = PBOX.w * S, cssH = PBOX.h * S;
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    buildAtlas();
  }
  function drawPortrait(t, idle) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    const { tw, th, pxW, pxH } = tile, off = (tw - pxW) / 2;
    const heads = idle !== null && !reduce ? laneHeads(idle) : null;
    for (let r = 0; r < rows; r++) {
      let a = "", b = "";
      for (let k = 0; k < COLS; k++) {
        const j = r * COLS + k;
        let ch, layer;
        if (idle !== null) {
          ch = finalGrid[r][k]; layer = 1;
          if (heads && heads.has(r) && ch !== " ") {
            const behind = heads.get(r) - colIdx[r][k];
            if (behind >= 0 && behind < TRAIL - Math.floor(rnd[j] * 3)) ch = noiseAt(j, idle * 1.7);
          }
        } else [ch, layer] = cell(r, k, j, t);
        if (ch === " ") continue;
        const i = slot.get(ch); if (i === undefined) continue;
        ctx.drawImage(atlas, i * tw, layer * th, tw, th, k * pxW - off, r * pxH, tw, th);
      }
    }
  }

  return {
    DUR, load, build, prepLanes,
    size: sizeCanvas,
    draw: drawPortrait,
    get ready() { return rows > 0; }   // true once build() has made the grid
  };
})();

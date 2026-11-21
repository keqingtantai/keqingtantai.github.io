// Layout scaling, text decode, fixed bar and hover. The portrait lives in portrait.js.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let S = 1;

  // ---------------- fixed navigation
  const NAV = [["Product", "#product"], ["Graphic", "#graphic"], ["Urban", "#urban"], ["About", "#about"]];
  function navHTML(list = NAV) { return list.map(([t, h]) => `<a href="${h}">${t}</a>`).join('<span class="sep"> \\ </span>'); }
  document.getElementById("navBar").innerHTML = navHTML([["Home", "#s1"], ...NAV]);

  // ---------------- work sheets: big title and cards in rows of three (placeholders until a project fills them)
  const COLX = [150, 710, 1270], CARD_W = 500, CARD_H = CARD_W * 381.9 / 571.7, ROW = 680;
  const CAT_X = { Urban: 150, Product: 150, Graphic: 150 };
  const PROJECTS = {
    product: [
      { id: "pets-clock", title: "Pets Clock", text: ["A 24-hour wall clock told by shadows.", "A rotating light rakes a computed relief,", "casting a pixel cat for every two hours."] },
      { id: "moire-public-chair", title: "Moiré Public Chair", text: ["A pair of steel chairs whose gratings", "form an image that inverts with each step,", "inviting passers-by to pause and look."] },
      { id: "walking-again", title: "Walking Again", text: ["A rollator rebuilt from one scrapped shared", "bike: its rear triangle turned into a spine,", "bolted so any local workshop can build it."] },
      { id: "silver-ingot-soap", title: "Silver Ingot Soap", text: ["A Qing silver ingot from the Ningbo Bang", "Museum, translated into a daily soap:", "silicone-cast, wrapped like a banknote."] }
    ],
    graphic: [
      { id: "hunao-vi-manual", title: "Hunao VI Manual", pdf: true, text: ["Identity for Hunao: a wordmark built as a", "pinball table, with flippers for tone marks", "and a ball rolling through its looping U."] },
      { id: "in-the-prime-of-youth-album", title: "In the Prime of Youth", pdf: true, text: ["Catalogue for the Handan stop of CAFA's", "exhibition of 100 sketches, 1951–2017, under", "a brush-lettered title on deep green."] },
      { id: "suqiao-vi-manual", title: "Suqiao VI Manual", pdf: true, text: ["Identity for Suqiao Supermarket: an arch", "drawn as a bridge over the name, in navy", "and amber, from forms to cartons and flags."] },
      { id: "vasari-vi-manual", title: "Vasari VI Manual", pdf: true, text: ["Identity for Vasari Art: a gilded crest of", "angels and crown on deep brown, extended", "to stationery, bags, aprons and wayfinding."] },
      { id: "ningbo-bang-story-competition-10th", title: "Ten Years of Voices", text: ["Logo for the 10th Ningbo Bang Story", "Competition: one form read three ways, as", "the character 甬, the number 10 and a globe."] },
      { id: "owoh-vi-manual", title: "OwOh VI Manual", pdf: true, text: ["Identity for OwOh Online: a one-line script", "wordmark whose two Os read as eyes, carried", "by a shiba mascot from app icon to tape."] }
    ]
  };
  for (const sec of document.querySelectorAll(".work")) {
    const st = sec.querySelector(".stage"), n = +sec.dataset.count, rows = Math.max(1, Math.ceil(n / 3));
    sec.dataset.h = n === 0 ? 700 : 1080 + (rows - 1) * ROW;
    st.insertAdjacentHTML("beforeend",
      `<h2 class="t cat" style="left:${CAT_X[sec.dataset.name]}px" data-s="0.10">${sec.dataset.name}</h2>`);
    if (sec.id === "urban") {
      st.insertAdjacentHTML("beforeend", `<p class="t urban-note" style="left:150px;top:590px" data-s="0.55">Urban projects are in preparation.</p>`);
    }
    const ph = (x, y, w, h, img, d) => st.insertAdjacentHTML("beforeend", `<div class="ph${img ? " img" : ""}" data-d="${d}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>`);
    for (let i = 0; i < n; i++) {
      const x = COLX[i % 3], dy = Math.floor(i / 3) * ROW, d = 0.7 + (i % 3) * 0.12 + Math.floor(i / 3) * 0.2;
      ph(x, 349 + dy, CARD_W, CARD_H, true, d);
      const p = (PROJECTS[sec.id] || [])[i];
      if (p) {
        // the grey block stays until the cover file exists
        st.lastElementChild.innerHTML = `<img src="assets/covers/${p.id}.jpg" alt="" loading="lazy" onerror="this.remove()">`;
        st.insertAdjacentHTML("beforeend", `<h3 class="t ctitle" style="left:${x}px;top:${738 + dy}px" data-s="${d + 0.1}">${p.title}</h3>`);
        const to = p.pdf ? `href="projects/${p.id}/${p.id}.pdf" target="_blank" rel="noopener"` : `href="projects/${p.id}/"`;
        st.insertAdjacentHTML("beforeend", `<a class="hit" ${to} aria-label="${p.title}" style="left:${x}px;top:${349 + dy}px;width:${CARD_W}px;height:540px"></a>`);
      } else ph(x, 790.8 + dy, 308.8, 52.7, false, d + 0.1);
      if (p && p.text) {
        p.text.forEach((line, k) => st.insertAdjacentHTML("beforeend", `<p class="t cbody" style="left:${x}px;top:${794 + k * 33 + dy}px" data-s="${d + 0.14 + k * 0.04}">${line}</p>`));
      } else {
        ph(x, 852.4 + dy, 506.7, 26.1, false, d + 0.14);
        ph(x, 887.4 + dy, 506.7, 26.1, false, d + 0.18);
        ph(x, 922.6 + dy, 430.4, 26.2, false, d + 0.22);
      }
    }
  }

  // ---------------- decode text: each character arrives as noise and settles, in reading order
  const LATIN = "!#$%&*+-/0123456789<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const HAN = "以時代之法應問城市空間設計數據模型算法結構形式方法問題";
  function splitText(el) {
    // measure each character's advance in the laid-out line (kerning kept), then fix span widths to it
    const nodes = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) if (walker.currentNode.textContent.length) nodes.push(walker.currentNode);
    const cells = [];
    for (const node of nodes) {
      const txt = node.textContent, xs = [], r = document.createRange();
      for (let i = 0; i < txt.length; i++) { r.setStart(node, i); r.setEnd(node, i + 1); const b = r.getBoundingClientRect(); xs.push([b.left, b.right]); }
      const frag = document.createDocumentFragment();
      [...txt].forEach((ch, i) => {
        const w = (i + 1 < xs.length ? xs[i + 1][0] - xs[i][0] : xs[i][1] - xs[i][0]) / S;
        const s = document.createElement("span"); s.className = "c"; s.dataset.ch = ch; s.style.width = Math.max(0, w) + "px";
        s.textContent = ch === " " ? " " : ch;
        frag.appendChild(s); cells.push({ s, ch, han: /[㐀-鿿]/.test(ch), last: "" });
      });
      node.replaceWith(frag);
    }
    return cells;
  }
  function prepSection(sec) {
    const items = [];
    for (const el of sec.querySelectorAll(".t[data-s]")) {
      const cells = splitText(el), start = parseFloat(el.dataset.s);
      cells.forEach((c, i) => { const step = c.han ? 0.06 : 0.016; c.on = start + i * step; c.off = c.on + 0.22 + Math.random() * 0.28; c.s.textContent = " "; });
      items.push(...cells);
    }
    const end = items.reduce((m, c) => Math.max(m, c.off), 0);
    return { items, end };
  }
  function textFrame(items, t) {
    for (const c of items) {
      let v;
      if (c.ch === " ") v = " ";
      else if (t < c.on) v = " ";
      else if (t < c.off) v = (c.han ? HAN : LATIN)[Math.floor(Math.random() * (c.han ? HAN.length : LATIN.length))];
      else v = c.ch;
      if (v !== c.last) { c.s.textContent = v; c.last = v; }
    }
  }

  // ---------------- per-sheet timelines (seconds from the moment the sheet comes into view)
  const PORTRAIT_DELAY = 1.35;
  const live = new Map();     // id -> state
  let portraitT0 = null, portraitVisible = true;
  function start(sec) {
    if (live.has(sec.id)) return;
    const st = { sec, t0: performance.now(), ...prepSection(sec), done: false, phs: [...sec.querySelectorAll(".ph")] };
    st.rule = sec.querySelector(".rule");
    st.end = Math.max(st.end, ...st.phs.map(p => +p.dataset.d),
      st.rule ? 0.9 : 0, sec.id === "s1" ? PORTRAIT_DELAY : 0);
    live.set(sec.id, st);
    for (const a of sec.querySelectorAll(".hit")) hoverDecode(a, () => st.done, a.previousElementSibling);   // the card is the link, its title sits just before it
    if (reduce) { textFrame(st.items, 1e9); st.phs.forEach(p => p.classList.add("on")); finishRule(sec); st.done = true;
      if (sec.id === "s1" && Portrait.ready) { portraitT0 = performance.now() - 1e6; Portrait.draw(0, 0); } return; }
    kick();
  }
  function finishRule(sec) { const r = sec.querySelector(".rule"); if (r) r.style.transform = "scaleX(1)"; }
  let raf = 0;
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }
  function loop(now) {
    raf = 0; let more = false;
    for (const [id, st] of live) {
      if (st.done) continue;
      const t = (now - st.t0) / 1000;
      textFrame(st.items, t);
      for (const p of st.phs) if (t >= +p.dataset.d) p.classList.add("on");
      const r = st.rule;
      if (r) { const q = Math.max(0, Math.min(1, (t - 0.3) / 0.6)); r.style.transform = `scaleX(${1 - Math.pow(1 - q, 3)})`; }
      if (id === "s1" && portraitT0 === null && t >= PORTRAIT_DELAY && Portrait.ready) { Portrait.prepLanes(); portraitT0 = now; }
      if (t >= st.end) st.done = true; else more = true;
    }
    if (portraitT0 !== null && portraitVisible) {
      const pt = (now - portraitT0) / 1000;
      if (pt < Portrait.DUR) Portrait.draw(pt, null); else Portrait.draw(0, pt - Portrait.DUR);
      more = true;
    }
    if (more) kick();
  }

  // ---------------- layout: scale every sheet to the window width
  function fit() {
    S = document.documentElement.clientWidth / 1920;
    document.documentElement.style.setProperty("--s", S);
    for (const sec of document.querySelectorAll(".sec")) {
      const h = +sec.dataset.h; sec.style.height = h * S + "px";
      const st = sec.querySelector(".stage"); st.style.height = h + "px"; st.style.transform = `scale(${S})`;
    }
    document.querySelector("#bar .inner").style.transform = `scale(${S})`;
  }
  fit();

  // ---------------- put every text baseline exactly on its Illustrator y (CSS line boxes centre the glyphs instead)
  function alignBaselines() {
    for (const el of document.querySelectorAll(".stage > .t, #bar .nav, #bar .brand")) {
      const box = el.parentElement.getBoundingClientRect();
      const want = el.dataset.base ? +el.dataset.base : (el.dataset.base = parseFloat(getComputedStyle(el).top));
      const probe = document.createElement("span");
      probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
      el.prepend(probe);
      const y = (probe.getBoundingClientRect().bottom - box.top) / S;
      probe.remove();
      el.style.top = (parseFloat(getComputedStyle(el).top) + (want - y)) + "px";
    }
  }

  // ---------------- bar links: hovering or focusing a link re-decodes it, left to right
  function hoverDecode(a, ready = () => true, text = a) {
    const cells = [...text.querySelectorAll("span.c")].map(s => ({ s, ch: s.dataset.ch, last: s.textContent }));
    let t0 = 0, id = 0;
    const tick = now => {
      const t = (now - t0) / 1000; let busy = false;
      cells.forEach((c, i) => {
        if (c.ch === " ") return;
        const off = 0.05 + i * 0.035 + c.jit;
        const v = t < off ? LATIN[Math.floor(Math.random() * LATIN.length)] : c.ch;
        if (t < off) busy = true;
        if (v !== c.last) { c.s.textContent = v; c.last = v; }
      });
      id = busy ? requestAnimationFrame(tick) : 0;
    };
    const run = () => {
      if (reduce || !ready()) return;
      cells.forEach(c => { c.jit = Math.random() * 0.08; c.last = c.s.textContent; });
      t0 = performance.now(); if (!id) id = requestAnimationFrame(tick);
    };
    a.addEventListener("pointerenter", run);
    a.addEventListener("focus", run);
  }
  function setupBarHover() {
    for (const a of document.querySelectorAll("#bar a")) {
      splitText(a).forEach(c => { c.s.textContent = c.ch === " " ? " " : c.ch; });
      hoverDecode(a);
    }
  }

  // ---------------- start each sheet when it is well inside the view
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.target.id === "s1") { portraitVisible = e.isIntersecting; if (e.isIntersecting) kick(); }
    if (e.isIntersecting && e.intersectionRatio >= 0.3) start(e.target);
  }), { threshold: [0, 0.3] });

  // resizing clears the canvas: the running loop redraws it next frame; before the opening it stays empty
  addEventListener("resize", () => { fit(); if (Portrait.ready) { Portrait.size(S); if (reduce) Portrait.draw(0, 0); } });

  Portrait.load("assets/portrait-map.png").then(async raw => {
    try { await Promise.all([document.fonts.load("italic 700 200px Tinos"), document.fonts.load("700 40px Tinos"), document.fonts.load("italic 22px Tinos"), document.fonts.load("22px Tinos"), document.fonts.load('300 36px "Noto Serif TC"', "以時代之法應問")]); } catch (e) {}
    fit();
    Portrait.build(raw, getComputedStyle(document.body).getPropertyValue("--serif"));
    Portrait.size(S);
    alignBaselines();
    setupBarHover();
    // a link from a project page lands on its sheet: the browser's own jump ran before the sheets had their height
    const target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({ behavior: "instant" });
    document.querySelectorAll(".sec").forEach(s => io.observe(s));
  });
})();

/* Walking Again — bike-to-walker configurator.
   Rules are taken from the Scheme B parametric model (x forward, z up, mm; bottom bracket at x 0, z 270).
   This is a design demonstration, not a structural certificate. */
(function () {
  var form = document.getElementById('inp'), svg = document.getElementById('svg'), out = document.getElementById('out');
  document.getElementById('loading').style.display = 'none';
  var DEF = {}; Array.prototype.forEach.call(form.querySelectorAll('input[type=number]'), function (el) { DEF[el.name] = el.value; });

  var BBZ = 270, TRACK_F = 250, TRAIL = 45, FRONT_AX = 176, OUT_L = 241, SEAT_Z = 520, BOARD_T = 18,
      M_WALK = 21.1, G_WALK_Z = 363, M_USER = 100, USER_UP = 250, MIN_INSERT = 80, CLAMP_OFF = 31.4;
  var R = function (v) { return Math.round(v); }, deg = Math.PI / 180;

  function read() {
    var p = {}; Array.prototype.forEach.call(form.querySelectorAll('input[type=number]'), function (el) { p[el.name] = parseFloat(el.value); });
    p.type = form.querySelector('input[name=type]:checked').value; return p;
  }

  function compute(p) {
    var g = {}, chk = [], a = p.ang * deg, U = [Math.cos(a), Math.sin(a)];
    function add(level, text) { chk.push([level, text]); }
    var rng = [['cs', 380, 480, 'Chainstay'], ['drop', -20, 80, 'Axle height above BB'], ['st', 300, 520, 'Seat tube'], ['ang', 64, 76, 'Seat-tube angle'],
               ['old', 40, 140, 'Dropout gap'], ['bbd', 30, 42, 'BB bore'], ['bbw', 60, 100, 'BB width'], ['spd', 25, 35, 'Seat post'], ['wrist', 650, 1000, 'Wrist height']];
    var bad = false;
    rng.forEach(function (r) { var v = p[r[0]]; if (!(v >= r[1] && v <= r[2])) { add('bad', r[3] + ' ' + (isNaN(v) ? '—' : v) + ' is outside the range the model covers (' + r[1] + '–' + r[2] + ').'); bad = true; } });
    g.DX = Math.sqrt(Math.max(1, p.cs * p.cs - p.drop * p.drop)); g.DZ = BBZ + p.drop;
    g.top = [p.st * U[0], BBZ + p.st * U[1]]; g.J = [(p.st - 19) * U[0], BBZ + (p.st - 19) * U[1]]; g.U = U;   // J：后上叉与立管交点，按哈啰模型座板处后上叉高度标定
    g.fa = g.DX + FRONT_AX; g.fc = g.fa - TRAIL;
    g.x0 = g.DX - 189; g.x1 = g.DX + 51;
    g.colX = g.DX - CLAMP_OFF; g.colL = 524.25 - g.DZ;
    g.zo = g.DZ - CLAMP_OFF; g.spacer = g.DZ - 294.25;
    g.YR = Math.max(300, Math.ceil((p.bw / 2 - 35 + 3) / 10) * 10);
    g.rearL = 2 * g.YR + 40; g.frontL = 265 - (p.old / 2 + 13); g.studL = p.old + 46;
    g.bushWall = (p.bbd - 25.4) / 2; g.bushL = p.bbw / 2 - 4;
    // 后上叉在座板下方的垫块
    function zss(x) { var t = (x - g.J[0]) / (g.DX - g.J[0]); return g.J[1] + (g.DZ - g.J[1]) * t; }
    g.pads = [g.x0 + 12, g.x0 + 50].map(function (x) { return { x: x, h: (SEAT_Z - BOARD_T) - (zss(x) + 11) }; });
    // 握把与座管
    g.zbar = p.wrist - p.rise; g.cx = (g.zbar - BBZ) / U[1] * U[0];
    g.grip = [g.cx - 65, p.wrist];
    g.expose = ((g.zbar + 75) - g.top[1]) / U[1]; g.insert = p.spl - g.expose;
    g.zback = g.zbar + 55;
    // 稳定性
    var gw = [0.583 * g.DX, G_WALK_Z], gu = [g.x0 + 110, SEAT_Z + USER_UP], M = M_WALK + M_USER;
    g.Gw = gw; g.Gs = [(M_WALK * gw[0] + M_USER * gu[0]) / M, (M_WALK * gw[1] + M_USER * gu[1]) / M];
    function sideDist(G) { var ax = 0, ay = g.YR, bx = g.fa, by = TRACK_F - TRAIL, tx = bx - ax, ty = by - ay, L = Math.hypot(tx, ty); return Math.abs((G[0] - ax) * ty - (0 - ay) * tx) / L; }
    g.tip = {
      fwd: Math.atan2(g.fc - g.Gs[0], g.Gs[1]) / deg, back: Math.atan2(g.Gs[0], g.Gs[1]) / deg, side: Math.atan2(sideDist(g.Gs), g.Gs[1]) / deg,
      fwdE: Math.atan2(g.fc - gw[0], gw[1]) / deg, backE: Math.atan2(gw[0], gw[1]) / deg, sideE: Math.atan2(sideDist(gw), gw[1]) / deg
    };
    // 检查
    if (p.type === 'other') { add('bad', 'Rear suspension, folding, carbon or small-wheel frames are not covered: the method relies on a rigid, welded rear triangle in steel or aluminium.'); bad = true; }
    if (g.bushWall < 2) { add('bad', 'BB bore ' + p.bbd + ' mm leaves a bushing wall under 2 mm around the Ø25.4 cross-tube; use a Ø22 tube and re-check strength.'); bad = true; }
    g.pads.forEach(function (pd, i) {
      if (pd.h < 3) { add('bad', 'Seatstay reaches the seat board at x = ' + R(pd.x) + ' (clearance ' + R(pd.h) + ' mm). Raise the seat or move it forward.'); bad = true; }
      else if (pd.h > 60) add('warn', 'Seatstay pad ' + (i + 1) + ' would be ' + R(pd.h) + ' mm tall; use a timber block rather than a nylon pad.');
    });
    if (g.zbar - 30 < g.top[1]) { add('bad', 'Grips cannot go this low on this frame. Minimum wrist height: ' + R(g.top[1] + 30 + p.rise) + ' mm.'); bad = true; }
    else if (g.insert < MIN_INSERT) { add('bad', 'Seat post too short: only ' + R(g.insert) + ' mm stays in the frame (' + MIN_INSERT + ' mm needed). Fit a ' + p.spd + ' mm post at least ' + R(g.expose + MIN_INSERT) + ' mm long.'); bad = true; }
    else add('ok', 'Seat post: ' + R(g.expose) + ' mm exposed, ' + R(g.insert) + ' mm inserted.');
    if (g.spacer > 3) add('warn', 'Front sits ' + R(g.spacer) + ' mm higher than the rear: add ' + R(g.spacer) + ' mm spacer plates under the front casters.');
    else if (g.spacer < -3) add('warn', 'Front sits ' + R(-g.spacer) + ' mm lower than the rear: add ' + R(-g.spacer) + ' mm spacer plates under the rear casters.');
    else add('ok', 'Front and rear sit level.');
    if (g.grip[0] < 0) add('warn', 'Handgrips fall ' + R(-g.grip[0]) + ' mm behind the rear wheels; leaning back on them can tip the walker.');
    if (g.tip.fwd < 15) add('warn', 'Seated forward tipping angle ' + g.tip.fwd.toFixed(1) + '° is low; lengthen the outriggers or move the seat back.');
    else add('ok', 'Seated tipping angles: forward ' + g.tip.fwd.toFixed(1) + '°, backward ' + g.tip.back.toFixed(1) + '°, sideways ' + g.tip.side.toFixed(1) + '°.');
    g.chk = chk; g.bad = bad; return g;
  }

  // --------------------------------------------------------------- 绘图
  var k = 0.66, ox = 175, oy = 700;
  function X(x) { return ox + x * k; } function Z(z) { return oy - z * k; }
  function P(x, z) { return X(x).toFixed(1) + ',' + Z(z).toFixed(1); }
  var INK = '#1E1E1E', ACC = '#2C78B4', G2 = '#8C8C8C', ACCL = '#CFE1F0';

  function draw(p, g) {
    var s = [];
    s.push('<defs><marker id="m" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" fill="' + INK + '"/></marker></defs>');
    s.push('<line x1="' + X(-200) + '" y1="' + Z(0) + '" x2="' + X(1050) + '" y2="' + Z(0) + '" stroke="' + INK + '" stroke-width="1"/>');
    for (var hx = -190; hx < 1050; hx += 30) s.push('<line x1="' + X(hx) + '" y1="' + Z(0) + '" x2="' + (X(hx) - 7) + '" y2="' + (Z(0) + 7) + '" stroke="' + G2 + '" stroke-width="0.6"/>');
    function wheel(cx, fork) {
      s.push('<circle cx="' + X(cx) + '" cy="' + Z(100) + '" r="' + 100 * k + '" fill="#fff" stroke="' + INK + '" stroke-width="1.2"/>');
      s.push('<circle cx="' + X(cx) + '" cy="' + Z(100) + '" r="' + 62 * k + '" fill="none" stroke="' + INK + '" stroke-width="0.6"/>');
      s.push('<circle cx="' + X(cx) + '" cy="' + Z(100) + '" r="3" fill="' + INK + '"/>');
      s.push('<path d="M' + P(fork - 40, 227) + ' L' + P(fork + 40, 227) + ' L' + P(cx + 14, 100) + ' L' + P(cx - 14, 100) + ' Z" fill="#fff" stroke="' + INK + '" stroke-width="1"/>');
      s.push('<rect x="' + X(fork - 50) + '" y="' + Z(238) + '" width="' + 100 * k + '" height="' + 11 * k + '" fill="#fff" stroke="' + INK + '" stroke-width="1"/>');
    }
    wheel(0, 0); wheel(g.fc, g.fa);
    if (g.spacer > 3) s.push('<rect x="' + X(g.fa - 50) + '" y="' + Z(238 + g.spacer) + '" width="' + 100 * k + '" height="' + g.spacer * k + '" fill="' + ACCL + '" stroke="' + INK + '" stroke-width="0.8"/>');
    // 新增钢管
    s.push('<line x1="' + X(g.DX - 30) + '" y1="' + Z(g.zo) + '" x2="' + X(g.DX + 211) + '" y2="' + Z(g.zo) + '" stroke="' + INK + '" stroke-width="' + 25.4 * k + '" stroke-linecap="butt" opacity="0.12"/>');
    s.push('<line x1="' + X(g.DX - 30) + '" y1="' + Z(g.zo) + '" x2="' + X(g.DX + 211) + '" y2="' + Z(g.zo) + '" stroke="' + INK + '" stroke-width="1.6"/>');
    s.push('<line x1="' + X(g.colX) + '" y1="' + Z(g.DZ - 30) + '" x2="' + X(g.colX) + '" y2="' + Z(SEAT_Z - BOARD_T) + '" stroke="' + INK + '" stroke-width="' + 25.4 * k + '" opacity="0.12"/>');
    s.push('<line x1="' + X(g.colX) + '" y1="' + Z(g.DZ - 30) + '" x2="' + X(g.colX) + '" y2="' + Z(SEAT_Z - BOARD_T) + '" stroke="' + INK + '" stroke-width="1.6"/>');
    s.push('<rect x="' + X(g.x0) + '" y="' + Z(SEAT_Z) + '" width="' + 240 * k + '" height="' + BOARD_T * k + '" fill="#fff" stroke="' + INK + '" stroke-width="1.2"/>');
    g.pads.forEach(function (pd) { if (pd.h > 0) s.push('<rect x="' + X(pd.x - 10) + '" y="' + Z(SEAT_Z - BOARD_T) + '" width="' + 20 * k + '" height="' + pd.h * k + '" fill="' + INK + '" opacity="0.55"/>'); });
    s.push('<circle cx="' + X(0) + '" cy="' + Z(BBZ) + '" r="' + 12.7 * k + '" fill="#fff" stroke="' + INK + '" stroke-width="1.4"/>');
    s.push('<circle cx="' + X(g.DX) + '" cy="' + Z(g.DZ) + '" r="' + 12.7 * k + '" fill="#fff" stroke="' + INK + '" stroke-width="1.4"/>');
    // 原车件（蓝）
    var fw = 'stroke="' + ACC + '" stroke-linecap="round" fill="none"';
    s.push('<line x1="' + X(0) + '" y1="' + Z(BBZ) + '" x2="' + X(g.DX) + '" y2="' + Z(g.DZ) + '" ' + fw + ' stroke-width="' + 18 * k + '" opacity="0.35"/>');
    s.push('<line x1="' + X(g.J[0]) + '" y1="' + Z(g.J[1]) + '" x2="' + X(g.DX) + '" y2="' + Z(g.DZ) + '" ' + fw + ' stroke-width="' + 16 * k + '" opacity="0.35"/>');
    s.push('<line x1="' + X(0) + '" y1="' + Z(BBZ) + '" x2="' + X(g.top[0]) + '" y2="' + Z(g.top[1]) + '" ' + fw + ' stroke-width="' + 34 * k + '" opacity="0.35"/>');
    [[0, BBZ, g.DX, g.DZ], [g.J[0], g.J[1], g.DX, g.DZ], [0, BBZ, g.top[0], g.top[1]]].forEach(function (l) { s.push('<line x1="' + X(l[0]) + '" y1="' + Z(l[1]) + '" x2="' + X(l[2]) + '" y2="' + Z(l[3]) + '" ' + fw + ' stroke-width="1.6"/>'); });
    var st1 = [-0.70 * 55, BBZ + 0.71 * 55]; s.push('<line x1="' + X(0) + '" y1="' + Z(BBZ) + '" x2="' + X(st1[0]) + '" y2="' + Z(st1[1]) + '" ' + fw + ' stroke-width="' + 30 * k + '" opacity="0.35"/>');
    s.push('<line x1="' + (X(st1[0]) - 9) + '" y1="' + (Z(st1[1]) - 9) + '" x2="' + (X(st1[0]) + 9) + '" y2="' + (Z(st1[1]) + 9) + '" stroke="' + INK + '" stroke-width="1.4" stroke-dasharray="3 2"/>');
    if (p.type === 'diamond') { var tt = [g.top[0] - 30, g.top[1] - 40]; s.push('<line x1="' + X(g.top[0] - 4) + '" y1="' + Z(g.top[1] - 40) + '" x2="' + X(tt[0]) + '" y2="' + Z(tt[1]) + '" ' + fw + ' stroke-width="' + 28 * k + '" opacity="0.35"/>'); }
    s.push('<circle cx="' + X(0) + '" cy="' + Z(BBZ) + '" r="' + 19 * k + '" fill="none" stroke="' + ACC + '" stroke-width="1.6"/>');
    // 座管、车把、靠背
    var spEnd = [g.top[0] + g.U[0] * g.expose, g.top[1] + g.U[1] * g.expose];
    s.push('<line x1="' + X(g.top[0]) + '" y1="' + Z(g.top[1]) + '" x2="' + X(spEnd[0]) + '" y2="' + Z(spEnd[1]) + '" ' + fw + ' stroke-width="' + 32 * k + '" opacity="0.35"/>');
    s.push('<line x1="' + X(g.top[0]) + '" y1="' + Z(g.top[1]) + '" x2="' + X(spEnd[0]) + '" y2="' + Z(spEnd[1]) + '" ' + fw + ' stroke-width="1.4"/>');
    var c = [g.cx, g.zbar];
    s.push('<rect x="' + (X(c[0]) - 9) + '" y="' + (Z(c[1]) - 9) + '" width="18" height="18" fill="#fff" stroke="' + INK + '" stroke-width="1.2"/>');
    s.push('<path d="M' + P(c[0] - 6, c[1]) + ' C' + P(c[0] - 30, c[1] + 40) + ' ' + P(g.grip[0] - 10, g.grip[1] - 80) + ' ' + P(g.grip[0], g.grip[1]) + '" stroke="' + ACC + '" stroke-width="' + 22 * k + '" fill="none" opacity="0.35" stroke-linecap="round"/>');
    s.push('<path d="M' + P(c[0] - 6, c[1]) + ' C' + P(c[0] - 30, c[1] + 40) + ' ' + P(g.grip[0] - 10, g.grip[1] - 80) + ' ' + P(g.grip[0], g.grip[1]) + '" stroke="' + ACC + '" stroke-width="1.4" fill="none"/>');
    s.push('<circle cx="' + X(g.grip[0]) + '" cy="' + Z(g.grip[1]) + '" r="' + 16 * k + '" fill="' + ACCL + '" stroke="' + ACC + '" stroke-width="1.4"/>');
    var bk = [g.cx + (g.zback - g.zbar) / g.U[1] * g.U[0] + 75, g.zback + 70];
    s.push('<g transform="translate(' + X(bk[0]) + ',' + Z(bk[1]) + ') rotate(' + (90 - p.ang - 4) + ')"><rect x="' + (-26 * k) + '" y="' + (-120 * k) + '" width="' + 52 * k + '" height="' + 240 * k + '" rx="' + 24 * k + '" fill="' + ACCL + '" stroke="' + ACC + '" stroke-width="1.4"/></g>');
    // 重心与翻倾线
    function cg(G, col) { var x = X(G[0]), y = Z(G[1]), r = 8; s.push('<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff" stroke="' + col + '" stroke-width="1.4"/><path d="M' + x + ',' + y + ' L' + (x + r) + ',' + y + ' A' + r + ',' + r + ' 0 0 0 ' + x + ',' + (y - r) + ' Z M' + x + ',' + y + ' L' + (x - r) + ',' + y + ' A' + r + ',' + r + ' 0 0 0 ' + x + ',' + (y + r) + ' Z" fill="' + col + '"/>'); }
    s.push('<line x1="' + X(g.Gs[0]) + '" y1="' + Z(g.Gs[1]) + '" x2="' + X(g.fc) + '" y2="' + Z(0) + '" stroke="' + ACC + '" stroke-width="1" stroke-dasharray="5 4"/>');
    s.push('<line x1="' + X(g.Gs[0]) + '" y1="' + Z(g.Gs[1]) + '" x2="' + X(g.Gs[0]) + '" y2="' + Z(0) + '" stroke="' + ACC + '" stroke-width="0.8" stroke-dasharray="2 3"/>');
    cg(g.Gw, INK); cg(g.Gs, ACC);
    s.push('<text x="' + (X(g.Gs[0]) + 14) + '" y="' + (Z(g.Gs[1]) - 6) + '" font-size="15" fill="' + ACC + '">Seated CG · forward ' + g.tip.fwd.toFixed(1) + '°</text>');
    s.push('<text x="' + (X(g.Gw[0]) + 12) + '" y="' + (Z(g.Gw[1]) + 18) + '" font-size="14" fill="' + INK + '">Empty CG</text>');
    // 尺寸字母
    function lab(x, z, t, dx, dy) { s.push('<text x="' + (X(x) + (dx || 0)) + '" y="' + (Z(z) + (dy || 0)) + '" font-size="16" font-weight="bold" fill="' + ACC + '" text-anchor="middle">' + t + '</text>'); }
    lab(g.DX * 0.5, BBZ + (g.DZ - BBZ) * 0.5, 'A', 0, 22);
    s.push('<line x1="' + (X(g.DX) + 22) + '" y1="' + Z(BBZ) + '" x2="' + (X(g.DX) + 22) + '" y2="' + Z(g.DZ) + '" stroke="' + INK + '" stroke-width="0.7"/>'); lab(g.DX, (BBZ + g.DZ) / 2, 'B', 36, 5);
    lab(g.top[0] * 0.55, BBZ + (g.top[1] - BBZ) * 0.55, 'C', -20, 0);
    var r0 = 70 * k; s.push('<path d="M' + (X(0) + r0) + ',' + Z(BBZ) + ' A' + r0 + ',' + r0 + ' 0 0 0 ' + (X(0) + r0 * g.U[0]) + ',' + (Z(BBZ) - r0 * g.U[1]) + '" fill="none" stroke="' + INK + '" stroke-width="0.7"/>'); lab(50, BBZ + 22, 'D', 14, 0);
    lab(g.DX, g.DZ, 'E', 0, -16); lab(0, BBZ, 'F', -24, 22); lab(g.top[0] + g.U[0] * 60, g.top[1] + g.U[1] * 60, 'G', -20, 0); lab(g.grip[0], g.grip[1], 'H', -22, -12);
    // 尺寸线
    function dimV(x, z0, z1, t) { s.push('<line x1="' + X(x) + '" y1="' + Z(z0) + '" x2="' + X(x) + '" y2="' + Z(z1) + '" stroke="' + INK + '" stroke-width="0.8" marker-start="url(#m)" marker-end="url(#m)"/><text x="' + (X(x) - 8) + '" y="' + ((Z(z0) + Z(z1)) / 2) + '" font-size="15" text-anchor="middle" transform="rotate(-90 ' + (X(x) - 8) + ',' + ((Z(z0) + Z(z1)) / 2) + ')" fill="' + INK + '">' + t + '</text>'); }
    dimV(-150, 0, g.grip[1], 'W  Grip ' + R(g.grip[1]));
    s.push('<line x1="' + X(-150) + '" y1="' + Z(g.grip[1]) + '" x2="' + (X(g.grip[0]) - 12) + '" y2="' + Z(g.grip[1]) + '" stroke="' + G2 + '" stroke-width="0.6"/>');
    dimV(g.x1 + 260, 0, SEAT_Z, 'Seat 520');
    s.push('<line x1="' + X(g.x1) + '" y1="' + Z(SEAT_Z) + '" x2="' + (X(g.x1 + 260) + 4) + '" y2="' + Z(SEAT_Z) + '" stroke="' + G2 + '" stroke-width="0.6"/>');
    var yb = Z(0) + 34; s.push('<line x1="' + X(0) + '" y1="' + yb + '" x2="' + X(g.fc) + '" y2="' + yb + '" stroke="' + INK + '" stroke-width="0.8" marker-start="url(#m)" marker-end="url(#m)"/><rect x="' + (X(g.fc / 2) - 66) + '" y="' + (yb - 11) + '" width="132" height="20" fill="#fff"/><text x="' + X(g.fc / 2) + '" y="' + (yb + 5) + '" font-size="15" text-anchor="middle">Wheelbase ' + R(g.fc) + '</text>');
    svg.innerHTML = s.join('');
  }

  function table(rows) {
    return '<table class="t"><tr><th>Item</th><th>Size</th><th class="r">Qty</th></tr>' + rows.map(function (r) { return '<tr><td class="k">' + r[0] + '</td><td>' + r[1] + '</td><td class="r">' + r[2] + '</td></tr>'; }).join('') + '</table>';
  }
  function list(g, p) {
    var h = [];
    if (p.type === 'other') {
      h.push('<h3>Result</h3><ul class="chk">' + g.chk.map(function (c) { return '<li class="' + c[0] + '"><i>' + (c[0] === 'ok' ? '✓' : c[0] === 'warn' ? '!' : '×') + '</i><span>' + c[1] + '</span></li>'; }).join('') + '</ul>');
      return h.join('');
    }
    var cuts = p.type === 'diamond' ? 'Two cuts: down tube 55 mm from the BB shell; top tube 30 mm from the seat tube.' : 'One cut: main tube 55 mm from the BB shell.';
    h.push('<h3>Strip and cut</h3><p class="body" style="margin-top:0">Remove wheels, fork, cranks, chain and mudguards. ' + cuts + ' Keep the rear triangle, seat post, quick release, handlebar with levers and cables, saddle and basket.</p>');
    h.push('<h3>Cut list, steel tube</h3>' + table([
      ['Rear cross-tube', 'Ø25.4 × 2.5 × ' + R(g.rearL), 1],
      ['Front cross-tube + threaded plug', 'Ø25.4 × 2.5 × ' + R(g.frontL), 2],
      ['Front outrigger', 'Ø25.4 × 2 × ' + OUT_L, 2],
      ['Seat column', 'Ø25.4 × 2 × ' + R(g.colL), 2],
      ['Front axle stud, 8.8', 'M10 × ' + R(g.studL), 1],
      ['Axle spacer', 'Ø20 × 3 × ' + R(p.old), 1]]));
    h.push('<h3>Other parts</h3>' + table([
      ['BB bushing, nylon', 'Ø' + p.bbd + ' / Ø25.4 × ' + R(g.bushL), 2],
      ['Seat board, plywood', '240 × 380 × 18', 1],
      ['Seatstay pads, trim to fit', '≈ ' + R(Math.max(0, g.pads[0].h)) + ' and ' + R(Math.max(0, g.pads[1].h)) + ' mm', '2 + 2'],
      ['Clamps: flange Ø25.4 · cross Ø25.4 × Ø25.4', '', '4 · 4'],
      ['Handlebar cross clamp · backrest collar', 'Ø' + p.spd + ' × Ø25.4 · Ø' + p.spd, '1 · 1'],
      ['Casters Ø200 PU: fixed with brake · swivel', '', '2 · 2']]));
    h.push('<h3>Checks</h3><ul class="chk">' + g.chk.map(function (c) { return '<li class="' + c[0] + '"><i>' + (c[0] === 'ok' ? '✓' : c[0] === 'warn' ? '!' : '×') + '</i><span>' + c[1] + '</span></li>'; }).join('') + '</ul>');
    h.push('<p class="note">Geometry follows the Scheme B model; stability assumes a 100 kg user seated 250 mm above the board and a ' + M_WALK + ' kg walker. Minimum seat-post insertion is taken as ' + MIN_INSERT + ' mm. A design demonstration, not a structural certificate.</p>');
    return h.join('');
  }
  function run() { var p = read(), g = compute(p); draw(p, g); out.innerHTML = list(g, p); }
  form.addEventListener('input', run); form.addEventListener('change', run);
  document.getElementById('reset').addEventListener('click', function () {
    Object.keys(DEF).forEach(function (n) { form.querySelector('input[name=' + n + ']').value = DEF[n]; });
    form.querySelector('input[value=step]').checked = true; run();
  });
  run();
})();

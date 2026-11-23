// The study at 221B, built entirely in code (no model files): every clickable object opens one part of the portfolio.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PERSON, CLUES } from './data.js?v=6';

const $ = (id) => document.getElementById(id);
const canvas = $('room');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch (e) { renderer = null; }
const ORDER = ['violin', 'shelf', 'board', 'laptop', 'frame', 'skull', 'newspaper', 'window'];

// ---------------------------------------------------------------- UI: intro, panel, index, lock
const lines = ['You have come about a case.'];
(function typeIntro() {
  const el = $('typed'); let li = 0, ci = 0, out = '';
  const strip = (s) => s.replace(/<[^>]+>/g, '');
  (function step() {
    if (li >= lines.length) return;
    const plain = strip(lines[li]);
    if (ci <= plain.length) { el.innerHTML = out + plain.slice(0, ci) + '<span class="cur">▌</span>'; ci++; setTimeout(step, 28); }
    else { out += lines[li] + '\n'; li++; ci = 0; el.innerHTML = out; setTimeout(step, 380); }
  })();
})();
let unlocked = false;
try { unlocked = sessionStorage.getItem('sher') === '1'; } catch (e) {}
const panel = $('panel'); let current = null;
function openClue(key) {
  const c = CLUES[key]; if (!c) return;
  if (c.locked && !unlocked) { showLock(key); return; }
  chime(); current = key; $('panelKicker').textContent = `CLUE ${String(ORDER.indexOf(key) + 1).padStart(2, '0')} / ${ORDER.length}`;
  $('panelTitle').textContent = c.title; $('panelBody').innerHTML = c.html;
  panel.hidden = false; document.body.classList.add('reading'); requestAnimationFrame(() => panel.classList.add('open')); $('closeBtn').focus({ preventScroll: true });
  focusOn(key);
}
function closeClue() { document.body.classList.remove('reading'); panel.classList.remove('open'); setTimeout(() => { panel.hidden = true; }, 450); current = null; focusOn(null); }
$('closeBtn').onclick = closeClue;
addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!$('lock').hidden) $('lock').hidden = true; else closeClue(); } });
const idx = $('indexList');
ORDER.forEach((k) => { const li = document.createElement('li'); const b = document.createElement('button'); b.textContent = CLUES[k].title; b.onclick = () => { toggleIndex(false); openClue(k); }; li.append(b); idx.append(li); });
function toggleIndex(v) { const n = $('index'); const show = v ?? n.hidden; n.hidden = !show; $('listBtn').setAttribute('aria-expanded', String(show)); }
$('listBtn').onclick = () => toggleIndex();
$('palaceBtn').onclick = () => { palaceOn = !palaceOn; $('palaceBtn').setAttribute('aria-pressed', String(palaceOn)); $('palaceBtn').textContent = palaceOn ? 'Hide mind palace' : 'Show mind palace'; }; $('fallback').onclick = () => toggleIndex(true);
$('enter').onclick = () => { $('intro').classList.add('gone'); started = true; document.body.classList.add('entered'); audio(); door(); startMusic(); };
$('soundBtn').onclick = () => { setMusic(!musicOn); if (musicOn) startMusic(); };
let pendingLock = null;
function showLock(key) { pendingLock = key; $('lock').hidden = false; $('pass').value = ''; $('slots').textContent = '_ _ _ _'; $('lockMsg').textContent = 'Enter the 4-letter passphrase.'; setTimeout(() => $('pass').focus(), 50); }
$('pass').addEventListener('input', (e) => { const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); e.target.value = v; $('slots').textContent = (v + '____').slice(0, 4).split('').join(' '); });
$('lockForm').onsubmit = (e) => {
  e.preventDefault();
  if ($('pass').value.toUpperCase() === 'SHER') { unlocked = true; try { sessionStorage.setItem('sher', '1'); } catch (_) {} $('lockMsg').textContent = 'Access granted.'; setTimeout(() => { $('lock').hidden = true; openClue(pendingLock); }, 600); }
  else { $('lockMsg').textContent = 'Wrong. Think, think.'; $('pass').select(); }
};
$('lock').addEventListener('click', (e) => { if (e.target.id === 'lock') $('lock').hidden = true; });

if (!renderer) { $('intro').classList.add('gone'); toggleIndex(true); throw new Error('no WebGL'); }

// ---------------------------------------------------------------- canvas textures
function tex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const rd = (() => { let s = 4242; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();   // a second stream, so the detail pass doesn't reshuffle the older random layout
const V2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y));
const wallpaper = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#1d2e2b'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(160,190,170,0.10)'; g.lineWidth = 3;
  for (const [x, y] of [[64, 64], [192, 192], [192, 64], [64, 192]]) {          // damask-ish medallions
    g.beginPath(); g.ellipse(x, y, 30, 44, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(x, y - 44); g.bezierCurveTo(x + 40, y - 10, x - 40, y + 10, x, y + 44); g.stroke();
  }
  for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.08})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
}, [6, 2]);
const planks = tex(512, 512, (g, w, h) => {
  for (let r = 0; r < 8; r++) {
    const y = r * 64; g.fillStyle = `hsl(25, 38%, ${16 + rnd() * 7}%)`; g.fillRect(0, y, w, 64);
    for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(0,0,0,${0.05 + rnd() * 0.08})`; g.beginPath(); const yy = y + rnd() * 64; g.moveTo(0, yy); g.bezierCurveTo(w / 3, yy + rnd() * 6, w * 2 / 3, yy - rnd() * 6, w, yy); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, y, w, 2); g.fillRect((r * 157) % w, y, 2, 64);
  }
}, [3, 3]);
const rugTex = tex(512, 340, (g, w, h) => {
  g.fillStyle = '#5a1d1d'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a15a'; g.lineWidth = 6; g.strokeRect(18, 18, w - 36, h - 36); g.lineWidth = 2; g.strokeRect(34, 34, w - 68, h - 68);
  g.strokeStyle = 'rgba(201,161,90,.6)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(w / 2, h / 2, 40 + i * 26, 22 + i * 16, 0, 0, Math.PI * 2); g.stroke(); }
});
const smileyTex = tex(512, 512, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.strokeStyle = '#f2c91a'; g.fillStyle = '#f2c91a'; g.lineCap = 'round'; g.shadowColor = '#f2c91a'; g.shadowBlur = 6; g.lineWidth = 22;
  g.beginPath(); g.arc(256, 256, 190, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(256, 270, 110, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  g.beginPath(); g.ellipse(195, 205, 18, 34, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(317, 205, 18, 34, 0, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 26; i++) { g.globalAlpha = 0.5; g.fillRect(200 + rnd() * 140, 440 + rnd() * 60, 5, 10 + rnd() * 40); }    // paint drips
  g.globalAlpha = 1; g.shadowBlur = 0;
  for (const [x, y] of [[180, 300], [250, 140], [330, 300], [400, 230], [120, 230], [260, 370]]) { g.fillStyle = '#0b0b0b'; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 2; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 40, y + (rnd() - .5) * 40); g.stroke(); } }
});
const corkPins = [];
const corkTex = tex(768, 512, (g, w, h) => {
  g.fillStyle = '#9b7046'; g.fillRect(0, 0, w, h); for (let i = 0; i < 7000; i++) { g.fillStyle = `rgba(${rnd() > .5 ? '60,35,15' : '210,170,120'},${rnd() * 0.35})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  const pins = corkPins;
  const notes = ['SHADOW FLEET', 'IRAN SOLAR', 'MYANMAR AIR', 'XINJIANG', 'FISHERMEN DATA', 'SHIP TRACKS', 'SEA ASSAULTS'];
  notes.forEach((n, i) => {
    const x = 70 + (i % 4) * 175 + rnd() * 30, y = 60 + Math.floor(i / 4) * 230 + rnd() * 40; pins.push([x + 55, y + 8]);
    g.save(); g.translate(x + 60, y + 70); g.rotate((rnd() - .5) * 0.2); g.fillStyle = i % 3 ? '#efe6d2' : '#dfe8ef'; g.fillRect(-60, -70, 120, 140);
    g.fillStyle = '#333'; g.fillRect(-48, -56, 96, 62); g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(-48, -56, 96, 62);
    g.fillStyle = '#2a2420'; g.font = 'bold 13px monospace'; g.textAlign = 'center'; g.fillText(n, 0, 32); g.fillRect(-40, 44, 80, 3); g.fillRect(-40, 52, 60, 3); g.restore();
  });
  for (const [x, y] of pins) { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(x + 4, y + 5, 8, 0, Math.PI * 2); g.fill(); }   // pin shadows; the pins and string are 3D
});
const nightTex = tex(512, 640, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1424'); gr.addColorStop(1, '#25324a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.6})`; g.fillRect(rnd() * w, rnd() * h * 0.4, 1.5, 1.5); }
  let x = 0; while (x < w) { const bw = 40 + rnd() * 70, bh = 180 + rnd() * 260; g.fillStyle = '#0d0f14'; g.fillRect(x, h - bh, bw, bh);
    for (let yy = h - bh + 12; yy < h - 10; yy += 18) for (let xx = x + 8; xx < x + bw - 8; xx += 14) if (rnd() > 0.62) { g.fillStyle = `rgba(255,${190 + rnd() * 40},${110 + rnd() * 60},${0.5 + rnd() * 0.5})`; g.fillRect(xx, yy, 6, 9); }
    x += bw + 2; }
  g.fillStyle = '#0b0d12'; g.fillRect(250, 150, 26, 330); g.beginPath(); g.moveTo(232, 150); g.lineTo(263, 70); g.lineTo(294, 150); g.fill();      // a clock tower on the skyline
  g.fillStyle = '#f2e6b8'; g.beginPath(); g.arc(263, 190, 12, 0, Math.PI * 2); g.fill();
});
const bookTex = tex(512, 512, (g, w, h) => {
  g.fillStyle = '#2a1c12'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) { let x = 8; const y0 = r * 128; while (x < w - 10) { const bw = 12 + rnd() * 18, bh = 80 + rnd() * 36; g.fillStyle = ['#6b1f1f', '#1f3b5a', '#2f4a2a', '#7a5a22', '#3a2a40', '#555'][Math.floor(rnd() * 6)]; g.fillRect(x, y0 + 124 - bh, bw, bh); g.fillStyle = 'rgba(227,180,90,.6)'; g.fillRect(x + 2, y0 + 124 - bh + 10, bw - 4, 2); x += bw + 1; } g.fillStyle = '#1a110b'; g.fillRect(0, y0 + 122, w, 6); }
});
const paperTex = tex(512, 360, (g, w, h) => {
  g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b1b1b'; g.font = 'bold 40px Georgia'; g.textAlign = 'center'; g.fillText('THE DAILY CLUE', w / 2, 52); g.fillRect(20, 64, w - 40, 3);
  g.font = 'bold 26px Georgia'; g.fillText('OSINT SPEAKER AT SANS SUMMIT', w / 2, 104); g.fillStyle = '#555';
  for (let c = 0; c < 3; c++) for (let l = 0; l < 14; l++) g.fillRect(24 + c * 160, 130 + l * 15, 140 - (l % 4) * 12, 5);
});
const marbleTex = tex(512, 512, (g, w, h) => {
  g.fillStyle = '#3d3934'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${rd() > .5 ? '20,18,16' : '120,112,100'},${rd() * 0.12})`; g.fillRect(rd() * w, rd() * h, 3, 3); }
  for (let i = 0; i < 14; i++) { g.strokeStyle = `rgba(170,160,145,${0.12 + rd() * 0.25})`; g.lineWidth = 0.6 + rd() * 1.8; g.beginPath(); let x = rd() * w, y = 0; g.moveTo(x, y); while (y < h) { x += (rd() - .5) * 60; y += 20 + rd() * 40; g.lineTo(x, y); } g.stroke(); }
});
const brickTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#120c09'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 10; r++) for (let c = -1; c < 5; c++) { const x = c * 64 + (r % 2) * 32, y = r * 26; const l = 14 + rd() * 10; g.fillStyle = `hsl(12, 40%, ${l}%)`; g.fillRect(x + 2, y + 2, 60, 22); }
  const soot = g.createLinearGradient(0, 0, 0, h); soot.addColorStop(0, 'rgba(0,0,0,.9)'); soot.addColorStop(0.6, 'rgba(0,0,0,.45)'); soot.addColorStop(1, 'rgba(0,0,0,.1)'); g.fillStyle = soot; g.fillRect(0, 0, w, h);
}, [2, 1]);
const pleatTex = tex(512, 64, (g, w, h) => { for (let x = 0; x < w; x++) { const v = 0.78 + 0.22 * Math.sin(x / w * Math.PI * 2 * 36); g.fillStyle = `rgb(${Math.round(232 * v)},${Math.round(198 * v)},${Math.round(140 * v)})`; g.fillRect(x, 0, 1, h); } });
const boneTex = tex(512, 256, (g, w, h) => {
  g.fillStyle = '#e3d6b6'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${110 + rd() * 50},${90 + rd() * 30},50,${0.04 + rd() * 0.08})`; g.beginPath(); g.arc(rd() * w, rd() * h, 6 + rd() * 34, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(80,60,35,.6)'; g.lineWidth = 1.4;
  const zig = (x0, y0, x1, y1) => { g.beginPath(); g.moveTo(x0, y0); for (let i = 1; i <= 36; i++) { const t = i / 36; g.lineTo(x0 + (x1 - x0) * t + (rd() - .5) * 7, y0 + (y1 - y0) * t + (rd() - .5) * 7); } g.stroke(); };
  zig(0, 4, 0, h * 0.45); zig(w * 0.5, 4, w * 0.5, h * 0.45); zig(w * 0.25, 4, w * 0.25, h * 0.3); zig(w * 0.75, 4, w * 0.75, h * 0.38);   // sutures
});
const globeTex = tex(512, 256, (g, w, h) => {
  g.fillStyle = '#c9b48a'; g.fillRect(0, 0, w, h);                                                                 // antique paper sea
  g.fillStyle = '#7a5a34';
  for (const [x, y, rx, ry] of [[110, 80, 60, 40], [140, 150, 30, 55], [270, 70, 45, 30], [290, 140, 35, 50], [370, 80, 80, 40], [420, 170, 30, 20], [60, 220, 200, 14]]) { g.beginPath(); g.ellipse(x, y, rx, ry, rd(), 0, 7); g.fill(); for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(x + (rd() - .5) * rx * 1.6, y + (rd() - .5) * ry * 1.6, rx * 0.35, ry * 0.35, 0, 0, 7); g.fill(); } }
  g.strokeStyle = 'rgba(70,45,20,.35)'; g.lineWidth = 1; for (let i = 1; i < 12; i++) { g.beginPath(); g.moveTo(i * w / 12, 0); g.lineTo(i * w / 12, h); g.stroke(); } for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(0, i * h / 6); g.lineTo(w, i * h / 6); g.stroke(); }
});
const certTex = tex(400, 300, (g, w, h) => {
  g.fillStyle = '#f2ead6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a6a3a'; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28);
  g.fillStyle = '#3a2a18'; g.textAlign = 'center'; g.font = 'italic 22px Georgia'; g.fillText('Master of Arts', w / 2, 92); g.font = 'bold 17px Georgia'; g.fillText('International Relations,', w / 2, 140); g.fillText('Security & Strategy', w / 2, 164);
  g.font = '14px Georgia'; g.fillText('O.P. Jindal Global University', w / 2, 210); g.fillStyle = '#a32'; g.beginPath(); g.arc(w - 70, h - 62, 22, 0, Math.PI * 2); g.fill();
});
const screenTex = tex(1024, 640, (g, w, h) => {
  const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#16212a'); bg.addColorStop(1, '#0a0f13'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, w, 26); g.fillStyle = '#c9d1d3'; g.font = '15px Inter, sans-serif'; g.fillText('Terminal', 14, 18); g.textAlign = 'right'; g.fillText('22:14', w - 14, 18); g.textAlign = 'left';
  g.fillStyle = '#0b1210'; g.fillRect(48, 56, w - 96, h - 104); g.fillStyle = '#20282c'; g.fillRect(48, 56, w - 96, 30);
  [['#ff5f57', 70], ['#febc2e', 92], ['#28c840', 114]].forEach(([c, x]) => { g.fillStyle = c; g.beginPath(); g.arc(x, 71, 7, 0, 7); g.fill(); });
  g.fillStyle = '#9aa3a8'; g.font = '15px monospace'; g.textAlign = 'center'; g.fillText('dipti@221b: ~/osint', w / 2, 76); g.textAlign = 'left';
  g.font = '30px monospace'; g.fillStyle = '#7fd3c8';
  ['$ gh repo list Ghongha007', 'aitrace       verify-mcp', 'chat2net      groundline', 'osint-skills  india-osint', 'china-osint   russia-osint', '$ _'].forEach((l, i) => g.fillText(l, 76, 132 + i * 66));
  g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, h - 34, w, 34); ['#e3b45a', '#7fd3c8', '#c5463a', '#9aa3a8'].forEach((c, i) => { g.fillStyle = c; g.fillRect(w / 2 - 70 + i * 36, h - 28, 24, 22); });
});

// ---------------------------------------------------------------- scene
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07080a); scene.fog = new THREE.Fog(0x07080a, 9, 18);
const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 60);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.6;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const M = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.8, metalness: 0.0 }, o));
const box = (w, h, d, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
const RW = 10, RD = 8, RH = 4.2;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), M({ map: planks, roughness: 0.6 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const wallM = M({ map: wallpaper, roughness: 0.95 });
const back = new THREE.Mesh(new THREE.PlaneGeometry(RW, RH), wallM); back.position.set(0, RH / 2, -RD / 2); back.receiveShadow = true; scene.add(back);
const left = new THREE.Mesh(new THREE.PlaneGeometry(RD, RH), wallM); left.rotation.y = Math.PI / 2; left.position.set(-RW / 2, RH / 2, 0); scene.add(left);
const right = new THREE.Mesh(new THREE.PlaneGeometry(RD, RH), wallM); right.rotation.y = -Math.PI / 2; right.position.set(RW / 2, RH / 2, 0); scene.add(right);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), M({ color: 0x1a1a18 })); ceil.rotation.x = Math.PI / 2; ceil.position.y = RH; scene.add(ceil);
const trim = M({ color: 0x2b211a, roughness: 0.6 });
box(RW, 0.22, 0.05, trim, 0, 0.11, -RD / 2 + 0.03); box(0.05, 0.22, RD, trim, -RW / 2 + 0.03, 0.11, 0); box(0.05, 0.22, RD, trim, RW / 2 - 0.03, 0.11, 0);
// dado rail, picture rail and cornice; the left wall's dado stops either side of the bookcase
{ const rail = M({ color: 0x2b211a, roughness: 0.5 }), corn = M({ color: 0x24201c, roughness: 0.7 });
  for (const [y, h, d] of [[0.92, 0.05, 0.035], [3.55, 0.035, 0.025]]) { box(RW, h, d, rail, 0, y, -RD / 2 + d / 2); box(d, h, RD, rail, RW / 2 - d / 2, y, 0);
    if (y > 2) box(d, h, RD, rail, -RW / 2 + d / 2, y, 0); else { box(d, h, 0.3, rail, -RW / 2 + d / 2, y, -3.85); box(d, h, 5.45, rail, -RW / 2 + d / 2, y, 1.275); } }
  box(RW, 0.14, 0.12, corn, 0, RH - 0.07, -RD / 2 + 0.06); box(0.12, 0.14, RD, corn, -RW / 2 + 0.06, RH - 0.07, 0); box(0.12, 0.14, RD, corn, RW / 2 - 0.06, RH - 0.07, 0);
  box(RW, 0.05, 0.2, corn, 0, RH - 0.165, -RD / 2 + 0.1); }
const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.9), M({ map: rugTex, roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.01, -0.6); rug.receiveShadow = true; scene.add(rug);

const clues = {};            // key -> Group (raycast targets)
let globe = null;            // the globe on the bookcase turns slowly
const clue = (key, g, focus) => { g.userData.clue = key; g.userData.focus = focus; clues[key] = g; scene.add(g); return g; };

// fireplace, with the skull and headphones on the mantel
const stone = M({ map: marbleTex, roughness: 0.32 }), stoneD = M({ map: marbleTex, color: 0x9a948c, roughness: 0.4 });
{ box(2.4, 1.36, 0.1, stone, 0, 0.68, -3.95);                                                                  // stone mass behind the firebox
  const brick = M({ map: brickTex, roughness: 1 }); const back = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.98), brick); back.position.set(0, 0.49, -3.895); scene.add(back);
  for (const sx of [-1, 1]) { const side = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.98), brick); side.position.set(sx * 0.61, 0.49, -3.74); side.rotation.y = -sx * (Math.PI / 2 - 0.35); scene.add(side); }
  box(1.3, 0.05, 0.34, M({ color: 0x0b0806, roughness: 1 }), 0, 1.0, -3.74);                                      // soot-black lintel underside
  for (const sx of [-1, 1]) { box(0.55, 1.03, 0.36, stone, sx * 0.925, 0.515, -3.76);                             // pilasters with base, capital and a sunk panel
    box(0.6, 0.1, 0.4, stoneD, sx * 0.925, 0.05, -3.76); box(0.6, 0.06, 0.4, stoneD, sx * 0.925, 1.0, -3.76); box(0.34, 0.72, 0.01, stoneD, sx * 0.925, 0.53, -3.575); }
  box(2.4, 0.32, 0.36, stone, 0, 1.19, -3.76); box(0.44, 0.22, 0.012, stoneD, 0, 1.19, -3.575);                   // frieze and centre tablet
  box(2.7, 0.04, 0.44, stoneD, 0, 1.33, -3.73); box(2.9, 0.07, 0.5, M({ map: marbleTex, color: 0xb0aaa0, roughness: 0.25 }), 0, 1.385, -3.7);   // mantel shelf over a moulding
  box(2.7, 0.03, 0.55, stoneD, 0, 0.015, -3.31);                                                                   // hearth slab
  const iron = M({ color: 0x151515, metalness: 0.7, roughness: 0.45 }), brassF = M({ color: 0x9a7436, metalness: 0.85, roughness: 0.3 });
  for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.3, 10), iron); post.position.set(sx * 0.42, 0.15, -3.53); scene.add(post);
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), brassF); fin.position.set(sx * 0.42, 0.32, -3.53); scene.add(fin); box(0.03, 0.02, 0.3, iron, sx * 0.42, 0.04, -3.66); }
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.84, 8), iron); rail.rotation.z = Math.PI / 2; rail.position.set(0, 0.07, -3.53); scene.add(rail);
  // fire irons on a stand: poker, brush and shovel
  const st = new THREE.Group(); const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.02, 24), iron); disc.position.y = 0.04; st.add(disc);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.72, 8), iron); pole.position.y = 0.4; st.add(pole); const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 10), brassF); knob.position.y = 0.78; st.add(knob);
  [0, 2.1, 4.2].forEach((a, i) => { const t = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.6, 6), iron); sh.position.y = 0.38; t.add(sh); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), brassF); hd.position.y = 0.7; t.add(hd);
    const end = i === 0 ? new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.06, 6), iron) : i === 1 ? new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.08, 10), M({ color: 0x3a2a1a, roughness: 1 })) : new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.008), iron);
    end.position.y = 0.06; if (i === 0) end.rotation.x = Math.PI; t.add(end); t.position.set(Math.cos(a) * 0.045, 0, Math.sin(a) * 0.045); t.rotation.set(Math.sin(a) * 0.06, 0, -Math.cos(a) * 0.06); st.add(t); });
  st.position.set(1.45, 0.03, -3.35); scene.add(st); }
const fireLight = new THREE.PointLight(0xff8a3a, 6, 7, 1.6); fireLight.position.set(0, 0.5, -3.2); fireLight.castShadow = true; scene.add(fireLight);
// the fire: logs, a glowing ember bed, layered shader flames and rising sparks
const flames = [];
{ const logM = M({ color: 0x3a2414, roughness: 0.95 }); for (const [x, ry] of [[-0.18, 0.25], [0.15, -0.3], [0, 0.05]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.7, 12), logM); l.rotation.set(0, ry, Math.PI / 2); l.position.set(x * 0.4, 0.09 + (x === 0 ? 0.08 : 0), -3.62); scene.add(l); }
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), new THREE.MeshBasicMaterial({ color: 0xff5a14, transparent: true, opacity: 0.9 })); bed.rotation.x = -Math.PI / 2; bed.position.set(0, 0.04, -3.6); scene.add(bed); flames.bed = bed; }
const fireU = { uT: { value: 0 } };
const fireMat = (seed, hot) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uT: fireU.uT, uS: { value: seed }, uHot: { value: hot } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform float uT, uS, uHot; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
    float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * n(p); p *= 2.03; a *= 0.5; } return v; }
    void main(){
      vec2 uv = vUv; float y = uv.y;
      float q = fbm(vec2(uv.x * 3.0 + uS, y * 2.2 - uT * 1.6 + uS));
      float wob = (q - 0.5) * 0.35 * y;
      float x = abs(uv.x - 0.5 + wob) * 2.0;
      float shape = smoothstep(1.0, 0.0, x / (1.0 - y * 0.85 + 0.05)) * smoothstep(1.0, 0.25, y);
      float tongues = fbm(vec2(uv.x * 5.0 - uS, y * 3.5 - uT * 2.4));
      float f = clamp(shape * (0.55 + tongues * 0.9) - y * 0.35, 0.0, 1.0);
      vec3 col = mix(vec3(0.55, 0.06, 0.0), vec3(1.0, 0.42, 0.05), smoothstep(0.05, 0.45, f));
      col = mix(col, vec3(1.0, 0.86, 0.5), smoothstep(0.55, 0.95, f) * uHot);
      gl_FragColor = vec4(col * f * 1.6, f);
    }` });
for (let i = 0; i < 6; i++) { const w = 0.32 + rnd() * 0.22, hgt = 0.55 + rnd() * 0.35; const f = new THREE.Mesh(new THREE.PlaneGeometry(w, hgt), fireMat(i * 3.7, i < 3 ? 1 : 0.6)); f.position.set(-0.3 + i * 0.12, 0.07 + hgt / 2, -3.58 + (i % 2) * 0.03); scene.add(f); flames.push(f); }
const sparks = (() => { const n = 40, a = new Float32Array(n * 3), life = new Float32Array(n); for (let i = 0; i < n; i++) { a.set([(rnd() - .5) * 0.6, 0.1 + rnd() * 0.8, -3.6], i * 3); life[i] = rnd(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3)); const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffb347, size: 0.02, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); p.userData.life = life; scene.add(p); return p; })();

// the skull: sutured cranium, brow ridges, cheek arches, nasal cavity, two rows of teeth and a mandible, wearing a pair of headphones
{ const g = new THREE.Group(); const bone = M({ map: boneTex, roughness: 0.6 }), bone2 = M({ color: 0xe2d5b4, roughness: 0.62 }), dark = M({ color: 0x0a0806, roughness: 1 });
  const cr = new THREE.Mesh(new THREE.SphereGeometry(0.17, 48, 36), bone); cr.scale.set(0.92, 0.95, 1.12); cr.position.set(0, 0.24, -0.03); cr.rotation.y = Math.PI / 2; g.add(cr);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 24), bone2); face.scale.set(1.05, 0.95, 0.8); face.position.set(0, 0.17, 0.09); g.add(face);
  for (const sx of [-1, 1]) {
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.05, 6, 12), bone2); brow.rotation.z = Math.PI / 2 + sx * 0.22; brow.position.set(sx * 0.056, 0.248, 0.16); g.add(brow);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.043, 24, 16), dark); eye.scale.set(1, 0.92, 0.7); eye.position.set(sx * 0.056, 0.2, 0.172); g.add(eye);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.042, 18, 14), bone2); cheek.position.set(sx * 0.088, 0.148, 0.122); g.add(cheek);
    const arch = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.08, 4, 10), bone2); arch.rotation.x = Math.PI / 2; arch.rotation.y = sx * 0.18; arch.position.set(sx * 0.118, 0.148, 0.06); g.add(arch);
    const temple = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), dark); temple.scale.set(0.3, 1, 1.3); temple.position.set(sx * 0.142, 0.2, 0.07); g.add(temple);
    const ramus = new THREE.Mesh(new RoundedBoxGeometry(0.022, 0.1, 0.05, 2, 0.008), bone2); ramus.position.set(sx * 0.082, 0.085, 0.045); ramus.rotation.x = -0.25; g.add(ramus);
  }
  const ns = new THREE.Shape(); ns.moveTo(0, 0.03); ns.bezierCurveTo(0.012, 0.02, 0.022, -0.004, 0.018, -0.02); ns.bezierCurveTo(0.012, -0.03, 0.004, -0.026, 0, -0.021); ns.bezierCurveTo(-0.004, -0.026, -0.012, -0.03, -0.018, -0.02); ns.bezierCurveTo(-0.022, -0.004, -0.012, 0.02, 0, 0.03);
  const nose = new THREE.Mesh(new THREE.ExtrudeGeometry(ns, { depth: 0.03, bevelEnabled: false }), dark); nose.position.set(0, 0.142, 0.17); nose.rotation.x = -0.2; g.add(nose);
  const maxilla = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.04, 0.09, 3, 0.016), bone2); maxilla.position.set(0, 0.112, 0.13); g.add(maxilla);
  const chin = new THREE.Mesh(new RoundedBoxGeometry(0.125, 0.04, 0.09, 3, 0.016), bone2); chin.position.set(0, 0.052, 0.12); g.add(chin);
  const tooth = M({ color: 0xf1e9d2, roughness: 0.35 }), toothY = M({ color: 0xd9c9a0, roughness: 0.45 });
  for (const [y, rx, rz, hgt] of [[0.091, 0.058, 0.052, 0.022], [0.073, 0.052, 0.046, 0.018]]) for (let i = 0; i < 12; i++) { const a = (i - 5.5) * 0.15, w = Math.abs(i - 5.5) < 2 ? 0.011 : 0.015;
    const t = new THREE.Mesh(new RoundedBoxGeometry(w, hgt, 0.011, 2, 0.003), i % 5 === 3 ? toothY : tooth); t.position.set(Math.sin(a) * rx, y, 0.12 + Math.cos(a) * rz - 0.045); t.rotation.y = a; g.add(t); }
  // headphones: padded band, sliders, yokes, cups with rings and cushions, and a coiled cable spilling over the mantel edge
  const leather = M({ color: 0x141414, roughness: 0.35, metalness: 0.2 }), steel = M({ color: 0x9aa0a6, metalness: 0.9, roughness: 0.25 }), foam = M({ color: 0x242424, roughness: 0.95 });
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 10, 48, Math.PI), steel); band.position.set(0, 0.3, -0.02); g.add(band);
  const pad = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.02, 12, 40, Math.PI * 0.62), leather); pad.rotation.z = Math.PI * 0.19; pad.scale.z = 1.6; pad.position.set(0, 0.3, -0.02); g.add(pad);
  for (const sx of [-1, 1]) {
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.07, 0.024), steel); slide.position.set(sx * 0.2, 0.27, -0.02); g.add(slide);
    const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.006, 8, 32, Math.PI), steel); yoke.rotation.y = Math.PI / 2; yoke.position.set(sx * 0.205, 0.2, -0.02); g.add(yoke);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.07, 0.05, 40), leather); cup.rotation.z = Math.PI / 2; cup.position.set(sx * 0.205, 0.2, -0.02); g.add(cup);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.006, 8, 32), steel); ring.rotation.y = Math.PI / 2; ring.position.set(sx * 0.232, 0.2, -0.02); g.add(ring);
    const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.018, 12, 32), foam); cushion.rotation.y = Math.PI / 2; cushion.position.set(sx * 0.176, 0.2, -0.02); g.add(cushion); }
  const cable = new THREE.CatmullRomCurve3([[-0.22, 0.15, -0.02], [-0.25, 0.06, 0.03], [-0.2, 0.006, 0.1], [-0.06, 0.006, 0.12], [0.06, 0.006, 0.1], [0.12, 0.006, 0.16], [0.16, -0.01, 0.215], [0.17, -0.1, 0.23], [0.165, -0.2, 0.235]].map((p) => new THREE.Vector3(...p)));
  const cord = new THREE.Mesh(new THREE.TubeGeometry(cable, 90, 0.004, 6), leather); g.add(cord); const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.04, 8), steel); jack.position.set(0.165, -0.22, 0.235); g.add(jack);
  g.position.set(-0.75, 1.42, -3.6); g.rotation.y = 0.35; clue('skull', g, { pos: [-0.45, 1.75, -2.5], look: [-0.75, 1.6, -3.6] }); }
// mantel clock showing London time
const clockTex = document.createElement('canvas'); clockTex.width = clockTex.height = 256; const clockT = new THREE.CanvasTexture(clockTex); clockT.colorSpace = THREE.SRGBColorSpace;
function drawClock() { const g = clockTex.getContext('2d'), now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/London' })); g.fillStyle = '#efe6cf'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#3a2a18'; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.stroke();
  g.fillStyle = '#3a2a18'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillRect(128 + Math.sin(a) * 100 - 3, 128 - Math.cos(a) * 100 - 3, 6, 6); }
  const hand = (a, l, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(a) * l, 128 - Math.cos(a) * l); g.stroke(); };
  hand((now.getHours() % 12 + now.getMinutes() / 60) / 12 * Math.PI * 2, 58, 8); hand(now.getMinutes() / 60 * Math.PI * 2, 88, 5); g.strokeStyle = '#a32'; hand(now.getSeconds() / 60 * Math.PI * 2, 96, 2); clockT.needsUpdate = true; }
drawClock(); setInterval(drawClock, 1000);
{ const body = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.5, 0.14, 4, 0.05), M({ color: 0x2b1a0e, roughness: 0.35 })); body.position.set(0.72, 1.66, -3.7); scene.add(body);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.15, 40), M({ map: clockT, roughness: 0.4 })); face.position.set(0.72, 1.7, -3.62); scene.add(face);
  const brassC = M({ color: 0xa88445, metalness: 0.85, roughness: 0.28 }); const bez = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.012, 10, 48), brassC); bez.position.set(0.72, 1.7, -3.618); scene.add(bez);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.15, 40), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.05, metalness: 0.4 })); glass.position.set(0.72, 1.7, -3.612); scene.add(glass);
  const ped = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.05, 0.12, 3, 0.02), M({ color: 0x2b1a0e, roughness: 0.3 })); ped.position.set(0.72, 1.93, -3.7); scene.add(ped); const fin = new THREE.Mesh(new THREE.SphereGeometry(0.025, 14, 10), brassC); fin.position.set(0.72, 1.975, -3.7); scene.add(fin);
  for (const sx of [-1, 1]) { const ft = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), brassC); ft.position.set(0.72 + sx * 0.17, 1.43, -3.66); scene.add(ft); } }
// the smiley on the wall, bullet holes and all: click it and it takes another shot
const smiley = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshStandardMaterial({ map: smileyTex, transparent: true, roughness: 0.9 })); smiley.position.set(2.75, 2.25, -RD / 2 + 0.01); scene.add(smiley);
smiley.userData.egg = true;
// the window, on the back wall: London at night, rain on the glass, the odd flash of lightning
const rainC = document.createElement('canvas'); rainC.width = 256; rainC.height = 512; { const g = rainC.getContext('2d'); g.clearRect(0, 0, 256, 512); for (let i = 0; i < 140; i++) { const x = rnd() * 256, y = rnd() * 512, l = 10 + rnd() * 26; g.strokeStyle = `rgba(200,220,255,${0.15 + rnd() * 0.3})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + l); g.stroke(); } for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(220,235,255,.35)'; g.beginPath(); g.arc(rnd() * 256, rnd() * 512, 1.5 + rnd() * 2, 0, 7); g.fill(); } }
const rainT = new THREE.CanvasTexture(rainC); rainT.wrapS = rainT.wrapT = THREE.RepeatWrapping;
let flash = 0; const skyMat = new THREE.MeshBasicMaterial({ map: nightTex, color: 0xffffff });
{ const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), skyMat));
  const rain = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshBasicMaterial({ map: rainT, transparent: true, depthWrite: false })); rain.position.z = 0.01; g.add(rain); g.userData.rain = rain;
  const fr = M({ color: 0xd9d2c0, roughness: 0.5 }); box(1.66, 0.08, 0.1, fr, 0, 0.99, 0.04, g); box(1.66, 0.08, 0.1, fr, 0, -0.99, 0.04, g); box(0.08, 2.06, 0.1, fr, -0.79, 0, 0.04, g); box(0.08, 2.06, 0.1, fr, 0.79, 0, 0.04, g); box(1.6, 0.05, 0.06, fr, 0, 0.1, 0.04, g); box(0.05, 1.9, 0.06, fr, 0, 0, 0.04, g);
  box(1.9, 0.07, 0.24, fr, 0, -1.05, 0.12, g);
  const cur = M({ color: 0x4a1418, roughness: 0.95, side: THREE.DoubleSide }), gold = M({ color: 0xb08a3a, metalness: 0.8, roughness: 0.35 });
  for (const sx of [-1, 1]) { const geo = new THREE.PlaneGeometry(0.62, 2.6, 60, 50), p = geo.attributes.position; const outer = sx * 0.31;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), u = x / 0.62 + 0.5, tie = Math.exp(-((y + 0.3) ** 2) / 0.35);
      p.setX(i, outer + (x - outer) * (1 - 0.55 * tie)); p.setZ(i, 0.035 * Math.sin(u * Math.PI * 14) * (1 + 0.8 * tie) + 0.04 * tie); }
    geo.computeVertexNormals(); const c = new THREE.Mesh(geo, cur); c.position.set(sx * 1.02, -0.05, 0.16); g.add(c);
    const tb = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 20), gold); tb.scale.set(1.4, 0.5, 1); tb.position.set(sx * (1.02 + 0.31 * 0.45), -0.35, 0.2); g.add(tb);
    const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 10), gold); tassel.position.set(sx * (1.02 + 0.31 * 0.45) - sx * 0.07, -0.46, 0.21); g.add(tassel);
    for (const yy of [1.25]) { const fin = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), gold); fin.position.set(sx * 1.32, yy, 0.16); g.add(fin); }
    for (let r = 0; r < 6; r++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 6, 14), gold); ring.position.set(sx * (0.76 + r * 0.1), 1.21, 0.16); g.add(ring); } }
  box(2.6, 0.05, 0.05, M({ color: 0x8a6a3a, metalness: 0.6, roughness: 0.3 }), 0, 1.25, 0.16, g);
  g.position.set(-2.55, 2.15, -RD / 2 + 0.03); clue('window', g, { pos: [-2.3, 2.1, -1.2], look: [-2.55, 2.1, -4] }); var winGroup = g;
  const cool = new THREE.SpotLight(0x7ea6ff, 3, 9, 0.7, 0.6); cool.position.set(-2.55, 2.2, -3.6); cool.target.position.set(-1, 0, 0); scene.add(cool, cool.target); var coolLight = cool; }
// the framed certificate, on the right wall by the case board
{ const g = new THREE.Group(); const gilt = M({ color: 0x9a7436, roughness: 0.3, metalness: 0.8 }), giltD = M({ color: 0x5a4220, roughness: 0.4, metalness: 0.7 });
  box(0.86, 0.66, 0.02, giltD, 0, 0, -0.01, g);
  for (const [w, h, x, y] of [[0.9, 0.07, 0, 0.315], [0.9, 0.07, 0, -0.315], [0.07, 0.7, -0.415, 0], [0.07, 0.7, 0.415, 0]]) { const r = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.05, 3, 0.018), gilt); r.position.set(x, y, 0.01); r.castShadow = true; g.add(r); }
  for (const [w, h, x, y] of [[0.77, 0.012, 0, 0.276], [0.77, 0.012, 0, -0.276], [0.012, 0.56, -0.38, 0], [0.012, 0.56, 0.38, 0]]) box(w, h, 0.012, giltD, x, y, 0.03, g);
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.55), M({ color: 0xe9e1cc, roughness: 0.9 })); mat.position.z = 0.012; g.add(mat);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.44), M({ map: certTex })); p.position.z = 0.016; g.add(p);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.55), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, roughness: 0.05, metalness: 0.5 })); gl.position.z = 0.028; g.add(gl); g.rotation.y = -Math.PI / 2; g.position.set(RW / 2 - 0.04, 2.25, -3.35); clue('frame', g, { pos: [3.0, 2.2, -3.0], look: [5, 2.2, -3.35] }); }
// bookcase on the left wall: a mahogany case with five shelves of real books, some leaning, some stacked, and a globe on top
{ const g = new THREE.Group(); const oak = M({ color: 0x2a1c12, roughness: 0.5 }), oakD = M({ color: 0x1a110b, roughness: 0.6 });
  box(0.03, 2.8, 2.2, oakD, -0.235, 1.4, 0, g);
  for (const sz of [-1.085, 1.085]) box(0.5, 2.8, 0.05, oak, 0, 1.4, sz, g);
  box(0.48, 2.66, 0.035, oak, 0, 1.4, 0, g);                                                                       // centre divider
  box(0.54, 0.14, 2.24, oak, 0.01, 0.07, 0, g); box(0.012, 0.09, 2.1, oakD, 0.28, 0.07, 0, g);                    // plinth with a sunk line
  box(0.54, 0.05, 2.26, oak, 0.01, 2.825, 0, g); box(0.6, 0.08, 2.34, oak, 0.03, 2.89, 0, g); box(0.62, 0.03, 2.38, oakD, 0.04, 2.945, 0, g);   // cornice
  const shelves = [0.14, 0.66, 1.18, 1.7, 2.22];
  shelves.forEach((y) => { if (y > 0.2) box(0.46, 0.035, 2.12, oak, 0, y - 0.0175, 0, g); box(0.02, 0.045, 2.12, oak, 0.235, y - 0.02, 0, g); });
  const pal = [0x5a1a14, 0x2a3a2a, 0x1d2a3c, 0x6b4a1e, 0x3a1e2e, 0x2b2b2b, 0x7a5a2a, 0x4a2a1a, 0x1e3a34, 0x8a7a5a, 0x6a2a20, 0x2e2a4a];
  const B = [], bands = [], labels = []; const col = new THREE.Color();
  const put = (x, y, z, d, h, w, rx = 0, ry = 0) => B.push({ x, y, z, d, h, w, rx, ry, c: pal[Math.floor(rd() * pal.length)], k: 0.75 + rd() * 0.45 });
  shelves.forEach((y0, si) => { const room = (si === 4 ? 0.58 : 0.485); for (const bay of [-1, 1]) {
    let z = bay < 0 ? -1.06 : 0.02; const zEnd = bay < 0 ? -0.02 : 1.06; let lean = 0;
    while (z < zEnd - 0.03) {
      if (rd() < 0.07 && z > -1.0 && z < 0.98) { // a short stack of books lying flat
        const L = 0.2 + rd() * 0.06; if (z + L > zEnd) break; let yy = y0; for (let k = 0; k < 3 + Math.floor(rd() * 2); k++) { const t = 0.03 + rd() * 0.025, d = 0.16 + rd() * 0.06; put(0.225 - d / 2 - rd() * 0.02, yy + t / 2, z + L / 2, d, t, L - rd() * 0.03, 0, (rd() - .5) * 0.12); yy += t; }
        z += L + 0.01; continue; }
      if (rd() < 0.05) { z += 0.05 + rd() * 0.05; lean = 1; continue; }                                         // a gap, so the next book leans
      const w = 0.022 + rd() * 0.034, h = Math.min(room - 0.02, 0.25 + rd() * 0.19), d = 0.16 + rd() * 0.08; if (z + w > zEnd) break;
      if (lean) { const a = 0.22; put(0.225 - d / 2, y0 + (h / 2) * Math.cos(a) + (w / 2) * Math.sin(a), z + w / 2 - (h / 2) * Math.sin(a) + 0.03, d, h, w, -a); lean = 0; z += w + 0.03; continue; }
      put(0.225 - d / 2 - rd() * 0.015, y0 + h / 2, z + w / 2, d, h, w); const b = B[B.length - 1];
      if (rd() < 0.75) { bands.push([b.x + d / 2 + 0.001, y0 + h - 0.035, b.z, w * 0.92]); bands.push([b.x + d / 2 + 0.001, y0 + 0.04, b.z, w * 0.92]); }
      if (rd() < 0.5) labels.push([b.x + d / 2 + 0.0015, y0 + h * 0.68, b.z, w * 0.7]);
      z += w + 0.002; } } });
  const books = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M({ roughness: 0.75 }), B.length), mx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  B.forEach((b, i) => { mx.compose(new THREE.Vector3(b.x, b.y, b.z), q.setFromEuler(e.set(b.rx, b.ry, 0)), new THREE.Vector3(b.d, b.h, b.w)); books.setMatrixAt(i, mx); books.setColorAt(i, col.setHex(b.c).multiplyScalar(b.k)); });
  books.castShadow = books.receiveShadow = true; g.add(books);
  const strip = (list, mat, h) => { const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, list.length); list.forEach(([x, y, z, w], i) => { mx.compose(new THREE.Vector3(x, y, z), q.identity(), new THREE.Vector3(0.002, h, w)); m.setMatrixAt(i, mx); }); g.add(m); };
  strip(bands, M({ color: 0xb08a3a, metalness: 0.8, roughness: 0.35 }), 0.007); strip(labels, M({ color: 0x14110e, roughness: 0.8 }), 0.045);
  // the globe and a pile of folios on top
  const brassG = M({ color: 0x9a7436, metalness: 0.85, roughness: 0.3 }); const gl = new THREE.Group();
  const foot = new THREE.Mesh(new THREE.LatheGeometry(V2([[0, 0], [0.09, 0], [0.085, 0.02], [0.03, 0.04], [0.015, 0.12], [0, 0.12]]), 24), M({ color: 0x2a1a0e, roughness: 0.4 })); gl.add(foot);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 40, 28), M({ map: globeTex, roughness: 0.45 })); ball.position.y = 0.26; ball.rotation.z = 0.41; gl.add(ball); gl.userData.ball = ball;
  const mer = new THREE.Mesh(new THREE.TorusGeometry(0.142, 0.006, 8, 48, Math.PI * 1.3), brassG); mer.position.y = 0.26; mer.rotation.set(0, Math.PI / 2, -0.41 - Math.PI * 0.15); gl.add(mer);
  gl.position.set(0.02, 2.96, 0.55); g.add(gl); globe = ball;
  let yy = 2.96; for (let k = 0; k < 3; k++) { const t = 0.05 - k * 0.008; box(0.3 - k * 0.03, t, 0.42 - k * 0.04, M({ color: pal[k * 4], roughness: 0.7 }), 0, yy + t / 2, -0.55 + k * 0.02, g); yy += t; }
  g.position.set(-RW / 2 + 0.26, 0, -2.6); clue('shelf', g, { pos: [-2.4, 1.7, -1.9], look: [-4.7, 1.5, -2.6] }); }
// the case wall on the right
{ const g = new THREE.Group(); box(2.3, 1.5, 0.04, M({ color: 0x3a2814 }), 0, 0, 0, g); const c = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 1.47), M({ map: corkTex, roughness: 1 })); c.position.z = 0.021; g.add(c);
  const fw = M({ color: 0x3a2716, roughness: 0.45 }); for (const [w, h, x, y] of [[2.42, 0.07, 0, 0.765], [2.42, 0.07, 0, -0.765], [0.07, 1.6, -1.175, 0], [0.07, 1.6, 1.175, 0]]) { const r = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.06, 3, 0.02), fw); r.position.set(x, y, 0.02); r.castShadow = true; g.add(r); }
  const P = corkPins.map(([x, y]) => new THREE.Vector3((x / 768 - 0.5) * 2.25, (0.5 - y / 512) * 1.47, 0.045));
  const pinM = M({ color: 0xc81e24, roughness: 0.25, metalness: 0.1 }), needle = M({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 }), str = M({ color: 0xb3141c, roughness: 0.8 });
  P.forEach((p) => { const head = new THREE.Mesh(new THREE.SphereGeometry(0.018, 14, 10), pinM); head.position.copy(p).setZ(0.06); g.add(head); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.04, 6), needle); n.rotation.x = Math.PI / 2; n.position.copy(p).setZ(0.035); g.add(n); });
  P.forEach((a, i) => { const b = P[(i + 2) % P.length]; const len = a.distanceTo(b), s = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, len, 5), str); s.position.copy(a).add(b).multiplyScalar(0.5).setZ(0.05); s.rotation.z = Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2; g.add(s); });
  g.rotation.y = -Math.PI / 2; g.position.set(RW / 2 - 0.04, 2.15, -1.3); clue('board', g, { pos: [2.4, 2.1, -1.3], look: [5, 2.1, -1.3] }); }
// armchairs: a black leather Chesterfield and a red wingback, both tufted
function chair(color, x, z, ry, wing) {
  const g = new THREE.Group(); const m = M({ color, roughness: color === 0x141414 ? 0.32 : 0.85, metalness: color === 0x141414 ? 0.15 : 0 }); const RB = (w, h, d, r, X, Y, Z) => { const o = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), m); o.position.set(X, Y, Z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  RB(1.0, 0.32, 0.9, 0.06, 0, 0.3, 0); RB(0.78, 0.14, 0.72, 0.06, 0, 0.5, 0.05);                         // base and seat cushion
  RB(1.0, 0.95, 0.22, 0.08, 0, 0.88, -0.36);                                                             // back
  for (const sx of [-1, 1]) { RB(0.18, 0.36, 0.86, 0.06, sx * 0.47, 0.6, 0.02); const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.88, 20), m); roll.rotation.x = Math.PI / 2; roll.position.set(sx * 0.49, 0.8, 0.02); g.add(roll);
    if (wing) RB(0.12, 0.55, 0.36, 0.05, sx * 0.46, 1.15, -0.22); }
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), M({ color: 0x050505, roughness: 0.4 })); b.position.set(-0.3 + c * 0.2 + (r % 2) * 0.1, 0.62 + r * 0.2, -0.245); g.add(b); }
  for (const [a, b] of [[-0.42, -0.36], [0.42, -0.36], [-0.42, 0.36], [0.42, 0.36]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.025, 0.16, 12), M({ color: 0x2a1a0c, roughness: 0.4 })); leg.position.set(a, 0.08, b); g.add(leg); }
  g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); return g;
}
chair(0x141414, -1.35, -1.2, 0.55, false); chair(0x7a1d1c, 1.35, -1.2, -0.55, true);
// the violin: a real outline, extruded and bevelled, with f-holes, fingerboard, strings, bridge, scroll and pegs, and its bow
function violinShape(s) {
  const pts = [[0, -0.36], [0.1, -0.34], [0.16, -0.27], [0.165, -0.17], [0.13, -0.1], [0.095, -0.05], [0.1, 0.02], [0.13, 0.07], [0.14, 0.15], [0.12, 0.22], [0.06, 0.26], [0, 0.265]];
  const sh = new THREE.Shape(); sh.moveTo(0, pts[0][1] * s);
  const right = pts.map(([x, y]) => new THREE.Vector2(x * s, y * s)); const left = pts.slice().reverse().map(([x, y]) => new THREE.Vector2(-x * s, y * s));
  sh.splineThru(right.slice(1)); sh.splineThru(left.slice(1)); return sh;
}
const varnish = tex(256, 512, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h * 0.55, 20, w / 2, h / 2, w); gr.addColorStop(0, '#c4641c'); gr.addColorStop(0.6, '#8a3a10'); gr.addColorStop(1, '#4a1a08'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(60,20,5,${0.08 + rnd() * 0.12})`; g.beginPath(); const x = rnd() * w; g.moveTo(x, 0); g.bezierCurveTo(x + 6, h / 3, x - 6, h * 2 / 3, x + 3, h); g.stroke(); } });
{ const g = new THREE.Group(); const S = 1.0; const wood = M({ map: varnish, roughness: 0.28, metalness: 0.05 }); const ebony = M({ color: 0x0c0a08, roughness: 0.35 });
  const geo = new THREE.ExtrudeGeometry(violinShape(S), { depth: 0.045, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.008, bevelSegments: 4, curveSegments: 48 });
  geo.computeBoundingBox(); const bb = geo.boundingBox; const uv = geo.attributes.uv, pos = geo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
  const body = new THREE.Mesh(geo, wood); body.castShadow = true; g.add(body); const top = 0.058;
  for (const sx of [-1, 1]) { const f = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 6, 16, Math.PI * 1.2), ebony); f.position.set(sx * 0.055, -0.07, top); f.rotation.z = sx > 0 ? 0.6 : 2.5; g.add(f); for (const dy of [-0.03, 0.03]) { const dot = new THREE.Mesh(new THREE.CircleGeometry(0.007, 10), ebony); dot.position.set(sx * 0.055 + (dy > 0 ? sx * 0.01 : -sx * 0.01), -0.07 + dy * 1.4, top + 0.001); g.add(dot); } }
  const fb = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.012, 0.42), ebony); fb.rotation.x = -Math.PI / 2; fb.position.set(0, 0.14, top + 0.012); fb.scale.x = 1; g.add(fb);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.03), wood); neck.position.set(0, 0.36, top - 0.005); g.add(neck);
  const peg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, 0.04), wood); peg.position.set(0, 0.49, top - 0.005); g.add(peg);
  const scroll = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.009, 8, 16), wood); scroll.rotation.y = Math.PI / 2; scroll.position.set(0, 0.55, top); g.add(scroll);
  for (const k of [-1, 1]) for (const dy of [0.46, 0.51]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 8), ebony); p.rotation.z = Math.PI / 2; p.position.set(k * 0.03, dy, top - 0.005); g.add(p); }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.006, 0.03), M({ color: 0xd8c39a })); bridge.rotation.x = -Math.PI / 2; bridge.position.set(0, -0.07, top + 0.016); g.add(bridge);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.11, 0.008), ebony); tail.position.set(0, -0.25, top + 0.008); g.add(tail);
  for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.72, 4), M({ color: 0xd8d8d0, metalness: 0.9, roughness: 0.2 })); s.position.set(-0.012 + i * 0.008, 0.11, top + 0.02); g.add(s); }
  const chin = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), ebony); chin.scale.set(1, 1, 0.4); chin.position.set(0.05, -0.3, top); chin.rotation.x = Math.PI / 2; g.add(chin);
  const bow = new THREE.Group(); const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.005, 0.74, 8), M({ color: 0x3a1a08, roughness: 0.4 })); bow.add(stick);
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.68, 0.001), M({ color: 0xf2ece0, roughness: 0.9 })); hair.position.x = 0.014; bow.add(hair); const frog = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.016), ebony); frog.position.set(0.008, -0.33, 0); bow.add(frog);
  bow.rotation.set(Math.PI / 2, 0, 0.9); bow.position.set(0.16, 0.0, 0.03); g.add(bow);
  g.rotation.set(-Math.PI / 2 + 0.25, 0, 0.5); g.position.set(-1.3, 0.62, -1.1); g.scale.setScalar(0.95);
  clue('violin', g, { pos: [-0.75, 1.35, 0.1], look: [-1.3, 0.62, -1.1] }); }
// dust drifting through the lamplight
const dustTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,236,180,1)'); gr.addColorStop(0.35, 'rgba(255,205,110,.55)'); gr.addColorStop(1, 'rgba(255,190,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t; })();
const dust = (() => { const n = 420, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([(rnd() - 0.5) * 9, rnd() * 3.8, -3.8 + rnd() * 6.5], i * 3); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ map: dustTex, color: 0xffcf6e, size: 0.035, sizeAttenuation: true, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(p); return p; })();
// mind palace: the things she knows, floating in the room (toggle)
try { await document.fonts.load('500 54px "IBM Plex Mono"'); } catch (e) {}
const palace = new THREE.Group(); palace.visible = false; scene.add(palace); let palaceOn = true;
['GEOLOCATION', 'SHIP TRACKING', 'SATELLITE IMAGERY', 'SHELL COMPANIES', 'CHRONOLOCATION', 'FLIGHT TRACKING', 'DISINFORMATION', 'XINJIANG', 'SANCTIONS', 'C2PA', 'NETWORK MAPS', 'TIBETAN', '한국어', 'MCP AGENTS', 'VERIFICATION', 'DEFENCE'].forEach((w, i) => {
  // faint, thin, bracketed, so they read as thoughts in the air, not as clickable clues
  const font = '400 46px "IBM Plex Mono", monospace', label = '[ ' + w.toLowerCase() + ' ]'; const m = document.createElement('canvas').getContext('2d'); m.font = font;
  const cw = Math.ceil(m.measureText(label).width) + 40, c = document.createElement('canvas'); c.width = cw; c.height = 84; const g = c.getContext('2d'); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = i % 3 ? 'rgba(220,230,235,1)' : 'rgba(227,180,90,1)'; g.fillText(label, cw / 2, 42);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false, opacity: 0.32 })); s.scale.set(cw / 84 * 0.13, 0.13, 1); s.raycast = () => {};
  s.userData = { a: (i / 16) * Math.PI * 2, r: 1.6 + (i % 4) * 0.55, y: 1.2 + (i % 5) * 0.45, sp: 0.06 + (i % 3) * 0.03 }; palace.add(s); });
// side table: a round tilt-top on a turned pedestal and tripod feet, with the newspaper folded on it
{ const wood = M({ color: 0x2b211a, roughness: 0.35 }); const t = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.31, 0.035, 56), wood); top.position.y = 0.5575; top.castShadow = top.receiveShadow = true; t.add(top);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.315, 0.01, 8, 56), wood); lip.rotation.x = Math.PI / 2; lip.position.y = 0.574; t.add(lip);
  const ped = new THREE.Mesh(new THREE.LatheGeometry(V2([[0, 0.08], [0.05, 0.08], [0.06, 0.12], [0.034, 0.17], [0.028, 0.29], [0.05, 0.34], [0.03, 0.4], [0.026, 0.49], [0.07, 0.54], [0, 0.54]]), 28), wood); ped.castShadow = true; t.add(ped);
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + 0.3; const curve = new THREE.CatmullRomCurve3([[0.03, 0.13], [0.13, 0.08], [0.22, 0.03], [0.27, 0.015]].map(([r, y]) => new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)));
    const leg = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.018, 8), wood); leg.castShadow = true; t.add(leg); const pad = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), wood); pad.position.set(Math.cos(a) * 0.275, 0.014, Math.sin(a) * 0.275); t.add(pad); }
  t.position.set(0, 0, -0.9); scene.add(t); }
{ const g = new THREE.Group(); const sheet = M({ color: 0xd6cdb6, roughness: 0.9 });
  const under = new THREE.Mesh(new THREE.BoxGeometry(0.49, 0.004, 0.34), sheet); under.position.set(0.012, -0.004, 0.01); under.rotation.y = 0.07; g.add(under);
  const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.004, 0.35), [sheet, sheet, M({ map: paperTex, roughness: 0.85 }), sheet, sheet, sheet]); g.add(p);
  const fold = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.35, 8, 1, false, 0, Math.PI), sheet); fold.rotation.x = Math.PI / 2; fold.position.set(-0.25, -0.002, 0); g.add(fold);
  const glasses = new THREE.Group(); const rim = M({ color: 0x1a1a1a, metalness: 0.6, roughness: 0.3 }); for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.003, 6, 24), rim); r.rotation.x = Math.PI / 2; r.position.x = sx * 0.034; glasses.add(r); const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.12, 4), rim); arm.rotation.x = Math.PI / 2; arm.position.set(sx * 0.062, 0, -0.06); glasses.add(arm); }
  const bridgeG = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.002, 4, 10, Math.PI), rim); bridgeG.rotation.x = -Math.PI / 2; glasses.add(bridgeG); glasses.position.set(0.14, 0.008, 0.11); glasses.rotation.y = 0.6; g.add(glasses);
  g.position.set(0, 0.579, -0.9); g.rotation.y = 0.25; clue('newspaper', g, { pos: [0.1, 1.35, 0.1], look: [0, 0.58, -0.9] }); }
// desk and laptop, front right
{ const wood = M({ color: 0x3a2716, roughness: 0.4 }), woodD = M({ color: 0x2b1c10, roughness: 0.5 }), brassD = M({ color: 0xa88445, metalness: 0.85, roughness: 0.3 });
  const top = new THREE.Mesh(new RoundedBoxGeometry(1.66, 0.05, 0.86, 3, 0.014), wood); top.position.set(3.2, 0.785, 0.8); top.castShadow = top.receiveShadow = true; scene.add(top);
  const tooled = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.6), M({ color: 0xa88445, metalness: 0.7, roughness: 0.4 })); tooled.rotation.x = -Math.PI / 2; tooled.position.set(3.2, 0.8103, 0.78); tooled.receiveShadow = true; scene.add(tooled);
  const inlay = new THREE.Mesh(new THREE.PlaneGeometry(1.33, 0.57), M({ color: 0x1d3a2a, roughness: 0.75 })); inlay.rotation.x = -Math.PI / 2; inlay.position.set(3.2, 0.8106, 0.78); inlay.receiveShadow = true; scene.add(inlay);
  box(1.5, 0.12, 0.74, woodD, 3.2, 0.70, 0.8);
  for (const dx of [-0.37, 0.37]) { box(0.66, 0.095, 0.014, wood, 3.2 + dx, 0.70, 1.172); const kn = new THREE.Mesh(new THREE.SphereGeometry(0.016, 14, 10), brassD); kn.position.set(3.2 + dx, 0.70, 1.19); scene.add(kn);
    const esc = new THREE.Mesh(new THREE.CircleGeometry(0.012, 12), brassD); esc.position.set(3.2 + dx, 0.735, 1.18); scene.add(esc); }
  const legGeo = new THREE.LatheGeometry(V2([[0, 0], [0.022, 0], [0.026, 0.02], [0.02, 0.05], [0.024, 0.3], [0.03, 0.5], [0.036, 0.6], [0.03, 0.63], [0.036, 0.64], [0.036, 0.76], [0, 0.76]]), 18);
  for (const [a, b] of [[2.45, 0.45], [3.95, 0.45], [2.45, 1.15], [3.95, 1.15]]) { const l = new THREE.Mesh(legGeo, woodD); l.position.set(a, 0, b); l.castShadow = true; scene.add(l); }
  // a coffee mug, a notebook with a pen, and a brass magnifying glass
  const cer = M({ color: 0xe8e2d6, roughness: 0.35 }); const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.036, 0.1, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.35, side: THREE.DoubleSide })); mug.position.set(3.82, 0.861, 0.52); mug.castShadow = true; scene.add(mug);
  const mugB = new THREE.Mesh(new THREE.CircleGeometry(0.036, 24), cer); mugB.rotation.x = -Math.PI / 2; mugB.position.set(3.82, 0.812, 0.52); scene.add(mugB);
  const cof = new THREE.Mesh(new THREE.CircleGeometry(0.037, 24), M({ color: 0x2a160a, roughness: 0.15 })); cof.rotation.x = -Math.PI / 2; cof.position.set(3.82, 0.895, 0.52); scene.add(cof);
  const hdl = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.006, 8, 16, Math.PI), cer); hdl.rotation.z = -Math.PI / 2; hdl.position.set(3.86, 0.862, 0.52); scene.add(hdl);
  const nb = new THREE.Group(); const cover = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.016, 0.27, 2, 0.005), M({ color: 0x3a1a12, roughness: 0.6 })); nb.add(cover);
  const pages = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.012, 0.262), M({ color: 0xefe7d2 })); pages.position.x = 0.006; nb.add(pages);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.018, 0.272), M({ color: 0x111111 })); strap.position.x = 0.075; nb.add(strap);
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.15, 10), M({ color: 0x101010, metalness: 0.4, roughness: 0.3 })); pen.rotation.set(Math.PI / 2, 0, 0.3); pen.position.set(0.0, 0.014, 0.0); nb.add(pen);
  const nib = new THREE.Mesh(new THREE.ConeGeometry(0.005, 0.02, 10), brassD); nib.rotation.set(Math.PI / 2, 0, 0.3); nib.position.set(-0.022, 0.014, 0.08); nib.rotation.x = Math.PI / 2; nb.add(nib);
  nb.position.set(3.76, 0.818, 1.0); nb.rotation.y = 0.25; nb.traverse((o) => { o.castShadow = true; }); scene.add(nb);
  const mg = new THREE.Group(); const lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 10, 36), brassD); mg.add(lensRing);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.05, 32), new THREE.MeshStandardMaterial({ color: 0xcfe0ea, transparent: true, opacity: 0.22, roughness: 0.02, metalness: 0.3 })); mg.add(lens);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.014, 0.12, 12), M({ color: 0x2a1408, roughness: 0.35 })); handle.position.y = -0.12; mg.add(handle);
  const fer = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.02, 12), brassD); fer.position.y = -0.065; mg.add(fer);
  mg.rotation.set(-Math.PI / 2, 0, 0.9); mg.position.set(2.62, 0.82, 1.0); scene.add(mg); }
{ // a laptop built part by part: rounded aluminium shell, recessed keyboard with real key layout, trackpad, speaker grilles, hinge, bezel, webcam
  const g = new THREE.Group();
  const alu = M({ color: 0x8d939a, metalness: 0.75, roughness: 0.32 }), aluDark = M({ color: 0x6f757c, metalness: 0.7, roughness: 0.4 });
  const rb = (w, h, d, r, mat, x, y, z, parent) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
  // base shell (top surface at y = 0.011) and rubber feet
  rb(0.6, 0.022, 0.42, 0.009, alu, 0, 0, 0, g);
  for (const [fx, fz] of [[-0.25, -0.17], [0.25, -0.17], [-0.25, 0.17], [0.25, 0.17]]) { const ft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.004, 16), M({ color: 0x111111, roughness: 0.9 })); ft.position.set(fx, -0.012, fz); g.add(ft); }
  // thumb notch, drawn as a shadowed groove on the front edge
  const notch = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.007), new THREE.MeshBasicMaterial({ color: 0x3a3e43 })); notch.position.set(0, 0.006, 0.2102); g.add(notch);
  // recessed keyboard well
  const well = new THREE.Mesh(new THREE.PlaneGeometry(0.515, 0.2), new THREE.MeshBasicMaterial({ color: 0x0c0d0f })); well.rotation.x = -Math.PI / 2; well.position.set(0, 0.0112, -0.095); g.add(well);
  // keys: an instanced mesh laid out like a real keyboard (function row, number row, QWERTY, home, shift, space row)
  const U = 0.5 / 14.5, GAP = 0.0042, rows = [
    { z: -0.183, d: 0.015, w: Array(14).fill(14.5 / 14) },
    { z: -0.155, d: 0.027, w: [...Array(13).fill(1), 1.5] },
    { z: -0.124, d: 0.027, w: [1.5, ...Array(12).fill(1), 1] },
    { z: -0.093, d: 0.027, w: [1.75, ...Array(11).fill(1), 1.75] },
    { z: -0.062, d: 0.027, w: [2.25, ...Array(10).fill(1), 2.25] },
    { z: -0.031, d: 0.027, w: [1, 1, 1.25, 1.25, 5, 1.25, 1.25, 1, 1.5] }];
  const keys = []; rows.forEach((r) => { let x = -0.25; r.w.forEach((u) => { const w = u * U; keys.push([x + w / 2, r.z, w - GAP, r.d]); x += w; }); });
  const keyMat = M({ color: 0x1b1c1f, roughness: 0.55 }), kGeo = new RoundedBoxGeometry(1, 1, 1, 2, 0.12);
  const km = new THREE.InstancedMesh(kGeo, keyMat, keys.length), mtx = new THREE.Matrix4();
  keys.forEach(([x, z, w, d], i) => { mtx.compose(new THREE.Vector3(x, 0.0145, z), new THREE.Quaternion(), new THREE.Vector3(w, 0.005, d)); km.setMatrixAt(i, mtx); });
  km.castShadow = true; g.add(km);
  // faint key legends and keyboard backlight, drawn once on a texture laid just above the keys
  const legend = tex(1024, 420, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(190,225,220,0.55)'; c.font = '600 15px Inter, sans-serif'; c.textAlign = 'center';
    const L = ['', '1234567890-=⌫', '⇥QWERTYUIOP[]', 'ASDFGHJKL;\'', 'ZXCVBNM,./', '']; const sx = (x) => (x + 0.2575) / 0.515 * w, sz = (z) => (z + 0.195) / 0.2 * h; let k = 0;
    rows.forEach((r, ri) => { r.w.forEach((u, ci) => { const [x, z] = keys[k++]; const ch = ri === 3 ? L[3][ci - 1] : ri === 4 ? L[4][ci - 1] : ri === 2 ? L[2][ci] : ri === 1 ? L[1][ci] : ''; if (ch) c.fillText(ch, sx(x), sz(z) + 5); }); }); });
  const lg = new THREE.Mesh(new THREE.PlaneGeometry(0.515, 0.2), new THREE.MeshBasicMaterial({ map: legend, transparent: true, depthWrite: false })); lg.rotation.x = -Math.PI / 2; lg.position.set(0, 0.0172, -0.095); g.add(lg);
  // trackpad: a slightly darker glass panel with a thin chamfer
  rb(0.17, 0.002, 0.1, 0.0009, M({ color: 0x7c8289, metalness: 0.5, roughness: 0.22 }), 0, 0.0115, 0.105, g);
  // speaker grilles either side of the keyboard
  const grille = tex(64, 400, (c, w, h) => { c.fillStyle = '#7f858c'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a2c30'; for (let yy = 8; yy < h; yy += 12) for (let xx = 8; xx < w; xx += 12) { c.beginPath(); c.arc(xx + ((yy / 12) % 2) * 5, yy, 2.4, 0, 7); c.fill(); } });
  for (const sx of [-0.278, 0.278]) { const gr = new THREE.Mesh(new THREE.PlaneGeometry(0.026, 0.19), M({ map: grille, metalness: 0.5, roughness: 0.45 })); gr.rotation.x = -Math.PI / 2; gr.position.set(sx, 0.0113, -0.095); g.add(gr); }
  // hinge barrel along the back edge
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.46, 20), aluDark); hinge.rotation.z = Math.PI / 2; hinge.position.set(0, 0.006, -0.205); g.add(hinge);
  // lid: shell, black glass bezel, screen, webcam, and a status LED on the deck
  const lid = new THREE.Group(); rb(0.6, 0.4, 0.012, 0.009, alu, 0, 0.2, 0, lid);
  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(0.585, 0.388), M({ color: 0x050607, roughness: 0.15, metalness: 0.3 })); bezel.position.set(0, 0.2, 0.0062); lid.add(bezel);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.344), new THREE.MeshBasicMaterial({ map: screenTex })); scr.position.set(0, 0.206, 0.0066); lid.add(scr);
  const cam = new THREE.Mesh(new THREE.CircleGeometry(0.0035, 16), new THREE.MeshBasicMaterial({ color: 0x1d2a30 })); cam.position.set(0, 0.389, 0.0066); lid.add(cam);
  const camRing = new THREE.Mesh(new THREE.RingGeometry(0.0035, 0.0048, 16), new THREE.MeshBasicMaterial({ color: 0x2c3237 })); camRing.position.set(0.0, 0.389, 0.0065); lid.add(camRing);
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.0022, 12), new THREE.MeshBasicMaterial({ color: 0x9fffe8 })); led.rotation.x = -Math.PI / 2; led.position.set(0.012, 0.0114, -0.198); g.add(led);
  lid.position.set(0, 0.006, -0.205); lid.rotation.x = -0.25; g.add(lid);
  g.position.set(3.1, 0.822, 0.8); g.rotation.y = -0.5; clue('laptop', g, { pos: [2.3, 1.45, 1.8], look: [3.1, 0.95, 0.8] });
  const glow = new THREE.PointLight(0x7fd3c8, 0.5, 2.2); glow.position.set(2.9, 1.1, 1.0); scene.add(glow); }
{ const lamp = new THREE.Group(); const iron = M({ color: 0x1a1a1a, metalness: 0.6, roughness: 0.4 }), brassL = M({ color: 0x9a7436, metalness: 0.85, roughness: 0.28 });
  const base = new THREE.Mesh(new THREE.LatheGeometry(V2([[0, 0], [0.2, 0], [0.21, 0.015], [0.19, 0.035], [0.12, 0.06], [0.06, 0.09], [0.03, 0.12], [0, 0.12]]), 40), iron); base.castShadow = true; lamp.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.017, 1.42, 16), iron); pole.position.y = 0.83; pole.castShadow = true; lamp.add(pole);
  for (const y of [0.13, 0.62, 1.1, 1.52]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.03, 18), brassL); r.position.y = y; lamp.add(r); }
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.08, 18), brassL); sock.position.y = 1.58; lamp.add(sock);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.042, 20, 16), new THREE.MeshBasicMaterial({ color: 0xffe6b8 })); bulb.scale.y = 1.3; bulb.position.y = 1.67; lamp.add(bulb);
  const harp = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.005, 6, 28, Math.PI), brassL); harp.scale.y = 2.6; harp.position.y = 1.6; lamp.add(harp);
  const shade = new THREE.Mesh(new THREE.LatheGeometry(V2([[0.3, 0], [0.285, 0.08], [0.24, 0.2], [0.15, 0.32]]), 64), M({ map: pleatTex, color: 0xe0c08a, side: THREE.DoubleSide, emissive: 0x6a4a20, emissiveIntensity: 0.7, emissiveMap: pleatTex, roughness: 0.95 })); shade.position.y = 1.54; lamp.add(shade);
  for (const [r, y] of [[0.3, 1.54], [0.15, 1.86]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 6, 64), M({ color: 0x8a6a3a, roughness: 0.6 })); t.rotation.x = Math.PI / 2; t.position.y = y; lamp.add(t); }
  const fin = new THREE.Mesh(new THREE.SphereGeometry(0.022, 14, 10), brassL); fin.position.y = 1.885; lamp.add(fin);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.14, 4), brassL); chain.position.set(0.03, 1.5, 0); lamp.add(chain); const bead = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), brassL); bead.position.set(0.03, 1.43, 0); lamp.add(bead);
  lamp.position.set(4.2, 0, 0.2); scene.add(lamp); const l = new THREE.PointLight(0xffc98a, 2.2, 6, 1.5); l.position.set(4.2, 1.6, 0.2); l.castShadow = true; scene.add(l); }
scene.add(new THREE.HemisphereLight(0x8090b0, 0x2a1a10, 0.75));
{ const c = new THREE.PointLight(0xffd9a8, 2.4, 11, 1.4); c.position.set(0, 3.8, 0.5); scene.add(c); }

// ---------------------------------------------------------------- camera, hover, click
const HOME = { pos: new THREE.Vector3(0, 1.75, 4.4), look: new THREE.Vector3(0, 1.45, -2.2) };
const cam = { pos: HOME.pos.clone(), look: HOME.look.clone() }; const goal = { pos: HOME.pos.clone(), look: HOME.look.clone() };
camera.position.copy(cam.pos);
function focusOn(key) {
  const f = key && clues[key] ? clues[key].userData.focus : null;
  goal.pos.copy(f ? new THREE.Vector3(...f.pos) : HOME.pos); goal.look.copy(f ? new THREE.Vector3(...f.look) : HOME.look);
  if (f && innerWidth > 760) { const side = new THREE.Vector3().subVectors(goal.look, goal.pos).cross(new THREE.Vector3(0, 1, 0)).normalize(); goal.pos.addScaledVector(side, 0.35); goal.look.addScaledVector(side, 0.35); }   // leave room for the panel
}
const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2(9, 9); let hovered = null, started = false; const deduce = $('deduce');
function pick() { ray.setFromCamera(mouse, camera); const hit = ray.intersectObjects(Object.values(clues), true)[0]; if (!hit) return null; let o = hit.object; while (o && !o.userData.clue) o = o.parent; return o ? o.userData.clue : null; }
function setGlow(key, on) { clues[key]?.traverse((o) => { if (o.isMesh && o.material.emissive) { o.material.emissive.setHex(on ? 0x3a2a10 : 0x000000); } }); }
addEventListener('pointermove', (e) => {
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); const ln = $('lens'); document.body.classList.add('moved'); ln.style.left = e.clientX + 'px'; ln.style.top = e.clientY + 'px'; if (!started || current) return;
  const k = pick(); $('lens').classList.toggle('hot', !!k);
  if (k !== hovered) { if (hovered) setGlow(hovered, false); hovered = k; if (k) { setGlow(k, true); deduce.innerHTML = CLUES[k].deduce.map((s, i) => `<span style="animation-delay:${i * 0.12}s">${s}</span>`).join(''); } deduce.classList.toggle('on', !!k); }
  if (k) { deduce.style.left = Math.min(e.clientX + 22, innerWidth - 300) + 'px'; deduce.style.top = (e.clientY - 10) + 'px'; }
});
let AC = null;
function audio() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; } return AC; }
// ---- sound: a clue chime, the door, and a slow mysterious score (all made in the browser; nothing to download)
let master = null, musicGain = null, musicOn = true, musicStarted = false;
function out() { if (!audio()) return null; if (!master) { master = AC.createGain(); master.gain.value = 0.9; master.connect(AC.destination); } return master; }
function chime() {                    // soft two-note bell when a clue opens
  const o = out(); if (!o) return; const now = AC.currentTime;
  [[1318.5, 0], [987.8, 0.09]].forEach(([f, dt]) => { const osc = AC.createOscillator(), g = AC.createGain(); osc.type = 'sine'; osc.frequency.value = f; g.gain.setValueAtTime(0.0001, now + dt); g.gain.exponentialRampToValueAtTime(0.12, now + dt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + dt + 0.9); osc.connect(g).connect(o); osc.start(now + dt); osc.stop(now + dt + 1); });
}
function door() {                     // the way in: a low thud and a rising shimmer
  const o = out(); if (!o) return; const now = AC.currentTime;
  const th = AC.createOscillator(), tg = AC.createGain(); th.frequency.setValueAtTime(90, now); th.frequency.exponentialRampToValueAtTime(45, now + 0.4); tg.gain.setValueAtTime(0.5, now); tg.gain.exponentialRampToValueAtTime(0.001, now + 0.6); th.connect(tg).connect(o); th.start(now); th.stop(now + 0.7);
  [440, 523.25, 659.25].forEach((f, i) => { const osc = AC.createOscillator(), g = AC.createGain(); osc.type = 'triangle'; osc.frequency.value = f; const t0 = now + 0.15 + i * 0.12; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6); osc.connect(g).connect(o); osc.start(t0); osc.stop(t0 + 1.7); });
}
function startMusic() {               // drone in D minor, slow bell phrases, rain on the glass, a crackling fire
  const o = out(); if (!o || musicStarted) return; musicStarted = true; const now = AC.currentTime;
  musicGain = AC.createGain(); musicGain.gain.setValueAtTime(0.0001, now); musicGain.gain.exponentialRampToValueAtTime(musicOn ? 0.55 : 0.0001, now + 4); musicGain.connect(o);
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.7; lp.connect(musicGain);
  const lfo = AC.createOscillator(), lfoG = AC.createGain(); lfo.frequency.value = 0.05; lfoG.gain.value = 180; lfo.connect(lfoG).connect(lp.frequency); lfo.start();
  [[73.42, 'sawtooth', 0.05], [73.9, 'sawtooth', 0.05], [110, 'triangle', 0.06], [146.83, 'sine', 0.04]].forEach(([f, type, v]) => { const osc = AC.createOscillator(), g = AC.createGain(); osc.type = type; osc.frequency.value = f; g.gain.value = v; osc.connect(g).connect(lp); osc.start(); });
  const noise = (secs) => { const b = AC.createBuffer(1, AC.sampleRate * secs, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; };
  const rain = AC.createBufferSource(); rain.buffer = noise(4); rain.loop = true; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.6; const rg = AC.createGain(); rg.gain.value = 0.05; rain.connect(bp).connect(rg).connect(musicGain); rain.start();
  const echo = AC.createDelay(2); echo.delayTime.value = 0.55; const fb = AC.createGain(); fb.gain.value = 0.38; echo.connect(fb).connect(echo); echo.connect(musicGain);
  const scale = [293.66, 349.23, 392, 440, 466.16, 523.25, 587.33];             // D minor, with the dark B flat
  (function phrase() { if (!musicStarted) return; const t0 = AC.currentTime + 0.1, n = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) { const f = scale[Math.floor(Math.random() * scale.length)] / (Math.random() < 0.3 ? 2 : 1), osc = AC.createOscillator(), g = AC.createGain(); osc.type = 'sine'; osc.frequency.value = f; const t = t0 + k * (0.6 + Math.random() * 0.5);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4); osc.connect(g); g.connect(musicGain); g.connect(echo); osc.start(t); osc.stop(t + 2.5); }
    setTimeout(phrase, 5000 + Math.random() * 6000); })();
  (function crackle() { if (!musicStarted) return; const t = AC.currentTime, src = AC.createBufferSource(); src.buffer = noise(0.03); const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1500; const g = AC.createGain(); g.gain.setValueAtTime(0.05 + Math.random() * 0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); src.connect(hp).connect(g).connect(musicGain); src.start(t); setTimeout(crackle, 80 + Math.random() * 700); })();
}
function setMusic(on) { musicOn = on; $('soundBtn').textContent = on ? '♪ Sound on' : '♪ Sound off'; $('soundBtn').setAttribute('aria-pressed', String(on)); if (master) master.gain.setTargetAtTime(on ? 0.9 : 0, AC.currentTime, 0.3); }
function thunder() {
  if (!AC || AC.state !== 'running') return; const now = AC.currentTime + 0.25 + Math.random() * 0.6, dur = 3.5 + Math.random() * 2, len = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(2, len, AC.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); let last = 0; for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; const env = Math.min(1, i / (AC.sampleRate * 0.04)) * Math.pow(1 - i / len, 2.2) * (0.6 + 0.4 * Math.sin(i / AC.sampleRate * (3 + ch) * Math.PI)); d[i] = last * 9 * env; } }
  const src = AC.createBufferSource(); src.buffer = buf; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; const g = AC.createGain(); g.gain.value = 0.85;
  src.connect(lp).connect(g).connect(AC.destination); src.start(now);
}
function bang() {
  if (!audio()) return;
  const now = AC.currentTime, len = AC.sampleRate * 0.6, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
  const src = AC.createBufferSource(); src.buffer = buf; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(9000, now); lp.frequency.exponentialRampToValueAtTime(700, now + 0.25);
  const g = AC.createGain(); g.gain.setValueAtTime(0.9, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.55); src.connect(lp).connect(g).connect(AC.destination); src.start(now);
  const o = AC.createOscillator(), og = AC.createGain(); o.frequency.setValueAtTime(140, now); o.frequency.exponentialRampToValueAtTime(40, now + 0.18); og.gain.setValueAtTime(0.8, now); og.gain.exponentialRampToValueAtTime(0.001, now + 0.25); o.connect(og).connect(AC.destination); o.start(now); o.stop(now + 0.3);
}
function shootSmiley() {                      // the easter egg: one more bullet hole in the smiley, and the room flinches
  ray.setFromCamera(mouse, camera); const h = ray.intersectObject(smiley)[0]; if (!h) return false;
  const c = smileyTex.image.getContext('2d'), x = h.uv.x * 512, y = (1 - h.uv.y) * 512; c.fillStyle = '#0b0b0b'; c.beginPath(); c.arc(x, y, 10, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 2; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + (Math.random() - .5) * 46, y + (Math.random() - .5) * 46); c.stroke(); }
  smileyTex.needsUpdate = true; bang(); flash = 0.6; shake = 0.25; deduce.innerHTML = '<span>Bored.</span>'; deduce.classList.add('on'); setTimeout(() => deduce.classList.remove('on'), 1200); return true;
}
let shake = 0;
canvas.addEventListener('click', () => { if (!started) return; if (!current && shootSmiley()) return; const k = pick(); if (k) { deduce.classList.remove('on'); openClue(k); } else if (current) closeClue(); });

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 68 : 50; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; const clockEl = $('clock'); let t0 = performance.now();
function loop(now) {
  if (globe) globe.rotation.y = now * 0.00008;
  const t = (now - t0) / 1000;
  const par = (!current && started) ? 0.18 : 0; const target = goal.pos.clone().add(new THREE.Vector3(mouse.x * par * (Math.abs(mouse.x) < 2 ? 1 : 0), mouse.y * par * 0.5 * (Math.abs(mouse.y) < 2 ? 1 : 0), 0));
  const k = reduce ? 1 : 0.06; cam.pos.lerp(target, k); cam.look.lerp(goal.look, k); camera.position.copy(cam.pos); if (shake > 0.01) { camera.position.x += (Math.random() - .5) * shake * 0.2; camera.position.y += (Math.random() - .5) * shake * 0.2; shake *= 0.85; } camera.lookAt(cam.look);
  if (!started && !reduce) { camera.position.x += Math.sin(t * 0.25) * 0.4; camera.lookAt(cam.look); }
  fireLight.intensity = 5 + Math.sin(t * 9) * 0.6 + Math.sin(t * 23) * 0.4;
  winGroup.userData.rain.material.map.offset.y = (t * 0.35) % 1;
  if (!reduce && Math.random() < 0.0025) { flash = 1; if (started) thunder(); } flash *= 0.9; skyMat.color.setScalar(1 + flash * 2.5); coolLight.intensity = 3 + flash * 25;
  const dp = dust.geometry.attributes.position; for (let i = 0; i < dp.count; i++) { let y = dp.getY(i) + Math.sin(t * 0.3 + i * 1.7) * 0.0009 - 0.0004; if (y < 0) y = 3.8; dp.setY(i, y); dp.setX(i, dp.getX(i) + Math.sin(t * 0.21 + i) * 0.0009); dp.setZ(i, dp.getZ(i) + Math.cos(t * 0.17 + i * 0.5) * 0.0007); } dp.needsUpdate = true;
  palace.visible = palaceOn && started && !current;
  if (palace.visible) palace.children.forEach((sp) => { const u = sp.userData; u.a += u.sp * 0.016; sp.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t * 0.6 + u.r) * 0.08, -1.2 + Math.sin(u.a) * u.r * 0.7); }); fireU.uT.value = t; flames.forEach((f, i) => { f.scale.y = 0.92 + 0.12 * Math.sin(t * (3 + i * 0.7) + i); }); flames.bed.material.opacity = 0.75 + 0.2 * Math.sin(t * 3.1);
  { const sp = sparks.geometry.attributes.position, L = sparks.userData.life; for (let i = 0; i < sp.count; i++) { L[i] += 0.008 + (i % 5) * 0.002; if (L[i] > 1) { L[i] = 0; sp.setXYZ(i, (Math.random() - .5) * 0.5, 0.15, -3.6 + (Math.random() - .5) * 0.1); } else sp.setXYZ(i, sp.getX(i) + Math.sin(t * 4 + i) * 0.002, 0.15 + L[i] * 1.3, sp.getZ(i)); } sp.needsUpdate = true; }
  renderer.render(scene, camera); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
// deep links: ?enter skips the title card; ?clue=<key> opens one object (handy for sharing a single section)
{ const q = new URLSearchParams(location.search); if (q.has('enter') || q.has('clue')) { $('intro').style.display = 'none'; started = true; document.body.classList.add('entered'); cam.pos.copy(goal.pos); }
  if (q.has('still')) document.documentElement.classList.add('still');
  if (q.get('clue') && CLUES[q.get('clue')]) { openClue(q.get('clue')); if (q.has('still')) { cam.pos.copy(goal.pos); cam.look.copy(goal.look); } } }

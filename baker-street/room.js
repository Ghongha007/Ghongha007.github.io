// The study at 221B, built entirely in code (no model files): every clickable object opens one part of the portfolio.
import * as THREE from 'three';
import { PERSON, CLUES } from './data.js';

const $ = (id) => document.getElementById(id);
const canvas = $('room');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch (e) { renderer = null; }
const ORDER = ['violin', 'shelf', 'board', 'laptop', 'frame', 'skull', 'newspaper', 'window'];

// ---------------------------------------------------------------- UI: intro, panel, index, lock
const lines = ['Subject: <b>Dipti Yadav</b>.', 'Occupation: <b>OSINT journalist</b>. Satellites, ships, shell companies.', 'Status: <b>investigating</b>. Always.'];
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
  current = key; $('panelKicker').textContent = `CLUE ${String(ORDER.indexOf(key) + 1).padStart(2, '0')} / ${ORDER.length}`;
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
$('listBtn').onclick = () => toggleIndex(); $('fallback').onclick = () => toggleIndex(true);
$('enter').onclick = () => { $('intro').classList.add('gone'); started = true; };
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
const corkTex = tex(768, 512, (g, w, h) => {
  g.fillStyle = '#9b7046'; g.fillRect(0, 0, w, h); for (let i = 0; i < 7000; i++) { g.fillStyle = `rgba(${rnd() > .5 ? '60,35,15' : '210,170,120'},${rnd() * 0.35})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  const pins = [];
  const notes = ['SHADOW FLEET', 'IRAN SOLAR', 'MYANMAR AIR', 'XINJIANG', 'FISHERMEN DATA', 'SHIP TRACKS', 'SEA ASSAULTS'];
  notes.forEach((n, i) => {
    const x = 70 + (i % 4) * 175 + rnd() * 30, y = 60 + Math.floor(i / 4) * 230 + rnd() * 40; pins.push([x + 55, y + 8]);
    g.save(); g.translate(x + 60, y + 70); g.rotate((rnd() - .5) * 0.2); g.fillStyle = i % 3 ? '#efe6d2' : '#dfe8ef'; g.fillRect(-60, -70, 120, 140);
    g.fillStyle = '#333'; g.fillRect(-48, -56, 96, 62); g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(-48, -56, 96, 62);
    g.fillStyle = '#2a2420'; g.font = 'bold 13px monospace'; g.textAlign = 'center'; g.fillText(n, 0, 32); g.fillRect(-40, 44, 80, 3); g.fillRect(-40, 52, 60, 3); g.restore();
  });
  g.strokeStyle = '#c8202a'; g.lineWidth = 3; g.beginPath(); for (let i = 0; i < pins.length; i++) { const [a, b] = pins[i], [c, d] = pins[(i + 2) % pins.length]; g.moveTo(a, b); g.lineTo(c, d); } g.stroke();
  for (const [x, y] of pins) { g.fillStyle = '#d02020'; g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); }
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
const certTex = tex(400, 300, (g, w, h) => {
  g.fillStyle = '#f2ead6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a6a3a'; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28);
  g.fillStyle = '#3a2a18'; g.textAlign = 'center'; g.font = 'italic 22px Georgia'; g.fillText('Master of Arts', w / 2, 92); g.font = 'bold 17px Georgia'; g.fillText('International Relations,', w / 2, 140); g.fillText('Security & Strategy', w / 2, 164);
  g.font = '14px Georgia'; g.fillText('O.P. Jindal Global University', w / 2, 210); g.fillStyle = '#a32'; g.beginPath(); g.arc(w - 70, h - 62, 22, 0, Math.PI * 2); g.fill();
});
const screenTex = tex(512, 320, (g, w, h) => {
  g.fillStyle = '#0b1210'; g.fillRect(0, 0, w, h); g.font = '18px monospace'; g.fillStyle = '#7fd3c8';
  ['$ gh repo list Ghongha007', 'aitrace       verify-mcp', 'chat2net      groundline', 'osint-skills  india-osint', 'china-osint   russia-osint', '$ _'].forEach((l, i) => g.fillText(l, 22, 40 + i * 42));
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
const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.9), M({ map: rugTex, roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.01, -0.6); rug.receiveShadow = true; scene.add(rug);

const clues = {};            // key -> Group (raycast targets)
const clue = (key, g, focus) => { g.userData.clue = key; g.userData.focus = focus; clues[key] = g; scene.add(g); return g; };

// fireplace, with the skull and headphones on the mantel
const stone = M({ color: 0x3a3632, roughness: 0.9 });
box(2.4, 1.3, 0.4, stone, 0, 0.65, -3.8); box(1.3, 0.9, 0.42, M({ color: 0x060606 }), 0, 0.45, -3.78); box(2.9, 0.12, 0.6, M({ color: 0x2b211a, roughness: 0.5 }), 0, 1.36, -3.72);
const fireLight = new THREE.PointLight(0xff8a3a, 6, 7, 1.6); fireLight.position.set(0, 0.5, -3.2); fireLight.castShadow = true; scene.add(fireLight);
const flames = []; for (let i = 0; i < 7; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.09 + rnd() * 0.06, 0.35 + rnd() * 0.25, 8), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff7a1a : 0xffc04a, transparent: true, opacity: 0.85 })); f.position.set(-0.4 + i * 0.13, 0.25, -3.62); scene.add(f); flames.push(f); }
{ const g = new THREE.Group(); const bone = M({ color: 0xe9e0c8, roughness: 0.55 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 18), bone); head.scale.set(1, 0.95, 1.15); head.position.y = 0.2; g.add(head);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.16), bone); jaw.position.set(0, 0.06, 0.07); g.add(jaw);
  for (const sx of [-0.06, 0.06]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), M({ color: 0x050505 })); eye.position.set(sx, 0.2, 0.17); g.add(eye); }
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 8, 30, Math.PI), M({ color: 0x111111, roughness: 0.4 })); band.position.y = 0.2; g.add(band);
  for (const sx of [-0.2, 0.2]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 20), M({ color: 0x151515, roughness: 0.4 })); cup.rotation.z = Math.PI / 2; cup.position.set(sx, 0.2, 0); g.add(cup); }
  g.position.set(-0.75, 1.42, -3.65); g.rotation.y = 0.35; clue('skull', g, { pos: [-0.5, 1.75, -2.4], look: [-0.75, 1.55, -3.65] }); }
{ const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 28), M({ color: 0xd8cfb8 })); clock.rotation.x = Math.PI / 2; clock.position.set(0.7, 1.6, -3.66); scene.add(clock);
  box(0.4, 0.5, 0.12, M({ color: 0x2b211a }), 0.7, 1.62, -3.72); }
// the smiley on the wall, bullet holes and all
{ const s = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshStandardMaterial({ map: smileyTex, transparent: true, roughness: 0.9 })); s.position.set(2.75, 2.25, -RD / 2 + 0.01); scene.add(s); }
// the framed certificate
{ const g = new THREE.Group(); box(1.0, 0.78, 0.05, M({ color: 0x3b2a12, roughness: 0.4, metalness: 0.3 }), 0, 0, 0, g);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.64), M({ map: certTex })); p.position.z = 0.03; g.add(p); g.position.set(-2.7, 2.4, -RD / 2 + 0.04); clue('frame', g, { pos: [-2.6, 2.3, -2.2], look: [-2.7, 2.35, -4] }); }
// bookshelf on the left wall
{ const g = new THREE.Group(); box(0.5, 2.8, 2.2, M({ color: 0x2a1c12, roughness: 0.7 }), 0, 1.4, 0, g);
  const books = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.5), M({ map: bookTex })); books.rotation.y = Math.PI / 2; books.position.set(0.26, 1.4, 0); g.add(books);
  g.position.set(-RW / 2 + 0.26, 0, -2.3); clue('shelf', g, { pos: [-2.6, 1.7, -1.8], look: [-4.7, 1.5, -2.3] }); }
// window on the left wall, London at night
{ const g = new THREE.Group(); const view = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshBasicMaterial({ map: nightTex })); g.add(view);
  const fr = M({ color: 0xd9d2c0, roughness: 0.5 }); box(1.62, 0.07, 0.08, fr, 0, 0.98, 0.03, g); box(1.62, 0.07, 0.08, fr, 0, -0.98, 0.03, g); box(0.07, 2.0, 0.08, fr, -0.78, 0, 0.03, g); box(0.07, 2.0, 0.08, fr, 0.78, 0, 0.03, g); box(1.6, 0.05, 0.06, fr, 0, 0.1, 0.03, g); box(0.05, 1.9, 0.06, fr, 0, 0, 0.03, g);
  const cur = M({ color: 0x4a1418, roughness: 1 }); box(0.45, 2.5, 0.08, cur, -1.0, 0, 0.08, g); box(0.45, 2.5, 0.08, cur, 1.0, 0, 0.08, g);
  g.rotation.y = Math.PI / 2; g.position.set(-RW / 2 + 0.02, 2.1, 0.9); clue('window', g, { pos: [-2.2, 2.0, 0.9], look: [-5, 2.0, 0.9] });
  const cool = new THREE.SpotLight(0x7ea6ff, 3, 9, 0.6, 0.6); cool.position.set(-4.8, 2.3, 0.9); cool.target.position.set(0, 0, 0.5); scene.add(cool, cool.target); }
// the case wall on the right
{ const g = new THREE.Group(); box(2.6, 1.75, 0.06, M({ color: 0x3a2814 }), 0, 0, 0, g); const c = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 1.6), M({ map: corkTex, roughness: 1 })); c.position.z = 0.04; g.add(c);
  g.rotation.y = -Math.PI / 2; g.position.set(RW / 2 - 0.04, 2.15, -1.6); clue('board', g, { pos: [2.4, 2.1, -1.6], look: [5, 2.1, -1.6] }); }
// armchairs: black leather and a red one, facing the fire
function chair(color, x, z, ry) {
  const g = new THREE.Group(); const m = M({ color, roughness: color === 0x141414 ? 0.35 : 0.9 }); box(0.95, 0.45, 0.9, m, 0, 0.32, 0, g); box(0.95, 0.85, 0.2, m, 0, 0.85, -0.38, g);
  box(0.18, 0.35, 0.9, m, -0.48, 0.65, 0, g); box(0.18, 0.35, 0.9, m, 0.48, 0.65, 0, g); for (const [a, b] of [[-0.4, -0.35], [0.4, -0.35], [-0.4, 0.35], [0.4, 0.35]]) box(0.06, 0.1, 0.06, M({ color: 0x1a120a }), a, 0.05, b, g);
  g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); return g;
}
chair(0x141414, -1.35, -1.2, 0.55); chair(0x7a1d1c, 1.35, -1.2, -0.55);
// the violin, resting on the black chair
{ const g = new THREE.Group(); const wood = M({ color: 0x8a3b12, roughness: 0.35, metalness: 0.05 });
  const lower = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), wood); lower.scale.set(1, 0.32, 1.25); g.add(lower); const upper = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), wood); upper.scale.set(1, 0.32, 1.2); upper.position.z = -0.27; g.add(upper);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.34), M({ color: 0x111111, roughness: 0.4 })); neck.position.set(0, 0.03, -0.5); g.add(neck);
  const scroll = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.012, 6, 12), wood); scroll.position.set(0, 0.04, -0.69); g.add(scroll);
  const bow = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.75, 6), M({ color: 0x2a1a0a })); bow.rotation.set(Math.PI / 2, 0, 0.5); bow.position.set(0.12, 0.05, -0.2); g.add(bow);
  g.position.set(-1.33, 0.6, -1.15); g.rotation.set(-0.15, 0.4, 0.1); clue('violin', g, { pos: [-0.6, 1.4, 0.2], look: [-1.33, 0.6, -1.15] }); }
// side table with the newspaper
box(0.6, 0.05, 0.6, M({ color: 0x2b211a, roughness: 0.4 }), 0, 0.55, -0.9); box(0.06, 0.55, 0.06, M({ color: 0x2b211a }), 0, 0.27, -0.9);
{ const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), M({ map: paperTex, side: THREE.DoubleSide })); p.rotation.x = -Math.PI / 2; g.add(p);
  g.position.set(0, 0.585, -0.9); g.rotation.y = 0.25; clue('newspaper', g, { pos: [0.1, 1.35, 0.1], look: [0, 0.58, -0.9] }); }
// desk and laptop, front right
box(1.6, 0.06, 0.8, M({ color: 0x3a2716, roughness: 0.45 }), 3.2, 0.78, 0.8); for (const [a, b] of [[2.5, 0.5], [3.9, 0.5], [2.5, 1.1], [3.9, 1.1]]) box(0.06, 0.78, 0.06, M({ color: 0x2b1c10 }), a, 0.39, b);
{ const g = new THREE.Group(); box(0.6, 0.03, 0.42, M({ color: 0x9aa0a6, metalness: 0.6, roughness: 0.3 }), 0, 0, 0, g);
  const lid = new THREE.Group(); box(0.6, 0.4, 0.02, M({ color: 0x9aa0a6, metalness: 0.6, roughness: 0.3 }), 0, 0.2, 0, lid); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.34), new THREE.MeshBasicMaterial({ map: screenTex })); scr.position.set(0, 0.2, 0.012); lid.add(scr);
  lid.position.z = -0.2; lid.rotation.x = -0.25; g.add(lid); g.position.set(3.1, 0.83, 0.8); g.rotation.y = -0.5; clue('laptop', g, { pos: [2.3, 1.45, 1.8], look: [3.1, 0.95, 0.8] });
  const glow = new THREE.PointLight(0x7fd3c8, 0.8, 2.2); glow.position.set(2.9, 1.1, 1.0); scene.add(glow); }
{ const lamp = new THREE.Group(); box(0.04, 1.6, 0.04, M({ color: 0x1a1a1a, metalness: 0.6 }), 0, 0.8, 0, lamp); const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.32, 24, 1, true), M({ color: 0xc9a46a, side: THREE.DoubleSide, emissive: 0x6a4a20, emissiveIntensity: 0.6 })); shade.position.y = 1.7; lamp.add(shade);
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
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); if (!started || current) return;
  const k = pick(); canvas.style.cursor = k ? 'pointer' : 'default';
  if (k !== hovered) { if (hovered) setGlow(hovered, false); hovered = k; if (k) { setGlow(k, true); deduce.innerHTML = CLUES[k].deduce.map((s, i) => `<span style="animation-delay:${i * 0.12}s">${s}</span>`).join(''); } deduce.classList.toggle('on', !!k); }
  if (k) { deduce.style.left = Math.min(e.clientX + 22, innerWidth - 300) + 'px'; deduce.style.top = (e.clientY - 10) + 'px'; }
});
canvas.addEventListener('click', () => { if (!started) return; const k = pick(); if (k) { deduce.classList.remove('on'); openClue(k); } else if (current) closeClue(); });

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 68 : 50; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; const clockEl = $('clock'); let t0 = performance.now();
function loop(now) {
  const t = (now - t0) / 1000;
  const par = (!current && started) ? 0.18 : 0; const target = goal.pos.clone().add(new THREE.Vector3(mouse.x * par * (Math.abs(mouse.x) < 2 ? 1 : 0), mouse.y * par * 0.5 * (Math.abs(mouse.y) < 2 ? 1 : 0), 0));
  const k = reduce ? 1 : 0.06; cam.pos.lerp(target, k); cam.look.lerp(goal.look, k); camera.position.copy(cam.pos); camera.lookAt(cam.look);
  if (!started && !reduce) { camera.position.x += Math.sin(t * 0.25) * 0.4; camera.lookAt(cam.look); }
  fireLight.intensity = 5 + Math.sin(t * 9) * 0.6 + Math.sin(t * 23) * 0.4; flames.forEach((f, i) => { f.scale.y = 0.8 + 0.3 * Math.sin(t * (6 + i) + i); });
  renderer.render(scene, camera); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
// deep links: ?enter skips the title card; ?clue=<key> opens one object (handy for sharing a single section)
{ const q = new URLSearchParams(location.search); if (q.has('enter') || q.has('clue')) { $('intro').style.display = 'none'; started = true; cam.pos.copy(goal.pos); }
  if (q.has('still')) document.documentElement.classList.add('still'); if (q.get('clue') && CLUES[q.get('clue')]) { openClue(q.get('clue')); if (q.has('still')) { cam.pos.copy(goal.pos); cam.look.copy(goal.look); } } }

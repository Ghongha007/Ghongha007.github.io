// The study at 221B, built entirely in code (no model files): every clickable object opens one part of the portfolio.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PERSON, CLUES } from './data.js';

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
$('listBtn').onclick = () => toggleIndex();
$('palaceBtn').onclick = () => { palaceOn = !palaceOn; $('palaceBtn').setAttribute('aria-pressed', String(palaceOn)); $('palaceBtn').textContent = palaceOn ? 'Hide mind palace' : 'Show mind palace'; }; $('fallback').onclick = () => toggleIndex(true);
$('enter').onclick = () => { $('intro').classList.add('gone'); started = true; document.body.classList.add('entered'); };
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

// the skull: cranium, cheekbones, sockets, nose, teeth, and the headphones it wears
{ const g = new THREE.Group(); const bone = M({ color: 0xe6dcc2, roughness: 0.55 }); const dark = M({ color: 0x0a0806, roughness: 1 });
  const cr = new THREE.Mesh(new THREE.SphereGeometry(0.17, 40, 30), bone); cr.scale.set(0.92, 0.95, 1.12); cr.position.set(0, 0.24, -0.03); g.add(cr);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 24), bone); face.scale.set(1.05, 0.95, 0.8); face.position.set(0, 0.17, 0.09); g.add(face);
  for (const sx of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), bone); cheek.position.set(sx * 0.085, 0.14, 0.12); g.add(cheek);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.042, 20, 14), dark); eye.scale.set(1, 0.9, 0.6); eye.position.set(sx * 0.055, 0.2, 0.175); g.add(eye);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.05, 3), dark); nose.rotation.x = Math.PI; nose.position.set(0, 0.135, 0.2); g.add(nose);
  const jaw = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.06, 0.12, 3, 0.02), bone); jaw.position.set(0, 0.07, 0.1); g.add(jaw);
  for (let i = 0; i < 8; i++) { const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.022, 0.01), M({ color: 0xf4efdf, roughness: 0.4 })); const a = (i - 3.5) * 0.17; tooth.position.set(Math.sin(a) * 0.065, 0.105, 0.105 + Math.cos(a) * 0.055); tooth.rotation.y = a; g.add(tooth); }
  const leather = M({ color: 0x141414, roughness: 0.35, metalness: 0.2 });
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.014, 10, 40, Math.PI), leather); band.position.set(0, 0.24, -0.02); g.add(band);
  for (const sx of [-1, 1]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 32), leather); cup.rotation.z = Math.PI / 2; cup.position.set(sx * 0.19, 0.22, -0.02); g.add(cup);
    const pad = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.016, 10, 24), M({ color: 0x2a2a2a, roughness: 0.9 })); pad.rotation.y = Math.PI / 2; pad.position.set(sx * 0.165, 0.22, -0.02); g.add(pad); }
  g.position.set(-0.75, 1.42, -3.6); g.rotation.y = 0.35; clue('skull', g, { pos: [-0.45, 1.75, -2.5], look: [-0.75, 1.6, -3.6] }); }
// mantel clock showing London time
const clockTex = document.createElement('canvas'); clockTex.width = clockTex.height = 256; const clockT = new THREE.CanvasTexture(clockTex); clockT.colorSpace = THREE.SRGBColorSpace;
function drawClock() { const g = clockTex.getContext('2d'), now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/London' })); g.fillStyle = '#efe6cf'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#3a2a18'; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.stroke();
  g.fillStyle = '#3a2a18'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillRect(128 + Math.sin(a) * 100 - 3, 128 - Math.cos(a) * 100 - 3, 6, 6); }
  const hand = (a, l, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(a) * l, 128 - Math.cos(a) * l); g.stroke(); };
  hand((now.getHours() % 12 + now.getMinutes() / 60) / 12 * Math.PI * 2, 58, 8); hand(now.getMinutes() / 60 * Math.PI * 2, 88, 5); g.strokeStyle = '#a32'; hand(now.getSeconds() / 60 * Math.PI * 2, 96, 2); clockT.needsUpdate = true; }
drawClock(); setInterval(drawClock, 1000);
{ const body = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.5, 0.14, 4, 0.05), M({ color: 0x2b1a0e, roughness: 0.35 })); body.position.set(0.72, 1.66, -3.7); scene.add(body);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.15, 40), M({ map: clockT, roughness: 0.4 })); face.position.set(0.72, 1.7, -3.62); scene.add(face); }
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
  const cur = M({ color: 0x4a1418, roughness: 1 }); for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 2.6, 16, 1, true, 0, Math.PI), cur); c.rotation.y = Math.PI; c.position.set(sx * 1.02, -0.05, 0.12); g.add(c); }
  box(2.6, 0.05, 0.05, M({ color: 0x8a6a3a, metalness: 0.6, roughness: 0.3 }), 0, 1.25, 0.16, g);
  g.position.set(-2.55, 2.15, -RD / 2 + 0.03); clue('window', g, { pos: [-2.3, 2.1, -1.2], look: [-2.55, 2.1, -4] }); var winGroup = g;
  const cool = new THREE.SpotLight(0x7ea6ff, 3, 9, 0.7, 0.6); cool.position.set(-2.55, 2.2, -3.6); cool.target.position.set(-1, 0, 0); scene.add(cool, cool.target); var coolLight = cool; }
// the framed certificate, on the right wall by the case board
{ const g = new THREE.Group(); box(0.86, 0.66, 0.05, M({ color: 0x3b2a12, roughness: 0.3, metalness: 0.4 }), 0, 0, 0, g);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.54), M({ map: certTex })); p.position.z = 0.03; g.add(p); g.rotation.y = -Math.PI / 2; g.position.set(RW / 2 - 0.04, 2.25, -3.35); clue('frame', g, { pos: [3.0, 2.2, -3.0], look: [5, 2.2, -3.35] }); }
// bookshelf on the left wall
{ const g = new THREE.Group(); box(0.5, 2.8, 2.2, M({ color: 0x2a1c12, roughness: 0.7 }), 0, 1.4, 0, g);
  const books = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.5), M({ map: bookTex })); books.rotation.y = Math.PI / 2; books.position.set(0.26, 1.4, 0); g.add(books);
  g.position.set(-RW / 2 + 0.26, 0, -2.6); clue('shelf', g, { pos: [-2.4, 1.7, -1.9], look: [-4.7, 1.5, -2.6] }); }
// the case wall on the right
{ const g = new THREE.Group(); box(2.4, 1.6, 0.06, M({ color: 0x3a2814 }), 0, 0, 0, g); const c = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 1.47), M({ map: corkTex, roughness: 1 })); c.position.z = 0.04; g.add(c);
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
  const c = document.createElement('canvas'); c.width = 512; c.height = 96; const g = c.getContext('2d'); g.font = '500 54px "IBM Plex Mono", monospace'; g.fillStyle = i % 3 ? '#ffffff' : '#e3b45a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(w, 256, 48);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0.85 })); s.scale.set(1.1, 0.2, 1);
  s.userData = { a: (i / 16) * Math.PI * 2, r: 1.6 + (i % 4) * 0.55, y: 1.2 + (i % 5) * 0.45, sp: 0.06 + (i % 3) * 0.03 }; palace.add(s); });
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
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); const ln = $('lens'); document.body.classList.add('moved'); ln.style.left = e.clientX + 'px'; ln.style.top = e.clientY + 'px'; if (!started || current) return;
  const k = pick(); $('lens').classList.toggle('hot', !!k);
  if (k !== hovered) { if (hovered) setGlow(hovered, false); hovered = k; if (k) { setGlow(k, true); deduce.innerHTML = CLUES[k].deduce.map((s, i) => `<span style="animation-delay:${i * 0.12}s">${s}</span>`).join(''); } deduce.classList.toggle('on', !!k); }
  if (k) { deduce.style.left = Math.min(e.clientX + 22, innerWidth - 300) + 'px'; deduce.style.top = (e.clientY - 10) + 'px'; }
});
let AC = null;
function bang() {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
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
  const t = (now - t0) / 1000;
  const par = (!current && started) ? 0.18 : 0; const target = goal.pos.clone().add(new THREE.Vector3(mouse.x * par * (Math.abs(mouse.x) < 2 ? 1 : 0), mouse.y * par * 0.5 * (Math.abs(mouse.y) < 2 ? 1 : 0), 0));
  const k = reduce ? 1 : 0.06; cam.pos.lerp(target, k); cam.look.lerp(goal.look, k); camera.position.copy(cam.pos); if (shake > 0.01) { camera.position.x += (Math.random() - .5) * shake * 0.2; camera.position.y += (Math.random() - .5) * shake * 0.2; shake *= 0.85; } camera.lookAt(cam.look);
  if (!started && !reduce) { camera.position.x += Math.sin(t * 0.25) * 0.4; camera.lookAt(cam.look); }
  fireLight.intensity = 5 + Math.sin(t * 9) * 0.6 + Math.sin(t * 23) * 0.4;
  winGroup.userData.rain.material.map.offset.y = (t * 0.35) % 1;
  if (!reduce && Math.random() < 0.0025) flash = 1; flash *= 0.9; skyMat.color.setScalar(1 + flash * 2.5); coolLight.intensity = 3 + flash * 25;
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

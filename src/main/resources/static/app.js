import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls, raycaster, mouse;
let objects = {};
let ws;
let recognition = null;
let labels = [];

const $ = (id) => document.getElementById(id);
const showError = (msg) => { const el = $('errors'); if (el) el.textContent = msg; console.error(msg); };

init().catch(e => showError(`Error inicializando escena: ${e?.message || e}`));
animate();

/* ===================== Init ===================== */
async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05080c);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 6);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    // UX de cámara
    controls.enablePan = false;
    controls.minDistance = 2;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI * 0.55;

    // luces
    const hemi = new THREE.HemisphereLight(0x88bbff, 0x080808, 1.2);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(2,4,3);
    scene.add(dir);

    // piso cuadriculado
    const grid = new THREE.GridHelper(20, 20, 0x224466, 0x112233);
    grid.position.y = -0.5;
    scene.add(grid);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(0, 0);

    // --- Objetos holográficos ---
    const geoCapsule = new THREE.SphereGeometry(0.6, 32, 32);
    const geoTable   = new THREE.BoxGeometry(1.2, 0.2, 0.8);
    const geoScreen  = new THREE.PlaneGeometry(1.6, 0.9);

    const matHolo  = new THREE.MeshPhongMaterial({ color: 0x66ccff, transparent: true, opacity: 0.5, emissive: 0x1166aa, shininess: 100 });
    const matTable = new THREE.MeshPhongMaterial({ color: 0x66ffaa, transparent: true, opacity: 0.5, emissive: 0x118844, shininess: 80 });
    const matScreen= new THREE.MeshPhongMaterial({ color: 0xaa88ff, transparent: true, opacity: 0.5, emissive: 0x5522aa, shininess: 120, side: THREE.DoubleSide });

    // Cápsula: “Quiénes somos”
    const capsule = new THREE.Mesh(geoCapsule, matHolo);
    capsule.position.set(-2, 0.2, 0);
    capsule.userData = { type: "who" };
    scene.add(capsule);
    objects['who'] = capsule;

    // Mesa: “Qué hacemos” + KPIs via WS
    const table = new THREE.Mesh(geoTable, matTable);
    table.position.set(0, -0.2, 0);
    table.userData = { type: "what" };
    scene.add(table);
    objects['what'] = table;

    // Pantalla: “Visión”
    const screen = new THREE.Mesh(geoScreen, matScreen);
    screen.position.set(2.2, 0.6, 0);
    screen.rotation.y = -Math.PI/8;
    screen.userData = { type: "vision" };
    scene.add(screen);
    objects['vision'] = screen;

    // Labels flotantes
    setupLabels();

    // eventos
    window.addEventListener('resize', onResize);
    window.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);

    // teclado WASD
    window.addEventListener('keydown', (e) => {
        const step = 0.2;
        if (e.key === 'w' || e.key === 'W') camera.position.z -= step;
        if (e.key === 's' || e.key === 'S') camera.position.z += step;
        if (e.key === 'a' || e.key === 'A') camera.position.x -= step;
        if (e.key === 'd' || e.key === 'D') camera.position.x += step;
    });

    // Voz: solo por gesto
    $('enableVoice')?.addEventListener('click', enableVoice);

    // Chat botón
    $('chatSend')?.addEventListener('click', onChatSend);
}

/* ===================== Eventos básicos ===================== */
function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();

    // animaciones sutiles
    if (objects['who']) objects['who'].rotation.y += 0.003;
    if (objects['vision']) objects['vision'].rotation.y -= 0.001;

    // Hover: cursor pointer si hay intersección
    if (raycaster) {
        raycaster.setFromCamera(mouse, camera);
        const hit = raycaster.intersectObjects(Object.values(objects)).length > 0;
        document.body.style.cursor = hit ? 'pointer' : 'default';
    }

    updateLabels();
    if (renderer && scene && camera) renderer.render(scene, camera);
}

async function onClick(event) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(Object.values(objects));
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        const type = obj.userData.type;
        if (type === "who") openWho();
        if (type === "what") openWhat();
        if (type === "vision") openVision();
    }
}

/* ===================== Paneles ===================== */
async function openWho() {
    try {
        const res = await fetch('/api/who');
        const data = await res.json();
        openPanel(data.title, `<ul>${data.bullets.map(b=>`<li>${b}</li>`).join('')}</ul>`);
    } catch (e) { showError(`Error /api/who: ${e}`); }
}

async function openWhat() {
    try {
        const res = await fetch('/api/what');
        const data = await res.json();
        const body = `
      <div><strong>Capacidades</strong><ul>${data.capabilities.map(c=>`<li>${c}</li>`).join('')}</ul></div>
      <div style="margin-top:6px"><strong>Proyectos</strong><ul>${data.projects.map(p=>`<li><em>${p[0]}</em>: ${p[1]}</li>`).join('')}</ul></div>
      <div style="margin-top:6px">Conectando a KPIs en tiempo real…</div>
    `;
        openPanel("Qué hacemos", body);
        connectWS();
    } catch (e) { showError(`Error /api/what: ${e}`); }
}

async function openVision() {
    try {
        const res = await fetch('/api/vision');
        const data = await res.json();
        const body = `<div><em>${data.headline}</em></div><ol>${data.frames.map(f=>`<li>${f}</li>`).join('')}</ol>`;
        openPanel("Nuestra visión", body);
    } catch (e) { showError(`Error /api/vision: ${e}`); }
}

function openPanel(title, bodyHtml) {
    const panel = $('panel');
    $('panelTitle').innerText = title;
    $('panelBody').innerHTML = bodyHtml;
    if (panel) panel.style.display = 'block';
}

/* ===================== WebSocket KPIs (con reconexión) ===================== */
function connectWS() {
    try {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
        ws = new WebSocket(`ws://${location.host}/ws/stream`);
        ws.onopen = () => { $('kpis').style.opacity='1'; };
        ws.onmessage = (ev) => {
            try {
                const arr = JSON.parse(ev.data);
                const kpis = arr.map(m => `${m.name}: ${m.value}`).join(' • ');
                $('kpis').innerText = kpis;
            } catch(e) {}
        };
        ws.onclose = () => { $('kpis').style.opacity='.6'; setTimeout(connectWS, 1500); };
        ws.onerror = () => ws.close();
    } catch (e) { showError(`WS error: ${e}`); }
}

/* ===================== Chat ===================== */
async function onChatSend() {
    const input = $('chatInput');
    const panelBody = $('panelBody');
    const msg = (input?.value || "").trim();
    if (!msg) return;
    try {
        const res = await fetch('/api/chat', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ message: msg })
        });
        const data = await res.json();
        const div = document.createElement('div');
        div.innerHTML = `<div style="margin-top:6px; padding:8px; background:rgba(255,255,255,0.06); border-radius:8px">${data.reply}</div>`;
        if (panelBody) panelBody.appendChild(div);
    } catch (e) { showError(`Error /api/chat: ${e}`); }
}

/* ===================== Voz ===================== */
function enableVoice() {
    try {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { showError('Tu navegador no soporta Web Speech API. Usa Chrome/Edge en escritorio.'); return; }
        recognition = new SR();
        recognition.lang = 'es-ES';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (e) => {
            const t = e.results[e.results.length-1][0].transcript.toLowerCase();
            if (t.includes('cerrar panel') || t.includes('ocultar panel')) $('panel').style.display='none';
            else if (t.includes('visión')) openVision();
            else if (t.includes('quiénes') || t.includes('quienes')) openWho();
            else if (t.includes('qué hacemos') || t.includes('que hacemos')) openWhat();
        };
        recognition.onerror = (e) => showError(`Voz error: ${e.error || e.message}`);
        recognition.onend = () => { /* opcional: volver a iniciar si lo deseas */ };

        recognition.start(); // gesto del usuario: botón "Activar voz"
        const btn = $('enableVoice');
        if (btn) { btn.textContent = 'Voz activada'; btn.disabled = true; }
    } catch (e) {
        showError(`No se pudo iniciar voz: ${e?.message || e}`);
    }
}

/* ===================== Labels flotantes ===================== */
function setupLabels() {
    labels = [
        makeLabel('Quiénes somos', objects['who'].position),
        makeLabel('Qué hacemos', objects['what'].position),
        makeLabel('Visión', objects['vision'].position)
    ];
}

function makeLabel(text, pos) {
    const div = document.createElement('div');
    div.textContent = text;
    div.style.position='absolute';
    div.style.padding='4px 8px';
    div.style.background='rgba(0,0,0,.45)';
    div.style.border='1px solid rgba(255,255,255,.12)';
    div.style.borderRadius='6px';
    div.style.pointerEvents='none';
    div.style.fontSize='12px';
    div.style.color='#e6f0ff';
    div.style.whiteSpace='nowrap';
    div.style.transform='translate(-50%, -140%)';
    document.body.appendChild(div);
    return { div, pos };
}

function updateLabels(){
    if (!labels || labels.length === 0) return;
    labels.forEach(l=>{
        const v = l.pos.clone().project(camera);
        const x = (v.x + 1) / 2 * window.innerWidth;
        const y = (-v.y + 1) / 2 * window.innerHeight;
        l.div.style.left = `${x}px`;
        l.div.style.top  = `${y}px`;
        // ocultar si está detrás de la cámara
        l.div.style.display = (v.z < 1) ? 'block' : 'none';
    });
}
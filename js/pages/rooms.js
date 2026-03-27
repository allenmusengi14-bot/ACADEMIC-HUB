import { CU, CUK, mods, _studySessions, _focusRooms } from './app.js.js';
import { FS } from './firebase-config.js.js';
import { showToast, formatStopwatchTime, saveToLocal, loadFromLocal } from './utils.js.js';

// Room timers
let roomTimers = {};

// Render Rooms page
export function renderRoomsPage() {
  const page = document.getElementById('pg-rooms');
  if (!page) return;
  
  page.innerHTML = `
    <div class="study-rooms-header">
      <h2 style="font-family:'Fraunces',serif;font-size:1.7rem;color:#fff;margin-bottom:5px;">👥 Focus Rooms</h2>
      <p style="color:rgba(255,255,255,.7);font-size:.9rem;">Study together in real-time. Earn double points for group sessions!</p>
      <div style="margin-top:20px;">
        <button class="btn btn-gold" onclick="document.getElementById('createRoomMod').classList.add('on')">➕ Create Focus Room</button>
      </div>
    </div>
    
    <div style="margin-bottom:20px;">
      <h3 style="font-family:'Fraunces',serif;font-size:1.2rem;margin-bottom:12px;">🟢 Active Rooms</h3>
      <div id="activeRooms" class="rooms-grid"></div>
    </div>
    
    <div class="card">
      <div class="card-title">✨ How Focus Rooms Work</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:15px;">
        <div style="text-align:center;">
          <div style="font-size:2rem;">1️⃣</div>
          <div style="font-weight:700;font-size:.9rem;">Create or Join</div>
          <div style="font-size:.75rem;color:var(--muted);">Pick a module and timer mode</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:2rem;">2️⃣</div>
          <div style="font-weight:700;font-size:.9rem;">Study Together</div>
          <div style="font-size:.75rem;color:var(--muted);">All timers sync in real-time</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:2rem;">3️⃣</div>
          <div style="font-weight:700;font-size:.9rem;">Earn Bonus Points</div>
          <div style="font-size:.75rem;color:var(--muted);">2x points for group sessions</div>
        </div>
      </div>
    </div>
  `;
  
  // Populate module dropdown
  populateRoomModules();
  
  // Render rooms
  renderFocusRooms();
}

// Populate room module dropdown
function populateRoomModules() {
  const roomModule = document.getElementById('roomModule');
  if (!roomModule) return;
  
  const opts = mods.length
    ? mods.map(m => `<option value="${m.code} – ${m.name}">${m.code} – ${m.name}</option>`).join('')
    : '<option value="">No modules — set up in Profile</option>';
  
  roomModule.innerHTML = '<option value="">— Select module —</option>' + opts;
}

// Render focus rooms
function renderFocusRooms() {
  const container = document.getElementById('activeRooms');
  if (!container) return;
  
  let active = _focusRooms.filter(r => new Date(r.expiresAt) > new Date());
  
  if (!active.length) {
    container.innerHTML = '<div class="empty"><div class="ei">👥</div><p>No active rooms. Create one to start studying together!</p></div>';
    return;
  }
  
  container.innerHTML = active.map(r => {
    const joined = r.participants?.includes(CUK);
    const leaderboard = (r.leaderboard || []).sort((a, b) => b.totalMinutes - a.totalMinutes);
    
    return `
      <div class="room-card">
        <div class="room-header">
          <div class="room-icon">👥</div>
          <div>
            <div class="room-name">${r.name}</div>
            <div class="room-meta">📚 ${r.module} · ${r.durationDays} days</div>
          </div>
        </div>
        <div><small>⏰ ${r.windowStart}-${r.windowEnd} · daily min ${r.ruleDailyMin} min</small></div>
        <div class="room-stats">
          <div class="room-stat-item">
            <div class="room-stat-value">${r.participants?.length || 1}</div>
            <div class="room-stat-label">joined</div>
          </div>
          <div class="room-stat-item">
            <div class="room-stat-value">${r.maxParticipants}</div>
            <div class="room-stat-label">max</div>
          </div>
        </div>
        <div class="leaderboard-preview">
          ${leaderboard.slice(0, 3).map((u, i) => 
            `<div>${i+1}. ${u.name} – ${Math.floor(u.totalMinutes/60)}h ${u.totalMinutes%60}m (${u.points || 0} pts)</div>`
          ).join('')}
        </div>
        ${joined ? `
          <div>
            <select class="req-fi" id="roomModSelect_${r.id}">
              ${mods.map(m => `<option>${m.code}</option>`).join('')}
            </select>
            <button class="btn btn-sm btn-green" onclick="window.startRoomTimer('${r.id}')">▶ start timer</button>
            <span id="roomTimer_${r.id}">0:00</span>
          </div>
        ` : `
          <button class="btn btn-blue" onclick="window.joinFocusRoom('${r.id}')">➕ Join</button>
        `}
      </div>
    `;
  }).join('');
}

// Create focus room
async function createFocusRoom() {
  const name = document.getElementById('roomName').value.trim();
  const durationDays = parseInt(document.getElementById('roomDurationDays')?.value) || 7;
  const ruleDailyMin = parseInt(document.getElementById('ruleDailyMin')?.value) || 60;
  const windowStart = document.getElementById('windowStart')?.value || '08:00';
  const windowEnd = document.getElementById('windowEnd')?.value || '22:00';
  const maxPart = parseInt(document.getElementById('roomMaxParticipants').value) || 10;
  const module = document.getElementById('roomModule').value;
  const description = document.getElementById('roomDescription').value.trim();
  
  if (!name || !module) {
    alert('Enter room name and select module');
    return;
  }
  
  const roomData = {
    createdBy: CUK,
    createdByName: CU.name,
    name,
    durationDays,
    ruleDailyMin,
    windowStart,
    windowEnd,
    maxParticipants: maxPart,
    faculty: CU.faculty,
    participants: [CUK],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + durationDays * 86400000).toISOString(),
    leaderboard: [],
    module,
    description
  };
  
  await FS.addFocusRoom(roomData);
  
  showToast('Room created', 'Focus room is live for ' + durationDays + ' days', 'success');
  document.getElementById('createRoomMod').classList.remove('on');
}

// Join focus room
async function joinFocusRoom(roomId) {
  await FS.joinFocusRoom(roomId, CUK);
  showToast('Joined Room', 'You are now studying together!', 'success');
}

// Start room timer
function startRoomTimer(roomId) {
  const modSelect = document.getElementById(`roomModSelect_${roomId}`);
  if (!modSelect) return;
  
  const mod = modSelect.value;
  if (!mod) {
    alert('Select module');
    return;
  }
  
  if (roomTimers[roomId]) {
    alert('Timer already running');
    return;
  }
  
  roomTimers[roomId] = {
    seconds: 0,
    module: mod,
    userId: CUK,
    interval: setInterval(() => {
      roomTimers[roomId].seconds++;
      const timerEl = document.getElementById(`roomTimer_${roomId}`);
      if (timerEl) {
        timerEl.innerText = formatStopwatchTime(roomTimers[roomId].seconds);
      }
    }, 1000)
  };
}

// Stop room timer (call this when leaving or ending)
async function stopRoomTimer(roomId) {
  if (!roomTimers[roomId]) return;
  
  clearInterval(roomTimers[roomId].interval);
  
  const sec = roomTimers[roomId].seconds;
  const mod = roomTimers[roomId].module;
  const mins = Math.round(sec / 60);
  
  if (mins >= 1) {
    let pts = 0;
    if (mins >= 60 && mins < 120) pts = 5;
    else if (mins >= 120 && mins < 240) pts = 10;
    else if (mins >= 240 && mins < 300) pts = 15;
    else if (mins >= 300 && mins < 360) pts = 20;
    else if (mins >= 360) pts = 25;
    
    const room = _focusRooms.find(r => r.id === roomId);
    if (room) {
      let lb = room.leaderboard || [];
      let entry = lb.find(e => e.userId === CUK && e.module === mod);
      
      if (entry) {
        entry.totalMinutes += mins;
        entry.points += pts;
      } else {
        lb.push({
          userId: CUK,
          name: CU.name,
          module: mod,
          totalMinutes: mins,
          points: pts
        });
      }
      
      await FS.updateFocusRoom(roomId, { leaderboard: lb });
    }
    
    // Log study session
    await logStudySessionFromTimer(mod, mins);
  }
  
  delete roomTimers[roomId];
}

// Leave focus room
async function leaveFocusRoom(roomId) {
  if (!confirm('Leave this room?')) return;
  
  await stopRoomTimer(roomId);
  await FS.leaveFocusRoom(roomId, CUK);
  showToast('Left Room', 'You have left the focus room.', 'info');
}

// End focus room
async function endFocusRoom(roomId) {
  if (!confirm('End this room? This will stop all timers.')) return;
  
  await stopRoomTimer(roomId);
  await FS.updateFocusRoom(roomId, { status: 'ended' });
  showToast('Room Ended', 'Focus room closed.', 'info');
}

// Helper function to log study session (copy from streak.js)
async function logStudySessionFromTimer(module, minutes) {
  const { FS } = await import('../firebase-config.js');
  
  if (!module || minutes < 1) return;
  
  const date = new Date().toISOString().split('T')[0];
  const hours = minutes / 60;
  
  CU.studyStats = CU.studyStats || { totalHours: 0, streak: 0, lastStudyDate: null, points: 0 };
  CU.studyStats.totalHours += hours;
  CU.studyStats.points += Math.floor(hours);
  
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const lastDate = CU.studyStats.lastStudyDate ? new Date(CU.studyStats.lastStudyDate) : null;
  
  if (lastDate) {
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastDate.toDateString() === yesterday.toDateString()) {
      CU.studyStats.streak++;
    } else if (lastDate.toDateString() !== todayDate.toDateString()) {
      CU.studyStats.streak = 1;
    }
  } else {
    CU.studyStats.streak = 1;
  }
  
  CU.studyStats.lastStudyDate = todayDate.toISOString();
  
  await FS.addStudySession({ userId: CUK, module, date, duration: minutes, hours, points: Math.floor(hours) });
  await FS.setUser(CUK, { studyStats: CU.studyStats });
}

// ==================== FOCUS ROOM SESSION ====================
let _currentRoomSession = null;
let _sessionTimer = { running: false, seconds: 0, module: '', interval: null };
let _sessionTodayMinutes = 0;

let _roomPomodoroState = { running: false, seconds: 25*60, preset: 25, module: '', interval: null };
function setRoomPomodoroPreset(min, el) {
  _roomPomodoroState.preset = min; _roomPomodoroState.seconds = min * 60;
  document.querySelectorAll('.rpomo-preset').forEach(b => { b.style.background='transparent'; b.style.borderColor='rgba(255,255,255,.15)'; b.style.color='rgba(255,255,255,.7)'; });
  if(el){ el.style.background='rgba(255,255,255,.2)'; el.style.borderColor='rgba(255,255,255,.3)'; el.style.color='#fff'; }
  updateRoomPomodoroDisplay();
}
function updateRoomPomodoroDisplay() {
  const m = Math.floor(_roomPomodoroState.seconds/60), s = _roomPomodoroState.seconds%60;
  const el = document.getElementById('roomPomodoroDisplay');
  if (el) el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function startRoomPomodoro() {
  const mod = document.getElementById('roomPomodoroModule').value;
  if (!mod) { showToast('Pick a subject','Select a subject first','warning'); return; }
  if (_roomPomodoroState.running) return;
  _roomPomodoroState.module = mod; _roomPomodoroState.running = true;
  const startBtn = document.getElementById('roomPomodoroStartBtn');
  const pauseBtn = document.getElementById('roomPomodoroPauseBtn');
  const statusEl = document.getElementById('roomPomodoroStatus');
  if (startBtn) startBtn.style.display = 'none';
  if (pauseBtn) pauseBtn.style.display = 'inline-flex';
  if (statusEl) statusEl.textContent = '🔴 Focus — stay locked in!';
  _roomPomodoroState.interval = setInterval(async () => {
    if (_roomPomodoroState.seconds <= 0) {
      clearInterval(_roomPomodoroState.interval); _roomPomodoroState.running = false;
      if(startBtn) startBtn.style.display = 'inline-flex';
      if(pauseBtn) pauseBtn.style.display = 'none';
      if(statusEl) statusEl.textContent = '✅ Session complete!';
      await _logRoomTime(_roomPomodoroState.module, _roomPomodoroState.preset);
      showToast('🍅 Pomodoro Done!', `${_roomPomodoroState.preset} min complete — great work!`, 'success');
      _roomPomodoroState.seconds = _roomPomodoroState.preset * 60; updateRoomPomodoroDisplay();
    } else { _roomPomodoroState.seconds--; updateRoomPomodoroDisplay(); }
  }, 1000);
}
async function pauseRoomPomodoro() {
  if (!_roomPomodoroState.running) return;
  clearInterval(_roomPomodoroState.interval); _roomPomodoroState.running = false;
  const startBtn = document.getElementById('roomPomodoroStartBtn');
  const pauseBtn = document.getElementById('roomPomodoroPauseBtn');
  const statusEl = document.getElementById('roomPomodoroStatus');
  if (startBtn) startBtn.style.display = 'inline-flex';
  if (pauseBtn) pauseBtn.style.display = 'none';
  if (statusEl) statusEl.textContent = '⏸ Paused';
  const elapsed = _roomPomodoroState.preset * 60 - _roomPomodoroState.seconds;
  const mins = Math.round(elapsed / 60);
  if (mins >= 1) await _logRoomTime(_roomPomodoroState.module, mins);
}
function resetRoomPomodoro() {
  clearInterval(_roomPomodoroState.interval); _roomPomodoroState.running = false;
  _roomPomodoroState.seconds = _roomPomodoroState.preset * 60;
  const startBtn = document.getElementById('roomPomodoroStartBtn');
  const pauseBtn = document.getElementById('roomPomodoroPauseBtn');
  const statusEl = document.getElementById('roomPomodoroStatus');
  if (startBtn) startBtn.style.display = 'inline-flex';
  if (pauseBtn) pauseBtn.style.display = 'none';
  if (statusEl) statusEl.textContent = 'Select a subject to start';
  updateRoomPomodoroDisplay();
}

function switchRoomTab(tab) {
  ['timer','pomodoro','goals'].forEach(t => {
    const panel = document.getElementById('roomPanel-'+t);
    const btn = document.getElementById('roomTab'+t.charAt(0).toUpperCase()+t.slice(1));
    if (panel) panel.style.display = (t === tab) ? 'flex' : 'none';
    if (btn) {
      btn.style.background = t === tab ? 'rgba(255,255,255,.9)' : 'transparent';
      btn.style.color = t === tab ? '#1e3a8a' : 'rgba(255,255,255,.7)';
    }
  });
}

function getTimeMode() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'night';
}

let _spaceAnimFrame = null;
function startSpaceCanvas() {
  const canvas = document.getElementById('spaceCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const mode = getTimeMode();
  if (mode === 'morning') startMorningCanvas(canvas, ctx);
  else if (mode === 'afternoon') startAfternoonCanvas(canvas, ctx);
  else startNightCanvas(canvas, ctx);
}
function stopSpaceCanvas() {
  if (_spaceAnimFrame) { cancelAnimationFrame(_spaceAnimFrame); _spaceAnimFrame = null; }
}

function startNightCanvas(canvas, ctx) {
  const stars = Array.from({length: 180}, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    r: Math.random() * 1.8 + 0.2, speed: Math.random() * 0.2 + 0.04,
    opacity: Math.random() * 0.7 + 0.3, twinkle: Math.random() * Math.PI * 2,
  }));
  const nebulas = Array.from({length: 5}, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    r: Math.random() * 220 + 100, hue: Math.floor(Math.random() * 360),
    drift: { x: (Math.random() - 0.5) * 0.3, y: (Math.random() - 0.5) * 0.15 },
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#050510'); bg.addColorStop(0.5, '#0a0620'); bg.addColorStop(1, '#08030f');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    nebulas.forEach(n => {
      n.x += n.drift.x; n.y += n.drift.y;
      if (n.x < -n.r) n.x = canvas.width + n.r; if (n.x > canvas.width + n.r) n.x = -n.r;
      if (n.y < -n.r) n.y = canvas.height + n.r; if (n.y > canvas.height + n.r) n.y = -n.r;
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      g.addColorStop(0, `hsla(${n.hue},80%,40%,0.06)`);
      g.addColorStop(0.5, `hsla(${n.hue+40},70%,30%,0.03)`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI*2); ctx.fill();
    });
    stars.forEach(s => {
      s.y += s.speed; s.twinkle += 0.02;
      if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
      const op = s.opacity * (0.7 + 0.3 * Math.sin(s.twinkle));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${op})`; ctx.fill();
    });
    _spaceAnimFrame = requestAnimationFrame(draw);
  }
  draw();
}

function startMorningCanvas(canvas, ctx) {
  const particles = Array.from({length: 60}, () => ({
    x: Math.random() * canvas.width,
    y: canvas.height + Math.random() * 100,
    r: Math.random() * 3 + 1,
    speed: Math.random() * 0.5 + 0.2,
    opacity: Math.random() * 0.4 + 0.1,
    hue: Math.random() * 40 + 20,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: Math.random() * 0.015 + 0.005,
    swayAmt: Math.random() * 30 + 10,
  }));
  const birds = Array.from({length: 7}, () => ({
    x: -80, y: Math.random() * canvas.height * 0.5,
    speed: Math.random() * 0.6 + 0.3,
    scale: Math.random() * 0.6 + 0.4,
    flapPhase: Math.random() * Math.PI * 2,
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#1a1035'); sky.addColorStop(0.35, '#3d2670');
    sky.addColorStop(0.6, '#c8733a'); sky.addColorStop(0.78, '#f5a623');
    sky.addColorStop(1, '#fde68a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const sunY = canvas.height * 0.82;
    const sunGlow = ctx.createRadialGradient(canvas.width/2, sunY, 0, canvas.width/2, sunY, 280);
    sunGlow.addColorStop(0, 'rgba(255,220,80,0.55)');
    sunGlow.addColorStop(0.35, 'rgba(255,160,30,0.3)');
    sunGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGlow; ctx.beginPath(); ctx.arc(canvas.width/2, sunY, 280, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(canvas.width/2, sunY, 44, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,235,100,0.9)'; ctx.fill();
    particles.forEach(p => {
      p.y -= p.speed; p.sway += p.swaySpeed;
      p.x += Math.sin(p.sway) * 0.4;
      if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `hsla(${p.hue},90%,80%,${p.opacity})`; ctx.fill();
    });
    birds.forEach(b => {
      b.x += b.speed; b.flapPhase += 0.06;
      if (b.x > canvas.width + 100) { b.x = -80; b.y = Math.random() * canvas.height * 0.5; }
      ctx.save(); ctx.translate(b.x, b.y); ctx.scale(b.scale, b.scale);
      const flap = Math.sin(b.flapPhase) * 8;
      ctx.strokeStyle = 'rgba(15,5,40,0.45)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-14, flap); ctx.quadraticCurveTo(0, 0, 14, flap); ctx.stroke();
      ctx.restore();
    });
    _spaceAnimFrame = requestAnimationFrame(draw);
  }
  draw();
}

function startAfternoonCanvas(canvas, ctx) {
  const motes = Array.from({length: 40}, () => ({
    x: canvas.width * 0.55 + (Math.random() - 0.5) * canvas.width * 0.45,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 0.5,
    speed: Math.random() * 0.25 + 0.05,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: Math.random() * 0.008 + 0.003,
    opacity: Math.random() * 0.5 + 0.1,
  }));
  const pages = Array.from({length: 5}, () => ({
    x: Math.random() * canvas.width * 0.4 + canvas.width * 0.1,
    y: Math.random() * canvas.height,
    rot: (Math.random() - 0.5) * 0.4,
    rotSpeed: (Math.random() - 0.5) * 0.003,
    speed: Math.random() * 0.15 + 0.05,
    w: Math.random() * 18 + 10, h: Math.random() * 14 + 8,
    sway: Math.random() * Math.PI * 2, swaySpeed: 0.006,
  }));
  let tailPhase = 0, plantPhase = 0;

  function drawRoom() {
    const W = canvas.width, H = canvas.height;
    const wallG = ctx.createLinearGradient(0, 0, 0, H);
    wallG.addColorStop(0, '#2c1f3e'); wallG.addColorStop(0.5, '#1e1533'); wallG.addColorStop(1, '#140f25');
    ctx.fillStyle = wallG; ctx.fillRect(0, 0, W, H);
    const floorG = ctx.createLinearGradient(0, H * 0.72, 0, H);
    floorG.addColorStop(0, '#1a0f08'); floorG.addColorStop(1, '#0d0804');
    ctx.fillStyle = floorG; ctx.fillRect(0, H * 0.72, W, H * 0.28);
    ctx.save(); ctx.globalAlpha = 0.07; ctx.strokeStyle = '#8b5e3c'; ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) { const fy = H*0.72 + (i/8)*H*0.28; ctx.beginPath(); ctx.moveTo(0,fy); ctx.lineTo(W,fy); ctx.stroke(); }
    ctx.restore();
    const wx = W*0.52, wy = H*0.04, ww = W*0.44, wh = H*0.62;
    ctx.save();
    const lightG = ctx.createLinearGradient(wx, wy, wx+ww, wy+wh);
    lightG.addColorStop(0,'rgba(255,210,100,0.18)'); lightG.addColorStop(0.6,'rgba(255,180,60,0.08)'); lightG.addColorStop(1,'transparent');
    ctx.fillStyle = lightG; ctx.fillRect(wx-20, wy, ww+40, wh+H*0.2); ctx.restore();
    ctx.fillStyle='#3d2a1a'; ctx.beginPath(); ctx.roundRect(wx-8, wy-8, ww+16, wh+16, 4); ctx.fill();
    const skyG = ctx.createLinearGradient(wx, wy, wx, wy+wh);
    skyG.addColorStop(0,'#1a4a7a'); skyG.addColorStop(0.5,'#2d6fa8'); skyG.addColorStop(1,'#5fa8d8');
    ctx.fillStyle = skyG; ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.fill();
    ctx.strokeStyle='#3d2a1a'; ctx.lineWidth=7;
    ctx.beginPath(); ctx.moveTo(wx+ww/2,wy); ctx.lineTo(wx+ww/2,wy+wh); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(wx,wy+wh/2); ctx.lineTo(wx+ww,wy+wh/2); ctx.stroke();
    ctx.fillStyle='#5a3820'; ctx.beginPath(); ctx.roundRect(wx-12,wy+wh-2,ww+24,16,3); ctx.fill();
    const shelfX=W*0.02, shelfW=W*0.28;
    [H*0.1,H*0.26,H*0.42].forEach((sy,si) => {
      ctx.fillStyle='#4a2f14'; ctx.beginPath(); ctx.roundRect(shelfX,sy,shelfW,8,2); ctx.fill();
      const bc=['#c0392b','#2980b9','#27ae60','#8e44ad','#e67e22','#16a085','#d35400','#2c3e50'];
      let bx=shelfX+5;
      for(let b=0;b<8+si;b++){const bw=Math.random()*12+10,bh=Math.random()*22+28,col=bc[(b+si*3)%bc.length];ctx.fillStyle=col;ctx.beginPath();ctx.roundRect(bx,sy-bh,bw,bh,1);ctx.fill();bx+=bw+1;if(bx>shelfX+shelfW-14)break;}
    });
    const deskX=W*0.05,deskY=H*0.66,deskW=W*0.5,deskH=16;
    const deskG=ctx.createLinearGradient(deskX,deskY,deskX,deskY+deskH);
    deskG.addColorStop(0,'#6b3d18'); deskG.addColorStop(1,'#4a2a0e');
    ctx.fillStyle=deskG; ctx.beginPath(); ctx.roundRect(deskX,deskY,deskW,deskH,3); ctx.fill();
    ctx.strokeStyle='#3a1f08'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle='#3a1f08';
    [[deskX+15,deskY+deskH,12,H*0.06],[deskX+deskW-27,deskY+deskH,12,H*0.06]].forEach(([lx,ly,lw,lh])=>{ctx.beginPath();ctx.roundRect(lx,ly,lw,lh,2);ctx.fill();});
    const lapX=deskX+deskW*0.3,lapY=deskY-44;
    ctx.fillStyle='#9ca8b8'; ctx.beginPath(); ctx.roundRect(lapX,lapY,80,46,4); ctx.fill();
    ctx.fillStyle='#0f172a'; ctx.beginPath(); ctx.roundRect(lapX+4,lapY+4,72,34,2); ctx.fill();
    const vig=ctx.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.9);
    vig.addColorStop(0,'transparent'); vig.addColorStop(1,'rgba(0,0,0,0.45)');
    ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);
  }

  let t=0;
  function draw() {
    t+=0.008; tailPhase+=0.04; plantPhase+=0.012;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawRoom();
    motes.forEach(m=>{
      m.y-=m.speed; m.sway+=m.swaySpeed; m.x+=Math.sin(m.sway)*0.3;
      if(m.y<0){m.y=canvas.height;m.x=canvas.width*0.52+(Math.random()-0.5)*canvas.width*0.45;}
      ctx.save(); ctx.globalAlpha=m.opacity*(0.6+0.4*Math.sin(m.sway*3));
      ctx.fillStyle='#ffe8a0'; ctx.beginPath(); ctx.arc(m.x,m.y,m.r,0,Math.PI*2); ctx.fill(); ctx.restore();
    });
    pages.forEach(p=>{
      p.y-=p.speed; p.rot+=p.rotSpeed; p.sway+=p.swaySpeed; p.x+=Math.sin(p.sway)*0.5;
      if(p.y<-20){p.y=canvas.height*0.75;p.x=Math.random()*canvas.width*0.4+canvas.width*0.08;}
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.globalAlpha=0.25;
      ctx.fillStyle='#f8f4e8'; ctx.beginPath(); ctx.roundRect(-p.w/2,-p.h/2,p.w,p.h,1); ctx.fill();
      ctx.strokeStyle='#c8b890'; ctx.lineWidth=0.5; ctx.stroke(); ctx.restore();
    });
    _spaceAnimFrame = requestAnimationFrame(draw);
  }
  draw();
}

function openRoomSession(room) {
  _currentRoomSession = room;
  _sessionTimer = { running: false, seconds: 0, module: '', interval: null };
  _roomPomodoroState.seconds = _roomPomodoroState.preset * 60;

  const today = new Date().toISOString().split('T')[0];
  _sessionTodayMinutes = _studySessions
    .filter(s => s.userId === CUK && s.date === today)
    .reduce((sum, s) => sum + (s.duration || 0), 0);

  const opts = mods.length
    ? mods.map(m => `<option value="${m.code} – ${m.name}">${m.code} – ${m.name}</option>`).join('')
    : '<option value="General">General Study</option>';
  ['sessionModuleSelect','roomPomodoroModule','newGoalModule'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<option value="" style="color:#000;">— Pick a subject —</option>' + opts;
  });

  const roomNameEl = document.getElementById('sessionRoomName');
  const roomMetaEl = document.getElementById('sessionRoomMeta');
  if (roomNameEl) roomNameEl.textContent = room.name;
  if (roomMetaEl) roomMetaEl.textContent = `📚 ${room.module} · ${room.faculty} · ${room.participants?.length || 1} members`;

  const mode = getTimeMode();
  const timerEl = document.getElementById('sessionTimerDisplay');
  if (timerEl) {
    if (mode === 'morning') { timerEl.style.color='#fff3b0'; timerEl.style.textShadow='0 0 40px rgba(255,180,0,.7)'; }
    else if (mode === 'afternoon') { timerEl.style.color='#1e293b'; timerEl.style.textShadow='0 1px 8px rgba(0,0,0,.2)'; }
    else { timerEl.style.color='#fff'; timerEl.style.textShadow='0 0 40px rgba(124,58,237,.8)'; }
  }
  const modeLabels = { morning:'☀️ Morning Session', afternoon:'🌤️ Afternoon Focus', night:'🌙 Night Mode' };
  const stEl = document.getElementById('sessionTimerStatus');
  if (stEl) stEl.textContent = modeLabels[mode] + ' — pick a subject to start';

  _studyGoals = loadFromLocal('studyGoals_' + CUK, []);
  renderGoalsList();

  const savedObj = loadFromLocal('sessionObjective_' + CUK, '');
  const objEl = document.getElementById('sessionObjective');
  if (objEl && savedObj) objEl.value = savedObj;

  updateRoomPomodoroDisplay();
  switchRoomTab('timer');
  updateSessionUI(room);
  renderSessionLeaderboard(room);
  renderApprovalBar(room);
  renderRoomSessionSummary();

  const sessionEl = document.getElementById('focusRoomSession');
  if (sessionEl) sessionEl.classList.remove('hidden');
  _startSessionLiveTick();
  startSpaceCanvas();
}

function leaveRoomSession() {
  if (_sessionTimer.running) pauseSessionTimer();
  if (_roomPomodoroState.running) { clearInterval(_roomPomodoroState.interval); _roomPomodoroState.running = false; }
  _stopSessionLiveTick();
  const sessionEl = document.getElementById('focusRoomSession');
  if (sessionEl) sessionEl.classList.add('hidden');
  stopSpaceCanvas();
  _currentRoomSession = null;
}

function startSessionTimer() {
  const mod = document.getElementById('sessionModuleSelect').value;
  if (!mod) { showToast('Pick a subject', 'Select a subject before starting', 'warning'); return; }
  if (_sessionTimer.running) return;
  _sessionTimer.module = mod;
  _sessionTimer.running = true;
  const startBtn = document.getElementById('sessionStartBtn');
  const pauseBtn = document.getElementById('sessionPauseBtn');
  const statusEl = document.getElementById('sessionTimerStatus');
  if (startBtn) startBtn.style.display = 'none';
  if (pauseBtn) pauseBtn.style.display = 'inline-flex';
  if (statusEl) statusEl.textContent = '🔴 Focused — stay locked in';
  _sessionTimer.interval = setInterval(() => {
    _sessionTimer.seconds++;
    updateSessionTimerDisplay();
  }, 1000);
}

async function pauseSessionTimer() {
  if (!_sessionTimer.running) return;
  clearInterval(_sessionTimer.interval);
  _sessionTimer.running = false; _sessionTimer.interval = null;
  const startBtn = document.getElementById('sessionStartBtn');
  const pauseBtn = document.getElementById('sessionPauseBtn');
  const statusEl = document.getElementById('sessionTimerStatus');
  if (startBtn) startBtn.style.display = 'inline-flex';
  if (pauseBtn) pauseBtn.style.display = 'none';
  if (statusEl) statusEl.textContent = '⏸ Paused';
  const mins = Math.round(_sessionTimer.seconds / 60);
  if (mins >= 1 && _currentRoomSession) {
    await _logRoomTime(_sessionTimer.module, mins);
  } else if (mins >= 1) {
    await logStudySessionFromTimer(_sessionTimer.module, mins);
    _sessionTimer.seconds = 0;
    updateSessionTimerDisplay();
  }
}

function updateSessionTimerDisplay() {
  const s = _sessionTimer.seconds;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const el = document.getElementById('sessionTimerDisplay');
  if (el) el.textContent = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
}

function updateSessionUI(room) {
  const dailyGoal = room.ruleDailyMin || 60;
  const pct = Math.min(100, (_sessionTodayMinutes / dailyGoal) * 100);
  const pb = document.getElementById('sessionProgressBar');
  const tm = document.getElementById('sessionTodayMins');
  const dg = document.getElementById('sessionDailyGoal');
  const ol = document.getElementById('sessionOnlineCount');
  const dr = document.getElementById('sessionDailyReward');
  if (pb) pb.style.width = pct + '%';
  if (tm) tm.textContent = _sessionTodayMinutes + ' / ' + dailyGoal + ' min';
  if (dg) dg.textContent = `🎯 ${_sessionTodayMinutes} / ${dailyGoal} min today`;
  if (ol) ol.textContent = `👥 ${room.participants?.length || 1} in room`;
  if (dr) {
    if (pct >= 100) {
      dr.textContent = `✅ Daily goal met! +${room.dailyPoints || 10} pts earned`;
      dr.style.color = '#34d399';
    } else {
      const remaining = dailyGoal - _sessionTodayMinutes;
      dr.textContent = `${remaining} min left to earn ${room.dailyPoints || 10} pts today`;
      dr.style.color = 'rgba(255,255,255,.4)';
    }
  }
}

function renderSessionLeaderboard(room) {
  const container = document.getElementById('sessionLeaderboard');
  if (!container) return;
  const lb = (room.leaderboard || []).sort((a, b) => b.totalMinutes - a.totalMinutes);
  if (!lb.length) {
    container.innerHTML = '<div style="color:rgba(255,255,255,.3);text-align:center;padding:20px;font-size:.82rem;">No activity yet — be first! 🚀</div>';
    return;
  }
  const medals = ['🥇','🥈','🥉'];
  container.innerHTML = lb.map((u, i) => {
    const isMe = u.userId === CUK;
    const h = Math.floor(u.totalMinutes / 60), m = u.totalMinutes % 60;
    return `<div style="display:flex;align-items:center;gap:10px;background:${isMe ? 'rgba(124,58,237,.2)' : 'rgba(255,255,255,.04)'};border:1px solid ${isMe ? 'rgba(124,58,237,.4)' : 'rgba(255,255,255,.06)'};border-radius:12px;padding:10px 12px;">
      <div style="font-size:1.1rem;width:22px;text-align:center;">${medals[i] || (i+1)}</div>
      <div style="flex:1;min-width:0;">
        <div style="color:${isMe ? '#c4b5fd' : '#fff'};font-weight:700;font-size:.82rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.name}${isMe ? ' (you)' : ''}</div>
        <div style="color:rgba(255,255,255,.4);font-size:.7rem;">${u.module || '—'}</div>
      </div>
      <div style="text-align:right;">
        <div style="color:#a78bfa;font-size:.95rem;font-weight:900;">${h}h ${m}m</div>
        ${u.points ? `<div style="color:#fbbf24;font-size:.68rem;">+${u.points} pts</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function renderApprovalBar(room) {
  const bar = document.getElementById('approvalBar');
  if (!bar || room.createdBy !== CUK || !room.requireApproval) { if(bar) bar.style.display = 'none'; return; }
  const pending = room.pendingApprovals || [];
  if (!pending.length) { bar.style.display = 'none'; return; }
  bar.style.display = 'block';
  const listEl = document.getElementById('pendingApprovalsList');
  if (!listEl) return;
  listEl.innerHTML = pending.map(uid => {
    return `<div style="display:flex;align-items:center;gap:8px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);border-radius:10px;padding:6px 12px;">
      <span style="color:#fbbf24;font-size:.82rem;font-weight:600;">${uid}</span>
      <button onclick="window.approveJoin('${room.id}','${uid}','${uid}')" style="background:#059669;color:#fff;border:none;padding:4px 10px;border-radius:6px;font-size:.75rem;font-weight:700;cursor:pointer;">✓ Approve</button>
      <button onclick="window.rejectJoin('${room.id}','${uid}','${uid}')" style="background:#ef4444;color:#fff;border:none;padding:4px 10px;border-radius:6px;font-size:.75rem;font-weight:700;cursor:pointer;">✕ Reject</button>
    </div>`;
  }).join('');
}

function _startSessionLiveTick() {
  if (window._sessionLiveTick) clearInterval(window._sessionLiveTick);
  window._sessionLiveTick = setInterval(() => {
    if (!_sessionTimer.running) return;
    const liveMins = _sessionTodayMinutes + Math.round(_sessionTimer.seconds / 60);
    const goal = _currentRoomSession?.ruleDailyMin || 180;
    const pct = Math.min(100, (liveMins/goal)*100);
    const pb = document.getElementById('sessionProgressBar');
    if (pb) pb.style.width = pct + '%';
    const tm = document.getElementById('sessionTodayMins');
    if (tm) tm.textContent = `${liveMins} / ${goal} min`;
  }, 2000);
}
function _stopSessionLiveTick() { if(window._sessionLiveTick){ clearInterval(window._sessionLiveTick); window._sessionLiveTick=null; } }

function renderRoomSessionSummary() {
  const container = document.getElementById('roomSessionSummary');
  if (!container) return;
  const today = new Date().toISOString().split('T')[0];
  const sessions = _studySessions.filter(s => s.userId===CUK && s.date===today);
  if (!sessions.length) { container.innerHTML='<span style="color:rgba(255,255,255,.35);font-size:.78rem;">Nothing logged yet — start studying!</span>'; return; }
  const modMap = {};
  sessions.forEach(s => { modMap[s.module]=(modMap[s.module]||0)+(s.duration||0); });
  const totalMins = sessions.reduce((sum,s)=>sum+(s.duration||0),0);
  const goal = _currentRoomSession?.ruleDailyMin || 180;
  const pct = Math.min(100,(totalMins/goal)*100);
  const th=Math.floor(totalMins/60), tm2=totalMins%60;
  container.innerHTML=`<div style="display:flex;flex-direction:column;gap:5px;width:100%;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <span style="color:#fbbf24;font-weight:700;font-size:.8rem;">⏱ ${th>0?th+'h ':''} ${tm2}m today</span>
      ${Object.entries(modMap).map(([mod,m])=>`<span style="background:rgba(124,58,237,.3);border:1px solid rgba(124,58,237,.4);color:#c4b5fd;padding:3px 9px;border-radius:20px;font-size:.71rem;font-weight:600;">${mod.split('–')[0].trim()}: ${Math.floor(m/60)>0?Math.floor(m/60)+'h ':''} ${m%60>0?m%60+'m':''}</span>`).join('')}
      ${pct>=100?'<span style="color:#34d399;font-weight:700;font-size:.78rem;">✅ Goal met!</span>':''}
    </div>
    <div style="height:5px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden;">
      <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#7c3aed,#ec4899,#f59e0b);border-radius:3px;transition:width .6s;"></div>
    </div></div>`;
}

async function _logRoomTime(module, mins) {
  if (!_currentRoomSession || mins < 1) return;
  await logStudySessionFromTimer(module, mins, null, 'Focus Room');
  const roomId = _currentRoomSession.id;
  const room = _focusRooms.find(r => r.id === roomId) || _currentRoomSession;
  let lb = JSON.parse(JSON.stringify(room.leaderboard || []));
  let entry = lb.find(e => e.userId === CUK);
  if (entry) { entry.totalMinutes += mins; }
  else { lb.push({ userId: CUK, name: CU.name, module, totalMinutes: mins, points: 0 }); entry = lb[lb.length-1]; }
  const prevTotal = _sessionTodayMinutes;
  _sessionTodayMinutes += mins;
  const month2 = new Date().toISOString().slice(0,7);
  for (const tier of [{mins:180,pts:5,label:'3 hrs'},{mins:300,pts:10,label:'5 hrs'},{mins:420,pts:15,label:'7 hrs'}]) {
    if (prevTotal < tier.mins && _sessionTodayMinutes >= tier.mins) {
      entry.points = (entry.points||0) + tier.pts;
      await FS.addPoint({ by:CUK, byName:CU.name, faculty:CU.faculty, module, testName:`Focus Room – ${tier.label} goal`, mark:100, points:tier.pts, month:month2, date:new Date().toISOString() });
      showToast(`🎯 ${tier.label} Goal!`, `+${tier.pts} pts earned!`, 'success');
    }
  }
  await FS.updateFocusRoom(roomId, { leaderboard: lb });
  _sessionTimer.seconds = 0;
  _currentRoomSession = { ..._currentRoomSession, leaderboard: lb };
  renderSessionLeaderboard(_currentRoomSession);
  updateSessionUI(_currentRoomSession);
  updateSessionTimerDisplay();
  renderRoomSessionSummary();
  updateRoomPomodoroProgress();
}

function updateRoomPomodoroProgress() {
  const goal=_currentRoomSession?.ruleDailyMin||180, pct=Math.min(100,(_sessionTodayMinutes/goal)*100);
  const pb=document.getElementById('roomPomodoroProgressBar'); if(pb) pb.style.width=pct+'%';
  const tm=document.getElementById('roomPomodoroTodayMins'); if(tm) tm.textContent=`${_sessionTodayMinutes} / ${goal} min`;
}

// Study goals in session
let _studyGoals = [];
function toggleAddGoal(){ const f=document.getElementById('addGoalForm'); f.style.display=f.style.display==='none'?'block':'none'; }
function addStudyGoal(){
  const text=document.getElementById('newGoalText').value.trim();
  const mod=document.getElementById('newGoalModule').value;
  if(!text){showToast('Empty','Enter a goal','warning');return;}
  _studyGoals.push({id:Date.now(),text,module:mod,done:false,createdAt:new Date().toISOString()});
  document.getElementById('newGoalText').value='';
  renderGoalsList(); document.getElementById('addGoalForm').style.display='none';
  saveToLocal('studyGoals_'+CUK,_studyGoals);
}
function toggleGoalDone(id){ const g=_studyGoals.find(g=>g.id===id); if(g){g.done=!g.done;saveToLocal('studyGoals_'+CUK,_studyGoals);renderGoalsList();} }
function deleteGoal(id){ _studyGoals=_studyGoals.filter(g=>g.id!==id);saveToLocal('studyGoals_'+CUK,_studyGoals);renderGoalsList(); }
function renderGoalsList(){
  const c=document.getElementById('goalsList'); if(!c)return;
  if(!_studyGoals.length){c.innerHTML='<div style="color:rgba(255,255,255,.35);font-size:.8rem;text-align:center;padding:12px;">No goals yet!</div>';return;}
  const active=_studyGoals.filter(g=>!g.done), done=_studyGoals.filter(g=>g.done);
  c.innerHTML=[...active,...done].map(g=>`<div style="display:flex;align-items:center;gap:10px;background:${g.done?'rgba(5,150,105,.15)':'rgba(255,255,255,.06)'};border:1px solid ${g.done?'rgba(5,150,105,.3)':'rgba(255,255,255,.1)'};border-radius:10px;padding:9px 12px;">
    <button onclick="window.toggleGoalDone(${g.id})" style="width:20px;height:20px;border-radius:50%;border:2px solid ${g.done?'#34d399':'rgba(255,255,255,.4)'};background:${g.done?'#059669':'transparent'};cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#fff;">${g.done?'✓':''}</button>
    <div style="flex:1;min-width:0;"><div style="color:${g.done?'rgba(255,255,255,.4)':'#fff'};font-size:.82rem;font-weight:600;text-decoration:${g.done?'line-through':'none'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${g.text}</div>${g.module?`<div style="color:rgba(255,255,255,.35);font-size:.68rem;">${g.module.split('–')[0].trim()}</div>`:''}</div>
    <button onclick="window.deleteGoal(${g.id})" style="background:none;border:none;color:rgba(255,255,255,.3);cursor:pointer;font-size:.9rem;padding:2px 4px;">✕</button>
  </div>`).join('');
}
function saveSessionObjective(){ const t=document.getElementById('sessionObjective').value.trim(); if(t){saveToLocal('sessionObjective_'+CUK,t);showToast('Saved','Objective saved!','success');} }
function saveSessionNotes(){ const t=document.getElementById('sessionNotesPad').value.trim(); if(t){saveToLocal('sessionNotes_'+new Date().toISOString().split('T')[0]+'_'+CUK,t);showToast('Saved','Notes saved!','success');} }

// Rating functions
let rStars = 0, rTags = [], rTarget = '';
function openRate(tutorId,tutorName){ rTarget=tutorId; rStars=0; rTags=[]; const whoEl=document.getElementById('rateWho'); if(whoEl) whoEl.textContent=`Rate your session with ${tutorName}`; document.querySelectorAll('.rate-star').forEach(el=>el.classList.remove('on')); document.querySelectorAll('.rate-tag').forEach(el=>el.classList.remove('on')); const noteEl=document.getElementById('rateNote'); if(noteEl) noteEl.value=''; document.getElementById('rateMod').classList.add('on'); }
function setStar(n){ rStars=n; document.querySelectorAll('.rate-star').forEach((el,i)=>el.classList.toggle('on',i<n)); }
function toggleTag(el){ el.classList.toggle('on'); const tag=el.textContent; if(el.classList.contains('on')){ if(!rTags.includes(tag)) rTags.push(tag); } else rTags=rTags.filter(t=>t!==tag); }
async function submitRating() {
  if (rStars === 0) { alert('Select stars'); return; }
  const rating = { by: CUK, byName: CU.name, stars: rStars, tags: rTags, note: document.getElementById('rateNote')?.value, at: new Date().toISOString() };
  await FS.addRating(rTarget, rating);
  showToast('Rating saved', 'Thank you!', 'success');
  closeRate();
}
function closeRate(){ document.getElementById('rateMod').classList.remove('on'); }

// Make functions globally available
window.renderRoomsPage = renderRoomsPage;
window.renderFocusRooms = renderFocusRooms;
window.createFocusRoom = createFocusRoom;
window.joinFocusRoom = joinFocusRoom;
window.leaveFocusRoom = leaveFocusRoom;
window.endFocusRoom = endFocusRoom;
window.startRoomTimer = startRoomTimer;
window.openRoomSession = openRoomSession;
window.leaveRoomSession = leaveRoomSession;
window.startSessionTimer = startSessionTimer;
window.pauseSessionTimer = pauseSessionTimer;
window.openRoomSessionById = openRoomSessionById;
window.startRoomPomodoro = startRoomPomodoro;
window.pauseRoomPomodoro = pauseRoomPomodoro;
window.resetRoomPomodoro = resetRoomPomodoro;
window.setRoomPomodoroPreset = setRoomPomodoroPreset;
window.switchRoomTab = switchRoomTab;
window.toggleAddGoal = toggleAddGoal;
window.addStudyGoal = addStudyGoal;
window.toggleGoalDone = toggleGoalDone;
window.deleteGoal = deleteGoal;
window.saveSessionObjective = saveSessionObjective;
window.saveSessionNotes = saveSessionNotes;
window.openRate = openRate;
window.setStar = setStar;
window.toggleTag = toggleTag;
window.submitRating = submitRating;
window.closeRate = closeRate;
window.approveJoin = approveJoin;
window.rejectJoin = rejectJoin;

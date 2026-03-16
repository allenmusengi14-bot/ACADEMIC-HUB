import { CU, CUK, mods, _focusRooms } from '../app.js';
import { FS } from '../firebase-config.js';
import { showToast, formatStopwatchTime } from '../components/utils.js';

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

// Make functions globally available
window.renderRoomsPage = renderRoomsPage;
window.renderFocusRooms = renderFocusRooms;
window.createFocusRoom = createFocusRoom;
window.joinFocusRoom = joinFocusRoom;
window.leaveFocusRoom = leaveFocusRoom;
window.endFocusRoom = endFocusRoom;
window.startRoomTimer = startRoomTimer;

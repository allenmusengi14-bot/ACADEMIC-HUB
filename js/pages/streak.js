import { CU, CUK, mods, _studySessions } from './app.js.js';
import { FS } from './firebase-config.js.js';
import { showToast } from './toast.js.js';
import { formatStopwatchTime, formatPomodoroTime, saveToLocal, loadFromLocal } from './utils.js.js';

// Timer state
let pomodoroInterval = null;
let pomodoroSeconds = 25 * 60;
let pomodoroRunning = false;
let pomodoroPreset = 25;
let pomodoroModule = '';

let stopwatchState = { 
  running: false, 
  seconds: 0, 
  module: '', 
  lastModule: '', 
  interval: null, 
  date: new Date().toDateString() 
};
let stopwatchLaps = [];

// Calendar state
let currentCalendarDate = new Date();
let selectedCalendarDate = new Date();

// Render Streak page
export function renderStreakPage() {
  const page = document.getElementById('pg-streak');
  if (!page) return;
  
  page.innerHTML = `
    <div class="page-header"><h1>🔥 Study Streak</h1><p>Track your study time with dual timers and calendar view</p></div>

    <div class="streak-header">
      <div class="streak-badge">
        <span class="streak-fire">🔥</span>
        <span class="streak-count" id="streakCount">${CU?.studyStats?.streak || 0}</span>
        <span class="streak-label">day streak</span>
      </div>
      <div class="streak-badge" style="background:linear-gradient(135deg,var(--blue3),var(--purple2));color:var(--purple);">
        <span class="streak-fire">⏱️</span>
        <span class="streak-count" id="totalHours">${Math.round(CU?.studyStats?.totalHours || 0)}</span>
        <span class="streak-label">total hours</span>
      </div>
      <div class="streak-badge" style="background:linear-gradient(135deg,var(--green2),var(--teal2));color:var(--green);">
        <span class="streak-fire">⭐</span>
        <span class="streak-count" id="streakPoints">${CU?.studyStats?.points || 0}</span>
        <span class="streak-label">points earned</span>
      </div>
    </div>

    <div class="timer-section">
      <!-- Pomodoro Timer -->
      <div class="timer-card">
        <div class="timer-card-title"><i>🍅</i> Pomodoro Timer</div>
        <div class="module-selector">
          <select id="pomodoroModule" class="req-fi"><option value="">— Select module —</option></select>
        </div>
        <div class="timer-presets">
          <span class="timer-preset active" onclick="window.setPomodoroPreset(25, this)">25 min</span>
          <span class="timer-preset" onclick="window.setPomodoroPreset(30, this)">30 min</span>
          <span class="timer-preset" onclick="window.setPomodoroPreset(45, this)">45 min</span>
          <span class="timer-preset" onclick="window.setPomodoroPreset(60, this)">60 min</span>
        </div>
        <div class="timer-display-large" id="pomodoroDisplay">25:00</div>
        <div class="timer-controls">
          <button class="btn btn-green" onclick="window.startPomodoro()" id="pomodoroStartBtn">▶ Start</button>
          <button class="btn btn-red" onclick="window.pausePomodoro()" id="pomodoroPauseBtn" style="display:none;">⏸ Pause</button>
          <button class="btn btn-blue" onclick="window.resetPomodoro()">🔄 Reset</button>
        </div>
        <div style="margin-top:10px;text-align:center;font-size:.8rem;color:var(--muted);" id="pomodoroStatus">
          Focus time - Select module to start
        </div>
      </div>
      
      <!-- Stopwatch -->
      <div class="timer-card">
        <div class="timer-card-title"><i>⏱️</i> Stopwatch (Count Up)</div>
        <div class="module-selector">
          <select id="stopwatchModule" class="req-fi"><option value="">— Select module —</option></select>
        </div>
        <div class="stopwatch-display" id="stopwatchDisplay">00:00:00</div>
        <div class="timer-controls">
          <button class="btn btn-green" onclick="window.startStopwatch()" id="stopwatchStartBtn">▶ Start</button>
          <button class="btn btn-red" onclick="window.pauseStopwatch()" id="stopwatchPauseBtn" style="display:none;">⏸ Pause</button>
          <button class="btn btn-blue" onclick="window.resetStopwatch()">🔄 Reset</button>
          <button class="btn btn-purple" onclick="window.lapStopwatch()" id="stopwatchLapBtn">📍 Lap</button>
        </div>
        <div id="stopwatchLaps" class="stopwatch-laps"></div>
      </div>
    </div>

    <!-- Heat Calendar -->
    <div class="calendar-section">
      <div class="calendar-header">
        <div class="calendar-month" id="calendarMonthYear">${new Date().toLocaleDateString('en-US', {month:'long', year:'numeric'})}</div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm btn-outline" onclick="window.changeMonth(-1)">←</button>
          <button class="btn btn-sm btn-outline" onclick="window.changeMonth(1)">→</button>
          <button class="btn btn-sm btn-blue" onclick="window.goToToday()">Today</button>
        </div>
      </div>
      <div class="calendar-grid" id="calendarWeekdays">
        <div class="calendar-weekday">Mon</div><div class="calendar-weekday">Tue</div><div class="calendar-weekday">Wed</div>
        <div class="calendar-weekday">Thu</div><div class="calendar-weekday">Fri</div><div class="calendar-weekday">Sat</div><div class="calendar-weekday">Sun</div>
      </div>
      <div class="calendar-grid" id="calendarDays"></div>
      <div class="daily-stats" id="dailyStats">
        <div class="daily-stat-row"><span class="label">Selected day:</span><span class="value" id="selectedDateDisplay">No date selected</span></div>
        <div class="daily-stat-row"><span class="label">Study time:</span><span class="value" id="selectedDayTime">0 minutes</span></div>
        <div class="daily-stat-row"><span class="label">Sessions:</span><span class="value" id="selectedDaySessions">0</span></div>
      </div>
    </div>

    <div class="session-form">
      <h4 style="margin-bottom:15px;">📝 Log Study Session</h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
        <div>
          <label style="font-size:.75rem;font-weight:700;color:var(--muted);">Module</label>
          <select id="sessionModule" class="req-fi"><option value="">Select module</option></select>
        </div>
        <div>
          <label style="font-size:.75rem;font-weight:700;color:var(--muted);">Duration (mins)</label>
          <input type="number" id="sessionDuration" class="req-fi" value="25" min="1" max="480">
        </div>
        <div>
          <label style="font-size:.75rem;font-weight:700;color:var(--muted);"> </label>
          <button class="btn btn-green btn-block" onclick="window.logStudySession()">✓ Log Session</button>
        </div>
      </div>
    </div>

    <div class="forecast-card">
      <div class="forecast-title">📊 Study Forecast</div>
      <div class="forecast-value" id="forecastText">On track to reach 50 hours this month</div>
      <div class="progress-bar" style="margin-top:10px;"><div class="progress-fill" id="monthlyProgress" style="width:0%"></div></div>
      <p style="font-size:.75rem;color:var(--muted);margin-top:5px;" id="monthlyGoal">0/50 hours this month</p>
    </div>

    <div class="card">
      <div class="card-title">Recent Study Sessions</div>
      <div id="sessionHistory" class="session-history"></div>
    </div>

    <div class="card">
      <div class="card-title">🏆 Achievements</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;" id="achievementsList">
        <div class="badge badge-info" style="opacity:0.5;">🌱 Beginner (0-10 hrs)</div>
        <div class="badge badge-success" style="opacity:0.5;">🔥 7-Day Streak</div>
        <div class="badge badge-purple" style="opacity:0.5;">⚡ 20 Hours</div>
      </div>
    </div>
  `;
  
  populateStreakModules();
  renderSessionHistory();
  renderHeatCalendar();
}

// Populate module dropdowns
function populateStreakModules() {
  const opts = mods.length
    ? mods.map(m => `<option value="${m.code} – ${m.name}">${m.code} – ${m.name}</option>`).join('')
    : '<option value="">No modules — set in Profile</option>';
  
  ['pomodoroModule', 'stopwatchModule', 'sessionModule'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = '<option value="">— Select module —</option>' + opts;
    }
  });
}

// Pomodoro functions
function setPomodoroPreset(min, el) {
  document.querySelectorAll('.timer-preset').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
  pomodoroPreset = min;
  resetPomodoro();
}

function startPomodoro() {
  const moduleSelect = document.getElementById('pomodoroModule');
  if (!moduleSelect.value) {
    showToast('Select Module', 'Please select a module to start timer.', 'warning');
    return;
  }
  
  pomodoroModule = moduleSelect.value;
  if (pomodoroRunning) return;
  
  pomodoroRunning = true;
  document.getElementById('pomodoroStartBtn').style.display = 'none';
  document.getElementById('pomodoroPauseBtn').style.display = 'inline-flex';
  document.getElementById('pomodoroStatus').textContent = '🔴 Focus time - Stay focused!';
  
  pomodoroInterval = setInterval(() => {
    if (pomodoroSeconds <= 0) {
      clearInterval(pomodoroInterval);
      pomodoroRunning = false;
      document.getElementById('pomodoroStartBtn').style.display = 'inline-flex';
      document.getElementById('pomodoroPauseBtn').style.display = 'none';
      document.getElementById('pomodoroStatus').textContent = '✅ Session complete!';
      
      logStudySessionFromTimer(pomodoroModule, pomodoroPreset);
      showToast('Focus Complete!', `Great job! You focused for ${pomodoroPreset} minutes.`, 'success');
      
      resetPomodoro();
    } else {
      pomodoroSeconds--;
      updatePomodoroDisplay();
    }
  }, 1000);
}

function pausePomodoro() {
  if (!pomodoroRunning) return;
  pomodoroRunning = false;
  clearInterval(pomodoroInterval);
  document.getElementById('pomodoroStartBtn').style.display = 'inline-flex';
  document.getElementById('pomodoroPauseBtn').style.display = 'none';
  document.getElementById('pomodoroStatus').textContent = '⏸ Paused';
}

function resetPomodoro() {
  pomodoroRunning = false;
  clearInterval(pomodoroInterval);
  pomodoroSeconds = pomodoroPreset * 60;
  updatePomodoroDisplay();
  document.getElementById('pomodoroStartBtn').style.display = 'inline-flex';
  document.getElementById('pomodoroPauseBtn').style.display = 'none';
  document.getElementById('pomodoroStatus').textContent = 'Focus time - Select module to start';
}

function updatePomodoroDisplay() {
  document.getElementById('pomodoroDisplay').textContent = formatPomodoroTime(pomodoroSeconds);
}

// Stopwatch functions
function checkStopwatchDateReset() {
  const today = new Date().toDateString();
  if (stopwatchState.date !== today) {
    if (stopwatchState.seconds > 0 && stopwatchState.lastModule) {
      logStudySessionFromTimer(stopwatchState.lastModule, Math.round(stopwatchState.seconds/60), new Date(Date.now()-86400000));
    }
    stopwatchState.seconds = 0;
    stopwatchState.running = false;
    stopwatchState.module = '';
    stopwatchState.date = today;
    if (stopwatchState.interval) clearInterval(stopwatchState.interval);
    stopwatchState.interval = null;
    updateStopwatchDisplay();
    document.getElementById('stopwatchStartBtn').style.display = 'inline-flex';
    document.getElementById('stopwatchPauseBtn').style.display = 'none';
  }
}

function startStopwatch() {
  checkStopwatchDateReset();
  const moduleSelect = document.getElementById('stopwatchModule');
  if (!moduleSelect.value) {
    showToast('Select Module', 'Please choose a subject', 'warning');
    return;
  }
  
  const newMod = moduleSelect.value;
  if (stopwatchState.running) return;
  
  if (!stopwatchState.module || stopwatchState.module !== newMod) {
    if (stopwatchState.seconds > 0 && stopwatchState.module) {
      logStudySessionFromTimer(stopwatchState.module, Math.round(stopwatchState.seconds/60));
    }
    stopwatchState.seconds = 0;
    stopwatchState.module = newMod;
    stopwatchState.lastModule = newMod;
  }
  
  stopwatchState.running = true;
  document.getElementById('stopwatchStartBtn').style.display = 'none';
  document.getElementById('stopwatchPauseBtn').style.display = 'inline-flex';
  
  stopwatchState.interval = setInterval(() => {
    stopwatchState.seconds++;
    updateStopwatchDisplay();
  }, 1000);
}

function pauseStopwatch() {
  if (!stopwatchState.running) return;
  stopwatchState.running = false;
  clearInterval(stopwatchState.interval);
  stopwatchState.interval = null;
  document.getElementById('stopwatchStartBtn').style.display = 'inline-flex';
  document.getElementById('stopwatchPauseBtn').style.display = 'none';
  
  if (stopwatchState.seconds > 0 && stopwatchState.module) {
    logStudySessionFromTimer(stopwatchState.module, Math.round(stopwatchState.seconds/60));
    stopwatchState.seconds = 0;
  }
}

function resetStopwatch() {
  if (stopwatchState.seconds > 0 && stopwatchState.module) {
    logStudySessionFromTimer(stopwatchState.module, Math.round(stopwatchState.seconds/60));
  }
  
  stopwatchState.seconds = 0;
  stopwatchState.running = false;
  if (stopwatchState.interval) clearInterval(stopwatchState.interval);
  stopwatchState.interval = null;
  updateStopwatchDisplay();
  stopwatchLaps = [];
  document.getElementById('stopwatchLaps').innerHTML = '';
  document.getElementById('stopwatchStartBtn').style.display = 'inline-flex';
  document.getElementById('stopwatchPauseBtn').style.display = 'none';
}

function lapStopwatch() {
  if (!stopwatchState.running) return;
  stopwatchLaps.push(formatStopwatchTime(stopwatchState.seconds));
  renderStopwatchLaps();
}

function updateStopwatchDisplay() {
  document.getElementById('stopwatchDisplay').textContent = formatStopwatchTime(stopwatchState.seconds);
}

function renderStopwatchLaps() {
  const container = document.getElementById('stopwatchLaps');
  container.innerHTML = stopwatchLaps.map((lap, i) => 
    `<div class="lap-item"><span>Lap ${i+1}</span><span class="lap-time">${lap}</span></div>`
  ).join('');
}

// Log study session
async function logStudySessionFromTimer(module, minutes, customDate = null) {
  if (!module || minutes < 1) return;
  
  const date = customDate ? customDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
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
  
  // Refresh study sessions
  const updatedSessions = await FS.getUserStudySessions(CUK);
  _studySessions.length = 0;
  _studySessions.push(...updatedSessions);
  
  renderSessionHistory();
  updateStreakStats();
  renderHeatCalendar();
}

async function logStudySession() {
  const module = document.getElementById('sessionModule').value;
  const dur = parseInt(document.getElementById('sessionDuration').value);
  
  if (!module || !dur) {
    alert('Select module and duration');
    return;
  }
  
  await logStudySessionFromTimer(module, dur);
  showToast('Session Logged', `Logged ${dur} minutes.`, 'success');
}

// Render session history
function renderSessionHistory() {
  const container = document.getElementById('sessionHistory');
  if (!_studySessions || !_studySessions.length) {
    container.innerHTML = '<div class="empty"><div class="ei">📋</div><p>No study sessions yet.</p></div>';
    return;
  }
  
  container.innerHTML = _studySessions.slice(0, 10).map(s => `
    <div class="session-item">
      <span class="session-subject">${s.module || 'Study'}</span>
      <span class="session-time">${new Date(s.date).toLocaleDateString()}</span>
      <span class="session-duration">${s.duration} min</span>
    </div>
  `).join('');
}

// Update streak stats
function updateStreakStats() {
  document.getElementById('streakCount').textContent = CU?.studyStats?.streak || 0;
  document.getElementById('totalHours').textContent = Math.round(CU?.studyStats?.totalHours || 0);
  document.getElementById('streakPoints').textContent = CU?.studyStats?.points || 0;
}

// Calendar functions
function renderHeatCalendar() {
  const container = document.getElementById('calendarDays');
  if (!container) return;
  
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  document.getElementById('calendarMonthYear').textContent = 
    currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  let html = '';
  
  for (let i = 0; i < startOffset; i++) {
    html += '<div class="calendar-day empty"></div>';
  }
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const mins = getStudyMinutes(dateStr);
    
    let heatClass = 'heat-0';
    if (mins >= 120) heatClass = 'heat-4';
    else if (mins >= 90) heatClass = 'heat-3';
    else if (mins >= 60) heatClass = 'heat-2';
    else if (mins >= 30) heatClass = 'heat-1';
    
    const isToday = (new Date().toDateString() === new Date(year, month, d).toDateString());
    const classes = `calendar-day ${heatClass} ${isToday ? 'today' : ''}`;
    
    html += `<div class="${classes}" onclick="window.selectCalendarDay('${dateStr}')">
      ${d}<span class="study-stat-tooltip">${mins} min</span>
    </div>`;
  }
  
  container.innerHTML = html;
  updateSelectedDayStats();
}

function selectCalendarDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  selectedCalendarDate = new Date(y, m - 1, d);
  showDailyModules(dateStr);
}

function showDailyModules(dateStr) {
  const sessions = _studySessions.filter(s => s.userId === CUK && s.date === dateStr);
  const modTimes = {};
  
  sessions.forEach(s => {
    modTimes[s.module] = (modTimes[s.module] || 0) + s.duration;
  });
  
  const list = Object.entries(modTimes).map(([mod, min]) => 
    `<div>${mod}: ${min} min</div>`
  ).join('');
  
  document.getElementById('dailyStats').innerHTML = `
    <div class="daily-stat-row"><span class="label">${dateStr}</span></div>
    ${list}
  `;
  
  document.getElementById('selectedDateDisplay').textContent = 
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('selectedDayTime').textContent = getStudyMinutes(dateStr) + ' minutes';
  document.getElementById('selectedDaySessions').textContent = sessions.length;
}

function getStudyMinutes(dateStr) {
  return _studySessions
    .filter(s => s.userId === CUK && s.date === dateStr)
    .reduce((sum, s) => sum + (s.duration || 0), 0);
}

function changeMonth(delta) {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
  renderHeatCalendar();
}

function goToToday() {
  currentCalendarDate = new Date();
  selectedCalendarDate = new Date();
  renderHeatCalendar();
}

function updateSelectedDayStats() {
  // Called inside render
}

// Calendar views state
let _calView = 'month';

function setCalView(view) {
  _calView = view;
  document.querySelectorAll('.cal-view-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('calView-' + view);
  if (btn) btn.classList.add('active');
  const hdr = document.getElementById('calendarWeekdaysRow');
  if (hdr) hdr.style.display = (view === 'day' || view === 'month') ? 'none' : '';
  const grid = document.getElementById('calendarDays');
  if (grid) {
    grid.style.gridTemplateColumns = view === 'month' ? 'repeat(4,1fr)' : 'repeat(7,1fr)';
  }
  renderHeatCalendar();
}

function renderHeatCalendar() {
  const container = document.getElementById('calendarDays');
  if (!container) return;
  if (_calView === 'day') { renderDayView(); return; }
  if (_calView === 'week') { renderWeekView(); return; }
  renderMonthView();
}

function renderMonthView() {
  const container = document.getElementById('calendarDays');
  const hdr = document.getElementById('calendarWeekdaysRow');
  if (hdr) hdr.style.display = 'none';
  const year = currentCalendarDate.getFullYear();
  document.getElementById('calendarMonthYear').textContent = `${year} — Monthly Overview`;
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  container.style.gridTemplateColumns = 'repeat(4,1fr)';
  let html = '';
  for (let m = 0; m < 12; m++) {
    const prefix = `${year}-${String(m+1).padStart(2,'0')}`;
    const mins = _studySessions
      .filter(s => s.userId === CUK && s.date.startsWith(prefix))
      .reduce((sum, s) => sum + (s.duration || 0), 0);
    const h = Math.floor(mins/60), min = mins%60;
    let heatClass = 'heat-0';
    if (mins >= 420*20) heatClass='heat-4'; else if (mins >= 300*20) heatClass='heat-3';
    else if (mins >= 180*10) heatClass='heat-2'; else if (mins >= 60*5) heatClass='heat-1';
    const isCurrent = new Date().getMonth() === m && new Date().getFullYear() === year;
    const isSel = selectedCalendarDate?.getMonth() === m && selectedCalendarDate?.getFullYear() === year;
    const monthStr = `${year}-${String(m+1).padStart(2,'0')}`;
    html += `<div class="calendar-day ${heatClass} ${isCurrent?'today':''}"
      style="aspect-ratio:auto;padding:12px 8px;flex-direction:column;gap:3px;${isSel?'outline:2px solid var(--purple);outline-offset:1px;':''}"
      onclick="window.selectMonthView('${monthStr}')">
      <span style="font-size:.8rem;font-weight:800;">${monthNames[m]}</span>
      <span style="font-size:.65rem;opacity:.75;">${mins>0?(h>0?h+'h ':'')+( min>0?min+'m':''):'—'}</span>
    </div>`;
  }
  container.innerHTML = html;
  container.style.gridTemplateColumns = 'repeat(4,1fr)';
}

function selectMonthView(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  selectedCalendarDate = new Date(y, m-1, 1);
  showMonthSummary(monthStr);
}

function showMonthSummary(monthStr) {
  const panel = document.getElementById('dailySummaryPanel');
  if (!panel) return;
  panel.style.display = 'block';
  const sessions = _studySessions.filter(s => s.userId === CUK && s.date.startsWith(monthStr));
  const totalMins = sessions.reduce((sum,s) => sum+(s.duration||0),0);
  const h = Math.floor(totalMins/60), m = totalMins%60;
  const [year, mon] = monthStr.split('-').map(Number);
  const label = new Date(year, mon-1, 1).toLocaleDateString('en-US',{month:'long',year:'numeric'});
  document.getElementById('summaryDateLabel').textContent = `📅 ${label}`;
  document.getElementById('summaryTotalTime').textContent = totalMins>0?(h>0?h+'h ':'')+( m>0?m+'m':''):'0 min';
  const emptyMsg = document.getElementById('summaryEmptyMsg');
  const subjectList = document.getElementById('summarySubjectList');
  if (!sessions.length) { subjectList.innerHTML=''; if(emptyMsg) emptyMsg.style.display='block'; return; }
  if(emptyMsg) emptyMsg.style.display = 'none';
  const modMap = {};
  sessions.forEach(s => { modMap[s.module]=(modMap[s.module]||0)+(s.duration||0); });
  const sorted = Object.entries(modMap).sort((a,b)=>b[1]-a[1]);
  const maxMins = sorted[0] ? sorted[0][1] : 1;
  const colors = ['var(--blue2)','var(--purple)','var(--teal)','var(--pink)','var(--orange)','var(--green)'];
  if(subjectList) subjectList.innerHTML = sorted.map(([mod,mins],i) => {
    const sh=Math.floor(mins/60), sm=mins%60, pct=Math.round((mins/maxMins)*100);
    const isFR = mod.startsWith('[Focus Room]');
    const displayMod = isFR ? '🚀 ' + mod.replace('[Focus Room] ','') : mod;
    return `<div class="summary-subject-bar"><div style="flex:1;min-width:0;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span class="summary-subject-name" style="font-size:.78rem;${isFR?'color:var(--purple);':''}">${displayMod}</span>
        <span class="summary-subject-time">${sh>0?sh+'h ':''} ${sm>0?sm+'m':''}</span>
      </div>
      <div style="height:4px;background:#e2e8f0;border-radius:2px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${isFR?'linear-gradient(90deg,var(--purple),var(--pink))':colors[i%colors.length]};border-radius:2px;transition:width .4s;"></div>
      </div></div></div>`;
  }).join('');
}

function renderWeekView() {
  const container = document.getElementById('calendarDays');
  const d = new Date(currentCalendarDate);
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - day);
  document.getElementById('calendarMonthYear').textContent =
    `Week of ${d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
  let html = '';
  for (let i = 0; i < 7; i++) {
    const dateStr = d.toISOString().split('T')[0];
    const mins = getStudyMinutes(dateStr);
    let heatClass = 'heat-0';
    if (mins >= 420) heatClass = 'heat-4'; else if (mins >= 300) heatClass = 'heat-3';
    else if (mins >= 180) heatClass = 'heat-2'; else if (mins >= 30) heatClass = 'heat-1';
    const isToday = new Date().toDateString() === d.toDateString();
    const isSel = selectedCalendarDate?.toDateString() === d.toDateString();
    const h = Math.floor(mins/60), m = mins%60;
    html += `<div class="calendar-day ${heatClass} ${isToday?'today':''}"
      style="aspect-ratio:auto;padding:14px 8px;flex-direction:column;gap:4px;${isSel?'outline:2px solid var(--purple);outline-offset:1px;':''}"
      onclick="window.selectCalendarDay('${dateStr}')">
      <span style="font-size:.65rem;font-weight:700;opacity:.7;">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</span>
      <span style="font-size:.9rem;font-weight:800;">${d.getDate()}</span>
      <span style="font-size:.62rem;opacity:.75;">${mins>0?(h>0?h+'h ':'')+(m>0?m+'m':''):'—'}</span>
    </div>`;
    d.setDate(d.getDate() + 1);
  }
  container.innerHTML = html;
}

function renderDayView() {
  const container = document.getElementById('calendarDays');
  if(container) container.innerHTML = '';
  document.getElementById('calendarMonthYear').textContent =
    currentCalendarDate.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const dateStr = currentCalendarDate.toISOString().split('T')[0];
  selectCalendarDay(dateStr);
}

function selectCalendarDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  selectedCalendarDate = new Date(y, m-1, d);
  if (_calView !== 'day') renderHeatCalendar();
  showDailySummary(dateStr);
}

function showDailySummary(dateStr) {
  const panel = document.getElementById('dailySummaryPanel');
  if (!panel) return;
  panel.style.display = 'block';
  const sessions = _studySessions.filter(s => s.userId === CUK && s.date === dateStr);
  const totalMins = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const h = Math.floor(totalMins / 60), m = totalMins % 60;
  const labelEl = document.getElementById('summaryDateLabel');
  const dateObj = new Date(dateStr + 'T12:00:00');
  const isToday = new Date().toDateString() === dateObj.toDateString();
  if(labelEl) labelEl.textContent = isToday ? '📅 Today' : dateObj.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const totalEl = document.getElementById('summaryTotalTime');
  if(totalEl) totalEl.textContent = totalMins > 0 ? (h > 0 ? h + 'h ' : '') + (m > 0 ? m + 'm' : '') : '0 min';
  const emptyMsg = document.getElementById('summaryEmptyMsg');
  const subjectList = document.getElementById('summarySubjectList');
  if (!sessions.length) { if(subjectList) subjectList.innerHTML = ''; if(emptyMsg) emptyMsg.style.display = 'block'; return; }
  if(emptyMsg) emptyMsg.style.display = 'none';
  const modMap = {};
  sessions.forEach(s => { modMap[s.module] = (modMap[s.module] || 0) + (s.duration || 0); });
  const sorted = Object.entries(modMap).sort((a, b) => b[1] - a[1]);
  const maxMins = sorted[0] ? sorted[0][1] : 1;
  const colors = ['var(--blue2)','var(--purple)','var(--teal)','var(--pink)','var(--orange)','var(--green)'];
  if(subjectList) subjectList.innerHTML = sorted.map(([mod, mins], i) => {
    const sh = Math.floor(mins/60), sm = mins%60;
    const pct = Math.round((mins / maxMins) * 100);
    const isFR = mod.startsWith('[Focus Room]');
    const displayMod = isFR ? '🚀 ' + mod.replace('[Focus Room] ','') : mod;
    const barColor = isFR ? 'linear-gradient(90deg,#7c3aed,#ec4899)' : colors[i % colors.length];
    return `<div class="summary-subject-bar">
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span class="summary-subject-name" style="font-size:.8rem;${isFR?'color:var(--purple);font-weight:800;':''}">${displayMod}</span>
          <span class="summary-subject-time">${sh>0?sh+'h ':''}${sm>0?sm+'m':''}</span>
        </div>
        <div style="height:4px;background:#e2e8f0;border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:2px;transition:width .4s;"></div>
        </div>
      </div>
    </div>`;
  }).join('');
  const selDisp = document.getElementById('selectedDateDisplay');
  if (selDisp) selDisp.textContent = isToday ? '📅 Today' : dateObj.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const selTime = document.getElementById('selectedDayTime');
  if (selTime) selTime.textContent = totalMins + ' minutes';
  const selSess = document.getElementById('selectedDaySessions');
  if (selSess) selSess.textContent = sessions.length;
}

function showDailyModules(dateStr) { showDailySummary(dateStr); }

// ==================== STUDY PETS ====================
const PET_DATA = {
  cat:     { name:'Whiskers', color:'#e8923a', accent:'#c8712a', earColor:'#f0b090', bodyShape:'round',   eyeColor:'#2d8a4e' },
  dog:     { name:'Buddy',    color:'#c8a060', accent:'#a07840', earColor:'#c8a060', bodyShape:'round',   eyeColor:'#5a3010' },
  bunny:   { name:'Cotton',   color:'#f0e8e0', accent:'#d8c8b8', earColor:'#f4b8c0', bodyShape:'tall',    eyeColor:'#e060a0' },
  fox:     { name:'Rusty',    color:'#d86020', accent:'#a84010', earColor:'#f0a060', bodyShape:'pointy',  eyeColor:'#c05810' },
  penguin: { name:'Snowball', color:'#f8f8f8', accent:'#1a1a2e', earColor:'#f8d060', bodyShape:'penguin', eyeColor:'#e05020' },
};
const PET_HRS_PER_YEAR = 2;
let _petAnimFrame = null;

function getPetSave() { return loadFromLocal('studyPet_' + CUK, null); }
function savePetSave(pet) { saveToLocal('studyPet_' + CUK, pet); }

function choosePet(type) {
  const existing = getPetSave();
  if (existing) {
    if (!confirm(`You already have ${PET_DATA[existing.type]?.name}! Adopting a new pet will release your current one (no points). Continue?`)) return;
  }
  const pet = { type, adoptedAt: new Date().toISOString(), studyHoursAtAdoption: CU?.studyStats?.totalHours || 0 };
  savePetSave(pet);
  showToast('🐾 New Pet!', `You adopted ${PET_DATA[type].name}!`, 'success');
  updatePetState();
}

function updatePetState() {
  const pet = getPetSave();
  const choosePanel = document.getElementById('petChoosePanel');
  const activePanel = document.getElementById('petActivePanel');
  if (!choosePanel || !activePanel) return;

  if (!pet) {
    choosePanel.style.display = 'block';
    activePanel.style.display = 'none';
    if (_petAnimFrame) { cancelAnimationFrame(_petAnimFrame); _petAnimFrame = null; }
    return;
  }

  choosePanel.style.display = 'none';
  activePanel.style.display = 'block';

  const totalHours = CU?.studyStats?.totalHours || 0;
  const petHours = Math.max(0, totalHours - (pet.studyHoursAtAdoption || 0));
  const age = Math.floor(petHours / PET_HRS_PER_YEAR);
  const hrsInYear = petHours % PET_HRS_PER_YEAR;
  const growthPct = (hrsInYear / PET_HRS_PER_YEAR) * 100;

  const sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 7); sevenAgo.setHours(0,0,0,0);
  const recentMins = _studySessions
    .filter(s => s.userId === CUK && new Date(s.date + 'T12:00') >= sevenAgo)
    .reduce((sum,s) => sum + (s.duration||0), 0);
  const happiness = Math.min(100, Math.round((recentMins / 420) * 100));

  let mood, moodColor, happinessGradient;
  if (happiness >= 75)      { mood = '😸 Happy';   moodColor = 'var(--green)';  happinessGradient = 'linear-gradient(90deg,#10b981,#34d399)'; }
  else if (happiness >= 40) { mood = '😊 Content'; moodColor = 'var(--gold)';   happinessGradient = 'linear-gradient(90deg,#f59e0b,#fbbf24)'; }
  else                      { mood = '😢 Sad';     moodColor = 'var(--red)';    happinessGradient = 'linear-gradient(90deg,#ef4444,#f87171)'; }

  const moodBadge = document.getElementById('petMoodBadge');
  if (moodBadge) {
    moodBadge.textContent = mood;
    moodBadge.style.background = moodColor === 'var(--green)' ? 'var(--green2)' : moodColor === 'var(--gold)' ? 'var(--gold3)' : 'var(--red2)';
    moodBadge.style.color = moodColor;
  }
  const nameEl = document.getElementById('petNameDisplay');
  if (nameEl) nameEl.textContent = PET_DATA[pet.type]?.name || '';
  const ageEl = document.getElementById('petAgeDisplay');
  if (ageEl) ageEl.textContent = age;
  const hrsEl = document.getElementById('petHoursDisplay');
  if (hrsEl) hrsEl.textContent = Math.round(petHours);
  const happyBar = document.getElementById('petHappinessBar');
  if (happyBar) { happyBar.style.width = happiness + '%'; happyBar.style.background = happinessGradient; }
  const happyLabel = document.getElementById('petHappinessLabel');
  if (happyLabel) { happyLabel.textContent = happiness + '%'; happyLabel.style.color = moodColor; }
  const growthBar = document.getElementById('petGrowthBar');
  if (growthBar) growthBar.style.width = growthPct + '%';
  const growthLabel = document.getElementById('petGrowthLabel');
  if (growthLabel) growthLabel.textContent = `${hrsInYear.toFixed(1)} / ${PET_HRS_PER_YEAR} hrs`;

  let pts = age >= 40 ? 20 : age >= 30 ? 15 : age >= 20 ? 10 : 0;
  const sellVal = document.getElementById('petSellValue');
  if (sellVal) sellVal.textContent = pts > 0 ? `🎉 Age ${age} — you can sell for ${pts} pts!` : `⏳ Age ${age} — reach 20 yrs to sell`;

  startPet3D(pet.type, happiness);
}

function startPet3D(type, happiness) {
  if (_petAnimFrame) cancelAnimationFrame(_petAnimFrame);
  const canvas = document.getElementById('petCanvas3D');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pd = PET_DATA[type] || PET_DATA.cat;
  let t = 0;

  function lighten(hex, amt) { return shiftColor(hex, amt); }
  function darken(hex, amt)  { return shiftColor(hex, -amt); }
  function shiftColor(hex, amt) {
    let c = hex.replace('#',''); if (c.length===3) c=c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
    const num = parseInt(c,16);
    const r=Math.min(255,Math.max(0,((num>>16)&255)+amt)), g=Math.min(255,Math.max(0,((num>>8)&255)+amt)), b=Math.min(255,Math.max(0,(num&255)+amt));
    return `rgb(${r},${g},${b})`;
  }

  function sphere(cx, cy, rx, ry, topCol, botCol) {
    const g = ctx.createRadialGradient(cx - rx*0.3, cy - ry*0.35, rx*0.05, cx, cy, Math.max(rx,ry));
    g.addColorStop(0, lighten(topCol, 40)); g.addColorStop(0.4, topCol); g.addColorStop(1, darken(topCol, 30));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); ctx.fill();
  }

  function drawGround() {
    const gg = ctx.createLinearGradient(0, H*0.72, 0, H);
    gg.addColorStop(0,'rgba(200,230,200,0.6)'); gg.addColorStop(1,'rgba(150,190,150,0.3)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(W/2, H*0.85, W*0.42, H*0.1, 0, 0, Math.PI*2); ctx.fill();
    ctx.save(); ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(W/2, H*0.83, W*0.28, H*0.055, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawBackground() {
    const bg = ctx.createLinearGradient(0,0,0,H);
    if (happiness >= 75) { bg.addColorStop(0,'#e8f5ff'); bg.addColorStop(1,'#f0fff4'); }
    else if (happiness >= 40) { bg.addColorStop(0,'#fff8e8'); bg.addColorStop(1,'#fef9ee'); }
    else { bg.addColorStop(0,'#f8f0ff'); bg.addColorStop(1,'#fff0f8'); }
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
    if (happiness >= 75) {
      for (let i=0;i<4;i++) {
        const sx = 20+i*40+(Math.sin(t*0.8+i)*12), sy = 20+i*15+(Math.cos(t*0.6+i)*8);
        ctx.save(); ctx.globalAlpha=0.6+0.4*Math.sin(t*2+i); ctx.fillStyle='#ffd700';
        ctx.beginPath(); for(let p=0;p<5;p++){const a=p/5*Math.PI*2-Math.PI/2,r=p%2===0?6:3;ctx.lineTo(sx+Math.cos(a)*r,sy+Math.sin(a)*r);}
        ctx.closePath(); ctx.fill(); ctx.restore();
      }
    } else if (happiness < 40) {
      for (let i=0;i<5;i++){
        const rx=(20+i*32+t*0.5)%W, ry=(t*50+i*30)%H;
        ctx.save(); ctx.globalAlpha=0.4; ctx.strokeStyle='#90b8e0'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(rx,ry); ctx.lineTo(rx+2,ry+10); ctx.stroke(); ctx.restore();
      }
    }
  }

  function drawEyes(cx, cy, hap, t) {
    [-10, 10].forEach(ox => {
      sphere(cx+ox, cy, 6, 6, '#fff', '#e8e8e8');
      ctx.fillStyle = pd.eyeColor;
      ctx.beginPath(); ctx.ellipse(cx+ox+1, cy+1, 3, 3, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(cx+ox+2, cy, 1.2, 1.2, 0, 0, Math.PI*2); ctx.fill();
      if (Math.sin(t * 0.7) > 0.96) {
        ctx.fillStyle = pd.color;
        ctx.beginPath(); ctx.ellipse(cx+ox, cy, 6, 2, 0, 0, Math.PI*2); ctx.fill();
      }
    });
  }

  function drawCat(bobY) {
    const cx=W/2, cy=H*0.58+bobY;
    ctx.save(); ctx.strokeStyle=pd.color; ctx.lineWidth=9; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx+28,cy+18); ctx.quadraticCurveTo(cx+55,cy+5+Math.sin(t)*14,cx+50,cy-20); ctx.stroke();
    ctx.strokeStyle=lighten(pd.color,30); ctx.lineWidth=5;
    ctx.beginPath(); ctx.moveTo(cx+28,cy+18); ctx.quadraticCurveTo(cx+55,cy+5+Math.sin(t)*14,cx+50,cy-20); ctx.stroke();
    ctx.restore();
    sphere(cx, cy, 36, 32, pd.color, pd.accent);
    sphere(cx-2, cy-42, 28, 26, pd.color, pd.accent);
    ctx.fillStyle=pd.color;
    ctx.beginPath(); ctx.moveTo(cx-22,cy-58); ctx.lineTo(cx-32,cy-82); ctx.lineTo(cx-10,cy-64); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+8,cy-62); ctx.lineTo(cx+22,cy-84); ctx.lineTo(cx+28,cy-64); ctx.closePath(); ctx.fill();
    ctx.fillStyle=pd.earColor; ctx.globalAlpha=0.6;
    ctx.beginPath(); ctx.moveTo(cx-22,cy-62); ctx.lineTo(cx-30,cy-78); ctx.lineTo(cx-13,cy-66); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+12,cy-64); ctx.lineTo(cx+21,cy-80); ctx.lineTo(cx+25,cy-67); ctx.closePath(); ctx.fill();
    ctx.globalAlpha=1;
    drawEyes(cx-2, cy-42, happiness, t);
    ctx.fillStyle='#f090b0'; ctx.beginPath(); ctx.ellipse(cx-2,cy-37,4,3,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#c06080'; ctx.lineWidth=1.5; ctx.lineCap='round';
    if(happiness>=40){ctx.beginPath();ctx.arc(cx-2,cy-36,5,0.3,Math.PI-0.3);ctx.stroke();}
    else{ctx.beginPath();ctx.arc(cx-2,cy-31,5,Math.PI+0.3,2*Math.PI-0.3);ctx.stroke();}
    sphere(cx-28,cy+22, 10,8, pd.color, pd.accent);
    sphere(cx+24,cy+22, 10,8, pd.color, pd.accent);
    if(happiness>=75){ctx.save();ctx.globalAlpha=0.3;ctx.fillStyle='#ffb0c0';
      ctx.beginPath();ctx.ellipse(cx-17,cy-36,8,5,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(cx+13,cy-36,8,5,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  }

  function drawDog(bobY) {
    const cx=W/2, cy=H*0.58+bobY;
    ctx.save(); ctx.strokeStyle=pd.color; ctx.lineWidth=8; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx+30,cy+10); ctx.quadraticCurveTo(cx+52,cy-10+Math.sin(t*2)*20,cx+48,cy-28); ctx.stroke(); ctx.restore();
    sphere(cx, cy, 36,32, pd.color, pd.accent);
    sphere(cx, cy-44, 30,27, pd.color, pd.accent);
    ctx.fillStyle=darken(pd.color,20);
    ctx.beginPath(); ctx.ellipse(cx-24,cy-42,10,20,-0.3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+24,cy-42,10,20,0.3,0,Math.PI*2); ctx.fill();
    drawEyes(cx, cy-44, happiness, t);
    ctx.fillStyle='#8b4513'; ctx.beginPath(); ctx.ellipse(cx,cy-36,8,6,0,0,Math.PI*2); ctx.fill();
    if(happiness>=40){ctx.strokeStyle='#8b3010';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy-34,5,0.2,Math.PI-0.2);ctx.stroke();}
    else{ctx.strokeStyle='#8b3010';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy-30,5,Math.PI+0.2,2*Math.PI-0.2);ctx.stroke();}
    sphere(cx-28,cy+22, 11,9, pd.color, pd.accent);
    sphere(cx+28,cy+22, 11,9, pd.color, pd.accent);
  }

  function drawBunny(bobY) {
    const cx=W/2, cy=H*0.56+bobY;
    sphere(cx, cy, 32,36, pd.color, pd.accent);
    sphere(cx, cy-50, 26,24, pd.color, pd.accent);
    ctx.fillStyle=pd.color;
    ctx.beginPath(); ctx.ellipse(cx-14,cy-80,9,30,-(0.1+Math.sin(t)*0.05),0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+14,cy-80,9,30,(0.1+Math.sin(t+1)*0.05),0,Math.PI*2); ctx.fill();
    ctx.fillStyle=pd.earColor; ctx.globalAlpha=0.7;
    ctx.beginPath(); ctx.ellipse(cx-14,cy-80,5,25,-(0.1+Math.sin(t)*0.05),0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+14,cy-80,5,25,(0.1+Math.sin(t+1)*0.05),0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    drawEyes(cx,cy-50,happiness,t);
    ctx.fillStyle='#f090b0'; ctx.beginPath(); ctx.ellipse(cx,cy-43,3,2.5,0,0,Math.PI*2); ctx.fill();
    if(happiness>=40){ctx.strokeStyle='#c06080';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy-42,4,0.3,Math.PI-0.3);ctx.stroke();}
    else{ctx.strokeStyle='#c06080';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy-38,4,Math.PI+0.3,2*Math.PI-0.3);ctx.stroke();}
    sphere(cx-24,cy+26,10,8,pd.color,pd.accent);
    sphere(cx+24,cy+26,10,8,pd.color,pd.accent);
    sphere(cx+30,cy+10,10,10,lighten(pd.color,20),pd.color);
  }

  function drawFox(bobY) {
    const cx=W/2, cy=H*0.58+bobY;
    ctx.save(); ctx.strokeStyle=pd.color; ctx.lineWidth=14; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx+26,cy+20); ctx.quadraticCurveTo(cx+56,cy+8+Math.sin(t)*12,cx+52,cy-24); ctx.stroke();
    ctx.strokeStyle='#fff'; ctx.lineWidth=6;
    ctx.beginPath(); ctx.moveTo(cx+28,cy+16); ctx.quadraticCurveTo(cx+54,cy+6+Math.sin(t)*12,cx+52,cy-20); ctx.stroke();
    ctx.restore();
    sphere(cx,cy,36,32,pd.color,pd.accent);
    sphere(cx-2,cy-43,28,26,pd.color,pd.accent);
    ctx.fillStyle=pd.color;
    ctx.beginPath(); ctx.moveTo(cx-18,cy-60); ctx.lineTo(cx-28,cy-88); ctx.lineTo(cx-6,cy-66); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+10,cy-64); ctx.lineTo(cx+26,cy-90); ctx.lineTo(cx+30,cy-66); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#1a0a00'; ctx.globalAlpha=0.6;
    ctx.beginPath(); ctx.moveTo(cx-19,cy-63); ctx.lineTo(cx-27,cy-84); ctx.lineTo(cx-8,cy-68); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+13,cy-66); ctx.lineTo(cx+25,cy-86); ctx.lineTo(cx+27,cy-68); ctx.closePath(); ctx.fill();
    ctx.globalAlpha=1;
    sphere(cx-2,cy-37,14,10,'#f5e8d8','#e0d0b8');
    drawEyes(cx-2,cy-45,happiness,t);
    ctx.fillStyle='#1a0a00'; ctx.beginPath(); ctx.ellipse(cx-2,cy-38,4,3,0,0,Math.PI*2); ctx.fill();
    if(happiness>=40){ctx.strokeStyle='#8b3010';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx-2,cy-36,5,0.3,Math.PI-0.3);ctx.stroke();}
    else{ctx.strokeStyle='#8b3010';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx-2,cy-32,5,Math.PI+0.3,2*Math.PI-0.3);ctx.stroke();}
    sphere(cx-28,cy+22,11,9,pd.color,pd.accent);
    sphere(cx+24,cy+22,11,9,pd.color,pd.accent);
  }

  function drawPenguin(bobY) {
    const cx=W/2, cy=H*0.56+bobY;
    sphere(cx,cy,36,42,pd.accent,'#0d0d1a');
    sphere(cx,cy+5,22,28,'#f0f0f0','#d8d8d8');
    sphere(cx,cy-52,26,24,pd.accent,'#0d0d1a');
    sphere(cx,cy-50,16,16,'#f0f0f0','#d8d8d8');
    ctx.fillStyle=pd.earColor; ctx.beginPath(); ctx.moveTo(cx-5,cy-46); ctx.lineTo(cx,cy-40); ctx.lineTo(cx+5,cy-46); ctx.closePath(); ctx.fill();
    drawEyes(cx,cy-54,happiness,t);
    const flapL = Math.sin(t)*10;
    ctx.fillStyle=pd.accent;
    ctx.beginPath(); ctx.ellipse(cx-38,cy-10+flapL,12,22,-0.4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+38,cy-10-flapL,12,22,0.4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=pd.earColor;
    ctx.beginPath(); ctx.ellipse(cx-16,cy+44,11,7,0.2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+16,cy+44,11,7,-0.2,0,Math.PI*2); ctx.fill();
  }

  const drawFns = { cat:drawCat, dog:drawDog, bunny:drawBunny, fox:drawFox, penguin:drawPenguin };

  function render() {
    t += 0.04;
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawGround();
    const bobY = Math.sin(t * 0.8) * (happiness >= 40 ? 5 : 2);
    (drawFns[type] || drawFns.cat)(bobY);
    _petAnimFrame = requestAnimationFrame(render);
  }
  render();
}

async function sellPet() {
  const pet = getPetSave();
  if (!pet) return;
  const petHours = Math.max(0, (CU?.studyStats?.totalHours || 0) - (pet.studyHoursAtAdoption || 0));
  const age = Math.floor(petHours / PET_HRS_PER_YEAR);
  const pts = age >= 40 ? 20 : age >= 30 ? 15 : age >= 20 ? 10 : 0;
  if (pts === 0) { showToast('Too young!', `${PET_DATA[pet.type]?.name} needs to be at least 20 years old to sell.`, 'warning'); return; }
  if (!confirm(`Sell ${PET_DATA[pet.type]?.name} (age ${age}) for ${pts} points? This cannot be undone.`)) return;
  const month = new Date().toISOString().slice(0,7);
  await FS.addPoint({ by:CUK, byName:CU.name, faculty:CU.faculty, module:'Study Pet', testName:`Sold ${PET_DATA[pet.type]?.name} (age ${age})`, mark:100, points:pts, month, date:new Date().toISOString() });
  if (_petAnimFrame) { cancelAnimationFrame(_petAnimFrame); _petAnimFrame = null; }
  savePetSave(null);
  showToast('🎉 Sold!', `You earned ${pts} points! Adopt a new companion.`, 'success');
  updatePetState();
}

function releasePet() {
  if (!confirm('Release your pet? You will not earn points.')) return;
  if (_petAnimFrame) { cancelAnimationFrame(_petAnimFrame); _petAnimFrame = null; }
  savePetSave(null);
  showToast('👋 Released!', 'Your pet is free. Adopt a new one!', 'info');
  updatePetState();
}

// Make functions globally available
window.renderStreakPage = renderStreakPage;
window.setPomodoroPreset = setPomodoroPreset;
window.startPomodoro = startPomodoro;
window.pausePomodoro = pausePomodoro;
window.resetPomodoro = resetPomodoro;
window.startStopwatch = startStopwatch;
window.pauseStopwatch = pauseStopwatch;
window.resetStopwatch = resetStopwatch;
window.lapStopwatch = lapStopwatch;
window.logStudySession = logStudySession;
window.changeMonth = changeMonth;
window.goToToday = goToToday;
window.selectCalendarDay = selectCalendarDay;
window.setCalView = setCalView;
window.selectMonthView = selectMonthView;
window.choosePet = choosePet;
window.sellPet = sellPet;
window.releasePet = releasePet;

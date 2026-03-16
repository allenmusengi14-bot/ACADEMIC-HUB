import { CU, CUK, mods, _studySessions } from '../app.js';
import { FS } from '../firebase-config.js';
import { showToast, formatStopwatchTime, formatPomodoroTime } from '../components/utils.js';

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

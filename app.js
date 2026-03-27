import { FS } from './firebase-config.js.js';
import { showToast } from './toast.js.js';
import { loadFromLocal, saveToLocal, getRandomQuote } from './utils.js.js';

// Global state
export let CU = null;
export let CUK = null;
export let mods = [];
export let _requests = [];
export let _points = [];
export let _groups = [];
export let _studySessionsPosts = [];
export let _focusRooms = [];
export let _ratings = {};
export let _studySessions = [];

// Page titles
const PTITLES = { 
  home:'Home', gpa:'GPA Tracker', study:'Study Hub', streak:'Study Streak', 
  peer:'Get Help', tutors:'Find a Tutor', become:'Become a Tutor', 
  profile:'My Profile', squad:'Study Squad', rooms:'Focus Rooms', 
  points:'Earn Points', settings:'Settings' 
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initPages();
  loadSettings();
  
  // Set up real-time listeners after auth
  setupRealtimeListeners();
});

// Initialize empty pages
function initPages() {
  const pagesContainer = document.getElementById('pages-container');
  
  // Create all page divs
  const pages = ['home', 'gpa', 'study', 'streak', 'peer', 'tutors', 'become', 'squad', 'rooms', 'points', 'profile', 'settings'];
  
  pages.forEach(page => {
    const div = document.createElement('div');
    div.className = 'page';
    div.id = `pg-${page}`;
    div.innerHTML = `<div class="page-header"><h1>${PTITLES[page]}</h1><p>Loading...</p></div>`;
    pagesContainer.appendChild(div);
  });
}

// Particles background
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  
  container.innerHTML = '';
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 40 + 10;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.bottom = '-10%';
    p.style.background = `hsla(${Math.random() * 360},70%,60%,0.25)`;
    p.style.animationDuration = (Math.random() * 20 + 10) + 's';
    p.style.animationDelay = Math.random() * 5 + 's';
    container.appendChild(p);
  }
}

// Set up real-time listeners
function setupRealtimeListeners() {
  if (!window.FS) return;
  
  window._unsubReqs = FS.onRequests(data => { 
    _requests = data; 
    if (document.getElementById('pg-peer')?.classList.contains('on')) {
      window.renderReqs?.();
      window.renderMyReqs?.();
    }
  });
  
  window._unsubPoints = FS.onPoints(data => { 
    _points = data; 
    if (document.getElementById('pg-points')?.classList.contains('on')) {
      window.renderPointsLeaderboard?.();
      window.renderMyPoints?.();
    }
    updateHomeStats();
  });
  
  window._unsubGroups = FS.onGroups(data => { 
    _groups = data; 
    if (document.getElementById('pg-squad')?.classList.contains('on')) {
      window.filterSquad?.();
    }
  });
  
  window._unsubStudyPosts = FS.onStudySessionsPosts(data => { 
    _studySessionsPosts = data; 
    if (document.getElementById('pg-squad')?.classList.contains('on')) {
      window.filterSquad?.();
    }
  });
  
  window._unsubFocusRooms = FS.onFocusRooms(data => { 
    _focusRooms = data; 
    if (document.getElementById('pg-rooms')?.classList.contains('on')) {
      window.renderFocusRooms?.();
    }
  });
}

// Navigation
export function go(page) {
  flashTransition();
  
  setTimeout(() => {
    // Update page visibility
    document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('on'));
    
    const pageEl = document.getElementById('pg-' + page);
    if (!pageEl) return;
    
    pageEl.classList.add('on');
    
    const navItem = document.getElementById('ni-' + page);
    if (navItem) navItem.classList.add('on');
    
    // Update title
    const topTitle = document.getElementById('topTitle');
    if (topTitle) topTitle.textContent = PTITLES[page] || '';
    
    closeSidebar();
    
    // Trigger page-specific render functions
    switch(page) {
      case 'home': 
        if (window.renderHomePage) window.renderHomePage(); 
        break;
      case 'gpa': 
        if (window.renderGPAPage) window.renderGPAPage(); 
        break;
      case 'study': 
        if (window.renderStudyPage) window.renderStudyPage(); 
        break;
      case 'streak': 
        if (window.renderStreakPage) window.renderStreakPage(); 
        break;
      case 'peer': 
        if (window.renderPeerPage) window.renderPeerPage(); 
        break;
      case 'tutors': 
        if (window.renderTutorsPage) window.renderTutorsPage(); 
        break;
      case 'become': 
        if (window.updateRole) window.updateRole(); 
        break;
      case 'squad': 
        if (window.renderSquadPage) window.renderSquadPage(); 
        break;
      case 'rooms': 
        if (window.renderRoomsPage) window.renderRoomsPage(); 
        break;
      case 'points': 
        if (window.renderPointsPage) window.renderPointsPage(); 
        break;
      case 'profile': 
        if (window.renderProfilePage) window.renderProfilePage(); 
        break;
      case 'settings': 
        if (window.renderSettingsPage) window.renderSettingsPage(); 
        break;
    }
  }, 150);
}

function flashTransition() {
  const pt = document.getElementById('pt');
  if (pt) {
    pt.classList.add('flash');
    setTimeout(() => pt.classList.remove('flash'), 400);
  }
}

// Sidebar functions
export function openSidebar() { 
  document.getElementById('sidebar').classList.add('open'); 
  document.getElementById('sbOverlay').classList.add('on'); 
}

export function closeSidebar() { 
  document.getElementById('sidebar').classList.remove('open'); 
  document.getElementById('sbOverlay').classList.remove('on'); 
}

export function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const main = document.querySelector('.main');
  const openBtn = document.getElementById('sidebarOpenBtn');
  const toggleBtn = document.getElementById('sbToggleBtn');
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    closeSidebar();
    return;
  }
  
  const isCollapsed = sb.classList.contains('collapsed');
  
  if (isCollapsed) {
    sb.classList.remove('collapsed');
    main.style.marginLeft = 'var(--sidebar)';
    if (openBtn) openBtn.style.display = 'none';
    if (toggleBtn) toggleBtn.textContent = '◀';
  } else {
    sb.classList.add('collapsed');
    main.style.marginLeft = '0';
    if (openBtn) { 
      openBtn.style.display = 'flex'; 
    }
    if (toggleBtn) toggleBtn.textContent = '▶';
    document.getElementById('sbOverlay').classList.remove('on');
  }
}

// Settings
function loadSettings() {
  const settings = loadFromLocal('settings', { 
    darkMode: false, 
    compact: false, 
    emailNotif: true, 
    pushNotif: true, 
    showProfile: true 
  });
  
  const darkToggle = document.getElementById('darkModeToggle');
  const compactToggle = document.getElementById('compactView');
  const emailToggle = document.getElementById('emailNotif');
  const pushToggle = document.getElementById('pushNotif');
  const profileToggle = document.getElementById('showProfile');
  
  if (darkToggle) darkToggle.checked = settings.darkMode;
  if (compactToggle) compactToggle.checked = settings.compact;
  if (emailToggle) emailToggle.checked = settings.emailNotif;
  if (pushToggle) pushToggle.checked = settings.pushNotif;
  if (profileToggle) profileToggle.checked = settings.showProfile;
  
  applySettings();
}

function applySettings() {
  const settings = loadFromLocal('settings', { darkMode: false, compact: false });
  
  if (settings.darkMode) {
    document.documentElement.style.setProperty('--bg', '#0f172a');
    document.documentElement.style.setProperty('--card', '#1e293b');
    document.documentElement.style.setProperty('--text', '#f1f5f9');
    document.documentElement.style.setProperty('--muted', '#94a3b8');
    document.documentElement.style.setProperty('--border', '#334155');
  } else {
    document.documentElement.style.setProperty('--bg', '#f8faff');
    document.documentElement.style.setProperty('--card', '#fff');
    document.documentElement.style.setProperty('--text', '#0f172a');
    document.documentElement.style.setProperty('--muted', '#64748b');
    document.documentElement.style.setProperty('--border', '#e2e8f0');
  }
  
  if (settings.compact) {
    document.body.classList.add('compact');
  } else {
    document.body.classList.remove('compact');
  }
}

// Update home stats
function updateHomeStats() {
  const pointsEl = document.getElementById('homePoints');
  if (pointsEl && CUK) {
    const month = new Date().toISOString().slice(0, 7);
    const total = _points.filter(p => p.by === CUK && p.month === month).reduce((s, p) => s + (p.points || 0), 0);
    pointsEl.textContent = total;
  }
  
  const streakEl = document.getElementById('homeStreak');
  if (streakEl && CU && CU.studyStats) {
    streakEl.textContent = CU.studyStats.streak || 0;
  }
}

// Getters and setters
export function setCurrentUser(user) { CU = user; }
export function setCurrentUserKey(key) { CUK = key; }
export function setModules(moduleList) { mods = moduleList; }

// ==================== CALENDAR ACADEMIC EVENTS ====================
let acaCalDate = new Date();
let acaSelectedDate = null;
let _acaEvents = [];
let _editingEventId = null;

function getAcaEvents() { return loadFromLocal('acaEvents_' + CUK, []); }
function saveAcaEvents(events) { saveToLocal('acaEvents_' + CUK, events); }

function loadAcaEvents() {
  _acaEvents = getAcaEvents();
  renderAcaCalendar();
  renderUpcomingEvents();
  renderAllEvents();
}

function renderAcaCalendar() {
  const year = acaCalDate.getFullYear();
  const month = acaCalDate.getMonth();
  const titleEl = document.getElementById('calTitle');
  if (titleEl) titleEl.textContent = acaCalDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const grid = document.getElementById('calDays');
  if (!grid) return;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  let html = '';
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i;
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    html += `<div class="aca-cal-amazing-day other-month" onclick="window.selectAcaDate('${dateStr}')">
      <div class="aca-cal-day-num" style="color:rgba(255,255,255,.3);">${d}</div></div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === today;
    const isSelected = dateStr === acaSelectedDate;
    const dayEvents = _acaEvents.filter(e => e.date === dateStr);
    const evHtml = dayEvents.slice(0,2).map(e => `<div class="aca-cal-event ${e.type||'test'}">${e.title||'Event'}</div>`).join('');
    const more = dayEvents.length > 2 ? `<div class="aca-cal-more">+${dayEvents.length-2}</div>` : '';
    html += `<div class="aca-cal-amazing-day${isToday?' today':''}${isSelected?' selected':''}" onclick="window.selectAcaDate('${dateStr}')">
      <div class="aca-cal-day-num">${d}</div>
      <div class="aca-cal-events">${evHtml}${more}</div>
    </div>`;
  }
  const remaining = 42 - firstDay - daysInMonth;
  for (let d = 1; d <= remaining; d++) {
    const dateStr = `${year}-${String(month+2 > 12 ? 1 : month+2).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    html += `<div class="aca-cal-amazing-day other-month" onclick="window.selectAcaDate('${dateStr}')">
      <div class="aca-cal-day-num" style="color:rgba(255,255,255,.3);">${d}</div></div>`;
  }
  grid.innerHTML = html;
}

function selectAcaDate(dateStr) {
  acaSelectedDate = dateStr;
  renderAcaCalendar();
  const dayEvents = _acaEvents.filter(e => e.date === dateStr);
  if (dayEvents.length === 0) openEventModal(dateStr);
}

function calNav(dir) {
  acaCalDate.setMonth(acaCalDate.getMonth() + dir);
  renderAcaCalendar();
}

function goToCalToday() {
  acaCalDate = new Date();
  acaSelectedDate = new Date().toISOString().slice(0, 10);
  renderAcaCalendar();
}

function openEventModal(dateStr = null) {
  _editingEventId = null;
  const titleEl = document.getElementById('eventModalTitle');
  if (titleEl) titleEl.textContent = 'Add Academic Event';
  const nameEl = document.getElementById('eventName');
  const notesEl = document.getElementById('eventNotes');
  const dateEl = document.getElementById('eventDate');
  const startEl = document.getElementById('eventStartTime');
  const endEl = document.getElementById('eventEndTime');
  const delBtn = document.getElementById('deleteEventBtn');
  if (nameEl) nameEl.value = '';
  if (notesEl) notesEl.value = '';
  if (dateEl) dateEl.value = dateStr || (acaSelectedDate || new Date().toISOString().slice(0,10));
  if (startEl) startEl.value = '09:00';
  if (endEl) endEl.value = '10:00';
  if (delBtn) delBtn.style.display = 'none';
  document.querySelectorAll('.event-type-btn').forEach(b => b.classList.remove('active'));
  const firstBtn = document.querySelector('.event-type-btn');
  if (firstBtn) { firstBtn.classList.add('active'); firstBtn.classList.add('selected'); }
  populateEventModuleSelect();
  const modal = document.getElementById('eventModal');
  if (modal) modal.classList.remove('hidden');
}

function populateEventModuleSelect() {
  const sel = document.getElementById('eventModule');
  if (!sel) return;
  sel.innerHTML = '<option value="">Select module (optional)</option>';
  (mods || []).forEach(m => { sel.innerHTML += `<option value="${m.name}">${m.code ? m.code+' — ' : ''}${m.name}</option>`; });
}

function selectEventType(btn) {
  document.querySelectorAll('.event-type-btn').forEach(b => { b.classList.remove('active'); b.classList.remove('selected'); });
  btn.classList.add('active'); btn.classList.add('selected');
}

function closeEventModal() {
  const modal = document.getElementById('eventModal');
  if (modal) modal.classList.add('hidden');
  _editingEventId = null;
}

function saveEvent() {
  const typeBtn = document.querySelector('.event-type-btn.active');
  const type = typeBtn ? typeBtn.dataset.type : 'test';
  const module = document.getElementById('eventModule').value;
  const title = document.getElementById('eventName').value.trim();
  const date = document.getElementById('eventDate').value;
  const startTime = document.getElementById('eventStartTime').value;
  const endTime = document.getElementById('eventEndTime').value;
  const notes = document.getElementById('eventNotes').value.trim();

  if (!title || !date) { showToast('Missing Info', 'Please fill in event name and date.', 'warning'); return; }

  const event = {
    id: _editingEventId || 'ev_' + Date.now(),
    type, module, title, date, startTime, endTime, notes,
    createdAt: _editingEventId ? (_acaEvents.find(e => e.id === _editingEventId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
  };

  if (_editingEventId) {
    const idx = _acaEvents.findIndex(e => e.id === _editingEventId);
    if (idx !== -1) _acaEvents[idx] = event;
  } else {
    _acaEvents.push(event);
  }

  saveAcaEvents(_acaEvents);
  closeEventModal();
  renderAcaCalendar();
  renderUpcomingEvents();
  renderAllEvents();
  if (window.renderHomeUpcomingEvents) window.renderHomeUpcomingEvents();
  showToast(_editingEventId ? 'Event Updated' : 'Event Added', `"${title}" saved to calendar.`, 'success');
}

function editEvent(id) {
  const evt = _acaEvents.find(e => e.id === id);
  if (!evt) return;
  _editingEventId = id;
  const titleEl = document.getElementById('eventModalTitle');
  if (titleEl) titleEl.textContent = 'Edit Event';
  populateEventModuleSelect();
  const modEl = document.getElementById('eventModule');
  const nameEl = document.getElementById('eventName');
  const dateEl = document.getElementById('eventDate');
  const startEl = document.getElementById('eventStartTime');
  const endEl = document.getElementById('eventEndTime');
  const notesEl = document.getElementById('eventNotes');
  const delBtn = document.getElementById('deleteEventBtn');
  if (modEl) modEl.value = evt.module || '';
  if (nameEl) nameEl.value = evt.title || '';
  if (dateEl) dateEl.value = evt.date || '';
  if (startEl) startEl.value = evt.startTime || '09:00';
  if (endEl) endEl.value = evt.endTime || '10:00';
  if (notesEl) notesEl.value = evt.notes || '';
  document.querySelectorAll('.event-type-btn').forEach(b => {
    b.classList.remove('active'); b.classList.remove('selected');
    if (b.dataset.type === evt.type) { b.classList.add('active'); b.classList.add('selected'); }
  });
  if (delBtn) delBtn.style.display = 'inline-flex';
  const modal = document.getElementById('eventModal');
  if (modal) modal.classList.remove('hidden');
}

function deleteEvent() {
  if (!_editingEventId) return;
  if (!confirm('Delete this event?')) return;
  _acaEvents = _acaEvents.filter(e => e.id !== _editingEventId);
  saveAcaEvents(_acaEvents);
  closeEventModal();
  renderAcaCalendar();
  renderUpcomingEvents();
  renderAllEvents();
  if (window.renderHomeUpcomingEvents) window.renderHomeUpcomingEvents();
  showToast('Event Deleted', 'Event removed from calendar.', 'info');
}

function renderUpcomingEvents() {
  const container = document.getElementById('upcomingEvents');
  if (!container) return;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = _acaEvents.filter(e => e.date >= today).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 10);
  if (!upcoming.length) { container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted);">No upcoming events — add one above!</div>'; return; }
  container.innerHTML = upcoming.map(e => {
    const icon = getEventTypeIcon(e.type);
    const d = new Date(e.date + 'T00:00:00');
    const daysLeft = Math.ceil((d - new Date().setHours(0,0,0,0)) / 86400000);
    const urgency = daysLeft === 0 ? '🔴 Today!' : daysLeft === 1 ? '🟠 Tomorrow' : daysLeft <= 3 ? `🟡 ${daysLeft} days` : `🟢 ${daysLeft} days`;
    return `<div class="event-display-card ${e.type||'test'}" onclick="window.editEvent('${e.id}')">
      <div class="event-display-header">
        <div class="event-display-type ${e.type||'test'}">${icon}</div>
        <div class="event-display-info">
          <div class="event-display-name">${e.title}</div>
          <div class="event-display-module">${e.module ? '📚 '+e.module : ''}</div>
          <div class="event-display-time">📅 ${formatEventDate(e.date)} ${e.startTime ? '· '+e.startTime : ''} &nbsp; ${urgency}</div>
        </div>
        <span class="event-display-badge ${e.type||'test'}">${(e.type||'test').toUpperCase()}</span>
      </div>
    </div>`;
  }).join('');
}

function renderAllEvents() {
  const container = document.getElementById('allEventsList');
  if (!container) return;
  if (!_acaEvents.length) { container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted);">No events created yet</div>'; return; }
  const sorted = [..._acaEvents].sort((a,b) => a.date.localeCompare(b.date));
  container.innerHTML = sorted.map(e => {
    const icon = getEventTypeIcon(e.type);
    return `<div class="event-display-card ${e.type||'test'}" onclick="window.editEvent('${e.id}')">
      <div class="event-display-header">
        <div class="event-display-type ${e.type||'test'}">${icon}</div>
        <div class="event-display-info">
          <div class="event-display-name">${e.title}</div>
          <div class="event-display-module">${e.module ? '📚 '+e.module : ''}</div>
          <div class="event-display-time">📅 ${formatEventDate(e.date)} ${e.startTime ? '· '+e.startTime : ''}</div>
        </div>
        <span class="event-display-badge ${e.type||'test'}">${(e.type||'test').toUpperCase()}</span>
      </div>
    </div>`;
  }).join('');
}

function getEventTypeIcon(type) {
  return { test:'📝', assignment:'📋', quiz:'⚡', exam:'📖' }[type] || '📌';
}
function formatEventDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
}

// ==================== STUDY GOALS ====================
let _goals = [];
function getGoals() { return loadFromLocal('studyGoals_' + CUK, []); }
function saveGoals(goals) { saveToLocal('studyGoals_' + CUK, goals); }

function loadGoals() {
  _goals = getGoals();
  renderGoals();
}

function renderGoals() {
  const container = document.getElementById('goalsList');
  if (!container) return;
  if (!_goals.length) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:.83rem;">No goals set. Create one to track your study targets!</div>';
    return;
  }
  const sessions = loadFromLocal('studySessions_' + CUK, []);
  container.innerHTML = _goals.map(g => {
    const now = new Date().toISOString().slice(0,10);
    const start = g.startDate || now;
    const end = g.endDate || now;
    const relevantSessions = sessions.filter(s => s.date >= start && s.date <= end && (!g.module || s.module === g.module));
    const doneHours = relevantSessions.reduce((s,ss) => s + (ss.duration||0)/60, 0);
    const pct = Math.min((doneHours / g.targetHours) * 100, 100);
    const remaining = Math.max(g.targetHours - doneHours, 0);
    return `<div class="goal-card">
      <div class="goal-header">
        <div>
          <div class="goal-title">${g.name}</div>
          <div class="goal-period">${getPeriodLabel(g)}${g.module ? ' · '+g.module : ''}</div>
        </div>
        <button onclick="event.stopPropagation();_goals=_goals.filter(x=>x.id!=='${g.id}');saveGoals(_goals);renderGoals();" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1rem;">✕</button>
      </div>
      <div class="goal-progress-wrap">
        <div class="goal-progress-bar"><div class="goal-progress-fill" style="width:${pct}%;"></div></div>
      </div>
      <div class="goal-stats">
        <span class="done">✅ ${doneHours.toFixed(1)} hrs done</span>
        <span class="target">${remaining > 0 ? remaining.toFixed(1)+' hrs to go' : '🎉 Goal reached!'}</span>
      </div>
    </div>`;
  }).join('');
}

function getPeriodLabel(g) {
  if (g.period === 'weekly') return 'This Week';
  if (g.period === 'monthly') return 'This Month';
  if (g.period === 'semester') return 'This Semester';
  return `${formatEventDate(g.startDate)} - ${formatEventDate(g.endDate)}`;
}

function openGoalModal() {
  const nameEl = document.getElementById('goalName');
  const hoursEl = document.getElementById('goalHours');
  const periodEl = document.getElementById('goalPeriod');
  const customEl = document.getElementById('goalCustomDates');
  if (nameEl) nameEl.value = '';
  if (hoursEl) hoursEl.value = '';
  if (periodEl) periodEl.value = 'weekly';
  if (customEl) customEl.style.display = 'none';
  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
  const startEl = document.getElementById('goalStartDate');
  const endEl = document.getElementById('goalEndDate');
  if (startEl) startEl.value = today.toISOString().split('T')[0];
  if (endEl) endEl.value = weekEnd.toISOString().split('T')[0];
  populateGoalModuleSelect();
  const modal = document.getElementById('goalModal');
  if (modal) modal.classList.remove('hidden');
}

function populateGoalModuleSelect() {
  const select = document.getElementById('goalModule');
  if (!select) return;
  select.innerHTML = '<option value="">All modules</option>';
  (mods || []).forEach(m => { select.innerHTML += `<option value="${m.name}">${m.name}</option>`; });
}

function closeGoalModal() {
  const modal = document.getElementById('goalModal');
  if (modal) modal.classList.add('hidden');
}

function saveGoal() {
  const name = document.getElementById('goalName').value.trim();
  const hours = parseFloat(document.getElementById('goalHours').value);
  const period = document.getElementById('goalPeriod').value;
  const startDate = document.getElementById('goalStartDate').value;
  const endDate = document.getElementById('goalEndDate').value;
  const module = document.getElementById('goalModule').value;
  if (!name || !hours || !startDate || !endDate) { showToast('Missing Info', 'Please fill in all required fields', 'warning'); return; }
  _goals.push({ id:'goal_'+Date.now(), name, targetHours:hours, period, startDate, endDate, module, createdAt:new Date().toISOString() });
  saveGoals(_goals);
  closeGoalModal();
  renderGoals();
  showToast('Goal Created', `"${name}" — ${hours} hours`, 'success');
}

// Settings functions
function toggleDarkMode(){ updateSettings(); }
function toggleCompact(){ updateSettings(); }
async function updateSettings(){
  const settings = {
    darkMode: document.getElementById('darkModeToggle')?.checked,
    compact: document.getElementById('compactView')?.checked,
    emailNotif: document.getElementById('emailNotif')?.checked,
    pushNotif: document.getElementById('pushNotif')?.checked,
    showProfile: document.getElementById('showProfile')?.checked
  };
  saveToLocal('settings', settings);
  applySettings();
  if (CUK) { await FS.setUser(CUK, { settings }); }
  showToast('Settings Updated', 'Your preferences have been saved.', 'success');
}
function exportData(){
  const data = { user: CU, modules: mods, points: _points.filter(p=>p.by===CUK), studySessions: _studySessions };
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`ub_academic_data_${CUK}.json`; a.click(); URL.revokeObjectURL(blob);
  showToast('Data Exported','Your data has been downloaded.','success');
}
function clearData(){
  if(confirm('Clear all local data? This will not affect your account on the server.')){
    localStorage.clear(); showToast('Data Cleared','Local data cleared.','info'); location.reload();
  }
}

function updateRole() {
  if (!CU) return;
  const roleEl = document.getElementById('sbRole');
  if (roleEl) roleEl.textContent = CU.isTutor ? 'Peer Tutor' : 'Student';
  const roleEl2 = document.getElementById('topRole');
  if (roleEl2) roleEl2.textContent = CU.isTutor ? 'Peer Tutor' : 'Student';
  const roleBadge = document.querySelector('.sb-role');
  if (roleBadge) roleBadge.className = 'sb-role ' + (CU.isTutor ? 'tutor' : 'student');
  if (CU.isTutor) {
    const becomePage = document.getElementById('pg-become');
    if (becomePage) becomePage.innerHTML = `
      <div class="page-header"><h1>🎯 Tutor Dashboard</h1></div>
      <div class="card"><div class="card-title">Your Tutor Profile</div>
        <div class="pd-row"><span>Bio</span><strong>${CU.tutorBio || '—'}</strong></div>
        <div class="pd-row"><span>Subjects</span><strong>${(CU.tutorSubjects || []).join(', ') || '—'}</strong></div>
      </div>
      <div class="card"><div class="card-title">Edit Profile</div>
        <div class="ff"><label>Bio</label><textarea id="editBio" class="req-fi" style="min-height:80px;">${CU.tutorBio || ''}</textarea></div>
        <div class="ff"><label>Subjects (comma-separated)</label><input id="editSubj" class="req-fi" value="${(CU.tutorSubjects || []).join(', ')}" placeholder="e.g. ECS 101, MEC 201"></div>
        <button class="btn btn-blue" onclick="window.updateTutorProfile()">💾 Save Changes</button>
      </div>`;
  }
}

// Module population
function populateModDropdowns() {
  const opts = mods.length
    ? mods.map(m => `<option value="${m.code} – ${m.name}">${m.code} – ${m.name}</option>`).join('')
    : '<option value="">No modules — set up in Profile</option>';
  ['pMod', 'groupModule', 'ptsModule', 'sessionModSelect', 'pomodoroModule', 'stopwatchModule', 'sessionModule'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = '<option value="">— Select module —</option>' + opts; }
  });
}

// Render Settings page
function renderSettingsPage() {
  const page = document.getElementById('pg-settings');
  if (!page) return;
  page.innerHTML = `
    <div class="page-header"><h1>⚙️ Settings</h1><p>Customize your experience</p></div>
    <div class="card">
      <div class="card-title">Appearance</div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Dark Mode</div>
          <div class="settings-desc">Switch between light and dark theme</div>
        </div>
        <label class="toggle"><input type="checkbox" id="darkModeToggle" onchange="window.toggleDarkMode()"><span class="toggle-slider"></span></label>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Compact View</div>
          <div class="settings-desc">Reduce spacing for more content</div>
        </div>
        <label class="toggle"><input type="checkbox" id="compactView" onchange="window.toggleCompact()"><span class="toggle-slider"></span></label>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Notifications</div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Email Notifications</div>
          <div class="settings-desc">Receive updates via email</div>
        </div>
        <label class="toggle"><input type="checkbox" id="emailNotif" onchange="window.updateSettings()"><span class="toggle-slider"></span></label>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Push Notifications</div>
          <div class="settings-desc">Receive browser push notifications</div>
        </div>
        <label class="toggle"><input type="checkbox" id="pushNotif" onchange="window.updateSettings()"><span class="toggle-slider"></span></label>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Privacy</div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Show Profile</div>
          <div class="settings-desc">Make your profile visible to others</div>
        </div>
        <label class="toggle"><input type="checkbox" id="showProfile" onchange="window.updateSettings()"><span class="toggle-slider"></span></label>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Data Management</div>
      <button class="btn btn-blue" onclick="window.exportData()">📥 Export My Data</button>
      <button class="btn btn-red" style="margin-left:10px;" onclick="window.clearData()">🗑 Clear Local Data</button>
    </div>
  `;
  loadSettings();
}

// Make functions globally available
window.go = go;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleSidebar = toggleSidebar;
window.updateHomeStats = updateHomeStats;
window.updateRole = updateRole;
window.loadSettings = loadSettings;
window.applySettings = applySettings;
window.toggleDarkMode = toggleDarkMode;
window.toggleCompact = toggleCompact;
window.updateSettings = updateSettings;
window.exportData = exportData;
window.clearData = clearData;
window.calNav = calNav;
window.goToCalToday = goToCalToday;
window.openEventModal = openEventModal;
window.closeEventModal = closeEventModal;
window.selectEventType = selectEventType;
window.saveEvent = saveEvent;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.selectAcaDate = selectAcaDate;
window.loadAcaEvents = loadAcaEvents;
window.openGoalModal = openGoalModal;
window.closeGoalModal = closeGoalModal;
window.saveGoal = saveGoal;
window.loadGoals = loadGoals;
window.renderGoals = renderGoals;
window.populateModDropdowns = populateModDropdowns;
window.renderSettingsPage = renderSettingsPage;

import { FS } from './firebase-config.js';
import { showToast, showLoading, hideLoading } from './toast.js';
import { loadFromLocal, saveToLocal, getRandomQuote, PTITLES } from './utils.js';
import { setAuthCallbacks } from './auth.js';

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

// Setter functions for auth module
export function setCurrentUser(user) { CU = user; }
export function setCurrentUserKey(key) { CUK = key; }
export function setModules(moduleList) { mods = moduleList; }

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Set up auth callbacks
  setAuthCallbacks(setCurrentUser, setCurrentUserKey, setModules);
  
  initParticles();
  initPages();
  loadSettings();
  setupRealtimeListeners();
});

// Initialize empty pages
function initPages() {
  const pagesContainer = document.getElementById('pages-container');
  if (!pagesContainer) return;
  
  // Create all page divs with empty content - page modules will populate them
  pagesContainer.innerHTML = `
    <div class="page on" id="pg-home"></div>
    <div class="page" id="pg-gpa"></div>
    <div class="page" id="pg-study"></div>
    <div class="page" id="pg-streak"></div>
    <div class="page" id="pg-peer"></div>
    <div class="page" id="pg-tutors"></div>
    <div class="page" id="pg-become"></div>
    <div class="page" id="pg-profile"></div>
    <div class="page" id="pg-squad"></div>
    <div class="page" id="pg-rooms"></div>
    <div class="page" id="pg-points"></div>
    <div class="page" id="pg-settings"></div>
  `;
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
      if (window.renderReqs) window.renderReqs();
      if (window.renderMyReqs) window.renderMyReqs();
    }
  });
  
  window._unsubPoints = FS.onPoints(data => { 
    _points = data; 
    if (document.getElementById('pg-points')?.classList.contains('on')) {
      if (window.renderPointsLeaderboard) window.renderPointsLeaderboard();
      if (window.renderMyPoints) window.renderMyPoints();
    }
    updateHomeStats();
  });
  
  window._unsubGroups = FS.onGroups(data => { 
    _groups = data; 
    if (document.getElementById('pg-squad')?.classList.contains('on')) {
      if (window.filterSquad) window.filterSquad();
    }
  });
  
  window._unsubStudyPosts = FS.onStudySessionsPosts(data => { 
    _studySessionsPosts = data; 
    if (document.getElementById('pg-squad')?.classList.contains('on')) {
      if (window.filterSquad) window.filterSquad();
    }
  });
  
  window._unsubFocusRooms = FS.onFocusRooms(data => { 
    _focusRooms = data; 
    if (document.getElementById('pg-rooms')?.classList.contains('on')) {
      if (window.renderFocusRooms) window.renderFocusRooms();
    }
  });
}

// Navigation
export function go(page) {
  flashTransition();
  
  setTimeout(() => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('on'));
    
    const pageEl = document.getElementById('pg-' + page);
    if (!pageEl) return;
    pageEl.classList.add('on');
    
    const navItem = document.getElementById('ni-' + page);
    if (navItem) navItem.classList.add('on');
    
    const topTitle = document.getElementById('topTitle');
    if (topTitle) topTitle.textContent = PTITLES[page] || '';
    
    closeSidebar();
    
    // Trigger page-specific render functions
    const renderFunctions = {
      home: 'renderHomePage',
      gpa: 'renderGPAPage',
      study: 'renderStudyPage',
      streak: 'renderStreakPage',
      peer: 'renderPeerPage',
      tutors: 'renderTutorsPage',
      become: 'updateRole',
      squad: 'renderSquadPage',
      rooms: 'renderRoomsPage',
      points: 'renderPointsPage',
      profile: 'renderProfilePage',
      settings: 'renderSettingsPage'
    };
    
    const fnName = renderFunctions[page];
    if (fnName && window[fnName]) window[fnName]();
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
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sbOverlay');
  if (sidebar) sidebar.classList.add('open'); 
  if (overlay) overlay.classList.add('on'); 
}

export function closeSidebar() { 
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sbOverlay');
  if (sidebar) sidebar.classList.remove('open'); 
  if (overlay) overlay.classList.remove('on'); 
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
    if (main) main.style.marginLeft = 'var(--sidebar)';
    if (openBtn) openBtn.style.display = 'none';
    if (toggleBtn) toggleBtn.textContent = '◀';
  } else {
    sb.classList.add('collapsed');
    if (main) main.style.marginLeft = '0';
    if (openBtn) openBtn.style.display = 'flex';
    if (toggleBtn) toggleBtn.textContent = '▶';
    const overlay = document.getElementById('sbOverlay');
    if (overlay) overlay.classList.remove('on');
  }
}

// Settings
function loadSettings() {
  const settings = loadFromLocal('settings', { 
    darkMode: false, compact: false, emailNotif: true, pushNotif: true, showProfile: true 
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

export function toggleDarkMode() { updateSettings(); }
export function toggleCompact() { updateSettings(); }
export async function updateSettings() {
  const settings = {
    darkMode: document.getElementById('darkModeToggle')?.checked,
    compact: document.getElementById('compactView')?.checked,
    emailNotif: document.getElementById('emailNotif')?.checked,
    pushNotif: document.getElementById('pushNotif')?.checked,
    showProfile: document.getElementById('showProfile')?.checked
  };
  saveToLocal('settings', settings);
  applySettings();
  if (CUK && FS) { 
    await FS.setUser(CUK, { settings }); 
  }
  showToast('Settings Updated', 'Your preferences have been saved.', 'success');
}

export function exportData() {
  const data = { user: CU, modules: mods, points: _points.filter(p => p.by === CUK), studySessions: _studySessions };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ub_academic_data_${CUK}.json`;
  a.click();
  URL.revokeObjectURL(blob);
  showToast('Data Exported', 'Your data has been downloaded.', 'success');
}

export function clearData() {
  if (confirm('Clear all local data? This will not affect your account on the server.')) {
    localStorage.clear();
    showToast('Data Cleared', 'Local data cleared.', 'info');
    location.reload();
  }
}

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

export function populateModDropdowns() {
  const opts = mods.length
    ? mods.map(m => `<option value="${m.code} – ${m.name}">${m.code} – ${m.name}</option>`).join('')
    : '<option value="">No modules — set up in Profile</option>';
  ['pMod', 'groupModule', 'ptsModule', 'sessionModSelect', 'pomodoroModule', 'stopwatchModule', 'sessionModule'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = '<option value="">— Select module —</option>' + opts; }
  });
}

export function updateRole() {
  if (!CU) return;
  const isTutor = CU.isTutor;
  const roleEl = document.getElementById('sbRole');
  const roleBadge = document.querySelector('.sb-role');
  if (roleEl) roleEl.textContent = isTutor ? 'Peer Tutor' : 'Student';
  if (roleBadge) roleBadge.className = 'sb-role ' + (isTutor ? 'tutor' : 'student');
}

// Render settings page
export function renderSettingsPage() {
  const page = document.getElementById('pg-settings');
  if (!page) return;
  page.innerHTML = `
    <div class="page-header"><h1>⚙️ Settings</h1><p>Customize your experience</p></div>
    <div class="card">
      <div class="card-title">Appearance</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;">
        <span>Dark Mode</span>
        <label class="switch"><input type="checkbox" id="darkModeToggle" onchange="window.toggleDarkMode()"><span class="slider"></span></label>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span>Compact View</span>
        <label class="switch"><input type="checkbox" id="compactView" onchange="window.toggleCompact()"><span class="slider"></span></label>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Notifications</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;">
        <span>Email Notifications</span>
        <label class="switch"><input type="checkbox" id="emailNotif" onchange="window.updateSettings()"><span class="slider"></span></label>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span>Push Notifications</span>
        <label class="switch"><input type="checkbox" id="pushNotif" onchange="window.updateSettings()"><span class="slider"></span></label>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Privacy</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;">
        <span>Show Profile to Tutors</span>
        <label class="switch"><input type="checkbox" id="showProfile" onchange="window.updateSettings()"><span class="slider"></span></label>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Data Management</div>
      <button class="btn btn-red btn-sm" onclick="window.exportData()">📥 Export My Data</button>
      <button class="btn btn-red btn-sm" onclick="window.clearData()" style="margin-left:10px;">🗑️ Clear Local Data</button>
    </div>
  `;
  loadSettings();
}

// Make functions globally available
window.go = go;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleSidebar = toggleSidebar;
window.toggleDarkMode = toggleDarkMode;
window.toggleCompact = toggleCompact;
window.updateSettings = updateSettings;
window.exportData = exportData;
window.clearData = clearData;
window.populateModDropdowns = populateModDropdowns;
window.updateRole = updateRole;
window.renderSettingsPage = renderSettingsPage;
window.updateHomeStats = updateHomeStats;

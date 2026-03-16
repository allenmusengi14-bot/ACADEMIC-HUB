import { FS } from './firebase-config.js';
import { showToast } from './components/toast.js';
import { loadFromLocal, getRandomQuote } from './components/utils.js';

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

// Make functions globally available
window.go = go;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleSidebar = toggleSidebar;
window.updateHomeStats = updateHomeStats;
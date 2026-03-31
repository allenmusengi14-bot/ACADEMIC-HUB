// ==================== AUTH.JS ====================
// Handles login, register, logout, forgot password, and app entry.
// Uses window.FS (set by firebase-config.js) — no circular imports.

import { saveToLocal, loadFromLocal } from './utils.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function setMsg(m, ok) {
  const el = document.getElementById('aMsg');
  if (!el) return;
  el.textContent = m;
  el.style.color = ok ? 'var(--green)' : 'var(--red)';
}

// Waits until firebase-config.js has set window.FS (up to 10 s)
async function waitForFS() {
  if (window.FS) return;
  setMsg('Connecting to server…');
  await new Promise(resolve => {
    if (window._fsReady) { resolve(); return; }
    document.addEventListener('fs-ready', resolve, { once: true });
    setTimeout(resolve, 10000);
  });
  if (!window.FS) throw new Error('Could not connect. Please refresh and try again.');
}

function showLoading(msg = 'Loading…') {
  let el = document.getElementById('_loadOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = '_loadOverlay';
    el.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.7);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;';
    el.innerHTML = `<div style="width:36px;height:36px;border:4px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite;"></div>
                    <p style="color:#fff;font-size:.9rem;font-weight:600;">${msg}</p>`;
    document.body.appendChild(el);
  } else {
    el.querySelector('p').textContent = msg;
    el.style.display = 'flex';
  }
}

function hideLoading() {
  const el = document.getElementById('_loadOverlay');
  if (el) el.style.display = 'none';
}

function showToast(title, msg, type = 'info') {
  // Delegate to the global showToast if other modules registered it,
  // otherwise fall back to a simple console log so auth never silently breaks.
  if (typeof window.showToast === 'function') {
    window.showToast(title, msg, type);
  } else {
    console.info(`[${type}] ${title}: ${msg}`);
  }
}

// ── auth tab switching ────────────────────────────────────────────────────────

function authTab(t) {
  document.querySelectorAll('.auth-tab').forEach((el, i) => {
    el.classList.toggle('on', (i === 0 && t === 'login') || (i === 1 && t === 'register'));
  });
  document.getElementById('loginF').classList.toggle('hidden', t !== 'login');
  document.getElementById('regF').classList.toggle('hidden', t !== 'register');
  setMsg('');
}

// ── login ─────────────────────────────────────────────────────────────────────

async function doLogin() {
  const u      = document.getElementById('lU').value.trim();
  const p      = document.getElementById('lP').value;
  const remember = document.getElementById('rememberMe').checked;

  if (!u || !p)              { setMsg('Fill in all fields.');                    return; }
  if (!/^\d{9}$/.test(u))   { setMsg('Student ID must be exactly 9 digits.');  return; }

  setMsg('Signing in…');
  showLoading('Signing in…');

  try {
    await waitForFS();
    const user = await window.FS.getUser(u);

    if (!user || user.password !== p) {
      hideLoading();
      setMsg('Incorrect Student ID or password.');
      return;
    }

    if (remember) {
      saveToLocal('rememberedUser', { id: u });
    } else {
      localStorage.removeItem('ub_rememberedUser');
    }

    await enterApp(u, user);
    hideLoading();
    showToast('Welcome back!', `Good to see you, ${user.name.split(' ')[0]}!`, 'success');

  } catch (e) {
    hideLoading();
    setMsg(e.message || 'Connection error. Check your internet.');
    showToast('Login Failed', 'Please check your connection and try again.', 'error');
  }
}

// ── register ──────────────────────────────────────────────────────────────────

async function doRegister() {
  const n   = document.getElementById('rN').value.trim();
  const u   = document.getElementById('rU').value.trim();
  const w   = document.getElementById('rW').value.trim();
  const e   = document.getElementById('rE').value.trim();
  const fac = document.getElementById('rFac').value;
  const y   = document.getElementById('rY').value;
  const p   = document.getElementById('rP').value;
  const pc  = document.getElementById('rPC').value;

  if (!n || !u || !w || !p)  { setMsg('Fill in all required fields.');           return; }
  if (!/^\d{9}$/.test(u))    { setMsg('Student ID must be exactly 9 digits.');  return; }
  if (p !== pc)               { setMsg('Passwords do not match.');               return; }
  if (p.length < 6)           { setMsg('Password must be at least 6 characters.'); return; }

  setMsg('Creating account…');
  showLoading('Creating your account…');

  try {
    await waitForFS();
    const existing = await window.FS.getUser(u);

    if (existing) {
      hideLoading();
      setMsg('This Student ID is already registered.');
      return;
    }

    const userData = {
      name: n, password: p, wa: w, email: e || '', year: y, faculty: fac,
      studentId: u, modules: [], isTutor: false, tutorBio: '', tutorSubjects: [],
      programme: '', semester: 'Semester 1', createdAt: new Date().toISOString(),
      settings: { darkMode: false, compact: false, emailNotif: true, pushNotif: true, showProfile: true },
      studyStats: { totalHours: 0, streak: 0, lastStudyDate: null, points: 0 }
    };

    await window.FS.setUser(u, userData);
    hideLoading();
    setMsg('✓ Account created!', true);
    showToast('Registration Successful', 'Welcome to UB Academic Hub!', 'success');

    setTimeout(() => {
      enterApp(u, userData);
      const setupMod = document.getElementById('setupMod');
      if (setupMod) setupMod.classList.add('on');
    }, 700);

  } catch (err) {
    hideLoading();
    console.error(err);
    setMsg('Connection error. Check your internet.');
    showToast('Registration Failed', 'Please try again later.', 'error');
  }
}

// ── forgot password ───────────────────────────────────────────────────────────

function showForgotPassword() {
  const el = document.getElementById('forgotMod');
  if (el) el.classList.add('on');
}

function closeForgot() {
  const el = document.getElementById('forgotMod');
  if (el) el.classList.remove('on');
  const fU = document.getElementById('fU'); if (fU) fU.value = '';
  const fW = document.getElementById('fW'); if (fW) fW.value = '';
}

async function resetPassword() {
  const u = document.getElementById('fU').value.trim();
  const w = document.getElementById('fW').value.trim();

  if (!u || !w) { alert('Please fill in both fields.'); return; }

  showLoading('Processing…');
  try {
    await waitForFS();
    const user = await window.FS.getUser(u);

    if (!user || user.wa !== w) {
      hideLoading();
      alert('Student ID and WhatsApp number do not match our records.');
      return;
    }

    const tempPass = Math.random().toString(36).slice(-8);
    await window.FS.setUser(u, { password: tempPass });

    hideLoading();
    alert(`Your temporary password is: ${tempPass}\n\nWrite this down and use it to sign in, then change your password.`);
    closeForgot();
    showToast('Password Reset', 'Temporary password generated — use it to sign in.', 'info');

  } catch (err) {
    hideLoading();
    alert('An error occurred. Please try again.');
  }
}

// ── logout ────────────────────────────────────────────────────────────────────

async function doLogout() {
  // Clear globals set by enterApp
  window.CU  = null;
  window.CUK = null;
  window.mods = [];

  // Clear all intervals / listeners
  ['_pomodoroInterval', '_stopwatchInterval'].forEach(k => {
    if (window[k]) { clearInterval(window[k]); window[k] = null; }
  });
  ['_unsubReqs', '_unsubPoints', '_unsubGroups', '_unsubStudyPosts', '_unsubFocusRooms'].forEach(k => {
    if (typeof window[k] === 'function') { window[k](); window[k] = null; }
  });

  document.getElementById('appScreen').classList.add('hidden');
  document.getElementById('authScreen').classList.remove('hidden');
  const lU = document.getElementById('lU'); if (lU) lU.value = '';
  const lP = document.getElementById('lP'); if (lP) lP.value = '';

  showToast('Logged Out', 'You have been successfully logged out.', 'info');
}

// ── app entry ─────────────────────────────────────────────────────────────────

async function enterApp(u, userData) {
  // Make sure FS is ready
  if (!window.FS) {
    await new Promise(resolve => {
      if (window._fsReady) { resolve(); return; }
      document.addEventListener('fs-ready', resolve, { once: true });
      setTimeout(resolve, 8000);
    });
  }

  // Store current user globally so all other modules can read them
  window.CUK  = u;
  window.CU   = userData;
  window.mods = userData.modules || [];

  // Set up real-time listeners (other modules expose these via window.FS)
  window._unsubReqs       = window.FS.onRequests(data => {
    window._requests = data;
    if (typeof window.renderReqs    === 'function') window.renderReqs();
    if (typeof window.renderMyReqs  === 'function') window.renderMyReqs();
  });
  window._unsubPoints     = window.FS.onPoints(data => {
    window._points = data;
    if (typeof window.renderPointsLeaderboard === 'function') window.renderPointsLeaderboard();
    if (typeof window.renderMyPoints          === 'function') window.renderMyPoints();
    if (typeof window.updateMyPointsBadge     === 'function') window.updateMyPointsBadge();
    if (typeof window.updateHomeStats         === 'function') window.updateHomeStats();
  });
  window._unsubGroups     = window.FS.onGroups(data => {
    window._groups = data;
    if (typeof window.filterSquad === 'function' &&
        document.getElementById('pg-squad')?.classList.contains('on')) window.filterSquad();
  });
  window._unsubStudyPosts = window.FS.onStudySessionsPosts(data => {
    window._studySessionsPosts = data;
    if (typeof window.filterSquad === 'function' &&
        document.getElementById('pg-squad')?.classList.contains('on')) window.filterSquad();
  });
  window._unsubFocusRooms = window.FS.onFocusRooms(data => {
    window._focusRooms = data;
    if (typeof window.renderFocusRooms === 'function' &&
        document.getElementById('pg-rooms')?.classList.contains('on')) window.renderFocusRooms();
  });

  // Load one-time data
  try { window._ratings       = await window.FS.getRatings(); }       catch(e) { console.warn('ratings:', e); }
  try { window._studySessions = await window.FS.getUserStudySessions(u); } catch(e) { console.warn('study sessions:', e); }

  // Update shared UI elements
  const ini = userData.name[0].toUpperCase();
  ['sbAv', 'topAv', 'profAv'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = ini;
  });

  const sbUname = document.getElementById('sbUname');
  if (sbUname) sbUname.textContent = userData.name.split(' ')[0];

  // Profile display fields
  const fields = {
    pdName: userData.name, pdUser: userData.studentId, pdWA: userData.wa,
    pdEmail: userData.email, pdYear: userData.year, pdFaculty: userData.faculty,
    pdProgramme: userData.programme, profName: userData.name,
  };
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '—';
  });

  const profMeta = document.getElementById('profMeta');
  if (profMeta) profMeta.textContent = `${userData.year || 'Student'} · ${userData.faculty || 'University of Botswana'}`;

  const pwaEl = document.getElementById('pWA');
  if (pwaEl) pwaEl.value = userData.wa || '';

  // Flip screens
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');

  // Set sidebar faculty field for rooms page
  const roomFacField = document.getElementById('roomFaculty');
  if (roomFacField && userData.faculty) roomFacField.value = userData.faculty;

  // Run page initialisers safely (missing functions won't crash login)
  const safe = (fn, label) => {
    try {
      if (typeof window[fn] === 'function') window[fn]();
      else if (typeof fn === 'function') fn();
    } catch(e) { console.warn('enterApp init error [' + label + ']:', e); }
  };

  safe('setGreeting',           'setGreeting');
  safe('renderTutors',          'renderTutors');
  safe('renderProfile',         'renderProfile');
  safe('populateModDropdowns',  'populateModDropdowns');
  safe('populateGPARows',       'populateGPARows');
  safe('populateForeRows',      'populateForeRows');
  safe('populateStreakModules',  'populateStreakModules');
  safe('renderSessionHistory',  'renderSessionHistory');
  safe('updateStreakStats',     'updateStreakStats');
  safe('updateHomeStats',       'updateHomeStats');
  safe('renderHeatCalendar',    'renderHeatCalendar');
  safe('applySettings',         'applySettings');
  safe('updateRole',            'updateRole');

  // Navigate to home
  if (typeof window.go === 'function') window.go('home');

  // Show setup modal if no programme set yet
  if (!userData.programme || userData.programme === '') {
    setTimeout(() => {
      const setupMod = document.getElementById('setupMod');
      if (setupMod) setupMod.classList.add('on');
    }, 800);
  }

  // Quote rotation
  if (typeof window.rotateQuote === 'function') {
    setInterval(window.rotateQuote, 3 * 60 * 60 * 1000);
  }
}

// ── DOMContentLoaded wiring ───────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Tab buttons
  const loginTab = document.getElementById('authLoginTab');
  const regTab   = document.getElementById('authRegisterTab');
  if (loginTab) loginTab.addEventListener('click', () => authTab('login'));
  if (regTab)   regTab.addEventListener('click',   () => authTab('register'));

  // Restore remembered user
  const savedUser = loadFromLocal('rememberedUser');
  if (savedUser && savedUser.id) {
    const lU = document.getElementById('lU');
    const rm = document.getElementById('rememberMe');
    if (lU) lU.value = savedUser.id;
    if (rm) rm.checked = true;
  }
});

// ── expose everything to window (required by inline onclick handlers) ─────────

window.authTab          = authTab;
window.doLogin          = doLogin;
window.doRegister       = doRegister;
window.doLogout         = doLogout;
window.showForgotPassword = showForgotPassword;
window.closeForgot      = closeForgot;
window.resetPassword    = resetPassword;
window.enterApp         = enterApp;      // exposed so register path can call it
window.showLoading      = showLoading;
window.hideLoading      = hideLoading;

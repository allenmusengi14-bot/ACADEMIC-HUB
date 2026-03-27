import { FS } from './firebase-config.js';
import { showToast, showLoading, hideLoading } from './toast.js';
import { saveToLocal, loadFromLocal } from './utils.js';

// Global state (will be set by app.js)
let CU = null;
let CUK = null;
let setCurrentUserCallback = null;
let setCurrentUserKeyCallback = null;
let setModulesCallback = null;

// Wait for Firebase to be ready
async function waitForFS() {
  if (window.FS) return;
  const msgEl = document.getElementById('fsStatus');
  if (msgEl) msgEl.textContent = '⏳ Connecting to server...';
  
  await new Promise(resolve => {
    if (window.FS) { resolve(); return; }
    document.addEventListener('fs-ready', resolve, { once: true });
    setTimeout(resolve, 10000);
  });
  
  if (!window.FS) throw new Error('Could not connect. Please refresh.');
  if (msgEl) msgEl.textContent = '✅ Ready — you can sign in';
  setTimeout(() => { if (msgEl) msgEl.style.display = 'none'; }, 3000);
}

// Initialize auth listeners
document.addEventListener('DOMContentLoaded', () => {
  const loginTab = document.getElementById('authLoginTab');
  const registerTab = document.getElementById('authRegisterTab');
  if (loginTab) loginTab.addEventListener('click', () => authTab('login'));
  if (registerTab) registerTab.addEventListener('click', () => authTab('register'));
});

// Auth tab switching
export function authTab(t) {
  document.querySelectorAll('.auth-tab').forEach((el, i) => {
    el.classList.toggle('on', (i === 0 && t === 'login') || (i === 1 && t === 'register'));
  });
  document.getElementById('loginF').classList.toggle('hidden', t !== 'login');
  document.getElementById('regF').classList.toggle('hidden', t !== 'register');
  setMsg('');
}

function setMsg(m, ok) {
  const el = document.getElementById('aMsg');
  if (!el) return;
  el.textContent = m;
  el.style.color = ok ? 'var(--green)' : 'var(--red)';
}

// Set callbacks from app.js
export function setAuthCallbacks(setUser, setUserKey, setMods) {
  setCurrentUserCallback = setUser;
  setCurrentUserKeyCallback = setUserKey;
  setModulesCallback = setMods;
}

// Login function
export async function doLogin() {
  const u = document.getElementById('lU').value.trim();
  const p = document.getElementById('lP').value;
  const remember = document.getElementById('rememberMe').checked;
  
  if (!u || !p) { 
    setMsg('Fill in all fields.'); 
    return; 
  }
  if (!/^\d{9}$/.test(u)) { 
    setMsg('Student ID must be exactly 9 digits.'); 
    return; 
  }
  
  setMsg('Signing in...');
  showLoading('Signing in...');
  
  try {
    await waitForFS();
    const user = await FS.getUser(u);
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
    console.error('Login error:', e);
    setMsg('Connection error. Check your internet.');
    showToast('Login Failed', 'Please check your connection and try again.', 'error');
  }
}

// Register function
export async function doRegister() {
  const n = document.getElementById('rN').value.trim();
  const u = document.getElementById('rU').value.trim();
  const w = document.getElementById('rW').value.trim();
  const e = document.getElementById('rE').value.trim();
  const fac = document.getElementById('rFac').value;
  const y = document.getElementById('rY').value;
  const p = document.getElementById('rP').value;
  const pc = document.getElementById('rPC').value;
  
  if (!n || !u || !w || !p) { 
    setMsg('Fill in all required fields.'); 
    return; 
  }
  if (!/^\d{9}$/.test(u)) { 
    setMsg('Student ID must be exactly 9 digits.'); 
    return; 
  }
  if (p !== pc) { 
    setMsg('Passwords do not match.'); 
    return; 
  }
  if (p.length < 6) { 
    setMsg('Password must be at least 6 characters.'); 
    return; 
  }
  
  setMsg('Creating account...');
  showLoading('Creating your account...');
  
  try {
    await waitForFS();
    const existing = await FS.getUser(u);
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
    
    await FS.setUser(u, userData);
    hideLoading();
    setMsg('✓ Account created!', true);
    showToast('Registration Successful', 'Welcome to UB Academic Hub!', 'success');
    
    setTimeout(() => {
      enterApp(u, userData);
      const setupMod = document.getElementById('setupMod');
      if (setupMod) setupMod.classList.add('on');
    }, 700);
  } catch (e) {
    hideLoading();
    console.error('Registration error:', e);
    setMsg('Connection error. Check your internet.');
    showToast('Registration Failed', 'Please try again later.', 'error');
  }
}

// Setup functions
export function addSetupMod() {
  const code = document.getElementById('setupCode').value.trim();
  const name = document.getElementById('setupName').value.trim();
  if (!code || !name) { alert('Enter both module code and name.'); return; }
  const list = document.getElementById('setupModList');
  const chip = document.createElement('div');
  chip.className = 'mod-chip sel';
  chip.setAttribute('data-code', code);
  chip.setAttribute('data-name', name);
  chip.innerHTML = `<span><strong>${code}</strong> – ${name}</span> <span class="rmv" onclick="this.parentElement.remove()">✕</span>`;
  list.appendChild(chip);
  document.getElementById('setupCode').value = '';
  document.getElementById('setupName').value = '';
}

export async function saveSetup() {
  const programme = document.getElementById('setupProg').value.trim();
  const semester = document.getElementById('setupSem').value;
  const modChips = document.querySelectorAll('#setupModList .mod-chip');
  const modules = [];
  modChips.forEach(chip => {
    const code = chip.getAttribute('data-code');
    const name = chip.getAttribute('data-name');
    if (code && name) {
      modules.push({ code, name, credits: 3 });
    }
  });
  await FS.setUser(CUK, { programme, semester, modules });
  if (setModulesCallback) setModulesCallback(modules);
  document.getElementById('setupMod').classList.remove('on');
  showToast('Profile Updated', 'Your academic profile has been saved!', 'success');
  if (window.populateModDropdowns) window.populateModDropdowns();
}

export function closeSetup() { 
  const modal = document.getElementById('setupMod');
  if (modal) modal.classList.remove('on'); 
}

// Forgot password
export function showForgotPassword() {
  const modal = document.getElementById('forgotMod');
  if (modal) modal.classList.add('on');
}

export function closeForgot() {
  const modal = document.getElementById('forgotMod');
  if (modal) modal.classList.remove('on');
  document.getElementById('fU').value = '';
  document.getElementById('fW').value = '';
}

export async function resetPassword() {
  const u = document.getElementById('fU').value.trim();
  const w = document.getElementById('fW').value.trim();
  
  if (!u || !w) { 
    alert('Please fill in both fields.'); 
    return; 
  }
  
  showLoading('Processing...');
  try {
    await waitForFS();
    const user = await FS.getUser(u);
    if (!user || user.wa !== w) {
      hideLoading();
      alert('Student ID and WhatsApp number do not match our records.');
      return;
    }
    
    const tempPass = Math.random().toString(36).slice(-8);
    await FS.setUser(u, { password: tempPass });
    
    hideLoading();
    alert(`Your temporary password is: ${tempPass}\n\nWrite this down and use it to sign in, then change your password.`);
    closeForgot();
    showToast('Password Reset', 'Temporary password generated — use it to sign in.', 'info');
  } catch (e) {
    hideLoading();
    alert('An error occurred. Please try again.');
  }
}

// Logout function
export async function doLogout() {
  // Clear global state
  if (setCurrentUserCallback) setCurrentUserCallback(null);
  if (setCurrentUserKeyCallback) setCurrentUserKeyCallback(null);
  if (setModulesCallback) setModulesCallback([]);
  
  // Clear all intervals
  if (window._pomodoroInterval) clearInterval(window._pomodoroInterval);
  if (window._stopwatchInterval) clearInterval(window._stopwatchInterval);
  if (window._sessionLiveTick) clearInterval(window._sessionLiveTick);
  
  // Unsubscribe from all listeners
  if (window._unsubReqs) window._unsubReqs();
  if (window._unsubPoints) window._unsubPoints();
  if (window._unsubGroups) window._unsubGroups();
  if (window._unsubStudyPosts) window._unsubStudyPosts();
  if (window._unsubFocusRooms) window._unsubFocusRooms();
  
  const appScreen = document.getElementById('appScreen');
  const authScreen = document.getElementById('authScreen');
  if (appScreen) appScreen.classList.add('hidden');
  if (authScreen) authScreen.classList.remove('hidden');
  
  const lU = document.getElementById('lU');
  const lP = document.getElementById('lP');
  if (lU) lU.value = '';
  if (lP) lP.value = '';
  
  showToast('Logged Out', 'You have been successfully logged out.', 'info');
}

// App entry point
async function enterApp(u, userData) {
  CU = userData;
  CUK = u;
  
  if (setCurrentUserCallback) setCurrentUserCallback(userData);
  if (setCurrentUserKeyCallback) setCurrentUserKeyCallback(u);
  if (setModulesCallback) setModulesCallback(userData.modules || []);
  
  // Update UI
  const ini = userData.name[0].toUpperCase();
  ['sbAv', 'topAv', 'profAv'].forEach(id => { 
    const el = document.getElementById(id); 
    if (el) el.textContent = ini; 
  });
  
  const sbUname = document.getElementById('sbUname');
  if (sbUname) sbUname.textContent = userData.name.split(' ')[0];
  
  const pWA = document.getElementById('pWA');
  if (pWA) pWA.value = userData.wa || '';
  
  // Show app, hide auth
  const authScreen = document.getElementById('authScreen');
  const appScreen = document.getElementById('appScreen');
  if (authScreen) authScreen.classList.add('hidden');
  if (appScreen) appScreen.classList.remove('hidden');
  
  // Navigate to home
  if (window.go) window.go('home');
  
  // Show setup modal if no programme set
  if (!userData.programme || userData.programme === '') {
    setTimeout(() => {
      const setupMod = document.getElementById('setupMod');
      if (setupMod) setupMod.classList.add('on');
    }, 800);
  }
}

// Make all functions globally available
window.authTab = authTab;
window.doLogin = doLogin;
window.doRegister = doRegister;
window.doLogout = doLogout;
window.showForgotPassword = showForgotPassword;
window.closeForgot = closeForgot;
window.resetPassword = resetPassword;
window.addSetupMod = addSetupMod;
window.saveSetup = saveSetup;
window.closeSetup = closeSetup;

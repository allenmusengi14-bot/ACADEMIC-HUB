import { FS } from './firebase-config.js';
import { showToast, showLoading, hideLoading } from './components/toast.js';

console.log('🔥 REAL AUTH loaded with Firebase');

// Global state (will be set by app.js)
let CU = null;
let CUK = null;

// Auth tab switching
window.authTab = function(t) {
  console.log('Switching to tab:', t);
  document.querySelectorAll('.auth-tab').forEach((el, i) => {
    el.classList.toggle('on', (i === 0 && t === 'login') || (i === 1 && t === 'register'));
  });
  document.getElementById('loginF').classList.toggle('hidden', t !== 'login');
  document.getElementById('regF').classList.toggle('hidden', t !== 'register');
  setMsg('');
}

function setMsg(m, ok) {
  const el = document.getElementById('aMsg');
  if (el) {
    el.textContent = m || '';
    el.style.color = ok ? 'var(--green)' : 'var(--red)';
  }
}

// Login function
window.doLogin = async function() {
  console.log('✅ Login function called');
  
  if (!window.FS) { 
    setMsg('Still connecting... please wait.'); 
    return;
  }
  
  const u = document.getElementById('lU')?.value.trim();
  const p = document.getElementById('lP')?.value;
  const remember = document.getElementById('rememberMe')?.checked;
  
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
window.doRegister = async function() {
  console.log('✅ Register function called');
  
  if (!window.FS) { 
    setMsg('Still connecting... please wait.'); 
    return; 
  }
  
  const n = document.getElementById('rN')?.value.trim();
  const u = document.getElementById('rU')?.value.trim();
  const w = document.getElementById('rW')?.value.trim();
  const e = document.getElementById('rE')?.value.trim();
  const fac = document.getElementById('rFac')?.value;
  const y = document.getElementById('rY')?.value;
  const p = document.getElementById('rP')?.value;
  const pc = document.getElementById('rPC')?.value;
  
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
    const existing = await FS.getUser(u);
    if (existing) {
      hideLoading();
      setMsg('This Student ID is already registered.');
      return;
    }
    
    const userData = {
      name: n, 
      password: p, 
      wa: w, 
      email: e || '', 
      year: y, 
      faculty: fac,
      studentId: u, 
      modules: [], 
      isTutor: false, 
      tutorBio: '', 
      tutorSubjects: [],
      programme: '', 
      semester: 'Semester 1', 
      createdAt: new Date().toISOString(),
      settings: { 
        darkMode: false, 
        compact: false, 
        emailNotif: true, 
        pushNotif: true, 
        showProfile: true 
      },
      studyStats: { 
        totalHours: 0, 
        streak: 0, 
        lastStudyDate: null, 
        points: 0 
      }
    };
    
    await FS.setUser(u, userData);
    hideLoading();
    setMsg('✓ Account created!', true);
    showToast('Registration Successful', 'Welcome to UB Academic Hub!', 'success');
    
    // Show setup modal after registration
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

// Logout function
window.doLogout = async function() {
  console.log('Logout function called');
  
  // Clear global state
  if (window.setCurrentUser) window.setCurrentUser(null);
  if (window.setCurrentUserKey) window.setCurrentUserKey(null);
  if (window.setModules) window.setModules([]);
  
  // Clear all intervals
  if (window._pomodoroInterval) clearInterval(window._pomodoroInterval);
  if (window._stopwatchInterval) clearInterval(window._stopwatchInterval);
  
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

// Forgot password
window.showForgotPassword = function() {
  const forgotMod = document.getElementById('forgotMod');
  if (forgotMod) forgotMod.classList.add('on');
}

window.closeForgot = function() {
  const forgotMod = document.getElementById('forgotMod');
  if (forgotMod) forgotMod.classList.remove('on');
  
  const fU = document.getElementById('fU');
  const fW = document.getElementById('fW');
  if (fU) fU.value = '';
  if (fW) fW.value = '';
}

window.resetPassword = async function() {
  const u = document.getElementById('fU')?.value.trim();
  const w = document.getElementById('fW')?.value.trim();
  
  if (!u || !w) { 
    alert('Please fill in both fields.'); 
    return; 
  }
  
  showLoading('Processing...');
  try {
    const user = await FS.getUser(u);
    if (!user || user.wa !== w) {
      hideLoading();
      alert('Student ID and WhatsApp number do not match our records.');
      return;
    }
    
    const tempPass = Math.random().toString(36).slice(-8);
    await FS.setUser(u, { password: tempPass });
    
    hideLoading();
    alert(`Your temporary password is: ${tempPass}\n\nPlease change it after logging in.`);
    closeForgot();
    showToast('Password Reset', 'Temporary password sent. Check your WhatsApp.', 'info');
  } catch (e) {
    hideLoading();
    console.error('Password reset error:', e);
    alert('An error occurred. Please try again.');
  }
}

// App entry point
async function enterApp(u, userData) {
  console.log('Entering app for user:', u);
  
  if (!window.FS) {
    await new Promise(resolve => {
      if (window._fsReady) { 
        resolve(); 
        return; 
      }
      document.addEventListener('fs-ready', resolve, { once: true });
      setTimeout(resolve, 5000);
    });
  }
  
  // Set global state
  if (window.setCurrentUser) window.setCurrentUser(userData);
  if (window.setCurrentUserKey) window.setCurrentUserKey(u);
  if (window.setModules) window.setModules(userData.modules || []);
  
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
  const appScreen = document.getElementById('appScreen');
  const authScreen = document.getElementById('authScreen');
  
  if (appScreen) appScreen.classList.remove('hidden');
  if (authScreen) authScreen.classList.add('hidden');
  
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

// Local Storage helper
function saveToLocal(key, data) { 
  try { 
    localStorage.setItem(`ub_${key}`, JSON.stringify(data)); 
  } catch(e){} 
}

// Initialize auth tabs
document.addEventListener('DOMContentLoaded', () => {
  console.log('Auth.js loaded');
  
  // Set up auth tab switching
  const loginTab = document.getElementById('authLoginTab');
  const registerTab = document.getElementById('authRegisterTab');
  
  if (loginTab) {
    loginTab.addEventListener('click', () => window.authTab('login'));
  }
  
  if (registerTab) {
    registerTab.addEventListener('click', () => window.authTab('register'));
  }
  
  // Add enter key handlers
  const lP = document.getElementById('lP');
  if (lP) {
    lP.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') window.doLogin();
    });
  }
  
  const rP = document.getElementById('rP');
  if (rP) {
    rP.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') window.doRegister();
    });
  }
});

console.log('✅ REAL Auth functions ready');

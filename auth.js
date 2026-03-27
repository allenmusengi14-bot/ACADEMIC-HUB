import { FS } from './firebase-config.js';
import { showToast, showLoading, hideLoading } from './components/toast.js';
import { saveToLocal, loadFromLocal } from './components/utils.js';
import { setCurrentUser, setCurrentUserKey, setModules } from './app.js';

// Auth state
let CU = null;
let CUK = null;

// Initialize auth listeners
document.addEventListener('DOMContentLoaded', () => {
  // Set up auth tab switching
  document.getElementById('authLoginTab').addEventListener('click', () => authTab('login'));
  document.getElementById('authRegisterTab').addEventListener('click', () => authTab('register'));
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
  el.textContent = m;
  el.style.color = ok ? 'var(--green)' : 'var(--red)';
}

// Login function
export async function doLogin() {
  if (!window.FS) { 
    setMsg('Still connecting... please wait.'); 
    return;
  }
  
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
    setMsg('Connection error. Check your internet.');
    showToast('Login Failed', 'Please check your connection and try again.', 'error');
  }
}

// Register function
export async function doRegister() {
  if (!window.FS) { 
    setMsg('Still connecting... please wait.'); 
    return; 
  }
  
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
    
    // Show setup modal after registration
    setTimeout(() => {
      enterApp(u, userData);
      document.getElementById('setupMod').classList.add('on');
    }, 700);
  } catch (e) {
    hideLoading();
    console.error(e);
    setMsg('Connection error. Check your internet.');
    showToast('Registration Failed', 'Please try again later.', 'error');
  }
}

// Logout function
export async function doLogout() {
  // Clear global state
  setCurrentUser(null);
  setCurrentUserKey(null);
  setModules([]);
  
  // Clear all intervals
  if (window._pomodoroInterval) clearInterval(window._pomodoroInterval);
  if (window._stopwatchInterval) clearInterval(window._stopwatchInterval);
  
  // Unsubscribe from all listeners
  if (window._unsubReqs) window._unsubReqs();
  if (window._unsubPoints) window._unsubPoints();
  if (window._unsubGroups) window._unsubGroups();
  if (window._unsubStudyPosts) window._unsubStudyPosts();
  if (window._unsubFocusRooms) window._unsubFocusRooms();
  
  document.getElementById('appScreen').classList.add('hidden');
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('lU').value = '';
  document.getElementById('lP').value = '';
  showToast('Logged Out', 'You have been successfully logged out.', 'info');
}

// Forgot password
export function showForgotPassword() {
  document.getElementById('forgotMod').classList.add('on');
}

export function closeForgot() {
  document.getElementById('forgotMod').classList.remove('on');
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
    alert('An error occurred. Please try again.');
  }
}

// App entry point
async function enterApp(u, userData) {
  if (!window.FS) {
    await new Promise(resolve => {
      if (window._fsReady) { 
        resolve(); 
        return; 
      }
      document.addEventListener('fs-ready', resolve, { once: true });
      setTimeout(resolve, 8000);
    });
  }
  
  setCurrentUserKey(u);
  setCurrentUser(userData);
  setModules(userData.modules || []);
  
  // Update UI
  const ini = userData.name[0].toUpperCase();
  ['sbAv', 'topAv', 'profAv'].forEach(id => { 
    const el = document.getElementById(id); 
    if (el) el.textContent = ini; 
  });
  
  document.getElementById('sbUname').textContent = userData.name.split(' ')[0];
  document.getElementById('pWA').value = userData.wa || '';
  
  // Show app, hide auth
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  
  // Navigate to home
  window.go('home');
  
  // Show setup modal if no programme set
  if (!userData.programme || userData.programme === '') {
    setTimeout(() => {
      document.getElementById('setupMod').classList.add('on');
    }, 800);
  }
}

// Make functions globally available
window.authTab = authTab;
window.doLogin = doLogin;
window.doRegister = doRegister;
window.doLogout = doLogout;
window.showForgotPassword = showForgotPassword;
window.closeForgot = closeForgot;
window.resetPassword = resetPassword;

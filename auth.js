// Simple direct auth functions
console.log('🔥 SIMPLE AUTH loaded');

// Make functions globally available immediately
window.doLogin = function() {
    console.log('✅ Login clicked');
    alert('Login function working!');
    
    const u = document.getElementById('lU')?.value;
    const p = document.getElementById('lP')?.value;
    
    if (!u || !p) {
        alert('Please fill in all fields');
        return;
    }
    
    alert(`Attempting to login with ID: ${u}`);
}

window.doRegister = function() {
    console.log('✅ Register clicked');
    alert('Register function working!');
    
    const name = document.getElementById('rN')?.value;
    const id = document.getElementById('rU')?.value;
    
    if (!name || !id) {
        alert('Please fill in required fields');
        return;
    }
    
    alert(`Attempting to register: ${name} (${id})`);
}

window.showForgotPassword = function() {
    alert('Forgot password clicked');
}

window.authTab = function(tab) {
    console.log('Switching to tab:', tab);
    if (tab === 'login') {
        document.getElementById('loginF').classList.remove('hidden');
        document.getElementById('regF').classList.add('hidden');
        document.querySelectorAll('.auth-tab')[0].classList.add('on');
        document.querySelectorAll('.auth-tab')[1].classList.remove('on');
    } else {
        document.getElementById('loginF').classList.add('hidden');
        document.getElementById('regF').classList.remove('hidden');
        document.querySelectorAll('.auth-tab')[0].classList.remove('on');
        document.querySelectorAll('.auth-tab')[1].classList.add('on');
    }
}

console.log('✅ Auth functions attached to window:', {
    doLogin: typeof window.doLogin,
    doRegister: typeof window.doRegister
});

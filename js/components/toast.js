// Toast notification system
export function showToast(title, msg, type = 'info', duration = 5000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${msg}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// Loading overlay
export function showLoading(msg = 'Loading...') {
  let el = document.getElementById('_loadOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = '_loadOverlay';
    el.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.7);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;';
    el.innerHTML = `<div class="spinner" style="width:36px;height:36px;border-width:4px;border-color:rgba(255,255,255,.3);border-top-color:#fff;"></div><p style="color:#fff;font-size:.9rem;font-weight:600;">${msg}</p>`;
    document.body.appendChild(el);
  } else {
    el.querySelector('p').textContent = msg;
    el.style.display = 'flex';
  }
}

export function hideLoading() { 
  const el = document.getElementById('_loadOverlay'); 
  if(el) el.style.display = 'none'; 
}

// Make globally available
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;

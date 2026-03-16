import { CU, CUK, mods, _requests } from '../app.js';
import { FS } from '../firebase-config.js';
import { showToast } from '../components/toast.js';

// Render Peer page
export function renderPeerPage() {
  const page = document.getElementById('pg-peer');
  if (!page) return;
  
  page.innerHTML = `
    <div class="pb-banner">
      <div>
        <h2>🤝 PeerBridge</h2>
        <p>Post a help request and set your own price — connect with peer tutors at UB</p>
      </div>
      <div class="pb-rate-badge">
        <div class="pb-rate-amt">P15+</div>
        <div class="pb-rate-lbl">Student sets the price</div>
      </div>
    </div>
    
    <div class="seg-tabs">
      <button class="seg-tab on" onclick="window.peerTab('browse')" id="pt-browse">🔍 Browse Requests</button>
      <button class="seg-tab" onclick="window.peerTab('post')" id="pt-post">✏️ Post Request</button>
      <button class="seg-tab" onclick="window.peerTab('mine')" id="pt-mine">📋 My Requests</button>
    </div>
    
    <div id="peer-browse">
      <div class="card" style="padding:14px 18px;margin-bottom:14px;">
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <input id="pSrch" type="text" placeholder="Search module or topic…" oninput="window.renderReqs()" class="req-fi" style="flex:1;min-width:140px;">
          <select id="pFilt" onchange="window.renderReqs()" class="req-fi" style="width:auto;">
            <option value="all">All Requests</option>
            <option value="open">Open Only</option>
          </select>
        </div>
      </div>
      <div id="reqList"></div>
    </div>
    
    <div id="peer-post" class="hidden">
      <div class="card">
        <div class="card-title">Post a Help Request</div>
        <div style="display:grid;gap:13px;">
          <div class="row2" style="display:grid;grid-template-columns:1fr 1fr;gap:13px;">
            <div>
              <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:6px;">Module</label>
              <select id="pMod" class="req-fi"><option value="">— Select module —</option></select>
            </div>
            <div>
              <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:6px;">Topic</label>
              <input id="pTop" class="req-fi" placeholder="e.g. Carnot Cycle">
            </div>
          </div>
          <div>
            <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:6px;">Describe Your Problem</label>
            <textarea id="pDesc" class="req-fi" placeholder="What exactly are you struggling with?" style="min-height:80px;resize:vertical;"></textarea>
          </div>
          <div class="row2" style="display:grid;grid-template-columns:1fr 1fr;gap:13px;">
            <div>
              <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:6px;">Time Needed</label>
              <select id="pTime" class="req-fi">
                <option value="0.5">30 Minutes</option>
                <option value="0.75">45 Minutes</option>
                <option value="1">1 Hour</option>
                <option value="1.5">1h 30m</option>
                <option value="2">2 Hours</option>
                <option value="3">3 Hours</option>
              </select>
            </div>
            <div>
              <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:6px;">Type of Help</label>
              <select id="pType" class="req-fi">
                <option value="Virtual">Virtual (Zoom / Meet)</option>
                <option value="WhatsApp">WhatsApp Call</option>
                <option value="Physical">Physical Meet</option>
              </select>
            </div>
          </div>
          <div class="row2" style="display:grid;grid-template-columns:1fr 1fr;gap:13px;">
            <div>
              <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:6px;">💰 Your Offer (Pula)</label>
              <div style="position:relative;">
                <span style="position:absolute;left:13px;top:50%;transform:translateY(-50%);font-weight:700;color:var(--green);">P</span>
                <input id="pPrice" type="number" min="15" class="req-fi" placeholder="Min. 15" style="padding-left:28px;" oninput="window.validatePrice()">
              </div>
              <p style="font-size:.72rem;color:var(--muted);margin-top:4px;">Minimum P15</p>
            </div>
            <div>
              <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:6px;">Urgency</label>
              <select id="pUrg" class="req-fi">
                <option value="flexible">Flexible</option>
                <option value="today">Today</option>
                <option value="asap">ASAP</option>
              </select>
            </div>
          </div>
          <div>
            <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:6px;">Your WhatsApp</label>
            <input id="pWA" type="tel" readonly class="req-fi" style="background:#f5f5f5;" value="${CU?.wa || ''}">
          </div>
          <button class="btn btn-blue" style="width:fit-content;" onclick="window.postReq()">📤 Post Request</button>
        </div>
      </div>
    </div>
    
    <div id="peer-mine" class="hidden">
      <div id="myReqList"></div>
    </div>
  `;
  
  // Populate module dropdown
  populatePeerModules();
  
  // Render requests
  renderReqs();
  renderMyReqs();
}

// Populate module dropdown
function populatePeerModules() {
  const pMod = document.getElementById('pMod');
  if (!pMod) return;
  
  const opts = mods.length
    ? mods.map(m => `<option value="${m.code} – ${m.name}">${m.code} – ${m.name}</option>`).join('')
    : '<option value="">No modules — set up in Profile</option>';
  
  pMod.innerHTML = '<option value="">— Select module —</option>' + opts;
}

// Tab switching
function peerTab(t) {
  document.getElementById('pt-browse').classList.toggle('on', t === 'browse');
  document.getElementById('pt-post').classList.toggle('on', t === 'post');
  document.getElementById('pt-mine').classList.toggle('on', t === 'mine');
  
  document.getElementById('peer-browse').classList.toggle('hidden', t !== 'browse');
  document.getElementById('peer-post').classList.toggle('hidden', t !== 'post');
  document.getElementById('peer-mine').classList.toggle('hidden', t !== 'mine');
  
  if (t === 'browse') renderReqs();
  if (t === 'mine') renderMyReqs();
}

// Validate price
function validatePrice() {
  const price = document.getElementById('pPrice').value;
  const min = 15;
  if (price < min) document.getElementById('pPrice').value = min;
}

// Post request
async function postReq() {
  const mod = document.getElementById('pMod').value;
  const top = document.getElementById('pTop').value.trim();
  const desc = document.getElementById('pDesc').value.trim();
  const time = document.getElementById('pTime').value;
  const type = document.getElementById('pType').value;
  const price = document.getElementById('pPrice').value;
  const urg = document.getElementById('pUrg').value;
  const wa = document.getElementById('pWA').value;
  
  if (!mod || !top || !desc || !price) {
    alert('Please fill in all required fields.');
    return;
  }
  
  const reqData = {
    by: CUK,
    name: CU.name,
    module: mod,
    topic: top,
    desc: desc,
    timeNeeded: parseFloat(time),
    type: type,
    price: parseFloat(price),
    urgency: urg,
    wa: wa,
    faculty: CU.faculty,
    year: CU.year,
    status: 'open',
    takenBy: null,
    takenAt: null
  };
  
  await FS.addRequest(reqData);
  
  // Clear form
  document.getElementById('pTop').value = '';
  document.getElementById('pDesc').value = '';
  document.getElementById('pPrice').value = '';
  document.getElementById('pMod').value = '';
  
  showToast('Request Posted', 'Your help request is now live!', 'success');
  peerTab('browse');
}

// Render requests
function renderReqs() {
  const search = document.getElementById('pSrch')?.value.toLowerCase() || '';
  const filter = document.getElementById('pFilt')?.value || 'all';
  
  let filtered = _requests.filter(r => r.status === 'open' && r.by !== CUK);
  
  if (search) {
    filtered = filtered.filter(r => 
      (r.module || '').toLowerCase().includes(search) || 
      (r.topic || '').toLowerCase().includes(search) || 
      (r.desc || '').toLowerCase().includes(search)
    );
  }
  
  const container = document.getElementById('reqList');
  if (!container) return;
  
  if (!filtered.length) {
    container.innerHTML = '<div class="empty"><div class="ei">🔍</div><p>No open requests available.</p></div>';
    return;
  }
  
  container.innerHTML = filtered.map(r => `
    <div class="req-card">
      <div class="req-top">
        <div class="req-left">
          <h4>${r.topic} <span class="badge badge-open">Open</span></h4>
          <span class="mod-tag">📚 ${r.module}</span>
        </div>
        <div class="pula-chip">P${r.price}</div>
      </div>
      <p class="req-desc">${r.desc}</p>
      <div class="req-meta">
        <span class="meta-chip"><i>👤</i> ${r.name} · ${r.year || '?'}</span>
        <span class="meta-chip"><i>⏱️</i> ${r.timeNeeded} hr</span>
        <span class="meta-chip"><i>📍</i> ${r.type}</span>
        <span class="meta-chip"><i>⚡</i> ${r.urgency}</span>
      </div>
      <div style="margin-top:14px;">
        <button class="btn btn-green btn-sm" onclick="window.offerHelp('${r.id}')">💬 Offer Help</button>
      </div>
    </div>
  `).join('');
}

// Render my requests
function renderMyReqs() {
  const myReqs = _requests.filter(r => r.by === CUK);
  const container = document.getElementById('myReqList');
  if (!container) return;
  
  if (!myReqs.length) {
    container.innerHTML = '<div class="empty"><div class="ei">📋</div><p>You haven\'t posted any requests yet.</p></div>';
    return;
  }
  
  container.innerHTML = myReqs.map(r => `
    <div class="req-card">
      <div class="req-top">
        <div class="req-left">
          <h4>${r.topic} <span class="badge ${r.status === 'open' ? 'badge-open' : r.status === 'taken' ? 'badge-warning' : 'badge-success'}">
            ${r.status === 'open' ? 'Open' : r.status === 'taken' ? 'Taken' : 'Completed'}
          </span></h4>
          <span class="mod-tag">📚 ${r.module}</span>
        </div>
        <div class="pula-chip">P${r.price}</div>
      </div>
      <p class="req-desc">${r.desc}</p>
      ${r.status === 'taken' && r.takenBy ? `
        <div style="background:var(--blue3);border-radius:8px;padding:8px;margin:10px 0;font-size:.8rem;">
          <strong>📞 Taken by:</strong> ${r.takenByName || 'A tutor'} · WhatsApp: ${r.takenByWA || '—'}
        </div>
      ` : ''}
      <div style="display:flex;gap:8px;margin-top:14px;">
        ${r.status === 'open' ? `
          <button class="btn btn-red btn-sm" onclick="window.delReq('${r.id}')">🗑 Delete</button>
        ` : ''}
        ${r.status === 'taken' ? `
          <button class="btn btn-blue btn-sm" onclick="window.markCompleted('${r.id}')">✓ Mark Completed</button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// Offer help
async function offerHelp(reqId) {
  const req = _requests.find(r => r.id === reqId);
  if (!req) return;
  
  if (!CU.isTutor) {
    if (confirm('You need to be a registered tutor to offer help. Become a tutor now?')) {
      document.getElementById('btMod').classList.add('on');
    }
    return;
  }
  
  await FS.updateRequest(reqId, { 
    status: 'taken', 
    takenBy: CUK, 
    takenByName: CU.name, 
    takenByWA: CU.wa 
  });
  
  const info = `
    <strong>Student:</strong> ${req.name}<br>
    <strong>Module:</strong> ${req.module}<br>
    <strong>Topic:</strong> ${req.topic}<br>
    <strong>Offer:</strong> P${req.price}<br>
    <strong>WhatsApp:</strong> ${req.wa}
  `;
  
  document.getElementById('waInfo').innerHTML = info;
  
  const message = encodeURIComponent(
    `Hi ${req.name}, I saw your help request for ${req.topic} (${req.module}). I'm a peer tutor and would like to help. Let's discuss.`
  );
  
  document.getElementById('waLink').href = `https://wa.me/${req.wa.replace(/[^0-9]/g, '')}?text=${message}`;
  document.getElementById('waMod').classList.add('on');
  
  showToast('Request Taken', 'You have taken this request. Contact the student via WhatsApp.', 'success');
}

// Mark as completed
async function markCompleted(reqId) {
  if (!confirm('Mark this request as completed?')) return;
  await FS.updateRequest(reqId, { status: 'completed' });
  showToast('Request Completed', 'Thank you!', 'success');
}

// Delete request
async function delReq(id) {
  if (!confirm('Delete this request?')) return;
  await FS.deleteRequest(id);
  showToast('Request Deleted', 'Your request has been removed.', 'info');
}

// Close WhatsApp modal
function closeWA() {
  document.getElementById('waMod').classList.remove('on');
}

// Make functions globally available
window.renderPeerPage = renderPeerPage;
window.peerTab = peerTab;
window.validatePrice = validatePrice;
window.postReq = postReq;
window.renderReqs = renderReqs;
window.renderMyReqs = renderMyReqs;
window.offerHelp = offerHelp;
window.markCompleted = markCompleted;
window.delReq = delReq;
window.closeWA = closeWA;

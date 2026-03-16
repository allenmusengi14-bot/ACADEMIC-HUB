import { CU, mods } from '../app.js';
import { showToast } from '../components/toast.js';

// Render Study Hub page
export function renderStudyPage() {
  const page = document.getElementById('pg-study');
  if (!page) return;
  
  page.innerHTML = `
    <div class="page-header"><h1>🎓 Study Hub</h1><p>AI-powered resource finder for your enrolled modules</p></div>
    
    <div class="card">
      <div class="card-title">Upload Course Outline <span style="font-size:.75rem;color:var(--muted);font-weight:400;">(Optional)</span></div>
      <div class="upload-zone" onclick="document.getElementById('outF').click()" style="cursor:pointer;">
        <input type="file" id="outF" accept=".pdf,.docx,.txt" onchange="window.handleOut(event)" style="display:none;">
        <div style="font-size:2rem;margin-bottom:8px;">📄</div>
        <p style="font-size:.85rem;font-weight:600;">Click to upload your course outline</p>
        <p style="font-size:.75rem;color:var(--muted);margin-top:3px;">PDF, DOCX or TXT</p>
      </div>
      <div id="outDone" class="hidden" style="margin-top:9px;">
        <span style="background:linear-gradient(135deg,var(--green2),var(--teal2));color:var(--green);border:1px solid var(--green3);border-radius:9px;padding:6px 13px;font-size:.78rem;font-weight:700;display:inline-flex;align-items:center;gap:6px;">✓ Course outline loaded</span>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">Find Resources</div>
      <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:9px;">Select Module</label>
      <div class="mod-grid" id="sMods"></div>
      <div class="topic-row">
        <input type="text" id="topicIn" placeholder="Enter topic e.g. Carnot Cycle" onkeydown="if(event.key==='Enter') window.searchRes()">
        <button class="btn btn-purple" onclick="window.searchRes()">🔍 Search</button>
      </div>
      <div id="resArea" style="margin-top:16px;">
        <div class="empty"><div class="ei">📚</div><p>Select a module & enter a topic</p></div>
      </div>
    </div>
  `;
  
  renderSMods();
}

// Render module chips
function renderSMods() {
  const container = document.getElementById('sMods');
  if (!container) return;
  
  if (!mods.length) {
    container.innerHTML = '<p style="color:var(--muted);">No modules set up. Go to Profile to add your semester modules.</p>';
    return;
  }
  
  container.innerHTML = mods.map(m => 
    `<div class="mod-chip" onclick="window.pickMod('${m.code}')">${m.code}</div>`
  ).join('');
}

// Pick module
let selMod = null;

function pickMod(code) {
  selMod = code;
  document.querySelectorAll('.mod-chip').forEach(el => el.classList.remove('sel'));
  event.target.classList.add('sel');
}

// Handle file upload
function handleOut(e) {
  document.getElementById('outDone').classList.remove('hidden');
  showToast('Course Outline Uploaded', 'Processed.', 'success');
}

// Search resources
function searchRes() {
  const topic = document.getElementById('topicIn').value.trim();
  if (!selMod || !topic) {
    showToast('Missing Info', 'Select a module and enter a topic.', 'warning');
    return;
  }
  
  const area = document.getElementById('resArea');
  area.innerHTML = '<div class="search-loading"><div class="spinner"></div><p>Finding resources...</p></div>';
  
  // Simulate search results (in real app, this would call an API)
  setTimeout(() => {
    area.innerHTML = `
      <div class="res-grid">
        <a href="#" class="res-card" onclick="return false;">
          <div class="ri youtube">🎬</div>
          <div class="res-info">
            <h4>Khan Academy: ${topic}</h4>
            <p>Video lecture covering ${topic} in depth</p>
          </div>
          <div class="rbadge ry">YouTube</div>
        </a>
        <a href="#" class="res-card" onclick="return false;">
          <div class="ri article">📄</div>
          <div class="res-info">
            <h4>Study Notes: ${topic}</h4>
            <p>Comprehensive notes with examples</p>
          </div>
          <div class="rbadge ra">Article</div>
        </a>
        <a href="#" class="res-card" onclick="return false;">
          <div class="ri quiz">📝</div>
          <div class="res-info">
            <h4>Practice Quiz</h4>
            <p>Test your understanding of ${topic}</p>
          </div>
          <div class="rbadge rq">Quiz</div>
        </a>
      </div>`;
  }, 800);
}

// Make functions globally available
window.renderStudyPage = renderStudyPage;
window.pickMod = pickMod;
window.handleOut = handleOut;
window.searchRes = searchRes;

import { CU, CUK, mods, _points } from '../app.js';
import { FS } from '../firebase-config.js';
import { showToast, calculatePoints } from '../components/utils.js';

// Render Points page
export function renderPointsPage() {
  const page = document.getElementById('pg-points');
  if (!page) return;
  
  page.innerHTML = `
    <div style="background:linear-gradient(135deg,#78350f,#b45309,#f59e0b);border-radius:22px;padding:28px 30px;margin-bottom:22px;position:relative;overflow:hidden;">
      <div style="position:absolute;right:-10px;top:-10px;font-size:7rem;opacity:.1;">⭐</div>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="font-family:'Fraunces',serif;font-size:1.7rem;color:#fff;margin-bottom:5px;">⭐ Earn Points</h2>
          <p style="color:rgba(255,255,255,.75);font-size:.88rem;">Upload your test script to earn points. Leaderboard is faculty-specific & resets monthly.</p>
        </div>
        <div id="myPointsBadge" style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:16px;padding:12px 20px;text-align:center;backdrop-filter:blur(8px);">
          <div style="font-family:'Fraunces',serif;font-size:2rem;color:#fff;font-weight:900;" id="myPtsTotal">0</div>
          <div style="color:rgba(255,255,255,.7);font-size:.75rem;font-weight:600;">MY POINTS</div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="card-title">📊 How Points Work</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-top:4px;">
        <div style="background:#fef9ee;border:1px solid #fde68a;border-radius:12px;padding:12px;text-align:center;">
          <div style="font-size:1.3rem;">📗</div>
          <div style="font-weight:800;font-size:.9rem;color:#92400e;">40–49%</div>
          <div style="font-size:.75rem;color:var(--muted);">5 pts</div>
        </div>
        <div style="background:#fef9ee;border:1px solid #fde68a;border-radius:12px;padding:12px;text-align:center;">
          <div style="font-size:1.3rem;">📘</div>
          <div style="font-weight:800;font-size:.9rem;color:#92400e;">50–59%</div>
          <div style="font-size:.75rem;color:var(--muted);">10 pts</div>
        </div>
        <div style="background:#fef9ee;border:1px solid #fde68a;border-radius:12px;padding:12px;text-align:center;">
          <div style="font-size:1.3rem;">📙</div>
          <div style="font-weight:800;font-size:.9rem;color:#92400e;">60–69%</div>
          <div style="font-size:.75rem;color:var(--muted);">15 pts</div>
        </div>
        <div style="background:#fef9ee;border:1px solid #fde68a;border-radius:12px;padding:12px;text-align:center;">
          <div style="font-size:1.3rem;">🌟</div>
          <div style="font-weight:800;font-size:.9rem;color:#92400e;">70–79%</div>
          <div style="font-size:.75rem;color:var(--muted);">20 pts</div>
        </div>
        <div style="background:#fef9ee;border:1px solid #fde68a;border-radius:12px;padding:12px;text-align:center;">
          <div style="font-size:1.3rem;">🔥</div>
          <div style="font-weight:800;font-size:.9rem;color:#92400e;">80–89%</div>
          <div style="font-size:.75rem;color:var(--muted);">25 pts</div>
        </div>
        <div style="background:#fef9ee;border:1px solid #fde68a;border-radius:12px;padding:12px;text-align:center;">
          <div style="font-size:1.3rem;">🏆</div>
          <div style="font-weight:800;font-size:.9rem;color:#92400e;">90–100%</div>
          <div style="font-size:.75rem;color:var(--muted);">30 pts</div>
        </div>
      </div>
      <p style="font-size:.77rem;color:var(--muted);margin-top:12px;">⚡ <strong>Most Improved:</strong> +5 bonus points if your mark improves by 10%+.</p>
    </div>

    <div class="seg-tabs">
      <button class="seg-tab on" onclick="window.pointsTab('leaderboard')" id="ptb-leaderboard">🏅 Faculty Leaderboard</button>
      <button class="seg-tab" onclick="window.pointsTab('submit')" id="ptb-submit">📤 Submit Score</button>
      <button class="seg-tab" onclick="window.pointsTab('mine')" id="ptb-mine">📋 My Submissions</button>
    </div>

    <div id="pts-leaderboard-panel">
      <div class="card" style="padding:13px 17px;margin-bottom:14px;">
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <select id="ptsFacFilter" class="req-fi" style="flex:1;min-width:180px;" onchange="window.renderPointsLeaderboard()">
            <option value="">— All Faculties —</option>
            <option>Engineering & Technology</option>
            <option>Science</option>
            <option>Business</option>
            <option>Social Sciences</option>
            <option>Humanities</option>
            <option>Education</option>
            <option>Law</option>
            <option>Medicine</option>
          </select>
          <div style="font-size:.78rem;color:var(--muted);">Resets: <strong id="ptsResetDate"></strong></div>
        </div>
      </div>
      <div id="ptsLeaderboardList"></div>
    </div>

    <div id="pts-submit-panel" class="hidden">
      <div class="card">
        <div class="card-title">📤 Submit Your Test Score</div>
        <p style="font-size:.82rem;color:var(--muted);margin-bottom:16px;">Your script must clearly show your <strong>Student ID</strong> and the mark.</p>
        <div style="display:grid;gap:13px;">
          <div class="row2" style="display:grid;grid-template-columns:1fr 1fr;gap:13px;">
            <div>
              <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:6px;">Module</label>
              <select id="ptsModule" class="req-fi"><option value="">— Select module —</option></select>
            </div>
            <div>
              <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:6px;">Test Name</label>
              <input id="ptsTestName" class="req-fi" placeholder="e.g. Test 1">
            </div>
          </div>
          <div>
            <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:6px;">Your Mark (%)</label>
            <input id="ptsMark" type="number" min="0" max="100" class="req-fi" placeholder="e.g. 72" oninput="window.previewPoints()">
            <div id="ptsPreview" style="margin-top:8px;font-size:.85rem;font-weight:700;min-height:20px;"></div>
          </div>
          <div>
            <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:6px;">📎 Upload Test Script</label>
            <div class="upload-zone" onclick="document.getElementById('ptsScript').click()" style="cursor:pointer;">
              <input type="file" id="ptsScript" accept="image/*,.pdf" onchange="window.handlePtsScript(event)" style="display:none;">
              <div style="font-size:2rem;margin-bottom:6px;">📄</div>
              <p style="font-size:.84rem;font-weight:600;">Click to upload</p>
            </div>
            <div id="ptsScriptDone" class="hidden" style="margin-top:8px;">
              <span style="background:var(--green2);color:var(--green);border:1px solid var(--green3);border-radius:8px;padding:5px 12px;font-size:.78rem;font-weight:700;display:inline-flex;align-items:center;gap:6px;">✓ Script uploaded</span>
            </div>
          </div>
          <button class="btn btn-gold" style="width:fit-content;" onclick="window.submitPoints()">⭐ Submit & Earn Points</button>
        </div>
      </div>
    </div>

    <div id="pts-mine-panel" class="hidden">
      <div id="ptsMyList"></div>
    </div>
  `;
  
  // Populate module dropdown
  populatePointsModules();
  
  // Render leaderboard
  renderPointsLeaderboard();
  renderMyPoints();
  updateMyPointsBadge();
}

// Populate module dropdown
function populatePointsModules() {
  const ptsModule = document.getElementById('ptsModule');
  if (!ptsModule) return;
  
  const opts = mods.length
    ? mods.map(m => `<option value="${m.code} – ${m.name}">${m.code} – ${m.name}</option>`).join('')
    : '<option value="">No modules — set up in Profile</option>';
  
  ptsModule.innerHTML = '<option value="">— Select module —</option>' + opts;
}

// Tab switching
function pointsTab(t) {
  document.getElementById('ptb-leaderboard').classList.toggle('on', t === 'leaderboard');
  document.getElementById('ptb-submit').classList.toggle('on', t === 'submit');
  document.getElementById('ptb-mine').classList.toggle('on', t === 'mine');
  
  document.getElementById('pts-leaderboard-panel').classList.toggle('hidden', t !== 'leaderboard');
  document.getElementById('pts-submit-panel').classList.toggle('hidden', t !== 'submit');
  document.getElementById('pts-mine-panel').classList.toggle('hidden', t !== 'mine');
  
  if (t === 'leaderboard') renderPointsLeaderboard();
  if (t === 'mine') renderMyPoints();
}

// Preview points
function previewPoints() {
  const mark = parseInt(document.getElementById('ptsMark').value);
  if (!mark) {
    document.getElementById('ptsPreview').innerHTML = '';
    return;
  }
  
  const points = calculatePoints(mark);
  document.getElementById('ptsPreview').innerHTML = `⭐ You will earn <strong style="color:var(--green);">${points} points</strong> for this submission.`;
}

// Handle script upload
function handlePtsScript(e) {
  const file = e.target.files[0];
  if (file) {
    document.getElementById('ptsScriptDone').classList.remove('hidden');
    showToast('File uploaded', 'Your test script has been uploaded.', 'success');
  }
}

// Submit points
async function submitPoints() {
  const module = document.getElementById('ptsModule').value;
  const testName = document.getElementById('ptsTestName').value.trim();
  const mark = parseInt(document.getElementById('ptsMark').value);
  
  if (!module) { alert('Select a module.'); return; }
  if (!testName) { alert('Enter test name.'); return; }
  if (!mark || mark < 0 || mark > 100) { alert('Enter a valid mark (0-100).'); return; }
  
  const points = calculatePoints(mark);
  if (points === 0) {
    alert('Marks below 40% do not earn points.');
    return;
  }
  
  const month = new Date().toISOString().slice(0, 7);
  
  await FS.addPoint({
    by: CUK,
    byName: CU.name,
    faculty: CU.faculty,
    module,
    testName,
    mark,
    points,
    month,
    date: new Date().toISOString()
  });
  
  // Clear form
  document.getElementById('ptsModule').value = '';
  document.getElementById('ptsTestName').value = '';
  document.getElementById('ptsMark').value = '';
  document.getElementById('ptsScriptDone').classList.add('hidden');
  document.getElementById('ptsPreview').innerHTML = '';
  
  showToast('Points Earned!', `You earned ${points} points for this submission.`, 'success');
  pointsTab('leaderboard');
}

// Render leaderboard
function renderPointsLeaderboard() {
  const facFilter = document.getElementById('ptsFacFilter')?.value || '';
  const month = new Date().toISOString().slice(0, 7);
  
  let filtered = _points.filter(p => p.month === month);
  if (facFilter) filtered = filtered.filter(p => p.faculty === facFilter);
  
  const userPoints = {};
  filtered.forEach(p => {
    if (!userPoints[p.by]) {
      userPoints[p.by] = {
        name: p.byName,
        points: 0,
        faculty: p.faculty
      };
    }
    userPoints[p.by].points += p.points;
  });
  
  const sorted = Object.entries(userPoints)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.points - a.points);
  
  const container = document.getElementById('ptsLeaderboardList');
  if (!container) return;
  
  if (!sorted.length) {
    container.innerHTML = '<div class="empty"><div class="ei">🏅</div><p>No submissions yet this month.</p></div>';
    return;
  }
  
  container.innerHTML = sorted.map((u, i) => {
    const medalColor = i === 0 ? 'var(--gold)' : i === 1 ? 'var(--muted)' : i === 2 ? 'var(--orange)' : 'var(--muted)';
    
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:12px;border-bottom:1px solid var(--border);">
        <div style="width:24px;font-weight:700;color:${medalColor};">#${i + 1}</div>
        <div style="flex:1;font-weight:600;">${u.name}</div>
        <div style="font-weight:700;color:var(--purple);">${u.points} pts</div>
      </div>
    `;
  }).join('');
  
  document.getElementById('ptsResetDate').textContent = 'End of month';
}

// Render my points
function renderMyPoints() {
  const myPoints = _points.filter(p => p.by === CUK);
  const container = document.getElementById('ptsMyList');
  if (!container) return;
  
  if (!myPoints.length) {
    container.innerHTML = '<div class="empty"><div class="ei">📋</div><p>No submissions yet.</p></div>';
    return;
  }
  
  container.innerHTML = myPoints.map(p => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;border-bottom:1px solid var(--border);">
      <div><strong>${p.module}</strong> - ${p.testName}</div>
      <div style="display:flex;gap:10px;">
        <span>${p.mark}%</span>
        <span style="font-weight:700;color:var(--green);">+${p.points} pts</span>
      </div>
    </div>
  `).join('');
}

// Update my points badge
function updateMyPointsBadge() {
  const month = new Date().toISOString().slice(0, 7);
  const total = _points.filter(p => p.by === CUK && p.month === month).reduce((s, p) => s + p.points, 0);
  
  const badge = document.getElementById('myPtsTotal');
  if (badge) badge.textContent = total;
}

// Make functions globally available
window.renderPointsPage = renderPointsPage;
window.pointsTab = pointsTab;
window.previewPoints = previewPoints;
window.handlePtsScript = handlePtsScript;
window.submitPoints = submitPoints;
window.renderPointsLeaderboard = renderPointsLeaderboard;
window.renderMyPoints = renderMyPoints;
window.updateMyPointsBadge = updateMyPointsBadge;

import { CU, CUK, mods } from '../app.js';
import { showToast, saveToLocal, loadFromLocal, calculateGrade, calculateClass } from '../components/utils.js';

// Render GPA page
export function renderGPAPage() {
  const page = document.getElementById('pg-gpa');
  if (!page) return;
  
  page.innerHTML = `
    <div class="page-header"><h1>📊 GPA Tracker</h1><p>Track your grades and forecast your CGPA</p></div>
    
    <div class="card" style="border-top:4px solid var(--gold)">
      <div class="card-title">Previous Academic History</div>
      <p style="font-size:.8rem;color:var(--muted);margin-bottom:13px;">Enter your cumulative GPA and total credits from ASAS</p>
      <div class="setup-row">
        <div class="ig"><label>Total Grade Points</label><input type="number" id="gPts" placeholder="e.g. 450.5" oninput="window.calcGPA()"></div>
        <div class="ig"><label>Total Credits</label><input type="number" id="gCr" placeholder="e.g. 115" oninput="window.calcGPA()"></div>
      </div>
      <div style="margin-top:10px;">
        <div class="badge badge-info">Current CGPA: <span id="displayCGPA">0.00</span></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Current Term</div>
      <p style="font-size:.8rem;color:var(--muted);margin-bottom:13px;">Enter your module marks to calculate term GPA</p>
      <div style="display:flex;gap:10px;margin-bottom:13px;flex-wrap:wrap;">
        <button class="btn btn-red btn-sm" onclick="window.clearGPA()">Clear Marks</button>
        <button class="btn btn-blue btn-sm" onclick="window.saveGPAData()">💾 Save Current</button>
        <button class="btn btn-green btn-sm" onclick="window.loadGPAData()">📂 Load Saved</button>
      </div>
      <div style="overflow-x:auto;">
        <table><thead><tr><th>Module</th><th>Credits</th><th>Mark%</th><th>Grade</th><th>MGP</th></tr></thead>
          <tbody id="gBody"></tbody>
        </table>
      </div>
      <div id="gpaNoMods" class="hidden" style="text-align:center;padding:24px;color:var(--muted);">
        <div style="font-size:2rem;margin-bottom:8px;">📚</div>
        <p style="font-size:.85rem;">No modules set up yet.</p>
        <button class="btn btn-blue btn-sm" style="margin-top:10px;" onclick="window.go('profile')">Go to Profile → Set Up Modules</button>
      </div>
      <div class="dashboard">
        <div class="stat-card" style="background:linear-gradient(135deg,#1e3a8a,#2563eb)">
          <h3>Term GPA</h3><div class="stat-val" id="tGPA">0.000</div>
        </div>
        <div class="stat-card" style="background:linear-gradient(135deg,#7c3aed,#ec4899)">
          <h3>Projected CGPA</h3><div class="stat-val" id="cGPA">0.000</div>
          <div class="stat-class" id="cClass">Pending</div>
        </div>
      </div>
    </div>

    <div class="card" style="border-top:4px solid var(--purple)">
      <div class="card-title">Exam Mark Forecaster</div>
      <p style="font-size:.8rem;color:var(--muted);margin-bottom:13px;">Calculate what you need on your final exam</p>
      <div style="overflow-x:auto;">
        <table><thead><tr><th>Module</th><th>CA Wt%</th><th>Exam Wt%</th><th>CA%</th><th>Target%</th><th>Needed</th></tr></thead>
          <tbody id="fBody"></tbody>
        </table>
      </div>
      <div id="foreNoMods" class="hidden" style="text-align:center;padding:24px;color:var(--muted);">
        <div style="font-size:2rem;margin-bottom:8px;">📊</div>
        <p style="font-size:.85rem;">No modules set up yet.</p>
        <button class="btn btn-purple btn-sm" style="margin-top:10px;" onclick="window.go('profile')">Go to Profile → Set Up Modules</button>
      </div>
    </div>
  `;
  
  populateGPARows();
  populateForeRows();
  
  // Load saved data if exists
  const savedData = loadFromLocal('gpaData', {});
  if (savedData.gPts) document.getElementById('gPts').value = savedData.gPts;
  if (savedData.gCr) document.getElementById('gCr').value = savedData.gCr;
  
  setTimeout(() => calcGPA(), 100);
}

// Populate GPA table rows
function populateGPARows() {
  const tbody = document.getElementById('gBody');
  if (!mods.length) {
    document.getElementById('gpaNoMods').classList.remove('hidden');
    if (tbody) tbody.innerHTML = '';
    return;
  }
  
  document.getElementById('gpaNoMods').classList.add('hidden');
  
  tbody.innerHTML = mods.map((m, i) => `
    <tr>
      <td>${m.code} – ${m.name}</td>
      <td><input type="number" id="gCred${i}" value="${m.credits || 3}" min="0" step="0.5" style="width:70px;" oninput="window.calcGPA()"></td>
      <td><input type="number" id="gMark${i}" value="" min="0" max="100" step="0.1" style="width:70px;" oninput="window.calcGPA()"></td>
      <td id="gGrade${i}">—</td>
      <td id="gMGP${i}">—</td>
    </tr>
  `).join('');
}

// Populate forecast table rows
function populateForeRows() {
  const tbody = document.getElementById('fBody');
  if (!mods.length) {
    document.getElementById('foreNoMods').classList.remove('hidden');
    if (tbody) tbody.innerHTML = '';
    return;
  }
  
  document.getElementById('foreNoMods').classList.add('hidden');
  
  tbody.innerHTML = mods.map((m, i) => `
    <tr>
      <td>${m.code}</td>
      <td><input type="number" id="caWt${i}" value="50" min="0" max="100" style="width:60px;" oninput="window.calcForecast()"></td>
      <td><input type="number" id="exWt${i}" value="50" min="0" max="100" style="width:60px;" oninput="window.calcForecast()"></td>
      <td><input type="number" id="caMark${i}" value="" min="0" max="100" style="width:60px;" oninput="window.calcForecast()"></td>
      <td><input type="number" id="target${i}" value="50" min="0" max="100" style="width:60px;" oninput="window.calcForecast()"></td>
      <td id="need${i}">—</td>
    </tr>
  `).join('');
}

// Calculate GPA
function calcGPA() {
  const gPts = parseFloat(document.getElementById('gPts')?.value) || 0;
  const gCr = parseFloat(document.getElementById('gCr')?.value) || 0;
  
  let totalGP = 0, totalCred = 0;
  
  for (let i = 0; i < mods.length; i++) {
    const cred = parseFloat(document.getElementById('gCred' + i)?.value) || 0;
    const mark = parseFloat(document.getElementById('gMark' + i)?.value);
    let gp = 0, grade = 'F';
    
    if (!isNaN(mark)) {
      const result = calculateGrade(mark);
      gp = result.gp;
      grade = result.grade;
      totalGP += gp * cred;
      totalCred += cred;
    }
    
    const gradeEl = document.getElementById('gGrade' + i);
    const mgpEl = document.getElementById('gMGP' + i);
    if (gradeEl) gradeEl.textContent = grade;
    if (mgpEl) mgpEl.textContent = gp.toFixed(1);
  }
  
  const termGPA = totalCred > 0 ? totalGP / totalCred : 0;
  document.getElementById('tGPA').textContent = termGPA.toFixed(3);
  
  const newCGPA = gCr > 0 ? (gPts + totalGP) / (gCr + totalCred) : termGPA;
  document.getElementById('cGPA').textContent = newCGPA.toFixed(3);
  document.getElementById('displayCGPA').textContent = newCGPA.toFixed(3);
  document.getElementById('cClass').textContent = calculateClass(newCGPA);
}

// Calculate forecast
function calcForecast() {
  for (let i = 0; i < mods.length; i++) {
    const caWt = parseFloat(document.getElementById('caWt' + i)?.value) || 0;
    const exWt = parseFloat(document.getElementById('exWt' + i)?.value) || 0;
    const caMark = parseFloat(document.getElementById('caMark' + i)?.value);
    const target = parseFloat(document.getElementById('target' + i)?.value) || 0;
    
    let need = '—';
    if (!isNaN(caMark) && caWt + exWt === 100 && exWt > 0) {
      const caContrib = caMark * (caWt / 100);
      const neededMark = (target - caContrib) / (exWt / 100);
      if (neededMark > 100) need = 'Impossible';
      else if (neededMark < 0) need = 'Already achieved';
      else need = neededMark.toFixed(1) + '%';
    }
    
    const needEl = document.getElementById('need' + i);
    if (needEl) needEl.textContent = need;
  }
}

// Clear GPA marks
function clearGPA() {
  for (let i = 0; i < mods.length; i++) {
    const markEl = document.getElementById('gMark' + i);
    if (markEl) markEl.value = '';
  }
  calcGPA();
}

// Save GPA data
function saveGPAData() {
  const data = {};
  for (let i = 0; i < mods.length; i++) {
    const cred = document.getElementById('gCred' + i)?.value;
    const mark = document.getElementById('gMark' + i)?.value;
    if (cred) data[`cred_${i}`] = cred;
    if (mark) data[`mark_${i}`] = mark;
  }
  data.gPts = document.getElementById('gPts').value;
  data.gCr = document.getElementById('gCr').value;
  
  saveToLocal('gpaData', data);
  showToast('GPA Data Saved', 'Your current marks have been saved locally.', 'success');
}

// Load GPA data
function loadGPAData() {
  const data = loadFromLocal('gpaData', {});
  
  for (let i = 0; i < mods.length; i++) {
    if (data[`cred_${i}`]) {
      const credEl = document.getElementById('gCred' + i);
      if (credEl) credEl.value = data[`cred_${i}`];
    }
    if (data[`mark_${i}`]) {
      const markEl = document.getElementById('gMark' + i);
      if (markEl) markEl.value = data[`mark_${i}`];
    }
  }
  
  if (data.gPts) document.getElementById('gPts').value = data.gPts;
  if (data.gCr) document.getElementById('gCr').value = data.gCr;
  
  calcGPA();
  showToast('GPA Data Loaded', 'Your saved marks have been loaded.', 'success');
}

// Make functions globally available
window.renderGPAPage = renderGPAPage;
window.calcGPA = calcGPA;
window.calcForecast = calcForecast;
window.clearGPA = clearGPA;
window.saveGPAData = saveGPAData;
window.loadGPAData = loadGPAData;
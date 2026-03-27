import { CU, CUK, mods } from './app.js.js';
import { FS } from './firebase-config.js.js';
import { showToast, saveToLocal, loadFromLocal } from './utils.js.js';

// Render Profile page
export function renderProfilePage() {
  const page = document.getElementById('pg-profile');
  if (!page) return;
  
  page.innerHTML = `
    <div class="profile-hero">
      <div class="profile-av-big" id="profAv">${CU?.name?.[0] || 'A'}</div>
      <div class="profile-info">
        <h2 id="profName">${CU?.name || '—'}</h2>
        <p id="profMeta">${CU?.year || 'Student'} · ${CU?.faculty || 'University of Botswana'}</p>
        <span class="sb-role student" id="profRole" style="margin-top:7px;display:inline-block;">${CU?.isTutor ? 'Tutor' : 'Student'}</span>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">Account Details</div>
      <div>
        <div class="pd-row"><span>Full Name</span><strong id="pdName">${CU?.name || '—'}</strong></div>
        <div class="pd-row"><span>Student ID</span><strong id="pdUser">${CU?.studentId || '—'}</strong></div>
        <div class="pd-row"><span>WhatsApp</span><strong id="pdWA">${CU?.wa || '—'}</strong></div>
        <div class="pd-row"><span>Email</span><strong id="pdEmail">${CU?.email || '—'}</strong></div>
        <div class="pd-row"><span>Year of Study</span><strong id="pdYear">${CU?.year || '—'}</strong></div>
        <div class="pd-row"><span>Faculty</span><strong id="pdFaculty">${CU?.faculty || '—'}</strong></div>
        <div class="pd-row"><span>Programme</span><strong id="pdProgramme">${CU?.programme || '—'}</strong></div>
      </div>
    </div>
    
    <div class="card" style="border-top:4px solid var(--blue2)">
      <div class="card-title">📚 Programme & Semester Modules</div>
      <p style="font-size:.82rem;color:var(--muted);margin-bottom:16px;">This info is used across GPA Tracker, Study Hub, Get Help and Study Squad.</p>
      
      <div class="ff">
        <label>Programme / Degree</label>
        <input id="profProgramme" class="req-fi" placeholder="e.g. BSc Mechanical Engineering" value="${CU?.programme || ''}">
      </div>
      
      <div class="ff">
        <label>Current Semester</label>
        <select id="profSemester" class="req-fi">
          <option ${CU?.semester === 'Semester 1' ? 'selected' : ''}>Semester 1</option>
          <option ${CU?.semester === 'Semester 2' ? 'selected' : ''}>Semester 2</option>
        </select>
      </div>
      
      <div style="margin-bottom:10px;">
        <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;display:block;margin-bottom:9px;">Semester Modules</label>
        <div id="modList" style="display:grid;gap:8px;margin-bottom:11px;"></div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;">
          <div>
            <label style="font-size:.72rem;color:var(--muted);font-weight:600;display:block;margin-bottom:4px;">Module Code</label>
            <input id="newModCode" class="req-fi" placeholder="e.g. MEC 301" style="font-size:.85rem;padding:9px 12px;">
          </div>
          <div>
            <label style="font-size:.72rem;color:var(--muted);font-weight:600;display:block;margin-bottom:4px;">Module Name</label>
            <input id="newModName" class="req-fi" placeholder="e.g. Thermodynamics II" style="font-size:.85rem;padding:9px 12px;" onkeydown="if(event.key==='Enter') window.addProfileMod()">
          </div>
          <button class="btn btn-green btn-sm" onclick="window.addProfileMod()" style="height:40px;">+ Add</button>
        </div>
      </div>
      
      <button class="btn btn-blue" onclick="window.saveProfile()">💾 Save Profile</button>
    </div>
    
    <div class="card hidden" id="tutorProfileCard">
      <div class="card-title">Tutor Profile</div>
      <div id="tutorProfileInfo"></div>
    </div>
  `;
  
  renderModList();
  
  // Show tutor card if user is a tutor
  if (CU?.isTutor) {
    document.getElementById('tutorProfileCard').classList.remove('hidden');
    document.getElementById('tutorProfileInfo').innerHTML = `
      <div class="pd-row"><span>Bio</span><strong>${CU.tutorBio || '—'}</strong></div>
      <div class="pd-row"><span>Subjects</span><strong>${(CU.tutorSubjects || []).join(', ') || '—'}</strong></div>
    `;
  }
}

// Render module list
function renderModList() {
  const container = document.getElementById('modList');
  if (!container) return;
  
  if (!mods.length) {
    container.innerHTML = '<p style="color:var(--muted);font-size:.8rem;">No modules added yet.</p>';
    return;
  }
  
  container.innerHTML = mods.map((m, i) => `
    <div style="display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:6px 10px;">
      <span style="font-weight:700;font-size:.85rem;flex:1;">
        <span style="color:var(--blue);">${m.code}</span> – ${m.name}
      </span>
      <span class="rmv" onclick="window.removeProfileMod(${i})" style="cursor:pointer;color:var(--red);font-size:1.1rem;padding:0 4px;">✕</span>
    </div>
  `).join('');
}

// Add profile module
function addProfileMod() {
  const code = document.getElementById('newModCode').value.trim();
  const name = document.getElementById('newModName').value.trim();
  
  if (!code || !name) {
    alert('Enter both module code and name.');
    return;
  }
  
  mods.push({ code, name, credits: 3 });
  renderModList();
  
  document.getElementById('newModCode').value = '';
  document.getElementById('newModName').value = '';
}

// Remove profile module
function removeProfileMod(index) {
  mods.splice(index, 1);
  renderModList();
}

// Save profile
async function saveProfile() {
  const programme = document.getElementById('profProgramme').value.trim();
  const semester = document.getElementById('profSemester').value;
  
  await FS.setUser(CUK, { programme, semester, modules: mods });
  if(CU) CU.modules = mods;
  
  showToast('Profile Saved', 'Your profile has been updated!', 'success');
  
  // Refresh global modules
  if (window.populateModDropdowns) window.populateModDropdowns();
}

function populateModDropdowns() {
  const opts = mods.length
    ? mods.map(m => `<option value="${m.code} – ${m.name}">${m.code} – ${m.name}</option>`).join('')
    : '<option value="">No modules — set up in Profile</option>';
  ['pMod', 'groupModule', 'ptsModule', 'sessionModSelect', 'pomodoroModule', 'stopwatchModule', 'sessionModule'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = '<option value="">— Select module —</option>' + opts; }
  });
}

function populateGPARows() {
  const tbody = document.getElementById('gBody');
  if (!mods.length) {
    const noModsEl = document.getElementById('gpaNoMods');
    if (noModsEl) noModsEl.classList.remove('hidden');
    if (tbody) tbody.innerHTML = '';
    return;
  }
  const noModsEl = document.getElementById('gpaNoMods');
  if (noModsEl) noModsEl.classList.add('hidden');
  if (!tbody) return;
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

function calcGPA() {
  const gPts = parseFloat(document.getElementById('gPts')?.value) || 0;
  const gCr = parseFloat(document.getElementById('gCr')?.value) || 0;
  let totalGP = 0, totalCred = 0;
  for (let i = 0; i < mods.length; i++) {
    const cred = parseFloat(document.getElementById('gCred' + i)?.value) || 0;
    const mark = parseFloat(document.getElementById('gMark' + i)?.value);
    let gp = 0, grade = 'F';
    if (!isNaN(mark)) {
      if (mark >= 70) { gp = 4.0; grade = 'A'; }
      else if (mark >= 65) { gp = 3.5; grade = 'B+'; }
      else if (mark >= 60) { gp = 3.0; grade = 'B'; }
      else if (mark >= 55) { gp = 2.5; grade = 'C+'; }
      else if (mark >= 50) { gp = 2.0; grade = 'C'; }
      else if (mark >= 45) { gp = 1.5; grade = 'D+'; }
      else if (mark >= 40) { gp = 1.0; grade = 'D'; }
      totalGP += gp * cred;
      totalCred += cred;
    }
    const gradeEl = document.getElementById('gGrade' + i);
    const mgpEl = document.getElementById('gMGP' + i);
    if (gradeEl) gradeEl.textContent = grade;
    if (mgpEl) mgpEl.textContent = gp.toFixed(1);
  }
  const termGPA = totalCred > 0 ? totalGP / totalCred : 0;
  const tGPEl = document.getElementById('tGPA');
  const cGPEl = document.getElementById('cGPA');
  const cClassEl = document.getElementById('cClass');
  if (tGPEl) tGPEl.textContent = termGPA.toFixed(3);
  const newCGPA = gCr > 0 ? (gPts + totalGP) / (gCr + totalCred) : termGPA;
  if (cGPEl) cGPEl.textContent = newCGPA.toFixed(3);
  let cls = 'Pending';
  if (newCGPA >= 3.6) cls = 'First Class Honours';
  else if (newCGPA >= 3.0) cls = 'Upper Second Class';
  else if (newCGPA >= 2.0) cls = 'Lower Second Class';
  else if (newCGPA >= 1.0) cls = 'Pass';
  else cls = 'Fail';
  if (cClassEl) cClassEl.textContent = cls;
}

function clearGPA() {
  for (let i = 0; i < mods.length; i++) {
    const markEl = document.getElementById('gMark' + i);
    if (markEl) markEl.value = '';
  }
  calcGPA();
}

function saveGPAData() {
  const data = {};
  for (let i = 0; i < mods.length; i++) {
    const cred = document.getElementById('gCred' + i)?.value;
    const mark = document.getElementById('gMark' + i)?.value;
    if (cred) data[`cred_${i}`] = cred;
    if (mark) data[`mark_${i}`] = mark;
  }
  data.gPts = document.getElementById('gPts')?.value;
  data.gCr = document.getElementById('gCr')?.value;
  saveToLocal('gpaData', data);
  showToast('GPA Data Saved', 'Your current marks have been saved locally.', 'success');
}

function loadGPAData() {
  const data = loadFromLocal('gpaData', {});
  for (let i = 0; i < mods.length; i++) {
    if (data[`cred_${i}`]) { const el = document.getElementById('gCred' + i); if(el) el.value = data[`cred_${i}`]; }
    if (data[`mark_${i}`]) { const el = document.getElementById('gMark' + i); if(el) el.value = data[`mark_${i}`]; }
  }
  if (data.gPts) { const el = document.getElementById('gPts'); if(el) el.value = data.gPts; }
  if (data.gCr) { const el = document.getElementById('gCr'); if(el) el.value = data.gCr; }
  calcGPA();
  showToast('GPA Data Loaded', 'Your saved marks have been loaded.', 'success');
}

function populateForeRows() {
  const tbody = document.getElementById('fBody');
  if (!mods.length) {
    const noModsEl = document.getElementById('foreNoMods');
    if (noModsEl) noModsEl.classList.remove('hidden');
    if (tbody) tbody.innerHTML = '';
    return;
  }
  const noModsEl = document.getElementById('foreNoMods');
  if (noModsEl) noModsEl.classList.add('hidden');
  if (!tbody) return;
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

// Make functions globally available
window.renderProfilePage = renderProfilePage;
window.addProfileMod = addProfileMod;
window.removeProfileMod = removeProfileMod;
window.saveProfile = saveProfile;
window.populateModDropdowns = populateModDropdowns;
window.populateGPARows = populateGPARows;
window.calcGPA = calcGPA;
window.clearGPA = clearGPA;
window.saveGPAData = saveGPAData;
window.loadGPAData = loadGPAData;
window.populateForeRows = populateForeRows;
window.calcForecast = calcForecast;

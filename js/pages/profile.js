import { CU, CUK, mods } from '../app.js';
import { FS } from '../firebase-config.js';
import { showToast } from '../components/toast.js';

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
  
  showToast('Profile Saved', 'Your profile has been updated!', 'success');
  
  // Refresh global modules
  CU.modules = mods;
  
  // Update other pages
  if (window.populateModDropdowns) window.populateModDropdowns();
}

// Make functions globally available
window.renderProfilePage = renderProfilePage;
window.addProfileMod = addProfileMod;
window.removeProfileMod = removeProfileMod;
window.saveProfile = saveProfile;

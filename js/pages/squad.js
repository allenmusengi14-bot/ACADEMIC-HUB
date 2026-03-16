import { CU, CUK, mods, _groups, _studySessionsPosts } from '../app.js';
import { FS } from '../firebase-config.js';
import { showToast } from '../components/toast.js';

// State
let currentSquadTab = 'sessions';
let squadSearch = '';
let squadFacultyFilter = '';

// Render Squad page
export function renderSquadPage() {
  const page = document.getElementById('pg-squad');
  if (!page) return;
  
  page.innerHTML = `
    <div style="background:linear-gradient(135deg,#0f172a,#1e1b4b,#2d1b69);border-radius:22px;padding:28px 30px;margin-bottom:22px;position:relative;overflow:hidden;">
      <div style="position:absolute;right:-20px;top:-20px;font-size:6rem;opacity:.08;">👥</div>
      <h2 style="font-family:'Fraunces',serif;font-size:1.7rem;color:#fff;margin-bottom:5px;">📅 Study Squad</h2>
      <p style="color:rgba(255,255,255,.7);font-size:.9rem;">Join study groups and sessions. Create permanent groups for ongoing collaboration.</p>
    </div>

    <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
      <button class="btn btn-blue" onclick="document.getElementById('createSessionMod').classList.add('on')">📅 Create Study Session</button>
      <button class="btn btn-purple" onclick="document.getElementById('createGroupMod').classList.add('on')">👥 Create Permanent Group</button>
    </div>

    <div class="sessions-header">
      <div class="sessions-tabs">
        <button class="session-tab active" onclick="window.squadTab('sessions', this)">📅 Study Sessions</button>
        <button class="session-tab" onclick="window.squadTab('groups', this)">👥 Permanent Groups</button>
      </div>
      <div class="faculty-filter-badge" id="squadFilterBadge">📍 Showing: All <button onclick="window.clearSquadFilter()" style="background:none;border:none;color:var(--orange);font-weight:700;margin-left:5px;">✕</button></div>
    </div>

    <div class="session-search">
      <input type="text" id="squadSearch" placeholder="Search by module, topic or group name..." oninput="window.filterSquad()">
      <select id="squadFacultyFilter" class="req-fi" style="width:auto;min-width:150px;" onchange="window.filterSquad()">
        <option value="">All Faculties</option>
        <option value="Engineering & Technology">Engineering</option>
        <option value="Science">Science</option>
        <option value="Business">Business</option>
        <option value="Social Sciences">Social Sciences</option>
        <option value="Humanities">Humanities</option>
        <option value="Education">Education</option>
        <option value="Law">Law</option>
        <option value="Medicine">Medicine</option>
      </select>
    </div>

    <div id="sessionsContainer"></div>
    <div id="groupsContainer" class="hidden"></div>
  `;
  
  // Populate module dropdowns
  populateSquadModules();
  
  // Render content
  filterSquad();
}

// Populate module dropdowns
function populateSquadModules() {
  const sessionMod = document.getElementById('sessionModSelect');
  const groupModule = document.getElementById('groupModule');
  
  const opts = mods.length
    ? mods.map(m => `<option value="${m.code} – ${m.name}">${m.code} – ${m.name}</option>`).join('')
    : '<option value="">No modules — set up in Profile</option>';
  
  if (sessionMod) sessionMod.innerHTML = '<option value="">— Select module —</option>' + opts;
  if (groupModule) groupModule.innerHTML = '<option value="">— Select module —</option>' + opts;
}

// Tab switching
function squadTab(t, el) {
  currentSquadTab = t;
  
  document.querySelectorAll('.session-tab').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
  
  document.getElementById('sessionsContainer').classList.toggle('hidden', t !== 'sessions');
  document.getElementById('groupsContainer').classList.toggle('hidden', t !== 'groups');
  
  filterSquad();
}

// Filter squad content
function filterSquad() {
  squadSearch = document.getElementById('squadSearch')?.value.toLowerCase() || '';
  squadFacultyFilter = document.getElementById('squadFacultyFilter')?.value || '';
  
  const badge = document.getElementById('squadFilterBadge');
  if (badge) {
    if (squadFacultyFilter) {
      badge.innerHTML = `📍 Showing: ${squadFacultyFilter} <button onclick="window.clearSquadFilter()" style="background:none;border:none;color:var(--orange);font-weight:700;margin-left:5px;">✕</button>`;
    } else {
      badge.innerHTML = '📍 Showing: All <button onclick="window.clearSquadFilter()" style="background:none;border:none;color:var(--orange);font-weight:700;margin-left:5px;">✕</button>';
    }
  }
  
  if (currentSquadTab === 'sessions') {
    filterSessions();
  } else {
    filterGroups();
  }
}

// Clear filter
function clearSquadFilter() {
  squadFacultyFilter = '';
  document.getElementById('squadFacultyFilter').value = '';
  filterSquad();
}

// Filter sessions
function filterSessions() {
  let filtered = _studySessionsPosts.filter(s => new Date(s.dateTime) > new Date());
  
  if (squadFacultyFilter) {
    filtered = filtered.filter(s => s.faculty === squadFacultyFilter);
  }
  
  if (squadSearch) {
    filtered = filtered.filter(s => 
      (s.module || '').toLowerCase().includes(squadSearch) ||
      (s.topic || '').toLowerCase().includes(squadSearch) ||
      (s.location || '').toLowerCase().includes(squadSearch)
    );
  }
  
  renderSessions(filtered);
}

// Render sessions
function renderSessions(sessions) {
  const container = document.getElementById('sessionsContainer');
  if (!container) return;
  
  if (!sessions.length) {
    container.innerHTML = '<div class="empty"><div class="ei">📅</div><p>No upcoming study sessions found.</p></div>';
    return;
  }
  
  sessions.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  
  container.innerHTML = sessions.map(s => {
    const isCreator = s.createdBy === CUK;
    const isJoined = s.participants?.includes(CUK);
    const participants = s.participants?.length || 1;
    const maxParticipants = s.maxParticipants || 5;
    const isFull = participants >= maxParticipants;
    
    const dateTime = new Date(s.dateTime);
    const formattedDate = dateTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const formattedTime = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    return `
      <div class="session-card">
        <div class="session-header">
          <div class="session-icon">📘</div>
          <div style="flex:1;">
            <div class="session-title">${s.topic || 'Study Session'}</div>
            <div class="session-meta">
              <span>📚 ${s.module}</span>
              <span>👤 ${s.createdByName || 'Someone'}</span>
            </div>
          </div>
        </div>
        <div class="session-details">
          <div class="session-detail-item"><i>📅</i> ${formattedDate} at ${formattedTime}</div>
          <div class="session-detail-item"><i>⏱️</i> ${s.duration} min</div>
          <div class="session-detail-item"><i>📍</i> ${s.location || 'TBD'}</div>
          <div class="session-detail-item"><i>👥</i> ${participants}/${maxParticipants}</div>
        </div>
        ${s.notes ? `<p style="font-size:.8rem;color:var(--muted);margin:8px 0;">📝 ${s.notes}</p>` : ''}
        <div class="session-footer">
          <div class="session-creator"><i>👤</i> <strong>${s.createdByName}</strong></div>
          ${isCreator ? `
            <button class="btn btn-red btn-sm" onclick="window.deleteSession('${s.id}')">🗑 Delete</button>
          ` : isJoined ? `
            <button class="btn btn-outline btn-sm" onclick="window.leaveSession('${s.id}')">✕ Leave</button>
          ` : !isFull ? `
            <button class="session-join-btn" onclick="window.joinSession('${s.id}')">➕ Join</button>
          ` : `
            <span class="badge badge-taken">Full</span>
          `}
        </div>
      </div>
    `;
  }).join('');
}

// Filter groups
function filterGroups() {
  let filtered = _groups;
  
  if (squadFacultyFilter) {
    filtered = filtered.filter(g => g.faculty === squadFacultyFilter);
  }
  
  if (squadSearch) {
    filtered = filtered.filter(g => 
      (g.name || '').toLowerCase().includes(squadSearch) ||
      (g.module || '').toLowerCase().includes(squadSearch)
    );
  }
  
  renderGroups(filtered);
}

// Render groups
function renderGroups(groups) {
  const container = document.getElementById('groupsContainer');
  if (!container) return;
  
  if (!groups || !groups.length) {
    container.innerHTML = '<div class="empty"><div class="ei">👥</div><p>No groups found.</p></div>';
    return;
  }
  
  container.innerHTML = groups.map(g => {
    const isMember = g.members?.includes(CUK);
    const isCreator = g.createdBy === CUK;
    
    return `
      <div class="group-card">
        <div class="group-header">
          <div class="group-avatar">${g.name[0]}</div>
          <div class="group-info">
            <div class="group-name">${g.name}</div>
            <div class="group-meta">📚 ${g.module} · 👥 ${g.members?.length || 1} members</div>
          </div>
        </div>
        <p style="font-size:.8rem;color:var(--muted);margin-bottom:10px;">${g.description || ''}</p>
        <div class="group-stats">
          <div class="group-stat"><strong>${g.members?.length || 1}</strong> members</div>
          <div class="group-stat"><strong>${g.faculty || '—'}</strong></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          ${isMember ? `
            <button class="btn btn-blue btn-sm" onclick="window.openGroupChat('${g.id}')">💬 Chat</button>
            <button class="btn btn-outline btn-sm" onclick="window.leaveGroup('${g.id}')">Leave</button>
          ` : `
            <button class="btn btn-green btn-sm" onclick="window.joinGroup('${g.id}')">➕ Join Group</button>
          `}
          ${isCreator ? `
            <button class="btn btn-red btn-sm" onclick="window.deleteGroup('${g.id}')">🗑 Delete</button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Create study session
async function createStudySession() {
  const sessionType = document.querySelector('input[name="sessionType"]:checked')?.value;
  const module = document.getElementById('sessionModSelect').value;
  const topic = document.getElementById('sessionTopic').value.trim();
  const dateTime = document.getElementById('sessionDateTime').value;
  const duration = document.getElementById('sessionDuration').value;
  const location = document.getElementById('sessionLocation').value.trim();
  const maxParticipants = document.getElementById('sessionMaxParticipants').value;
  const notes = document.getElementById('sessionNotes').value.trim();
  
  if (!module) { alert('Please select a module.'); return; }
  if (!topic) { alert('Enter a topic.'); return; }
  if (!dateTime) { alert('Select date and time.'); return; }
  if (!location) { alert('Enter location.'); return; }
  
  const faculty = CU.faculty || 'Unknown';
  
  if (sessionType === 'permanent') {
    const groupName = prompt('Enter a name for your permanent group:', topic + ' Study Group');
    if (!groupName) return;
    
    await FS.addGroup({ 
      createdBy: CUK, 
      createdByName: CU.name, 
      name: groupName, 
      module, 
      description: notes || `Study group for ${topic}`, 
      faculty, 
      members: [CUK] 
    });
    
    showToast('Group Created', 'Your permanent study group has been created!', 'success');
  } else {
    await FS.addStudySessionPost({ 
      createdBy: CUK, 
      createdByName: CU.name, 
      module, 
      topic, 
      dateTime, 
      duration: parseInt(duration), 
      location, 
      maxParticipants: parseInt(maxParticipants), 
      notes, 
      faculty, 
      participants: [CUK] 
    });
    
    showToast('Session Created', 'Your study session is now live!', 'success');
  }
  
  // Clear form
  document.getElementById('sessionModSelect').value = '';
  document.getElementById('sessionTopic').value = '';
  document.getElementById('sessionDateTime').value = '';
  document.getElementById('sessionLocation').value = '';
  document.getElementById('sessionNotes').value = '';
  
  document.getElementById('createSessionMod').classList.remove('on');
}

// Join session
async function joinSession(sessionId) {
  const session = _studySessionsPosts.find(s => s.id === sessionId);
  if (!session) return;
  
  if (session.participants?.includes(CUK)) {
    showToast('Already Joined', 'You are already in this session.', 'info');
    return;
  }
  
  if (session.participants?.length >= (session.maxParticipants || 5)) {
    showToast('Session Full', 'This session has reached max participants.', 'warning');
    return;
  }
  
  await FS.updateStudySessionPost(sessionId, { participants: FS.arrayUnion(CUK) });
  showToast('Joined Session', 'You have joined the study session!', 'success');
}

// Leave session
async function leaveSession(sessionId) {
  if (!confirm('Leave this session?')) return;
  await FS.updateStudySessionPost(sessionId, { participants: FS.arrayRemove(CUK) });
  showToast('Left Session', 'You have left the session.', 'info');
}

// Delete session
async function deleteSession(sessionId) {
  if (!confirm('Delete this session?')) return;
  await FS.deleteStudySessionPost(sessionId);
  showToast('Session Deleted', 'Your session has been removed.', 'info');
}

// Create permanent group
async function createPermanentGroup() {
  const name = document.getElementById('groupName').value.trim();
  const module = document.getElementById('groupModule').value;
  const description = document.getElementById('groupDesc').value.trim();
  const faculty = document.getElementById('groupFaculty').value;
  
  if (!name) { alert('Enter a group name.'); return; }
  if (!module) { alert('Select a module.'); return; }
  
  await FS.addGroup({ 
    createdBy: CUK, 
    createdByName: CU.name, 
    name, 
    module, 
    description, 
    faculty, 
    members: [CUK] 
  });
  
  document.getElementById('groupName').value = '';
  document.getElementById('groupDesc').value = '';
  document.getElementById('createGroupMod').classList.remove('on');
  
  showToast('Group Created', 'Your permanent study group is ready!', 'success');
}

// Join group
async function joinGroup(groupId) {
  await FS.joinGroup(groupId, CUK);
  showToast('Joined Group', 'You are now a member of this group.', 'success');
}

// Leave group
async function leaveGroup(groupId) {
  if (!confirm('Leave this group?')) return;
  await FS.leaveGroup(groupId, CUK);
  showToast('Left Group', 'You have left the group.', 'info');
}

// Delete group
async function deleteGroup(groupId) {
  if (!confirm('Delete this group?')) return;
  await FS.deleteGroup(groupId);
  showToast('Group Deleted', 'The group has been removed.', 'info');
}

// Set location preset
function setLocation(loc) {
  document.getElementById('sessionLocation').value = loc;
  document.querySelectorAll('.location-preset').forEach(el => el.classList.remove('active'));
  event.target.classList.add('active');
}

// Make functions globally available
window.renderSquadPage = renderSquadPage;
window.squadTab = squadTab;
window.filterSquad = filterSquad;
window.clearSquadFilter = clearSquadFilter;
window.createStudySession = createStudySession;
window.joinSession = joinSession;
window.leaveSession = leaveSession;
window.deleteSession = deleteSession;
window.createPermanentGroup = createPermanentGroup;
window.joinGroup = joinGroup;
window.leaveGroup = leaveGroup;
window.deleteGroup = deleteGroup;
window.setLocation = setLocation;

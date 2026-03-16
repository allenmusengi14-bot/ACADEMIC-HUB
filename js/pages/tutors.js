import { CU, CUK, _ratings } from '../app.js';
import { FS } from '../firebase-config.js';
import { showToast } from '../components/toast.js';

// Render Tutors page
export function renderTutorsPage() {
  const page = document.getElementById('pg-tutors');
  if (!page) return;
  
  page.innerHTML = `
    <div class="page-header"><h1>⭐ Find a Tutor</h1><p>Browse rated peer tutors and connect via WhatsApp</p></div>
    
    <div class="card" style="padding:14px 18px;margin-bottom:14px;">
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <input id="tSrch" type="text" placeholder="Search by name or subject…" oninput="window.renderTutors()" class="req-fi" style="flex:1;min-width:140px;">
        <select id="tFacFilter" class="req-fi" style="width:auto;min-width:160px;" onchange="window.renderTutors()">
          <option value="">All Faculties</option>
          <option>Engineering & Technology</option>
          <option>Science</option>
          <option>Business</option>
          <option>Social Sciences</option>
          <option>Humanities</option>
          <option>Education</option>
          <option>Law</option>
          <option>Medicine</option>
        </select>
      </div>
    </div>
    
    <div id="tutorList"></div>
  `;
  
  renderTutors();
}

// Render tutors
async function renderTutors() {
  const search = document.getElementById('tSrch')?.value.toLowerCase() || '';
  const fac = document.getElementById('tFacFilter')?.value || '';
  
  const users = await FS.getAllUsers();
  const tutors = Object.entries(users)
    .filter(([id, u]) => u.isTutor)
    .map(([id, u]) => ({ id, ...u }));
  
  let filtered = tutors;
  
  if (fac) filtered = filtered.filter(t => t.faculty === fac);
  if (search) {
    filtered = filtered.filter(t => 
      (t.name || '').toLowerCase().includes(search) || 
      (t.tutorSubjects || []).join(' ').toLowerCase().includes(search)
    );
  }
  
  const container = document.getElementById('tutorList');
  if (!container) return;
  
  if (!filtered.length) {
    container.innerHTML = '<div class="empty"><div class="ei">⭐</div><p>No tutors found.</p></div>';
    return;
  }
  
  container.innerHTML = filtered.map(t => {
    const ratings = _ratings[t.id] || [];
    const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1) : 'New';
    const tags = ratings.flatMap(r => r.tags || []).filter((v, i, a) => a.indexOf(v) === i);
    
    return `
      <div class="tutor-card">
        <div class="tutor-top">
          <div class="tutor-av">${t.name[0]}</div>
          <div>
            <div class="tutor-name">${t.name} <span style="font-size:.7rem;color:var(--muted);">· ${t.year || '?'}</span></div>
            <div class="tutor-bio">${t.tutorBio || 'No bio yet.'}</div>
          </div>
        </div>
        <div class="tutor-subjects">
          ${(t.tutorSubjects || []).map(s => `<span class="subj-tag">${s.trim()}</span>`).join('')}
        </div>
        <div class="stars-row">
          ${[1, 2, 3, 4, 5].map(i => 
            `<span class="star ${i <= avgRating ? 'on' : ''}">★</span>`
          ).join('')}
          <span class="star-count">${ratings.length} review${ratings.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="rating-tags">
          ${tags.slice(0, 3).map(tag => `<span class="rtag">#${tag}</span>`).join('')}
        </div>
        <div style="margin-top:14px;">
          <button class="btn btn-blue btn-sm" onclick="window.openRate('${t.id}', '${t.name}')">⭐ Rate</button>
          <button class="btn btn-green btn-sm" style="margin-left:8px;" onclick="window.contactTutor('${t.wa}')">💬 Contact</button>
        </div>
      </div>
    `;
  }).join('');
}

// Contact tutor
function contactTutor(wa) {
  const message = encodeURIComponent(
    `Hi, I saw your profile on UB Academic Hub. I'd like to schedule a tutoring session.`
  );
  window.open(`https://wa.me/${wa.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
}

// Rating functions
let rTarget = null;
let rStars = 0;
let rTags = [];

function openRate(tutorId, tutorName) {
  rTarget = tutorId;
  rStars = 0;
  rTags = [];
  
  document.getElementById('rateWho').textContent = `Rate your session with ${tutorName}`;
  
  document.querySelectorAll('.rate-star').forEach(el => el.classList.remove('on'));
  document.querySelectorAll('.rate-tag').forEach(el => el.classList.remove('on'));
  document.getElementById('rateNote').value = '';
  
  document.getElementById('rateMod').classList.add('on');
}

function setStar(n) {
  rStars = n;
  document.querySelectorAll('.rate-star').forEach((el, i) => {
    el.classList.toggle('on', i < n);
  });
}

function toggleTag(el) {
  el.classList.toggle('on');
  const tag = el.textContent;
  
  if (el.classList.contains('on')) {
    if (!rTags.includes(tag)) rTags.push(tag);
  } else {
    rTags = rTags.filter(t => t !== tag);
  }
}

async function submitRating() {
  if (rStars === 0) {
    alert('Select stars');
    return;
  }
  
  const rating = {
    by: CUK,
    byName: CU.name,
    stars: rStars,
    tags: rTags,
    note: document.getElementById('rateNote').value,
    at: new Date().toISOString()
  };
  
  await FS.addRating(rTarget, rating);
  showToast('Rating saved', 'Thank you!', 'success');
  closeRate();
}

function closeRate() {
  document.getElementById('rateMod').classList.remove('on');
}

// Make functions globally available
window.renderTutorsPage = renderTutorsPage;
window.renderTutors = renderTutors;
window.contactTutor = contactTutor;
window.openRate = openRate;
window.setStar = setStar;
window.toggleTag = toggleTag;
window.submitRating = submitRating;
window.closeRate = closeRate;

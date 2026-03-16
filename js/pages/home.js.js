import { CU, CUK, mods, _points } from '../app.js';
import { getRandomQuote } from '../components/utils.js';

// Render home page
export function renderHomePage() {
  const page = document.getElementById('pg-home');
  if (!page) return;
  
  setGreeting();
  
  // Update stats
  updateHomeStats();
  
  // Render home content
  page.innerHTML = `
    <div class="home-top-row">
      <div class="home-greet-block">
        <h2 id="heroGreet">Good morning 🌟, Student!</h2>
        <div class="hero-quote" id="heroQuote"></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:22px;">
      <div class="stat-card" style="background:linear-gradient(135deg,#7c3aed,#ec4899);padding:15px;">
        <h3>Study Streak</h3>
        <div class="stat-val" style="font-size:1.8rem;" id="homeStreak">${CU?.studyStats?.streak || 0}</div>
      </div>
      <div class="stat-card" style="background:linear-gradient(135deg,#059669,#10b981);padding:15px;">
        <h3>Points This Month</h3>
        <div class="stat-val" style="font-size:1.8rem;" id="homePoints">0</div>
      </div>
    </div>

    <div style="display:grid;gap:16px;margin-bottom:22px;">
      <div class="home-section-card" style="--sc1:#2563eb;--sc2:#7c3aed;">
        <div class="hsc-label">📚 Academic Tools</div>
        <div class="hsc-grid">
          <div class="hsc-item" onclick="window.go('gpa')">
            <div class="hsc-icon" style="background:linear-gradient(135deg,#dbeafe,#ede9fe)">📊</div>
            <div class="hsc-title">GPA Tracker</div>
            <div class="hsc-sub">Calculate your GPA & project your CGPA</div>
          </div>
          <div class="hsc-item" onclick="window.go('study')">
            <div class="hsc-icon" style="background:linear-gradient(135deg,#d1fae5,#ccfbf1)">🎓</div>
            <div class="hsc-title">Study Hub</div>
            <div class="hsc-sub">Find videos, papers & quizzes instantly</div>
          </div>
          <div class="hsc-item" onclick="window.go('streak')">
            <div class="hsc-icon" style="background:linear-gradient(135deg,#fef3c7,#ffedd5)">🔥</div>
            <div class="hsc-title">Study Streak</div>
            <div class="hsc-sub">Track your study time with dual timers</div>
          </div>
        </div>
      </div>

      <div class="home-section-card" style="--sc1:#f59e0b;--sc2:#ec4899;">
        <div class="hsc-label">🤝 PeerBridge</div>
        <div class="hsc-grid">
          <div class="hsc-item" onclick="window.go('peer')">
            <div class="hsc-icon" style="background:linear-gradient(135deg,#fef3c7,#ffedd5)">🙋</div>
            <div class="hsc-title">Get Help</div>
            <div class="hsc-sub">Post a request & connect with a peer tutor</div>
          </div>
          <div class="hsc-item" onclick="window.go('tutors')">
            <div class="hsc-icon" style="background:linear-gradient(135deg,#fce7f3,#ede9fe)">⭐</div>
            <div class="hsc-title">Find a Tutor</div>
            <div class="hsc-sub">Browse rated peer tutors by subject</div>
          </div>
          <div class="hsc-item" onclick="window.go('become')">
            <div class="hsc-icon" style="background:linear-gradient(135deg,#ede9fe,#fce7f3)">🎯</div>
            <div class="hsc-title">Become a Tutor</div>
            <div class="hsc-sub">Earn by helping fellow students</div>
          </div>
        </div>
      </div>

      <div class="home-section-card" style="--sc1:#0d9488;--sc2:#059669;">
        <div class="hsc-label">👥 Community</div>
        <div class="hsc-grid">
          <div class="hsc-item" onclick="window.go('squad')">
            <div class="hsc-icon" style="background:linear-gradient(135deg,#ccfbf1,#d1fae5)">📅</div>
            <div class="hsc-title">Study Squad</div>
            <div class="hsc-sub">Join study groups & sessions</div>
          </div>
          <div class="hsc-item" onclick="window.go('rooms')">
            <div class="hsc-icon" style="background:linear-gradient(135deg,#fef3c7,#fde68a)">👥</div>
            <div class="hsc-title">Focus Rooms</div>
            <div class="hsc-sub">Study together in real-time</div>
          </div>
          <div class="hsc-item" onclick="window.go('points')">
            <div class="hsc-icon" style="background:linear-gradient(135deg,#fde68a,#fbbf24)">⭐</div>
            <div class="hsc-title">Earn Points</div>
            <div class="hsc-sub">Climb the faculty leaderboard</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Update points
  updateHomeStats();
  setGreeting();
}

// Set greeting based on time
function setGreeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning ☀️' : h < 17 ? 'Good afternoon 👋' : 'Good evening 🌙';
  const name = CU ? CU.name.split(' ')[0] : 'Student';
  
  const heroGreet = document.getElementById('heroGreet');
  if (heroGreet) heroGreet.textContent = g + `, ${name}!`;
  
  rotateQuote();
}

// Rotate motivational quotes
function rotateQuote() {
  const el = document.getElementById('heroQuote');
  if (!el) return;
  
  el.style.transition = 'opacity .6s';
  el.style.opacity = '0';
  
  setTimeout(() => {
    el.textContent = getRandomQuote();
    el.style.opacity = '1';
  }, 600);
}

// Update home stats
function updateHomeStats() {
  const pointsEl = document.getElementById('homePoints');
  if (pointsEl && CUK) {
    const month = new Date().toISOString().slice(0, 7);
    const total = _points.filter(p => p.by === CUK && p.month === month).reduce((s, p) => s + (p.points || 0), 0);
    pointsEl.textContent = total;
  }
  
  const streakEl = document.getElementById('homeStreak');
  if (streakEl && CU && CU.studyStats) {
    streakEl.textContent = CU.studyStats.streak || 0;
  }
}

// Make functions globally available
window.renderHomePage = renderHomePage;
window.setGreeting = setGreeting;
window.rotateQuote = rotateQuote;
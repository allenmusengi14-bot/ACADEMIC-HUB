// Home page render function
export function renderHomePage() {
  const page = document.getElementById('pg-home');
  if (!page) return;
  
  const user = window.CU || {};
  const name = user.name || 'Student';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const streak = user.studyStats?.streak || 0;
  const hours = Math.floor(user.studyStats?.totalHours || 0);
  
  page.innerHTML = `
    <div class="page-header">
      <h1>${greeting}, ${name.split(' ')[0]}! 🌟</h1>
      <p>Welcome to UB Academic Hub. Track your GPA, join study sessions, and connect with peers.</p>
    </div>
    <div class="home-stats-row">
      <div class="home-stat-pill" onclick="window.go('streak')" style="--pc1:var(--purple);--pc2:var(--pink);">
        <div class="hsp-icon">🔥</div>
        <div class="hsp-body">
          <div class="hsp-val">${streak}</div>
          <div class="hsp-label">Day Streak</div>
        </div>
      </div>
      <div class="home-stat-pill" onclick="window.go('points')" style="--pc1:var(--gold);--pc2:var(--orange);">
        <div class="hsp-icon">⭐</div>
        <div class="hsp-body">
          <div class="hsp-val" id="homePoints">0</div>
          <div class="hsp-label">Points This Month</div>
        </div>
      </div>
      <div class="home-stat-pill" onclick="window.go('streak')" style="--pc1:var(--blue);--pc2:var(--teal);">
        <div class="hsp-icon">⏱️</div>
        <div class="hsp-body">
          <div class="hsp-val">${hours}h</div>
          <div class="hsp-label">Study Time</div>
        </div>
      </div>
      <div class="home-stat-pill" onclick="window.go('calendar')" style="--pc1:var(--red);--pc2:var(--orange);">
        <div class="hsp-icon">📅</div>
        <div class="hsp-body">
          <div class="hsp-val" id="homeUpcomingCount">0</div>
          <div class="hsp-label">Upcoming</div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">🚀 Quick Actions</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <button class="btn btn-blue" onclick="window.go('study')">📚 Study Hub</button>
        <button class="btn btn-green" onclick="window.go('squad')">👥 Study Squad</button>
        <button class="btn btn-purple" onclick="window.go('gpa')">📊 GPA Tracker</button>
        <button class="btn btn-gold" onclick="window.go('tutors')">⭐ Find Tutor</button>
      </div>
    </div>
    <div class="card">
      <div class="card-title">💡 Study Tip of the Day</div>
      <p>Use the Pomodoro technique: 25 minutes focused work, 5 minutes break. Repeat 4 times, then take a longer break! This boosts productivity by up to 40%.</p>
    </div>
    <div class="card">
      <div class="card-title">📅 Your Modules</div>
      <div id="homeModulesList">Loading your modules...</div>
    </div>
  `;
  
  // Load modules
  if (window.mods && window.mods.length) {
    const modulesHtml = window.mods.map(m => `<div class="badge badge-info" style="margin:4px;">${m.code} - ${m.name}</div>`).join('');
    document.getElementById('homeModulesList').innerHTML = modulesHtml || 'No modules added yet. Go to Profile to add them.';
  } else {
    document.getElementById('homeModulesList').innerHTML = 'No modules added yet. Go to Profile to add them.';
  }
}

// Make globally available
window.renderHomePage = renderHomePage;

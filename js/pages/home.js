import { CU, CUK, mods, _points, _studySessions } from './app.js.js';
import { getRandomQuote, saveToLocal, loadFromLocal } from './utils.js.js';

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

const STUDY_TIPS = [
  "Use the Pomodoro method — 25 min focus, 5 min break — to stay sharp all day.",
  "Teach what you've learned to a friend. If you can explain it, you know it.",
  "Review your notes within 24 hours — you'll retain 60% more.",
  "Break big assignments into 3 small tasks. Start with the easiest one.",
  "Put your phone in another room when studying. Out of sight, out of mind.",
  "Study in the same spot every day. Your brain will start focusing faster.",
  "Sleep is when your brain consolidates memory. Don't skip it before exams.",
  "Use past exam papers — they're the best predictor of what comes up.",
  "Stay hydrated. Even mild dehydration tanks your focus.",
  "Write summaries by hand. The act of writing boosts recall by 40%.",
  "Study with people who are more focused than you. Energy is contagious.",
  "If you're stuck, take a 10-min walk. Movement sparks new ideas.",
  "Use active recall — quiz yourself instead of just re-reading notes.",
  "Start assignments the day they're given. Future you will be grateful.",
  "Group similar tasks together — context switching kills productivity."
];
let _tipIndex = Math.floor(Math.random() * STUDY_TIPS.length);

function refreshTip() {
  _tipIndex = (_tipIndex + 1) % STUDY_TIPS.length;
  const el = document.getElementById('homeTipText');
  if (el) { el.style.opacity = '0'; setTimeout(() => { el.textContent = STUDY_TIPS[_tipIndex]; el.style.opacity = '1'; }, 200); }
}

function renderHomeUpcomingEvents() {
  const rail = document.getElementById('homeUpcomingRail');
  if (!rail) return;
  const events = loadFromLocal('acaEvents_' + CUK, []);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);

  const countEl = document.getElementById('homeUpcomingCount');
  if (countEl) countEl.textContent = upcoming.length;

  if (!upcoming.length) {
    rail.innerHTML = '<div class="home-empty-state">No events yet — <span onclick="go(\'calendar\')" style="color:var(--blue2);cursor:pointer;font-weight:700;">add one in Calendar</span></div>';
    return;
  }
  const typeColors = { test: 'var(--danger)', assignment: 'var(--gold)', quiz: 'var(--blue2)', exam: 'var(--purple)', other: 'var(--teal)' };
  rail.innerHTML = upcoming.map(e => {
    const d = new Date(e.date + 'T00:00:00');
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const color = typeColors[e.type] || typeColors.other;
    const daysLeft = Math.ceil((d - new Date().setHours(0,0,0,0)) / 86400000);
    const urgency = daysLeft === 0 ? 'Today!' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`;
    return `<div class="home-event-chip" onclick="go('calendar')" style="--ec:${color}">
      <div class="home-event-date">${dateStr} · ${urgency}</div>
      <div class="home-event-name">${e.title || 'Event'}</div>
      <div class="home-event-type">${(e.type||'other').charAt(0).toUpperCase()+(e.type||'other').slice(1)}${e.module ? ' · '+e.module : ''}</div>
    </div>`;
  }).join('');
}

function renderHomeWeekBars(sessions) {
  const container = document.getElementById('homeWeekBars');
  if (!container) return;
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = new Date();
  const weekData = Array.from({length: 7}, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const mins = sessions.filter(s => (s.date || '').slice(0, 10) === dateStr).reduce((s, ss) => s + (ss.duration || 0), 0);
    return { day: days[d.getDay()], mins, isToday: i === 6, dateStr };
  });
  const maxMins = Math.max(...weekData.map(d => d.mins), 30);
  const totalThisWeek = weekData.reduce((s, d) => s + d.mins, 0);
  container.innerHTML = weekData.map(d => {
    const pct = Math.max((d.mins / maxMins) * 100, d.mins > 0 ? 8 : 4);
    return `<div class="home-bar-wrap" title="${d.mins} min on ${d.dateStr}">
      <div class="home-bar${d.isToday ? ' today' : ''}" style="height:${pct}%;"></div>
      <div class="home-bar-day" style="${d.isToday ? 'color:var(--gold);font-weight:800;' : ''}">${d.day}</div>
    </div>`;
  }).join('');
  const totalEl = document.getElementById('homeWeekTotal');
  if (totalEl) totalEl.textContent = totalThisWeek >= 60 ? `${Math.round(totalThisWeek/60)}h ${totalThisWeek%60}min studied this week` : `${totalThisWeek} min studied this week`;
}

const EVENT_TYPE_THUMB_COLORS = { module:['#1d4ed8','#6d28d9'], diary:['#db2777','#ea6c0a'], pd:['#047857','#0f766e'], fun:['#d97706','#db2777'] };

function makeVideoCard(item, category) {
  const [c1, c2] = EVENT_TYPE_THUMB_COLORS[category] || EVENT_TYPE_THUMB_COLORS.module;
  const emoji = item.emoji || (category==='module'?'🎓':category==='diary'?'🎥':category==='pd'?'🚀':'😂');
  return `<a class="home-video-card" href="${item.href}" target="_blank" rel="noopener noreferrer">
    <div class="home-video-thumb" style="background:linear-gradient(135deg,${c1},${c2});display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;">
      <div style="font-size:2.2rem;">${emoji}</div>
      <div style="font-size:.7rem;color:rgba(255,255,255,.8);font-weight:700;">▶ Watch</div>
    </div>
    <div style="padding:10px 12px;">
      <div class="home-video-tag">${item.tag || 'YouTube'}</div>
      <div class="home-video-title">${item.title}</div>
    </div>
  </a>`;
}

function scrollVideoRail(railId, dir) {
  const el = document.getElementById(railId);
  if (el) el.scrollBy({ left: dir * 240, behavior: 'smooth' });
}

function renderHomeVideoFeeds() {
  if (!CU) return;
  const faculty = CU.faculty || 'Engineering & Technology';
  const prog = (CU.programme || '').trim();
  const progQ = encodeURIComponent(prog || faculty);

  const moduleItems = (mods || []).slice(0, 8).map(m => ({
    title: `${m.code ? m.code+' — ' : ''}${m.name || 'Module'} Lectures`,
    tag: m.code || 'Module', emoji: '📘',
    href: `https://www.youtube.com/results?search_query=${encodeURIComponent((prog||faculty)+' '+(m.code||'')+' '+(m.name||'')+' lecture tutorial')}`
  }));
  if (!moduleItems.length) moduleItems.push(
    { title:`${prog||faculty} — Lecture Series`, tag:'Lectures', emoji:'🎓', href:`https://www.youtube.com/results?search_query=${progQ}+lecture+series` },
    { title:`${prog||faculty} — Exam Tips`, tag:'Exam Prep', emoji:'📝', href:`https://www.youtube.com/results?search_query=${progQ}+exam+preparation+tips` },
    { title:`${prog||faculty} — Study Guide`, tag:'Study', emoji:'📖', href:`https://www.youtube.com/results?search_query=${progQ}+study+guide+revision` }
  );

  const diaryItems = [
    { title:`Day in the Life — ${prog||faculty} Student`, tag:'Vlog', emoji:'🎒', href:`https://www.youtube.com/results?search_query=day+in+the+life+${progQ}+university+student` },
    { title:'University Student Morning Routine', tag:'Routine', emoji:'☀️', href:'https://www.youtube.com/results?search_query=university+student+morning+routine' },
    { title:'Study With Me — University Vlog', tag:'Study Vlog', emoji:'📚', href:`https://www.youtube.com/results?search_query=study+with+me+${progQ}+university+vlog` },
    { title:'Finals Week Survival Vlog', tag:'Exams', emoji:'😅', href:'https://www.youtube.com/results?search_query=finals+week+university+survival+vlog' },
    { title:'African University Student Life', tag:'Africa', emoji:'🌍', href:'https://www.youtube.com/results?search_query=african+university+student+vlog+life' }
  ];

  const pdItems = [
    { title:`Career Paths in ${prog||faculty}`, tag:'Career', emoji:'💼', href:`https://www.youtube.com/results?search_query=career+paths+${progQ}+degree+jobs` },
    { title:'How to Build Good Study Habits', tag:'Habits', emoji:'🧠', href:'https://www.youtube.com/results?search_query=how+to+build+good+study+habits+university' },
    { title:'Time Management for Students', tag:'Productivity', emoji:'⏰', href:'https://www.youtube.com/results?search_query=time+management+for+university+students' },
    { title:'LinkedIn for Students — Full Guide', tag:'LinkedIn', emoji:'💡', href:'https://www.youtube.com/results?search_query=linkedin+for+students+complete+guide' },
    { title:`${prog||faculty} Internship Tips`, tag:'Internships', emoji:'🏢', href:`https://www.youtube.com/results?search_query=${progQ}+internship+tips+for+students` }
  ];

  const funItems = [
    { title:'Funniest University Moments Compilation', tag:'Funny', emoji:'😂', href:'https://www.youtube.com/results?search_query=funniest+university+student+moments+compilation' },
    { title:'Student Budget Cooking — Easy Meals', tag:'Food', emoji:'🍜', href:'https://www.youtube.com/results?search_query=easy+student+budget+cooking+meals' },
    { title:'Best Study Music Playlists 2024', tag:'Music', emoji:'🎵', href:'https://www.youtube.com/results?search_query=best+study+music+playlist+2024+lofi' },
    { title:'Side Hustles for Students', tag:'Hustle', emoji:'💰', href:'https://www.youtube.com/results?search_query=side+hustles+for+university+students' },
    { title:'Campus Exploration — Hidden Spots', tag:'Campus', emoji:'🗺️', href:'https://www.youtube.com/results?search_query=university+campus+best+study+spots+exploration' }
  ];

  function fill(railId, items, cat) {
    const rail = document.getElementById(railId);
    if (rail) rail.innerHTML = items.map(item => makeVideoCard(item, cat)).join('');
  }
  fill('moduleRail', moduleItems, 'module');
  fill('diaryRail', diaryItems, 'diary');
  fill('pdRail', pdItems, 'pd');
  fill('funRail', funItems, 'fun');
}

function scrollHomeFeed(direction) { scrollVideoRail('moduleRail', direction); }

function updateHomeStats() {
  const pointsEl = document.getElementById('homePoints');
  if (pointsEl && CUK) {
    const month = new Date().toISOString().slice(0, 7);
    const total = _points.filter(p => p.by === CUK && p.month === month).reduce((s, p) => s + (p.points || 0), 0);
    pointsEl.textContent = total;
  }
  const streakEl = document.getElementById('homeStreak');
  if (streakEl && CU && CU.studyStats) streakEl.textContent = CU.studyStats.streak || 0;

  const sessions = loadFromLocal('studySessions_' + CUK, []);
  const totalMins = sessions.reduce((s, sess) => s + (sess.duration || 0), 0);
  const hoursEl = document.getElementById('homeTotalHours');
  if (hoursEl) hoursEl.textContent = totalMins >= 60 ? Math.round(totalMins / 60) + 'h' : totalMins + 'm';

  const datePill = document.getElementById('homeDatePill');
  if (datePill) {
    const now = new Date();
    datePill.textContent = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  const tipEl = document.getElementById('homeTipText');
  if (tipEl) tipEl.textContent = STUDY_TIPS[_tipIndex];
  const tipCard = document.getElementById('homeTipCard');
  if (tipCard) tipCard.style.transition = 'opacity .3s';

  renderHomeUpcomingEvents();
  renderHomeWeekBars(sessions);
  renderHomeVideoFeeds();
}

// Make functions globally available
window.renderHomePage = renderHomePage;
window.setGreeting = setGreeting;
window.rotateQuote = rotateQuote;
window.updateHomeStats = updateHomeStats;
window.renderHomeUpcomingEvents = renderHomeUpcomingEvents;
window.renderHomeWeekBars = renderHomeWeekBars;
window.renderHomeVideoFeeds = renderHomeVideoFeeds;
window.refreshTip = refreshTip;
window.scrollHomeFeed = scrollHomeFeed;
window.scrollVideoRail = scrollVideoRail;
window.makeVideoCard = makeVideoCard;

// Local Storage helpers
export function saveToLocal(key, data) { 
  try { 
    localStorage.setItem(`ub_${key}`, JSON.stringify(data)); 
  } catch(e){} 
}

export function loadFromLocal(key, def=null) { 
  try { 
    const d = localStorage.getItem(`ub_${key}`); 
    return d ? JSON.parse(d) : def; 
  } catch(e){ 
    return def; 
  } 
}

// Date formatting
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTime(date) {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

// Time formatting for timers
export function formatStopwatchTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatPomodoroTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Quote rotation
const QUOTES = [
  '"The secret of getting ahead is getting started."',
  '"An investment in knowledge pays the best interest."',
  '"Education is the most powerful weapon."',
  '"Success is the sum of small efforts."',
  '"Believe you can and you\'re halfway there."',
  '"The future belongs to those who prepare for it today."',
  '"Learning is a treasure that will follow its owner everywhere."'
];

export function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

// Grade calculation
export function calculateGrade(mark) {
  if (mark >= 70) return { grade: 'A', gp: 4.0 };
  if (mark >= 65) return { grade: 'B+', gp: 3.5 };
  if (mark >= 60) return { grade: 'B', gp: 3.0 };
  if (mark >= 55) return { grade: 'C+', gp: 2.5 };
  if (mark >= 50) return { grade: 'C', gp: 2.0 };
  if (mark >= 45) return { grade: 'D+', gp: 1.5 };
  if (mark >= 40) return { grade: 'D', gp: 1.0 };
  return { grade: 'F', gp: 0.0 };
}

export function calculateClass(cgpa) {
  if (cgpa >= 3.6) return 'First Class Honours';
  if (cgpa >= 3.0) return 'Upper Second Class';
  if (cgpa >= 2.0) return 'Lower Second Class';
  if (cgpa >= 1.0) return 'Pass';
  return 'Fail';
}

// Points calculation for test scores
export function calculatePoints(mark) {
  if (mark >= 90 && mark <= 100) return 30;
  if (mark >= 80) return 25;
  if (mark >= 70) return 20;
  if (mark >= 60) return 15;
  if (mark >= 50) return 10;
  if (mark >= 40) return 5;
  return 0;
}

// Additional constants
export const PTITLES = { 
  home:'Home', gpa:'GPA Tracker', study:'Study Hub', streak:'Study Streak', 
  peer:'Get Help', tutors:'Find a Tutor', become:'Become a Tutor', 
  profile:'My Profile', squad:'Study Squad', rooms:'Focus Rooms', 
  points:'Earn Points', settings:'Settings' 
};

export const FOCUS_FACULTY_ICONS = {
  'All':'✨',
  'Engineering & Technology':'⚙️',
  'Science':'🔬',
  'Business':'💼',
  'Social Sciences':'🌍',
  'Humanities':'📚',
  'Education':'🎓',
  'Law':'⚖️',
  'Medicine':'🩺'
};

export const STUDY_PET_TYPES = [
  { id:'dog', name:'Buddy', blurb:'Loyal and bright. Loves long, steady study sessions.' },
  { id:'cat', name:'Milo', blurb:'Calm and clever. Thrives on quiet revision blocks.' },
  { id:'penguin', name:'Pip', blurb:'Focused and disciplined. Slides into deep work with you.' },
  { id:'fox', name:'Nova', blurb:'Sharp and lively. Great for energetic study sprints.' },
  { id:'bunny', name:'Luna', blurb:'Gentle and cozy. Perfect for soft, welcoming study days.' }
];

export const HOME_VIDEO_THEMES = ['yt-red', 'yt-blue', 'yt-gold', 'yt-teal'];
export const FOCUS_ROOM_FACULTIES = ['Engineering & Technology', 'Science', 'Business', 'Social Sciences', 'Humanities', 'Education', 'Law', 'Medicine'];

// Make globally available
window.saveToLocal = saveToLocal;
window.loadFromLocal = loadFromLocal;
window.formatStopwatchTime = formatStopwatchTime;
window.formatPomodoroTime = formatPomodoroTime;
window.PTITLES = PTITLES;
window.FOCUS_FACULTY_ICONS = FOCUS_FACULTY_ICONS;
window.STUDY_PET_TYPES = STUDY_PET_TYPES;
window.HOME_VIDEO_THEMES = HOME_VIDEO_THEMES;
window.FOCUS_ROOM_FACULTIES = FOCUS_ROOM_FACULTIES;

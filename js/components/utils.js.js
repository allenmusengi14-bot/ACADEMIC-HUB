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

// Make available globally
window.saveToLocal = saveToLocal;
window.loadFromLocal = loadFromLocal;
window.formatStopwatchTime = formatStopwatchTime;
window.formatPomodoroTime = formatPomodoroTime;
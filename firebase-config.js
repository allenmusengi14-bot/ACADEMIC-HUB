// ==================== FIREBASE CONFIG ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection,
         addDoc, getDocs, deleteDoc, onSnapshot, query, orderBy, serverTimestamp,
         where, increment, arrayUnion, arrayRemove, limit }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBg8om9AP7dase-Zoc8OeojfP8kQI5qtho",
  authDomain: "ub-academic-hub.firebaseapp.com",
  projectId: "ub-academic-hub",
  storageBucket: "ub-academic-hub.firebasestorage.app",
  messagingSenderId: "972839460503",
  appId: "1:972839460503:web:34b8d9d99da370239f13d2"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ==================== DATABASE HELPERS ====================
const FS = {

  // ---------- USERS ----------
  async getUser(id) {
    const s = await getDoc(doc(db, 'users', id));
    return s.exists() ? s.data() : null;
  },
  async setUser(id, data) {
    await setDoc(doc(db, 'users', id), data, { merge: true });
  },
  async getAllUsers() {
    const s = await getDocs(collection(db, 'users'));
    const r = {};
    s.docs.forEach(d => r[d.id] = d.data());
    return r;
  },

  // ---------- REQUESTS ----------
  async addRequest(data) {
    return await addDoc(collection(db, 'requests'), { ...data, at: serverTimestamp() });
  },
  async deleteRequest(id) {
    await deleteDoc(doc(db, 'requests', id));
  },
  async updateRequest(id, data) {
    await updateDoc(doc(db, 'requests', id), data);
  },
  onRequests(cb) {
    return onSnapshot(
      query(collection(db, 'requests'), orderBy('at', 'desc')),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },

  // ---------- RATINGS ----------
  async getRatings() {
    const s = await getDocs(collection(db, 'ratings'));
    const r = {};
    s.docs.forEach(d => r[d.id] = d.data().list || []);
    return r;
  },
  async addRating(tutorId, rating) {
    const ref  = doc(db, 'ratings', tutorId);
    const s    = await getDoc(ref);
    const list = s.exists() ? (s.data().list || []) : [];
    list.push(rating);
    await setDoc(ref, { list });
  },

  // ---------- SESSIONS ----------
  async addSession(data) {
    return await addDoc(collection(db, 'sessions'), { ...data, at: serverTimestamp() });
  },
  async deleteSession(id) {
    await deleteDoc(doc(db, 'sessions', id));
  },
  async updateSession(id, data) {
    await updateDoc(doc(db, 'sessions', id), data);
  },
  onSessions(cb) {
    return onSnapshot(
      query(collection(db, 'sessions'), orderBy('at', 'desc')),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },

  // ---------- POINTS ----------
  async addPoint(data) {
    return await addDoc(collection(db, 'points'), { ...data, at: serverTimestamp() });
  },
  async getPoints() {
    const s = await getDocs(query(collection(db, 'points'), orderBy('at', 'desc')));
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  onPoints(cb) {
    return onSnapshot(
      query(collection(db, 'points'), orderBy('at', 'desc')),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },

  // ---------- CHAT ----------
  async sendMsg(sessionId, data) {
    return await addDoc(collection(db, 'chats', sessionId, 'messages'), { ...data, at: serverTimestamp() });
  },
  onMsgs(sessionId, cb) {
    return onSnapshot(
      query(collection(db, 'chats', sessionId, 'messages'), orderBy('at', 'asc')),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },

  // ---------- STUDY SESSIONS (personal) ----------
  async addStudySession(data) {
    return await addDoc(collection(db, 'studySessions'), { ...data, at: serverTimestamp() });
  },
  async getUserStudySessions(userId) {
    const s = await getDocs(
      query(collection(db, 'studySessions'), where('userId', '==', userId), orderBy('date', 'desc'))
    );
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // ---------- GROUPS ----------
  async addGroup(data) {
    return await addDoc(collection(db, 'groups'), { ...data, at: serverTimestamp(), members: [data.createdBy] });
  },
  async getGroups() {
    const s = await getDocs(query(collection(db, 'groups'), orderBy('at', 'desc')));
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  onGroups(cb) {
    return onSnapshot(
      query(collection(db, 'groups'), orderBy('at', 'desc')),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },
  async joinGroup(groupId, userId) {
    await updateDoc(doc(db, 'groups', groupId), { members: arrayUnion(userId) });
  },
  async leaveGroup(groupId, userId) {
    await updateDoc(doc(db, 'groups', groupId), { members: arrayRemove(userId) });
  },
  async deleteGroup(groupId) {
    await deleteDoc(doc(db, 'groups', groupId));
  },
  async sendGroupMsg(groupId, data) {
    return await addDoc(collection(db, 'groupChats', groupId, 'messages'), { ...data, at: serverTimestamp() });
  },
  onGroupMsgs(groupId, cb) {
    return onSnapshot(
      query(collection(db, 'groupChats', groupId, 'messages'), orderBy('at', 'asc')),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },

  // ---------- STUDY SESSION POSTS (squad) ----------
  async addStudySessionPost(data) {
    return await addDoc(collection(db, 'studySessionsPosts'), { ...data, at: serverTimestamp() });
  },
  async deleteStudySessionPost(id) {
    await deleteDoc(doc(db, 'studySessionsPosts', id));
  },
  async updateStudySessionPost(id, data) {
    await updateDoc(doc(db, 'studySessionsPosts', id), data);
  },
  onStudySessionsPosts(cb) {
    return onSnapshot(
      query(collection(db, 'studySessionsPosts'), orderBy('dateTime', 'asc')),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },
  async joinStudySession(sessionId, userId) {
    await updateDoc(doc(db, 'studySessionsPosts', sessionId), { participants: arrayUnion(userId) });
  },
  async leaveStudySession(sessionId, userId) {
    await updateDoc(doc(db, 'studySessionsPosts', sessionId), { participants: arrayRemove(userId) });
  },

  // ---------- FOCUS ROOMS ----------
  async addFocusRoom(data) {
    return await addDoc(collection(db, 'focusRooms'), { ...data, at: serverTimestamp(), participants: [data.createdBy] });
  },
  async deleteFocusRoom(id) {
    await deleteDoc(doc(db, 'focusRooms', id));
  },
  async updateFocusRoom(id, data) {
    await updateDoc(doc(db, 'focusRooms', id), data);
  },
  onFocusRooms(cb) {
    return onSnapshot(
      query(collection(db, 'focusRooms'), orderBy('created', 'desc')),
      s => cb(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },
  async joinFocusRoom(roomId, userId) {
    await updateDoc(doc(db, 'focusRooms', roomId), { participants: arrayUnion(userId) });
  },
  async leaveFocusRoom(roomId, userId) {
    await updateDoc(doc(db, 'focusRooms', roomId), { participants: arrayRemove(userId) });
  },
  async updateRoomTimer(roomId, timerData) {
    await updateDoc(doc(db, 'focusRooms', roomId), timerData);
  },
};

// ==================== MAKE GLOBALLY AVAILABLE ====================
// This fires AFTER Firebase is ready so auth.js and all other modules
// can safely call window.FS without a timing race.
window.FS       = FS;
window._fsReady = true;
document.dispatchEvent(new CustomEvent('fs-ready'));

export { FS, db };

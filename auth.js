const enc = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
function toHex(buffer) {
  const b = new Uint8Array(buffer);
  let h = '';
  for (let i = 0; i < b.length; i++) h += b[i].toString(16).padStart(2, '0');
  return h;
}
async function sha256(s) {
  if (typeof crypto !== 'undefined' && crypto.subtle && enc) {
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(s));
    return toHex(buf);
  }
  return btoa(s);
}
function getUsers() {
  const raw = localStorage.getItem('users');
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    if (Array.isArray(list)) return list;
    return [];
  } catch (_) {
    return [];
  }
}
function saveUsers(list) {
  localStorage.setItem('users', JSON.stringify(list));
}
function id() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now()) + Math.random().toString(16).slice(2);
}
function norm(s) {
  return String(s || '').trim().toLowerCase();
}
async function registerUser(username, email, password) {
  const u = norm(username);
  const e = norm(email);
  const users = getUsers();
  if (!u || !e || !password) throw new Error('Missing fields');
  if (users.some(x => norm(x.username) === u)) throw new Error('Username taken');
  if (users.some(x => norm(x.email) === e)) throw new Error('Email taken');
  const hash = await sha256(u + ':' + password);
  const user = { id: id(), username: username.trim(), email: email.trim(), passwordHash: hash, createdAt: Date.now() };
  users.push(user);
  saveUsers(users);
  localStorage.setItem('currentUser', JSON.stringify({ id: user.id, username: user.username, email: user.email }));
  localStorage.setItem('username', user.username);
  return user;
}
async function loginUser(identifier, password) {
  const idn = norm(identifier);
  const users = getUsers();
  const user = users.find(x => norm(x.username) === idn || norm(x.email) === idn);
  if (!user) throw new Error('User not found');
  const hash = await sha256(norm(user.username) + ':' + password);
  if (hash !== user.passwordHash) throw new Error('Invalid credentials');
  localStorage.setItem('currentUser', JSON.stringify({ id: user.id, username: user.username, email: user.email }));
  localStorage.setItem('username', user.username);
  return user;
}
function getEl(id) { return document.getElementById(id); }
function setText(id, s) { const el = getEl(id); if (el) el.textContent = s || ''; }
document.addEventListener('DOMContentLoaded', function(){
  const signupForm = getEl('signupForm');
  const loginForm = getEl('loginForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async function(ev){
      ev.preventDefault();
      setText('signupMsg','');
      const username = getEl('signupUsername').value;
      const email = getEl('signupEmail').value;
      const password = getEl('signupPassword').value;
      const confirm = getEl('signupConfirm').value;
      if (password !== confirm) { setText('signupMsg','Passwords do not match'); return; }
      try {
        await registerUser(username, email, password);
        window.location.href = 'index.html';
      } catch (e) {
        setText('signupMsg', e && e.message ? e.message : 'Error');
      }
    });
  }
  if (loginForm) {
    loginForm.addEventListener('submit', async function(ev){
      ev.preventDefault();
      setText('loginMsg','');
      const identifier = getEl('loginIdentifier').value;
      const password = getEl('loginPassword').value;
      try {
        await loginUser(identifier, password);
        window.location.href = 'index.html';
      } catch (e) {
        setText('loginMsg', e && e.message ? e.message : 'Error');
      }
    });
  }
});
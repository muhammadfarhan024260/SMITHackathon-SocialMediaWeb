const postText = document.getElementById("postText");
const postImage = document.getElementById("postImage");
const postBtn = document.getElementById("postBtn");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const filterDropdownBtn = document.getElementById("filterDropdownBtn");
const filterDropdownMenu = document.getElementById("filterDropdownMenu");
const filterLabel = document.getElementById("filterLabel");
const postsContainer = document.getElementById("postsContainer");
const storiesContainer = document.getElementById("storiesContainer");
const usernameEl = document.getElementById("username");
const themeToggle = document.getElementById("themeToggle");
const logoutBtn = document.getElementById("logoutBtn");
const sidebar = document.querySelector("aside");
const createSection = document.getElementById("createSection");
const mobileNav = document.getElementById("mobileNav");
const EMOJIS = ['👍','❤️','😂','🎉','😮','😢'];
let editingId = null;

function getPosts() {
  const raw = localStorage.getItem("posts");
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    if (Array.isArray(list)) return list;
    return [];
  } catch (_) {
    return [];
  }
}

function setPosts(list) {
  localStorage.setItem("posts", JSON.stringify(list));
}

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("currentUser")); } catch (_) { return null; }
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now()) + Math.random().toString(16).slice(2);
}

function setTheme(mode) {
  if (mode === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
  if (themeToggle) themeToggle.innerHTML = mode === "dark" ? iconMoon() : iconSun();
}

function applyFilter(v) {
  if (filterSelect) filterSelect.value = v;
  updateFilterLabel();
  setActiveFilterMenu();
  renderPosts();
}

function showCreateSection() {
  if (createSection) createSection.classList.remove("hidden");
  if (postText) {
    postText.scrollIntoView({ behavior: "smooth", block: "center" });
    postText.focus();
  }
}

function getReactionCounts(p) {
  const counts = {};
  for (let i = 0; i < EMOJIS.length; i++) counts[EMOJIS[i]] = 0;
  const map = p && p.reactionsBy && typeof p.reactionsBy === 'object' ? p.reactionsBy : null;
  if (map) {
    const vals = Object.values(map);
    for (let i = 0; i < vals.length; i++) {
      const e = vals[i];
      if (typeof e === 'string' && counts.hasOwnProperty(e)) counts[e]++;
    }
  }
  return counts;
}

function updateReaction(id, emoji) {
  const me = getCurrentUser();
  if (!me || !me.id) {
    alert("Please login to react to posts.");
    window.location.href = "login.html";
    return;
  }
  const posts = getPosts();
  const i = posts.findIndex((p) => String(p.id) === String(id));
  if (i === -1) return;
  if (!posts[i].reactionsBy || typeof posts[i].reactionsBy !== 'object') posts[i].reactionsBy = {};
  const uid = String(me.id);
  const current = posts[i].reactionsBy[uid];
  if (current === emoji) delete posts[i].reactionsBy[uid];
  else posts[i].reactionsBy[uid] = emoji;
  setPosts(posts);
}

function getLikeCount(p) {
  if (!p) return 0;
  if (Array.isArray(p.likedBy)) return p.likedBy.length;
  return typeof p.likes === "number" ? p.likes : 0;
}

function addPost(text, imageUrl) {
  const me = getCurrentUser();
  const p = {
    id: createId(),
    text,
    imageUrl,
    createdAt: Date.now(),
    authorId: me && me.id ? String(me.id) : null,
    authorName: me && me.username ? String(me.username) : "Guest",
    likedBy: [],
    likes: 0,
    reactionsBy: {},
  };
  const posts = getPosts();
  posts.unshift(p);
  setPosts(posts);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function iconHeart(filled) {
  const d = 'M12.1 21.55l-1.1-1.04C5.14 15.24 2 12.39 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.89-3.14 6.74-8.99 12.01l-1.1 1.04z';
  if (filled) return '<svg viewBox="0 0 24 24" class="h-6 w-6 text-red-500" fill="currentColor"><path d="'+d+'"></path></svg>';
  return '<svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="'+d+'"></path></svg>';
}

function iconComment() {
  return '<svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a4 4 0 01-4 4H9l-4 3v-3H5a4 4 0 01-4-4V7a4 4 0 014-4h12a4 4 0 014 4v8z"></path></svg>';
}

function iconShare() {
  return '<svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path></svg>';
}

function iconSave() {
  return '<svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-6-4-6 4V3z"></path></svg>';
}

function iconPencil() {
  return '<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21v-4.586l12.293-12.293 4.586 4.586L7.586 21H3z"></path><path d="M14.5 4.5l5 5"></path></svg>';
}

function iconTrash() {
  return '<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M6 7l1-3h10l1 3"></path><path d="M6 7v12a2 2 0 002 2h8a2 2 0 002-2V7"></path></svg>';
}

function iconSun() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>';
}

function iconMoon() {
  return '<svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"></path></svg>';
}

function renderPostHTML(post) {
  const imgSrc = (post.imageUrl || post.image || "");
  const img = imgSrc && String(imgSrc).trim()
    ? `<img src="${escapeHtml(String(imgSrc).trim())}" class="mt-3 rounded-xl w-full object-cover max-h-80 shadow-sm" alt="">`
    : "";
  const time = new Date(post.createdAt).toLocaleString();
  const me = getCurrentUser();
  const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
  const isLiked = me && me.id ? likedBy.includes(String(me.id)) : false;
  const count = getLikeCount(post);
  const heart = iconHeart(isLiked);
  const isOwner = me && me.id && String(post.authorId) === String(me.id);
  const rc = getReactionCounts(post);
  const summary = EMOJIS.map((e)=> rc[e] > 0 ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs">${e}<span>${rc[e]}</span></span>` : '').join('');
  if (editingId === String(post.id)) {
    const safeText = escapeHtml(post.text || "");
    const safeImg = escapeHtml(imgSrc || "");
    return `
      <div class="bg-white/80 dark:bg-gray-800/80 p-4 rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 transition">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">${escapeHtml((post.authorName || 'G').slice(0,1).toUpperCase())}</div>
            <div>
              <div class="font-semibold text-gray-800 dark:text-gray-100">${escapeHtml(post.authorName || 'Guest')}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Editing • ${time}${post.editedAt ? ` • Edited` : ''}</div>
            </div>
          </div>
        </div>
        <textarea id="editText-${post.id}" class="mt-3 w-full border border-gray-300 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Update text...">${safeText}</textarea>
        <input id="editImage-${post.id}" type="text" value="${safeImg}" placeholder="Image URL (optional)" class="mt-2 w-full border border-gray-300 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <div class="mt-3 flex items-center gap-2 justify-end">
          <button class="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 hover:dark:bg-gray-600 text-gray-700 dark:text-gray-200" data-action="cancel-edit" data-id="${post.id}">Cancel</button>
          <button class="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white" data-action="save-edit" data-id="${post.id}">Save</button>
        </div>
      </div>
    `;
  }
  return `
    <div class="bg-white/80 dark:bg-gray-800/80 p-4 rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 transition">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">${escapeHtml((post.authorName || 'G').slice(0,1).toUpperCase())}</div>
        <div>
          <div class="font-semibold text-gray-800 dark:text-gray-100">${escapeHtml(post.authorName || 'Guest')}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">${time}${post.editedAt ? ` • Edited` : ''}</div>
        </div>
      </div>
      <div class="mt-3 text-gray-800 dark:text-gray-100 whitespace-pre-wrap">${escapeHtml(post.text)}</div>
      ${img}
      <div class="mt-3 flex items-center justify-between">
        <span class="flex flex-wrap gap-1">${summary}</span>
        <div class="flex items-center gap-2">
          <button class="h-9 w-9 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 hover:dark:bg-gray-600 text-gray-700 dark:text-gray-200 transition flex items-center justify-center" data-action="like" data-id="${post.id}" aria-label="Like">${heart}</button>
          <span class="text-gray-800 dark:text-gray-200 font-semibold">${count}</span>
          <button class="h-9 w-9 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 hover:dark:bg-gray-600 text-gray-700 dark:text-gray-200 transition flex items-center justify-center" data-action="react-menu" data-id="${post.id}" aria-label="React">🙂</button>
          ${isOwner ? `<button class="h-9 w-9 rounded-md bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 transition flex items-center justify-center" data-action="edit" data-id="${post.id}" aria-label="Edit">${iconPencil()}</button>` : ``}
          ${isOwner ? `<button class="h-9 w-9 rounded-md bg-red-100 hover:bg-red-200 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 transition flex items-center justify-center" data-action="delete" data-id="${post.id}" aria-label="Delete">${iconTrash()}</button>` : ``}
        </div>
      </div>
      <div id="reactMenu-${post.id}" class="mt-2 hidden">
        <div class="flex items-center gap-2">
          ${EMOJIS.map((e)=>`<button class="h-8 px-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100" data-action="react" data-id="${post.id}" data-emoji="${e}">${e}</button>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderPosts() {
  const q = searchInput ? String(searchInput.value).trim().toLowerCase() : "";
  const sort = filterSelect ? filterSelect.value : "latest";
  let posts = getPosts();
  if (q) posts = posts.filter((p) => String(p.text).toLowerCase().includes(q));
  if (sort === "latest") posts.sort((a, b) => b.createdAt - a.createdAt);
  else if (sort === "oldest") posts.sort((a, b) => a.createdAt - b.createdAt);
  else if (sort === "liked") posts.sort((a, b) => getLikeCount(b) - getLikeCount(a) || b.createdAt - a.createdAt);
  postsContainer.innerHTML = posts.map(renderPostHTML).join("");
}

function updateFilterLabel() {
  if (!filterLabel || !filterSelect) return;
  const v = filterSelect.value;
  let text = "Latest First";
  if (v === "oldest") text = "Oldest First";
  else if (v === "liked") text = "Most Liked";
  filterLabel.textContent = text;
}

function setActiveFilterMenu() {
  if (!filterDropdownMenu || !filterSelect) return;
  const v = filterSelect.value;
  const items = filterDropdownMenu.querySelectorAll('button[data-filter]');
  items.forEach((el) => {
    const isActive = el.getAttribute('data-filter') === v;
    el.classList.remove('bg-gray-100','dark:bg-gray-700');
    if (isActive) el.classList.add('bg-gray-100','dark:bg-gray-700');
  });
}

function toggleLike(id) {
  const me = getCurrentUser();
  if (!me || !me.id) {
    alert("Please login to like posts.");
    window.location.href = "login.html";
    return;
  }
  const posts = getPosts();
  const i = posts.findIndex((p) => String(p.id) === String(id));
  if (i === -1) return;
  const p = posts[i];
  if (!Array.isArray(p.likedBy)) p.likedBy = [];
  const uid = String(me.id);
  const idx = p.likedBy.indexOf(uid);
  if (idx >= 0) p.likedBy.splice(idx, 1);
  else p.likedBy.push(uid);
  p.likes = p.likedBy.length;
  setPosts(posts);
}

function deletePost(id) {
  const me = getCurrentUser();
  let posts = getPosts();
  const before = posts.length;
  posts = posts.filter((p) => !(String(p.id) === String(id) && me && me.id && String(p.authorId) === String(me.id)));
  if (posts.length === before) return;
  setPosts(posts);
}

function startEdit(id) {
  const me = getCurrentUser();
  const posts = getPosts();
  const p = posts.find((x) => String(x.id) === String(id));
  if (!p) return;
  if (!(me && me.id && String(p.authorId) === String(me.id))) return;
  editingId = String(id);
}

function updatePost(id, newText, newImageUrl) {
  const me = getCurrentUser();
  const posts = getPosts();
  const i = posts.findIndex((p) => String(p.id) === String(id));
  if (i === -1) return;
  if (!(me && me.id && String(posts[i].authorId) === String(me.id))) return;
  const t = String(newText || "").trim();
  const img = String(newImageUrl || "").trim();
  posts[i].text = t;
  posts[i].imageUrl = img || "";
  posts[i].editedAt = Date.now();
  setPosts(posts);
  editingId = null;
}

function init() {
  const me = getCurrentUser();
  if (!me || !me.id) {
    window.location.href = "login.html";
    return;
  }
  const savedTheme = localStorage.getItem("theme");
  const mode = savedTheme === "dark" ? "dark" : "light";
  setTheme(mode);
  if (usernameEl) {
    const n = (me && me.username) ? me.username : localStorage.getItem("username");
    if (n) usernameEl.textContent = n;
  }
  updateFilterLabel();
  setActiveFilterMenu();
  renderStories();
  renderPosts();
}

document.addEventListener("DOMContentLoaded", init);

if (postBtn) {
  postBtn.addEventListener("click", function () {
    const text = postText ? String(postText.value).trim() : "";
    const imageUrl = postImage ? String(postImage.value).trim() : "";
    if (!text && !imageUrl) return;
    addPost(text, imageUrl);
    if (postText) postText.value = "";
    if (postImage) postImage.value = "";
    renderPosts();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", function () {
    renderPosts();
  });
}

if (filterSelect) {
  filterSelect.addEventListener("change", function () {
    applyFilter(filterSelect.value);
  });
}

if (filterDropdownBtn) {
  filterDropdownBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (filterDropdownMenu) filterDropdownMenu.classList.toggle("hidden");
  });
}

if (filterDropdownMenu) {
  filterDropdownMenu.addEventListener("click", function (e) {
    const t = e.target;
    const btn = t && t.closest ? t.closest("button[data-filter]") : null;
    if (!btn) return;
    const v = btn.getAttribute("data-filter");
    if (!v) return;
    applyFilter(v);
    filterDropdownMenu.classList.add("hidden");
  });
}

document.addEventListener("click", function () {
  if (filterDropdownMenu) filterDropdownMenu.classList.add("hidden");
});

if (postsContainer) {
  postsContainer.addEventListener("click", function (e) {
    const t = e.target;
    const btn = t && t.closest ? t.closest("button[data-action]") : null;
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const action = btn.getAttribute("data-action");
    if (!id || !action) return;
    if (action === "like") {
      toggleLike(id);
    } else if (action === "react-menu") {
      const m = document.getElementById(`reactMenu-${id}`);
      if (m) m.classList.toggle("hidden");
      return;
    } else if (action === "react") {
      const emoji = btn.getAttribute("data-emoji");
      if (!emoji) return;
      updateReaction(id, emoji);
      const m = document.getElementById(`reactMenu-${id}`);
      if (m) m.classList.add("hidden");
    } else if (action === "delete") {
      const ok = confirm("Delete this post?");
      if (!ok) return;
      deletePost(id);
    } else if (action === "edit") {
      startEdit(id);
    } else if (action === "cancel-edit") {
      editingId = null;
    } else if (action === "save-edit") {
      const txt = document.getElementById(`editText-${id}`);
      const img = document.getElementById(`editImage-${id}`);
      const newText = txt ? txt.value : "";
      const newImg = img ? img.value : "";
      updatePost(id, newText, newImg);
    }
    renderPosts();
  });
}

if (themeToggle) {
  themeToggle.addEventListener("click", function () {
    const isDark = document.documentElement.classList.contains("dark");
    const next = isDark ? "light" : "dark";
    localStorage.setItem("theme", next);
    setTheme(next);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("username");
    window.location.href = "login.html";
  });
}
if (sidebar) {
  sidebar.addEventListener("click", function (e) {
    const t = e.target;
    const btn = t && t.closest ? t.closest("button[data-nav]") : null;
    if (!btn) return;
    const nav = btn.getAttribute("data-nav");
    if (nav === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (nav === "search") {
      if (searchInput) {
        searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
        searchInput.focus();
      }
    } else if (nav === "create") {
      showCreateSection();
    }
  });
}
if (mobileNav) {
  mobileNav.addEventListener("click", function (e) {
    const t = e.target;
    const btn = t && t.closest ? t.closest("button[data-nav]") : null;
    if (!btn) return;
    const nav = btn.getAttribute("data-nav");
    if (nav === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (nav === "search") {
      if (searchInput) {
        searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
        searchInput.focus();
      }
    } else if (nav === "create") {
      showCreateSection();
    } else if (nav === "logout") {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("username");
      window.location.href = "login.html";
    }
  });
}
const logoutBtnMobile = document.getElementById("logoutBtnMobile");
if (logoutBtnMobile) {
  logoutBtnMobile.addEventListener("click", function (e) {
    e.preventDefault();
    localStorage.removeItem("currentUser");
    localStorage.removeItem("username");
    window.location.href = "login.html";
  });
}
function getAllUsers() {
  const raw = localStorage.getItem("users");
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
}

function renderStories() {
  if (!storiesContainer) return;
  const inner = storiesContainer.querySelector('div');
  const me = getCurrentUser();
  const users = getAllUsers();
  const order = [];
  if (me) order.push(me);
  for (let i = 0; i < users.length; i++) {
    if (!me || users[i].id !== me.id) order.push(users[i]);
  }
  const items = order.slice(0, 12).map((u) => {
    const name = (u && u.username) ? String(u.username) : 'Guest';
    const initial = name.slice(0,1).toUpperCase();
    return `
      <div class="flex flex-col items-center">
        <div class="p-1 rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500">
          <div class="h-16 w-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-800 dark:text-gray-100">${escapeHtml(initial)}</div>
        </div>
        <div class="mt-1 text-xs text-gray-700 dark:text-gray-300 max-w-16 truncate">${escapeHtml(name)}</div>
      </div>
    `;
  }).join('');
  inner.innerHTML = items || '';
}

// ---- Config ----
// Point this to your running backend (see backend/.env -> PORT)
   const API_BASE = "http://localhost:5000/api";

// ---- State ----
let token = localStorage.getItem("bn_token") || null;
let user = JSON.parse(localStorage.getItem("bn_user") || "null");
let currentPostId = null;

// ---- Helpers ----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

function showView(name) {
  $$(".view").forEach((v) => v.classList.remove("active"));
  $(`#view-${name}`).classList.add("active");
}

function refreshNav() {
  const loggedIn = !!token;
  $("#navAuth").style.display = loggedIn ? "none" : "inline-block";
  $("#logoutBtn").style.display = loggedIn ? "inline-block" : "none";
  const canWrite = user && ["author", "editor", "admin"].includes(user.role);
  $("#navWrite").style.display = canWrite ? "inline-block" : "none";
  $("#navMine").style.display = canWrite ? "inline-block" : "none";
}

// ---- Nav ----
$("#nav").addEventListener("click", (e) => {
  const view = e.target.dataset.view;
  if (!view) return;
  showView(view);
  if (view === "mine") loadMyPosts();
});
$("#logoutBtn").addEventListener("click", () => {
  token = null; user = null;
  localStorage.removeItem("bn_token"); localStorage.removeItem("bn_user");
  refreshNav(); showView("feed");
});
$("#backToFeed").addEventListener("click", () => showView("feed"));

// ---- Auth ----
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const { data } = await api("/auth/login", {
      method: "POST",
      body: { email: fd.get("email"), password: fd.get("password") },
    });
    token = data.token; user = data.user;
    localStorage.setItem("bn_token", token); localStorage.setItem("bn_user", JSON.stringify(user));
    $("#authMsg").textContent = `Welcome back, ${user.name}!`;
    refreshNav(); showView("feed"); loadFeed();
  } catch (err) { $("#authMsg").textContent = err.message; }
});

$("#registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const { data } = await api("/auth/register", {
      method: "POST",
      body: { name: fd.get("name"), email: fd.get("email"), password: fd.get("password"), role: fd.get("role") },
    });
    token = data.token; user = data.user;
    localStorage.setItem("bn_token", token); localStorage.setItem("bn_user", JSON.stringify(user));
    $("#authMsg").textContent = `Account created. Welcome, ${user.name}!`;
    refreshNav(); showView("feed"); loadFeed();
  } catch (err) { $("#authMsg").textContent = err.message; }
});

// ---- Feed ----
async function loadFeed(search = "") {
  try {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    const { data } = await api(`/posts${q}`);
    renderPostsList(data, "#postsList", { showStatus: false });
  } catch (err) {
    $("#postsList").innerHTML = `<p class="msg">${err.message}</p>`;
  }
}
$("#searchBtn").addEventListener("click", () => loadFeed($("#searchInput").value));

function renderPostsList(posts, containerSel, { showStatus }) {
  const el = $(containerSel);
  if (!posts.length) { el.innerHTML = "<p>No posts yet.</p>"; return; }
  el.innerHTML = posts.map((p) => `
    <div class="post-card" data-id="${p._id}">
      <h3>${escapeHtml(p.name)}</h3>
      <p class="post-meta">by ${p.userID?.name || "Unknown"} · ${new Date(p.createdAt).toLocaleDateString()}
        ${showStatus ? ` · <strong>${p.status}</strong>` : ""} · ❤ ${p.likes}</p>
      <p>${escapeHtml((p.message || "").slice(0, 140))}...</p>
      ${(p.tags || []).map((t) => `<span class="tag-pill">${escapeHtml(t)}</span>`).join("")}
    </div>
  `).join("");
  el.querySelectorAll(".post-card").forEach((card) => {
    card.addEventListener("click", () => openPost(card.dataset.id));
  });
}

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---- Post detail + comments ----
async function openPost(id) {
  currentPostId = id;
  try {
    const { data: post } = await api(`/posts/${id}`, { auth: !!token });
    $("#postDetail").innerHTML = `
      <h2>${escapeHtml(post.name)}</h2>
      <p class="post-meta">by ${post.userID?.name || "Unknown"} · ${new Date(post.createdAt).toLocaleString()} · ❤ ${post.likes}</p>
      <div>${escapeHtml(post.message).replace(/\n/g, "<br/>")}</div>
      <button id="likeBtn">❤ Like</button>
    `;
    $("#likeBtn").addEventListener("click", async () => {
      await api(`/posts/${id}/like`, { method: "PATCH" });
      openPost(id);
    });
    showView("post");
    loadComments(id);
  } catch (err) { alert(err.message); }
}

async function loadComments(postId) {
  try {
    const { data: comments } = await api(`/posts/${postId}/comments`, { auth: !!token });
    const formHtml = token ? `
      <form id="commentForm">
        <textarea id="commentContent" rows="2" placeholder="Add a comment (goes to moderation)" required></textarea>
        <button type="submit">Post Comment</button>
      </form>` : `<p class="hint">Login to comment.</p>`;
    $("#commentsBox").innerHTML = `
      <h3>Comments (${comments.length})</h3>
      ${formHtml}
      ${comments.map((c) => `<div class="comment"><strong>${escapeHtml(c.userID?.name || "User")}:</strong> ${escapeHtml(c.content)}</div>`).join("")}
    `;
    if (token) {
      $("#commentForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          await api(`/posts/${postId}/comments`, {
            method: "POST", auth: true, body: { content: $("#commentContent").value },
          });
          loadComments(postId);
        } catch (err) { alert(err.message); }
      });
    }
  } catch (err) { $("#commentsBox").innerHTML = `<p class="msg">${err.message}</p>`; }
}

// ---- Write / AI ----
$("#aiGenerateBtn").addEventListener("click", async () => {
  const topic = $("#aiTopic").value.trim();
  if (!topic) return;
  $("#writeMsg").textContent = "Generating with AI...";
  try {
    const { data } = await api("/ai/generate-blog", { method: "POST", auth: true, body: { topic } });
    const text = data.generated;
    const titleMatch = text.match(/Title:\s*(.+)/i);
    const contentMatch = text.split(/Content:/i)[1];
    if (titleMatch) $("#postTitle").value = titleMatch[1].trim();
    $("#postMessage").value = (contentMatch || text).trim();
    $("#writeMsg").textContent = "AI draft generated — review and edit before saving.";
  } catch (err) { $("#writeMsg").textContent = err.message; }
});

$("#postForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const tags = (fd.get("tags") || "").split(",").map((t) => t.trim()).filter(Boolean);
  try {
    await api("/posts", {
      method: "POST", auth: true,
      body: { name: fd.get("name"), message: fd.get("message"), photo: fd.get("photo"), tags, status: fd.get("status") },
    });
    $("#writeMsg").textContent = "Post saved!";
    e.target.reset();
  } catch (err) { $("#writeMsg").textContent = err.message; }
});

// ---- My posts ----
async function loadMyPosts() {
  try {
    const { data } = await api("/posts/mine", { auth: true });
    renderPostsList(data, "#myPostsList", { showStatus: true });
  } catch (err) { $("#myPostsList").innerHTML = `<p class="msg">${err.message}</p>`; }
}

// ---- Init ----
refreshNav();
loadFeed();

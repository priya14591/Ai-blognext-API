# AI BlogNest

Full-stack blog CMS: Node.js/Express/MongoDB backend with JWT auth, role-based
access (admin/editor/author/reader), categories, comments, and Google Gemini AI
blog generation — plus a plain HTML/CSS/JS frontend that talks to it.

## Folder structure
```
BlogNest/
  backend/     Express API (Mongoose models, controllers, routes, middleware)
  frontend/    Static site (index.html, style.css, app.js) - no build step
```

## 1. Backend setup
```bash
cd backend
npm install
cp .env.example .env
```
Open `.env` and fill in your OWN values (nothing is pre-filled — no links or
keys are included in this project):
- `MONGO_URI` — your MongoDB connection string (local `mongodb://localhost:27017/blognest`
  or your own MongoDB Atlas URI)
- `JWT_SECRET` — any long random string
- `GEMINI_API_KEY` — your own Google Gemini API key (only needed for the AI
  generate-blog / summarize / faq endpoints)

Start it:
```bash
npm start        # or: npm run dev  (nodemon, auto-restart)
```
API runs at `http://localhost:5000/api` by default. Health check:
`GET http://localhost:5000/api/health`

## 2. Frontend setup
No build tools needed — it's plain HTML/CSS/JS.
1. Open `frontend/app.js` and confirm `API_BASE` points at your backend
   (defaults to `http://localhost:5000/api`).
2. Open `frontend/index.html` directly in a browser, or serve the folder:
   ```bash
   cd frontend
   npx serve .        # or any static file server
   ```

## 3. Roles
- **reader** — browse published posts, comment (comments go to moderation)
- **author** — write posts (draft / submit for review), AI-assist, manage own posts
- **editor** — everything author can, plus approve/publish posts, moderate comments, manage categories
- **admin**  — everything, plus change any user's role (`PATCH /api/auth/users/:id/role`)

New signups from the frontend can only pick reader/author; promote someone to
editor/admin directly in MongoDB or via the admin-role endpoint once you have
your first admin.

## 4. Key API routes
| Method | Route | Access |
|---|---|---|
| POST | /api/auth/register | public |
| POST | /api/auth/login | public |
| GET  | /api/posts | public (published only) / privileged sees all via `?status=` |
| POST | /api/posts | author, editor, admin |
| PUT/DELETE | /api/posts/:id | owner, editor, admin |
| POST | /api/posts/:postId/comments | logged in |
| PATCH | /api/comments/:id/moderate | editor, admin |
| POST | /api/ai/generate-blog | author, editor, admin |
| POST | /api/ai/summarize | author, editor, admin |
| POST | /api/ai/faq | logged in |

## Security notes
- Passwords hashed with bcrypt, JWT auth, helmet, CORS, mongo-sanitize
  (NoSQL injection guard), and rate limiting (stricter on auth routes) are
  already wired in `backend/src/app.js`.
- `.env` is intentionally NOT included — only `.env.example` with empty
  placeholders. Never commit your real `.env`.

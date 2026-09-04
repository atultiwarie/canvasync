# CanvasSync

> A real-time collaborative canvas app — draw, share, export, and analyze together.

Built end-to-end with a custom Canvas 2D rendering engine (no third-party drawing libraries), WebSocket-powered live collaboration, multimodal AI board summarization, role-based access control, and a fully responsive UI optimized across desktop, tablet, and mobile.

---

## ✦ Live Demo

> _Add your deployed URL here_

---

## Tech Stack

| Layer        | Technologies                                                           |
| ------------ | ---------------------------------------------------------------------- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Socket.IO Client |
| **Backend**  | Node.js, Express 5, TypeScript, Socket.IO, MongoDB + Mongoose          |
| **Auth**     | JWT (access + refresh tokens), HTTP-only cookies, bcrypt               |
| **Realtime** | WebSocket rooms per board, cursor broadcasting, live element sync      |
| **AI**       | Google Gemini Multimodal Vision API (`@google/genai`)                  |
| **Export**   | HTML Canvas API (PNG), SVG generation, JSON serialization              |

---

## Features

### 🎨 Custom Canvas Engine

A from-scratch 2D rendering engine built directly on the browser's `HTMLCanvasElement` API — no Fabric.js, no Konva, no shortcuts.

- **6 drawing tools** — Rectangle, Ellipse, Line, Arrow, Freehand, Text
- **Select tool** with drag-to-move, resize handles, and rotation handle
- **Pan** (hand tool) and **pinch/scroll zoom** with camera transform
- **Undo / Redo** via a custom operation history stack
- All elements stored in world-space coordinates — zoom/pan never affect element coordinates

---

### 📱 Responsive UI / UX (Mobile, Tablet & Desktop)

Tailored layouts for all form factors:

- **Wide Desktop (`xl:`, $\ge 1280\text{px}$)**:
  - Top header split into **Left Cluster** (navigation & title) and **Right Cluster** (actions & user avatar).
  - Drawing toolbar centered at the top with text labels, leaving 200px+ free margin on both sides with zero collision.
- **Laptops, Tablets & Mobile (`< xl`, $< 1280\text{px}$)**:
  - Ergonomic **floating bottom toolbar island** with 34px icon-only buttons for all tools and undo/redo.
  - Top row is completely uncluttered: only Left title and Right compact action icons.
  - Zoom controls anchored to the bottom-left corner (`bottom-4 left-4`).
  - Full-screen slide-over AI summary and modal dialogs with responsive scroll views.
  - 1-to-2 column responsive dashboard cards with touch-friendly targets.

---

### 🤖 AI Board Summarization (Multimodal Vision)

Analyze whiteboard diagrams and flows with one click using Google Gemini Flash vision.

- **Offscreen Snapshot**: Captures clean in-memory canvas pixels at high density without triggering a download.
- **Structured Analysis**:
  - Executive title and high-level summary of the whiteboard.
  - Detected architecture nodes, services, actors, and flowchart steps.
  - Action items, missing connections, and structural critiques.
- **Interactive UI**: Slide-over drawer with shimmer loading animations, one-click "Copy Markdown", and re-analysis triggers.

---

### 🗂️ Board Dashboard

- Create, rename, and delete boards
- Boards list shows both **owned** and **shared** boards in one view
- Board title editable inline on the canvas

---

### 🔴 Real-Time Collaboration

Multiple users on the same board see each other's changes and cursors live.

- Every element mutation (`add`, `update`, `delete`) is emitted over a Socket.IO room
- **Live remote cursors** — each collaborator's cursor position shown with their name label
- **Conflict resolution** — stale socket updates are discarded using `updatedAt` timestamps
- Board state is debounce-saved to MongoDB every 1.5–2 seconds via the socket

---

### 🔗 Share via Link & QR Code

Invite anyone to a board with a single click.

- Board owner generates an **invite link** with configurable role (`Editor` / `Viewer`) and expiry (`1d / 7d / 30d / never`)
- Invite token is a **short random hex string** (32 chars) stored in MongoDB — clean URLs, no JWT in the address bar
- **QR code** generated in the share modal (via `qrcode.react`) — downloadable as PNG
- Unauthenticated users who open an invite link are redirected to login and returned to the join page automatically
- **Layered role enforcement** — checked on both the REST API (save) and WebSocket (element mutations), so viewers cannot bypass via DevTools

#### Viewer vs Editor

| Capability                | Viewer | Editor / Owner |
| ------------------------- | :----: | :------------: |
| See the canvas            |   ✅   |       ✅       |
| See live cursors          |   ✅   |       ✅       |
| Draw / edit elements      |   ❌   |       ✅       |
| Save board                |   ❌   |       ✅       |
| Share board               |   ❌   |       ✅       |
| Export (PNG / SVG / JSON) |   ✅   |       ✅       |
| AI Board Summary          |   ✅   |       ✅       |

---

### 📤 Export

Download the board in three formats — no server involved, all processed client-side.

| Format   | How it works                                                                                                                                                                                             |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **JSON** | Serializes the elements array with version metadata. Re-importable back into CanvasSync.                                                                                                                 |
| **PNG**  | Offscreen `<canvas>` render at **2× pixel density** with a computed export camera — ignores current pan/zoom, auto-centers content with padding.                                                         |
| **SVG**  | Each element converted to its SVG primitive (`<rect>`, `<ellipse>`, `<polyline>`, `<text>`) using world coordinates with a `viewBox`. Infinitely scalable — opens in Figma, Illustrator, or any browser. |

Export is available to **all roles**, including view-only collaborators.

---

## Architecture Highlights

### Authentication

- Access token (short-lived) stored in memory via Zustand
- Refresh token stored in an HTTP-only cookie
- Axios interceptor auto-refreshes on 401 and retries the original request
- Socket.IO middleware validates the access token from the cookie on connection

### Canvas Rendering Pipeline

```
Pointer / Touch events
    ↓
Interaction handlers (pointer.handler.ts)
    ↓
Canvas Store (Zustand) — elements[], camera, activeTool
    ↓
renderer.ts — renderElements(ctx, elements, camera)
    ↓
HTMLCanvasElement (re-renders on every state change via useEffect)
```

### WebSocket Event Flow

```
User draws element
    ↓
emitAdd() → socket.emit("element-add", { boardId, element })
    ↓
Server: canEdit() check → boardModel query
    ↓
socket.to(boardId).emit("element-added", element)
    ↓
All other clients in room → canvas store updated → canvas re-renders
```

### AI Vision Flow

```
User clicks "AI Summary"
    ↓
export.utils.ts: generateBoardPngBase64() (offscreen render)
    ↓
POST /api/boards/:boardId/ai/summarize
    ↓
Backend: Gemini Multimodal Vision analysis
    ↓
Structured response (Title, Summary, Components, Insights)
    ↓
AISummaryDrawer: formatted markdown + action items
```

---

## Project Structure

```
canvasSync/
├── backend/
│   └── src/
│       ├── controllers/       Express route handlers (board, ai, auth)
│       ├── services/          Business logic (board, ai.service)
│       ├── models/            Mongoose schemas (User, Board)
│       ├── routes/            REST API routes
│       ├── socket/            Socket.IO event handlers + auth middleware
│       ├── middleware/        Auth, validation
│       ├── validators/        Zod schemas
│       └── utils/             JWT helpers
│
└── frontend/
    └── src/
        ├── features/
        │   ├── auth/          Login, Register, auth store, UserMenu
        │   ├── boards/        Board dashboard, CanvasPage, JoinBoardPage, board service
        │   └── canvas/
        │       ├── components/    CanvasBoard, CanvasToolbar (Responsive), ShareModal, ExportModal, AISummaryDrawer, PropertiesPanel
        │       ├── engine/        renderer.ts, coordinates.ts, hitTest.ts, export.utils.ts
        │       ├── hooks/         useSocket.ts
        │       ├── interaction/   pointer.handler.ts, keyboard.handlers.ts
        │       ├── state/         canvas.store.ts
        │       └── history/       undo/redo operation stack
        └── lib/               Axios instance, Socket.IO client
```

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/your-username/canvasSync.git
cd canvasSync

# 2. Backend
cd backend
cp .env.example .env        # fill in MONGO_URI, JWT secrets, GEMINI_API_KEY
npm install
npm run dev                 # http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### Environment Variables (backend)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/canvassync
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
```

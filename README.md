# StrangerConnect 🚀
> Ultra-fast, anonymous, zero-registration ephemeral real-time chat platform with client-side compressed photo sharing and zero data persistence.

---

## 📋 What We Have Built Up to Now (Project Milestones)

Here is a chronological and architectural summary of everything accomplished in this project so far:

### Milestone 1: Architectural Audit & Flaw Resolution
- **BRD/HLD Review**: Audited the initial 6-page blueprint modeled after OpenTalk.club and Ohoo.chat.
- **Identified & Fixed Critical Blueprint Flaws**:
  1. *Zombie Partner Bug*: The reference `cleanupSession` did not re-queue the skipping user and left the remaining partner stranded in an unhandled state. Fixed with atomic teardown and mutual notification.
  2. *Single Queue Bottleneck*: Corrected multi-mode queue collisions so users aren't matched into unintended communication modes.
  3. *Render 100GB Outbound Cap Risk*: Relaying large photos over WebSockets would deplete free-tier bandwidth. Solved via aggressive client-side canvas downscaling (<60KB WebP) and strict buffer limits.
  4. *Mobile 4G/5G NAT Traversal*: Identified symmetric NAT drops for future WebRTC streams and outlined free TURN integration (Metered.ca).
  5. *Bypassable Moderation*: Replaced insecure sender-only filtering with receiver-side protective blur by default (*"Click to view photo"*).
- **Scope Agreement**: Streamlined the MVP to prioritize **high-speed text chat and ephemeral photo sharing**, deferring audio/video calling to maintain a true $0/month infrastructure cost.

---

### Milestone 2: Backend Signaling & In-Memory Matchmaker (`/server`)
- **Zero-Database Persistence (0 Bytes Disk/DB)**:
  - Built with **Node.js + Express + Socket.io**.
  - All sessions, waiting queues, and active room pairings live strictly in volatile RAM using native ES6 `Set` and `Map` collections ($O(1)$ constant-time lookup).
  - When a user disconnects or skips, all pointers are immediately deleted and garbage-collected by the V8 runtime.
- **FIFO Matchmaking Engine**:
  - Pairs idle strangers in $<50\text{ms}$.
  - Instant re-queueing on **Skip** (<kbd>Esc</kbd>) without orphaned rooms or stale sockets.
- **In-Memory Rate Limiting**:
  - Limits users to $\le 5\text{ msgs/sec}$ per socket to prevent automated flooding or script attacks.
- **Keep-Alive Endpoint (`/health`)**:
  - Serves HTTP 200 JSON with uptime metrics for free 10-minute cron pings, preventing Render free-tier containers from spinning down.
- **Port Setup**: Defaulted to port **`8080`**.

---

### Milestone 3: Client-Side Ephemeral Photo Compression (`/client`)
- **HTML5 Canvas Compression Engine (`client/src/utils/imageCompressor.js`)**:
  - Intercepts camera and gallery image selections directly in the browser.
  - Downscales images to max 800px width/height while preserving aspect ratio.
  - Re-encodes the image into lightweight WebP format at 0.75 quality ($<60\text{KB}$ payload).
  - Completely eliminates the need for expensive third-party image hosting or cloud buckets.
- **Safety Blur by Default**:
  - Received photos are blurred via frosted glass CSS filter until the recipient explicitly taps to reveal.
  - Includes a quick "Hide photo" toggle to re-blur.

---

### Milestone 4: Responsive Mobile Viewport & Keyboard Handling
- **Virtual Keyboard Adaptation**:
  - Integrated `interactive-widget=resizes-content` in the viewport meta tag.
  - Added dynamic `window.visualViewport` listeners to update `--app-height` in real-time, preventing mobile virtual keyboards on iOS Safari and Android Chrome from clipping the header or covering the text input dock.

---

### Milestone 5: UI Redesign — From Developer Specs to Figma Classic UI
- **Eliminated Developer Jargon**:
  - Removed robotic technical specs (`<50ms FIFO`, `Volatile RAM`, `Canvas WebP <60KB`, `W: 580 • H: Auto`, `FRAME 1`, `STATUS: MATCHMAKING_ACTIVE`).
- **Crafted a Clean, Classic, User-Friendly Interface**:
  - **Landing View**: Warm hero headline (*"Talk to strangers, make new friends"*), clear value badges (100% Anonymous, Private & Ephemeral, Safe Photo Sharing), and community guidelines (*"Please be kind, polite, and respectful"*).
  - **Searching Reticle**: Friendly scanning status, pulsing radar animation, and icebreaker prompts (*"Tip: Break the ice with a friendly greeting!"*).
  - **Chat Canvas**: Clear "Stranger" status, high-contrast **"Next Stranger"** button with <kbd>Esc</kbd> keycap, and clean text input dock.
- **Port Setup**: Defaulted to port **`3000`**.

---

### Milestone 6: Automated End-to-End Testing & Verification
- **E2E Test Suite (`tests/test-e2e.cjs`)**:
  - Automated script that spins up 2 concurrent clients, puts them in the queue, verifies instant pairing, tests bidirectional text message relay, tests ephemeral photo transmission, triggers skip/re-queue, and confirms clean partner teardown.
  - **All 5 tests pass with 100% success on port 8080.**

---

## ⚡ Zero-Cost ($0/Month) Tech Stack

| Layer | Technology | Provider ($0/Month) | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend SPA** | React 19 + Vite + Vanilla CSS | **Cloudflare Pages** or **Vercel** | Global edge CDN, unlimited bandwidth, SSL |
| **Backend Signaling** | Node.js + Express + Socket.io | **Render.com** (Free Web Tier) | In-memory FIFO queue, relay, 512MB RAM |
| **Keep-Alive Monitor**| HTTP GET ping to `/health` | **Cron-job.org** or **UptimeRobot** | Pings every 10 mins to keep Render awake 24/7 |
| **Data Persistence** | Native ES6 `Map` & `Set` in RAM | **0 Bytes Storage** | $0 (No database, zero disk logs) |
| **Media Compression**| HTML5 Canvas WebP (<60KB) | **Client Browser CPU/GPU** | $0 (Zero server image processing) |

---

## 📁 Repository Structure

```
RandomChat/
├── client/                     # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Live online count (● 248 online now), brand logo
│   │   │   ├── LandingHero.jsx     # Friendly hero, value badges, community guidelines
│   │   │   ├── SearchingOverlay.jsx# Radar pulse, icebreaker tips, cancel button
│   │   │   ├── ChatView.jsx        # Active chat view, Next Stranger (Esc), input dock
│   │   │   └── MessageItem.jsx     # Text bubbles & blurred photos with tap-to-reveal
│   │   ├── utils/
│   │   │   └── imageCompressor.js  # HTML5 Canvas client-side compressor (<60KB WebP)
│   │   ├── socket.js               # Auto-reconnecting Socket.io client (Port 8080)
│   │   ├── index.css               # Design tokens, Outfit/Inter typography, 100dvh
│   │   ├── App.css                 # Figma-inspired classic UI component styles
│   │   └── App.jsx                 # App state machine & visual viewport keyboard handler
│   ├── index.html                  # Responsive head configuration & fonts
│   └── package.json
│
├── server/                     # Backend Signaling Server (Node.js + Socket.io)
│   ├── server.js                   # In-memory FIFO queue, active room map, rate limiter, /health
│   ├── package.json
│   └── .env.example
│
├── tests/
│   └── test-e2e.cjs                # Automated 2-client E2E socket matchmaking & chat test suite
├── package.json                    # Monorepo runner scripts
└── README.md                       # Complete project documentation
```

---

## 🚀 Running Locally

### 1. Start the Backend Server (Port 8080)
```bash
npm run start:server
```
*Health check available at:* `http://localhost:8080/health`

### 2. Start the Frontend Client (Port 3000)
```bash
npm run dev:client
```
*Open in your browser:* `http://localhost:3000/`

### 3. Run Automated End-to-End Tests
With the server running on port 8080:
```bash
npm run test:e2e
```
*Expected output:*
```
--- Starting Automated E2E Matchmaking & Chat Test ---
✅ Client A connected
✅ Client B connected
🎉 Client A received "matched" event!
🎉 Client B received "matched" event!
📩 Client B received message: Hello Stranger from Client A!
📸 Client A received ephemeral photo payload successfully!
🚪 Client A received "stranger_left" event as expected!
🌟 ALL 5 E2E TESTS PASSED PERFECTLY! 🌟
```

---

## ☁️ Zero-Cost Production Deployment Guide

### Phase 1: Deploy Backend to Render.com ($0/Month)
1. Push your repository to GitHub.
2. Sign in to [Render.com](https://render.com) with GitHub.
3. Click **New +** → **Blueprint** (or connect your repo with the included [`render.yaml`](file:///e:/RandomChat/render.yaml)).
4. Render automatically configures:
   - Root directory: `server`
   - Node environment
   - Free Web Service plan ($0/mo)
   - Health check path: `/health`
5. Click **Apply** to deploy and copy your live backend URL (e.g., `https://strangerconnect.onrender.com`).

### Phase 2: Setup 24/7 Keep-Alive Monitor (Free)
1. Create a free account on [cron-job.org](https://cron-job.org).
2. Create a new cron job:
   - **URL**: `https://your-service.onrender.com/health`
   - **Schedule**: Every 10 minutes (`*/10 * * * *`).
3. This keeps Render's free tier awake 24/7 without incurring inactivity sleep.

### Phase 3: Deploy Frontend to Cloudflare Pages ($0/Month)
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**.
2. Click **Create Application** → **Pages** → **Connect to Git**.
3. Select your repository and configure:
   - **Framework Preset**: `Vite`
   - **Root directory**: `client`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Add Environment Variable:
   - `VITE_SOCKET_URL` = `https://your-service.onrender.com` (your Render backend URL).
5. Click **Save and Deploy**. Cloudflare automatically applies the enterprise security headers from `client/public/_headers` and SPA routing from `client/public/_redirects`.

---

## 📊 Telemetry & Monitoring Setup (Optional)

StrangerConnect includes zero-PII monitoring hooks out of the box:

### PostHog (Anonymous Analytics)
Tracks bounce rates, match conversion, average chat duration, and skips without logging user identities or messages:
- Set `VITE_POSTHOG_KEY` in `client/.env`.

### Sentry (Error Tracking)
Catches edge-case browser crashes, failed canvas photo compression, or WebSocket dropouts:
- Frontend: Set `VITE_SENTRY_DSN` in `client/.env`.
- Backend: Set `SENTRY_DSN` in `server/.env`.


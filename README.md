# Gostart

A dating app built with React Native + Expo on the frontend and Node.js/Express + MongoDB on the backend. Made this for an internship assignment.

You can try it right now — download the APK or use the demo account on the live backend.

**APK:** [Download here](https://expo.dev/artifacts/eas/W8BUVjluutLddNT_aq724sAQTBbUEZcctr0MVpjQOHc.apk)  
**Demo login:** `demo@gostart.app` / `demo123`

---

## Running locally

You need Node 18+ and the Expo Go app on your phone.

**Backend**

```bash
cd backend
npm install
```

Create a `.env` file:
```
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=anything_you_want
PORT=3001
```

```bash
npm run dev
```

**Frontend**

```bash
cd frontend
npm install
npx expo start
```

Scan the QR code with Expo Go. Both your phone and PC need to be on the same WiFi. The frontend auto-detects the backend URL from Metro's host — no manual IP changes needed.

If you just want to test without running the backend, it's already deployed at `https://gostart-9cra.onrender.com` (first request might be slow, Render free tier cold starts).

---

## What's in the app

- **Auth** — register, login, JWT stored in AsyncStorage, remember me toggle
- **Onboarding** — 3 steps after signup: basics, personality stuff, photo
- **Find Match** — swipe button triggers a search, backend shuffles and returns up to 3 profiles based on your filters
- **Filters** — gender, age range (custom dual-thumb slider), location, religion, profession — all saved to DB
- **Chat** — real-time with WebSockets, optimistic messages, falls back to REST if disconnected
- **Credits** — 2 free on signup, costs 1 to start a new chat, re-opening an existing one is free
- **Profile** — edit your info, change photo, all saved to backend

---

## A few things worth noting

**WebSocket instead of socket.io** — socket.io-client breaks in Expo Go because it tries to import Node-only modules that Metro can't bundle. Switched to the native WebSocket API (built into React Native, no install needed) + `ws` on the backend. Same functionality, no crashes.

**Stale closure bug in the swipe button** — PanResponder gets created once and holds a reference to the initial callback. If you change your filters and swipe, it would search with the old filters. Fixed by keeping the callback in a ref that updates every render.

**Bidirectional gender matching** — wasn't enough to just check what the searcher wants, also had to check what the candidate wants. Seeded demo profiles don't have a saved preference so they match with everyone.

**Dual-thumb slider** — React Native's default Slider only has one thumb so I built a custom one with PanResponder. Web version uses two overlapping HTML range inputs.

---

## Stack

Frontend: React Native, Expo SDK 54, TypeScript, React Navigation, React Context  
Backend: Node.js, Express, TypeScript, MongoDB Atlas, Mongoose, JWT, ws

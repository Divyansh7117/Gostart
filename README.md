# Gostart — Dating App

A full-stack React Native dating app built with Expo (iOS + Android) and a Node.js/Express backend.

---

## What's inside

```
Gostart/
├── frontend/     ← React Native app (Expo) — runs on iOS & Android
└── backend/      ← Node.js + Express REST API
```

---

## How to run

### Prerequisites
- Node.js v18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS App Store / Google Play)
  OR an iOS Simulator (Mac only) / Android Emulator

---

### Step 1 — Start the backend

```bash
cd backend
npm install
npm run dev        # uses nodemon for auto-restart on file changes
# OR: npm start    # plain node
```

The backend starts at **http://localhost:3001**

**Demo login credentials:**
- Email: `demo@gostart.app`
- Password: `demo123`

---

### Step 2 — Update the API URL

Open `frontend/src/services/api.js` and update `BASE_URL`:

```js
// For iOS Simulator:
export const BASE_URL = "http://localhost:3001/api";

// For Android Emulator:
export const BASE_URL = "http://10.0.2.2:3001/api";

// For a real phone on the same WiFi:
export const BASE_URL = "http://YOUR_LOCAL_IP:3001/api";
// Find your IP with: ipconfig (Windows) or ifconfig (Mac)
```

---

### Step 3 — Start the frontend

```bash
cd frontend
npm install
npx expo start
```

This opens Expo DevTools in your browser. Then:
- **iOS device**: Scan the QR code with the Camera app
- **Android device**: Scan the QR code with the Expo Go app
- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal

---

## Features built

### Frontend (React Native + Expo)
| Screen | What it does |
|--------|-------------|
| Login / Register | Auth with JWT. Demo button for quick access. |
| Find Match | Hero background, credits widget, swipe-to-search button, filters |
| Filters Sheet | Looking for, age range, location, religion, profession |
| Searching | Animated logo + progress bar while backend searches |
| No Match | Friendly empty state with "Adjust Filters" CTA |
| Match Revealed | Full profile card with confirmation modal before connecting |
| Buy Credits | ₹2,000 for 5 credits with mock Razorpay integration |
| Messages | List of all conversations with latest message preview |
| Chat | Full messaging UI with optimistic sends |
| Community | Success stories + dating tips feed |
| Profile | User info, credit balance, logout |

### Backend (Node.js + Express)
| Endpoint | What it does |
|----------|-------------|
| `POST /api/auth/register` | Create account (bcrypt password hash + JWT) |
| `POST /api/auth/login` | Login + return JWT |
| `GET /api/auth/me` | Get current user from token |
| `GET /api/filters` | Load saved search filters |
| `POST /api/filters` | Save search filter preferences |
| `POST /api/matches/search` | Start async match search, returns searchId |
| `GET /api/matches/search/:id` | Poll search status ("searching"/"found"/"not_found") |
| `POST /api/matches/start-conversation` | Deduct 1 credit + create conversation |
| `GET /api/credits` | Get credit balance + available packages |
| `POST /api/credits/initiate-payment` | Create Razorpay order (mocked) |
| `POST /api/credits/confirm-payment` | Verify payment + top up credits |
| `GET /api/messages` | List all conversations |
| `GET /api/messages/:id` | Get messages in a conversation |
| `POST /api/messages/:id/send` | Send a message |

---

## Architecture decisions (plain English)

**Why Expo?**
Expo lets us run on iOS AND Android without any native build setup (no Xcode, no Android Studio needed for testing). The reviewer/interviewer just needs to install Expo Go and scan a QR code.

**Why JWT + AsyncStorage?**
JSON Web Tokens are stateless — the server doesn't need to remember sessions. The token is stored on the phone (AsyncStorage) and sent with every API request. On app restart, we check the stored token to auto-login.

**Why Context API instead of Redux?**
The app is small enough that React's built-in Context API handles state perfectly. Redux adds boilerplate that isn't needed at this scale.

**Why polling instead of WebSockets for match search?**
For simplicity. In production, you'd use Socket.IO or Firebase Realtime Database to push the match result to the client instead of the client repeatedly asking "are we done yet?".

**Why in-memory data instead of a real database?**
No setup friction. The reviewer can clone and run immediately. The data structure is identical to what a real MongoDB/PostgreSQL schema would look like — just swap the in-memory arrays for DB queries.

**Credits system:**
- New users get 2 free credits
- Each "Start Conversation" costs 1 credit  
- Buy 5 credits for ₹2,000 (via Razorpay, mocked here)
- Credits never expire

---

## Tech Stack

**Frontend:**
- React Native + Expo ~50
- React Navigation (Stack + Bottom Tabs)
- React Native Reanimated + Gesture Handler (swipe button)
- Expo Blur (modal overlay)
- Expo Linear Gradient (background gradients)
- AsyncStorage (JWT storage)
- @expo/vector-icons (Ionicons)

**Backend:**
- Node.js + Express
- bcryptjs (password hashing)
- jsonwebtoken (JWT auth)
- cors (cross-origin requests from the phone)
- uuid (unique IDs for conversations/searches)

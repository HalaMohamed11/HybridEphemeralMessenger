# 👻 Hybrid Ephemeral Messenger - Ghost Protocol

A real-time messaging platform designed for extreme privacy, combining Firebase authentication with ephemeral Redis-based message storage. Messages vanish automatically after a configurable TTL, while user identity remains verified.

## 🏗️ Architecture Overview

### Core Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Identity** | Firebase Authentication | Verified user authentication with Google OAuth |
| **Messages** | Redis Lists + TTL | Volatile message storage with automatic expiration |
| **Users** | MongoDB | Persistent user metadata (UID, name, photo) |
| **Real-Time** | Socket.io | Private 1-on-1 messaging & system event streaming |
| **Frontend** | Next.js + React | Terminal-styled dual-pane UI with system monitoring |
| **Backend** | Express.js | Token verification, message routing, presence tracking |

### Dual-Pane Terminal Interface

```
┌─────────────────────────────────────────────────────────────────┐
│ Auth Pane    │ Presence Tracker    │ Ghost Chat │ System Pulse  │
│ (Login/User) │ (Active Users)      │ (Messages) │ (Backend Log) │
├──────────────┼────────────────────┼────────────┼───────────────┤
│              │                    │            │               │
│              │                    │            │ [AUTH]...     │
│              │ • User A (●active) │ [You]: Hi! │ [SOCKET]...   │
│              │ • User B (●active) │ [B]: Hey!  │ [REDIS]...    │
│              │ • User C (●offline)│            │ [GHOST]...    │
│              │                    │            │               │
│              │                    │> Type...   │               │
└──────────────┴────────────────────┴────────────┴───────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (optional, for containerized setup)
- Firebase Project with Google OAuth enabled
- MongoDB instance (local or Atlas)
- Redis instance (local or cloud)

### Setup Steps

#### 1. **Clone & Install**

```bash
git clone <repo-url>
cd HybridEphemeralMessenger

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

#### 2. **Configure Environment Variables**

**Backend** (`backend/.env`):
```bash
# Firebase Service Account (JSON string or path)
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"..."}'

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ephemeral-messenger

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000

# Message TTL (seconds)
MESSAGE_TTL_SECONDS=120

# Twilio (optional, for MFA bonus)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

#### 3. **Start Services**

**Option A: Docker Compose (Recommended)**

```bash
# Update .env with Firebase credentials
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

**Option B: Local Development**

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: MongoDB
mongod

# Terminal 3: Backend
cd backend
npm run dev
# Listens on http://localhost:3001

# Terminal 4: Frontend
cd frontend
npm run dev
# Open http://localhost:3000
```

#### 4. **Access the Application**

1. Navigate to `http://localhost:3000`
2. Click **"Sign in with Google"**
3. Firebase redirects to Google OAuth flow
4. Backend verifies token & creates/updates user in MongoDB
5. Socket.io establishes connection with private room
6. System Pulse logs authentication lifecycle
7. Select a user from the Presence Tracker to start chatting

---

## 🔄 Message Flow Diagram

```
┌─────────────┐
│  User A     │
└──────┬──────┘
       │ 1. Google Login
       ├─────────────────────────────┐
       │                             │
       ▼                             ▼
   Firebase                    Backend: /auth/login
   OAuth Flow                   ├─ Verify token (Firebase Admin)
       │                        ├─ Create/get user (MongoDB)
       │                        ├─ Emit [AUTH] system event
       │                        └─ Return user profile
       │                             │
       └──────────────────┬──────────┘
                          │
                          ▼
                    Socket.io Connect
                    (auth: {token})
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
      [AUTH]         [SOCKET]       [PRESENCE]
      Event          Event          Broadcast
          │               │               │
          └───────────────┼───────────────┘
                          │
                    2. Send Message
                          │
                          ▼
                    Redis RPUSH
                    chat:A_B
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
      [REDIS]       Emit to B      TTL Set
      Event      (Socket.io)       (120s)
          │               │               │
          └───────────────┼───────────────┘
                          │
                 3. TTL Expires
                          │
                          ▼
                    Redis Auto-Delete
                          │
                    [GHOST] Event:
                    "TTL reached 0.
                     Redis memory purged."
                          │
                          ▼
                    Frontend Wipe Chat
```

---

## 🧪 Testing the System

### 1. **Authentication Flow**

```bash
# Terminal 1: Monitor backend
cd backend && npm run dev

# Terminal 2: Check logs
docker-compose logs -f backend
```

Expected logs:
```
[AUTH]: Token verified for john_doe (UID: abc123...)
[SOCKET]: User john_doe joined private room.
[PRESENCE]: Active users: ['abc123', 'def456']
```

### 2. **Message TTL & Expiration**

1. Send a message between User A and User B
2. Note the timestamp in System Pulse
3. Wait 120+ seconds (configurable via `MESSAGE_TTL_SECONDS`)
4. Observe:
   - Chat pane clears with `WIPE` signal
   - System Pulse logs: `[GHOST]: TTL reached 0. Redis memory purged.`
   - Redis key `chat:A_B` no longer exists

### 3. **Presence Tracking**

1. Open app in two browser tabs (simulate User A & B)
2. Both should appear in Presence Tracker with ● active status
3. Close one tab → status changes to ● offline
4. System Pulse logs: `[PRESENCE]: User disconnected`

### 4. **System Events**

Open browser DevTools Console to see all system events:

```javascript
[11:23:45] [AUTH]: Token verified for alice (UID: abc123...)
[11:23:45] [SOCKET]: User alice joined private room.
[11:23:46] [PRESENCE]: Active users updated: ['abc123', 'def456']
[11:23:47] [REDIS]: Key 'chat:abc_def' created (TTL: 120s).
[11:25:47] [GHOST]: TTL reached 0. Redis memory purged.
```

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with SSR support
- **Socket.io Client** - Real-time communication
- **Firebase SDK** - Google OAuth & JWT handling
- **crypto-js** - Client-side message encryption (optional)
- **CSS Modules** - Terminal-style UI styling

### Backend
- **Express.js** - HTTP REST API
- **Socket.io Server** - WebSocket & event streaming
- **firebase-admin** - JWT verification & user management
- **Mongoose** - MongoDB ODM
- **redis** - Volatile message storage with TTL
- **TypeScript** - Type-safe development

### Infrastructure
- **Docker & Compose** - Containerized local development
- **MongoDB** - User persistence layer
- **Redis** - Ephemeral message layer
- **Firebase Auth** - Identity verification

---

## 📋 API Endpoints

### REST API

#### `POST /auth/login`
Verify Firebase token and register/update user.

**Request:**
```json
{
  "uid": "google_uid_xyz",
  "displayName": "John Doe",
  "email": "john@example.com",
  "photoURL": "https://..."
}
```

**Headers:**
```
Authorization: Bearer <Firebase_ID_Token>
```

**Response:**
```json
{
  "uid": "google_uid_xyz",
  "displayName": "John Doe",
  "email": "john@example.com",
  "photoURL": "https://..."
}
```

---

### Socket.io Events

#### **Client → Server**

| Event | Data | Description |
|-------|------|-------------|
| `send_message` | `{recipient, content, sender}` | Send encrypted message |

#### **Server → Client**

| Event | Data | Description |
|-------|------|-------------|
| `message` | `{sender, senderName, content, timestamp}` | Incoming message |
| `system_pulse` | `{type, message, severity, timestamp}` | Backend event log |
| `presence` | `[uid1, uid2, ...]` | Active user list |
| `wipe` | — | Clear chat (TTL expired) |

---

## 🎨 UI Components

### GhostChat Pane
- **Messages Format**: `[UserName]: encrypted_content`
- **Input**: Terminal-style `> Type message...`
- **Auto-Clear**: Triggers on server `wipe` signal
- **Timestamps**: HH:MM:SS format

### SystemPulseMonitor
- **Log Format**: `[EVENT_TYPE] timestamp message`
- **Colors**: 
  - `[AUTH]` = Green (#00ff00)
  - `[SOCKET]` = Cyan (#00ffff)
  - `[REDIS]` = Cyan (#00ffff)
  - `[GHOST]` = Yellow/Warn (#ffff00)
- **Events Logged**:
  - Token verification
  - Socket connections/disconnections
  - Message storage in Redis
  - TTL expiration

### PresenceTracker
- **List**: Shows active & offline users
- **Status**: ● active (green) | ● offline (red)
- **Click**: Select user to open chat
- **Selected**: Highlighted with border & glow

---

## 🔐 Security Features

### Authentication
- ✅ Firebase Google OAuth 2.0
- ✅ JWT signature verification on backend
- ✅ Socket.io token-based handshake authentication
- ✅ UID extraction from verified tokens

### Data Privacy
- ✅ Messages stored in Redis (volatile, auto-delete)
- ✅ No message history in MongoDB
- ✅ Client-side encryption optional (crypto-js)
- ✅ HTTPS recommended in production

### Authorization
- ✅ Token required for all API endpoints
- ✅ Socket.io requires auth token in handshake
- ✅ 1-on-1 private rooms prevent message interception
- ✅ User UID validated on each request

---

## 🎁 Bonus Features

### Bonus 1: Atomic "Read-Once" Logic
```typescript
// Redis transaction: Fetch & Delete simultaneously
const message = await redis.multi()
  .lRange(key, 0, 0)
  .lTrim(key, 1, -1)
  .exec();
// Message visible only once, then deleted
```

### Bonus 2: Burn-on-Disconnect
```typescript
// Immediately wipe presence on tab close
socket.on('disconnect', async () => {
  await setUserPresence(userId, 'offline');
  // User disappears from friends' lists instantly
});
```

### Bonus 3: Encrypted Payloads
```typescript
// Client-side encryption before sending
const encrypted = encryptMessage(message);
socket.emit('send_message', { content: encrypted });
// Admin sees only ciphertext in Redis
```

### Bonus 2: Multi-Factor Authentication (MFA) via Twilio
```typescript
// After Google OAuth, backend sends OTP via SMS
// User must enter 6-digit code before accessing chat
[TWILIO]: MFA Challenge dispatched to +20XXXXXX...
[AUTH]: Awaiting SMS code verification.
[TWILIO]: SMS Code Verified. Session promoted to SECURE.
```

---

## 📁 Project Structure

```
HybridEphemeralMessenger/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GhostChat.tsx
│   │   │   ├── SystemPulseMonitor.tsx
│   │   │   ├── PresenceTracker.tsx
│   │   │   └── AuthPane.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts (Google OAuth flow)
│   │   │   └── useMessaging.ts (Socket.io client)
│   │   ├── lib/
│   │   │   ├── firebase.ts
│   │   │   ├── socket.ts
│   │   │   └── encryption.ts
│   │   ├── styles/
│   │   └── pages/
│   │       ├── index.tsx (main app)
│   │       └── _app.tsx
│   ├── package.json
│   ├── .env.local.example
│   ├── tsconfig.json
│   ├── next.config.js
│   └── Dockerfile
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── firebase.ts (JWT verification)
│   │   │   ├── redis.ts (ephemeral storage)
│   │   │   ├── mongodb.ts (user persistence)
│   │   │   └── socketio.ts (real-time sync)
│   │   ├── routes/
│   │   │   └── auth.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   └── index.ts (Express + Socket.io server)
│   ├── package.json
│   ├── .env.example
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── README.md (Person 1 implementation)
├── docker-compose.yml
└── README.md (this file)
```

---

## 🐛 Troubleshooting

### **"No token provided" on Socket.io connection**

❌ **Problem**: Frontend not sending auth token
✅ **Solution**: Ensure Firebase login completed & token passed:

```typescript
const idToken = await user.getIdToken();
const socket = initSocket(idToken);
```

### **"Messages not appearing"**

❌ **Problem**: Redis TTL already expired
✅ **Solution**: Check `MESSAGE_TTL_SECONDS` in `.env` (default: 120s)

### **"CORS blocked connection"**

❌ **Problem**: Socket.io CORS not configured
✅ **Solution**: Update backend `.env`:

```bash
FRONTEND_URL=http://localhost:3000
```

### **"Firebase token verification failed"**

❌ **Problem**: Service account JSON malformed
✅ **Solution**: Validate JSON in `.env`:

```bash
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

---

## 📚 Shared Responsibilities

- **Regular GitHub Commits** with descriptive messages
- **Integration Testing** (Socket.io event names: `message`, `system_pulse`, `wipe`)
- **Bonus Features** split by mutual agreement
- **Documentation** updates as features are added

---

## 👥 Team Roles

| Person | Tasks |
|--------|-------|
| **Person 1** | Firebase Admin SDK, Redis TTL, MongoDB user store, System Pulse UI, Express setup |
| **Person 2** | Socket.io server/client, Google OAuth flow, Ghost Chat UI, Presence tracking, README |

---

## 🚢 Production Deployment

### Recommended Stacks

1. **AWS**:
   - Amplify for frontend
   - ECS for backend
   - ElastiCache for Redis
   - DocumentDB for MongoDB

2. **Google Cloud**:
   - Cloud Run for backend
   - Firebase Hosting for frontend
   - Memorystore for Redis
   - Firestore for MongoDB (alternative)

3. **Heroku + Vercel**:
   - Vercel for Next.js frontend
   - Heroku for Express backend
   - MongoDB Atlas
   - Redis Cloud

---

## 📄 License

MIT License - Feel free to use for educational purposes

---

## 🎓 Learning Outcomes

✅ Firebase authentication & JWT verification
✅ Real-time communication with Socket.io
✅ Ephemeral data storage patterns
✅ Presence tracking & user state management
✅ Terminal-UI design with CSS
✅ Full-stack TypeScript development
✅ Docker containerization
✅ MongoDB & Redis integration

---

## 📞 Support

For issues or questions:
1. Check the **Troubleshooting** section
2. Review backend logs: `docker-compose logs backend`
3. Check browser console for frontend errors
4. Verify `.env` configuration matches `.env.example`
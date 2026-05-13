# Person 1: Backend Implementation Guide

This document outlines the tasks that Person 1 needs to complete for the Hybrid Ephemeral Messenger.

## Overview

Person 1 is responsible for the core backend infrastructure and system monitoring. This includes:
- Firebase Admin SDK integration
- Redis volatile message storage with TTL
- MongoDB user persistence
- System Pulse monitoring UI
- Environment configuration

---

## Tasks Breakdown

### 1. Firebase Admin + Auth Endpoint (🔴 Complex)

**Location**: `backend/src/services/firebase.ts` & `backend/src/routes/auth.ts`

**Deliverables**:
- [x] Initialize Firebase Admin SDK with service account
- [x] Implement token verification using `admin.auth().verifyIdToken()`
- [x] Extract UID from verified tokens
- [x] Create `/auth/login` endpoint that:
  - Verifies the Firebase ID Token
  - Extracts user data (uid, displayName, email, photoURL)
  - Returns verified token data to frontend

**Key Code**:
```typescript
// backend/src/services/firebase.ts
export const verifyToken = async (token: string) => {
  const decodedToken = await admin.auth().verifyIdToken(token);
  return decodedToken; // Contains: uid, email, email_verified, etc.
};
```

**Testing**:
```bash
# Send token from frontend
curl -X POST http://localhost:3001/auth/login \
  -H "Authorization: Bearer <Firebase_ID_Token>" \
  -H "Content-Type: application/json" \
  -d '{"uid":"xyz","displayName":"John","email":"john@ex.com"}'

# Expected response:
# {"uid":"xyz","displayName":"John",...}
```

---

### 2. Redis Volatile Layer (🔴 Complex)

**Location**: `backend/src/services/redis.ts`

**Deliverables**:
- [x] Initialize Redis client connection
- [x] Implement `RPUSH` to store messages in Lists (format: `chat:UID1_UID2`)
- [x] Set configurable TTL using `EXPIRE` command (default: 120s)
- [x] Implement keyspace notifications to detect TTL expiration
- [x] Emit system events when keys expire
- [x] Implement presence tracking (Active/Offline status)

**Key Functions to Implement**:
```typescript
// Store message with TTL
await storeMessage(conversationKey, messageData, ttlSeconds);

// Retrieve messages
await getMessages(conversationKey);

// Set user presence
await setUserPresence(uid, 'active');

// Get active users
await getActiveUsers();
```

**Testing**:
```bash
# Send a message and check Redis
redis-cli
> KEYS chat:*
> LRANGE chat:uid1_uid2 0 -1
> TTL chat:uid1_uid2

# Wait for expiration
# After 120s, key should auto-delete
```

**Keyspace Notifications**:
- Subscribe to `__keyevent@0__:expired` events
- When a `chat:*` key expires, emit `wipe` signal to frontend
- Emit [GHOST] system event

---

### 3. System Pulse Monitor UI (🔴 Complex)

**Location**: `frontend/src/components/SystemPulseMonitor.tsx`

**Deliverables**:
- [x] Create real-time log component displaying backend events
- [x] Format events as: `[EVENT_TYPE] timestamp message`
- [x] Color-code events:
  - `[AUTH]` = Green (#00ff00)
  - `[SOCKET]` = Cyan (#00ffff)
  - `[REDIS]` = Cyan (#00ffff)
  - `[GHOST]` = Yellow (#ffff00) - Warning
- [x] Auto-scroll to latest events
- [x] Store events in React state via Socket.io `system_pulse` listener

**Events to Log**:
```
[AUTH]: Token verified for alice (UID: abc123...)
[SOCKET]: User alice joined private room.
[REDIS]: Key 'chat:abc_def' created (TTL: 120s).
[REDIS]: Message stored successfully.
[PRESENCE]: User alice came online. Active: 3 users.
[GHOST]: TTL reached 0. Redis memory purged. Sending WIPE signal...
[SOCKET]: Connection closed (User alice went offline).
```

**Testing**:
- Open app
- Watch System Pulse for `[AUTH]` and `[SOCKET]` events
- Send a message → See `[REDIS]` event
- Wait 120+ seconds → See `[GHOST]` event

---

### 4. MongoDB Silent Registration (🟡 Medium)

**Location**: `backend/src/services/mongodb.ts`

**Deliverables**:
- [x] Define User schema with fields: `uid`, `displayName`, `email`, `photoURL`
- [x] Implement `createOrUpdateUser()` function
- [x] On first login: Create new user record (Silent Registration)
- [x] On returning login: Fetch existing user data
- [x] **Important**: Do NOT store messages in MongoDB (use Redis only)

**User Schema**:
```typescript
{
  uid: String (unique),
  displayName: String,
  email: String,
  photoURL: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Testing**:
```bash
# After first login:
mongosh
> use ephemeral-messenger
> db.users.findOne({uid: "your_uid"})

# Should return user data
```

---

### 5. Express Setup (🟢 Light)

**Location**: `backend/src/index.ts`

**Deliverables**:
- [x] Initialize Express app
- [x] Setup middleware: CORS, JSON parser, dotenv
- [x] Create `/health` endpoint
- [x] Wire up routes: `/auth/login`
- [x] Initialize services in order: Firebase → MongoDB → Redis → Socket.io
- [x] Listen on PORT (default: 3001)

**CORS Configuration**:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

---

### 6. Environment Variables (🟢 Light)

**Location**: `backend/.env.example`

**Variables to Manage**:
```bash
FIREBASE_SERVICE_ACCOUNT=<JSON string>
MONGODB_URI=mongodb://user:pass@host:27017/ephemeral-messenger
REDIS_URL=redis://localhost:6379
PORT=3001
FRONTEND_URL=http://localhost:3000
MESSAGE_TTL_SECONDS=120
TWILIO_ACCOUNT_SID=<optional, for MFA>
TWILIO_AUTH_TOKEN=<optional, for MFA>
```

---

## Integration Checklist

### Before Person 2 starts:
- [ ] Firebase Admin SDK initialized
- [ ] `/auth/login` endpoint responds with verified user
- [ ] Redis connection established
- [ ] MongoDB connection established & user schema defined
- [ ] Socket.io server created (basic setup)

### Shared Integration Points:
- [ ] `POST /auth/login` returns user profile (Person 1 backend)
- [ ] Socket.io emits `system_pulse` events (Person 1 backend)
- [ ] Frontend listens to `system_pulse` events (Person 2 frontend)
- [ ] Redis TTL triggers `wipe` event (Person 1 backend)
- [ ] Frontend clears chat on `wipe` signal (Person 2 frontend)

---

## Key Files Person 1 Creates

```
backend/
├── src/
│   ├── services/
│   │   ├── firebase.ts ✓
│   │   ├── redis.ts ✓
│   │   ├── mongodb.ts ✓
│   │   └── socketio.ts (partial - just server setup)
│   ├── routes/
│   │   └── auth.ts ✓
│   ├── middleware/
│   │   └── auth.ts ✓
│   └── index.ts ✓
├── .env.example ✓
├── package.json ✓
└── tsconfig.json ✓
```

---

## Testing Commands

### 1. Test Authentication Flow
```bash
# Start backend
cd backend && npm run dev

# In another terminal, get a Firebase token from frontend
# Then test the auth endpoint
curl -X POST http://localhost:3001/auth/login \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"uid":"test","displayName":"Test"}'
```

### 2. Test Redis Storage
```bash
redis-cli
> RPUSH chat:user1_user2 '{"content":"hi","timestamp":"..."}'
> EXPIRE chat:user1_user2 120
> TTL chat:user1_user2  # Should show ~120
```

### 3. Test MongoDB Storage
```bash
mongosh
> use ephemeral-messenger
> db.users.insertOne({uid:"test",displayName:"Test"})
> db.users.find()
```

### 4. Test Socket.io Server
```bash
# Check if Socket.io server is running
curl http://localhost:3001  # Should not error
```

---

## Bonus Features (Optional)

### Bonus 1: Atomic Read-Once Logic
```typescript
// In redis.ts
export const getMessageAndDelete = async (key: string, index: number) => {
  const message = await redis.multi()
    .lIndex(key, index)
    .lRemove(key, 1, message)
    .exec();
  return message;
};
```

### Bonus 2: Multi-Factor Authentication (MFA)
```typescript
// Implement Twilio SMS verification after Firebase login
// Store OTP in Redis with 5-minute TTL
// Update auth flow to require SMS verification
```

---

## Dependencies Already Installed

```json
{
  "express": "^4.18.0",
  "firebase-admin": "^12.0.0",
  "redis": "^4.6.0",
  "mongoose": "^7.0.0",
  "cors": "^2.8.5",
  "dotenv": "^16.3.0",
  "socket.io": "^4.7.0"
}
```

---

## Helpful Resources

- **Firebase Admin SDK**: https://firebase.google.com/docs/auth/admin
- **Redis Lists**: https://redis.io/commands/?group=list
- **Redis TTL/Expiration**: https://redis.io/commands/expire
- **Mongoose**: https://mongoosejs.com/docs
- **Socket.io Server**: https://socket.io/docs/v4/server-api
- **Express Middleware**: https://expressjs.com/en/guide/using-middleware.html

---

## Next Steps for Person 2

Once Person 1 completes this, Person 2 will:
1. Connect to Socket.io server
2. Implement Google OAuth login flow
3. Build Ghost Chat UI
4. Handle presence tracking display
5. Listen to system events and render them

# Quick Reference Guide

Fast lookup for common commands, configuration, and architecture information.

---

## 🚀 Quick Start Commands

### Start Everything (Docker)
```bash
docker-compose up
```
Access: Frontend http://localhost:3000, Backend http://localhost:3001

### Start Individual Services
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Redis
redis-server

# Terminal 4: MongoDB
mongod
```

### Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### Run Tests
```bash
# Frontend linting
cd frontend && npm run lint

# Backend type checking
cd backend && npm run build
```

---

## 📁 Key Files Quick Reference

| File | Purpose | Owner |
|------|---------|-------|
| `backend/src/services/firebase.ts` | Firebase auth verification | Person 1 |
| `backend/src/services/redis.ts` | Message & presence storage | Person 1 |
| `backend/src/services/mongodb.ts` | User persistence | Person 1 |
| `backend/src/services/socketio.ts` | Real-time messaging | Person 1 + 2 |
| `frontend/src/hooks/useAuth.ts` | Google OAuth flow | Person 2 |
| `frontend/src/hooks/useMessaging.ts` | Socket.io client | Person 2 |
| `frontend/src/components/GhostChat.tsx` | Message display | Person 2 |
| `frontend/src/components/SystemPulseMonitor.tsx` | Event logging | Person 2 |
| `frontend/src/components/PresenceTracker.tsx` | User list | Person 2 |
| `frontend/src/lib/encryption.ts` | Message encryption | Person 2 |
| `backend/.env.example` | Backend config template | Person 1 |
| `frontend/.env.local.example` | Frontend config template | Person 2 |

---

## 🔌 API Endpoints

### Authentication
```
POST /auth/login
Headers: Authorization: Bearer <Firebase_ID_Token>
Body: {uid, displayName, email, photoURL}
Response: {uid, displayName, email, photoURL}
```

### Health Check
```
GET /health
Response: {status: "ok"}
```

---

## 🔄 Socket.io Events

### Client → Server
```typescript
socket.emit('send_message', {
  recipient: string,      // UID of recipient
  content: string,        // Encrypted message
  sender: string          // UID of sender
});
```

### Server → Client
```typescript
socket.on('message', (msg) => {
  // {sender, senderName, content, timestamp, encrypted}
});

socket.on('system_pulse', (event) => {
  // {type, message, severity, timestamp}
  // type: 'AUTH' | 'SOCKET' | 'REDIS' | 'GHOST' | 'PRESENCE'
});

socket.on('presence', (users) => {
  // ['uid1', 'uid2', ...]
});

socket.on('wipe', () => {
  // Clear chat - TTL expired
});

socket.on('error', (err) => {
  // Error message
});
```

---

## 📊 Redis Commands (Debugging)

```bash
# Connect to Redis
redis-cli

# View all keys
KEYS *

# Get message list
LRANGE chat:uid1_uid2 0 -1

# Get message count
LLEN chat:uid1_uid2

# Get TTL
TTL chat:uid1_uid2

# Get presence
GET presence:uid

# Monitor all events
MONITOR

# Clear all (DANGEROUS!)
FLUSHALL
```

---

## 🗄️ MongoDB Commands (Debugging)

```bash
# Connect
mongosh localhost:27017

# Use database
use ephemeral-messenger

# Find all users
db.users.find()

# Find specific user
db.users.findOne({uid: "xyz"})

# Update user
db.users.updateOne({uid: "xyz"}, {$set: {displayName: "New Name"}})

# Delete user
db.users.deleteOne({uid: "xyz"})

# Count users
db.users.countDocuments()

# Clear all (DANGEROUS!)
db.users.deleteMany({})
```

---

## 🌍 Environment Variables

### Backend (.env)
```
FIREBASE_SERVICE_ACCOUNT = {"type":"service_account",...}
MONGODB_URI = mongodb://localhost:27017/ephemeral-messenger
REDIS_URL = redis://localhost:6379
PORT = 3001
FRONTEND_URL = http://localhost:3000
MESSAGE_TTL_SECONDS = 120
TWILIO_ACCOUNT_SID = (optional)
TWILIO_AUTH_TOKEN = (optional)
```

### Frontend (.env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY = xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = xxx
NEXT_PUBLIC_FIREBASE_APP_ID = xxx
NEXT_PUBLIC_BACKEND_URL = http://localhost:3001
```

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| **Socket connection timeout** | Check backend URL, restart backend, check firewall |
| **Firebase auth fails** | Verify credentials, regenerate service account |
| **Messages not appearing** | Check Socket.io listeners, check backend logs |
| **Chat not clearing after TTL** | Check Redis TTL value, verify wipe event |
| **CORS errors** | Check FRONTEND_URL in backend .env |
| **MongoDB not found** | Check mongod is running, URI is correct |
| **Redis connection refused** | Check redis-server is running |
| **Token verification failed** | Check service account JSON format, whitespace |
| **Messages not encrypted** | Check encryptMessage/decryptMessage called |
| **User not in Presence Tracker** | Check presence tracking set on connect |

---

## 🔐 Security Checklist

- [ ] Firebase service account kept secret (.env not committed)
- [ ] API keys in environment variables (not hardcoded)
- [ ] HTTPS enabled in production
- [ ] Socket.io token verified on every connection
- [ ] Messages encrypted before storage
- [ ] CORS configured for production URL
- [ ] Database credentials not logged
- [ ] Error messages don't leak sensitive data

---

## 📊 Data Flow Diagram

```
┌──────────────┐
│  User Login  │
└──────┬───────┘
       │ 1. Google OAuth
       ▼
┌──────────────────┐      ┌──────────┐
│ Firebase Auth    │─────►│ Frontend │
│ (JWT Token)      │      │   App    │
└──────┬───────────┘      └────┬─────┘
       │                        │
       │ 2. POST /auth/login    │
       │ with token             │ 3. Socket.io Connect
       │                        │ with token
       ▼                        ▼
┌──────────────────┐      ┌──────────────┐
│ Express Backend  │      │ Socket.io    │
│ Verify Token     │─────►│ Server       │
└──────┬───────────┘      └────┬─────────┘
       │                        │
       ▼                        ▼
┌──────────────────┐      ┌──────────────────┐
│ MongoDB User     │      │ Store Message    │
│ Create/Update    │      │ in Redis         │
└──────┬───────────┘      └────┬─────────────┘
       │                        │
       │ 4. Send Message        │ 5. Set TTL
       ▼                        ▼
┌──────────────────┐      ┌──────────────────┐
│ Emit System      │      │ After TTL:       │
│ Pulse Events     │      │ Auto Delete Key  │
│ to Frontend      │      │ Send WIPE Signal │
└──────────────────┘      └──────────────────┘
```

---

## 🎯 Implementation Checklist (Person 1)

- [ ] Firebase Admin SDK initialized
- [ ] Token verification working
- [ ] /auth/login endpoint responds
- [ ] Redis connection established
- [ ] Message storage in Redis Lists
- [ ] TTL expiration working
- [ ] Keyspace notifications configured
- [ ] MongoDB connection established
- [ ] User schema defined
- [ ] Silent registration working
- [ ] Socket.io server created
- [ ] System Pulse events emitted
- [ ] Presence tracking implemented

---

## 🎯 Implementation Checklist (Person 2)

- [ ] Next.js project initialized
- [ ] Firebase client SDK configured
- [ ] Google OAuth flow working
- [ ] Socket.io client connected
- [ ] Token passed in handshake
- [ ] Message events received
- [ ] System Pulse events received
- [ ] Ghost Chat UI built
- [ ] Message display working
- [ ] Input/send functionality working
- [ ] Presence Tracker UI built
- [ ] Status indicators working
- [ ] System Pulse Monitor built
- [ ] Terminal-style layout complete
- [ ] README documentation complete

---

## 📈 Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Message Latency | < 500ms | |
| UI Responsiveness | < 200ms | |
| Backend Response | < 100ms | |
| CPU Usage (idle) | < 20% | |
| Memory Usage | < 100MB | |
| WebSocket Stability | 99.9% | |

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No console errors
- [ ] No backend errors
- [ ] Environment variables configured
- [ ] Database backups taken
- [ ] Documentation updated

### Production Variables
- [ ] FRONTEND_URL set to production domain
- [ ] Firebase project in production mode
- [ ] MongoDB Atlas connection string
- [ ] Redis Cloud connection
- [ ] HTTPS enabled
- [ ] CORS updated for production

### Post-Deployment
- [ ] Health check endpoint responding
- [ ] Logging configured
- [ ] Monitoring enabled
- [ ] Error alerting set up
- [ ] Backups scheduled

---

## 📞 Contact & Resources

| Resource | URL |
|----------|-----|
| Firebase Docs | https://firebase.google.com/docs |
| Socket.io Docs | https://socket.io/docs |
| Express Docs | https://expressjs.com |
| Next.js Docs | https://nextjs.org/docs |
| MongoDB Docs | https://docs.mongodb.com |
| Redis Docs | https://redis.io/commands |
| Docker Docs | https://docs.docker.com |

---

## 🎓 Learning Resources

**Firebase Authentication**:
- Understand JWT tokens
- Firebase service account setup
- Token verification with Admin SDK

**Real-Time Messaging**:
- Socket.io rooms & namespaces
- Event-driven architecture
- Message queuing patterns

**Database Design**:
- Redis key patterns
- TTL/expiration strategies
- MongoDB schema design

**UI/UX**:
- Terminal-style design
- Responsive layouts
- Color accessibility

---

## ✅ Final Verification

Before submitting:

1. **Code Quality**
   - [ ] No console errors/warnings
   - [ ] No commented-out code
   - [ ] Proper error handling
   - [ ] TypeScript strict mode

2. **Functionality**
   - [ ] All features working
   - [ ] No race conditions
   - [ ] Proper cleanup on disconnect

3. **Documentation**
   - [ ] README complete
   - [ ] Code comments where needed
   - [ ] Environment setup documented

4. **Git**
   - [ ] Regular commits with messages
   - [ ] No sensitive data committed
   - [ ] Meaningful commit history

5. **Testing**
   - [ ] Manual testing complete
   - [ ] Integration tests pass
   - [ ] Edge cases handled

---

**Keep this reference handy during development!** 📌

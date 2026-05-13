# Quick development setup guide

## 1. Firebase Setup

### Get Service Account
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Settings (⚙️) → Service Accounts → Generate New Private Key
4. Copy the JSON and set `FIREBASE_SERVICE_ACCOUNT` env var:

```bash
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

### Enable Google Auth
1. Authentication → Sign-in method → Google
2. Copy API Key → Set `NEXT_PUBLIC_FIREBASE_API_KEY`
3. Copy Auth Domain → Set `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
4. Copy Project ID → Set `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
5. Copy Storage Bucket → Set `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
6. Copy Messaging Sender ID → Set `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
7. Copy App ID → Set `NEXT_PUBLIC_FIREBASE_APP_ID`

## 2. Local Services

### Option A: Using Docker
```bash
docker-compose up -d
```

### Option B: Manual Setup

```bash
# Terminal 1: Redis
brew install redis  # macOS
brew services start redis

# Terminal 2: MongoDB
brew install mongodb-community
brew services start mongodb-community

# Terminal 3: Backend
cd backend
npm install
npm run dev

# Terminal 4: Frontend
cd frontend
npm install
npm run dev
```

## 3. Verify Connection

```bash
# Check Redis
redis-cli ping  # Should return PONG

# Check MongoDB
mongosh localhost:27017

# Check Backend
curl http://localhost:3001/health

# Open Frontend
open http://localhost:3000
```

## 4. Testing Checklist

- [ ] Can sign in with Google
- [ ] System Pulse shows [AUTH] event
- [ ] Can see other logged-in users in Presence Tracker
- [ ] Can send message to another user
- [ ] Message appears in Ghost Chat with encryption
- [ ] System Pulse shows [REDIS] event with TTL
- [ ] After 120s, chat clears with [GHOST] event
- [ ] Closing tab removes user from Presence Tracker

## 5. Debugging

### View Backend Logs
```bash
docker-compose logs -f backend
```

### View Redis Data
```bash
redis-cli
> KEYS *
> GET chat:uid1_uid2
```

### View MongoDB Data
```bash
mongosh
> use ephemeral-messenger
> db.users.find()
```

### Check Socket.io Connection
Open browser DevTools → Network → WS
Should see `/socket.io/?...` connections

## 6. Environment Variables Quick Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `FIREBASE_SERVICE_ACCOUNT` | Backend JWT verification | `{"type":"service_account"...}` |
| `MONGODB_URI` | User database | `mongodb://localhost:27017/ephemeral` |
| `REDIS_URL` | Message storage | `redis://localhost:6379` |
| `MESSAGE_TTL_SECONDS` | Message lifetime | `120` |
| `NEXT_PUBLIC_FIREBASE_*` | Frontend Firebase config | Various |
| `NEXT_PUBLIC_BACKEND_URL` | Frontend backend URL | `http://localhost:3001` |

## 7. Common Issues

### "Redis connection refused"
```bash
# Check if Redis is running
redis-cli ping

# If not, start it
redis-server
```

### "MongoDB connection refused"
```bash
# Check if MongoDB is running
mongosh localhost:27017

# If not, start it
brew services start mongodb-community
```

### "Firebase verification failed"
- Verify service account JSON is valid
- Check project ID matches
- Regenerate service account if needed

### "Socket.io connection timeout"
- Check `FRONTEND_URL` matches frontend URL
- Check backend is running on port 3001
- Check CORS is enabled

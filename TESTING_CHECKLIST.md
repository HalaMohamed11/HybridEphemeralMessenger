# Integration Testing Checklist

This checklist ensures all components work together correctly after both Person 1 and Person 2 complete their implementations.

## Pre-Testing Requirements

- [ ] Person 1 has completed all backend tasks
- [ ] Person 2 has completed all frontend tasks
- [ ] Firebase project is configured and credentials are set
- [ ] MongoDB is running (local or cloud)
- [ ] Redis is running (local or cloud)
- [ ] All `.env` files are filled with correct values
- [ ] `docker-compose up` completes without errors

---

## 1. Services Startup Verification

### Docker Containers
- [ ] Redis container is running (`docker ps | grep redis`)
- [ ] MongoDB container is running and healthy
- [ ] Backend container is running on port 3001
- [ ] Frontend container is running on port 3000

### Backend Service Checks
```bash
# Terminal: Check backend health
curl http://localhost:3001/health
# Expected: {"status":"ok"}
```
- [ ] Backend /health endpoint responds
- [ ] Express server listening on port 3001
- [ ] Socket.io server initialized
- [ ] No error logs in backend console

### Frontend Service Checks
```bash
# Terminal: Verify frontend is running
curl http://localhost:3000
# Expected: HTML response with Next.js app
```
- [ ] Frontend loads at http://localhost:3000
- [ ] No console errors
- [ ] Firebase SDK initialized
- [ ] Socket.io client loaded

---

## 2. Authentication Flow

### Step 1: Google OAuth Login

**Action**: Click "Sign in with Google" button
- [ ] Google OAuth popup appears
- [ ] Can select Google account
- [ ] Redirected back to app after login
- [ ] No browser console errors

**Expected UI State**:
- [ ] Auth Pane shows user photo, name, email
- [ ] "Logout" button is visible
- [ ] Chat interface is enabled
- [ ] No error messages

### Step 2: Token Verification

**Action**: Check browser console and backend logs

**Frontend Console**:
```javascript
console.log(user)
// Should show: {uid: "123...", email: "...", displayName: "...", photoURL: "...", idToken: "..."}
```
- [ ] User object populated
- [ ] idToken present and non-empty
- [ ] No auth errors

**Backend Logs**:
```
[AUTH]: Token verified for <UserName> (UID: <uid>...)
[SOCKET]: User <UserName> joined private room.
```
- [ ] [AUTH] system event logged
- [ ] [SOCKET] system event logged
- [ ] No "Token verification failed" errors

### Step 3: User Registration in MongoDB

**Action**: Check MongoDB for new user
```bash
mongosh
> use ephemeral-messenger
> db.users.findOne({uid: "your_uid"})
```
- [ ] User record exists in MongoDB
- [ ] Fields present: uid, displayName, email, photoURL
- [ ] Timestamps recorded (createdAt, updatedAt)

---

## 3. Presence Tracking

### Step 1: Single User Presence

**Action**: User A logs in
- [ ] Presence Tracker shows User A is ● active
- [ ] User's avatar displays correctly
- [ ] Status indicator is green/active color

### Step 2: Multi-User Presence

**Action**: Open app in second tab/browser (simulate User B)
- [ ] User B logs in with different Google account
- [ ] Presence Tracker on User A shows User B ● active
- [ ] Presence Tracker on User B shows User A ● active
- [ ] Both users can see each other

**Backend Logs**:
```
[PRESENCE]: Active users: ['uid1', 'uid2']
```
- [ ] [PRESENCE] event emitted
- [ ] Active user count is correct

### Step 3: Disconnect Presence

**Action**: User A closes browser tab
- [ ] User A disappears from User B's Presence Tracker
- [ ] Status changes to ● offline
- [ ] [SOCKET] disconnect event logged

---

## 4. Message Flow

### Step 1: Send Message

**Action**: User A selects User B and sends message "Hello"

**User A Side**:
- [ ] Message appears in Ghost Chat
- [ ] Format: `[You]: <encrypted_content> HH:MM:SS`
- [ ] Color: Green (#00ff00)
- [ ] Status bar shows "Users online: 2"

**System Pulse**:
```
[REDIS]: Key 'chat:uid_a_uid_b' created (TTL: 120s).
```
- [ ] [REDIS] event appears with TTL
- [ ] Message key in correct format
- [ ] TTL is correct (120s default or configured value)

### Step 2: Receive Message

**Action**: Check User B's interface

**User B Side**:
- [ ] Message appears in Ghost Chat
- [ ] Format: `[User A]: <encrypted_content> HH:MM:SS`
- [ ] Color: Yellow (#ffff00) for received
- [ ] Message content is encrypted string
- [ ] Timestamp matches send time (±1 second)

**System Pulse**:
- [ ] User B sees [REDIS] event
- [ ] Can see message was stored

### Step 3: Verify Redis Storage

**Action**: Check Redis directly
```bash
redis-cli
> LRANGE chat:uid_a_uid_b 0 -1
> TTL chat:uid_a_uid_b
```
- [ ] Message exists in Redis list
- [ ] Message is JSON with sender, content, timestamp
- [ ] TTL shows ~120 seconds (or slightly less)
- [ ] Content is encrypted (not plaintext)

---

## 5. Message Encryption Verification

### Step 1: View Encrypted Content

**Action**: Open Redis and inspect message
```bash
redis-cli
> LINDEX chat:uid_a_uid_b 0
```
- [ ] Content looks like: `"U2FsdGVkX1..."`
- [ ] Is NOT the plaintext message
- [ ] Looks like AES-256 encrypted string

### Step 2: Decrypt in Frontend

**Action**: Check frontend decryption
- [ ] User B can read the message (not encrypted from user's perspective)
- [ ] Frontend decrypts automatically
- [ ] No decryption errors in console

---

## 6. TTL & Auto-Deletion

### Step 1: Send Message & Note Time
- [ ] Send message from User A to User B
- [ ] Note the time: `12:34:56`
- [ ] System Pulse shows: `[REDIS]: Key 'chat:...' created (TTL: 120s).`

### Step 2: Wait for Expiration
- [ ] Wait 120+ seconds (2 minutes)
- [ ] Monitor Redis TTL: `redis-cli TTL chat:uid_a_uid_b`

### Step 3: Observe TTL Expiration

**System Pulse Event**:
```
[GHOST]: TTL reached 0. Redis memory purged.
```
- [ ] [GHOST] event appears in System Pulse
- [ ] Message content disappears from Redis

**Frontend**:
- [ ] Ghost Chat pane clears automatically (wipe signal)
- [ ] No error messages
- [ ] Chat is empty with "No messages" placeholder

**Redis Verification**:
```bash
redis-cli
> EXISTS chat:uid_a_uid_b
# Should return: (integer) 0
```
- [ ] Redis key no longer exists

---

## 7. Multiple Conversation Threads

### Step 1: Three Users Setup

**Action**: Open app in 3 browser tabs/windows
- [ ] User A: Tab 1
- [ ] User B: Tab 2
- [ ] User C: Tab 3
- [ ] All show each other as ● active

### Step 2: A→B Conversation

**Action**: User A sends "Hi B" to User B
- [ ] User B receives message
- [ ] System Pulse shows: `[REDIS]: Key 'chat:uid_a_uid_b' created`
- [ ] User C does NOT see the message (private rooms)

### Step 3: A→C Conversation

**Action**: User A sends "Hi C" to User C
- [ ] User C receives message
- [ ] Redis has separate key: `chat:uid_a_uid_c`
- [ ] Redis has separate TTL timer
- [ ] User B still cannot see A↔C conversation

### Step 4: Multiple Keys in Redis

**Action**: Check Redis
```bash
redis-cli
> KEYS chat:*
```
- [ ] Multiple keys exist (one per conversation pair)
- [ ] Each has independent TTL
- [ ] Each can expire independently

---

## 8. System Pulse Monitoring

### Complete Event Lifecycle

**Login Phase**:
```
[AUTH]: Token verified for alice (UID: abc123...)
[SOCKET]: User alice joined private room.
[PRESENCE]: Active users: ['abc123']
```
- [ ] [AUTH] event present
- [ ] [SOCKET] event present
- [ ] [PRESENCE] shows current active count

**Messaging Phase**:
```
[REDIS]: Key 'chat:abc_def' created (TTL: 120s).
[PRESENCE]: Active users: ['abc123', 'def456']
```
- [ ] [REDIS] shows key creation
- [ ] [REDIS] shows TTL duration
- [ ] [PRESENCE] updates when users connect

**Expiration Phase**:
```
[GHOST]: TTL reached 0. Redis memory purged.
[SOCKET]: User alice disconnected.
[PRESENCE]: Active users: ['def456']
```
- [ ] [GHOST] event on TTL expiration
- [ ] [SOCKET] disconnect event
- [ ] [PRESENCE] updated after disconnect

### Event Colors
- [ ] [AUTH] is Green
- [ ] [SOCKET] is Cyan
- [ ] [REDIS] is Cyan
- [ ] [GHOST] is Yellow (warning)

---

## 9. UI Responsiveness

### Ghost Chat Pane
- [ ] Messages scroll smoothly
- [ ] Input field is responsive
- [ ] Send button works
- [ ] Selected user name displays at top
- [ ] Empty state message shows when no user selected

### Presence Tracker
- [ ] User list scrolls if many users
- [ ] Clicking user highlights selection
- [ ] Avatar images load correctly
- [ ] Status indicators update in real-time
- [ ] No UI lag when users join/leave

### System Pulse Monitor
- [ ] Events appear in real-time (< 500ms delay)
- [ ] Auto-scrolls to latest event
- [ ] Can scroll up to view history
- [ ] Text wraps properly for long messages
- [ ] No duplicate events

---

## 10. Error Handling

### Scenario 1: Network Disconnect

**Action**: Disconnect internet while chat is open
- [ ] Socket.io shows reconnection attempt
- [ ] System Pulse shows disconnect/reconnect events
- [ ] Reconnect attempt within 5 seconds
- [ ] No hard errors, graceful degradation

### Scenario 2: Invalid Token

**Action**: Clear localStorage/cookies and reload
- [ ] User is logged out
- [ ] Login screen appears
- [ ] No console errors
- [ ] Can login again

### Scenario 3: Redis Unavailable

**Action**: Stop Redis service and try to send message
- [ ] Backend shows error in logs
- [ ] Frontend displays error gracefully
- [ ] System Pulse shows error event
- [ ] App doesn't crash

---

## 11. Database State Verification

### MongoDB Users Collection
```bash
mongosh
> use ephemeral-messenger
> db.users.find()
```
- [ ] All users who logged in are present
- [ ] Each has: uid, displayName, email, photoURL
- [ ] No messages stored (only in Redis)
- [ ] Timestamps are accurate

### Redis Keys
```bash
redis-cli
> KEYS *
```
- [ ] Message keys: `chat:uid1_uid2`
- [ ] Presence keys: `presence:uid`
- [ ] All have appropriate TTLs
- [ ] No orphaned keys

---

## 12. Performance Checks

### Message Latency
- [ ] Message appears on recipient side < 500ms
- [ ] System Pulse events appear < 200ms
- [ ] No noticeable UI freezing
- [ ] Smooth scrolling maintained

### CPU Usage
- [ ] Backend CPU usage < 20% at rest
- [ ] Frontend CPU usage < 30% at rest
- [ ] No memory leaks (check DevTools Memory)

### Network Usage
- [ ] WebSocket connection stable
- [ ] No excessive polling/requests
- [ ] Check Network tab in DevTools

---

## 13. Browser Compatibility

Test on:
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Each browser should**:
- [ ] Load without errors
- [ ] Display UI correctly
- [ ] Handle Socket.io connection
- [ ] Support WebSocket protocol

---

## 14. Mobile Responsiveness

**Action**: Open on mobile device or use DevTools mobile view
- [ ] Layout adapts to small screens
- [ ] Touch events work correctly
- [ ] Messages readable on small screen
- [ ] Input field accessible

---

## 15. Final Integration Test

### Complete User Journey

1. **User A logs in** (new user)
   - [ ] Redirected to app
   - [ ] Profile data saved
   - [ ] Listed as ● active

2. **User B logs in** (different account)
   - [ ] Both see each other
   - [ ] System Pulse shows presence updates

3. **User A sends message to User B**
   - [ ] Encrypted message stored
   - [ ] [REDIS] event logged
   - [ ] User B receives message
   - [ ] Message visible in chat

4. **User A closes tab**
   - [ ] Listed as ● offline
   - [ ] System Pulse shows disconnect
   - [ ] Redis presence removed

5. **User B waits 120+ seconds**
   - [ ] Chat automatically clears
   - [ ] [GHOST] event appears
   - [ ] Redis key deleted

6. **User B logs out**
   - [ ] Session cleared
   - [ ] Redirected to login screen
   - [ ] No residual data

---

## 📋 Sign-Off Checklist

- [ ] All 15 sections passed
- [ ] No console errors
- [ ] No backend errors
- [ ] System Pulse complete
- [ ] Messages encrypted
- [ ] TTL works correctly
- [ ] Presence tracking accurate
- [ ] Documentation complete
- [ ] Code committed to git
- [ ] Ready for grading

---

## 🐛 Failed Test Troubleshooting

If any test fails:

1. **Check backend logs**
   ```bash
   docker-compose logs -f backend
   ```

2. **Check frontend console**
   - Browser DevTools → Console tab

3. **Verify environment variables**
   ```bash
   cat backend/.env
   cat frontend/.env.local
   ```

4. **Test Redis connection**
   ```bash
   redis-cli ping
   ```

5. **Test MongoDB connection**
   ```bash
   mongosh localhost:27017
   ```

6. **Check Socket.io connection**
   - DevTools → Network → Filter "WS"

7. **Review error messages** in System Pulse Monitor

8. **Document the issue** for debugging

---

## 📝 Test Results Log

**Date**: _____________
**Tester Name**: _____________
**Environment**: Docker / Local / Production

| Section | Status | Notes |
|---------|--------|-------|
| 1. Services Startup | ✓ / ✗ | |
| 2. Authentication | ✓ / ✗ | |
| 3. Presence Tracking | ✓ / ✗ | |
| 4. Message Flow | ✓ / ✗ | |
| 5. Encryption | ✓ / ✗ | |
| 6. TTL & Deletion | ✓ / ✗ | |
| 7. Multiple Conversations | ✓ / ✗ | |
| 8. System Pulse | ✓ / ✗ | |
| 9. UI Responsiveness | ✓ / ✗ | |
| 10. Error Handling | ✓ / ✗ | |
| 11. Database State | ✓ / ✗ | |
| 12. Performance | ✓ / ✗ | |
| 13. Browser Compat | ✓ / ✗ | |
| 14. Mobile Response | ✓ / ✗ | |
| 15. Final Journey | ✓ / ✗ | |

**Overall Result**: ✅ PASS / ❌ FAIL

**Issues Found**:
1. _________________
2. _________________
3. _________________

**Resolved By**: _________________

---

**Good luck with your testing!** 🚀

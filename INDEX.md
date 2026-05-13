# 📚 Documentation Index

Welcome to the Hybrid Ephemeral Messenger project! This index helps you navigate all the documentation and guides.

---

## 🎯 Start Here

### For First-Time Setup
1. **[README.md](README.md)** - Main project overview, architecture, and quick start
2. **[DEVELOPMENT.md](DEVELOPMENT.md)** - Detailed setup instructions and Firebase configuration
3. **[setup.sh](setup.sh) / [setup.bat](setup.bat)** - Automated setup script (Linux/Mac or Windows)

### For Understanding the System
1. **[Architecture Overview](README.md#🏗️-architecture-overview)** - How all components fit together
2. **[Message Flow Diagram](README.md#🔄-message-flow-diagram)** - Step-by-step message lifecycle
3. **[Technology Stack](README.md#🛠️-technology-stack)** - Tools and versions used

---

## 👥 Role-Based Guides

### For Person 1 (Backend)
- **[PERSON_1_GUIDE.md](PERSON_1_GUIDE.md)** - Complete backend tasks breakdown
  - Firebase Admin SDK integration
  - Redis volatile message storage
  - MongoDB user persistence
  - System Pulse monitoring backend
  - Testing procedures

### For Person 2 (Frontend)
- **[PERSON_2_GUIDE.md](PERSON_2_GUIDE.md)** - Frontend implementation summary
  - Google OAuth login flow
  - Socket.io client setup
  - Ghost Chat UI component
  - Presence tracking display
  - Testing verification

---

## 🧪 Testing & Verification

### Integration Testing
- **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** - Comprehensive test procedures
  - Pre-testing requirements
  - 15-step verification process
  - Error troubleshooting
  - Test results log

### Quick Checks
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Commands and debugging tips
  - Common commands (Redis, MongoDB, etc.)
  - API endpoints reference
  - Socket.io events reference
  - Troubleshooting table

---

## 📖 Detailed Documentation

### Project Overview
- **[README.md](README.md)** - Complete project documentation
- **[COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md)** - What's been delivered
- **[PERSON_1_GUIDE.md](PERSON_1_GUIDE.md)** - Person 1 task details
- **[PERSON_2_GUIDE.md](PERSON_2_GUIDE.md)** - Person 2 task details

### Configuration
- **[backend/.env.example](backend/.env.example)** - Backend environment template
- **[frontend/.env.local.example](frontend/.env.local.example)** - Frontend environment template
- **[docker-compose.yml](docker-compose.yml)** - Container orchestration

### Setup & Installation
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Local development setup
- **[setup.sh](setup.sh)** - Automated setup (Linux/Mac)
- **[setup.bat](setup.bat)** - Automated setup (Windows)

---

## 🗺️ Project Structure

```
HybridEphemeralMessenger/
├── 📖 Documentation
│   ├── README.md (⭐ Start here!)
│   ├── DEVELOPMENT.md (Setup guide)
│   ├── COMPLETION_SUMMARY.md (What's done)
│   ├── PERSON_1_GUIDE.md (Backend tasks)
│   ├── PERSON_2_GUIDE.md (Frontend tasks)
│   ├── TESTING_CHECKLIST.md (Testing guide)
│   ├── QUICK_REFERENCE.md (Commands)
│   └── INDEX.md (This file)
│
├── 📦 Backend (Person 1)
│   ├── src/
│   │   ├── services/ (Firebase, Redis, MongoDB, Socket.io)
│   │   ├── routes/ (Auth endpoint)
│   │   └── middleware/ (Auth verification)
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile
│   └── tsconfig.json
│
├── 🎨 Frontend (Person 2)
│   ├── src/
│   │   ├── components/ (UI components)
│   │   ├── hooks/ (React hooks)
│   │   ├── lib/ (Utilities)
│   │   ├── pages/ (Next.js pages)
│   │   └── styles/ (CSS modules)
│   ├── package.json
│   ├── .env.local.example
│   ├── Dockerfile
│   └── tsconfig.json
│
├── 🐳 Infrastructure
│   ├── docker-compose.yml
│   ├── setup.sh (Linux/Mac)
│   └── setup.bat (Windows)
│
└── 📝 Configuration
    ├── .gitignore
    └── README.md
```

---

## 🚀 Quick Start Paths

### Path 1: Docker (Recommended)
```bash
# 1. Clone and navigate
git clone <repo>
cd HybridEphemeralMessenger

# 2. Configure
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# Edit both .env files with your Firebase credentials

# 3. Start
docker-compose up

# 4. Access
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Path 2: Local Development
```bash
# Follow DEVELOPMENT.md for detailed instructions
# Requires: Redis, MongoDB, Node.js

# Terminal 1: Backend
cd backend && npm install && npm run dev

# Terminal 2: Frontend
cd frontend && npm install && npm run dev
```

---

## 📋 Key Concepts

### Ghost Protocol (The Architecture)
- **Identity** (Firebase): "The Anchor" - Verified user authentication
- **Volatility** (Redis): "The Ghost" - Messages auto-delete after TTL
- **Persistence** (MongoDB): User metadata only, never messages
- **Real-Time** (Socket.io): Private 1-on-1 rooms for messaging

### Dual-Pane Terminal UI
```
┌────────────┬──────────────┬────────────┬──────────────┐
│ Auth Pane  │ Presence     │ Ghost Chat │ System Pulse │
│ (Login)    │ Tracker      │ (Messages) │ (Backend Log)│
└────────────┴──────────────┴────────────┴──────────────┘
```

### Message Lifecycle
1. User sends encrypted message
2. Backend stores in Redis with TTL
3. Socket.io emits to recipient
4. After TTL expires, Redis auto-deletes
5. Frontend receives wipe signal, clears chat

---

## 🔧 Common Tasks

### Setup & Installation
- See: [DEVELOPMENT.md](DEVELOPMENT.md)
- Scripts: [setup.sh](setup.sh) or [setup.bat](setup.bat)

### Configuration
- Backend: [backend/.env.example](backend/.env.example)
- Frontend: [frontend/.env.local.example](frontend/.env.local.example)
- See: [DEVELOPMENT.md - Firebase Setup](DEVELOPMENT.md)

### Running the Application
- Docker: `docker-compose up`
- Local: See [DEVELOPMENT.md](DEVELOPMENT.md)

### Testing
- Checklist: [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)
- Commands: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

### Debugging
- Backend logs: `docker-compose logs -f backend`
- Redis: `redis-cli`
- MongoDB: `mongosh`
- See: [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for commands

### Deployment
- See: [README.md - Production Deployment](README.md#🚢-production-deployment)

---

## 📊 File Reference Table

| File | Purpose | Read When |
|------|---------|-----------|
| **README.md** | Main documentation | First time setup |
| **DEVELOPMENT.md** | Setup details | Setting up locally |
| **COMPLETION_SUMMARY.md** | What's delivered | Understanding scope |
| **PERSON_1_GUIDE.md** | Backend tasks | You're Person 1 |
| **PERSON_2_GUIDE.md** | Frontend tasks | You're Person 2 |
| **TESTING_CHECKLIST.md** | Testing procedures | Before grading |
| **QUICK_REFERENCE.md** | Common commands | Daily development |
| **setup.sh / .bat** | Automated setup | Initial install |
| **.env examples** | Config templates | Setting up env |
| **docker-compose.yml** | Container setup | Running Docker |

---

## 🎓 Learning Path

### Beginner
1. Read [README.md](README.md) architecture section
2. Watch [Message Flow Diagram](README.md#🔄-message-flow-diagram)
3. Follow [DEVELOPMENT.md](DEVELOPMENT.md) setup
4. Run application and observe System Pulse events

### Intermediate
1. Review your assigned tasks (Person 1 or Person 2)
2. Study relevant code in `src/` folders
3. Understand Socket.io event flow
4. Practice manual testing with [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)

### Advanced
1. Review all system components
2. Understand security implications
3. Plan deployment strategy
4. Implement bonus features

---

## 🐛 Troubleshooting Guide

| Problem | Solution |
|---------|----------|
| Setup fails | See [DEVELOPMENT.md - Troubleshooting](DEVELOPMENT.md#6-troubleshooting) |
| App won't start | Check [QUICK_REFERENCE.md - Common Issues](QUICK_REFERENCE.md#-common-issues--fixes) |
| Tests failing | See [TESTING_CHECKLIST.md - Troubleshooting](TESTING_CHECKLIST.md#-failed-test-troubleshooting) |
| Firebase auth fails | See [DEVELOPMENT.md - Firebase Setup](DEVELOPMENT.md#1-firebase-setup) |
| Messages not appearing | See [README.md - Troubleshooting](README.md#-troubleshooting) |

---

## 🤝 Team Coordination

### Before Starting
- [ ] Both persons read [README.md](README.md)
- [ ] Both run through [DEVELOPMENT.md](DEVELOPMENT.md)
- [ ] Agree on Socket.io event names
- [ ] Discuss git commit strategy

### During Development
- [ ] Regular commits with descriptive messages
- [ ] Update corresponding Person Guide when done
- [ ] Test integration points weekly

### Before Submission
- [ ] Run [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) completely
- [ ] Verify all Person 1 and Person 2 tasks
- [ ] Check documentation is complete
- [ ] Final git commit with summary

---

## 📞 Resources & Support

### Documentation
- **Main README**: [README.md](README.md)
- **Setup Guide**: [DEVELOPMENT.md](DEVELOPMENT.md)
- **Quick Reference**: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

### External Resources
- Firebase Docs: https://firebase.google.com/docs
- Socket.io Docs: https://socket.io/docs
- Express Docs: https://expressjs.com
- Next.js Docs: https://nextjs.org/docs
- MongoDB Docs: https://docs.mongodb.com
- Redis Docs: https://redis.io/commands

### Testing Resources
- Manual Testing: [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)
- Debugging Commands: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

## ✅ Verification Checklist

Before considering the project complete:

- [ ] All Person 1 tasks completed (see [PERSON_1_GUIDE.md](PERSON_1_GUIDE.md))
- [ ] All Person 2 tasks completed (see [PERSON_2_GUIDE.md](PERSON_2_GUIDE.md))
- [ ] Application runs without errors
- [ ] [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) all sections pass
- [ ] All documentation is up-to-date
- [ ] Code is committed to git with good messages
- [ ] No sensitive data in repository
- [ ] Setup is reproducible on fresh environment

---

## 🎉 Next Steps

1. **Read**: Start with [README.md](README.md)
2. **Setup**: Follow [DEVELOPMENT.md](DEVELOPMENT.md)
3. **Assign**: Review [PERSON_1_GUIDE.md](PERSON_1_GUIDE.md) and [PERSON_2_GUIDE.md](PERSON_2_GUIDE.md)
4. **Develop**: Implement your tasks
5. **Test**: Use [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)
6. **Submit**: Commit all code with descriptive messages

---

**Good luck with your Hybrid Ephemeral Messenger project!** 🚀

---

**Last Updated**: May 13, 2026  
**Status**: ✅ Complete  
**Version**: 1.0.0

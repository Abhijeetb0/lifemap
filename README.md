# 🌿 LifeMap — Personal Life OS

Tera personal goal tracking system. Claude se baat karo, goals update ho jaate hain.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Auth | Firebase Auth (Google) |
| Database | Firebase Firestore |
| AI Integration | Claude MCP Server |
| Notifications | Firebase Cloud Messaging (FCM) |
| Hosting | Firebase Hosting (free tier) |

---

## Folder Structure

```
lifemap/
├── src/
│   ├── components/       # UI components
│   │   ├── Sidebar.jsx
│   │   ├── GoalTree.jsx
│   │   ├── NodeItem.jsx
│   │   ├── Timeline.jsx
│   │   ├── TreeCanvas.jsx
│   │   └── McpPreview.jsx   ← Claude preview modal
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── App.jsx
│   │   └── Timeline.jsx
│   ├── hooks/
│   │   ├── useAuth.js       ← Google login hook
│   │   ├── useDomains.js    ← Firestore real-time listener
│   │   └── useUndo.js       ← undo/redo stack
│   ├── lib/
│   │   ├── firebase.js      ← Firebase config
│   │   ├── firestore.js     ← DB read/write helpers
│   │   └── notifications.js ← FCM setup
│   └── mcp/
│       └── server.js        ← MCP server (Node.js)
├── public/
├── .env.local               ← Firebase keys (NEVER commit)
├── firebase.json
├── firestore.rules
├── package.json
└── README.md
```

---

## Step 1 — Setup karo

### 1.1 Project clone/init
```bash
git clone https://github.com/Abhijeetb0/lifemap.git
cd lifemap
npm install
```

### 1.2 Firebase project banao
1. https://console.firebase.google.com → New Project → "lifemap"
2. Authentication → Sign-in method → Google → Enable
3. Firestore → Create database → Start in test mode
4. Project Settings → General → Your apps → Add Web App
5. Copy the config

### 1.3 .env.local banao
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## Step 2 — Firestore Data Structure

```
users/
  {uid}/
    domains/
      {domainId}/
        name: "DSA & CP"
        color: "#22c55e"
        createdAt: timestamp
        items/
          {itemId}/
            name: "Reach 150 LC"
            status: "in-progress"   # planned | in-progress | done | overdue
            deadline: "2026-05-31"
            reminder: true
            imp: true               # important flag
            tl: true                # show on timeline
            parentId: null          # null = root goal
            order: 0
            createdAt: timestamp
            updatedAt: timestamp
```

**Key rule:** Subtasks bhi same `items/` collection mein hain — sirf `parentId` alag hota hai.
Ye Firestore queries simple rakhta hai.

---

## Step 3 — Firebase Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
  }
}
```

Deploy karo:
```bash
firebase deploy --only firestore:rules
```

---

## Step 4 — MCP Server (Claude Integration)

### Concept
```
Tu → Claude se baat karo
Claude → MCP call karta hai
MCP → LifeMap ko preview dikhata hai
Tu → Confirm karta hai
MCP → Firestore update hota hai
```

### MCP Tools (jo Claude use karega)

| Tool | Kya karta hai |
|---|---|
| `list_domains` | Saare domains fetch karo |
| `list_goals` | Ek domain ke goals |
| `add_goal` | Naya goal/subtask add karo |
| `update_goal` | Status/deadline/name update |
| `delete_goal` | Goal delete karo |
| `add_domain` | Naya domain |
| `get_timeline` | Timeline items |

### MCP Server run karo
```bash
cd src/mcp
node server.js
```

MCP ko Claude Desktop mein connect karo:
```json
// claude_desktop_config.json
{
  "mcpServers": {
    "lifemap": {
      "command": "node",
      "args": ["/path/to/lifemap/src/mcp/server.js"],
      "env": {
        "FIREBASE_PROJECT_ID": "your_project_id",
        "FIREBASE_SERVICE_ACCOUNT": "/path/to/serviceAccount.json"
      }
    }
  }
}
```

---

## Step 5 — Notifications

FCM setup:
1. Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Generate key pair
2. Copy VAPID key → `.env.local` mein add karo
3. `src/lib/notifications.js` mein implement karo

Deadline check (Cloud Function ya cron):
```
Every day at 9AM → check deadlines → send FCM notification
```

Simple start ke liye: Client-side check on app load bhi kaam karega.

---

## Development Commands

```bash
# Dev server
npm run dev

# Build
npm run build

# Firebase deploy
firebase deploy

# MCP server (separate terminal)
node src/mcp/server.js
```

---

## Roadmap

- [x] Prototype UI (done in Claude)
- [ ] Firebase setup
- [ ] Google Auth
- [ ] Firestore CRUD
- [ ] List view (from prototype)
- [ ] Tree view (4 styles from prototype)
- [ ] Mini timeline
- [ ] Full 3D timeline
- [ ] MCP server
- [ ] Claude preview modal
- [ ] Notifications
- [ ] PWA (installable on phone)
- [ ] GSSoC contribution (May 2026)

---

## Notes

- `.env.local` kabhi commit mat karo — `.gitignore` mein already hai
- Firestore free tier: 1GB storage, 50k reads/day — more than enough
- MCP server locally run hoga pehle, baad mein deploy kar sakte ho
- Claude Desktop app chahiye MCP ke liye


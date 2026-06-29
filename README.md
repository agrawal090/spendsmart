# SpendSmart MVP 💸

> Track every rupee — cash and UPI — in 3 seconds.

A Progressive Web App (PWA) built with vanilla HTML/CSS/JS + Firebase.

---

## 📁 File Structure

```
spendsmart-mvp/
├── index.html      ← All 5 app screens (Auth, Dashboard, Add, History, Reports, Settings)
├── app.css         ← All styles — mobile-first PWA design
├── app.js          ← All app logic — routing, data, UI rendering
├── firebase.js     ← Firebase Auth + Firestore — PASTE YOUR CONFIG HERE
├── manifest.json   ← PWA manifest — makes it installable on phone
├── sw.js           ← Service worker — offline support
├── icons/          ← Add your app icons here (see step 4 below)
└── README.md       ← This file
```

---

## 🚀 Setup in 5 Steps

### Step 1 — Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → name it `spendsmart`
3. Disable Google Analytics (not needed) → **Create project**

### Step 2 — Enable Firebase Services

**Authentication:**
1. Left sidebar → **Authentication** → **Get started**
2. **Sign-in method** tab → Enable **Email/Password**
3. Enable **Google** (for Google login)

**Firestore Database:**
1. Left sidebar → **Firestore Database** → **Create database**
2. Choose **"Start in test mode"** (we'll add security rules later)
3. Choose your region (asia-south1 for India) → **Enable**

### Step 3 — Paste Your Firebase Config

1. Go to **Project Settings** (gear icon) → **Your apps** → **Add app** → Web (`</>`)
2. Register app as `spendsmart-web`
3. Copy the `firebaseConfig` object
4. Open `firebase.js` → replace the placeholder values with your config:

```javascript
const firebaseConfig = {
  apiKey:            "AIzaSy...",       // ← your real values
  authDomain:        "spendsmart.firebaseapp.com",
  projectId:         "spendsmart",
  storageBucket:     "spendsmart.appspot.com",
  messagingSenderId: "1234567890",
  appId:             "1:123:web:abc"
};
```

### Step 4 — Add App Icons

1. Go to [realfavicongenerator.net](https://realfavicongenerator.net)
2. Upload any square image of your logo
3. Download the package
4. Create an `icons/` folder in your project
5. Place the PNG files inside: `icon-192.png`, `icon-512.png` (minimum required)

### Step 5 — Push to GitHub + Enable Pages

```bash
# In your terminal
git init
git add .
git commit -m "Initial SpendSmart MVP"
git remote add origin https://github.com/YOUR_USERNAME/spendsmart.git
git push -u origin main
```

Then in GitHub:
1. **Settings** → **Pages**
2. Source: **Deploy from a branch** → **main** → **/ (root)**
3. Click **Save**
4. Wait 2 min → your app is live at `https://YOUR_USERNAME.github.io/spendsmart`

---

## 📱 Install as App on Android

1. Open Chrome on your phone
2. Visit your GitHub Pages URL
3. Tap **⋮ menu** → **"Add to Home Screen"**
4. Tap **Add**
5. SpendSmart icon appears on your home screen!

---

## 🔥 Firestore Security Rules (add after testing)

In Firebase Console → Firestore → **Rules**, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /expenses/{expenseId} {
      allow read, write, delete: if request.auth != null &&
        resource.data.uid == request.auth.uid;
      allow create: if request.auth != null &&
        request.resource.data.uid == request.auth.uid;
    }
  }
}
```

---

## ✨ Features in this MVP

- ✅ Email/Password + Google login
- ✅ Add expenses (amount, category, cash/UPI, note, date)
- ✅ Dashboard with budget progress
- ✅ Expense history with filters + search
- ✅ Monthly reports (category breakdown, cash vs UPI chart)
- ✅ Delete expenses
- ✅ Update monthly budget in settings
- ✅ PWA — installable on phone
- ✅ Works offline (cached assets)

---

## 🛣️ What to build next (V2)

- [ ] Savings goals screen
- [ ] AI insights (connect Claude API)
- [ ] WhatsApp weekly summary (Make.com)
- [ ] Export to PDF/CSV
- [ ] Push notifications (budget alerts)
- [ ] Dark mode

---

## 🆘 Common Issues

| Problem | Fix |
|---|---|
| White screen on load | Check Firebase config is correctly pasted in firebase.js |
| "Permission denied" error | Enable Firestore in Firebase Console |
| Google login not working | Add your GitHub Pages URL to Firebase Auth → Authorized domains |
| App not installing on phone | Make sure icons/icon-192.png exists |

---

Built with ❤️ — HTML + CSS + JS + Firebase

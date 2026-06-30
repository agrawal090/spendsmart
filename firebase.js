// =============================================
// SPENDSMART — firebase.js
// Firebase configuration + Auth + Firestore
//
// SETUP STEPS:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project called "spendsmart"
// 3. Click "Add app" → Web
// 4. Copy your firebaseConfig and paste below
// 5. Enable Authentication → Email/Password + Google
// 6. Enable Firestore Database → Start in test mode
// =============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
         GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
       } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc,
         query, where, orderBy, setDoc, getDoc
       } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ⚠️ REPLACE THIS WITH YOUR OWN FIREBASE CONFIG
// Get it from Firebase Console → Project Settings → Your apps
const firebaseConfig = {
  apiKey:            "AIzaSyB3JZhgf44GahQ97UmLMqBnkDuT41VQ4Hs",
  authDomain:        "spendsmart-4f559.firebaseapp.com",
  projectId:         "spendsmart-4f559",
  storageBucket:     "spendsmart-4f559.firebasestorage.app",
  messagingSenderId: "1091580341740",
  appId:             "1:1091580341740:web:5e6e365e0558efbf6324c9"
};

// Initialize Firebase
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ---- AUTH FUNCTIONS ----

window.firebaseSignup = async (email, password, name, budget) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // Save user profile to Firestore
  await setDoc(doc(db, "users", cred.user.uid), {
    name,
    email,
    budget: Number(budget) || 15000,
    createdAt: new Date().toISOString()
  });
  return cred.user;
};

window.firebaseLogin = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

window.firebaseGoogleLogin = async () => {
  throw new Error(
    "Google Sign-In is not yet supported in the Android APK. Please use Email & Password."
  );
};
window.firebaseLogout = () => signOut(auth);

// ---- USER PROFILE ----

window.getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};

window.updateBudget = async (uid, budget) => {
  await setDoc(doc(db, "users", uid), { budget: Number(budget) }, { merge: true });
};

// ---- EXPENSE FUNCTIONS ----

window.addExpense = async (uid, expense) => {
  return await addDoc(collection(db, "expenses"), {
    uid,
    amount:    Number(expense.amount),
    category:  expense.category,
    payType:   expense.payType,   // "cash" | "upi"
    note:      expense.note || "",
    date:      expense.date,      // "YYYY-MM-DD"
    createdAt: new Date().toISOString()
  });
};

window.getExpenses = async (uid) => {
  // NOTE: Only ONE where() + no orderBy() here on purpose.
  // Combining where() with two orderBy() clauses requires a Firestore
  // composite index — if that index doesn't exist, this query throws
  // an error. We sort client-side instead so it always works with
  // zero extra setup in the Firebase console.
  const q = query(
    collection(db, "expenses"),
    where("uid", "==", uid)
  );
  const snap = await getDocs(q);
  const expenses = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Sort newest first: by date, then by createdAt as tiebreaker
  expenses.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  return expenses;
};

window.deleteExpense = async (id) => {
  await deleteDoc(doc(db, "expenses", id));
};

// ---- AUTH STATE LISTENER ----
// Tells app.js when user logs in or out

window.onAuthReady = (callback) => {
  onAuthStateChanged(auth, callback);
};

window.getCurrentUser = () => auth.currentUser;

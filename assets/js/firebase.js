// assets/js/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Define these in the module scope so they can be exported
let auth, db;

// NEW: An initialization function that takes the config as an argument
export function initializeFirebase(config) {
  // Only initialize if it hasn't been already
  if (!auth && !db) {
    const app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
  }
}

// Export the initialized services
export { auth, db };
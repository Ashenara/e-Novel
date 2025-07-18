// --- 1. IMPORT THE NECESSARY FUNCTIONS ---
import { initializeFirebase, auth, db } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { initComments } from './comments.js';
import { initAccount } from './account.js';
import { initAuth } from './auth.js';
import { initNovelStats } from './novel-stats.js';
import { initNovelPage } from './novel.js';

import Alpine from 'alpinejs';
window.Alpine = Alpine;
Alpine.start();

// --- 2. DEFINE THE ICON-SWITCHING LOGIC ---
// This function is identical to the one in your old file.
function updateAuthIcons(user) {
    const loginIcon = document.getElementById('auth-login-icon');
    const accountIcon = document.getElementById('auth-account-icon');

    if (!loginIcon || !accountIcon) {
        // If these icons aren't on the page, do nothing.
        return;
    }

    if (user) {
        // User is signed IN
        loginIcon.classList.add('hidden');
        accountIcon.classList.remove('hidden');
    } else {
        // User is signed OUT
        loginIcon.classList.remove('hidden');
        accountIcon.classList.add('hidden');
    }
}

const initReaderPage = () => {
    // Check if we are on a reader page by looking for the JSON data island.
    // If it's not found, this function does nothing.
    const pageDataElement = document.getElementById('chapter-page-data');
    if (!pageDataElement) return;

    console.log("Reader page detected. Initializing history tracking.");
    const pageData = JSON.parse(pageDataElement.textContent);

    // Now, listen for the user's login state to write the history.
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // If the user is logged in, write the history record.
            const historyRecord = {
                novelTitle: pageData.novelTitle,
                chapterTitle: pageData.chapterTitle,
                lastReadLink: pageData.chapterLink,
                lastReadAt: serverTimestamp()
            };
            const historyDocRef = doc(db, 'users', user.uid, 'history', pageData.novelId);
            setDoc(historyDocRef, historyRecord)
                .then(() => console.log(`History updated for: ${pageData.novelTitle}`))
                .catch(e => console.error("History write failed:", e));
        }
    });
};

// --- 3. INITIALIZE FIREBASE AND THE GLOBAL LISTENER ---
if (window.firebaseConfig) {
  initializeFirebase(window.firebaseConfig);
  
  // <-- THIS IS THE FIX
  // Set up the global authentication listener as soon as Firebase is ready.
  // It will call updateAuthIcons() immediately with the current user state,
  // and again any time the user logs in or out.
  onAuthStateChanged(auth, updateAuthIcons);

} else {
  console.error("Firebase configuration object is missing!");
}

// --- 4. RUN PAGE-SPECIFIC LOGIC ---
// This part remains the same.
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('firebase-comments')) {
        initComments();
    }
    if (document.getElementById('account-content')) {
        initAccount();
    }
    if (document.getElementById('auth-form')) {
        initAuth();
    }
    if (document.querySelector('.novel-stats-widget')) {
        initNovelStats();
    }
    if (document.getElementById('add-to-library-btn')) {
        initNovelPage();
    }
    initReaderPage();
});
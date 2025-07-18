// assets/js/chapter.js

import { initializeFirebase, auth, db } from './firebase.js';
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * This script's only job is to update a user's reading history when they visit a chapter.
 */
function initChapterHistoryTracker() {
    // 1. Read the data embedded in the page by Hugo.
    const pageDataElement = document.getElementById('chapter-page-data');
    if (!pageDataElement) {
        console.warn('Chapter page data not found. History will not be tracked.');
        return;
    }
    const pageData = JSON.parse(pageDataElement.textContent);

    // 2. Wait for the user's login state.
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // 3. If the user is logged in, write the history record.
            writeHistory(user.uid, pageData);
        } else {
            console.log("History not tracked: User is not logged in.");
        }
    });
}

/**
 * Writes a document to the user's history collection in Firestore.
 * @param {string} uid - The user's unique ID.
 * @param {object} data - The page data parsed from the HTML.
 */
async function writeHistory(uid, data) {
    if (!uid || !data.novelId) {
        console.error("Cannot write history: Missing UID or Novel ID.");
        return;
    }

    // This is the data we will save to the document.
    const historyRecord = {
        novelTitle: data.novelTitle,
        chapterTitle: data.chapterTitle,
        lastReadLink: data.chapterLink,
        lastReadAt: serverTimestamp() // Use the accurate server time.
    };
    
    // This creates a reference to the document we want to create or overwrite.
    // e.g., /users/{user_id}/history/{novel_id}
    const historyDocRef = doc(db, 'users', uid, 'history', data.novelId);

    try {
        // setDoc will create the document if it's new, or completely replace it
        // if it already exists. This is perfect for always saving the LATEST chapter read.
        await setDoc(historyDocRef, historyRecord);
        console.log(`History updated for novel: ${data.novelTitle}`);
    } catch (error) {
        console.error("Error writing reading history to Firestore:", error);
    }
}


// --- Initialize everything for this module ---

// First, ensure Firebase is ready.
if (window.firebaseConfig) {
  initializeFirebase(window.firebaseConfig);
} else {
  console.error("Firebase configuration object is missing in chapter.js!");
}

// Then, run our history tracking logic.
// We don't need DOMContentLoaded because the script is deferred.
initChapterHistoryTracker();
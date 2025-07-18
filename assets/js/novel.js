// assets/js/novel.js

import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "firebase/auth";
import {
    doc,
    collection,
    onSnapshot,
    setDoc,
    deleteDoc,
    getDoc,
    writeBatch,
    increment,
    serverTimestamp,
    runTransaction
} from "firebase/firestore";

/**
 * This is the main entry point for all JavaScript functionality on a single novel's page.
 * It checks for a unique element on the page before running any code.
 */
export function initNovelPage() {
    // Failsafe: only run this code if we are on a novel page by checking for the library button.
    const libraryBtn = document.getElementById('add-to-library-btn');
    if (!libraryBtn) return;

    // Initialize all features for this page
    initChapterSorter();
    initLibraryButton();
    initRatingWidget();
    initViewCounter();
    initContinueReadingButton();
}

/**
 * Feature 1: Handles the chapter list accordion and sorting (Newest/Oldest).
 * This function does not depend on Firebase.
 */
function initChapterSorter() {
    // Accordion logic for expanding/collapsing chapter chunks
    const chunkHeaders = document.querySelectorAll('.chunk-header');
    chunkHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('svg');
            content.classList.toggle('hidden');
            icon.classList.toggle('rotate-180');
        });
    });

    // Sorting logic
    const sortOldestBtn = document.getElementById('sort-oldest');
    const sortNewestBtn = document.getElementById('sort-newest');
    const chunksContainer = document.getElementById('chapter-chunks-container');

    if (!sortNewestBtn || !sortOldestBtn || !chunksContainer) return;

    const sortChapters = (order) => {
        const chunks = Array.from(chunksContainer.children);
        chunks.sort((a, b) => {
            const indexA = parseInt(a.dataset.chunkIndex, 10);
            const indexB = parseInt(b.dataset.chunkIndex, 10);
            return order === 'newest' ? indexB - indexA : indexA - indexB;
        });
        // Clear and re-append chunks in the new order
        chunksContainer.innerHTML = '';
        chunks.forEach(chunk => {
            const list = chunk.querySelector('ul');
            if (list) {
                const items = Array.from(list.children);
                items.sort((a, b) => {
                    const chapterA = parseInt(a.dataset.chapterNumber, 10);
                    const chapterB = parseInt(b.dataset.chapterNumber, 10);
                    return order === 'newest' ? chapterB - chapterA : chapterA - chapterB;
                });
                list.innerHTML = '';
                items.forEach(item => list.appendChild(item));
            }
            chunksContainer.appendChild(chunk);
        });
        updateSortButtons(order);
        localStorage.setItem('chapterSortOrder', order);
    };

    const updateSortButtons = (activeOrder) => {
        const activeClasses = ['bg-(--color-primary)', 'text-white'];
        const inactiveClasses = ['bg-(--color-muted)', 'text-(--color-muted-foreground)', 'hover:bg-opacity-80'];
        [sortNewestBtn, sortOldestBtn].forEach(btn => btn.classList.remove(...activeClasses, ...inactiveClasses));

        if (activeOrder === 'newest') {
            sortNewestBtn.classList.add(...activeClasses);
            sortOldestBtn.classList.add(...inactiveClasses);
        } else {
            sortOldestBtn.classList.add(...activeClasses);
            sortNewestBtn.classList.add(...inactiveClasses);
        }
    };

    sortNewestBtn.addEventListener('click', () => sortChapters('newest'));
    sortOldestBtn.addEventListener('click', () => sortChapters('oldest'));

    // Apply saved sort order on page load
    const savedOrder = localStorage.getItem('chapterSortOrder') || 'newest';
    updateSortButtons(savedOrder);
    if (savedOrder === 'oldest') {
        sortChapters('oldest');
    }
}

/**
 * Feature 2: Manages the "Add to Library" button state and functionality.
 */
function initLibraryButton() {
    const libraryBtn = document.getElementById('add-to-library-btn');
    const libraryStatus = document.getElementById('library-status');
    const novelId = libraryBtn.dataset.novelId;

    onAuthStateChanged(auth, user => {
        if (user) {
            libraryBtn.disabled = false;
            libraryStatus.textContent = ''; // Clear login prompt
            const libraryDocRef = doc(db, 'users', user.uid, 'library', novelId);

            // Listen for real-time changes to the library status
            onSnapshot(libraryDocRef, docSnap => {
                if (docSnap.exists()) {
                    libraryBtn.textContent = 'In Library ✔️';
                    libraryBtn.classList.add('bg-green-600', 'text-white');
                    libraryBtn.classList.remove('bg-(--color-muted)', 'text-(--color-muted-foreground)');
                    libraryBtn.onclick = () => removeFromLibrary(user.uid, novelId);
                } else {
                    libraryBtn.textContent = 'Add to Library';
                    libraryBtn.classList.remove('bg-green-600', 'text-white');
                    libraryBtn.classList.add('bg-(--color-muted)', 'text-(--color-muted-foreground)');
                    libraryBtn.onclick = () => addToLibrary(user.uid);
                }
            });
        } else {
            // User is not logged in
            libraryBtn.disabled = false;
            libraryStatus.textContent = 'Login to add to library';
            libraryBtn.addEventListener('click', () => { window.location.href = '/login'; });
        }
    });

    async function addToLibrary(uid) {
        const novelData = {
            title: libraryBtn.dataset.novelTitle,
            permalink: libraryBtn.dataset.novelPermalink,
            image: libraryBtn.dataset.novelImage,
            status: libraryBtn.dataset.novelStatus,
            genres: libraryBtn.dataset.novelGenres,
            addedAt: serverTimestamp() // v9 syntax
        };
        const docRef = doc(db, 'users', uid, 'library', novelId);
        try {
            await setDoc(docRef, novelData);
            console.log('Added to library!');
        } catch (e) { console.error('Error adding to library: ', e); }
    }

    async function removeFromLibrary(uid, novelId) {
        const docRef = doc(db, 'users', uid, 'library', novelId);
        try {
            await deleteDoc(docRef);
            console.log('Removed from library!');
        } catch (e) { console.error('Error removing from library: ', e); }
    }
}

/**
 * Feature 3: Manages displaying and incrementing the novel's view count.
 */
function initViewCounter() {
    const viewWidget = document.querySelector('[data-novel-id-for-views]');
    if (!viewWidget) return;

    const novelId = viewWidget.dataset.novelIdForViews;
    const viewCountEl = document.getElementById('view-count-display');
    const viewDocRef = doc(db, 'views', novelId);

    // Listen for real-time updates and display the formatted count
    onSnapshot(viewDocRef, docSnap => {
        if (docSnap.exists()) {
            viewCountEl.textContent = docSnap.data().count.toLocaleString();
        } else {
            viewCountEl.textContent = '0';
        }
    });

    // Trigger the logic to increment the count
    incrementViewCount(novelId);
}

async function incrementViewCount(novelId) {
    const user = auth.currentUser;
    const viewDocRef = doc(db, 'views', novelId);

    if (user) {
        // Logged-in user: Check against a subcollection to count only once.
        const viewerDocRef = doc(collection(viewDocRef, 'viewers'), user.uid);
        const docSnap = await getDoc(viewerDocRef);
        if (!docSnap.exists()) {
            const batch = writeBatch(db);
            batch.set(viewDocRef, { count: increment(1) }, { merge: true });
            batch.set(viewerDocRef, { viewedAt: serverTimestamp() });
            await batch.commit();
        }
    } else {
        // Anonymous user: Check against sessionStorage to count once per session.
        const sessionStorageKey = `viewed-${novelId}`;
        if (!sessionStorage.getItem(sessionStorageKey)) {
            await setDoc(viewDocRef, { count: increment(1) }, { merge: true });
            sessionStorage.setItem(sessionStorageKey, 'true');
        }
    }
}

/**
 * Feature 4: Manages the star rating widget.
 */
function initRatingWidget() {
    const widget = document.querySelector('.rating-widget');
    if (!widget) return;

    const novelSlug = widget.dataset.novelSlug;
    const ratingRef = doc(db, 'ratings', novelSlug);
    const averageEl = widget.querySelector('.rating-average');
    const countEl = widget.querySelector('.rating-count');
    const starsContainer = widget.querySelector('.stars');

    // Listen for real-time updates to the novel's average rating
    onSnapshot(ratingRef, docSnap => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            averageEl.textContent = (data.average || 0).toFixed(1);
            countEl.textContent = `(${(data.count || 0).toLocaleString()} votes)`;
        } else {
            averageEl.textContent = 'N/A';
            countEl.textContent = `(0 votes)`;
        }
    });

    // Handle user interaction based on auth state
    onAuthStateChanged(auth, user => {
        if (user) {
            // Enable widget for logged-in users
            widget.classList.remove('is-disabled');
            starsContainer.title = "Rate this novel";
            widget.querySelectorAll('input').forEach(input => input.disabled = false);

            // Check for and display user's previous vote
            const userVoteRef = doc(collection(ratingRef, 'votes'), user.uid);
            getDoc(userVoteRef).then(voteDoc => {
                if (voteDoc.exists()) {
                    const starInput = widget.querySelector(`input[value="${voteDoc.data().rating}"]`);
                    if (starInput) starInput.checked = true;
                }
            });

            // Add event listener for new ratings
            starsContainer.addEventListener('change', (e) => {
                const newRating = parseInt(e.target.value, 10);
                if (newRating) setRating(novelSlug, user.uid, newRating);
            });
        } else {
            // Disable widget for logged-out users
            widget.classList.add('is-disabled');
            starsContainer.title = "Please log in to rate";
            widget.querySelectorAll('input').forEach(input => input.disabled = true);
        }
    });
}

/**
 * Performs a Firestore transaction to update a rating safely.
 */
async function setRating(novelSlug, userId, newRating) {
    const ratingRef = doc(db, 'ratings', novelSlug);
    const userVoteRef = doc(collection(ratingRef, 'votes'), userId);

    try {
        await runTransaction(db, async (transaction) => {
            const novelDoc = await transaction.get(ratingRef);
            const userVoteDoc = await transaction.get(userVoteRef);

            let currentData = novelDoc.exists() ? novelDoc.data() : { average: 0, count: 0 };
            let newCount = currentData.count;
            let newTotalScore = currentData.average * currentData.count;

            if (userVoteDoc.exists()) {
                // User is changing their vote, so subtract old value and add new
                const oldRating = userVoteDoc.data().rating;
                newTotalScore = newTotalScore - oldRating + newRating;
            } else {
                // User is voting for the first time
                newCount++;
                newTotalScore += newRating;
            }

            const newAverage = newCount > 0 ? newTotalScore / newCount : 0;

            // Commit changes to both documents
            transaction.set(userVoteRef, { rating: newRating });
            transaction.set(ratingRef, { average: newAverage, count: newCount }, { merge: true });
        });
        console.log('Rating updated successfully!');
    } catch (error) {
        console.error("Rating transaction failed: ", error);
    }
}

/**
 * --- NEW FUNCTION ---
 * Checks reading history to change "Start Reading" to "Continue Reading".
 */
function initContinueReadingButton() {
    const readingBtn = document.getElementById('start-reading-btn');
    if (!readingBtn) return; // Exit if the button doesn't exist

    const novelId = readingBtn.dataset.novelId;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is logged in, check their history.
            const historyDocRef = doc(db, 'users', user.uid, 'history', novelId);

            // We use getDoc for a one-time check. No need for real-time updates here.
            getDoc(historyDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    // A history entry for this novel exists
                    const historyData = docSnap.data();
                    if (historyData.lastReadLink) {
                        // The history entry has a valid link, update the button!
                        readingBtn.textContent = 'Continue Reading';
                        readingBtn.href = historyData.lastReadLink;
                        
                        // Optional: Change the button's style to make it visually distinct
                        readingBtn.classList.remove('bg-(--color-primary)');
                        readingBtn.classList.add('bg-teal-600', 'hover:bg-teal-700');
                    }
                }
                // If doc doesn't exist, we do nothing. The button keeps its default state.
            }).catch(error => {
                console.error("Error checking reading history:", error);
            });
        }
        // If user is not logged in, we do nothing. The button keeps its default state.
    });
}
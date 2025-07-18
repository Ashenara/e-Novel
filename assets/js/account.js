// assets/js/account.js

import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { 
    collection, 
    doc, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    startAfter, 
    endBefore, 
    limitToLast 
} from "firebase/firestore";

export function initAccount() {
    const accountContent = document.getElementById('account-content');
    if (!accountContent) return; // Only run on the account page

    // --- State variables for Pagination ---
    const libraryPageSize = 12;
    let libraryCurrentPage = 1;
    let libraryLastVisible = null;
    let libraryFirstVisible = null;
    let libraryHasNextPage = true;

    const historyPageSize = 10;
    let historyCurrentPage = 1;
    let historyLastVisible = null;
    let historyFirstVisible = null;
    let historyHasNextPage = true;

    // --- Main Auth Listener ---
    onAuthStateChanged(auth, user => {
        if (user) {
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('library-section').classList.remove('hidden');
            document.getElementById('history-section').classList.remove('hidden');
            
            // Initial load for all sections
            loadUserLibrary(user.uid);
            loadUserHistory(user.uid);
            initProfileEditor(user); // This was missing

            // Setup button listeners
            document.getElementById('logout-btn').addEventListener('click', () => {
                signOut(auth).then(() => window.location.href = '/');
            });
            document.getElementById('library-next-btn').addEventListener('click', () => loadUserLibrary(user.uid, 'next'));
            document.getElementById('library-prev-btn').addEventListener('click', () => loadUserLibrary(user.uid, 'prev'));
            document.getElementById('history-next-btn').addEventListener('click', () => loadUserHistory(user.uid, 'next'));
            document.getElementById('history-prev-btn').addEventListener('click', () => loadUserHistory(user.uid, 'prev'));
        } else {
            window.location.href = "/login";
        }
    });

    // --- Library Fetching ---
async function loadUserLibrary(uid, direction = null) {
    const libraryGrid = document.getElementById('library-grid');
    const libraryEmpty = document.getElementById('library-empty');
    const libraryPagination = document.getElementById('library-pagination');
    const pageInfo = document.getElementById('library-page-info');
    const nextBtn = document.getElementById('library-next-btn');
    const prevBtn = document.getElementById('library-prev-btn');

    const libraryRef = collection(db, 'users', uid, 'library');
    let q = query(libraryRef, orderBy('addedAt', 'desc'));

    // Pagination Logic (this part is already correct)
    if (direction === 'next' && libraryLastVisible) {
        libraryCurrentPage++;
        q = query(q, startAfter(libraryLastVisible), limit(libraryPageSize));
    } else if (direction === 'prev' && libraryFirstVisible) {
        libraryCurrentPage--;
        q = query(q, endBefore(libraryFirstVisible), limitToLast(libraryPageSize));
    } else {
        libraryCurrentPage = 1;
        q = query(q, limit(libraryPageSize));
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty && libraryCurrentPage === 1) {
        libraryGrid.innerHTML = '';
        libraryEmpty.classList.remove('hidden');
        libraryPagination.classList.add('hidden');
        return;
    }

    if (!snapshot.empty) {
        libraryGrid.innerHTML = ''; 
        libraryEmpty.classList.add('hidden');
        libraryPagination.classList.remove('hidden');

        // --- THE FIX IS HERE: Restore the full card rendering logic ---
        snapshot.docs.forEach(doc => {
            const novel = doc.data();
            
            // Define variables from the novel data
            let imageUrl = 'https://placehold.co/400x600/27272A/FFFFFF?text=Cover';
            if (novel.image && typeof novel.image === 'string' && novel.image.trim() !== '') { 
                imageUrl = novel.image; 
            }
            const permalink = novel.permalink || '#';
            const title = novel.title || 'Untitled Novel';
            const status = novel.status || '';
            const genresArray = novel.genres ? novel.genres.split(',') : [];
            const firstGenre = genresArray.length > 0 ? genresArray[0] : '';

            // Build HTML parts conditionally
            let statusBadgeHTML = '';
            if (status) { 
                statusBadgeHTML = `<div class="absolute top-2 left-2 z-10"><span class="bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">${status}</span></div>`; 
            }
            let genreSpanHTML = '';
            if (firstGenre) { 
                genreSpanHTML = `<span class="text-xs text-white/80 font-medium line-clamp-1">${firstGenre}</span>`; 
            }

            // Assemble the final card HTML
            const cardHTML = `
                <div class="w-full">
                    <a href="${permalink}" class="group block w-full rounded-lg shadow-md overflow-hidden relative transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 aspect-2/3">
                        <img loading="lazy" src="${imageUrl}" alt="${title} Cover" class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onerror="this.onerror=null;this.src='https://placehold.co/400x600/CCCCCC/666666?text=Image+Missing';">
                        <div class="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent"></div>
                        ${statusBadgeHTML}
                        <div class="absolute bottom-0 left-0 right-0 p-3 text-white">
                            <h3 class="font-bold text-sm leading-tight line-clamp-2 mb-1 group-hover:underline" style="text-shadow: 1px 1px 3px rgb(0 0 0 / 0.7);">${title}</h3>
                            ${genreSpanHTML}
                        </div>
                    </a>
                </div>
            `;
            
            libraryGrid.insertAdjacentHTML('beforeend', cardHTML);
        });
        
        // This logic for updating pagination state is already correct
        libraryFirstVisible = snapshot.docs[0];
        libraryLastVisible = snapshot.docs[snapshot.docs.length - 1];
        
        const nextQuery = query(libraryRef, orderBy('addedAt', 'desc'), startAfter(libraryLastVisible), limit(1));
        const nextSnapshot = await getDocs(nextQuery);
        libraryHasNextPage = !nextSnapshot.empty;
    }

    // This logic for updating button state is already correct
    pageInfo.textContent = `Page ${libraryCurrentPage}`;
    prevBtn.disabled = libraryCurrentPage === 1;
    nextBtn.disabled = !libraryHasNextPage;
}

    // --- FIX #1: The complete loadUserHistory function ---
    async function loadUserHistory(uid, direction = null) {
        const historyList = document.getElementById('history-list');
        const historyEmpty = document.getElementById('history-empty');
        const historyPagination = document.getElementById('history-pagination');
        const pageInfo = document.getElementById('history-page-info');
        const nextBtn = document.getElementById('history-next-btn');
        const prevBtn = document.getElementById('history-prev-btn');
        
        const historyRef = collection(db, 'users', uid, 'history');
        let q = query(historyRef, orderBy('lastReadAt', 'desc'));

        if (direction === 'next' && historyLastVisible) {
            historyCurrentPage++;
            q = query(q, startAfter(historyLastVisible), limit(historyPageSize));
        } else if (direction === 'prev' && historyFirstVisible) {
            historyCurrentPage--;
            q = query(q, endBefore(historyFirstVisible), limitToLast(historyPageSize));
        } else {
            historyCurrentPage = 1;
            q = query(q, limit(historyPageSize));
        }

        const snapshot = await getDocs(q);

        if (snapshot.empty && historyCurrentPage === 1) {
            historyList.innerHTML = '';
            historyEmpty.classList.remove('hidden');
            historyPagination.classList.add('hidden');
            return;
        }

        if (!snapshot.empty) {
            historyList.innerHTML = '';
            historyEmpty.classList.add('hidden');
            historyPagination.classList.remove('hidden');

            snapshot.docs.forEach(doc => {
                const item = doc.data();
                // Ensure lastReadAt exists before calling toDate()
                const lastReadDate = item.lastReadAt?.toDate().toLocaleDateString() || 'N/A';
                const itemHTML = `<a href="${item.lastReadLink}" class="block p-3 rounded-lg transition-colors text-(--color-muted-foreground) hover:bg-(--color-muted) hover:text-(--color-foreground) border-b border-(--color-border) last:border-b-0"><div class="flex justify-between items-center"><div><span class="font-medium">${item.novelTitle}</span><span class="text-sm block">Last read: ${item.chapterTitle}</span></div><span class="text-xs text-right ml-4">${lastReadDate}</span></div></a>`;
                historyList.insertAdjacentHTML('beforeend', itemHTML);
            });

            historyFirstVisible = snapshot.docs[0];
            historyLastVisible = snapshot.docs[snapshot.docs.length - 1];

            const nextQuery = query(historyRef, orderBy('lastReadAt', 'desc'), startAfter(historyLastVisible), limit(1));
            const nextSnapshot = await getDocs(nextQuery);
            historyHasNextPage = !nextSnapshot.empty;
        }

        pageInfo.textContent = `Page ${historyCurrentPage}`;
        prevBtn.disabled = historyCurrentPage === 1;
        nextBtn.disabled = !historyHasNextPage;
    }

    // --- FIX #2: The complete initProfileEditor function ---
    function initProfileEditor(user) {
        const editProfileBtn = document.getElementById('edit-profile-btn');
        const modal = document.getElementById('edit-profile-modal');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const profileForm = document.getElementById('profile-form');
        const displayNameInput = document.getElementById('display-name-input');
        const avatarUrlInput = document.getElementById('avatar-url-input');
        const saveBtn = document.getElementById('profile-save-btn');
        const statusMsg = document.getElementById('profile-status-msg');

        if (!modal) return; // Failsafe

        // Open Modal
        editProfileBtn.addEventListener('click', () => {
            displayNameInput.value = user.displayName || '';
            avatarUrlInput.value = user.photoURL || '';
            statusMsg.textContent = '';
            saveBtn.disabled = false;
            modal.classList.remove('hidden');
        });

        // Close Modal
        closeModalBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        // Handle Form Submission
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newName = displayNameInput.value.trim();
            const newAvatarUrl = avatarUrlInput.value.trim();

            saveBtn.disabled = true;
            statusMsg.textContent = 'Saving...';

            // Use the modular updateProfile function
            updateProfile(auth.currentUser, {
                displayName: newName,
                photoURL: newAvatarUrl
            }).then(() => {
                statusMsg.textContent = 'Success! Reloading...';
                // Reload the page after a short delay to see changes everywhere
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }).catch((error) => {
                console.error("Error updating profile:", error);
                statusMsg.textContent = 'Error. See console.';
                saveBtn.disabled = false;
            });
        });
    }
}
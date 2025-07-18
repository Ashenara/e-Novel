// assets/js/comments.js

import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "firebase/auth";
import { 
    collection, 
    doc, 
    query, 
    orderBy, 
    startAfter, 
    limit, 
    getDocs, 
    writeBatch, 
    serverTimestamp, 
    increment,
    onSnapshot
} from "firebase/firestore";

export function initComments() {
    const commentsSection = document.getElementById('firebase-comments');
    if (!commentsSection) return; // Only run on pages with comments

    // --- State variables ---
    let lastVisibleComment = null;
    let allCommentsLoaded = false;
    const initialLimit = 5;
    const lazyLoadLimit = 5;
    
    const pageId = commentsSection.dataset.pageId;
    const commentForm = document.getElementById('comment-form');
    const loadMoreBtn = document.getElementById('load-more-comments-btn');

    // --- Initial Setup ---
    fetchComments(pageId, initialLimit);
    loadMoreBtn.addEventListener('click', () => fetchComments(pageId, lazyLoadLimit));
    loadCommentCount(pageId);
    setupAuthUI();
    commentForm.addEventListener('submit', (e) => handleCommentSubmit(e, pageId));

    // --- Fetch Comments ---
    async function fetchComments(pageId, limitCount) {
        const commentsList = document.getElementById('comments-list');
        const loaderMsg = document.getElementById('comments-loader-msg');
        if (allCommentsLoaded) return;

        loaderMsg.textContent = 'Loading comments...';
        loaderMsg.classList.remove('hidden');
        loadMoreBtn.classList.add('hidden');

        try {
            const messagesRef = collection(db, 'comments', pageId, 'messages');
            let q = query(messagesRef, orderBy('timestamp', 'desc'));

            if (lastVisibleComment) {
                q = query(q, startAfter(lastVisibleComment));
            }
            
            q = query(q, limit(limitCount));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty && !lastVisibleComment) {
                loaderMsg.textContent = 'Be the first to comment!';
                allCommentsLoaded = true;
                return;
            }

            snapshot.forEach(doc => {
                const comment = doc.data();
                // Ensure timestamp exists and is a valid object before calling toDate()
                const commentDate = (comment.timestamp && typeof comment.timestamp.toDate === 'function')
                    ? comment.timestamp.toDate().toLocaleString() 
                    : 'Just now';
                    
                // Your rendering logic is fine, paste it here
                const commentHTML = `
                <div class="flex items-start space-x-4">
                    <img src="${comment.authorAvatarUrl || 'https://placehold.co/48x48'}" alt="${comment.authorName}" class="h-10 w-10 rounded-full object-cover">
                    <div class="flex-1">
                        <div class="bg-(--color-muted) p-4 rounded-lg rounded-tl-none">
                            <div class="flex items-baseline justify-between">
                                <p class="font-bold text-(--color-foreground)">${comment.authorName}</p>
                                <p class="text-xs text-(--color-muted-foreground)">${commentDate}</p>
                            </div>
                            <p class="mt-2 text-(--color-foreground) whitespace-pre-wrap">${comment.text}</p>
                        </div>
                    </div>
                </div>
                `;
                commentsList.insertAdjacentHTML('beforeend', commentHTML);
            });

            lastVisibleComment = snapshot.docs[snapshot.docs.length - 1];
            loaderMsg.classList.add('hidden');

            if (snapshot.size < limitCount) {
                allCommentsLoaded = true;
                loadMoreBtn.classList.add('hidden');
                loaderMsg.textContent = 'No more comments to load.';
                loaderMsg.classList.remove('hidden');
            } else {
                loadMoreBtn.classList.remove('hidden');
            }

        } catch (error) {
            console.error("Error fetching comments:", error);
            loaderMsg.textContent = 'Error loading comments.';
        }
    }

    // --- Submit Comment ---
    async function handleCommentSubmit(e, pageId) {
        e.preventDefault();
        const commentInput = document.getElementById('comment-input');
        const currentUser = auth.currentUser;
        const commentText = commentInput.value.trim();
        if (!currentUser || !commentText) return;

        const pageTitle = commentsSection.dataset.pageTitle;
        const pageUrl = commentsSection.dataset.pageUrl;
        
        // References using v9 syntax
        const pageDocRef = doc(db, 'comments', pageId);
        const newMessageRef = doc(collection(pageDocRef, 'messages'));
        
        const commentData = {
            text: commentText,
            authorId: currentUser.uid,
            authorName: currentUser.displayName || 'Anonymous',
            authorAvatarUrl: currentUser.photoURL || 'https://placehold.co/48x48/CCCCCC/666666?text=U',
            timestamp: serverTimestamp() // v9 syntax
        };
        
        const batch = writeBatch(db); // v9 syntax
        batch.set(newMessageRef, commentData);
        batch.set(pageDocRef, {
            title: pageTitle,
            url: pageUrl,
            commentCount: increment(1), // v9 syntax
            lastCommentAt: serverTimestamp() // v9 syntax
        }, { merge: true });

        try {
            await batch.commit();
            commentInput.value = '';
            
            // Refresh list
            document.getElementById('comments-list').innerHTML = '';
            lastVisibleComment = null;
            allCommentsLoaded = false;
            fetchComments(pageId, initialLimit);
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('There was an error posting your comment.');
        }
    }

    // --- Auth UI Controller ---
    function setupAuthUI() {
        const commentForm = document.getElementById('comment-form');
        const loginPrompt = document.getElementById('comment-login-prompt');
        const userAvatar = document.getElementById('comment-user-avatar');

        onAuthStateChanged(auth, user => {
            if (user) {
                loginPrompt.classList.add('hidden');
                commentForm.classList.remove('hidden');
                userAvatar.src = user.photoURL || 'https://placehold.co/48x48/CCCCCC/666666?text=U';
            } else {
                loginPrompt.classList.remove('hidden');
                commentForm.classList.add('hidden');
            }
        });
    }

    // --- Real-time Comment Count ---
    function loadCommentCount(pageId) {
        const countBadge = document.getElementById('comment-count-badge');
        if (!countBadge) return;
        const pageDocRef = doc(db, 'comments', pageId);

        onSnapshot(pageDocRef, (doc) => {
            if (doc.exists()) {
                const count = doc.data().commentCount || 0;
                countBadge.textContent = `(${count})`;
            } else {
                countBadge.textContent = '(0)';
            }
        }, error => {
            console.error("Error fetching comment count:", error);
            countBadge.textContent = '';
        });
    }
}
import { db } from './firebase.js';
import { collection, getDocs, collectionGroup, query, orderBy, limit } from "firebase/firestore";

export function initNovelStats() {
    const widget = document.querySelector('.novel-stats-widget');
    if (!widget) return;

    // --- Select Elements ---
    const tabs = {
        rating: widget.querySelector('#stats-tab-rating'),
        views: widget.querySelector('#stats-tab-views'),
        comments: widget.querySelector('#stats-tab-comments') // New
    };
    
    const panes = {
        rating: widget.querySelector('#stats-pane-rating'),
        views: widget.querySelector('#stats-pane-views'),
        comments: widget.querySelector('#stats-pane-comments') // New
    };
    
    const lists = {
        rating: widget.querySelector('#rating-list'),
        views: widget.querySelector('#views-list'),
        comments: widget.querySelector('#comments-list-widget') // New
    };

    const loadMoreBtns = {
        rating: widget.querySelector('#rating-load-more'),
        views: widget.querySelector('#views-load-more')
    };

    const templateContainer = widget.querySelector('#novel-stats-data-template');

    // --- State ---
    let ratingItemsShown = 0;
    let viewItemsShown = 0;
    const itemsPerLoad = 5;

    // --- Init ---
    fetchAndRenderData();
    setupTabListeners();

    function setupTabListeners() {
        // Helper to switch tabs
        const switchTab = (activeKey) => {
            Object.keys(tabs).forEach(key => {
                if (key === activeKey) {
                    tabs[key].classList.add('active-tab');
                    panes[key].classList.add('active-pane');
                } else {
                    tabs[key].classList.remove('active-tab');
                    panes[key].classList.remove('active-pane');
                }
            });
        };

        tabs.rating.addEventListener('click', () => switchTab('rating'));
        tabs.views.addEventListener('click', () => switchTab('views'));
        tabs.comments.addEventListener('click', () => switchTab('comments'));
    }

    async function fetchAndRenderData() {
        // 1. Fetch Rating & Views (Existing Logic)
        try {
            const [ratingsSnapshot, viewsSnapshot] = await Promise.all([
                getDocs(collection(db, 'ratings')),
                getDocs(collection(db, 'views'))
            ]);

            const ratingsData = {};
            ratingsSnapshot.forEach(doc => { ratingsData[doc.id] = doc.data(); });

            const viewsData = {};
            viewsSnapshot.forEach(doc => { viewsData[doc.id] = doc.data(); });
            
            // Map to DOM templates
            const novelTemplates = Array.from(templateContainer.children);
            let allNovelsData = novelTemplates.map(template => {
                const novelId = template.dataset.novelId;
                const ratingInfo = ratingsData[novelId] || { average: 0, count: 0 };
                return {
                    id: novelId,
                    rating: ratingInfo.average,
                    ratingCount: ratingInfo.count,
                    viewCount: (viewsData[novelId] || { count: 0 }).count,
                    template: template
                };
            });

            // Sort and Render Ratings/Views
            const sortedByRating = [...allNovelsData].sort((a, b) => b.rating - a.rating).slice(0, 10);
            const sortedByViews = [...allNovelsData].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);

            lists.rating.innerHTML = '';
            lists.views.innerHTML = '';
            
            ratingItemsShown = renderNovelChunk(lists.rating, loadMoreBtns.rating, sortedByRating, 0, itemsPerLoad, 'rating');
            viewItemsShown = renderNovelChunk(lists.views, loadMoreBtns.views, sortedByViews, 0, itemsPerLoad, 'views');

            // Load More Listeners
            if (sortedByRating.length > itemsPerLoad) loadMoreBtns.rating.classList.remove('js-hidden');
            loadMoreBtns.rating.addEventListener('click', () => {
                ratingItemsShown = renderNovelChunk(lists.rating, loadMoreBtns.rating, sortedByRating, ratingItemsShown, itemsPerLoad, 'rating');
            });

            if (sortedByViews.length > itemsPerLoad) loadMoreBtns.views.classList.remove('js-hidden');
            loadMoreBtns.views.addEventListener('click', () => {
                viewItemsShown = renderNovelChunk(lists.views, loadMoreBtns.views, sortedByViews, viewItemsShown, itemsPerLoad, 'views');
            });

        } catch (error) {
            console.error("Error loading stats:", error);
        }

        // 2. Fetch Latest Comments (New Logic)
        fetchLatestComments();
    }

    async function fetchLatestComments() {
        try {
            // Query the 'messages' subcollection group across ALL documents
            const q = query(
                collectionGroup(db, 'messages'),
                orderBy('timestamp', 'desc'),
                limit(10)
            );

            const snapshot = await getDocs(q);
            
            lists.comments.innerHTML = ''; // Clear loading msg

            if (snapshot.empty) {
                lists.comments.innerHTML = '<li class="stats-loading-placeholder">No comments yet.</li>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const listItem = document.createElement('li');
                
                // Time formatter
                let timeString = "Just now";
                if(data.timestamp) {
                    const date = data.timestamp.toDate();
                    const now = new Date();
                    const diffMins = Math.round((now - date) / 60000);
                    if (diffMins < 60) timeString = `${diffMins}m ago`;
                    else if (diffMins < 1440) timeString = `${Math.round(diffMins/60)}h ago`;
                    else timeString = `${Math.round(diffMins/1440)}d ago`;
                }

                // IMPORTANT: Link Logic
                // If you updated comments.js to save 'pageUrl', use it. 
                // Otherwise we default to home or try to reconstruct it.
                // Since 'messages' are inside 'comments/{pageId}/messages', 
                // we don't strictly know the URL unless we save it in the message.
                // Fallback: link to the pageId (if ID = slug)
                const linkUrl = data.pageUrl || data.url || `/${doc.ref.parent.parent.id}`; 

                listItem.innerHTML = `
                    <a href="${linkUrl}" class="comment-item-link">
                        <img src="${data.authorAvatarUrl || 'https://placehold.co/32x32'}" class="comment-item-avatar" alt="U">
                        <div class="comment-item-content">
                            <div class="comment-item-user">
                                <span>${data.authorName}</span>
                                <span class="comment-item-time">${timeString}</span>
                            </div>
                            <div class="comment-item-text">${data.text}</div>
                            ${data.pageTitle ? `<div class="comment-item-page-title">on ${data.pageTitle}</div>` : ''}
                        </div>
                    </a>
                `;
                lists.comments.appendChild(listItem);
            });

        } catch (error) {
            console.error("Error loading comments:", error);
            // This error usually happens if the index is missing in Firestore
            if(error.code === 'failed-precondition') {
                console.warn("Missing Firestore Index for Collection Group 'messages'");
            }
            lists.comments.innerHTML = '<li class="stats-loading-placeholder">Unable to load comments.</li>';
        }
    }

    function renderNovelChunk(listElement, loadMoreBtn, sortedData, currentCount, step, type) {
        const newLimit = currentCount + step;
        for (let i = currentCount; i < newLimit && i < sortedData.length; i++) {
            const novel = sortedData[i];
            const listItem = document.createElement('li');
            const clone = novel.template.cloneNode(true);
            const statEl = clone.querySelector('.novel-item-stat');
            
            if (type === 'rating') {
                statEl.innerHTML = `<svg class="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> <b>${novel.rating.toFixed(1)}</b> <span class="ml-1">(${novel.ratingCount})</span>`;
            } else {
                statEl.innerHTML = `<svg class="w-4 h-4 text-blue-400 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg> <b>${novel.viewCount.toLocaleString()}</b>`;
            }

            listItem.appendChild(clone);
            listElement.appendChild(listItem);
        }
        
        const newTotalShown = Math.min(newLimit, sortedData.length);
        if (newTotalShown >= sortedData.length) {
            loadMoreBtn.classList.add('js-hidden');
        }
        return newTotalShown;
    }
}
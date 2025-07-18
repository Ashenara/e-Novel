// assets/js/novel-stats.js

import { db } from './firebase.js';
import { collection, getDocs } from "firebase/firestore";

export function initNovelStats() {
    const widget = document.querySelector('.novel-stats-widget');
    if (!widget) return;

    // --- Select all DOM elements once ---
    const ratingTab = widget.querySelector('#stats-tab-rating');
    const viewsTab = widget.querySelector('#stats-tab-views');
    const ratingPane = widget.querySelector('#stats-pane-rating');
    const viewsPane = widget.querySelector('#stats-pane-views');
    const ratingList = widget.querySelector('#rating-list');
    const viewsList = widget.querySelector('#views-list');
    const ratingLoadMoreBtn = widget.querySelector('#rating-load-more');
    const viewsLoadMoreBtn = widget.querySelector('#views-load-more');
    const templateContainer = widget.querySelector('#novel-stats-data-template');
    
    // --- State variables ---
    let ratingItemsShown = 0;
    let viewItemsShown = 0;
    const itemsPerLoad = 5;

    // --- Main Logic Execution ---
    fetchAndRenderData();
    setupTabListeners(); // <--- THE FIX IS HERE: We call the new function to activate the tabs.

    /**
     * This function sets up the click event listeners for the tabs.
     */
    function setupTabListeners() {
        ratingTab.addEventListener('click', () => {
            ratingTab.classList.add('active-tab');
            viewsTab.classList.remove('active-tab');
            ratingPane.classList.add('active-pane');
            viewsPane.classList.remove('active-pane');
        });

        viewsTab.addEventListener('click', () => {
            viewsTab.classList.add('active-tab');
            ratingTab.classList.remove('active-tab');
            viewsPane.classList.add('active-pane');
            ratingPane.classList.remove('active-pane');
        });
    }

    /**
     * This function fetches all data from Firestore and renders the initial lists.
     */
    async function fetchAndRenderData() {
        try {
            const [ratingsSnapshot, viewsSnapshot] = await Promise.all([
                getDocs(collection(db, 'ratings')),
                getDocs(collection(db, 'views'))
            ]);

            const ratingsData = {};
            ratingsSnapshot.forEach(doc => { ratingsData[doc.id] = doc.data(); });

            const viewsData = {};
            viewsSnapshot.forEach(doc => { viewsData[doc.id] = doc.data(); });
            
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

            // Sort data
            const sortedByRating = [...allNovelsData].sort((a, b) => b.rating - a.rating).slice(0, 10);
            const sortedByViews = [...allNovelsData].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);

            // Initial render
            ratingList.innerHTML = '';
            viewsList.innerHTML = '';
            ratingItemsShown = renderChunk(ratingList, ratingLoadMoreBtn, sortedByRating, 0, itemsPerLoad);
            viewItemsShown = renderChunk(viewsList, viewsLoadMoreBtn, sortedByViews, 0, itemsPerLoad);

            // Setup "Load More" for Ratings
            if (sortedByRating.length > itemsPerLoad) {
                ratingLoadMoreBtn.classList.remove('js-hidden');
            }
            ratingLoadMoreBtn.addEventListener('click', () => {
                ratingItemsShown = renderChunk(ratingList, ratingLoadMoreBtn, sortedByRating, ratingItemsShown, itemsPerLoad);
            });
            
            // Setup "Load More" for Views
            if (sortedByViews.length > itemsPerLoad) {
                viewsLoadMoreBtn.classList.remove('js-hidden');
            }
            viewsLoadMoreBtn.addEventListener('click', () => {
                viewItemsShown = renderChunk(viewsList, viewsLoadMoreBtn, sortedByViews, viewItemsShown, itemsPerLoad);
            });
            
        } catch (error) {
            console.error("Error initializing novel stats widget:", error);
            ratingList.innerHTML = '<li class="stats-loading-placeholder">Error loading data.</li>';
            viewsList.innerHTML = '<li class="stats-loading-placeholder">Error loading data.</li>';
        }
    }

    /**
     * Renders a chunk of items into a list.
     */
    function renderChunk(listElement, loadMoreBtn, sortedData, currentCount, step) {
        const newLimit = currentCount + step;
        for (let i = currentCount; i < newLimit && i < sortedData.length; i++) {
            const novel = sortedData[i];
            const listItem = document.createElement('li');
            const clone = novel.template.cloneNode(true);
            const statEl = clone.querySelector('.novel-item-stat');
            
            if (listElement.id === 'rating-list') {
                statEl.innerHTML = `<svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> <b>${novel.rating.toFixed(1)}</b> <span class="ml-1">(${novel.ratingCount.toLocaleString()} votes)</span>`;
            } else {
                statEl.innerHTML = `<b>${novel.viewCount.toLocaleString()}</b> views`;
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
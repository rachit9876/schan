(function() {
    'use strict';
    let currentShow = null;
    let episodes = [];
    let currentIndex = 0;

    // Show mobile warning on page load
    function checkMobile() {
        if (window.innerWidth <= 900) {
            const warning = document.getElementById('mobile-warning');
            if (warning && !sessionStorage.getItem('hideWarning')) {
                warning.classList.add('active');
            }
        }
    }

    async function init() {
        const params = new URLSearchParams(window.location.search);
        const showId = params.get('show');
        const epIndex = (parseInt(params.get('episode')) || 1) - 1;

        if (!showId) return window.location.href = '/';

        try {
            const resShows = await fetch('json/shows.json');
            const shows = await resShows.json();
            currentShow = shows.find(s => s.id === showId);
            if (!currentShow) return window.location.href = '/';

            const resEps = await fetch(currentShow.episodesFile);
            episodes = await resEps.json();
            currentIndex = Math.max(0, Math.min(epIndex, episodes.length - 1));

            setupHeader();
            renderList();
            playEpisode(currentIndex);
            checkMobile();
        } catch (e) {
            console.error(e);
        }
    }

    function setupHeader() {
        const btn = document.getElementById('back-btn');
        if (currentShow.id.includes('courage')) {
            btn.innerHTML = 'CN Network';
            btn.onclick = () => window.location.href = 'https://courage-networks.pages.dev';
        } else {
            btn.onclick = () => window.location.href = '/';
        }
    }

    function renderList() {
        const list = document.getElementById('ep-list');
        list.innerHTML = '';
        episodes.forEach((ep, i) => {
            const item = document.createElement('div');
            item.className = `ep-item ${i === currentIndex ? 'active' : ''}`;
            item.innerHTML = `
                <div class="ep-num">${i + 1}</div>
                <div class="ep-info">
                    <h4>${ep.fileName}</h4>
                </div>
            `;
            item.onclick = () => playEpisode(i);
            list.appendChild(item);
        });
    }

    function playEpisode(index) {
        currentIndex = index;
        const ep = episodes[index];
        const driveId = ep.url.match(/\/d\/(.+?)\//)?.[1];
        
        if (driveId) {
            localStorage.setItem(`lastEpisode_${currentShow.id}`, index);
            
            const iframe = document.getElementById('video-player');
            const loader = document.getElementById('loader');
            
            iframe.style.opacity = '0';
            loader.style.display = 'block';
            
            // Clean load
            setTimeout(() => {
                // Try /preview first, fallback strategies available
                const isMobile = window.innerWidth <= 900;
                let embedUrl = `https://drive.google.com/file/d/${driveId}/preview`;
                
                // Add parameters that might help mobile rendering
                if (isMobile) {
                    embedUrl += '?embedded=true';
                }
                
                iframe.src = embedUrl;
                iframe.onload = () => {
                    loader.style.display = 'none';
                    iframe.style.opacity = '1';
                };
            }, 100);

            document.getElementById('video-title').textContent = ep.fileName;
            document.getElementById('video-show').textContent = currentShow.title;

            // Update UI list
            document.querySelectorAll('.ep-item').forEach((el, i) => {
                el.classList.toggle('active', i === index);
            });

            // Auto-scroll list
            const activeEl = document.querySelector('.ep-item.active');
            if(activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Update URL cleanly
            const url = new URL(window.location);
            url.searchParams.set('episode', index + 1);
            window.history.replaceState({}, '', url);
        }
    }

    init();
})();
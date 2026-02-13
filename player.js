(function() {
    'use strict';
    
    const IFRAME_LOAD_DELAY = 100;
    const LOADING_OPACITY = '0.5';
    
    let currentShow = null;
    let currentEpisodes = [];
    let currentEpisodeIndex = 0;
    const driveIdCache = new Map();

    function getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            show: params.get('show'),
            episode: (parseInt(params.get('episode')) || 1) - 1
        };
    }

    async function loadShow() {
        const { show, episode } = getUrlParams();
        if (!show) {
            window.location.href = '/';
            return;
        }

        try {
            const showsResponse = await fetch('json/shows.json');
            const shows = await showsResponse.json();
            currentShow = shows.find(s => s.id === show);
            
            if (!currentShow) {
                window.location.href = '/';
                return;
            }

            const response = await fetch(currentShow.episodesFile);
            currentEpisodes = await response.json();
            currentEpisodeIndex = episode;
            
            displayEpisodesList();
            playEpisode(currentEpisodeIndex);
        } catch (error) {
            console.error('Error loading show:', error);
            showError('Failed to load episodes. Please try again.');
        }
    }

    function displayEpisodesList() {
        const list = document.getElementById('episodes-list');
        const fragment = document.createDocumentFragment();
        
        currentEpisodes.forEach((episode, index) => {
            const item = document.createElement('div');
            item.className = 'episode-item';
            item.tabIndex = 0;
            item.setAttribute('role', 'button');
            item.setAttribute('aria-label', `Episode ${index + 1}: ${episode['File Name']}`);
            if (index === currentEpisodeIndex) item.classList.add('active');
            
            item.innerHTML = `
                <div class="episode-number">${index + 1}</div>
                <div class="episode-details">
                    <h4>${episode.fileName}</h4>
                    <p>${currentShow.title}</p>
                </div>
            `;
            
            const handleActivation = () => playEpisode(index);
            item.addEventListener('click', handleActivation);
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleActivation();
                }
            });
            
            fragment.appendChild(item);
        });
        
        list.innerHTML = '';
        list.appendChild(fragment);
    }

    function playEpisode(index) {
        currentEpisodeIndex = index;
        const episode = currentEpisodes[index];
        
        let driveId = driveIdCache.get(episode.url);
        if (!driveId) {
            driveId = episode.url.match(/\/d\/(.+?)\//)?.[1];
            if (driveId) driveIdCache.set(episode.url, driveId);
        }
        
        if (driveId) {
            localStorage.setItem(`lastEpisode_${currentShow.id}`, index);
            const iframe = document.getElementById('video-player');
            const spinner = document.getElementById('loading-spinner');
            const wrapper = document.querySelector('.video-wrapper');
            
            iframe.onload = null;
            wrapper.style.opacity = LOADING_OPACITY;
            spinner.style.display = 'block';
            iframe.src = '';
            
            const existingOverlay = wrapper.querySelector('.popup-blocker');
            if (existingOverlay) existingOverlay.remove();
            
            const overlay = document.createElement('div');
            overlay.className = 'popup-blocker';
            const isMobile = window.innerWidth <= 768;
            const size = isMobile ? '45px' : '55px';
            const pos = isMobile ? '5px' : '8px';
            overlay.style.cssText = `position:absolute;top:${pos};right:${pos};width:${size};height:${size};background:#000;z-index:999;pointer-events:auto`;
            wrapper.appendChild(overlay);
            
            setTimeout(() => {
                iframe.src = `https://drive.google.com/file/d/${driveId}/preview`;
                iframe.onload = () => {
                    spinner.style.display = 'none';
                    wrapper.style.opacity = '1';
                };
            }, IFRAME_LOAD_DELAY);
            
            document.getElementById('video-title').textContent = episode.fileName;
            document.getElementById('video-show').textContent = currentShow.title;
            
            document.querySelectorAll('.episode-item').forEach((item, i) => {
                item.classList.toggle('active', i === index);
            });
            
            document.querySelector('.episode-item.active')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            const url = new URL(window.location);
            url.searchParams.set('episode', index + 1);
            window.history.replaceState({}, '', url);
        }
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = message;
        errorDiv.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--md-sys-color-error);color:var(--md-sys-color-on-error);padding:16px 24px;border-radius:8px;z-index:1000';
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    function initEventListeners() {
        const { show } = getUrlParams();
        const logo = document.querySelector('.site-logo');
        const backBtn = document.getElementById('back-btn');
        
        if (show === 'courage-hindi' || show === 'courage-eng') {
            backBtn.textContent = 'CN';
            backBtn.setAttribute('aria-label', 'Go to Courage Networks');
            backBtn.addEventListener('click', () => window.location.href = 'https://courage-networks.pages.dev');
        } else {
            backBtn.addEventListener('click', () => window.location.href = '/');
        }
        
        logo.addEventListener('click', () => window.location.href = '/');
        logo.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = '/';
            }
        });
    }

    loadShow();
    initEventListeners();
})();

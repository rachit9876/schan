(function () {
    'use strict';
    let shows = [];

    async function loadApp() {
        checkVersion();
        try {
            const res = await fetch('json/shows.json');
            shows = await res.json();
            setupHero();
            renderGrid();
        } catch (e) {
            console.error(e);
        }
    }

    function setupHero() {
        if (!shows.length) return;
        const randomShow = shows[Math.floor(Math.random() * shows.length)];
        document.getElementById('hero-bg').style.backgroundImage = `url('${randomShow.thumbnail}')`;
        document.getElementById('hero-title').textContent = randomShow.title;
        
        const btn = document.getElementById('hero-play');
        btn.disabled = false;
        btn.onclick = () => {
            const lastEp = parseInt(localStorage.getItem(`lastEpisode_${randomShow.id}`)) || 0;
            const lastSeason = localStorage.getItem(`lastSeason_${randomShow.id}`);
            let url = `player.html?show=${randomShow.id}&episode=${lastEp + 1}`;
            if (lastSeason) url += `&season=${lastSeason}`;
            window.location.href = url;
        };
    }

    function renderGrid() {
        const grid = document.getElementById('shows-grid');
        grid.innerHTML = '';
        shows.forEach(show => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${show.thumbnail}" alt="${show.title}" class="card-img" loading="lazy">
                <div class="card-info">
                    <h3>${show.title}</h3>
                </div>
            `;
            card.onclick = () => {
                const lastEp = parseInt(localStorage.getItem(`lastEpisode_${show.id}`)) || 0;
                const lastSeason = localStorage.getItem(`lastSeason_${show.id}`);
                let url = `player.html?show=${show.id}&episode=${lastEp + 1}`;
                if (lastSeason) url += `&season=${lastSeason}`;
                window.location.href = url;
            };
            grid.appendChild(card);
        });
    }

    async function checkVersion() {
        try {
            const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
            const { version } = await res.json();
            const cached = localStorage.getItem('appVersion');
            document.getElementById('version-display').textContent = `v${cached || version}`;

            if (cached && cached !== version) {
                if(confirm(`New update available (v${version}). Click OK to refresh and apply.`)) {
                    localStorage.setItem('appVersion', version);
                    if ('caches' in window) {
                        const keys = await caches.keys();
                        await Promise.all(keys.map(k => caches.delete(k)));
                    }
                    window.location.reload(true);
                }
            } else if (!cached) {
                localStorage.setItem('appVersion', version);
            }
        } catch (e) { console.error('Version check failed'); }
    }

    document.getElementById('clear-history-btn').onclick = () => {
        if(confirm("Clear your entire watch history?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
    loadApp();
})();
(function() {
    'use strict';
    
    let shows = [];

    async function checkVersion() {
        try {
            const response = await fetch('https://schan.pages.dev/version.json?t=' + Date.now(), { cache: 'no-store' });
            const { version } = await response.json();
            const cachedVersion = localStorage.getItem('appVersion');
            
            document.getElementById('version-display').textContent = `v${cachedVersion || version}`;
            
            if (cachedVersion && cachedVersion !== version) {
                const keys = Object.keys(localStorage).filter(k => k.startsWith('lastEpisode_'));
                const size = new Blob([JSON.stringify(localStorage)]).size;
                const sizeKB = (size / 1024).toFixed(2);
                
                const dialog = document.createElement('div');
                dialog.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999';
                dialog.innerHTML = `
                    <div style="background:var(--md-sys-color-surface-container-high);padding:24px;border-radius:16px;max-width:400px;box-shadow:0 8px 32px rgba(0,0,0,0.5)">
                        <h3 style="margin:0 0 16px;color:var(--md-sys-color-on-surface);font-size:20px;font-weight:500">New Version Available</h3>
                        <p style="margin:0 0 8px;color:var(--md-sys-color-on-surface-variant);font-size:14px;line-height:1.5">Clear cache to update to v${version}?</p>
                        <p style="margin:0 0 20px;color:var(--md-sys-color-on-surface-variant);font-size:13px">Watch history: ${keys.length} show(s) (~${sizeKB} KB)</p>
                        <div style="display:flex;gap:12px;justify-content:flex-end">
                            <button id="cancel-update" style="background:transparent;color:var(--md-sys-color-primary);border:none;padding:10px 24px;border-radius:100px;cursor:pointer;font-size:14px;font-weight:500">Later</button>
                            <button id="confirm-update" style="background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);border:none;padding:10px 24px;border-radius:100px;cursor:pointer;font-size:14px;font-weight:500">Update</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(dialog);
                
                dialog.querySelector('#cancel-update').onclick = () => dialog.remove();
                dialog.querySelector('#confirm-update').onclick = () => {
                    localStorage.clear();
                    localStorage.setItem('appVersion', version);
                    window.location.reload(true);
                };
            } else if (!cachedVersion) {
                localStorage.setItem('appVersion', version);
            }
        } catch (error) {
            console.error('Version check failed:', error);
        }
    }

    async function loadShows() {
        try {
            const response = await fetch('json/shows.json');
            shows = await response.json();
            displayShows();
        } catch (error) {
            console.error('Error loading shows:', error);
            showError('Failed to load shows. Please refresh the page.');
        }
    }

    function displayShows() {
        const grid = document.getElementById('shows-grid');
        grid.innerHTML = '';
        
        shows.forEach(show => {
            const card = document.createElement('div');
            card.className = 'show-card';
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Watch ${show.title}`);
            
            const img = document.createElement('img');
            img.className = 'skeleton';
            img.alt = show.title;
            img.loading = 'lazy';
            img.onload = () => {
                img.classList.remove('skeleton');
                img.classList.add('loaded');
            };
            img.src = show.thumbnail;
            
            const h3 = document.createElement('h3');
            h3.textContent = show.title;
            
            card.appendChild(img);
            card.appendChild(h3);
            
            const handleActivation = () => {
                const lastEpisode = parseInt(localStorage.getItem(`lastEpisode_${show.id}`)) || 0;
                window.location.href = `player.html?show=${show.id}&episode=${lastEpisode + 1}`;
            };
            card.addEventListener('click', handleActivation);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleActivation();
                }
            });
            
            grid.appendChild(card);
        });
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = message;
        errorDiv.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--md-sys-color-error);color:var(--md-sys-color-on-error);padding:16px 24px;border-radius:8px;z-index:1000';
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    function initEventListeners() {
        const installBtn = document.getElementById('install-btn');
        const clearHistoryBtn = document.getElementById('clear-history-btn');
        const helpBtn = document.getElementById('help-btn');
        let deferredPrompt;
        
        helpBtn.addEventListener('click', () => window.open('https://flow-svg.pages.dev/#schan', '_blank'));
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtn.style.display = 'flex';
        });
        
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    installBtn.style.display = 'none';
                }
                deferredPrompt = null;
            }
        });
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        }
        
        clearHistoryBtn.addEventListener('click', () => {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('lastEpisode_'));
            const size = new Blob([JSON.stringify(localStorage)]).size;
            const sizeKB = (size / 1024).toFixed(2);
            
            const dialog = document.createElement('div');
            dialog.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999';
            dialog.innerHTML = `
                <div style="background:var(--md-sys-color-surface-container-high);padding:24px;border-radius:16px;max-width:400px;box-shadow:0 8px 32px rgba(0,0,0,0.5)">
                    <h3 style="margin:0 0 16px;color:var(--md-sys-color-on-surface);font-size:20px;font-weight:500">Clear Watch History?</h3>
                    <p style="margin:0 0 8px;color:var(--md-sys-color-on-surface-variant);font-size:14px;line-height:1.5">This will delete your last watched episode for ${keys.length} show(s).</p>
                    <p style="margin:0 0 20px;color:var(--md-sys-color-on-surface-variant);font-size:13px">Cache size: ~${sizeKB} KB</p>
                    <div style="display:flex;gap:12px;justify-content:flex-end">
                        <button id="cancel-btn" style="background:transparent;color:var(--md-sys-color-primary);border:none;padding:10px 24px;border-radius:100px;cursor:pointer;font-size:14px;font-weight:500">Cancel</button>
                        <button id="sure-btn" style="background:var(--md-sys-color-error);color:var(--md-sys-color-on-error);border:none;padding:10px 24px;border-radius:100px;cursor:pointer;font-size:14px;font-weight:500">Sure</button>
                    </div>
                </div>
            `;
            document.body.appendChild(dialog);
            
            dialog.querySelector('#cancel-btn').onclick = () => dialog.remove();
            dialog.querySelector('#sure-btn').onclick = () => {
                localStorage.clear();
                dialog.remove();
                window.location.reload(true);
            };
            dialog.onclick = (e) => { if (e.target === dialog) dialog.remove(); };
        });
    }

    initEventListeners();
    checkVersion();
    loadShows();
})();

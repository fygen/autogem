/**
 * Overlay UI Component
 * Uses Shadow DOM to isolate the extension's UI from the host page.
 */
window.InstaGem = window.InstaGem || {};
window.InstaGem.Overlay = class Overlay {
    constructor() {
        this.randomId = 'ig-' + Math.random().toString(36).substring(2, 9);
        this.container = document.createElement('div');
        this.container.id = this.randomId;
        this.shadow = this.container.attachShadow({ mode: 'closed' });
        this.isMinimized = false;
        this.isDragging = false;
        this.pos = { x: 0, y: 0 };
    }

    async inject() {
        if (document.getElementById(this.container.id)) return;
        
        const data = await chrome.storage.local.get(['overlayPos', 'isMinimized']);
        this.pos = data.overlayPos || { x: 15, y: 15 };
        this.isMinimized = data.isMinimized || false;

        const tryInject = () => {
            if (document.body) {
                document.body.appendChild(this.container);
                this.render();
                this.setupListeners();
                this.updateUIState();
            } else {
                setTimeout(tryInject, 100);
            }
        };

        tryInject();
    }

    render() {
        const style = document.createElement('style');
        style.textContent = `
            :host {
                position: fixed;
                top: ${this.pos.y}px;
                right: ${this.pos.x}px;
                z-index: 2147483647;
                pointer-events: none;
                user-select: none;
            }
            .panel {
                pointer-events: auto;
                background: #121212;
                color: #e0e0e0;
                padding: 10px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                width: 200px;
                border: 1px solid #333;
                font-family: -apple-system, system-ui, sans-serif;
                transition: height 0.3s, width 0.3s;
                overflow: hidden;
            }
            .panel.minimized {
                width: 40px;
                height: 40px;
                padding: 0;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #3897f0;
                cursor: pointer;
            }
            .panel.minimized #content { display: none; }
            .panel.minimized .header { display: none; }
            .panel.minimized #min-icon { display: block; font-size: 20px; color: white; font-weight: bold; }

            #min-icon { display: none; }

            .header {
                font-weight: bold;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #333;
                padding-bottom: 6px;
                cursor: move;
                font-size: 13px;
            }
            .status { font-size: 9px; color: #3897f0; text-transform: uppercase; }
            .btn-group { display: flex; flex-direction: column; gap: 4px; }
            .btn {
                background: #333;
                color: white;
                border: 1px solid #444;
                padding: 6px;
                border-radius: 6px;
                cursor: pointer;
                width: 100%;
                font-size: 11px;
                transition: all 0.2s;
            }
            .btn:hover { background: #444; border-color: #3897f0; }
            .btn.active { background: #ed4956; border-color: #ff5a60; }
            .btn.danger { background: #551111; border-color: #772222; color: #ffcccc; }
            .btn.danger:hover { background: #772222; border-color: #ed4956; }
            
            .log {
                font-family: 'Consolas', monospace;
                font-size: 9px;
                max-height: 60px;
                overflow-y: auto;
                background: #000;
                padding: 4px;
                margin-top: 8px;
                border-radius: 4px;
                color: #4af626;
                border: 1px solid #222;
            }
            #close-btn { cursor: pointer; color: #888; font-size: 16px; }
            #close-btn:hover { color: white; }
        `;

        this.panel = document.createElement('div');
        this.panel.className = 'panel';
        if (this.isMinimized) this.panel.classList.add('minimized');

        this.panel.innerHTML = `
            <div id="min-icon">G</div>
            <div class="header" id="drag-handle">
                InstaGem
                <div style="display:flex; align-items:center; gap:6px;">
                    <span class="status" id="status">Idle</span>
                    <span id="close-btn">−</span>
                </div>
            </div>
            <div id="content">
                <div class="btn-group">
                    <button class="btn" id="record-btn">Start Record</button>
                    <button class="btn" id="play-btn">Play Script</button>
                    <button class="btn danger" id="stop-btn">Stop & Clear</button>
                    <button class="btn" id="generate-btn" style="background:#222; color:#888; border-color:#333; font-size:9px;">Generate F12 Code</button>
                </div>
                <div class="log" id="log">Ready.</div>
            </div>
        `;

        this.shadow.innerHTML = '';
        this.shadow.appendChild(style);
        this.shadow.appendChild(this.panel);
    }

    setupListeners() {
        const handle = this.shadow.getElementById('drag-handle');
        const minIcon = this.shadow.getElementById('min-icon');
        const closeBtn = this.shadow.getElementById('close-btn');

        handle.onmousedown = (e) => this.startDragging(e);
        minIcon.onclick = () => this.toggleMinimize();
        closeBtn.onclick = () => this.toggleMinimize();

        this.shadow.getElementById('record-btn').onclick = () => window.dispatchEvent(new CustomEvent('instagem-toggle-record'));
        this.shadow.getElementById('play-btn').onclick = () => window.dispatchEvent(new CustomEvent('instagem-play'));
        this.shadow.getElementById('stop-btn').onclick = () => window.dispatchEvent(new CustomEvent('instagem-stop'));
        this.shadow.getElementById('generate-btn').onclick = () => window.dispatchEvent(new CustomEvent('instagem-generate'));
        
        window.addEventListener('mousemove', (e) => this.drag(e));
        window.addEventListener('mouseup', () => this.stopDragging());
    }

    startDragging(e) {
        this.isDragging = true;
        this.dragOffset = {
            x: e.clientX - this.container.getBoundingClientRect().right,
            y: e.clientY - this.container.getBoundingClientRect().top
        };
    }

    drag(e) {
        if (!this.isDragging) return;
        const x = window.innerWidth - e.clientX + this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;
        this.pos = { x: Math.max(0, x), y: Math.max(0, y) };
        this.container.style.right = this.pos.x + 'px';
        this.container.style.top = this.pos.y + 'px';
    }

    stopDragging() {
        if (this.isDragging) {
            this.isDragging = false;
            chrome.storage.local.set({ overlayPos: this.pos });
        }
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.updateUIState();
        chrome.storage.local.set({ isMinimized: this.isMinimized });
    }

    updateUIState() {
        if (this.isMinimized) {
            this.panel.classList.add('minimized');
        } else {
            this.panel.classList.remove('minimized');
        }
    }

    updateStatus(status) {
        const statusEl = this.shadow.getElementById('status');
        if (!statusEl) return;
        statusEl.textContent = status;
        const recordBtn = this.shadow.getElementById('record-btn');
        if (status === 'Recording') {
            recordBtn.textContent = 'Stop Recording';
            recordBtn.classList.add('active');
        } else {
            recordBtn.textContent = 'Start Record';
            recordBtn.classList.remove('active');
        }
    }

    log(message) {
        const logEl = this.shadow.getElementById('log');
        if (!logEl) return;
        const entry = document.createElement('div');
        entry.textContent = `> ${message}`;
        logEl.appendChild(entry);
        logEl.scrollTop = logEl.scrollHeight;
    }
}

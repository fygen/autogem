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
        this.isVisible = false;
    }

    inject() {
        if (document.getElementById(this.container.id)) return;
        
        const tryInject = () => {
            if (document.body) {
                document.body.appendChild(this.container);
                this.render();
                this.isVisible = true;
                this.setupListeners();
                console.log("InstaGem UI Injected with ID:", this.randomId);
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
                top: 15px;
                right: 15px;
                z-index: 2147483647;
                pointer-events: none;
            }
            .panel {
                pointer-events: auto;
                background: #121212;
                color: #e0e0e0;
                padding: 15px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                width: 260px;
                border: 1px solid #333;
                font-family: -apple-system, system-ui, sans-serif;
            }
            .header {
                font-weight: bold;
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #333;
                padding-bottom: 8px;
            }
            .status { font-size: 11px; color: #3897f0; text-transform: uppercase; }
            .btn {
                background: #333;
                color: white;
                border: 1px solid #444;
                padding: 10px;
                border-radius: 6px;
                cursor: pointer;
                width: 100%;
                margin-top: 8px;
                font-size: 13px;
                transition: all 0.2s;
            }
            .btn:hover { background: #444; border-color: #3897f0; }
            .btn.active { background: #ed4956; border-color: #ff5a60; }
            .btn.secondary { background: #222; border-color: #444; color: #aaa; }
            .btn.secondary:hover { border-color: #3897f0; color: #fff; }
            .log {
                font-family: 'Consolas', monospace;
                font-size: 11px;
                max-height: 120px;
                overflow-y: auto;
                background: #000;
                padding: 8px;
                margin-top: 12px;
                border-radius: 6px;
                color: #4af626;
                border: 1px solid #222;
            }
        `;

        this.panel = document.createElement('div');
        this.panel.className = 'panel';
        this.panel.innerHTML = `
            <div class="header">
                InstaGem Pro
                <span class="status" id="status">Idle</span>
            </div>
            <div id="controls">
                <button class="btn" id="record-btn">Start Recording</button>
                <button class="btn" id="play-btn">Play Last Script</button>
                <button class="btn secondary" id="generate-btn">Generate Console Code</button>
            </div>
            <div class="log" id="log">Engine ready. Waiting for input...</div>
        `;

        this.shadow.appendChild(style);
        this.shadow.appendChild(this.panel);
    }

    setupListeners() {
        this.shadow.getElementById('record-btn').onclick = () => {
            window.dispatchEvent(new CustomEvent('instagem-toggle-record'));
        };
        this.shadow.getElementById('play-btn').onclick = () => {
            window.dispatchEvent(new CustomEvent('instagem-play'));
        };
        this.shadow.getElementById('generate-btn').onclick = () => {
            window.dispatchEvent(new CustomEvent('instagem-generate'));
        };
    }

    updateStatus(status) {
        const statusEl = this.shadow.getElementById('status');
        const recordBtn = this.shadow.getElementById('record-btn');
        statusEl.textContent = status;

        if (status === 'Recording') {
            recordBtn.textContent = 'Stop Recording';
            recordBtn.classList.add('active');
        } else {
            recordBtn.textContent = 'Start Recording';
            recordBtn.classList.remove('active');
        }
    }

    log(message) {
        const logEl = this.shadow.getElementById('log');
        const entry = document.createElement('div');
        entry.textContent = `> ${message}`;
        logEl.appendChild(entry);
        logEl.scrollTop = logEl.scrollHeight;
    }
}

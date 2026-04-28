/**
 * Main Content Script Orchestrator
 */
class InstaGemCore {
    constructor() {
        const { Recorder, Player, Overlay } = window.InstaGem;
        this.recorder = new Recorder();
        this.player = new Player();
        this.overlay = new Overlay();
        this.lastScript = [];

        this.init();
    }

    async init() {
        console.log("InstaGem Core Initializing...");
        
        // Load persistent data
        const data = await chrome.storage.local.get(['lastScript', 'isRecording']);
        if (data.lastScript) {
            this.lastScript = data.lastScript;
        }

        // Always inject overlay if we have a script or are recording
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            this.overlay.inject();
        } else {
            window.addEventListener('DOMContentLoaded', () => this.overlay.inject());
        }

        this.setupEventListeners();

        // Resume recording if it was active
        if (data.isRecording) {
            this.recorder.start();
            this.overlay.updateStatus('Recording');
            this.overlay.log('Resumed recording after refresh...');
        } else if (this.lastScript.length > 0) {
            this.overlay.log(`Ready. Loaded ${this.lastScript.length} steps.`);
        }
    }

    setupEventListeners() {
        window.addEventListener('instagem-toggle-record', () => this.toggleRecording());
        window.addEventListener('instagem-play', () => this.playLastScript());
        window.addEventListener('instagem-generate', () => this.generateConsoleCode());

        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'PING') {
                sendResponse({ status: 'ALIVE' });
            } else if (message.action === 'TOGGLE_RECORD') {
                this.toggleRecording();
                sendResponse({ isRecording: this.recorder.isRecording });
            } else if (message.action === 'PLAY') {
                this.playLastScript();
                sendResponse({ status: 'PLAYING' });
            } else if (message.action === 'GENERATE') {
                this.generateConsoleCode();
                sendResponse({ status: 'GENERATED' });
            }
            return true;
        });

        this.recorder.onStepCaptured = (step) => {
            this.lastScript.push(step);
            this.overlay.log(`Captured: ${step.type} on ${step.selector}`);
            chrome.storage.local.set({ lastScript: this.lastScript });
        };
    }

    toggleRecording() {
        if (this.recorder.isRecording) {
            this.recorder.stop();
            this.overlay.updateStatus('Idle');
            this.overlay.log(`Recording finished. Total steps: ${this.lastScript.length}`);
            chrome.storage.local.set({ isRecording: false });
        } else {
            this.lastScript = []; 
            chrome.storage.local.set({ lastScript: [] });
            
            this.recorder.start();
            this.overlay.updateStatus('Recording');
            this.overlay.log('Recording interactions...');
            chrome.storage.local.set({ isRecording: true });
        }
    }

    async playLastScript() {
        if (this.player.isPlaying) return;
        if (this.lastScript.length === 0) {
            this.overlay.log('No script to play!');
            return;
        }
        this.overlay.updateStatus('Playing');
        this.overlay.log('Starting playback...');
        await this.player.play(this.lastScript);
        this.overlay.updateStatus('Idle');
        this.overlay.log('Playback complete.');
    }

    generateConsoleCode() {
        if (this.lastScript.length === 0) {
            this.overlay.log("Nothing to generate.");
            return;
        }

        let code = `(async () => {
    const delay = (ms) => new Promise(res => setTimeout(res, ms));
    const humanClick = async (el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = rect.left + rect.width / 2 + (Math.random() * 10 - 5);
        const y = rect.top + rect.height / 2 + (Math.random() * 10 - 5);
        el.dispatchEvent(new MouseEvent('mousedown', { clientX: x, clientY: y, bubbles: true }));
        await delay(Math.random() * 100 + 50);
        el.dispatchEvent(new MouseEvent('mouseup', { clientX: x, clientY: y, bubbles: true }));
        el.click();
    };
    const humanType = async (el, val) => {
        if (!el) return;
        el.focus();
        el.value = '';
        for (const char of val) {
            el.value += char;
            el.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await delay(Math.random() * 150 + 50);
        }
    };

    console.log("Starting InstaGem Automation...");
`;

        this.lastScript.forEach((step, i) => {
            code += `\n    // Step ${i+1}: ${step.type} on ${step.selector}\n`;
            code += `    const el${i} = document.querySelector(\`${step.selector}\`);\n`;
            if (step.type === 'click') {
                code += `    await humanClick(el${i});\n`;
            } else if (step.type === 'type') {
                code += `    await humanType(el${i}, \`${step.value}\`);\n`;
            }
            code += `    await delay(Math.random() * 1000 + 1000);\n`;
        });

        code += `\n    console.log("Automation Complete.");\n})();`;

        console.log("%c--- INSTAGEM CONSOLE CODE ---", "color: #3897f0; font-weight: bold;");
        console.log(code);
        
        this.overlay.log("Generated! Check F12 Console.");
        
        try {
            const textarea = document.createElement('textarea');
            textarea.value = code;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.overlay.log("Copied to clipboard.");
        } catch (e) {
            this.overlay.log("Copy manual from console.");
        }
    }
}

// Start engine
if (!window.instaGemInitialized) {
    window.instaGemInitialized = true;
    new InstaGemCore();
}

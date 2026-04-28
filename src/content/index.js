(function() {
    /**
     * InstaGem Pro - Executor (The Hands & Eyes)
     */
    class InstaGemExecutor {
        constructor() {
            const { Recorder, Player, Overlay } = window.InstaGem;
            this.recorder = new Recorder();
            this.player = new Player();
            this.overlay = new Overlay();
            this.init();
        }

        async init() {
            console.log("InstaGem Executor Initializing...");
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                await this.overlay.inject();
            } else {
                window.addEventListener('DOMContentLoaded', async () => await this.overlay.inject());
            }

            this.setupListeners();
            this.syncWithBackground();
        }

        setupListeners() {
            // Background commands
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.action === 'EXECUTE_STEP') {
                    this.runStep(message.step, message.index);
                    sendResponse({ status: 'received' });
                } else if (message.action === 'GENERATE') {
                    chrome.runtime.sendMessage({ action: 'GET_STATE' }, (state) => {
                        this.generateConsoleCode(state.lastScript);
                    });
                }
                return true;
            });

            // UI Buttons in the page
            window.addEventListener('instagem-toggle-record', () => {
                chrome.runtime.sendMessage({ action: 'GET_STATE' }, (state) => {
                    if (state.isRecording) {
                        this.recorder.stop();
                        chrome.runtime.sendMessage({ action: 'STOP_RECORDING' });
                        this.overlay.updateStatus('Idle');
                    } else {
                        chrome.runtime.sendMessage({ action: 'START_RECORDING' });
                        this.recorder.start();
                        this.overlay.updateStatus('Recording');
                    }
                });
            });

            window.addEventListener('instagem-play', () => chrome.runtime.sendMessage({ action: 'START_PLAYBACK' }));
            window.addEventListener('instagem-stop', () => chrome.runtime.sendMessage({ action: 'STOP_ALL' }));
            window.addEventListener('instagem-generate', () => window.dispatchEvent(new CustomEvent('instagem-generate-internal')));
            
            // Step Captured by Recorder
            this.recorder.onStepCaptured = (step) => {
                this.overlay.log(`Captured: ${step.type}`);
                chrome.runtime.sendMessage({ action: 'STEP_CAPTURED', step: step });
            };
        }

        async syncWithBackground() {
            chrome.runtime.sendMessage({ action: 'GET_STATE' }, (state) => {
                if (!state) return;
                if (state.isRecording) {
                    this.recorder.start();
                    this.overlay.updateStatus('Recording');
                }
                if (state.isPlaying) {
                    this.overlay.updateStatus('Playing');
                    this.overlay.log(`Auto-resuming step ${state.currentIndex + 1}...`);
                }
            });
        }

        async runStep(step, index) {
            this.overlay.updateStatus('Playing');
            this.overlay.log(`Step ${index + 1}: ${step.type} on ${step.selector}`);
            
            const success = await this.player.executeStep(step);
            if (success) {
                chrome.runtime.sendMessage({ action: 'STEP_COMPLETED' });
            } else {
                this.overlay.log(`Step ${index + 1} failed. Retrying from background...`);
                chrome.runtime.sendMessage({ action: 'STEP_FAILED' });
            }
        }

        generateConsoleCode(script) {
            if (!script || script.length === 0) {
                this.overlay.log("No steps to generate.");
                return;
            }
            let code = `(async () => {
    const delay = (ms) => new Promise(res => setTimeout(res, ms));
    const humanClick = async (el) => {
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        await delay(500);
        el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        await delay(100);
        el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
        if (typeof el.click === "function") el.click();
        else el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    };
    console.log("InstaGem F12 Script Start");\n`;

            script.forEach((step, i) => {
                const sel = step.selector.replace(/`/g, '\\`');
                code += `\n    // Step ${i+1}\n    const el${i} = document.querySelector(\`${sel}\`);\n`;
                if (step.type === 'click') code += `    await humanClick(el${i});\n`;
                code += `    await delay(2000);\n`;
            });
            code += `\n    console.log("InstaGem Script Finished.");\n})();`;
            console.log(code);
            this.overlay.log("Check F12 console for code!");
        }
    }

    if (!window.instaGemInitialized) {
        window.instaGemInitialized = true;
        new InstaGemExecutor();
    }
})();

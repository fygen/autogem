/**
 * Interaction Player
 * Executes a sequence of automation steps.
 */
window.InstaGem = window.InstaGem || {};
window.InstaGem.Player = class Player {
    constructor() {
        this.isPlaying = false;
        this.stopRequested = false;
    }

    async play(steps) {
        const Humanizer = window.InstaGem.Humanizer;
        this.isPlaying = true;
        this.stopRequested = false;
        console.log("Starting playback...");

        for (const step of steps) {
            if (this.stopRequested) break;
            
            await this.executeStep(step);
            // Dynamic delay between steps
            await Humanizer.delay(800, 2000);
        }

        this.isPlaying = false;
        console.log("Playback finished.");
    }

    stop() {
        this.stopRequested = true;
    }

    async executeStep(step) {
        console.log("Executing step:", step.type, step.selector);
        
        const element = document.querySelector(step.selector);
        if (!element) {
            console.warn("Element not found for selector:", step.selector);
            return;
        }

        switch (step.type) {
            case 'click':
                await this.humanClick(element);
                break;
            case 'type':
                await this.humanType(element, step.value);
                break;
            case 'scroll':
                window.scrollBy(0, step.distance);
                break;
        }
    }

    async humanClick(element) {
        const Humanizer = window.InstaGem.Humanizer;
        const rect = element.getBoundingClientRect();
        const x = Humanizer.jitter(rect.left + rect.width / 2);
        const y = Humanizer.jitter(rect.top + rect.height / 2);

        element.dispatchEvent(new MouseEvent('mousedown', { clientX: x, clientY: y, bubbles: true }));
        await Humanizer.delay(50, 150);
        element.dispatchEvent(new MouseEvent('mouseup', { clientX: x, clientY: y, bubbles: true }));
        element.click();
    }

    async humanType(element, value) {
        const Humanizer = window.InstaGem.Humanizer;
        element.focus();
        element.value = ''; // Clear existing
        for (const char of value) {
            element.value += char;
            element.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await Humanizer.delay(50, 200); // Variable typing speed
        }
    }
}

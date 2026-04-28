/**
 * Interaction Recorder
 * Captures user events and translates them into automation steps.
 */
window.InstaGem = window.InstaGem || {};
window.InstaGem.Recorder = class Recorder {
    constructor() {
        this.isRecording = false;
        this.steps = [];
        this.onStepCaptured = null;
    }

    start() {
        this.isRecording = true;
        this.steps = [];
        this.addEventListeners();
        console.log("Recording started...");
    }

    stop() {
        this.isRecording = false;
        this.removeEventListeners();
        console.log("Recording stopped. Total steps:", this.steps.length);
        return this.steps;
    }

    addEventListeners() {
        document.addEventListener('mousedown', this.handleClick.bind(this), true);
        document.addEventListener('input', this.handleInput.bind(this), true);
    }

    removeEventListeners() {
        document.removeEventListener('mousedown', this.handleClick.bind(this), true);
        document.removeEventListener('input', this.handleInput.bind(this), true);
    }

    shouldIgnore(target) {
        // Ignore if the element is part of the InstaGem UI
        let el = target;
        while (el) {
            if (el.id && el.id.startsWith('ig-')) return true;
            if (el.tagName === 'INSTAGEM-UI') return true; // Just in case
            if (el.shadowRoot) return true; // Most likely our overlay
            el = el.parentElement || el.parentNode;
        }
        return false;
    }

    handleClick(event) {
        if (!this.isRecording) return;
        if (this.shouldIgnore(event.target)) return;

        const selector = window.InstaGem.Selector.getUniqueSelector(event.target);
        if (!selector) return;

        this.captureStep({
            type: 'click',
            selector: selector,
            timestamp: Date.now()
        });
    }

    handleInput(event) {
        if (!this.isRecording) return;
        if (this.shouldIgnore(event.target)) return;

        const selector = window.InstaGem.Selector.getUniqueSelector(event.target);
        if (!selector) return;

        this.captureStep({
            type: 'type',
            selector: selector,
            value: event.target.value,
            timestamp: Date.now()
        });
    }

    captureStep(step) {
        this.steps.push(step);
        if (this.onStepCaptured) {
            this.onStepCaptured(step);
        }
    }
}

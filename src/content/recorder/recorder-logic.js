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
        document.addEventListener('click', this.handleClick.bind(this), true);
        document.addEventListener('input', this.handleInput.bind(this), true);
    }

    removeEventListeners() {
        document.removeEventListener('click', this.handleClick.bind(this), true);
        document.removeEventListener('input', this.handleInput.bind(this), true);
    }

    handleClick(event) {
        if (!this.isRecording) return;
        const selector = window.InstaGem.Selector.getUniqueSelector(event.target);
        this.captureStep({
            type: 'click',
            selector: selector,
            timestamp: Date.now()
        });
    }

    handleInput(event) {
        if (!this.isRecording) return;
        const selector = window.InstaGem.Selector.getUniqueSelector(event.target);
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

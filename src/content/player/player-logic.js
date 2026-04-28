/**
 * Interaction Player
 * Executes a sequence of automation steps with Smart Recovery.
 */
window.InstaGem = window.InstaGem || {};
window.InstaGem.Player = class Player {
    constructor() {
        this.isPlaying = false;
        this.stopRequested = false;
        this.currentIndex = 0;
    }

    async safeChromeCall(fn) {
        if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
            try { return await fn(); } catch (e) {}
        }
        return null;
    }

    async play(steps, startIndex = 0) {
        const Humanizer = window.InstaGem.Humanizer;
        this.isPlaying = true;
        this.stopRequested = false;
        this.currentIndex = startIndex;

        for (let i = this.currentIndex; i < steps.length; i++) {
            if (this.stopRequested) break;
            
            this.currentIndex = i;
            await this.safeChromeCall(() => chrome.storage.local.set({ currentStepIndex: i, isPlaying: true }));

            const success = await this.executeStep(steps[i]);
            if (!success) {
                if (this.stopRequested) break;
                console.warn(`Step ${i + 1} failed. Searching for alternative...`);
                await Humanizer.delay(2000, 3000);
                i--; // Retry or fuzzy search logic will handle it
                continue;
            }

            await Humanizer.delay(1000, 2500);
        }

        this.isPlaying = false;
        await this.safeChromeCall(() => chrome.storage.local.set({ isPlaying: false, currentStepIndex: 0 }));
    }

    stop() {
        this.stopRequested = true;
        this.isPlaying = false;
    }

    async executeStep(step) {
        if (this.stopRequested) return false;
        console.log(`Executing: ${step.type} on ${step.selector}`);
        
        // 1. Try exact match
        let element = await this.waitForElement(step.selector, 8000);
        
        // 2. SMART RECOVERY: Fuzzy match if exact fails
        if (!element) {
            console.log("Exact match failed. Trying fuzzy search...");
            element = this.findFuzzyElement(step.selector);
        }

        if (!element) return false;

        try {
            if (step.type === 'click') {
                await this.humanClick(element);
            } else if (step.type === 'type') {
                await this.humanType(element, step.value);
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    findFuzzyElement(selector) {
        // Extract attributes from selector [attr="val"]
        const attrMatch = selector.match(/\[([a-z-]+)="([^"]+)"\]/i);
        if (attrMatch) {
            const [_, attr, val] = attrMatch;
            // Try finding ANY element with this attribute anywhere
            return document.querySelector(`[${attr}*="${val}"]`) || 
                   document.querySelector(`[${attr}]`);
        }
        
        // Try common class names if selector was class-based
        const classMatch = selector.match(/\.([a-z0-9_-]+)/i);
        if (classMatch) {
            return document.querySelector(`[class*="${classMatch[1]}"]`);
        }

        return null;
    }

    async waitForElement(selector, timeout) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            if (this.stopRequested) return null;
            try {
                const el = document.querySelector(selector);
                if (el && this.isVisible(el)) return el;
            } catch (e) {}
            await new Promise(res => setTimeout(res, 500));
        }
        return null;
    }

    isVisible(el) {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0;
    }

    async humanClick(element) {
        const Humanizer = window.InstaGem.Humanizer;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await Humanizer.delay(300, 600);
        
        const rect = element.getBoundingClientRect();
        const x = Humanizer.jitter(rect.left + rect.width / 2);
        const y = Humanizer.jitter(rect.top + rect.height / 2);

        element.dispatchEvent(new MouseEvent('mousedown', { clientX: x, clientY: y, bubbles: true }));
        await Humanizer.delay(100, 200);
        element.dispatchEvent(new MouseEvent('mouseup', { clientX: x, clientY: y, bubbles: true }));
        
        if (typeof element.click === 'function') element.click();
        else element.dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, bubbles: true }));
    }

    async humanType(element, value) {
        const Humanizer = window.InstaGem.Humanizer;
        element.focus();
        if (element.tagName === 'INPUT' && (element.type === 'range' || element.type === 'number')) {
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }
        element.value = ''; 
        for (const char of String(value)) {
            if (this.stopRequested) break;
            element.value += char;
            element.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await Humanizer.delay(50, 150);
        }
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

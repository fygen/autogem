/**
 * Selector Utility
 * Generates robust CSS selectors for elements.
 */
window.InstaGem = window.InstaGem || {};
window.InstaGem.Selector = {
    /**
     * Generates a unique CSS selector for a given element.
     * Prioritizes ID, then stable attributes, then class names.
     */
    getUniqueSelector(element) {
        if (!(element instanceof Element)) return null;

        // 1. Try ID
        if (element.id) {
            return `#${element.id}`;
        }

        // 2. Try stable attributes (aria-label, title, name)
        const stableAttrs = ['aria-label', 'title', 'name', 'placeholder'];
        for (const attr of stableAttrs) {
            const val = element.getAttribute(attr);
            if (val) {
                return `${element.tagName.toLowerCase()}[${attr}="${val}"]`;
            }
        }

        // 3. Fallback to path-based selector (simplified)
        return this.getPathSelector(element);
    },

    getPathSelector(el) {
        const path = [];
        while (el.nodeType === Node.ELEMENT_NODE) {
            let selector = el.nodeName.toLowerCase();
            if (el.id) {
                selector += '#' + el.id;
                path.unshift(selector);
                break;
            } else {
                let sib = el, nth = 1;
                while (sib = sib.previousElementSibling) {
                    if (sib.nodeName.toLowerCase() === selector) nth++;
                }
                if (nth !== 1) selector += ":nth-of-type(" + nth + ")";
            }
            path.unshift(selector);
            el = el.parentNode;
        }
        return path.join(" > ");
    }
};

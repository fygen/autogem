/**
 * Selector Utility
 * Generates robust CSS selectors for elements.
 */
window.InstaGem = window.InstaGem || {};
window.InstaGem.Selector = {
    getUniqueSelector(element) {
        if (!(element instanceof Element)) return null;

        // 1. ALWAYS go to the interactive parent if it exists
        const interactive = element.closest('button, a, [role="button"], [role="link"], input, select, textarea');
        const target = interactive || element;

        // 2. Try stable attributes (Top priority)
        const stableAttrs = ['aria-label', 'title', 'placeholder', 'name', 'data-testid', 'data-nav'];
        for (const attr of stableAttrs) {
            const val = target.getAttribute(attr);
            if (val) {
                return `${target.tagName.toLowerCase()}[${attr}="${val}"]`;
            }
        }

        // 3. Try unique IDs (Filter out dynamic ones)
        if (target.id && !this.isDynamicId(target.id)) {
            return `#${target.id}`;
        }

        // 4. Use stable classes (Filter out hashes)
        if (target.classList.length > 0) {
            const stableClasses = Array.from(target.classList).filter(c => !this.isDynamicClass(c));
            if (stableClasses.length > 0) {
                const sel = `${target.tagName.toLowerCase()}.${stableClasses.join('.')}`;
                if (this.isUnique(sel)) return sel;
            }
        }

        // 5. Fallback to a very simple path
        return this.getRobustPath(target);
    },

    isUnique(selector) {
        try {
            return document.querySelectorAll(selector).length === 1;
        } catch(e) { return false; }
    },

    isDynamicId(id) {
        // Match Instagram/React/Vue dynamic patterns
        return /mount_|[:.]|^f[0-9]+|^[a-z0-9]{10,}$/i.test(id) || id.startsWith('ig-');
    },

    isDynamicClass(cls) {
        // Classes like 'x1lliihq' (Instagram) are technically stable but hashes like 'abc123xyz' aren't
        // We'll keep Instagram 'x...' classes but filter out very long random strings
        return /^[a-z0-9]{12,}$/i.test(cls) || /^[0-9]/.test(cls);
    },

    getRobustPath(el) {
        const path = [];
        let curr = el;
        while (curr && curr.nodeType === Node.ELEMENT_NODE && path.length < 3) {
            let name = curr.nodeName.toLowerCase();
            if (name === 'body' || name === 'html') break;
            
            let sib = curr, nth = 1;
            while (sib = sib.previousElementSibling) {
                if (sib.nodeName.toLowerCase() === name) nth++;
            }
            path.unshift(name + (nth > 1 ? `:nth-of-type(${nth})` : ''));
            curr = curr.parentNode;
        }
        return path.join(" > ");
    }
};

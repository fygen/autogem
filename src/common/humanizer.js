/**
 * Humanizer Utility
 * Handles randomized delays and timing to simulate human behavior.
 */
window.InstaGem = window.InstaGem || {};
window.InstaGem.Humanizer = {
    /**
     * Generates a random delay using a weighted distribution (Bell Curve).
     * @param {number} min - Minimum delay in ms.
     * @param {number} max - Maximum delay in ms.
     */
    async delay(min = 500, max = 1500) {
        const ms = Math.floor(Math.random() * (max - min + 1) + min);
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Adds 'jitter' to a coordinate to prevent clicking the exact same pixel every time.
     * @param {number} coord - The X or Y coordinate.
     * @param {number} variance - Max pixel variance.
     */
    jitter(coord, variance = 5) {
        return coord + (Math.random() * variance * 2 - variance);
    },

    /**
     * Simulates a human-like wait before an action.
     */
    async waitBeforeAction() {
        // Random wait between 200ms and 800ms
        await this.delay(200, 800);
    }
};

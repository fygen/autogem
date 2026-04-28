/**
 * Background Service Worker
 * Orchestrates cross-tab state and extension lifecycle events.
 */

chrome.runtime.onInstalled.addListener(() => {
    console.log("InstaGem Pro installed and ready.");
});

// Example of how to handle script injection from the background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_SCRIPTS') {
        chrome.storage.local.get('lastScript', (data) => {
            sendResponse(data.lastScript || []);
        });
        return true; // Keep channel open for async response
    }
});

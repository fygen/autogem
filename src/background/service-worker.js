/**
 * InstaGem Pro - Orchestrator (The Brain)
 * living in the Background Service Worker.
 * Persistent across page reloads.
 */

let state = {
    lastScript: [],
    currentIndex: 0,
    isPlaying: false,
    isRecording: false,
    activeTabId: null
};

// Initialize state from storage
chrome.storage.local.get(['lastScript', 'currentIndex', 'isPlaying', 'isRecording'], (data) => {
    state = { ...state, ...data };
    console.log("InstaGem Background initialized with state:", state);
});

// Listen for messages from Popup and Content Scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'GET_STATE':
            sendResponse(state);
            break;
        case 'START_RECORDING':
            startRecording(message.tabId);
            break;
        case 'STOP_RECORDING':
            stopRecording(message.script);
            break;
        case 'START_PLAYBACK':
            startPlayback(message.tabId);
            break;
        case 'STOP_ALL':
            stopEverything();
            break;
        case 'STEP_CAPTURED':
            recordStep(message.step);
            break;
        case 'STEP_COMPLETED':
            handleStepResult(true);
            break;
        case 'STEP_FAILED':
            handleStepResult(false);
            break;
    }
    return true;
});

function startRecording(tabId) {
    state.isRecording = true;
    state.lastScript = [];
    state.activeTabId = tabId;
    chrome.storage.local.set({ isRecording: true, lastScript: [], isPlaying: false });
}

function stopRecording(finalScript) {
    state.isRecording = false;
    if (finalScript) state.lastScript = finalScript;
    chrome.storage.local.set({ isRecording: false, lastScript: state.lastScript });
}

function recordStep(step) {
    if (state.isRecording) {
        state.lastScript.push(step);
        chrome.storage.local.set({ lastScript: state.lastScript });
    }
}

async function startPlayback(tabId) {
    if (state.lastScript.length === 0) return;
    state.isPlaying = true;
    state.currentIndex = 0;
    state.activeTabId = tabId;
    await chrome.storage.local.set({ isPlaying: true, currentIndex: 0 });
    executeNextStep();
}

async function stopEverything() {
    state.isPlaying = false;
    state.isRecording = false;
    state.currentIndex = 0;
    await chrome.storage.local.set({ isPlaying: false, isRecording: false, currentIndex: 0 });
}

async function executeNextStep() {
    if (!state.isPlaying || state.currentIndex >= state.lastScript.length) {
        state.isPlaying = false;
        chrome.storage.local.set({ isPlaying: false });
        console.log("Playback complete.");
        return;
    }

    const step = state.lastScript[state.currentIndex];
    console.log(`Background: Sending step ${state.currentIndex + 1} to tab ${state.activeTabId}`);

    try {
        await chrome.tabs.sendMessage(state.activeTabId, { 
            action: 'EXECUTE_STEP', 
            step: step, 
            index: state.currentIndex 
        });
    } catch (e) {
        console.warn("Background: Tab not ready or closed. Waiting for load...");
        // Adım başarısız olursa, onUpdated dinleyicisi otomatik olarak tekrar deneyecek
    }
}

function handleStepResult(success) {
    if (!state.isPlaying) return;

    if (success) {
        state.currentIndex++;
        chrome.storage.local.set({ currentIndex: state.currentIndex });
        // Bir sonraki adıma geçmeden önce kısa bir gecikme
        setTimeout(executeNextStep, 1500);
    } else {
        console.log("Step failed, retrying in 3 seconds...");
        setTimeout(executeNextStep, 3000);
    }
}

// RESUME LOGIC: Sayfa yenilendiğinde süreci devam ettirir
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === state.activeTabId && changeInfo.status === 'complete') {
        console.log("Background: Tab reloaded. Resuming state...");
        if (state.isPlaying) {
            setTimeout(executeNextStep, 2000); // Sayfanın yerleşmesi için süre tanı
        }
    }
});

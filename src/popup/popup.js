async function updateUI() {
    chrome.runtime.sendMessage({ action: 'GET_STATE' }, (state) => {
        if (!state) return;

        const steps = state.lastScript ? state.lastScript.length : 0;
        const isRecording = state.isRecording;
        const isPlaying = state.isPlaying;

        const stats = document.getElementById('stats');
        const recordBtn = document.getElementById('record-btn');
        const playBtn = document.getElementById('play-btn');
        const indicator = document.getElementById('indicator');

        if (stats) {
            let statusText = isRecording ? 'Recording' : (isPlaying ? 'Playing' : 'Idle');
            stats.textContent = `Steps: ${steps} | ${statusText} ${isPlaying ? '(' + (state.currentIndex + 1) + ')' : ''}`;
        }
        
        if (recordBtn) {
            recordBtn.textContent = isRecording ? 'Stop Recording' : 'Start Recording';
            if (isRecording) recordBtn.classList.add('active');
            else recordBtn.classList.remove('active');
        }

        if (playBtn) {
            if (isPlaying) {
                playBtn.textContent = 'Playing...';
                playBtn.disabled = true;
            } else {
                playBtn.textContent = 'Play Script';
                playBtn.disabled = false;
            }
        }

        if (indicator) {
            if (isRecording || isPlaying) indicator.classList.add('active');
            else indicator.classList.remove('active');
        }
    });
}

async function handleAction(action) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (action === 'TOGGLE_RECORD') {
        chrome.runtime.sendMessage({ action: 'GET_STATE' }, (state) => {
            if (state.isRecording) {
                chrome.runtime.sendMessage({ action: 'STOP_RECORDING' });
            } else {
                chrome.runtime.sendMessage({ action: 'START_RECORDING', tabId: tab.id });
            }
        });
    } else if (action === 'PLAY') {
        chrome.runtime.sendMessage({ action: 'START_PLAYBACK', tabId: tab.id });
    } else if (action === 'STOP') {
        chrome.runtime.sendMessage({ action: 'STOP_ALL' });
    } else if (action === 'GENERATE') {
        // Send to content script to generate and log in console
        chrome.tabs.sendMessage(tab.id, { action: 'GENERATE' });
    }
    
    setTimeout(updateUI, 200);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('record-btn').onclick = () => handleAction('TOGGLE_RECORD');
    document.getElementById('play-btn').onclick = () => handleAction('PLAY');
    document.getElementById('stop-btn').onclick = () => handleAction('STOP');
    document.getElementById('generate-btn').onclick = () => handleAction('GENERATE');

    updateUI();
    setInterval(updateUI, 1000); // Keep popup sync
});

chrome.storage.onChanged.addListener(updateUI);

async function updateUI() {
    const data = await chrome.storage.local.get(['lastScript', 'isRecording']);
    const steps = data.lastScript ? data.lastScript.length : 0;
    const isRecording = data.isRecording || false;

    const stats = document.getElementById('stats');
    const recordBtn = document.getElementById('record-btn');
    const indicator = document.getElementById('indicator');

    stats.textContent = `Steps: ${steps} | ${isRecording ? 'Recording' : 'Idle'}`;
    
    if (isRecording) {
        recordBtn.textContent = 'Stop Recording';
        recordBtn.classList.add('active');
        indicator.classList.add('active');
    } else {
        recordBtn.textContent = 'Start Recording';
        recordBtn.classList.remove('active');
        indicator.classList.remove('active');
    }
}

async function sendMessageToActiveTab(action) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    try {
        await chrome.tabs.sendMessage(tab.id, { action });
    } catch (e) {
        console.error("Content script not ready or not found on this page.");
    }
}

document.getElementById('record-btn').onclick = async () => {
    await sendMessageToActiveTab('TOGGLE_RECORD');
    setTimeout(updateUI, 100);
};

document.getElementById('play-btn').onclick = async () => {
    await sendMessageToActiveTab('PLAY');
};

document.getElementById('generate-btn').onclick = async () => {
    await sendMessageToActiveTab('GENERATE');
};

// Initial update
updateUI();

// Listen for storage changes to update UI in real-time
chrome.storage.onChanged.addListener((changes) => {
    if (changes.lastScript || changes.isRecording) {
        updateUI();
    }
});

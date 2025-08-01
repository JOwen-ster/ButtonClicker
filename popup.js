// Popup script for managing the auto clicker
document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusDiv = document.getElementById('status');
    const statsDiv = document.getElementById('stats');
    const buttonSelector = document.getElementById('buttonSelector');
    const waitTime = document.getElementById('waitTime');
    
    // Load saved settings
    loadSettings();
    updateUI();
    
    // Event listeners
    startBtn.addEventListener('click', startMonitoring);
    stopBtn.addEventListener('click', stopMonitoring);
    
    function loadSettings() {
        chrome.storage.sync.get(['buttonSelector', 'waitTime'], function(result) {
            if (result.buttonSelector) {
                buttonSelector.value = result.buttonSelector;
            }
            if (result.waitTime) {
                waitTime.value = result.waitTime;
            }
        });
    }
    
    function saveSettings() {
        chrome.storage.sync.set({
            buttonSelector: buttonSelector.value,
            waitTime: waitTime.value
        });
    }
    
    function startMonitoring() {
        const selector = buttonSelector.value.trim();
        if (!selector) {
            alert('Please enter a button selector');
            return;
        }
        
        saveSettings();
        
        // Get current active tab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const config = {
                buttonSelector: selector,
                waitTimeMinutes: parseInt(waitTime.value),
                action: 'start'
            };
            
            // Send message to content script
            chrome.tabs.sendMessage(tabs[0].id, config, function(response) {
                if (chrome.runtime.lastError) {
                    console.error('Error:', chrome.runtime.lastError);
                    alert('Failed to start monitoring. Please refresh the page and try again.');
                } else {
                    updateUI();
                }
            });
        });
    }
    
    function stopMonitoring() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'stop'}, function(response) {
                if (!chrome.runtime.lastError) {
                    updateUI();
                }
            });
        });
    }
    
    function updateUI() {
        // Get current status from content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'status'}, function(response) {
                if (chrome.runtime.lastError) {
                    // Content script not ready, show inactive
                    setInactive();
                    return;
                }
                
                if (response && response.isActive) {
                    setActive();
                    updateStats(response.clickCount, response.lastClick);
                } else {
                    setInactive();
                    updateStats(response ? response.clickCount : 0, response ? response.lastClick : null);
                }
            });
        });
    }
    
    function setActive() {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        statusDiv.textContent = 'Status: Active - Monitoring for button';
        statusDiv.className = 'status active';
    }
    
    function setInactive() {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        statusDiv.textContent = 'Status: Inactive';
        statusDiv.className = 'status inactive';
    }
    
    function updateStats(clickCount, lastClick) {
        const lastClickText = lastClick ? new Date(lastClick).toLocaleTimeString() : 'Never';
        statsDiv.textContent = `Clicks: ${clickCount || 0} | Last Click: ${lastClickText}`;
    }
    
    // Update UI every 2 seconds when popup is open
    setInterval(updateUI, 2000);
});
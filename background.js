// Background service worker
chrome.runtime.onInstalled.addListener(function() {
    console.log('Auto Button Clicker extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener(function(tab) {
    // This will open the popup automatically due to the manifest configuration
});

// Optional: Handle messages from content scripts if needed
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Handle any background tasks if needed
    console.log('Background received message:', request);
});
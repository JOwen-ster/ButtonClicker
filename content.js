// Content script - runs on web pages
(function() {
    let isMonitoring = false;
    let monitoringInterval = null;
    let clickCount = 0;
    let lastClick = null;
    let currentSelector = '';
    let waitTimeMs = 30 * 60 * 1000; // 30 minutes default
    
    console.log('Auto Button Clicker: Content script loaded');
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        switch(request.action) {
            case 'start':
                startMonitoring(request.buttonSelector, request.waitTimeMinutes);
                sendResponse({success: true});
                break;
                
            case 'stop':
                stopMonitoring();
                sendResponse({success: true});
                break;
                
            case 'status':
                sendResponse({
                    isActive: isMonitoring,
                    clickCount: clickCount,
                    lastClick: lastClick,
                    selector: currentSelector
                });
                break;
        }
    });
    
    function startMonitoring(selector, waitMinutes) {
        if (isMonitoring) {
            stopMonitoring();
        }
        
        currentSelector = selector;
        waitTimeMs = waitMinutes * 60 * 1000;
        isMonitoring = true;
        
        console.log(`Auto Button Clicker: Started monitoring for "${selector}"`);
        console.log(`Wait time: ${waitMinutes} minutes`);
        
        // Start the monitoring loop
        monitorForButton();
    }
    
    function stopMonitoring() {
        isMonitoring = false;
        
        if (monitoringInterval) {
            clearTimeout(monitoringInterval);
            monitoringInterval = null;
        }
        
        console.log('Auto Button Clicker: Stopped monitoring');
    }
    
    function monitorForButton() {
        if (!isMonitoring) return;
        
        console.log(`Auto Button Clicker: Looking for button "${currentSelector}"`);
        
        const button = findButton(currentSelector);
        
        if (button) {
            clickButton(button);
            // Wait a bit after clicking, then start monitoring again
            monitoringInterval = setTimeout(monitorForButton, 2000);
        } else {
            // Button not found, wait and try again (up to max wait time)
            const checkInterval = Math.min(5000, waitTimeMs / 100); // Check every 5 seconds or 1% of wait time
            monitoringInterval = setTimeout(monitorForButton, checkInterval);
        }
    }
    
    function findButton(selector) {
        try {
            let element = null;
            
            // Try CSS selector first
            if (!selector.startsWith('//')) {
                element = document.querySelector(selector);
            } else {
                // XPath selector
                const result = document.evaluate(
                    selector,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                );
                element = result.singleNodeValue;
            }
            
            // Check if element is visible and clickable
            if (element && isElementClickable(element)) {
                return element;
            }
            
        } catch (error) {
            console.error('Auto Button Clicker: Error finding button:', error);
        }
        
        return null;
    }
    
    function isElementClickable(element) {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            rect.width > 0 &&
            rect.height > 0 &&
            !element.disabled
        );
    }
    
    function clickButton(button) {
        try {
            // Scroll element into view
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Wait a moment for scroll, then click
            setTimeout(() => {
                // Create and dispatch click events
                const events = ['mousedown', 'mouseup', 'click'];
                
                events.forEach(eventType => {
                    const event = new MouseEvent(eventType, {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    button.dispatchEvent(event);
                });
                
                clickCount++;
                lastClick = Date.now();
                
                console.log(`Auto Button Clicker: Button clicked! Total clicks: ${clickCount}`);
                
                // Show visual feedback
                showClickFeedback(button);
                
            }, 500);
            
        } catch (error) {
            console.error('Auto Button Clicker: Error clicking button:', error);
        }
    }
    
    function showClickFeedback(element) {
        // Add temporary visual feedback
        const originalBorder = element.style.border;
        const originalBoxShadow = element.style.boxShadow;
        
        element.style.border = '3px solid #4CAF50';
        element.style.boxShadow = '0 0 10px #4CAF50';
        
        setTimeout(() => {
            element.style.border = originalBorder;
            element.style.boxShadow = originalBoxShadow;
        }, 1000);
        
        // Show notification
        showNotification(`Button clicked! Total: ${clickCount}`);
    }
    
    function showNotification(message) {
        // Create floating notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add animation keyframes
        if (!document.getElementById('auto-clicker-styles')) {
            const style = document.createElement('style');
            style.id = 'auto-clicker-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    // Clean up when page unloads
    window.addEventListener('beforeunload', function() {
        stopMonitoring();
    });
    
})();
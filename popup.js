// YouTheme Popup Script
// Enhanced implementation with advanced element customization

// Add error handling wrapper at the top of the file
function handleChromeError(operation) {
    if (chrome.runtime.lastError) {
        console.error(`Chrome runtime error in ${operation}:`, chrome.runtime.lastError);
        return true;
    }
    return false;
}

// Default themes
const themes = {
    dark: {
        name: 'Dark Theme',
        bodyBackground: '#1a1a1a',
        bodyTextColor: '#e5e5e5',
        headingTextColor: '#ffffff',
        linkColor: '#60a5fa',
        hoverLinkColor: '#93c5fd',
        buttonBackground: '#374151',
        buttonTextColor: '#ffffff',
        inputFieldBackground: '#374151',
        inputFieldTextColor: '#e5e5e5',
        borderDividerColor: '#4b5563',
        imageBrightness: '70'
    },
    midnight: {
        name: 'Midnight Blue',
        bodyBackground: '#0f172a',
        bodyTextColor: '#cbd5e1',
        headingTextColor: '#f1f5f9',
        linkColor: '#38bdf8',
        hoverLinkColor: '#7dd3fc',
        buttonBackground: '#1e293b',
        buttonTextColor: '#f1f5f9',
        inputFieldBackground: '#1e293b',
        inputFieldTextColor: '#cbd5e1',
        borderDividerColor: '#334155',
        imageBrightness: '65'
    },
    dracula: {
        name: 'Dracula',
        bodyBackground: '#282a36',
        bodyTextColor: '#f8f8f2',
        headingTextColor: '#bd93f9',
        linkColor: '#8be9fd',
        hoverLinkColor: '#50fa7b',
        buttonBackground: '#44475a',
        buttonTextColor: '#f8f8f2',
        inputFieldBackground: '#44475a',
        inputFieldTextColor: '#f8f8f2',
        borderDividerColor: '#6272a4',
        imageBrightness: '75'
    }
};

// DOM elements and state
let selectedElementInfo = null;
let isAdvancedMode = false;

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    initializeColorSync();
    initializeRangeSliders();
    loadSavedState();
    testContentScriptConnection(); // Test connection
});

// Initialize all event listeners
function initializeEventListeners() {
    // Preset theme controls
    document.getElementById('applyThemeBtn').addEventListener('click', applyPresetTheme);
    
    // Element selection
    document.getElementById('selectElementBtn').addEventListener('click', toggleElementSelection);
    
    // Custom styling
    document.getElementById('applyCustomStyleBtn').addEventListener('click', applyCustomStyles);
    document.getElementById('resetElementBtn').addEventListener('click', resetElementStyles);
    
    // Advanced toggle
    document.getElementById('advancedToggle').addEventListener('click', toggleAdvancedControls);
    
    // Actions
    document.getElementById('clearAllBtn').addEventListener('click', clearAllStyles);
    
    // Export functionality (if button exists)
    const exportBtn = document.getElementById('exportStylesBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportStyles);
    }
}

// Initialize color picker and text input synchronization
function initializeColorSync() {
    const colorPairs = [
        ['backgroundColorPicker', 'backgroundColorText'],
        ['textColorPicker', 'textColorText'],
        ['borderColorPicker', 'borderColorText']
    ];
    
    colorPairs.forEach(([pickerId, textId]) => {
        const picker = document.getElementById(pickerId);
        const textInput = document.getElementById(textId);
        
        if (picker && textInput) {
            // Sync picker to text
            picker.addEventListener('input', (e) => {
                textInput.value = e.target.value;
            });
            
            // Sync text to picker
            textInput.addEventListener('input', (e) => {
                const value = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(value)) {
                    picker.value = value;
                }
            });
        }
    });
}

// Initialize range slider value displays
function initializeRangeSliders() {
    const rangeControls = [
        ['borderWidthRange', 'borderWidthValue', 'px'],
        ['borderRadiusRange', 'borderRadiusValue', 'px'],
        ['opacityRange', 'opacityValue', '%'],
        ['fontSizeRange', 'fontSizeValue', 'px'],
        ['paddingRange', 'paddingValue', 'px'],
        ['marginRange', 'marginValue', 'px']
    ];
    
    rangeControls.forEach(([rangeId, valueId, unit]) => {
        const range = document.getElementById(rangeId);
        const valueDisplay = document.getElementById(valueId);
        
        if (range && valueDisplay) {
            // Update display on input
            range.addEventListener('input', (e) => {
                valueDisplay.textContent = e.target.value + unit;
            });
            
            // Initialize display
            valueDisplay.textContent = range.value + unit;
        }
    });
}

// Show status message
function showStatus(message, type = 'info') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    status.classList.remove('hidden');
    
    setTimeout(() => {
        status.classList.add('hidden');
    }, 3000);
}

// Helper function to send messages with timeout and error handling
function sendMessageWithTimeout(message, callback, timeout = 5000) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
            console.error('Error querying tabs:', chrome.runtime.lastError);
            showStatus('Error accessing tab', 'warning');
            return;
        }
        
        if (!tabs || tabs.length === 0) {
            showStatus('No active tab found', 'warning');
            return;
        }
        
        let responded = false;
        
        // Set up timeout
        const timeoutId = setTimeout(() => {
            if (!responded) {
                responded = true;
                console.warn('Message timeout for action:', message.action);
                showStatus('Operation timed out. Please refresh the page and try again.', 'warning');
            }
        }, timeout);
        
        chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
            if (responded) return; // Already handled by timeout
            
            responded = true;
            clearTimeout(timeoutId);
            
            if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError);
                showStatus('Please refresh the page and try again', 'warning');
                return;
            }
            
            if (callback) {
                callback(response);
            }
        });
    });
}

// Updated functions using the new helper
function applyPresetTheme() {
    const themeKey = document.getElementById('themeSelect').value;
    if (!themeKey) {
        showStatus('Please select a theme first', 'info');
        return;
    }
    
    const themeData = themes[themeKey];
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
            showStatus('Please refresh the page and try again', 'warning');
            return;
        }
        
        try {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'applyThemeToPage',
                themeData: themeData
            }, (response) => {
                // Handle response or error
                if (chrome.runtime.lastError) {
                    console.log('Content script not available, page may need refresh');
                    showStatus('Please refresh the page to enable theming', 'warning');
                    return;
                }
                
                if (response?.success) {
                    showStatus(`${themeData.name} applied successfully!`, 'success');
                    chrome.storage.local.set({ activeTheme: themeKey, themePalette: themeData });
                } else {
                    showStatus('Theme applied (refresh page if needed)', 'info');
                    chrome.storage.local.set({ activeTheme: themeKey, themePalette: themeData });
                }
            });
        } catch (error) {
            console.error('Error sending message:', error);
            showStatus('Please refresh the page and try again', 'warning');
        }
    });
}

function toggleElementSelection() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
            showStatus('Please refresh the page and try again', 'warning');
            return;
        }
        
        try {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'toggleSelectionMode',
                enabled: true
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('Content script not available for element selection');
                    showStatus('Please refresh the page to enable element selection', 'warning');
                    return;
                }
                
                if (response?.success) {
                    showStatus('Click on any element on the page to customize it', 'info');
                    document.getElementById('selectElementBtn').textContent = '🎯 Selecting... (Click on page)';
                    document.getElementById('selectElementBtn').style.background = '#fbbf24';
                    document.getElementById('selectElementBtn').style.color = '#92400e';
                } else {
                    showStatus('Element selection may not work - try refreshing the page', 'warning');
                }
            });
        } catch (error) {
            console.error('Error sending message:', error);
            showStatus('Please refresh the page and try again', 'warning');
        }
    });
}

function applyCustomStyles() {
    if (!selectedElementInfo) {
        showStatus('Please select an element first', 'info');
        return;
    }
    
    const styles = collectCurrentStyles();
    
    if (Object.keys(styles).length === 0) {
        showStatus('Please modify at least one property', 'info');
        return;
    }
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
            showStatus('Please refresh the page and try again', 'warning');
            return;
        }
        
        try {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'applyCustomStyle',
                selector: selectedElementInfo.selector,
                styles: styles
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('Content script not available for custom styling');
                    showStatus('Please refresh the page to enable custom styling', 'warning');
                    return;
                }
                
                if (response?.success) {
                    showStatus('Custom style applied!', 'success');
                    saveCustomStyles(selectedElementInfo.selector, styles);
                } else {
                    showStatus('Style may have been applied - check the page', 'info');
                    saveCustomStyles(selectedElementInfo.selector, styles);
                }
            });
        } catch (error) {
            console.error('Error sending message:', error);
            showStatus('Please refresh the page and try again', 'warning');
        }
    });
}

function resetElementStyles() {
    if (!selectedElementInfo) {
        showStatus('Please select an element first', 'info');
        return;
    }
    
    sendMessageWithTimeout({
        action: 'resetElementStyle',
        selector: selectedElementInfo.selector
    }, (response) => {
        showStatus('Element styles reset', 'success');
        resetFormValues();
    });
}

function resetFormValues() {
    document.getElementById('backgroundColorPicker').value = '#1a1a1a';
    document.getElementById('backgroundColorText').value = '#1a1a1a';
    document.getElementById('textColorPicker').value = '#ffffff';
    document.getElementById('textColorText').value = '#ffffff';
    document.getElementById('borderColorPicker').value = '#4b5563';
    document.getElementById('borderColorText').value = '#4b5563';
    
    // Reset advanced controls
    document.getElementById('borderWidthRange').value = '1';
    document.getElementById('borderRadiusRange').value = '0';
    document.getElementById('opacityRange').value = '100';
    document.getElementById('fontSizeRange').value = '14';
    document.getElementById('paddingRange').value = '10';
    document.getElementById('marginRange').value = '0';
    
    // Update displays
    document.getElementById('borderWidthValue').textContent = '1px';
    document.getElementById('borderRadiusValue').textContent = '0px';
    document.getElementById('opacityValue').textContent = '100%';
    document.getElementById('fontSizeValue').textContent = '14px';
    document.getElementById('paddingValue').textContent = '10px';
    document.getElementById('marginValue').textContent = '0px';
}

function toggleAdvancedControls() {
    const advancedControls = document.getElementById('advancedControls');
    const toggleButton = document.getElementById('advancedToggle');
    
    isAdvancedMode = !isAdvancedMode;
    
    if (isAdvancedMode) {
        advancedControls.classList.remove('hidden');
        toggleButton.textContent = '⚙️ Hide Advanced Options';
    } else {
        advancedControls.classList.add('hidden');
        toggleButton.textContent = '⚙️ Show Advanced Options';
    }
}

function clearAllStyles() {
    sendMessageWithTimeout({
        action: 'clearStyles'
    }, (response) => {
        if (response?.success) {
            showStatus('All styles cleared!', 'success');
            chrome.storage.local.clear();
            resetUI();
        }
    });
}

function exportStyles() {
    chrome.storage.local.get(['customStyles'], (result) => {
        const styles = result.customStyles || {};
        const exportData = {
            timestamp: new Date().toISOString(),
            customStyles: styles
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'youtheme-styles.json';
        a.click();
        
        URL.revokeObjectURL(url);
        showStatus('Styles exported!', 'success');
    });
}

function saveCustomStyles(selector, styles) {
    chrome.storage.local.get(['customStyles'], (result) => {
        const customStyles = result.customStyles || {};
        customStyles[selector] = styles;
        chrome.storage.local.set({ customStyles });
    });
}

function loadSavedState() {
    chrome.storage.local.get(['activeTheme', 'selectedElement'], (result) => {
        // Load active theme
        if (result.activeTheme) {
            document.getElementById('themeSelect').value = result.activeTheme;
        }
        
        // Load selected element if it exists
        if (result.selectedElement) {
            const elementData = result.selectedElement;
            
            // Check if selection is recent (within 10 minutes)
            const isRecent = (Date.now() - elementData.timestamp) < 10 * 60 * 1000;
            
            if (isRecent) {
                // Restore selected element state
                selectedElementInfo = elementData;
                
                // Show element customizer
                document.getElementById('elementCustomizer').classList.remove('hidden');
                
                // Update element info
                const info = `Selected: ${elementData.tagName}${elementData.className ? '.' + elementData.className.split(' ')[0] : ''}${elementData.id ? '#' + elementData.id : ''}`;
                document.getElementById('elementInfo').textContent = info;
                
                showStatus('Previously selected element loaded - ready to customize!', 'success');
            } else {
                // Clear old selection
                chrome.storage.local.remove('selectedElement');
            }
        }
    });
}

function clearSelectedElement() {
    chrome.storage.local.remove('selectedElement');
    
    // Send message to content script to remove visual indicator (non-critical)
    sendMessageWithTimeout({
        action: 'clearElementSelection'
    }, null, 2000); // Shorter timeout for non-critical operation
}

function resetUI() {
    document.getElementById('elementCustomizer').classList.add('hidden');
    document.getElementById('selectElementBtn').textContent = '🎯 Select Element to Customize';
    document.getElementById('selectElementBtn').style.background = '';
    document.getElementById('selectElementBtn').style.color = '';
    selectedElementInfo = null;
    resetFormValues();
    clearSelectedElement();
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'elementSelected') {
        selectedElementInfo = message;
        
        // Show element customizer
        document.getElementById('elementCustomizer').classList.remove('hidden');
        document.getElementById('selectElementBtn').textContent = '🎯 Select Element to Customize';
        document.getElementById('selectElementBtn').style.background = '';
        document.getElementById('selectElementBtn').style.color = '';
        
        // Update element info
        const info = `Selected: ${message.tagName.toLowerCase()}${message.className ? '.' + message.className.split(' ')[0] : ''}${message.id ? '#' + message.id : ''}`;
        document.getElementById('elementInfo').textContent = info;
        
        showStatus('Element selected! Customize its appearance below.', 'success');
    }
});

console.log('YouTheme popup loaded with advanced element customizer');

let domElements = {};

// Define color palettes for each theme. These are the default themes the user can choose from.
const themePalettes = {
    "default-dark": {
        bodyBackground: "#1E1E1E",
        bodyTextColor: "#CCCCCC",
        headingTextColor: "#E0E0E0",
        linkColor: "#63B3ED",
        visitedLinkColor: "#B794F4",
        hoverLinkColor: "#9DECFB",
        buttonBackground: "#4A5568",
        buttonTextColor: "#FFFFFF",
        buttonHoverBackground: "#64748B",
        borderDividerColor: "#4A5568",
        inputFieldBackground: "#2D3748",
        inputFieldTextColor: "#F7FAFC",
        inputPlaceholderColor: "#A0AEC0",
        codeBlockBackground: "#2D3748",
        codeBlockText: "#F7FAFC",
        blockquoteBackground: "#2D3748",
        blockquoteText: "#CBD5E0",
        blockquoteBorder: "#63B3ED",
        tableHeaderBackground: "#2D3748",
        tableHeaderText: "#F7FAFC",
        tableRowEvenBackground: "#242D3A",
        tableBorderColor: "#4A5568",
        imageBrightness: "70" // Represent range value as string
    },
    "midnight-blue": {
        bodyBackground: "#0F172A",
        bodyTextColor: "#CBD5E1",
        headingTextColor: "#F1F5F9",
        linkColor: "#38BDF8",
        visitedLinkColor: "#7DD3FC",
        hoverLinkColor: "#0EA5E9",
        buttonBackground: "#1E293B",
        buttonTextColor: "#F8FAFC",
        buttonHoverBackground: "#334155",
        borderDividerColor: "#334155",
        inputFieldBackground: "#1E293B",
        inputFieldTextColor: "#F8FAFC",
        inputPlaceholderColor: "#64748B",
        codeBlockBackground: "#1E293B",
        codeBlockText: "#F8FAFC",
        blockquoteBackground: "#1E293B",
        blockquoteText: "#E2E8F0",
        blockquoteBorder: "#38BDF8",
        tableHeaderBackground: "#1E293B",
        tableHeaderText: "#F8FAFC",
        tableRowEvenBackground: "#172132",
        tableBorderColor: "#334155",
        imageBrightness: "65"
    },
    "dracula-inspired": {
        bodyBackground: "#282A36",
        bodyTextColor: "#F8F8F2",
        headingTextColor: "#BD93F9",
        linkColor: "#8BE9FD",
        visitedLinkColor: "#FF79C6",
        hoverLinkColor: "#50FA7B",
        buttonBackground: "#44475A",
        buttonTextColor: "#F8F8F2",
        buttonHoverBackground: "#6272A4",
        borderDividerColor: "#6272A4",
        inputFieldBackground: "#44475A",
        inputFieldTextColor: "#F8F8F2",
        inputPlaceholderColor: "#6272A4",
        codeBlockBackground: "#44475A",
        codeBlockText: "#F8F8F2",
        blockquoteBackground: "#44475A",
        blockquoteText: "#F8F8F2",
        blockquoteBorder: "#BD93F9",
        tableHeaderBackground: "#44475A",
        tableHeaderText: "#F8F8F2",
        tableRowEvenBackground: "#373844",
        tableBorderColor: "#6272A4",
        imageBrightness: "75"
    },
    "nord-inspired": {
        bodyBackground: "#2E3440",
        bodyTextColor: "#ECEFF4",
        headingTextColor: "#D8DEE9",
        linkColor: "#81A1C1",
        visitedLinkColor: "#B48EAD",
        hoverLinkColor: "#81A1C1",
        buttonBackground: "#4C566A",
        buttonTextColor: "#ECEFF4",
        buttonHoverBackground: "#5E81AC",
        borderDividerColor: "#4C566A",
        inputFieldBackground: "#434C5E",
        inputFieldTextColor: "#ECEFF4",
        inputPlaceholderColor: "#697386",
        codeBlockBackground: "#434C5E",
        codeBlockText: "#ECEFF4",
        blockquoteBackground: "#434C5E",
        blockquoteText: "#ECEFF4",
        blockquoteBorder: "#81A1C1",
        tableHeaderBackground: "#434C5E",
        tableHeaderText: "#ECEFF4",
        tableRowEvenBackground: "#3B4252",
        tableBorderColor: "#4C566A",
        imageBrightness: "70"
    }
};

// Test content script availability
function testContentScriptConnection() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
            console.error('Error querying tabs:', chrome.runtime.lastError);
            return;
        }
        
        chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn('Content script not available:', chrome.runtime.lastError.message);
                showStatus('Please refresh the page to enable theming', 'warning');
                return;
            }
            
            if (response?.pong) {
                console.log('Content script is available');
            } else {
                console.warn('Content script did not respond properly');
                showStatus('Please refresh the page to enable theming', 'warning');
                }
        });
    });
}

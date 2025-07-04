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
        bodyBackground: "#0D1117",
        bodyTextColor: "#C9D1D9",
        headingTextColor: "#FFFFFF",
        linkColor: "#58A6FF",
        visitedLinkColor: "#A28BDE",
        hoverLinkColor: "#85B9FF",
        buttonBackground: "#30363D",
        buttonTextColor: "#C9D1D9",
        buttonHoverBackground: "#444C56",
        borderDividerColor: "#30363D",
        inputFieldBackground: "#161B22",
        inputFieldTextColor: "#C9D1D9",
        inputPlaceholderColor: "#8B949E",
        codeBlockBackground: "#161B22",
        codeBlockText: "#C9D1D9",
        blockquoteBackground: "#161B22",
        blockquoteText: "#8B949E",
        blockquoteBorder: "#58A6FF",
        tableHeaderBackground: "#161B22",
        tableHeaderText: "#C9D1D9",
        tableRowEvenBackground: "#0A0D11",
        tableBorderColor: "#30363D",
        imageBrightness: "60"
    },
    "dracula-inspired": {
        bodyBackground: "#282A36",
        bodyTextColor: "#F8F8F2",
        headingTextColor: "#F8F8F2",
        linkColor: "#8BE9FD",
        visitedLinkColor: "#BD93F9",
        hoverLinkColor: "#A3F7FF",
        buttonBackground: "#44475A",
        buttonTextColor: "#F8F8F2",
        buttonHoverBackground: "#6272A4",
        borderDividerColor: "#44475A",
        inputFieldBackground: "#343746",
        inputFieldTextColor: "#F8F8F2",
        inputPlaceholderColor: "#6272A4",
        codeBlockBackground: "#343746",
        codeBlockText: "#F8F8F2",
        blockquoteBackground: "#343746",
        blockquoteText: "#BD93F9",
        blockquoteBorder: "#FF79C6",
        tableHeaderBackground: "#343746",
        tableHeaderText: "#F8F8F2",
        tableRowEvenBackground: "#21222C",
        tableBorderColor: "#44475A",
        imageBrightness: "80"
    },
    "nord-inspired": {
        bodyBackground: "#2E3440",
        bodyTextColor: "#ECEFF4",
        headingTextColor: "#D8DEE9",
        linkColor: "#81A1C1",
        visitedLinkColor: "#B48EAD",
        hoverLinkColor: "#88C0D0",
        buttonBackground: "#4C566A",
        buttonTextColor: "#ECEFF4",
        buttonHoverBackground: "#5E6C80",
        borderDividerColor: "#4C566A",
        inputFieldBackground: "#3B4252",
        inputFieldTextColor: "#ECEFF4",
        inputPlaceholderColor: "#88C0D0",
        codeBlockBackground: "#3B4252",
        codeBlockText: "#ECEFF4",
        blockquoteBackground: "#3B4252",
        blockquoteText: "#E5E9F0",
        blockquoteBorder: "#A3BE8C",
        tableHeaderBackground: "#3B4252",
        tableHeaderText: "#ECEFF4",
        tableRowEvenBackground: "#292F38",
        tableBorderColor: "#4C566A",
        imageBrightness: "65"
    }
};

// Cache color inputs and previews using a Map for O(1) access
const colorInputs = new Map();
const colorPreviews = new Map();
const hexDisplays = new Map();

// Initialize color input caching - O(n) one-time operation
document.querySelectorAll('.color-text-input').forEach(input => {
    const key = input.dataset.key;
    colorInputs.set(key, input);
    
    // Validate and sanitize hex input
    input.addEventListener('input', (e) => {
        let value = e.target.value.trim();
        if (!value.startsWith('#')) value = '#' + value;
        value = value.slice(0, 7); // Limit to 6 hex digits + #
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            updateColorPreview(key, value);
            updateHexDisplay(key, value);
            debouncedSaveTheme({ [key]: value });
        }
    });
});

document.querySelectorAll('.color-preview').forEach(preview => {
    const key = preview.dataset.key;
    colorPreviews.set(key, preview);
    preview.addEventListener('click', () => colorInputs.get(key).click());
});

document.querySelectorAll('.hex-code-display').forEach(display => {
    hexDisplays.set(display.dataset.key, display);
});

// Optimized theme application using requestAnimationFrame
function updateColorPreview(key, value) {
    requestAnimationFrame(() => {
        const preview = colorPreviews.get(key);
        if (preview) preview.style.backgroundColor = value;
    });
}

function updateHexDisplay(key, value) {
    requestAnimationFrame(() => {
        const display = hexDisplays.get(key);
        if (display) display.textContent = value.toUpperCase();
    });
}

// Debounced theme save function
let saveTimeout;
function debouncedSaveTheme(themeData) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        chrome.storage.local.set({ themePalette: themeData }, () => {
            console.log('Theme saved');
        });
    }, 500);
}

// Event Delegation for better performance

document.addEventListener('click', (e) => {
    const target = e.target;
    
    if (target.id === 'applyThemeBtn') {
        console.log('Clicked');
        applySelectedTheme();
    } else if (target.id === 'customizeThemeBtn') {
        showCustomizer();
    } else if (target.id === 'backToMainBtn' || target.id === 'backFromAIBtn') {
        showMainView();
    } else if (target.id === 'generateAIThemeBtn') {
        generateAITheme();
    }
});

// Optimized image brightness handling
const brightnessSlider = document.querySelector('[data-key="imageBrightness"]');
if (brightnessSlider) {
    brightnessSlider.addEventListener('input', (e) => {
        requestAnimationFrame(() => {
            domElements.imageBrightnessValue.textContent = `${e.target.value}% Brightness`;
            debouncedSaveTheme({ imageBrightness: e.target.value });
        });
    });
}

// Helper: Get current palette (from storage or default)
function getCurrentPalette(callback) {
    const selectedTheme = domElements.themeSelect.value;
    chrome.storage.local.get(['themePalette'], (result) => {
        if (result.themePalette) {
            callback(result.themePalette);
        } else {
            callback({ ...themePalettes[selectedTheme] });
        }
    });
}

// Load palette into customizer UI
function loadCustomizerPalette(palette) {
    Object.keys(palette).forEach(key => {
        if (colorInputs.has(key)) {
            colorInputs.get(key).value = palette[key];
            updateColorPreview(key, palette[key]);
            updateHexDisplay(key, palette[key]);
        }
        if (key === 'imageBrightness') {
            const slider = document.querySelector('[data-key="imageBrightness"]');
            if (slider) {
                slider.value = palette[key];
                domElements.imageBrightnessValue.textContent = `${palette[key]}% Brightness`;
            }
        }
    });
}

// Save full palette
function saveFullPalette() {
    const palette = {};
    colorInputs.forEach((input, key) => {
        palette[key] = input.value;
    });
    const slider = document.querySelector('[data-key="imageBrightness"]');
    if (slider) palette.imageBrightness = slider.value;
    chrome.storage.local.set({ themePalette: palette }, () => {
        applyThemeToCurrentTab(palette);
    });
}

// Apply theme to current tab (send directly to content script)
function applyThemeToCurrentTab(palette) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab) {
            console.error('[popup.js] No active tab found.');
            return;
        }
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        }, (injectResults) => {
            if (chrome.runtime.lastError) {
                console.error('[popup.js] Error injecting content script:', chrome.runtime.lastError.message);
            } else {
                console.log('[popup.js] Content script injected or already present.', injectResults);
            }
            chrome.tabs.sendMessage(tab.id, {
                action: 'applyThemeToPage',
                themeData: palette
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('[popup.js] Error sending message to content script:', chrome.runtime.lastError.message);
                } else {
                    console.log('[popup.js] Message sent to content script. Response:', response);
                }
            });
        });
    });
}

// Update color input listeners to update full palette
colorInputs.forEach((input, key) => {
    input.addEventListener('input', () => {
        saveFullPalette();
    });
});

// Save button event
const saveBtn = document.getElementById('saveChangesBtn');
if (saveBtn) {
    saveBtn.addEventListener('click', saveFullPalette);
}

// Show customizer and load palette
function showCustomizer() {
    domElements.mainPopupView.style.display = 'none';
    domElements.customizerView.style.display = 'block';
    domElements.aiThemeGenerator.style.display = 'none';
    domElements.editingThemeName.textContent = domElements.themeSelect.value;
    getCurrentPalette(loadCustomizerPalette);
}

// Apply selected theme (from dropdown)
function applySelectedTheme() {
    const selectedTheme = domElements.themeSelect.value;
    const palette = { ...themePalettes[selectedTheme] };
    chrome.storage.local.set({ themePalette: palette, activeTheme: selectedTheme }, () => {
        applyThemeToCurrentTab(palette);
    });
}

// Memoized theme generation with proper error handling
const memoizedThemes = new Map();
async function generateAITheme() {
    const url = await getCurrentTabURL();
    
    if (memoizedThemes.has(url)) {
        displayGeneratedTheme(memoizedThemes.get(url));
        return;
    }
    
    domElements.aiLoadingIndicator.style.display = 'block';
    domElements.aiGeneratedThemeOutput.style.display = 'none';
    
    try {
        const response = await fetch('your-ai-endpoint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ url }),
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const theme = await response.json();
        memoizedThemes.set(url, theme);
        displayGeneratedTheme(theme);
    } catch (error) {
        console.error('AI theme generation failed:', error);
        domElements.aiGeneratedThemeOutput.style.display = 'block';
        domElements.aiThemeJsonOutput.textContent = 'Error generating theme. Please try again.';
    } finally {
        domElements.aiLoadingIndicator.style.display = 'none';
    }
}

function displayGeneratedTheme(theme) {
    if (!theme) return;
    
    domElements.aiGeneratedThemeOutput.style.display = 'block';
    domElements.aiThemeJsonOutput.textContent = JSON.stringify(theme, null, 2);
}

async function getCurrentTabURL() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab ? tab.url : '';
}

// Initialize the popup with error handling
document.addEventListener('DOMContentLoaded', () => {
    // Now the DOM is ready, so all elements exist
    domElements = {
        themeSelect: document.getElementById('themeSelect'),
        mainPopupView: document.getElementById('mainPopupView'),
        customizerView: document.getElementById('customizerView'),
        aiThemeGenerator: document.getElementById('aiThemeGenerator'),
        editingThemeName: document.getElementById('editingThemeName'),
        aiLoadingIndicator: document.getElementById('aiLoadingIndicator'),
        aiGeneratedThemeOutput: document.getElementById('aiGeneratedThemeOutput'),
        aiThemeJsonOutput: document.getElementById('aiThemeJsonOutput'),
        imageBrightnessValue: document.getElementById('imageBrightnessValue')
    };

    try {
        showMainView();
        chrome.storage.local.get(['activeTheme', 'themePalette'], (result) => {
            if (result.activeTheme && themePalettes[result.activeTheme]) {
                domElements.themeSelect.value = result.activeTheme;
            }
            if (result.themePalette) {
                loadCustomizerPalette(result.themePalette);
            }
        });
        const applyBtn = document.getElementById('applyThemeBtn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                console.log('Clicked (direct listener)');
            });
        }
    } catch (error) {
        console.error('Failed to initialize popup:', error);
    }
});

function showMainView() {
    if (domElements.mainPopupView) domElements.mainPopupView.style.display = 'block';
    if (domElements.customizerView) domElements.customizerView.style.display = 'none';
    if (domElements.aiThemeGenerator) domElements.aiThemeGenerator.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM refs ---
    const dom = {
        mainPopupView: document.getElementById('mainPopupView'),
        customizerView: document.getElementById('customizerView'),
        aiThemeGenerator: document.getElementById('aiThemeGenerator'),
        themeSelect: document.getElementById('themeSelect'),
        applyThemeBtn: document.getElementById('applyThemeBtn'),
        customizeThemeBtn: document.getElementById('customizeThemeBtn'),
        editingThemeName: document.getElementById('editingThemeName'),
        saveChangesBtn: document.getElementById('saveChangesBtn'),
        backToMainBtn: document.getElementById('backToMainBtn'),
        generateAIThemeBtn: document.getElementById('generateAIThemeBtn'),
        aiLoadingIndicator: document.getElementById('aiLoadingIndicator'),
        aiGeneratedThemeOutput: document.getElementById('aiGeneratedThemeOutput'),
        aiThemeJsonOutput: document.getElementById('aiThemeJsonOutput'),
        backFromAIBtn: document.getElementById('backFromAIBtn'),
        imageBrightnessSlider: document.querySelector('input[type="range"][data-key="imageBrightness"]'),
        imageBrightnessValueSpan: document.getElementById('imageBrightnessValue')
    };

    // --- View switching ---
    function showView(viewId) {
        ['mainPopupView', 'customizerView', 'aiThemeGenerator'].forEach(id => {
            if (dom[id]) dom[id].style.display = 'none';
        });
        const target = document.getElementById(viewId);
        if (target) target.style.display = 'block';
    }

    // --- Customizer population ---
    function applyThemeToCustomizer(themeKey) {
        const palette = themePalettes[themeKey];
        if (!palette) return;
        if (dom.editingThemeName) dom.editingThemeName.textContent = dom.themeSelect.options[dom.themeSelect.selectedIndex].text;
        if (!dom.customizerView) return;

        for (const key in palette) {
            if (key !== 'imageBrightness') {
                const preview = dom.customizerView.querySelector(`.color-preview[data-key="${key}"]`);
                const input = dom.customizerView.querySelector(`input.color-text-input[data-key="${key}"]`);
                const hex = dom.customizerView.querySelector(`.hex-code-display[data-key="${key}"]`);
                if (preview) preview.style.backgroundColor = palette[key];
                if (input) input.value = palette[key];
                if (hex) hex.textContent = palette[key];
            } else if (dom.imageBrightnessSlider && dom.imageBrightnessValueSpan) {
                dom.imageBrightnessSlider.value = palette[key];
                dom.imageBrightnessValueSpan.textContent = `${palette[key]}% Brightness`;
            }
        }
    }

    // --- Theme application to page ---
    function applyThemeToPage(themeKey, palette) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) return;
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content.js']
            }, () => {
                chrome.tabs.sendMessage(tabs[0].id, { action: "applyThemeToPage", themeData: palette }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error(`[popup.js] Error sending message: ${chrome.runtime.lastError.message}`);
                    } else {
                        console.log(`[popup.js] Theme applied, response:`, response);
                    }
                });
            });
        });
    }

    // --- AI Theme Generation (stub, as before) ---
    async function generateAITheme() {
        // ...your AI theme logic here (unchanged)...
    }

    // --- Event Listeners ---
    if (dom.themeSelect) {
        dom.themeSelect.addEventListener('change', e => applyThemeToCustomizer(e.target.value));
    }
    if (dom.applyThemeBtn) {
        dom.applyThemeBtn.addEventListener('click', () => {
            const key = dom.themeSelect ? dom.themeSelect.value : 'default-dark';
            const palette = themePalettes[key];
            if (palette) {
                chrome.storage.local.set({ activeTheme: key, themePalette: palette }, () => {
                    applyThemeToPage(key, palette);
                });
            }
        });
    }
    if (dom.customizeThemeBtn) {
        dom.customizeThemeBtn.addEventListener('click', () => {
            showView('customizerView');
            applyThemeToCustomizer(dom.themeSelect ? dom.themeSelect.value : 'default-dark');
        });
    }
    if (dom.saveChangesBtn) {
        dom.saveChangesBtn.addEventListener('click', () => {
            const key = dom.themeSelect ? dom.themeSelect.value : 'default-dark';
            const bodyBgInput = dom.customizerView ? dom.customizerView.querySelector('input.color-text-input[data-key="bodyBackground"]') : null;
            if (bodyBgInput) {
                if (!themePalettes[key]) themePalettes[key] = {};
                themePalettes[key].bodyBackground = bodyBgInput.value;
                chrome.storage.local.set({ activeTheme: key, themePalette: themePalettes[key] }, () => {
                    applyThemeToPage(key, themePalettes[key]);
                });
            }
        });
    }
    if (dom.backToMainBtn) dom.backToMainBtn.addEventListener('click', () => showView('mainPopupView'));
    if (dom.generateAIThemeBtn) dom.generateAIThemeBtn.addEventListener('click', generateAITheme);
    if (dom.backFromAIBtn) dom.backFromAIBtn.addEventListener('click', () => showView('mainPopupView'));
    if (dom.imageBrightnessSlider && dom.imageBrightnessValueSpan) {
        dom.imageBrightnessSlider.addEventListener('input', e => {
            dom.imageBrightnessValueSpan.textContent = `${e.target.value}% Brightness`;
        });
    }

    // --- Initial load ---
    if (dom.themeSelect) {
        showView('mainPopupView');
        applyThemeToCustomizer(dom.themeSelect.value);
    }

    chrome.storage.local.get(['activeTheme', 'themePalette'], (result) => {
        if (result.activeTheme && result.themePalette) {
            if (!themePalettes[result.activeTheme]) {
                themePalettes[result.activeTheme] = result.themePalette;
                const newOption = document.createElement('option');
                newOption.value = result.activeTheme;
                newOption.textContent = 'AI Generated Theme (' + new Date(parseInt(result.activeTheme.split('-').pop())).toLocaleTimeString() + ')';
                if (dom.themeSelect) dom.themeSelect.appendChild(newOption);
            }
            if (dom.themeSelect) dom.themeSelect.value = result.activeTheme;
            applyThemeToCustomizer(result.activeTheme);
        }
    });
});

//# sourceMappingURL=popup.js.map

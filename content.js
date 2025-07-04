// This is your content script. It gets injected into web pages as defined in manifest.json.
// Use it to:
// - Read and modify the DOM (Document Object Model) of the web page.
// - Inject CSS directly into the page.
// - Communicate with your background script or popup.

console.log('[content.js] Content script loaded for this page.');

// Prevent redeclaration if script is injected multiple times
if (!window._youthemeStyleCache) {
    window._youthemeStyleCache = new Map();
}
var styleCache = window._youthemeStyleCache;

if (!window._youthemeObserver) {
    window._youthemeObserver = null;
}
var observer = window._youthemeObserver;

// This selectorMap is used by generateOptimizedCSS to build specific CSS rules.
// It maps theme property names to functions that return CSS strings.
if (!window._youthemeSelectorMap) {
    window._youthemeSelectorMap = {
        headingTextColor: (val) => `
            h1, h2, h3, h4, h5, h6,
            body h1, body h2, body h3, body h4, body h5, body h6,
            div h1, div h2, div h3, div h4, div h5, div h6,
            section h1, section h2, section h3, section h4, section h5, section h6,
            [class*="title"], [class*="heading"], [class*="caption"] {
                color: '${val}' !important;
            }
        `,
        linkColor: (val) => `a:link, a, a span, a div, a p, a strong { color: '${val}' !important; }`,
        visitedLinkColor: (val) => `a:visited { color: '${val}' !important; }`,
        hoverLinkColor: (val) => `a:hover { color: '${val}' !important; }`,
        buttonBackground: (val) => `button, input[type="button"], input[type="submit"], input[type="reset"] { background-color: '${val}' !important; }`,
        buttonTextColor: (val) => `button, input[type="button"], input[type="submit"] { color: '${val}' !important; }`,
        buttonHoverBackground: (val) => `button:hover, input[type="button"]:hover { background-color: '${val}' !important; }`,
        codeBlockBackground: (val) => `pre, code, kbd, samp { background-color: '${val}' !important; }`,
        codeBlockText: (val) => `pre, code, kbd, samp { color: '${val}' !important; }`,
        blockquoteBackground: (val) => `blockquote { background-color: '${val}' !important; }`,
        blockquoteText: (val) => `blockquote { color: '${val}' !important; }`,
        blockquoteBorder: (val) => `blockquote { border-color: '${val}' !important; }`,
        tableHeaderBackground: (val) => `th { background-color: '${val}' !important; }`,
        tableHeaderText: (val) => `th { color: '${val}' !important; }`,
        tableRowEvenBackground: (val) => `tr:nth-child(even) { background-color: '${val}' !important; }`,
        tableBorderColor: (val) => `table, th, td { border-color: '${val}' !important; }`,
        // inputFieldBackground is handled directly in generateOptimizedCSS due to needing themeData.borderDividerColor
        inputFieldTextColor: (val) => `
            input[type="text"], input[type="password"], input[type="email"], input[type="number"],
            textarea, select,
            input[type="search"], input[type="tel"], input[type="url"], input[type="date"], input[type="time"] {
                color: '${val}' !important;
            }
        `,
        inputPlaceholderColor: (val) => `
            input::placeholder, textarea::placeholder { color: '${val}' !important; opacity: 1 !important; }
            input::-webkit-input-placeholder, textarea::-webkit-input-placeholder { color: '${val}' !important; opacity: 1 !important; }
            input::-moz-placeholder, textarea::-moz-placeholder { color: '${val}' !important; opacity: 1 !important; }
            input:-ms-input-placeholder, textarea:-ms-ms-input-placeholder { color: '${val}' !important; opacity: 1 !important; }
        `
    };
}
var selectorMap = window._youthemeSelectorMap; // Assign to local variable for use

// Debounce function for performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize MutationObserver for dynamic content
function initializeMutationObserver() {
    // Disconnect any existing observer to prevent duplicates if called multiple times
    observer?.disconnect();

    observer = new MutationObserver(debounce((mutations) => {
        // Ensure theme data is available from the window object
        const themeData = window.__currentThemeData;
        if (themeData) {
            applyStylesToNewElements(mutations, themeData);
        }
    }, 100)); // Debounce to avoid excessive calls on rapid DOM changes

    // Observe changes in the document body, including child additions/removals
    observer.observe(document.body, {
        childList: true, // Watch for direct children being added/removed
        subtree: true,   // Watch for changes in the entire subtree (all descendants)
        attributes: false // Not watching for attribute changes for performance
    });
}

// Function to apply styles to new elements added dynamically
function applyStylesToNewElements(mutations, themeData) {
    const newElements = new Set();

    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                newElements.add(node);
                // Also add all its descendant elements, as they might need styling
                node.querySelectorAll('*').forEach(descendant => newElements.add(descendant));
            }
        });
    });

    if (newElements.size > 0) {
        // Convert Set to Array and apply theme to these new elements
        // This primarily targets `img`, `video`, `canvas` for filters.
        // SVGs are NOT manipulated here, as they are best left alone for general theming.
        applyThemeToElements(Array.from(newElements), themeData);
    }
}

// Utility: Detect if the page is already in dark mode
function isPageInDarkMode() {
    // 1. Check for common dark mode classes on <html> or <body>
    const darkClassRegex = /(dark|night|black|theme-dark|dark-theme|darkmode)/i;
    if (
        document.documentElement.className.match(darkClassRegex) ||
        document.body.className.match(darkClassRegex)
    ) {
        console.log('[content.js] isPageInDarkMode: Detected dark mode class.');
        return true;
    }

    // 2. Check for common dark mode attributes
    if (
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        document.body.getAttribute('data-theme') === 'dark' ||
        document.documentElement.getAttribute('color-mode') === 'dark' ||
        document.body.getAttribute('color-mode') === 'dark'
    ) {
        console.log('[content.js] isPageInDarkMode: Detected dark mode data attribute.');
        return true;
    }

    // 3. Check computed background color of <body> (very dark = likely dark mode)
    // This is a heuristic and can be less reliable.
    try {
        const bg = window.getComputedStyle(document.body).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') { // Ensure it's not transparent
            // Extract RGB values
            const rgb = bg.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
                const [r, g, b] = rgb.map(Number);
                // If all channels are below a certain threshold (e.g., 40-50), it's probably dark
                if (r < 50 && g < 50 && b < 50) {
                    console.log(`[content.js] isPageInDarkMode: Detected dark body background color (${bg}).`);
                    return true;
                }
            }
        }
    } catch (e) {
        console.warn("[content.js] Could not get computed style for body background:", e);
    }


    // 4. Check for meta color-scheme (optional, for modern sites)
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta && meta.content && meta.content.includes('dark')) {
        console.log('[content.js] isPageInDarkMode: Detected meta color-scheme dark.');
        return true;
    }

    // 5. Check for prefers-color-scheme media query (if site reacts to it)
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        console.log('[content.js] isPageInDarkMode: Detected prefers-color-scheme: dark.');
        // This indicates the *user's system preference*, not necessarily that the site *is* dark.
        // Use with caution, as some sites might not respect it for their default light theme.
        // For our purpose, if the site *has* a dark mode and respects this, it's a good indicator.
        // return true; // Uncomment if you want to skip if user's system is dark mode
    }


    console.log('[content.js] isPageInDarkMode: No dark mode detected.');
    return false;
}


// Optimized theme application function (main entry point for content script)
function applyThemeToPage(themeData) {
    try {
        // --- Re-introduce the isPageInDarkMode() check ---
        // Only apply our custom theme if the page is NOT already in dark mode.
        // This prevents conflicts with native dark modes on sites like YouTube, Google.
        const hostname = window.location.hostname;
        // List of sites where we should skip our theme if native dark mode is detected
        const sitesToSkipIfNativeDarkMode = ['youtube.com', 'google.com', 'mail.google.com', 'docs.google.com', 'drive.google.com', 'sheets.google.com', 'slides.google.com'];

        let shouldSkip = false;
        for (const site of sitesToSkipIfNativeDarkMode) {
            if (hostname.includes(site) && isPageInDarkMode()) {
                shouldSkip = true;
                break;
            }
        }

        if (shouldSkip) {
            console.log(`[content.js] Detected native dark mode on ${hostname}. Skipping custom theme application.`);
            // Optionally, remove any previously injected styles if we are now skipping
            const existingStyle = document.getElementById('youtheme-dynamic-style');
            if (existingStyle) {
                existingStyle.remove();
                console.log('[content.js] Removed previously injected custom theme styles.');
            }
            return false; // Indicate that theme was skipped
        }
        // --- End isPageInDarkMode() check ---


        console.log('[content.js] Applying theme data');

        // Store theme data globally on the window object for access by MutationObserver
        window.__currentThemeData = themeData;

        // Get or create style element to inject CSS
        let styleElement = document.getElementById('youtheme-dynamic-style');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'youtheme-dynamic-style';
            document.head.appendChild(styleElement);
        }

        // Generate optimized CSS string
        const css = generateOptimizedCSS(themeData);

        // Apply CSS using requestAnimationFrame for better visual performance
        requestAnimationFrame(() => {
            styleElement.textContent = css;

            // Apply direct JS manipulation styles (filters for images/videos/canvas)
            // SVGs are explicitly excluded from this direct manipulation.
            applyThemeToElements(document.querySelectorAll('img, video, canvas'), themeData);

            // Initialize or re-initialize observer for dynamic content
            initializeMutationObserver();
        });

        return true; // Indicate successful application
    } catch (error) {
        console.error('[content.js] Error applying theme:', error);
        return false; // Indicate failure
    }
}


// Exclude specific elements from universal background/color application
// IMPORTANT: SVG related elements are now excluded completely from these universal rules.
// Also exclude video/canvas elements from text color changes, as they are visual.
// For text color, also exclude video and canvas elements
const elementsToExcludeFromUniversalTextColor = `:not(img):not(video):not(canvas):not(iframe):not(svg):not(path):not(rect):not(circle):not(g)`;


// --- Place these near the top of your file ---
const universalSelectorsForColorsAndBorders = `
    html, body,
    body > *,
    div, span, p, section, article, aside, main, header, footer, nav,
    ul, ol, li,
    form,
    table, thead, tbody, tfoot, tr, th, td,
    .card, .panel, .widget, .container, .wrapper, .box,
    [class*="bg-"], [class*="background-"], [class*="color-"], [class*="text-"],
    [class*="navbar"], [class*="header"], [class*="footer"], [class*="menu"],
    [id*="navbar"], [id*="header"], [id*="footer"], [id*="menu"],
    [role="navigation"], [role="main"], [role="banner"], [role="contentinfo"],
    [data-testid],
    [class*="toolbar"], [class*="content"], [class*="main"], [class*="wrapper"], [class*="section"],
    [class*="modal"], [class*="dialog"], [class*="popup"],
    .s-main-slot, .s-result-item, .s-widget-container, .s-card-container, .s-card, .s-include-content-margin, .s-border-bottom,
    .sg-col-inner, .sg-row, .a-box, .a-box-inner, .a-cardui, .a-section, .celwidget
`;

const elementsToExcludeFromUniversal = `
    :not(img):not(svg):not(svg *):not(image):not(use)
    :not([src*=".jpg"]):not([src*=".jpeg"]):not([src*=".png"]):not([src*=".gif"]):not([src*=".webp"])
    :not([class*="logo"]):not([alt*="logo"]):not([alt*="amazon"]):not([aria-label*="logo"]):not([aria-label*="amazon"])
    :not(.nav-logo-link):not(.nav-logo-link *):not(.nav-logo-base):not(.nav-logo-base *):not(.nav-sprite):not(.nav-sprite *)
    :not(.nav-cart-icon):not(.nav-cart-icon *):not(.nav-search-icon):not(.nav-search-icon *)
    :not(.nav-search-submit-text):not(.nav-search-submit-text *)
    :not([role="img"])
`;

// --- Replace your generateOptimizedCSS function with this ---
function generateOptimizedCSS(themeData) {
    const cssRules = [];

    // Universal background, text, and border overrides
    cssRules.push(`
        ${universalSelectorsForColorsAndBorders}${elementsToExcludeFromUniversal} {
            background-color: ${themeData.bodyBackground} !important;
            background-image: none !important;
            background: ${themeData.bodyBackground} !important;
        }
        ${universalSelectorsForColorsAndBorders}${elementsToExcludeFromUniversal} {
            color: ${themeData.bodyTextColor} !important;
        }
        ${universalSelectorsForColorsAndBorders}${elementsToExcludeFromUniversal} {
            border-color: ${themeData.borderDividerColor} !important;
        }
    `);

    // Input fields (special handling)
    if (themeData.inputFieldBackground) {
        cssRules.push(`
            input[type="text"], input[type="password"], input[type="email"], input[type="number"],
            textarea, select,
            input[type="search"], input[type="tel"], input[type="url"], input[type="date"], input[type="time"] {
                background-color: ${themeData.inputFieldBackground} !important;
                border: 1px solid ${themeData.borderDividerColor} !important;
            }
        `);
    }

    // Add your selectorMap rules (as in your code)
    Object.entries(themeData).forEach(([prop, value]) => {
        if (prop === 'bodyBackground' || prop === 'bodyTextColor' || prop === 'borderDividerColor' || prop === 'inputFieldBackground') return;
        const buildRule = selectorMap[prop];
        if (buildRule) cssRules.push(buildRule(value));
    });

    // --- Ensure logos/icons/images are never themed ---
    cssRules.push(`
        img, svg, svg *, image, use,
        [class*="logo"], [alt*="logo"], [alt*="amazon"], [aria-label*="logo"], [aria-label*="amazon"],
        .nav-logo-link, .nav-logo-link *, .nav-logo-base, .nav-logo-base *, .nav-sprite, .nav-sprite *,
        .nav-cart-icon, .nav-cart-icon *, .nav-search-icon, .nav-search-icon *, .nav-search-submit-text, .nav-search-submit-text * {
            background: none !important;
            background-color: transparent !important;
            color: initial !important;
            fill: initial !important;
            filter: none !important;
            box-shadow: none !important;
            text-shadow: none !important;
            opacity: 1 !important;
        }
    `);

    return cssRules.join('\n');
}

// Apply theme to specific elements that need direct JavaScript manipulation (e.g., filters)
function applyThemeToElements(elements, themeData) {
    elements.forEach(element => {
        const tagName = element.tagName.toLowerCase();

        // Only process specific media elements for direct manipulation
        if (tagName === 'img' || tagName === 'video' || tagName === 'canvas') {
            const brightnessVal = parseFloat(themeData.imageBrightness);
            // Apply brightness filter only if themeData.imageBrightness is a valid number and not 100
            if (!isNaN(brightnessVal) && brightnessVal >= 0 && brightnessVal < 100) {
                element.style.filter = `brightness(${brightnessVal}%)`;
                element.style.transition = 'filter 0.3s ease-in-out';
            } else {
                // Otherwise, ensure no filter is applied
                element.style.filter = 'none';
                element.style.transition = 'filter 0.3s ease-in-out';
            }
        }
        // SVGs are NOT manipulated via JavaScript here to ensure they retain their native colors.
        // Iframes are isolated and typically cannot be styled from the parent window.
    });
}


// Message listener for theme updates from popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[content.js] Received message:', message, 'from', sender);
    if (message.action === "applyThemeToPage" && message.themeData) {
        const success = applyThemeToPage(message.themeData);
        sendResponse({ success });
    }
    return true;
});

// --- Initial application on page load ---
// When the content script loads, it should check if a theme is already active in storage
// and apply it. This ensures persistence across page loads.
chrome.storage.local.get(['activeTheme', 'themePalette'], (result) => {
    if (result.activeTheme && result.themePalette) {
        console.log(`[content.js] Found saved theme "${result.activeTheme}" in storage. Applying...`);
        applyThemeToPage(result.themePalette);
    } else {
        console.log('[content.js] No active theme found in storage.');
    }
});

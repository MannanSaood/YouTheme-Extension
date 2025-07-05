// This is your content script. It gets injected into web pages as defined in manifest.json.
// Use it to:
// - Read and modify the DOM (Document Object Model) of the web page.
// - Inject CSS directly into the page.
// - Communicate with your background script or popup.

console.log('[content.js] Content script loaded for this page.');

// Function to apply the theme to the current page's DOM
function applyThemeToPage(themeData) {
    console.log('[content.js] Applying theme data:', themeData);

    // Get or create a style element to inject our dynamic CSS
    let styleElement = document.getElementById('youtheme-dynamic-style');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'youtheme-dynamic-style';
        document.head.appendChild(styleElement);
    }

    let css = '';

    // General reset for backgrounds and text colors to ensure wider application
    // This is a more aggressive approach to try and override existing site styles.
    // Use with caution as it might impact very specific custom components.
    css += `
        /* Universal background reset */
        *:not(img):not(video):not(canvas):not(iframe) {
            background-color: ${themeData.bodyBackground} !important;
            border-color: ${themeData.borderDividerColor} !important;
            color: ${themeData.bodyTextColor} !important;
        }

        /* Ensure body and html tags explicitly get the background */
        body, html {
            background-color: ${themeData.bodyBackground} !important;
            color: ${themeData.bodyTextColor} !important;
        }
    `;

    // Iterate through the theme data and generate CSS rules for specific elements
    for (const prop in themeData) {
        if (themeData.hasOwnProperty(prop)) {
            const value = themeData[prop];

            switch (prop) {
                case 'bodyBackground':
                    // Handled by universal reset, but keeping for emphasis if needed
                    break;
                case 'bodyTextColor':
                    // Handled by universal reset
                    break;
                case 'headingTextColor':
                    css += `h1, h2, h3, h4, h5, h6 { color: ${value} !important; }`;
                    break;
                case 'linkColor':
                    css += `a:link, a { color: ${value} !important; }`;
                    break;
                case 'visitedLinkColor':
                    css += `a:visited { color: ${value} !important; }`;
                    break;
                case 'hoverLinkColor':
                    css += `a:hover { color: ${value} !important; }`;
                    break;
                case 'buttonBackground':
                    css += `button, input[type="button"], input[type="submit"], input[type="reset"] { background-color: ${value} !important; }`;
                    break;
                case 'buttonTextColor':
                    css += `button, input[type="button"], input[type="submit"], input[type="reset"] { color: ${value} !important; }`;
                    break;
                case 'buttonHoverBackground':
                    css += `button:hover, input[type="button"]:hover, input[type="submit"]:hover, input[type="reset"]:hover { background-color: ${value} !important; }`;
                    break;
                case 'borderDividerColor':
                    // Handled by universal reset for border-color
                    css += `hr { border-color: ${value} !important; }`; // Explicit for <hr>
                    break;
                case 'inputFieldBackground':
                    css += `input[type="text"], input[type="password"], input[type="email"], input[type="number"], textarea, select { background-color: ${value} !important; }`;
                    break;
                case 'inputFieldTextColor':
                    css += `input[type="text"], input[type="password"], input[type="email"], input[type="number"], textarea, select { color: ${value} !important; }`;
                    break;
                case 'inputPlaceholderColor':
                    css += `
                        input::placeholder, textarea::placeholder { color: ${value} !important; }
                        input::-webkit-input-placeholder, textarea::-webkit-input-placeholder { color: ${value} !important; }
                        input::-moz-placeholder, textarea::-moz-placeholder { color: ${value} !important; }
                        input:-ms-input-placeholder, textarea:-ms-input-placeholder { color: ${value} !important; }
                    `;
                    break;
                case 'codeBlockBackground':
                    css += `pre, code, kbd, samp { background-color: ${value} !important; }`;
                    break;
                case 'codeBlockText':
                    css += `pre, code, kbd, samp { color: ${value} !important; }`;
                    break;
                case 'blockquoteBackground':
                    css += `blockquote { background-color: ${value} !important; }`;
                    break;
                case 'blockquoteText':
                    css += `blockquote { color: ${value} !important; }`;
                    break;
                case 'blockquoteBorder':
                    css += `blockquote { border-left-color: ${value} !important; }`;
                    break;
                case 'tableHeaderBackground':
                    css += `th { background-color: ${value} !important; }`;
                    break;
                case 'tableHeaderText':
                    css += `th { color: ${value} !important; }`;
                    break;
                case 'tableRowEvenBackground':
                    // Target specific table rows if needed, this might override alternating row colors on some sites
                    css += `tr:nth-child(even) { background-color: ${value} !important; }`;
                    break;
                case 'tableBorderColor':
                    css += `table, th, td { border-color: ${value} !important; }`;
                    break;
                case 'imageBrightness':
                    css += `
                        img, video, canvas {
                            filter: brightness(${value}%) !important;
                            transition: filter 0.3s ease-in-out; /* Smooth transition for visual comfort */
                        }
                    `;
                    break;
                default:
                    console.warn(`[content.js] Unhandled theme property: ${prop}`);
            }
        }
    }

            styleElement.textContent = css;
    console.log('[content.js] Dynamic CSS injected:', css);
}

// --- Listener for messages from the background script or popup ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[content.js] Received message:', message);

    if (message.action === "applyThemeToPage" && message.themeData) {
        applyThemeToPage(message.themeData);
        sendResponse({ status: "Theme applied to page." });
    }
    // You can add more message handlers here for other actions.
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

// This is your background service worker. It runs in the background, independent of any open tabs or the popup.
// Use it for:
// - Listening for browser events (e.g., tab updates, navigation).
// - Managing global extension state.
// - Making network requests (e.g., API calls, like your Gemini API call).
// - Handling messages between different parts of your extension (popup, content scripts).

console.log('[background.js] Service Worker started.');

// --- Example: Listening for messages from other parts of the extension (e.g., popup.js) ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[background.js] Received message:', message);

  if (message.action === "applyTheme") {
    // This is where the background script could take action based on the theme selection from the popup.
    // For instance, it could then send this theme data to the content script of the active tab.
    console.log(`[background.js] Action: Apply theme "${message.themeKey}" with palette:`, message.palette);

    // Example: Send theme data to the content script of the active tab
    // (Note: This is just an example of message passing. The actual theme application
    // logic on the page would be in content.js)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "applyThemeToPage", themeData: message.palette }, (response) => {
          console.log('[background.js] Message sent to content script:', response);
          // Respond back to the sender (e.g., popup.js)
          sendResponse({ status: "Theme applied via background script." });
        });
      } else {
        console.warn('[background.js] No active tab found to apply theme.');
        sendResponse({ status: "No active tab." });
      }
    });

    // Return true to indicate that you will send a response asynchronously.
    return true;
  } else if (message.action === "generateAIThemeRequest") {
    // In a full extension, the AI theme generation logic (fetch to Gemini API)
    // would ideally live here, as it's a long-running network request.
    // The popup would then just send a message like this to trigger it.

    console.log('[background.js] Received request to generate AI theme. (Conceptual)');

    // Placeholder for actual AI generation logic (moved from popup.js for proper architecture)
    // You would call your fetch logic to Gemini API here:
    // try {
    //   const generatedPalette = await callGeminiAPIForTheme();
    //   sendResponse({ status: "success", theme: generatedPalette });
    // } catch (error) {
    //   sendResponse({ status: "error", message: error.message });
    // }

    // For now, just a conceptual response:
    sendResponse({ status: "success", message: "AI theme generation triggered (conceptual)." });
  } else if (message.action === 'elementSelected') {
    // Send to popup
    chrome.runtime.sendMessage(message);
  }

  // If no action matched, allow other listeners to process or send no response.
});

// --- Example: Listening for tab updates (e.g., to re-apply theme on new page load) ---
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    // When a tab finishes loading, you might want to re-apply the user's saved theme.
    // First, retrieve the saved theme from storage.
    chrome.storage.local.get(['activeTheme', 'themePalette'], (result) => {
      if (result.activeTheme && result.themePalette) {
        console.log(`[background.js] Tab ${tabId} loaded, attempting to re-apply theme: ${result.activeTheme}`);
        // Then, send a message to the content script of that specific tab.
        chrome.tabs.sendMessage(tabId, { action: "applyThemeToPage", themeData: result.themePalette }, (response) => {
          if (chrome.runtime.lastError) {
            console.error(`[background.js] Error sending message to content script of tab ${tabId}: ${chrome.runtime.lastError.message}`);
          } else {
            console.log(`[background.js] Content script for tab ${tabId} responded:`, response);
          }
        });
      }
    });
  }
});

// --- Example: Storing a default preference on installation ---
chrome.runtime.onInstalled.addListener(() => {
  console.log('[background.js] Extension installed. Setting default theme.');
  // Set a default theme in storage when the extension is first installed.
  chrome.storage.local.set({ activeTheme: 'default-dark' }, () => {
    console.log('[background.js] Default theme "default-dark" set in storage.');
  });
});

console.log('YouTheme background script loaded');

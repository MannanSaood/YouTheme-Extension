YouTheme: Universal Site Customizer (React + CSS Variables)

YouTheme is a modern browser extension built for power users who demand full control over their web experience. Going far beyond simple dark mode toggles, YouTheme provides a scalable, declarative UI (powered by React) that allows users to instantly apply and customize themes across any website using a highly stable CSS Variable Injection engine.

This project prioritizes stability, performance, and maintainability by avoiding fragile, old-school DOM manipulation.
Key Features & Vision

    Universal Customization: Provides fine-grained control over essential theme elements (Backgrounds, Headings, Links, Buttons, Inputs, Code Blocks) using a beautiful, reactive interface.

    Scalable Architecture (React): The entire Popup UI is built with React/JSX, ensuring state management is clean and making the application easy to debug and expand.

    Stability Engine (CSS Variables): Themes are applied to external websites by injecting standardized CSS variables (--yt-bg-body, --yt-text-heading) into the :root element. This approach is superior to direct, brittle class overrides and is significantly more resilient to website changes.

    Site-Specific Overrides: Includes a mechanism for injecting highly targeted CSS rules for notoriously difficult sites like YouTube and Amazon, ensuring reliable theming where general rules fail.

    Feature Pipeline: Designed for easy integration of future advanced features like the Intelligent CSS Variable Inspector & Mapper and AI Theme Generation.


Setup and Installation (Developer Guide)

Since this project uses modern JavaScript features, it can be loaded directly into Chrome/Edge in developer mode without a mandatory build step (assuming the browser environment supports the required ES features).
1. File Preparation

    Clone or Download: Get the project files onto your local machine.

    Create Placeholders: Ensure the /icons folder contains placeholder files (icon16.png, icon128.png).

2. Loading the Extension

    Open Extensions: Navigate to chrome://extensions in your browser.

    Enable Developer Mode: Toggle the Developer mode switch in the top right corner.

    Load Unpacked: Click the Load unpacked button.

    Select Folder: Choose the main YouTheme-Extension directory (the folder containing manifest.json).

3. Verification and Debugging

    Console Check: Open the Developer Console for the extension's Service Worker (background.js) to monitor messages and errors.

    Test Theming: Navigate to any webpage and click the YouTheme icon.

    Content Script Debugging: To debug the CSS injection in content.js, open the Developer Tools (F12) for the webpage itself, then navigate to the Sources tab. The content.js file will be listed under the extension ID.

Future Feature Pipeline

The scalable architecture is designed to easily incorporate these advanced features:

    Intelligent CSS Variable Inspector & Mapper (Phase 2): Add UI and logic to automatically detect a website's native CSS variables and map them to YouTheme's settings, ensuring highly integrated, native-looking themes.

    Gemini AI Theme Generator: Integrate the Gemini API to analyze page content and suggest optimal, context-aware color palettes based on the page's purpose (e.g., code, finance, reading mode).

    Theme Cloud Sync: Allow users to save and sync their custom palettes across devices using chrome.storage.sync or an external service.

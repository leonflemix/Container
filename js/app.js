// File: js/app.js
import { initFirebase } from './firebaseService.js';
import * as ui from './ui.js';
import { setupEventListeners } from './eventHandlers.js';

/**
 * Dynamically loads all HTML partials into the main document.
 * This function is critical for the single-page application structure.
 */
async function loadHTML() {
    try {
        // 1. Load the main application shell which contains the nav bar and page container.
        const shellResponse = await fetch('pages/shell.html');
        if (!shellResponse.ok) throw new Error('Failed to load app shell');
        document.getElementById('app-shell').innerHTML = await shellResponse.text();

        // 2. Load individual pages into the '#page-container' div created by the shell.
        const pageContainer = document.getElementById('page-container');
        if (!pageContainer) throw new Error('#page-container not found in shell.html');
        
        const pages = ['dashboard', 'logistics', 'drivers', 'settings'];
        for (const page of pages) {
            const response = await fetch(`pages/${page}.html`);
            if (response.ok) {
                 const content = await response.text();
                 const pageDiv = document.createElement('div');
                 pageDiv.id = `${page}-page`;
                 pageDiv.className = 'page-content';
                 // Hide all pages except the dashboard initially.
                 if (page !== 'dashboard') {
                     pageDiv.classList.add('hidden');
                 }
                 pageDiv.innerHTML = content;
                 pageContainer.appendChild(pageDiv);
            } else {
                console.error(`Failed to load page: ${page}.html`);
            }
        }

        // 3. Load all modals into their placeholder.
        const modals = ['container', 'booking', 'collection', 'collect', 'edit'];
        const modalPlaceholder = document.getElementById('modal-placeholder');
        for (const modal of modals) {
            const response = await fetch(`modals/${modal}.html`);
             if(response.ok) {
                // Use += to append modal HTML to the placeholder div.
                modalPlaceholder.innerHTML += await response.text();
            } else {
                 console.error(`Failed to load modal: ${modal}.html`);
            }
        }
    } catch (error) {
        console.error("Error loading initial HTML:", error);
        document.body.innerHTML = '<p class="text-red-500 text-center p-8">Error: Could not load application components. Please check the console.</p>';
    }
}

/**
 * Initializes the entire application.
 * Ensures HTML is loaded BEFORE any other scripts try to access the DOM.
 */
async function initApp() {
    // MUST await HTML loading to complete first.
    await loadHTML();
    
    // Now that all DOM elements are guaranteed to be present, we can safely initialize other parts.
    ui.updateDateTime();
    setupEventListeners();
    await initFirebase();
}

// Start the application once the initial DOM is ready.
document.addEventListener('DOMContentLoaded', initApp);


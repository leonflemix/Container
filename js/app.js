// File: js/app.js
import { initFirebase } from './firebaseService.js';
import { setupEventListeners } from './eventHandlers.js';
import { updateDateTime } from './ui.js';

/**
 * Loads an HTML file into a specified element.
 * @param {string} url - The path to the HTML file.
 * @param {string} elementId - The ID of the container element.
 */
async function loadHTML(url, elementId) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }
        const text = await response.text();
        const container = document.getElementById(elementId);
        if (container) {
            container.insertAdjacentHTML('beforeend', text);
        } else {
            console.error(`Element with id "${elementId}" not found.`);
        }
    } catch (error) {
        console.error(`Error loading HTML from ${url}:`, error);
    }
}


/**
 * Initializes the application by loading all necessary HTML components
 * and then setting up services and event listeners.
 */
async function initializeApp() {
    await loadHTML('pages/shell.html', 'app-container');
    
    const pages = ['dashboard', 'logistics', 'drivers', 'settings'];
    for(const page of pages) {
        await loadHTML(`pages/${page}.html`, 'page-content-container');
    }

    const modals = ['container', 'booking', 'collection', 'collect', 'edit'];
    for (const modal of modals) {
        await loadHTML(`modals/${modal}.html`, 'modals-container');
    }

    updateDateTime();
    initFirebase();
    setupEventListeners();
}

// --- APP START ---
document.addEventListener('DOMContentLoaded', initializeApp);


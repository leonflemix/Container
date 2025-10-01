// File: js/app.js
import { initFirebase } from './firebaseService.js';
import { setupEventListeners } from './eventHandlers.js';
import { updateDateTime } from './ui.js';

async function loadHTML() {
    try {
        const shellResponse = await fetch('pages/shell.html');
        if (!shellResponse.ok) throw new Error('Failed to load app shell');
        document.getElementById('app-shell').innerHTML = await shellResponse.text();

        const pageContainer = document.getElementById('page-container');
        if (!pageContainer) throw new Error('#page-container not found in shell.html');
        
        const pages = ['dashboard', 'logistics', 'drivers', 'operators', 'reports', 'settings'];
        for (const page of pages) {
            const response = await fetch(`pages/${page}.html`);
            if (response.ok) {
                 const content = await response.text();
                 const pageDiv = document.createElement('div');
                 pageDiv.id = `${page}-page`;
                 pageDiv.className = 'page-content';
                 if (page !== 'dashboard') {
                     pageDiv.classList.add('hidden');
                 }
                 pageDiv.innerHTML = content;
                 pageContainer.appendChild(pageDiv);
            } else {
                console.error(`Failed to load page: ${page}.html`);
            }
        }

        const modals = ['container', 'booking', 'collection', 'collect', 'edit', 'update-container'];
        const modalPlaceholder = document.getElementById('modal-placeholder');
        for (const modal of modals) {
            const response = await fetch(`modals/${modal}.html`);
             if(response.ok) {
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

async function initApp() {
    await loadHTML();
    updateDateTime();
    setupEventListeners();
    await initFirebase();
}

document.addEventListener('DOMContentLoaded', initApp);


// File: js/ui.js
import * as state from './state.js';

export const openModal = (modalId) => document.getElementById(modalId)?.classList.remove('hidden');
export const closeModal = (modalId) => document.getElementById(modalId)?.classList.add('hidden');

export const updateDateTime = () => {
    const el = document.getElementById('current-datetime');
    if (el) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Halifax' };
        el.textContent = now.toLocaleDateString('en-CA', options) + " (Dartmouth, NS)";
    }
};

export const showPage = (pageId) => {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    const newPage = document.getElementById(pageId);
    if(newPage) newPage.classList.remove('hidden');

    const setActiveLink = (links) => links.forEach(link => {
        const isTarget = link.dataset.page === pageId;
        link.classList.toggle('text-blue-600', isTarget);
        link.classList.toggle('border-blue-600', isTarget);
        link.classList.toggle('text-gray-500', !isTarget);
        link.classList.toggle('hover:border-gray-300', !isTarget);
        link.classList.toggle('border-b-2', isTarget);
        if (link.classList.contains('mobile-nav-link')) {
            link.classList.toggle('bg-blue-50', isTarget);
        }
    });

    setActiveLink(document.querySelectorAll('.nav-link'));
    setActiveLink(document.querySelectorAll('.mobile-nav-link'));
    
    document.getElementById('mobile-menu').classList.add('hidden');
    document.getElementById('menu-open-icon').classList.remove('hidden');
    document.getElementById('menu-closed-icon').classList.add('hidden');
};

let undoTimeout;
export const showUndoToast = (message) => {
    const toast = document.getElementById('undo-toast');
    document.getElementById('undo-message').textContent = message;
    toast.classList.remove('hidden', 'translate-y-20');
    clearTimeout(undoTimeout);
    undoTimeout = setTimeout(hideUndoToast, 5000);
};

export const hideUndoToast = () => {
    const toast = document.getElementById('undo-toast');
    toast.classList.add('translate-y-20');
    clearTimeout(undoTimeout);
    setTimeout(() => {
        toast.classList.add('hidden');
        state.clearLastDeletedItem();
    }, 300);
};

export const formatTimeAgo = (dateString) => {
    if (!dateString) return 'N/A';
    const seconds = Math.round((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
};

export const formatTimestamp = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const getLocationIcon = (location) => {
    let i, c;
    switch (location) {
        case 'Pier': i = `<svg class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 10-2 0v2a1 1 0 102 0V6zM4 5a1 1 0 100 2h12V5H4z"/><path d="M18 11a2 2 0 01-2 2H4a2 2 0 01-2-2v-1a1 1 0 011-1h14a1 1 0 011 1v1z"/></svg>`; c = 'text-sky-600'; break;
        case 'Yard': i = `<svg class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 11-2 0V4H6v12a1 1 0 11-2 0V4zm4 4a1 1 0 100 2h4a1 1 0 100-2H8zm0 4a1 1 0 100 2h4a1 1 0 100-2H8z" clip-rule="evenodd" /></svg>`; c = 'text-amber-600'; break;
        default: i = `<svg class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v8a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM6 7h4v4H6V7z" /><path d="M12 4a1 1 0 00-1 1v8a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H18a1 1 0 001-1V5a1 1 0 00-1-1h-6zM14 7h4v4h-4V7z" /></svg>`; c = 'text-indigo-600';
    }
    return `<div class="flex items-center ${c}">${i}<span>${location}</span></div>`;
};

export const getStatusBadge = (statusDescription) => {
    const statusObj = state.statuses.find(s => s.description === statusDescription);
    if (statusObj) {
        return `<div class="flex items-center"><span class="text-lg mr-2">${statusObj.emoji}</span><span>${statusObj.description}</span></div>`;
    }
    return `<span>${statusDescription || 'N/A'}</span>`;
};

export function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
    document.getElementById('menu-open-icon').classList.toggle('hidden');
    document.getElementById('menu-closed-icon').classList.toggle('hidden');
}


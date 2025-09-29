// File: js/ui.js
import * as state from './state.js';

export const openModal = (modalId = 'modal') => {
    document.getElementById(modalId)?.classList.remove('hidden');
    if (modalId === 'modal') {
        const form = document.getElementById('container-form');
        form.reset();
        document.getElementById('container-id-input').value = '';
        document.getElementById('modal-title').textContent = 'Add New Container';
        populateDropdowns();
    }
};

export const closeModal = (modalId) => {
    document.getElementById(modalId)?.classList.add('hidden');
};

export const openBookingModal = (bookingId = null) => {
    const form = document.getElementById('booking-form');
    form.reset();
    document.getElementById('booking-form-type').innerHTML = state.containerTypes.map(item => `<option value="${item.name}">${item.name}</option>`).join('');

    if (bookingId) {
        const booking = state.bookings.find(b => b.id === bookingId);
        document.getElementById('booking-modal-title').textContent = 'Edit Booking';
        document.getElementById('booking-id-input').value = booking.id;
        document.getElementById('booking-form-number').value = booking.number;
        document.getElementById('booking-form-qty').value = booking.qty;
        document.getElementById('booking-form-deadline').value = booking.deadline;
        document.getElementById('booking-form-type').value = booking.type;
        document.getElementById('booking-form-size').value = booking.containerSize;
    } else {
        document.getElementById('booking-modal-title').textContent = 'Add New Booking';
        document.getElementById('booking-id-input').value = '';
    }
    openModal('booking-modal');
};

export const openCollectionModal = (bookingId = null) => {
    const form = document.getElementById('collection-form');
    form.reset();
    const openBookings = state.bookings.filter(b => (b.assignedContainers?.length || 0) < b.qty);
    document.getElementById('collection-form-driver').innerHTML = state.drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    document.getElementById('collection-form-booking').innerHTML = openBookings.map(b => `<option value="${b.id}">${b.number}</option>`).join('');
    document.getElementById('collection-form-chassis').innerHTML = state.chassis.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    if (bookingId) {
        const bookingDropdown = document.getElementById('collection-form-booking');
        bookingDropdown.value = bookingId;
        bookingDropdown.dispatchEvent(new Event('change'));
    }
    validateCollectionForm();
    openModal('collection-modal');
};

export const openCollectModal = (collectionId) => {
    document.getElementById('collect-form').reset();
    document.getElementById('collection-id-input').value = collectionId;
    openModal('collect-modal');
};

export const openUpdateModal = (containerId) => {
    const container = state.containers.find(c => c.id === containerId);
    if (!container) return;

    document.getElementById('update-container-form').reset();
    document.getElementById('update-container-id-input').value = containerId;
    document.getElementById('update-container-serial').textContent = container.serial;

    const locationSelect = document.getElementById('update-container-location');
    locationSelect.innerHTML = state.locations.map(l => `<option value="${l.name}">${l.name}</option>`).join('');
    locationSelect.value = container.location;

    openModal('update-modal');
};

export const openEditModal = (collection, id) => {
    // This function needs further implementation based on specific edit requirements
    console.log(`Opening edit modal for ${collection} with id ${id}`);
    openModal('edit-modal');
};

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
    if(newPage) {
      newPage.classList.remove('hidden');
    }

    const setActiveLink = (links) => links.forEach(link => {
        const isTarget = link.dataset.page === pageId;
        link.classList.toggle('text-blue-600', isTarget);
        link.classList.toggle('border-blue-600', isTarget);
        link.classList.toggle('text-gray-500', !isTarget);
        link.classList.toggle('hover:text-gray-700', !isTarget);
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

export const populateDropdowns = () => {
    document.getElementById('container-type').innerHTML = state.containerTypes.map(item => `<option value="${item.name}">${item.name}</option>`).join('');
    document.getElementById('container-location').innerHTML = state.locations.map(item => `<option value="${item.name}">${item.name}</option>`).join('');
    document.getElementById('container-status').innerHTML = state.statuses.map(item => `<option value="${item.description}">${item.emoji} ${item.description}</option>`).join('');
    document.getElementById('container-driver').innerHTML = '<option value="">Unassigned</option>' + state.drivers.map(item => `<option value="${item.name}">${item.name}</option>`).join('');
};

export const validateCollectionForm = () => {
    const qtyInput = document.getElementById('collection-form-qty');
    let qty = Number(qtyInput.value);
    const bookingId = document.getElementById('collection-form-booking').value;
    const selectedBooking = state.bookings.find(b => b.id === bookingId);
    const size = selectedBooking ? selectedBooking.containerSize : null;
    const chassisId = document.getElementById('collection-form-chassis').value;
    const selectedChassis = state.chassis.find(c => c.id === chassisId);

    const qtyMsg = document.getElementById('qty-validation-msg');
    const sizeMsg = document.getElementById('size-validation-msg');
    let isValid = true;
    
    if (selectedBooking) {
        const collectionsForBooking = state.collections.filter(c => c.bookingId === bookingId);
        const assignedQty = collectionsForBooking.reduce((sum, c) => sum + c.qty, 0);
        const remainingQty = selectedBooking.qty - assignedQty;
        
        if (qty > remainingQty) {
            qtyMsg.textContent = `Only ${remainingQty} container(s) left to assign on this booking.`;
            qtyMsg.classList.remove('hidden');
            isValid = false;
        } else {
            qtyMsg.classList.add('hidden');
        }
    }

    if (size === '40ft') {
        if (qty > 1) qtyInput.value = 1;
        qty = 1;
        qtyInput.disabled = true;
    } else {
        qtyInput.disabled = false;
    }

    if (qty === 2 && selectedChassis && !selectedChassis.is2x20) {
        qtyMsg.textContent = "This chassis cannot handle 2 containers.";
        qtyMsg.classList.remove('hidden');
        isValid = false;
    }

    sizeMsg.classList.add('hidden');
    if (size === '40ft' && selectedChassis && !selectedChassis.is40ft) {
        sizeMsg.textContent = "This chassis cannot handle a 40ft container.";
        sizeMsg.classList.remove('hidden');
        isValid = false;
    }

    const saveBtn = document.getElementById('collection-save-btn');
    saveBtn.disabled = !isValid;
    saveBtn.classList.toggle('opacity-50', !isValid);
    saveBtn.classList.toggle('cursor-not-allowed', !isValid);
};

let undoTimeout;
export const showUndoToast = (message) => {
    const toast = document.getElementById('undo-toast');
    document.getElementById('undo-message').textContent = message;
    toast.classList.remove('hidden', 'translate-y-20');
    
    clearTimeout(undoTimeout);
    undoTimeout = setTimeout(() => hideUndoToast(), 5000);
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
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.round(hours / 24);
    return `${days} days ago`;
};

export const formatTimestamp = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const getLocationIcon = (location) => {
    let i, c;
    switch (location) {
        case 'Pier': i = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 10-2 0v2a1 1 0 102 0V6zM4 5a1 1 0 100 2h12V5H4z"/><path d="M18 11a2 2 0 01-2 2H4a2 2 0 01-2-2v-1a1 1 0 011-1h14a1 1 0 011 1v1z"/></svg>`; c = 'text-sky-600'; break;
        case 'Yard': i = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 11-2 0V4H6v12a1 1 0 11-2 0V4zm4 4a1 1 0 100 2h4a1 1 0 100-2H8zm0 4a1 1 0 100 2h4a1 1 0 100-2H8z" clip-rule="evenodd" /></svg>`; c = 'text-amber-600'; break;
        default: i = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v8a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM6 7h4v4H6V7z" /><path d="M12 4a1 1 0 00-1 1v8a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H18a1 1 0 001-1V5a1 1 0 00-1-1h-6zM14 7h4v4h-4V7z" /></svg>`; c = 'text-indigo-600';
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


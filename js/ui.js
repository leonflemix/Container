// File: js/ui.js
import * as state from './state.js';

let undoTimeout;

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

export const updateDateTime = () => {
    const el = document.getElementById('current-datetime');
    const now = new Date('2025-09-20T12:07:00'); // User-specified time
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Halifax' };
    el.textContent = now.toLocaleDateString('en-CA', options) + " (Dartmouth, NS)";
};

export const showPage = (pageId) => {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    
    const setActiveLink = (links) => links.forEach(link => {
        const isMobile = link.classList.contains('mobile-nav-link');
        if (link.dataset.page === pageId) {
            link.classList.add('text-blue-600', 'border-blue-600');
            link.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            if(isMobile) link.classList.add('bg-blue-50');
        } else {
            link.classList.remove('text-blue-600', 'border-blue-600', 'bg-blue-50');
            link.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        }
    });
    
    setActiveLink(document.querySelectorAll('.nav-link'));
    setActiveLink(document.querySelectorAll('.mobile-nav-link'));
    
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) { 
        mobileMenu.classList.add('hidden'); 
    }
};

export const getLocationIcon = (location) => { let i,c; switch(location) { case 'Pier': i=`<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 10-2 0v2a1 1 0 102 0V6zM4 5a1 1 0 100 2h12V5H4z"/><path d="M18 11a2 2 0 01-2 2H4a2 2 0 01-2-2v-1a1 1 0 011-1h14a1 1 0 011 1v1z"/></svg>`; c='text-sky-600'; break; case 'Yard': i=`<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 11-2 0V4H6v12a1 1 0 11-2 0V4zm4 4a1 1 0 100 2h4a1 1 0 100-2H8zm0 4a1 1 0 100 2h4a1 1 0 100-2H8z" clip-rule="evenodd" /></svg>`; c='text-amber-600'; break; case 'IH Mathers': i=`<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 2H4v8h12V6z" clip-rule="evenodd" /><path d="M11 9a1 1 0 10-2 0v2a1 1 0 102 0V9z"/></svg>`; c='text-indigo-600'; break; case 'In Transit': i=`<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v8a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM6 7h4v4H6V7z" /><path d="M12 4a1 1 0 00-1 1v8a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H18a1 1 0 001-1V5a1 1 0 00-1-1h-6zM14 7h4v4h-4V7z" /></svg>`; c='text-gray-500'; break; default: i=`<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`; c='text-green-600'; } return `<div class="flex items-center ${c}">${i}<span>${location}</span></div>`; };

export const getStatusBadge = (statusDescription) => {
    const statusObj = state.statuses.find(s => s.description === statusDescription);
    if (statusObj) {
        return `<div class="flex items-center"><span class="text-lg mr-2">${statusObj.emoji}</span><span>${statusObj.description}</span></div>`;
    }
    return `<span>${statusDescription || 'N/A'}</span>`;
};

export const closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if(modal) modal.classList.add('hidden');
};

const populateDropdowns = () => {
    const createOptions = (data, valueKey, textKey) => data.map(item => `<option value="${item[valueKey]}">${textKey ? item[textKey] : item[valueKey]}</option>`).join('');
    const createStatusOptions = (data) => data.map(item => `<option value="${item.description}">${item.emoji} ${item.description}</option>`).join('');
    
    document.getElementById('container-type').innerHTML = createOptions(state.containerTypes, 'name');
    document.getElementById('container-location').innerHTML = createOptions(state.locations, 'name');
    document.getElementById('container-status').innerHTML = createStatusOptions(state.statuses);
    document.getElementById('container-driver').innerHTML = '<option value="">Unassigned</option>' + createOptions(state.drivers, 'name');
};

export const openModal = (containerId = null) => {
    const containerForm = document.getElementById('container-form');
    const modalTitle = document.getElementById('modal-title');
    containerForm.reset();
    populateDropdowns();
    if (containerId) {
        const container = state.containers.find(c => c.id === containerId);
        modalTitle.textContent = 'Update Container';
        document.getElementById('container-id-input').value = container.id;
        document.getElementById('container-serial').value = container.serial;
        document.getElementById('container-serial').readOnly = true;
        document.getElementById('container-type').value = container.type;
        document.getElementById('container-location').value = container.location;
        document.getElementById('container-status').value = container.status;
        document.getElementById('container-driver').value = container.driver;
    } else {
        modalTitle.textContent = 'Add New Container';
        document.getElementById('container-id-input').value = '';
        document.getElementById('container-serial').readOnly = false;
    }
    document.getElementById('modal').classList.remove('hidden');
};

export const openBookingModal = (bookingId = null) => {
    const bookingForm = document.getElementById('booking-form');
    const bookingModalTitle = document.getElementById('booking-modal-title');
    bookingForm.reset();
    document.getElementById('booking-form-type').innerHTML = state.containerTypes.map(item => `<option value="${item.name}">${item.name}</option>`).join('');

    if (bookingId) {
        const booking = state.bookings.find(b => b.id === bookingId);
        bookingModalTitle.textContent = 'Edit Booking';
        document.getElementById('booking-id-input').value = booking.id;
        document.getElementById('booking-form-number').value = booking.number;
        document.getElementById('booking-form-qty').value = booking.qty;
        document.getElementById('booking-form-deadline').value = booking.deadline;
        document.getElementById('booking-form-type').value = booking.type;
        document.getElementById('booking-form-size').value = booking.containerSize;
    } else {
        bookingModalTitle.textContent = 'Add New Booking';
        document.getElementById('booking-id-input').value = '';
    }
    document.getElementById('booking-modal').classList.remove('hidden');
};

export const openCollectionModal = (bookingId = null) => {
    const collectionForm = document.getElementById('collection-form');
    collectionForm.reset();
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
    document.getElementById('collection-modal').classList.remove('hidden');
};

export const openCollectModal = (collectionId) => {
    const collectForm = document.getElementById('collect-form');
    collectForm.reset();
    document.getElementById('collection-id-input').value = collectionId;
    document.getElementById('collect-modal').classList.remove('hidden');
};

export const openEditModal = (collection, id) => {
    if (collection === 'bookings') {
        openBookingModal(id);
        return;
    }
    // Implementation for other collections can be added here
    console.warn(`openEditModal not fully implemented for ${collection}`);
};

export const validateCollectionForm = () => {
    const qtyInput = document.getElementById('collection-form-qty');
    let qty = Number(qtyInput.value);
    const bookingId = document.getElementById('collection-form-booking').value;
    const selectedBooking = state.bookings.find(b => b.id === bookingId);
    const size = selectedBooking ? selectedBooking.containerSize : null;
    const chassisId = document.getElementById('collection-form-chassis').value;
    const selectedChassis = state.chassis.find(c => c.id === chassisId);
    const collectionSaveBtn = document.getElementById('collection-save-btn');

    const qtyMsg = document.getElementById('qty-validation-msg');
    const sizeMsg = document.getElementById('size-validation-msg');
    let isValid = true;
    
    if (selectedBooking) {
        const remainingQty = selectedBooking.qty - (selectedBooking.assignedContainers?.length || 0);
        if (qty > remainingQty) {
            qtyMsg.textContent = `Only ${remainingQty} container(s) left on this booking.`;
            qtyMsg.classList.remove('hidden');
            isValid = false;
        } else {
            qtyMsg.classList.add('hidden');
        }
    }

    if (size === '40ft') {
        qtyInput.value = 1;
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

    collectionSaveBtn.disabled = !isValid;
    collectionSaveBtn.classList.toggle('opacity-50', !isValid);
    collectionSaveBtn.classList.toggle('cursor-not-allowed', !isValid);
};


export const showUndoToast = (message) => {
    const toast = document.getElementById('undo-toast');
    const messageEl = document.getElementById('undo-message');

    clearTimeout(undoTimeout);

    messageEl.textContent = message;
    toast.classList.remove('hidden', 'translate-y-20');

    undoTimeout = setTimeout(() => {
        hideUndoToast();
    }, 5000); 
};

export const hideUndoToast = () => {
    const toast = document.getElementById('undo-toast');
    toast.classList.add('translate-y-20');
    setTimeout(() => toast.classList.add('hidden'), 300);
    state.clearLastDeletedItem();
};


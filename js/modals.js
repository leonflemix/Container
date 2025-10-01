// File: js/modals.js
import * as ui from './ui.js';
import * as state from './state.js';
import * as firebase from './firebaseService.js';
import { handleUpdateContainer } from './yardOperations.js';

export const openContainerModal = (containerId = null) => {
    const form = document.getElementById('container-form');
    form.reset();
    populateContainerDropdowns();

    if (containerId) {
        const container = state.containers.find(c => c.id === containerId);
        document.getElementById('modal-title').textContent = 'Update Container';
        document.getElementById('container-id-input').value = container.id;
        document.getElementById('container-serial').value = container.serial;
        document.getElementById('container-serial').readOnly = true;
        document.getElementById('container-type').value = container.type;
        document.getElementById('container-location').value = container.location;
        document.getElementById('container-status').value = container.status;
        document.getElementById('container-driver').value = container.driver;
    } else {
        document.getElementById('modal-title').textContent = 'Add New Container';
        document.getElementById('container-id-input').value = '';
        document.getElementById('container-serial').readOnly = false;
    }
    ui.openModal('modal');
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
    ui.openModal('booking-modal');
};

export const openCollectionModal = (bookingId = null) => {
    const form = document.getElementById('collection-form');
    form.reset();
    const openBookings = state.bookings.filter(b => (b.assignedContainers?.length || 0) < b.qty);
    document.getElementById('collection-form-driver').innerHTML = state.drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    document.getElementById('collection-form-booking').innerHTML = openBookings.map(b => `<option value="${b.id}">${b.number}</option>`).join('');
    document.getElementById('collection-form-chassis').innerHTML = state.chassis.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    if (bookingId) {
        document.getElementById('collection-form-booking').value = bookingId;
    }
    validateCollectionForm();
    ui.openModal('collection-modal');
};

export const openCollectModal = (collectionId) => {
    document.getElementById('collect-form').reset();
    document.getElementById('collection-id-input').value = collectionId;
    ui.openModal('collect-modal');
};

export const openEditModal = (collection, id) => {
    console.log(`Opening edit for ${collection} ID: ${id}`);
    ui.openModal('edit-modal');
};

export function populateContainerDropdowns() {
    document.getElementById('container-type').innerHTML = state.containerTypes.map(item => `<option value="${item.name}">${item.name}</option>`).join('');
    document.getElementById('container-location').innerHTML = state.locations.map(item => `<option value="${item.name}">${item.name}</option>`).join('');
    document.getElementById('container-status').innerHTML = state.statuses.map(item => `<option value="${item.description}">${item.emoji} ${item.description}</option>`).join('');
    document.getElementById('container-driver').innerHTML = '<option value="">Unassigned</option>' + state.drivers.map(item => `<option value="${item.name}">${item.name}</option>`).join('');
}

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

export const handleContainerFormSubmit = async (e) => {
    // ... same as in your eventHandlers.js
};
export const handleBookingFormSubmit = async (e) => {
    // ... same as in your eventHandlers.js
};
export const handleCollectionFormSubmit = async (e) => {
    // ... same as in your eventHandlers.js
};
export const handleCollectFormSubmit = async (e) => {
    // ... same as in your eventHandlers.js
};
export const handleDriverFormSubmit = async (e) => {
    // ... same as in your eventHandlers.js
};
export const handleChassisFormSubmit = async (e) => {
    // ... same as in your eventHandlers.js
};
export const handleStatusFormSubmit = async (e) => {
    // ... same as in your eventHandlers.js
};
export const handleDeliverToYard = async (containerId) => {
    if (!containerId) return;
    const updateData = {
        location: 'Yard',
        status: '📦🚚Delivered to YARD',
        deliveredAtYardTimestamp: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };
    await handleUpdateContainer(containerId, updateData, false);
};
export const handleLoaded = async (containerId) => {
    if (!containerId) return;
    const updateData = {
        status: 'Loaded',
        lastUpdated: new Date().toISOString()
    };
    await handleUpdateContainer(containerId, updateData, false);
};
export const { openUpdateModal } = yardOps;

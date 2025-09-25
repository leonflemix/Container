// File: js/eventHandlers.js
import * as ui from './ui.js';
import * as firebase from './firebaseService.js';
import * as state from './state.js';

const handleFormSubmit = async (e) => {
    e.preventDefault();
    const idInput = document.getElementById('container-id-input').value;
    const serial = document.getElementById('container-serial').value.trim().toUpperCase();
    if (!serial) { console.error("Container serial is required."); return; }

    const containerData = {
        serial: serial,
        type: document.getElementById('container-type').value,
        location: document.getElementById('container-location').value,
        status: document.getElementById('container-status').value,
        driver: document.getElementById('container-driver').value,
        lastUpdated: new Date().toISOString()
    };

    if (idInput) {
        await firebase.updateItem('containers', idInput, containerData);
    } else {
        const existing = state.containers.find(c => c.serial === serial);
        if (existing) { console.error('A container with this serial already exists.'); return; }
        await firebase.addItem('containers', containerData);
    }
    ui.closeModal('modal');
};

const handleDriverFormSubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-driver-name').value.trim();
    const idNumber = document.getElementById('new-driver-id').value.trim();
    const plate = document.getElementById('new-driver-plate').value.trim().toUpperCase();
    const weight = document.getElementById('new-driver-weight').value;

    if (!name || !idNumber || !plate || !weight) { console.error("All driver fields are required."); return; }
    const driverData = { name, idNumber, plate, weight: Number(weight) };
    await firebase.addItem('drivers', driverData);
    e.target.reset();
};

const handleChassisFormSubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-chassis-name').value.trim();
    const weight = document.getElementById('new-chassis-weight').value;
    const is40ft = document.getElementById('new-chassis-40ft').checked;
    const is2x20 = document.getElementById('new-chassis-2x20').checked;

    if (!name || !weight) { console.error("Chassis name and weight are required."); return; }
    const chassisData = { name, weight: Number(weight), is40ft, is2x20 };
    await firebase.addItem('chassis', chassisData);
    e.target.reset();
};

const handleStatusFormSubmit = async (e) => {
    e.preventDefault();
    const emoji = document.getElementById('new-status-emoji').value.trim();
    const description = document.getElementById('new-status-description').value.trim();
    if (!emoji || !description) { console.error("Emoji and Description are required for statuses."); return; }
    const statusData = { emoji, description };
    await firebase.addItem('statuses', statusData);
    e.target.reset();
};

const handleBookingFormSubmit = async (e) => {
    e.preventDefault();
    const idInput = document.getElementById('booking-id-input').value;
    const number = document.getElementById('booking-form-number').value.trim().toUpperCase();
    const qty = document.getElementById('booking-form-qty').value;
    const type = document.getElementById('booking-form-type').value;
    const deadline = document.getElementById('booking-form-deadline').value;
    const containerSize = document.getElementById('booking-form-size').value;

    if (!number || !qty || !type || !deadline || !containerSize) { console.error("All booking fields are required."); return; }
    
    const bookingData = { 
        number, 
        qty: Number(qty), 
        type, 
        deadline,
        containerSize
    };

    if (idInput) {
        await firebase.updateItem('bookings', idInput, bookingData);
    } else {
        bookingData.assignedContainers = [];
        await firebase.addItem('bookings', bookingData);
    }
    ui.closeModal('booking-modal');
};

const handleCollectionFormSubmit = async (e) => {
    e.preventDefault();
    const collectionSaveBtn = document.getElementById('collection-save-btn');
    ui.validateCollectionForm();
    if (collectionSaveBtn.disabled) {
        console.error("Validation failed. Cannot create collection.");
        return;
    }

    const driverId = document.getElementById('collection-form-driver').value;
    const bookingId = document.getElementById('collection-form-booking').value;
    const chassisId = document.getElementById('collection-form-chassis').value;
    const qty = Number(document.getElementById('collection-form-qty').value);
    
    const driver = state.drivers.find(d => d.id === driverId);
    const booking = state.bookings.find(b => b.id === bookingId);
    const selectedChassis = state.chassis.find(c => c.id === chassisId);

    const collectionData = {
        driverId,
        driverName: driver?.name,
        bookingId,
        bookingNumber: booking?.number,
        chassisId,
        chassisName: selectedChassis?.name,
        qty,
        containerSize: booking?.containerSize,
        createdAt: new Date().toISOString(),
        status: '📦🚚COLLECTING FROM PIER',
        collectedContainers: []
    };
    
    await firebase.addItem('collections', collectionData);
    ui.closeModal('collection-modal');
};

const handleCollectFormSubmit = async (e) => {
    e.preventDefault();
    const collectionId = document.getElementById('collection-id-input').value;
    const containerNumber = document.getElementById('container-number').value.trim().toUpperCase();
    const tare = document.getElementById('container-tare').value;

    if (!collectionId || !containerNumber || !tare) {
        console.error("All fields are required to collect a container.");
        return;
    }

    const parentCollection = state.collections.find(c => c.id === collectionId);
    const parentBooking = state.bookings.find(b => b.id === parentCollection.bookingId);

    const newContainerData = {
        serial: containerNumber,
        tare: Number(tare),
        type: parentBooking.type,
        status: '📦🚚COLLECTED FROM PIER',
        location: parentCollection.chassisName,
        driver: parentCollection.driverName,
        bookingNumber: parentCollection.bookingNumber,
        lastUpdated: new Date().toISOString(),
        collectedAtTimestamp: new Date().toISOString()
    };

    const containerRef = await firebase.addItem('containers', newContainerData);

    const updatedCollectedContainers = [...(parentCollection.collectedContainers || []), { containerId: containerRef.id, containerSerial: containerNumber }];
    
    await firebase.updateItem('collections', collectionId, {
        collectedContainers: updatedCollectedContainers,
    });

    await firebase.updateBookingOnCollection(parentCollection.bookingId, containerRef.id);

    ui.closeModal('collect-modal');
};

const handleDeliverToYard = async (containerId) => {
    if (!containerId) return;

    const updateData = {
        location: 'Yard',
        status: '✅ At Yard',
        deliveredAtYardTimestamp: new Date().toISOString()
    };
    await firebase.updateItem('containers', containerId, updateData);

    const parentCollection = state.collections.find(coll => 
        (coll.collectedContainers || []).some(cc => cc.containerId === containerId)
    );

    if (parentCollection) {
        let allDelivered = true;
        for (const collected of parentCollection.collectedContainers) {
            if (collected.containerId === containerId) continue; 
            const otherContainer = state.containers.find(c => c.id === collected.containerId);
            if (!otherContainer || otherContainer.location !== 'Yard') {
                allDelivered = false;
                break;
            }
        }

        if (allDelivered && parentCollection.collectedContainers.length === parentCollection.qty) {
            await firebase.updateItem('collections', parentCollection.id, {
                status: 'Collection Complete'
            });
        }
    }
};


const handleEditFormSubmit = async (e) => {
    // This function needs to be fully implemented based on the edit modal's dynamic content
};

const addCollectionItem = async (collectionName, value) => {
    if (!value) return;
    await firebase.addItem(collectionName, { name: value });
};


export function setupEventListeners() {
    document.body.addEventListener('click', (e) => {
        const target = e.target;

        // --- Navigation ---
        const navLink = target.closest('.nav-link, .mobile-nav-link');
        if (navLink) {
            e.preventDefault();
            ui.showPage(navLink.dataset.page);
            return;
        }

        const mobileMenuButton = target.closest('#mobile-menu-button');
        if (mobileMenuButton) {
            document.getElementById('mobile-menu').classList.toggle('hidden');
            document.getElementById('menu-open-icon').classList.toggle('hidden');
            document.getElementById('menu-closed-icon').classList.toggle('hidden');
            return;
        }
        
        // --- Modal close on overlay click ---
        if (target.classList.contains('modal-container')) {
            ui.closeModal(target.id);
            return;
        }

        // --- Button clicks ---
        const button = target.closest('button');
        if (!button) return;

        const buttonId = button.id;
        const buttonClassList = button.classList;

        // Modal open/close buttons
        if (buttonId === 'addContainerBtn') ui.openModal();
        if (buttonId === 'addBookingBtn') ui.openBookingModal();
        if (buttonId === 'createCollectionBtn') ui.openCollectionModal();
        if (buttonClassList.contains('collect-btn')) ui.openCollectModal(button.dataset.collectionId);
        if (buttonClassList.contains('collect-booking-btn')) ui.openCollectionModal(button.dataset.bookingId);
        
        if (buttonId === 'cancel-btn') ui.closeModal('modal');
        if (buttonId === 'booking-cancel-btn') ui.closeModal('booking-modal');
        if (buttonId === 'collection-cancel-btn') ui.closeModal('collection-modal');
        if (buttonId === 'collect-cancel-btn') ui.closeModal('collect-modal');
        if (buttonId === 'edit-cancel-btn') ui.closeModal('edit-modal');
        
        // Grid/List action buttons
        if (buttonClassList.contains('edit-btn')) ui.openModal(button.dataset.id);
        if (buttonClassList.contains('edit-item-btn')) ui.openEditModal(button.dataset.collection, button.dataset.id);
        if (buttonClassList.contains('delete-item-btn')) firebase.deleteItem(button.dataset.collection, button.dataset.id);
        if (buttonClassList.contains('deliver-btn')) handleDeliverToYard(button.dataset.containerId);
    });

    // --- Form Submissions ---
    document.body.addEventListener('submit', (e) => {
        e.preventDefault();
        const formId = e.target.id;
        switch(formId) {
            case 'container-form': handleFormSubmit(e); break;
            case 'booking-form': handleBookingFormSubmit(e); break;
            case 'collection-form': handleCollectionFormSubmit(e); break;
            case 'collect-form': handleCollectFormSubmit(e); break;
            case 'edit-item-form': handleEditFormSubmit(e); break;
            case 'add-driver-form': handleDriverFormSubmit(e); break;
            case 'add-chassis-form': handleChassisFormSubmit(e); break;
            case 'add-status-form': handleStatusFormSubmit(e); break;
            case 'add-location-form': 
                const locInput = e.target.querySelector('input');
                addCollectionItem('locations', locInput.value.trim());
                e.target.reset();
                break;
            case 'add-container-type-form':
                const typeInput = e.target.querySelector('input');
                addCollectionItem('containerTypes', typeInput.value.trim());
                e.target.reset();
                break;
        }
    });
    
    // --- Form validation triggers ---
    document.body.addEventListener('change', (e) => {
        if (['collection-form-qty', 'collection-form-booking', 'collection-form-chassis'].includes(e.target.id)) {
            ui.validateCollectionForm();
        }
    });
}


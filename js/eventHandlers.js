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
    
    const lastDeleted = state.getLastDeletedItem();
    if (lastDeleted && lastDeleted.collection === 'containers' && lastDeleted.data.serial === containerData.serial) {
        await firebase.addItem('containers', lastDeleted.data, lastDeleted.id);
        state.clearLastDeletedItem();
    } else if (idInput) {
        await firebase.updateItem('containers', idInput, containerData);
    } else {
        const existing = state.containers.find(c => c.serial === serial);
        if (existing) { console.error('A container with this serial already exists.'); return; }
        await firebase.addItem('containers', containerData);
    }
    ui.closeModal('modal');
};

const handleUpdateContainer = async (containerId, updateData) => {
    if (!containerId || !updateData) return;

    const container = state.containers.find(c => c.id === containerId);
    if (!container) return;
    
    const history = container.history || [];
    history.push({
        status: updateData.status || container.status,
        location: updateData.location || container.location,
        timestamp: new Date().toISOString()
    });

    await firebase.updateItem('containers', containerId, { ...updateData, history });
    ui.closeModal('update-modal');
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
        collectedAtTimestamp: new Date().toISOString(),
        history: [{ status: '📦🚚COLLECTED FROM PIER', location: parentCollection.chassisName, timestamp: new Date().toISOString() }]
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
        status: '📦🚚Delivered to YARD',
        deliveredAtYardTimestamp: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };

    // Use the generic update function to handle history and UI updates
    await handleUpdateContainer(containerId, updateData);

    // After updating, check if the parent collection is now complete.
    const parentCollection = state.collections.find(coll => 
        (coll.collectedContainers || []).some(cc => cc.containerId === containerId)
    );

    if (parentCollection) {
        // We need to re-fetch the latest state of containers to make an accurate check
        const allContainers = state.containers;
        const deliveredContainer = allContainers.find(c => c.id === containerId);

        let allDelivered = true;
        for (const collected of parentCollection.collectedContainers) {
            // Find each container in the collection from the main state
            const container = allContainers.find(c => c.id === collected.containerId);
            
            // If any container isn't at the yard, the collection is not complete.
            if (!container || container.location !== 'Yard') {
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


const handleLoaded = async (containerId) => {
    if (!containerId) return;

    const updateData = {
        status: 'Loaded',
        loadedTimestamp: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };
    await handleUpdateContainer(containerId, updateData);
};

const addCollectionItem = async (collectionName, value) => {
    if (!value) return;
    await firebase.addItem(collectionName, { name: value });
};

const handleDeleteClick = (collectionName, id) => {
    let itemData;
    switch(collectionName) {
        case 'containers': 
            itemData = state.containers.find(i => i.id === id); 
            if (itemData) {
                state.setLastDeletedItem({ collection: collectionName, id, data: itemData });
                firebase.deleteContainerAndUpdateRelations(id); 
                ui.showUndoToast(`Deleted container ${itemData.serial}.`);
            }
            break;
        default: 
            itemData = state[collectionName].find(i => i.id === id);
            if (itemData) {
                state.setLastDeletedItem({ collection: collectionName, id, data: itemData });
                firebase.deleteItem(collectionName, id);
                ui.showUndoToast(`Deleted ${itemData.name || 'item'}.`);
            }
    }
};

const handleUndo = () => {
    const lastDeleted = state.getLastDeletedItem();
    if (lastDeleted) {
        firebase.addItem(lastDeleted.collection, lastDeleted.data, lastDeleted.id);
        ui.hideUndoToast();
    }
};

export function setupEventListeners() {
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const button = target.closest('button');
        const navLink = target.closest('.nav-link, .mobile-nav-link');

        if (navLink) {
            e.preventDefault();
            ui.showPage(navLink.dataset.page);
            return;
        }
        
        if (target.classList.contains('modal-container')) {
            ui.closeModal(target.id);
            return;
        }

        if (!button) return;
        
        const containerId = document.getElementById('update-container-id-input').value;

        switch (button.id) {
            case 'mobile-menu-button':
                document.getElementById('mobile-menu').classList.toggle('hidden');
                document.getElementById('menu-open-icon').classList.toggle('hidden');
                document.getElementById('menu-closed-icon').classList.toggle('hidden');
                break;
            case 'addContainerBtn': ui.openModal(); break;
            case 'addBookingBtn': ui.openBookingModal(); break;
            case 'createCollectionBtn': ui.openCollectionModal(); break;
            case 'cancel-btn': ui.closeModal('modal'); break;
            case 'booking-cancel-btn': ui.closeModal('booking-modal'); break;
            case 'collection-cancel-btn': ui.closeModal('collection-modal'); break;
            case 'collect-cancel-btn': ui.closeModal('collect-modal'); break;
            case 'edit-cancel-btn': ui.closeModal('edit-modal'); break;
            case 'update-cancel-btn': ui.closeModal('update-modal'); break;
            case 'undo-btn': handleUndo(); break;
            case 'action-loaded': handleLoaded(containerId); break;
            case 'action-move-location': handleUpdateContainer(containerId, { location: document.getElementById('update-container-location').value, status: 'Moved to Operator', lastUpdated: new Date().toISOString() }); break;
            case 'action-park-yes': ui.renderUpdateModalContent(state.containers.find(c=>c.id === containerId), 'step-hold'); break;
            case 'action-park-no': ui.renderUpdateModalContent(state.containers.find(c=>c.id === containerId), 'step-weighing'); break;
            case 'action-hold-temp': handleUpdateContainer(containerId, { status: 'Temp Hold', lastUpdated: new Date().toISOString() }); break;
            case 'action-hold-issue': handleUpdateContainer(containerId, { status: 'Busy/Issue Hold', lastUpdated: new Date().toISOString() }); break;
            case 'action-tilter': ui.renderUpdateModalContent(state.containers.find(c=>c.id === containerId), 'step-tilter'); break;
            case 'action-continue': ui.renderUpdateModalContent(state.containers.find(c=>c.id === containerId), 'step-weighing'); break;
            case 'action-move-tilter': handleUpdateContainer(containerId, { location: document.getElementById('update-tilter-location').value, status: 'Moved to Tilter', lastUpdated: new Date().toISOString() }); break;
        }

        if (button.classList.contains('collect-btn')) ui.openCollectModal(button.dataset.collectionId);
        if (button.classList.contains('collect-booking-btn')) ui.openCollectionModal(button.dataset.bookingId);
        if (button.classList.contains('update-btn')) ui.openUpdateModal(button.dataset.id);
        if (button.classList.contains('edit-item-btn')) ui.openEditModal(button.dataset.collection, button.dataset.id);
        if (button.classList.contains('delete-item-btn')) handleDeleteClick(button.dataset.collection, button.dataset.id);
        if (button.classList.contains('deliver-btn')) handleDeliverToYard(button.dataset.containerId);
        if (button.classList.contains('loaded-btn')) handleLoaded(button.dataset.containerId);
    });

    document.body.addEventListener('submit', (e) => {
        e.preventDefault();
        const formId = e.target.id;
        switch(formId) {
            case 'container-form': handleFormSubmit(e); break;
            case 'booking-form': handleBookingFormSubmit(e); break;
            case 'collection-form': handleCollectionFormSubmit(e); break;
            case 'collect-form': handleCollectFormSubmit(e); break;
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
    
    document.body.addEventListener('change', (e) => {
        if (['collection-form-qty', 'collection-form-booking', 'collection-form-chassis'].includes(e.target.id)) {
            ui.validateCollectionForm();
        }
    });
}


// File: js/eventHandlers.js
import * as ui from './ui.js';
import * as firebase from './firebaseService.js';
import * as state from './state.js';
import * as modals from './modals.js';

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

        // --- DELEGATE ACTIONS BASED ON BUTTON ID ---
        switch (button.id) {
            case 'mobile-menu-button': ui.toggleMobileMenu(); break;
            case 'addContainerBtn': modals.openContainerModal(); break;
            case 'addBookingBtn': modals.openBookingModal(); break;
            case 'createCollectionBtn': modals.openCollectionModal(); break;
            case 'cancel-btn': ui.closeModal('modal'); break;
            case 'booking-cancel-btn': ui.closeModal('booking-modal'); break;
            case 'collection-cancel-btn': ui.closeModal('collection-modal'); break;
            case 'collect-cancel-btn': ui.closeModal('collect-modal'); break;
            case 'edit-cancel-btn': ui.closeModal('edit-modal'); break;
            case 'update-cancel-btn': ui.closeModal('update-modal'); break;
            case 'undo-btn': handleUndo(); break;
            case 'action-tilter-yes': modals.handleYardOperation(containerId, 'tilter-yes'); break;
            case 'action-tilter-no': modals.handleYardOperation(containerId, 'tilter-no'); break;
            case 'action-take-out-tilter': modals.handleYardOperation(containerId, 'take-out-tilter'); break;
            case 'action-park-yes': modals.renderUpdateModalContent(state.containers.find(c => c.id === containerId), 'step-hold'); break;
            case 'action-park-no': modals.handleYardOperation(containerId, 'park-no'); break;
            case 'action-hold-temp': modals.handleYardOperation(containerId, 'hold-temp'); break;
            case 'action-hold-issue': modals.handleYardOperation(containerId, 'hold-issue'); break;
            case 'action-tilter-from-hold': modals.handleYardOperation(containerId, 'tilter-from-hold'); break;
            case 'action-continue-from-hold': modals.handleYardOperation(containerId, 'continue-from-hold'); break;
            case 'action-weighing-complete': modals.handleYardOperation(containerId, 'weighing-complete'); break;
        }

        // --- DELEGATE ACTIONS BASED ON BUTTON CLASS ---
        if (button.classList.contains('collect-btn')) modals.openCollectModal(button.dataset.collectionId);
        if (button.classList.contains('collect-booking-btn')) modals.openCollectionModal(button.dataset.bookingId);
        if (button.classList.contains('update-btn')) modals.openUpdateModal(button.dataset.id);
        if (button.classList.contains('edit-item-btn')) modals.openEditModal(button.dataset.collection, button.dataset.id);
        if (button.classList.contains('delete-item-btn')) handleDeleteClick(button.dataset.collection, button.dataset.id);
        if (button.classList.contains('deliver-btn')) modals.handleDeliverToYard(button.dataset.containerId);
        if (button.classList.contains('loaded-btn')) modals.handleLoaded(button.dataset.containerId);
    });

    document.body.addEventListener('submit', (e) => {
        e.preventDefault();
        switch(e.target.id) {
            case 'container-form': modals.handleContainerFormSubmit(e); break;
            case 'booking-form': modals.handleBookingFormSubmit(e); break;
            case 'collection-form': modals.handleCollectionFormSubmit(e); break;
            case 'collect-form': modals.handleCollectFormSubmit(e); break;
            case 'add-driver-form': modals.handleDriverFormSubmit(e); break;
            case 'add-chassis-form': modals.handleChassisFormSubmit(e); break;
            case 'add-status-form': modals.handleStatusFormSubmit(e); break;
            case 'add-location-form': 
                addCollectionItem('locations', e.target.querySelector('input').value.trim());
                e.target.reset();
                break;
            case 'add-container-type-form':
                addCollectionItem('containerTypes', e.target.querySelector('input').value.trim());
                e.target.reset();
                break;
        }
    });
    
    document.body.addEventListener('change', (e) => {
        if (['collection-form-qty', 'collection-form-booking', 'collection-form-chassis'].includes(e.target.id)) {
            modals.validateCollectionForm();
        }
    });
}


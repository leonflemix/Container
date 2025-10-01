// File: js/yardOperations.js
import * as state from './state.js';
import * as ui from './ui.js';
import * as firebase from './firebaseService.js';

export const openUpdateModal = (containerId) => {
    const container = state.containers.find(c => c.id === containerId);
    if (!container) {
        console.error("Container not found for update.");
        return;
    }

    document.getElementById('update-container-id-input').value = containerId;
    document.getElementById('update-container-serial').textContent = container.serial;

    renderCurrentStep(container);
    ui.openModal('update-modal');
};

export function renderCurrentStep(container) {
    document.querySelectorAll('.update-step').forEach(step => step.classList.add('hidden'));

    let stepIdToShow = null;

    switch (container.status) {
        case '📦🚚Delivered to YARD':
            stepIdToShow = 'step-tilter-check';
            break;
        case 'In Tilter':
            stepIdToShow = 'step-in-tilter';
            break;
        case 'Out of Tilter':
            stepIdToShow = 'step-park-check';
            break;
        case 'Temp Hold':
        case 'Busy/Issue Hold':
            stepIdToShow = 'step-after-hold';
            break;
        case 'Awaiting Weighing':
             stepIdToShow = 'step-weighing';
             break;
        default:
            console.warn(`No defined update step for status: ${container.status}`);
            ui.closeModal('update-modal');
            return;
    }
    
    const stepToShow = document.getElementById(stepIdToShow);
    if (stepToShow) {
        stepToShow.classList.remove('hidden');
    }
}

export const handleUpdateContainer = async (containerId, updateData, closeModal = true) => {
    if (!containerId || !updateData) return;

    const container = state.containers.find(c => c.id === containerId);
    if (!container) return;

    const history = container.history || [];
    history.push({
        status: updateData.status || container.status,
        location: updateData.location || container.location,
        timestamp: new Date().toISOString()
    });

    await firebase.updateItem('containers', containerId, { ...updateData, history, lastUpdated: new Date().toISOString() });
    
    if(closeModal) {
        ui.closeModal('update-modal');
    }
};


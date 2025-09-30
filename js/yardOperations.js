// File: js/yardOperations.js
import * as state from './state.js';
import * as ui from './ui.js';
import * as firebase from './firebaseService.js';

/**
 * Determines which step of the update process to show based on the container's current state.
 * @param {string} containerId The ID of the container to update.
 */
export const openUpdateModal = (containerId) => {
    const container = state.containers.find(c => c.id === containerId);
    if (!container) {
        console.error("Container not found for update.");
        return;
    }

    document.getElementById('update-container-id-input').value = containerId;
    document.getElementById('update-container-serial').textContent = container.serial;

    // Determine which step to show
    if (container.location === 'Yard' && container.status === '📦🚚Delivered to YARD') {
        renderUpdateModalContent(container, 'step-move-location');
    } else if (container.status === 'Loaded') {
        renderUpdateModalContent(container, 'step-park');
    } else if (container.status === 'Temp Hold' || container.status === 'Busy/Issue Hold') {
        renderUpdateModalContent(container, 'step-after-hold');
    } else if (container.status === 'Moved to Tilter') {
         renderUpdateModalContent(container, 'step-park'); // Can park again after tilter
    }
     else if (container.status === 'Moved to Operator') {
        // If it's already at an operator, the operator dashboard handles the 'Loaded' step.
        // The next logical step from the main dashboard is to park it.
        renderUpdateModalContent(container, 'step-park');
    } else {
        // Default or for states that don't have a next step from this modal
        ui.closeModal('update-modal');
        return; // Don't open if there's no action
    }

    ui.openModal('update-modal');
};

/**
 * Shows the correct section of the update modal and hides the others.
 * @param {object} container The container object.
 * @param {string} stepId The ID of the step div to show.
 */
export function renderUpdateModalContent(container, stepId) {
    document.querySelectorAll('.update-step').forEach(step => step.classList.add('hidden'));
    
    const stepToShow = document.getElementById(stepId);
    if (stepToShow) {
        // Populate dropdowns if they exist in the current step
        if (stepId === 'step-move-location') {
            const locationSelect = document.getElementById('update-container-location');
            // Filter out 'Yard' and 'Pier' as they are not operator locations
            locationSelect.innerHTML = state.locations
                .filter(l => l.name !== 'Yard' && l.name !== 'Pier' && !l.name.startsWith('CH-'))
                .map(l => `<option value="${l.name}">${l.name}</option>`)
                .join('');
        }
        if (stepId === 'step-tilter') {
             const tilterSelect = document.getElementById('update-tilter-location');
             // Example: filter locations that are tilters. You might need a flag in your location data for this.
             tilterSelect.innerHTML = state.locations
                .filter(l => l.name.toLowerCase().includes('tilter'))
                .map(l => `<option value="${l.name}">${l.name}</option>`)
                .join('');
        }

        stepToShow.classList.remove('hidden');
    }
}


// --- Action Handlers ---

export const handleUpdateContainer = async (containerId, updateData) => {
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
    ui.closeModal('update-modal');
};

// File: js/render.js
import * as state from './state.js';
import * as ui from './ui.js';

export const renderContainers = () => {
    const tableBody = document.getElementById('container-table-body');
    const noContainersMessage = document.getElementById('no-containers-message');
    
    const activeContainers = state.containers.filter(c => c.bookingNumber && c.status !== 'Returned to Pier');

    tableBody.innerHTML = '';
    if (activeContainers.length === 0) {
        noContainersMessage.classList.remove('hidden');
        noContainersMessage.querySelector('p').textContent = 'No active containers found.';
    } else {
        noContainersMessage.classList.add('hidden');
        activeContainers.forEach(c => {
            const row = document.createElement('tr');
            row.className = 'bg-white border-b hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 font-semibold text-gray-900">${c.serial}</td>
                <td class="px-6 py-4">${c.bookingNumber || 'N/A'}</td>
                <td class="px-6 py-4">${c.type || 'N/A'}</td>
                <td class="px-6 py-4">${ui.getLocationIcon(c.location)}</td>
                <td class="px-6 py-4">${ui.getStatusBadge(c.status)}</td>
                <td class="px-6 py-4 text-gray-500">${ui.formatTimeAgo(c.lastUpdated)}</td>
                <td class="px-6 py-4 text-gray-500">${c.deliveredAtYardTimestamp ? ui.formatTimestamp(c.deliveredAtYardTimestamp) : 'N/A'}</td>
                <td class="px-6 py-4 text-center">
                    <button data-id="${c.id}" class="update-btn font-medium text-blue-600 hover:underline mr-2">Update</button>
                    <button data-collection="containers" data-id="${c.id}" class="delete-item-btn font-medium text-red-600 hover:underline">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
};

export const renderKPIs = () => {
    const kpiContainer = document.getElementById('kpi-cards');
    if(!kpiContainer) return;
    kpiContainer.innerHTML = '';
    
    const totalCard = document.createElement('div');
    totalCard.className = "bg-white p-5 rounded-xl shadow-sm border border-gray-200";
    totalCard.innerHTML = `<h3 class="text-sm font-medium text-gray-500">Total Containers</h3><p class="text-3xl font-bold mt-2">${state.containers.length}</p>`;
    kpiContainer.appendChild(totalCard);

    state.locations.forEach(loc => {
        const count = state.containers.filter(c => c.location === loc.name).length;
        const card = document.createElement('div');
        card.className = "bg-white p-5 rounded-xl shadow-sm border border-gray-200";
        card.innerHTML = `<h3 class="text-sm font-medium text-gray-500">At ${loc.name}</h3><p class="text-3xl font-bold mt-2 text-sky-600">${count}</p>`;
        kpiContainer.appendChild(card);
    });
};

export const renderLogisticsKPIs = () => {
    const kpiContainer = document.getElementById('logistics-kpi-cards');
    if (!kpiContainer) return;

    const openBookings = state.bookings.filter(b => (b.assignedContainers?.length || 0) < b.qty);
    const totalQtyRequired = openBookings.reduce((sum, b) => sum + (b.qty || 0), 0);
    const totalInProcess = state.collections.reduce((sum, c) => sum + (c.qty || 0), 0);
    const awaitingCollection = totalInProcess - state.containers.filter(c => c.bookingNumber).length;

    kpiContainer.innerHTML = `
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200"><h3 class="text-sm font-medium text-gray-500">Open Bookings</h3><p class="text-3xl font-bold mt-2">${openBookings.length}</p></div>
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200"><h3 class="text-sm font-medium text-gray-500">Total Containers Required</h3><p class="text-3xl font-bold mt-2 text-gray-800">${totalQtyRequired}</p></div>
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200"><h3 class="text-sm font-medium text-gray-500">Containers In Process</h3><p class="text-3xl font-bold mt-2 text-amber-600">${totalInProcess}</p></div>
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200"><h3 class="text-sm font-medium text-gray-500">Awaiting Collection</h3><p class="text-3xl font-bold mt-2 text-red-600">${awaitingCollection > 0 ? awaitingCollection : 0}</p></div>
    `;
};

export const renderDriversKPIs = () => {
    const kpiContainer = document.getElementById('drivers-kpi-cards');
    if (!kpiContainer) return;

    const totalDrivers = state.drivers.length;
    const activeCollections = state.collections.filter(c => c.status !== 'Collection Complete');
    const activeDrivers = new Set(activeCollections.map(c => c.driverId)).size;
    
    kpiContainer.innerHTML = `
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200"><h3 class="text-sm font-medium text-gray-500">Total Drivers</h3><p class="text-3xl font-bold mt-2">${totalDrivers}</p></div>
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200"><h3 class="text-sm font-medium text-gray-500">Active Drivers</h3><p class="text-3xl font-bold mt-2 text-green-600">${activeDrivers}</p></div>
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200"><h3 class="text-sm font-medium text-gray-500">Open Collections</h3><p class="text-3xl font-bold mt-2 text-indigo-600">${activeCollections.length}</p></div>
    `;
};

export const renderBookingsGrid = () => {
    const bookingsGridBody = document.getElementById('bookings-grid-body');
    const noBookingsMessage = document.getElementById('no-bookings-message');
    if (!bookingsGridBody) return;
    bookingsGridBody.innerHTML = '';
    
    if (state.bookings.length === 0) {
        noBookingsMessage.classList.remove('hidden');
        noBookingsMessage.querySelector('p').textContent = 'No bookings found.';
    } else {
        noBookingsMessage.classList.add('hidden');
        state.bookings.forEach(b => {
            const collectionsForBooking = state.collections.filter(c => c.bookingId === b.id);
            const inProcessCount = collectionsForBooking.reduce((sum, c) => sum + (c.qty || 0), 0);
            
            const row = document.createElement('tr');
            row.className = 'bg-white border-b hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 font-semibold text-gray-900">${b.number}</td>
                <td class="px-6 py-4">${b.type}</td>
                <td class="px-6 py-4">${b.containerSize || 'N/A'}</td>
                <td class="px-6 py-4">${b.deadline || 'N/A'}</td>
                <td class="px-6 py-4 text-center font-medium text-gray-700">${b.qty}</td>
                <td class="px-6 py-4 text-center font-medium text-amber-600">${inProcessCount}</td>
                <td class="px-6 py-4 text-center">
                    <button data-booking-id="${b.id}" class="collect-booking-btn bg-green-500 text-white font-semibold py-1 px-3 rounded-md hover:bg-green-600 text-xs mr-2">Collect</button>
                    <button data-collection="bookings" data-id="${b.id}" class="edit-item-btn font-medium text-blue-600 hover:underline">Edit</button>
                    <button data-collection="bookings" data-id="${b.id}" class="delete-item-btn font-medium text-red-600 hover:underline ml-2">Delete</button>
                </td>
            `;
            bookingsGridBody.appendChild(row);
        });
    }
};

export const renderOpenCollectionsGrid = () => {
    const openCollectionsGridBody = document.getElementById('open-collections-grid-body');
    const noOpenCollectionsMessage = document.getElementById('no-open-collections-message');
    if (!openCollectionsGridBody) return;
    openCollectionsGridBody.innerHTML = '';
    const openCollections = state.collections.filter(c => c.status !== 'Collection Complete');
    if (openCollections.length === 0) {
        noOpenCollectionsMessage.classList.remove('hidden');
    } else {
        noOpenCollectionsMessage.classList.add('hidden');
        openCollections.forEach(c => {
            const row = document.createElement('tr');
            row.className = 'bg-white border-b hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 font-semibold text-gray-900">${c.driverName}</td>
                <td class="px-6 py-4">${c.bookingNumber}</td>
                <td class="px-6 py-4">${c.chassisName}</td>
                <td class="px-6 py-4 text-center font-medium">${c.qty}</td>
                <td class="px-6 py-4 text-center font-medium">${c.containerSize}</td>
                <td class="px-6 py-4 text-gray-500">${ui.formatTimestamp(c.createdAt)}</td>
                <td class="px-6 py-4 text-center">
                    <button data-collection="collections" data-id="${c.id}" class="delete-item-btn font-medium text-red-600 hover:underline">Delete</button>
                </td>
            `;
            openCollectionsGridBody.appendChild(row);
        });
    }
};

export const renderDriverDashboard = () => {
    const containerEl = document.getElementById('driver-collections-container');
    if (!containerEl) return;
    containerEl.innerHTML = '';

    const tasksByDriver = {};
    // Initialize all drivers
    state.drivers.forEach(driver => {
        tasksByDriver[driver.name] = [];
    });

    // Add collection tasks
    state.collections.forEach(collection => {
        if (!collection.driverName) return;
        const collectedCount = collection.collectedContainers?.length || 0;
        const remainingToCollect = collection.qty - collectedCount;
        if (remainingToCollect > 0) {
            tasksByDriver[collection.driverName].push({
                type: 'collect',
                collection: collection,
                qty: remainingToCollect,
            });
        }
    });

    // Add delivery tasks
    state.containers.forEach(container => {
        if (container.status === '📦🚚COLLECTED FROM PIER' && container.driver) {
             if (!tasksByDriver[container.driver]) tasksByDriver[container.driver] = [];
             tasksByDriver[container.driver].push({
                type: 'deliver',
                container: container
            });
        }
    });

    if (Object.keys(tasksByDriver).every(key => tasksByDriver[key].length === 0)) {
        containerEl.innerHTML = '<div class="text-center py-12 text-gray-500"><p>No active tasks for drivers.</p></div>';
        return;
    }

    for (const driverName of Object.keys(tasksByDriver).sort()) {
        const tasks = tasksByDriver[driverName];
        if (tasks.length === 0) continue;

        const driverSection = document.createElement('div');
        driverSection.className = 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8';
        
        driverSection.innerHTML = `
            <div class="p-4 border-b border-gray-200"><h2 class="text-xl font-semibold">${driverName}</h2></div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                    <thead class="bg-gray-50 text-xs text-gray-700 uppercase">
                        <tr>
                            <th scope="col" class="px-6 py-3">Task / Item</th>
                            <th scope="col" class="px-6 py-3">Booking #</th>
                            <th scope="col" class="px-6 py-3">Status</th>
                            <th scope="col" class="px-6 py-3">Timestamp</th>
                            <th scope="col" class="px-6 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;
        
        const tbody = driverSection.querySelector('tbody');
        tasks.forEach(task => {
            const row = document.createElement('tr');
            row.className = 'bg-white border-b hover:bg-gray-50';
            
            if (task.type === 'collect') {
                row.innerHTML = `
                    <td class="px-6 py-4 font-semibold">Collect ${task.qty} container(s)</td>
                    <td class="px-6 py-4">${task.collection.bookingNumber}</td>
                    <td class="px-6 py-4">${ui.getStatusBadge('Awaiting Collection')}</td>
                    <td class="px-6 py-4 text-xs">${ui.formatTimestamp(task.collection.createdAt)}</td>
                    <td class="px-6 py-4 text-center">
                        <button data-collection-id="${task.collection.id}" class="collect-btn bg-green-500 text-white font-semibold py-1 px-3 rounded-md hover:bg-green-600 text-xs">Collect</button>
                    </td>
                `;
            } else if (task.type === 'deliver') {
                row.innerHTML = `
                    <td class="px-6 py-4 font-semibold">${task.container.serial}</td>
                    <td class="px-6 py-4">${task.container.bookingNumber}</td>
                    <td class="px-6 py-4">${ui.getStatusBadge(task.container.status)}</td>
                    <td class="px-6 py-4 text-xs">${ui.formatTimestamp(task.container.collectedAtTimestamp)}</td>
                    <td class="px-6 py-4 text-center">
                        <button data-container-id="${task.container.id}" class="deliver-btn bg-blue-500 text-white font-semibold py-1 px-3 rounded-md hover:bg-blue-600 text-xs">Deliver to Yard</button>
                    </td>
                `;
            }
            tbody.appendChild(row);
        });

        containerEl.appendChild(driverSection);
    }
};


export const renderOperatorDashboard = () => {
    const containerEl = document.getElementById('operator-tasks-container');
    if (!containerEl) return;
    containerEl.innerHTML = '';

    const containersAtOperators = state.containers.filter(c => 
        c.location &&
        c.location !== 'Yard' && 
        c.location !== 'Pier' && 
        !c.location.startsWith('CH-') &&
        c.status === 'Moved to Operator'
    );

    if (containersAtOperators.length === 0) {
        containerEl.innerHTML = '<div class="text-center py-12 text-gray-500"><p>No containers awaiting loading at operator locations.</p></div>';
        return;
    }
    
    const tasksByLocation = containersAtOperators.reduce((acc, container) => {
        const locationName = container.location;
        if (!acc[locationName]) {
            acc[locationName] = [];
        }
        acc[locationName].push(container);
        return acc;
    }, {});

    for (const locationName of Object.keys(tasksByLocation)) {
        const locationSection = document.createElement('div');
        locationSection.className = 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8';

        locationSection.innerHTML = `
            <div class="p-4 border-b border-gray-200"><h2 class="text-xl font-semibold">Location: ${locationName}</h2></div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                    <thead class="bg-gray-50 text-xs text-gray-700 uppercase">
                        <tr>
                            <th scope="col" class="px-6 py-3">Container #</th>
                            <th scope="col" class="px-6 py-3">Type</th>
                            <th scope="col" class="px-6 py-3">Arrival Timestamp</th>
                            <th scope="col" class="px-6 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;

        const tbody = locationSection.querySelector('tbody');
        tasksByLocation[locationName].forEach(container => {
            const row = document.createElement('tr');
            row.className = 'bg-white border-b';
            row.innerHTML = `
                <td class="px-6 py-4 font-semibold">${container.serial}</td>
                <td class="px-6 py-4">${container.type}</td>
                <td class="px-6 py-4">${ui.formatTimestamp(container.lastUpdated)}</td>
                <td class="px-6 py-4 text-center">
                    <button data-container-id="${container.id}" class="loaded-btn bg-purple-600 text-white font-semibold py-1 px-3 rounded-md hover:bg-purple-700 text-xs">Loaded</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        containerEl.appendChild(locationSection);
    }
};


export const renderDriversList = () => {
    const listElement = document.getElementById('drivers-list');
    if (!listElement) return;
    listElement.innerHTML = '';
    state.drivers.forEach(driver => {
        const li = document.createElement('li');
        li.className = 'bg-gray-50 p-3 rounded-md border border-gray-200';
        li.innerHTML = `
            <div class="flex justify-between items-start">
                <div><p class="font-semibold text-gray-900">${driver.name}</p><p class="text-xs text-gray-500">ID: ${driver.idNumber} | Plate: ${driver.plate} | Tare: ${driver.weight}kg</p></div>
                <div class="flex items-center flex-shrink-0 ml-2"><button data-collection="drivers" data-id="${driver.id}" class="edit-item-btn text-gray-400 hover:text-blue-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button><button data-collection="drivers" data-id="${driver.id}" class="delete-item-btn text-gray-400 hover:text-red-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button></div>
            </div>`;
        listElement.appendChild(li);
    });
};

export const renderChassisList = () => {
    const listElement = document.getElementById('chassis-list');
    if (!listElement) return;
    listElement.innerHTML = '';
    state.chassis.forEach(item => {
        const li = document.createElement('li');
        li.className = 'bg-gray-50 p-3 rounded-md border border-gray-200';
        const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`;
        li.innerHTML = `
            <div class="flex justify-between items-start">
                <div><p class="font-semibold text-gray-900">${item.name}</p><p class="text-xs text-gray-500">Weight: ${item.weight}kg | 40ft: ${item.is40ft ? checkIcon : 'No'} | 2x20: ${item.is2x20 ? checkIcon : 'No'}</p></div>
                <div class="flex items-center flex-shrink-0 ml-2"><button data-collection="chassis" data-id="${item.id}" class="edit-item-btn text-gray-400 hover:text-blue-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button><button data-collection="chassis" data-id="${item.id}" class="delete-item-btn text-gray-400 hover:text-red-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button></div>
            </div>`;
        listElement.appendChild(li);
    });
};

export const renderStatusesList = () => {
    const listElement = document.getElementById('statuses-list');
    if (!listElement) return;
    listElement.innerHTML = '';
    state.statuses.forEach(status => {
        const li = document.createElement('li');
        li.className = 'bg-gray-50 p-3 rounded-md border border-gray-200 flex justify-between items-center';
        li.innerHTML = `
            <div><span class="text-xl mr-3">${status.emoji}</span><span class="font-medium text-gray-800">${status.description}</span></div>
            <div class="flex items-center flex-shrink-0 ml-2"><button data-collection="statuses" data-id="${status.id}" class="edit-item-btn text-gray-400 hover:text-blue-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button><button data-collection="statuses" data-id="${status.id}" class="delete-item-btn text-gray-400 hover:text-red-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button></div>
            </div>`;
        listElement.appendChild(li);
    });
};

export const renderCollectionList = (elementId, items, collectionName) => {
    const listElement = document.getElementById(elementId);
    if (!listElement) return;
    listElement.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center bg-gray-50 p-2 pl-3 rounded-md';
        li.innerHTML = `<span>${item.name}</span>
            <div class="flex items-center"><button data-collection="${collectionName}" data-id="${item.id}" class="edit-item-btn text-gray-400 hover:text-blue-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button><button data-collection="${collectionName}" data-id="${item.id}" class="delete-item-btn text-gray-400 hover:text-red-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button></div>
            </div>`;
        listElement.appendChild(li);
    });
};


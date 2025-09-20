import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- GLOBAL STATE ---
let containers = [], drivers = [], locations = [], statuses = [], chassis = [], containerTypes = [];
let db, auth, userId;

// --- DOM ELEMENTS ---
const addContainerBtn = document.getElementById('addContainerBtn');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const containerForm = document.getElementById('container-form');
const tableBody = document.getElementById('container-table-body');
const noContainersMessage = document.getElementById('no-containers-message');
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const menuOpenIcon = document.getElementById('menu-open-icon');
const menuClosedIcon = document.getElementById('menu-closed-icon');
const navLinks = document.querySelectorAll('.nav-link');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
const pages = document.querySelectorAll('.page-content');

// Edit Modal Elements
const editModal = document.getElementById('edit-modal');
const editModalTitle = document.getElementById('edit-modal-title');
const editItemForm = document.getElementById('edit-item-form');
const editCancelBtn = document.getElementById('edit-cancel-btn');
const editSaveBtn = document.getElementById('edit-save-btn');

// --- UTILITY & HELPER FUNCTIONS ---
const formatTimeAgo = (dateString) => {
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

const updateDateTime = () => {
    const el = document.getElementById('current-datetime');
    const now = new Date('2025-09-20T09:31:00'); // Updated time
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Halifax' };
    el.textContent = now.toLocaleDateString('en-CA', options) + " (Dartmouth, NS)";
};

// --- PAGE NAVIGATION ---
const showPage = (pageId) => {
    pages.forEach(p => p.classList.add('hidden'));
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
    setActiveLink(navLinks);
    setActiveLink(mobileNavLinks);
    if (!mobileMenu.classList.contains('hidden')) { mobileMenu.classList.add('hidden'); }
};

// --- RENDER FUNCTIONS ---
const renderContainers = () => {
    tableBody.innerHTML = '';
    if (containers.length === 0) {
        noContainersMessage.classList.remove('hidden');
        noContainersMessage.querySelector('p').textContent = 'No containers found. Click "Add New Container" to get started.';
    } else {
        noContainersMessage.classList.add('hidden');
        containers.forEach(c => {
            const row = document.createElement('tr');
            row.className = 'bg-white border-b hover:bg-gray-50';
            row.innerHTML = `<td class="px-6 py-4 font-semibold text-gray-900">${c.serial}</td><td class="px-6 py-4">${getLocationIcon(c.location)}</td><td class="px-6 py-4">${getStatusBadge(c.status)}</td><td class="px-6 py-4">${c.driver || 'N/A'}</td><td class="px-6 py-4 text-gray-500">${formatTimeAgo(c.lastUpdated)}</td><td class="px-6 py-4 text-center"><button data-id="${c.id}" class="edit-btn font-medium text-blue-600 hover:underline">Update</button></td>`;
            tableBody.appendChild(row);
        });
    }
};

const renderKPIs = () => {
    const kpiContainer = document.getElementById('kpi-cards');
    kpiContainer.innerHTML = '';
    
    const totalCard = document.createElement('div');
    totalCard.className = "bg-white p-5 rounded-xl shadow-sm border border-gray-200";
    totalCard.innerHTML = `<h3 class="text-sm font-medium text-gray-500">Total Containers</h3><p class="text-3xl font-bold mt-2">${containers.length}</p>`;
    kpiContainer.appendChild(totalCard);

    locations.forEach(loc => {
        const count = containers.filter(c => c.location === loc.name).length;
        const card = document.createElement('div');
        card.className = "bg-white p-5 rounded-xl shadow-sm border border-gray-200";
        card.innerHTML = `<h3 class="text-sm font-medium text-gray-500">At ${loc.name}</h3><p class="text-3xl font-bold mt-2 text-sky-600">${count}</p>`;
        kpiContainer.appendChild(card);
    });
};

const renderDriversList = () => {
    const listElement = document.getElementById('drivers-list');
    listElement.innerHTML = '';
    drivers.forEach(driver => {
        const li = document.createElement('li');
        li.className = 'bg-gray-50 p-3 rounded-md border border-gray-200';
        li.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-semibold text-gray-900">${driver.name}</p>
                    <p class="text-xs text-gray-500">ID: ${driver.idNumber} | Plate: ${driver.plate} | Tare: ${driver.weight}kg</p>
                </div>
                <div class="flex items-center flex-shrink-0 ml-2">
                    <button data-collection="drivers" data-id="${driver.id}" class="edit-item-btn text-gray-400 hover:text-blue-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
                    <button data-collection="drivers" data-id="${driver.id}" class="delete-item-btn text-gray-400 hover:text-red-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                </div>
            </div>`;
        listElement.appendChild(li);
    });
};

const renderChassisList = () => {
    const listElement = document.getElementById('chassis-list');
    listElement.innerHTML = '';
    chassis.forEach(item => {
        const li = document.createElement('li');
        li.className = 'bg-gray-50 p-3 rounded-md border border-gray-200';
        const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`;
        li.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-semibold text-gray-900">${item.name}</p>
                    <p class="text-xs text-gray-500">Weight: ${item.weight}kg | 40ft: ${item.is40ft ? checkIcon : 'No'} | 2x20: ${item.is2x20 ? checkIcon : 'No'}</p>
                </div>
                <div class="flex items-center flex-shrink-0 ml-2">
                    <button data-collection="chassis" data-id="${item.id}" class="edit-item-btn text-gray-400 hover:text-blue-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
                    <button data-collection="chassis" data-id="${item.id}" class="delete-item-btn text-gray-400 hover:text-red-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                </div>
            </div>`;
        listElement.appendChild(li);
    });
};

const renderStatusesList = () => {
    const listElement = document.getElementById('statuses-list');
    listElement.innerHTML = '';
    statuses.forEach(status => {
        const li = document.createElement('li');
        li.className = 'bg-gray-50 p-3 rounded-md border border-gray-200 flex justify-between items-center';
        li.innerHTML = `
            <div>
                <span class="text-xl mr-3">${status.emoji}</span>
                <span class="font-medium text-gray-800">${status.description}</span>
            </div>
            <div class="flex items-center flex-shrink-0 ml-2">
                <button data-collection="statuses" data-id="${status.id}" class="edit-item-btn text-gray-400 hover:text-blue-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
                <button data-collection="statuses" data-id="${status.id}" class="delete-item-btn text-gray-400 hover:text-red-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
            </div>`;
        listElement.appendChild(li);
    });
};

const renderCollectionList = (elementId, items, collectionName) => {
    const listElement = document.getElementById(elementId);
    listElement.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center bg-gray-50 p-2 pl-3 rounded-md';
        li.innerHTML = `<span>${item.name}</span>
            <div class="flex items-center">
                <button data-collection="${collectionName}" data-id="${item.id}" class="edit-item-btn text-gray-400 hover:text-blue-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
                <button data-collection="${collectionName}" data-id="${item.id}" class="delete-item-btn text-gray-400 hover:text-red-500 p-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
            </div>`;
        listElement.appendChild(li);
    });
};

// --- STYLING HELPERS ---
const getLocationIcon = (location) => { let i,c; switch(location) { case 'Pier': i=`<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 10-2 0v2a1 1 0 102 0V6zM4 5a1 1 0 100 2h12V5H4z"/><path d="M18 11a2 2 0 01-2 2H4a2 2 0 01-2-2v-1a1 1 0 011-1h14a1 1 0 011 1v1z"/></svg>`; c='text-sky-600'; break; case 'Yard': i=`<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 11-2 0V4H6v12a1 1 0 11-2 0V4zm4 4a1 1 0 100 2h4a1 1 0 100-2H8zm0 4a1 1 0 100 2h4a1 1 0 100-2H8z" clip-rule="evenodd" /></svg>`; c='text-amber-600'; break; case 'IH Mathers': i=`<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 2H4v8h12V6z" clip-rule="evenodd" /><path d="M11 9a1 1 0 10-2 0v2a1 1 0 102 0V9z"/></svg>`; c='text-indigo-600'; break; case 'In Transit': i=`<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v8a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM6 7h4v4H6V7z" /><path d="M12 4a1 1 0 00-1 1v8a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H18a1 1 0 001-1V5a1 1 0 00-1-1h-6zM14 7h4v4h-4V7z" /></svg>`; c='text-gray-500'; break; default: i=`<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`; c='text-green-600'; } return `<div class="flex items-center ${c}">${i}<span>${location}</span></div>`; };
const getStatusBadge = (statusDescription) => {
    const statusObj = statuses.find(s => s.description === statusDescription);
    if (statusObj) {
        return `<div class="flex items-center"><span class="text-lg mr-2">${statusObj.emoji}</span><span>${statusObj.description}</span></div>`;
    }
    return `<span>${statusDescription || 'N/A'}</span>`; // Fallback
};

// --- MODAL HANDLING ---
const populateDropdowns = () => {
    const createOptions = (data, valueKey, textKey) => data.map(item => `<option value="${item[valueKey]}">${textKey ? item[textKey] : item[valueKey]}</option>`).join('');
    const createStatusOptions = (data) => data.map(item => `<option value="${item.description}">${item.emoji} ${item.description}</option>`).join('');

    document.getElementById('container-location').innerHTML = createOptions(locations, 'name');
    document.getElementById('container-status').innerHTML = createStatusOptions(statuses);
    document.getElementById('container-driver').innerHTML = '<option value="Unassigned">Unassigned</option>' + createOptions(drivers, 'name');
};

const openModal = (containerId = null) => {
    containerForm.reset();
    populateDropdowns();
    if (containerId) {
        const container = containers.find(c => c.id === containerId);
        modalTitle.textContent = 'Update Container';
        document.getElementById('container-id-input').value = container.id;
        document.getElementById('container-serial').value = container.serial;
        document.getElementById('container-serial').readOnly = true;
        document.getElementById('container-location').value = container.location;
        document.getElementById('container-status').value = container.status;
        document.getElementById('container-driver').value = container.driver;
    } else {
        modalTitle.textContent = 'Add New Container';
        document.getElementById('container-id-input').value = '';
        document.getElementById('container-serial').readOnly = false;
    }
    modal.classList.remove('hidden');
};
const closeModal = () => modal.classList.add('hidden');

const openEditModal = (collection, id) => {
    let item;
    let formHtml = '';
    editModalTitle.textContent = `Edit ${collection.slice(0, -1)}`;

    if (collection === 'drivers') {
        item = drivers.find(d => d.id === id);
        formHtml = `
            <input type="hidden" name="collection" value="drivers">
            <input type="hidden" name="id" value="${item.id}">
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label class="block text-sm font-medium">Name</label><input type="text" name="name" value="${item.name}" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" required></div>
                    <div><label class="block text-sm font-medium">ID Number</label><input type="text" name="idNumber" value="${item.idNumber}" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" required></div>
                    <div><label class="block text-sm font-medium">Plate</label><input type="text" name="plate" value="${item.plate}" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" required></div>
                    <div><label class="block text-sm font-medium">Tare Weight (kg)</label><input type="number" name="weight" value="${item.weight}" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" required></div>
                </div>
            </div>`;
    } else if (collection === 'statuses') {
        item = statuses.find(i => i.id === id);
        formHtml = `
            <input type="hidden" name="collection" value="statuses">
            <input type="hidden" name="id" value="${item.id}">
            <div class="flex items-end gap-2">
                <div class="w-1/4">
                    <label class="block text-sm font-medium">Emoji(s)</label>
                    <input type="text" name="emoji" value="${item.emoji}" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" required>
                </div>
                <div class="flex-grow">
                    <label class="block text-sm font-medium">Description</label>
                    <input type="text" name="description" value="${item.description}" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" required>
                </div>
            </div>`;
    } else if (collection === 'chassis') {
        item = chassis.find(i => i.id === id);
        formHtml = `
            <input type="hidden" name="collection" value="chassis">
            <input type="hidden" name="id" value="${item.id}">
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label class="block text-sm font-medium">Chassis Name</label><input type="text" name="name" value="${item.name}" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" required></div>
                    <div><label class="block text-sm font-medium">Weight (kg)</label><input type="number" name="weight" value="${item.weight}" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" required></div>
                </div>
                <div class="flex items-center space-x-6">
                    <label class="flex items-center space-x-2"><input type="checkbox" name="is40ft" class="h-4 w-4 text-blue-600 border-gray-300 rounded" ${item.is40ft ? 'checked' : ''}><span>40ft</span></label>
                    <label class="flex items-center space-x-2"><input type="checkbox" name="is2x20" class="h-4 w-4 text-blue-600 border-gray-300 rounded" ${item.is2x20 ? 'checked' : ''}><span>2x20</span></label>
                </div>
            </div>`;
    } else { // For locations and containerTypes
        item = collection === 'locations' ? locations.find(i => i.id === id) : containerTypes.find(i => i.id === id);
        formHtml = `
            <input type="hidden" name="collection" value="${collection}">
            <input type="hidden" name="id" value="${item.id}">
            <div>
                <label class="block text-sm font-medium">Name</label>
                <input type="text" name="name" value="${item.name}" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" required>
            </div>`;
    }

    editItemForm.innerHTML = formHtml;
    editModal.classList.remove('hidden');
};
const closeEditModal = () => editModal.classList.add('hidden');


// --- FIRESTORE CRUD OPERATIONS ---
const handleFormSubmit = async (e) => {
    e.preventDefault();
    const idInput = document.getElementById('container-id-input').value;
    const serial = document.getElementById('container-serial').value.trim().toUpperCase();
    if (!serial) { console.error("Container serial is required."); return; }

    const containerData = {
        serial: serial,
        location: document.getElementById('container-location').value,
        status: document.getElementById('container-status').value,
        driver: document.getElementById('container-driver').value,
        lastUpdated: new Date().toISOString()
    };

    try {
        if (idInput) {
            await updateDoc(doc(db, `/artifacts/${window.appId}/public/data/containers`, idInput), containerData);
        } else {
            const existing = containers.find(c => c.serial === serial);
            if (existing) {
                console.error('A container with this serial already exists.'); return;
            }
            await addDoc(collection(db, `/artifacts/${window.appId}/public/data/containers`), containerData);
        }
        closeModal();
    } catch (error) {
        console.error("Error saving container: ", error);
    }
};

const handleDriverFormSubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-driver-name').value.trim();
    const idNumber = document.getElementById('new-driver-id').value.trim();
    const plate = document.getElementById('new-driver-plate').value.trim().toUpperCase();
    const weight = document.getElementById('new-driver-weight').value;

    if (!name || !idNumber || !plate || !weight) {
        console.error("All driver fields are required.");
        return; 
    }

    const driverData = { name, idNumber, plate, weight: Number(weight) };

    try {
        await addDoc(collection(db, `/artifacts/${window.appId}/public/data/drivers`), driverData);
        e.target.reset(); 
    } catch (error) {
        console.error(`Error adding driver:`, error);
    }
};

const handleChassisFormSubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-chassis-name').value.trim();
    const weight = document.getElementById('new-chassis-weight').value;
    const is40ft = document.getElementById('new-chassis-40ft').checked;
    const is2x20 = document.getElementById('new-chassis-2x20').checked;

    if (!name || !weight) {
        console.error("Chassis name and weight are required.");
        return;
    }

    const chassisData = { name, weight: Number(weight), is40ft, is2x20 };
    try {
        await addDoc(collection(db, `/artifacts/${window.appId}/public/data/chassis`), chassisData);
        e.target.reset();
    } catch (error) {
        console.error('Error adding chassis:', error);
    }
};

const handleStatusFormSubmit = async (e) => {
    e.preventDefault();
    const emoji = document.getElementById('new-status-emoji').value.trim();
    const description = document.getElementById('new-status-description').value.trim();
    if (!emoji || !description) {
        console.error("Emoji and Description are required for statuses.");
        return;
    }
    const statusData = { emoji, description };
    try {
        await addDoc(collection(db, `/artifacts/${window.appId}/public/data/statuses`), statusData);
        e.target.reset();
    } catch (error) {
        console.error('Error adding status:', error);
    }
};

const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get('id');
    const collectionName = formData.get('collection');
    
    let updatedData = {};
    for (let [key, value] of formData.entries()) {
        if (key !== 'id' && key !== 'collection') {
            updatedData[key] = key === 'weight' ? Number(value) : value;
        }
    }

    // Handle checkboxes for chassis, as they don't appear in formData if unchecked
    if (collectionName === 'chassis') {
        updatedData.is40ft = formData.has('is40ft');
        updatedData.is2x20 = formData.has('is2x20');
    }

    try {
        await updateDoc(doc(db, `/artifacts/${window.appId}/public/data/${collectionName}`, id), updatedData);
        closeEditModal();
    } catch (error) {
        console.error(`Error updating item in ${collectionName}:`, error);
    }
};

const addCollectionItem = async (collectionName, value) => {
    if (!value) return;
    try {
        await addDoc(collection(db, `/artifacts/${window.appId}/public/data/${collectionName}`), { name: value });
    } catch (error) {
        console.error(`Error adding to ${collectionName}:`, error);
    }
};

const deleteCollectionItem = async (collectionName, docId) => {
    try {
        await deleteDoc(doc(db, `/artifacts/${window.appId}/public/data/${collectionName}`, docId));
    } catch (error) {
        console.error(`Error deleting from ${collectionName}:`, error);
    }
};

// --- EVENT LISTENERS ---
const setupEventListeners = () => {
    addContainerBtn.addEventListener('click', () => openModal());
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    containerForm.addEventListener('submit', handleFormSubmit);
    saveBtn.addEventListener('click', () => containerForm.requestSubmit());
    tableBody.addEventListener('click', (e) => { if (e.target.classList.contains('edit-btn')) openModal(e.target.dataset.id); });

    editCancelBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });
    editItemForm.addEventListener('submit', handleEditFormSubmit);
    editSaveBtn.addEventListener('click', () => editItemForm.requestSubmit());
    
    document.getElementById('settings-page').addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.classList.contains('edit-item-btn')) {
            openEditModal(target.dataset.collection, target.dataset.id);
        }
        if (target.classList.contains('delete-item-btn')) {
            deleteCollectionItem(target.dataset.collection, target.dataset.id);
        }
    });

    mobileMenuButton.addEventListener('click', () => { mobileMenu.classList.toggle('hidden'); menuOpenIcon.classList.toggle('hidden'); menuOpenIcon.classList.toggle('block'); menuClosedIcon.classList.toggle('hidden'); menuClosedIcon.classList.toggle('block'); });
    navLinks.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); showPage(e.target.dataset.page); }));
    mobileNavLinks.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); showPage(e.target.dataset.page); }));

    document.getElementById('add-driver-form').addEventListener('submit', handleDriverFormSubmit);
    document.getElementById('add-chassis-form').addEventListener('submit', handleChassisFormSubmit);
    document.getElementById('add-location-form').addEventListener('submit', (e) => { e.preventDefault(); const input = e.target.querySelector('input'); addCollectionItem('locations', input.value.trim()); e.target.reset(); });
    document.getElementById('add-status-form').addEventListener('submit', handleStatusFormSubmit);
    document.getElementById('add-container-type-form').addEventListener('submit', (e) => { e.preventDefault(); const input = e.target.querySelector('input'); addCollectionItem('containerTypes', input.value.trim()); e.target.reset(); });
};

// --- FIREBASE INITIALIZATION & DATA SYNC ---
const setupRealtimeListeners = () => {
    const collections = {
        containers: { stateVar: 'containers', renderFn: () => { renderContainers(); renderKPIs(); } },
        drivers: { stateVar: 'drivers', renderFn: renderDriversList },
        chassis: { stateVar: 'chassis', renderFn: renderChassisList },
        locations: { stateVar: 'locations', renderFn: () => renderCollectionList('locations-list', locations, 'locations') },
        statuses: { stateVar: 'statuses', renderFn: renderStatusesList },
        containerTypes: { stateVar: 'containerTypes', renderFn: () => renderCollectionList('container-types-list', containerTypes, 'containerTypes') }
    };

    for (const [colName, config] of Object.entries(collections)) {
        onSnapshot(collection(db, `/artifacts/${window.appId}/public/data/${colName}`), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            if (colName === 'statuses') {
                data.sort((a,b) => a.description.localeCompare(b.description));
            } else if (data.every(item => item.name)) {
                data.sort((a,b) => a.name.localeCompare(b.name));
            }

            if (config.stateVar === 'containers') containers = data.sort((a,b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || ''));
            else if (config.stateVar === 'drivers') drivers = data;
            else if (config.stateVar === 'chassis') chassis = data;
            else if (config.stateVar === 'locations') locations = data;
            else if (config.stateVar === 'statuses') statuses = data;
            else if (config.stateVar === 'containerTypes') containerTypes = data;
            
            config.renderFn();
        });
    }
};

async function initFirebase() {
    setLogLevel('Debug');
    
    if (typeof window.firebaseConfig === 'undefined' || !window.firebaseConfig.projectId || window.firebaseConfig.projectId === "YOUR_PROJECT_ID") {
        console.error("Firebase config is missing or incomplete. Please add your Firebase config in firebase-config.js for local testing.");
        document.getElementById('no-containers-message').querySelector('p').textContent = 'Firebase is not configured. Please check firebase-config.js and see the browser console for instructions.';
        return;
    }

    const app = initializeApp(window.firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
        userId = auth.currentUser?.uid;
        if(userId) {
            console.log("Firebase Authenticated. UserID:", userId);
            setupRealtimeListeners();
        } else {
             console.error("Firebase Authentication failed.");
        }
    } catch (error) {
        console.error("Firebase Auth Error:", error);
    }
}

// --- APP START ---
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    setupEventListeners();
    initFirebase();
});


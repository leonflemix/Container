// File: js/state.js
export let containers = [], drivers = [], locations = [], statuses = [], chassis = [], containerTypes = [], bookings = [], collections = [];
export let db, auth, userId;
export let lastDeletedItem = null;

export function setDb(database) { db = database; }
export function setAuth(authentication) { auth = authentication; }
export function setUserId(id) { userId = id; }

export function updateState(collectionName, data) {
    switch(collectionName) {
        case 'containers': containers = data.sort((a,b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || '')); break;
        case 'drivers': drivers = data.sort((a,b) => a.name.localeCompare(b.name)); break;
        case 'chassis': chassis = data.sort((a,b) => a.name.localeCompare(b.name)); break;
        case 'locations': locations = data.sort((a,b) => a.name.localeCompare(b.name)); break;
        case 'statuses': statuses = data.sort((a,b) => a.description.localeCompare(b.description)); break;
        case 'containerTypes': containerTypes = data.sort((a,b) => a.name.localeCompare(b.name)); break;
        case 'bookings': bookings = data.sort((a,b) => (b.deadline || '').localeCompare(a.deadline || '')); break;
        case 'collections': collections = data.sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || '')); break;
    }
}

export function setLastDeletedItem(item) {
    lastDeletedItem = item;
}

export function clearLastDeletedItem() {
    lastDeletedItem = null;
}


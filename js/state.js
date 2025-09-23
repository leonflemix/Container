// File: js/state.js
export let containers = [], drivers = [], locations = [], statuses = [], chassis = [], containerTypes = [], bookings = [], collections = [];
export let db, auth, userId;

export const setDB = (instance) => db = instance;
export const setAuth = (instance) => auth = instance;
export const setUserId = (id) => userId = id;

// Function to update state from Firebase snapshots
export const updateState = (collectionName, data) => {
    switch (collectionName) {
        case 'containers': 
            containers = data.sort((a,b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || '')); 
            break;
        case 'drivers': 
            drivers = data.sort((a,b) => a.name.localeCompare(b.name)); 
            break;
        case 'chassis': 
            chassis = data.sort((a,b) => a.name.localeCompare(b.name)); 
            break;
        case 'locations': 
            locations = data.sort((a,b) => a.name.localeCompare(b.name)); 
            break;
        case 'statuses': 
            statuses = data.sort((a,b) => a.description.localeCompare(b.description)); 
            break;
        case 'containerTypes': 
            containerTypes = data.sort((a,b) => a.name.localeCompare(b.name)); 
            break;
        case 'bookings': 
            bookings = data.sort((a,b) => (b.deadline || '').localeCompare(a.deadline || '')); 
            break;
        case 'collections': 
            collections = data.sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || '')); 
            break;
    }
};


// File: js/state.js
export let containers = [], drivers = [], locations = [], statuses = [], chassis = [], containerTypes = [], bookings = [], collections = [];

let lastDeletedItem = null;

export function updateState(collectionName, data) {
    switch(collectionName) {
        case 'containers': containers = data; break;
        case 'drivers': drivers = data; break;
        case 'locations': locations = data; break;
        case 'statuses': statuses = data; break;
        case 'chassis': chassis = data; break;
        case 'containerTypes': containerTypes = data; break;
        case 'bookings': bookings = data; break;
        case 'collections': collections = data; break;
    }
}

export function setLastDeletedItem(item) {
    lastDeletedItem = item;
}

export function getLastDeletedItem() {
    return lastDeletedItem;
}

export function clearLastDeletedItem() {
    lastDeletedItem = null;
}


// File: js/firebaseService.js
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { updateState } from './state.js';
import * as render from './render.js';

let db;

export function initialize(database) {
    db = database;
    setupRealtimeListeners();
}

export async function addItem(collectionName, data, docId = null) {
    try {
        if (docId) {
            await setDoc(doc(db, `/artifacts/${window.appId}/public/data/${collectionName}`, docId), data);
            return { id: docId };
        } else {
            const docRef = await addDoc(collection(db, `/artifacts/${window.appId}/public/data/${collectionName}`), data);
            return docRef;
        }
    } catch (error) {
        console.error(`Error adding to ${collectionName}:`, error);
        return null;
    }
}

export async function updateItem(collectionName, docId, data) {
    try {
        await updateDoc(doc(db, `/artifacts/${window.appId}/public/data/${collectionName}`, docId), data);
    } catch (error) {
        console.error(`Error updating item in ${collectionName}:`, error);
    }
}

export async function deleteItem(collectionName, docId) {
    try {
        await deleteDoc(doc(db, `/artifacts/${window.appId}/public/data/${collectionName}`, docId));
    } catch (error) {
        console.error(`Error deleting from ${collectionName}:`, error);
    }
}

export async function updateBookingOnCollection(bookingId, containerId) {
    try {
        await updateDoc(doc(db, `/artifacts/${window.appId}/public/data/bookings`, bookingId), {
            assignedContainers: arrayUnion(containerId)
        });
    } catch (error) {
        console.error("Error updating booking on collection:", error);
    }
}

function setupRealtimeListeners() {
    const collectionsConfig = {
        containers: render.renderContainers,
        drivers: () => { render.renderDriversList(); render.renderDriversKPIs(); render.renderDriverDashboard(); },
        chassis: render.renderChassisList,
        locations: () => { render.renderCollectionList('locations-list', state.locations, 'locations'); render.renderKPIs(); },
        statuses: () => { render.renderStatusesList(); render.renderDriverDashboard(); render.renderContainers(); },
        containerTypes: () => render.renderCollectionList('container-types-list', state.containerTypes, 'containerTypes'),
        bookings: () => { render.renderBookingsGrid(); render.renderLogisticsKPIs(); render.renderDriverDashboard(); },
        collections: () => { render.renderDriverDashboard(); render.renderDriversKPIs(); render.renderOpenCollectionsGrid(); render.renderBookingsGrid(); }
    };

    for (const [colName, renderFn] of Object.entries(collectionsConfig)) {
        onSnapshot(collection(db, `/artifacts/${window.appId}/public/data/${colName}`), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateState(colName, data);
            renderFn();
        });
    }
}


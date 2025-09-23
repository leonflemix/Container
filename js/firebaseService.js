// File: js/firebaseService.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setLogLevel, arrayUnion } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import * as state from './state.js';
import * as render from './render.js';

// --- FIRESTORE CRUD OPERATIONS ---

export const addItem = async (collectionName, data) => {
    try {
        const docRef = await addDoc(collection(state.db, `/artifacts/${window.appId}/public/data/${collectionName}`), data);
        return docRef;
    } catch (error) {
        console.error(`Error adding to ${collectionName}:`, error);
    }
};

export const updateItem = async (collectionName, docId, data) => {
    try {
        await updateDoc(doc(state.db, `/artifacts/${window.appId}/public/data/${collectionName}`, docId), data);
    } catch (error) {
        console.error(`Error updating item in ${collectionName}:`, error);
    }
};

export const deleteItem = async (collectionName, docId) => {
    try {
        await deleteDoc(doc(state.db, `/artifacts/${window.appId}/public/data/${collectionName}`, docId));
    } catch (error) {
        console.error(`Error deleting from ${collectionName}:`, error);
    }
};

export const updateBookingOnCollection = async (bookingId, containerId) => {
     try {
        await updateDoc(doc(state.db, `/artifacts/${window.appId}/public/data/bookings`, bookingId), {
            assignedContainers: arrayUnion(containerId)
        });
    } catch (error) {
        console.error(`Error updating booking on collection:`, error);
    }
}


// --- FIREBASE INITIALIZATION & DATA SYNC ---

const setupRealtimeListeners = () => {
    const collectionsConfig = {
        containers: { renderFn: () => { render.renderContainers(); render.renderKPIs(); } },
        drivers: { renderFn: () => { render.renderDriversList(); render.renderDriversKPIs(); render.renderDriverDashboard(); } },
        chassis: { renderFn: render.renderChassisList },
        locations: { renderFn: () => render.renderCollectionList('locations-list', state.locations, 'locations') },
        statuses: { renderFn: render.renderStatusesList },
        containerTypes: { renderFn: () => { render.renderCollectionList('container-types-list', state.containerTypes, 'containerTypes'); } },
        bookings: { renderFn: () => { render.renderBookingsGrid(); render.renderLogisticsKPIs(); render.renderDriverDashboard(); } },
        collections: { renderFn: () => { render.renderDriverDashboard(); render.renderDriversKPIs(); render.renderOpenCollectionsGrid(); render.renderBookingsGrid(); } }
    };

    for (const [colName, config] of Object.entries(collectionsConfig)) {
        onSnapshot(collection(state.db, `/artifacts/${window.appId}/public/data/${colName}`), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            state.updateState(colName, data);
            config.renderFn();
        });
    }
};

export async function initFirebase() {
    setLogLevel('Debug');
    
    if (typeof window.firebaseConfig === 'undefined' || !window.firebaseConfig.projectId || window.firebaseConfig.projectId === "YOUR_PROJECT_ID") {
        console.error("Firebase config is missing or incomplete. Please add your Firebase config in firebase-config.js for local testing.");
        const msgEl = document.getElementById('no-containers-message')?.querySelector('p');
        if (msgEl) msgEl.textContent = 'Firebase is not configured. Please check firebase-config.js and see the browser console for instructions.';
        return;
    }

    const app = initializeApp(window.firebaseConfig);
    state.setDB(getFirestore(app));
    state.setAuth(getAuth(app));
    
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(state.auth, __initial_auth_token);
        } else {
            await signInAnonymously(state.auth);
        }
        state.setUserId(state.auth.currentUser?.uid);

        if(state.userId) {
            console.log("Firebase Authenticated. UserID:", state.userId);
            setupRealtimeListeners();
        } else {
             console.error("Firebase Authentication failed.");
        }
    } catch (error) {
        console.error("Firebase Auth Error:", error);
    }
}


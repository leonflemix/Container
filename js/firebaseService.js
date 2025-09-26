// File: js/firebaseService.js
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, arrayUnion, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import * as state from './state.js';
import * as render from './render.js';

let db;

export async function initFirebase() {
    setLogLevel('Debug');
    
    if (typeof window.firebaseConfig === 'undefined' || !window.firebaseConfig.projectId || window.firebaseConfig.projectId === "YOUR_PROJECT_ID") {
        console.error("Firebase config is missing or incomplete. Please add your Firebase config in firebase-config.js for local testing.");
        document.body.innerHTML = '<p class="text-red-500 text-center p-8">Firebase is not configured. Please check firebase-config.js and see the browser console for instructions.</p>';
        return;
    }

    const app = initializeApp(window.firebaseConfig);
    db = getFirestore(app);
    const auth = getAuth(app);
    state.setDb(db);
    state.setAuth(auth);
    
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
        const userId = auth.currentUser?.uid;
        if(userId) {
            console.log("Firebase Authenticated. UserID:", userId);
            state.setUserId(userId);
            setupRealtimeListeners();
        } else {
             console.error("Firebase Authentication failed.");
        }
    } catch (error) {
        console.error("Firebase Auth Error:", error);
    }
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
            state.updateState(colName, data);
            renderFn();
        });
    }
}


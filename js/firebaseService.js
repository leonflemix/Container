// File: js/firebaseService.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, getDoc, setLogLevel, writeBatch, query, where, getDocs, arrayRemove } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import * as state from './state.js';
import * as render from './render.js';
import * as ui from './ui.js';

let db, auth;

export async function initFirebase() {
    setLogLevel('Debug');
    if (typeof window.firebaseConfig === 'undefined' || !window.firebaseConfig.projectId || window.firebaseConfig.projectId === "YOUR_PROJECT_ID") {
        console.error("Firebase config is missing or incomplete.");
        return;
    }

    const app = initializeApp(window.firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    try {
        if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
            await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
        const userId = auth.currentUser?.uid;
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

function setupRealtimeListeners() {
    const collectionsConfig = {
        containers: { stateVar: 'containers', sortKey: 'lastUpdated', renderFns: [render.renderContainers, render.renderKPIs] },
        drivers: { stateVar: 'drivers', sortKey: 'name', renderFns: [render.renderDriversList, render.renderDriversKPIs, render.renderDriverDashboard] },
        chassis: { stateVar: 'chassis', sortKey: 'name', renderFns: [render.renderChassisList] },
        locations: { stateVar: 'locations', sortKey: 'name', renderFns: [() => render.renderCollectionList('locations-list', state.locations, 'locations')] },
        statuses: { stateVar: 'statuses', sortKey: 'description', renderFns: [render.renderStatusesList] },
        containerTypes: { stateVar: 'containerTypes', sortKey: 'name', renderFns: [() => render.renderCollectionList('container-types-list', state.containerTypes, 'containerTypes'), ui.populateDropdowns] },
        bookings: { stateVar: 'bookings', sortKey: 'deadline', renderFns: [render.renderBookingsGrid, render.renderLogisticsKPIs, render.renderDriverDashboard] },
        collections: { stateVar: 'collections', sortKey: 'createdAt', renderFns: [render.renderDriverDashboard, render.renderDriversKPIs, render.renderOpenCollectionsGrid, render.renderBookingsGrid] }
    };

    for (const [colName, config] of Object.entries(collectionsConfig)) {
        onSnapshot(collection(db, `/artifacts/${window.appId}/public/data/${colName}`), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            if (config.sortKey) {
                data.sort((a, b) => (b[config.sortKey] || '').localeCompare(a[config.sortKey] || ''));
                if (['name', 'description'].includes(config.sortKey)) {
                    data.sort((a, b) => (a[config.sortKey] || '').localeCompare(b[config.sortKey] || ''));
                }
            }
            
            // Update the central state
            state.updateState(colName, data);

            // Trigger all related render functions
            config.renderFns.forEach(fn => fn());
        });
    }
}

export async function addItem(collectionName, data, id = null) {
    try {
        if (id) {
            await setDoc(doc(db, `/artifacts/${window.appId}/public/data/${collectionName}`, id), data);
            return { id };
        } else {
            const docRef = await addDoc(collection(db, `/artifacts/${window.appId}/public/data/${collectionName}`), data);
            return docRef;
        }
    } catch (error) {
        console.error(`Error adding to ${collectionName}:`, error);
    }
}

export async function updateItem(collectionName, docId, data) {
    try {
        await updateDoc(doc(db, `/artifacts/${window.appId}/public/data/${collectionName}`, docId), data);
    } catch (error) {
        console.error(`Error updating ${collectionName}:`, error);
    }
}


export async function deleteItem(collectionName, docId) {
    try {
        await deleteDoc(doc(db, `/artifacts/${window.appId}/public/data/${collectionName}`, docId));
    } catch (error) {
        console.error(`Error deleting from ${collectionName}:`, error);
    }
}

export async function deleteContainerAndUpdateRelations(containerId) {
    const batch = writeBatch(db);
    const containerRef = doc(db, `/artifacts/${window.appId}/public/data/containers`, containerId);

    try {
        const containerDoc = await getDoc(containerRef);
        if (!containerDoc.exists()) {
            console.error("Container to delete not found.");
            return;
        }
        const containerData = containerDoc.data();
        
        // Find parent booking and prepare update
        if (containerData.bookingNumber) {
            const bookingsQuery = query(collection(db, `/artifacts/${window.appId}/public/data/bookings`), where("number", "==", containerData.bookingNumber));
            const bookingSnapshot = await getDocs(bookingsQuery);
            if (!bookingSnapshot.empty) {
                const bookingDoc = bookingSnapshot.docs[0];
                batch.update(bookingDoc.ref, {
                    assignedContainers: arrayRemove(containerId)
                });
            }
        }

        // Find parent collection and prepare update
        const collectionsQuery = query(collection(db, `/artifacts/${window.appId}/public/data/collections`), where("bookingNumber", "==", containerData.bookingNumber));
        const collectionsSnapshot = await getDocs(collectionsQuery);
        collectionsSnapshot.forEach(docSnap => {
            const collectionData = docSnap.data();
            const updatedCollected = (collectionData.collectedContainers || []).filter(c => c.containerId !== containerId);
            if (updatedCollected.length < (collectionData.collectedContainers || []).length) {
                batch.update(docSnap.ref, { collectedContainers: updatedCollected });
            }
        });

        // Prepare container deletion
        batch.delete(containerRef);

        // Commit all batched writes
        await batch.commit();

    } catch (error) {
        console.error("Error during cascading delete of container:", error);
    }
}


export async function updateBookingOnCollection(bookingId, containerId) {
    try {
        await updateDoc(doc(db, `/artifacts/${window.appId}/public/data/bookings`, bookingId), {
            assignedContainers: arrayUnion(containerId)
        });
    } catch (error) {
        console.error("Error updating booking with assigned container:", error);
    }
}


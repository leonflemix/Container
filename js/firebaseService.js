// File: js/firebaseService.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, getDoc, setLogLevel, writeBatch, query, where, getDocs, arrayRemove } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import * as state from './state.js';
import * as render from './render.js';
import * as ui from './ui.js';
import { updateReports, populateDriverFilter } from './reports.js';

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
        containers: { renderFns: [render.renderContainers, render.renderKPIs, updateReports, render.renderOperatorDashboard] },
        drivers: { sortKey: 'name', renderFns: [render.renderDriversList, render.renderDriversKPIs, render.renderDriverDashboard, populateDriverFilter, updateReports] },
        chassis: { sortKey: 'name', renderFns: [render.renderChassisList] },
        locations: { sortKey: 'name', renderFns: [() => render.renderCollectionList('locations-list', state.locations, 'locations'), render.renderOperatorDashboard] },
        statuses: { sortKey: 'description', renderFns: [render.renderStatusesList] },
        containerTypes: { sortKey: 'name', renderFns: [() => render.renderCollectionList('container-types-list', state.containerTypes, 'containerTypes'), ui.populateDropdowns] },
        bookings: { sortKey: 'deadline', renderFns: [render.renderBookingsGrid, render.renderLogisticsKPIs, render.renderDriverDashboard] },
        collections: { sortKey: 'createdAt', renderFns: [render.renderDriverDashboard, render.renderDriversKPIs, render.renderOpenCollectionsGrid, render.renderBookingsGrid, render.renderLogisticsKPIs, updateReports] }
    };

    for (const [colName, config] of Object.entries(collectionsConfig)) {
        onSnapshot(collection(db, `/artifacts/${window.appId}/public/data/${colName}`), (snapshot) => {
            let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            if (config.sortKey) {
                 data.sort((a, b) => (a[config.sortKey] || '').localeCompare(b[config.sortKey] || ''));
            }
            
            state.updateState(colName, data);
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

        const collectionsQuery = query(collection(db, `/artifacts/${window.appId}/public/data/collections`), where("bookingNumber", "==", containerData.bookingNumber));
        const collectionsSnapshot = await getDocs(collectionsQuery);
        
        collectionsSnapshot.forEach(docSnap => {
            const collectionData = docSnap.data();
            const collectedContainers = collectionData.collectedContainers || [];
            const containerInCollection = collectedContainers.find(c => c.containerId === containerId);

            if (containerInCollection) {
                const updatedCollected = collectedContainers.filter(c => c.containerId !== containerId);
                const newQty = (collectionData.qty || 0) > 0 ? collectionData.qty - 1 : 0;

                if (newQty === 0) {
                    batch.delete(docSnap.ref); 
                } else {
                    batch.update(docSnap.ref, { 
                        collectedContainers: updatedCollected,
                        qty: newQty
                    });
                }
            }
        });

        batch.delete(containerRef);
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


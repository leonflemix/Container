// File: js/firebaseService.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, getDoc, setLogLevel, writeBatch, query, where, getDocs, arrayRemove } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import * as state from './state.js';
import { renderDashboard } from './dashboard.js';
import { renderLogisticsPage } from './logistics.js';
import { renderDriversPage } from './drivers.js';
import { renderOperatorsPage } from './operators.js';
import { renderReportsPage, populateDriverFilter } from './reports.js';
import { renderSettingsPage } from './settings.js';

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
        containers: { render: [renderDashboard, renderDriversPage, renderOperatorsPage, renderReportsPage] },
        drivers: { render: [renderDriversPage, renderSettingsPage, renderReportsPage, populateDriverFilter] },
        chassis: { render: [renderSettingsPage] },
        locations: { render: [renderSettingsPage, renderDashboard, renderOperatorsPage] },
        statuses: { render: [renderSettingsPage] },
        containerTypes: { render: [renderSettingsPage] },
        bookings: { render: [renderLogisticsPage] },
        collections: { render: [renderLogisticsPage, renderDriversPage, renderReportsPage] }
    };

    for (const [colName, config] of Object.entries(collectionsConfig)) {
        onSnapshot(collection(db, `/artifacts/${window.appId}/public/data/${colName}`), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            state.updateState(colName, data);
            config.render.forEach(fn => fn());
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
        if (!containerDoc.exists()) return;
        const containerData = containerDoc.data();
        
        if (containerData.bookingNumber) {
            const bookingsQuery = query(collection(db, `/artifacts/${window.appId}/public/data/bookings`), where("number", "==", containerData.bookingNumber));
            const bookingSnapshot = await getDocs(bookingsQuery);
            if (!bookingSnapshot.empty) {
                batch.update(bookingSnapshot.docs[0].ref, { assignedContainers: arrayRemove(containerId) });
            }
        }

        const collectionsQuery = query(collection(db, `/artifacts/${window.appId}/public/data/collections`), where("bookingNumber", "==", containerData.bookingNumber));
        const collectionsSnapshot = await getDocs(collectionsQuery);
        collectionsSnapshot.forEach(docSnap => {
            const collectionData = docSnap.data();
            const collected = (collectionData.collectedContainers || []).filter(c => c.containerId !== containerId);
            if (collected.length < (collectionData.collectedContainers || []).length) {
                 batch.update(docSnap.ref, { collectedContainers: collected });
            }
        });

        batch.delete(containerRef);
        await batch.commit();
    } catch (error) {
        console.error("Error during cascading delete of container:", error);
    }
}


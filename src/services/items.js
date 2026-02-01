import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const ITEMS_COLLECTION = 'items';

// Create a new item listing
export const createItem = async (itemData, userId) => {
    const item = {
        ...itemData,
        userId,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, ITEMS_COLLECTION), item);
    return { id: docRef.id, ...item };
};

// Get a single item by ID
export const getItem = async (itemId) => {
    const docRef = doc(db, ITEMS_COLLECTION, itemId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
};

// Get all active items with optional filters
export const getItems = async (filters = {}, lastDoc = null, pageSize = 12) => {
    let q = query(
        collection(db, ITEMS_COLLECTION),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
    );

    // Apply category filter
    if (filters.category && filters.category !== 'All') {
        q = query(
            collection(db, ITEMS_COLLECTION),
            where('status', '==', 'active'),
            where('category', '==', filters.category),
            orderBy('createdAt', 'desc')
        );
    }

    // Apply pagination
    if (lastDoc) {
        q = query(q, startAfter(lastDoc), limit(pageSize));
    } else {
        q = query(q, limit(pageSize));
    }

    const querySnapshot = await getDocs(q);
    const items = [];
    let lastVisible = null;

    querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
        lastVisible = doc;
    });

    return { items, lastVisible };
};

// Get items by user ID
export const getUserItems = async (userId, status = null) => {
    let q;

    if (status) {
        q = query(
            collection(db, ITEMS_COLLECTION),
            where('userId', '==', userId),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );
    } else {
        q = query(
            collection(db, ITEMS_COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
    }

    const querySnapshot = await getDocs(q);
    const items = [];

    querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
    });

    return items;
};

// Search items by title
export const searchItems = async (searchTerm, filters = {}) => {
    // Note: Firestore doesn't support full-text search natively
    // For production, consider Algolia or Elasticsearch
    // This is a simple prefix search
    const q = query(
        collection(db, ITEMS_COLLECTION),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(50)
    );

    const querySnapshot = await getDocs(q);
    const items = [];
    const searchLower = searchTerm.toLowerCase();

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (
            data.title.toLowerCase().includes(searchLower) ||
            data.description.toLowerCase().includes(searchLower)
        ) {
            // Apply additional filters
            let matches = true;

            if (filters.category && filters.category !== 'All' && data.category !== filters.category) {
                matches = false;
            }
            if (filters.location && data.location !== filters.location) {
                matches = false;
            }
            if (filters.condition && data.condition !== filters.condition) {
                matches = false;
            }
            if (filters.minPrice && data.price < filters.minPrice) {
                matches = false;
            }
            if (filters.maxPrice && data.price > filters.maxPrice) {
                matches = false;
            }

            if (matches) {
                items.push({ id: doc.id, ...data });
            }
        }
    });

    return items;
};

// Update an item
export const updateItem = async (itemId, updates) => {
    const docRef = doc(db, ITEMS_COLLECTION, itemId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
};

// Delete an item
export const deleteItem = async (itemId) => {
    const docRef = doc(db, ITEMS_COLLECTION, itemId);
    await deleteDoc(docRef);
};

// Mark item as sold
export const markItemAsSold = async (itemId) => {
    await updateItem(itemId, { status: 'sold' });
};

// Mark item as exchanged
export const markItemAsExchanged = async (itemId) => {
    await updateItem(itemId, { status: 'exchanged' });
};

// Get items available for exchange by a specific user (for exchange proposals)
export const getUserExchangeableItems = async (userId) => {
    const q = query(
        collection(db, ITEMS_COLLECTION),
        where('userId', '==', userId),
        where('status', '==', 'active'),
        where('exchangeType', 'in', ['open_to_exchange', 'exchange_only']),
        orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const items = [];

    querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
    });

    return items;
};

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const PURCHASES_COLLECTION = 'purchases';

/**
 * Purchase status flow:
 * pending -> confirmed -> completed
 *        -> declined
 *        -> cancelled (by buyer)
 */

// Create a new purchase request
export const createPurchaseRequest = async (purchaseData) => {
    const purchase = {
        ...purchaseData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, PURCHASES_COLLECTION), purchase);
    return { id: docRef.id, ...purchase };
};

// Get purchase by ID
export const getPurchase = async (purchaseId) => {
    const docRef = doc(db, PURCHASES_COLLECTION, purchaseId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
};

// Get purchase requests received by seller
export const getReceivedPurchases = async (sellerId, status = null) => {
    try {
        let q;
        if (status) {
            q = query(
                collection(db, PURCHASES_COLLECTION),
                where('sellerId', '==', sellerId),
                where('status', '==', status)
            );
        } else {
            q = query(
                collection(db, PURCHASES_COLLECTION),
                where('sellerId', '==', sellerId)
            );
        }

        const querySnapshot = await getDocs(q);
        const purchases = [];

        querySnapshot.forEach((doc) => {
            purchases.push({ id: doc.id, ...doc.data() });
        });

        // Sort by createdAt client-side
        purchases.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });

        return purchases;
    } catch (error) {
        console.error('Error fetching received purchases:', error);
        return [];
    }
};

// Get purchase requests sent by buyer
export const getSentPurchases = async (buyerId, status = null) => {
    try {
        let q;
        if (status) {
            q = query(
                collection(db, PURCHASES_COLLECTION),
                where('buyerId', '==', buyerId),
                where('status', '==', status)
            );
        } else {
            q = query(
                collection(db, PURCHASES_COLLECTION),
                where('buyerId', '==', buyerId)
            );
        }

        const querySnapshot = await getDocs(q);
        const purchases = [];

        querySnapshot.forEach((doc) => {
            purchases.push({ id: doc.id, ...doc.data() });
        });

        purchases.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });

        return purchases;
    } catch (error) {
        console.error('Error fetching sent purchases:', error);
        return [];
    }
};

// Update purchase status
export const updatePurchaseStatus = async (purchaseId, status) => {
    const docRef = doc(db, PURCHASES_COLLECTION, purchaseId);
    const updates = {
        status,
        updatedAt: serverTimestamp(),
    };

    if (status === 'completed') {
        updates.completedAt = serverTimestamp();
    }

    await updateDoc(docRef, updates);
};

// Confirm a purchase (seller accepts)
export const confirmPurchase = async (purchaseId) => {
    await updatePurchaseStatus(purchaseId, 'confirmed');
};

// Decline a purchase
export const declinePurchase = async (purchaseId) => {
    await updatePurchaseStatus(purchaseId, 'declined');
};

// Cancel a purchase (by buyer)
export const cancelPurchase = async (purchaseId) => {
    await updatePurchaseStatus(purchaseId, 'cancelled');
};

// Complete a purchase (after payment/handover)
export const completePurchase = async (purchaseId) => {
    await updatePurchaseStatus(purchaseId, 'completed');
};

// Check if user has pending purchase for an item
export const hasPendingPurchase = async (itemId, buyerId) => {
    const q = query(
        collection(db, PURCHASES_COLLECTION),
        where('itemId', '==', itemId),
        where('buyerId', '==', buyerId),
        where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

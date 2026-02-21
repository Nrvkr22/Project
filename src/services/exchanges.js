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
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const EXCHANGES_COLLECTION = 'exchanges';

/**
 * Exchange status flow:
 * pending -> accepted -> completed
 *        -> declined
 *        -> cancelled (by proposer)
 */

// Create a new exchange proposal
export const createExchange = async (exchangeData) => {
    const exchange = {
        ...exchangeData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, EXCHANGES_COLLECTION), exchange);
    return { id: docRef.id, ...exchange };
};

// Get exchange by ID
export const getExchange = async (exchangeId) => {
    const docRef = doc(db, EXCHANGES_COLLECTION, exchangeId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
};

// Get exchanges received by user (as item owner)
export const getReceivedExchanges = async (userId, status = null) => {
    try {
        let q;
        if (status) {
            q = query(
                collection(db, EXCHANGES_COLLECTION),
                where('receiverId', '==', userId),
                where('status', '==', status)
            );
        } else {
            q = query(
                collection(db, EXCHANGES_COLLECTION),
                where('receiverId', '==', userId)
            );
        }

        const querySnapshot = await getDocs(q);
        const exchanges = [];

        querySnapshot.forEach((doc) => {
            exchanges.push({ id: doc.id, ...doc.data() });
        });

        // Sort by createdAt client-side
        exchanges.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });

        return exchanges;
    } catch (error) {
        console.error('Error fetching received exchanges:', error);
        return [];
    }
};

// Get exchanges sent by user (as proposer)
export const getSentExchanges = async (userId, status = null) => {
    try {
        let q;
        if (status) {
            q = query(
                collection(db, EXCHANGES_COLLECTION),
                where('proposerId', '==', userId),
                where('status', '==', status)
            );
        } else {
            q = query(
                collection(db, EXCHANGES_COLLECTION),
                where('proposerId', '==', userId)
            );
        }

        const querySnapshot = await getDocs(q);
        const exchanges = [];

        querySnapshot.forEach((doc) => {
            exchanges.push({ id: doc.id, ...doc.data() });
        });

        // Sort by createdAt client-side
        exchanges.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });

        return exchanges;
    } catch (error) {
        console.error('Error fetching sent exchanges:', error);
        return [];
    }
};

// Get completed exchanges for a user
export const getCompletedExchanges = async (userId) => {
    try {
        // Get as proposer
        const q1 = query(
            collection(db, EXCHANGES_COLLECTION),
            where('proposerId', '==', userId),
            where('status', '==', 'completed')
        );

        // Get as receiver
        const q2 = query(
            collection(db, EXCHANGES_COLLECTION),
            where('receiverId', '==', userId),
            where('status', '==', 'completed')
        );

        const [snapshot1, snapshot2] = await Promise.all([
            getDocs(q1),
            getDocs(q2)
        ]);

        const exchanges = [];
        const seenIds = new Set();

        snapshot1.forEach((doc) => {
            exchanges.push({ id: doc.id, ...doc.data() });
            seenIds.add(doc.id);
        });

        snapshot2.forEach((doc) => {
            if (!seenIds.has(doc.id)) {
                exchanges.push({ id: doc.id, ...doc.data() });
            }
        });

        // Sort by completedAt or createdAt
        exchanges.sort((a, b) => {
            const dateA = a.completedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.completedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });

        return exchanges;
    } catch (error) {
        console.error('Error fetching completed exchanges:', error);
        return [];
    }
};

// Update exchange status
export const updateExchangeStatus = async (exchangeId, status) => {
    const docRef = doc(db, EXCHANGES_COLLECTION, exchangeId);
    const updates = {
        status,
        updatedAt: serverTimestamp(),
    };

    if (status === 'completed') {
        updates.completedAt = serverTimestamp();
    }

    await updateDoc(docRef, updates);
};

// Accept an exchange
export const acceptExchange = async (exchangeId) => {
    await updateExchangeStatus(exchangeId, 'accepted');
};

// Decline an exchange
export const declineExchange = async (exchangeId) => {
    await updateExchangeStatus(exchangeId, 'declined');
};

// Cancel an exchange (by proposer)
export const cancelExchange = async (exchangeId) => {
    await updateExchangeStatus(exchangeId, 'cancelled');
};

// Complete an exchange
export const completeExchange = async (exchangeId) => {
    await updateExchangeStatus(exchangeId, 'completed');
};

// Calculate price difference between two items
export const calculatePriceDifference = (item1Price, item2Price) => {
    return Math.abs(item1Price - item2Price);
};

// Determine who pays the difference
export const getPaymentDirection = (proposerItemPrice, receiverItemPrice) => {
    const diff = receiverItemPrice - proposerItemPrice;
    if (diff > 0) {
        return { payer: 'proposer', amount: diff };
    } else if (diff < 0) {
        return { payer: 'receiver', amount: Math.abs(diff) };
    }
    return { payer: 'none', amount: 0 };
};

// Delete an exchange
export const deleteExchange = async (exchangeId) => {
    const docRef = doc(db, EXCHANGES_COLLECTION, exchangeId);
    await deleteDoc(docRef);
};

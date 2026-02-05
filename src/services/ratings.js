import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const RATINGS_COLLECTION = 'ratings';

// Create a new rating
export const createRating = async (ratingData) => {
    const rating = {
        ...ratingData,
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, RATINGS_COLLECTION), rating);

    // Update the rated user's average rating
    await updateUserRating(ratingData.ratedUserId);

    return { id: docRef.id, ...rating };
};

// Check if user has already rated for a specific exchange
export const hasRatedExchange = async (exchangeId, raterId) => {
    const q = query(
        collection(db, RATINGS_COLLECTION),
        where('exchangeId', '==', exchangeId),
        where('raterId', '==', raterId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

// Get ratings for a user
export const getUserRatings = async (userId) => {
    const q = query(
        collection(db, RATINGS_COLLECTION),
        where('ratedUserId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const ratings = [];

    snapshot.forEach((doc) => {
        ratings.push({ id: doc.id, ...doc.data() });
    });

    // Sort by creation date (newest first)
    ratings.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
    });

    return ratings;
};

// Calculate and update user's average rating
export const updateUserRating = async (userId) => {
    const ratings = await getUserRatings(userId);

    if (ratings.length === 0) {
        return { rating: 0, ratingCount: 0 };
    }

    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / ratings.length;

    // Update user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        rating: averageRating,
        ratingCount: ratings.length,
    });

    return { rating: averageRating, ratingCount: ratings.length };
};

// Get rating given by a user for an exchange
export const getRatingForExchange = async (exchangeId, raterId) => {
    const q = query(
        collection(db, RATINGS_COLLECTION),
        where('exchangeId', '==', exchangeId),
        where('raterId', '==', raterId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
};

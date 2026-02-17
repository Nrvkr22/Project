import { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                // Fetch user profile from Firestore
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    setUserProfile(userDoc.data());
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const register = async (email, password, name, phone, location) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Update display name
        await updateProfile(firebaseUser, { displayName: name });

        // Create user profile in Firestore
        const userProfileData = {
            uid: firebaseUser.uid,
            email,
            name,
            phone,
            location,
            profileImage: null,
            rating: 0,
            ratingCount: 0,
            createdAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), userProfileData);
        setUserProfile(userProfileData);

        return firebaseUser;
    };

    const login = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
    };

    const resetPassword = async (email) => {
        await sendPasswordResetEmail(auth, email);
    };

    const updateUserProfile = async (updates) => {
        if (!user) throw new Error('No user logged in');

        await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
        setUserProfile((prev) => ({ ...prev, ...updates }));
    };

    const refreshUserProfile = async () => {
        if (!user) return;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            setUserProfile(userDoc.data());
        }
    };

    const value = {
        user,
        userProfile,
        loading,
        register,
        login,
        logout,
        resetPassword,
        updateUserProfile,
        refreshUserProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

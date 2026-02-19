import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getUserItems } from '../services/items';
import { getCompletedExchanges } from '../services/exchanges';
import { getUserRatings } from '../services/ratings';
import { uploadImage } from '../services/cloudinary';
import { indianCities } from '../utils/constants';
import { formatDate, formatPrice } from '../utils/helpers';
import './Profile.css';

const Profile = () => {
    const { userId } = useParams();
    const { user, userProfile, updateUserProfile } = useAuth();
    const isOwnProfile = !userId || userId === user?.uid;

    const [profile, setProfile] = useState(null);
    const [userItems, setUserItems] = useState([]);
    const [completedExchanges, setCompletedExchanges] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        location: '',
    });

    useEffect(() => {
        fetchProfile();
    }, [userId, user]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            let profileData;
            const targetId = userId || user?.uid;

            if (isOwnProfile && userProfile) {
                profileData = userProfile;
            } else if (targetId) {
                const docSnap = await getDoc(doc(db, 'users', targetId));
                if (docSnap.exists()) {
                    profileData = docSnap.data();
                }
            }

            if (profileData) {
                setProfile(profileData);
                setFormData({
                    name: profileData.name || '',
                    phone: profileData.phone || '',
                    location: profileData.location || '',
                });

                // Fetch user's active items, completed exchanges, and ratings
                const [items, exchanges, userRatings] = await Promise.all([
                    getUserItems(targetId, 'active'),
                    getCompletedExchanges(targetId),
                    getUserRatings(targetId),
                ]);
                setUserItems(items);
                setCompletedExchanges(exchanges);
                setRatings(userRatings);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSaving(true);
        try {
            const result = await uploadImage(file);
            await updateUserProfile({ profileImage: result.url });
            setProfile((prev) => ({ ...prev, profileImage: result.url }));
        } catch (error) {
            console.error('Error uploading image:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUserProfile(formData);
            setProfile((prev) => ({ ...prev, ...formData }));
            setEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-page page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="profile-page page">
                <div className="empty-state">
                    <span className="empty-icon">👤</span>
                    <h3>Profile Not Found</h3>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page page">
            <div className="profile-header">
                <div className="profile-card">
                    <div className="profile-avatar">
                        {profile.profileImage ? (
                            <img src={profile.profileImage} alt={profile.name} />
                        ) : (
                            <span>{profile.name?.charAt(0) || 'U'}</span>
                        )}
                        {isOwnProfile && (
                            <label className="avatar-edit">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    hidden
                                />

                            </label>
                        )}
                    </div>

                    {editing ? (
                        <div className="profile-edit-form">
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>City</label>
                                <select
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                >
                                    {indianCities.map((city) => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="edit-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setEditing(false)}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="profile-info">
                            <h1>{profile.name}</h1>
                            <p className="profile-location">📍 {profile.location}</p>
                            {profile.rating > 0 && (
                                <p className="profile-rating">
                                    ⭐ {profile.rating.toFixed(1)} ({profile.ratingCount} reviews)
                                </p>
                            )}
                            <p className="profile-joined">
                                Member since {formatDate(profile.createdAt)}
                            </p>
                            {isOwnProfile && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setEditing(true)}
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="profile-content">
                <h2>{isOwnProfile ? 'My Listings' : `${profile.name}'s Listings`}</h2>

                {userItems.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📦</span>
                        <h3>No listings yet</h3>
                    </div>
                ) : (
                    <div className="profile-items-grid">
                        {userItems.map((item) => (
                            <a key={item.id} href={`/item/${item.id}`} className="item-card">
                                <div className="item-image">
                                    <img src={item.images?.[0]} alt={item.title} />
                                </div>
                                <div className="item-info">
                                    <h3 className="item-title">{item.title}</h3>
                                    <p className="item-price">{formatPrice(item.price)}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {/* Completed Exchanges Section */}
            <div className="profile-content">
                <h2>Completed Exchanges</h2>
                {completedExchanges.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">🔄</span>
                        <h3>No completed exchanges yet</h3>
                    </div>
                ) : (
                    <div className="exchanges-list">
                        {completedExchanges.map((ex) => {
                            const isProposer = ex.proposerId === (userId || user?.uid);
                            const exchangeRating = ratings.find(r => r.exchangeId === ex.id && r.ratedUserId === (userId || user?.uid));
                            return (
                                <div key={ex.id} className="exchange-history-card">
                                    <div className="exchange-history-items">
                                        <div className="exchange-history-item">
                                            <span className="exchange-history-label">Gave</span>
                                            <span className="exchange-history-title">
                                                {isProposer ? ex.proposerItemTitle : ex.receiverItemTitle}
                                            </span>
                                        </div>
                                        <span className="exchange-history-arrow">⇄</span>
                                        <div className="exchange-history-item">
                                            <span className="exchange-history-label">Received</span>
                                            <span className="exchange-history-title">
                                                {isProposer ? ex.receiverItemTitle : ex.proposerItemTitle}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="exchange-history-meta">
                                        {exchangeRating && (
                                            <span className="exchange-history-rating">
                                                {'⭐'.repeat(exchangeRating.rating)}
                                            </span>
                                        )}
                                        <span className="exchange-history-date">
                                            {formatDate(ex.completedAt || ex.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>


        </div>
    );
};

export default Profile;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserItems } from '../services/items';
import { formatPrice, formatDate } from '../utils/helpers';
import './Dashboard.css';

const Dashboard = () => {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('listings');
    const [myItems, setMyItems] = useState([]);
    const [soldItems, setSoldItems] = useState([]);
    const [exchangedItems, setExchangedItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user]);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            const [active, sold, exchanged] = await Promise.all([
                getUserItems(user.uid, 'active'),
                getUserItems(user.uid, 'sold'),
                getUserItems(user.uid, 'exchanged'),
            ]);
            setMyItems(active);
            setSoldItems(sold);
            setExchangedItems(exchanged);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'listings', label: 'My Listings', count: myItems.length },
        { id: 'sold', label: 'Sold Items', count: soldItems.length },
        { id: 'exchanged', label: 'Exchanged', count: exchangedItems.length },
    ];

    const getActiveItems = () => {
        switch (activeTab) {
            case 'sold':
                return soldItems;
            case 'exchanged':
                return exchangedItems;
            default:
                return myItems;
        }
    };

    return (
        <div className="dashboard-page page">
            <div className="dashboard-header">
                <div className="dashboard-welcome">
                    <div className="user-avatar-large">
                        {userProfile?.profileImage ? (
                            <img src={userProfile.profileImage} alt={userProfile.name} />
                        ) : (
                            <span>{userProfile?.name?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                    <div>
                        <h1>Welcome, {userProfile?.name || 'User'}!</h1>
                        <p>Manage your listings and track your exchanges</p>
                    </div>
                </div>

                <Link to="/create-listing" className="btn btn-primary">
                    + New Listing
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="dashboard-stats">
                <div className="stat-card">
                    <span className="stat-icon">📦</span>
                    <div>
                        <h3>{myItems.length}</h3>
                        <p>Active Listings</p>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">💰</span>
                    <div>
                        <h3>{soldItems.length}</h3>
                        <p>Items Sold</p>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">🔄</span>
                    <div>
                        <h3>{exchangedItems.length}</h3>
                        <p>Exchanges</p>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">⭐</span>
                    <div>
                        <h3>{userProfile?.rating?.toFixed(1) || '0.0'}</h3>
                        <p>Rating</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="dashboard-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                        <span className="tab-count">{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Items List */}
            <div className="dashboard-content">
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading...</p>
                    </div>
                ) : getActiveItems().length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">
                            {activeTab === 'listings' ? '📦' : activeTab === 'sold' ? '💰' : '🔄'}
                        </span>
                        <h3>
                            {activeTab === 'listings'
                                ? "You haven't listed any items yet"
                                : activeTab === 'sold'
                                    ? "You haven't sold any items yet"
                                    : "You haven't exchanged any items yet"}
                        </h3>
                        {activeTab === 'listings' && (
                            <Link to="/create-listing" className="btn btn-primary">
                                Create Your First Listing
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="items-list">
                        {getActiveItems().map((item) => (
                            <DashboardItemCard key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const DashboardItemCard = ({ item }) => {
    const mainImage = item.images?.[0] || 'https://via.placeholder.com/200x150?text=No+Image';

    return (
        <div className="dashboard-item-card">
            <div className="item-image-small">
                <img src={mainImage} alt={item.title} />
            </div>
            <div className="item-details">
                <h3>{item.title}</h3>
                <p className="item-price">{formatPrice(item.price)}</p>
                <div className="item-meta">
                    <span className="badge badge-primary">{item.category}</span>
                    <span className="item-date">{formatDate(item.createdAt)}</span>
                </div>
            </div>
            <div className="item-actions-list">
                <Link to={`/item/${item.id}`} className="action-btn">View</Link>
                {item.status === 'active' && (
                    <Link to={`/edit-listing/${item.id}`} className="action-btn">Edit</Link>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

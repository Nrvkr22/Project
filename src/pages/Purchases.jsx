import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getReceivedPurchases,
    getSentPurchases,
    confirmPurchase,
    declinePurchase,
    cancelPurchase,
    completePurchase
} from '../services/purchases';
import { markItemAsSold } from '../services/items';
import { formatPrice, formatDate } from '../utils/helpers';
import './Purchases.css';

const Purchases = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('received');
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        if (user) {
            fetchPurchases();
        }
    }, [user, activeTab]);

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            let data;
            if (activeTab === 'received') {
                // Seller sees incoming buy requests
                data = await getReceivedPurchases(user.uid);
            } else {
                // Buyer sees their purchase requests / orders
                data = await getSentPurchases(user.uid);
            }
            setPurchases(data);
        } catch (error) {
            console.error('Error fetching purchases:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (purchaseId) => {
        setActionLoading(purchaseId);
        try {
            await confirmPurchase(purchaseId);
            fetchPurchases();
        } catch (error) {
            console.error('Error confirming purchase:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDecline = async (purchaseId) => {
        setActionLoading(purchaseId);
        try {
            await declinePurchase(purchaseId);
            fetchPurchases();
        } catch (error) {
            console.error('Error declining purchase:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (purchaseId) => {
        setActionLoading(purchaseId);
        try {
            await cancelPurchase(purchaseId);
            fetchPurchases();
        } catch (error) {
            console.error('Error cancelling purchase:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleComplete = async (purchase) => {
        setActionLoading(purchase.id);
        try {
            await completePurchase(purchase.id);
            await markItemAsSold(purchase.itemId);
            fetchPurchases();
        } catch (error) {
            console.error('Error completing purchase:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const tabs = [
        { id: 'received', label: 'Buy Requests' },
        { id: 'sent', label: 'My Orders' },
    ];

    return (
        <div className="purchases-page page">
            <div className="page-header">
                <h1>Purchases</h1>
                <p>Manage buy requests and orders</p>
            </div>

            <div className="purchases-content">
                <div className="purchases-tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading...</p>
                    </div>
                ) : purchases.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">🛒</span>
                        <h3>No {activeTab === 'received' ? 'buy requests' : 'orders'} yet</h3>
                        <p>
                            {activeTab === 'received'
                                ? "You haven't received any buy requests"
                                : "You haven't placed any orders"}
                        </p>
                        <Link to="/browse" className="btn btn-primary">
                            Browse Items
                        </Link>
                    </div>
                ) : (
                    <div className="purchases-list">
                        {purchases.map((purchase) => (
                            <PurchaseCard
                                key={purchase.id}
                                purchase={purchase}
                                isReceived={activeTab === 'received'}
                                onConfirm={handleConfirm}
                                onDecline={handleDecline}
                                onCancel={handleCancel}
                                onComplete={handleComplete}
                                actionLoading={actionLoading}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const PurchaseCard = ({
    purchase,
    isReceived,
    onConfirm,
    onDecline,
    onCancel,
    onComplete,
    actionLoading
}) => {
    const isLoading = actionLoading === purchase.id;

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'badge-warning', text: '⏳ Pending' },
            confirmed: { class: 'badge-success', text: '✅ Confirmed' },
            declined: { class: 'badge-danger', text: '❌ Declined' },
            cancelled: { class: 'badge-muted', text: '🚫 Cancelled' },
            completed: { class: 'badge-primary', text: '🎉 Completed' },
        };
        return badges[status] || { class: '', text: status };
    };

    const badge = getStatusBadge(purchase.status);

    return (
        <div className="purchase-card">
            <div className="purchase-item">
                <img src={purchase.itemImage} alt={purchase.itemTitle} />
                <div className="purchase-item-info">
                    <h4>{purchase.itemTitle}</h4>
                    <p className="price">{formatPrice(purchase.itemPrice)}</p>
                    <span className="buyer-info">
                        {isReceived ? `Buyer: ${purchase.buyerName}` : 'Your order'}
                    </span>
                </div>
            </div>

            <div className="purchase-footer">
                <div className="purchase-meta">
                    <span className={`badge ${badge.class}`}>{badge.text}</span>
                    <span className="purchase-date">{formatDate(purchase.createdAt)}</span>
                </div>

                <div className="purchase-actions">
                    {isReceived && purchase.status === 'pending' && (
                        <>
                            <button
                                className="btn btn-success btn-sm"
                                onClick={() => onConfirm(purchase.id)}
                                disabled={isLoading}
                            >
                                {isLoading ? '...' : '✓ Confirm'}
                            </button>
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={() => onDecline(purchase.id)}
                                disabled={isLoading}
                            >
                                {isLoading ? '...' : '✗ Decline'}
                            </button>
                        </>
                    )}

                    {isReceived && purchase.status === 'confirmed' && (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onComplete(purchase)}
                            disabled={isLoading}
                        >
                            {isLoading ? '...' : '🎉 Mark Sold'}
                        </button>
                    )}

                    {!isReceived && purchase.status === 'pending' && (
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onCancel(purchase.id)}
                            disabled={isLoading}
                        >
                            {isLoading ? '...' : 'Cancel'}
                        </button>
                    )}

                    {(purchase.status === 'pending' || purchase.status === 'confirmed') && (
                        <Link
                            to={`/chat?userId=${isReceived ? purchase.buyerId : purchase.sellerId}`}
                            className="btn btn-secondary btn-sm"
                        >
                            💬 Chat
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Purchases;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getReceivedExchanges,
    getSentExchanges,
    getCompletedExchanges,
    acceptExchange,
    declineExchange,
    cancelExchange,
    completeExchange
} from '../services/exchanges';
import { markItemAsExchanged } from '../services/items';
import { hasRatedExchange } from '../services/ratings';
import RateUser from '../components/ratings/RateUser';
import { formatPrice, formatDate } from '../utils/helpers';
import './Exchanges.css';

const Exchanges = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('received');
    const [exchanges, setExchanges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        if (user) {
            fetchExchanges();
        }
    }, [user, activeTab]);

    const fetchExchanges = async () => {
        setLoading(true);
        try {
            let data;
            if (activeTab === 'received') {
                // Get both pending and accepted exchanges (so user can mark as complete)
                const pending = await getReceivedExchanges(user.uid, 'pending');
                const accepted = await getReceivedExchanges(user.uid, 'accepted');
                data = [...pending, ...accepted];
                // Sort by date
                data.sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(0);
                    const dateB = b.createdAt?.toDate?.() || new Date(0);
                    return dateB - dateA;
                });
            } else if (activeTab === 'sent') {
                // Get all sent exchanges (show status of each)
                const allSent = await getSentExchanges(user.uid);
                // Filter to show pending and accepted only (not completed/cancelled)
                data = allSent.filter(e => e.status === 'pending' || e.status === 'accepted');
            } else {
                data = await getCompletedExchanges(user.uid);
            }
            setExchanges(data);
        } catch (error) {
            console.error('Error fetching exchanges:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (exchangeId) => {
        setActionLoading(exchangeId);
        try {
            await acceptExchange(exchangeId);
            fetchExchanges();
        } catch (error) {
            console.error('Error accepting exchange:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDecline = async (exchangeId) => {
        setActionLoading(exchangeId);
        try {
            await declineExchange(exchangeId);
            fetchExchanges();
        } catch (error) {
            console.error('Error declining exchange:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (exchangeId) => {
        setActionLoading(exchangeId);
        try {
            await cancelExchange(exchangeId);
            fetchExchanges();
        } catch (error) {
            console.error('Error cancelling exchange:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleComplete = async (exchange) => {
        setActionLoading(exchange.id);
        try {
            await completeExchange(exchange.id);
            // Mark both items as exchanged
            await markItemAsExchanged(exchange.proposerItemId);
            await markItemAsExchanged(exchange.receiverItemId);
            fetchExchanges();
        } catch (error) {
            console.error('Error completing exchange:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const tabs = [
        { id: 'received', label: 'Received' },
        { id: 'sent', label: 'Sent' },
        { id: 'completed', label: 'Completed' },
    ];

    return (
        <div className="exchanges-page page">
            <div className="page-header">
                <h1>Exchange Requests</h1>
                <p>Manage your item exchange proposals</p>
            </div>

            <div className="exchanges-content">
                <div className="exchanges-tabs">
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
                        <p>Loading exchanges...</p>
                    </div>
                ) : exchanges.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">🔄</span>
                        <h3>No exchanges yet</h3>
                        <p>
                            {activeTab === 'received'
                                ? "You haven't received any exchange requests"
                                : activeTab === 'sent'
                                    ? "You haven't sent any exchange requests"
                                    : "You haven't completed any exchanges"}
                        </p>
                        <Link to="/browse" className="btn btn-primary">
                            Browse Items to Exchange
                        </Link>
                    </div>
                ) : (
                    <div className="exchanges-list">
                        {exchanges.map((exchange) => (
                            <ExchangeCard
                                key={exchange.id}
                                exchange={exchange}
                                currentUserId={user.uid}
                                isReceived={activeTab === 'received'}
                                isSent={activeTab === 'sent'}
                                isCompleted={activeTab === 'completed'}
                                onAccept={handleAccept}
                                onDecline={handleDecline}
                                onCancel={handleCancel}
                                onComplete={handleComplete}
                                actionLoading={actionLoading}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* How Exchange Works */}
            <div className="exchange-info-section">
                <h2 style={{ textAlign: 'center' }}>How Exchanges Work</h2>
                <div className="exchange-steps">
                    <div className="exchange-step">
                        <span className="step-number">1</span>
                        <h4>Find an Item</h4>
                        <p>Browse items and find something you want that's open for exchange</p>
                    </div>
                    <div className="exchange-step">
                        <span className="step-number">2</span>
                        <h4>Propose Exchange</h4>
                        <p>Offer one of your items. If there's a price difference, specify who pays</p>
                    </div>
                    <div className="exchange-step">
                        <span className="step-number">3</span>
                        <h4>Chat & Agree</h4>
                        <p>Discuss details with the other user and agree on terms</p>
                    </div>
                    <div className="exchange-step">
                        <span className="step-number">4</span>
                        <h4>Meet & Exchange</h4>
                        <p>Meet up safely, exchange items, and mark as complete</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ExchangeCard = ({
    exchange,
    currentUserId,
    isReceived,
    isSent,
    isCompleted,
    onAccept,
    onDecline,
    onCancel,
    onComplete,
    actionLoading
}) => {
    const [showRateModal, setShowRateModal] = useState(false);
    const [hasRated, setHasRated] = useState(false);
    const isLoading = actionLoading === exchange.id;

    useEffect(() => {
        if (isCompleted && currentUserId) {
            checkIfRated();
        }
    }, [isCompleted, currentUserId]);

    const checkIfRated = async () => {
        try {
            const rated = await hasRatedExchange(exchange.id, currentUserId);
            setHasRated(rated);
        } catch (err) {
            console.error('Error checking rating:', err);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'badge-warning', text: '⏳ Pending' },
            accepted: { class: 'badge-success', text: '✅ Accepted' },
            declined: { class: 'badge-danger', text: '❌ Declined' },
            cancelled: { class: 'badge-muted', text: '🚫 Cancelled' },
            completed: { class: 'badge-primary', text: '🎉 Completed' },
        };
        return badges[status] || { class: '', text: status };
    };

    const badge = getStatusBadge(exchange.status);

    return (
        <div className="exchange-card">
            <div className="exchange-items">
                <div className="exchange-item">
                    <img
                        src={isReceived ? exchange.proposerItemImage : exchange.receiverItemImage}
                        alt="Item"
                    />
                    <div className="exchange-item-info">
                        <h4>{isReceived ? exchange.proposerItemTitle : exchange.receiverItemTitle}</h4>
                        <p className="price">
                            {formatPrice(isReceived ? exchange.proposerItemPrice : exchange.receiverItemPrice)}
                        </p>
                        <span className="exchange-role">
                            {isReceived ? `From: ${exchange.proposerName}` : 'Their item'}
                        </span>
                    </div>
                </div>



                <div className="exchange-item">
                    <img
                        src={isReceived ? exchange.receiverItemImage : exchange.proposerItemImage}
                        alt="Item"
                    />
                    <div className="exchange-item-info">
                        <h4>{isReceived ? exchange.receiverItemTitle : exchange.proposerItemTitle}</h4>
                        <p className="price">
                            {formatPrice(isReceived ? exchange.receiverItemPrice : exchange.proposerItemPrice)}
                        </p>
                        <span className="exchange-role">Your item</span>
                    </div>
                </div>
            </div>

            {exchange.priceDifference > 0 && (
                <div className="price-diff-badge">
                    💰 Price difference: {formatPrice(exchange.priceDifference)}
                    {exchange.additionalCash > 0 && (
                        <span> + {formatPrice(exchange.additionalCash)} cash offered</span>
                    )}
                </div>
            )}

            {exchange.message && (
                <div className="exchange-message">
                    <strong>Message:</strong> {exchange.message}
                </div>
            )}

            <div className="exchange-footer">
                <div className="exchange-meta">
                    <span className={`badge ${badge.class}`}>{badge.text}</span>
                    <span className="exchange-date">{formatDate(exchange.createdAt)}</span>
                </div>

                <div className="exchange-actions">
                    {isReceived && exchange.status === 'pending' && (
                        <>
                            <button
                                className="btn btn-success btn-sm"
                                onClick={() => onAccept(exchange.id)}
                                disabled={isLoading}
                            >
                                {isLoading ? '...' : '✓ Accept'}
                            </button>
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={() => onDecline(exchange.id)}
                                disabled={isLoading}
                            >
                                {isLoading ? '...' : '✗ Decline'}
                            </button>
                        </>
                    )}

                    {isReceived && exchange.status === 'accepted' && (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onComplete(exchange)}
                            disabled={isLoading}
                        >
                            {isLoading ? '...' : '🎉 Mark Complete'}
                        </button>
                    )}

                    {isSent && exchange.status === 'pending' && (
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onCancel(exchange.id)}
                            disabled={isLoading}
                        >
                            {isLoading ? '...' : 'Cancel'}
                        </button>
                    )}

                    {(exchange.status === 'accepted' || exchange.status === 'pending') && (
                        <Link
                            to={`/chat?userId=${isReceived ? exchange.proposerId : exchange.receiverId}`}
                            className="btn btn-secondary btn-sm"
                        >
                            💬 Chat
                        </Link>
                    )}

                    {isCompleted && !hasRated && (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowRateModal(true)}
                        >
                            ⭐ Rate
                        </button>
                    )}

                    {isCompleted && hasRated && (
                        <span className="rated-badge">✓ Rated</span>
                    )}
                </div>
            </div>

            {showRateModal && (
                <RateUser
                    exchange={exchange}
                    currentUserId={currentUserId}
                    onClose={() => setShowRateModal(false)}
                    onSuccess={() => {
                        setHasRated(true);
                    }}
                />
            )}
        </div>
    );
};

export default Exchanges;


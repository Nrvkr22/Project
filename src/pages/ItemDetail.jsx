import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getItem, deleteItem } from '../services/items';
import { createPurchaseRequest, hasPendingPurchase } from '../services/purchases';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { formatPrice, formatDate } from '../utils/helpers';
import ProposeExchange from '../components/exchange/ProposeExchange';
import './ItemDetail.css';

const ItemDetail = () => {
    const { itemId } = useParams();
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();

    const [item, setItem] = useState(null);
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showBuyConfirm, setShowBuyConfirm] = useState(false);
    const [buyLoading, setBuyLoading] = useState(false);
    const [hasPendingBuy, setHasPendingBuy] = useState(false);

    useEffect(() => {
        fetchItemAndSeller();
    }, [itemId]);

    useEffect(() => {
        checkPendingPurchase();
    }, [user, itemId]);

    const fetchItemAndSeller = async () => {
        try {
            const itemData = await getItem(itemId);
            if (itemData) {
                setItem(itemData);

                // Fetch seller info
                const sellerDoc = await getDoc(doc(db, 'users', itemData.userId));
                if (sellerDoc.exists()) {
                    setSeller({ id: sellerDoc.id, ...sellerDoc.data() });
                }
            }
        } catch (error) {
            console.error('Error fetching item:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkPendingPurchase = async () => {
        if (user && itemId) {
            try {
                const pending = await hasPendingPurchase(itemId, user.uid);
                setHasPendingBuy(pending);
            } catch (err) {
                console.error('Error checking pending purchase:', err);
            }
        }
    };

    const handleDelete = async () => {
        try {
            await deleteItem(itemId);
            navigate('/dashboard');
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const handleBuyRequest = async () => {
        setBuyLoading(true);
        try {
            await createPurchaseRequest({
                itemId: item.id,
                itemTitle: item.title,
                itemImage: item.images?.[0] || '',
                itemPrice: item.price,
                buyerId: user.uid,
                buyerName: userProfile?.name || 'Buyer',
                sellerId: item.userId,
            });
            setHasPendingBuy(true);
            setShowBuyConfirm(false);
            alert('Buy request sent! The seller will be notified.');
        } catch (error) {
            console.error('Error sending buy request:', error);
            alert('Failed to send buy request. Please try again.');
        } finally {
            setBuyLoading(false);
        }
    };

    const isOwner = user && item && user.uid === item.userId;

    if (loading) {
        return (
            <div className="item-detail-page page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading item...</p>
                </div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="item-detail-page page">
                <div className="empty-state">
                    <span className="empty-icon">🔍</span>
                    <h3>Item Not Found</h3>
                    <p>This item may have been removed or doesn't exist.</p>
                    <Link to="/browse" className="btn btn-primary">Browse Items</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="item-detail-page page">
            <div className="item-detail-container">
                {/* Image Gallery */}
                <div className="item-gallery">
                    <div className="main-image">
                        <img
                            src={item.images?.[activeImage] || 'https://via.placeholder.com/600x400?text=No+Image'}
                            alt={item.title}
                        />
                        {item.exchangeType !== 'sell_only' && (
                            <span className="exchange-badge-large">🔄 Open to Exchange</span>
                        )}
                    </div>
                    {item.images?.length > 1 && (
                        <div className="thumbnail-list">
                            {item.images.map((img, index) => (
                                <button
                                    key={index}
                                    className={`thumbnail ${activeImage === index ? 'active' : ''}`}
                                    onClick={() => setActiveImage(index)}
                                >
                                    <img src={img} alt={`${item.title} ${index + 1}`} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Item Info */}
                <div className="item-info-section">
                    <div className="item-header">
                        <h1>{item.title}</h1>
                        <p className="item-price-large">{formatPrice(item.price)}</p>
                    </div>

                    <div className="item-badges">
                        <span className="badge badge-primary">{item.category}</span>
                        <span className="badge badge-success">{item.condition}</span>
                        <span className="badge">📍 {item.location}</span>
                    </div>

                    <div className="item-description">
                        <h3>Description</h3>
                        <p>{item.description}</p>
                    </div>

                    <div className="item-meta-info">
                        <p>Posted {formatDate(item.createdAt)}</p>
                    </div>

                    {/* Seller Info */}
                    {seller && (
                        <div className="seller-card">
                            <div className="seller-avatar">
                                {seller.profileImage ? (
                                    <img src={seller.profileImage} alt={seller.name} />
                                ) : (
                                    <span>{seller.name?.charAt(0) || 'U'}</span>
                                )}
                            </div>
                            <div className="seller-info">
                                <h4>{seller.name}</h4>
                                <p>📍 {seller.location}</p>
                                {seller.rating > 0 && (
                                    <p className="seller-rating">
                                        ⭐ {seller.rating.toFixed(1)} ({seller.ratingCount} reviews)
                                    </p>
                                )}
                            </div>
                            <Link to={`/profile/${seller.id}`} className="view-profile-btn">
                                View Profile
                            </Link>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="item-actions">
                        {isOwner ? (
                            <>
                                <Link to={`/edit-listing/${item.id}`} className="btn btn-secondary">
                                    ✏️ Edit
                                </Link>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    🗑️ Delete
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Buy Button - for sell_only or open_to_exchange */}
                                {user && item.exchangeType !== 'exchange_only' && (
                                    hasPendingBuy ? (
                                        <button className="btn btn-secondary" disabled>
                                            ⏳ Buy Request Pending
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-success"
                                            onClick={() => setShowBuyConfirm(true)}
                                        >
                                            🛒 Buy Now
                                        </button>
                                    )
                                )}

                                {/* Exchange Button - for exchange_only or open_to_exchange */}
                                {user && item.exchangeType !== 'sell_only' && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setShowExchangeModal(true)}
                                    >
                                        🔄 Propose Exchange
                                    </button>
                                )}

                                {user && seller && (
                                    <Link to={`/chat?userId=${seller.id}&itemId=${item.id}`} className="btn btn-secondary">
                                        💬 Chat with Seller
                                    </Link>
                                )}
                                {!user && (
                                    <Link to="/login" className="btn btn-primary">
                                        Login to Contact Seller
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Listing?</h3>
                        <p>This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={handleDelete}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Buy Confirmation Modal */}
            {showBuyConfirm && (
                <div className="modal-overlay" onClick={() => setShowBuyConfirm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>🛒 Confirm Purchase</h3>
                        <div className="buy-confirm-item">
                            <img src={item.images?.[0]} alt={item.title} />
                            <div>
                                <h4>{item.title}</h4>
                                <p className="price">{formatPrice(item.price)}</p>
                            </div>
                        </div>
                        <p>Send a buy request to the seller. They will confirm and you can arrange payment & delivery via chat.</p>
                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowBuyConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={handleBuyRequest}
                                disabled={buyLoading}
                            >
                                {buyLoading ? 'Sending...' : 'Send Buy Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Exchange Modal */}
            {showExchangeModal && (
                <ProposeExchange
                    targetItem={item}
                    onClose={() => setShowExchangeModal(false)}
                    onSuccess={() => {
                        alert('Exchange proposal sent successfully!');
                    }}
                />
            )}
        </div>
    );
};

export default ItemDetail;


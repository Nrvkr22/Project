import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserItems } from '../../services/items';
import { createExchange, getPaymentDirection } from '../../services/exchanges';
import { formatPrice } from '../../utils/helpers';
import './ProposeExchange.css';

const ProposeExchange = ({ targetItem, onClose, onSuccess }) => {
    const { user, userProfile } = useAuth();
    const [myItems, setMyItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [additionalCash, setAdditionalCash] = useState(0);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMyItems();
    }, [user]);

    const fetchMyItems = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const items = await getUserItems(user.uid, 'active');
            // Filter out the target item if user owns it (shouldn't happen, but safety)
            const exchangeableItems = items.filter(
                (item) => item.id !== targetItem.id &&
                    (item.exchangeType === 'open_to_exchange' || item.exchangeType === 'exchange_only')
            );
            setMyItems(exchangeableItems);
        } catch (err) {
            console.error('Error fetching items:', err);
            setError('Failed to load your items');
        } finally {
            setLoading(false);
        }
    };

    const handleItemSelect = (item) => {
        setSelectedItem(item);
        // Calculate suggested additional cash based on price difference
        const priceDiff = targetItem.price - item.price;
        setAdditionalCash(priceDiff > 0 ? priceDiff : 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedItem) {
            setError('Please select an item to offer');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const paymentInfo = getPaymentDirection(selectedItem.price, targetItem.price);

            const exchangeData = {
                // Proposer info
                proposerId: user.uid,
                proposerName: userProfile?.name || 'Unknown',
                proposerItemId: selectedItem.id,
                proposerItemTitle: selectedItem.title,
                proposerItemImage: selectedItem.images?.[0] || '',
                proposerItemPrice: selectedItem.price,

                // Receiver info
                receiverId: targetItem.userId,
                receiverItemId: targetItem.id,
                receiverItemTitle: targetItem.title,
                receiverItemImage: targetItem.images?.[0] || '',
                receiverItemPrice: targetItem.price,

                // Exchange details
                additionalCash: parseFloat(additionalCash) || 0,
                priceDifference: Math.abs(targetItem.price - selectedItem.price),
                paymentDirection: paymentInfo.payer,
                message: message.trim(),
            };

            await createExchange(exchangeData);
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('Error creating exchange:', err);
            setError('Failed to send exchange proposal. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const priceDiff = selectedItem ? targetItem.price - selectedItem.price : 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content propose-exchange-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Propose Exchange</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="exchange-preview">
                    <div className="exchange-side">
                        <span className="exchange-label">You want</span>
                        <div className="exchange-item-card">
                            <img src={targetItem.images?.[0]} alt={targetItem.title} />
                            <div>
                                <h4>{targetItem.title}</h4>
                                <p className="price">{formatPrice(targetItem.price)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="exchange-arrow">🔄</div>

                    <div className="exchange-side">
                        <span className="exchange-label">You offer</span>
                        {selectedItem ? (
                            <div className="exchange-item-card selected">
                                <img src={selectedItem.images?.[0]} alt={selectedItem.title} />
                                <div>
                                    <h4>{selectedItem.title}</h4>
                                    <p className="price">{formatPrice(selectedItem.price)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="exchange-item-card placeholder">
                                <span>Select an item below</span>
                            </div>
                        )}
                    </div>
                </div>

                {selectedItem && priceDiff !== 0 && (
                    <div className="price-difference-info">
                        {priceDiff > 0 ? (
                            <p>💰 You'll pay <strong>{formatPrice(priceDiff)}</strong> extra</p>
                        ) : (
                            <p>💰 You'll receive <strong>{formatPrice(Math.abs(priceDiff))}</strong> extra</p>
                        )}
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h3>Select Your Item to Offer</h3>
                        {loading ? (
                            <div className="loading-items">
                                <div className="spinner"></div>
                                <p>Loading your items...</p>
                            </div>
                        ) : myItems.length === 0 ? (
                            <div className="no-items-message">
                                <p>You don't have any items available for exchange.</p>
                                <p>List an item marked "Open to Exchange" first!</p>
                            </div>
                        ) : (
                            <div className="my-items-grid">
                                {myItems.map((item) => (
                                    <button
                                        type="button"
                                        key={item.id}
                                        className={`my-item-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                                        onClick={() => handleItemSelect(item)}
                                    >
                                        <img src={item.images?.[0]} alt={item.title} />
                                        <h4>{item.title}</h4>
                                        <p>{formatPrice(item.price)}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Additional Cash Offer (optional)</label>
                        <input
                            type="number"
                            min="0"
                            value={additionalCash}
                            onChange={(e) => setAdditionalCash(e.target.value)}
                            placeholder="0"
                        />
                        <span className="input-hint">Offer extra cash to make your proposal more attractive</span>
                    </div>

                    <div className="form-group">
                        <label>Message (optional)</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Hi! I'd like to exchange my item for yours..."
                            rows={3}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!selectedItem || submitting || myItems.length === 0}
                        >
                            {submitting ? 'Sending...' : 'Send Proposal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProposeExchange;

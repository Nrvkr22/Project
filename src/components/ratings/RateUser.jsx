import { useState } from 'react';
import { createRating } from '../../services/ratings';
import './RateUser.css';

const RateUser = ({ exchange, currentUserId, onClose, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Determine who we're rating
    const isProposer = exchange.proposerId === currentUserId;
    const ratedUserId = isProposer ? exchange.receiverId : exchange.proposerId;
    const ratedUserName = isProposer ? 'the seller' : exchange.proposerName;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await createRating({
                exchangeId: exchange.id,
                raterId: currentUserId,
                ratedUserId: ratedUserId,
                rating: rating,
                exchangeItemTitle: isProposer ? exchange.receiverItemTitle : exchange.proposerItemTitle,
            });

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('Error submitting rating:', err);
            setError('Failed to submit rating. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content rate-user-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Rate Your Experience</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="rating-prompt">
                    <p>How was your exchange experience with {ratedUserName}?</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="star-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                type="button"
                                key={star}
                                className={`star ${star <= (hoverRating || rating) ? 'active' : ''}`}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    <p className="rating-label">
                        {rating === 0 && 'Select a rating'}
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent!'}
                    </p>


                    {error && <div className="error-message">{error}</div>}

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting || rating === 0}
                        >
                            {submitting ? 'Submitting...' : 'Submit Rating'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RateUser;

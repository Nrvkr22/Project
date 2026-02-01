import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatDate } from '../utils/helpers';
import './Exchanges.css';

const Exchanges = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('received');
    const [exchanges, setExchanges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Placeholder - will be implemented in Phase 3
        setLoading(false);
        setExchanges([]);
    }, [user, activeTab]);

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
                        {/* Exchange cards will be rendered here */}
                    </div>
                )}
            </div>

            {/* How Exchange Works */}
            <div className="exchange-info-section">
                <h2>How Exchanges Work</h2>
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
                        <p>Meet up safely, exchange items, and rate each other</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Exchanges;

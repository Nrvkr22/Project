import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { categories } from '../utils/constants';
import './Home.css';

const Home = () => {
    const { user } = useAuth();

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1>
                        Buy, Sell & <span className="hero-highlight">Exchange</span>
                        <br />Items With Ease
                    </h1>
                    <p>
                        Join thousands of users trading items in your city.
                        Exchange what you have for what you need, or just find great deals.
                    </p>
                    <div className="hero-actions">
                        <Link to="/browse" className="btn btn-primary">
                            Start Browsing
                        </Link>
                        {!user && (
                            <Link to="/register" className="btn btn-secondary">
                                Create Account
                            </Link>
                        )}
                        {user && (
                            <Link to="/create-listing" className="btn btn-secondary">
                                List an Item
                            </Link>
                        )}
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="hero-card hero-card-1">
                        <span className="card-emoji">📱</span>
                        <span className="card-label">Electronics</span>
                    </div>
                    <div className="hero-card hero-card-2">
                        <span className="card-emoji">🎮</span>
                        <span className="card-label">Gaming</span>
                    </div>
                    <div className="hero-card hero-card-3">
                        <span className="card-emoji">👟</span>
                        <span className="card-label">Fashion</span>
                    </div>
                    <div className="exchange-arrow">🔄</div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <h2>How SwapSphere Works</h2>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h3>List Your Item</h3>
                        <p>Upload photos, add details, and set your price or exchange preference.</p>
                    </div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <h3>Connect</h3>
                        <p>Chat with buyers or propose exchanges with other sellers.</p>
                    </div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <h3>Deal Done</h3>
                        <p>Meet up, exchange items or complete the sale. Rate your experience.</p>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="categories-section">
                <h2>Browse by Category</h2>
                <div className="categories-grid">
                    {categories.slice(0, 10).map((category) => (
                        <Link
                            key={category}
                            to={`/browse?category=${encodeURIComponent(category)}`}
                            className="category-card"
                        >
                            <span className="category-icon">
                                {getCategoryIcon(category)}
                            </span>
                            <span className="category-name">{category}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Start Trading?</h2>
                    <p>Join SwapSphere today and discover great deals in your city.</p>
                    {!user ? (
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Get Started Free
                        </Link>
                    ) : (
                        <Link to="/create-listing" className="btn btn-primary btn-lg">
                            Post Your First Item
                        </Link>
                    )}
                </div>
            </section>
        </div>
    );
};

const getCategoryIcon = (category) => {
    const icons = {
        'Electronics': '📱',
        'Vehicles': '🚗',
        'Fashion': '👕',
        'Home & Garden': '🏠',
        'Sports': '⚽',
        'Books': '📚',
        'Gaming': '🎮',
        'Collectibles': '🏆',
        'Mobile Phones': '📲',
        'Laptops & Computers': '💻',
        'Other': '📦',
    };
    return icons[category] || '📦';
};

export default Home;

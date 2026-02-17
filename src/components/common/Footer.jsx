import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-main">
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <img src="../../logo.png" alt="SwapSphere" className="footer-logo-image" />
                            <span>SwapSphere</span>
                        </div>
                        <p>Buy, Sell & Exchange items with people in your city.</p>
                    </div>

                    <div className="footer-links">
                        <div className="footer-section">
                            <h4>Quick Links</h4>
                            <a href="/browse">Browse Items</a>
                            <a href="/create-listing">Sell Item</a>
                            <a href="/exchanges">My Exchanges</a>
                        </div>

                        <div className="footer-section">
                            <h4>Categories</h4>
                            <a href="/browse?category=Electronics">Electronics</a>
                            <a href="/browse?category=Fashion">Fashion</a>
                            <a href="/browse?category=Vehicles">Vehicles</a>
                            <a href="/browse?category=Gaming">Gaming</a>
                        </div>

                        <div className="footer-section">
                            <h4>Support</h4>
                            <a href="#">Help Center</a>
                            <a href="#">Safety Tips</a>
                            <a href="#">Contact Us</a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2026 SwapSphere. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

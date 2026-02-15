import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
            setMobileMenuOpen(false);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
                    <img src="/logo.png" alt="SwapSphere" className="logo-image" />
                    <span className="logo-text">SwapSphere</span>
                </Link>

                <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    <Link to="/browse" className="nav-link" onClick={closeMobileMenu}>Browse</Link>

                    {user ? (
                        <>
                            <Link to="/create-listing" className="nav-link nav-link-primary" onClick={closeMobileMenu}>
                                + Sell / Exchange
                            </Link>
                            <Link to="/exchanges" className="nav-link" onClick={closeMobileMenu}>Exchanges</Link>
                            <Link to="/purchases" className="nav-link" onClick={closeMobileMenu}>Purchases</Link>
                            <Link to="/chat" className="nav-link" onClick={closeMobileMenu}>Chat</Link>

                            {/* These only show on mobile */}
                            <Link to="/dashboard" className="nav-link mobile-only" onClick={closeMobileMenu}>Dashboard</Link>
                            <Link to="/profile" className="nav-link mobile-only" onClick={closeMobileMenu}>Profile</Link>
                            <button onClick={handleLogout} className="nav-link nav-logout mobile-only">
                                Logout
                            </button>
                        </>
                    ) : (
                        <div className="nav-auth">
                            <Link to="/login" className="nav-link" onClick={closeMobileMenu}>Login</Link>
                            <Link to="/register" className="nav-btn-register" onClick={closeMobileMenu}>Sign Up</Link>
                        </div>
                    )}
                </div>

                {/* Desktop User Avatar with Dropdown */}
                {user && (
                    <div className="nav-user desktop-only">
                        <Link to="/dashboard" className="nav-avatar">
                            {userProfile?.profileImage ? (
                                <img src={userProfile.profileImage} alt={userProfile.name} />
                            ) : (
                                <span>{userProfile?.name?.charAt(0) || 'U'}</span>
                            )}
                        </Link>
                        <div className="nav-dropdown">
                            <Link to="/dashboard" className="dropdown-item">Dashboard</Link>
                            <Link to="/profile" className="dropdown-item">Profile</Link>
                            <button onClick={handleLogout} className="dropdown-item dropdown-logout">
                                Logout
                            </button>
                        </div>
                    </div>
                )}

                {/* Mobile Menu Button */}
                <button
                    className={`nav-mobile-toggle ${mobileMenuOpen ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="mobile-overlay" onClick={closeMobileMenu}></div>
            )}
        </nav>
    );
};

export default Navbar;

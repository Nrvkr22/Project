import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, userProfile, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to="/" className="nav-logo">
                    <span className="logo-icon">🔄</span>
                    <span className="logo-text">SwapSphere</span>
                </Link>

                <div className="nav-links">
                    <Link to="/browse" className="nav-link">Browse</Link>

                    {user ? (
                        <>
                            <Link to="/create-listing" className="nav-link nav-link-primary">
                                + Sell / Exchange
                            </Link>
                            <Link to="/exchanges" className="nav-link">Exchanges</Link>
                            <Link to="/purchases" className="nav-link">Purchases</Link>
                            <Link to="/chat" className="nav-link">Chat</Link>
                            <div className="nav-user">
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
                        </>
                    ) : (
                        <div className="nav-auth">
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/register" className="nav-btn-register">Sign Up</Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button className="nav-mobile-toggle" id="mobile-toggle">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;

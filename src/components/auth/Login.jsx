import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
    const { login, resetPassword, resendVerificationEmail } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(location.state?.message || '');
    const [loading, setLoading] = useState(false);
    const [forgotPassword, setForgotPassword] = useState(false);
    const [unverified, setUnverified] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setUnverified(false);
        setLoading(true);

        try {
            const loggedInUser = await login(email, password);
            if (!loggedInUser.emailVerified) {
                setUnverified(true);
                setError('Please verify your email before signing in. Check your inbox for the verification link.');
                setLoading(false);
                return;
            }
            navigate(from, { replace: true });
        } catch (err) {
            console.error('Login error:', err);
            if (err.code === 'auth/invalid-credential') {
                setError('Invalid email or password');
            } else if (err.code === 'auth/user-not-found') {
                setError('No account found with this email');
            } else if (err.code === 'auth/wrong-password') {
                setError('Incorrect password');
            } else {
                setError('Failed to login. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await resetPassword(email);
            setSuccess('Password reset email sent! Check your inbox.');
        } catch (err) {
            console.error('Password reset error:', err);
            if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many requests. Please try again later.');
            } else {
                setError('Failed to send reset email. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const switchToForgotPassword = () => {
        setForgotPassword(true);
        setError('');
        setSuccess('');
    };

    const switchToLogin = () => {
        setForgotPassword(false);
        setError('');
        setSuccess('');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>{forgotPassword ? 'Reset Password' : 'Welcome Back'}</h1>
                    <p>
                        {forgotPassword
                            ? 'Enter your email and we\'ll send you a reset link'
                            : 'Sign in to continue to SwapSphere'}
                    </p>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success">{success}</div>}
                {unverified && (
                    <div className="auth-warning">
                        <button
                            type="button"
                            className="resend-link"
                            onClick={async () => {
                                try {
                                    await resendVerificationEmail();
                                    setSuccess('Verification email resent! Check your inbox.');
                                    setError('');
                                } catch (err) {
                                    if (err.code === 'auth/too-many-requests') {
                                        setError('Too many requests. Please try again later.');
                                    } else {
                                        setError('Failed to resend. Please try again.');
                                    }
                                }
                            }}
                        >
                            Resend Verification Email
                        </button>
                    </div>
                )}

                {forgotPassword ? (
                    <form onSubmit={handleForgotPassword} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <div className="auth-footer">
                            <p>
                                Remember your password?{' '}
                                <button type="button" className="back-to-login" onClick={switchToLogin}>
                                    Back to Login
                                </button>
                            </p>
                        </div>
                    </form>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                                <button type="button" className="forgot-password-link" onClick={switchToForgotPassword}>
                                    Forgot Password?
                                </button>
                            </div>

                            <button type="submit" className="auth-btn" disabled={loading}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                Don't have an account? <Link to="/register">Sign Up</Link>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;

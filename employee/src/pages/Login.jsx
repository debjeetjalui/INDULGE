import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, AlertCircle, Loader2, Eye, EyeOff, Shield } from 'lucide-react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('emp_lockout');
    if (saved) {
      const lockEnd = parseInt(saved);
      if (Date.now() < lockEnd) {
        setLockoutTime(lockEnd);
        setAttempts(MAX_ATTEMPTS);
      } else {
        localStorage.removeItem('emp_lockout');
        localStorage.removeItem('emp_attempts');
      }
    }
    const savedAttempts = localStorage.getItem('emp_attempts');
    if (savedAttempts) setAttempts(parseInt(savedAttempts));
  }, []);

  useEffect(() => {
    if (!lockoutTime) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, lockoutTime - Date.now());
      setCountdown(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        setLockoutTime(null);
        setAttempts(0);
        setError('');
        localStorage.removeItem('emp_lockout');
        localStorage.removeItem('emp_attempts');
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutTime) return;
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      localStorage.removeItem('emp_attempts');
      localStorage.removeItem('emp_lockout');
      navigate('/dashboard');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('emp_attempts', newAttempts.toString());

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockEnd = Date.now() + LOCKOUT_DURATION;
        setLockoutTime(lockEnd);
        localStorage.setItem('emp_lockout', lockEnd.toString());
        setError(`Too many failed attempts. Locked for 5 minutes.`);
      } else {
        setError(`${result.error} (${MAX_ATTEMPTS - newAttempts} attempts remaining)`);
      }
    }

    setLoading(false);
  };

  const isLocked = !!lockoutTime;
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="login-page">
      <div className="login-bg-pattern"></div>

      <div className="login-left">
        <div className="login-container">
          <div className="login-shield-icon">
            <Shield size={26} />
          </div>
          <div className="login-form-header">
            <h2>Welcome Back</h2>
            <p>Sign in to access the admin panel</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className={`login-error ${isLocked ? 'login-error-locked' : ''}`}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {isLocked && countdown > 0 && (
              <div className="login-countdown">
                <Lock size={16} />
                <span>Retry in {formatTime(countdown)}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">
                <Mail size={14} />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLocked}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Lock size={14} />
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLocked}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading || isLocked}>
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  Authenticating...
                </>
              ) : isLocked ? (
                <>
                  <Lock size={18} />
                  Account Locked
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Secure Sign In
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <Shield size={12} />
            <span>Protected by INDULGE Security</span>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-brand-content">
          <h1 className="login-brand-name">INDULGE</h1>
          <div className="login-brand-line"></div>
          <p className="login-brand-tagline">Bespoke Tailoring</p>
          <p className="login-brand-sub">Admin Control Panel</p>
        </div>
        <div className="login-brand-texture"></div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, Loader2, Clock, User, Phone, Mail } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { authAPI } from '../services/api';

const OTP_EXPIRY_SECONDS = 120;
const RESEND_COOLDOWN_SECONDS = 30;

const LoginModal = ({ showNotification, onLoginSuccess }) => {
  const { isLoginModalOpen, closeLoginModal } = useAppContext();
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [otpTimer, setOtpTimer] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef(null);
  const resendTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, []);

  const startOtpTimer = () => {
    setOtpTimer(OTP_EXPIRY_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startResendCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    
    resendTimerRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(resendTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCheckEmail = async () => {
    if (!email) {
      showNotification('Please enter your email', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.checkEmail(email);
      
      if (response.data.exists) {
        setIsNewUser(false);
        await sendOTP(false);
      } else {
        setIsNewUser(true);
        setStep('register');
        showNotification('Create your INDULGE account', 'info');
      }
    } catch (error) {
      console.error('Check email error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to check email';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (isNew = isNewUser) => {
    setLoading(true);
    try {
      await authAPI.sendOTP(email, isNew);
      showNotification('OTP sent to your email!', 'success');
      setStep('otp');
      setOtp('');
      startOtpTimer();
      startResendCooldown();
    } catch (error) {
      console.error('Send OTP error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to send OTP';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!formData.firstName.trim()) {
      showNotification('Please enter your first name', 'error');
      return;
    }
    if (!formData.lastName.trim()) {
      showNotification('Please enter your last name', 'error');
      return;
    }
    if (!formData.phone.trim()) {
      showNotification('Please enter your phone number', 'error');
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      showNotification('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    await sendOTP(true);
  };

  const handleVerifyOTP = async () => {
    if (otpTimer === 0) {
      showNotification('OTP has expired. Please request a new code.', 'error');
      return;
    }
    
    if (!otp || otp.length !== 6) {
      showNotification('Please enter the 6-digit code', 'error');
      return;
    }

    setLoading(true);
    try {
      const userData = isNewUser ? {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      } : null;

      const response = await authAPI.verifyOTP(email, otp, userData);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      const message = response.data.isNewUser
        ? 'Account created successfully!'
        : 'Welcome back!';
      showNotification(message, 'success');

      if (onLoginSuccess) {
        onLoginSuccess(response.data.user);
      }

      handleClose();
    } catch (error) {
      console.error('Verify OTP error:', error);
      const errorMessage = error.response?.data?.error || 'Invalid OTP';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    showNotification('Google Sign-In coming soon!', 'info');
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setIsNewUser(false);
    setFormData({ firstName: '', lastName: '', phone: '' });
    setOtpTimer(0);
    setResendCooldown(0);
    if (timerRef.current) clearInterval(timerRef.current);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    closeLoginModal();
  };

  const handleBack = () => {
    if (step === 'otp') {
      if (isNewUser) {
        setStep('register');
      } else {
        setStep('email');
      }
    } else if (step === 'register') {
      setStep('email');
      setIsNewUser(false);
    }
    setOtp('');
    setOtpTimer(0);
    setResendCooldown(0);
    if (timerRef.current) clearInterval(timerRef.current);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
  };

  if (!isLoginModalOpen) return null;

  return (
    <div className="modal active" id="loginModal">
      <div className="modal-content auth-modal">
        <button className="modal-close" onClick={handleClose}>
          <X size={24} />
        </button>

        {step === 'email' ? (
          <>
            <div className="auth-header">
              <h2>Welcome to INDULGE</h2>
              <p className="modal-subtitle">Sign in or create an account</p>
            </div>

            <div className="auth-form">
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  onKeyPress={(e) => e.key === 'Enter' && handleCheckEmail()}
                />
              </div>

              <div className="auth-create-link">
                <span>New to INDULGE? </span>
                <button 
                  type="button" 
                  className="auth-link-underline"
                  onClick={() => {
                    setIsNewUser(true);
                    setStep('register');
                  }}
                >
                  Create an account
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-full auth-btn-email"
                onClick={handleCheckEmail}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="spin" />
                    Checking...
                  </>
                ) : (
                  'Continue with Email'
                )}
              </button>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-full auth-btn-google"
                onClick={handleGoogleSignIn}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" className="google-icon">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          </>
        ) : step === 'register' ? (
          <>
            <div className="auth-header">
              <button className="auth-back-btn" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
              <h2>Create Your Account</h2>
              <p className="modal-subtitle">
                Complete your profile to continue
              </p>
            </div>

            <div className="auth-form">
              <div className="form-group">
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="input-with-icon">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="auth-input"
                    maxLength={10}
                  />
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-full auth-btn-email"
                onClick={handleRegisterSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              <p className="auth-terms">
                By creating an account, you agree to our{' '}
                <a href="#terms">Terms of Service</a> and{' '}
                <a href="#privacy">Privacy Policy</a>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="auth-header">
              <button className="auth-back-btn" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
              <h2>{isNewUser ? 'Verify Your Email' : 'Enter Verification Code'}</h2>
              <p className="modal-subtitle">
                We sent a 6-digit code to<br />
                <strong>{email}</strong>
              </p>
            </div>

            <div className="auth-form">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`auth-input auth-otp-input ${otpTimer === 0 ? 'expired' : ''}`}
                  maxLength={6}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerifyOTP()}
                  autoFocus
                  disabled={otpTimer === 0}
                />
                
                <div className={`otp-timer ${otpTimer <= 30 ? 'warning' : ''} ${otpTimer === 0 ? 'expired' : ''}`}>
                  <Clock size={16} />
                  {otpTimer > 0 ? (
                    <span>Code expires in {formatTime(otpTimer)}</span>
                  ) : (
                    <span>Code expired</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-full auth-btn-email"
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6 || otpTimer === 0}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="spin" />
                    Verifying...
                  </>
                ) : otpTimer === 0 ? (
                  'Code Expired'
                ) : isNewUser ? (
                  'Verify & Create Account'
                ) : (
                  'Verify & Continue'
                )}
              </button>

              <div className="auth-resend">
                <p>Didn't receive the code?</p>
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => sendOTP(isNewUser)}
                  disabled={loading || resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
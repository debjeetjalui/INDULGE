import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, CalendarCheck, Gift, UserCheck, LogIn, MapPin, AlertCircle, ChevronRight, Mail, CheckCircle, Loader2, Phone, Edit3, Save, X, Trash2, CreditCard, IndianRupee } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { bookingsAPI, paymentsAPI } from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Booking = ({ showNotification, currentUser, onShowProfile }) => {
  const { openLoginModal } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [userAddress, setUserAddress] = useState(null);
  const [userPhone, setUserPhone] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState(false);
  
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [maskedEmail, setMaskedEmail] = useState('');

  // First-visit & payment state
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [checkingVisitStatus, setCheckingVisitStatus] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const MEASUREMENT_FEE = 500;

  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  // Check first-visit status when user logs in
  const checkFirstVisit = useCallback(async () => {
    if (!currentUser) {
      setIsFirstVisit(true);
      return;
    }
    setCheckingVisitStatus(true);
    try {
      const res = await bookingsAPI.checkFirstVisit();
      setIsFirstVisit(res.data.isFirstVisit);
    } catch (error) {
      console.error('Check first visit error:', error);
      setIsFirstVisit(true); // Default to free on error
    } finally {
      setCheckingVisitStatus(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setUserAddress(null);
        setUserPhone('');
        return;
      }

      setLoadingAddress(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserAddress(data.address || null);
          setUserPhone(data.phone || '');
          setPhoneInput(data.phone || '');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchUserData();
    checkFirstVisit();
  }, [currentUser, checkFirstVisit]);

  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  useEffect(() => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtp('');
    setOtpTimer(0);
  }, [currentUser]);

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

  const formatAddress = (addressStr) => {
    if (!addressStr) return null;
    try {
      const addr = JSON.parse(addressStr);
      return {
        street: addr.street || '',
        city: addr.city || '',
        state: addr.state || '',
        pincode: addr.pincode || '',
        country: addr.country || 'India',
        formatted: `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`
      };
    } catch {
      return {
        street: addressStr,
        city: '',
        state: '',
        pincode: '',
        country: '',
        formatted: addressStr
      };
    }
  };

  const parsedAddress = formatAddress(userAddress);

  const handleAddressClick = () => {
    if (onShowProfile) {
      onShowProfile('addresses');
    }
  };

  const handleSavePhone = async () => {
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showNotification('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    setSavingPhone(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone: cleanPhone })
      });

      if (!response.ok) {
        throw new Error('Failed to save phone number');
      }

      setUserPhone(cleanPhone);
      setEditingPhone(false);
      showNotification('Phone number saved!', 'success');
    } catch (error) {
      console.error('Save phone error:', error);
      showNotification('Failed to save phone number', 'error');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (!window.confirm('Are you sure you want to delete your address?')) {
      return;
    }

    setDeletingAddress(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ address: '' })
      });

      if (!response.ok) {
        throw new Error('Failed to delete address');
      }

      setUserAddress(null);
      showNotification('Address deleted successfully', 'success');
    } catch (error) {
      console.error('Delete address error:', error);
      showNotification('Failed to delete address', 'error');
    } finally {
      setDeletingAddress(false);
    }
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/booking/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      setMaskedEmail(data.email || '');
      setOtpTimer(120);
      showNotification('OTP sent to your email! Check your inbox.', 'success');
    } catch (error) {
      console.error('Send OTP error:', error);
      showNotification(error.message || 'Failed to send OTP', 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      showNotification('Please enter the 6-digit OTP', 'error');
      return;
    }

    setVerifyingOtp(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/booking/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      setOtpVerified(true);
      showNotification('Email verified successfully!', 'success');
    } catch (error) {
      console.error('Verify OTP error:', error);
      showNotification(error.message || 'Invalid OTP', 'error');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle Razorpay payment for repeat bookings
  const handlePaidBooking = async (token) => {
    setPaymentInProgress(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway. Please try again.');
      }

      // Get Razorpay key
      const keyRes = await paymentsAPI.getRazorpayKey();
      const razorpayKey = keyRes.data.key;

      // Create payment order
      const orderRes = await bookingsAPI.createPaidOrder();
      const { orderId, amount, currency } = orderRes.data;

      const options = {
        key: razorpayKey,
        amount: amount,
        currency: currency,
        name: 'INDULGE',
        description: 'Home Measurement Booking Fee',
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await bookingsAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              date: selectedDate.toISOString().split('T')[0],
              time: selectedTime
            });

            // Send confirmation email
            try {
              await fetch('http://localhost:5001/api/booking/send-confirmation', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  date: selectedDate.toISOString().split('T')[0],
                  time: selectedTime,
                  address: parsedAddress?.formatted || userAddress
                })
              });
            } catch (emailError) {
              console.error('Confirmation email error:', emailError);
            }

            showNotification('Payment successful! Booking confirmed.', 'success');
            setOtpVerified(true);

            window.dispatchEvent(new CustomEvent('booking-created', { 
              detail: { bookingId: verifyRes.data.bookingId }
            }));

            setTimeout(() => {
              setSelectedDate(new Date());
              setSelectedTime('');
              setOtpSent(false);
              setOtpVerified(false);
              setOtp('');
              checkFirstVisit();
            }, 2000);
          } catch (verifyError) {
            console.error('Payment verify error:', verifyError);
            showNotification('Payment verification failed. Contact support.', 'error');
          } finally {
            setPaymentInProgress(false);
          }
        },
        prefill: {
          name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
          email: currentUser.email,
          contact: userPhone
        },
        theme: {
          color: '#5D4037'
        },
        modal: {
          ondismiss: () => {
            setPaymentInProgress(false);
            showNotification('Payment cancelled', 'info');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      showNotification(error.message || 'Payment failed. Please try again.', 'error');
      setPaymentInProgress(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      showNotification('Please login to book a measurement', 'error');
      openLoginModal();
      return;
    }

    if (!userAddress || userAddress.trim() === '') {
      showNotification('Please add your address first to book a measurement', 'error');
      return;
    }

    if (!userPhone || userPhone.trim() === '') {
      showNotification('Please add your phone number to book a measurement', 'error');
      return;
    }

    if (!selectedDate || !selectedTime) {
      showNotification('Please select date and time', 'error');
      return;
    }

    if (otpSent && !otpVerified) {
      if (!otp || otp.length !== 6) {
        showNotification('Please enter the 6-digit OTP', 'error');
        return;
      }

      setVerifyingOtp(true);
      try {
        const token = localStorage.getItem('token');
        
        const verifyResponse = await fetch('http://localhost:5001/api/booking/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ otp })
        });

        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok) {
          throw new Error(verifyData.error || 'Invalid OTP');
        }

        setOtpVerified(true);

        // PAID FLOW: Repeat user → launch Razorpay
        if (!isFirstVisit) {
          await handlePaidBooking(token);
          return;
        }

        // FREE FLOW: First-time user → create booking directly
        const bookingResponse = await fetch('http://localhost:5001/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            date: selectedDate.toISOString().split('T')[0],
            time: selectedTime
          })
        });

        const bookingData = await bookingResponse.json();

        if (!bookingResponse.ok) {
          throw new Error(bookingData.error || 'Failed to create booking');
        }

        try {
          await fetch('http://localhost:5001/api/booking/send-confirmation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              date: selectedDate.toISOString().split('T')[0],
              time: selectedTime,
              address: parsedAddress?.formatted || userAddress
            })
          });
        } catch (emailError) {
          console.error('Confirmation email error:', emailError);
        }

        showNotification('Booking confirmed! Check your email for details.', 'success');

        window.dispatchEvent(new CustomEvent('booking-created', { 
          detail: { bookingId: bookingData.bookingId }
        }));

        setTimeout(() => {
          setSelectedDate(new Date());
          setSelectedTime('');
          setOtpSent(false);
          setOtpVerified(false);
          setOtp('');
          checkFirstVisit();
        }, 2000);

      } catch (error) {
        console.error('Booking error:', error);
        showNotification(error.message || 'Failed to complete booking', 'error');
      } finally {
        setVerifyingOtp(false);
      }
      return;
    }
  };

  const hasValidAddress = userAddress && userAddress.trim() !== '';
  const hasValidPhone = userPhone && userPhone.trim() !== '';
  const canRequestOtp = hasValidAddress && hasValidPhone && selectedDate && selectedTime;
  const canSubmit = hasValidAddress && hasValidPhone && otpVerified && selectedDate && selectedTime;

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
    }
    return phone;
  };

  return (
    <section className="booking-section" id="booking">
      <div className="container">
        <div className="section-header">
          <span className="section-label">Home Measurement Service</span>
          <h2 className="section-title">{currentUser && !isFirstVisit ? 'Book Your Measurement' : 'Book Your Free Measurement'}</h2>
          <p className="section-description">Our expert staff will visit your home for precise measurements</p>
        </div>

        <div className="booking-features">
          <div className="feature-card">
            {currentUser && !isFirstVisit ? <IndianRupee size={32} /> : <Gift size={32} />}
            <div className="feature-content">
              <h3>{currentUser && !isFirstVisit ? `Measurement Fee: ₹${MEASUREMENT_FEE}` : 'First Visit Free'}</h3>
              <p>{currentUser && !isFirstVisit 
                ? 'Subsequent measurement sessions are charged a nominal fee' 
                : 'Your first measurement session is completely complimentary'}</p>
            </div>
          </div>
          <div className="feature-card">
            <Clock size={32} />
            <div className="feature-content">
              <h3>30-45 Minutes</h3>
              <p>Professional measurement session at your convenience</p>
            </div>
          </div>
          <div className="feature-card">
            <UserCheck size={32} />
            <div className="feature-content">
              <h3>Expert Staff</h3>
              <p>Trained professionals with years of experience</p>
            </div>
          </div>
        </div>

        <div className="booking-form-wrapper">
          <div className="booking-form-card booking-two-column">
            {!currentUser && (
              <div className="login-prompt booking-full-width">
                <p>Please login to book a measurement using your saved profile details</p>
                <button className="btn btn-outline" onClick={openLoginModal}>
                  <LogIn size={18} />
                  Sign In / Sign Up
                </button>
              </div>
            )}

            {currentUser && (
              <>
                <div className="booking-left-column">
                  <div className="user-booking-info">
                    <p>Booking for: <strong>{currentUser.firstName || currentUser.username} {currentUser.lastName || ''}</strong></p>
                    <p className="booking-email">{currentUser.email}</p>
                  </div>

                    <form className="booking-form" onSubmit={handleSubmit}>
                    <div className="date-time-row">
                      <div className="form-group custom-datepicker-wrapper">
                        <label>
                          <Calendar size={18} />
                          Preferred Date
                        </label>
                        <DatePicker
                          selected={selectedDate}
                          onChange={(date) => setSelectedDate(date)}
                          minDate={new Date()}
                          maxDate={new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)}
                          dateFormat="dd/MM/yyyy"
                          className="custom-date-input"
                          calendarClassName="custom-calendar"
                          dayClassName={(date) => {
                            const day = date.getDay();
                            return day === 0 ? 'sunday-day' : '';
                          }}
                          showPopperArrow={false}
                          popperClassName="custom-calendar-popper"
                          placeholderText="Select date"
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <Clock size={18} />
                          Preferred Time
                        </label>
                        <select
                          name="time"
                          required
                          value={selectedTime}
                          onChange={handleTimeChange}
                        >
                          <option value="">Select time</option>
                          <option value="morning">Morning (9 AM - 12 PM)</option>
                          <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                          <option value="evening">Evening (4 PM - 8 PM)</option>
                        </select>
                      </div>
                    </div>

                    {!otpSent && !otpVerified && (
                      <>
                        {currentUser && !isFirstVisit && (
                          <div className="payment-info-badge">
                            <CreditCard size={16} />
                            <span>This booking requires a payment of <strong>₹{MEASUREMENT_FEE}</strong></span>
                          </div>
                        )}
                        <button 
                          type="button" 
                          className="btn btn-primary btn-full"
                          disabled={!canRequestOtp || sendingOtp || checkingVisitStatus}
                          onClick={handleSendOtp}
                        >
                          {sendingOtp ? (
                            <>
                              <Loader2 size={20} className="spinning" />
                              <span>Sending OTP...</span>
                            </>
                          ) : checkingVisitStatus ? (
                            <>
                              <Loader2 size={20} className="spinning" />
                              <span>Checking status...</span>
                            </>
                          ) : (
                            <>
                              {isFirstVisit ? <CalendarCheck size={20} /> : <CreditCard size={20} />}
                              <span>{isFirstVisit ? 'Book Free Measurement' : `Pay ₹${MEASUREMENT_FEE} & Book Measurement`}</span>
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {otpSent && !otpVerified && (
                      <div className="otp-booking-section">
                        <div className="otp-booking-header">
                          <Mail size={18} />
                          <span>Verify your email to confirm booking</span>
                        </div>
                        <p className="otp-sent-info">
                          Code sent to <strong>{maskedEmail}</strong>
                        </p>
                        <div className="otp-input-wrapper">
                          <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            className="otp-input"
                            autoFocus
                          />
                          <button 
                            type="submit" 
                            className="btn btn-primary btn-verify-otp"
                            disabled={verifyingOtp || otp.length !== 6}
                          >
                            {verifyingOtp || paymentInProgress ? <Loader2 size={16} className="spinning" /> : (isFirstVisit ? 'Confirm Booking' : `Pay ₹${MEASUREMENT_FEE} & Confirm`)}
                          </button>
                        </div>
                        <div className="otp-actions">
                          <p className="otp-hint">Check inbox & spam</p>
                          <button 
                            type="button" 
                            className="btn-link"
                            onClick={handleSendOtp}
                            disabled={sendingOtp || otpTimer > 0}
                          >
                            {otpTimer > 0 ? `Resend (${otpTimer}s)` : 'Resend'}
                          </button>
                        </div>
                      </div>
                    )}

                    {otpVerified && (
                      <div className="booking-confirmed-section">
                        <div className="verified-badge">
                          <CheckCircle size={18} />
                          <span>Booking Confirmed!</span>
                        </div>
                      </div>
                    )}
                  </form>
                </div>

                <div className="booking-right-column">
                  <div className="booking-address-card">
                    {loadingAddress ? (
                      <div className="address-loading">
                        <div className="loading-spinner-small"></div>
                        <p>Loading...</p>
                      </div>
                    ) : hasValidAddress && parsedAddress ? (
                      <div className="address-content">
                        <div className="expert-visit-note">
                          <span>Our expert will visit this address for your measurement session</span>
                        </div>

                        <div className="address-display-card">
                          <div className="address-icon-wrapper">
                            <MapPin size={24} />
                          </div>
                          <div className="address-details">
                            <p className="address-type-label">Home Address</p>
                            <p className="address-line address-street">{parsedAddress.street}</p>
                            <p className="address-line">
                              {parsedAddress.city}{parsedAddress.state ? `, ${parsedAddress.state}` : ''}
                              {parsedAddress.pincode ? ` - ${parsedAddress.pincode}` : ''}
                            </p>
                            {parsedAddress.country && (
                              <div className="address-country-row">
                                <p className="address-line address-country">{parsedAddress.country}</p>
                                <button 
                                  type="button" 
                                  className="change-address-link"
                                  onClick={handleAddressClick}
                                >
                                  Change Address
                                </button>
                              </div>
                            )}
                            
                            <div className="address-phone-inline">
                              {hasValidPhone && !editingPhone ? (
                                <p className="address-line phone-line">
                                  <Phone size={14} />
                                  <span>{formatPhoneDisplay(userPhone)}</span>
                                  <button 
                                    type="button" 
                                    className="phone-edit-inline-btn"
                                    onClick={() => {
                                      setPhoneInput(userPhone);
                                      setEditingPhone(true);
                                    }}
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                </p>
                              ) : (
                                <div className="phone-edit-inline">
                                  <Phone size={14} />
                                  <span className="country-code-inline">+91</span>
                                  <input
                                    type="tel"
                                    placeholder="10-digit number"
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    maxLength={10}
                                    className="phone-input-inline"
                                  />
                                  <button 
                                    type="button" 
                                    className="phone-save-inline-btn"
                                    onClick={handleSavePhone}
                                    disabled={savingPhone || phoneInput.length < 10}
                                  >
                                    {savingPhone ? <Loader2 size={12} className="spinning" /> : <Save size={12} />}
                                  </button>
                                  {hasValidPhone && (
                                    <button 
                                      type="button" 
                                      className="phone-cancel-inline-btn"
                                      onClick={() => {
                                        setEditingPhone(false);
                                        setPhoneInput(userPhone);
                                      }}
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <button 
                            type="button" 
                            className="address-delete-btn"
                            onClick={handleDeleteAddress}
                            disabled={deletingAddress}
                            title="Delete address"
                          >
                            {deletingAddress ? <Loader2 size={16} className="spinning" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="address-missing">
                        <div className="address-warning">
                          <AlertCircle size={24} />
                          <div>
                            <p className="warning-title">No Address Found</p>
                            <p className="warning-text">Please add your address to book.</p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-primary btn-sm"
                          onClick={handleAddressClick}
                        >
                          <MapPin size={16} />
                          Add Address
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Booking;
import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, MapPin, CreditCard, Check, ArrowLeft,
  Truck, Smartphone, Banknote, ChevronRight, Package,
  User, Phone, Home, Scissors, Loader2, AlertTriangle,
  ScrollText, X, Trash2
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { cartAPI, ordersAPI, authAPI, paymentsAPI, paymentMethodsAPI } from '../services/api';

const CheckoutPage = ({ onBack }) => {
  const { cartItems, fetchCart, showNotification, user } = useAppContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    const loadCart = async () => {
      setLoading(true);
      await fetchCart();
      setLoading(false);
    };
    loadCart();
  }, [fetchCart]);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [acceptReturnPolicy, setAcceptReturnPolicy] = useState(false);
  const [acceptRefundPolicy, setAcceptRefundPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [saveUpi, setSaveUpi] = useState(false);
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [saveCard, setSaveCard] = useState(false);
  const [savedMethods, setSavedMethods] = useState([]);
  const [selectedSavedMethod, setSelectedSavedMethod] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getProfile();
        if (res.data) {
          let addressData = {
            address: '',
            city: '',
            state: '',
            pincode: ''
          };
          
          if (res.data.address) {
            try {
              const parsed = typeof res.data.address === 'string' 
                ? JSON.parse(res.data.address) 
                : res.data.address;
              
              if (parsed && typeof parsed === 'object') {
                addressData = {
                  address: parsed.street || '',
                  city: parsed.city || '',
                  state: parsed.state || '',
                  pincode: parsed.pincode || ''
                };
              } else {
                addressData.address = res.data.address;
              }
            } catch (e) {
              addressData.address = res.data.address;
            }
          }
          
          setShippingAddress(prev => ({
            ...prev,
            fullName: `${res.data.firstName || ''} ${res.data.lastName || ''}`.trim(),
            phone: res.data.phone || '',
            address: addressData.address,
            city: addressData.city,
            state: addressData.state,
            pincode: addressData.pincode
          }));
        }
      } catch (err) {
      }
    };
    fetchProfile();
  }, []);
  useEffect(() => {
    const loadSavedMethods = async () => {
      try {
        const res = await paymentMethodsAPI.getAll();
        setSavedMethods(res.data || []);
      } catch (err) { }
    };
    loadSavedMethods();
    if (!document.getElementById('razorpay-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const getItemPrice = (item) => {
    if (item.total_price) return parseFloat(item.total_price);
    return (item.fabric_price || 0) * (item.quantity || 1);
  };

  const isCustomItem = (item) => {
    if (item.customization_details) {
      const details = typeof item.customization_details === 'string' 
        ? JSON.parse(item.customization_details) 
        : item.customization_details;
      return details?.type === 'custom_shirt';
    }
    return false;
  };

  const subtotal = (cartItems || []).reduce((sum, item) => sum + getItemPrice(item), 0);
  const deliveryCharge = subtotal > 5000 ? 0 : 100;
  const total = subtotal + deliveryCharge;

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `IND-${timestamp}-${random}`;
  };

  const buildOrderData = () => {
    const orderNumber = generateOrderNumber();
    const fullAddress = `${shippingAddress.fullName}, ${shippingAddress.phone}\n${shippingAddress.address}${shippingAddress.city ? ', ' + shippingAddress.city : ''}${shippingAddress.state ? ', ' + shippingAddress.state : ''}${shippingAddress.pincode ? ' - ' + shippingAddress.pincode : ''}`;
    return {
      order_number: orderNumber,
      total_amount: total,
      shipping_address: fullAddress,
      billing_address: fullAddress,
      payment_method: paymentMethod,
      notes: `Payment: ${paymentMethod.toUpperCase()}${paymentMethod === 'upi' ? ' | UPI: ' + upiId : ''}`,
      items: cartItems.map(item => ({
        fabric_id: item.fabric_id,
        product_type_id: item.product_type_id || null,
        quantity: item.quantity,
        unit_price: getItemPrice(item) / item.quantity,
        customization_details: item.customization_details
      }))
    };
  };
  const saveAddressToProfile = async () => {
    try {
      const profileRes = await authAPI.getProfile();
      const currentProfile = profileRes.data;
      const addressToSave = JSON.stringify({
        street: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        country: 'India'
      });
      await authAPI.updateProfile({
        firstName: currentProfile?.firstName || shippingAddress.fullName.split(' ')[0] || '',
        lastName: currentProfile?.lastName || shippingAddress.fullName.split(' ').slice(1).join(' ') || '',
        phone: shippingAddress.phone || currentProfile?.phone || '',
        address: addressToSave
      });
    } catch (e) { }
  };
  const completeOrder = async (orderId) => {
    for (const item of cartItems) {
      await cartAPI.remove(item.cart_id);
    }
    await fetchCart();
    await saveAddressToProfile();
    if (saveUpi && paymentMethod === 'upi' && upiId) {
      try { await paymentMethodsAPI.save({ method_type: 'upi', upi_id: upiId }); } catch (e) { }
    }
    if (saveCard && paymentMethod === 'card' && cardDetails.number) {
      const [mm, yy] = (cardDetails.expiry || '').split('/');
      try {
        await paymentMethodsAPI.save({
          method_type: 'card',
          card_number: cardDetails.number,
          card_type: 'visa',
          expiry_month: parseInt(mm) || null,
          expiry_year: parseInt('20' + (yy || '')) || null,
          cardholder_name: cardDetails.name
        });
      } catch (e) { }
    }
    setOrderId(orderId);
    setOrderPlaced(true);
    showNotification?.('Order placed successfully!', 'success');
  };
  const handlePlaceOrder = async () => {
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
      showNotification?.('Please fill in all address fields', 'error');
      setStep(2);
      return;
    }
    if (paymentMethod === 'upi' && !upiId && !selectedSavedMethod) {
      showNotification?.('Please enter your UPI ID', 'error');
      setStep(3);
      return;
    }
    setPlacing(true);
    try {
      const orderData = buildOrderData();
      const res = await ordersAPI.create(orderData);
      const dbOrderId = res.data.orderId;
      if (paymentMethod === 'cod') {
        await completeOrder(dbOrderId);
      } else {
        const rpRes = await paymentsAPI.createOrder({ amount: total });
        const keyRes = await paymentsAPI.getRazorpayKey();
        const options = {
          key: keyRes.data.key,
          amount: rpRes.data.amount,
          currency: rpRes.data.currency,
          name: 'INDULGE',
          description: `Order #${orderData.order_number}`,
          order_id: rpRes.data.orderId,
          prefill: {
            name: shippingAddress.fullName,
            contact: shippingAddress.phone,
            ...(paymentMethod === 'upi' ? { vpa: upiId } : {})
          },
          method: {
            upi: paymentMethod === 'upi',
            card: paymentMethod === 'card',
            netbanking: false,
            wallet: false
          },
          handler: async (response) => {
            try {
              await paymentsAPI.verify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: dbOrderId
              });
              await completeOrder(dbOrderId);
            } catch (verifyErr) {
              showNotification?.('Payment verification failed', 'error');
              setPlacing(false);
            }
          },
          modal: {
            ondismiss: () => {
              showNotification?.('Payment cancelled', 'warning');
              setPlacing(false);
            }
          },
          theme: { color: '#5D4037' }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }
    } catch (err) {
      console.error('Error placing order:', err);
      showNotification?.('Failed to place order. Please try again.', 'error');
    } finally {
      setPlacing(false);
    }
  };
  const handleDeleteSavedMethod = async (id) => {
    try {
      await paymentMethodsAPI.remove(id);
      setSavedMethods(prev => prev.filter(m => m.payment_id !== id));
      if (selectedSavedMethod === id) setSelectedSavedMethod(null);
      showNotification?.('Payment method removed', 'success');
    } catch (e) {
      showNotification?.('Failed to remove', 'error');
    }
  };

  const handleBack = () => {
    if (orderPlaced) {
      onBack?.();
    } else if (step > 1) {
      setStep(step - 1);
    } else {
      onBack?.();
    }
  };
  const handleRemoveItem = async (cartId) => {
    try {
      await cartAPI.remove(cartId);
      await fetchCart();
      showNotification?.('Item removed from cart', 'success');
    } catch (err) {
      showNotification?.('Failed to remove item', 'error');
    }
  };

  if (orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="checkout-success">
          <div className="success-icon">
            <Check size={48} />
          </div>
          <h2>Order Placed Successfully!</h2>
          <p className="order-number">Order ID: <strong>{orderId}</strong></p>
          <p>Thank you for shopping with INDULGE. You will receive a confirmation email shortly.</p>
          <div className="success-actions">
            <button className="btn btn-primary" onClick={() => window.location.hash = '#profile-orders'}>
              View My Orders
            </button>
            <button className="btn btn-secondary" onClick={() => window.location.hash = ''}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-loading">
          <Loader2 size={48} className="spinning" />
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <ShoppingBag size={80} />
          <h2>Your cart is empty</h2>
          <p>Add items to your cart before checking out</p>
          <button className="btn btn-primary" onClick={onBack}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <button className="btn-back-checkout" onClick={handleBack}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1>Checkout</h1>
        <div className="checkout-steps-indicator">
          <span className={step >= 1 ? 'active' : ''}>Summary</span>
          <ChevronRight size={16} />
          <span className={step >= 2 ? 'active' : ''}>Address</span>
          <ChevronRight size={16} />
          <span className={step >= 3 ? 'active' : ''}>Payment</span>
          <ChevronRight size={16} />
          <span className={step >= 4 ? 'active' : ''}>Confirm</span>
        </div>
      </header>

      <div className="checkout-content">
        {step === 1 && (
          <div className="checkout-step">
            <h2><ShoppingBag size={24} /> Order Summary</h2>
            <div className="checkout-items">
              {cartItems.map(item => (
                <div className="checkout-item" key={item.cart_id}>
                  <div className="checkout-item-image">
                    {item.image_url ? (
                      <img src={`http://localhost:5001${item.image_url}`} alt={item.fabric_name} />
                    ) : (
                      <div className="checkout-item-placeholder"><Package size={24} /></div>
                    )}
                  </div>
                  <div className="checkout-item-info">
                    <h4>
                      {isCustomItem(item) ? (
                        <><Scissors size={14} /> Custom Shirt - {item.fabric_name}</>
                      ) : (
                        item.fabric_name || 'Fabric'
                      )}
                    </h4>
                    <p>{isCustomItem(item) ? 'Custom Tailored' : `Qty: ${item.quantity}m`}</p>
                  </div>
                  <div className="checkout-item-price">
                    ₹{getItemPrice(item).toFixed(2)}
                  </div>
                  <button type="button" className="checkout-item-remove" onClick={() => handleRemoveItem(item.cart_id)} title="Remove item">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="checkout-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Delivery</span>
                <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
              </div>
              <div className="total-row total-final">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
            <button className="btn btn-primary btn-full" onClick={() => setStep(2)}>
              Continue to Address <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="checkout-step">
            <h2><MapPin size={24} /> Shipping Address</h2>
            <div className="checkout-form">
              <div className="form-group">
                <label><User size={16} /> Full Name *</label>
                <input 
                  type="text" 
                  value={shippingAddress.fullName}
                  onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="form-group">
                <label><Phone size={16} /> Phone Number *</label>
                <input 
                  type="tel" 
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <div className="form-group form-group-full">
                <label><Home size={16} /> Address *</label>
                <textarea 
                  value={shippingAddress.address}
                  onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                  placeholder="House/Flat No., Street, Landmark"
                  rows={3}
                  required
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input 
                  type="text" 
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                  placeholder="City"
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input 
                  type="text" 
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                  placeholder="State"
                />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input 
                  type="text" 
                  value={shippingAddress.pincode}
                  onChange={(e) => setShippingAddress({...shippingAddress, pincode: e.target.value})}
                  placeholder="Pincode"
                />
              </div>
            </div>
            <button className="btn btn-primary btn-full" onClick={() => setStep(3)}>
              Continue to Payment <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="checkout-step">
            <h2><CreditCard size={24} /> Payment Method</h2>
            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => { setPaymentMethod(e.target.value); setSelectedSavedMethod(null); }} />
                <div className="payment-option-icon"><Banknote size={24} /></div>
                <div className="payment-option-info">
                  <h4>Cash on Delivery</h4>
                  <p>Pay when you receive your order</p>
                </div>
                {paymentMethod === 'cod' && <Check size={20} className="payment-check" />}
              </label>
              <label className={`payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => { setPaymentMethod(e.target.value); setSelectedSavedMethod(null); }} />
                <div className="payment-option-icon"><Smartphone size={24} /></div>
                <div className="payment-option-info">
                  <h4>UPI Payment</h4>
                  <p>Pay using Google Pay, PhonePe, Paytm</p>
                </div>
                {paymentMethod === 'upi' && <Check size={20} className="payment-check" />}
              </label>
              <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={(e) => { setPaymentMethod(e.target.value); setSelectedSavedMethod(null); }} />
                <div className="payment-option-icon"><CreditCard size={24} /></div>
                <div className="payment-option-info">
                  <h4>Credit/Debit Card</h4>
                  <p>Visa, Mastercard, Rupay accepted</p>
                </div>
                {paymentMethod === 'card' && <Check size={20} className="payment-check" />}
              </label>
            </div>
            {paymentMethod === 'upi' && (
              <div className="payment-detail-form">
                <h3>UPI Details</h3>
                {savedMethods.filter(m => m.method_type === 'upi').length > 0 && (
                  <div className="saved-methods-list">
                    <p className="saved-methods-label">Saved UPI IDs</p>
                    {savedMethods.filter(m => m.method_type === 'upi').map(m => (
                      <div key={m.payment_id} className={`saved-method-item ${selectedSavedMethod === m.payment_id ? 'active' : ''}`} onClick={() => { setSelectedSavedMethod(m.payment_id); setUpiId(m.upi_id); }}>
                        <Smartphone size={16} />
                        <span>{m.upi_id}</span>
                        <button type="button" className="saved-method-delete" onClick={(e) => { e.stopPropagation(); handleDeleteSavedMethod(m.payment_id); }}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="payment-input-group">
                  <label>UPI ID</label>
                  <input type="text" placeholder="yourname@paytm" value={upiId} onChange={(e) => { setUpiId(e.target.value); setSelectedSavedMethod(null); }} />
                </div>
                <label className="save-method-checkbox">
                  <input type="checkbox" checked={saveUpi} onChange={(e) => setSaveUpi(e.target.checked)} />
                  <span>Save this UPI ID for later</span>
                </label>
              </div>
            )}
            {paymentMethod === 'card' && (
              <div className="payment-detail-form">
                <h3>Card Details</h3>
                {savedMethods.filter(m => m.method_type === 'card').length > 0 && (
                  <div className="saved-methods-list">
                    <p className="saved-methods-label">Saved Cards</p>
                    {savedMethods.filter(m => m.method_type === 'card').map(m => (
                      <div key={m.payment_id} className={`saved-method-item ${selectedSavedMethod === m.payment_id ? 'active' : ''}`} onClick={() => setSelectedSavedMethod(m.payment_id)}>
                        <CreditCard size={16} />
                        <span>{m.card_number} — {m.cardholder_name}</span>
                        <button type="button" className="saved-method-delete" onClick={(e) => { e.stopPropagation(); handleDeleteSavedMethod(m.payment_id); }}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="card-secure-note">Card details are securely handled by Razorpay. We never store your full card number or CVV.</p>
                <div className="card-form-grid">
                  <div className="payment-input-group card-full">
                    <label>Card Number</label>
                    <input type="text" placeholder="1234 5678 9012 3456" maxLength={19} value={cardDetails.number} onChange={(e) => setCardDetails({...cardDetails, number: e.target.value.replace(/[^0-9\s]/g, '')})} />
                  </div>
                  <div className="payment-input-group">
                    <label>Expiry</label>
                    <input type="text" placeholder="MM/YY" maxLength={5} value={cardDetails.expiry} onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})} />
                  </div>
                  <div className="payment-input-group">
                    <label>CVV</label>
                    <input type="password" placeholder="•••" maxLength={4} value={cardDetails.cvv} onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value.replace(/[^0-9]/g, '')})} />
                  </div>
                  <div className="payment-input-group card-full">
                    <label>Cardholder Name</label>
                    <input type="text" placeholder="Name on card" value={cardDetails.name} onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})} />
                  </div>
                </div>
                <label className="save-method-checkbox">
                  <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} />
                  <span>Save this card for later</span>
                </label>
              </div>
            )}
            <button className="btn btn-primary btn-full" onClick={() => setStep(4)}>
              Review Order <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="checkout-step">
            <h2><Package size={24} /> Review & Confirm</h2>
            
            <div className="review-section">
              <h3>Shipping Address</h3>
              <div className="review-box">
                <p><strong>{shippingAddress.fullName}</strong></p>
                <p>{shippingAddress.phone}</p>
                <p>{shippingAddress.address}</p>
                {shippingAddress.city && <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}</p>}
              </div>
              <button className="btn-edit" onClick={() => setStep(2)}>Edit</button>
            </div>

            <div className="review-section">
              <h3>Payment Method</h3>
              <div className="review-box">
                <p>{paymentMethod === 'cod' ? '💵 Cash on Delivery' : paymentMethod === 'upi' ? '📱 UPI Payment' : '💳 Credit/Debit Card'}</p>
                {paymentMethod === 'upi' && upiId && <p className="review-payment-detail">UPI ID: {upiId}</p>}
                {paymentMethod === 'card' && cardDetails.number && <p className="review-payment-detail">Card: ****{cardDetails.number.slice(-4)}</p>}
              </div>
              <button className="btn-edit" onClick={() => setStep(3)}>Edit</button>
            </div>

            <div className="review-section">
              <h3>Order Summary ({cartItems.length} items)</h3>
              <div className="review-items">
                {cartItems.map(item => (
                  <div className="review-item" key={item.cart_id}>
                    <span>{isCustomItem(item) ? `Custom Shirt - ${item.fabric_name}` : item.fabric_name}</span>
                    <span>₹{getItemPrice(item).toFixed(2)}</span>
                  </div>
                ))}
                <div className="review-item total">
                  <span>Total (incl. delivery)</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="policy-acceptance-section">
              <h3><AlertTriangle size={18} /> Policy Acceptance</h3>
              <p className="policy-notice">
                All garments are custom-made to your specifications. Please review and accept our policies before placing your order.
              </p>
              <label className={`policy-checkbox ${acceptReturnPolicy ? 'checked' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={acceptReturnPolicy}
                  onChange={(e) => setAcceptReturnPolicy(e.target.checked)}
                />
                <span className="policy-checkmark"></span>
                <span className="policy-text">
                  I have read and accept the <strong>Return Policy</strong> — I understand that all custom-made garments are non-returnable and non-exchangeable. Minor variations in fit, color, or texture are inherent to handcrafted products and are not considered defects.
                </span>
              </label>
              <label className={`policy-checkbox ${acceptRefundPolicy ? 'checked' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={acceptRefundPolicy}
                  onChange={(e) => setAcceptRefundPolicy(e.target.checked)}
                />
                <span className="policy-checkmark"></span>
                <span className="policy-text">
                  I have read and accept the <strong>Refund Policy</strong> — I understand that refunds are not available for custom orders. Orders cannot be cancelled once production begins, and I agree that my order details are final.
                </span>
              </label>
              <button className="checkout-terms-link" onClick={() => setShowTerms(true)}>
                <ScrollText size={15} />
                View Full Terms & Conditions
              </button>
            </div>

            <button 
              className="btn btn-primary btn-full btn-place-order" 
              onClick={handlePlaceOrder}
              disabled={placing || !acceptReturnPolicy || !acceptRefundPolicy}
            >
              {placing ? (
                <><Loader2 size={20} className="spinning" /> Placing Order...</>
              ) : !acceptReturnPolicy || !acceptRefundPolicy ? (
                <>Accept Policies to Place Order</>
              ) : (
                <>Place Order - ₹{total.toFixed(2)}</>
              )}
            </button>
          </div>
        )}
      </div>

      {showTerms && (
        <div className="terms-modal-overlay" onClick={() => setShowTerms(false)}>
          <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="terms-modal-header">
              <div className="terms-header-title">
                <ScrollText size={24} />
                <h2>Terms & Conditions</h2>
              </div>
              <span className="terms-brand">THE SILAI STORE</span>
              <button className="terms-close-btn" onClick={() => setShowTerms(false)}>
                <X size={22} />
              </button>
            </div>

            <div className="terms-modal-body">
              <section className="terms-section">
                <h3>1. Acceptance of Terms</h3>
                <p>By accessing, browsing, or using the website and services of THE SILAI STORE, you agree to comply with and be bound by these Terms & Conditions. If you do not agree, please do not use our website or services.</p>
              </section>

              <section className="terms-section">
                <h3>2. Services</h3>
                <p>THE SILAI STORE offers custom tailoring and stitching services. All garments are made-to-order based on customer measurements, design preferences, and fabric selections.</p>
              </section>

              <section className="terms-section">
                <h3>3. Orders & Measurements</h3>
                <ul>
                  <li>Customers must ensure that all measurements and order details provided are accurate.</li>
                  <li>Measurements may be taken by THE SILAI STORE or shared by the customer.</li>
                  <li>Due to the handcrafted and customized nature of tailoring, minor variations in fit, finish, or appearance may occur.</li>
                  <li>Once an order is confirmed, it cannot be modified, cancelled, or transferred.</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>4. Pricing & Payments</h3>
                <ul>
                  <li>All prices are listed in Indian Rupees (INR) unless stated otherwise.</li>
                  <li>Prices may change without prior notice.</li>
                  <li>Full or partial payment may be required before order processing.</li>
                  <li>THE SILAI STORE reserves the right to cancel orders in case of pricing errors, payment failure, or suspected fraud.</li>
                </ul>
              </section>

              <section className="terms-section terms-highlight">
                <h3>5. No Returns, No Refunds</h3>
                <ul>
                  <li>All products are custom-made and stitched exclusively for the customer.</li>
                  <li><strong>Returns, exchanges, or refunds are not accepted under any circumstances.</strong></li>
                  <li>Alterations, if offered, are subject to THE SILAI STORE's alteration policy and applicable timelines.</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>6. Delivery & Timelines</h3>
                <ul>
                  <li>Delivery timelines provided are estimated and may vary due to customization, fabric availability, or operational factors.</li>
                  <li>THE SILAI STORE is not responsible for delays caused by third-party delivery partners or unforeseen circumstances.</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>7. Intellectual Property</h3>
                <p>All content on this website—including logos, designs, images, text, graphics, and branding—belongs exclusively to THE SILAI STORE. Unauthorized use, reproduction, or distribution is strictly prohibited.</p>
              </section>

              <section className="terms-section">
                <h3>8. User Conduct</h3>
                <p>Users agree not to:</p>
                <ul>
                  <li>Provide false or misleading information</li>
                  <li>Misuse the website or services</li>
                  <li>Attempt to harm, hack, or disrupt the website</li>
                </ul>
                <p>THE SILAI STORE reserves the right to suspend or terminate access if misuse is detected.</p>
              </section>

              <section className="terms-section">
                <h3>9. Limitation of Liability</h3>
                <p>THE SILAI STORE shall not be liable for:</p>
                <ul>
                  <li>Minor colour, fabric, or fit variations</li>
                  <li>Personal taste or subjective dissatisfaction</li>
                  <li>Any indirect, incidental, or consequential damages</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>10. Privacy Policy</h3>
                <p>All personal information shared with THE SILAI STORE is handled in accordance with our Privacy Policy. By using our services, you consent to such data collection and use.</p>
              </section>

              <section className="terms-section">
                <h3>11. Governing Law & Jurisdiction</h3>
                <p>These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of Indian courts.</p>
              </section>

              <section className="terms-section">
                <h3>12. Changes to Terms</h3>
                <p>THE SILAI STORE reserves the right to update or modify these Terms & Conditions at any time. Continued use of the website implies acceptance of the revised terms.</p>
              </section>

              <section className="terms-section">
                <h3>13. Contact Information</h3>
                <p>For any questions regarding these Terms & Conditions, please contact THE SILAI STORE using the details provided on the website.</p>
              </section>
            </div>

            <div className="terms-modal-footer">
              <button className="terms-accept-btn" onClick={() => setShowTerms(false)}>
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;

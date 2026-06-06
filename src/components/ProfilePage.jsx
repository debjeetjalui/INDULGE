import React, { useState, useEffect, useRef } from 'react';
import {
    User,
    Camera,
    Package,
    Calendar,
    MapPin,
    Phone,
    Mail,
    Edit3,
    Save,
    X,
    ArrowLeft,
    ShoppingBag,
    Plus,
    Home,
    Trash2,
    Loader2,
    Truck,
    Check,
    Scissors,
    CreditCard,
    Ruler,
    CheckCircle,
    Box,
    Clock,
    XCircle,
    RefreshCw,
    RotateCcw,
    Ban,
    AlertTriangle,
    Banknote,
    Building2,
    FileText,
    Download
} from 'lucide-react';
import { authAPI, ordersAPI, bookingsAPI } from '../services/api';
import ImageCropModal from './ImageCropModal';
import MyMeasurements from './MyMeasurements';

const API_BASE = 'http://localhost:5001';

const ProfilePage = ({ currentUser, onBack, showNotification, onUpdateUser, scrollToSection }) => {
    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingField, setEditingField] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showCropModal, setShowCropModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressData, setAddressData] = useState({
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
    });
    const [deletingAddress, setDeletingAddress] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [trackingData, setTrackingData] = useState(null);
    const [loadingTracking, setLoadingTracking] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [cancellingBooking, setCancellingBooking] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedCancelOrder, setSelectedCancelOrder] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [refundMethod, setRefundMethod] = useState('upi');
    const [bankDetails, setBankDetails] = useState({ bank_name: '', account_holder_name: '', account_number: '', ifsc_code: '' });
    const [upiId, setUpiId] = useState('');
    const [cancellingOrder, setCancellingOrder] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [invoiceOrder, setInvoiceOrder] = useState(null);
    const fileInputRef = useRef(null);
    const invoiceRef = useRef(null);

    useEffect(() => {
        if (scrollToSection && !loading) {
            const sectionId = {
                'profile': 'profile',
                'addresses': 'addresses-section',
                'measurements': 'measurements-section',
                'bookings': 'bookings-section',
                'orders': 'orders-section'
            }[scrollToSection];
            
            if (sectionId) {
                setTimeout(() => {
                    const element = document.getElementById(sectionId);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            }
        }
    }, [scrollToSection, loading]);

    useEffect(() => {
        fetchProfile();
        fetchOrders();
        fetchBookings();
    }, []);

    useEffect(() => {
        const handleBookingCreated = () => {
            fetchBookings();
        };

        window.addEventListener('booking-created', handleBookingCreated);
        
        return () => {
            window.removeEventListener('booking-created', handleBookingCreated);
        };
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await authAPI.getProfile();
            setProfile(response.data);

            if (response.data.address) {
                try {
                    const parsed = JSON.parse(response.data.address);
                    setAddressData(parsed);
                } catch {
                    setAddressData(prev => ({ ...prev, street: response.data.address }));
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            showNotification?.('Failed to load profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await authAPI.getOrders();
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const fetchBookings = async () => {
        try {
            const response = await bookingsAPI.getMyBookings();
            setBookings(response.data || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        setCancellingBooking(bookingId);
        try {
            await bookingsAPI.cancel(bookingId);
            setBookings(prev => prev.map(b => 
                b.booking_id === bookingId ? { ...b, status: 'cancelled' } : b
            ));
            showNotification?.('Booking cancelled successfully', 'success');
        } catch (error) {
            console.error('Cancel booking error:', error);
            showNotification?.(error.response?.data?.error || 'Failed to cancel booking', 'error');
        } finally {
            setCancellingBooking(null);
        }
    };

    const handleStartEdit = (field, currentValue) => {
        setEditingField(field);
        setEditValue(currentValue || '');
    };

    const handleCancelEdit = () => {
        setEditingField(null);
        setEditValue('');
    };

    const handleSaveField = async (field) => {
        setSaving(true);
        try {
            const updateData = {
                firstName: profile?.firstName || '',
                lastName: profile?.lastName || '',
                phone: profile?.phone || '',
                address: profile?.address || ''
            };

            updateData[field] = editValue;

            await authAPI.updateProfile(updateData);
            setProfile(prev => ({ ...prev, [field]: editValue }));

            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (field === 'firstName' || field === 'lastName') {
                storedUser[field] = editValue;
                localStorage.setItem('user', JSON.stringify(storedUser));
                if (onUpdateUser) {
                    onUpdateUser({ ...currentUser, [field]: editValue });
                }
            }

            setEditingField(null);
            setEditValue('');
            showNotification?.(`${field.charAt(0).toUpperCase() + field.slice(1)} updated!`, 'success');
        } catch (error) {
            console.error('Error updating field:', error);
            showNotification?.('Failed to update', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAddress = async () => {
        setSaving(true);
        try {
            const addressString = JSON.stringify(addressData);

            await authAPI.updateProfile({
                firstName: profile?.firstName || '',
                lastName: profile?.lastName || '',
                phone: profile?.phone || '',
                address: addressString
            });

            setProfile(prev => ({ ...prev, address: addressString }));
            setShowAddressModal(false);
            showNotification?.('Address updated successfully!', 'success');
        } catch (error) {
            console.error('Error saving address:', error);
            showNotification?.('Failed to save address', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAddress = async () => {
        if (!window.confirm('Are you sure you want to delete your address?')) {
            return;
        }

        setDeletingAddress(true);
        try {
            await authAPI.updateProfile({
                firstName: profile?.firstName || '',
                lastName: profile?.lastName || '',
                phone: profile?.phone || '',
                address: ''
            });

            setProfile(prev => ({ ...prev, address: null }));
            setAddressData({
                street: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India'
            });
            showNotification?.('Address deleted successfully', 'success');
        } catch (error) {
            console.error('Delete address error:', error);
            showNotification?.('Failed to delete address', 'error');
        } finally {
            setDeletingAddress(false);
        }
    };

    const getTrackingIcon = (key) => {
        const icons = {
            'order_placed': <Check size={20} />,
            'payment_confirmed': <CreditCard size={20} />,
            'measurement_scheduled': <Calendar size={20} />,
            'measurements_taken': <Ruler size={20} />,
            'design_approved': <CheckCircle size={20} />,
            'production_started': <Scissors size={20} />,
            'quality_check': <Check size={20} />,
            'packaging': <Box size={20} />,
            'shipped': <Package size={20} />,
            'out_for_delivery': <Truck size={20} />,
            'delivered': <Home size={20} />
        };
        return icons[key] || <Check size={20} />;
    };

    const handleTrackOrder = async (orderId) => {
        setSelectedOrderId(orderId);
        setLoadingTracking(true);
        setShowTrackingModal(true);

        try {
            const response = await ordersAPI.getTracking(orderId);
            setTrackingData(response.data);
        } catch (error) {
            console.error('Error fetching tracking:', error);
            showNotification?.('Failed to load tracking information', 'error');
            setShowTrackingModal(false);
        } finally {
            setLoadingTracking(false);
        }
    };

    const handleOpenCancelModal = (order) => {
        setSelectedCancelOrder(order);
        setCancelReason('');
        setRefundMethod('upi');
        setBankDetails({ bank_name: '', account_holder_name: '', account_number: '', ifsc_code: '' });
        setUpiId('');
        setShowCancelModal(true);
    };

    const handleCancelOrder = async () => {
        if (!selectedCancelOrder) return;
        setCancellingOrder(true);
        try {
            const isCOD = !selectedCancelOrder.payment_method || selectedCancelOrder.payment_method === 'cod';
            const data = {
                reason: cancelReason || 'No reason provided',
            };
            if (!isCOD) {
                data.refund_method = refundMethod;
                if (refundMethod === 'bank_transfer') {
                    data.bank_name = bankDetails.bank_name;
                    data.account_holder_name = bankDetails.account_holder_name;
                    data.account_number = bankDetails.account_number;
                    data.ifsc_code = bankDetails.ifsc_code;
                } else if (refundMethod === 'upi') {
                    data.upi_id = upiId;
                }
            }
            const response = await ordersAPI.cancelOrder(selectedCancelOrder.order_id, data);
            setOrders(prev => prev.map(o =>
                o.order_id === selectedCancelOrder.order_id ? { ...o, status: 'cancelled' } : o
            ));
            setShowCancelModal(false);
            showNotification?.(response.data.message, 'success');
        } catch (error) {
            console.error('Cancel order error:', error);
            showNotification?.(error.response?.data?.error || 'Failed to cancel order', 'error');
        } finally {
            setCancellingOrder(false);
        }
    };

    const canCancelOrder = (order) => {
        const status = order.status?.toLowerCase();
        return status !== 'delivered' && status !== 'cancelled';
    };

    useEffect(() => {
        if (!showTrackingModal || !selectedOrderId) return;
        
        const trackedOrder = orders.find(o => o.order_id === selectedOrderId);
        const orderStatus = trackedOrder?.status?.toLowerCase();
        const isFinalState = orderStatus === 'delivered' || orderStatus === 'cancelled';
        
        if (isFinalState) return;

        const refreshOrders = async () => {
            try {
                const response = await authAPI.getOrders();
                setOrders(response.data);
            } catch (error) {
                console.error('Error refreshing orders:', error);
            }
        };

        const intervalId = setInterval(refreshOrders, 5000);

        return () => clearInterval(intervalId);
    }, [showTrackingModal, selectedOrderId, orders]);

    const canTrackOrder = (order) => {
        const nonTrackableStatuses = ['pending', 'cancelled'];
        return order && !nonTrackableStatuses.includes(order.status?.toLowerCase());
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const imageUrl = URL.createObjectURL(file);
        setSelectedImage(imageUrl);
        setShowCropModal(true);
        e.target.value = '';
    };

    const handleCropComplete = async (croppedFile) => {
        setShowCropModal(false);
        setSelectedImage(null);
        setUploadingImage(true);

        try {
            const formData = new FormData();
            formData.append('image', croppedFile);

            const response = await authAPI.uploadProfileImage(formData);
            setProfile(prev => ({ ...prev, profileImage: response.data.profileImage }));

            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            storedUser.profileImage = response.data.profileImage;
            localStorage.setItem('user', JSON.stringify(storedUser));

            showNotification?.('Profile image updated!', 'success');
        } catch (error) {
            console.error('Error uploading image:', error);
            showNotification?.('Failed to upload image', 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleCropCancel = () => {
        setShowCropModal(false);
        if (selectedImage) URL.revokeObjectURL(selectedImage);
        setSelectedImage(null);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatAddress = () => {
        if (!profile?.address) return null;
        try {
            const addr = JSON.parse(profile.address);
            return `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
        } catch {
            return profile.address;
        }
    };

    const EditableField = ({ field, label, value, icon: Icon, type = 'text' }) => (
        <div className="editable-field">
            <div className="field-header">
                <label>{Icon && <Icon size={16} />} {label}</label>
                {editingField !== field && (
                    <button className="inline-edit-btn" onClick={() => handleStartEdit(field, value)}>
                        <Edit3 size={14} />
                    </button>
                )}
            </div>
            {editingField === field ? (
                <div className="field-edit-mode">
                    <input
                        type={type}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                    />
                    <div className="field-edit-actions">
                        <button className="field-save-btn" onClick={() => handleSaveField(field)} disabled={saving}>
                            <Save size={14} /> {saving ? '...' : 'Save'}
                        </button>
                        <button className="field-cancel-btn" onClick={handleCancelEdit}>
                            <X size={14} />
                        </button>
                    </div>
                </div>
            ) : (
                <p className="field-value">{value || <span className="empty-value">Not set</span>}</p>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-loading">
                    <div className="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <button className="profile-back-btn" onClick={onBack}>
                    <ArrowLeft size={20} />
                    <span>Back to Home</span>
                </button>

                <div className="profile-header">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar">
                            {profile?.profileImage ? (
                                <img src={`${API_BASE}${profile.profileImage}`} alt="Profile" />
                            ) : (
                                <User size={60} />
                            )}
                            <button
                                className="avatar-upload-btn"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                            >
                                {uploadingImage ? <div className="mini-spinner"></div> : <Camera size={16} />}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <div className="profile-name-section">
                            <h1>{profile?.firstName || profile?.username || 'User'} {profile?.lastName || ''}</h1>
                            <p className="profile-email">
                                <Mail size={16} />
                                {profile?.email}
                            </p>
                            <p className="profile-member-since">
                                Member since {formatDate(profile?.createdAt)}
                            </p>
                        </div>
                    </div>
                </div>

                <div id="profile-info" className="profile-details">
                    <h2>Personal Information</h2>
                    <div className="editable-fields-grid">
                        <EditableField field="firstName" label="First Name" value={profile?.firstName} />
                        <EditableField field="lastName" label="Last Name" value={profile?.lastName} />
                        <EditableField field="phone" label="Phone Number" value={profile?.phone} icon={Phone} type="tel" />
                    </div>
                </div>

                <div id="addresses-section" className="profile-details address-section">
                    <div className="section-header">
                        <h2><Home size={20} /> Addresses</h2>
                        <button className="add-address-btn" onClick={() => setShowAddressModal(true)}>
                            {profile?.address ? <Edit3 size={16} /> : <Plus size={16} />}
                            {profile?.address ? 'Edit' : 'Add Address'}
                        </button>
                    </div>

                    {profile?.address ? (
                        <div className="address-card">
                            <div className="address-icon"><MapPin size={20} /></div>
                            <div className="address-content">
                                <p className="address-type">Home Address</p>
                                <p className="address-text">{formatAddress()}</p>
                            </div>
                            <button 
                                className="address-delete-btn"
                                onClick={handleDeleteAddress}
                                disabled={deletingAddress}
                                title="Delete address"
                            >
                                {deletingAddress ? <Loader2 size={16} className="spinning" /> : <Trash2 size={16} />}
                            </button>
                        </div>
                    ) : (
                        <div className="no-address">
                            <MapPin size={40} />
                            <p>No address saved yet</p>
                            <button className="add-first-address-btn" onClick={() => setShowAddressModal(true)}>
                                <Plus size={16} /> Add your address
                            </button>
                        </div>
                    )}
                </div>

                <div id="measurements-section">
                    <MyMeasurements showNotification={showNotification} />
                </div>

                <div id="bookings-section" className="bookings-history">
                    <h2><Calendar size={24} /> My Measurement Bookings</h2>
                    {bookings.length === 0 ? (
                        <div className="no-bookings">
                            <Calendar size={60} />
                            <h3>No bookings yet</h3>
                            <p>You haven't scheduled any measurement appointments.</p>
                            <button className="book-now-btn" onClick={() => {
                                onBack();
                                setTimeout(() => {
                                    const bookingSection = document.getElementById('booking');
                                    if (bookingSection) {
                                        bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }, 100);
                            }}>Book a Measurement</button>
                        </div>
                    ) : (
                        <div className="bookings-list">
                            {bookings.map((booking) => {
                                const bookingDate = new Date(booking.booking_date);
                                const formattedDate = bookingDate.toLocaleDateString('en-IN', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                });
                                
                                const getStatusIcon = (status) => {
                                    switch(status) {
                                        case 'confirmed': return <CheckCircle size={16} />;
                                        case 'completed': return <Check size={16} />;
                                        case 'cancelled': return <XCircle size={16} />;
                                        default: return <Clock size={16} />;
                                    }
                                };

                                const canCancel = booking.status === 'pending' || booking.status === 'confirmed';

                                return (
                                    <div key={booking.booking_id} className={`booking-card status-${booking.status}`}>
                                        <div className="booking-header">
                                            <div className="booking-id">
                                                <span>Booking #{booking.booking_id}</span>
                                                <span className={`booking-status status-${booking.status}`}>
                                                    {getStatusIcon(booking.status)}
                                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                </span>
                                            </div>
                                            <div className="booking-created">
                                                Booked on {formatDate(booking.created_at)}
                                            </div>
                                        </div>
                                        <div className="booking-details">
                                            <div className="booking-datetime">
                                                <div className="booking-date">
                                                    <Calendar size={18} />
                                                    <span>{formattedDate}</span>
                                                </div>
                                                <div className="booking-time">
                                                    <Clock size={18} />
                                                    <span>{booking.booking_time}</span>
                                                </div>
                                            </div>
                                            {booking.customer_address && (
                                                <div className="booking-address">
                                                    <MapPin size={16} />
                                                    <span>
                                                        {(() => {
                                                            try {
                                                                const addr = JSON.parse(booking.customer_address);
                                                                return `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
                                                            } catch {
                                                                return booking.customer_address;
                                                            }
                                                        })()}
                                                    </span>
                                                </div>
                                            )}
                                            {booking.customer_phone && (
                                                <div className="booking-phone">
                                                    <Phone size={16} />
                                                    <span>{booking.customer_phone}</span>
                                                </div>
                                            )}
                                        </div>
                                        {canCancel && (
                                            <div className="booking-actions">
                                                <button 
                                                    className="cancel-booking-btn"
                                                    onClick={() => handleCancelBooking(booking.booking_id)}
                                                    disabled={cancellingBooking === booking.booking_id}
                                                >
                                                    {cancellingBooking === booking.booking_id ? (
                                                        <><Loader2 size={16} className="spinning" /> Cancelling...</>
                                                    ) : (
                                                        <><X size={16} /> Cancel Booking</>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div id="orders-section" className="order-history">
                    <h2><ShoppingBag size={24} /> Purchase History</h2>
                    {orders.length === 0 ? (
                        <div className="no-orders">
                            <Package size={60} />
                            <h3>No purchases yet</h3>
                            <p>You haven't made any purchases yet.</p>
                            <button className="shop-now-btn" onClick={() => {
                                onBack();
                                setTimeout(() => {
                                    const fabricsSection = document.getElementById('fabrics');
                                    if (fabricsSection) {
                                        fabricsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }, 100);
                            }}>Start Shopping</button>
                        </div>
                    ) : (
                        <div className="orders-list">
                            {orders.map((order) => {
                                const orderStatus = order.status?.toLowerCase();
                                
                                return (
                                    <div key={order.order_id} className="order-card expanded">
                                        <div className="order-header">
                                            <div className="order-id">
                                                <span>Order #{order.order_number || order.order_id}</span>
                                                <span className={`order-status status-${orderStatus}`}>{order.status}</span>
                                            </div>
                                            <div className="order-date"><Calendar size={14} /> {formatDate(order.created_at)}</div>
                                        </div>
                                        
                                        <div className="order-product-details">
                                            <div className="order-product-image">
                                                {order.fabric_image ? (
                                                    <img src={`http://localhost:5001${order.fabric_image}`} alt={order.fabric_name} />
                                                ) : (
                                                    <Package size={40} />
                                                )}
                                            </div>
                                            <div className="order-product-info">
                                                <h4>{order.product_name || order.fabric_name || 'Custom Garment'}</h4>
                                                {order.fabric_name && (
                                                    <p className="product-fabric">Fabric: {order.fabric_name}</p>
                                                )}
                                                {order.customizations && (
                                                    <p className="product-customizations">
                                                        {(() => {
                                                            try {
                                                                const custom = JSON.parse(order.customizations);
                                                                return Object.entries(custom).map(([key, val]) => `${key}: ${val}`).join(' • ');
                                                            } catch {
                                                                return order.customizations;
                                                            }
                                                        })()}
                                                    </p>
                                                )}
                                                <p className="product-qty">Qty: {order.quantity || 1}</p>
                                            </div>
                                            <div className="order-product-price">
                                                ₹{parseFloat(order.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        
                                        {order.shipping_address && (
                                            <div className="order-shipping-address">
                                                <MapPin size={14} />
                                                <span>
                                                    {(() => {
                                                        try {
                                                            const addr = JSON.parse(order.shipping_address);
                                                            return `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
                                                        } catch {
                                                            return order.shipping_address;
                                                        }
                                                    })()}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="order-actions-row">
                                            <button 
                                                className={`track-order-btn ${!canTrackOrder(order) ? 'disabled' : ''}`}
                                                onClick={() => canTrackOrder(order) && handleTrackOrder(order.order_id)}
                                                disabled={!canTrackOrder(order)}
                                                title={canTrackOrder(order) ? 'Track this order' : 'Tracking available after order is confirmed'}
                                            >
                                                <Truck size={16} />
                                                <span>Track Order</span>
                                            </button>
                                            
                                            {order.status?.toLowerCase() === 'delivered' && (
                                                <button 
                                                    className="track-order-btn"
                                                    onClick={() => { setInvoiceOrder(order); setShowInvoiceModal(true); }}
                                                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                                                    title="View & Download Invoice"
                                                >
                                                    <FileText size={16} />
                                                    <span>Invoice</span>
                                                </button>
                                            )}

                                            {canCancelOrder(order) && (
                                                <button 
                                                    className="cancel-order-btn"
                                                    onClick={() => handleOpenCancelModal(order)}
                                                >
                                                    <Ban size={16} />
                                                    <span>Cancel Order</span>
                                                </button>
                                            )}

                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {showAddressModal && (
                <div className="address-modal-overlay">
                    <div className="address-modal">
                        <div className="address-modal-header">
                            <h3><MapPin size={20} /> {profile?.address ? 'Edit Address' : 'Add New Address'}</h3>
                            <button className="modal-close" onClick={() => setShowAddressModal(false)}><X size={24} /></button>
                        </div>
                        <div className="address-modal-body">
                            <div className="address-form">
                                <div className="form-group full-width">
                                    <label>Street Address *</label>
                                    <textarea
                                        value={addressData.street}
                                        onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                                        placeholder="House no., Building, Street, Area"
                                        rows={2}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>City *</label>
                                    <input
                                        type="text"
                                        value={addressData.city}
                                        onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                                        placeholder="City"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>State *</label>
                                    <input
                                        type="text"
                                        value={addressData.state}
                                        onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                                        placeholder="State"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>PIN Code *</label>
                                    <input
                                        type="text"
                                        value={addressData.pincode}
                                        onChange={(e) => setAddressData({ ...addressData, pincode: e.target.value })}
                                        placeholder="PIN Code"
                                        maxLength={6}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Country</label>
                                    <input
                                        type="text"
                                        value={addressData.country}
                                        onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                                        placeholder="Country"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="address-modal-footer">
                            <button className="btn-cancel" onClick={() => setShowAddressModal(false)}>Cancel</button>
                            <button className="btn-save" onClick={handleSaveAddress} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Address'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCropModal && selectedImage && (
                <ImageCropModal
                    imageUrl={selectedImage}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}

            {showTrackingModal && (() => {
                const trackedOrder = orders.find(o => o.order_id === selectedOrderId);
                const orderStatus = trackedOrder?.status?.toLowerCase() || 'pending';
                
                const allSteps = [
                    { key: 'pending', label: 'Order Placed', description: 'Your order has been received', icon: <Check size={20} /> },
                    { key: 'processing', label: 'Processing', description: 'Your order is being prepared', icon: <Clock size={20} /> },
                    { key: 'in_production', label: 'In Production', description: 'Your garment is being crafted', icon: <Scissors size={20} /> },
                    { key: 'shipped', label: 'Shipped', description: 'Your order is on the way', icon: <Truck size={20} /> },
                    { key: 'delivered', label: 'Delivered', description: 'Your order has arrived', icon: <Home size={20} /> }
                ];
                
                const statusIndex = {
                    'pending': 0,
                    'processing': 1,
                    'in_production': 2,
                    'shipped': 3,
                    'delivered': 4,
                    'cancelled': -1
                };
                
                const currentIdx = statusIndex[orderStatus] ?? 0;
                const isCancelled = orderStatus === 'cancelled';
                
                return (
                    <div className="tracking-modal-overlay" onClick={() => setShowTrackingModal(false)}>
                        <div className="tracking-modal tracking-only" onClick={(e) => e.stopPropagation()}>
                            <div className="tracking-modal-header">
                                <h3><Truck size={24} /> Order Tracking</h3>
                                <button className="modal-close" onClick={() => setShowTrackingModal(false)}><X size={24} /></button>
                            </div>
                            <div className="tracking-modal-body">
                                <div className="tracking-order-info">
                                    <div className="tracking-order-number">
                                        <span>Order #{trackedOrder?.order_number || selectedOrderId}</span>
                                        <span className={`tracking-status status-${orderStatus}`}>
                                            {isCancelled ? 'Cancelled' : trackedOrder?.status || 'Pending'}
                                        </span>
                                    </div>
                                </div>
                                
                                {isCancelled ? (
                                    <div className="tracking-cancelled">
                                        <XCircle size={60} />
                                        <h4>Order Cancelled</h4>
                                        <p>This order has been cancelled</p>
                                    </div>
                                ) : (
                                    <div className="tracking-timeline">
                                        {allSteps.map((step, index) => {
                                            let stepStatus = 'pending';
                                            if (index < currentIdx) stepStatus = 'completed';
                                            else if (index === currentIdx) stepStatus = 'current';
                                            
                                            return (
                                                <div key={step.key} className={`tracking-step ${stepStatus}`}>
                                                    <div className="tracking-step-icon">
                                                        {step.icon}
                                                    </div>
                                                    <div className="tracking-step-content">
                                                        <h4>{step.label}</h4>
                                                        <p>{step.description}</p>
                                                        {stepStatus === 'completed' && (
                                                            <span className="tracking-step-date">✓ Completed</span>
                                                        )}
                                                        {stepStatus === 'current' && (
                                                            <span className="tracking-step-date">🔄 In Progress</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                
                                {orderStatus === 'delivered' ? (
                                    <div className="tracking-refresh-indicator complete" style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50' }}>
                                        <CheckCircle size={16} />
                                        <span>Order Complete</span>
                                    </div>
                                ) : (
                                    <div className="tracking-refresh-indicator">
                                        <RefreshCw size={16} />
                                        <span>Live updates • Auto-refreshing</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {showCancelModal && selectedCancelOrder && (() => {
                const isCOD = !selectedCancelOrder.payment_method || selectedCancelOrder.payment_method === 'cod';
                return (
                    <div className="cancel-modal-overlay" onClick={() => !cancellingOrder && setShowCancelModal(false)}>
                        <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="cancel-modal-header">
                                <h3><AlertTriangle size={22} /> Cancel Order</h3>
                                <button className="modal-close" onClick={() => !cancellingOrder && setShowCancelModal(false)}><X size={24} /></button>
                            </div>
                            <div className="cancel-modal-body">
                                <div className="cancel-order-info">
                                    <span className="cancel-order-number">Order #{selectedCancelOrder.order_number || selectedCancelOrder.order_id}</span>
                                    <span className="cancel-order-amount">₹{parseFloat(selectedCancelOrder.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>

                                <div className="cancel-reason-section">
                                    <label>Reason for cancellation (optional)</label>
                                    <textarea
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder="Tell us why you want to cancel..."
                                        rows={3}
                                    />
                                </div>

                                {isCOD ? (
                                    <div className="cancel-cod-notice">
                                        <Banknote size={20} />
                                        <div>
                                            <h4>Cash on Delivery</h4>
                                            <p>Since you chose COD and the order hasn't been delivered yet, no refund is applicable. Your order will be cancelled immediately.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="cancel-refund-section">
                                        <h4><CreditCard size={18} /> Refund Details</h4>
                                        <p className="refund-subtitle">Your payment of ₹{parseFloat(selectedCancelOrder.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} will be refunded</p>
                                        
                                        <div className="refund-method-selector">
                                            <button 
                                                className={`refund-method-btn ${refundMethod === 'upi' ? 'active' : ''}`}
                                                onClick={() => setRefundMethod('upi')}
                                            >
                                                <CreditCard size={18} />
                                                <span>UPI</span>
                                            </button>
                                            <button 
                                                className={`refund-method-btn ${refundMethod === 'bank_transfer' ? 'active' : ''}`}
                                                onClick={() => setRefundMethod('bank_transfer')}
                                            >
                                                <Building2 size={18} />
                                                <span>Bank Transfer</span>
                                            </button>
                                        </div>

                                        {refundMethod === 'upi' && (
                                            <div className="refund-form">
                                                <div className="refund-form-group">
                                                    <label>UPI ID</label>
                                                    <input
                                                        type="text"
                                                        value={upiId}
                                                        onChange={(e) => setUpiId(e.target.value)}
                                                        placeholder="yourname@upi"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {refundMethod === 'bank_transfer' && (
                                            <div className="refund-form">
                                                <div className="refund-form-group">
                                                    <label>Bank Name</label>
                                                    <input
                                                        type="text"
                                                        value={bankDetails.bank_name}
                                                        onChange={(e) => setBankDetails({...bankDetails, bank_name: e.target.value})}
                                                        placeholder="e.g. State Bank of India"
                                                    />
                                                </div>
                                                <div className="refund-form-group">
                                                    <label>Account Holder Name</label>
                                                    <input
                                                        type="text"
                                                        value={bankDetails.account_holder_name}
                                                        onChange={(e) => setBankDetails({...bankDetails, account_holder_name: e.target.value})}
                                                        placeholder="Full name as per bank"
                                                    />
                                                </div>
                                                <div className="refund-form-group">
                                                    <label>Account Number</label>
                                                    <input
                                                        type="text"
                                                        value={bankDetails.account_number}
                                                        onChange={(e) => setBankDetails({...bankDetails, account_number: e.target.value})}
                                                        placeholder="Your account number"
                                                    />
                                                </div>
                                                <div className="refund-form-group">
                                                    <label>IFSC Code</label>
                                                    <input
                                                        type="text"
                                                        value={bankDetails.ifsc_code}
                                                        onChange={(e) => setBankDetails({...bankDetails, ifsc_code: e.target.value.toUpperCase()})}
                                                        placeholder="e.g. SBIN0001234"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="cancel-modal-footer">
                                <button className="cancel-modal-back" onClick={() => setShowCancelModal(false)} disabled={cancellingOrder}>
                                    Keep Order
                                </button>
                                <button 
                                    className="cancel-modal-confirm" 
                                    onClick={handleCancelOrder}
                                    disabled={cancellingOrder || (!isCOD && refundMethod === 'upi' && !upiId) || (!isCOD && refundMethod === 'bank_transfer' && (!bankDetails.account_number || !bankDetails.ifsc_code))}
                                >
                                    {cancellingOrder ? <><Loader2 size={16} className="spin" /> Cancelling...</> : 'Confirm Cancellation'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {showInvoiceModal && invoiceOrder && (() => {
                const order = invoiceOrder;
                let shippingAddr = order.shipping_address;
                try {
                    const addr = JSON.parse(order.shipping_address);
                    shippingAddr = `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
                } catch { }

                let customizationText = '';
                try {
                    if (order.customizations) {
                        const custom = JSON.parse(order.customizations);
                        customizationText = Object.entries(custom).map(([key, val]) => `${key}: ${val}`).join(', ');
                    }
                } catch {
                    customizationText = order.customizations || '';
                }

                const invoiceNumber = `INV-${order.order_number || order.order_id}`;
                const orderDate = formatDate(order.created_at);
                const totalAmount = parseFloat(order.total_amount || 0);
                const deliveryCharge = 0;
                const subtotal = totalAmount - deliveryCharge;

                const handleDownloadPDF = () => {
                    const printContent = invoiceRef.current;
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                        <html>
                        <head>
                            <title>Invoice ${invoiceNumber}</title>
                            <style>
                                * { margin: 0; padding: 0; box-sizing: border-box; }
                                body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; }
                                .invoice-container { max-width: 800px; margin: 0 auto; }
                                .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #D4AF37; }
                                .invoice-brand h1 { font-size: 28px; color: #1a1a2e; letter-spacing: 3px; }
                                .invoice-brand p { color: #666; font-size: 12px; letter-spacing: 1px; }
                                .invoice-meta { text-align: right; }
                                .invoice-meta h2 { font-size: 24px; color: #D4AF37; margin-bottom: 8px; }
                                .invoice-meta p { color: #555; font-size: 13px; margin-bottom: 4px; }
                                .invoice-parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
                                .invoice-parties > div { flex: 1; }
                                .invoice-parties h4 { color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
                                .invoice-parties p { color: #333; font-size: 13px; margin-bottom: 3px; }
                                .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                                .invoice-table th { background: #1a1a2e; color: #D4AF37; padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
                                .invoice-table td { padding: 14px 16px; border-bottom: 1px solid #eee; font-size: 13px; color: #333; }
                                .invoice-table tr:last-child td { border-bottom: none; }
                                .invoice-summary { display: flex; justify-content: flex-end; margin-bottom: 30px; }
                                .invoice-summary table { width: 280px; }
                                .invoice-summary td { padding: 8px 16px; font-size: 13px; color: #555; }
                                .invoice-summary td:last-child { text-align: right; font-weight: 500; color: #1a1a2e; }
                                .invoice-summary .total-row td { border-top: 2px solid #D4AF37; font-size: 16px; font-weight: 700; color: #1a1a2e; padding-top: 12px; }
                                .invoice-footer { text-align: center; padding-top: 30px; border-top: 1px solid #eee; }
                                .invoice-footer p { color: #888; font-size: 12px; margin-bottom: 4px; }
                                .invoice-badge { display: inline-block; background: #22c55e; color: white; padding: 4px 14px; border-radius: 12px; font-size: 11px; font-weight: 600; }
                                @media print { body { padding: 20px; } }
                            </style>
                        </head>
                        <body>${printContent.innerHTML}</body>
                        </html>
                    `);
                    printWindow.document.close();
                    setTimeout(() => { printWindow.print(); }, 400);
                };

                return (
                    <div className="address-modal-overlay" onClick={() => setShowInvoiceModal(false)}>
                        <div 
                            className="address-modal" 
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto', padding: 0 }}
                        >
                            <div style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '16px 24px', borderBottom: '1px solid var(--color-border, #eee)', position: 'sticky', top: 0,
                                background: 'var(--color-surface, #fff)', zIndex: 10 
                            }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                    <FileText size={20} /> Invoice Preview
                                </h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={handleDownloadPDF} style={{
                                        display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                                        background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', border: 'none',
                                        borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
                                    }}>
                                        <Download size={16} /> Download PDF
                                    </button>
                                    <button onClick={() => setShowInvoiceModal(false)} style={{
                                        background: 'none', border: '1px solid var(--color-border, #ccc)', borderRadius: '8px',
                                        padding: '8px 12px', cursor: 'pointer', color: 'var(--color-text, #333)'
                                    }}>
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            <div ref={invoiceRef} style={{ padding: '40px 32px', background: '#fff', color: '#1a1a2e' }}>
                                <div className="invoice-container">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px', paddingBottom: '20px', borderBottom: '3px solid #D4AF37' }}>
                                        <div>
                                            <h1 style={{ fontSize: '26px', letterSpacing: '3px', margin: 0, color: '#1a1a2e' }}>INDULGE</h1>
                                            <p style={{ color: '#777', fontSize: '11px', letterSpacing: '1.5px', marginTop: '2px' }}>BESPOKE TAILORING</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <h2 style={{ fontSize: '22px', color: '#D4AF37', margin: '0 0 8px 0' }}>INVOICE</h2>
                                            <p style={{ color: '#555', fontSize: '13px', margin: '3px 0' }}><strong>{invoiceNumber}</strong></p>
                                            <p style={{ color: '#555', fontSize: '13px', margin: '3px 0' }}>Date: {orderDate}</p>
                                            <span className="invoice-badge" style={{ display: 'inline-block', background: '#22c55e', color: 'white', padding: '3px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>PAID</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px' }}>
                                        <div>
                                            <h4 style={{ color: '#D4AF37', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Billed To</h4>
                                            <p style={{ color: '#333', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>{profile?.name || 'Customer'}</p>
                                            <p style={{ color: '#555', fontSize: '13px', margin: '0 0 2px 0' }}>{profile?.email || ''}</p>
                                            <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>{profile?.phone || ''}</p>
                                        </div>
                                        {shippingAddr && (
                                            <div style={{ textAlign: 'right' }}>
                                                <h4 style={{ color: '#D4AF37', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Ship To</h4>
                                                <p style={{ color: '#333', fontSize: '13px', maxWidth: '250px', margin: 0 }}>{shippingAddr}</p>
                                            </div>
                                        )}
                                    </div>

                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ background: '#1a1a2e', color: '#D4AF37', padding: '12px 16px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Item</th>
                                                <th style={{ background: '#1a1a2e', color: '#D4AF37', padding: '12px 16px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Details</th>
                                                <th style={{ background: '#1a1a2e', color: '#D4AF37', padding: '12px 16px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Qty</th>
                                                <th style={{ background: '#1a1a2e', color: '#D4AF37', padding: '12px 16px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: '14px 16px', borderBottom: '1px solid #eee', fontSize: '13px', color: '#333', fontWeight: '500' }}>
                                                    {order.product_name || order.fabric_name || 'Custom Garment'}
                                                </td>
                                                <td style={{ padding: '14px 16px', borderBottom: '1px solid #eee', fontSize: '12px', color: '#666' }}>
                                                    {order.fabric_name && <span>Fabric: {order.fabric_name}<br/></span>}
                                                    {customizationText && <span>{customizationText}</span>}
                                                </td>
                                                <td style={{ padding: '14px 16px', borderBottom: '1px solid #eee', fontSize: '13px', color: '#333', textAlign: 'center' }}>
                                                    {order.quantity || 1}
                                                </td>
                                                <td style={{ padding: '14px 16px', borderBottom: '1px solid #eee', fontSize: '13px', color: '#333', textAlign: 'right', fontWeight: '600' }}>
                                                    ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
                                        <table style={{ width: '260px' }}>
                                            <tbody>
                                                <tr>
                                                    <td style={{ padding: '6px 16px', fontSize: '13px', color: '#555' }}>Subtotal</td>
                                                    <td style={{ padding: '6px 16px', fontSize: '13px', color: '#1a1a2e', textAlign: 'right', fontWeight: '500' }}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '6px 16px', fontSize: '13px', color: '#555' }}>Delivery</td>
                                                    <td style={{ padding: '6px 16px', fontSize: '13px', color: '#22c55e', textAlign: 'right', fontWeight: '500' }}>FREE</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '12px 16px', fontSize: '16px', color: '#1a1a2e', fontWeight: '700', borderTop: '2px solid #D4AF37' }}>Total</td>
                                                    <td style={{ padding: '12px 16px', fontSize: '16px', color: '#1a1a2e', textAlign: 'right', fontWeight: '700', borderTop: '2px solid #D4AF37' }}>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #eee' }}>
                                        <p style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Thank you for choosing Indulge Bespoke Tailoring!</p>
                                        <p style={{ color: '#aaa', fontSize: '11px' }}>For queries, contact us at support@indulge.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

        </div>
    );
};

export default ProfilePage;

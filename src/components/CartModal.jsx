import React from 'react';
import { X, ShoppingBag, Trash2, Loader2, Sparkles, ShoppingCart, Scissors } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { cartAPI } from '../services/api';

const CartModal = () => {
  const { isCartModalOpen, closeCartModal, cartItems, fetchCart, showNotification } = useAppContext();
  const [removing, setRemoving] = React.useState(null);

  const handleRemoveItem = async (cartId) => {
    try {
      setRemoving(cartId);
      await cartAPI.remove(cartId);
      await fetchCart();
      localStorage.setItem('cartUpdated', Date.now().toString());
    } catch (err) {
      console.error('Error removing item:', err);
    } finally {
      setRemoving(null);
    }
  };

  const getItemPrice = (item) => {
    if (item.total_price) {
      return parseFloat(item.total_price);
    }
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

  const getCartTotal = () => {
    return (cartItems || []).reduce((total, item) => {
      return total + getItemPrice(item);
    }, 0);
  };

  if (!isCartModalOpen) return null;

  return (
    <div className="modal active" id="cartModal">
      <div className="modal-content modal-large">
        <button className="modal-close" onClick={closeCartModal}>
          <X size={24} />
        </button>
        <h2><ShoppingCart size={24} /> Shopping Cart</h2>
        
        {cartItems && cartItems.length > 0 ? (
          <>
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div className="cart-item-row" key={item.cart_id}>
                  <div className="cart-item-image">
                    {item.image_url ? (
                      <img src={`http://localhost:5001${item.image_url}`} alt={item.fabric_name} />
                    ) : (
                      <div className="cart-item-placeholder"><Sparkles size={20} /></div>
                    )}
                  </div>
                  <div className="cart-item-info">
                    <h4>
                      {isCustomItem(item) ? (
                        <>
                          <Scissors size={14} style={{marginRight: '6px', color: '#d4af37'}} />
                          Custom Shirt - {item.fabric_name || 'Fabric'}
                        </>
                      ) : (
                        item.fabric_name || 'Fabric'
                      )}
                    </h4>
                    <p className="cart-item-qty">
                      {isCustomItem(item) ? 'Custom Tailored' : `Qty: ${item.quantity}m`}
                    </p>
                    <p className="cart-item-price">₹{getItemPrice(item).toFixed(2)}</p>
                  </div>
                  <button 
                    className="cart-item-remove-btn" 
                    onClick={() => handleRemoveItem(item.cart_id)}
                    disabled={removing === item.cart_id}
                  >
                    {removing === item.cart_id ? <Loader2 size={18} className="spinning" /> : <Trash2 size={18} />}
                  </button>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-total-row">
                <span>Total:</span>
                <span className="cart-total-price">₹{getCartTotal().toFixed(2)}</span>
              </div>
              <button 
                className="btn btn-primary btn-full"
                onClick={() => {
                  closeCartModal();
                  window.location.hash = '#checkout';
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        ) : (
          <div className="cart-empty">
            <ShoppingBag size={80} />
            <p>Your cart is empty</p>
            <button className="btn btn-primary" onClick={closeCartModal}>Start Shopping</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
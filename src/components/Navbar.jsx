import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  UserCircle,
  Ruler,
  Package,
  Calendar,
  LogOut
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const Navbar = ({ cartCount, currentUser, onLogout, onShowProfile }) => {
  const { openLoginModal, openCartModal } = useAppContext();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuActive, setIsMenuActive] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      const scrollY = window.pageYOffset;
      const sections = document.querySelectorAll('section[id]');

      sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          setActiveSection(sectionId);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuActive(!isMenuActive);
  };

  const handleLinkClick = () => {
    setIsMenuActive(false);
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    setIsMenuActive(false);
    setIsProfileDropdownOpen(false);
  };

  const handleProfileMenuClick = (action) => {
    setIsProfileDropdownOpen(false);
    if (onShowProfile) {
      onShowProfile(action);
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`} id="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <h1>INDULGE</h1>
          <span className="nav-tagline">Bespoke Tailoring</span>
        </div>
        <div className={`nav-menu ${isMenuActive ? 'active' : ''}`} id="navMenu">
          <a href="#home" className={`nav-link ${activeSection === 'home' ? 'active' : ''}`} onClick={handleLinkClick}>Home</a>
          <a href="#customize" className={`nav-link ${activeSection === 'customize' ? 'active' : ''}`} onClick={handleLinkClick}>Customize</a>
          <a href="#fabrics" className={`nav-link ${activeSection === 'fabrics' ? 'active' : ''}`} onClick={handleLinkClick}>Fabrics</a>
          <a href="#booking" className={`nav-link ${activeSection === 'booking' ? 'active' : ''}`} onClick={handleLinkClick}>Book Measurement</a>
          <a href="#about" className={`nav-link ${activeSection === 'about' ? 'active' : ''}`} onClick={handleLinkClick}>About</a>
        </div>
        <div className="nav-actions">
          <button className="nav-icon-btn" id="cartBtn" onClick={openCartModal}>
            <ShoppingBag size={20} />
            <span className="cart-count">{cartCount}</span>
          </button>

          {currentUser ? (
            <div
              className="user-profile-wrapper"
              onMouseEnter={() => setIsProfileDropdownOpen(true)}
              onMouseLeave={() => setIsProfileDropdownOpen(false)}
            >
              <button className="user-profile-btn">
                <User size={20} />
                <span className="user-name">{currentUser.firstName || currentUser.username || 'User'}</span>
                <ChevronDown size={16} className={`chevron ${isProfileDropdownOpen ? 'open' : ''}`} />
              </button>

              {isProfileDropdownOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <span className="profile-email">{currentUser.email}</span>
                  </div>
                  <div className="profile-dropdown-menu">
                    <button onClick={() => handleProfileMenuClick('profile')}>
                      <UserCircle size={18} />
                      <span>My Profile</span>
                    </button>
                    <button onClick={() => handleProfileMenuClick('measurements')}>
                      <Ruler size={18} />
                      <span>My Measurements</span>
                    </button>
                    <button onClick={() => handleProfileMenuClick('bookings')}>
                      <Calendar size={18} />
                      <span>Bookings</span>
                    </button>
                    <button onClick={() => handleProfileMenuClick('orders')}>
                      <Package size={18} />
                      <span>My Orders</span>
                    </button>
                    <div className="profile-dropdown-divider"></div>
                    <button className="logout-option" onClick={handleLogoutClick}>
                      <LogOut size={18} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="nav-icon-btn" id="userBtn" onClick={openLoginModal}>
              <User size={20} />
            </button>
          )}

          <button className="nav-icon-btn mobile-menu-btn" id="mobileMenuBtn" onClick={toggleMenu}>
            {isMenuActive ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
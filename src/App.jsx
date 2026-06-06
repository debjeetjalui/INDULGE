import React, { useState, useEffect } from 'react';
import './App.css';
import { AppProvider, useAppContext } from './contexts/AppContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Fabrics from './components/Fabrics';
import Customize from './components/Customize';
import Booking from './components/Booking';
import About from './components/About';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import CartModal from './components/CartModal';
import NotificationsContainer from './components/NotificationsContainer';
import useNotification from './hooks/useNotification';
import VisualizationPage from './components/VisualizationPage';
import ProfilePage from './components/ProfilePage';
import ProductDetails from './components/ProductDetails';
import ShirtCustomizationPage from './components/ShirtCustomizationPage';
import CheckoutPage from './components/CheckoutPage';

function AppContent() {
  const { cartCount, updateCartCount } = useAppContext();
  const { notifications, showNotification, removeNotification } = useNotification();

  const [currentUser, setCurrentUser] = useState(null);

  const [showVisualizationPage, setShowVisualizationPage] = useState(
    () => window.location.hash === '#visualization'
  );
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [profileSection, setProfileSection] = useState('profile');
  const [showProductPage, setShowProductPage] = useState(false);
  const [productId, setProductId] = useState(null);
  const [showCustomizationPage, setShowCustomizationPage] = useState(false);
  const [customizationFabricId, setCustomizationFabricId] = useState(null);
  const [showCheckoutPage, setShowCheckoutPage] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    import('lucide-react').then(module => {
      const { createElement } = module;
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const heroImage = document.querySelector('.hero-image-card');

      if (heroImage && scrolled < window.innerHeight) {
        heroImage.style.transform = `translateY(${scrolled * 0.3}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.feature-card, .fabric-card, .info-card, .timeline-item');

    animatedElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  useEffect(() => {
    const cards = document.querySelectorAll('.feature-card, .fabric-card, .info-card');

    const handleMouseEnter = function () {
      this.style.transition = 'all 0.3s ease';
    };

    cards.forEach(card => {
      card.addEventListener('mouseenter', handleMouseEnter);
    });

    return () => {
      cards.forEach(card => {
        card.removeEventListener('mouseenter', handleMouseEnter);
      });
    };
  }, []);

  useEffect(() => {
    const handleAnchorClick = (e) => {
      const target = e.target.closest('a');
      if (target && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetElement = document.querySelector(target.getAttribute('href'));

        if (targetElement) {
          const offsetTop = targetElement.offsetTop - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  useEffect(() => {
    const handleLoad = () => {
      const loadTime = performance.now();
    };

    window.addEventListener('load', handleLoad);
    return () => window.removeEventListener('load', handleLoad);
  }, []);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    showNotification('Welcome back!', 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setShowProfilePage(false);
    if (window.location.hash) {
      window.history.pushState({ page: 'home' }, '', window.location.pathname);
    }
    showNotification('You have been logged out', 'info');
  };

  const handleStartVisualization = () => {
    window.history.pushState({ page: 'visualization' }, '', '#visualization');
    setShowVisualizationPage(true);
  };

  const handleBackFromVisualization = () => {
    if (window.location.hash === '#visualization') {
      window.history.back();
    } else {
      setShowVisualizationPage(false);
    }
  };

  const handleShowProfile = (section = 'profile') => {
    const hash = section === 'profile' ? '#profile' : `#profile-${section}`;
    window.history.pushState({ page: 'profile', section }, '', hash);
    setShowProfilePage(true);
    setProfileSection(section);
  };

  const handleBackFromProfile = () => {
    window.history.back();
  };

  useEffect(() => {
    const handlePopState = (event) => {
      const hash = window.location.hash;
      
      const customizationMatch = hash.match(/^#customization\/(\d+)$/);
      
      const productMatch = hash.match(/^#product\/(\d+)$/);
      
      if (customizationMatch) {
        setCustomizationFabricId(customizationMatch[1]);
        setShowCustomizationPage(true);
        setShowProductPage(false);
        setShowProfilePage(false);
        setShowVisualizationPage(false);
      } else if (productMatch) {
        setProductId(productMatch[1]);
        setShowProductPage(true);
        setShowCustomizationPage(false);
        setShowProfilePage(false);
        setShowVisualizationPage(false);
      } else if (hash === '#profile') {
        setShowProfilePage(true);
        setProfileSection('profile');
        setShowVisualizationPage(false);
        setShowProductPage(false);
        setShowCustomizationPage(false);
      } else if (hash === '#profile-measurements') {
        setShowProfilePage(true);
        setProfileSection('measurements');
        setShowVisualizationPage(false);
        setShowProductPage(false);
        setShowCustomizationPage(false);
      } else if (hash === '#visualization') {
        setShowVisualizationPage(true);
        setShowProfilePage(false);
        setShowProductPage(false);
        setShowCustomizationPage(false);
        setShowCheckoutPage(false);
      } else if (hash === '#checkout') {
        setShowCheckoutPage(true);
        setShowVisualizationPage(false);
        setShowProfilePage(false);
        setShowProductPage(false);
        setShowCustomizationPage(false);
      } else {
        setShowProfilePage(false);
        setShowVisualizationPage(false);
        setShowProductPage(false);
        setShowCustomizationPage(false);
        setShowCheckoutPage(false);
        setProductId(null);
        setCustomizationFabricId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    const initialHash = window.location.hash;
    const customizationMatch = initialHash.match(/^#customization\/(\d+)$/);
    const productMatch = initialHash.match(/^#product\/(\d+)$/);
    
    if (customizationMatch) {
      setCustomizationFabricId(customizationMatch[1]);
      setShowCustomizationPage(true);
    } else if (productMatch) {
      setProductId(productMatch[1]);
      setShowProductPage(true);
    } else if (initialHash === '#profile' && currentUser) {
      setShowProfilePage(true);
    } else if (initialHash === '#visualization') {
      setShowVisualizationPage(true);
    } else if (initialHash === '#checkout') {
      setShowCheckoutPage(true);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleBackFromProduct = () => {
    window.close();
    setShowProductPage(false);
    setProductId(null);
  };

  const handleBackFromCustomization = () => {
    window.close();
    setShowCustomizationPage(false);
    setCustomizationFabricId(null);
  };

  const handleBackFromCheckout = () => {
    setShowCheckoutPage(false);
    window.location.hash = '';
  };

  if (showCheckoutPage) {
    return (
      <div className="App">
        <CheckoutPage
          onBack={handleBackFromCheckout}
          showNotification={showNotification}
          currentUser={currentUser}
        />
        <NotificationsContainer
          notifications={notifications}
          onRemove={removeNotification}
        />
      </div>
    );
  }

  if (showCustomizationPage && customizationFabricId) {
    return (
      <div className="App">
        <ShirtCustomizationPage
          fabricId={customizationFabricId}
          onBack={handleBackFromCustomization}
          showNotification={showNotification}
          currentUser={currentUser}
        />
        <NotificationsContainer
          notifications={notifications}
          onRemove={removeNotification}
        />
      </div>
    );
  }

  if (showProductPage && productId) {
    return (
      <div className="App">
        <ProductDetails
          fabricId={productId}
          showNotification={showNotification}
          onStartVisualization={handleStartVisualization}
        />
        <NotificationsContainer
          notifications={notifications}
          onRemove={removeNotification}
        />
      </div>
    );
  }

  if (showProfilePage && currentUser) {
    return (
      <div className="App">
        <ProfilePage
          currentUser={currentUser}
          onBack={handleBackFromProfile}
          showNotification={showNotification}
          onUpdateUser={handleUpdateUser}
          scrollToSection={profileSection}
        />
        <NotificationsContainer
          notifications={notifications}
          onRemove={removeNotification}
        />
      </div>
    );
  }

  if (showVisualizationPage && window.location.hash === '#visualization') {
    return (
      <div className="App">
        <VisualizationPage
          onBack={handleBackFromVisualization}
          showNotification={showNotification}
          currentUser={currentUser}
        />
        <LoginModal
          showNotification={showNotification}
          onLoginSuccess={handleLoginSuccess}
        />
        <NotificationsContainer
          notifications={notifications}
          onRemove={removeNotification}
        />
      </div>
    );
  }

  if (showVisualizationPage) {
    return (
      <div className="App">
        <VisualizationPage
          onBack={handleBackFromVisualization}
          showNotification={showNotification}
          currentUser={currentUser}
        />
        <LoginModal
          showNotification={showNotification}
          onLoginSuccess={handleLoginSuccess}
        />
        <NotificationsContainer
          notifications={notifications}
          onRemove={removeNotification}
        />
      </div>
    );
  }

  return (
    <div className="App">
      <Navbar
        cartCount={cartCount}
        currentUser={currentUser}
        onLogout={handleLogout}
        onShowProfile={handleShowProfile}
      />
      <main>
        <Hero />
        <Features />
        <Customize onStartVisualization={handleStartVisualization} />
        <Fabrics showNotification={showNotification} />
        <Booking showNotification={showNotification} currentUser={currentUser} onShowProfile={handleShowProfile} />
        <About />
      </main>
      <Footer />
      <LoginModal
        showNotification={showNotification}
        onLoginSuccess={handleLoginSuccess}
      />
      <CartModal />
      <NotificationsContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
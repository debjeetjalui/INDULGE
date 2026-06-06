import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Check, ShoppingCart, Loader2,
  Shirt, Ruler, Scissors, Package, CreditCard, X,
  ChevronDown, ChevronUp, Save, Eye
} from 'lucide-react';
import { fabricsAPI, cartAPI, measurementsAPI } from '../services/api';
import ShirtPreview2D from './ShirtPreview2D';

const collarOptions = [
  { id: 'point', name: 'Point Collar', image: '/src/Customization-img\'s/Collar\'s/point collar.png', desc: 'Classic, versatile', styles: ['formal'] },
  { id: 'spread', name: 'Spread Collar', image: '/src/Customization-img\'s/Collar\'s/spread collar.png', desc: 'Modern, works with tie', styles: ['formal', 'party'] },
  { id: 'semi-spread', name: 'Semi-spread', image: '/src/Customization-img\'s/Collar\'s/Semi-spread collar.png', desc: 'Balanced, professional', styles: ['formal'] },
  { id: 'button-down', name: 'Button Down', image: '/src/Customization-img\'s/Collar\'s/button down collar.png', desc: 'Casual, sporty', styles: ['formal', 'casual'] },
  { id: 'cutaway', name: 'Cutaway', image: '/src/Customization-img\'s/Collar\'s/cutaway collar.png', desc: 'Wide spread, modern', styles: ['formal', 'party'] },
  { id: 'club', name: 'Club Collar', image: '/src/Customization-img\'s/Collar\'s/club collar.png', desc: 'Rounded corners, retro', styles: ['casual', 'party'] },
  { id: 'mandarin', name: 'Mandarin', image: '/src/Customization-img\'s/Collar\'s/Mandarin Collar.png', desc: 'Band style, no fold', styles: ['casual', 'party'] },
  { id: 'nehru', name: 'Nehru Collar', image: '/src/Customization-img\'s/Collar\'s/Nehru Collar.png', desc: 'Standing band, elegant', styles: ['casual', 'party'] },
  { id: 'band', name: 'Band Collar', image: '/src/Customization-img\'s/Collar\'s/Band Collar.png', desc: 'Minimalist, clean', styles: ['casual'] },
  { id: 'wing', name: 'Wing Collar', image: '/src/Customization-img\'s/Collar\'s/wing collar.png', desc: 'Formal, tuxedo style', styles: ['formal'] },
  { id: 'camp', name: 'Camp Collar', image: '/src/Customization-img\'s/Collar\'s/Camp Collar.png', desc: 'Relaxed, casual', styles: ['casual', 'party'] },
  { id: 'convertible', name: 'Convertible', image: '/src/Customization-img\'s/Collar\'s/Convertible Collar.png', desc: 'Versatile open/closed', styles: ['casual', 'party'] },
  { id: 'pinned', name: 'Pinned/Tab', image: '/src/Customization-img\'s/Collar\'s/pinned,tab collar.png', desc: 'Elevated with pin/tab', styles: ['formal'] },
];

const styleOptions = [
  { id: 'formal', name: 'Formal', image: "/src/Customization-img's/forms/Formal-shirt.png", desc: 'Business meetings, office wear', premium: 200 },
  { id: 'casual', name: 'Casual', image: "/src/Customization-img's/forms/Causal-shirt.png", desc: 'Everyday comfort, relaxed fit', premium: 0 },
  { id: 'party', name: 'Party Wear', image: "/src/Customization-img's/forms/Party-shirt.png", desc: 'Special occasions, standout style', premium: 400 },
];

const shoulderOptions = [
  { id: 'athletic', name: 'Athletic', image: "/src/Customization-img's/Shoulder's/Athletic shoulders.png", desc: 'Fitted, structured shoulders' },
  { id: 'broad', name: 'Broad', image: "/src/Customization-img's/Shoulder's/Broad shoulders.png", desc: 'Wide shoulder seams' },
  { id: 'narrow', name: 'Narrow', image: "/src/Customization-img's/Shoulder's/Narrow shoulders.png", desc: 'Slim shoulder fit' },
  { id: 'sloped', name: 'Slightly Sloped', image: "/src/Customization-img's/Shoulder's/Slightly sloped.png", desc: 'Natural slope style' },
  { id: 'square', name: 'Square', image: "/src/Customization-img's/Shoulder's/Square shoulders.png", desc: 'Structured square cut' },
  { id: 'very-broad', name: 'Very Broad', image: "/src/Customization-img's/Shoulder's/Very broad.png", desc: 'Extra wide shoulders' },
];

const cuffOptions = [
  { id: 'single-button', name: 'Single Button', image: "/src/Customization-img's/Cuff's/Single-button.png", desc: 'Classic one-button' },
  { id: 'single-angled-barrel', name: 'Single Angled Barrel', image: "/src/Customization-img's/Cuff's/Single-Button-Angled-Barrel-cuff.png", desc: 'Angled barrel style' },
  { id: 'single-rounded-barrel', name: 'Single Rounded Barrel', image: "/src/Customization-img's/Cuff's/Single-Button-Rounded-Barrel-cuff.png", desc: 'Rounded barrel style' },
  { id: 'single-square-barrel', name: 'Single Square Barrel', image: "/src/Customization-img's/Cuff's/Single-Button-Square-Barrel-cuff.png", desc: 'Square barrel style' },
  { id: 'single-angled-french', name: 'Single Angled French', image: "/src/Customization-img's/Cuff's/Single-Button-Angled-French-cuff.png", desc: 'Angled french cuff' },
  { id: 'single-rounded-french', name: 'Single Rounded French', image: "/src/Customization-img's/Cuff's/Single-Button-Rounded-French-cuff.png", desc: 'Rounded french cuff' },
  { id: 'single-square-french', name: 'Single Square French', image: "/src/Customization-img's/Cuff's/Single-Button-Square-French-cuff.png", desc: 'Square french cuff' },
  { id: 'double-angled', name: 'Double Angled Barrel', image: "/src/Customization-img's/Cuff's/Double-Button-Angled-Barrel-cuff.png", desc: 'Double button angled' },
  { id: 'double-rounded', name: 'Double Rounded Barrel', image: "/src/Customization-img's/Cuff's/Double-Button-Rounded-Barrel-cuff.png", desc: 'Double button rounded' },
  { id: 'double-square', name: 'Double Square Barrel', image: "/src/Customization-img's/Cuff's/Double-Button-Square-Barrel-cuff.png", desc: 'Double button square' },
  { id: '3-button-angled', name: '3-Button Angled', image: "/src/Customization-img's/Cuff's/3-button-Angled.png", desc: 'Three button angled' },
  { id: '3-button-rounded', name: '3-Button Rounded', image: "/src/Customization-img's/Cuff's/3-button-Rounded.png", desc: 'Three button rounded' },
  { id: '3-button-square', name: '3-Button Square', image: "/src/Customization-img's/Cuff's/3-button-square.png", desc: 'Three button square' },
];

const pocketOptions = [
  { id: 'single-square', name: 'Single Square Patch', image: "/src/Customization-img's/Pocket's/Single Patch Pocket (Square).png", desc: 'Classic square pocket' },
  { id: 'single-angled', name: 'Single Angled Patch', image: "/src/Customization-img's/Pocket's/Single Patch Pocket (Angled).png", desc: 'Angled patch style' },
  { id: 'curved-patch', name: 'Curved Patch', image: "/src/Customization-img's/Pocket's/Curved Patch Pocket.png", desc: 'Rounded pocket design' },
  { id: 'double-patch', name: 'Double Patch', image: "/src/Customization-img's/Pocket's/Double Patch Pockets.png", desc: 'Two chest pockets' },
  { id: 'flap', name: 'Flap Pocket', image: "/src/Customization-img's/Pocket's/Flap Pocket.png", desc: 'Pocket with flap cover' },
  { id: 'welt', name: 'Jetted/Welt Pocket', image: "/src/Customization-img's/Pocket's/Jetted , Welt Pocket.png", desc: 'Sleek hidden pocket' },
];

const readySizes = [
  { id: 'S', name: 'Small', chest: '36-38"', neck: '14-14.5"' },
  { id: 'M', name: 'Medium', chest: '38-40"', neck: '15-15.5"' },
  { id: 'L', name: 'Large', chest: '40-42"', neck: '16-16.5"' },
  { id: 'XL', name: 'X-Large', chest: '42-44"', neck: '17-17.5"' },
  { id: 'XXL', name: '2X-Large', chest: '44-46"', neck: '18-18.5"' },
];

const sleeveOptions = [
  { id: 'half-sleeve', name: 'Half Sleeve', image: "/src/Customization-img's/Sleeve's/Half-sleeve.png", desc: 'Short sleeves' },
  { id: 'full-sleeve', name: 'Full Sleeve', image: "/src/Customization-img's/Sleeve's/Full-sleeve.png", desc: 'Long sleeves with cuff' },
];

const STEPS = [
  { id: 1, name: 'Style', icon: Shirt },
  { id: 2, name: 'Collar', icon: Scissors },
  { id: 3, name: 'Shoulder', icon: Ruler },
  { id: 4, name: 'Sleeve', icon: Shirt },
  { id: 5, name: 'Cuff', icon: Scissors },
  { id: 6, name: 'Pocket', icon: Package },
  { id: 7, name: 'Size', icon: Ruler },
  { id: 8, name: 'Preview', icon: Eye },
  { id: 9, name: 'Checkout', icon: CreditCard },
];

const ShirtCustomizationPage = ({ fabricId, onBack, showNotification, currentUser }) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  const [fabric, setFabric] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [userMeasurements, setUserMeasurements] = useState(null);
  
  const [selections, setSelections] = useState({
    style: null,
    collar: null,
    shoulder: null,
    sleeve: null,
    cuff: null,
    pocket: null,
    sizeType: null,
    readySize: null,
  });
  
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [savingMeasurements, setSavingMeasurements] = useState(false);
  const [measurementForm, setMeasurementForm] = useState({
    neck_circumference: '', chest_circumference: '', waist_circumference: '',
    shoulder_width: '', sleeve_length: '', torso_length: '', notes: ''
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (fabricId) {
          const fabricRes = await fabricsAPI.getById(fabricId);
          setFabric(fabricRes.data);
        }
        
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const measRes = await measurementsAPI.get();
            if (measRes.data && measRes.data.length > 0) {
              setUserMeasurements(measRes.data[0]);
            }
          } catch (err) {
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        showNotification?.('Failed to load fabric details', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [fabricId]);
  
  const updateSelection = (key, value) => {
    setSelections(prev => ({ ...prev, [key]: value }));
  };
  
  const goNext = () => {
    let nextStep = currentStep + 1;
    
    if (nextStep === 4 && selections.style !== 'party') {
      nextStep = 5;
    }
    
    if (nextStep === 5 && selections.style === 'party' && 
        selections.sleeve === 'half-sleeve') {
      nextStep = 6;
    }
    
    if (nextStep <= 9) setCurrentStep(nextStep);
  };
  
  const goBack = () => {
    let prevStep = currentStep - 1;
    
    if (prevStep === 5 && selections.style === 'party' && 
        selections.sleeve === 'half-sleeve') {
      prevStep = 4;
    }
    
    if (prevStep === 4 && selections.style !== 'party') {
      prevStep = 3;
    }
    
    if (prevStep >= 1) setCurrentStep(prevStep);
  };
  
  const isStepComplete = () => {
    switch (currentStep) {
      case 1: return !!selections.style;
      case 2: return !!selections.collar;
      case 3: return !!selections.shoulder;
      case 4: return !!selections.sleeve;
      case 5: return !!selections.cuff;
      case 6: return !!selections.pocket;
      case 7: return selections.sizeType && (selections.sizeType === 'custom' || selections.readySize);
      case 8: return true;
      case 9: return true;
      default: return false;
    }
  };
  
  const calculatePricing = () => {
    if (!fabric) return { fabric: 0, making: 0, style: 0, delivery: 0, total: 0 };
    
    const fabricCost = (fabric.price || 0) * 2.5;
    const makingCharge = 1200;
    const stylePremium = styleOptions.find(s => s.id === selections.style)?.premium || 0;
    const deliveryCharge = 100;
    
    return {
      fabric: fabricCost,
      making: makingCharge,
      style: stylePremium,
      delivery: deliveryCharge,
      total: fabricCost + makingCharge + stylePremium + deliveryCharge,
    };
  };
  
  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification?.('Please login to add items to cart', 'warning');
      return;
    }
    
    try {
      setAddingToCart(true);
      
      const pricing = calculatePricing();
      
      await cartAPI.add({
        fabric_id: fabric.fabric_id,
        quantity: 2.5,
        total_price: pricing.total,
        customization_details: {
          type: 'custom_shirt',
          style: selections.style,
          collar: selections.collar,
          shoulder: selections.shoulder,
          cuff: selections.cuff,
          pocket: selections.pocket,
          size_type: selections.sizeType,
          ready_size: selections.readySize,
          fabric_cost: pricing.fabric,
          making_charge: pricing.making,
          style_premium: pricing.style,
          delivery_charge: pricing.delivery,
          total: pricing.total
        }
      });
      
      showNotification?.('Custom shirt added to cart!', 'success');
      
      localStorage.setItem('cartUpdated', Date.now().toString());
      
      setAddedToCart(true);
      
    } catch (err) {
      console.error('Error adding to cart:', err);
      showNotification?.('Failed to add to cart', 'error');
    } finally {
      setAddingToCart(false);
    }
  };
  
  const handleGoToCheckout = () => {
    window.location.hash = '#checkout';
  };
  const handleEditMeasurements = () => {
    if (userMeasurements) {
      setMeasurementForm({
        neck_circumference: userMeasurements.neck_circumference || '',
        chest_circumference: userMeasurements.chest_circumference || '',
        waist_circumference: userMeasurements.waist_circumference || '',
        shoulder_width: userMeasurements.shoulder_width || '',
        sleeve_length: userMeasurements.sleeve_length || '',
        torso_length: userMeasurements.torso_length || '',
        notes: userMeasurements.notes || ''
      });
    }
    setShowMeasurementForm(true);
  };
  const handleSaveMeasurements = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification?.('Please login to save measurements', 'warning');
      return;
    }
    try {
      setSavingMeasurements(true);
      await measurementsAPI.save(measurementForm);
      const measRes = await measurementsAPI.get();
      if (measRes.data && measRes.data.length > 0) {
        setUserMeasurements(measRes.data[0]);
      }
      setShowMeasurementForm(false);
      showNotification?.('Measurements saved successfully!', 'success');
    } catch (err) {
      showNotification?.('Failed to save measurements', 'error');
    } finally {
      setSavingMeasurements(false);
    }
  };
  const updateMeasurementField = (field, value) => {
    setMeasurementForm(prev => ({ ...prev, [field]: value }));
  };
  
  const handleClose = () => {
    if (onBack) {
      onBack();
    } else {
      window.close();
    }
  };
  
  if (loading) {
    return (
      <div className="customization-page">
        <div className="customization-loading">
          <Loader2 size={48} className="spinning" />
          <p>Loading customization options...</p>
        </div>
      </div>
    );
  }
  
  const pricing = calculatePricing();
  const availablePockets = pocketOptions[selections.style] || pocketOptions.casual;
  
  return (
    <div className="customization-page">
      <header className="customization-header">
        <div className="customization-header-left">
          <div className="customization-logo">
            <Scissors size={28} />
          </div>
          <div className="customization-brand">
            <h1>INDULGE</h1>
            <span>Shirt Customization</span>
          </div>
        </div>
        <div className="customization-header-right">
          {fabric && (
            <div className="customization-fabric-info">
              <span className="fabric-name">{fabric.name}</span>
              <span className="fabric-price">₹{fabric.price}/m</span>
            </div>
          )}
          <button className="btn-close-custom" onClick={handleClose} title="Close">
            <X size={20} />
          </button>
        </div>
      </header>
      
      <div className="customization-progress">
        <div className="progress-steps">
          {STEPS.filter(step => {
            if (step.id === 4 && selections.style !== 'party') return false;
            if (step.id === 5 && selections.style === 'party' && 
                selections.sleeve === 'half-sleeve') return false;
            return true;
          }).map((step, index, filteredSteps) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isComplete = currentStep > step.id;
            
            return (
              <div 
                key={step.id}
                className={`progress-step ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
              >
                <div className="step-circle">
                  {isComplete ? <Check size={16} /> : <StepIcon size={16} />}
                </div>
                <span className="step-name">{step.name}</span>
                {index < filteredSteps.length - 1 && <div className="step-line" />}
              </div>
            );
          })}
        </div>
      </div>
      
      <main className="customization-main">
        <div className="customization-container">
          
          {currentStep === 1 && (
            <div className="customization-step-fullscreen">              
              <div className="style-cards-fullscreen">
                {styleOptions.map(style => (
                  <div 
                    key={style.id}
                    className={`style-card-large ${selections.style === style.id ? 'selected' : ''}`}
                    onClick={() => updateSelection('style', style.id)}
                  >
                    <div className="style-card-image">
                      <img src={style.image} alt={style.name} />
                    </div>
                    <div className="style-card-info">
                      <h3>{style.name}</h3>
                      <p>{style.desc}</p>
                      {style.premium > 0 && (
                        <span className="style-premium">+₹{style.premium}</span>
                      )}
                    </div>
                    {selections.style === style.id && (
                      <div className="style-check"><Check size={24} /></div>
                    )}
                  </div>
                ))}
              </div>
              
              {selections.style && (
                <button 
                  className="btn-next-floating" 
                  onClick={goNext}
                >
                  <span>Next</span>
                  <ArrowRight size={22} />
                </button>
              )}
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="customization-step">              
              <div className="options-grid options-grid-collar">
                {collarOptions.filter(collar => collar.styles.includes(selections.style)).map(collar => (
                  <div 
                    key={collar.id}
                    className={`option-card option-card-image ${selections.collar === collar.id ? 'selected' : ''}`}
                    onClick={() => updateSelection('collar', collar.id)}
                  >
                    <div className="option-image">
                      <img src={collar.image} alt={collar.name} />
                    </div>
                    <h4>{collar.name}</h4>
                    <p>{collar.desc}</p>
                    {selections.collar === collar.id && (
                      <div className="option-check"><Check size={16} /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="customization-step">              
              <div className="options-grid options-grid-3">
                {shoulderOptions.map(shoulder => (
                  <div 
                    key={shoulder.id}
                    className={`option-card option-card-image ${selections.shoulder === shoulder.id ? 'selected' : ''}`}
                    onClick={() => updateSelection('shoulder', shoulder.id)}
                  >
                    <div className="option-image">
                      <img src={shoulder.image} alt={shoulder.name} />
                    </div>
                    <h4>{shoulder.name}</h4>
                    <p>{shoulder.desc}</p>
                    {selections.shoulder === shoulder.id && (
                      <div className="option-check"><Check size={16} /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {currentStep === 4 && selections.style === 'party' && (
            <div className="customization-step">              
              <div className="options-grid options-grid-3">
                {sleeveOptions.map(sleeve => (
                  <div 
                    key={sleeve.id}
                    className={`option-card option-card-image ${selections.sleeve === sleeve.id ? 'selected' : ''}`}
                    onClick={() => updateSelection('sleeve', sleeve.id)}
                  >
                    <div className="option-image">
                      <img src={sleeve.image} alt={sleeve.name} />
                    </div>
                    <h4>{sleeve.name}</h4>
                    <p>{sleeve.desc}</p>
                    {selections.sleeve === sleeve.id && (
                      <div className="option-check"><Check size={16} /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {currentStep === 5 && (
            <div className="customization-step">              
              <div className="options-grid options-grid-3">
                {cuffOptions.map(cuff => (
                  <div 
                    key={cuff.id}
                    className={`option-card option-card-image ${selections.cuff === cuff.id ? 'selected' : ''}`}
                    onClick={() => updateSelection('cuff', cuff.id)}
                  >
                    <div className="option-image">
                      <img src={cuff.image} alt={cuff.name} />
                    </div>
                    <h4>{cuff.name}</h4>
                    <p>{cuff.desc}</p>
                    {selections.cuff === cuff.id && (
                      <div className="option-check"><Check size={16} /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {currentStep === 6 && (
            <div className="customization-step">              
              <div className="options-grid options-grid-3">
                {pocketOptions.map(pocket => (
                  <div 
                    key={pocket.id}
                    className={`option-card option-card-image ${selections.pocket === pocket.id ? 'selected' : ''}`}
                    onClick={() => updateSelection('pocket', pocket.id)}
                  >
                    <div className="option-image">
                      <img src={pocket.image} alt={pocket.name} />
                    </div>
                    <h4>{pocket.name}</h4>
                    <p>{pocket.desc}</p>
                    {selections.pocket === pocket.id && (
                      <div className="option-check"><Check size={16} /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {currentStep === 7 && (
            <div className="customization-step">
              <h2>Select Your Size</h2>
              <p className="step-description">Choose ready-made sizes or use your custom measurements</p>
              
              <div className="size-type-toggle">
                <button 
                  className={`size-type-btn ${selections.sizeType === 'ready' ? 'active' : ''}`}
                  onClick={() => updateSelection('sizeType', 'ready')}
                >
                  Ready Sizes
                </button>
                <button 
                  className={`size-type-btn ${selections.sizeType === 'custom' ? 'active' : ''}`}
                  onClick={() => updateSelection('sizeType', 'custom')}
                >
                  My Measurements
                </button>
              </div>
              
              {selections.sizeType === 'ready' && (
                <div className="options-grid options-grid-5">
                  {readySizes.map(size => (
                    <div 
                      key={size.id}
                      className={`option-card option-card-size ${selections.readySize === size.id ? 'selected' : ''}`}
                      onClick={() => updateSelection('readySize', size.id)}
                    >
                      <h3 className="size-letter">{size.id}</h3>
                      <p className="size-name">{size.name}</p>
                      <div className="size-details">
                        <span>Chest: {size.chest}</span>
                        <span>Neck: {size.neck}</span>
                      </div>
                      {selections.readySize === size.id && (
                        <div className="option-check"><Check size={16} /></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {selections.sizeType === 'custom' && (
                <div className="custom-measurements-preview">
                  {showMeasurementForm ? (
                    <div className="inline-measurement-form">
                      <h3>{userMeasurements ? 'Edit Measurements' : 'Add Your Measurements'}</h3>
                      <p className="form-hint">All values in centimeters (cm)</p>
                      <div className="measurement-form-grid">
                        <div className="measurement-field">
                          <label>Neck</label>
                          <input type="number" step="0.1" placeholder="e.g. 38" value={measurementForm.neck_circumference} onChange={e => updateMeasurementField('neck_circumference', e.target.value)} />
                        </div>
                        <div className="measurement-field">
                          <label>Chest</label>
                          <input type="number" step="0.1" placeholder="e.g. 96" value={measurementForm.chest_circumference} onChange={e => updateMeasurementField('chest_circumference', e.target.value)} />
                        </div>
                        <div className="measurement-field">
                          <label>Waist</label>
                          <input type="number" step="0.1" placeholder="e.g. 82" value={measurementForm.waist_circumference} onChange={e => updateMeasurementField('waist_circumference', e.target.value)} />
                        </div>
                        <div className="measurement-field">
                          <label>Shoulder Width</label>
                          <input type="number" step="0.1" placeholder="e.g. 44" value={measurementForm.shoulder_width} onChange={e => updateMeasurementField('shoulder_width', e.target.value)} />
                        </div>
                        <div className="measurement-field">
                          <label>Sleeve Length</label>
                          <input type="number" step="0.1" placeholder="e.g. 62" value={measurementForm.sleeve_length} onChange={e => updateMeasurementField('sleeve_length', e.target.value)} />
                        </div>
                        <div className="measurement-field">
                          <label>Shirt Length</label>
                          <input type="number" step="0.1" placeholder="e.g. 72" value={measurementForm.torso_length} onChange={e => updateMeasurementField('torso_length', e.target.value)} />
                        </div>
                      </div>
                      <div className="measurement-field measurement-notes-field">
                        <label>Notes (optional)</label>
                        <textarea placeholder="Any special notes..." value={measurementForm.notes} onChange={e => updateMeasurementField('notes', e.target.value)} rows={2} />
                      </div>
                      <div className="measurement-form-actions">
                        <button type="button" className="btn-cancel-measurement" onClick={() => setShowMeasurementForm(false)}>Cancel</button>
                        <button type="button" className="btn-save-measurement" onClick={handleSaveMeasurements} disabled={savingMeasurements}>
                          {savingMeasurements ? <Loader2 size={16} className="spinning" /> : <Save size={16} />}
                          {savingMeasurements ? 'Saving...' : 'Save Measurements'}
                        </button>
                      </div>
                    </div>
                  ) : userMeasurements ? (
                    <>
                      <h3>Your Saved Measurements</h3>
                      <div className="measurements-grid">
                        <div className="measurement-item"><span className="label">Chest</span><span className="value">{userMeasurements.chest_circumference || '—'} cm</span></div>
                        <div className="measurement-item"><span className="label">Shoulder</span><span className="value">{userMeasurements.shoulder_width || '—'} cm</span></div>
                        <div className="measurement-item"><span className="label">Sleeve</span><span className="value">{userMeasurements.sleeve_length || '—'} cm</span></div>
                        <div className="measurement-item"><span className="label">Neck</span><span className="value">{userMeasurements.neck_circumference || '—'} cm</span></div>
                        <div className="measurement-item"><span className="label">Shirt Length</span><span className="value">{userMeasurements.torso_length || '—'} cm</span></div>
                        <div className="measurement-item"><span className="label">Waist</span><span className="value">{userMeasurements.waist_circumference || '—'} cm</span></div>
                      </div>
                      <p className="measurements-note">These measurements will be used for your custom shirt</p>
                      <button type="button" className="btn-edit-measurements" onClick={handleEditMeasurements}>
                        <Ruler size={16} /> Edit Measurements
                      </button>
                    </>
                  ) : (
                    <div className="no-measurements">
                      <div className="no-measurements-icon"><Ruler size={48} /></div>
                      <h3>No Measurements Found</h3>
                      <p>Add your body measurements to get a perfectly fitted custom shirt</p>
                      <button type="button" className="btn-add-measurements" onClick={handleEditMeasurements}>
                        <Ruler size={18} /> Add My Measurements
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {currentStep === 8 && (
            <div className="customization-step preview-step">
              <ShirtPreview2D
                selections={selections}
                fabric={fabric}
                styleOptions={styleOptions}
                collarOptions={collarOptions}
                shoulderOptions={shoulderOptions}
                sleeveOptions={sleeveOptions}
                cuffOptions={cuffOptions}
                pocketOptions={pocketOptions}
              />
            </div>
          )}

          {currentStep === 9 && (
            <div className="customization-step checkout-step">
              <h2>Order Summary</h2>
              <p className="step-description">Review your custom shirt details</p>
              
              <div className="checkout-layout">
                <div className="checkout-selections">
                  <h3>Your Selections</h3>
                  
                  <div className="selection-row">
                    <span className="selection-label">Fabric</span>
                    <span className="selection-value">{fabric?.name}</span>
                  </div>
                  
                  <div className="selection-row">
                    <span className="selection-label">Style</span>
                    <span className="selection-value">
                      {styleOptions.find(s => s.id === selections.style)?.name}
                    </span>
                  </div>
                  
                  <div className="selection-row">
                    <span className="selection-label">Collar</span>
                    <span className="selection-value">
                      {collarOptions.find(c => c.id === selections.collar)?.name}
                    </span>
                  </div>
                  
                  <div className="selection-row">
                    <span className="selection-label">Shoulder</span>
                    <span className="selection-value">
                      {shoulderOptions.find(s => s.id === selections.shoulder)?.name}
                    </span>
                  </div>
                  
                  <div className="selection-row">
                    <span className="selection-label">Cuff</span>
                    <span className="selection-value">
                      {cuffOptions.find(c => c.id === selections.cuff)?.name}
                    </span>
                  </div>
                  
                  <div className="selection-row">
                    <span className="selection-label">Pocket</span>
                    <span className="selection-value">
                      {pocketOptions.find(p => p.id === selections.pocket)?.name}
                    </span>
                  </div>
                  
                  <div className="selection-row">
                    <span className="selection-label">Size</span>
                    <span className="selection-value">
                      {selections.sizeType === 'custom' ? 'Custom Measurements' : `Ready Size: ${selections.readySize}`}
                    </span>
                  </div>
                </div>
                
                <div className="checkout-pricing">
                  <h3>Price Breakdown</h3>
                  
                  <div className="price-row">
                    <span>Fabric Cost (2.5m × ₹{fabric?.price})</span>
                    <span>₹{pricing.fabric.toFixed(2)}</span>
                  </div>
                  
                  <div className="price-row">
                    <span>Making Charge</span>
                    <span>₹{pricing.making}</span>
                  </div>
                  
                  {pricing.style > 0 && (
                    <div className="price-row">
                      <span>Style Premium</span>
                      <span>₹{pricing.style}</span>
                    </div>
                  )}
                  
                  <div className="price-row">
                    <span>Delivery</span>
                    <span>₹{pricing.delivery}</span>
                  </div>
                  
                  <div className="price-row price-total">
                    <span>Total</span>
                    <span>₹{pricing.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </main>
      
      {currentStep > 1 && (
        <>
          <button type="button" className="btn-back-floating" onClick={goBack}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          
          {currentStep < 9 ? (
            <button 
              type="button"
              className="btn-next-floating" 
              onClick={goNext}
              disabled={!isStepComplete()}
            >
              <span>Next</span>
              <ArrowRight size={22} />
            </button>
          ) : addedToCart ? (
            <button 
              type="button"
              className="btn-next-floating btn-checkout-success" 
              onClick={handleGoToCheckout}
            >
              <Check size={20} />
              <span>Proceed to Checkout</span>
            </button>
          ) : (
            <button 
              type="button"
              className="btn-next-floating btn-checkout-floating" 
              onClick={handleAddToCart}
              disabled={addingToCart}
            >
              {addingToCart ? (
                <Loader2 size={20} className="spinning" />
              ) : (
                <ShoppingCart size={20} />
              )}
              <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ShirtCustomizationPage;

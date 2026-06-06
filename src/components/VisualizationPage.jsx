import React, { useState, useEffect } from 'react';
import GarmentViewer from './3d/GarmentViewer';
import FabricPanel from './3d/FabricPanel';
import GarmentSelector from './3d/GarmentSelector';
import api3d from '../services/api3d';
import { User, LogIn } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export default function VisualizationPage({ onBack, showNotification, currentUser }) {
  const { openLoginModal } = useAppContext();
  const [garments, setGarments] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [selectedGarment, setSelectedGarment] = useState(null);
  const [selectedFabric, setSelectedFabric] = useState(null);
  const [fabricScale, setFabricScale] = useState(2);
  const [loading, setLoading] = useState({ garments: true, fabrics: true });
  const [error, setError] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('fabrics');


  const API_BASE_URL = api3d.getAssetBaseUrl();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const garmentsData = await api3d.getGarments();
        setGarments(garmentsData);
        setLoading(prev => ({ ...prev, garments: false }));
      } catch (err) {
        console.error('Failed to fetch garments:', err);
        const fallbackGarments = [
          { id: 1, name: "Men's Suit", type: 'suit', model_url: '/models/Suit/A_Customizable_Men\'s_Suit_for_Web-Based_Tailoring.glb' },
          { id: 2, name: 'Plain T-Shirt', type: 'tshirt', model_url: '/models/T-Shirt/A_Plain_White_T-Shirt.glb' },
        ];
        setGarments(fallbackGarments);
        setLoading(prev => ({ ...prev, garments: false }));
      }

      try {
        const fabricsData = await api3d.get3DFabrics();
        setFabrics(fabricsData);
        setLoading(prev => ({ ...prev, fabrics: false }));
      } catch (err) {
        console.error('Failed to fetch fabrics:', err);
        const fallbackFabrics = [
          { id: 1, name: 'Navy Blue Cotton', category: 'cotton', color_hex: '#1a365d' },
          { id: 2, name: 'Charcoal Wool', category: 'wool', color_hex: '#374151' },
          { id: 3, name: 'Light Gray Linen', category: 'linen', color_hex: '#9ca3af' },
        ];
        setFabrics(fallbackFabrics);
        setLoading(prev => ({ ...prev, fabrics: false }));
      }
    };

    fetchData();
  }, []);



  const modelUrl = selectedGarment
    ? `${API_BASE_URL}${selectedGarment.model_url}`
    : null;

  const fabricTextureUrl = selectedFabric?.texture_url
    ? `${API_BASE_URL}${selectedFabric.texture_url}`
    : null;



  return (
    <div className="visualization-page">
      <header className="visualization-header">
        <div className="header-logo">
          <span>INDULGE</span>
          <span className="header-subtitle">3D Visualizer</span>
        </div>
        <div className="header-user">
          {currentUser ? (
            <div className="user-info">
              <User size={18} />
              <span>{currentUser.firstName || currentUser.username}</span>
            </div>
          ) : (
            <button className="login-btn" onClick={openLoginModal}>
              <LogIn size={18} />
              <span>Log In</span>
            </button>
          )}
        </div>
      </header>

      <main className="visualization-main">
        <aside className="sidebar">
          <div className="sidebar-tabs">
            <button
              className={`tab-btn ${sidebarTab === 'fabrics' ? 'active' : ''}`}
              onClick={() => setSidebarTab('fabrics')}
            >
              <span>Fabrics</span>
            </button>
            <button
              className={`tab-btn ${sidebarTab === 'garments' ? 'active' : ''}`}
              onClick={() => setSidebarTab('garments')}
            >
              <span>Garments</span>
            </button>
          </div>

          <div className="sidebar-content">
            {sidebarTab === 'fabrics' ? (
              <FabricPanel
                fabrics={fabrics}
                selectedFabric={selectedFabric}
                onSelectFabric={setSelectedFabric}
                fabricScale={fabricScale}
                onScaleChange={setFabricScale}
                isLoading={loading.fabrics}
                apiBaseUrl={API_BASE_URL}
              />
            ) : (
              <GarmentSelector
                garments={garments}
                selectedGarment={selectedGarment}
                onSelectGarment={setSelectedGarment}
                isLoading={loading.garments}
              />
            )}
          </div>
        </aside>

        <section className="viewer-section">
          <div className="selection-info">
            <div className="info-item">
              <span className="info-label">Garment</span>
              <span className="info-value">{selectedGarment?.name || 'None'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Fabric</span>
              <span className="info-value">{selectedFabric?.name || 'None'}</span>
            </div>
          </div>

          <GarmentViewer
            modelUrl={modelUrl}
            fabricTextureUrl={fabricTextureUrl}
            fabricScale={fabricScale}
            onError={setError}
          />

          <div className="viewer-bottom-controls">
            <div className="viewer-scale-control">
              <label htmlFor="fabric-scale">
                <span>Pattern Scale</span>
                <span className="scale-value">{fabricScale.toFixed(1)}×</span>
              </label>
              <input
                type="range"
                id="fabric-scale"
                min="0.5"
                max="5"
                step="0.1"
                value={fabricScale}
                onChange={(e) => setFabricScale(parseFloat(e.target.value))}
              />
            </div>
          </div>

          {error && (
            <div className="error-toast">
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

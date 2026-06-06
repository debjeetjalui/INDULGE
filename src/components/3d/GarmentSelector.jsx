import React from 'react';

export default function GarmentSelector({
    garments = [],
    selectedGarment,
    onSelectGarment,
    isLoading
}) {
    const garmentsByType = garments.reduce((acc, garment) => {
        const type = garment.type || 'other';
        if (!acc[type]) acc[type] = [];
        acc[type].push(garment);
        return acc;
    }, {});

    const typeIcons = {
        suit: '🤵',
        shirt: '👔',
        tshirt: '👕',
        jacket: '🧥',
        trousers: '👖',
        dress: '👗',
        coat: '🧥',
        other: '✨'
    };

    const typeLabels = {
        suit: 'Bespoke Suits',
        shirt: 'Dress Shirts',
        tshirt: 'T-Shirts',
        jacket: 'Jackets',
        trousers: 'Trousers',
        dress: 'Dresses',
        coat: 'Coats',
        other: 'Other'
    };

    return (
        <div className="garment-selector">
            <div className="selector-header">
                <h2>Garment Collection</h2>
                <p>Select a garment to customize with your chosen fabric</p>
            </div>

            <div className="garment-categories">
                {isLoading ? (
                    <div className="loading-garments">
                        <div className="loading-spinner small"></div>
                        <span>Loading collection...</span>
                    </div>
                ) : (
                    Object.entries(garmentsByType).map(([type, typeGarments]) => (
                        <div key={type} className="garment-type-group">
                            <h3>
                                <span className="type-icon">{typeIcons[type] || '✨'}</span>
                                {typeLabels[type] || type}
                            </h3>
                            <div className="garment-list">
                                {typeGarments.map((garment) => (
                                    <button
                                        key={garment.id}
                                        className={`garment-item ${selectedGarment?.id === garment.id ? 'selected' : ''}`}
                                        onClick={() => onSelectGarment(garment)}
                                    >
                                        <div className="garment-info">
                                            <span className="garment-name">{garment.name}</span>
                                            {garment.description && (
                                                <span className="garment-description">{garment.description}</span>
                                            )}
                                        </div>
                                        {selectedGarment?.id === garment.id && (
                                            <span className="selected-indicator">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                )}

                {!isLoading && garments.length === 0 && (
                    <div className="no-garments">
                        <p>No garments available</p>
                        <p>Check your connection to the server</p>
                    </div>
                )}
            </div>
        </div>
    );
}

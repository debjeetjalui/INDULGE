import React from 'react';

export default function FabricPanel({
    fabrics = [],
    selectedFabric,
    onSelectFabric,
    fabricScale,
    onScaleChange,
    isLoading,
    apiBaseUrl = ''
}) {
    const fabricsByCategory = fabrics.reduce((acc, fabric) => {
        const category = fabric.category || 'general';
        if (!acc[category]) acc[category] = [];
        acc[category].push(fabric);
        return acc;
    }, {});

    const categoryIcons = {
        cotton: '🌿',
        wool: '🐑',
        silk: '✨',
        linen: '🌾',
        velvet: '💜',
        general: '🎨',
        custom: '⭐'
    };

    return (
        <div className="fabric-panel">
            <div className="panel-header">
                <h2>Fabric Library</h2>
                <p>Select a premium fabric to visualize on your garment</p>
            </div>

            <div className="fabric-categories">
                {isLoading ? (
                    <div className="loading-fabrics">
                        <div className="loading-spinner small"></div>
                        <span>Loading fabrics...</span>
                    </div>
                ) : (
                    Object.entries(fabricsByCategory).map(([category, categoryFabrics]) => (
                        <div key={category} className="fabric-category">
                            <h3>
                                <span>{categoryIcons[category] || '🎨'}</span>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </h3>
                            <div className="fabric-grid">
                                {categoryFabrics.map((fabric) => (
                                    <button
                                        key={fabric.id}
                                        className={`fabric-item ${selectedFabric?.id === fabric.id ? 'selected' : ''}`}
                                        onClick={() => onSelectFabric(fabric)}
                                        title={fabric.name}
                                    >
                                        <div
                                            className="fabric-preview"
                                            style={{
                                                backgroundImage: fabric.texture_url
                                                    ? `url(${apiBaseUrl}${fabric.texture_url})`
                                                    : undefined,
                                                backgroundColor: fabric.color_hex || '#ccc'
                                            }}
                                        />
                                        <span className="fabric-name">{fabric.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                )}

                {!isLoading && fabrics.length === 0 && (
                    <div className="no-fabrics">
                        <p>No fabrics available</p>
                        <p>Please check your connection and try again.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

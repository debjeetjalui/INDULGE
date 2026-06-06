import React from 'react';

export default function ShirtPreview2D({
  selections,
  fabric,
  styleOptions,
  collarOptions,
  shoulderOptions,
  sleeveOptions,
  cuffOptions,
  pocketOptions,
}) {
  const style = styleOptions.find(s => s.id === selections.style);
  const collar = collarOptions.find(c => c.id === selections.collar);
  const shoulder = shoulderOptions.find(s => s.id === selections.shoulder);
  const sleeve = sleeveOptions.find(s => s.id === selections.sleeve);
  const cuff = cuffOptions.find(c => c.id === selections.cuff);
  const pocket = pocketOptions.find(p => p.id === selections.pocket);

  const leftItems = [
    collar && { label: 'Collar', name: collar.name, image: collar.image },
    cuff && { label: 'Cuff', name: cuff.name, image: cuff.image },
    pocket && { label: 'Pocket', name: pocket.name, image: pocket.image },
  ].filter(Boolean);

  const rightItems = [
    shoulder && { label: 'Shoulder', name: shoulder.name, image: shoulder.image },
    sleeve && { label: 'Sleeve', name: sleeve.name, image: sleeve.image },
    { label: 'Style', name: style?.name || '', image: null },
  ].filter(Boolean);

  return (
    <div className="sp-wrapper">
      <div className="sp-title-bar">
        <span className="sp-title">Your Custom Shirt</span>
        {fabric && (
          <span className="sp-fabric">
            <span className="sp-fabric-dot" style={{ background: fabric.color_hex || '#d4a574' }} />
            {fabric.name}
          </span>
        )}
      </div>

      <div className="sp-diagram">
        <div className="sp-side sp-left">
          {leftItems.map((item, i) => (
            <div key={item.label} className="sp-card">
              <div className="sp-card-img">
                <img src={item.image} alt={item.name} />
              </div>
              <div className="sp-card-text">
                <span className="sp-card-label">{item.label}</span>
                <span className="sp-card-name">{item.name}</span>
              </div>
              <div className="sp-connector sp-connector-right">
                <div className="sp-line" />
                <div className="sp-arrow-tip" />
              </div>
            </div>
          ))}
        </div>

        <div className="sp-center">
          <div className="sp-shirt-frame">
            {style?.image && <img src={style.image} alt={style.name} className="sp-shirt-img" />}
          </div>
        </div>

        <div className="sp-side sp-right">
          {rightItems.map((item, i) => (
            <div key={item.label} className="sp-card">
              <div className="sp-connector sp-connector-left">
                <div className="sp-arrow-tip sp-arrow-tip-left" />
                <div className="sp-line" />
              </div>
              {item.image ? (
                <div className="sp-card-img">
                  <img src={item.image} alt={item.name} />
                </div>
              ) : (
                <div className="sp-card-img sp-card-no-img">
                  <span>{item.name?.charAt(0)}</span>
                </div>
              )}
              <div className="sp-card-text">
                <span className="sp-card-label">{item.label}</span>
                <span className="sp-card-name">{item.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

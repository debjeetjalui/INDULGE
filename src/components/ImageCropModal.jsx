import React, { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, RotateCcw } from 'lucide-react';

const ImageCropModal = ({ imageUrl, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({
        unit: '%',
        width: 80,
        height: 80,
        x: 10,
        y: 10,
        aspect: 1
    });
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);

    const onImageLoad = useCallback((img) => {
        imgRef.current = img;

        const width = 80;
        const height = 80;
        const x = (100 - width) / 2;
        const y = (100 - height) / 2;

        setCrop({
            unit: '%',
            width,
            height,
            x,
            y,
            aspect: 1
        });
    }, []);

    const getCroppedImg = useCallback(() => {
        if (!completedCrop || !imgRef.current) return;

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = completedCrop.width * scaleX * pixelRatio;
        canvas.height = completedCrop.height * scaleY * pixelRatio;

        const ctx = canvas.getContext('2d');
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY
        );

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], 'profile-cropped.jpg', { type: 'image/jpeg' });
                onCropComplete(file);
            }
        }, 'image/jpeg', 0.95);
    }, [completedCrop, onCropComplete]);

    const resetCrop = () => {
        setCrop({
            unit: '%',
            width: 80,
            height: 80,
            x: 10,
            y: 10,
            aspect: 1
        });
    };

    return (
        <div className="crop-modal-overlay">
            <div className="crop-modal">
                <div className="crop-modal-header">
                    <h3>Crop Your Photo</h3>
                    <button className="crop-close-btn" onClick={onCancel}>
                        <X size={24} />
                    </button>
                </div>

                <div className="crop-modal-body">
                    <p className="crop-hint">Drag to adjust the crop area. The image will be cropped as a circle.</p>

                    <div className="crop-container">
                        <ReactCrop
                            crop={crop}
                            onChange={(c) => setCrop(c)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={1}
                            circularCrop
                        >
                            <img
                                ref={imgRef}
                                src={imageUrl}
                                alt="Crop preview"
                                onLoad={(e) => onImageLoad(e.currentTarget)}
                                style={{ maxHeight: '400px', maxWidth: '100%' }}
                            />
                        </ReactCrop>
                    </div>
                </div>

                <div className="crop-modal-footer">
                    <button className="crop-btn-reset" onClick={resetCrop}>
                        <RotateCcw size={18} />
                        Reset
                    </button>
                    <div className="crop-footer-actions">
                        <button className="crop-btn-cancel" onClick={onCancel}>
                            Cancel
                        </button>
                        <button className="crop-btn-confirm" onClick={getCroppedImg}>
                            <Check size={18} />
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropModal;

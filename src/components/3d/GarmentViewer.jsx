import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Center, useGLTF, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

function GarmentModel({ modelUrl, fabricTexture, fabricScale = 1 }) {
    const groupRef = useRef();
    const { scene } = useGLTF(modelUrl);

    const clonedScene = useMemo(() => scene.clone(true), [scene]);

    const originalMaterialsRef = useRef(new Map());

    useEffect(() => {
        if (!clonedScene) return;

        clonedScene.traverse((child) => {
            if (child.isMesh) {
                if (!originalMaterialsRef.current.has(child.uuid)) {
                    originalMaterialsRef.current.set(child.uuid, child.material.clone());
                }

                if (fabricTexture) {
                    const material = new THREE.MeshStandardMaterial({
                        map: fabricTexture,
                        roughness: 0.7,
                        metalness: 0.1,
                        side: THREE.DoubleSide,
                    });

                    fabricTexture.wrapS = THREE.RepeatWrapping;
                    fabricTexture.wrapT = THREE.RepeatWrapping;
                    fabricTexture.repeat.set(fabricScale, fabricScale);
                    fabricTexture.needsUpdate = true;

                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }

                    child.material = material;
                } else {
                    const originalMaterial = originalMaterialsRef.current.get(child.uuid);
                    if (originalMaterial) {
                        child.material = originalMaterial.clone();
                    }
                }

                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [clonedScene, fabricTexture, fabricScale]);

    useFrame((state) => {
        if (groupRef.current) {
        }
    });

    return (
        <group ref={groupRef}>
            <Center>
                <primitive object={clonedScene} scale={1} />
            </Center>
        </group>
    );
}

function LoadingSpinner() {
    return (
        <mesh>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="#d4a574" wireframe />
        </mesh>
    );
}

export default function GarmentViewer({
    modelUrl,
    fabricTextureUrl,
    fabricScale = 1,
    onLoadComplete,
    onError
}) {
    const [texture, setTexture] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);

    useEffect(() => {
        if (!fabricTextureUrl) {
            setTexture(null);
            return;
        }

        const loader = new THREE.TextureLoader();
        loader.load(
            fabricTextureUrl,
            (loadedTexture) => {
                loadedTexture.colorSpace = THREE.SRGBColorSpace;
                loadedTexture.wrapS = THREE.RepeatWrapping;
                loadedTexture.wrapT = THREE.RepeatWrapping;
                loadedTexture.repeat.set(fabricScale, fabricScale);
                setTexture(loadedTexture);
            },
            undefined,
            (error) => {
                console.error('Error loading fabric texture:', error);
                onError?.('Failed to load fabric texture');
            }
        );
    }, [fabricTextureUrl, fabricScale, onError]);

    useEffect(() => {
        if (texture) {
            texture.repeat.set(fabricScale, fabricScale);
            texture.needsUpdate = true;
        }
    }, [fabricScale, texture]);

    return (
        <div className="garment-viewer">
            <Canvas
                shadows
                camera={{ position: [0, 0.5, 3], fov: 45 }}
                gl={{
                    antialias: true,
                    alpha: true,
                    preserveDrawingBuffer: true
                }}
                onCreated={() => setIsLoading(false)}
            >
                <ambientLight intensity={0.4} />
                <directionalLight
                    position={[5, 5, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />
                <directionalLight position={[-5, 5, -5]} intensity={0.5} />
                <spotLight
                    position={[0, 10, 0]}
                    intensity={0.3}
                    angle={0.3}
                    penumbra={1}
                />

                <Environment preset="studio" />

                <ContactShadows
                    position={[0, -1.2, 0]}
                    opacity={0.4}
                    scale={10}
                    blur={2}
                    far={4}
                />

                {modelUrl ? (
                    <React.Suspense fallback={<LoadingSpinner />}>
                        <GarmentModel
                            modelUrl={modelUrl}
                            fabricTexture={texture}
                            fabricScale={fabricScale}
                        />
                    </React.Suspense>
                ) : (
                    <LoadingSpinner />
                )}

                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={1.5}
                    maxDistance={8}
                    minPolarAngle={Math.PI / 6}
                    maxPolarAngle={Math.PI / 1.5}
                    target={[0, 0, 0]}
                />
            </Canvas>

            {isLoading && (
                <div className="viewer-loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Loading 3D Model...</p>
                </div>
            )}
        </div>
    );
}

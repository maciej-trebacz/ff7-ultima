import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function CameraDebugOverlay({ debugInfo }: { debugInfo: string }) {
  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg font-mono text-sm whitespace-pre">
      {debugInfo}
    </div>
  );
}

export function CameraDebugInfo({ onDebugInfo }: { onDebugInfo: (info: string) => void }) {
  const { camera, scene } = useThree();

  useEffect(() => {
    const updateDebugInfo = () => {
      const pos = camera.position;
      const euler = new THREE.Euler().setFromQuaternion(camera.quaternion);
      
      const info = `
Camera:
  Position: ${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}, ${pos.z.toFixed(0)}
  Rotation: ${(euler.x * 180/Math.PI).toFixed(1)}°, ${(euler.y * 180/Math.PI).toFixed(1)}°, ${(euler.z * 180/Math.PI).toFixed(1)}°
  Up: ${camera.up.x.toFixed(2)}, ${camera.up.y.toFixed(2)}, ${camera.up.z.toFixed(2)}
Scene:
  Children: ${scene.children.length}
`.trim();
      onDebugInfo(info);
    };

    // Update every frame
    const interval = setInterval(updateDebugInfo, 100);
    return () => clearInterval(interval);
  }, [camera, scene, onDebugInfo]);

  return null;
} 
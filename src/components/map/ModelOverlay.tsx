import React, { MutableRefObject, useMemo } from 'react';
import { DoubleSide, TextureLoader } from 'three';
import { useLoader } from '@react-three/fiber';
import { SCALE } from './constants';
import { useFF7Context } from '@/FF7Context';
import { MODEL_TEXTURES, createTextureMap, getModelTexture } from './modelTextures';

interface ModelOverlayProps {
  zoomRef: MutableRefObject<number>;
  visible?: boolean;
}

const ModelOverlay: React.FC<ModelOverlayProps> = ({ zoomRef, visible = true }) => {
  const { connected, gameState } = useFF7Context();
  
  // Load all textures
  const textures = MODEL_TEXTURES.map(config => ({
    id: config.id,
    texture: useLoader(TextureLoader, config.texture)
  }));

  // Create texture map
  const textureMap = useMemo(() => 
    createTextureMap(Object.fromEntries(textures.map(({ id, texture }) => [id, texture]))),
    [textures]
  );

  if (!connected) return null;

  const offset = 10;
  let MIN_SIZE = 75;
  let MAX_SIZE = 1600;

  const additionalModels = []
  if (gameState.zolomCoords) {
    additionalModels.push({
      model_id: 40,
      x: gameState.zolomCoords[1] + 0x34000,
      y: 10,
      z: gameState.zolomCoords[0] + 0x20000,
    })
  }

  const models = [];
  if (gameState.worldMapType === 0) {
    models.push(...gameState.worldModels);
    models.push(...additionalModels);
  } else if (gameState.worldMapType === 2) {
    const submarine = gameState.worldModels.find(model => [13, 28].includes(model.model_id) && model.y < -2000);
    if (submarine) {
      models.push(submarine);
    }
    const emerald = gameState.worldModels.find(model => model.model_id === 30);
    if (emerald) {
      models.push(emerald);
    }
    MIN_SIZE = 250;
    MAX_SIZE = 750;
  } else if (gameState.worldMapType === 3) {
    models.push(...gameState.worldModels.filter(model => [0, 1, 2].includes(model.model_id)));
    MIN_SIZE = 150;
    MAX_SIZE = 600;
  }

  if (gameState.worldMapType === 2) {
    models.forEach(model => {
      model.x = model.x - 0x18000;
      model.z = model.z - 0x10000;
    });
  }

  const quadSize = Math.min(MAX_SIZE, Math.max(MIN_SIZE, MAX_SIZE / zoomRef.current));

  // Filter out models that don't have textures
  const availableModelIds = MODEL_TEXTURES.map(config => config.id);
  const filteredModels = models.filter(model => availableModelIds.includes(model.model_id));

  return (
    <>
      {filteredModels.map((model, index) => (
        <mesh
          key={`${model.model_id}-${model.x}-${model.z}-${index}`}
          position={[model.x * SCALE, (model.y || 0) * SCALE + offset, model.z * SCALE]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={999}
          visible={visible}
        >
          <planeGeometry args={[quadSize, quadSize]} />
          <meshBasicMaterial
            map={getModelTexture(model.model_id, textureMap)}
            color="#fff"
            side={DoubleSide}
            transparent
            opacity={1.0}
            depthTest={false}
          />
        </mesh>
      ))}
    </>
  );
};

export default ModelOverlay; 
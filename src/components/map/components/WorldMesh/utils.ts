import * as THREE from 'three';
import { WorldMapTexture } from '@/ff7/texfile';
import { ATLAS_SIZE, TEXTURE_PADDING } from '../../constants';
import { TextureAtlasResult } from '../../types';

export function createTextureAtlas(textures: WorldMapTexture[]): TextureAtlasResult {
  // Create a texture atlas of 1024x1024 pixels
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  const ctx = canvas.getContext('2d')!;
  
  // Use transparent black as background
  ctx.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);

  // Keep track of texture positions in the atlas
  const texturePositions = new Map<number, { x: number, y: number, name: string }>();
  
  // Current position in the atlas
  let currentX = 0;
  let currentY = 0;
  let rowHeight = 0;

  // For each texture that has been loaded
  let loadedCount = 0;
  textures.forEach((texture) => {
    if (!texture.tex) return;
    loadedCount++;

    // If this texture won't fit in current row, move to next row
    if (currentX + texture.width + TEXTURE_PADDING * 2 > ATLAS_SIZE) {
      currentX = 0;
      currentY += rowHeight + TEXTURE_PADDING;
      rowHeight = 0;
    }

    // Store the position where this texture will be placed (including padding)
    texturePositions.set(texture.id, { 
      x: currentX + TEXTURE_PADDING, 
      y: currentY + TEXTURE_PADDING, 
      name: texture.name 
    });

    // Get the raw pixel data
    const pixels = texture.tex.getPixels();
    
    // Create an ImageData object with alpha channel
    const imageData = new ImageData(
      new Uint8ClampedArray(pixels.buffer),
      texture.width,
      texture.height
    );

    // Create a temporary canvas to draw the texture
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = texture.width + TEXTURE_PADDING * 2;
    tempCanvas.height = texture.height + TEXTURE_PADDING * 2;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the main texture
    tempCtx.putImageData(imageData, TEXTURE_PADDING, TEXTURE_PADDING);

    // Extend edge pixels to prevent seams while preserving alpha
    extendEdgePixels(tempCtx, texture);

    // Draw the padded texture onto the atlas
    ctx.drawImage(
      tempCanvas,
      currentX,
      currentY,
      texture.width + TEXTURE_PADDING * 2,
      texture.height + TEXTURE_PADDING * 2
    );

    // Update position tracking
    currentX += texture.width + TEXTURE_PADDING * 2;
    rowHeight = Math.max(rowHeight, texture.height + TEXTURE_PADDING * 2);
  });
  console.log(`[MapViewer] Loaded ${loadedCount} textures into atlas`);
  console.log(`[MapViewer] Texture positions:`, texturePositions);

  // Create a Three.js texture from the atlas
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 16;
  return { texture, canvas, texturePositions };
}

function extendEdgePixels(tempCtx: CanvasRenderingContext2D, texture: WorldMapTexture) {
  const extendPixels = (sourceX: number, sourceY: number, sourceW: number, sourceH: number,
                       destX: number, destY: number, destW: number, destH: number) => {
    // Get source pixel data
    const sourceData = tempCtx.getImageData(sourceX, sourceY, sourceW, sourceH);
    const destData = tempCtx.createImageData(destW, destH);
    
    // Copy pixels while preserving alpha
    for (let y = 0; y < destH; y++) {
      for (let x = 0; x < destW; x++) {
        const sourceIdx = ((y % sourceH) * sourceW + (x % sourceW)) * 4;
        const destIdx = (y * destW + x) * 4;
        destData.data[destIdx] = sourceData.data[sourceIdx];       // R
        destData.data[destIdx + 1] = sourceData.data[sourceIdx + 1]; // G
        destData.data[destIdx + 2] = sourceData.data[sourceIdx + 2]; // B
        destData.data[destIdx + 3] = sourceData.data[sourceIdx + 3]; // A
      }
    }
    
    tempCtx.putImageData(destData, destX, destY);
  };

  // Top edge
  extendPixels(
    TEXTURE_PADDING, TEXTURE_PADDING, texture.width, 1,
    TEXTURE_PADDING, 0, texture.width, TEXTURE_PADDING
  );
  // Bottom edge
  extendPixels(
    TEXTURE_PADDING, texture.height + TEXTURE_PADDING - 1, texture.width, 1,
    TEXTURE_PADDING, texture.height + TEXTURE_PADDING, texture.width, TEXTURE_PADDING
  );
  // Left edge
  extendPixels(
    TEXTURE_PADDING, TEXTURE_PADDING, 1, texture.height,
    0, TEXTURE_PADDING, TEXTURE_PADDING, texture.height
  );
  // Right edge
  extendPixels(
    texture.width + TEXTURE_PADDING - 1, TEXTURE_PADDING, 1, texture.height,
    texture.width + TEXTURE_PADDING, TEXTURE_PADDING, TEXTURE_PADDING, texture.height
  );
  // Corners
  extendPixels(
    TEXTURE_PADDING, TEXTURE_PADDING, 1, 1,
    0, 0, TEXTURE_PADDING, TEXTURE_PADDING
  );
  extendPixels(
    texture.width + TEXTURE_PADDING - 1, TEXTURE_PADDING, 1, 1,
    texture.width + TEXTURE_PADDING, 0, TEXTURE_PADDING, TEXTURE_PADDING
  );
  extendPixels(
    TEXTURE_PADDING, texture.height + TEXTURE_PADDING - 1, 1, 1,
    0, texture.height + TEXTURE_PADDING, TEXTURE_PADDING, TEXTURE_PADDING
  );
  extendPixels(
    texture.width + TEXTURE_PADDING - 1, texture.height + TEXTURE_PADDING - 1, 1, 1,
    texture.width + TEXTURE_PADDING, texture.height + TEXTURE_PADDING, TEXTURE_PADDING, TEXTURE_PADDING
  );
}

export const calcUV = (value: number, offset: number, dimension: number) => {
  if (value + offset === dimension) return value - 1;

  // Fix that one weird triangle near Wutai
  if (value === 32 && offset === 256 && dimension === 32) return value - 1;

  if (offset > value) {
    offset = offset % dimension;
  }
  return Math.abs((value - offset) % dimension);
}

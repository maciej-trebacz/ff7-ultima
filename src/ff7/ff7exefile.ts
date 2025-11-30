import { Parser } from 'binary-parser';

export interface TerrainRegion {
  terrainTypes: number[]; // 4 terrain type IDs (1 byte each)
}

export interface FF7ExeData {
  terrainRegions: TerrainRegion[]; // 16 regions
}

const terrainRegionParser = new Parser()
  .array('terrainTypes', {
    type: 'uint8',
    length: 4
  });

const ff7ExeParser = new Parser()
  .array('terrainRegions', {
    type: terrainRegionParser,
    length: 16
  });

export class FF7ExeFile {
  data: FF7ExeData;
  private originalData: Uint8Array;

  constructor(data: Uint8Array) {
    this.originalData = data;
    // Read from offset 0x56c8a0 (5650368 in decimal)
    const offset = 0x56c8a0;
    if (data.length < offset + 64) { // 16 regions * 4 bytes each
      throw new Error(`File too small. Expected at least ${offset + 64} bytes, got ${data.length}`);
    }

    const terrainData = data.slice(offset, offset + 64); // 16 * 4 bytes
    this.data = ff7ExeParser.parse(terrainData);
  }

  getTerrainRegion(index: number): TerrainRegion {
    if (index < 0 || index >= 16) throw new Error('Index must be in the range of 0-15.');
    return this.data.terrainRegions[index];
  }

  setTerrainRegion(index: number, value: Partial<TerrainRegion>) {
    if (index < 0 || index >= 16) throw new Error('Index must be in the range of 0-15.');
    const prev = this.data.terrainRegions[index];
    this.data.terrainRegions[index] = { ...prev, ...value } as TerrainRegion;
  }

  getTerrainType(regionIndex: number, terrainIndex: number): number {
    if (regionIndex < 0 || regionIndex >= 16) throw new Error('Region index must be in the range of 0-15.');
    if (terrainIndex < 0 || terrainIndex >= 4) throw new Error('Terrain index must be in the range of 0-3.');
    return this.data.terrainRegions[regionIndex].terrainTypes[terrainIndex];
  }

  setTerrainType(regionIndex: number, terrainIndex: number, value: number) {
    if (regionIndex < 0 || regionIndex >= 16) throw new Error('Region index must be in the range of 0-15.');
    if (terrainIndex < 0 || terrainIndex >= 4) throw new Error('Terrain index must be in the range of 0-3.');
    if (value < 0 || value > 31) throw new Error('Terrain type must be in the range of 0-31.');
    this.data.terrainRegions[regionIndex].terrainTypes[terrainIndex] = value;
  }

  writeFile(): Uint8Array {
    // Create a copy of the original data
    const result = new Uint8Array(this.originalData.length);
    result.set(this.originalData);

    // Write terrain data back at offset 0x56c8a0
    const offset = 0x56c8a0;
    const view = new DataView(result.buffer);

    for (let regionIndex = 0; regionIndex < 16; regionIndex++) {
      const region = this.data.terrainRegions[regionIndex];
      const regionOffset = offset + (regionIndex * 4);

      for (let terrainIndex = 0; terrainIndex < 4; terrainIndex++) {
        const terrainType = region.terrainTypes[terrainIndex];
        view.setUint8(regionOffset + terrainIndex, terrainType);
      }
    }

    return result;
  }
}

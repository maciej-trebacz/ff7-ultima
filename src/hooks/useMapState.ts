import { atom, useAtom } from 'jotai'
import { readFile, writeFile } from "@tauri-apps/plugin-fs"
import { MapFile, Mesh } from '@/ff7/mapfile'
import { TexFile, WorldMapTexture } from '@/ff7/texfile'
import { useLgpState } from './useLgpState'
import { WORLD_MAP_GLACIER_TEXTURES, WORLD_MAP_OVERWORLD_TEXTURES, WORLD_MAP_UNDERWATER_TEXTURES } from '@/lib/map-data'
import { useCallback } from 'react'
import { MESH_SIZE } from '@/components/map/constants'
import { TriangleWithVertices } from '@/components/map/types'

export type MapId = 'WM0' | 'WM2' | 'WM3'
export type MapType = 'overworld' | 'underwater' | 'glacier'
export type MapMode = 'selection' | 'export' | 'painting'
export type AlternativeSection = { id: number, name: string }

const ALTERNATIVE_SECTIONS: AlternativeSection[] = [
  { id: 50, name: "Temple of Ancients gone" },
  { id: 41, name: "Junon Area crater (left)" },
  { id: 42, name: "Junon Area crater (right)" },
  { id: 60, name: "Mideel after Lifestream" },
  { id: 47, name: "Cosmo Canyon crater (left)" },
  { id: 48, name: "Cosmo Canyon crater (right)" },
] as const;

interface MapState {
  dataPath: string | null
  mapId: MapId | null
  mapType: MapType
  mode: MapMode
  map: MapFile | null
  worldmap: Mesh[][] | null
  textures: WorldMapTexture[]
  enabledAlternatives: number[]
  changedMeshes: [number, number][]
  paintingSelectedTriangles: Set<number>
  triangleMap: TriangleWithVertices[] | null
  updateColors?: () => void
  updateTriangleTexture?: (triangle: TriangleWithVertices) => void
  zoom: number
}

const mapStateAtom = atom<MapState>({
  dataPath: null,
  mapId: null,
  mapType: 'overworld',
  mode: 'selection',
  map: null,
  worldmap: null,
  textures: [],
  enabledAlternatives: [],
  changedMeshes: [],
  paintingSelectedTriangles: new Set<number>(),
  triangleMap: null,
  updateColors: undefined,
  updateTriangleTexture: undefined,
  zoom: 1
})

const MESHES_IN_ROW = 4;
const MESHES_IN_COLUMN = 4;

// Map dimensions for different map types
const dimensions = {
  overworld: { horizontal: 9, vertical: 7 },
  underwater: { horizontal: 3, vertical: 4 },
  glacier: { horizontal: 2, vertical: 2 }
};

export function useMapState() {
  const [state, setState] = useAtom(mapStateAtom)
  const { getFile } = useLgpState()

  const setDataPath = (dataPath: string) => {
    setState(prev => ({ ...prev, dataPath }))
  }

  const getTexturesForMapType = (mapType: MapType): WorldMapTexture[] => {
    switch (mapType) {
      case 'underwater':
        return WORLD_MAP_UNDERWATER_TEXTURES;
      case 'glacier':
        return WORLD_MAP_GLACIER_TEXTURES;
      default:
        return WORLD_MAP_OVERWORLD_TEXTURES;
    }
  }

  const parseWorldmap = (rawMapData: MapFile, mapType: MapType, enabledAlternatives: number[], onlyRefresh?: number) => {
    if (!rawMapData) return null;

    console.time("[Map] Parsing worldmap")

    // 2D array containing rows and columns of meshes
    const data: Mesh[][] = [];

    const { horizontal: SECTIONS_HORIZONTAL, vertical: SECTIONS_VERTICAL } = dimensions[mapType as keyof typeof dimensions];

    for (let row = 0; row < SECTIONS_VERTICAL * MESHES_IN_ROW; row++) {
      const rowData: Mesh[] = [];
      for (let column = 0; column < SECTIONS_HORIZONTAL * MESHES_IN_COLUMN; column++) {
        const sectionIdx = Math.floor(row / MESHES_IN_ROW) * SECTIONS_HORIZONTAL + Math.floor(column / MESHES_IN_COLUMN);
        const meshIdx = (row % MESHES_IN_ROW) * MESHES_IN_COLUMN + (column % MESHES_IN_COLUMN);
        let trueSectionIdx = sectionIdx;
        if (ALTERNATIVE_SECTIONS.some(alt => alt.id === sectionIdx && enabledAlternatives.includes(alt.id))) {
          trueSectionIdx = 63 + ALTERNATIVE_SECTIONS.findIndex(alt => alt.id === sectionIdx);
        }
        if (!onlyRefresh || sectionIdx === onlyRefresh) {
          rowData.push(rawMapData.readMesh(trueSectionIdx, meshIdx));
        } else if (state.worldmap) {
          const existingMesh = state.worldmap[row]?.[column];
          if (existingMesh) {
            rowData.push(existingMesh);
          } else {
            rowData.push(rawMapData.readMesh(trueSectionIdx, meshIdx));
          }
        } else {
          rowData.push(rawMapData.readMesh(trueSectionIdx, meshIdx));
        }
      }
      data.push(rowData);
    }

    console.timeEnd("[Map] Parsing worldmap")
    return data;
  }

  const loadTextures = async (mapType: MapType) => {
    console.debug("[Map] Loading textures for", mapType)
    const textures = getTexturesForMapType(mapType).map(texture => ({ ...texture, tex: undefined as TexFile | undefined }));

    // Load textures in parallel
    const loadPromises = textures.map(async texture => {
      const filename = `${texture.name}.tex`
      try {
        const fileData = await getFile(filename)
        if (fileData) {
          texture.tex = new TexFile(fileData)
        } else {
          console.warn(`[Map] Failed to load texture: ${filename}`)
        }
      } catch (error) {
        console.error(`[Map] Error loading texture ${filename}:`, error)
      }
    });

    await Promise.all(loadPromises);
    console.log(`[Map] Loaded ${textures.filter(t => t.tex !== null).length}/${textures.length} textures`)

    setState(prev => ({ ...prev, textures, mapType }))
    return textures
  }

  const loadMap = async (mapId: MapId, mapType: MapType) => {
    console.debug("[Map] Loading map:", mapId)
    const path = `${state.dataPath}/data/wm/${mapId}.MAP`
    const fileData = await readFile(path)
    if (!fileData) {
      console.error("Failed to read map file:", path)
      return
    }

    const mapData = new MapFile(fileData)
    console.debug("[Map] Map data", mapData)
    const worldmapData = parseWorldmap(mapData, mapType, state.enabledAlternatives)

    console.debug("[Map] Worldmap data", worldmapData)

    setState(prev => ({ ...prev, mapId, mapType, map: mapData, worldmap: worldmapData }))
    return mapData
  }

  const setEnabledAlternatives = (alternatives: number[], changed?: AlternativeSection) => {
    setState(prev => {
      const worldmapData = prev.map ? parseWorldmap(prev.map, prev.mapType, alternatives, changed?.id) : null;
      return { ...prev, enabledAlternatives: alternatives, worldmap: worldmapData };
    });
  }

  const addChangedMesh = useCallback((row: number, col: number) => {
    setState(prev => {
      const newMesh = [row, col] as [number, number];
      const exists = prev.changedMeshes.some(([r, c]) => r === row && c === col);
      if (!exists) {
        return {
          ...prev,
          changedMeshes: [...prev.changedMeshes, newMesh]
        };
      }
      return prev;
    });
  }, [setState]);

  const saveMap = async () => {
    if (!state.map || !state.worldmap) return;

    console.debug(`Changed ${state.changedMeshes.length} meshes`, state.changedMeshes)
    console.time("[Map] Saving map")
    
    const map = state.map;
    const worldmap = state.worldmap;
    
    state.changedMeshes.forEach(mesh => {
      const [row, col] = mesh;
      const sectionIdx = Math.floor(row / MESHES_IN_ROW) * dimensions[state.mapType as keyof typeof dimensions].horizontal + Math.floor(col / MESHES_IN_COLUMN);
      const meshIdx = (row % MESHES_IN_ROW) * MESHES_IN_COLUMN + (col % MESHES_IN_COLUMN);
      const meshData = worldmap[row]?.[col];
      if (meshData) {
        map.writeMesh(sectionIdx, meshIdx, meshData);
      }
    });

    const path = `${state.dataPath}/data/wm/${state.mapId}`
    const mapData = map.writeMap()
    await writeFile(path + '.MAP', mapData)
    const botData = map.writeBot()
    await writeFile(path + '.BOT', botData)
    console.timeEnd("[Map] Saving map")
  }

  const setMode = (mode: MapMode) => {
    setState(prev => ({ ...prev, mode, paintingSelectedTriangles: mode === 'painting' ? prev.paintingSelectedTriangles : new Set<number>() }));
  };

  const togglePaintingSelectedTriangle = (faceIndex: number, add: boolean) => {
    setState(prev => {
      const newSet = new Set(prev.paintingSelectedTriangles);
      if (add) {
        newSet.add(faceIndex);
      } else {
        newSet.delete(faceIndex);
      }
      return { ...prev, paintingSelectedTriangles: newSet };
    });
  };

  interface TriangleUpdates {
    type?: number;
    locationId?: number;
    script?: number;
    isChocobo?: boolean;
    texture?: number;
    uVertex0?: number;
    vVertex0?: number;
    uVertex1?: number;
    vVertex1?: number;
    uVertex2?: number;
    vVertex2?: number;
  }

  const updateTriangle = (triangle: TriangleWithVertices, updates: TriangleUpdates): [number, number] => {
    if (!triangle) return [-1, -1];

    // Update the triangle in triangleMap
    if (updates.type !== undefined) triangle.type = updates.type;
    if (updates.locationId !== undefined) triangle.locationId = updates.locationId;
    if (updates.script !== undefined) triangle.script = updates.script;
    if (updates.isChocobo !== undefined) triangle.isChocobo = updates.isChocobo;
    if (updates.texture !== undefined) triangle.texture = updates.texture;
    if (updates.uVertex0 !== undefined) triangle.uVertex0 = updates.uVertex0;
    if (updates.vVertex0 !== undefined) triangle.vVertex0 = updates.vVertex0;
    if (updates.uVertex1 !== undefined) triangle.uVertex1 = updates.uVertex1;
    if (updates.vVertex1 !== undefined) triangle.vVertex1 = updates.vVertex1;
    if (updates.uVertex2 !== undefined) triangle.uVertex2 = updates.uVertex2;
    if (updates.vVertex2 !== undefined) triangle.vVertex2 = updates.vVertex2;

    // Update the underlying triangle data using trianglePtr
    if (updates.type !== undefined) triangle.trianglePtr.type = updates.type;
    if (updates.locationId !== undefined) triangle.trianglePtr.locationId = updates.locationId;
    if (updates.script !== undefined) triangle.trianglePtr.script = updates.script;
    if (updates.isChocobo !== undefined) triangle.trianglePtr.isChocobo = updates.isChocobo;
    if (updates.texture !== undefined) triangle.trianglePtr.texture = updates.texture;
    if (updates.uVertex0 !== undefined) triangle.trianglePtr.uVertex0 = updates.uVertex0;
    if (updates.vVertex0 !== undefined) triangle.trianglePtr.vVertex0 = updates.vVertex0;
    if (updates.uVertex1 !== undefined) triangle.trianglePtr.uVertex1 = updates.uVertex1;
    if (updates.vVertex1 !== undefined) triangle.trianglePtr.vVertex1 = updates.vVertex1;
    if (updates.uVertex2 !== undefined) triangle.trianglePtr.uVertex2 = updates.uVertex2;
    if (updates.vVertex2 !== undefined) triangle.trianglePtr.vVertex2 = updates.vVertex2;

    debugger;
    if (updates.texture !== undefined || updates.uVertex0 !== undefined || updates.vVertex0 !== undefined || updates.uVertex1 !== undefined || updates.vVertex1 !== undefined || updates.uVertex2 !== undefined || updates.vVertex2 !== undefined) {
      if (state.updateTriangleTexture) {
        state.updateTriangleTexture(triangle);
      }
    }

    // Return the mesh coordinates for tracking modified meshes
    const row = Math.floor(triangle.meshOffsetZ / MESH_SIZE);
    const col = Math.floor(triangle.meshOffsetX / MESH_SIZE);
    return [row, col];
  };

  const updateSelectedTriangles = (updates: TriangleUpdates) => {
    setState(prev => {
      if (!prev.worldmap || !prev.triangleMap) return prev;

      // Track which meshes were modified
      const modifiedMeshes = new Set<string>();

      console.debug("[Map] Updating", updates)

      // Update each selected triangle
      prev.paintingSelectedTriangles.forEach(faceIndex => {
        const triangle = prev.triangleMap![faceIndex];
        console.debug("[Map] Updating triangle", triangle)
        
        const [row, col] = updateTriangle(triangle, updates);
        if (row >= 0 && col >= 0) {
          modifiedMeshes.add(`${row},${col}`);
        }
      });

      // Add all modified meshes to changedMeshes
      const newChangedMeshes = [...prev.changedMeshes];
      modifiedMeshes.forEach(key => {
        const [row, col] = key.split(',').map(Number);
        if (!prev.changedMeshes.some(([r, c]) => r === row && c === col)) {
          newChangedMeshes.push([row, col]);
        }
      });

      // Update the colors in the geometry
      if (prev.updateColors) {
        prev.updateColors();
      }

      return {
        ...prev,
        changedMeshes: newChangedMeshes,
        triangleMap: [...prev.triangleMap] // Create new array to trigger re-render
      };
    });
  };

  const setTriangleMap = useCallback((triangleMap: TriangleWithVertices[], updateColors?: () => void, updateTriangleTexture?: (triangle: TriangleWithVertices) => void) => {
    setState(prev => ({ ...prev, triangleMap, updateColors, updateTriangleTexture }));
  }, [setState]);

  // Added updateSectionMesh: updates a single mesh in the worldmap and tracks it as changed
  const updateSectionMesh = (row: number, col: number, newMesh: Mesh) => {
    console.log(`updateSectionMesh called for row=${row}, col=${col} with mesh:`, newMesh);
    setState(prev => {
      if (!prev.worldmap) return prev;
      const newWorldmap = [...prev.worldmap];
      newWorldmap[row] = [...newWorldmap[row]];
      newWorldmap[row][col] = newMesh;
      const alreadyChanged = prev.changedMeshes.some(([r, c]) => r === row && c === col);
      return {
        ...prev,
        worldmap: newWorldmap,
        changedMeshes: alreadyChanged ? prev.changedMeshes : [...prev.changedMeshes, [row, col]]
      };
    });
  };

  const setZoom = (zoom: number) => {
    setState(prev => ({ ...prev, zoom }));
  };

  return {
    mapId: state.mapId,
    mapType: state.mapType,
    mode: state.mode,
    map: state.map,
    worldmap: state.worldmap,
    textures: state.textures,
    enabledAlternatives: state.enabledAlternatives,
    triangleMap: state.triangleMap,
    dataPath: state.dataPath,
    zoom: state.zoom,
    loadMap,
    saveMap,
    loadTextures,
    setEnabledAlternatives,
    addChangedMesh,
    setMode,
    togglePaintingSelectedTriangle,
    paintingSelectedTriangles: state.paintingSelectedTriangles,
    updateSelectedTriangles,
    updateTriangle,
    setTriangleMap,
    updateSectionMesh,
    setDataPath,
    setZoom
  }
} 
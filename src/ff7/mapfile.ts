import {Lzss} from './lzss';
import {Parser} from 'binary-parser';

// Define parsers for reading the MAP file
const mapMeshData = new Parser()
    .uint32le('mesh_data_size')
    .buffer('mesh_data_bytes', {
        length: 'mesh_data_size'
    })

const mapMesh = new Parser()
    .uint32le('mesh_offset')
    .pointer('mesh_data', {
        type: mapMeshData,
        offset: function() {
            return (this as any).$parent.section_offset + (this as any).mesh_offset;
        }
    })

const mapSection = new Parser()
    .saveOffset('section_offset')
    .array('meshes', {
        type: mapMesh,
        length: 16
    })
    .seek(0xB800 - 16 * 4);

const mapParser = new Parser()
    .array('sections', {
        type: mapSection,
        readUntil: 'eof'
    });

const meshTriangle = new Parser()
    .uint8('vertex0Index')
    .uint8('vertex1Index')
    .uint8('vertex2Index')
    .bit3('script')
    .bit5('type')
    .uint8('uVertex0')
    .uint8('vVertex0')
    .uint8('uVertex1')
    .uint8('vVertex1')
    .uint8('uVertex2')
    .uint8('vVertex2')
    .uint16le('ids')

const meshVertex = new Parser()
    .int16le('x')
    .int16le('y')
    .int16le('z')
    .seek(2) // padding

const meshNormal = new Parser()
    .int16le('x')
    .int16le('y')
    .int16le('z')
    .seek(2) // padding

const meshParser = new Parser()
    .uint16le('numTriangles')
    .uint16le('numVertices')
    .array('triangles', {
        type: meshTriangle,
        length: 'numTriangles'
    })
    .array('vertices', {
        type: meshVertex,
        length: 'numVertices'
    })
    .array('normals', {
        type: meshNormal,
        length: 'numVertices'
    })

// TypeScript interfaces    
interface MeshData {
    mesh_offset: number;
    mesh_data: {
        mesh_data_size: number;
        mesh_data_bytes: Uint8Array; 
    }
}

interface Section {
    meshes: MeshData[];
}

interface Map {
    sections: Section[];
}

export interface Coords {
    x: number;
    y: number;
    z: number;
}

export interface Triangle {
    index: number;
    vertex0: Coords;
    vertex1: Coords;
    vertex2: Coords;
    script: number;
    type: number;
    locationId: number;
    texture: number;
    uVertex0: number;
    uVertex1: number;
    uVertex2: number;
    vVertex0: number;
    vVertex1: number;
    vVertex2: number;
    isChocobo?: boolean;
}

interface RawTriangle {
    vertex0Index: number;
    vertex1Index: number;
    vertex2Index: number;
    script: number;
    type: number;
    ids: number;
    uVertex0: number;
    uVertex1: number;
    uVertex2: number;
    vVertex0: number;
    vVertex1: number;
    vVertex2: number;
}

export interface Mesh {
    numTriangles: number;
    numVertices: number;
    triangles: Triangle[];
    vertices: Coords[];
    normals: Coords[];
}

export class MapFile {
    public map: Map;

    constructor(mapData: Uint8Array) {
        this.map = mapParser.parse(mapData);
    }

    readMesh(sectionId: number, meshId: number) {
        const lzss = new Lzss();
        const meshData = this.map.sections[sectionId].meshes[meshId].mesh_data.mesh_data_bytes;
        const decodedMeshData = lzss.decompress(meshData);
        const mesh = meshParser.parse(decodedMeshData);

        return { 
            ...mesh, 
            triangles: mesh.triangles.map((triangle: RawTriangle, idx: number) => ({
                index: idx,
                vertex0Idx: triangle.vertex0Index,
                vertex1Idx: triangle.vertex1Index,
                vertex2Idx: triangle.vertex2Index,
                uVertex0: triangle.uVertex0,
                vVertex0: triangle.vVertex0,
                uVertex1: triangle.uVertex1,
                vVertex1: triangle.vVertex1,
                uVertex2: triangle.uVertex2,
                vVertex2: triangle.vVertex2,
                vertex0: mesh.vertices[triangle.vertex0Index],
                vertex1: mesh.vertices[triangle.vertex1Index],
                vertex2: mesh.vertices[triangle.vertex2Index],
                script: triangle.script,
                type: triangle.type,
                locationId: triangle.ids >> 9 & 0x1f,
                texture: triangle.ids & 0x1ff,
                isChocobo: triangle.ids >> 0xf & 1,
            }))
        } as Mesh;
    }

    writeMesh(sectionId: number, meshId: number, data: Mesh) {
        const length = 4 + data.triangles.length * 12 + data.vertices.length * 16
        const out = new Uint8Array(length);
        let pos = 0;

        const setUint16 = (value: number, offset: number) => {
            out[offset] = value & 0xFF;
            out[offset + 1] = (value >> 8) & 0xFF;
        };

        setUint16(data.triangles.length, pos);
        pos += 2;
        setUint16(data.vertices.length, pos);
        pos += 2;

        data.triangles.forEach(triangle => {
            out[pos++] = data.vertices.indexOf(triangle.vertex0);
            out[pos++] = data.vertices.indexOf(triangle.vertex1);
            out[pos++] = data.vertices.indexOf(triangle.vertex2);
            out[pos++] = (triangle.script << 5) | triangle.type;
            out[pos++] = triangle.uVertex0;
            out[pos++] = triangle.vVertex0;
            out[pos++] = triangle.uVertex1;
            out[pos++] = triangle.vVertex1;
            out[pos++] = triangle.uVertex2;
            out[pos++] = triangle.vVertex2;
            const ids = (triangle.locationId << 9) | triangle.texture | (triangle.isChocobo ? 1 << 0xf : 0);
            setUint16(ids, pos);
            pos += 2;
        });

        const setInt16 = (value: number, offset: number) => {
            if (value < 0) value = 0xFFFF + value + 1;
            setUint16(value, offset);
        };

        data.vertices.forEach(vertex => {
            setInt16(vertex.x, pos);
            pos += 2;
            setInt16(vertex.y, pos);
            pos += 2;
            setInt16(vertex.z, pos);
            pos += 2;
            setInt16(0, pos);
            pos += 2;
        });

        data.normals.forEach(normal => {
            setInt16(normal.x, pos);
            pos += 2;
            setInt16(normal.y, pos);
            pos += 2;
            setInt16(normal.z, pos);
            pos += 2;
            setInt16(0, pos);
            pos += 2;
        });

        const lzss = new Lzss();
        const bytes = lzss.compress(out);
        this.map.sections[sectionId].meshes[meshId].mesh_data.mesh_data_bytes = bytes;
        this.map.sections[sectionId].meshes[meshId].mesh_data.mesh_data_size = bytes.length;
    }

    writeSection(section: Section, out: Uint8Array, pos: number) {
        let offset = section.meshes.length * 4;

        const setUint32 = (value: number, offset: number) => {
            out[offset] = value & 0xFF;
            out[offset + 1] = (value >> 8) & 0xFF;
            out[offset + 2] = (value >> 16) & 0xFF;
            out[offset + 3] = (value >> 24) & 0xFF;
        };

        for (const mesh of section.meshes) {
            setUint32(offset, pos);
            offset += mesh.mesh_data.mesh_data_size + 4;
            offset += (offset % 4 > 0) ? 4 - (offset % 4) : 0;
            pos += 4;
        }

        for (const mesh of section.meshes) {
            setUint32(mesh.mesh_data.mesh_data_size, pos);
            pos += 4;
            out.set(mesh.mesh_data.mesh_data_bytes, pos);
            pos += mesh.mesh_data.mesh_data_size;
            pos += (pos % 4 > 0) ? 4 - (pos % 4) : 0;
        }
        pos += 0xB800 - offset;

        return pos;
    }

    writeMap() {
        const out = new Uint8Array(this.map.sections.length * 0xB800);
        let pos = 0;

        for (const section of this.map.sections) {
            pos = this.writeSection(section, out, pos);
        }

        // Return the Uint8Array instead of writing to file
        return out;
    }

    writeBot() {
        const numSections = 332;
        const out = new Uint8Array(numSections * 0xB800);
        let pos = 0;

        for (let y = 0; y < 7; y++) {
            for (let x = 0; x < 9; x++) {
                for (let i = 0; i < 2; i++) {
                    for (let j = 0; j < 2; j++) {
                        const sectionId = (y + i) % 7 * 9 + (x + j) % 9
                        const section = this.map.sections[sectionId]
                        console.log("Writing section", sectionId)
                        pos = this.writeSection(section, out, pos);
                    }
                }
            }
        } 

        for (let i = 0; i < 80; i++) {
            pos = this.writeSection(this.map.sections[0], out, pos);
        }

        // Return the Uint8Array instead of writing to file
        return out;
    }
}
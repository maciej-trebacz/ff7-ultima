import {Parser} from 'binary-parser';

interface YuffieEncounter {
    cloudLevel: number;
    sceneId: number;
}

interface ChocoboRating {
    battleSceneId: number;
    rating: number;
}

interface EncounterRecord {
    rate: number;
    encounterId: number;
}

interface EncounterSet {
    normalEncounters: EncounterRecord[];
    backAttacks: EncounterRecord[];
    sideAttack: EncounterRecord;
    pincerAttack: EncounterRecord;
    chocoboEncounters: EncounterRecord[];
}

interface Regions {
    sets: EncounterSet[];
}

interface RandomEncounters {
    regions: Regions[];
}

interface EncWData {
    yuffieEncounters: YuffieEncounter[];
    chocoboRatings: ChocoboRating[];
    randomEncounters: RandomEncounters;
}

const yuffieEncounterEntry = new Parser()
    .uint16le('cloudLevel')
    .uint16le('sceneId');

const chocoboRatingEntry = new Parser()
    .uint16le('battleSceneId')
    .uint16le('rating');

const encounterRecord = new Parser()
    .uint16le('rate')
    .uint16le('encounterId');

const encounterSet = new Parser()
    .array('normalEncounters', {
        type: encounterRecord,
        length: 6
    })
    .array('backAttacks', {
        type: encounterRecord,
        length: 2
    })
    .nest('sideAttack', {
        type: encounterRecord
    })
    .nest('pincerAttack', {
        type: encounterRecord
    })
    .array('chocoboEncounters', {
        type: encounterRecord,
        length: 4
    });

const region = new Parser()
    .array('sets', {
        type: encounterSet,
        length: 4
    });

const randomEncounters = new Parser()
    .array('regions', {
        type: region,
        length: 16
    });

const encWParser = new Parser()
    .array('yuffieEncounters', {
        type: yuffieEncounterEntry,
        length: 8
    })
    .array('chocoboRatings', {
        type: chocoboRatingEntry,
        length: 32
    })
    .nest('randomEncounters', {
        type: randomEncounters
    });

export class EncWFile {
    data: EncWData;

    constructor(data: Uint8Array) {
        this.data = encWParser.parse(data);
    }

    getYuffieEncounter(index: number): YuffieEncounter {
        if (index < 0 || index >= 8) throw Error('Index must be in the range of 0-7.');
        return this.data.yuffieEncounters[index];
    }

    getChocoboRating(index: number): ChocoboRating {
        if (index < 0 || index >= 32) throw Error('Index must be in the range of 0-31.');
        return this.data.chocoboRatings[index];
    }

    getRandomEncounterTable(region: number, set: number): EncounterSet {
        if (region < 0 || region >= 16) throw Error('Region must be in the range of 0-15.');
        if (set < 0 || set >= 4) throw Error('Set must be in the range of 0-3.');
        return this.data.randomEncounters.regions[region].sets[set];
    }

    writeFile(): Uint8Array {
        const out = new Uint8Array(0x8a0); // Total size: 32 + 128 + 2048 bytes
        const view = new DataView(out.buffer);
        let offset = 0;

        // Write Yuffie encounters
        this.data.yuffieEncounters.forEach((entry: YuffieEncounter) => {
            view.setUint16(offset, entry.cloudLevel, true);
            view.setUint16(offset + 2, entry.sceneId, true);
            offset += 4;
        });

        // Write Chocobo ratings
        this.data.chocoboRatings.forEach((entry: ChocoboRating) => {
            view.setUint16(offset, entry.battleSceneId, true);
            view.setUint16(offset + 2, entry.rating, true);
            offset += 4;
        });

        // Write random encounters
        for (let region = 0; region < 16; region++) {
            for (let set = 0; set < 4; set++) {
                const encounterSet = this.data.randomEncounters.regions[region].sets[set];
                
                // Write normal encounters
                encounterSet.normalEncounters.forEach((entry: EncounterRecord) => {
                    view.setUint16(offset, entry.rate, true);
                    view.setUint16(offset + 2, entry.encounterId, true);
                    offset += 4;
                });

                // Write back attacks
                encounterSet.backAttacks.forEach((entry: EncounterRecord) => {
                    view.setUint16(offset, entry.rate, true);
                    view.setUint16(offset + 2, entry.encounterId, true);
                    offset += 4;
                });

                // Write side attack
                view.setUint16(offset, encounterSet.sideAttack.rate, true);
                view.setUint16(offset + 2, encounterSet.sideAttack.encounterId, true);
                offset += 4;

                // Write pincer attack
                view.setUint16(offset, encounterSet.pincerAttack.rate, true);
                view.setUint16(offset + 2, encounterSet.pincerAttack.encounterId, true);
                offset += 4;

                // Write chocobo encounters
                encounterSet.chocoboEncounters.forEach((entry: EncounterRecord) => {
                    view.setUint16(offset, entry.rate, true);
                    view.setUint16(offset + 2, entry.encounterId, true);
                    offset += 4;
                });
            }
        }

        return out;
    }
}

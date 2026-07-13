export type ScaleFamily = 'Pentatonic' | 'Blues' | 'Diatonic' | 'Harmonic Minor';
export type ScaleQuality = 'Minor' | 'Major';

export const KEY_OFFSETS: Record<string, number> = {
    'E': 0, 'F': 1, 'F#': 2, 'G': 3, 'G#': 4, 'A': 5, 
    'Bb': 6, 'B': 7, 'C': 8, 'C#': 9, 'D': 10, 'Eb': 11
};

export interface ChordDefinition {
    numeral: string;      
    quality: string;      
    frets: (number | 'x')[]; 
    barreRelative?: number; 
}

export interface ScaleShape {
    id: number;
    name: string;
    description: string;
    baseOffset: number; 
    relativeFrets: Record<number, number[]>; 
    rootPositions: { str: number; fretIdx: number }[]; 
    chordProgressions: string;
    chordVoicingsDesc: string;
    chords: ChordDefinition[];
}

export const MINOR_PENTATONIC: ScaleShape[] = [
    {
        id: 1, name: "Shape 1 (E Form)", description: "The classic minor 'box' shape. Root is on the 6th string.",
        baseOffset: 0,
        relativeFrets: { 6: [0, 3], 5: [0, 2], 4: [0, 2], 3: [0, 2], 2: [0, 3], 1: [0, 3] },
        rootPositions: [{ str: 6, fretIdx: 0 }, { str: 4, fretIdx: 1 }, { str: 1, fretIdx: 0 }],
        chordProgressions: "i - iv - v",
        chordVoicingsDesc: "E-form minor barre chord.",
        chords: [
            { numeral: 'i', quality: 'm', frets: [0, 2, 2, 0, 0, 0], barreRelative: 0 },
            { numeral: 'iv', quality: 'm', frets: ['x', 0, 2, 2, 1, 0], barreRelative: 0 },
            { numeral: 'v', quality: 'm', frets: ['x', 2, 4, 4, 3, 2], barreRelative: 2 }
        ]
    },
    {
        id: 2, name: "Shape 2 (D Form)", description: "Root is on the 4th string. Connects the bottom of Shape 1.",
        baseOffset: 2,
        relativeFrets: { 6: [1, 3], 5: [0, 3], 4: [0, 3], 3: [0, 2], 2: [1, 3], 1: [1, 3] },
        rootPositions: [{ str: 4, fretIdx: 0 }, { str: 2, fretIdx: 1 }],
        chordProgressions: "i - iv",
        chordVoicingsDesc: "D-form minor shape.",
        chords: [
            { numeral: 'i', quality: 'm', frets: ['x', 'x', 0, 2, 3, 1], barreRelative: 1 },
            { numeral: 'iv', quality: 'm', frets: ['x', 0, 2, 2, 1, 0], barreRelative: 0 }
        ]
    },
    {
        id: 3, name: "Shape 3 (C Form)", description: "Root is on the 5th string.",
        baseOffset: 5,
        relativeFrets: { 6: [0, 2], 5: [0, 2], 4: [0, 2], 3: [-1, 2], 2: [0, 3], 1: [0, 2] },
        rootPositions: [{ str: 5, fretIdx: 1 }, { str: 2, fretIdx: 0 }],
        chordProgressions: "i - VII",
        chordVoicingsDesc: "C-form minor shape leading into the VII major chord.",
        chords: [
            { numeral: 'i', quality: 'm', frets: ['x', 2, 1, 1, 0, 'x'], barreRelative: 0 },
            { numeral: 'VII', quality: '', frets: ['x', 0, 2, 2, 2, 0], barreRelative: 0 }
        ]
    },
    {
        id: 4, name: "Shape 4 (A Form)", description: "Root is on the 5th string.",
        baseOffset: 7,
        relativeFrets: { 6: [0, 3], 5: [0, 3], 4: [0, 2], 3: [0, 2], 2: [1, 3], 1: [0, 3] },
        rootPositions: [{ str: 5, fretIdx: 0 }, { str: 3, fretIdx: 1 }],
        chordProgressions: "i - iv",
        chordVoicingsDesc: "A-form minor barre chord.",
        chords: [
            { numeral: 'i', quality: 'm', frets: ['x', 0, 2, 2, 1, 0], barreRelative: 0 },
            { numeral: 'iv', quality: 'm', frets: ['x', 'x', 0, 2, 3, 1], barreRelative: 1 }
        ]
    },
    {
        id: 5, name: "Shape 5 (G Form)", description: "Root is on the 6th and 3rd strings.",
        baseOffset: 9,
        relativeFrets: { 6: [1, 3], 5: [1, 3], 4: [0, 3], 3: [0, 3], 2: [1, 3], 1: [1, 3] },
        rootPositions: [{ str: 6, fretIdx: 1 }, { str: 3, fretIdx: 0 }, { str: 1, fretIdx: 1 }],
        chordProgressions: "i - v",
        chordVoicingsDesc: "G-form minor shape.",
        chords: [
            { numeral: 'i', quality: 'm', frets: [3, 1, 1, 0, 'x', 'x'], barreRelative: 0 },
            { numeral: 'v', quality: 'm', frets: [0, 2, 2, 0, 0, 0], barreRelative: 0 }
        ]
    }
];

export const MINOR_BLUES: ScaleShape[] = MINOR_PENTATONIC.map(shape => {
    const newShape = { ...shape, relativeFrets: JSON.parse(JSON.stringify(shape.relativeFrets)) };
    if (shape.id === 1) {
        newShape.relativeFrets[5].splice(1, 0, 1);
        newShape.relativeFrets[3].splice(2, 0, 3);
    } else if (shape.id === 2) {
        newShape.relativeFrets[6].push(4);
        newShape.relativeFrets[3].splice(1, 0, 1);
        newShape.relativeFrets[1].push(4);
    } else if (shape.id === 3) {
        newShape.relativeFrets[6].splice(1, 0, 1);
        newShape.relativeFrets[4].push(3);
        newShape.relativeFrets[1].splice(1, 0, 1);
    } else if (shape.id === 4) {
        newShape.relativeFrets[4].splice(1, 0, 1);
        newShape.relativeFrets[2].push(4);
    } else if (shape.id === 5) {
        newShape.relativeFrets[5].push(4);
        newShape.relativeFrets[2].splice(1, 0, 2);
    }
    return newShape;
});

export const MAJOR_PENTATONIC: ScaleShape[] = [
    {
        id: 1, name: "Shape 1 (E Form)", description: "Root is on the 6th string. The bright, major sound.",
        baseOffset: 0, 
        relativeFrets: { 6: [0, 2], 5: [-1, 2], 4: [-1, 2], 3: [-1, 1], 2: [0, 2], 1: [0, 2] }, 
        rootPositions: [{ str: 6, fretIdx: 0 }, { str: 4, fretIdx: 1 }, { str: 1, fretIdx: 0 }],
        chordProgressions: "I - IV - V",
        chordVoicingsDesc: "E-form major barre chord.",
        chords: [
            { numeral: 'I', quality: '', frets: [0, 2, 2, 1, 0, 0], barreRelative: 0 },
            { numeral: 'IV', quality: '', frets: ['x', 0, 2, 2, 2, 0], barreRelative: 0 },
            { numeral: 'V', quality: '', frets: ['x', 2, 4, 4, 4, 2], barreRelative: 2 }
        ]
    },
    {
        id: 2, name: "Shape 2 (D Form)", description: "Root is on the 4th string.",
        baseOffset: 2,
        relativeFrets: { 6: [0, 2], 5: [0, 2], 4: [0, 2], 3: [-1, 2], 2: [0, 3], 1: [0, 2] },
        rootPositions: [{ str: 4, fretIdx: 0 }, { str: 2, fretIdx: 1 }],
        chordProgressions: "I - V",
        chordVoicingsDesc: "D-form major shape.",
        chords: [
            { numeral: 'I', quality: '', frets: ['x', 'x', 0, 2, 3, 2], barreRelative: 2 },
            { numeral: 'V', quality: '', frets: ['x', 0, 2, 2, 2, 0], barreRelative: 0 }
        ]
    },
    {
        id: 3, name: "Shape 3 (C Form)", description: "Root is on the 5th string.",
        baseOffset: 4,
        relativeFrets: { 6: [0, 3], 5: [0, 3], 4: [0, 2], 3: [0, 2], 2: [1, 3], 1: [0, 3] },
        rootPositions: [{ str: 5, fretIdx: 1 }, { str: 2, fretIdx: 0 }],
        chordProgressions: "I - IV",
        chordVoicingsDesc: "C-form major shape.",
        chords: [
            { numeral: 'I', quality: '', frets: ['x', 3, 2, 0, 1, 0], barreRelative: 0 },
            { numeral: 'IV', quality: '', frets: ['x', 'x', 0, 2, 3, 2], barreRelative: 0 }
        ]
    },
    {
        id: 4, name: "Shape 4 (A Form)", description: "Root is on the 5th string.",
        baseOffset: 7,
        relativeFrets: { 6: [0, 2], 5: [0, 2], 4: [-1, 2], 3: [-1, 2], 2: [0, 2], 1: [0, 2] },
        rootPositions: [{ str: 5, fretIdx: 0 }, { str: 3, fretIdx: 1 }],
        chordProgressions: "I - IV",
        chordVoicingsDesc: "A-form major barre chord.",
        chords: [
            { numeral: 'I', quality: '', frets: ['x', 0, 2, 2, 2, 0], barreRelative: 0 },
            { numeral: 'IV', quality: '', frets: ['x', 0, 2, 2, 2, 0], barreRelative: 5 }
        ]
    },
    {
        id: 5, name: "Shape 5 (G Form)", description: "Root is on the 6th and 3rd strings.",
        baseOffset: 9,
        relativeFrets: { 6: [0, 3], 5: [0, 2], 4: [0, 2], 3: [0, 2], 2: [0, 3], 1: [0, 3] },
        rootPositions: [{ str: 6, fretIdx: 1 }, { str: 3, fretIdx: 0 }, { str: 1, fretIdx: 1 }],
        chordProgressions: "I - vi",
        chordVoicingsDesc: "G-form major shape.",
        chords: [
            { numeral: 'I', quality: '', frets: [3, 2, 0, 0, 0, 3], barreRelative: 0 },
            { numeral: 'vi', quality: 'm', frets: [0, 2, 2, 0, 0, 0], barreRelative: -1 } 
        ]
    }
];

export const MAJOR_BLUES: ScaleShape[] = MAJOR_PENTATONIC.map(shape => {
    const newShape = { ...shape, relativeFrets: JSON.parse(JSON.stringify(shape.relativeFrets)) };
    if (shape.id === 1) {
        newShape.relativeFrets[6].push(3);
        newShape.relativeFrets[3].splice(1, 0, 0);
        newShape.relativeFrets[1].push(3);
    } else if (shape.id === 2) {
        newShape.relativeFrets[6].splice(1, 0, 1);
        newShape.relativeFrets[4].push(3);
        newShape.relativeFrets[1].splice(1, 0, 1);
    } else if (shape.id === 3) {
        newShape.relativeFrets[4].splice(1, 0, 1);
        newShape.relativeFrets[2].push(4);
    } else if (shape.id === 4) {
        newShape.relativeFrets[5].push(3);
        newShape.relativeFrets[2].splice(1, 0, 1);
    } else if (shape.id === 5) {
        newShape.relativeFrets[5].splice(1, 0, 1);
        newShape.relativeFrets[3].push(3);
    }
    return newShape;
});

export const MINOR_DIATONIC: ScaleShape[] = [
    {
        id: 1, name: "Shape 1 (E Form)", description: "Standard Aeolian Mode.",
        baseOffset: 0,
        relativeFrets: { 6: [0, 2, 3], 5: [0, 2, 3], 4: [0, 2, 4], 3: [0, 2, 4], 2: [1, 3, 5], 1: [0, 2, 3] },
        rootPositions: [{ str: 6, fretIdx: 0 }, { str: 4, fretIdx: 1 }, { str: 1, fretIdx: 0 }],
        chordProgressions: "i - iv - v",
        chordVoicingsDesc: "E-form minor barre chord.",
        chords: [
            { numeral: 'i', quality: 'm', frets: [0, 2, 2, 0, 0, 0], barreRelative: 0 },
            { numeral: 'iv', quality: 'm', frets: ['x', 0, 2, 2, 1, 0], barreRelative: 0 },
            { numeral: 'v', quality: 'm', frets: ['x', 2, 4, 4, 3, 2], barreRelative: 2 }
        ]
    },
    {
        id: 2, name: "Shape 2 (D Form)", description: "Root is on the 4th string.",
        baseOffset: 2,
        relativeFrets: { 6: [0, 1, 3], 5: [0, 1, 3], 4: [0, 2, 3], 3: [0, 2, 3], 2: [1, 3, 5], 1: [0, 1, 3] },
        rootPositions: [{ str: 4, fretIdx: 0 }, { str: 2, fretIdx: 1 }],
        chordProgressions: "i - iv",
        chordVoicingsDesc: "D-form minor shape.",
        chords: [
            { numeral: 'i', quality: 'm', frets: ['x', 'x', 0, 2, 3, 1], barreRelative: 1 },
            { numeral: 'iv', quality: 'm', frets: ['x', 0, 2, 2, 1, 0], barreRelative: 0 }
        ]
    },
    {
        id: 3, name: "Shape 3 (C Form)", description: "Root is on the 5th string.",
        baseOffset: 5,
        relativeFrets: { 6: [0, 2, 3], 5: [0, 2, 4], 4: [0, 2, 4], 3: [0, 2, 4], 2: [2, 3, 5], 1: [0, 2, 3] },
        rootPositions: [{ str: 5, fretIdx: 1 }, { str: 3, fretIdx: 2 }],
        chordProgressions: "i - VII",
        chordVoicingsDesc: "C-form minor shape.",
        chords: [
            { numeral: 'i', quality: 'm', frets: ['x', 2, 1, 1, 0, 'x'], barreRelative: 0 },
            { numeral: 'VII', quality: '', frets: ['x', 0, 2, 2, 2, 0], barreRelative: 0 }
        ]
    },
    {
        id: 4, name: "Shape 4 (A Form)", description: "Root is on the 5th string.",
        baseOffset: 7,
        relativeFrets: { 6: [0, 1, 3], 5: [0, 2, 3], 4: [0, 2, 3], 3: [0, 2, 4], 2: [1, 3, 5], 1: [0, 1, 3] },
        rootPositions: [{ str: 5, fretIdx: 0 }, { str: 3, fretIdx: 1 }],
        chordProgressions: "i - iv",
        chordVoicingsDesc: "A-form minor barre chord.",
        chords: [
            { numeral: 'i', quality: 'm', frets: ['x', 0, 2, 2, 1, 0], barreRelative: 0 },
            { numeral: 'iv', quality: 'm', frets: ['x', 'x', 0, 2, 3, 1], barreRelative: 1 }
        ]
    },
    {
        id: 5, name: "Shape 5 (G Form)", description: "Root is on the 6th and 3rd strings.",
        baseOffset: 9,
        relativeFrets: { 6: [-1, 1, 3], 5: [0, 1, 3], 4: [0, 1, 3], 3: [0, 2, 3], 2: [1, 3, 4], 1: [-1, 1, 3] },
        rootPositions: [{ str: 6, fretIdx: 2 }, { str: 3, fretIdx: 0 }, { str: 1, fretIdx: 2 }],
        chordProgressions: "i - v",
        chordVoicingsDesc: "G-form minor shape.",
        chords: [
            { numeral: 'i', quality: 'm', frets: [3, 1, 1, 0, 'x', 'x'], barreRelative: 0 },
            { numeral: 'v', quality: 'm', frets: [0, 2, 2, 0, 0, 0], barreRelative: 0 }
        ]
    }
];

export const MAJOR_DIATONIC: ScaleShape[] = [
    {
        id: 1, name: "Shape 1 (E Form)", description: "Standard Ionian Mode.",
        baseOffset: 0,
        relativeFrets: { 6: [0, 2, 4], 5: [0, 2, 4], 4: [1, 2, 4], 3: [1, 2, 4], 2: [2, 4, 5], 1: [0, 2, 4] },
        rootPositions: [{ str: 6, fretIdx: 0 }, { str: 4, fretIdx: 1 }, { str: 1, fretIdx: 0 }],
        chordProgressions: "I - IV - V",
        chordVoicingsDesc: "E-form major barre chord.",
        chords: [
            { numeral: 'I', quality: '', frets: [0, 2, 2, 1, 0, 0], barreRelative: 0 },
            { numeral: 'IV', quality: '', frets: ['x', 0, 2, 2, 2, 0], barreRelative: 0 },
            { numeral: 'V', quality: '', frets: ['x', 2, 4, 4, 4, 2], barreRelative: 2 }
        ]
    },
    {
        id: 2, name: "Shape 2 (D Form)", description: "Root is on the 4th string.",
        baseOffset: 2,
        relativeFrets: { 6: [0, 2, 3], 5: [0, 2, 4], 4: [0, 2, 4], 3: [0, 2, 4], 2: [2, 3, 5], 1: [0, 2, 3] },
        rootPositions: [{ str: 4, fretIdx: 0 }, { str: 2, fretIdx: 1 }],
        chordProgressions: "I - V",
        chordVoicingsDesc: "D-form major shape.",
        chords: [
            { numeral: 'I', quality: '', frets: ['x', 'x', 0, 2, 3, 2], barreRelative: 2 },
            { numeral: 'V', quality: '', frets: ['x', 0, 2, 2, 2, 0], barreRelative: 0 }
        ]
    },
    {
        id: 3, name: "Shape 3 (C Form)", description: "Root is on the 5th string.",
        baseOffset: 4,
        relativeFrets: { 6: [0, 1, 3], 5: [0, 2, 3], 4: [0, 2, 3], 3: [0, 2, 4], 2: [1, 3, 5], 1: [0, 1, 3] },
        rootPositions: [{ str: 5, fretIdx: 2 }, { str: 2, fretIdx: 0 }],
        chordProgressions: "I - IV",
        chordVoicingsDesc: "C-form major shape.",
        chords: [
            { numeral: 'I', quality: '', frets: ['x', 3, 2, 0, 1, 0], barreRelative: 0 },
            { numeral: 'IV', quality: '', frets: ['x', 'x', 0, 2, 3, 2], barreRelative: 0 }
        ]
    },
    {
        id: 4, name: "Shape 4 (A Form)", description: "Root is on the 5th string.",
        baseOffset: 7,
        relativeFrets: { 6: [0, 2, 4], 5: [0, 2, 4], 4: [0, 2, 4], 3: [1, 2, 4], 2: [2, 3, 5], 1: [0, 2, 4] },
        rootPositions: [{ str: 5, fretIdx: 0 }, { str: 3, fretIdx: 1 }],
        chordProgressions: "I - IV",
        chordVoicingsDesc: "A-form major barre chord.",
        chords: [
            { numeral: 'I', quality: '', frets: ['x', 0, 2, 2, 2, 0], barreRelative: 0 },
            { numeral: 'IV', quality: '', frets: ['x', 0, 2, 2, 2, 0], barreRelative: 5 }
        ]
    },
    {
        id: 5, name: "Shape 5 (G Form)", description: "Root is on the 6th and 3rd strings.",
        baseOffset: 9,
        relativeFrets: { 6: [0, 2, 3], 5: [0, 2, 3], 4: [0, 2, 4], 3: [0, 2, 4], 2: [1, 3, 5], 1: [0, 2, 3] },
        rootPositions: [{ str: 6, fretIdx: 2 }, { str: 3, fretIdx: 0 }, { str: 1, fretIdx: 2 }],
        chordProgressions: "I - vi",
        chordVoicingsDesc: "G-form major shape.",
        chords: [
            { numeral: 'I', quality: '', frets: [3, 2, 0, 0, 0, 3], barreRelative: 0 },
            { numeral: 'vi', quality: 'm', frets: [0, 2, 2, 0, 0, 0], barreRelative: -1 } 
        ]
    }
];

const TUNING = { 6: 0, 5: 5, 4: 10, 3: 3, 2: 7, 1: 0 } as const;

export const HARMONIC_MINOR: ScaleShape[] = MINOR_DIATONIC.map(shape => {
    const newShape = { ...shape, relativeFrets: JSON.parse(JSON.stringify(shape.relativeFrets)) as Record<number, number[]> };
    newShape.name = newShape.name.replace("Aeolian Mode", "Harmonic Minor");
    newShape.description = newShape.description.replace("Standard Aeolian Mode", "Harmonic Minor (raised 7th)");

    const rootPos = shape.rootPositions[0];
    const rootFret = shape.relativeFrets[rootPos.str][rootPos.fretIdx];
    const rootPitch = (TUNING[rootPos.str as keyof typeof TUNING] + rootFret) % 12;

    for (let str = 1; str <= 6; str++) {
        for (let i = 0; i < newShape.relativeFrets[str].length; i++) {
            const fret = newShape.relativeFrets[str][i];
            const pitch = (TUNING[str as keyof typeof TUNING] + fret) % 12;
            const interval = (pitch - rootPitch + 12) % 12;
            // The minor 7th is 10 semitones above the root. Raise it to 11 (Major 7th).
            if (interval === 10) {
                newShape.relativeFrets[str][i] = fret + 1;
            }
        }
    }
    
    // Convert 'v' to 'V' in chords to reflect harmonic minor
    newShape.chords = newShape.chords.map(c => {
        if (c.numeral === 'v' && c.quality === 'm') {
            return { ...c, numeral: 'V', quality: '' };
        }
        return c;
    });

    return newShape;
});

export function getScaleData(key: string, family: ScaleFamily, quality: ScaleQuality, shapeId: number) {
    const keyOffset = KEY_OFFSETS[key] ?? 5; // Default A
    
    let shapeDefinition = MINOR_PENTATONIC;
    if (family === 'Pentatonic' && quality === 'Major') shapeDefinition = MAJOR_PENTATONIC;
    if (family === 'Blues' && quality === 'Minor') shapeDefinition = MINOR_BLUES;
    if (family === 'Blues' && quality === 'Major') shapeDefinition = MAJOR_BLUES;
    if (family === 'Diatonic' && quality === 'Minor') shapeDefinition = MINOR_DIATONIC;
    if (family === 'Diatonic' && quality === 'Major') shapeDefinition = MAJOR_DIATONIC;
    if (family === 'Harmonic Minor') shapeDefinition = HARMONIC_MINOR;
    
    const shape = shapeDefinition[shapeId - 1];
    
    let baseFret = keyOffset + shape.baseOffset;
    if (baseFret > 14) baseFret -= 12;

    const actualFrets: Record<number, number[]> = {};
    for (let str = 1; str <= 6; str++) {
        actualFrets[str] = shape.relativeFrets[str].map(f => f + baseFret);
    }

    const CHROMATIC = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
    const MAJOR_OFFSETS: Record<string, number> = {
        'I': 0, 'i': 0, 'ii': 2, 'II': 2, 'iii': 4, 'III': 4,
        'IV': 5, 'iv': 5, 'V': 7, 'v': 7, 'vi': 9, 'VI': 9,
        'vii': 11, 'VII': 11, 'bVII': 10
    };
    const MINOR_OFFSETS: Record<string, number> = {
        'i': 0, 'I': 0, 'ii': 2, 'II': 2, 'III': 3, 'iii': 3,
        'iv': 5, 'IV': 5, 'v': 7, 'V': 7, 'VI': 8, 'vi': 8,
        'VII': 10, 'vii': 10, 'bVII': 10
    };
    const offsetMap = quality === 'Major' ? MAJOR_OFFSETS : MINOR_OFFSETS;

    const actualChords = shape.chords.map(chord => {
        const cleanNumeral = chord.numeral.replace(/°/g, '');
        const offset = offsetMap[cleanNumeral] ?? 0;
        
        const keyIdx = CHROMATIC.indexOf(key);
        const rootNote = CHROMATIC[(keyIdx + offset) % 12];
        const qLabel = chord.quality === 'Major' ? '' : chord.quality === 'Minor' ? 'm' : 'dim';
        
        return {
            name: `${rootNote}${qLabel} (${chord.numeral})`,
            numeral: chord.numeral,
            quality: chord.quality,
            barre: chord.barreRelative !== undefined ? chord.barreRelative + baseFret : undefined,
            frets: chord.frets.map(f => f === 'x' ? 'x' : (f as number) + baseFret)
        };
    });

    return {
        ...shape,
        key,
        quality,
        family,
        name: `${quality} ${family} - ${shape.name}`,
        baseFret,
        actualFrets,
        actualChords
    };
}

export function getAllDiatonicChords(key: string, quality: ScaleQuality, family: ScaleFamily) {
    const CHROMATIC = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
    
    let progression: { numeral: string, q: string, offset: number }[] = [];
    if (quality === 'Major') {
        progression = [
            { numeral: 'I', q: 'Major', offset: 0 },
            { numeral: 'ii', q: 'Minor', offset: 2 },
            { numeral: 'iii', q: 'Minor', offset: 4 },
            { numeral: 'IV', q: 'Major', offset: 5 },
            { numeral: 'V', q: 'Major', offset: 7 },
            { numeral: 'vi', q: 'Minor', offset: 9 },
            { numeral: 'vii°', q: 'Dim', offset: 11 }
        ];
    } else { // Minor
        progression = [
            { numeral: 'i', q: 'Minor', offset: 0 },
            { numeral: 'ii°', q: 'Dim', offset: 2 },
            { numeral: 'III', q: 'Major', offset: 3 },
            { numeral: 'iv', q: 'Minor', offset: 5 },
            { numeral: 'v', q: 'Minor', offset: 7 },
            { numeral: 'VI', q: 'Major', offset: 8 },
            { numeral: 'VII', q: 'Major', offset: 10 }
        ];
        if (family === 'Harmonic Minor') {
            progression[4] = { numeral: 'V', q: 'Major', offset: 7 };
            progression[6] = { numeral: 'vii°', q: 'Dim', offset: 11 };
        }
    }

    return progression.map(c => {
        const rootNoteIdx = (CHROMATIC.indexOf(key) + c.offset) % 12;
        const rootNote = CHROMATIC[rootNoteIdx];
        
        const eStringOffset = (rootNoteIdx - 4 + 12) % 12; // distance from E
        const aStringOffset = (rootNoteIdx - 9 + 12) % 12; // distance from A

        let frets: (number | 'x')[] = [];
        let barre: number = 0;
        
        if (c.q === 'Dim') {
             barre = aStringOffset;
             frets = ['x', barre, barre+1, barre+2, barre+1, 'x'];
        } else if (eStringOffset <= aStringOffset) {
            barre = eStringOffset;
            if (c.q === 'Major') frets = [barre, barre+2, barre+2, barre+1, barre, barre];
            else if (c.q === 'Minor') frets = [barre, barre+2, barre+2, barre, barre, barre];
        } else {
            barre = aStringOffset;
            if (c.q === 'Major') frets = ['x', barre, barre+2, barre+2, barre+2, barre];
            else if (c.q === 'Minor') frets = ['x', barre, barre+2, barre+2, barre+1, barre];
        }

        const qLabel = c.q === 'Major' ? '' : c.q === 'Minor' ? 'm' : 'dim';

        return {
            name: `${rootNote}${qLabel}`,
            numeral: c.numeral,
            quality: c.q,
            offset: c.offset,
            barre: barre > 0 ? barre : undefined,
            frets
        };
    });
}

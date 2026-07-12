export type ScaleFamily = 'Pentatonic' | 'Blues' | 'Diatonic';
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
        rootPositions: [{ str: 4, fretIdx: 1 }, { str: 2, fretIdx: 1 }],
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
        rootPositions: [{ str: 5, fretIdx: 0 }, { str: 2, fretIdx: 0 }],
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
        rootPositions: [{ str: 5, fretIdx: 1 }, { str: 3, fretIdx: 1 }],
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
        rootPositions: [{ str: 6, fretIdx: 0 }, { str: 3, fretIdx: 1 }, { str: 1, fretIdx: 0 }],
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
        rootPositions: [{ str: 4, fretIdx: 1 }, { str: 2, fretIdx: 1 }],
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
        rootPositions: [{ str: 5, fretIdx: 1 }, { str: 2, fretIdx: 0 }],
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
        rootPositions: [{ str: 6, fretIdx: 1 }, { str: 3, fretIdx: 0 }, { str: 1, fretIdx: 1 }],
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
        rootPositions: [{ str: 5, fretIdx: 0 }, { str: 2, fretIdx: 0 }],
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
        rootPositions: [{ str: 5, fretIdx: 1 }, { str: 3, fretIdx: 1 }],
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
        rootPositions: [{ str: 6, fretIdx: 0 }, { str: 3, fretIdx: 1 }, { str: 1, fretIdx: 0 }],
        chordProgressions: "I - vi",
        chordVoicingsDesc: "G-form major shape.",
        chords: [
            { numeral: 'I', quality: '', frets: [3, 2, 0, 0, 0, 3], barreRelative: 0 },
            { numeral: 'vi', quality: 'm', frets: [0, 2, 2, 0, 0, 0], barreRelative: -1 } 
        ]
    }
];

export function getScaleData(key: string, family: ScaleFamily, quality: ScaleQuality, shapeId: number) {
    const keyOffset = KEY_OFFSETS[key] ?? 5; // Default A
    
    let shapeDefinition = MINOR_PENTATONIC;
    if (family === 'Pentatonic' && quality === 'Major') shapeDefinition = MAJOR_PENTATONIC;
    if (family === 'Blues' && quality === 'Minor') shapeDefinition = MINOR_BLUES;
    if (family === 'Blues' && quality === 'Major') shapeDefinition = MAJOR_BLUES;
    if (family === 'Diatonic' && quality === 'Minor') shapeDefinition = MINOR_DIATONIC;
    if (family === 'Diatonic' && quality === 'Major') shapeDefinition = MAJOR_DIATONIC;
    
    const shape = shapeDefinition[shapeId - 1];
    
    let baseFret = keyOffset + shape.baseOffset;
    if (baseFret > 14) baseFret -= 12;

    const actualFrets: Record<number, number[]> = {};
    for (let str = 1; str <= 6; str++) {
        actualFrets[str] = shape.relativeFrets[str].map(f => f + baseFret);
    }

    const actualChords = shape.chords.map(chord => {
        return {
            name: `${key} ${chord.numeral}`,
            numeral: chord.numeral,
            quality: chord.quality,
            barre: chord.barreRelative !== undefined ? chord.barreRelative + baseFret : undefined,
            frets: chord.frets.map(f => f === 'x' ? 'x' : (f as number) + baseFret)
        };
    });

    return {
        ...shape,
        name: `${quality} ${family} - ${shape.name}`,
        baseFret,
        actualFrets,
        actualChords
    };
}

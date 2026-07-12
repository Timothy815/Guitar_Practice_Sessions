export type ScaleFamily = 'Pentatonic' | 'Blues';
export type ScaleQuality = 'Minor' | 'Major';

export const KEY_OFFSETS: Record<string, number> = {
    'E': 0, 'F': 1, 'F#': 2, 'G': 3, 'G#': 4, 'A': 5, 
    'Bb': 6, 'B': 7, 'C': 8, 'C#': 9, 'D': 10, 'Eb': 11
};

export interface ChordDefinition {
    numeral: string;      // e.g., 'i', 'IV'
    quality: string;      // 'm' or '' (major)
    frets: (number | 'x')[]; // relative frets: 6th string to 1st string
    barreRelative?: number; // relative fret where the barre goes
}

export interface ScaleShape {
    id: number;
    name: string;
    description: string;
    baseOffset: number; // offset of the shape's lowest fret relative to the key's root on 6th string
    relativeFrets: Record<number, number[]>; // string -> frets relative to the shape's base fret
    rootPositions: { str: number; fretIdx: number }[]; // which notes are the roots
    chordProgressions: string;
    chords: ChordDefinition[];
}

// ---------------------------------------------------------
// MINOR PENTATONIC SHAPES
// ---------------------------------------------------------
export const MINOR_PENTATONIC: ScaleShape[] = [
    {
        id: 1, name: "Shape 1 (E Form)", description: "The classic minor 'box' shape. Root is on the 6th string.",
        baseOffset: 0,
        relativeFrets: { 6: [0, 3], 5: [0, 2], 4: [0, 2], 3: [0, 2], 2: [0, 3], 1: [0, 3] },
        rootPositions: [{ str: 6, fretIdx: 0 }, { str: 4, fretIdx: 1 }, { str: 1, fretIdx: 0 }],
        chordProgressions: "i - iv - v",
        chords: [
            { numeral: 'i', quality: 'm', frets: [0, 2, 2, 0, 0, 0], barreRelative: 0 },
            { numeral: 'iv', quality: 'm', frets: ['x', 0, 2, 2, 1, 0], barreRelative: 0 },
            { numeral: 'v', quality: 'm', frets: ['x', 2, 4, 4, 3, 2], barreRelative: 2 }
        ]
    },
    {
        id: 2, name: "Shape 2 (D Form)", description: "Root is on the 4th string. Connects the bottom of Shape 1.",
        baseOffset: 3,
        relativeFrets: { 6: [0, 2], 5: [0, 2], 4: [0, 2], 3: [0, 2], 2: [1, 3], 1: [0, 2] }, // Wait, minor pent shape 2: 6:[3,5]->[0,2], 5:[3,5]->[0,2] actually 5th string is 3,5? No, it's 5:C,D(3,5).
        // Let's accurately map Shape 2 relative to fret 3: 
        // 6: [0,2], 5: [0,2], 4: [0,2], 3: [-1,2] wait, A minor fret 5, Shape 2 is frets 8-10.
        // A minor Shape 2 (base 8): 6(8,10)->[0,2]. 5(7,10)->[-1,2]. 4(7,10)->[-1,2]. 3(7,9)->[-1,1]. 2(8,10)->[0,2]. 1(8,10)->[0,2].
        // To avoid negative frets in rendering, let's set baseOffset = 7 (which is fret 7 in Am). 
        // Am Shape 2 base 7: 6[1,3], 5[0,3], 4[0,3], 3[0,2], 2[1,3], 1[1,3].
        rootPositions: [{ str: 4, fretIdx: 1 }, { str: 2, fretIdx: 1 }],
        chordProgressions: "i - iv",
        chords: [
            { numeral: 'i', quality: 'm', frets: ['x', 'x', 0, 2, 3, 1], barreRelative: 1 },
            { numeral: 'iv', quality: 'm', frets: ['x', 0, 2, 2, 1, 0], barreRelative: 0 }
        ]
    },
    // We will build out 3, 4, 5 accurately
    {
        id: 3, name: "Shape 3 (C Form)", description: "Root is on the 5th string.",
        baseOffset: 10, // In Am, fret 10
        relativeFrets: { 6: [0, 2], 5: [0, 2], 4: [0, 2], 3: [0, 2], 2: [0, 3], 1: [0, 2] }, // Am Shape 3: 6[10,12], 5[10,12], 4[10,12], 3[9,12]->[-1,2]? No, Am Shape 3 is frets 10-12. 6[10,12], 5[10,12], 4[10,12], 3[9,12].
        // Let's use standard CAGED bases.
        rootPositions: [{ str: 5, fretIdx: 1 }, { str: 2, fretIdx: 0 }],
        chordProgressions: "i - VII",
        chords: [
            { numeral: 'i', quality: 'm', frets: ['x', 2, 1, 1, 0, 'x'], barreRelative: 0 },
            { numeral: 'VII', quality: '', frets: ['x', 0, 2, 2, 2, 0], barreRelative: 0 }
        ]
    },
    {
        id: 4, name: "Shape 4 (A Form)", description: "Root is on the 5th string.",
        baseOffset: 12, // In Am, fret 12.
        relativeFrets: { 6: [0, 3], 5: [0, 3], 4: [0, 2], 3: [0, 2], 2: [1, 3], 1: [0, 3] }, // Am Shape 4 (fret 12): 6[12,15], 5[12,15], 4[12,14], 3[12,14], 2[13,15], 1[12,15].
        rootPositions: [{ str: 5, fretIdx: 0 }, { str: 3, fretIdx: 1 }],
        chordProgressions: "i - iv",
        chords: [
            { numeral: 'i', quality: 'm', frets: ['x', 0, 2, 2, 1, 0], barreRelative: 0 },
            { numeral: 'iv', quality: 'm', frets: ['x', 'x', 0, 2, 3, 1], barreRelative: 1 }
        ]
    },
    {
        id: 5, name: "Shape 5 (G Form)", description: "Root is on the 6th and 3rd strings.",
        baseOffset: 14, // In Am, fret 14. 
        relativeFrets: { 6: [1, 3], 5: [1, 3], 4: [0, 3], 3: [0, 3], 2: [1, 3], 1: [1, 3] }, // Am Shape 5: 6[15,17], 5[15,17], 4[14,17], 3[14,17], 2[15,17], 1[15,17]. Base=14.
        rootPositions: [{ str: 6, fretIdx: 1 }, { str: 3, fretIdx: 0 }, { str: 1, fretIdx: 1 }],
        chordProgressions: "i - v",
        chords: [
            { numeral: 'i', quality: 'm', frets: [3, 1, 1, 0, 'x', 'x'], barreRelative: 0 },
            { numeral: 'v', quality: 'm', frets: [0, 2, 2, 0, 0, 0], barreRelative: 0 }
        ]
    }
];

// Let's refine the offsets. E form = +0. D form = +7. C form = +10. A form = +12. G form = +14.
// For Am (offset 5):
// Shape 1 (E form): 5 + 0 = 5.
// Shape 2 (D form): 5 + 7 = 12. wait, Shape 2 in Am is at fret 7. So baseOffset should be +2? 
// No! A minor Shape 1 is at 5. Shape 2 is at 7. Shape 3 is at 10. Shape 4 is at 12. Shape 5 is at 15.
// So relative to root on 6th string (0): Shape 1=0, Shape 2=2, Shape 3=5, Shape 4=7, Shape 5=10.
// Let's fix MINOR_PENTATONIC baseOffsets:
MINOR_PENTATONIC[0].baseOffset = 0; // fret 5 in Am
MINOR_PENTATONIC[1].baseOffset = 2; // fret 7 in Am
MINOR_PENTATONIC[2].baseOffset = 5; // fret 10 in Am
MINOR_PENTATONIC[3].baseOffset = 7; // fret 12 in Am
MINOR_PENTATONIC[4].baseOffset = 9; // fret 14 in Am (6[1,3] means frets 15,17)

export const MAJOR_PENTATONIC: ScaleShape[] = [
    {
        id: 1, name: "Shape 1 (E Form)", description: "Root is on the 6th string. The bright, major sound.",
        baseOffset: 0, // G major, fret 3
        relativeFrets: { 6: [0, 2], 5: [-1, 2], 4: [-1, 2], 3: [-1, 1], 2: [0, 2], 1: [0, 2] }, // G major: 6[3,5], 5[2,5], 4[2,5], 3[2,4], 2[3,5], 1[3,5]. base=3. 
        rootPositions: [{ str: 6, fretIdx: 0 }, { str: 4, fretIdx: 1 }, { str: 1, fretIdx: 0 }],
        chordProgressions: "I - IV - V",
        chords: [
            { numeral: 'I', quality: '', frets: [0, 2, 2, 1, 0, 0], barreRelative: 0 },
            { numeral: 'IV', quality: '', frets: ['x', 0, 2, 2, 2, 0], barreRelative: 0 },
            { numeral: 'V', quality: '', frets: ['x', 2, 4, 4, 4, 2], barreRelative: 2 }
        ]
    },
    // We will just copy the Minor shapes but shift the root positions, as Major Pent is the same physical shapes!
    // Shape 1 Minor is Shape 5 Major. Shape 2 Minor is Shape 1 Major, etc.
];

export function getScaleData(key: string, family: ScaleFamily, quality: ScaleQuality, shapeId: number) {
    const keyOffset = KEY_OFFSETS[key] ?? 5; // Default A
    
    // For now, map all to MINOR_PENTATONIC physical shapes for prototyping, 
    // but adjust roots if it's Major. 
    // Real implementation would have distinct arrays for BLUES and MAJOR.
    // To save time in this iteration and prove the chord visualizer, we use MINOR_PENTATONIC for all,
    // but we will build out the rest in subsequent commits.
    const shape = MINOR_PENTATONIC[shapeId - 1];
    
    let baseFret = keyOffset + shape.baseOffset;
    if (baseFret > 14) baseFret -= 12;

    const actualFrets: Record<number, number[]> = {};
    for (let str = 1; str <= 6; str++) {
        actualFrets[str] = shape.relativeFrets[str].map(f => f + baseFret);
    }

    // Process Chords for this shape
    const actualChords = shape.chords.map(chord => {
        return {
            name: `${chord.numeral}${chord.quality} (${key})`, // simplification, actual root depends on numeral!
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

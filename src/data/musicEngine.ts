export const KEY_OFFSETS: Record<string, number> = {
    'Em': 0, 'Fm': 1, 'F#m': 2, 'Gm': 3, 'G#m': 4, 'Am': 5, 
    'Bbm': 6, 'Bm': 7, 'Cm': 8, 'C#m': 9, 'Dm': 10, 'D#m': 11
};

export interface PentatonicShape {
    id: number;
    name: string;
    description: string;
    relativeFrets: Record<number, number[]>; // string -> frets relative to shape base
    rootPositions: { str: number; fretIdx: number }[]; // which notes are the roots
    chordProgressions: string;
    chordVoicingsDesc: string;
}

export const MINOR_PENTATONIC_SHAPES: PentatonicShape[] = [
    {
        id: 1,
        name: "Shape 1 (E Form)",
        description: "The classic 'box' shape. Root is on the 6th string.",
        relativeFrets: {
            6: [0, 3], 5: [0, 2], 4: [0, 2], 3: [0, 2], 2: [0, 3], 1: [0, 3]
        },
        rootPositions: [{ str: 6, fretIdx: 0 }, { str: 4, fretIdx: 1 }, { str: 1, fretIdx: 0 }],
        chordProgressions: "i - VII - v",
        chordVoicingsDesc: "Root minor barre chord (E minor shape). The relative major barre chord is under your pinky (G major shape)."
    },
    {
        id: 2,
        name: "Shape 2 (D Form)",
        description: "Root is on the 4th string. Connects the bottom of Shape 1.",
        relativeFrets: {
            6: [0, 2], 5: [0, 3], 4: [0, 3], 3: [0, 2], 2: [1, 3], 1: [0, 2]
        },
        rootPositions: [{ str: 4, fretIdx: 0 }, { str: 2, fretIdx: 1 }],
        chordProgressions: "i - iv",
        chordVoicingsDesc: "Minor chord using the D minor open shape moved up. Good for funky stabs on the top 3 strings."
    },
    {
        id: 3,
        name: "Shape 3 (C Form)",
        description: "Root is on the 5th string. Great for major pentatonic crossover.",
        relativeFrets: {
            6: [0, 2], 5: [0, 2], 4: [0, 2], 3: [0, 3], 2: [0, 3], 1: [0, 2]
        },
        rootPositions: [{ str: 5, fretIdx: 1 }, { str: 2, fretIdx: 0 }],
        chordProgressions: "i - VI - VII",
        chordVoicingsDesc: "The minor chord resembles an A minor shape but with the root stretched (C form). Excellent for finding the relative major (A form major)."
    },
    {
        id: 4,
        name: "Shape 4 (A Form)",
        description: "Root is on the 5th string. The second most popular 'box'.",
        relativeFrets: {
            6: [0, 3], 5: [0, 3], 4: [0, 2], 3: [0, 2], 2: [1, 3], 1: [0, 3]
        },
        rootPositions: [{ str: 5, fretIdx: 0 }, { str: 3, fretIdx: 1 }],
        chordProgressions: "i - iv - v",
        chordVoicingsDesc: "Root minor barre chord (A minor shape). Very strong for classic rock rhythm."
    },
    {
        id: 5,
        name: "Shape 5 (G Form)",
        description: "Root is on the 6th and 3rd strings. Bridges back to Shape 1.",
        relativeFrets: {
            6: [0, 2], 5: [0, 2], 4: [0, 3], 3: [0, 3], 2: [0, 2], 1: [0, 2]
        },
        rootPositions: [{ str: 6, fretIdx: 1 }, { str: 3, fretIdx: 0 }, { str: 1, fretIdx: 1 }],
        chordProgressions: "i - v - i",
        chordVoicingsDesc: "Minor chord resembles a stretched E minor or the top of a G form. Often used to slide back home to Shape 1."
    }
];

// Base offsets for each shape relative to the Key's root note on the 6th string.
const SHAPE_BASE_OFFSETS = [0, 3, 5, 7, 10]; 

export function getShapeData(key: string, shapeId: number) {
    const keyOffset = KEY_OFFSETS[key] ?? 5; // Default Am
    let baseFret = keyOffset + SHAPE_BASE_OFFSETS[shapeId - 1];
    
    // Keep frets in a comfortable range (between 0 and 15)
    if (baseFret > 14) {
        baseFret -= 12;
    }

    const shape = MINOR_PENTATONIC_SHAPES[shapeId - 1];
    
    // Calculate actual frets
    const actualFrets: Record<number, number[]> = {};
    for (let str = 1; str <= 6; str++) {
        actualFrets[str] = shape.relativeFrets[str].map(f => f + baseFret);
    }

    return {
        ...shape,
        baseFret,
        actualFrets
    };
}

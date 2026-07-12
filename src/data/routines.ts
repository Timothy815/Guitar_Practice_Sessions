import { getShapeData } from './musicEngine';

export interface TabNoteData {
    positions: { str: number; fret: number | string }[];
    duration?: string;
}

export interface Exercise {
    id: string;
    title: string;
    duration: number;
    description: string;
    focusPoints?: string[];
    vexflowMeasures?: TabNoteData[][];
    dynamic?: boolean;
}

export const techniques: Record<string, {name: string, desc: string}> = {
    "Monday": { name: "Slides", desc: "Practice sliding into and out of notes to connect positions smoothly without picking the destination note." },
    "Tuesday": { name: "Hammer-ons", desc: "Focus on clean, rhythmic hammer-ons. Make sure the hammered note is just as loud as the picked note." },
    "Wednesday": { name: "Pull-offs", desc: "Ensure your pull-offs have a slight downward 'flick' to pluck the string and maintain volume." },
    "Thursday": { name: "Bends", desc: "Practice reaching a specific target pitch. First play the target note normally, then bend a lower note to match that exact pitch." },
    "Friday": { name: "Vibrato", desc: "Focus on even, rhythmic vibrato (wrist rotation, not finger wiggling). Try matching it to a slow tempo." },
    "Saturday": { name: "Double Stops", desc: "Play two strings simultaneously within the pentatonic shape to create thicker, chord-like textures." },
    "Sunday": { name: "Review or free play", desc: "Combine techniques naturally. Identify which technique felt weakest this week and give it extra attention." }
};

const DAY_TO_SHAPE: Record<string, number> = {
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5,
    "Saturday": 1,
    "Sunday": 2
};

export function generateRoutine(key: string, dayOfWeek: string): { routine: Exercise[], shapeData: any } {
    const shapeId = DAY_TO_SHAPE[dayOfWeek] || 1;
    const shape = getShapeData(key, shapeId);
    
    // Helper to get actual frets easily
    const f = shape.actualFrets;

    const routine: Exercise[] = [
        {
            id: "warmup",
            title: "1. Warmup and synchronization",
            duration: 300,
            description: `Begin slowly. We are preparing for ${key} Minor Pentatonic ${shape.name}. Practice this chromatic spider walk at fret ${shape.baseFret}. Continue across all six strings and return using strict alternate picking.`,
            focusPoints: [
                "Keep fingertips very close to the strings",
                "Maintain a relaxed thumb and wrist",
                "Ensure clean separation between notes (no bleeding)",
                "Strict alternate picking (D-U-D-U)"
            ],
            vexflowMeasures: [
                [
                    { positions: [{ str: 6, fret: shape.baseFret }], duration: "8" },
                    { positions: [{ str: 6, fret: shape.baseFret + 1 }], duration: "8" },
                    { positions: [{ str: 6, fret: shape.baseFret + 2 }], duration: "8" },
                    { positions: [{ str: 6, fret: shape.baseFret + 3 }], duration: "8" },
                    { positions: [{ str: 5, fret: shape.baseFret }], duration: "8" },
                    { positions: [{ str: 5, fret: shape.baseFret + 1 }], duration: "8" },
                    { positions: [{ str: 5, fret: shape.baseFret + 2 }], duration: "8" },
                    { positions: [{ str: 5, fret: shape.baseFret + 3 }], duration: "8" }
                ]
            ]
        },
        {
            id: "position",
            title: "2. Position review",
            duration: 300,
            description: `Practice the full two-octave ${shape.name}. Play completely through this shape ascending and descending to lock the visual structure into your mind.`,
            focusPoints: [
                "Ascend and descend without stopping",
                "Keep the tempo steady and perfectly even",
                "Try starting on the highest note and descending first"
            ],
            vexflowMeasures: [
                [
                    { positions: [{ str: 6, fret: f[6][0] }], duration: "8" },
                    { positions: [{ str: 6, fret: f[6][1] }], duration: "8" },
                    { positions: [{ str: 5, fret: f[5][0] }], duration: "8" },
                    { positions: [{ str: 5, fret: f[5][1] }], duration: "8" },
                    { positions: [{ str: 4, fret: f[4][0] }], duration: "8" },
                    { positions: [{ str: 4, fret: f[4][1] }], duration: "8" },
                    { positions: [{ str: 3, fret: f[3][0] }], duration: "8" },
                    { positions: [{ str: 3, fret: f[3][1] }], duration: "8" }
                ],
                [
                    { positions: [{ str: 2, fret: f[2][0] }], duration: "8" },
                    { positions: [{ str: 2, fret: f[2][1] }], duration: "8" },
                    { positions: [{ str: 1, fret: f[1][0] }], duration: "8" },
                    { positions: [{ str: 1, fret: f[1][1] }], duration: "8" },
                    { positions: [{ str: 1, fret: f[1][0] }], duration: "8" },
                    { positions: [{ str: 2, fret: f[2][1] }], duration: "8" },
                    { positions: [{ str: 2, fret: f[2][0] }], duration: "q" }
                ]
            ]
        },
        {
            id: "sequence",
            title: "3. Sequence exercises",
            duration: 300,
            description: "Groups of Three: Play three scale notes, step back one, play three again. This forces your brain to see the scale differently than a straight ladder.",
            focusPoints: [
                "Think: 1-2-3, 2-3-4, 3-4-5",
                "Listen for the triplet feel naturally emerging",
                "Maintain alternate picking through string changes"
            ],
            vexflowMeasures: [
                [
                    { positions: [{ str: 6, fret: f[6][0] }], duration: "8" },
                    { positions: [{ str: 6, fret: f[6][1] }], duration: "8" },
                    { positions: [{ str: 5, fret: f[5][0] }], duration: "8" },
                    { positions: [{ str: 6, fret: f[6][1] }], duration: "8" },
                    { positions: [{ str: 5, fret: f[5][0] }], duration: "8" },
                    { positions: [{ str: 5, fret: f[5][1] }], duration: "8" },
                    { positions: [{ str: 5, fret: f[5][0] }], duration: "8" },
                    { positions: [{ str: 5, fret: f[5][1] }], duration: "8" }
                ],
                [
                    { positions: [{ str: 4, fret: f[4][0] }], duration: "8" },
                    { positions: [{ str: 5, fret: f[5][1] }], duration: "8" },
                    { positions: [{ str: 4, fret: f[4][0] }], duration: "8" },
                    { positions: [{ str: 4, fret: f[4][1] }], duration: "8" },
                    { positions: [{ str: 4, fret: f[4][0] }], duration: "h" }
                ]
            ]
        },
        {
            id: "rhythm",
            title: "4. Rhythm exercises",
            duration: 300,
            description: "Rhythm transforms scales into music. Play a simple 3-note lick inside this shape, first as slow quarter notes, then double time as eighth notes.",
            focusPoints: [
                "Use a metronome if possible",
                "Feel the space between the quarter notes",
                "Keep the phrasing confident when switching to 8th notes"
            ],
            vexflowMeasures: [
                [
                    { positions: [{ str: 3, fret: f[3][1] }], duration: "q" },
                    { positions: [{ str: 3, fret: f[3][0] }], duration: "q" },
                    { positions: [{ str: 4, fret: f[4][1] }], duration: "h" }
                ],
                [
                    { positions: [{ str: 3, fret: f[3][1] }], duration: "8" },
                    { positions: [{ str: 3, fret: f[3][0] }], duration: "8" },
                    { positions: [{ str: 4, fret: f[4][1] }], duration: "8" },
                    { positions: [{ str: 4, fret: f[4][1] }], duration: "8" },
                    { positions: [{ str: 4, fret: f[4][1] }], duration: "h" }
                ]
            ]
        },
        {
            id: "technique",
            title: "5. Technique of the day",
            duration: 300,
            description: "Focus purely on how the notes are articulated rather than what notes you play. Technique adds the human voice to the guitar.",
            dynamic: true,
            vexflowMeasures: [
                [
                    { positions: [{ str: 3, fret: f[3][1] }], duration: "q" },
                    { positions: [{ str: 3, fret: f[3][0] }], duration: "q" },
                    { positions: [{ str: 4, fret: f[4][1] }], duration: "h" }
                ]
            ]
        },
        {
            id: "improv",
            title: "6. Controlled improvisation",
            duration: 300,
            description: `Improvise over a ${key} Minor backing track using ONLY ${shape.name}. Do not noodle endlessly. Apply strict constraints to force creativity.`,
            focusPoints: [
                "Round 1: Play only 3 notes total. Create interest with rhythm and rests.",
                "Round 2: Play only on the B string (think horizontally).",
                "Round 3: Call and Response (play a phrase, then play an 'answer' phrase)."
            ],
            vexflowMeasures: [
                [
                    { positions: [{ str: 2, fret: f[2][1] }], duration: "8" },
                    { positions: [{ str: 2, fret: f[2][0] }], duration: "8" },
                    { positions: [{ str: 3, fret: f[3][1] }], duration: "q" },
                    { positions: [{ str: 3, fret: f[3][0] }], duration: "8" },
                    { positions: [{ str: 4, fret: f[4][1] }], duration: "8" },
                    { positions: [{ str: 4, fret: f[4][1] }], duration: "q" }
                ]
            ]
        }
    ];

    return { routine, shapeData: shape };
}

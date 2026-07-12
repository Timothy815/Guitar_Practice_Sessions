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

export const pentatonicRoutine: Exercise[] = [
    {
        id: "warmup",
        title: "1. Warmup and synchronization",
        duration: 300,
        description: "Begin slowly enough that every note is deliberate. Spider walk (1-2-3-4). Continue across all six strings and return using strict alternate picking (Down-Up-Down-Up).",
        focusPoints: [
            "Fingertips close to the strings",
            "Relaxed thumb and wrist",
            "Clean separation between notes",
            "No extra finger movement",
            "Consistent pick depth"
        ],
        vexflowMeasures: [
            [
                { positions: [{ str: 4, fret: 1 }], duration: "q" },
                { positions: [{ str: 4, fret: 2 }], duration: "q" },
                { positions: [{ str: 4, fret: 3 }], duration: "q" },
                { positions: [{ str: 4, fret: 4 }], duration: "q" }
            ],
            [
                { positions: [{ str: 3, fret: 1 }], duration: "q" },
                { positions: [{ str: 3, fret: 2 }], duration: "q" },
                { positions: [{ str: 3, fret: 3 }], duration: "q" },
                { positions: [{ str: 3, fret: 4 }], duration: "q" }
            ]
        ]
    },
    {
        id: "position",
        title: "2. Position review",
        duration: 300,
        description: "Practice each pentatonic position, but only briefly. Do not always start from the lowest note. Break the idea that the scale has one entrance and one exit.",
        focusPoints: [
            "Ascend once, descend once",
            "Ascend and descend without stopping",
            "Begin on a different string",
            "Begin with an upstroke occasionally"
        ],
        vexflowMeasures: [
            [
                { positions: [{ str: 3, fret: 5 }], duration: "8" },
                { positions: [{ str: 3, fret: 7 }], duration: "8" },
                { positions: [{ str: 2, fret: 5 }], duration: "8" },
                { positions: [{ str: 2, fret: 8 }], duration: "8" }
            ],
            [
                { positions: [{ str: 1, fret: 5 }], duration: "8" },
                { positions: [{ str: 1, fret: 8 }], duration: "8" },
                { positions: [{ str: 1, fret: 5 }], duration: "h" }
            ]
        ]
    },
    {
        id: "sequence",
        title: "3. Sequence exercises",
        duration: 300,
        description: "Groups of Three (1-2-3, 2-3-4, 3-4-5). Play three notes, then begin again from the second note. On the fretboard, the sound becomes less predictable than simply moving upward.",
        focusPoints: [
            "Up two, back one (1-2-1-3, 2-3-2-4)",
            "Skip one note (1-3, 2-4, 3-5)"
        ],
        vexflowMeasures: [
            [
                { positions: [{ str: 3, fret: 5 }], duration: "8" },
                { positions: [{ str: 3, fret: 7 }], duration: "8" },
                { positions: [{ str: 2, fret: 5 }], duration: "8" },
                { positions: [{ str: 3, fret: 7 }], duration: "8" }
            ],
            [
                { positions: [{ str: 2, fret: 5 }], duration: "8" },
                { positions: [{ str: 2, fret: 8 }], duration: "8" },
                { positions: [{ str: 2, fret: 5 }], duration: "q" }
            ]
        ]
    },
    {
        id: "rhythm",
        title: "4. Rhythm exercises",
        duration: 300,
        description: "Rhythm is one of the best defenses against noodling. Choose only three or four notes and play them using a specific rhythmic rule.",
        focusPoints: [
            "Quarter notes or eighth notes",
            "Triplets",
            "Syncopated accents"
        ],
        vexflowMeasures: [
            [
                { positions: [{ str: 3, fret: 5 }], duration: "8" },
                { positions: [{ str: 2, fret: 5 }], duration: "8" },
                { positions: [{ str: 2, fret: 8 }], duration: "8" },
                { positions: [{ str: 3, fret: 5 }], duration: "8" },
                { positions: [{ str: 2, fret: 5 }], duration: "h" }
            ]
        ]
    },
    {
        id: "technique",
        title: "5. Technique of the day",
        duration: 300,
        description: "Focus on one expressive device rather than trying to practice everything at once.",
        dynamic: true
    },
    {
        id: "improv",
        title: "6. Controlled improvisation",
        duration: 300,
        description: "Improvisation does not have to mean unstructured noodling. Give each improvisation round a rule.",
        focusPoints: [
            "Round 1: Three-note solo using rhythm, repetition, rests.",
            "Round 2: One string only (think horizontally).",
            "Round 3: Repeat and modify (play a phrase, repeat it with exactly one change)."
        ]
    }
];

export const techniques: Record<string, {name: string, desc: string}> = {
    "Monday": { name: "Slides", desc: "Practice sliding into and out of notes to connect positions." },
    "Tuesday": { name: "Hammer-ons", desc: "Focus on clean, rhythmic hammer-ons without picking the second note." },
    "Wednesday": { name: "Pull-offs", desc: "Ensure your pull-offs have enough snap to maintain volume." },
    "Thursday": { name: "Bends", desc: "Practice reaching a specific target pitch rather than merely pushing the string upward. First play the target note, then bend to match it." },
    "Friday": { name: "Vibrato", desc: "Focus on even, rhythmic vibrato. Try matching it to the tempo." },
    "Saturday": { name: "Mixed phrasing", desc: "Combine slides, hammer-ons, and bends into single fluid phrases." },
    "Sunday": { name: "Review or free play", desc: "Combine techniques naturally, or review what felt weakest this week." }
};

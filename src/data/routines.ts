import { getScaleData } from './musicEngine';
import type { ScaleFamily, ScaleQuality } from './musicEngine';

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
    "Saturday": { name: "Double Stops", desc: "Play two strings simultaneously within the scale shape to create thicker, chord-like textures." },
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

// Helper to chunk notes into measures of 8 eighth notes
function chunkIntoMeasures(notes: { str: number; fret: number }[], limit?: number): TabNoteData[][] {
    const list = limit ? notes.slice(0, limit) : notes;
    const measures: TabNoteData[][] = [];
    for (let i = 0; i < list.length; i += 8) {
        const chunk = list.slice(i, i + 8);
        measures.push(chunk.map(n => ({ positions: [{ str: n.str, fret: n.fret }], duration: "8" })));
    }
    // Make the last note a quarter or half note if it ends a phrase? 
    // We will leave them as 8th notes for now.
    return measures;
}

export function generateRoutine(key: string, family: ScaleFamily, quality: ScaleQuality, dayOfWeek: string): { routine: Exercise[], shapeData: any } {
    const shapeId = DAY_TO_SHAPE[dayOfWeek] || 1;
    const shape = getScaleData(key, family, quality, shapeId);
    
    const f = shape.actualFrets;

    // 1. Build linear arrays of all notes in this specific shape
    const allNotesAsc: { str: number; fret: number }[] = [];
    for (let str = 6; str >= 1; str--) {
        for (let i = 0; i < f[str].length; i++) {
            allNotesAsc.push({ str, fret: f[str][i] });
        }
    }
    const allNotesDesc = [...allNotesAsc].reverse();

    // 2. Build sequence (Groups of 3)
    const sequence3: { str: number; fret: number }[] = [];
    for (let i = 0; i < allNotesAsc.length - 2; i++) {
        sequence3.push(allNotesAsc[i]);
        sequence3.push(allNotesAsc[i+1]);
        sequence3.push(allNotesAsc[i+2]);
    }

    // 3. Build a small lick from the middle strings for Rhythm/Technique
    // Grab some notes on the G and D strings (strings 3 and 4)
    const middleNotes = allNotesDesc.filter(n => n.str === 3 || n.str === 4).slice(0, 3);
    // If for some reason we don't have enough, fallback
    const lickNotes = middleNotes.length === 3 ? middleNotes : allNotesDesc.slice(0, 3);

    const routine: Exercise[] = [
        {
            id: "warmup",
            title: "1. Warmup and synchronization",
            duration: 300,
            description: `Begin slowly. We are preparing for ${shape.name}. Practice this chromatic spider walk at fret ${shape.baseFret}. Continue across all six strings and return using strict alternate picking.`,
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
            vexflowMeasures: chunkIntoMeasures([...allNotesAsc, ...allNotesDesc])
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
            vexflowMeasures: chunkIntoMeasures(sequence3, 24) // Show 3 measures of the sequence
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
                    { positions: [{ str: lickNotes[0].str, fret: lickNotes[0].fret }], duration: "q" },
                    { positions: [{ str: lickNotes[1].str, fret: lickNotes[1].fret }], duration: "q" },
                    { positions: [{ str: lickNotes[2].str, fret: lickNotes[2].fret }], duration: "h" }
                ],
                [
                    { positions: [{ str: lickNotes[0].str, fret: lickNotes[0].fret }], duration: "8" },
                    { positions: [{ str: lickNotes[1].str, fret: lickNotes[1].fret }], duration: "8" },
                    { positions: [{ str: lickNotes[2].str, fret: lickNotes[2].fret }], duration: "8" },
                    { positions: [{ str: lickNotes[2].str, fret: lickNotes[2].fret }], duration: "8" }, // repeat last note
                    { positions: [{ str: lickNotes[2].str, fret: lickNotes[2].fret }], duration: "h" }
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
                    { positions: [{ str: lickNotes[0].str, fret: lickNotes[0].fret }], duration: "q" },
                    { positions: [{ str: lickNotes[1].str, fret: lickNotes[1].fret }], duration: "q" },
                    { positions: [{ str: lickNotes[2].str, fret: lickNotes[2].fret }], duration: "h" }
                ]
            ]
        },
        {
            id: "improv",
            title: "6. Controlled improvisation",
            duration: 300,
            description: `Improvise over a backing track in ${key} ${quality} using ONLY ${shape.name}. Do not noodle endlessly. Apply strict constraints to force creativity.`,
            focusPoints: [
                "Round 1: Play only 3 notes total. Create interest with rhythm and rests.",
                "Round 2: Play only on the B string (think horizontally).",
                "Round 3: Call and Response (play a phrase, then play an 'answer' phrase)."
            ],
            // Use the top 3 strings for improv lick example
            vexflowMeasures: chunkIntoMeasures(allNotesDesc.filter(n => n.str <= 3).slice(0, 8))
        }
    ];

    return { routine, shapeData: shape };
}

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

export interface Technique {
    name: string;
    desc: string;
    howTo: string[];
    whatToWatchFor: string[];
}

export const techniques: Record<string, Technique> = {
    "Monday": { 
        name: "Slides", 
        desc: "Practice sliding into and out of notes to connect positions smoothly without picking the destination note.",
        howTo: [
            "Pluck the starting note firmly.",
            "Maintain consistent downward pressure on the string.",
            "Slide your finger continuously to the target fret without lifting.",
            "Stop precisely on the target fret so it rings clearly without re-picking."
        ],
        whatToWatchFor: [
            "Losing string pressure mid-slide (causes the note to die out).",
            "Overshooting or undershooting the target fret (intonation).",
            "Sliding too fast or too slow for the rhythm."
        ]
    },
    "Tuesday": { 
        name: "Hammer-ons", 
        desc: "Focus on clean, rhythmic hammer-ons. Make sure the hammered note is just as loud as the picked note.",
        howTo: [
            "Pluck the lower note while keeping your index/lower finger anchored.",
            "Swing your hammering finger down like a tiny hammer.",
            "Strike the string firmly just behind the target fret wire.",
            "Leave the finger pressed down so the new note sustains."
        ],
        whatToWatchFor: [
            "Hammering too softly (causes a drop in volume).",
            "Hammering out of time (rushing the hammer-on).",
            "Accidentally bending the string when you strike it."
        ]
    },
    "Wednesday": { 
        name: "Pull-offs", 
        desc: "Ensure your pull-offs have a slight downward 'flick' to pluck the string and maintain volume.",
        howTo: [
            "Fret both the higher note and the lower target note simultaneously.",
            "Pluck the higher note normally.",
            "Pull your higher finger slightly down toward the floor, 'flicking' the string as you release it.",
            "Let the lower anchored finger take over to ring out the new note."
        ],
        whatToWatchFor: [
            "Lifting the finger straight off (the note will die instantly).",
            "Flicking too hard and accidentally bending the string out of pitch.",
            "Forgetting to pre-fret the lower target note."
        ]
    },
    "Thursday": { 
        name: "Bends", 
        desc: "Practice reaching a specific target pitch. First play the target note normally, then bend a lower note to match that exact pitch.",
        howTo: [
            "Fret the note you want to bend (usually with ring or middle finger).",
            "Place the fingers behind it on the same string for extra pushing strength.",
            "Pivot from your wrist (like turning a doorknob), rather than just pushing with your fingers.",
            "Push the string up across the fretboard until you reach the target pitch."
        ],
        whatToWatchFor: [
            "Bending flat or sharp (not reaching the exact target pitch).",
            "Bending using only finger strength instead of wrist rotation.",
            "Letting other strings ring out (use your index finger to mute higher strings)."
        ]
    },
    "Friday": { 
        name: "Vibrato", 
        desc: "Focus on even, rhythmic vibrato (wrist rotation, not finger wiggling). Try matching it to a slow tempo.",
        howTo: [
            "Fret the note and anchor the side of your index finger against the neck.",
            "Use your wrist in a slight rotational motion to bend the string slightly sharp and back down.",
            "Keep the rhythm of the oscillation steady and even (e.g., oscillating to eighth notes or triplets).",
            "Return fully to the original pitch on the down-swing."
        ],
        whatToWatchFor: [
            "Nervous, fast 'mosquito' vibrato using only the fingers.",
            "Bending out of tune but not returning to the core pitch.",
            "Inconsistent speeds of oscillation."
        ]
    },
    "Saturday": { 
        name: "Double Stops", 
        desc: "Play two strings simultaneously within the scale shape to create thicker, chord-like textures.",
        howTo: [
            "Identify two adjacent strings within the current scale shape.",
            "Fret both notes simultaneously (using two fingers, or a partial barre).",
            "Strike both strings together with a single, controlled pick stroke.",
            "Ensure both notes ring out at equal volume."
        ],
        whatToWatchFor: [
            "One string buzzing or sounding muted.",
            "Accidentally hitting a third unwanted string.",
            "Bending one string out of tune while fretting the other."
        ]
    },
    "Sunday": { 
        name: "Review or free play", 
        desc: "Combine techniques naturally. Identify which technique felt weakest this week and give it extra attention.",
        howTo: [
            "Play through the scale shape normally.",
            "Try adding a slide between position shifts.",
            "Add vibrato to the final note of your phrases.",
            "Incorporate a hammer-on or pull-off into a fast run."
        ],
        whatToWatchFor: [
            "Overusing one technique while ignoring others.",
            "Losing time and rhythm while trying to execute a technique.",
            "Tensing up the picking hand."
        ]
    },
    "Speed": { 
        name: "Speed & Metronome", 
        desc: "Build speed by playing the same pattern with a gradually increasing tempo.",
        howTo: [
            "Start with a tempo where you can play the pattern flawlessly.",
            "Increase the BPM by 5-10 after every successful repetition.",
            "Focus on economy of motion (keep your fingers close to the fretboard)."
        ],
        whatToWatchFor: [
            "Tensing up your picking hand as you get faster.",
            "Sacrificing clean notes for speed.",
            "Flying fingers (lifting fingers too high off the fretboard)."
        ]
    }
};

const DAY_TO_SHAPE: Record<string, number> = {
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5,
    "Saturday": 1, // Double stops
    "Sunday": 2, // Improvisation focus
    "Speed": 1 // Speed Building defaults to shape 1
};

// Helper to chunk notes into measures of 8 eighth notes
function chunkIntoMeasures(notes: { str: number; fret: number }[], limit?: number): TabNoteData[][] {
    const list = limit ? notes.slice(0, limit) : notes;
    const measures: TabNoteData[][] = [];
    for (let i = 0; i < list.length; i += 8) {
        const chunk = list.slice(i, i + 8);
        measures.push(chunk.map(n => ({ positions: [{ str: n.str, fret: n.fret }], duration: "8" })));
    }
    return measures;
}

function generateChordProgressionMeasures(shapeData: any): TabNoteData[][] {
    if (!shapeData.actualChords || shapeData.actualChords.length === 0) return [];
    
    const measures: TabNoteData[][] = [];
    
    for (const chord of shapeData.actualChords) {
        const positions: {str: number, fret: number|string}[] = [];
        for (let strIdx = 0; strIdx < 6; strIdx++) {
            const fretVal = chord.frets[strIdx];
            if (fretVal !== 'x') {
                positions.push({ str: 6 - strIdx, fret: fretVal });
            }
        }
        
        // Strumming pattern: Half note, Quarter, Quarter
        measures.push([
            { positions, duration: "h" },
            { positions, duration: "q" },
            { positions, duration: "q" }
        ]);
    }
    
    // If progression is only 2 chords, repeat the first one to make it 3 measures long
    if (measures.length === 2) {
        measures.push(measures[0]);
    }
    
    return measures;
}

// Helper to generate dynamic, tailored exercises for the Technique of the Day
function generateTechniqueMeasures(dayOfWeek: string, notesAsc: {str: number, fret: number}[]): TabNoteData[][] {
    // Grab notes on strings 2 and 3 for expressive techniques
    const middleNotes = notesAsc.filter(n => n.str === 2 || n.str === 3);
    if (middleNotes.length < 4) return chunkIntoMeasures(notesAsc, 8);
    
    // Group notes by string to ensure we pick pairs on the same string
    const string3Notes = middleNotes.filter(n => n.str === 3);
    const string2Notes = middleNotes.filter(n => n.str === 2);

    const s3_n1 = string3Notes[0] || middleNotes[0];
    const s3_n2 = string3Notes[1] || middleNotes[1];
    
    const s2_n1 = string2Notes[0] || middleNotes[2];
    const s2_n2 = string2Notes[1] || middleNotes[3];

    switch (dayOfWeek) {
        case "Monday": // Slides
            return [
                [
                    { positions: [{ str: s3_n1.str, fret: s3_n1.fret }], duration: "q" },
                    { positions: [{ str: s3_n1.str, fret: s3_n2.fret }], duration: "q" }, // Slide up
                    { positions: [{ str: s3_n1.str, fret: s3_n1.fret }], duration: "h" }, // Slide down
                ],
                [
                    { positions: [{ str: s2_n1.str, fret: s2_n1.fret }], duration: "q" },
                    { positions: [{ str: s2_n1.str, fret: s2_n2.fret }], duration: "q" }, // Slide up
                    { positions: [{ str: s2_n1.str, fret: s2_n1.fret }], duration: "h" }, // Slide down
                ]
            ];
        case "Tuesday": // Hammer-ons
            return [
                [
                    { positions: [{ str: s3_n1.str, fret: s3_n1.fret }], duration: "8" },
                    { positions: [{ str: s3_n1.str, fret: s3_n2.fret }], duration: "8" }, // Hammer
                    { positions: [{ str: s3_n1.str, fret: s3_n1.fret }], duration: "8" },
                    { positions: [{ str: s3_n1.str, fret: s3_n2.fret }], duration: "8" }, // Hammer
                    { positions: [{ str: s3_n1.str, fret: s3_n1.fret }], duration: "q" },
                    { positions: [{ str: s3_n1.str, fret: s3_n2.fret }], duration: "q" }, // Hammer
                ]
            ];
        case "Wednesday": // Pull-offs
            return [
                [
                    { positions: [{ str: s2_n2.str, fret: s2_n2.fret }], duration: "8" },
                    { positions: [{ str: s2_n2.str, fret: s2_n1.fret }], duration: "8" }, // Pull-off
                    { positions: [{ str: s2_n2.str, fret: s2_n2.fret }], duration: "8" },
                    { positions: [{ str: s2_n2.str, fret: s2_n1.fret }], duration: "8" }, // Pull-off
                    { positions: [{ str: s2_n2.str, fret: s2_n2.fret }], duration: "q" },
                    { positions: [{ str: s2_n2.str, fret: s2_n1.fret }], duration: "q" }, // Pull-off
                ]
            ];
        case "Thursday": // Bends
            return [
                [
                    { positions: [{ str: s3_n2.str, fret: s3_n2.fret }], duration: "h" }, // Bend up
                    { positions: [{ str: s3_n2.str, fret: s3_n1.fret }], duration: "q" }, // Release
                    { positions: [{ str: s2_n1.str, fret: s2_n1.fret }], duration: "q" }, // Resolution
                ]
            ];
        case "Friday": // Vibrato
            return [
                [
                    { positions: [{ str: s3_n1.str, fret: s3_n2.fret }], duration: "w" },
                ],
                [
                    { positions: [{ str: s2_n1.str, fret: s2_n2.fret }], duration: "w" },
                ]
            ];
        case "Saturday": // Double Stops
            return [
                [
                    { positions: [
                        { str: s3_n1.str, fret: s3_n1.fret },
                        { str: s2_n1.str, fret: s2_n1.fret }
                    ], duration: "q" },
                    { positions: [
                        { str: s3_n2.str, fret: s3_n2.fret },
                        { str: s2_n2.str, fret: s2_n2.fret }
                    ], duration: "q" },
                    { positions: [
                        { str: s3_n1.str, fret: s3_n1.fret },
                        { str: s2_n1.str, fret: s2_n1.fret }
                    ], duration: "h" },
                ]
            ];
        case "Sunday":
            return [
                [
                    { positions: [{ str: s3_n1.str, fret: s3_n1.fret }], duration: "8" },
                    { positions: [{ str: s3_n1.str, fret: s3_n2.fret }], duration: "8" }, // Hammer
                    { positions: [{ str: s2_n1.str, fret: s2_n1.fret }], duration: "q" }, 
                    { positions: [{ str: s2_n2.str, fret: s2_n2.fret }], duration: "h" }  // Vibrato
                ]
            ];
        case "Speed":
            return [
                [
                    { positions: [{ str: s3_n1.str, fret: s3_n1.fret }], duration: "16" },
                    { positions: [{ str: s3_n2.str, fret: s3_n2.fret }], duration: "16" },
                    { positions: [{ str: s2_n1.str, fret: s2_n1.fret }], duration: "16" },
                    { positions: [{ str: s2_n2.str, fret: s2_n2.fret }], duration: "16" },
                    { positions: [{ str: s3_n1.str, fret: s3_n1.fret }], duration: "16" },
                    { positions: [{ str: s3_n2.str, fret: s3_n2.fret }], duration: "16" },
                    { positions: [{ str: s2_n1.str, fret: s2_n1.fret }], duration: "16" },
                    { positions: [{ str: s2_n2.str, fret: s2_n2.fret }], duration: "16" },
                    { positions: [{ str: s3_n1.str, fret: s3_n1.fret }], duration: "h" }
                ]
            ];
        default:
            return chunkIntoMeasures(notesAsc.slice(0, 8), 4);
    }
}

export function generateRoutine(key: string, family: ScaleFamily, quality: ScaleQuality, dayOfWeek: string, overrideShapeId?: number): { routine: Exercise[], shapeData: any } {
    const shapeId = overrideShapeId ?? (DAY_TO_SHAPE[dayOfWeek] || 1);
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
            id: "melodic-rhythm",
            title: "4. Melodic rhythm",
            duration: 300,
            description: "Rhythm transforms scales into music. Play a simple 3-note melodic lick inside this shape, first as slow quarter notes, then double time as eighth notes.",
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
            id: "harmonic-rhythm",
            title: "5. Harmonic rhythm",
            duration: 300,
            description: `Practice the harmonic structure of this position. Strum the chords of the progression (${shape.chordProgressions}) to internalize the tonality of the shape.`,
            focusPoints: [
                "Ensure all notes in the chord ring out clearly.",
                "Practice a steady rhythm: one long strum followed by two short strums.",
                "Keep your hand moving consistently."
            ],
            vexflowMeasures: generateChordProgressionMeasures(shape)
        },
        {
            id: "technique",
            title: "6. Technique of the day",
            duration: 300,
            description: "Focus purely on how the notes are articulated rather than what notes you play. Execute the prescribed tab below using strictly the technique of the day.",
            dynamic: true,
            vexflowMeasures: generateTechniqueMeasures(dayOfWeek, allNotesAsc)
        },
        {
            id: "improv",
            title: "7. Controlled improvisation",
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

import { useState, useEffect, useRef } from 'react';
import { Play, Square, Settings2, Music } from 'lucide-react';
import Soundfont from 'soundfont-player';

interface JamPlayerProps {
    shapeData: any;
}

const CHROMATIC = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
const ROOT_MIDI = {
    'E': 40, 'F': 41, 'F#': 42, 'G': 43, 'G#': 44, 'A': 45, 'Bb': 46, 'B': 47,
    'C': 48, 'C#': 49, 'D': 50, 'Eb': 51
};

const STRING_MIDI_BASE = {
    1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40
};

interface ChordDef { numeral: string; offset: number; q: 'Major' | 'Minor' }
interface ProgDef { id: string; name: string; chords: ChordDef[] }

const MAJOR_PROGRESSIONS: ProgDef[] = [
    { id: "maj_pop_punk", name: "Pop Punk (I - V - vi - IV)", chords: [{ numeral: 'I', offset: 0, q: 'Major' }, { numeral: 'V', offset: 7, q: 'Major' }, { numeral: 'vi', offset: 9, q: 'Minor' }, { numeral: 'IV', offset: 5, q: 'Major' }] },
    { id: "maj_50s", name: "50s Ballad (I - vi - IV - V)", chords: [{ numeral: 'I', offset: 0, q: 'Major' }, { numeral: 'vi', offset: 9, q: 'Minor' }, { numeral: 'IV', offset: 5, q: 'Major' }, { numeral: 'V', offset: 7, q: 'Major' }] },
    { id: "maj_classic", name: "Classic Rock (I - bVII - IV - I)", chords: [{ numeral: 'I', offset: 0, q: 'Major' }, { numeral: 'bVII', offset: 10, q: 'Major' }, { numeral: 'IV', offset: 5, q: 'Major' }, { numeral: 'I', offset: 0, q: 'Major' }] },
    { id: "maj_jazz", name: "Jazz/R&B (ii - V - I)", chords: [{ numeral: 'ii', offset: 2, q: 'Minor' }, { numeral: 'V', offset: 7, q: 'Major' }, { numeral: 'I', offset: 0, q: 'Major' }, { numeral: 'I', offset: 0, q: 'Major' }] },
    { id: "maj_standard", name: "Pop Standard (I - IV - vi - V)", chords: [{ numeral: 'I', offset: 0, q: 'Major' }, { numeral: 'IV', offset: 5, q: 'Major' }, { numeral: 'vi', offset: 9, q: 'Minor' }, { numeral: 'V', offset: 7, q: 'Major' }] },
    { id: "maj_folk", name: "Folk Vamp (I - I - IV - V)", chords: [{ numeral: 'I', offset: 0, q: 'Major' }, { numeral: 'I', offset: 0, q: 'Major' }, { numeral: 'IV', offset: 5, q: 'Major' }, { numeral: 'V', offset: 7, q: 'Major' }] }
];

const MINOR_PROGRESSIONS: ProgDef[] = [
    { id: "min_epic", name: "Epic Metal (i - VI - VII - i)", chords: [{ numeral: 'i', offset: 0, q: 'Minor' }, { numeral: 'VI', offset: 8, q: 'Major' }, { numeral: 'VII', offset: 10, q: 'Major' }, { numeral: 'i', offset: 0, q: 'Minor' }] },
    { id: "min_andalusian", name: "Andalusian (i - bVII - bVI - V)", chords: [{ numeral: 'i', offset: 0, q: 'Minor' }, { numeral: 'VII', offset: 10, q: 'Major' }, { numeral: 'VI', offset: 8, q: 'Major' }, { numeral: 'V', offset: 7, q: 'Major' }] },
    { id: "min_blues", name: "Blues Minor (i - iv - v - i)", chords: [{ numeral: 'i', offset: 0, q: 'Minor' }, { numeral: 'iv', offset: 5, q: 'Minor' }, { numeral: 'v', offset: 7, q: 'Minor' }, { numeral: 'i', offset: 0, q: 'Minor' }] },
    { id: "min_darkpop", name: "Dark Pop (i - VI - III - VII)", chords: [{ numeral: 'i', offset: 0, q: 'Minor' }, { numeral: 'VI', offset: 8, q: 'Major' }, { numeral: 'III', offset: 3, q: 'Major' }, { numeral: 'VII', offset: 10, q: 'Major' }] },
    { id: "min_jazz", name: "Jazz Minor (ii - V - i)", chords: [{ numeral: 'ii', offset: 2, q: 'Minor' }, { numeral: 'V', offset: 7, q: 'Major' }, { numeral: 'i', offset: 0, q: 'Minor' }, { numeral: 'i', offset: 0, q: 'Minor' }] },
    { id: "min_moody", name: "Moody Vamp (i - v - VI - v)", chords: [{ numeral: 'i', offset: 0, q: 'Minor' }, { numeral: 'v', offset: 7, q: 'Minor' }, { numeral: 'VI', offset: 8, q: 'Major' }, { numeral: 'v', offset: 7, q: 'Minor' }] }
];

function getNoteByOffset(root: string, semitones: number) {
    const idx = CHROMATIC.indexOf(root);
    return CHROMATIC[(idx + semitones) % 12];
}

function getChordMidi(rootName: string, quality: 'Major' | 'Minor'): number[] {
    const base = ROOT_MIDI[rootName as keyof typeof ROOT_MIDI];
    if (base < 48) {
        // E-form barre voicing
        return quality === 'Major' 
            ? [base, base+7, base+12, base+16, base+19, base+24]
            : [base, base+7, base+12, base+15, base+19, base+24];
    } else {
        // A-form barre voicing
        return quality === 'Major'
            ? [base, base+7, base+12, base+16, base+19]
            : [base, base+7, base+12, base+15, base+19];
    }
}

export default function JamPlayer({ shapeData }: JamPlayerProps) {
    const [bpm, setBpm] = useState(90);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [style, setStyle] = useState('folk');
    const [progId, setProgId] = useState('shape');
    
    const audioCtxRef = useRef<AudioContext | null>(null);
    const instrumentRef = useRef<Soundfont.Player | null>(null);
    const nextNoteTimeRef = useRef(0);
    const currentMeasureRef = useRef(0);
    const currentNoteRef = useRef(0);
    const timerIDRef = useRef<number | null>(null);
    
    const availableProgressions = shapeData.quality === 'Major' ? MAJOR_PROGRESSIONS : MINOR_PROGRESSIONS;

    const generateMeasures = () => {
        const measures: { midiNotes: number[], duration: string, velocity?: number }[][] = [];
        
        let chordMidiArrays: number[][] = [];
        
        if (progId === 'shape') {
            // Use the actual chords mapped to this shape position
            if (!shapeData.actualChords || shapeData.actualChords.length === 0) return [];
            
            chordMidiArrays = shapeData.actualChords.map((chord: any) => {
                const notes: number[] = [];
                for (let strIdx = 0; strIdx < 6; strIdx++) {
                    const fretVal = chord.frets[strIdx];
                    if (fretVal !== 'x') {
                        const strNum = 6 - strIdx;
                        const midi = (STRING_MIDI_BASE[strNum as keyof typeof STRING_MIDI_BASE] || 40) + (typeof fretVal === 'string' ? parseInt(fretVal) : fretVal);
                        notes.push(midi);
                    }
                }
                return notes;
            });
            
            // Loop short progressions to make 4 bars
            if (chordMidiArrays.length === 2) {
                chordMidiArrays.push(chordMidiArrays[0]);
                chordMidiArrays.push(chordMidiArrays[1]);
            } else if (chordMidiArrays.length === 3) {
                chordMidiArrays.push(chordMidiArrays[0]);
            }
        } else {
            // Build progression dynamically based on Key and Quality
            const prog = availableProgressions.find(p => p.id === progId);
            if (!prog) return [];
            
            const keyRoot = shapeData.key;
            chordMidiArrays = prog.chords.map(c => {
                const chordRoot = getNoteByOffset(keyRoot, c.offset);
                return getChordMidi(chordRoot, c.q);
            });
        }

        chordMidiArrays.forEach(midiNotes => {
            if (style === 'quarters') {
                measures.push([
                    { midiNotes, duration: "q", velocity: 1.0 },
                    { midiNotes, duration: "q", velocity: 0.8 },
                    { midiNotes, duration: "q", velocity: 0.9 },
                    { midiNotes, duration: "q", velocity: 0.8 }
                ]);
            } else if (style === 'folk') {
                measures.push([
                    { midiNotes, duration: "q", velocity: 1.0 },
                    { midiNotes, duration: "8", velocity: 0.9 },
                    { midiNotes, duration: "8", velocity: 0.7 },
                    { midiNotes, duration: "q", velocity: 1.0 },
                    { midiNotes, duration: "8", velocity: 0.9 },
                    { midiNotes, duration: "8", velocity: 0.7 },
                ]);
            } else if (style === 'upbeats') {
                measures.push([
                    { midiNotes: [], duration: "q", velocity: 0 },
                    { midiNotes, duration: "q", velocity: 0.9 },
                    { midiNotes: [], duration: "q", velocity: 0 },
                    { midiNotes, duration: "q", velocity: 0.9 }
                ]);
            }
        });
        
        return measures;
    };

    const measures = generateMeasures();

    const scheduleNote = (measureIdx: number, noteIdx: number, time: number): number => {
        if (!audioCtxRef.current) return 0;
        
        const noteData = measures[measureIdx][noteIdx];
        const durationStr = noteData.duration || 'q';
        let beatValue = 1;
        if (durationStr === '8') beatValue = 0.5;
        if (durationStr === '16') beatValue = 0.25;
        if (durationStr === 'h') beatValue = 2;
        if (durationStr === 'w') beatValue = 4;
        
        const secondsPerBeat = 60.0 / bpm;
        const durationSec = beatValue * secondsPerBeat;

        if (noteData.midiNotes && noteData.midiNotes.length > 0) {
            const isUpstroke = noteData.velocity && noteData.velocity < 0.8;
            
            // Strum direction based on velocity
            const sortedNotes = isUpstroke 
                ? [...noteData.midiNotes].sort((a,b) => b - a) // High note to low note (upstroke)
                : [...noteData.midiNotes].sort((a,b) => a - b); // Low note to high note (downstroke)

            sortedNotes.forEach((midi, index) => {
                if (instrumentRef.current) {
                    const strumOffset = index * 0.015; 
                    const volume = noteData.velocity || 1.0;
                    instrumentRef.current.play(midi, time + strumOffset, { duration: durationSec * 1.5, gain: volume * 1.5 });
                }
            });
        }

        if (beatValue >= 1) {
            const clickOsc = audioCtxRef.current.createOscillator();
            const clickGain = audioCtxRef.current.createGain();
            clickOsc.type = 'square';
            clickOsc.frequency.value = 600; 
            clickGain.gain.setValueAtTime(0, time);
            clickGain.gain.linearRampToValueAtTime(0.05, time + 0.001);
            clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            clickOsc.connect(clickGain);
            clickGain.connect(audioCtxRef.current.destination);
            clickOsc.start(time);
            clickOsc.stop(time + 0.05);
        }

        return durationSec;
    };

    const scheduler = () => {
        if (!audioCtxRef.current) return;
        
        const scheduleAheadTime = 0.1; 
        
        while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
            if (measures.length === 0) break;
            
            const measure = measures[currentMeasureRef.current];
            const durationSec = scheduleNote(currentMeasureRef.current, currentNoteRef.current, nextNoteTimeRef.current);
            
            nextNoteTimeRef.current += (durationSec || 0);
            
            currentNoteRef.current++;
            if (currentNoteRef.current >= measure.length) {
                currentNoteRef.current = 0;
                currentMeasureRef.current++;
                if (currentMeasureRef.current >= measures.length) {
                    currentMeasureRef.current = 0; // Loop indefinitely!
                }
            }
        }
        
        if (isPlaying) {
            timerIDRef.current = requestAnimationFrame(scheduler);
        }
    };

    const loadInstrumentAndPlay = async () => {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContext();
        }
        
        if (audioCtxRef.current.state === 'suspended') {
            await audioCtxRef.current.resume();
        }

        if (!instrumentRef.current) {
            setIsLoading(true);
            try {
                instrumentRef.current = await Soundfont.instrument(audioCtxRef.current, 'acoustic_guitar_steel');
            } catch (error) {
                console.error("Failed to load soundfont", error);
            }
            setIsLoading(false);
        }

        currentMeasureRef.current = 0;
        currentNoteRef.current = 0;
        nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.1;
        timerIDRef.current = requestAnimationFrame(scheduler);
    };

    useEffect(() => {
        if (isPlaying) {
            loadInstrumentAndPlay();
        } else {
            if (timerIDRef.current !== null) {
                cancelAnimationFrame(timerIDRef.current);
                timerIDRef.current = null;
            }
            if (audioCtxRef.current) {
                audioCtxRef.current.suspend();
            }
        }
        
        return () => {
            if (timerIDRef.current !== null) cancelAnimationFrame(timerIDRef.current);
        };
    }, [isPlaying, style, progId]); 

    const handlePlayStop = () => {
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900/40 p-5 rounded-2xl border border-indigo-500/20 mb-6 flex flex-col xl:flex-row items-center gap-6 shadow-lg shadow-indigo-500/10 no-print">
            
            <div className="flex items-center gap-4 w-full xl:w-auto">
                <button 
                    onClick={handlePlayStop}
                    disabled={isLoading}
                    className={`flex items-center justify-center w-14 h-14 rounded-full transition-all disabled:opacity-50 flex-shrink-0 ${
                        isPlaying ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/50' : 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                    }`}
                >
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : isPlaying ? (
                        <Square className="w-6 h-6 fill-current" />
                    ) : (
                        <Play className="w-6 h-6 fill-current ml-1" />
                    )}
                </button>

                <div className="flex flex-col flex-1">
                    <label className="text-xs text-indigo-300 uppercase tracking-wider mb-1 font-bold flex items-center gap-2">
                        Jam Track Tempo
                        {isLoading && <span className="text-[10px] text-white bg-indigo-500/50 px-2 py-0.5 rounded-full animate-pulse">Loading Samples...</span>}
                    </label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="range" 
                            min="60" 
                            max="160" 
                            value={bpm} 
                            onChange={(e) => setBpm(parseInt(e.target.value))}
                            className="w-full md:w-32 accent-indigo-400"
                        />
                        <span className="text-white font-mono font-bold w-8">{bpm}</span>
                    </div>
                </div>
            </div>

            <div className="hidden xl:block w-px h-12 bg-white/10"></div>

            <div className="flex flex-col md:flex-row gap-6 w-full xl:w-auto flex-1">
                
                <div className="flex flex-col flex-1">
                    <label className="text-xs text-indigo-300 uppercase tracking-wider mb-1 font-bold flex items-center gap-2">
                        <Music className="w-3 h-3" /> Chord Progression
                    </label>
                    <select 
                        value={progId}
                        onChange={(e) => {
                            setProgId(e.target.value);
                            if (isPlaying) {
                                setIsPlaying(false);
                                setTimeout(() => setIsPlaying(true), 50);
                            }
                        }}
                        className="bg-black/40 border border-indigo-500/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-400 transition-colors cursor-pointer w-full"
                    >
                        <option value="shape">Current Shape ({shapeData.chordProgressions})</option>
                        <optgroup label={`Key of ${shapeData.key} ${shapeData.quality}`}>
                            {availableProgressions.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </optgroup>
                    </select>
                </div>

                <div className="flex flex-col flex-1">
                    <label className="text-xs text-indigo-300 uppercase tracking-wider mb-1 font-bold flex items-center gap-2">
                        <Settings2 className="w-3 h-3" /> Rhythm Style
                    </label>
                    <select 
                        value={style}
                        onChange={(e) => {
                            setStyle(e.target.value);
                            if (isPlaying) {
                                setIsPlaying(false);
                                setTimeout(() => setIsPlaying(true), 50);
                            }
                        }}
                        className="bg-black/40 border border-indigo-500/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-400 transition-colors cursor-pointer w-full"
                    >
                        <option value="folk">Acoustic Strum (D D-U D D-U)</option>
                        <option value="quarters">Driving Quarters (D D D D)</option>
                        <option value="upbeats">Reggae / Upbeats</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

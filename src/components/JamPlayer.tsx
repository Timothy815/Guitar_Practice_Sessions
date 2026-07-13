import { useState, useEffect, useRef } from 'react';
import { Play, Square, Settings2, Music, Trash2 } from 'lucide-react';
import Soundfont from 'soundfont-player';

interface JamPlayerProps {
    shapeData: any;
}

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_EQUIVALENTS: Record<string, string> = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
};
const ROOT_MIDI = {
    'E': 40, 'F': 41, 'F#': 42, 'Gb': 42, 'G': 43, 'G#': 44, 'Ab': 44, 'A': 45, 'A#': 46, 'Bb': 46, 'B': 47,
    'C': 48, 'C#': 49, 'Db': 49, 'D': 50, 'D#': 51, 'Eb': 51
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

const MAJOR_BLUES_PROGRESSIONS: ProgDef[] = [
    { id: "maj_blues_12", name: "12-Bar Blues (I-IV-V)", chords: [
        { numeral: 'I', offset: 0, q: 'Major' }, { numeral: 'I', offset: 0, q: 'Major' }, { numeral: 'I', offset: 0, q: 'Major' }, { numeral: 'I', offset: 0, q: 'Major' },
        { numeral: 'IV', offset: 5, q: 'Major' }, { numeral: 'IV', offset: 5, q: 'Major' }, { numeral: 'I', offset: 0, q: 'Major' }, { numeral: 'I', offset: 0, q: 'Major' },
        { numeral: 'V', offset: 7, q: 'Major' }, { numeral: 'IV', offset: 5, q: 'Major' }, { numeral: 'I', offset: 0, q: 'Major' }, { numeral: 'V', offset: 7, q: 'Major' }
    ]},
    { id: "maj_blues_shuffle", name: "Texas Shuffle (I-IV-I-V)", chords: [{ numeral: 'I', offset: 0, q: 'Major' }, { numeral: 'IV', offset: 5, q: 'Major' }, { numeral: 'I', offset: 0, q: 'Major' }, { numeral: 'V', offset: 7, q: 'Major' }] },
    { id: "maj_blues_gospel", name: "Gospel Blues (I-vi-ii-V)", chords: [{ numeral: 'I', offset: 0, q: 'Major' }, { numeral: 'vi', offset: 9, q: 'Minor' }, { numeral: 'ii', offset: 2, q: 'Minor' }, { numeral: 'V', offset: 7, q: 'Major' }] }
];

const MINOR_BLUES_PROGRESSIONS: ProgDef[] = [
    { id: "min_blues_12", name: "Minor 12-Bar Blues", chords: [
        { numeral: 'i', offset: 0, q: 'Minor' }, { numeral: 'i', offset: 0, q: 'Minor' }, { numeral: 'i', offset: 0, q: 'Minor' }, { numeral: 'i', offset: 0, q: 'Minor' },
        { numeral: 'iv', offset: 5, q: 'Minor' }, { numeral: 'iv', offset: 5, q: 'Minor' }, { numeral: 'i', offset: 0, q: 'Minor' }, { numeral: 'i', offset: 0, q: 'Minor' },
        { numeral: 'VI', offset: 8, q: 'Major' }, { numeral: 'V', offset: 7, q: 'Major' }, { numeral: 'i', offset: 0, q: 'Minor' }, { numeral: 'V', offset: 7, q: 'Major' }
    ]},
    { id: "min_blues_quick", name: "Minor Quick Change (i-iv-i-V)", chords: [{ numeral: 'i', offset: 0, q: 'Minor' }, { numeral: 'iv', offset: 5, q: 'Minor' }, { numeral: 'i', offset: 0, q: 'Minor' }, { numeral: 'V', offset: 7, q: 'Major' }] },
    { id: "min_blues_slow", name: "Slow Minor Blues (i-VI-V-i)", chords: [{ numeral: 'i', offset: 0, q: 'Minor' }, { numeral: 'VI', offset: 8, q: 'Major' }, { numeral: 'V', offset: 7, q: 'Major' }, { numeral: 'i', offset: 0, q: 'Minor' }] }
];

function getNoteByOffset(root: string, semitones: number) {
    let normalizedRoot = FLAT_EQUIVALENTS[root] || root;
    const idx = CHROMATIC.indexOf(normalizedRoot);
    if (idx === -1) return root; // fallback
    return CHROMATIC[(idx + semitones) % 12];
}

function getChordMidi(rootName: string, quality: 'Major' | 'Minor' | 'Dim'): number[] {
    const base = ROOT_MIDI[rootName as keyof typeof ROOT_MIDI];
    if (!base) return [];
    
    if (quality === 'Dim') {
        return [base, base+3, base+6, base+12]; // Simple diminished voicing
    }
    
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
    
    const [customJams, setCustomJams] = useState<any[]>([]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('fretfocus_custom_jams') || '[]');
        setCustomJams(saved);
    }, []);

    let availableProgressions = shapeData.quality === 'Major' ? MAJOR_PROGRESSIONS : MINOR_PROGRESSIONS;
    if (shapeData.family === 'Blues') {
        availableProgressions = shapeData.quality === 'Major' ? MAJOR_BLUES_PROGRESSIONS : MINOR_BLUES_PROGRESSIONS;
    }

    const generateMeasures = () => {
        const measures: any[] = [];
        let chordMidiArrays: { midiNotes: number[], rhythm?: number[] }[] = [];
        
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
                return { midiNotes: notes };
            });
            
            // Loop short progressions to make 4 bars
            if (chordMidiArrays.length === 2) {
                chordMidiArrays.push(chordMidiArrays[0]);
                chordMidiArrays.push(chordMidiArrays[1]);
            } else if (chordMidiArrays.length === 3) {
                chordMidiArrays.push(chordMidiArrays[0]);
            }
        } else if (progId.startsWith('custom_jam_')) {
            const customJam = customJams.find(j => j.id === progId);
            if (customJam && customJam.chords) {
                const keyRoot = shapeData.key;
                chordMidiArrays = customJam.chords.map((c: any) => {
                    const chordRoot = getNoteByOffset(keyRoot, c.offset);
                    return { midiNotes: getChordMidi(chordRoot, c.q), rhythm: c.rhythm };
                });
            }
        } else {
            const prog = availableProgressions.find(p => p.id === progId);
            if (!prog) return [];
            const keyRoot = shapeData.key;
            chordMidiArrays = prog.chords.map(c => {
                const chordRoot = getNoteByOffset(keyRoot, c.offset);
                return { midiNotes: getChordMidi(chordRoot, c.q) };
            });
        }

        const customJam = customJams.find(j => j.id === progId);
        
        if (style === 'custom') {
            const originalBpm = customJam?.bpm || 90;
            const globalRhythm = customJam?.rhythm;
            
            chordMidiArrays.forEach((chordData) => {
                const measure: any[] = [];
                let soundingNoteIdx = 0;
                
                const activeRhythm = chordData.rhythm || globalRhythm;
                
                if (activeRhythm) {
                    activeRhythm.forEach((rVal: number) => {
                        const absoluteSeconds = Math.abs(rVal);
                        const originalBeats = absoluteSeconds / (60.0 / originalBpm);
                        const isRest = rVal < 0;
                        
                        measure.push({
                            midiNotes: isRest || chordData.midiNotes.length === 0 ? [] : chordData.midiNotes,
                            duration: 'custom',
                            velocity: isRest ? 0 : (soundingNoteIdx % 2 === 0 ? 1.0 : 0.7),
                            absoluteBeatValue: originalBeats,
                            isRest: isRest
                        });
                        
                        if (!isRest) soundingNoteIdx++;
                    });
                } else {
                    measure.push({ midiNotes: chordData.midiNotes, duration: "1n", velocity: 0.9 });
                }
                measures.push(measure);
            });
            
            return measures;
        }

        chordMidiArrays.forEach(chordData => {
            const midiNotes = chordData.midiNotes;
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
            } else if (style === 'shuffle') {
                measures.push([
                    { midiNotes, duration: "qt", velocity: 1.0 },
                    { midiNotes, duration: "8t", velocity: 0.7 },
                    { midiNotes, duration: "qt", velocity: 0.9 },
                    { midiNotes, duration: "8t", velocity: 0.7 },
                    { midiNotes, duration: "qt", velocity: 1.0 },
                    { midiNotes, duration: "8t", velocity: 0.7 },
                    { midiNotes, duration: "qt", velocity: 0.9 },
                    { midiNotes, duration: "8t", velocity: 0.7 }
                ]);
            }
        });
        
        return measures;
    };

    const measures = generateMeasures();

    const scheduleNote = (measureIdx: number, noteIdx: number, time: number): number => {
        if (!audioCtxRef.current) return 0;
        
        if (!measures || measures.length === 0 || !measures[measureIdx]) {
            return 0.5; // fallback duration if progression is empty
        }

        const noteData = measures[measureIdx][noteIdx];
        if (!noteData) return 0.5;
        
        let durationSec = 0;
        let beatValue = 1;
        
        if (noteData.absoluteBeatValue !== undefined) {
            const secondsPerBeat = 60.0 / bpm;
            durationSec = noteData.absoluteBeatValue * secondsPerBeat;
            beatValue = noteData.absoluteBeatValue;
        } else {
            const durationStr = noteData.duration || 'q';
            if (durationStr === '8') beatValue = 0.5;
            if (durationStr === '16') beatValue = 0.25;
            if (durationStr === 'h') beatValue = 2;
            if (durationStr === 'w') beatValue = 4;
            if (durationStr === 'qt') beatValue = 2 / 3;
            if (durationStr === '8t') beatValue = 1 / 3;
            
            const secondsPerBeat = 60.0 / bpm;
            durationSec = beatValue * secondsPerBeat;
        }

        if (noteData.midiNotes && noteData.midiNotes.length > 0 && !noteData.isRest) {
            const isUpstroke = noteData.velocity && noteData.velocity < 0.8;
            
            // Strum direction based on velocity
            const sortedNotes = isUpstroke 
                ? [...noteData.midiNotes].sort((a,b) => b - a) // High note to low note (upstroke)
                : [...noteData.midiNotes].sort((a,b) => a - b); // Low note to high note (downstroke)

            sortedNotes.forEach((midi, index) => {
                if (instrumentRef.current) {
                    const strumOffset = index * 0.015; 
                    const volume = noteData.velocity || 1.0;
                    instrumentRef.current.play(midi.toString(), time + strumOffset, { duration: durationSec * 1.5, gain: volume * 1.5 });
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

    const handleDeleteCustomJam = () => {
        if (!progId.startsWith('custom_jam_')) return;
        if (window.confirm("Are you sure you want to delete this custom jam track?")) {
            const updatedJams = customJams.filter(j => j.id !== progId);
            setCustomJams(updatedJams);
            localStorage.setItem('fretfocus_custom_jams', JSON.stringify(updatedJams));
            setProgId('shape');
            if (isPlaying) {
                setIsPlaying(false);
            }
        }
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
                
                <div className="flex flex-col flex-1 relative">
                    <div className="text-xs text-indigo-300 uppercase tracking-wider mb-1 font-bold flex items-center justify-between w-full">
                        <span className="flex items-center gap-2"><Music className="w-3 h-3" /> Chord Progression</span>
                        {progId.startsWith('custom_jam_') && (
                            <button onClick={handleDeleteCustomJam} className="text-red-400 hover:text-red-300 transition-colors" title="Delete Custom Jam">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <select 
                        value={progId}
                        onChange={(e) => {
                            setProgId(e.target.value);
                            const jam = customJams.find(j => j.id === e.target.value);
                            if (jam && jam.style === 'custom') {
                                setStyle('custom');
                                setBpm(jam.bpm);
                            }
                            if (isPlaying) {
                                setIsPlaying(false);
                                setTimeout(() => setIsPlaying(true), 50);
                            }
                        }}
                        className="bg-black/40 border border-indigo-500/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-400 transition-colors cursor-pointer w-full"
                    >
                        <option value="shape">Current Shape ({shapeData.chordProgressions})</option>
                        {customJams.length > 0 && (
                            <optgroup label="My Saved Tracks">
                                {customJams.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </optgroup>
                        )}
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
                        <option value="shuffle">Blues Shuffle</option>
                        {progId.startsWith('custom_jam_') && (
                            <option value="custom">Original Tap Rhythm</option>
                        )}
                    </select>
                </div>
            </div>
        </div>
    );
}

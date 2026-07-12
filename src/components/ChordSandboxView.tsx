import { useState, useRef, useEffect } from 'react';
import { Play, Square, Settings2, Trash2 } from 'lucide-react';
import Soundfont from 'soundfont-player';
import { getAllDiatonicChords } from '../data/musicEngine';
import type { ScaleFamily, ScaleQuality } from '../data/musicEngine';
import ChordDiagram from './ChordDiagram';

interface ChordSandboxViewProps {
    keyName: string;
    quality: ScaleQuality;
    family: ScaleFamily;
    onSettingsClick: () => void;
}

const ROOT_MIDI: Record<string, number> = {
    'E': 40, 'F': 41, 'F#': 42, 'G': 43, 'G#': 44, 'A': 45, 
    'Bb': 46, 'B': 47, 'C': 48, 'C#': 49, 'D': 50, 'Eb': 51
};

export default function ChordSandboxView({ keyName, quality, family, onSettingsClick }: ChordSandboxViewProps) {
    const [progression, setProgression] = useState<any[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [bpm, setBpm] = useState(90);
    const [style, setStyle] = useState('folk'); // 'folk' | 'rock'
    const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const instrumentRef = useRef<Soundfont.Player | null>(null);
    const nextNoteTimeRef = useRef(0);
    const currentMeasureRef = useRef(0);
    const currentNoteRef = useRef(0);
    const timerIDRef = useRef<number | null>(null);
    const isPlayingRef = useRef(false);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    const chords = getAllDiatonicChords(keyName, quality, family);

    const playChordOnce = async (chord: any) => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            await audioCtxRef.current.resume();
        }
        if (!instrumentRef.current) {
            setIsLoading(true);
            instrumentRef.current = await Soundfont.instrument(audioCtxRef.current, 'acoustic_guitar_steel');
            setIsLoading(false);
        }

        const rootName = chord.name.replace(/m|dim/, '');
        const midiNotes = getChordMidi(rootName, chord.quality);
        const t = audioCtxRef.current.currentTime;
        
        midiNotes.forEach((midi, i) => {
            instrumentRef.current?.play(midi.toString(), t + (i * 0.03), { duration: 2, gain: 0.8 });
        });
    };

    const getChordMidi = (rootName: string, q: string): number[] => {
        const base = ROOT_MIDI[rootName] ?? 40;
        if (base < 48) {
            // E-form barre voicing
            if (q === 'Major') return [base, base+7, base+12, base+16, base+19, base+24];
            if (q === 'Minor') return [base, base+7, base+12, base+15, base+19, base+24];
            return [base, base+6, base+12, base+15, base+18, base+24]; // Dim
        } else {
            // A-form barre voicing
            if (q === 'Major') return [base, base+7, base+12, base+16, base+19];
            if (q === 'Minor') return [base, base+7, base+12, base+15, base+19];
            return [base, base+6, base+12, base+15, base+18]; // Dim
        }
    };

    const loadInstrumentAndPlay = async () => {
        if (progression.length === 0) {
            setIsPlaying(false);
            return;
        }

        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            await audioCtxRef.current.resume();
        }
        if (!instrumentRef.current) {
            setIsLoading(true);
            instrumentRef.current = await Soundfont.instrument(audioCtxRef.current, 'acoustic_guitar_steel');
            setIsLoading(false);
        }

        currentMeasureRef.current = 0;
        currentNoteRef.current = 0;
        nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.1;
        scheduler();
    };

    useEffect(() => {
        if (isPlaying) {
            loadInstrumentAndPlay();
        } else {
            if (timerIDRef.current !== null) {
                cancelAnimationFrame(timerIDRef.current);
                timerIDRef.current = null;
            }
            if (instrumentRef.current) {
                instrumentRef.current.stop();
            }
            setCurrentPlayIndex(-1);
        }
        return () => {
            if (timerIDRef.current !== null) cancelAnimationFrame(timerIDRef.current);
        };
    }, [isPlaying]);

    const scheduler = () => {
        if (!audioCtxRef.current) return;
        const scheduleAheadTime = 0.1;
        
        while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
            if (currentMeasureRef.current >= progression.length) {
                if (isPlayingRef.current) {
                    currentMeasureRef.current = 0; // Loop indefinitely
                } else {
                    setIsPlaying(false);
                    break;
                }
            }

            const chord = progression[currentMeasureRef.current];
            const rootName = chord.name.replace(/m|dim/, '');
            const midiNotes = getChordMidi(rootName, chord.quality);
            
            const secondsPerBeat = 60.0 / bpm;
            
            if (style === 'folk') {
                if (currentNoteRef.current === 0) {
                    // Down strum
                    midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: secondsPerBeat * 2, gain: 0.8 }));
                    nextNoteTimeRef.current += secondsPerBeat * 2;
                    currentNoteRef.current = 1;
                } else if (currentNoteRef.current === 1) {
                    // Down strum
                    midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: secondsPerBeat, gain: 0.7 }));
                    nextNoteTimeRef.current += secondsPerBeat;
                    currentNoteRef.current = 2;
                } else if (currentNoteRef.current === 2) {
                    // Up strum (reverse)
                    [...midiNotes].reverse().forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: secondsPerBeat, gain: 0.6 }));
                    nextNoteTimeRef.current += secondsPerBeat;
                    currentNoteRef.current = 0;
                    currentMeasureRef.current++;
                }
            } else { // 'rock'
                if (currentNoteRef.current === 0) {
                    // Power chord chunk
                    instrumentRef.current?.play(midiNotes[0].toString(), nextNoteTimeRef.current, { duration: secondsPerBeat, gain: 0.9 });
                    instrumentRef.current?.play(midiNotes[1].toString(), nextNoteTimeRef.current, { duration: secondsPerBeat, gain: 0.9 });
                    nextNoteTimeRef.current += secondsPerBeat;
                    currentNoteRef.current = 1;
                } else if (currentNoteRef.current === 1) {
                    instrumentRef.current?.play(midiNotes[0].toString(), nextNoteTimeRef.current, { duration: secondsPerBeat, gain: 0.6 });
                    instrumentRef.current?.play(midiNotes[1].toString(), nextNoteTimeRef.current, { duration: secondsPerBeat, gain: 0.6 });
                    nextNoteTimeRef.current += secondsPerBeat;
                    currentNoteRef.current = 2;
                } else if (currentNoteRef.current === 2) {
                    // Full chord
                    midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.01), { duration: secondsPerBeat * 2, gain: 0.8 }));
                    nextNoteTimeRef.current += secondsPerBeat * 2;
                    currentNoteRef.current = 0;
                    currentMeasureRef.current++;
                }
            }

            setCurrentPlayIndex(currentMeasureRef.current === 0 && currentNoteRef.current === 0 ? progression.length - 1 : currentMeasureRef.current - (currentNoteRef.current === 0 ? 1 : 0));
        }

        if (isPlayingRef.current) {
            timerIDRef.current = requestAnimationFrame(scheduler);
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Header / Options */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/5 border border-white/10 rounded-2xl p-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Chord Progression Sandbox</h2>
                    <p className="text-slate-400">Build and practice custom progressions in <span className="text-primary font-bold">{keyName} {quality} ({family})</span></p>
                </div>
                <button 
                    onClick={onSettingsClick}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 transition-colors"
                >
                    <Settings2 className="w-4 h-4" /> Change Key
                </button>
            </div>

            {/* Chord Palette */}
            <div className="bg-black/20 border border-white/5 p-6 rounded-2xl">
                <h3 className="text-primary font-bold uppercase tracking-wider text-sm mb-6">Diatonic Chords (Click to Play/Add)</h3>
                <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
                    {chords.map((chord, idx) => (
                        <div 
                            key={idx}
                            onClick={() => {
                                playChordOnce(chord);
                                setProgression([...progression, chord]);
                            }}
                            className="flex-shrink-0 bg-white/5 hover:bg-primary/20 hover:border-primary/50 border border-white/10 rounded-xl p-4 cursor-pointer transition-all min-w-[120px] snap-center group"
                        >
                            <div className="text-center mb-4">
                                <p className="text-xl font-bold text-white group-hover:text-primary transition-colors">{chord.name}</p>
                                <p className="text-xs text-slate-400 font-mono mt-1">{chord.numeral}</p>
                            </div>
                            <div className="flex justify-center transform scale-75 origin-top pointer-events-none">
                                <ChordDiagram chord={chord} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Progression Timeline */}
            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 p-6 rounded-2xl min-h-[250px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-indigo-400 font-bold uppercase tracking-wider text-sm">Your Progression</h3>
                    
                    <div className="flex items-center gap-4">
                        <select 
                            value={style} 
                            onChange={(e) => setStyle(e.target.value)}
                            className="bg-black/40 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                        >
                            <option value="folk">Folk Strum</option>
                            <option value="rock">Rock Power</option>
                        </select>
                        
                        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5">
                            <span className="text-slate-400 text-xs uppercase font-bold">BPM</span>
                            <input 
                                type="number" 
                                value={bpm} 
                                onChange={(e) => setBpm(Number(e.target.value))}
                                className="bg-transparent text-white w-12 text-center outline-none font-mono"
                                min="40" max="240"
                            />
                        </div>

                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            disabled={progression.length === 0 || isLoading}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
                                isPlaying 
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30'
                                    : 'bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500'
                            }`}
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            {isPlaying ? 'Stop' : 'Play Loop'}
                        </button>
                    </div>
                </div>

                {progression.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl bg-black/10">
                        <p className="text-slate-500">Click a chord from the palette above to build your progression.</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-4">
                        {progression.map((chord, idx) => (
                            <div 
                                key={idx}
                                className={`relative bg-black/40 border p-4 rounded-xl flex items-center gap-4 transition-colors ${
                                    currentPlayIndex === idx 
                                        ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                                        : 'border-white/10'
                                }`}
                            >
                                <div className="text-center">
                                    <p className={`text-xl font-bold ${currentPlayIndex === idx ? 'text-white' : 'text-slate-300'}`}>{chord.name}</p>
                                    <p className="text-xs text-slate-500 font-mono mt-1">{chord.numeral}</p>
                                </div>
                                <button 
                                    onClick={() => setProgression(p => p.filter((_, i) => i !== idx))}
                                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                    title="Remove Chord"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

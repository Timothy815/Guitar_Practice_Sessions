import { useState, useEffect, useRef } from 'react';
import { Play, Square, Settings2 } from 'lucide-react';
import Soundfont from 'soundfont-player';

interface JamPlayerProps {
    shapeData: any;
}

const STRING_MIDI_BASE = {
    1: 64, // E4
    2: 59, // B3
    3: 55, // G3
    4: 50, // D3
    5: 45, // A2
    6: 40  // E2
};

export default function JamPlayer({ shapeData }: JamPlayerProps) {
    const [bpm, setBpm] = useState(90);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [style, setStyle] = useState('folk');
    
    const audioCtxRef = useRef<AudioContext | null>(null);
    const instrumentRef = useRef<Soundfont.Player | null>(null);
    const nextNoteTimeRef = useRef(0);
    const currentMeasureRef = useRef(0);
    const currentNoteRef = useRef(0);
    const timerIDRef = useRef<number | null>(null);
    
    // Generate the raw notes based on the style
    const generateMeasures = () => {
        if (!shapeData.actualChords || shapeData.actualChords.length === 0) return [];
        const measures: { positions: {str: number, fret: number|string}[], duration: string, velocity?: number }[][] = [];
        
        const baseChords = shapeData.actualChords.map((chord: any) => {
            const positions: {str: number, fret: number|string}[] = [];
            for (let strIdx = 0; strIdx < 6; strIdx++) {
                const fretVal = chord.frets[strIdx];
                if (fretVal !== 'x') positions.push({ str: 6 - strIdx, fret: fretVal });
            }
            return positions;
        });
        
        // Loop the chords to make a 4-bar phrase if needed
        const progression = [...baseChords];
        if (progression.length === 2) {
            progression.push(baseChords[0]);
            progression.push(baseChords[1]);
        } else if (progression.length === 3) {
            progression.push(baseChords[0]);
        }

        progression.forEach(positions => {
            if (style === 'quarters') {
                // Straight 4/4 downstrokes
                measures.push([
                    { positions, duration: "q", velocity: 1.0 },
                    { positions, duration: "q", velocity: 0.8 },
                    { positions, duration: "q", velocity: 0.9 },
                    { positions, duration: "q", velocity: 0.8 }
                ]);
            } else if (style === 'folk') {
                measures.push([
                    { positions, duration: "q", velocity: 1.0 },
                    { positions, duration: "8", velocity: 0.9 },
                    { positions, duration: "8", velocity: 0.7 },
                    { positions, duration: "q", velocity: 1.0 },
                    { positions, duration: "8", velocity: 0.9 },
                    { positions, duration: "8", velocity: 0.7 },
                ]);
            } else if (style === 'upbeats') {
                // Reggae style (rest, strum, rest, strum)
                measures.push([
                    { positions: [], duration: "q", velocity: 0 },
                    { positions, duration: "q", velocity: 0.9 },
                    { positions: [], duration: "q", velocity: 0 },
                    { positions, duration: "q", velocity: 0.9 }
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

        // Play Guitar Sample
        if (noteData.positions && noteData.positions.length > 0) {
            // Check if it's an upstroke (even index on 8th notes usually, but we'll approximate based on velocity or random)
            const isUpstroke = noteData.velocity && noteData.velocity < 0.8;
            
            const sortedPositions = isUpstroke 
                ? [...noteData.positions].sort((a,b) => a.str - b.str) // High string to low
                : [...noteData.positions].sort((a,b) => b.str - a.str); // Low string to high

            sortedPositions.forEach((pos, index) => {
                if (pos.fret === 'x' || pos.fret === undefined) return;
                const fretNum = typeof pos.fret === 'string' ? parseInt(pos.fret, 10) : pos.fret;
                const midi = (STRING_MIDI_BASE[pos.str as keyof typeof STRING_MIDI_BASE] || 40) + fretNum;
                
                if (instrumentRef.current) {
                    const strumOffset = index * 0.015; // 15ms between strings
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
        
        const scheduleAheadTime = 0.1; // 100ms
        
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
    }, [isPlaying, style]); 

    const handlePlayStop = () => {
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900/40 p-5 rounded-2xl border border-indigo-500/20 mb-6 flex flex-col md:flex-row items-center gap-6 shadow-lg shadow-indigo-500/10 no-print">
            
            <div className="flex items-center gap-4 w-full md:w-auto">
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
                            className="w-full md:w-48 accent-indigo-400"
                        />
                        <span className="text-white font-mono font-bold w-8">{bpm}</span>
                    </div>
                </div>
            </div>

            <div className="hidden md:block w-px h-12 bg-white/10"></div>

            <div className="flex flex-col w-full md:w-auto flex-1">
                <label className="text-xs text-indigo-300 uppercase tracking-wider mb-1 font-bold flex items-center gap-2">
                    <Settings2 className="w-3 h-3" /> Rhythm Style
                </label>
                <select 
                    value={style}
                    onChange={(e) => {
                        setStyle(e.target.value);
                        if (isPlaying) {
                            setIsPlaying(false);
                            setTimeout(() => setIsPlaying(true), 50); // small delay to reset playback loop smoothly
                        }
                    }}
                    className="bg-black/40 border border-indigo-500/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-400 transition-colors cursor-pointer w-full"
                >
                    <option value="folk">Acoustic Strum (D D-U D D-U)</option>
                    <option value="quarters">Driving Quarters (D D D D)</option>
                    <option value="upbeats">Reggae / Upbeats</option>
                </select>
                <div className="mt-2 text-xs text-slate-400">
                    Looping: <strong className="text-indigo-300">{shapeData.chordProgressions || 'None'}</strong>
                </div>
            </div>
        </div>
    );
}

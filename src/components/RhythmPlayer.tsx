import { useState, useEffect, useRef } from 'react';
import { Play, Square, Repeat } from 'lucide-react';
import * as Tone from 'tone';
import Soundfont from 'soundfont-player';
import type { TabNoteData } from '../data/routines';

interface RhythmPlayerProps {
    measures: TabNoteData[][];
}

const STRING_MIDI_BASE = {
    1: 64, // E4
    2: 59, // B3
    3: 55, // G3
    4: 50, // D3
    5: 45, // A2
    6: 40  // E2
};

export default function RhythmPlayer({ measures }: RhythmPlayerProps) {
    const [bpm, setBpm] = useState(80);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const isLoopingRef = useRef(false);
    
    useEffect(() => {
        isLoopingRef.current = isLooping;
    }, [isLooping]);
    
    const nextNoteTimeRef = useRef(0);
    const currentMeasureRef = useRef(0);
    const currentNoteRef = useRef(0);
    const timerIDRef = useRef<number | null>(null);

    // Generate counting text
    const generateCounting = () => {
        let countStrs: string[] = [];
        measures.forEach(measure => {
            let currentBeat = 1;
            let measureStr = "";
            measure.forEach(note => {
                const duration = note.duration || 'q';
                let beatValue = 1;
                if (duration === '8') beatValue = 0.5;
                if (duration === '16') beatValue = 0.25;
                if (duration === 'h') beatValue = 2;
                if (duration === 'w') beatValue = 4;

                const intBeat = Math.floor(currentBeat);
                const remainder = currentBeat - intBeat;
                
                let text = "";
                if (remainder === 0) text = `${intBeat}`;
                else if (remainder === 0.5) text = "&";
                else if (remainder === 0.25) text = "e";
                else if (remainder === 0.75) text = "a";

                measureStr += text + " ";
                currentBeat += beatValue;
            });
            countStrs.push(measureStr.trim());
        });
        return countStrs.join(" | ");
    };

    const instrumentRef = useRef<any>(null);
    const clickSynthRef = useRef<Tone.Synth | null>(null);
    const lastNoteRef = useRef<{midi: number, str: number} | null>(null);

    const scheduleNote = (measureIdx: number, noteIdx: number, time: number): number => {
        const noteData = measures[measureIdx][noteIdx];
        const durationStr = noteData.duration || 'q';
        let beatValue = 1;
        if (durationStr === '8') beatValue = 0.5;
        if (durationStr === '16') beatValue = 0.25;
        if (durationStr === 'h') beatValue = 2;
        if (durationStr === 'w') beatValue = 4;
        
        const secondsPerBeat = 60.0 / bpm;
        const durationSec = beatValue * secondsPerBeat;
        const isRest = durationStr.includes('r');

        // Guitar Sample Synth
        if (instrumentRef.current && !isRest) {
            noteData.positions.forEach(pos => {
                if (pos.fret === 'x' || pos.fret === undefined) return;
                const fretNum = typeof pos.fret === 'string' ? parseInt(pos.fret, 10) : pos.fret;
                if (isNaN(fretNum)) return;
                
                const midi = (STRING_MIDI_BASE[pos.str as keyof typeof STRING_MIDI_BASE] || 40) + fretNum;
                
                let gain = 1.0;
                let attackTime = time;
                
                if (noteData.articulation === 'hammer' || noteData.articulation === 'pull') {
                    gain = 0.6; // Softer attack for legato
                }
                
                if (noteData.articulation === 'slide' && lastNoteRef.current && lastNoteRef.current.str === pos.str) {
                    // Simulate fretted slide by rapidly playing chromatic notes from last note to current note
                    const startMidi = lastNoteRef.current.midi;
                    const endMidi = midi;
                    const steps = Math.abs(endMidi - startMidi);
                    if (steps > 0 && steps < 12) {
                        const stepTime = Math.min(0.03, (durationSec * 0.5) / steps);
                        let dir = startMidi < endMidi ? 1 : -1;
                        for (let i = 1; i < steps; i++) {
                            const slideMidi = startMidi + (i * dir);
                            instrumentRef.current.play(slideMidi, time + (i * stepTime), { duration: stepTime * 1.5, gain: 0.7 });
                        }
                        attackTime = time + (steps * stepTime);
                        gain = 0.9;
                    }
                }
                
                instrumentRef.current.play(midi, attackTime, { duration: durationSec * 1.5, gain });
                lastNoteRef.current = { midi, str: pos.str };
            });
        }

        // Metronome Click Synth
        if (clickSynthRef.current) {
            clickSynthRef.current.triggerAttackRelease("C6", "32n", time, 0.5);
        }

        return durationSec;
    };

    const scheduler = () => {
        const scheduleAheadTime = 0.1; // 100ms
        
        while (nextNoteTimeRef.current < Tone.now() + scheduleAheadTime) {
            if (currentMeasureRef.current >= measures.length) {
                if (isLoopingRef.current) {
                    currentMeasureRef.current = 0;
                } else {
                    setIsPlaying(false);
                    break;
                }
            }

            const measure = measures[currentMeasureRef.current];
            const durationSec = scheduleNote(currentMeasureRef.current, currentNoteRef.current, nextNoteTimeRef.current);
            
            nextNoteTimeRef.current += (durationSec || 0);
            
            currentNoteRef.current++;
            if (currentNoteRef.current >= measure.length) {
                currentNoteRef.current = 0;
                currentMeasureRef.current++;
            }
        }
        
        if (isPlaying) {
            timerIDRef.current = requestAnimationFrame(scheduler);
        }
    };

    const loadInstrumentAndPlay = async () => {
        await Tone.start();
        
        if (!instrumentRef.current) {
            setIsLoading(true);
            try {
                // Set up Tone.js effects chain
                const dist = new Tone.Distortion(0.15); // light overdrive
                const filter = new Tone.Filter(3500, "lowpass");
                const reverb = new Tone.Reverb(2.5);
                const chorus = new Tone.Chorus(4, 2.5, 0.5);
                
                // Connect them
                const effectsChain = new Tone.Volume(-2).chain(dist, filter, chorus, reverb, Tone.Destination);
                await reverb.generate(); // Pre-calculate reverb
                
                const ac = Tone.getContext().rawContext;
                const rawGain = ac.createGain();
                Tone.connect(rawGain, effectsChain);
                
                instrumentRef.current = await Soundfont.instrument(ac as any, 'electric_guitar_clean', {
                    destination: rawGain as any
                });
                
                clickSynthRef.current = new Tone.Synth({
                    oscillator: { type: "square" },
                    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 }
                }).toDestination();
                
            } catch (error) {
                console.error("Failed to load tone.js / soundfont instruments", error);
            }
            setIsLoading(false);
        }

        // Start playback
        currentMeasureRef.current = 0;
        currentNoteRef.current = 0;
        lastNoteRef.current = null;
        nextNoteTimeRef.current = Tone.now() + 0.1;
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
            // Soundfont player doesn't have a releaseAll, so we just stop the timer
        }
        
        return () => {
            if (timerIDRef.current !== null) cancelAnimationFrame(timerIDRef.current);
        };
    }, [isPlaying]); // Re-run if isPlaying toggles

    const handlePlayStop = () => {
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="bg-black/20 p-4 rounded-xl border border-white/5 mb-6 flex flex-col sm:flex-row items-center gap-6 no-print">
            
            {/* Playback Controls */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={handlePlayStop}
                    disabled={isLoading}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all disabled:opacity-50 ${
                        isPlaying ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/50' : 'bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                    }`}
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : isPlaying ? (
                        <Square className="w-5 h-5 fill-current" />
                    ) : (
                        <Play className="w-5 h-5 fill-current ml-1" />
                    )}
                </button>
                <button 
                    onClick={() => setIsLooping(!isLooping)}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                        isLooping ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                    title="Toggle Loop"
                >
                    <Repeat className="w-4 h-4" />
                </button>

                <div className="flex flex-col">
                    <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">Tempo (BPM)</label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="range" 
                            min="40" 
                            max="200" 
                            value={bpm} 
                            onChange={(e) => setBpm(parseInt(e.target.value))}
                            className="w-32 accent-primary"
                        />
                        <span className="text-white font-mono font-bold w-8">{bpm}</span>
                    </div>
                </div>
            </div>

            {/* Rhythm Counting */}
            <div className="flex-1 bg-black/30 p-3 rounded-lg border border-white/5 overflow-x-auto">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold flex items-center gap-2">
                    Rhythm Count
                    {isLoading && <span className="text-[10px] text-primary bg-primary/20 px-2 py-0.5 rounded-full">Downloading Samples...</span>}
                </p>
                <p className="text-primary font-mono text-sm whitespace-nowrap">
                    {generateCounting()}
                </p>
            </div>
        </div>
    );
}

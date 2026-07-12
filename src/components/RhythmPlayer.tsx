import { useState, useEffect, useRef } from 'react';
import { Play, Square } from 'lucide-react';
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
    const audioCtxRef = useRef<AudioContext | null>(null);
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

        // Guitar Synth
        noteData.positions.forEach(pos => {
            if (pos.fret === 'x' || pos.fret === undefined) return;
            const fretNum = typeof pos.fret === 'string' ? parseInt(pos.fret, 10) : pos.fret;
            const midi = (STRING_MIDI_BASE[pos.str as keyof typeof STRING_MIDI_BASE] || 40) + fretNum;
            const freq = 440 * Math.pow(2, (midi - 69) / 12);
            
            const osc = audioCtxRef.current!.createOscillator();
            const gain = audioCtxRef.current!.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            // Envelope
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.5, time + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, time + durationSec - 0.01);
            
            osc.connect(gain);
            gain.connect(audioCtxRef.current!.destination);
            
            osc.start(time);
            osc.stop(time + durationSec);
        });

        // Metronome Click Synth
        const clickOsc = audioCtxRef.current.createOscillator();
        const clickGain = audioCtxRef.current.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.value = 800; // high pitch tick
        clickGain.gain.setValueAtTime(0, time);
        clickGain.gain.linearRampToValueAtTime(0.1, time + 0.001);
        clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        clickOsc.connect(clickGain);
        clickGain.connect(audioCtxRef.current.destination);
        clickOsc.start(time);
        clickOsc.stop(time + 0.05);

        return durationSec;
    };

    const scheduler = () => {
        if (!audioCtxRef.current) return;
        
        const scheduleAheadTime = 0.1; // 100ms
        
        while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
            if (currentMeasureRef.current >= measures.length) {
                // Done playing
                setIsPlaying(false);
                break;
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

    useEffect(() => {
        if (isPlaying) {
            if (!audioCtxRef.current) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                audioCtxRef.current = new AudioContext();
            }
            if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }
            
            currentMeasureRef.current = 0;
            currentNoteRef.current = 0;
            nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.1;
            
            timerIDRef.current = requestAnimationFrame(scheduler);
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
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                        isPlaying ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/50' : 'bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                    }`}
                >
                    {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
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
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">Rhythm Count</p>
                <p className="text-primary font-mono text-sm whitespace-nowrap">
                    {generateCounting()}
                </p>
            </div>
        </div>
    );
}

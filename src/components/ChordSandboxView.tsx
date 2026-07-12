import { useState, useRef, useEffect } from 'react';
import { Play, Square, Settings2, Trash2, Download, Upload } from 'lucide-react';
import Soundfont from 'soundfont-player';
import { Midi } from '@tonejs/midi';
// @ts-ignore
import MidiWriter from 'midi-writer-js';
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
    const [style, setStyle] = useState('folk'); // 'folk' | 'rock' | 'waltz' | 'arpeggio' | 'funk' | 'custom'
    const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    // Tap recorder state
    const [customRhythm, setCustomRhythm] = useState<number[]>([]);
    const [isTapping, setIsTapping] = useState(false);
    const lastTapTimeRef = useRef(0);
    const tempRhythmRef = useRef<number[]>([]);

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

    const handleDragStart = (idx: number) => {
        setDraggedIdx(idx);
    };

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault(); // Necessary to allow dropping
        if (draggedIdx === null || draggedIdx === idx) return;
        
        const newProg = [...progression];
        const item = newProg.splice(draggedIdx, 1)[0];
        newProg.splice(idx, 0, item);
        setProgression(newProg);
        setDraggedIdx(idx);
    };

    const handleDrop = () => {
        setDraggedIdx(null);
    };

    const startTapping = () => {
        setIsTapping(true);
        tempRhythmRef.current = [];
        lastTapTimeRef.current = performance.now();
    };

    const handleTap = () => {
        if (!isTapping) return;
        const now = performance.now();
        const duration = (now - lastTapTimeRef.current) / 1000.0; // in seconds
        
        // Discard the very first tap duration since it's just the start point
        if (tempRhythmRef.current.length === 0 && duration > 5) {
            // Ignore if it's been a long time since hitting 'Start'
            lastTapTimeRef.current = now;
            return;
        }

        tempRhythmRef.current.push(duration);
        lastTapTimeRef.current = now;
    };

    const finishTapping = () => {
        setIsTapping(false);
        // We add the final duration from the last tap to the finish
        const now = performance.now();
        const duration = (now - lastTapTimeRef.current) / 1000.0;
        if (duration < 5) {
            tempRhythmRef.current.push(duration);
        }
        
        if (tempRhythmRef.current.length > 0) {
            // Remove the first ridiculously long duration if the user waited before tapping
            if (tempRhythmRef.current[0] > 5) {
                tempRhythmRef.current.shift();
            }
            setCustomRhythm([...tempRhythmRef.current]);
            setStyle('custom');
        }
    };

    const handleImportMIDI = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const midi = new Midi(arrayBuffer);
            
            let maxNotes = 0;
            let mainTrack = midi.tracks[0];
            midi.tracks.forEach(t => {
                if (t.notes.length > maxNotes) {
                    maxNotes = t.notes.length;
                    mainTrack = t;
                }
            });

            if (mainTrack && mainTrack.notes.length > 0) {
                const newRhythm: number[] = [];
                for (let i = 0; i < mainTrack.notes.length - 1; i++) {
                    const currentNote = mainTrack.notes[i];
                    const nextNote = mainTrack.notes[i+1];
                    const diff = nextNote.time - currentNote.time;
                    if (diff > 0.01) { // filter out simultaneous chord notes
                        newRhythm.push(diff);
                    }
                }
                newRhythm.push(mainTrack.notes[mainTrack.notes.length - 1].duration);
                
                if (newRhythm.length > 0) {
                    setCustomRhythm(newRhythm);
                    setStyle('custom');
                }
            }
        } catch (err) {
            console.error("Failed to parse MIDI file:", err);
        }
    };

    const handleExportMIDI = () => {
        if (customRhythm.length === 0) return;
        
        const track = new MidiWriter.Track();
        track.addEvent(new MidiWriter.ProgramChangeEvent({instrument: 25})); // Acoustic Guitar

        customRhythm.forEach((durInSeconds) => {
            const beats = durInSeconds / (60.0 / bpm);
            const ticks = beats * 128; // midi-writer-js default ticks per beat
            
            const note = new MidiWriter.NoteEvent({
                pitch: ['C4'], // Placeholder note for rhythm
                duration: `T${Math.round(ticks)}`,
                velocity: 100
            });
            track.addEvent(note);
        });

        const writer = new MidiWriter.Writer(track);
        const dataUri = writer.dataUri();
        
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = 'custom_rhythm.mid';
        link.click();
    };

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
            } else if (style === 'rock') {
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
            } else if (style === 'waltz') {
                if (currentNoteRef.current === 0) {
                    instrumentRef.current?.play(midiNotes[0].toString(), nextNoteTimeRef.current, { duration: secondsPerBeat, gain: 0.9 });
                    nextNoteTimeRef.current += secondsPerBeat;
                    currentNoteRef.current = 1;
                } else if (currentNoteRef.current === 1) {
                    midiNotes.slice(1).forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: secondsPerBeat, gain: 0.7 }));
                    nextNoteTimeRef.current += secondsPerBeat;
                    currentNoteRef.current = 2;
                } else if (currentNoteRef.current === 2) {
                    midiNotes.slice(1).forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: secondsPerBeat, gain: 0.6 }));
                    nextNoteTimeRef.current += secondsPerBeat;
                    currentNoteRef.current = 0;
                    currentMeasureRef.current++;
                }
            } else if (style === 'arpeggio') {
                // Fixed 8-note sequence (4 beats of 8th notes)
                const arpNotes = [midiNotes[0], midiNotes[1], midiNotes[2], midiNotes[3] || midiNotes[2], midiNotes[2], midiNotes[1], midiNotes[0], midiNotes[1]];
                if (currentNoteRef.current < 8) {
                    instrumentRef.current?.play(arpNotes[currentNoteRef.current].toString(), nextNoteTimeRef.current, { duration: secondsPerBeat, gain: 0.8 });
                    nextNoteTimeRef.current += secondsPerBeat / 2; // 8th notes
                    currentNoteRef.current++;
                } else {
                    currentNoteRef.current = 0;
                    // Note: currentMeasureRef is incremented below based on time, wait no, we must increment it here
                    // Actually, if we increment here we need to continue the loop without playing a note, which is fine
                    currentMeasureRef.current++;
                }
            } else if (style === 'funk') {
                const sixteenth = secondsPerBeat / 4;
                if (currentNoteRef.current === 0) {
                    midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.01), { duration: sixteenth, gain: 0.9 }));
                    nextNoteTimeRef.current += sixteenth * 3; // wait 3 16ths
                    currentNoteRef.current = 1;
                } else if (currentNoteRef.current === 1) {
                    [...midiNotes].reverse().forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.01), { duration: sixteenth, gain: 0.7 }));
                    nextNoteTimeRef.current += sixteenth * 5; // skip beat 2 downbeat
                    currentNoteRef.current = 2;
                } else if (currentNoteRef.current === 2) {
                    midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.01), { duration: sixteenth * 2, gain: 0.8 }));
                    nextNoteTimeRef.current += sixteenth * 8; // finish measure
                    currentNoteRef.current = 0;
                    currentMeasureRef.current++;
                }
            } else if (style === 'custom') {
                if (customRhythm.length === 0) {
                    // Fallback to single strum if empty
                    midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: secondsPerBeat, gain: 0.8 }));
                    nextNoteTimeRef.current += secondsPerBeat * 4;
                    currentNoteRef.current = 0;
                    currentMeasureRef.current++;
                } else {
                    const dur = customRhythm[currentNoteRef.current];
                    
                    // Add some variance based on index for a realistic strum
                    if (currentNoteRef.current % 2 === 0) {
                        midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: dur, gain: 0.8 }));
                    } else {
                        [...midiNotes].reverse().forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: dur, gain: 0.6 }));
                    }
                    
                    nextNoteTimeRef.current += dur;
                    currentNoteRef.current++;
                    
                    if (currentNoteRef.current >= customRhythm.length) {
                        currentNoteRef.current = 0;
                        currentMeasureRef.current++;
                    }
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
            <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/5 border border-white/10 rounded-2xl p-6">
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
            <div className="print:hidden bg-black/20 border border-white/5 p-6 rounded-2xl">
                <h3 className="text-primary font-bold uppercase tracking-wider text-sm mb-6">Diatonic Chords (Click to Play/Add)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {chords.map((chord, idx) => (
                        <div 
                            key={idx}
                            onClick={() => {
                                playChordOnce(chord);
                                setProgression([...progression, chord]);
                            }}
                            className="bg-white/5 hover:bg-primary/20 hover:border-primary/50 border border-white/10 rounded-xl p-4 cursor-pointer transition-all group"
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
            <div className="print:hidden bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 p-6 rounded-2xl min-h-[250px] flex flex-col">
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
                            <option value="waltz">Waltz (3/4)</option>
                            <option value="arpeggio">Arpeggio (8ths)</option>
                            <option value="funk">Funk (16ths)</option>
                            <option value="custom">Custom Tapped</option>
                        </select>
                        
                        {style === 'custom' && (
                            <div className="flex items-center gap-2 border-l border-white/10 pl-4 ml-2">
                                {isTapping ? (
                                    <>
                                        <button 
                                            onClick={handleTap}
                                            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all active:scale-95"
                                        >
                                            TAP!
                                        </button>
                                        <button 
                                            onClick={finishTapping}
                                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-all"
                                        >
                                            Done
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            onClick={startTapping}
                                            className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-sm transition-all"
                                        >
                                            Record Tap
                                        </button>
                                        <div className="flex items-center gap-1 border-l border-white/10 pl-2 ml-1">
                                            <label 
                                                htmlFor="midi-upload"
                                                className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg cursor-pointer transition-colors"
                                                title="Import MIDI File"
                                            >
                                                <Upload className="w-4 h-4" />
                                            </label>
                                            <input 
                                                id="midi-upload" 
                                                type="file" 
                                                accept=".mid,.midi" 
                                                onChange={handleImportMIDI} 
                                                className="hidden" 
                                            />
                                            {customRhythm.length > 0 && (
                                                <button 
                                                    onClick={handleExportMIDI}
                                                    className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg cursor-pointer transition-colors"
                                                    title="Export MIDI File"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                                {customRhythm.length > 0 && !isTapping && (
                                    <span className="text-xs text-emerald-400 font-mono ml-2">({customRhythm.length} beats)</span>
                                )}
                            </div>
                        )}
                        
                        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 ml-2">
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
                                draggable
                                onDragStart={() => handleDragStart(idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDrop={handleDrop}
                                className={`relative bg-black/40 border p-4 rounded-xl flex items-center gap-4 cursor-grab active:cursor-grabbing transition-colors ${
                                    currentPlayIndex === idx 
                                        ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                                        : draggedIdx === idx ? 'border-primary opacity-50' : 'border-white/10'
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
            {/* Print View for Progression */}
            <div className="hidden print:block mt-12 bg-white">
                <h2 className="text-3xl font-bold text-black border-b-2 border-black pb-4 mb-8">Custom Progression</h2>
                {progression.length === 0 ? (
                    <p className="text-gray-500 italic">No chords added to progression yet.</p>
                ) : (
                    <div className="grid grid-cols-4 gap-6">
                        {progression.map((chord, idx) => (
                            <div key={idx} className="border-2 border-gray-300 p-4 rounded-xl flex flex-col items-center justify-center break-inside-avoid">
                                <p className="text-2xl font-bold text-black mb-1">{chord.name}</p>
                                <p className="text-lg text-gray-600 font-mono mb-4">{chord.numeral}</p>
                                <div className="transform scale-90">
                                    <ChordDiagram chord={{...chord, name: ''}} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

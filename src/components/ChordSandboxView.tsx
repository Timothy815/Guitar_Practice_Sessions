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

    const isSpaceDownRef = useRef(false);

    const handleDown = () => {
        if (!isTapping || isSpaceDownRef.current) return;
        isSpaceDownRef.current = true;
        const now = performance.now();
        
        // Play audio feedback for the tap
        if (progression.length > 0) {
            playChordOnce(progression[0]);
        }
        
        if (lastTapTimeRef.current === 0) {
            lastTapTimeRef.current = now;
            return;
        }

        const restDur = (now - lastTapTimeRef.current) / 1000.0; // in seconds
        if (restDur > 0.01) {
            tempRhythmRef.current.push(-restDur); // negative for rest
        }
        lastTapTimeRef.current = now;
    };

    const handleUp = () => {
        if (!isTapping || !isSpaceDownRef.current) return;
        isSpaceDownRef.current = false;
        const now = performance.now();
        
        // Stop audio feedback to simulate mute
        if (instrumentRef.current) {
            instrumentRef.current.stop();
        }
        
        if (lastTapTimeRef.current !== 0) {
            const soundDur = (now - lastTapTimeRef.current) / 1000.0;
            if (soundDur > 0.01) {
                tempRhythmRef.current.push(soundDur); // positive for sound
            }
            lastTapTimeRef.current = now;
        }
    };

    const startTapping = () => {
        setIsTapping(true);
        tempRhythmRef.current = [];
        lastTapTimeRef.current = 0; // 0 means waiting for first tap
        isSpaceDownRef.current = false;
    };

    const finishTapping = () => {
        setIsTapping(false);
        
        if (isSpaceDownRef.current) {
            handleUp();
        }

        if (tempRhythmRef.current.length > 0) {
            // Find the last rest to duplicate, to round out the measure cleanly
            let lastRest = 0;
            for (let i = tempRhythmRef.current.length - 1; i >= 0; i--) {
                if (tempRhythmRef.current[i] < 0) {
                    lastRest = tempRhythmRef.current[i];
                    break;
                }
            }
            if (lastRest < 0) {
                tempRhythmRef.current.push(lastRest);
            } else if (tempRhythmRef.current.length > 0 && tempRhythmRef.current[tempRhythmRef.current.length - 1] > 0) {
                // If they never rested, duplicate the last sound duration as a rest to give some loop padding
                tempRhythmRef.current.push(-tempRhythmRef.current[tempRhythmRef.current.length - 1]);
            }
            
            setCustomRhythm([...tempRhythmRef.current]);
            setStyle('custom');
        }
    };

    // Spacebar listener for tapping
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isTapping && e.code === 'Space') {
                e.preventDefault();
                handleDown();
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (isTapping && e.code === 'Space') {
                e.preventDefault();
                handleUp();
            }
        };

        if (isTapping) {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isTapping]);

    // (Omitted unchanged code replaced above)

    function getChordPitchClasses(frets: (number | 'x')[]): Set<number> {
        const STRING_PITCHES = [4, 9, 2, 7, 11, 4]; // E, A, D, G, B, E in chromatic indices (0=C, 1=C#, etc)
        const pitches = new Set<number>();
        frets.forEach((f, i) => {
            if (f !== 'x') {
                pitches.add((STRING_PITCHES[i] + (f as number)) % 12);
            }
        });
        return pitches;
    }

    const handleImportMIDI = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const midi = new Midi(arrayBuffer);
            
            // Extract BPM if available
            let importedBpm = bpm;
            if (midi.header && midi.header.tempos.length > 0) {
                importedBpm = Math.round(midi.header.tempos[0].bpm);
                setBpm(importedBpm);
            }
            
            let maxNotes = 0;
            let mainTrack = midi.tracks[0];
            midi.tracks.forEach(t => {
                if (t.notes.length > maxNotes) {
                    maxNotes = t.notes.length;
                    mainTrack = t;
                }
            });

            if (mainTrack && mainTrack.notes.length > 0) {
                // Group notes by time (within 50ms) to detect chords
                const events: { time: number, duration: number, pitchClasses: Set<number> }[] = [];
                
                mainTrack.notes.forEach(note => {
                    const pc = note.midi % 12;
                    let added = false;
                    for (let i = events.length - 1; i >= 0; i--) {
                        if (Math.abs(events[i].time - note.time) < 0.05) {
                            events[i].pitchClasses.add(pc);
                            events[i].duration = Math.max(events[i].duration, note.duration);
                            added = true;
                            break;
                        }
                    }
                    if (!added) {
                        events.push({ time: note.time, duration: note.duration, pitchClasses: new Set([pc]) });
                    }
                });

                events.sort((a, b) => a.time - b.time);

                const diatonicChords = getAllDiatonicChords(keyName, quality, family);
                const chordMatchCache = diatonicChords.map(c => ({
                    chord: c,
                    pitchClasses: getChordPitchClasses(c.frets)
                }));

                const newProgression: any[] = [];
                const newRhythm: number[] = [];
                let lastTime = 0;
                let matchesFound = 0;

                events.forEach(ev => {
                    const restDur = ev.time - lastTime;
                    if (restDur > 0.05) {
                        newRhythm.push(-restDur); // rest
                    }
                    newRhythm.push(ev.duration); // sounding
                    lastTime = ev.time + ev.duration;

                    let bestMatch = null;
                    let bestScore = -1;

                    for (const { chord, pitchClasses } of chordMatchCache) {
                        let match = true;
                        ev.pitchClasses.forEach(pc => {
                            if (!pitchClasses.has(pc)) match = false;
                        });
                        if (match) {
                            const score = ev.pitchClasses.size / pitchClasses.size;
                            if (score > bestScore) {
                                bestScore = score;
                                bestMatch = chord;
                            }
                        }
                    }
                    
                    if (bestMatch) {
                        newProgression.push(bestMatch);
                        matchesFound++;
                    }
                });
                
                if (newRhythm.length > 0) {
                    setCustomRhythm(newRhythm);
                    setStyle('custom');
                    
                    if (matchesFound > 0) {
                        setProgression(newProgression);
                        alert(`Successfully imported rhythm track with ${mainTrack.notes.length} notes at ${importedBpm} BPM, and mapped ${matchesFound} chord(s) to the progression!`);
                    } else {
                        alert(`Successfully imported rhythm track with ${mainTrack.notes.length} notes at ${importedBpm} BPM. (No matching chords found in the key of ${keyName} ${quality})`);
                    }
                }
            } else {
                alert("No notes found in the MIDI file.");
            }
        } catch (err) {
            console.error("Failed to parse MIDI file:", err);
            alert("Failed to parse MIDI file. Ensure it is a valid .mid file.");
        }
    };

    const handleExportMIDI = () => {
        if (customRhythm.length === 0) return;
        
        const track = new MidiWriter.Track();
        track.addEvent(new MidiWriter.ProgramChangeEvent({instrument: 25})); // Acoustic Guitar

        let accumulatedWait = 0;
        customRhythm.forEach((val) => {
            if (val > 0) {
                const durInSeconds = val;
                const beats = durInSeconds / (60.0 / bpm);
                const ticks = beats * 128;
                
                const note = new MidiWriter.NoteEvent({
                    pitch: ['C4'],
                    duration: `T${Math.max(1, Math.round(ticks))}`,
                    wait: accumulatedWait > 0 ? `T${Math.round(accumulatedWait)}` : '0',
                    velocity: 100
                });
                track.addEvent(note);
                accumulatedWait = 0;
            } else {
                const restInSeconds = Math.abs(val);
                const beats = restInSeconds / (60.0 / bpm);
                accumulatedWait += beats * 128;
            }
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
            instrumentRef.current?.play(midi.toString(), t + (i * 0.03), { duration: 8, gain: 0.8 });
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
                    midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: secondsPerBeat * 2, gain: 0.8 }));
                    nextNoteTimeRef.current += secondsPerBeat * 2;
                    currentNoteRef.current = 1;
                } else if (currentNoteRef.current === 1) {
                    midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: secondsPerBeat, gain: 0.7 }));
                    nextNoteTimeRef.current += secondsPerBeat;
                    currentNoteRef.current = 2;
                } else if (currentNoteRef.current === 2) {
                    [...midiNotes].reverse().forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: secondsPerBeat, gain: 0.6 }));
                    nextNoteTimeRef.current += secondsPerBeat;
                    currentNoteRef.current = 0;
                    currentMeasureRef.current++;
                }
            } else if (style === 'rock') {
                if (currentNoteRef.current === 0) {
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
                const arpNotes = [midiNotes[0], midiNotes[1], midiNotes[2], midiNotes[3] || midiNotes[2], midiNotes[2], midiNotes[1], midiNotes[0], midiNotes[1]];
                if (currentNoteRef.current < 8) {
                    instrumentRef.current?.play(arpNotes[currentNoteRef.current].toString(), nextNoteTimeRef.current, { duration: secondsPerBeat, gain: 0.8 });
                    nextNoteTimeRef.current += secondsPerBeat / 2;
                    currentNoteRef.current++;
                } else {
                    currentNoteRef.current = 0;
                    currentMeasureRef.current++;
                }
            } else if (style === 'funk') {
                const sixteenth = secondsPerBeat / 4;
                if (currentNoteRef.current === 0) {
                    midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.01), { duration: sixteenth, gain: 0.9 }));
                    nextNoteTimeRef.current += sixteenth * 3;
                    currentNoteRef.current = 1;
                } else if (currentNoteRef.current === 1) {
                    [...midiNotes].reverse().forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.01), { duration: sixteenth, gain: 0.7 }));
                    nextNoteTimeRef.current += sixteenth * 5;
                    currentNoteRef.current = 2;
                } else if (currentNoteRef.current === 2) {
                    midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.01), { duration: sixteenth * 2, gain: 0.8 }));
                    nextNoteTimeRef.current += sixteenth * 8;
                    currentNoteRef.current = 0;
                    currentMeasureRef.current++;
                }
            } else if (style === 'custom') {
                if (customRhythm.length === 0) {
                    midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: secondsPerBeat, gain: 0.8 }));
                    nextNoteTimeRef.current += secondsPerBeat * 4;
                    currentNoteRef.current = 0;
                    currentMeasureRef.current++;
                } else {
                    const val = customRhythm[currentNoteRef.current];
                    
                    if (val > 0) {
                        // Sounding note
                        if (currentNoteRef.current % 2 === 0) {
                            midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: val, gain: 0.8 }));
                        } else {
                            [...midiNotes].reverse().forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: val, gain: 0.6 }));
                        }
                        nextNoteTimeRef.current += val;
                    } else {
                        // Rest
                        nextNoteTimeRef.current += Math.abs(val);
                    }
                    
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
                            <option value="custom">Custom</option>
                        </select>
                        
                        {style === 'custom' && (
                            <div className="flex items-center gap-2 border-l border-white/10 pl-4 ml-2">
                                {isTapping ? (
                                    <>
                                        <button 
                                            onMouseDown={handleDown}
                                            onMouseUp={handleUp}
                                            onMouseLeave={handleUp}
                                            onTouchStart={handleDown}
                                            onTouchEnd={handleUp}
                                            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95 active:bg-indigo-600 select-none"
                                        >
                                            TAP (Hold & Release)
                                        </button>
                                        <button 
                                            onClick={finishTapping}
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg transition-all"
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
                            onClick={() => {
                                if (progression.length === 0) return;
                                const payload = {
                                    id: `custom_jam_${Date.now()}`,
                                    name: `${keyName} ${quality} Custom Jam`,
                                    chords: progression.map(c => ({ numeral: c.numeral, offset: c.offset, q: c.quality })),
                                    rhythm: style === 'custom' ? customRhythm : undefined,
                                    bpm: bpm,
                                    style: style
                                };
                                const existing = JSON.parse(localStorage.getItem('fretfocus_custom_jams') || '[]');
                                existing.push(payload);
                                localStorage.setItem('fretfocus_custom_jams', JSON.stringify(existing));
                                
                                if (style === 'custom' && customRhythm.length > 0) {
                                    localStorage.setItem('fretfocus_active_rhythm', JSON.stringify({ rhythm: customRhythm, bpm: bpm }));
                                }
                                
                                alert('Saved! You can now use this in Jam Tracks and Rhythm exercises.');
                            }}
                            disabled={progression.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-fuchsia-500/20 hover:bg-fuchsia-500/40 text-fuchsia-300 border border-fuchsia-500/30 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                        >
                            Save to Jam Tracks
                        </button>

                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            disabled={progression.length === 0 || isLoading}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ml-2 ${
                                isPlaying 
                                    ? 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                                    : 'bg-primary hover:bg-primary/90 text-black shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                            {isLoading ? 'Loading...' : isPlaying ? 'Stop' : 'Play'}
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

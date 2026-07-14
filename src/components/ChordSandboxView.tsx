import { useState, useRef, useEffect } from 'react';
import { Play, Square, Trash2, Download, Upload, Edit2, X } from 'lucide-react';
import Soundfont from 'soundfont-player';
import { Midi } from '@tonejs/midi';
// @ts-ignore
import MidiWriter from 'midi-writer-js';
import { getAllDiatonicChords } from '../data/musicEngine';
import type { ScaleFamily, ScaleQuality } from '../data/musicEngine';
import ChordDiagram from './ChordDiagram';
import VexFlowTab from './VexFlowTab';
import type { TabNoteData } from '../data/routines';

interface ChordSandboxViewProps {
    keyName: string;
    quality: ScaleQuality;
    family: ScaleFamily;
    
}

const ROOT_MIDI: Record<string, number> = {
    'E': 40, 'F': 41, 'F#': 42, 'G': 43, 'G#': 44, 'A': 45, 
    'Bb': 46, 'B': 47, 'C': 48, 'C#': 49, 'D': 50, 'Eb': 51
};


const STRING_MIDI_BASE = {
    6: 40, // E2
    5: 45, // A2
    4: 50, // D3
    3: 55, // G3
    2: 59, // B3
    1: 64  // E4
};

export default function ChordSandboxView({ keyName, quality, family }: ChordSandboxViewProps) {
    interface ProgressionItem {
        id: string;
        chord: any;
        rhythm?: number[];
        playbackStyle?: string;
        arpeggioPattern?: number[][] | number[];
    }
    
    const [progression, setProgression] = useState<ProgressionItem[]>([]);
    const [selectedProgIndex, setSelectedProgIndex] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [bpm, setBpm] = useState(90);
    const [style, setStyle] = useState('folk'); // 'folk' | 'rock' | 'waltz' | 'arpeggio' | 'funk' | 'custom'
    const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    const [editingChordIndex, setEditingChordIndex] = useState<number | null>(null);

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
            const idx = selectedProgIndex !== null ? selectedProgIndex : 0;
            playChordOnce(progression[idx].chord);
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
                tempRhythmRef.current.push(-tempRhythmRef.current[tempRhythmRef.current.length - 1]);
            }
            
            if (selectedProgIndex !== null) {
                setProgression(prev => {
                    const newProg = [...prev];
                    newProg[selectedProgIndex] = {
                        ...newProg[selectedProgIndex],
                        rhythm: [...tempRhythmRef.current]
                    };
                    return newProg;
                });
            } else {
                setCustomRhythm([...tempRhythmRef.current]);
            }
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

                const newProgression: ProgressionItem[] = [];
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
                        newProgression.push({ id: Math.random().toString(), chord: bestMatch });
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

        const midiNotes = getChordMidi(chord.frets);
        const t = audioCtxRef.current.currentTime;
        
        midiNotes.forEach((midi, i) => {
            if (midi !== undefined) instrumentRef.current?.play(midi.toString(), t + (i * 0.03), { duration: 8, gain: 0.8 });
        });
    };

    const getChordMidi = (frets: (number | 'x')[]): number[] => {
        const TUNING = [40, 45, 50, 55, 59, 64]; // E A D G B e
        const midiNotes: number[] = [];
        frets.forEach((fret, i) => {
            if (fret !== 'x') {
                midiNotes.push(TUNING[i] + (fret as number));
            }
        });
        return midiNotes;
    };

    const analyzeVoicing = (midiNotes: number[], rootName: string): string => {
        if (midiNotes.length === 0) return "Muted";
        const rootStr = rootName.replace(/m|dim|°/g, '').trim();
        const rootPc = ROOT_MIDI[rootStr] % 12;
        if (isNaN(rootPc)) return "";
        const pcs = new Set(midiNotes.map(m => m % 12));
        
        const hasRoot = pcs.has(rootPc);
        const hasMin3 = pcs.has((rootPc + 3) % 12);
        const hasMaj3 = pcs.has((rootPc + 4) % 12);
        const has3rd = hasMin3 || hasMaj3;
        const hasFlat5 = pcs.has((rootPc + 6) % 12);
        const has5th = pcs.has((rootPc + 7) % 12);
        const hasMin7 = pcs.has((rootPc + 10) % 12);
        const hasMaj7 = pcs.has((rootPc + 11) % 12);
        const has7th = hasMin7 || hasMaj7;

        if (!hasRoot) return "rootless";
        if (!has3rd && (has5th || hasFlat5) && !has7th) return "power chord (5)";
        if (has3rd && !has5th && has7th) return "shell voicing";
        if (has3rd && !has5th && !has7th) return "no 5";
        if (has3rd && (has5th || hasFlat5) && !has7th && midiNotes.length <= 4) return "triad";
        
        return "";
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

            const item = progression[currentMeasureRef.current];
            const chord = item.chord;
            const midiNotes = getChordMidi(chord.frets);
            
            const secondsPerBeat = 60.0 / bpm;
            const chordStyleOverride = item.playbackStyle;
            const isGlobalCustom = style === 'custom';
            
            let activeRhythm = item.rhythm;
            if (!chordStyleOverride && isGlobalCustom) {
                activeRhythm = activeRhythm || customRhythm;
            } else if (chordStyleOverride === 'custom_override') {
                activeRhythm = activeRhythm || customRhythm;
            }
            
            if (activeRhythm) {
                if (activeRhythm.length === 0) {
                    midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: secondsPerBeat, gain: 0.8 }));
                    nextNoteTimeRef.current += secondsPerBeat * 4;
                    currentNoteRef.current = 0;
                    currentMeasureRef.current++;
                } else {
                    const val = activeRhythm[currentNoteRef.current];
                    
                    if (val > 0) {
                        // Sounding note
                        let customArpStep: number[] | null = null;
                        if (item.arpeggioPattern && item.arpeggioPattern.length > 0) {
                            let rawPattern = item.arpeggioPattern;
                            if (typeof rawPattern[0] === 'number') {
                                rawPattern = (rawPattern as any[]).map(v => v === -1 ? [] : [v]);
                            }
                            const pattern = rawPattern as number[][];
                            const arpStepCol = pattern[currentNoteRef.current % pattern.length];
                            if (arpStepCol) {
                                customArpStep = arpStepCol.map(idx => {
                                    const fretVal = chord.frets[idx];
                                    if (fretVal === 'x' || fretVal === undefined) return null;
                                    const strNum = 6 - idx;
                                    return (STRING_MIDI_BASE[strNum as keyof typeof STRING_MIDI_BASE] || 40) + (typeof fretVal === 'string' ? parseInt(fretVal) : fretVal);
                                }).filter(m => m !== null) as number[];
                            }
                        }

                        if (customArpStep && customArpStep.length > 0) {
                            customArpStep.forEach(m => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current, { duration: val, gain: 0.8 }));
                        } else if (!customArpStep) {
                            if (currentNoteRef.current % 2 === 0) {
                                midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: val, gain: 0.8 }));
                            } else {
                                [...midiNotes].reverse().forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: val, gain: 0.6 }));
                            }
                        }
                        nextNoteTimeRef.current += val;
                    } else {
                        // Rest
                        nextNoteTimeRef.current += Math.abs(val);
                    }
                    
                    currentNoteRef.current++;
                    
                    if (currentNoteRef.current >= activeRhythm.length) {
                        currentNoteRef.current = 0;
                        currentMeasureRef.current++;
                    }
                }
            } else {
                const activeStyle = item.playbackStyle || style;
                if (activeStyle === 'folk') {
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
                } else if (activeStyle === 'rock') {
                    if (currentNoteRef.current === 0) {
                        if (midiNotes[0] !== undefined) instrumentRef.current?.play(midiNotes[0].toString(), nextNoteTimeRef.current, { duration: secondsPerBeat, gain: 0.9 });
                        if (midiNotes[1] !== undefined) instrumentRef.current?.play(midiNotes[1].toString(), nextNoteTimeRef.current, { duration: secondsPerBeat, gain: 0.9 });
                        nextNoteTimeRef.current += secondsPerBeat;
                        currentNoteRef.current = 1;
                    } else if (currentNoteRef.current === 1) {
                        if (midiNotes[0] !== undefined) instrumentRef.current?.play(midiNotes[0].toString(), nextNoteTimeRef.current, { duration: secondsPerBeat, gain: 0.6 });
                        if (midiNotes[1] !== undefined) instrumentRef.current?.play(midiNotes[1].toString(), nextNoteTimeRef.current, { duration: secondsPerBeat, gain: 0.6 });
                        nextNoteTimeRef.current += secondsPerBeat;
                        currentNoteRef.current = 2;
                    } else if (currentNoteRef.current === 2) {
                        midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.01), { duration: secondsPerBeat * 2, gain: 0.8 }));
                        nextNoteTimeRef.current += secondsPerBeat * 2;
                        currentNoteRef.current = 0;
                        currentMeasureRef.current++;
                    }
                } else if (activeStyle === 'waltz') {
                    if (currentNoteRef.current === 0) {
                        if (midiNotes[0] !== undefined) instrumentRef.current?.play(midiNotes[0].toString(), nextNoteTimeRef.current, { duration: secondsPerBeat, gain: 0.9 });
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
                } else if (activeStyle === 'arpeggio') {
                    let arpNotes = [midiNotes[0], midiNotes[1], midiNotes[2], midiNotes[3] || midiNotes[2], midiNotes[2], midiNotes[1], midiNotes[0], midiNotes[1]];
                    if (item.arpeggioPattern && item.arpeggioPattern.length > 0) {
                        let rawPattern = item.arpeggioPattern;
                        if (typeof rawPattern[0] === 'number') {
                            rawPattern = (rawPattern as any[]).map(val => val === -1 ? [] : [val]);
                        }
                        const pattern = rawPattern as number[][];
                        
                        arpNotes = pattern.map(col => {
                            if (col.length === 0) return undefined as any;
                            // Play all selected strings at this step as a chord
                            const validMidis = col.map(idx => {
                                const fretVal = chord.frets[idx];
                                if (fretVal === 'x' || fretVal === undefined) return null;
                                const strNum = 6 - idx;
                                return (STRING_MIDI_BASE[strNum as keyof typeof STRING_MIDI_BASE] || 40) + (typeof fretVal === 'string' ? parseInt(fretVal) : fretVal);
                            }).filter(m => m !== null) as number[];
                            
                            if (validMidis.length === 0) return undefined as any;
                            // For backward compatibility of arpNotes being number[], we could return array but TS says number. Wait! `arpNotes` is used with `instrumentRef.current?.play` which can take a single note or an array of notes!
                            // So let's make arpNotes an array of arrays or numbers. Actually, soundfont `.play` might only take single string or number. Let's check below.
                            return validMidis as any;
                        });
                    }
                    
                    if (currentNoteRef.current < arpNotes.length) {
                        const currentStep = arpNotes[currentNoteRef.current];
                        if (currentStep !== undefined) {
                            if (Array.isArray(currentStep)) {
                                currentStep.forEach(m => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current, { duration: secondsPerBeat, gain: 0.8 }));
                            } else {
                                instrumentRef.current?.play(currentStep.toString(), nextNoteTimeRef.current, { duration: secondsPerBeat, gain: 0.8 });
                            }
                        }
                        nextNoteTimeRef.current += secondsPerBeat / 2;
                        currentNoteRef.current++;
                    } else {
                        currentNoteRef.current = 0;
                        currentMeasureRef.current++;
                    }
                } else if (activeStyle === 'funk') {
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
                } else {
                    if (currentNoteRef.current === 0) {
                        midiNotes.forEach((m, i) => instrumentRef.current?.play(m.toString(), nextNoteTimeRef.current + (i * 0.02), { duration: secondsPerBeat * 4, gain: 0.8 }));
                        nextNoteTimeRef.current += secondsPerBeat * 4;
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

    const generateVexFlowMeasures = (): TabNoteData[][] => {
        return progression.map(item => {
            const itemStyle = item.playbackStyle || (item.rhythm ? 'custom_override' : style);
            
            const allPositions: {str: number, fret: string | number}[] = [];
            item.chord.frets.forEach((fret: number | string, i: number) => {
                if (fret !== 'x') {
                    allPositions.push({ str: 6 - i, fret });
                }
            });
            
            if (allPositions.length === 0) {
                return [ { positions: [{str: 6, fret: 'X'}], duration: 'w' } ];
            }

            const lowest2Positions = allPositions.slice(0, 2);
            const lowest1Position = allPositions.slice(0, 1);
            const remainingPositions = allPositions.slice(1);

            if (itemStyle === 'folk') {
                return [
                    { positions: allPositions, duration: 'h' },
                    { positions: allPositions, duration: 'q' },
                    { positions: allPositions, duration: 'q' },
                ];
            } else if (itemStyle === 'rock') {
                return [
                    { positions: lowest2Positions, duration: 'q' },
                    { positions: lowest2Positions, duration: 'q' },
                    { positions: allPositions, duration: 'h' },
                ];
            } else if (itemStyle === 'waltz') {
                return [
                    { positions: lowest1Position, duration: 'q' },
                    { positions: remainingPositions, duration: 'q' },
                    { positions: remainingPositions, duration: 'q' },
                ];
            } else if (itemStyle === 'arpeggio') {
                let arpTabSequence: TabNoteData[] = [];
                
                if (item.arpeggioPattern && item.arpeggioPattern.length > 0) {
                    let rawPattern = item.arpeggioPattern;
                    if (typeof rawPattern[0] === 'number') {
                        rawPattern = (rawPattern as any[]).map(val => val === -1 ? [] : [val]);
                    }
                    const pattern = rawPattern as number[][];
                    
                    arpTabSequence = pattern.map(col => {
                        if (col.length === 0) return { duration: '8r', positions: [] };
                        const validPositions = col.map(idx => {
                            const fretVal = item.chord.frets[idx];
                            if (fretVal === 'x' || fretVal === undefined) return null;
                            return { str: 6 - idx, fret: fretVal };
                        }).filter(p => p !== null) as {str: number, fret: string|number}[];
                        
                        if (validPositions.length === 0) return { duration: '8r', positions: [] };
                        return { duration: '8', positions: validPositions };
                    });
                } else {
                    let arpPattern = [
                        allPositions[0], 
                        allPositions[1], 
                        allPositions[2], 
                        allPositions.length > 3 ? allPositions[3] : allPositions[2],
                        allPositions[2], 
                        allPositions[1], 
                        allPositions[0], 
                        allPositions[1]
                    ];
                    arpTabSequence = arpPattern.map(pos => {
                        if (!pos) return { duration: '8r', positions: [] };
                        return { positions: [pos], duration: '8' };
                    });
                }
                
                return arpTabSequence;
            } else if (itemStyle === 'funk') {
                return [
                    { positions: allPositions, duration: 'q' },
                    { positions: allPositions, duration: 'q' },
                    { positions: allPositions, duration: 'h' },
                ];
            } else if (itemStyle === 'custom_override' || itemStyle === 'custom') {
                const activeRhythm = item.rhythm || customRhythm;
                if (!activeRhythm || activeRhythm.length === 0) {
                    return [ { positions: allPositions, duration: 'w' } ];
                }
                
                let arpTabSequence: {str: number, fret: string|number}[][] | undefined = undefined;
                if (item.arpeggioPattern && item.arpeggioPattern.length > 0) {
                    let rawPattern = item.arpeggioPattern;
                    if (typeof rawPattern[0] === 'number') {
                        rawPattern = (rawPattern as any[]).map(val => val === -1 ? [] : [val]);
                    }
                    arpTabSequence = (rawPattern as number[][]).map(col => {
                        return col.map(idx => {
                            const fretVal = item.chord.frets[idx];
                            if (fretVal === 'x' || fretVal === undefined) return null;
                            return { str: 6 - idx, fret: fretVal };
                        }).filter(p => p !== null) as {str: number, fret: string|number}[];
                    });
                }
                
                const tabMeasure: TabNoteData[] = [];
                activeRhythm.forEach((rVal: number, index: number) => {
                    const absoluteSeconds = Math.abs(rVal);
                    const originalBeats = absoluteSeconds / (60.0 / bpm);
                    const isRest = rVal < 0;
                    
                    let durationCode = "q";
                    if (originalBeats <= 0.25) durationCode = "16";
                    else if (originalBeats <= 0.5) durationCode = "8";
                    else if (originalBeats <= 1.0) durationCode = "q";
                    else if (originalBeats <= 2.0) durationCode = "h";
                    else durationCode = "w";
                    
                    if (isRest) {
                        tabMeasure.push({ duration: durationCode + "r", positions: [] });
                    } else {
                        let stepPositions = allPositions;
                        if (arpTabSequence) {
                            const arpStep = arpTabSequence[index % arpTabSequence.length];
                            if (arpStep && arpStep.length > 0) {
                                stepPositions = arpStep;
                            } else {
                                tabMeasure.push({ duration: durationCode + "r", positions: [] });
                                return;
                            }
                        }
                        tabMeasure.push({ duration: durationCode, positions: stepPositions });
                    }
                });
                return tabMeasure;
            } else {
                return [ { positions: allPositions, duration: 'w' } ];
            }
        });
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Header / Options */}
            <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/5 border border-white/10 rounded-2xl p-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Chord Progression Sandbox</h2>
                    <p className="text-slate-400">Build and practice custom progressions in <span className="text-primary font-bold">{keyName} {quality} ({family})</span></p>
                </div>
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
                                setProgression([...progression, { id: Math.random().toString(), chord }]);
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
                        
                        {(style === 'custom' || selectedProgIndex !== null) && (
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
                                            {selectedProgIndex !== null ? `Record Tap for ${progression[selectedProgIndex]?.chord.name}` : 'Record Tap'}
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
                                            {customRhythm.length > 0 && selectedProgIndex === null && (
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
                                {customRhythm.length > 0 && !isTapping && selectedProgIndex === null && (
                                    <span className="text-xs text-emerald-400 font-mono ml-2">({customRhythm.length} beats)</span>
                                )}
                                {selectedProgIndex !== null && progression[selectedProgIndex]?.rhythm && !isTapping && (
                                    <span className="text-xs text-emerald-400 font-mono ml-2">({progression[selectedProgIndex].rhythm!.length} beats)</span>
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
                                const defaultName = `${keyName} ${quality} Custom Jam`;
                                const userInputName = window.prompt("Enter a name for this custom jam:", defaultName);
                                if (userInputName === null) return; // User cancelled
                                
                                const payload = {
                                    id: `custom_jam_${Date.now()}`,
                                    name: userInputName || defaultName,
                                    chords: progression.map(item => ({ numeral: item.chord.numeral, offset: item.chord.offset, q: item.chord.quality, rhythm: item.rhythm, frets: item.chord.frets, playbackStyle: item.playbackStyle })),
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
                        {progression.map((item, idx) => (
                            <div 
                                key={item.id}
                                draggable
                                onClick={() => setSelectedProgIndex(selectedProgIndex === idx ? null : idx)}
                                onDragStart={() => handleDragStart(idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDrop={handleDrop}
                                className={`relative bg-black/40 border p-4 rounded-xl flex items-center gap-4 cursor-grab active:cursor-grabbing transition-colors ${
                                    currentPlayIndex === idx 
                                        ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                                        : selectedProgIndex === idx ? 'border-primary shadow-[0_0_10px_rgba(56,189,248,0.3)] bg-primary/10' : draggedIdx === idx ? 'border-primary opacity-50' : 'border-white/10 hover:border-white/30'
                                }`}
                            >
                                <div className="text-center">
                                    <p className={`text-xl font-bold ${currentPlayIndex === idx ? 'text-white' : 'text-slate-300'}`}>{item.chord.name}</p>
                                    <p className="text-xs text-slate-500 font-mono mt-1">{item.chord.numeral}</p>
                                    {analyzeVoicing(getChordMidi(item.chord.frets), item.chord.name) && (
                                        <p className="text-[10px] text-indigo-300 mt-1 uppercase font-bold tracking-wider">
                                            {analyzeVoicing(getChordMidi(item.chord.frets), item.chord.name)}
                                        </p>
                                    )}
                                    {item.rhythm && (
                                        <p className="text-[10px] text-emerald-400 mt-1 uppercase font-bold tracking-wider">Custom Rhythm</p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingChordIndex(idx);
                                        }}
                                        className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors mb-1"
                                        title="Edit Chord Voicing"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setProgression(p => p.filter((_, i) => i !== idx));
                                            if (selectedProgIndex === idx) setSelectedProgIndex(null);
                                        }}
                                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                        title="Remove Chord"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {item.rhythm && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setProgression(prev => {
                                                    const newProg = [...prev];
                                                    newProg[idx] = { ...newProg[idx], rhythm: undefined };
                                                    return newProg;
                                                });
                                            }}
                                            className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                            title="Clear Custom Rhythm"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l18 18M10.5 10.5l-6-6m15 15l-6-6M9 9l-4 4m14-14l-4 4"/></svg>
                                        </button>
                                    )}
                                </div>
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
                        {progression.map((item) => (
                            <div key={item.id} className="border-2 border-gray-300 p-4 rounded-xl flex flex-col items-center justify-center break-inside-avoid">
                                <p className="text-2xl font-bold text-black mb-1">{item.chord.name}</p>
                                <p className="text-lg text-gray-600 font-mono mb-4">{item.chord.numeral}</p>
                                {analyzeVoicing(getChordMidi(item.chord.frets), item.chord.name) && (
                                    <p className="text-sm text-indigo-600 mb-4 font-bold uppercase tracking-wider">
                                        {analyzeVoicing(getChordMidi(item.chord.frets), item.chord.name)}
                                    </p>
                                )}
                                <div className="transform scale-90">
                                    <ChordDiagram chord={{...item.chord, name: ''}} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-8 bg-slate-900 border border-white/10 rounded-2xl p-6 print:border-none print:p-0 print:bg-white">
                <h3 className="text-xl font-bold text-white mb-6 print:text-black print:border-b-2 print:border-black print:pb-2">Tablature</h3>
                <VexFlowTab measures={generateVexFlowMeasures()} />
            </div>

            {/* Edit Voicing Modal */}
            {editingChordIndex !== null && progression[editingChordIndex] && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button 
                            onClick={() => setEditingChordIndex(null)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center justify-between mb-2 mr-10">
                            <h3 className="text-xl font-bold text-white">Edit Voicing & Style</h3>
                            <button
                                onClick={() => playChordOnce(progression[editingChordIndex].chord)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg transition-colors font-bold text-sm"
                                title="Play Current Voicing"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                Play
                            </button>
                        </div>
                        <p className="text-slate-400 text-sm mb-6">Click on a string below to toggle muting (X) for this chord in your progression.</p>
                        
                        <div className="flex justify-center mb-8">
                            <ChordDiagram chord={progression[editingChordIndex].chord} />
                        </div>

                        <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5 mb-6">
                            {[6, 5, 4, 3, 2, 1].map((strNum, idx) => {
                                // Strings are standard E A D G B E, array is 0-indexed where 0 is 6th string (Low E)
                                const originalChord = chords.find(c => c.numeral === progression[editingChordIndex].chord.numeral);
                                const isOriginallyMuted = originalChord?.frets[idx] === 'x';
                                const currentlyMuted = progression[editingChordIndex].chord.frets[idx] === 'x';
                                const stringNames = ['E', 'A', 'D', 'G', 'B', 'e'];
                                
                                return (
                                    <div key={strNum} className="flex flex-col items-center gap-2">
                                        <span className="text-xs font-bold text-slate-500">{stringNames[idx]}</span>
                                        <button 
                                            onClick={() => {
                                                if (isOriginallyMuted) return; // Cannot unmute a string that was originally muted in the base chord
                                                const newFrets = [...progression[editingChordIndex].chord.frets];
                                                newFrets[idx] = currentlyMuted ? originalChord?.frets[idx] : 'x';
                                                const updatedChord = { ...progression[editingChordIndex].chord, frets: newFrets };
                                                
                                                setProgression(prev => {
                                                    const newProg = [...prev];
                                                    newProg[editingChordIndex] = {
                                                        ...newProg[editingChordIndex],
                                                        chord: updatedChord
                                                    };
                                                    return newProg;
                                                });
                                                
                                                playChordOnce(updatedChord);
                                            }}
                                            disabled={isOriginallyMuted}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                                                isOriginallyMuted ? 'bg-black/20 text-slate-700 border border-white/5 cursor-not-allowed' :
                                                currentlyMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30' :
                                                'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30'
                                            }`}
                                        >
                                            {currentlyMuted ? 'X' : (progression[editingChordIndex].chord.frets[idx] === 0 ? '0' : progression[editingChordIndex].chord.frets[idx])}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="bg-black/40 p-4 rounded-xl border border-white/5 mb-2">
                            <label className="text-xs text-indigo-300 uppercase tracking-wider mb-2 font-bold flex items-center gap-2">
                                Playback Style Override
                            </label>
                            <select 
                                value={progression[editingChordIndex].playbackStyle || 'global'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setProgression(prev => {
                                        const newProg = [...prev];
                                        newProg[editingChordIndex] = {
                                            ...newProg[editingChordIndex],
                                            playbackStyle: val === 'global' ? undefined : val
                                        };
                                        return newProg;
                                    });
                                }}
                                className="w-full bg-slate-800 border border-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors cursor-pointer"
                            >
                                <option value="global">Use Global Style ({style})</option>
                                <option value="folk">Folk</option>
                                <option value="rock">Rock</option>
                                <option value="waltz">Waltz</option>
                                <option value="arpeggio">Arpeggio Sequencer</option>
                                <option value="funk">Funk</option>
                            </select>
                            <p className="text-xs text-slate-500 mt-2">
                                This allows you to apply a specific pattern (like an Arpeggio) to just this chord, and saves to Jam Tracks!
                            </p>
                        </div>

                        {progression[editingChordIndex].playbackStyle === 'arpeggio' && (
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5 mb-2 mt-4 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs text-indigo-300 uppercase tracking-wider font-bold flex items-center gap-2">
                                        Arpeggio Sequencer Grid
                                    </label>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => {
                                                setProgression(prev => {
                                                    const newProg = [...prev];
                                                    let currentPattern = newProg[editingChordIndex].arpeggioPattern;
                                                    // Normalize legacy 1D array to 2D
                                                    if (currentPattern && typeof currentPattern[0] === 'number') {
                                                        currentPattern = (currentPattern as any[]).map(val => val === -1 ? [] : [val]);
                                                    }
                                                    if (!currentPattern) currentPattern = [[0], [1], [2], [3], [2], [1], [0], [1]];
                                                    if (currentPattern.length > 1) {
                                                        newProg[editingChordIndex] = { ...newProg[editingChordIndex], arpeggioPattern: currentPattern.slice(0, -1) as number[][] };
                                                    }
                                                    return newProg;
                                                });
                                            }}
                                            className="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700"
                                        >-</button>
                                        <button 
                                            onClick={() => {
                                                setProgression(prev => {
                                                    const newProg = [...prev];
                                                    let currentPattern = newProg[editingChordIndex].arpeggioPattern;
                                                    // Normalize legacy 1D array to 2D
                                                    if (currentPattern && typeof currentPattern[0] === 'number') {
                                                        currentPattern = (currentPattern as any[]).map(val => val === -1 ? [] : [val]);
                                                    }
                                                    if (!currentPattern) currentPattern = [[0], [1], [2], [3], [2], [1], [0], [1]];
                                                    newProg[editingChordIndex] = { ...newProg[editingChordIndex], arpeggioPattern: [...currentPattern, []] as number[][] };
                                                    return newProg;
                                                });
                                            }}
                                            className="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700"
                                        >+</button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mb-4">Toggle strings for each step in the sequence.</p>
                                
                                <div className="flex flex-col gap-1 overflow-x-auto pb-2">
                                    {(() => {
                                        let rawPattern = progression[editingChordIndex].arpeggioPattern;
                                        if (rawPattern && typeof rawPattern[0] === 'number') {
                                            rawPattern = (rawPattern as any[]).map(val => val === -1 ? [] : [val]);
                                        }
                                        const pattern = (rawPattern as number[][]) || [[0], [1], [2], [3], [2], [1], [0], [1]];
                                        
                                        return ['e', 'B', 'G', 'D', 'A', 'E'].map((strName, strReversedIdx) => {
                                            const strIdx = 5 - strReversedIdx;
                                            return (
                                                <div key={strName} className="flex gap-1 items-center">
                                                    <div className="text-[10px] text-slate-500 font-bold w-6 text-right mr-2">{strName}</div>
                                                    {pattern.map((col, colIdx) => {
                                                        const isSelected = col.includes(strIdx);
                                                        return (
                                                            <button 
                                                                key={`${strName}-${colIdx}`}
                                                                onClick={() => {
                                                                    setProgression(prev => {
                                                                        const newProg = [...prev];
                                                                        const newPattern = [...pattern];
                                                                        if (isSelected) {
                                                                            newPattern[colIdx] = col.filter(x => x !== strIdx);
                                                                        } else {
                                                                            newPattern[colIdx] = [...col, strIdx].sort();
                                                                        }
                                                                        newProg[editingChordIndex] = {
                                                                            ...newProg[editingChordIndex],
                                                                            arpeggioPattern: newPattern as any
                                                                        };
                                                                        return newProg;
                                                                    });
                                                                }}
                                                                className={`flex-shrink-0 w-8 h-8 rounded-md transition-colors ${
                                                                    isSelected ? 'bg-indigo-500 border border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-800 border border-white/5 hover:bg-slate-700'
                                                                }`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-6 flex justify-end">
                            <button 
                                onClick={() => setEditingChordIndex(null)}
                                className="px-6 py-2 bg-primary hover:bg-primary/90 text-black font-bold rounded-lg transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

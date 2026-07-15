import React, { useState, useEffect, useRef } from 'react';
import { HARDCODED_LICKS, generateProceduralLick, mapAbstractLickToMeasures, type AbstractLick, type TabNoteData } from '../data/routines';
import VexFlowTab from './VexFlowTab';
import RhythmPlayer from './RhythmPlayer';
import { Sparkles, Save, Download, Upload, Trash2 } from 'lucide-react';
import { Midi } from '@tonejs/midi';

interface LickGeneratorProps {
    allNotesDesc: {str: number, fret: number}[];
}

export default function LickGenerator({ allNotesDesc }: LickGeneratorProps) {
    const [currentLick, setCurrentLick] = useState<AbstractLick>(HARDCODED_LICKS[0]);
    const [measures, setMeasures] = useState<TabNoteData[][]>([]);
    const [savedLicks, setSavedLicks] = useState<AbstractLick[]>([]);
    const [textImport, setTextImport] = useState<string>('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Load saved licks from localStorage
        try {
            const saved = localStorage.getItem('fretfocus_saved_licks');
            if (saved) {
                setSavedLicks(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Error loading saved licks", e);
        }
    }, []);

    useEffect(() => {
        if (allNotesDesc && allNotesDesc.length > 0) {
            setMeasures(mapAbstractLickToMeasures(currentLick, allNotesDesc));
        }
    }, [currentLick, allNotesDesc]);

    const handleSaveLick = () => {
        const isAlreadySaved = savedLicks.some(l => l.id === currentLick.id);
        if (isAlreadySaved) return;

        const updated = [...savedLicks, currentLick];
        setSavedLicks(updated);
        localStorage.setItem('fretfocus_saved_licks', JSON.stringify(updated));
    };

    const handleDeleteLick = (id: string) => {
        const updated = savedLicks.filter(l => l.id !== id);
        setSavedLicks(updated);
        localStorage.setItem('fretfocus_saved_licks', JSON.stringify(updated));
        
        if (currentLick.id === id) {
            setCurrentLick(HARDCODED_LICKS[0]);
        }
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedLicks, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "fretfocus_licks.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleParseText = (text: string, title?: string) => {
        if (!text.trim()) return;

        const tokens = text.replace(/\|/g, ',').split(',').map(s => s.trim()).filter(s => s.length > 0);
        const pattern: any[] = [];

        tokens.forEach(token => {
            if (token === 'x' || token === '') {
                pattern.push({ idx: -1, dur: 'qr' });
                return;
            }

            const parts = token.split(':');
            const notesPart = parts[0];
            let durPart = parts[1] || 'q';
            
            let dur = 'q';
            let isDotted = durPart.includes('.');
            durPart = durPart.replace('.', '');
            
            if (durPart === 'w') dur = 'w';
            else if (durPart === 'h') dur = 'h';
            else if (durPart === 'q') dur = 'q';
            else if (durPart === 'e') dur = '8';
            else if (durPart === 's') dur = '16';
            
            if (isDotted) dur += 'd';

            if (notesPart === 'x' || notesPart.toLowerCase() === 'r') {
                pattern.push({ idx: -1, dur: dur + 'r' });
                return;
            }

            const chordNotes = notesPart.split('+');
            const positions: {str: number, fret: number | string}[] = [];

            chordNotes.forEach(cn => {
                const match = cn.match(/^([0-9]+|m)\/([1-6])(x?)$/i);
                if (match) {
                    const fretVal = match[1].toLowerCase() === 'm' ? 'X' : parseInt(match[1], 10);
                    const strVal = parseInt(match[2], 10);
                    positions.push({ str: strVal, fret: fretVal });
                }
            });

            if (positions.length > 0) {
                pattern.push({ idx: 0, positions, dur });
            } else {
                pattern.push({ idx: -1, dur: dur + 'r' });
            }
        });

        const newLick: AbstractLick = {
            id: "text_" + Date.now(),
            name: title || "Imported Text Lick",
            pattern
        };
        
        const updated = [...savedLicks, newLick];
        setSavedLicks(updated);
        localStorage.setItem('fretfocus_saved_licks', JSON.stringify(updated));
        setCurrentLick(newLick);
        setTextImport('');
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.md')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                handleParseText(text, file.name.replace(/\.[^/.]+$/, ""));
            };
            reader.readAsText(file);
        } else if (file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi')) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const midi = new Midi(arrayBuffer);
                if (midi.tracks.length > 0) {
                    const track = midi.tracks[0];
                    const pattern: any[] = [];
                    const ppq = midi.header.ppq;
                    let currentTick = 0;

                    const ticksToDur = (ticks: number, isRest: boolean = false) => {
                        let dur = "8";
                        if (ticks >= ppq * 3.5) dur = "w";
                        else if (ticks >= ppq * 1.5) dur = "h";
                        else if (ticks >= ppq * 0.75) dur = "q";
                        else if (ticks >= ppq * 0.375) dur = "8";
                        else dur = "16";
                        return isRest ? dur + "r" : dur;
                    };
                    
                    // 1. Filter out chords (notes starting at exact same time). Keep highest pitch.
                    const monophonicNotes: any[] = [];
                    track.notes.forEach(note => {
                        if (monophonicNotes.length > 0 && monophonicNotes[monophonicNotes.length - 1].ticks === note.ticks) {
                            if (note.midi > monophonicNotes[monophonicNotes.length - 1].midi) {
                                monophonicNotes[monophonicNotes.length - 1] = note;
                            }
                        } else {
                            monophonicNotes.push(note);
                        }
                    });
                    
                    // 2. Map notes sequentially, resolving overlaps and rests
                    monophonicNotes.forEach((note, i) => {
                        const nextNote = monophonicNotes[i + 1];
                        const stepTicks = nextNote ? (nextNote.ticks - note.ticks) : note.durationTicks;
                        
                        const gap = note.ticks - currentTick;
                        if (gap >= ppq * 0.25) { 
                            pattern.push({ idx: -1, dur: ticksToDur(gap, true) });
                        }

                        let bestStr = 1;
                        let bestFret = note.midi - 64; // Fallback for very high notes (above E4)
                        if (bestFret < 0) {
                            const stringOffsets = [0, 64, 59, 55, 50, 45, 40];
                            for (let s = 1; s <= 6; s++) {
                                const f = note.midi - stringOffsets[s];
                                if (f >= 0 && f <= 15) { // Prefer frets in playable range 0-15
                                    bestStr = s;
                                    bestFret = f;
                                    break;
                                }
                            }
                        }

                        const writtenDurTicks = Math.min(note.durationTicks, stepTicks);
                        pattern.push({ 
                            idx: 0, // Unused since str/fret are absolute
                            str: bestStr,
                            fret: Math.max(0, bestFret),
                            dur: ticksToDur(writtenDurTicks) 
                        });
                        currentTick = note.ticks + writtenDurTicks;
                    });

                    const newLick: AbstractLick = {
                        id: "midi_" + Date.now(),
                        name: file.name.replace(/\.[^/.]+$/, ""),
                        pattern
                    };
                    
                    const updated = [...savedLicks, newLick];
                    setSavedLicks(updated);
                    localStorage.setItem('fretfocus_saved_licks', JSON.stringify(updated));
                    setCurrentLick(newLick);
                }
            } catch (err) {
                console.error("Failed to parse MIDI", err);
                alert("Failed to parse MIDI file.");
            }
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target?.result as string);
                    if (Array.isArray(imported)) {
                        const merged = [...savedLicks];
                        imported.forEach((importLick: AbstractLick) => {
                            if (!merged.some(l => l.id === importLick.id)) {
                                merged.push(importLick);
                            }
                        });
                        setSavedLicks(merged);
                        localStorage.setItem('fretfocus_saved_licks', JSON.stringify(merged));
                    }
                } catch (err) {
                    console.error("Failed to parse imported file", err);
                    alert("Invalid lick file format.");
                }
            };
            reader.readAsText(file);
        }
        
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleGenerate = () => {
        setCurrentLick(generateProceduralLick());
    };

    const handleTranspose = (amount: number) => {
        const newPattern = currentLick.pattern.map(p => {
            if (p.positions && p.positions.length > 0) {
                const newPos = p.positions.map(pos => ({
                    ...pos,
                    fret: typeof pos.fret === 'number' ? Math.max(0, pos.fret + amount) : pos.fret
                }));
                return { ...p, positions: newPos };
            }
            return p;
        });
        const updatedLick = { ...currentLick, pattern: newPattern };
        setCurrentLick(updatedLick);
        if (savedLicks.some(l => l.id === currentLick.id)) {
            const updated = savedLicks.map(l => l.id === currentLick.id ? updatedLick : l);
            setSavedLicks(updated);
            localStorage.setItem('fretfocus_saved_licks', JSON.stringify(updated));
        }
    };

    const isCurrentSaved = savedLicks.some(l => l.id === currentLick.id) || HARDCODED_LICKS.some(l => l.id === currentLick.id);

    return (
        <div className="mt-8 space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            Lick Generator
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-slate-400">Name:</span>
                            <input 
                                type="text"
                                value={currentLick.name}
                                onChange={(e) => {
                                    const newName = e.target.value;
                                    setCurrentLick({...currentLick, name: newName});
                                    if (savedLicks.some(l => l.id === currentLick.id)) {
                                        const updated = savedLicks.map(l => l.id === currentLick.id ? {...l, name: newName} : l);
                                        setSavedLicks(updated);
                                        localStorage.setItem('fretfocus_saved_licks', JSON.stringify(updated));
                                    }
                                }}
                                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-primary font-semibold focus:outline-none focus:border-primary/50 w-48"
                            />
                            {currentLick.pattern.some(p => p.positions && p.positions.length > 0) && (
                                <div className="flex items-center gap-1 ml-4 bg-white/5 rounded px-2 border border-white/10" title="Transpose Pitch">
                                    <span className="text-xs text-slate-400 mr-1">Pitch:</span>
                                    <button 
                                        onClick={() => handleTranspose(-1)}
                                        className="text-slate-300 hover:text-white px-2 py-1 font-bold rounded hover:bg-white/10 transition-colors"
                                    >-</button>
                                    <button 
                                        onClick={() => handleTranspose(1)}
                                        className="text-slate-300 hover:text-white px-2 py-1 font-bold rounded hover:bg-white/10 transition-colors"
                                    >+</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <select 
                            value={HARDCODED_LICKS.some(l => l.id === currentLick.id) ? currentLick.id : ''}
                            onChange={(e) => {
                                const selected = HARDCODED_LICKS.find(l => l.id === e.target.value);
                                if (selected) setCurrentLick(selected);
                            }}
                            className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors text-sm border-none outline-none cursor-pointer appearance-none"
                            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                        >
                            <option value="" disabled>Library (Classic Licks)</option>
                            {['Short', 'Medium', 'Long'].map(category => (
                                <optgroup key={category} label={`${category} Licks`} className="bg-slate-900 text-slate-400">
                                    {HARDCODED_LICKS.filter(l => l.category === category).map(lick => (
                                        <option key={lick.id} value={lick.id} className="bg-slate-800 text-white">
                                            {lick.name}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        <button 
                            onClick={handleGenerate}
                            className="flex items-center gap-2 px-3 py-1.5 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 rounded-lg transition-colors text-sm font-bold"
                        >
                            <Sparkles size={16} /> Generate AI Lick
                        </button>
                        {!isCurrentSaved && (
                            <button 
                                onClick={handleSaveLick}
                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg transition-colors text-sm"
                            >
                                <Save size={16} /> Save to Library
                            </button>
                        )}
                    </div>
                </div>

                {measures.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-inner">
                        <RhythmPlayer measures={measures} />
                        <VexFlowTab measures={measures} />
                    </div>
                )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">My Saved Licks</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg transition-colors text-xs"
                        >
                            <Upload size={14} /> Import
                        </button>
                        <button 
                            onClick={handleExport}
                            disabled={savedLicks.length === 0}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg transition-colors text-xs disabled:opacity-50"
                        >
                            <Download size={14} /> Export
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            accept=".json,.mid,.midi,.txt,.md"
                            onChange={handleImport}
                        />
                    </div>
                </div>

                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        placeholder="Paste text notation (e.g. 5/3:e, 7/3:q) or import .txt"
                        value={textImport}
                        onChange={(e) => setTextImport(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary/50"
                    />
                    <button
                        onClick={() => handleParseText(textImport)}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
                    >
                        Parse Text
                    </button>
                </div>

                {savedLicks.length === 0 ? (
                    <p className="text-slate-500 text-sm italic text-center py-4">No custom licks saved yet. Generate one and save it!</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {savedLicks.map(lick => (
                            <div 
                                key={lick.id}
                                className={`flex justify-between items-center p-3 rounded-lg border ${currentLick.id === lick.id ? 'border-primary bg-primary/10' : 'border-white/10 bg-black/20 hover:bg-white/5'} transition-colors cursor-pointer`}
                                onClick={() => setCurrentLick(lick)}
                            >
                                <span className="text-sm font-medium text-slate-200 truncate pr-2">{lick.name}</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteLick(lick.id); }}
                                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

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

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi')) {
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

                        let closestIdx = 0;
                        let minDiff = 999;
                        
                        allNotesDesc.forEach((n, idx) => {
                            const stringOffsets = [0, 64, 59, 55, 50, 45, 40]; // E4=64, B3=59, G3=55, D3=50, A2=45, E2=40
                            const fretNum = Number(n.fret) || 0;
                            const noteMidi = stringOffsets[n.str] + fretNum;
                            const diff = Math.abs(noteMidi - note.midi);
                            if (diff < minDiff) {
                                minDiff = diff;
                                closestIdx = idx;
                            }
                        });

                        const writtenDurTicks = Math.min(note.durationTicks, stepTicks);
                        pattern.push({ idx: closestIdx, dur: ticksToDur(writtenDurTicks) });
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
                            accept=".json,.mid,.midi"
                            onChange={handleImport}
                        />
                    </div>
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

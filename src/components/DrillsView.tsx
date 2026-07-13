import { useState, useEffect, useRef } from 'react';
import VexFlowTab from './VexFlowTab';
import { Play, Square, Zap, Printer } from 'lucide-react';

const SPIDER_PATTERNS = [
    '1-2-3-4', '1-2-4-3', '1-3-2-4', '1-3-4-2', '1-4-2-3', '1-4-3-2',
    '2-1-3-4', '2-1-4-3', '2-3-1-4', '2-3-4-1', '2-4-1-3', '2-4-3-1',
    '3-1-2-4', '3-1-4-2', '3-2-1-4', '3-2-4-1', '3-4-1-2', '3-4-2-1',
    '4-1-2-3', '4-1-3-2', '4-2-1-3', '4-2-3-1', '4-3-1-2', '4-3-2-1'
];

export default function DrillsView() {
    const [pattern, setPattern] = useState('1-2-3-4');
    const [startFret, setStartFret] = useState(1);
    
    // Metronome State
    const [startBpm, setStartBpm] = useState(60);
    const [targetBpm, setTargetBpm] = useState(120);
    const [incrementBpm, setIncrementBpm] = useState(5);
    const [measuresPerIncrement, setMeasuresPerIncrement] = useState(4);
    
    const [isPlaying, setIsPlaying] = useState(false);
    
    // UI state for display
    const [currentBpmDisplay, setCurrentBpmDisplay] = useState(startBpm);
    const [currentMeasureDisplay, setCurrentMeasureDisplay] = useState(1);
    const [currentBeatDisplay, setCurrentBeatDisplay] = useState(1);
    
    // Audio Context and Refs for accurate scheduling
    const audioCtxRef = useRef<AudioContext | null>(null);
    const nextNoteTimeRef = useRef(0);
    const timerIDRef = useRef<number | null>(null);
    
    const bpmRef = useRef(startBpm);
    const measureRef = useRef(1);
    const beatRef = useRef(1);
    const isPlayingRef = useRef(false);
    
    // Generator for Spider VexFlow Measures
    const generateSpiderMeasures = () => {
        const measures: any[] = [];
        const fingers = pattern.split('-').map(Number);
        
        for (let stringNum = 6; stringNum >= 1; stringNum--) {
            const measure = fingers.map(fingerOffset => {
                const fret = startFret + fingerOffset - 1;
                return {
                    positions: [{ str: stringNum, fret: fret }],
                    duration: '8'
                };
            });
            measures.push(measure);
        }
        return measures;
    };
    
    const playClick = (time: number, isDownbeat: boolean) => {
        if (!audioCtxRef.current) return;
        const osc = audioCtxRef.current.createOscillator();
        const envelope = audioCtxRef.current.createGain();
        
        osc.frequency.value = isDownbeat ? 1000 : 800;
        envelope.gain.value = 1;
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        
        osc.connect(envelope);
        envelope.connect(audioCtxRef.current.destination);
        
        osc.start(time);
        osc.stop(time + 0.1);
    };
    
    const scheduler = () => {
        if (!audioCtxRef.current || !isPlayingRef.current) return;
        
        while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + 0.1) {
            playClick(nextNoteTimeRef.current, beatRef.current === 1);
            
            // Sync UI state
            setCurrentBeatDisplay(beatRef.current);
            setCurrentMeasureDisplay(measureRef.current);
            setCurrentBpmDisplay(bpmRef.current);
            
            // Advance beat
            beatRef.current++;
            if (beatRef.current > 4) {
                beatRef.current = 1;
                measureRef.current++;
                
                if (measureRef.current > measuresPerIncrement) {
                    measureRef.current = 1;
                    bpmRef.current = Math.min(bpmRef.current + incrementBpm, targetBpm);
                    
                    if (bpmRef.current >= targetBpm && currentBpmDisplay >= targetBpm) {
                        isPlayingRef.current = false;
                        setIsPlaying(false);
                    }
                }
            }
            
            const secondsPerBeat = 60.0 / bpmRef.current;
            nextNoteTimeRef.current += secondsPerBeat;
        }
        
        if (isPlayingRef.current) {
            timerIDRef.current = requestAnimationFrame(scheduler);
        }
    };
    
    useEffect(() => {
        if (isPlaying) {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }
            
            isPlayingRef.current = true;
            bpmRef.current = currentBpmDisplay;
            measureRef.current = currentMeasureDisplay;
            beatRef.current = currentBeatDisplay;
            
            nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
            timerIDRef.current = requestAnimationFrame(scheduler);
        } else {
            isPlayingRef.current = false;
            if (timerIDRef.current) cancelAnimationFrame(timerIDRef.current);
        }
        
        return () => {
            isPlayingRef.current = false;
            if (timerIDRef.current) cancelAnimationFrame(timerIDRef.current);
        };
    }, [isPlaying]); // Only re-run when play/pause is toggled
    
    const handleStartStop = () => {
        if (isPlaying) {
            setIsPlaying(false);
        } else {
            setCurrentBpmDisplay(startBpm);
            setCurrentMeasureDisplay(1);
            setCurrentBeatDisplay(1);
            setIsPlaying(true);
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-between items-center print:hidden">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        <Zap className="text-primary w-6 h-6" /> Technique & Speed Drills
                    </h2>
                    <p className="text-slate-400">Generate finger independence exercises and push your limits.</p>
                </div>
                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-lg transition-colors text-white"
                >
                    <Printer className="w-4 h-4" /> Print Drill
                </button>
            </div>

            <div className="flex flex-col gap-8">
                
                {/* Progressive Speed Trainer */}
                <div className="bg-black/20 border border-white/5 p-6 rounded-2xl flex flex-col print:hidden">
                    <h3 className="text-xl font-bold text-white mb-4">Progressive Speed Trainer</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Start BPM</label>
                            <input 
                                type="number" 
                                value={startBpm} 
                                onChange={e => { setStartBpm(Number(e.target.value)); if(!isPlaying) setCurrentBpmDisplay(Number(e.target.value)); }}
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Target BPM</label>
                            <input 
                                type="number" 
                                value={targetBpm} 
                                onChange={e => setTargetBpm(Number(e.target.value))}
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">+ BPM Increase</label>
                            <input 
                                type="number" 
                                value={incrementBpm} 
                                onChange={e => setIncrementBpm(Number(e.target.value))}
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Every X Measures</label>
                            <input 
                                type="number" 
                                value={measuresPerIncrement} 
                                onChange={e => setMeasuresPerIncrement(Number(e.target.value))}
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-xl p-8 mb-6 relative overflow-hidden">
                        {isPlaying && (
                            <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
                        )}
                        <div className="text-6xl font-black text-white tracking-tighter mb-2 z-10">
                            {currentBpmDisplay} <span className="text-2xl text-slate-500 font-bold">BPM</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-slate-400 font-bold z-10">
                            <div className="bg-black/50 px-3 py-1 rounded">
                                Measure {currentMeasureDisplay} / {measuresPerIncrement}
                            </div>
                            <div className="flex gap-1">
                                {[1,2,3,4].map(b => (
                                    <div 
                                        key={b} 
                                        className={`w-3 h-3 rounded-full ${b === currentBeatDisplay && isPlaying ? (b === 1 ? 'bg-primary' : 'bg-white') : 'bg-white/20'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleStartStop}
                        className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-lg transition-all ${
                            isPlaying 
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50' 
                                : 'bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(56,189,248,0.4)]'
                        }`}
                    >
                        {isPlaying ? <><Square className="w-5 h-5 fill-current" /> STOP TRAINER</> : <><Play className="w-5 h-5 fill-current" /> START TRAINER</>}
                    </button>
                </div>

                {/* Spider Drill Generator */}
                <div className="bg-black/20 border border-white/5 p-6 rounded-2xl flex flex-col print:bg-white print:border-none print:p-0">
                    <h3 className="text-xl font-bold text-white mb-4 print:text-black">Dexterity Generator</h3>
                    
                    <div className="flex flex-wrap gap-4 mb-6 print:hidden">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Pattern</label>
                            <select 
                                value={pattern} 
                                onChange={e => setPattern(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                            >
                                {SPIDER_PATTERNS.map(p => (
                                    <option key={p} value={p} className="bg-slate-800">{p}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Start Fret</label>
                            <input 
                                type="number" 
                                min={1} max={12}
                                value={startFret} 
                                onChange={e => setStartFret(Number(e.target.value))}
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary w-24"
                            />
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 w-full">
                        <div className="hidden print:block mb-4">
                            <h2 className="text-2xl font-bold">Spider Drill: {pattern} (Start Fret: {startFret})</h2>
                        </div>
                        <VexFlowTab measures={generateSpiderMeasures()} />
                    </div>
                </div>

            </div>
        </div>
    );
}

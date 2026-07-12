import { useEffect, useState } from 'react';
import { techniques, type Exercise } from '../data/routines';
import VexFlowTab from './VexFlowTab';
import Fretboard from './Fretboard';
import { Play, Pause, ChevronRight, ChevronLeft, Eye, EyeOff } from 'lucide-react';

interface ExercisePlayerProps {
    exercise: Exercise;
    dayOfWeek: string;
    shapeData: any;
    onNext: () => void;
    onPrev: () => void;
    isFirst: boolean;
    isLast: boolean;
}

export default function ExercisePlayer({ 
    exercise, 
    dayOfWeek, 
    shapeData,
    onNext, 
    onPrev, 
    isFirst, 
    isLast 
}: ExercisePlayerProps) {
    const [timeRemaining, setTimeRemaining] = useState(exercise.duration);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showDiagram, setShowDiagram] = useState(true);

    // Reset timer when exercise changes
    useEffect(() => {
        setTimeRemaining(exercise.duration);
        setIsPlaying(false);
    }, [exercise.id]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        setIsPlaying(false);
                        if (!isLast) onNext();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, timeRemaining, isLast, onNext]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => setIsPlaying(!isPlaying);
    const tech = techniques[dayOfWeek];

    return (
        <div className="glass-panel rounded-2xl flex flex-col flex-1 h-full min-h-[600px]">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-surface-border no-print">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                    {exercise.title}
                </h2>
                <div className="font-mono text-4xl font-semibold text-primary drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">
                    {formatTime(timeRemaining)}
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-b from-transparent to-black/10">
                
                {/* Global Shape & Chord Context */}
                <div className="mb-8 border border-white/10 bg-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-primary rounded-full inline-block"></span>
                            {shapeData.name} Context
                        </h3>
                        <button 
                            onClick={() => setShowDiagram(!showDiagram)}
                            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            {showDiagram ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {showDiagram ? "Hide Diagram" : "Show Diagram"}
                        </button>
                    </div>

                    {showDiagram && (
                        <div className="mb-6 animate-in fade-in duration-300">
                            <Fretboard shapeData={shapeData} />
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-black/20 p-4 rounded-lg">
                            <h4 className="text-primary font-semibold mb-1 text-sm uppercase tracking-wider">Relevant Chords</h4>
                            <p className="text-slate-200">{shapeData.chordProgressions}</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-lg">
                            <h4 className="text-primary font-semibold mb-1 text-sm uppercase tracking-wider">Voicing Approach</h4>
                            <p className="text-slate-200">{shapeData.chordVoicingsDesc}</p>
                        </div>
                    </div>
                </div>

                {exercise.dynamic ? (
                    <div className="space-y-6 mt-8">
                        <h3 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                            <span className="w-2 h-8 bg-primary rounded-full"></span>
                            Focus: {tech.name}
                        </h3>
                        <p className="text-xl text-slate-200 leading-relaxed max-w-3xl">{tech.desc}</p>
                        <p className="text-slate-400 italic text-lg bg-white/5 p-4 rounded-lg border border-white/10">{exercise.description}</p>
                        
                        {exercise.vexflowMeasures && (
                            <VexFlowTab measures={exercise.vexflowMeasures} />
                        )}
                    </div>
                ) : (
                    <div className="space-y-8 mt-8">
                        <p className="text-xl text-slate-100 leading-relaxed border-l-4 border-primary/70 pl-6 bg-gradient-to-r from-primary/10 to-transparent py-4 rounded-r-xl">
                            {exercise.description}
                        </p>
                        
                        {exercise.focusPoints && (
                            <div className="bg-gradient-to-br from-white/10 to-white/5 p-6 rounded-2xl border border-white/10 shadow-lg">
                                <h4 className="font-bold text-primary mb-4 text-sm uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                                    Focus Points
                                </h4>
                                <ul className="list-none space-y-3">
                                    {exercise.focusPoints.map((point, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-200 text-lg">
                                            <span className="text-primary/60 font-bold text-xl leading-none mt-1">✓</span>
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {exercise.vexflowMeasures && (
                            <VexFlowTab measures={exercise.vexflowMeasures} />
                        )}
                    </div>
                )}
            </div>

            {/* Footer / Controls */}
            <div className="p-6 border-t border-surface-border flex justify-between items-center no-print bg-white/5 rounded-b-2xl">
                <button 
                    onClick={onPrev} 
                    disabled={isFirst}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" /> Previous
                </button>
                
                <button 
                    onClick={toggleTimer}
                    className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-lg transition-all shadow-lg hover:-translate-y-0.5
                        ${isPlaying 
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30' 
                            : 'bg-primary text-background shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_30px_rgba(56,189,248,0.6)]'
                        }`}
                >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
                    {isPlaying ? 'Pause' : 'Start Practice'}
                </button>
                
                <button 
                    onClick={onNext}
                    disabled={isLast}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                    Next <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

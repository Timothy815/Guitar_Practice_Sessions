import { useEffect, useState } from 'react';
import { techniques, type Exercise } from '../data/routines';
import VexFlowTab from './VexFlowTab';
import { Play, Pause, ChevronRight, ChevronLeft } from 'lucide-react';

interface ExercisePlayerProps {
    exercise: Exercise;
    dayOfWeek: string;
    onNext: () => void;
    onPrev: () => void;
    isFirst: boolean;
    isLast: boolean;
}

export default function ExercisePlayer({ 
    exercise, 
    dayOfWeek, 
    onNext, 
    onPrev, 
    isFirst, 
    isLast 
}: ExercisePlayerProps) {
    const [timeRemaining, setTimeRemaining] = useState(exercise.duration);
    const [isPlaying, setIsPlaying] = useState(false);

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
            <div className="flex-1 p-6 overflow-y-auto">
                {exercise.dynamic ? (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white/90">Focus: {tech.name}</h3>
                        <p className="text-lg text-white/70 leading-relaxed">{tech.desc}</p>
                        <p className="text-white/50 italic">{exercise.description}</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <p className="text-lg text-white/80 leading-relaxed border-l-4 border-primary/50 pl-4 bg-primary/5 p-4 rounded-r-lg">
                            {exercise.description}
                        </p>
                        
                        {exercise.focusPoints && (
                            <div className="bg-white/5 p-5 rounded-xl">
                                <h4 className="font-semibold text-primary mb-3 text-sm uppercase tracking-wider">Focus Points</h4>
                                <ul className="list-disc pl-5 space-y-2 text-white/70">
                                    {exercise.focusPoints.map((point, i) => (
                                        <li key={i}>{point}</li>
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

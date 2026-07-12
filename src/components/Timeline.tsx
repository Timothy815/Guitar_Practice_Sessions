import type { Exercise } from '../data/routines';
import { CheckCircle2, Circle } from 'lucide-react';

interface TimelineProps {
    routines: Exercise[];
    currentStepIndex: number;
    onStepClick: (index: number) => void;
}

export default function Timeline({ routines, currentStepIndex, onStepClick }: TimelineProps) {
    return (
        <aside className="w-full lg:w-80 flex flex-col gap-3 no-print">
            <h2 className="text-xl font-bold mb-2 text-white/90 px-2">Session Plan</h2>
            {routines.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isPast = index < currentStepIndex;
                
                return (
                    <div 
                        key={step.id}
                        onClick={() => onStepClick(index)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center group
                            ${isActive 
                                ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(56,189,248,0.2)]' 
                                : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            {isPast ? (
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : isActive ? (
                                <Circle className="w-5 h-5 text-primary fill-primary/20 animate-pulse" />
                            ) : (
                                <Circle className="w-5 h-5 text-white/30" />
                            )}
                            <h3 className={`font-semibold ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                                {step.title.split('.')[1]?.trim() || step.title}
                            </h3>
                        </div>
                        <span className="text-sm font-mono text-white/50">
                            {Math.floor(step.duration / 60)}:00
                        </span>
                    </div>
                );
            })}
        </aside>
    );
}

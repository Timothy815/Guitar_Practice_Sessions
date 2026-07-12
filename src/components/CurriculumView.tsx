import { BookOpen, Map } from 'lucide-react';
import { CURRICULUM } from '../data/curriculum';
import type { CurriculumConfig } from '../data/curriculum';

interface CurriculumViewProps {
    onSelectModule: (config: CurriculumConfig) => void;
}

export default function CurriculumView({ onSelectModule }: CurriculumViewProps) {
    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="text-center mb-12 animate-in slide-in-from-top duration-500">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                    <Map className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight mb-3">
                    Guided Curriculum
                </h2>
                <p className="text-slate-300 text-lg max-w-xl mx-auto leading-relaxed">
                    Follow the curated learning path to master the fretboard step-by-step. Go from the basic Pentatonic shapes all the way to complex Diatonic mastery.
                </p>
            </div>

            <div className="space-y-12 relative">
                {/* The vertical connector line */}
                <div className="absolute top-8 left-[27px] md:left-[35px] w-1 h-[calc(100%-100px)] bg-gradient-to-b from-indigo-500 via-purple-500 to-rose-500 opacity-20 -z-10 rounded-full"></div>

                {CURRICULUM.map((level, levelIdx) => (
                    <div key={level.id} className="relative animate-in slide-in-from-bottom duration-500" style={{ animationDelay: `${levelIdx * 150}ms`, animationFillMode: 'both' }}>
                        
                        {/* Level Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 md:w-18 md:h-18 rounded-2xl bg-indigo-900 border-2 border-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 z-10 flex-shrink-0">
                                <span className="text-indigo-200 font-black text-xl">{levelIdx + 1}</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white leading-none mb-1">{level.title}</h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed">{level.description}</p>
                            </div>
                        </div>
                        
                        {/* Modules */}
                        <div className="space-y-4 pl-6 md:pl-8">
                            {level.modules.map((mod) => (
                                <div 
                                    key={mod.id} 
                                    onClick={() => onSelectModule(mod.config)} 
                                    className="flex gap-4 md:gap-6 items-center group cursor-pointer bg-black/40 hover:bg-indigo-900/40 p-4 md:p-5 rounded-2xl border border-white/5 hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-indigo-500/10 ml-6"
                                >
                                    <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center border-2 border-slate-700 group-hover:bg-indigo-500 group-hover:border-indigo-400 transition-colors flex-shrink-0">
                                        <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors">{mod.title}</h4>
                                        <p className="text-slate-400 text-sm mb-3 line-clamp-2 md:line-clamp-none">{mod.description}</p>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-white/10 text-slate-300">
                                                {mod.config.key} {mod.config.quality}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-white/10 text-slate-300">
                                                Shape {mod.config.shapeId}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-indigo-500/20 text-indigo-300">
                                                {mod.config.family}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity items-center text-indigo-300 text-sm font-bold pr-2">
                                        Start Practice &rarr;
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

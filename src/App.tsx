import { useState, useEffect } from 'react';
import Timeline from './components/Timeline';
import ExercisePlayer from './components/ExercisePlayer';
import VexFlowTab from './components/VexFlowTab';
import Fretboard from './components/Fretboard';
import ChordDiagram from './components/ChordDiagram';
import CurriculumView from './components/CurriculumView';
import ChordSandboxView from './components/ChordSandboxView';
import DrillsView from './components/DrillsView';
import { generateRoutine, techniques } from './data/routines';
import { KEY_OFFSETS } from './data/musicEngine';
import type { ScaleFamily, ScaleQuality } from './data/musicEngine';
import type { CurriculumConfig } from './data/curriculum';
import { Guitar, Printer, Map as MapIcon, Settings2, ListMusic, Zap } from 'lucide-react';

export default function App() {
    const [viewMode, setViewMode] = useState<'curriculum' | 'sandbox' | 'chords' | 'drills'>('curriculum');
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [dayOfWeek, setDayOfWeek] = useState<string>("Monday");
    const [key, setKey] = useState("A");
    const [scaleFamily, setScaleFamily] = useState<ScaleFamily>("Pentatonic");
    const [scaleQuality, setScaleQuality] = useState<ScaleQuality>("Minor");
    const [overrideShapeId, setOverrideShapeId] = useState<number | undefined>(undefined);

    useEffect(() => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        setDayOfWeek(days[new Date().getDay()]);
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleSelectModule = (config: CurriculumConfig) => {
        setKey(config.key);
        setScaleQuality(config.quality);
        setScaleFamily(config.family);
        setOverrideShapeId(config.shapeId);
        if (config.dayOfWeek) setDayOfWeek(config.dayOfWeek);
        setCurrentStepIndex(0);
        setViewMode('sandbox');
    };

    const { routine: currentRoutine, shapeData } = generateRoutine(key, scaleFamily, scaleQuality, dayOfWeek, overrideShapeId);

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-8">
            {/* Header */}
            <header className="flex flex-col xl:flex-row justify-between items-center gap-4 no-print border-b border-white/5 pb-6">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                            <Guitar className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight">FretFocus</h1>
                    </div>
                    
                    <div className="h-8 w-px bg-white/10 hidden xl:block"></div>

                    <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                        <button 
                            onClick={() => setViewMode('curriculum')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'curriculum' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <MapIcon className="w-4 h-4" /> Curriculum
                        </button>
                        <button 
                            onClick={() => setViewMode('sandbox')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'sandbox' ? 'bg-primary text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Settings2 className="w-4 h-4" /> Sandbox
                        </button>
                        <button 
                            onClick={() => setViewMode('chords')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'chords' ? 'bg-fuchsia-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <ListMusic className="w-4 h-4" /> Chords
                        </button>
                        <button 
                            onClick={() => setViewMode('drills')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'drills' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Zap className="w-4 h-4" /> Drills
                        </button>
                    </div>
                </div>
                
                {(viewMode === 'sandbox' || viewMode === 'chords') && (
                    <div className="flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
                            <select 
                                value={key}
                                onChange={(e) => { setKey(e.target.value); setCurrentStepIndex(0); setOverrideShapeId(undefined); }}
                                className="bg-transparent text-white px-3 py-1 focus:outline-none focus:text-primary transition-colors cursor-pointer border-r border-white/10"
                            >
                                {Object.keys(KEY_OFFSETS).map(k => (
                                    <option key={k} value={k} className="bg-slate-800">{k}</option>
                                ))}
                            </select>
                            <select 
                                value={scaleQuality}
                                onChange={(e) => { setScaleQuality(e.target.value as ScaleQuality); setCurrentStepIndex(0); setOverrideShapeId(undefined); }}
                                className="bg-transparent text-white px-3 py-1 focus:outline-none focus:text-primary transition-colors cursor-pointer border-r border-white/10"
                            >
                                <option value="Minor" className="bg-slate-800">Minor</option>
                                <option value="Major" className="bg-slate-800">Major</option>
                            </select>
                            <select 
                                value={scaleFamily}
                                onChange={(e) => { setScaleFamily(e.target.value as ScaleFamily); setCurrentStepIndex(0); setOverrideShapeId(undefined); }}
                                className="bg-transparent text-white px-3 py-1 focus:outline-none focus:text-primary transition-colors cursor-pointer"
                            >
                                <option value="Pentatonic" className="bg-slate-800">Pentatonic</option>
                                <option value="Blues" className="bg-slate-800">Blues</option>
                                <option value="Diatonic" className="bg-slate-800">Diatonic (7-Note)</option>
                                <option value="Harmonic Minor" className="bg-slate-800">Harmonic Minor</option>
                            </select>
                        </div>
                        
                        {viewMode === 'sandbox' && (
                            <select 
                                value={dayOfWeek}
                                onChange={(e) => {
                                    setDayOfWeek(e.target.value);
                                    setCurrentStepIndex(0);
                                    setOverrideShapeId(undefined);
                                }}
                                className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors cursor-pointer"
                            >
                                {Object.keys(techniques).map(day => (
                                    <option key={day} value={day} className="bg-slate-800">{day} Focus</option>
                                ))}
                            </select>
                        )}

                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-lg transition-colors"
                        >
                            <Printer className="w-4 h-4" /> Print
                        </button>
                    </div>
                )}
            </header>

            {viewMode === 'curriculum' ? (
                <CurriculumView onSelectModule={handleSelectModule} />
            ) : viewMode === 'chords' ? (
                <ChordSandboxView 
                    keyName={key} 
                    quality={scaleQuality} 
                    family={scaleFamily} 
                    onSettingsClick={() => {}}
                />
            ) : viewMode === 'drills' ? (
                <DrillsView />
            ) : (
                <>
                    {/* Print Header */}
                    <div className="print-only text-center border-b-2 border-black pb-4 mb-8">
                        <h1 className="text-3xl font-bold mb-2">Focused {scaleFamily} Routine</h1>
                        <p className="text-lg">Key: {key} {scaleQuality} &nbsp;&nbsp;&nbsp; Shape: {shapeData.name}</p>
                        <p className="text-lg mt-2">Daily Focus ({dayOfWeek}): {techniques[dayOfWeek].name}</p>
                    </div>

                    {/* Main Content Layout */}
                    <main className="flex flex-col lg:flex-row gap-8 flex-1 no-print animate-in fade-in duration-500">
                        <Timeline 
                            routines={currentRoutine}
                            currentStepIndex={currentStepIndex}
                            onStepClick={setCurrentStepIndex}
                        />
                        
                        <div className="flex-1">
                            <ExercisePlayer 
                                exercise={currentRoutine[currentStepIndex]}
                                dayOfWeek={dayOfWeek}
                                shapeData={shapeData}
                                onNext={() => setCurrentStepIndex(i => i + 1)}
                                onPrev={() => setCurrentStepIndex(i => i - 1)}
                                isFirst={currentStepIndex === 0}
                                isLast={currentStepIndex === currentRoutine.length - 1}
                            />
                        </div>
                    </main>

                    {/* Print Routine Full Render */}
                    <div className="print-only space-y-8 mt-8">
                        
                        {/* Print Fretboard Diagram */}
                        <div className="break-inside-avoid border border-gray-300 p-6 rounded-lg text-center">
                            <h2 className="text-xl font-bold text-black mb-4">Shape Diagram</h2>
                            <Fretboard shapeData={shapeData} />
                            <div className="mt-8 text-left border-t border-gray-300 pt-6">
                                <p className="font-bold text-black mb-2 text-lg">Chord Connections: {shapeData.chordProgressions}</p>
                                <div className="flex justify-center gap-6 my-6">
                                    {shapeData.actualChords && shapeData.actualChords.map((chord: any, i: number) => (
                                        <ChordDiagram key={i} chord={chord} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {currentRoutine.map((step, idx) => (
                            <div key={idx} className="break-inside-avoid border border-gray-300 p-6 rounded-lg">
                                <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-gray-300 text-black">{step.title} <span className="text-gray-500 font-normal text-lg">({Math.floor(step.duration / 60)} min)</span></h2>
                                {step.dynamic ? (
                                    <div>
                                        <h3 className="text-xl font-bold text-black mb-2">Focus: {techniques[dayOfWeek].name}</h3>
                                        <p className="mt-2 text-black leading-relaxed">{techniques[dayOfWeek].desc}</p>
                                        <p className="italic text-gray-700 mt-3 border-l-4 border-gray-300 pl-4">{step.description}</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="mb-4 text-black leading-relaxed text-lg">{step.description}</p>
                                        
                                        {step.vexflowMeasures && (
                                            <div className="my-6">
                                                <VexFlowTab measures={step.vexflowMeasures} />
                                            </div>
                                        )}

                                        {step.focusPoints && (
                                            <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <h3 className="font-bold text-black mb-3 tracking-wider uppercase text-sm">Focus Points</h3>
                                                <ul className="list-none space-y-2">
                                                    {step.focusPoints.map((pt, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-black">
                                                            <span className="text-gray-400 font-bold">•</span>
                                                            {pt}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

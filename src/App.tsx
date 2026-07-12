import { useState, useEffect } from 'react';
import Timeline from './components/Timeline';
import ExercisePlayer from './components/ExercisePlayer';
import { pentatonicRoutine, techniques } from './data/routines';
import { Guitar, Printer } from 'lucide-react';

export default function App() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [dayOfWeek, setDayOfWeek] = useState<string>("Monday");
    const [key, setKey] = useState("Am");

    useEffect(() => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        setDayOfWeek(days[new Date().getDay()]);
    }, []);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                        <Guitar className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight">FretFocus</h1>
                </div>
                
                <div className="flex items-center gap-4">
                    <select 
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                    >
                        <option value="Am" className="bg-slate-800">A Minor Pentatonic</option>
                        <option value="Em" className="bg-slate-800">E Minor Pentatonic</option>
                        <option value="Gm" className="bg-slate-800">G Minor Pentatonic</option>
                    </select>
                    
                    <select 
                        value={dayOfWeek}
                        onChange={(e) => setDayOfWeek(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                    >
                        {Object.keys(techniques).map(day => (
                            <option key={day} value={day} className="bg-slate-800">{day}</option>
                        ))}
                    </select>

                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-lg transition-colors"
                    >
                        <Printer className="w-4 h-4" /> Print
                    </button>
                </div>
            </header>

            {/* Print Header */}
            <div className="print-only text-center border-b-2 border-black pb-4 mb-8">
                <h1 className="text-3xl font-bold mb-2">Focused 30-Minute Pentatonic Routine</h1>
                <p className="text-lg">Date: ______________ &nbsp;&nbsp;&nbsp; Key: {key}</p>
                <p className="text-lg mt-2">Daily Focus ({dayOfWeek}): {techniques[dayOfWeek].name}</p>
            </div>

            {/* Main Content Layout */}
            <main className="flex flex-col lg:flex-row gap-8 flex-1">
                <Timeline 
                    routines={pentatonicRoutine}
                    currentStepIndex={currentStepIndex}
                    onStepClick={setCurrentStepIndex}
                />
                
                <div className="flex-1">
                    <ExercisePlayer 
                        exercise={pentatonicRoutine[currentStepIndex]}
                        dayOfWeek={dayOfWeek}
                        onNext={() => setCurrentStepIndex(i => i + 1)}
                        onPrev={() => setCurrentStepIndex(i => i - 1)}
                        isFirst={currentStepIndex === 0}
                        isLast={currentStepIndex === pentatonicRoutine.length - 1}
                    />
                </div>
            </main>

            {/* Print Routine Full Render */}
            <div className="print-only space-y-8 mt-8">
                {pentatonicRoutine.map((step, idx) => (
                    <div key={idx} className="break-inside-avoid border border-gray-300 p-6 rounded-lg">
                        <h2 className="text-2xl font-bold mb-4 pb-2 border-b">{step.title} (5 min)</h2>
                        {step.dynamic ? (
                            <div>
                                <h3 className="text-xl font-bold">Focus: {techniques[dayOfWeek].name}</h3>
                                <p className="mt-2">{techniques[dayOfWeek].desc}</p>
                                <p className="italic text-gray-600 mt-2">{step.description}</p>
                            </div>
                        ) : (
                            <div>
                                <p className="mb-4">{step.description}</p>
                                {step.focusPoints && (
                                    <ul className="list-disc pl-6 mb-4">
                                        {step.focusPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                                    </ul>
                                )}
                                <p className="italic text-gray-500 text-sm mt-4">
                                    (Tablature visual available in digital version)
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

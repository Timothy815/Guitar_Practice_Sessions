import { useEffect, useRef } from 'react';
import { Formatter, Renderer, TabStave, TabNote } from 'vexflow';
import type { TabNoteData } from '../data/routines';

interface VexFlowTabProps {
    measures: TabNoteData[][];
}

export default function VexFlowTab({ measures }: VexFlowTabProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        
        containerRef.current.innerHTML = '';
        
        const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
        
        // Calculate dynamic width based on measures
        const measureWidth = 250;
        const totalWidth = (measures.length * measureWidth) + 50;
        
        renderer.resize(totalWidth, 150);
        const context = renderer.getContext();
        
        let currentX = 10;
        
        measures.forEach((measureNotes, index) => {
            const stave = new TabStave(currentX, 20, measureWidth);
            if (index === 0) stave.addClef('tab');
            stave.setContext(context).draw();
            
            if (measureNotes.length > 0) {
                const notes = measureNotes.map(n => 
                    new TabNote({
                        positions: n.positions.map(p => ({ str: p.str, fret: p.fret.toString() })),
                        duration: n.duration || 'q'
                    })
                );
                
                Formatter.FormatAndDraw(context, stave, notes);
            }
            currentX += measureWidth;
        });

    }, [measures]);

    return (
        <div className="overflow-x-auto w-full bg-white p-4 rounded-xl border border-gray-200 my-4 no-print flex justify-center shadow-inner">
            <div ref={containerRef} />
        </div>
    );
}

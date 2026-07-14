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
        
        // Standardize the width for print and screen
        const MAX_WIDTH = 800;
        const TARGET_MEASURES_PER_LINE = 3;
        const rowHeight = 130;
        
        // Group measures into lines
        const lines: TabNoteData[][][] = [];
        for (let i = 0; i < measures.length; i += TARGET_MEASURES_PER_LINE) {
            lines.push(measures.slice(i, i + TARGET_MEASURES_PER_LINE));
        }
        
        const totalHeight = lines.length * rowHeight + 20;
        renderer.resize(MAX_WIDTH + 20, totalHeight);
        const context = renderer.getContext();
        
        lines.forEach((lineMeasures, lineIndex) => {
            const currentY = 20 + (lineIndex * rowHeight);
            
            // Use standard width for all measures so incomplete lines don't stretch
            const currentMeasureWidth = MAX_WIDTH / TARGET_MEASURES_PER_LINE;
            
            let currentX = 10;
            
            lineMeasures.forEach((measureNotes, measureIndexInLine) => {
                const stave = new TabStave(currentX, currentY, currentMeasureWidth);
                
                // Only add clef at the beginning of each new line
                if (measureIndexInLine === 0) stave.addClef('tab');
                
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
                currentX += currentMeasureWidth;
            });
        });

    }, [measures]);

    return (
        <div className="overflow-x-auto w-full bg-white p-4 rounded-xl border border-gray-200 my-4 flex justify-center shadow-inner print:shadow-none print:border-none print:p-0">
            <div ref={containerRef} />
        </div>
    );
}

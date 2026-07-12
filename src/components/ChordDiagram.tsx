interface ChordDiagramProps {
    chord: {
        name: string;
        numeral: string;
        frets: (number | 'x')[];
        barre?: number;
    };
}

export default function ChordDiagram({ chord }: ChordDiagramProps) {
    // Find min and max frets to determine the viewport of the diagram
    const playedFrets = chord.frets.filter(f => f !== 'x') as number[];
    const minFret = Math.min(...playedFrets);
    const maxFret = Math.max(...playedFrets);
    
    // Draw 4 or 5 frets depending on the span
    const span = Math.max(4, maxFret - minFret + 1);
    
    // Grid settings
    const width = 120;
    const height = 150;
    const paddingX = 20;
    const paddingY = 20;
    const stringSpacing = (width - 2 * paddingX) / 5;
    const fretSpacing = (height - 2 * paddingY) / span;

    return (
        <div className="flex flex-col items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="text-center mb-2">
                <div className="font-bold text-lg text-black">{chord.numeral}</div>
                <div className="text-sm text-gray-500 font-medium">{chord.name}</div>
            </div>
            
            <svg width={width} height={height} className="drop-shadow-sm">
                {/* Draw Frets (horizontal lines) */}
                {Array.from({ length: span + 1 }).map((_, i) => (
                    <line 
                        key={`fret-${i}`}
                        x1={paddingX} 
                        y1={paddingY + i * fretSpacing} 
                        x2={width - paddingX} 
                        y2={paddingY + i * fretSpacing} 
                        stroke="#475569" 
                        strokeWidth={i === 0 && minFret === 0 ? 6 : 2} 
                    />
                ))}

                {/* Draw Strings (vertical lines) */}
                {Array.from({ length: 6 }).map((_, i) => (
                    <line 
                        key={`str-${i}`}
                        x1={paddingX + i * stringSpacing} 
                        y1={paddingY} 
                        x2={paddingX + i * stringSpacing} 
                        y2={height - paddingY} 
                        stroke="#94a3b8" 
                        strokeWidth={1.5} 
                    />
                ))}

                {/* Starting Fret Number on the left */}
                {minFret > 0 && (
                    <text x={paddingX - 12} y={paddingY + fretSpacing / 2 + 5} fontSize="12" fill="#64748b" fontWeight="bold">
                        {minFret}
                    </text>
                )}

                {/* Draw Barre if exists */}
                {chord.barre !== undefined && chord.barre > 0 && (
                    <rect 
                        x={paddingX - 5}
                        y={paddingY + ((chord.barre - minFret) * fretSpacing) + (fretSpacing / 2) - 8}
                        width={(5 * stringSpacing) + 10}
                        height={16}
                        rx={8}
                        fill="#38bdf8"
                        opacity={0.8}
                    />
                )}

                {/* Draw Notes / Mutes */}
                {chord.frets.map((fret, i) => {
                    const cx = paddingX + i * stringSpacing;
                    
                    if (fret === 'x') {
                        return (
                            <text key={`mute-${i}`} x={cx} y={paddingY - 8} textAnchor="middle" fontSize="12" fill="#ef4444" fontWeight="bold">
                                X
                            </text>
                        );
                    }
                    
                    if (fret === 0) {
                        return (
                            <circle key={`open-${i}`} cx={cx} cy={paddingY - 8} r="4" fill="none" stroke="#22c55e" strokeWidth="2" />
                        );
                    }

                    // For played frets, if there's a barre on this fret, we already drew it, but we can draw the dot too
                    const cy = paddingY + ((fret - minFret) * fretSpacing) + (fretSpacing / 2);
                    return (
                        <circle key={`note-${i}`} cx={cx} cy={cy} r="6" fill="#1e293b" />
                    );
                })}
            </svg>
        </div>
    );
}

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
    
    // Grid settings mapped for horizontal orientation
    const width = 180;
    const height = 110;
    const paddingX = 30; // left padding for open/mute symbols
    const paddingY = 15;
    const fretSpacing = (width - 2 * paddingX) / span;
    const stringSpacing = (height - 2 * paddingY) / 5;

    return (
        <div className="flex flex-col items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="text-center mb-2">
                <div className="font-bold text-lg text-black">{chord.numeral}</div>
                <div className="text-sm text-gray-500 font-medium">{chord.name}</div>
            </div>
            
            <svg width={width} height={height} className="drop-shadow-sm">
                {/* Draw Frets (vertical lines) */}
                {Array.from({ length: span + 1 }).map((_, i) => (
                    <line 
                        key={`fret-${i}`}
                        x1={paddingX + i * fretSpacing} 
                        y1={paddingY} 
                        x2={paddingX + i * fretSpacing} 
                        y2={height - paddingY} 
                        stroke="#475569" 
                        strokeWidth={i === 0 && minFret === 0 ? 6 : 2} 
                    />
                ))}

                {/* Draw Fret numbers at bottom if not open position */}
                {minFret > 0 && Array.from({ length: span }).map((_, i) => (
                    <text 
                        key={`fn-${i}`} 
                        x={paddingX + i * fretSpacing + fretSpacing / 2} 
                        y={height - 2} 
                        textAnchor="middle" 
                        fontSize="10" 
                        fill="#64748b" 
                        fontWeight="bold"
                    >
                        {minFret + i}
                    </text>
                ))}

                {/* Draw Strings (horizontal lines) */}
                {Array.from({ length: 6 }).map((_, i) => {
                    const stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];
                    return (
                        <g key={`str-${i}`}>
                            <text 
                                x={paddingX - 22} 
                                y={paddingY + i * stringSpacing + 3} 
                                textAnchor="middle" 
                                fontSize="10" 
                                fill="#94a3b8" 
                                fontWeight="bold"
                            >
                                {stringNames[i]}
                            </text>
                            <line 
                                x1={paddingX} 
                                y1={paddingY + i * stringSpacing} 
                                x2={width - paddingX} 
                                y2={paddingY + i * stringSpacing} 
                                stroke="#94a3b8" 
                                strokeWidth={1 + (i * 0.2)} // Make lower strings slightly thicker
                            />
                        </g>
                    );
                })}

                {/* Draw Barre if exists */}
                {chord.barre !== undefined && chord.barre > 0 && (
                    <rect 
                        x={paddingX + ((chord.barre - minFret) * fretSpacing) + (fretSpacing / 2) - 8}
                        y={paddingY - 5}
                        width={16}
                        height={(5 * stringSpacing) + 10}
                        rx={8}
                        fill="#38bdf8"
                        opacity={0.8}
                    />
                )}

                {/* Draw Notes / Mutes */}
                {chord.frets.map((fret, i) => {
                    // In chord.frets, index 0 is 6th string (low E), index 5 is 1st string (high e).
                    // In our horizontal SVG, y=0 is the top, so we want the 1st string at the top (i=0)
                    // and 6th string at the bottom (i=5). 
                    const strLineIndex = 5 - i; 
                    const cy = paddingY + strLineIndex * stringSpacing;
                    
                    if (fret === 'x') {
                        return (
                            <text key={`mute-${i}`} x={paddingX - 12} y={cy + 4} textAnchor="middle" fontSize="12" fill="#ef4444" fontWeight="bold">
                                X
                            </text>
                        );
                    }
                    
                    if (fret === 0) {
                        return (
                            <circle key={`open-${i}`} cx={paddingX - 12} cy={cy} r="4" fill="none" stroke="#22c55e" strokeWidth="2" />
                        );
                    }

                    // For played frets
                    const cx = paddingX + ((fret - minFret) * fretSpacing) + (fretSpacing / 2);
                    return (
                        <circle key={`note-${i}`} cx={cx} cy={cy} r="6" fill="#1e293b" />
                    );
                })}
            </svg>
        </div>
    );
}

interface FretboardProps {
    shapeData: any;
}

export default function Fretboard({ shapeData }: FretboardProps) {
    if (!shapeData || !shapeData.actualFrets) return null;

    const frets = shapeData.actualFrets;
    
    // Find min and max frets to determine how many frets to draw
    let minFret = 99;
    let maxFret = 0;
    
    for (let str = 1; str <= 6; str++) {
        frets[str].forEach((f: number) => {
            if (f < minFret) minFret = f;
            if (f > maxFret) maxFret = f;
        });
    }

    // Always draw at least 4 frets of space, sometimes 5
    const span = Math.max(4, maxFret - minFret + 1);
    
    // SVG coordinates
    const width = 600;
    const height = 200;
    const padding = 30;
    const stringSpacing = (height - 2 * padding) / 5;
    const fretSpacing = (width - 2 * padding) / span;

    // Helper to check if a note is a root
    const isRoot = (str: number, fretIdx: number) => {
        return shapeData.rootPositions.some((rp: any) => rp.str === str && rp.fretIdx === fretIdx);
    };

    return (
        <div className="w-full overflow-x-auto bg-white p-6 rounded-xl border border-gray-200 shadow-inner my-6">
            <h4 className="text-black font-bold text-center mb-2">{shapeData.name} - Fret {minFret} to {minFret + span - 1}</h4>
            <div className="flex justify-center min-w-[500px]">
                <svg width={width} height={height} className="drop-shadow-sm">
                    {/* Draw Frets (vertical lines) */}
                    {Array.from({ length: span + 1 }).map((_, i) => (
                        <g key={`fret-${i}`}>
                            <line 
                                x1={padding + i * fretSpacing} 
                                y1={padding} 
                                x2={padding + i * fretSpacing} 
                                y2={height - padding} 
                                stroke="#475569" 
                                strokeWidth={i === 0 && minFret === 0 ? 8 : 2} // Nut is thicker if fret 0
                            />
                            {/* Fret numbers at the bottom */}
                            {i < span && (
                                <text 
                                    x={padding + i * fretSpacing + fretSpacing / 2} 
                                    y={height - 5} 
                                    textAnchor="middle" 
                                    fill="#64748b" 
                                    fontSize="14"
                                    fontWeight="bold"
                                >
                                    {minFret + i}
                                </text>
                            )}
                        </g>
                    ))}

                    {/* Draw Strings (horizontal lines) */}
                    {Array.from({ length: 6 }).map((_, i) => {
                        return (
                            <line 
                                key={`str-${i}`}
                                x1={padding} 
                                y1={padding + i * stringSpacing} 
                                x2={width - padding} 
                                y2={padding + i * stringSpacing} 
                                stroke="#94a3b8" 
                                strokeWidth={1 + (i * 0.5)} // Thicker strings for lower notes
                            />
                        );
                    })}

                    {/* Draw Notes */}
                    {Array.from({ length: 6 }).map((_, i) => {
                        const strNum = 6 - i; // 1 to 6 (1 is top visual line)
                        const stringFrets = frets[strNum] || [];
                        
                        return stringFrets.map((fret: number, idx: number) => {
                            const fretPos = fret - minFret;
                            const cx = padding + (fretPos * fretSpacing) + (fretSpacing / 2);
                            const cy = padding + i * stringSpacing;
                            const isRootNote = isRoot(strNum, idx);
                            
                            return (
                                <g key={`note-${strNum}-${fret}`}>
                                    <circle 
                                        cx={cx} 
                                        cy={cy} 
                                        r="12" 
                                        fill={isRootNote ? "#38bdf8" : "#1e293b"} 
                                        stroke={isRootNote ? "#0284c7" : "#0f172a"}
                                        strokeWidth="2"
                                    />
                                    {isRootNote && (
                                        <text 
                                            x={cx} 
                                            y={cy + 4} 
                                            textAnchor="middle" 
                                            fill="white" 
                                            fontSize="12" 
                                            fontWeight="bold"
                                        >
                                            R
                                        </text>
                                    )}
                                </g>
                            );
                        });
                    })}
                </svg>
            </div>
        </div>
    );
}

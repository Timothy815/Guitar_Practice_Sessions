

interface ProgressionItem {
    id: string;
    chord: {
        name: string;
        numeral: string;
        frets: (number | 'x')[];
        [key: string]: any;
    };
    rhythm?: number[];
}

interface ProgressionTablatureProps {
    progression: ProgressionItem[];
    globalStyle: string;
    customRhythm: number[];
}

export default function ProgressionTablature({ progression, globalStyle, customRhythm }: ProgressionTablatureProps) {
    if (progression.length === 0) return null;

    const generateMeasure = (item: ProgressionItem) => {
        const lines = ['', '', '', '', '', ''];
        
        const style = item.rhythm ? 'custom_override' : globalStyle;
        const activeRhythm = item.rhythm || customRhythm;

        const activeStrings = item.chord.frets
            .map((f, i) => f !== 'x' ? i : -1)
            .filter(i => i !== -1);
            
        const appendCol = (colData: (string | number)[], spacing = 3) => {
            for (let i = 0; i < 6; i++) {
                const fretIndex = 5 - i; // 0=Low E, 5=High e
                let val = colData[fretIndex];
                if (val === undefined || val === null || val === 'x' || val === '') {
                    val = '-';
                }
                const strVal = val.toString();
                lines[i] += strVal + '-'.repeat(Math.max(1, spacing - strVal.length + 1));
            }
        };

        const appendEmpty = (dashes: number) => {
            for (let i = 0; i < 6; i++) {
                lines[i] += '-'.repeat(dashes);
            }
        };
        
        for (let i = 0; i < 6; i++) {
            lines[i] += '|---';
        }

        const allNotes: (number | string)[] = [...item.chord.frets];
        
        const lowest2 = [...allNotes].fill('-');
        if (activeStrings.length > 0) lowest2[activeStrings[0]] = allNotes[activeStrings[0]];
        if (activeStrings.length > 1) lowest2[activeStrings[1]] = allNotes[activeStrings[1]];
        
        const lowest1 = [...allNotes].fill('-');
        if (activeStrings.length > 0) lowest1[activeStrings[0]] = allNotes[activeStrings[0]];

        const remainingNotes = [...allNotes];
        if (activeStrings.length > 0) remainingNotes[activeStrings[0]] = '-';

        if (style === 'folk') {
            appendCol(allNotes, 6); // Beat 1
            appendCol(allNotes, 4); // Beat 3
            appendCol(allNotes, 4); // Beat 4
        } else if (style === 'rock') {
            appendCol(lowest2, 4); // Beat 1
            appendCol(lowest2, 4); // Beat 2
            appendCol(allNotes, 8); // Beat 3
        } else if (style === 'waltz') {
            appendCol(lowest1, 4); // Beat 1
            appendCol(remainingNotes, 4); // Beat 2
            appendCol(remainingNotes, 4); // Beat 3
        } else if (style === 'arpeggio') {
            const arpPattern = [
                activeStrings[0], activeStrings[1], activeStrings[2], 
                activeStrings.length > 3 ? activeStrings[3] : activeStrings[2],
                activeStrings[2], activeStrings[1], activeStrings[0], activeStrings[1]
            ];
            
            for (let i = 0; i < 8; i++) {
                const col: (string | number)[] = Array(6).fill('-');
                const strIdx = arpPattern[i];
                if (strIdx !== undefined) {
                    col[strIdx] = allNotes[strIdx];
                }
                appendCol(col, 2);
            }
        } else if (style === 'funk') {
            appendCol(allNotes, 3);
            appendEmpty(2);
            appendCol(allNotes, 5);
            appendEmpty(3);
            appendCol(allNotes, 5);
        } else {
            if (activeRhythm.length === 0) {
                appendCol(allNotes, 16);
            } else {
                activeRhythm.forEach(duration => {
                    if (duration > 0) {
                        appendCol(allNotes, Math.max(3, Math.round(duration * 6)));
                    } else {
                        appendEmpty(Math.max(3, Math.round(Math.abs(duration) * 6)));
                    }
                });
            }
        }
        
        return lines;
    };

    const measuresPerLine = 4;
    const tabChunks = [];
    
    for (let i = 0; i < progression.length; i += measuresPerLine) {
        const chunk = progression.slice(i, i + measuresPerLine);
        
        const tabLines = ['e|', 'B|', 'G|', 'D|', 'A|', 'E|'];
        const chordLabels: { label: string, offset: number }[] = [];
        let currentOffset = 2;
        
        chunk.forEach((item) => {
            const measureLines = generateMeasure(item);
            chordLabels.push({ label: item.chord.name, offset: currentOffset + 4 });
            for (let j = 0; j < 6; j++) tabLines[j] += measureLines[j];
            currentOffset += measureLines[0].length;
        });
        
        for (let j = 0; j < 6; j++) tabLines[j] += '|';
        
        let labelLine = '';
        let cursor = 0;
        chordLabels.forEach(({ label, offset }) => {
            if (offset > cursor) {
                labelLine += ' '.repeat(offset - cursor);
                cursor = offset;
            }
            labelLine += label;
            cursor += label.length;
        });
        
        tabChunks.push(labelLine + '\n' + tabLines.join('\n'));
    }

    const fullTabText = tabChunks.join('\n\n\n');

    return (
        <>
            <div className="print:hidden mt-8 bg-slate-900 border border-white/10 rounded-2xl p-6 overflow-hidden">
                <h3 className="text-xl font-bold text-white mb-6">Tablature</h3>
                <div className="overflow-x-auto pb-4">
                    <pre className="text-emerald-400 font-mono text-sm leading-relaxed whitespace-pre min-w-max">
                        {fullTabText}
                    </pre>
                </div>
            </div>
            
            <div className="hidden print:block text-black mt-12 bg-white">
                <h3 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2">Tablature</h3>
                <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-inside-avoid">
                    {fullTabText}
                </pre>
            </div>
        </>
    );
}

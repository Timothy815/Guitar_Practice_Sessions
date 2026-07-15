import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, Repeat, FolderOpen, ZoomIn, ZoomOut } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

interface AudioFile {
    name: string;
    handle: FileSystemFileHandle;
}

export function JamTracksView() {
    const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
    const [currentTrack, setCurrentTrack] = useState<AudioFile | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [tempo, setTempo] = useState(1.0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    
    // Looping
    const [isLooping, setIsLooping] = useState(false);
    const [loopA, setLoopA] = useState<number | null>(null);
    const [loopB, setLoopB] = useState<number | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    const waveformRef = useRef<HTMLDivElement | null>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const regions = useRef<RegionsPlugin | null>(null);
    const reqRef = useRef<number>(0);

    const loadDirectory = async () => {
        try {
            // @ts-ignore
            const dirHandle = await window.showDirectoryPicker();
            const files: AudioFile[] = [];
            // @ts-ignore
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file' && (entry.name.endsWith('.mp3') || entry.name.endsWith('.wav') || entry.name.endsWith('.m4a'))) {
                    files.push({ name: entry.name, handle: entry });
                }
            }
            setAudioFiles(files);
        } catch (err) {
            console.error('Directory picker failed:', err);
        }
    };

    // Initialize WaveSurfer
    useEffect(() => {
        if (!waveformRef.current) return;
        
        wavesurfer.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#a5b4fc',
            progressColor: '#4f46e5',
            cursorColor: '#4f46e5',
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 120,
        });

        regions.current = wavesurfer.current.registerPlugin(RegionsPlugin.create());

        wavesurfer.current.on('ready', () => {
            if (wavesurfer.current) {
                setDuration(wavesurfer.current.getDuration());
            }
        });

        wavesurfer.current.on('timeupdate', (time) => {
            setCurrentTime(time);
        });

        wavesurfer.current.on('play', () => setIsPlaying(true));
        wavesurfer.current.on('pause', () => setIsPlaying(false));
        wavesurfer.current.on('finish', () => setIsPlaying(false));

        regions.current.on('region-updated', (region) => {
            if (region.id === 'loop') {
                setLoopA(region.start);
                setLoopB(region.end);
                setIsLooping(true);
            }
        });
        
        regions.current.on('region-created', (region) => {
            if (region.id !== 'loop') {
                if (regions.current) {
                    regions.current.getRegions().forEach(r => {
                        if (r.id === 'loop') r.remove();
                    });
                }
                region.setOptions({ id: 'loop', color: 'rgba(79, 70, 229, 0.2)' });
                setLoopA(region.start);
                setLoopB(region.end);
                setIsLooping(true);
            }
        });
        
        regions.current.enableDragSelection({ color: 'rgba(79, 70, 229, 0.2)' });

        return () => {
            if (wavesurfer.current) {
                wavesurfer.current.destroy();
            }
        };
    }, []);

    const selectTrack = async (file: AudioFile) => {
        try {
            const f = await file.handle.getFile();
            const url = URL.createObjectURL(f);
            
            if (wavesurfer.current) {
                wavesurfer.current.load(url);
                setCurrentTrack(file);
                setIsPlaying(false);
                setLoopA(null);
                setLoopB(null);
                setIsLooping(false);
                if (regions.current) {
                    regions.current.clearRegions();
                }
            }
        } catch (e) {
            console.error("Failed to load audio file", e);
        }
    };

    // A-B Loop Logic
    useEffect(() => {
        const checkLoop = () => {
            if (wavesurfer.current && isLooping && loopA !== null && loopB !== null && loopB > loopA) {
                const time = wavesurfer.current.getCurrentTime();
                if (time >= loopB || time < loopA) {
                    wavesurfer.current.setTime(loopA);
                }
            }
            reqRef.current = requestAnimationFrame(checkLoop);
        };
        reqRef.current = requestAnimationFrame(checkLoop);
        
        return () => cancelAnimationFrame(reqRef.current);
    }, [isLooping, loopA, loopB]);

    // Handle Playback Rate
    useEffect(() => {
        if (wavesurfer.current) {
            wavesurfer.current.setPlaybackRate(tempo);
        }
    }, [tempo]);

    // Sync UI to visual region
    useEffect(() => {
        if (!regions.current) return;
        
        if (loopA !== null && loopB !== null && loopB > loopA) {
            const r = regions.current.getRegions();
            let loopReg = r.find(reg => reg.id === 'loop');
            if (loopReg) {
                if (Math.abs(loopReg.start - loopA) > 0.05 || Math.abs(loopReg.end - loopB) > 0.05) {
                    loopReg.setOptions({ start: loopA, end: loopB });
                }
            } else {
                regions.current.addRegion({
                    id: 'loop',
                    start: loopA,
                    end: loopB,
                    color: 'rgba(79, 70, 229, 0.2)',
                    drag: true,
                    resize: true,
                });
            }
        } else {
            regions.current.clearRegions();
        }
    }, [loopA, loopB]);

    // Handle Zoom
    useEffect(() => {
        if (wavesurfer.current) {
            // zoomLevel 1 is minPxPerSec 0 (fit to screen). Zoom level 2+ increases minPxPerSec
            wavesurfer.current.zoom(zoomLevel === 1 ? 0 : zoomLevel * 20);
        }
    }, [zoomLevel]);

    const togglePlay = () => {
        if (!wavesurfer.current || !currentTrack) return;
        wavesurfer.current.playPause();
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!wavesurfer.current || !duration) return;
        const time = parseFloat(e.target.value);
        wavesurfer.current.setTime(time);
        setCurrentTime(time);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        const ms = Math.floor((time % 1) * 1000);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}.${ms.toString().padStart(3, '0')}`;
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Jam Tracks</h2>
                <button 
                    onClick={loadDirectory}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                >
                    <FolderOpen size={18} className="mr-2" />
                    Open Folder
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-3 border-b pb-2">Available Tracks</h3>
                    {audioFiles.length === 0 ? (
                        <p className="text-gray-500 text-sm">Click "Open Folder" to load audio files from your computer.</p>
                    ) : (
                        <ul className="space-y-1">
                            {audioFiles.map((file, i) => (
                                <li key={i}>
                                    <button
                                        onClick={() => selectTrack(file)}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm truncate ${currentTrack?.name === file.name ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-50 text-gray-600'}`}
                                    >
                                        {file.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-6">
                    {currentTrack ? (
                        <>
                            <div className="text-center mb-2">
                                <h3 className="text-xl font-bold text-gray-800">{currentTrack.name}</h3>
                            </div>
                            
                            <div className="relative border rounded-md bg-gray-50 p-2 overflow-hidden">
                                <div ref={waveformRef} className="w-full" />
                                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                    <span>{formatTime(currentTime)}</span>
                                    
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => setZoomLevel(Math.max(1, zoomLevel - 1))} className="p-1 hover:text-indigo-600"><ZoomOut size={16} /></button>
                                        <span>Zoom: {zoomLevel}x</span>
                                        <button onClick={() => setZoomLevel(zoomLevel + 1)} className="p-1 hover:text-indigo-600"><ZoomIn size={16} /></button>
                                    </div>
                                    
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col space-y-2">
                                <input 
                                    type="range" 
                                    min={0} 
                                    max={duration || 100} 
                                    step={0.01}
                                    value={currentTime} 
                                    onChange={handleSeek}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                            </div>

                            <div className="flex justify-center items-center space-x-6">
                                <button 
                                    onClick={() => {
                                        if (wavesurfer.current) wavesurfer.current.setTime(0);
                                    }}
                                    className="p-3 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
                                >
                                    <SkipBack size={24} />
                                </button>
                                
                                <button 
                                    onClick={togglePlay}
                                    className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition shadow-md"
                                >
                                    {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                                </button>
                                
                                <button 
                                    onClick={() => setIsLooping(!isLooping)}
                                    className={`p-3 rounded-full transition ${isLooping ? 'bg-indigo-100 text-indigo-600 shadow-inner' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}
                                    title="Toggle A-B Loop"
                                >
                                    <Repeat size={24} />
                                </button>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">Playback Speed (Tempo)</span>
                                        <span className="text-sm font-bold text-indigo-600">{Math.round(tempo * 100)}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min={0.5} 
                                        max={1.5} 
                                        step={0.01} 
                                        value={tempo} 
                                        onChange={e => setTempo(parseFloat(e.target.value))}
                                        className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Pitch is automatically preserved when slowing down.</p>
                                </div>
                                
                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm font-medium text-gray-700">A-B Looping</span>
                                        {isLooping && (
                                            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold animate-pulse">Looping Active</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => {
                                                    setLoopA(currentTime);
                                                    if (loopB === null || currentTime >= loopB) setLoopB(duration);
                                                    setIsLooping(true);
                                                }}
                                                className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 w-28 whitespace-nowrap"
                                            >
                                                Set Point A
                                            </button>
                                            <input 
                                                type="number"
                                                min={0}
                                                step={0.001}
                                                value={loopA !== null ? loopA.toFixed(3) : ''}
                                                placeholder="e.g. 1.250"
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    if (!isNaN(val)) {
                                                        setLoopA(val);
                                                        setIsLooping(true);
                                                    }
                                                }}
                                                className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                                            />
                                            <span className="text-xs text-gray-500 w-8">sec</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => {
                                                    setLoopB(currentTime);
                                                    if (loopA === null || currentTime <= loopA) setLoopA(0);
                                                    setIsLooping(true);
                                                }}
                                                className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 w-28 whitespace-nowrap"
                                            >
                                                Set Point B
                                            </button>
                                            <input 
                                                type="number"
                                                min={0}
                                                step={0.001}
                                                value={loopB !== null ? loopB.toFixed(3) : ''}
                                                placeholder="e.g. 10.500"
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    if (!isNaN(val)) {
                                                        setLoopB(val);
                                                        setIsLooping(true);
                                                    }
                                                }}
                                                className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                                            />
                                            <span className="text-xs text-gray-500 w-8">sec</span>
                                        </div>
                                        
                                        <button 
                                            onClick={() => { setLoopA(null); setLoopB(null); setIsLooping(false); }}
                                            className="w-full mt-2 px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition font-medium border border-red-100"
                                        >
                                            Clear Loop Region
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3 text-center">
                                        You can also drag directly on the waveform to create and adjust the loop region!
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                            <Repeat size={48} className="mb-4 opacity-50" />
                            <p>Select a track to start jamming</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

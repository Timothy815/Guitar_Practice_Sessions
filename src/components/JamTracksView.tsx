import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, Repeat, FolderOpen } from 'lucide-react';

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

    const audioRef = useRef<HTMLAudioElement | null>(null);
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

    const selectTrack = async (file: AudioFile) => {
        try {
            const f = await file.handle.getFile();
            const url = URL.createObjectURL(f);
            
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = url;
                audioRef.current.load();
                setCurrentTrack(file);
                setIsPlaying(false);
                setLoopA(null);
                setLoopB(null);
                setIsLooping(false);
            }
        } catch (e) {
            console.error("Failed to load audio file", e);
        }
    };

    useEffect(() => {
        if (!audioRef.current) {
            const audio = new Audio();
            audio.preservesPitch = true; 
            
            audio.addEventListener('loadedmetadata', () => {
                setDuration(audio.duration);
            });
            audio.addEventListener('timeupdate', () => {
                setCurrentTime(audio.currentTime);
            });
            audio.addEventListener('ended', () => {
                setIsPlaying(false);
            });
            audioRef.current = audio;
        }
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        };
    }, []);

    // A-B Loop Logic
    useEffect(() => {
        const checkLoop = () => {
            if (audioRef.current && isLooping && loopA !== null && loopB !== null && loopB > loopA) {
                if (audioRef.current.currentTime >= loopB) {
                    audioRef.current.currentTime = loopA;
                }
            }
            reqRef.current = requestAnimationFrame(checkLoop);
        };
        reqRef.current = requestAnimationFrame(checkLoop);
        
        return () => cancelAnimationFrame(reqRef.current);
    }, [isLooping, loopA, loopB]);

    // Handle Playback Rate
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = tempo;
        }
    }, [tempo]);

    const togglePlay = () => {
        if (!audioRef.current || !currentTrack) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(e => console.error(e));
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const time = parseFloat(e.target.value);
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-800">{currentTrack.name}</h3>
                            </div>
                            
                            <div className="flex flex-col space-y-2">
                                <input 
                                    type="range" 
                                    min={0} 
                                    max={duration || 100} 
                                    value={currentTime} 
                                    onChange={handleSeek}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-500 font-medium">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            <div className="flex justify-center items-center space-x-6">
                                <button 
                                    onClick={() => {
                                        if (audioRef.current) audioRef.current.currentTime = 0;
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
                                    className={`p-3 rounded-full transition ${isLooping ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}
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
                                    <span className="text-sm font-medium text-gray-700 block mb-2">A-B Looping</span>
                                    <div className="flex items-center space-x-4">
                                        <button 
                                            onClick={() => setLoopA(currentTime)}
                                            className="flex-1 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Set Point A: {loopA !== null ? formatTime(loopA) : '--:--'}
                                        </button>
                                        <button 
                                            onClick={() => setLoopB(currentTime)}
                                            className="flex-1 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Set Point B: {loopB !== null ? formatTime(loopB) : '--:--'}
                                        </button>
                                        <button 
                                            onClick={() => { setLoopA(null); setLoopB(null); setIsLooping(false); }}
                                            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    {isLooping && loopA !== null && loopB !== null && loopB > loopA && (
                                        <p className="text-xs text-indigo-600 font-medium mt-2 text-center">
                                            Currently looping from {formatTime(loopA)} to {formatTime(loopB)}
                                        </p>
                                    )}
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

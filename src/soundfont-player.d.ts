declare module 'soundfont-player' {
    export interface PlayerOptions {
        soundfont?: 'MusyngKite' | 'FluidR3_GM';
        format?: 'mp3' | 'ogg';
        destination?: AudioNode;
        notes?: number[];
        nameToUrl?: (name: string, soundfont: string, format: string) => string;
    }

    export interface PlayOptions {
        duration?: number;
        gain?: number;
        attack?: number;
        decay?: number;
        sustain?: number;
        release?: number;
    }

    export interface Player {
        play(note: string | number, time?: number, options?: PlayOptions): void;
        stop(time?: number): void;
    }

    export function instrument(
        ac: AudioContext,
        name: string,
        options?: PlayerOptions
    ): Promise<Player>;
}

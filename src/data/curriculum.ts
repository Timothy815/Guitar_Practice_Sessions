import type { ScaleFamily, ScaleQuality } from './musicEngine';

export interface CurriculumConfig {
    key: string;
    quality: ScaleQuality;
    family: ScaleFamily;
    shapeId: number;
    dayOfWeek?: string;
}

export interface CurriculumModule {
    id: string;
    title: string;
    description: string;
    config: CurriculumConfig;
}

export interface CurriculumLevel {
    id: string;
    title: string;
    description: string;
    modules: CurriculumModule[];
}

export const CURRICULUM: CurriculumLevel[] = [
    {
        id: "level-1",
        title: "Level 1: The Pentatonic Foundations",
        description: "Master the most iconic scale shapes in modern guitar history. Start with the essential Minor and Major Pentatonic box shapes.",
        modules: [
            {
                id: "l1-m1",
                title: "A Minor Pentatonic (Position 1)",
                description: "The classic rock and blues box. If there is one scale you must know, it's this one.",
                config: { key: 'A', quality: 'Minor', family: 'Pentatonic', shapeId: 1, dayOfWeek: 'Monday' }
            },
            {
                id: "l1-m2",
                title: "A Minor Pentatonic (Position 2)",
                description: "Extend your playing up the neck by connecting into Position 2.",
                config: { key: 'A', quality: 'Minor', family: 'Pentatonic', shapeId: 2, dayOfWeek: 'Tuesday' }
            },
            {
                id: "l1-m3",
                title: "C Major Pentatonic (Position 1)",
                description: "Shift gears to Major. Notice how C Major uses the exact same notes as A Minor, just starting from a different root!",
                config: { key: 'C', quality: 'Major', family: 'Pentatonic', shapeId: 1, dayOfWeek: 'Wednesday' }
            },
            {
                id: "l1-m4",
                title: "E Minor Pentatonic (Open Position)",
                description: "Play the Position 1 shape utilizing open strings. Essential for acoustic blues and heavy metal riffs.",
                config: { key: 'E', quality: 'Minor', family: 'Pentatonic', shapeId: 1, dayOfWeek: 'Thursday' }
            }
        ]
    },
    {
        id: "level-2",
        title: "Level 2: Introducing the Blues",
        description: "Add the 'Blue Note' (the b5 or #4) to inject instant soul and tension into your playing.",
        modules: [
            {
                id: "l2-m1",
                title: "A Minor Blues (Position 1)",
                description: "The standard minor pentatonic, but with added dissonance. Focus on the hammer-ons.",
                config: { key: 'A', quality: 'Minor', family: 'Blues', shapeId: 1, dayOfWeek: 'Tuesday' }
            },
            {
                id: "l2-m2",
                title: "A Minor Blues (Position 5)",
                description: "Play the blues down by the nut. The 'Albert King' box.",
                config: { key: 'A', quality: 'Minor', family: 'Blues', shapeId: 5, dayOfWeek: 'Friday' }
            },
            {
                id: "l2-m3",
                title: "E Major Blues (Position 1)",
                description: "Sweet, southern rock style blues. The interplay between the minor third and major third is key here.",
                config: { key: 'E', quality: 'Major', family: 'Blues', shapeId: 1, dayOfWeek: 'Monday' }
            }
        ]
    },
    {
        id: "level-3",
        title: "Level 3: Full Diatonic Freedom",
        description: "Move beyond 5-note scales. The full 7-note Major (Ionian) and Minor (Aeolian) scales unlock complex melodies.",
        modules: [
            {
                id: "l3-m1",
                title: "G Major Scale (Position 1)",
                description: "The classic 3-note-per-string G Major shape. Perfect for building speed and shredding.",
                config: { key: 'G', quality: 'Major', family: 'Diatonic', shapeId: 1, dayOfWeek: 'Thursday' }
            },
            {
                id: "l3-m2",
                title: "A Natural Minor (Position 1)",
                description: "The Aeolian mode. Use this for neoclassical runs, heavy metal, and sad ballads.",
                config: { key: 'A', quality: 'Minor', family: 'Diatonic', shapeId: 1, dayOfWeek: 'Wednesday' }
            },
            {
                id: "l3-m3",
                title: "C Major Scale (Position 2)",
                description: "Moving up the neck in C Major. Focus on the half-step intervals between E-F and B-C.",
                config: { key: 'C', quality: 'Major', family: 'Diatonic', shapeId: 2, dayOfWeek: 'Friday' }
            }
        ]
    }
];

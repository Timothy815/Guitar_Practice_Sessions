const track = {
  notes: [
    { ticks: 0, durationTicks: 480, midi: 60 },
    { ticks: 240, durationTicks: 240, midi: 62 }, // Overlapping note
    { ticks: 960, durationTicks: 240, midi: 64 }  // Gap of 480 ticks before this note
  ]
};
const ppq = 480;

const pattern = [];
let currentTick = 0;

const ticksToDur = (ticks, isRest = false) => {
    let dur = "8";
    if (ticks >= ppq * 3.5) dur = "w";
    else if (ticks >= ppq * 1.5) dur = "h";
    else if (ticks >= ppq * 0.75) dur = "q";
    else if (ticks >= ppq * 0.375) dur = "8";
    else dur = "16";
    return isRest ? dur + "r" : dur;
};

// Filter out chord notes (notes that start at the exact same tick)
// Only keep the highest note of a chord
const monophonicNotes = [];
track.notes.forEach(note => {
    if (monophonicNotes.length > 0 && monophonicNotes[monophonicNotes.length - 1].ticks === note.ticks) {
        // Chord note, keep the highest pitch
        if (note.midi > monophonicNotes[monophonicNotes.length - 1].midi) {
            monophonicNotes[monophonicNotes.length - 1] = note;
        }
    } else {
        monophonicNotes.push(note);
    }
});

monophonicNotes.forEach((note, i) => {
    // Determine the step to the next note (or use the note's own duration if it's the last one)
    const nextNote = monophonicNotes[i + 1];
    const stepTicks = nextNote ? (nextNote.ticks - note.ticks) : note.durationTicks;
    
    // Check if there was a rest BEFORE this note
    const gap = note.ticks - currentTick;
    if (gap >= ppq * 0.25) { 
        pattern.push({ idx: -1, dur: ticksToDur(gap, true) });
    }

    // Determine the duration we will write for THIS note
    // If the step to the next note is smaller than the note's actual duration (legato/overlap),
    // we truncate the note's duration to the step so it doesn't shift the whole sequence.
    const writtenDurTicks = Math.min(note.durationTicks, stepTicks);
    
    pattern.push({ idx: note.midi, dur: ticksToDur(writtenDurTicks) });
    
    // Update current tick to where THIS note officially ends
    currentTick = note.ticks + writtenDurTicks;
});

console.log(pattern);

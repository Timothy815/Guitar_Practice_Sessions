const routineData = [
    {
        title: "1. Warmup and synchronization",
        duration: 300,
        content: `
            <p>Begin slowly enough that every note is deliberate.</p>
            <h3>Spider walk (1-2-3-4)</h3>
            <p>Continue across all six strings and return using strict alternate picking (Down-Up-Down-Up).</p>
            <pre>e|-------------------------1-2-3-4-|
B|-----------------1-2-3-4---------|
G|---------1-2-3-4-----------------|
D|-1-2-3-4-------------------------|
A|---------------------------------|
E|---------------------------------|</pre>
            <p><strong>Focus on:</strong> fingertips close to the strings, relaxed thumb and wrist, clean separation between notes, no extra finger movement, consistent pick depth.</p>
        `
    },
    {
        title: "2. Position review",
        duration: 300,
        content: `
            <p>Practice each pentatonic position, but only briefly.</p>
            <ul>
                <li>Ascend once, descend once</li>
                <li>Ascend and descend without stopping</li>
                <li>Begin on a different string</li>
                <li>Begin with an upstroke occasionally</li>
            </ul>
            <p>Do not always start from the lowest note. Break the idea that the scale has one entrance and one exit.</p>
            <pre>G|-5-7-|
B|-----5-8-|
e|---------5-8-5-|</pre>
        `
    },
    {
        title: "3. Sequence exercises",
        duration: 300,
        content: `
            <p><strong>Focus: Groups of Three (1-2-3, 2-3-4, 3-4-5)</strong></p>
            <p>Play three notes, then begin again from the second note. On the fretboard, the sound becomes less predictable than simply moving upward.</p>
            <p><strong>Other options for future:</strong></p>
            <ul>
                <li>Up two, back one (1-2-1-3, 2-3-2-4)</li>
                <li>Skip one note (1-3, 2-4, 3-5)</li>
            </ul>
        `
    },
    {
        title: "4. Rhythm exercises",
        duration: 300,
        content: `
            <p>Rhythm is one of the best defenses against noodling. Choose only three or four notes and play them using a specific rhythmic rule.</p>
            <p>For example, play A - C - D as:</p>
            <ul>
                <li>quarter notes</li>
                <li>eighth notes</li>
                <li>triplets</li>
                <li>syncopated accents</li>
            </ul>
            <pre>1 & 2 & 3 & 4 &
A   C D   A C</pre>
            <p>This teaches an important lesson: a tiny number of notes can sound musical when the rhythm has shape.</p>
        `
    },
    {
        title: "5. Technique-of-the-day",
        duration: 300,
        dynamicContent: true, // Will be filled based on the day of the week
        content: ""
    },
    {
        title: "6. Controlled improvisation",
        duration: 300,
        content: `
            <p>Improvisation does not have to mean unstructured noodling. Give each improvisation round a rule.</p>
            <h3>Rules for today:</h3>
            <ul>
                <li><strong>Round 1:</strong> Three-note solo (e.g. A C D) using rhythm, repetition, rests.</li>
                <li><strong>Round 2:</strong> One string only (think horizontally).</li>
                <li><strong>Round 3:</strong> Repeat and modify (play a phrase, repeat it with exactly one change).</li>
            </ul>
            <p>The deeper goal is to gradually shift from: "What notes are in this shape?" to: "What musical idea can I express using these notes?"</p>
        `
    }
];

const techniques = {
    "Monday": { name: "Slides", desc: "Practice sliding into and out of notes to connect positions." },
    "Tuesday": { name: "Hammer-ons", desc: "Focus on clean, rhythmic hammer-ons without picking the second note." },
    "Wednesday": { name: "Pull-offs", desc: "Ensure your pull-offs have enough snap to maintain volume." },
    "Thursday": { name: "Bends", desc: "Practice reaching a specific target pitch rather than merely pushing the string upward. First play the target note, then bend to match it." },
    "Friday": { name: "Vibrato", desc: "Focus on even, rhythmic vibrato. Try matching it to the tempo." },
    "Saturday": { name: "Mixed phrasing", desc: "Combine slides, hammer-ons, and bends into single fluid phrases." },
    "Sunday": { name: "Review or free play", desc: "Combine techniques naturally, or review what felt weakest this week." }
};

let currentStepIndex = 0;
let timeRemaining = routineData[0].duration;
let timerInterval = null;
let isPlaying = false;

// DOM Elements
const timelineEl = document.getElementById('timeline');
const titleEl = document.getElementById('current-title');
const contentEl = document.getElementById('current-content');
const timerEl = document.getElementById('timer');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const playBtn = document.getElementById('play-pause-btn');
const daySelect = document.getElementById('day-select');
const printBtn = document.getElementById('print-btn');
const printContainer = document.getElementById('print-routine-container');

function init() {
    // Set default day to today
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    daySelect.value = today;

    buildTimeline();
    updateView();

    // Event Listeners
    prevBtn.addEventListener('click', () => changeStep(-1));
    nextBtn.addEventListener('click', () => changeStep(1));
    playBtn.addEventListener('click', toggleTimer);
    daySelect.addEventListener('change', updateView);
    printBtn.addEventListener('click', handlePrint);
}

function buildTimeline() {
    timelineEl.innerHTML = '';
    routineData.forEach((step, index) => {
        const div = document.createElement('div');
        div.className = `timeline-item ${index === currentStepIndex ? 'active' : ''}`;
        div.innerHTML = `
            <h3>${step.title.split('.')[1].trim()}</h3>
            <span>5:00</span>
        `;
        div.addEventListener('click', () => {
            currentStepIndex = index;
            resetTimer();
            updateView();
        });
        timelineEl.appendChild(div);
    });
}

function getTechniqueContent() {
    const day = daySelect.value;
    const tech = techniques[day];
    return `
        <h3>${tech.name}</h3>
        <p>${tech.desc}</p>
        <p>Choose one expressive device rather than trying to practice everything at once.</p>
    `;
}

function updateView() {
    const step = routineData[currentStepIndex];
    titleEl.textContent = step.title;
    
    if (step.dynamicContent) {
        contentEl.innerHTML = getTechniqueContent();
    } else {
        contentEl.innerHTML = step.content;
    }

    // Update timeline highlight
    Array.from(timelineEl.children).forEach((child, idx) => {
        child.className = `timeline-item ${idx === currentStepIndex ? 'active' : ''}`;
    });

    // Update buttons
    prevBtn.disabled = currentStepIndex === 0;
    nextBtn.disabled = currentStepIndex === routineData.length - 1;
    
    if (!isPlaying) {
        updateTimerDisplay();
    }
}

function toggleTimer() {
    if (isPlaying) {
        clearInterval(timerInterval);
        playBtn.textContent = 'Start';
        playBtn.classList.replace('primary', 'outline');
    } else {
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();
            
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                playBtn.textContent = 'Start';
                // Auto advance if not last step
                if (currentStepIndex < routineData.length - 1) {
                    changeStep(1);
                } else {
                    isPlaying = false;
                }
            }
        }, 1000);
        playBtn.textContent = 'Pause';
        playBtn.classList.replace('outline', 'primary');
    }
    isPlaying = !isPlaying;
}

function resetTimer() {
    timeRemaining = routineData[currentStepIndex].duration;
    if (isPlaying) {
        toggleTimer();
    }
    updateTimerDisplay();
}

function changeStep(direction) {
    currentStepIndex += direction;
    resetTimer();
    updateView();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function handlePrint() {
    // Generate full routine HTML for printing
    let printHTML = '';
    routineData.forEach((step, index) => {
        let content = step.dynamicContent ? getTechniqueContent() : step.content;
        printHTML += `
            <div class="print-section">
                <h2>${step.title}</h2>
                ${content}
            </div>
        `;
    });
    printContainer.innerHTML = printHTML;
    window.print();
}

init();

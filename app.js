// Minimal 6-pad drum machine (Tone.js)
// Pads 1-4: synth drums
// Pads 5-6: optional user-uploaded samples
// Click pads or press keys 1-6

let started = false;

// -------- Audio chain (delete reverb/filter if you want even simpler)
const bus = new Tone.Gain(0.9);
bus.chain(Tone.Destination);

// -------- Drums (simple)
const kick = new Tone.MembraneSynth({
    envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.05 },
}).connect(bus);

const snare = new Tone.NoiseSynth({
    envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
}).connect(bus);

const hatClosed = new Tone.MetalSynth({
    frequency: 300,
    envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 3500,
    octaves: 1.5,
}).connect(bus);

const hatOpen = new Tone.MetalSynth({
    frequency: 260,
    envelope: { attack: 0.001, decay: 0.2, release: 0.08 },
    harmonicity: 4.7,
    modulationIndex: 24,
    resonance: 2500,
    octaves: 1.2,
}).connect(bus);

// Default sounds for pads 5-6 until upload
const sampleA = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.12 },
}).connect(bus);

const sampleB = new Tone.MembraneSynth({
    pitchDecay: .05,
    octaves: 6,
    oscillator: { type: "sine" },
    envelope: { 
        attack: 0.001, 
        decay: 0.9, 
        sustain: 0, 
        release: 0.8 },
}).connect(bus);

let player5 = null;
let player6 = null;

// -------- DOM
const padsEl = document.getElementById("pads");
const padEls = [...padsEl.querySelectorAll(".pad")];

const upload5 = document.getElementById("upload5");
const upload6 = document.getElementById("upload6");
const meta5 = document.getElementById("meta5");
const meta6 = document.getElementById("meta6");

const stopBtn = document.getElementById("stopBtn");

// -------- helpers
function flashPad(padIndex) {
    const el = padEls.find((p) => Number(p.dataset.pad) === padIndex);
    if (!el) return;
    el.classList.add("active");
    setTimeout(() => el.classList.remove("active"), 120);
}

async function ensureAudioStarted() {
    if (started) return;
    await Tone.start();
    started = true;
}

// -------- main trigger
async function triggerPad(padIndex) {
    await ensureAudioStarted();
    flashPad(padIndex);

    switch (padIndex) {
        case 1:
            kick.triggerAttackRelease("C1", "8n");
            break;
        case 2:
            snare.triggerAttackRelease("16n");
            break;
        case 3:
            hatClosed.triggerAttackRelease("16n");
            break;
        case 4:
            hatOpen.triggerAttackRelease("8n");
            break;
        case 5:
            if (player5) player5.start();
            else sampleA.triggerAttackRelease("E5", "16n");
            break;
        case 6:
            if (player6) player6.start();
            else sampleB.triggerAttackRelease("C1", "8n");
            break;
    }
}

// -------- click pads
padsEl.addEventListener("click", (e) => {
    const pad = e.target.closest(".pad");
    if (!pad) return;
    triggerPad(Number(pad.dataset.pad));
});

// -------- keys 1-6
document.addEventListener("keydown", (e) => {
    const map = {
        Digit1: 1,
        Digit2: 2,
        Digit3: 3,
        Digit4: 4,
        Digit5: 5,
        Digit6: 6,
    };
    const padIndex = map[e.code];
    if (!padIndex) return;
    e.preventDefault();
    triggerPad(padIndex);
});

// -------- uploads
async function loadPlayerFromFile(file) {
    await ensureAudioStarted();
    const url = URL.createObjectURL(file);
    const p = new Tone.Player({ url, autostart: false }).connect(bus);
    await p.load(url);
    return p;
}

upload5?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (player5) {
        player5.stop();
        player5.dispose();
    }
    player5 = await loadPlayerFromFile(file);
    if (meta5) meta5.textContent = `Loaded: ${file.name}`;
});

upload6?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (player6) {
        player6.stop();
        player6.dispose();
    }
    player6 = await loadPlayerFromFile(file);
    if (meta6) meta6.textContent = `Loaded: ${file.name}`;
});

// -------- panic
stopBtn?.addEventListener("click", () => {
    if (player5) player5.stop();
    if (player6) player6.stop();
    Tone.Transport.stop();
    Tone.Transport.cancel(0);
});
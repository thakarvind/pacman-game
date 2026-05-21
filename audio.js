class PacAudio {
    constructor() {
        this.ctx = null;
        this.masterVolume = null;
        this.muted = false;
        this.currentSiren = null;
        this.sirenOsc = null;
        this.sirenGain = null;
        
        // Intro song notes: [freq, duration in seconds]
        // Classic melody
        this.introNotes = [
            [493.88, 0.1], [987.77, 0.1], [739.99, 0.1], [622.25, 0.1], [987.77, 0.05], [739.99, 0.1], [622.25, 0.15],
            [0, 0.05], // rest
            [523.25, 0.1], [1046.50, 0.1], [783.99, 0.1], [659.25, 0.1], [1046.50, 0.05], [783.99, 0.1], [659.25, 0.15],
            [0, 0.05], // rest
            [493.88, 0.1], [987.77, 0.1], [739.99, 0.1], [622.25, 0.1], [987.77, 0.05], [739.99, 0.1], [622.25, 0.15],
            [0, 0.05], // rest
            [622.25, 0.05], [659.25, 0.05], [698.46, 0.05], [739.99, 0.05], [783.99, 0.05], [830.61, 0.05], [880.00, 0.05], [987.77, 0.15]
        ];

        this.chompTimer = 0;
        this.chompToggle = false;
    }

    init() {
        if (this.ctx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterVolume = this.ctx.createGain();
            this.masterVolume.gain.setValueAtTime(this.muted ? 0 : 0.25, this.ctx.currentTime);
            this.masterVolume.connect(this.ctx.destination);
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    }

    setMute(isMuted) {
        this.muted = isMuted;
        if (this.masterVolume && this.ctx) {
            this.masterVolume.gain.setValueAtTime(isMuted ? 0 : 0.25, this.ctx.currentTime);
        }
    }

    playChomp() {
        this.init();
        if (this.muted || !this.ctx) return;
        
        // Prevent spamming chomps too close together
        const now = this.ctx.currentTime;
        if (now - this.chompTimer < 0.08) return;
        this.chompTimer = now;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        
        // Alternate high and low chomp frequency to create 'waka waka'
        const baseFreq = this.chompToggle ? 440 : 250;
        this.chompToggle = !this.chompToggle;

        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.06);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    playEatGhost() {
        this.init();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const duration = 0.5;

        // Custom pitch rising siren sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + duration);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.start(now);
        osc.stop(now + duration);
    }

    playDeath() {
        this.init();
        if (this.muted || !this.ctx) return;

        this.stopSiren();
        const now = this.ctx.currentTime;

        // Death consists of repeated downward pitch sweeps
        let timeOffset = 0;
        for (let i = 0; i < 11; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            const startFreq = 800 - i * 65;
            const endFreq = 200 - i * 15;
            const stepDuration = 0.12;

            osc.frequency.setValueAtTime(startFreq, now + timeOffset);
            osc.frequency.linearRampToValueAtTime(endFreq, now + timeOffset + stepDuration);

            gain.gain.setValueAtTime(0.35, now + timeOffset);
            gain.gain.linearRampToValueAtTime(0.01, now + timeOffset + stepDuration);

            osc.connect(gain);
            gain.connect(this.masterVolume);

            osc.start(now + timeOffset);
            osc.stop(now + timeOffset + stepDuration);

            timeOffset += stepDuration;
        }

        // Final thud sound
        const oscThud = this.ctx.createOscillator();
        const gainThud = this.ctx.createGain();
        oscThud.type = 'sine';
        oscThud.frequency.setValueAtTime(100, now + timeOffset);
        oscThud.frequency.exponentialRampToValueAtTime(20, now + timeOffset + 0.3);
        
        gainThud.gain.setValueAtTime(0.4, now + timeOffset);
        gainThud.gain.exponentialRampToValueAtTime(0.01, now + timeOffset + 0.3);

        oscThud.connect(gainThud);
        gainThud.connect(this.masterVolume);

        oscThud.start(now + timeOffset);
        oscThud.stop(now + timeOffset + 0.3);
    }

    playStartTheme(onComplete) {
        this.init();
        if (!this.ctx) {
            if (onComplete) onComplete();
            return;
        }

        // Ensure audio context is running (can be suspended by browser autoplay policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        this.stopSiren();
        const now = this.ctx.currentTime;
        let timeOffset = 0;

        this.introNotes.forEach(([freq, duration]) => {
            if (freq > 0 && !this.muted) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                // Mix square and triangle for retro vibe
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, now + timeOffset);

                gain.gain.setValueAtTime(0.18, now + timeOffset);
                gain.gain.linearRampToValueAtTime(0.18, now + timeOffset + duration - 0.01);
                gain.gain.linearRampToValueAtTime(0.001, now + timeOffset + duration);

                osc.connect(gain);
                gain.connect(this.masterVolume);

                osc.start(now + timeOffset);
                osc.stop(now + timeOffset + duration);
            }
            timeOffset += duration;
        });

        // Trigger callback after the intro completes
        if (onComplete) {
            setTimeout(onComplete, timeOffset * 1000);
        }
    }

    startSiren(type = 'siren1') {
        this.init();
        if (this.muted || !this.ctx) return;
        if (this.currentSiren === type) return;

        this.stopSiren();
        this.currentSiren = type;

        const now = this.ctx.currentTime;
        
        this.sirenOsc = this.ctx.createOscillator();
        this.sirenGain = this.ctx.createGain();
        this.sirenOsc.type = 'triangle';

        let baseFreq = 250;
        let sweepRange = 100;
        let rate = 3; // Hz of modulation

        if (type === 'siren1') { baseFreq = 280; sweepRange = 100; rate = 2.5; }
        else if (type === 'siren2') { baseFreq = 340; sweepRange = 120; rate = 3.0; }
        else if (type === 'siren3') { baseFreq = 400; sweepRange = 140; rate = 3.5; }
        else if (type === 'siren4') { baseFreq = 460; sweepRange = 160; rate = 4.0; }
        else if (type === 'siren5') { baseFreq = 520; sweepRange = 180; rate = 4.5; }
        else if (type === 'frightened') { baseFreq = 180; sweepRange = 60; rate = 1.8; }
        else if (type === 'eaten') { baseFreq = 600; sweepRange = 250; rate = 6.0; }

        this.sirenOsc.frequency.setValueAtTime(baseFreq, now);

        // LFO (Low Frequency Oscillator) to modulate the siren pitch
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();

        lfo.frequency.setValueAtTime(rate, now);
        lfoGain.gain.setValueAtTime(sweepRange, now);

        lfo.connect(lfoGain);
        lfoGain.connect(this.sirenOsc.frequency);

        this.sirenGain.gain.setValueAtTime(0.08, now);

        this.sirenOsc.connect(this.sirenGain);
        this.sirenGain.connect(this.masterVolume);

        lfo.start(now);
        this.sirenOsc.start(now);

        // Store reference to close LFO as well
        this.activeLfo = lfo;
    }

    stopSiren() {
        if (this.sirenOsc) {
            try {
                this.sirenOsc.stop();
                this.sirenOsc.disconnect();
                if (this.activeLfo) {
                    this.activeLfo.stop();
                    this.activeLfo.disconnect();
                }
                if (this.sirenGain) {
                    this.sirenGain.disconnect();
                }
            } catch (e) {
                // Ignore if already stopped
            }
            this.sirenOsc = null;
            this.sirenGain = null;
            this.activeLfo = null;
        }
        this.currentSiren = null;
    }
}

// Global Sound Instance
const gameAudio = new PacAudio();

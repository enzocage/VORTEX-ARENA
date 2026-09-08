// Quake 3 Arena Web Audio Engine
// Fully standalone synthesized Quake 3 sound effects & speech announcer

class QuakeAudio {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.voiceGain = null;
        this.initialized = false;
        this.lastHitDing = 0;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.8;
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.75;
            this.sfxGain.connect(this.masterGain);

            this.voiceGain = this.ctx.createGain();
            this.voiceGain.gain.value = 0.9;
            this.voiceGain.connect(this.masterGain);

            this.initialized = true;
        } catch (e) {
            console.warn("AudioContext failed to initialize:", e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Classic Quake Hit Ding (bell chime on hitting enemy)
    playHitDing() {
        if (!this.initialized) return;
        const now = performance.now();
        if (now - this.lastHitDing < 40) return; // limit ding spam
        this.lastHitDing = now;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1300, t);
        osc.frequency.exponentialRampToValueAtTime(1450, t + 0.08);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.12);
    }

    // Jump Grunt & Jump Pad
    playJump() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.12);
    }

    // Quake 3 Jump Pad Whoosh
    playJumpPad() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(650, t + 0.28);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, t);
        filter.frequency.exponentialRampToValueAtTime(1200, t + 0.28);
        filter.Q.value = 3.0;

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.35);
    }

    // Teleport sound
    playTeleport() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, t);
        osc.frequency.exponentialRampToValueAtTime(900, t + 0.15);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.35);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.35);
    }

    // Item Pickup (Health, Ammo, Weapon)
    playPickup(type = 'health') {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;

        const notes = type === 'armor' ? [330, 440, 554] : (type === 'weapon' ? [220, 330, 440, 660] : [523, 659, 783]);
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startT = t + idx * 0.04;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startT);

            gain.gain.setValueAtTime(0.25, startT);
            gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.16);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(startT);
            osc.stop(startT + 0.16);
        });
    }

    // Quad Damage pickup sound
    playQuadPickup() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(240, t + 0.5);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.6);

        this.announce("Quad Damage!");
    }

    // Pain and Death Sounds
    playPain(isFatal = false) {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        if (isFatal) {
            osc.frequency.setValueAtTime(180, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + 0.45);
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
        } else {
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(90, t + 0.15);
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        }

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + (isFatal ? 0.45 : 0.15));
    }

    // 3D Positional Audio Player (Stereo spatial sound)
    playPositional(soundFunc, sourcePos, listenerPos, maxDist = 45) {
        if (!this.initialized || !this.ctx) return;
        const dist = sourcePos.distanceTo(listenerPos);
        if (dist > maxDist) return;

        // Simple spatial volume & pan approximation
        const panNode = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
        const gainNode = this.ctx.createGain();

        // Volume falloff
        const vol = Math.max(0, 1.0 - (dist / maxDist));
        gainNode.gain.value = vol;

        // Stereo pan based on relative angle
        if (panNode) {
            const dx = sourcePos.x - listenerPos.x;
            const pan = Math.max(-1, Math.min(1, dx / 20));
            panNode.pan.value = pan;
            gainNode.connect(panNode);
            panNode.connect(this.sfxGain);
        } else {
            gainNode.connect(this.sfxGain);
        }

        soundFunc(gainNode);
    }

    // Legendary BFG10K: High power energy charge & catastrophic blast
    playBFGFire() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.linearRampToValueAtTime(700, t + 0.35);

        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.linearRampToValueAtTime(3000, t + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.4);
    }

    // Weapons Sounds
    playWeaponFire(weaponId) {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;

        switch (weaponId) {
            case 1: // Gauntlet
                this.playGauntlet();
                break;
            case 2: // Machinegun
                this.playMachinegun();
                break;
            case 3: // Shotgun
                this.playShotgun();
                break;
            case 4: // Rocket Launcher
                this.playRocketLaunch();
                break;
            case 5: // Railgun
                this.playRailgun();
                break;
            case 6: // Plasma Gun
                this.playPlasmaGun();
                break;
            case 7: // BFG10K
                this.playBFGFire();
                break;
        }
    }

    playGauntlet() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(95, t);
        osc.frequency.linearRampToValueAtTime(140, t + 0.1);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    playMachinegun() {
        const t = this.ctx.currentTime;
        // White noise burst + punch
        const bufferSize = this.ctx.sampleRate * 0.07;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800;
        filter.Q.value = 2;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(t);

        // Low pop
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.05);
        oscGain.gain.setValueAtTime(0.35, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.05);
    }

    playShotgun() {
        const t = this.ctx.currentTime;
        // Heavy boom
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);
        oscGain.gain.setValueAtTime(0.6, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.25);

        // Noise crackle
        const bufferSize = this.ctx.sampleRate * 0.18;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
        noise.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(t);
    }

    playRocketLaunch() {
        const t = this.ctx.currentTime;
        // Ignition whistle + thrust
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.linearRampToValueAtTime(320, t + 0.2);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.22);
    }

    playExplosion() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        // Deep bass rumble
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(25, t + 0.5);
        oscGain.gain.setValueAtTime(0.7, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.5);

        // Debris noise
        const bufferSize = this.ctx.sampleRate * 0.45;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(150, t + 0.4);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.6, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(t);
    }

    // Legendary Railgun: high-energy electric discharge + resonant hum
    playRailgun() {
        const t = this.ctx.currentTime;
        // Initial crack
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1800, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.35);

        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.4);

        // Resonant electric buzz
        const hum = this.ctx.createOscillator();
        const humGain = this.ctx.createGain();
        hum.type = 'sine';
        hum.frequency.setValueAtTime(440, t);
        hum.frequency.exponentialRampToValueAtTime(220, t + 0.6);
        humGain.gain.setValueAtTime(0.4, t);
        humGain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
        hum.connect(humGain);
        humGain.connect(this.sfxGain);
        hum.start(t);
        hum.stop(t + 0.6);
    }

    playPlasmaGun() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(480, t);
        osc.frequency.exponentialRampToValueAtTime(160, t + 0.08);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 4;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.08);
    }

    // Quake Announcer Voice
    announce(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95;
            utterance.pitch = 0.7; // Deep imposing voice
            utterance.volume = 1.0;
            const voices = window.speechSynthesis.getVoices();
            const engVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('David') || v.name.includes('Male') || v.name.includes('Natural') || v.name.includes('English')));
            if (engVoice) utterance.voice = engVoice;
            window.speechSynthesis.speak(utterance);
        }
    }
}

window.quakeAudio = new QuakeAudio();

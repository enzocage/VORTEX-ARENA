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

    // Water Splash & Submerge
    playWaterSplash() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.exponentialRampToValueAtTime(180, t + 0.25);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);
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
            osc.frequency.setValueAtTime(220, t);
            osc.frequency.exponentialRampToValueAtTime(35, t + 0.6);
            gain.gain.setValueAtTime(0.7, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
        } else {
            osc.frequency.setValueAtTime(160, t);
            osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
            gain.gain.setValueAtTime(0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        }

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + (isFatal ? 0.6 : 0.15));
    }

    // Gigantic Cataclysmic Death Explosion with Sub-Bass Shockwave and Tinnitus Ear Ringing
    playMassiveDeathExplosion() {
        if (!this.initialized || !this.ctx) return;
        const t = this.ctx.currentTime;

        // 1. Ultra Sub-Bass Shockwave (20Hz to 80Hz rumble that shakes speakers)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(140, t);
        subOsc.frequency.exponentialRampToValueAtTime(25, t + 1.8);
        subGain.gain.setValueAtTime(1.0, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

        subOsc.connect(subGain);
        subGain.connect(this.masterGain);
        subOsc.start(t);
        subOsc.stop(t + 2.2);

        // 2. High-energy explosion fireball crackle & roar (Noise Buffer)
        const bufferSize = Math.floor(this.ctx.sampleRate * 2.5);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // Decaying turbulent noise
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.8);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // Resonant lowpass filter sweep
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, t);
        filter.frequency.exponentialRampToValueAtTime(120, t + 1.6);
        filter.Q.value = 3.5;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.9, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.005, t + 2.4);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(t);

        // 3. Tinnitus Ear Ringing effect (High-pitch sine tone slowly fading)
        const ringOsc = this.ctx.createOscillator();
        const ringGain = this.ctx.createGain();
        ringOsc.type = 'sine';
        ringOsc.frequency.setValueAtTime(3200, t + 0.1);
        ringOsc.frequency.exponentialRampToValueAtTime(2800, t + 2.5);

        ringGain.gain.setValueAtTime(0.001, t);
        ringGain.gain.linearRampToValueAtTime(0.25, t + 0.15);
        ringGain.gain.exponentialRampToValueAtTime(0.001, t + 2.6);

        ringOsc.connect(ringGain);
        ringGain.connect(this.masterGain);
        ringOsc.start(t);
        ringOsc.stop(t + 2.6);

        // 4. Secondary Distant Detonations
        [0.18, 0.38, 0.65].forEach((delay, idx) => {
            const extraT = t + delay;
            const detOsc = this.ctx.createOscillator();
            const detGain = this.ctx.createGain();
            detOsc.type = 'triangle';
            detOsc.frequency.setValueAtTime(90 - idx * 15, extraT);
            detOsc.frequency.exponentialRampToValueAtTime(30, extraT + 0.5);

            detGain.gain.setValueAtTime(0.5 - idx * 0.1, extraT);
            detGain.gain.exponentialRampToValueAtTime(0.01, extraT + 0.6);

            detOsc.connect(detGain);
            detGain.connect(this.masterGain);
            detOsc.start(extraT);
            detOsc.stop(extraT + 0.6);
        });
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
        // Heavy multi-stage acoustic punch: low boom + mid mechanical crack + muzzle noise
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(32, t + 0.3);
        oscGain.gain.setValueAtTime(0.8, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.3);

        // Muzzle blast noise with high-impact bandpass
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.18));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, t);
        filter.frequency.exponentialRampToValueAtTime(350, t + 0.2);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.7, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(t);
    }

    playRocketLaunch() {
        const t = this.ctx.currentTime;
        // Rocket motor ignition whoosh + pressurized jet exhaust
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.linearRampToValueAtTime(420, t + 0.25);
        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.28);

        // Rocket booster thrust noise
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.28);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(650, t);
        filter.Q.value = 1.8;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.35, t);
        nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(t);
    }

    playExplosion() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        // Heavy bass detonation
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(28, t + 0.65);
        oscGain.gain.setValueAtTime(0.85, t);
        oscGain.gain.exponentialRampToValueAtTime(0.005, t + 0.7);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.7);

        // Debris & supersonic pressure wave
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.65);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.4);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.frequency.exponentialRampToValueAtTime(140, t + 0.55);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.8, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.65);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(t);
    }

    // Legendary Railgun: high-energy electric discharge + supersonic crack + resonant hum
    playRailgun() {
        const t = this.ctx.currentTime;
        // Supersonic sonic snap
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2400, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.38);

        gain.gain.setValueAtTime(0.85, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.42);

        // Resonant electric ionizing trail hum
        const hum = this.ctx.createOscillator();
        const humGain = this.ctx.createGain();
        hum.type = 'sine';
        hum.frequency.setValueAtTime(520, t);
        hum.frequency.exponentialRampToValueAtTime(180, t + 0.8);
        humGain.gain.setValueAtTime(0.5, t);
        humGain.gain.exponentialRampToValueAtTime(0.005, t + 0.8);
        hum.connect(humGain);
        humGain.connect(this.sfxGain);
        hum.start(t);
        hum.stop(t + 0.8);
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

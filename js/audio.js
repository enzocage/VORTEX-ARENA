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
            this.masterGain.gain.value = 0.85;

            // Aggressive Hard-Limiting Dynamics Compressor for raw, punchy sound
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
            this.compressor.knee.setValueAtTime(6, this.ctx.currentTime);
            this.compressor.ratio.setValueAtTime(10, this.ctx.currentTime);
            this.compressor.attack.setValueAtTime(0.002, this.ctx.currentTime);
            this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

            // Raw Overdrive Distortion Node for gritty, crunchy arena explosions & weapons
            this.distortion = this.ctx.createWaveShaper();
            this.distortion.curve = this.makeDistortionCurve(18);
            this.distortion.oversample = '2x';

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.9;

            this.voiceGain = this.ctx.createGain();
            this.voiceGain.gain.value = 0.95;

            // Signal routing: SFX -> Distortion -> Compressor -> Master -> Destination
            this.sfxGain.connect(this.distortion);
            this.distortion.connect(this.compressor);
            this.voiceGain.connect(this.compressor);
            this.compressor.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);

            this.initialized = true;
        } catch (e) {
            console.warn("AudioContext failed to initialize:", e);
        }
    }

    makeDistortionCurve(amount = 20) {
        const k = typeof amount === 'number' ? amount : 20;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
        return curve;
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
    // Legendary BFG10K: Apocalypse-level bio-mechanical doom cannon
    playBFGFire() {
        const t = this.ctx.currentTime;
        // Heavy oscillating charge sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.38);

        gain.gain.setValueAtTime(0.85, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, t);
        filter.frequency.exponentialRampToValueAtTime(4500, t + 0.38);
        filter.Q.value = 5.0;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.45);

        // Sub-bass detonation boom
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'triangle';
        sub.frequency.setValueAtTime(110, t + 0.05);
        sub.frequency.exponentialRampToValueAtTime(25, t + 0.55);
        subGain.gain.setValueAtTime(0.9, t + 0.05);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        sub.connect(subGain);
        subGain.connect(this.sfxGain);
        sub.start(t + 0.05);
        sub.stop(t + 0.55);
    }

    // Weapons Sounds
    playWeaponFire(weaponId) {
        if (!this.initialized) return;

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

    // Gauntlet: Brutal screaming motorized buzzsaw with metal grinder teeth
    playGauntlet() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.linearRampToValueAtTime(260, t + 0.12);
        gain.gain.setValueAtTime(0.55, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

        // Grinder distortion filter
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(450, t);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.18);

        // Harsh metal sparks noise
        const bSize = Math.floor(this.ctx.sampleRate * 0.14);
        const buffer = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bSize, 0.7);
        const nSrc = this.ctx.createBufferSource();
        nSrc.buffer = buffer;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.45, t);
        nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
        nSrc.connect(nGain);
        nGain.connect(this.sfxGain);
        nSrc.start(t);
    }

    // Machinegun: Raw high-caliber automatic fire with metallic ejection crack
    playMachinegun() {
        const t = this.ctx.currentTime;
        // Heavy gun-powder detonation noise burst
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1400;
        filter.Q.value = 2.5;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.65, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);

        // Heavy chest-thump punch
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.065);
        oscGain.gain.setValueAtTime(0.6, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.065);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.065);
    }

    // Shotgun: Earth-shattering double-barrel blast with ripping air pressure
    playShotgun() {
        const t = this.ctx.currentTime;
        // Sub-bass physical chest slam
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(24, t + 0.38);
        oscGain.gain.setValueAtTime(1.0, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.4);

        // High-pressure muzzle tearing noise
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.2);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3800, t);
        filter.frequency.exponentialRampToValueAtTime(250, t + 0.28);
        filter.Q.value = 3.0;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.9, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(t);
    }

    // Rocket Launcher: Ferocious rocket motor roar + supersonic ignition snap
    playRocketLaunch() {
        const t = this.ctx.currentTime;
        // Supersonic ignition snap
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.linearRampToValueAtTime(640, t + 0.3);
        gain.gain.setValueAtTime(0.65, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.32);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.32);

        // Roaring rocket thruster flame exhaust
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, t);
        filter.Q.value = 2.0;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.55, t);
        nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(t);
    }

    // Explosions: Crushing catastrophic detonation with shockwave rumble
    playExplosion() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        // Deep sub-bass shockwave (20Hz to 160Hz)
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(22, t + 0.8);
        oscGain.gain.setValueAtTime(1.0, t);
        oscGain.gain.exponentialRampToValueAtTime(0.005, t + 0.85);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.85);

        // Blistering fireball roar & explosive air concussion
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.85);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.1);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, t);
        filter.frequency.exponentialRampToValueAtTime(110, t + 0.7);
        filter.Q.value = 4.0;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1.0, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.85);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(t);
    }

    // Legendary Railgun: Thunderous electromagnetic discharge, sonic boom & singing electric ionization
    playRailgun() {
        const t = this.ctx.currentTime;
        // Blinding electric arc whip / sonic boom
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(3400, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.42);

        gain.gain.setValueAtTime(1.0, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.48);

        // Piercing ionizing trail resonance
        const hum = this.ctx.createOscillator();
        const humGain = this.ctx.createGain();
        hum.type = 'sawtooth';
        hum.frequency.setValueAtTime(680, t);
        hum.frequency.exponentialRampToValueAtTime(140, t + 0.9);
        humGain.gain.setValueAtTime(0.6, t);
        humGain.gain.exponentialRampToValueAtTime(0.005, t + 0.9);
        hum.connect(humGain);
        humGain.connect(this.sfxGain);
        hum.start(t);
        hum.stop(t + 0.9);
    }

    // Plasma Gun: Violent rapid-fire superheated plasma bolts with electric sizzling bite
    playPlasmaGun() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(640, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.09);

        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1600;
        filter.Q.value = 4.5;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.09);
    }

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

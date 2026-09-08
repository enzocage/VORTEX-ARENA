// Quake 3 Arena Procedural Textures & HUD Face Generator

class QuakeTextures {
    constructor() {
        this.cache = {};
    }

    // Helper to create a canvas
    createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    // Gothic Stone Bricks
    getGothicStone() {
        if (this.cache.stone) return this.cache.stone;
        const canvas = this.createCanvas(512, 512);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#2c2522';
        ctx.fillRect(0, 0, 512, 512);

        // Brick grid
        const rows = 16;
        const cols = 8;
        const rowH = 512 / rows;
        const colW = 512 / cols;

        for (let r = 0; r < rows; r++) {
            const offset = (r % 2) * (colW / 2);
            for (let c = -1; c <= cols; c++) {
                const x = c * colW + offset;
                const y = r * rowH;

                const brightness = Math.floor(45 + Math.random() * 35);
                ctx.fillStyle = `rgb(${brightness + 10}, ${brightness}, ${brightness - 5})`;
                ctx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);

                // Brick bevel/highlight
                ctx.strokeStyle = `rgba(255,255,255,0.12)`;
                ctx.strokeRect(x + 3, y + 3, colW - 6, rowH - 6);

                // Mortar shadow
                ctx.strokeStyle = '#110d0b';
                ctx.strokeRect(x + 1, y + 1, colW - 2, rowH - 2);
            }
        }

        // Add subtle grit/noise
        const imgData = ctx.getImageData(0, 0, 512, 512);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 25;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
            data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
        }
        ctx.putImageData(imgData, 0, 0);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        this.cache.stone = tex;
        return tex;
    }

    // Metal Plate with Rivets
    getMetalPanel() {
        if (this.cache.metal) return this.cache.metal;
        const canvas = this.createCanvas(512, 512);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#22252a';
        ctx.fillRect(0, 0, 512, 512);

        // Panels
        ctx.strokeStyle = '#111317';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 250, 250);
        ctx.strokeRect(258, 4, 250, 250);
        ctx.strokeRect(4, 258, 250, 250);
        ctx.strokeRect(258, 258, 250, 250);

        // Highlight borders
        ctx.strokeStyle = '#3a3f47';
        ctx.lineWidth = 2;
        ctx.strokeRect(6, 6, 246, 246);
        ctx.strokeRect(260, 6, 246, 246);
        ctx.strokeRect(6, 260, 246, 246);
        ctx.strokeRect(260, 260, 246, 246);

        // Rivets
        const rivetPositions = [
            [15, 15], [240, 15], [15, 240], [240, 240],
            [270, 15], [495, 15], [270, 240], [495, 240],
            [15, 270], [240, 270], [15, 495], [240, 495],
            [270, 270], [495, 270], [270, 495], [495, 495]
        ];

        rivetPositions.forEach(([rx, ry]) => {
            ctx.fillStyle = '#4f5661';
            ctx.beginPath();
            ctx.arc(rx, ry, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#101216';
            ctx.beginPath();
            ctx.arc(rx + 1, ry + 1, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Surface scratches, highlights & rivets
        for (let i = 0; i < 60; i++) {
            ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            const sx = Math.random() * 512;
            const sy = Math.random() * 512;
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + (Math.random() - 0.5) * 80, sy + (Math.random() - 0.5) * 80);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        this.cache.metal = tex;
        return tex;
    }

    // Quake 3 Jump Pad Chevron Texture
    getJumpPadTexture() {
        const canvas = this.createCanvas(256, 256);
        const ctx = canvas.getContext('2d');

        // Dark metallic frame
        ctx.fillStyle = '#151518';
        ctx.fillRect(0, 0, 256, 256);

        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 8;
        ctx.strokeRect(6, 6, 244, 244);

        // Glowing Chevron Arrows pointing up
        const drawChevron = (cy) => {
            ctx.fillStyle = '#ffaa00';
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(128, cy);
            ctx.lineTo(210, cy + 50);
            ctx.lineTo(185, cy + 65);
            ctx.lineTo(128, cy + 25);
            ctx.lineTo(71, cy + 65);
            ctx.lineTo(46, cy + 50);
            ctx.closePath();
            ctx.fill();
        };

        drawChevron(40);
        drawChevron(110);
        drawChevron(175);

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    // Teleporter Swirl Texture
    getTeleporterTexture() {
        const canvas = this.createCanvas(256, 256);
        const ctx = canvas.getContext('2d');

        const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#00e5ff');
        grad.addColorStop(0.7, '#7b1fa2');
        grad.addColorStop(1, '#050210');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);

        // Spiral arms
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 3;
        for (let a = 0; a < Math.PI * 4; a += 0.05) {
            const r = a * 8;
            const x = 128 + Math.cos(a) * r;
            const y = 128 + Math.sin(a) * r;
            if (a === 0) ctx.beginPath();
            ctx.lineTo(x, y);
        }
        ctx.stroke();

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    // Deep Space Skybox for Level 3 (The Longest Yard)
    getSpaceSkybox() {
        const canvas = this.createCanvas(1024, 1024);
        const ctx = canvas.getContext('2d');

        // Deep black to dark purple void
        const bg = ctx.createLinearGradient(0, 0, 1024, 1024);
        bg.addColorStop(0, '#040208');
        bg.addColorStop(0.5, '#0b0416');
        bg.addColorStop(1, '#020712');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 1024, 1024);

        // Nebula clouds
        for (let i = 0; i < 6; i++) {
            const nx = Math.random() * 1024;
            const ny = Math.random() * 1024;
            const nr = 150 + Math.random() * 250;
            const nGrad = ctx.createRadialGradient(nx, ny, 10, nx, ny, nr);
            const col = i % 2 === 0 ? 'rgba(120, 20, 180, 0.15)' : 'rgba(20, 100, 220, 0.12)';
            nGrad.addColorStop(0, col);
            nGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = nGrad;
            ctx.beginPath();
            ctx.arc(nx, ny, nr, 0, Math.PI * 2);
            ctx.fill();
        }

        // Stars
        for (let i = 0; i < 400; i++) {
            const sx = Math.random() * 1024;
            const sy = Math.random() * 1024;
            const sz = Math.random() * 2 + 0.5;
            const alpha = 0.4 + Math.random() * 0.6;

            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(sx, sy, sz, 0, Math.PI * 2);
            ctx.fill();

            // Bright star flare
            if (Math.random() < 0.05) {
                ctx.strokeStyle = `rgba(180, 220, 255, ${alpha * 0.7})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(sx - 6, sy);
                ctx.lineTo(sx + 6, sy);
                ctx.moveTo(sx, sy - 6);
                ctx.lineTo(sx, sy + 6);
                ctx.stroke();
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.mapping = THREE.EquirectangularReflectionMapping;
        return tex;
    }

    // Sarge Animated HUD Face
    renderSargeFace(canvas, health, lookDirection = 0, isDamaged = false) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = '#101015';
        ctx.fillRect(0, 0, w, h);

        // Helmet (Greenish military olive)
        ctx.fillStyle = '#3a4430';
        ctx.beginPath();
        ctx.arc(w / 2, h / 2 - 4, 30, Math.PI, 0, false);
        ctx.lineTo(w / 2 + 30, h / 2 + 4);
        ctx.lineTo(w / 2 - 30, h / 2 + 4);
        ctx.closePath();
        ctx.fill();

        // Helmet rim
        ctx.fillStyle = '#282e22';
        ctx.fillRect(w / 2 - 32, h / 2 + 2, 64, 5);

        // Face Skin tone (pale / bruised if low health)
        const skinColor = health > 60 ? '#c99676' : (health > 25 ? '#a88167' : '#7d6150');
        ctx.fillStyle = skinColor;
        ctx.fillRect(w / 2 - 24, h / 2 + 6, 48, 30);

        // Strong Jaw / Chin
        ctx.beginPath();
        ctx.moveTo(w / 2 - 24, h / 2 + 26);
        ctx.lineTo(w / 2 - 14, h / 2 + 36);
        ctx.lineTo(w / 2 + 14, h / 2 + 36);
        ctx.lineTo(w / 2 + 24, h / 2 + 26);
        ctx.closePath();
        ctx.fill();

        // Five o'clock shadow
        ctx.fillStyle = 'rgba(40, 30, 20, 0.25)';
        ctx.fillRect(w / 2 - 20, h / 2 + 24, 40, 11);

        // Eyes (Look direction: -1 left, 0 center, 1 right)
        const eyeOffset = lookDirection * 2.5;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(w / 2 - 16, h / 2 + 12, 9, 6);
        ctx.fillRect(w / 2 + 7, h / 2 + 12, 9, 6);

        // Eyeballs
        ctx.fillStyle = '#223322';
        ctx.fillRect(w / 2 - 13 + eyeOffset, h / 2 + 13, 4, 4);
        ctx.fillRect(w / 2 + 10 + eyeOffset, h / 2 + 13, 4, 4);

        // Eyebrows (Angled Sarge scowl)
        ctx.strokeStyle = '#221510';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 18, h / 2 + 10);
        ctx.lineTo(w / 2 - 7, h / 2 + 13);
        ctx.moveTo(w / 2 + 18, h / 2 + 10);
        ctx.lineTo(w / 2 + 7, h / 2 + 13);
        ctx.stroke();

        // Nose
        ctx.fillStyle = '#9e6d50';
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2 + 15);
        ctx.lineTo(w / 2 - 3, h / 2 + 22);
        ctx.lineTo(w / 2 + 3, h / 2 + 22);
        ctx.closePath();
        ctx.fill();

        // Mouth (Grimace or Cigar)
        if (health <= 25 || isDamaged) {
            // Open grimace in pain
            ctx.fillStyle = '#3a0808';
            ctx.fillRect(w / 2 - 10, h / 2 + 26, 20, 7);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(w / 2 - 8, h / 2 + 26, 16, 2); // Clenched teeth
        } else {
            // Tough grin / Cigar
            ctx.strokeStyle = '#331100';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(w / 2 - 10, h / 2 + 27);
            ctx.lineTo(w / 2 + 10, h / 2 + 27);
            ctx.stroke();

            // Iconic Sarge Cigar
            ctx.fillStyle = '#5c381e';
            ctx.fillRect(w / 2 + 4, h / 2 + 26, 12, 4);
            // Glowing ash
            ctx.fillStyle = '#ff4400';
            ctx.fillRect(w / 2 + 14, h / 2 + 26, 3, 4);
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(w / 2 + 16, h / 2 + 27, 2, 2);
        }

        // Blood / Battle Damage
        if (health < 75) {
            ctx.fillStyle = 'rgba(160, 20, 20, 0.7)';
            ctx.fillRect(w / 2 - 18, h / 2 + 18, 4, 8); // Cut on cheek
        }
        if (health < 40) {
            ctx.fillStyle = 'rgba(160, 20, 20, 0.85)';
            ctx.fillRect(w / 2 + 8, h / 2 + 8, 8, 4); // Bruised eye
            ctx.fillRect(w / 2 - 6, h / 2 + 29, 3, 6); // Blood dripping from lip
        }
        if (health <= 0) {
            // Death 'X' eyes
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(w / 2 - 15, h / 2 + 12); ctx.lineTo(w / 2 - 9, h / 2 + 18);
            ctx.moveTo(w / 2 - 9, h / 2 + 12); ctx.lineTo(w / 2 - 15, h / 2 + 18);
            ctx.moveTo(w / 2 + 8, h / 2 + 12); ctx.lineTo(w / 2 + 14, h / 2 + 18);
            ctx.moveTo(w / 2 + 14, h / 2 + 12); ctx.lineTo(w / 2 + 8, h / 2 + 18);
            ctx.stroke();
        }
    }
}

window.quakeTextures = new QuakeTextures();

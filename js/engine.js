// Quake 3 Arena Game Engine Core
// Manages rendering, input, player, game loop, match rules & level progression

class GameEngine {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Player Entity
        this.player = {
            isPlayer: true,
            alive: true,
            name: 'Player',
            health: 125,
            armor: 50,
            frags: 0,
            deaths: 0,
            quadTime: 0,
            position: new THREE.Vector3(0, 2, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            yaw: 0,
            pitch: 0,
            onGround: false,
            takeDamage: (amount, weaponName, attacker) => this.playerTakeDamage(amount, weaponName, attacker)
        };

        // Input state
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            fire: false
        };

        // Systems
        this.levelManager = new LevelManager(this.scene);
        this.weaponSystem = new WeaponSystem(this.scene, this.camera);
        this.botManager = new BotManager(this.scene);

        // Match State
        this.currentLevelIndex = 1;
        this.fragLimit = 10;
        this.matchActive = false;
        this.isPointerLocked = false;
        this.lastTime = performance.now();
        this.faceLookDir = 0;
        this.faceDamageTimer = 0;

        // UI references
        this.healthVal = document.getElementById('health-val');
        this.armorVal = document.getElementById('armor-val');
        this.ammoVal = document.getElementById('ammo-val');
        this.speedometer = document.getElementById('speedometer');
        this.damageOverlay = document.getElementById('damage-overlay');
        this.quadOverlay = document.getElementById('quad-overlay');
        this.faceCanvas = document.getElementById('hud-face-canvas');
        this.scoreboard = document.getElementById('scoreboard');

        this.bindEvents();
    }

    bindEvents() {
        // Window Resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Pointer Lock
        this.renderer.domElement.addEventListener('click', () => {
            if (!this.isPointerLocked && this.matchActive) {
                this.renderer.domElement.requestPointerLock();
                window.quakeAudio.init();
                window.quakeAudio.resume();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = (document.pointerLockElement === this.renderer.domElement);
        });

        // Mouse Move (Look)
        document.addEventListener('mousemove', (e) => {
            if (!this.isPointerLocked || !this.player.alive) return;

            const sensitivity = 0.0022;
            this.player.yaw -= e.movementX * sensitivity;
            this.player.pitch -= e.movementY * sensitivity;

            // Clamp pitch to avoid gimbal flip (-89 to +89 degrees)
            this.player.pitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, this.player.pitch));

            // Eye direction for HUD face
            this.faceLookDir = Math.max(-1, Math.min(1, -e.movementX * 0.1));
        });

        // Mouse Click (Fire)
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.input.fire = true;
                window.quakeAudio.resume();
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.input.fire = false;
            }
        });

        // Mouse Wheel (Weapon Cycle)
        document.addEventListener('wheel', (e) => {
            if (!this.isPointerLocked) return;
            let current = this.weaponSystem.currentWeaponId;
            if (e.deltaY > 0) {
                current = (current >= 6) ? 1 : current + 1;
            } else {
                current = (current <= 1) ? 6 : current - 1;
            }
            this.weaponSystem.switchWeapon(current);
            this.updateWeaponBar();
        });

        // Keyboard Controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') this.input.forward = true;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.input.backward = true;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = true;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = true;
            if (e.code === 'Space') this.input.jump = true;

            // Number keys 1-6 for weapons
            if (e.key >= '1' && e.key <= '6') {
                const id = parseInt(e.key);
                this.weaponSystem.switchWeapon(id);
                this.updateWeaponBar();
            }

            // Scoreboard (TAB)
            if (e.code === 'Tab') {
                e.preventDefault();
                this.showScoreboard(true);
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') this.input.forward = false;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.input.backward = false;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = false;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = false;
            if (e.code === 'Space') this.input.jump = false;

            if (e.code === 'Tab') {
                e.preventDefault();
                this.showScoreboard(false);
            }
        });
    }

    startLevel(levelIndex) {
        this.currentLevelIndex = levelIndex;
        const levelData = this.levelManager.loadLevel(levelIndex);
        this.fragLimit = levelData.fragLimit;

        document.getElementById('level-title').textContent = levelData.name;

        // Reset Player stats
        this.player.health = 125;
        this.player.armor = 50;
        this.player.frags = 0;
        this.player.deaths = 0;
        this.player.quadTime = 0;
        this.player.alive = true;

        // Spawn player at level spawn point
        const sp = this.levelManager.spawnPoints[0];
        this.player.position.copy(sp.pos);
        this.player.velocity.set(0, 0, 0);
        this.player.yaw = sp.yaw;
        this.player.pitch = 0;

        // Spawn Bots
        this.botManager.spawnBots(levelData.botCount, this.levelManager.spawnPoints);

        // Hide modals
        document.getElementById('start-modal').style.display = 'none';
        document.getElementById('game-over-modal').style.display = 'none';
        document.getElementById('level-complete-modal').style.display = 'none';

        this.matchActive = true;
        this.renderer.domElement.requestPointerLock();

        // Audio announcer: "Fight!"
        window.quakeAudio.init();
        window.quakeAudio.resume();
        window.quakeAudio.announce("Fight!");

        this.updateHUD();
        this.updateWeaponBar();
    }

    playerTakeDamage(amount, weaponName, attacker) {
        if (!this.player.alive) return;

        // Armor absorbs 66% of damage
        if (this.player.armor > 0) {
            const absorbed = Math.min(this.player.armor, amount * 0.66);
            this.player.armor -= absorbed;
            amount -= absorbed;
        }

        this.player.health -= amount;

        // Damage screen flash
        this.damageOverlay.style.opacity = '0.8';
        setTimeout(() => { this.damageOverlay.style.opacity = '0'; }, 120);

        this.faceDamageTimer = 0.4;
        window.quakeAudio.playPain(this.player.health <= 0);

        if (this.player.health <= 0) {
            this.playerDie(weaponName, attacker);
        }

        this.updateHUD();
    }

    playerDie(weaponName, attacker) {
        this.player.alive = false;
        this.player.deaths++;
        const killerName = attacker ? attacker.name : 'The Void';
        this.addKillfeed(killerName, 'Player', weaponName);

        if (attacker && attacker !== this.player) {
            attacker.frags++;
        }

        this.damageOverlay.style.opacity = '1.0';

        // Show Game Over modal after short delay
        setTimeout(() => {
            if (!this.matchActive) return;
            document.exitPointerLock();
            const modal = document.getElementById('game-over-modal');
            modal.style.display = 'flex';
            window.quakeAudio.announce("You have been fragged!");
        }, 1200);
    }

    respawnPlayer() {
        const sp = this.levelManager.spawnPoints[Math.floor(Math.random() * this.levelManager.spawnPoints.length)];
        this.player.position.copy(sp.pos);
        this.player.velocity.set(0, 0, 0);
        this.player.yaw = sp.yaw;
        this.player.pitch = 0;
        this.player.health = 125;
        this.player.armor = 50;
        this.player.alive = true;
        this.player.quadTime = 0;

        document.getElementById('game-over-modal').style.display = 'none';
        this.damageOverlay.style.opacity = '0';
        this.renderer.domElement.requestPointerLock();
        this.updateHUD();
    }

    addKillfeed(killer, victim, weapon) {
        const feed = document.getElementById('killfeed');
        const item = document.createElement('div');
        item.className = 'killfeed-item';
        item.innerHTML = `<span class="killfeed-killer">${killer}</span> <span class="killfeed-weapon">[${weapon}]</span> <span class="killfeed-victim">${victim}</span>`;
        feed.appendChild(item);

        setTimeout(() => {
            if (item.parentNode) item.parentNode.removeChild(item);
        }, 4500);

        this.updateScoreboardData();
        this.checkMatchEnd();
    }

    checkMatchEnd() {
        if (!this.matchActive) return;

        // Check if player won
        if (this.player.frags >= this.fragLimit) {
            this.matchActive = false;
            document.exitPointerLock();
            window.quakeAudio.announce("You Win! Excellent!");

            const modal = document.getElementById('level-complete-modal');
            document.getElementById('lc-title').textContent = `${this.levelManager.currentLevel === 3 ? "CHAMPION OF THE ARENA!" : "LEVEL COMPLETE!"}`;
            document.getElementById('lc-desc').textContent = `You reached ${this.fragLimit} frags!`;
            modal.style.display = 'flex';
            return;
        }

        // Check if a bot won
        for (const bot of this.botManager.bots) {
            if (bot.frags >= this.fragLimit) {
                this.matchActive = false;
                document.exitPointerLock();
                window.quakeAudio.announce("Lost match!");

                const modal = document.getElementById('game-over-modal');
                document.getElementById('go-desc').textContent = `${bot.name} won the match with ${bot.frags} frags!`;
                modal.style.display = 'flex';
                return;
            }
        }
    }

    showScoreboard(show) {
        this.scoreboard.style.display = show ? 'block' : 'none';
        if (show) this.updateScoreboardData();
    }

    updateScoreboardData() {
        const tbody = document.getElementById('sb-tbody');
        tbody.innerHTML = '';

        const allCombatants = [this.player, ...this.botManager.bots];
        allCombatants.sort((a, b) => b.frags - a.frags);

        allCombatants.forEach((c, idx) => {
            const tr = document.createElement('tr');
            if (c.isPlayer) tr.className = 'sb-row-player';
            tr.innerHTML = `
                <td>#${idx + 1}</td>
                <td>${c.name}</td>
                <td>${c.frags}</td>
                <td>${c.deaths}</td>
                <td>${c.health > 0 ? c.health : 'DEAD'}</td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('frag-counter').textContent = `FRAGS: ${this.player.frags} / ${this.fragLimit}`;
    }

    updateHUD() {
        const h = Math.max(0, Math.ceil(this.player.health));
        const a = Math.max(0, Math.ceil(this.player.armor));
        const currentWeapon = this.weaponSystem.weapons[this.weaponSystem.currentWeaponId];
        const ammo = currentWeapon.ammo === Infinity ? '∞' : currentWeapon.ammo;

        this.healthVal.textContent = h;
        this.armorVal.textContent = a;
        this.ammoVal.textContent = ammo;

        // Health color dynamics
        if (h > 100) this.healthVal.style.color = '#00e5ff';
        else if (h > 50) this.healthVal.style.color = '#00ff88';
        else if (h > 25) this.healthVal.style.color = '#ffbb00';
        else this.healthVal.style.color = '#ff2200';

        // Speedometer (Quake units display)
        const horizSpeed = Math.sqrt(this.player.velocity.x * this.player.velocity.x + this.player.velocity.z * this.player.velocity.z);
        const quakeSpeedUnits = Math.round(horizSpeed * 32); // Scale to classic Quake 3 units (320 to 650+)
        this.speedometer.textContent = `SPEED: ${quakeSpeedUnits} UPS`;

        // Quad Damage visual overlay
        this.quadOverlay.style.opacity = (this.player.quadTime > 0) ? '0.6' : '0';

        // Animate Sarge Face
        window.quakeTextures.renderSargeFace(
            this.faceCanvas,
            h,
            this.faceLookDir,
            this.faceDamageTimer > 0
        );
    }

    updateWeaponBar() {
        for (let i = 1; i <= 6; i++) {
            const slot = document.getElementById(`w-slot-${i}`);
            if (slot) {
                if (i === this.weaponSystem.currentWeaponId) {
                    slot.classList.add('active');
                } else {
                    slot.classList.remove('active');
                }
            }
        }
    }

    // Main Engine Tick
    update(dt) {
        if (!this.matchActive) return;

        // 1. Player Physics & Input
        if (this.player.alive) {
            window.quakePhysics.updateEntity(this.player, this.input, this.levelManager.colliders, dt);

            // Camera follow player eye position
            this.camera.position.set(this.player.position.x, this.player.position.y + 1.6, this.player.position.z);
            this.camera.rotation.order = 'YXZ';
            this.camera.rotation.y = this.player.yaw;
            this.camera.rotation.x = this.player.pitch;

            // Player firing
            if (this.input.fire) {
                const hasQuad = (this.player.quadTime > 0);
                const allTargets = [this.player, ...this.botManager.bots];
                this.weaponSystem.fire(this.player, allTargets, this.levelManager.colliders, hasQuad);
            }
        }

        // Quad damage timer decay
        if (this.player.quadTime > 0) {
            this.player.quadTime = Math.max(0, this.player.quadTime - dt);
        }

        if (this.faceDamageTimer > 0) {
            this.faceDamageTimer -= dt;
        }

        // 2. Bot AI & Movement
        const allEntities = [this.player, ...this.botManager.bots];
        this.botManager.update(dt, this.player, allEntities, this.levelManager.waypoints, this.levelManager.colliders, this.weaponSystem);

        // 3. Projectiles & Weapons
        this.weaponSystem.updateProjectiles(dt, allEntities, this.levelManager.colliders, this.player);
        const isMoving = (this.input.forward || this.input.backward || this.input.left || this.input.right) && this.player.onGround;
        this.weaponSystem.update(dt, isMoving);

        // 4. Level Pickups, Jump Pads & Triggers
        this.levelManager.update(dt, allEntities, this.player);

        // 5. HUD update
        this.updateHUD();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    run() {
        const now = performance.now();
        const dt = Math.min(0.1, (now - this.lastTime) / 1000);
        this.lastTime = now;

        this.update(dt);
        this.render();

        requestAnimationFrame(() => this.run());
    }
}

window.GameEngine = GameEngine;

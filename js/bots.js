// Quake 3 Arena Bot AI & Character Rendering

class QuakeBot {
    constructor(scene, name, skinColor = 0x336699) {
        this.scene = scene;
        this.name = name;
        this.isPlayer = false;
        this.alive = true;

        this.health = 100;
        this.armor = 50;
        this.frags = 0;
        this.deaths = 0;
        this.quadTime = 0;

        // Position & Physics
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.yaw = 0;
        this.pitch = 0;
        this.onGround = false;
        this.aimDirection = new THREE.Vector3(0, 0, -1);

        // AI States
        this.target = null;
        this.currentWaypoint = null;
        this.state = 'ROAM'; // ROAM, COMBAT, RETREAT
        this.reactionTimer = 0;
        this.strafeTimer = 0;
        this.strafeDir = 1;
        this.shootCooldown = 0.5;
        this.activeWeaponId = 4; // Rocket launcher

        // 3D Mesh Representation
        this.mesh = this.createBotMesh(skinColor);
        this.scene.add(this.mesh);

        // Fake input object for physics integration
        this.input = { forward: false, backward: false, left: false, right: false, jump: false };
    }

    createBotMesh(color) {
        const group = new THREE.Group();

        // Torso / Armor
        const torsoGeom = new THREE.BoxGeometry(0.7, 0.9, 0.45);
        const torsoMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.6, metalness: 0.5 });
        const torso = new THREE.Mesh(torsoGeom, torsoMat);
        torso.position.y = 0.95;
        group.add(torso);

        // Head / Helmet
        const headGeom = new THREE.BoxGeometry(0.4, 0.42, 0.42);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x22252a, metalness: 0.7 });
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.y = 1.6;
        group.add(head);

        // Visor (Glowing Quake visor)
        const visorGeom = new THREE.BoxGeometry(0.35, 0.12, 0.1);
        const visorMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
        const visor = new THREE.Mesh(visorGeom, visorMat);
        visor.position.set(0, 1.6, -0.22);
        group.add(visor);

        // Left & Right Arms
        const armGeom = new THREE.BoxGeometry(0.2, 0.7, 0.2);
        const armMat = new THREE.MeshStandardMaterial({ color: color });
        const leftArm = new THREE.Mesh(armGeom, armMat);
        leftArm.position.set(-0.48, 0.95, 0);
        const rightArm = new THREE.Mesh(armGeom, armMat);
        rightArm.position.set(0.48, 0.95, 0);
        group.add(leftArm);
        group.add(rightArm);

        // Legs
        const legGeom = new THREE.BoxGeometry(0.25, 0.6, 0.25);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1a20 });
        const leftLeg = new THREE.Mesh(legGeom, legMat);
        leftLeg.position.set(-0.2, 0.3, 0);
        const rightLeg = new THREE.Mesh(legGeom, legMat);
        rightLeg.position.set(0.2, 0.3, 0);
        group.add(leftLeg);
        group.add(rightLeg);

        // Weapon in hand
        const gunGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.6, 8);
        const gunMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
        const gun = new THREE.Mesh(gunGeom, gunMat);
        gun.rotation.x = Math.PI / 2;
        gun.position.set(0.35, 0.9, -0.4);
        group.add(gun);

        return group;
    }

    respawn(spawnPoints) {
        const sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        this.position.copy(sp.pos);
        this.velocity.set(0, 0, 0);
        this.yaw = sp.yaw;
        this.health = 100;
        this.armor = 50;
        this.alive = true;
        this.quadTime = 0;
        this.mesh.visible = true;
    }

    takeDamage(amount, weaponName, attacker) {
        if (!this.alive) return;

        // Armor absorbs 66% of damage
        if (this.armor > 0) {
            const absorbed = Math.min(this.armor, amount * 0.66);
            this.armor -= absorbed;
            amount -= absorbed;
        }

        this.health -= amount;

        if (this.health <= 0) {
            this.die(weaponName, attacker);
        }
    }

    die(weaponName, attacker) {
        this.alive = false;
        this.deaths++;
        this.mesh.visible = false;
        window.quakeAudio.playPain(true);

        const killerName = attacker ? attacker.name : 'The Void';
        window.gameEngine.addKillfeed(killerName, this.name, weaponName);

        if (attacker && attacker !== this) {
            attacker.frags++;
        } else {
            this.frags = Math.max(0, this.frags - 1); // Suicide penalty
        }

        // Respawn after 2 seconds
        setTimeout(() => {
            if (window.gameEngine && window.gameEngine.levelManager) {
                this.respawn(window.gameEngine.levelManager.spawnPoints);
            }
        }, 2000);
    }

    update(dt, player, allEntities, waypoints, levelColliders, weaponSystem) {
        if (!this.alive) return;

        if (this.quadTime > 0) {
            this.quadTime = Math.max(0, this.quadTime - dt);
        }

        // Update 3D Mesh Transform
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;

        // Reset input
        this.input.forward = false;
        this.input.backward = false;
        this.input.left = false;
        this.input.right = false;
        this.input.jump = false;

        // Choose Target (Player or other bots)
        let closestTarget = null;
        let closestDist = Infinity;
        for (const ent of allEntities) {
            if (ent === this || !ent.alive) continue;
            const d = this.position.distanceTo(ent.position);
            if (d < closestDist) {
                closestDist = d;
                closestTarget = ent;
            }
        }
        this.target = closestTarget;

        // Determine AI State
        if (this.health < 30) {
            this.state = 'RETREAT';
        } else if (this.target && closestDist < 35) {
            this.state = 'COMBAT';
        } else {
            this.state = 'ROAM';
        }

        // Execute State Behavior
        if (this.state === 'COMBAT' && this.target) {
            this.handleCombat(dt, closestDist, weaponSystem, levelColliders, allEntities);
        } else {
            this.handleRoaming(dt, waypoints);
        }

        // Apply physics
        window.quakePhysics.updateEntity(this, this.input, levelColliders, dt);
    }

    handleCombat(dt, dist, weaponSystem, colliders, allEntities) {
        // Look at target
        const targetEye = this.target.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const botEye = this.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const toTarget = targetEye.clone().sub(botEye);

        this.yaw = Math.atan2(-toTarget.x, -toTarget.z);
        this.aimDirection.copy(toTarget).normalize();

        // Strafe dodging
        this.strafeTimer -= dt;
        if (this.strafeTimer <= 0) {
            this.strafeTimer = 0.4 + Math.random() * 0.8;
            this.strafeDir = Math.random() > 0.5 ? 1 : -1;
            // Chance to bunny-jump
            if (Math.random() < 0.4) {
                this.input.jump = true;
            }
        }

        if (this.strafeDir > 0) this.input.right = true;
        else this.input.left = true;

        // Maintain optimal range (~12 units)
        if (dist > 18) this.input.forward = true;
        else if (dist < 6) this.input.backward = true;

        // Weapon Selection AI
        if (dist > 25) {
            this.activeWeaponId = 5; // Railgun at long range
        } else if (dist > 8) {
            this.activeWeaponId = 4; // Rocket launcher at medium
        } else {
            this.activeWeaponId = 3; // Shotgun up close
        }

        // Shoot at target with slight delay
        this.shootCooldown -= dt;
        if (this.shootCooldown <= 0) {
            const hasQuad = (this.quadTime > 0);
            weaponSystem.currentWeaponId = this.activeWeaponId;
            weaponSystem.fire(this, allEntities, colliders, hasQuad);
            this.shootCooldown = 0.6 + Math.random() * 0.6;
        }
    }

    handleRoaming(dt, waypoints) {
        if (waypoints.length === 0) return;

        // Select or follow waypoint
        if (!this.currentWaypoint || this.position.distanceTo(this.currentWaypoint) < 3.0) {
            this.currentWaypoint = waypoints[Math.floor(Math.random() * waypoints.length)];
        }

        const toWp = this.currentWaypoint.clone().sub(this.position);
        toWp.y = 0;
        if (toWp.lengthSq() > 0.01) {
            this.yaw = Math.atan2(-toWp.x, -toWp.z);
            this.input.forward = true;

            // Jump if facing obstacle or going up
            if (Math.random() < 0.05 && this.onGround) {
                this.input.jump = true;
            }
        }
    }
}

class BotManager {
    constructor(scene) {
        this.scene = scene;
        this.bots = [];
        this.botNames = ['Sarge', 'Visor', 'Hunter', 'Crash', 'Phobos', 'Bones'];
        this.skinColors = [0x336633, 0x553333, 0x334466, 0x664422, 0x443366];
    }

    spawnBots(count, spawnPoints) {
        // Clear existing bots
        this.bots.forEach(b => {
            this.scene.remove(b.mesh);
        });
        this.bots = [];

        for (let i = 0; i < count; i++) {
            const name = this.botNames[i % this.botNames.length];
            const color = this.skinColors[i % this.skinColors.length];
            const bot = new QuakeBot(this.scene, name, color);
            bot.respawn(spawnPoints);
            this.bots.push(bot);
        }
    }

    update(dt, player, allEntities, waypoints, colliders, weaponSystem) {
        for (const bot of this.bots) {
            bot.update(dt, player, allEntities, waypoints, colliders, weaponSystem);
        }
    }
}

window.BotManager = BotManager;
window.QuakeBot = QuakeBot;

// Quake 3 Arena Weapon System & Visual Effects

class WeaponSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        // Active weapons list & player inventory
        this.weapons = {
            1: { id: 1, name: 'Gauntlet', ammo: Infinity, maxAmmo: Infinity, fireRate: 0.4, damage: 50, range: 2.5, isHitscan: true },
            2: { id: 2, name: 'Machinegun', ammo: 100, maxAmmo: 200, fireRate: 0.1, damage: 7, range: 200, isHitscan: true, spread: 0.03 },
            3: { id: 3, name: 'Shotgun', ammo: 25, maxAmmo: 50, fireRate: 1.0, damage: 10, pellets: 11, range: 150, isHitscan: true, spread: 0.075 },
            4: { id: 4, name: 'Rocket Launcher', ammo: 20, maxAmmo: 40, fireRate: 0.8, damage: 100, splashRadius: 5.5, projSpeed: 38, isHitscan: false },
            5: { id: 5, name: 'Railgun', ammo: 15, maxAmmo: 30, fireRate: 1.5, damage: 100, range: 300, isHitscan: true },
            6: { id: 6, name: 'Plasma Gun', ammo: 80, maxAmmo: 150, fireRate: 0.12, damage: 20, splashRadius: 2.0, projSpeed: 50, isHitscan: false },
            7: { id: 7, name: 'BFG10K', ammo: 10, maxAmmo: 25, fireRate: 1.2, damage: 150, splashRadius: 9.0, projSpeed: 28, isHitscan: false }
        };

        this.currentWeaponId = 4; // Start with Rocket Launcher by default for max fun!
        this.lastFireTime = 0;
        this.consecutiveRailHits = 0;

        // Projectiles and visual effects
        this.projectiles = [];
        this.particles = [];
        this.beams = [];
        this.decals = []; // Bullet hole & blast mark decals
        this.maxDecals = 30; // Optimized for high frame rates
        this.maxParticles = 60; // Hard cap on active particles to guarantee 120 FPS

        // Shared reusable geometries and materials for particles to eliminate GC allocation spikes
        this._boxGeomSmall = new THREE.BoxGeometry(0.12, 0.12, 0.12);
        this._boxGeomTiny = new THREE.BoxGeometry(0.06, 0.06, 0.06);
        this._bloodMat = new THREE.MeshBasicMaterial({ color: 0xaa1111 });
        this._sparkMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
        this._plasmaMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        this._fireMat1 = new THREE.MeshBasicMaterial({ color: 0xff4400 });
        this._fireMat2 = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        this._smokeMat = new THREE.MeshBasicMaterial({ color: 0x777777, transparent: true, opacity: 0.6 });
        this._bfgMat1 = new THREE.MeshBasicMaterial({ color: 0x00ff44 });
        this._bfgMat2 = new THREE.MeshBasicMaterial({ color: 0x88ff00 });
        this._decalGeom = new THREE.PlaneGeometry(0.28, 0.28);
        this._decalMat = new THREE.MeshBasicMaterial({ color: 0x111111, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });

        // Viewmodel container attached to camera
        this.viewmodelHolder = new THREE.Group();
        this.camera.add(this.viewmodelHolder);

        // Weapon models
        this.viewmodels = {};
        this.initViewModels();

        // Muzzle flash light
        this.muzzleLight = new THREE.PointLight(0xffaa22, 0, 10);
        this.muzzleLight.position.set(0.25, -0.2, -0.8);
        this.viewmodelHolder.add(this.muzzleLight);

        // Weapon sway & bobbing state
        this.bobTime = 0;
        this.recoilZ = 0;
        this.recoilRot = 0;
    }

    initViewModels() {
        // Build 3D models for weapons
        // 1. Gauntlet: Metallic arm with spinning saw blade
        const gauntlet = new THREE.Group();
        const gBody = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 }));
        const sawBlade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 }));
        sawBlade.rotation.x = Math.PI / 2;
        sawBlade.position.set(0, 0, -0.3);
        gauntlet.add(gBody);
        gauntlet.add(sawBlade);
        gauntlet.userData.blade = sawBlade;
        this.viewmodels[1] = gauntlet;

        // 2. Machinegun: Sleek dark assault rifle
        const mg = new THREE.Group();
        const mgBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.5), new THREE.MeshStandardMaterial({ color: 0x2b2b30, metalness: 0.7 }));
        const mgBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.9 }));
        mgBarrel.rotation.x = Math.PI / 2;
        mgBarrel.position.set(0, 0.03, -0.4);
        mg.add(mgBody);
        mg.add(mgBarrel);
        this.viewmodels[2] = mg;

        // 3. Shotgun: Heavy double barrel
        const sg = new THREE.Group();
        const sgBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.4), new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.6 })); // wooden grip/stock
        const sgBarrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8), new THREE.MeshStandardMaterial({ color: 0x222225, metalness: 0.9 }));
        const sgBarrel2 = sgBarrel1.clone();
        sgBarrel1.rotation.x = Math.PI / 2;
        sgBarrel1.position.set(-0.04, 0.04, -0.42);
        sgBarrel2.rotation.x = Math.PI / 2;
        sgBarrel2.position.set(0.04, 0.04, -0.42);
        sg.add(sgBody);
        sg.add(sgBarrel1);
        sg.add(sgBarrel2);
        this.viewmodels[3] = sg;

        // 4. Rocket Launcher: Iconic chunky red/black launcher with triple exhaust tubes
        const rl = new THREE.Group();
        const rlBody = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.7, 12), new THREE.MeshStandardMaterial({ color: 0xa82015, metalness: 0.4, roughness: 0.4 }));
        rlBody.rotation.x = Math.PI / 2;
        const rlBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.2, 12), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 }));
        rlBarrel.rotation.x = Math.PI / 2;
        rlBarrel.position.set(0, 0, -0.42);
        const rlRing = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.02, 8, 16), new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.6 }));
        rlRing.position.set(0, 0, -0.2);
        rl.add(rlBody);
        rl.add(rlBarrel);
        rl.add(rlRing);
        this.viewmodels[4] = rl;

        // 5. Railgun: Long sleek futuristic electromagnetic accelerator with glowing cyan coils
        const rg = new THREE.Group();
        const rgBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.85), new THREE.MeshStandardMaterial({ color: 0x1a2634, metalness: 0.8 }));
        const rgRail1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.7), new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.6 }));
        const rgRail2 = rgRail1.clone();
        rgRail1.position.set(-0.06, 0.05, -0.35);
        rgRail2.position.set(0.06, 0.05, -0.35);
        rg.add(rgBody);
        rg.add(rgRail1);
        rg.add(rgRail2);
        this.viewmodels[5] = rg;

        // 6. Plasma Gun: High tech purple/blue plasma rifle
        const pg = new THREE.Group();
        const pgBody = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.55), new THREE.MeshStandardMaterial({ color: 0x221133, metalness: 0.6 }));
        const pgCore = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), new THREE.MeshStandardMaterial({ color: 0xaa00ff, emissive: 0xaa00ff, emissiveIntensity: 0.8 }));
        pgCore.position.set(0, 0.06, -0.1);
        const pgNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.25, 8), new THREE.MeshStandardMaterial({ color: 0x334466, metalness: 0.8 }));
        pgNozzle.rotation.x = Math.PI / 2;
        pgNozzle.position.set(0, 0.02, -0.35);
        pg.add(pgBody);
        pg.add(pgCore);
        pg.add(pgNozzle);
        this.viewmodels[6] = pg;

        // 7. BFG10K: Colossal cybernetic cannon with pulsing green energy reactor
        const bfg = new THREE.Group();
        const bfgBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.7), new THREE.MeshStandardMaterial({ color: 0x1f2b1f, metalness: 0.8, roughness: 0.3 }));
        const bfgReactor = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: 0x00ff44, emissive: 0x00ff44, emissiveIntensity: 1.0 }));
        bfgReactor.position.set(0, 0.1, -0.1);
        const bfgBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 }));
        bfgBarrel.rotation.x = Math.PI / 2;
        bfgBarrel.position.set(0, 0.02, -0.45);
        bfg.add(bfgBody);
        bfg.add(bfgReactor);
        bfg.add(bfgBarrel);
        this.viewmodels[7] = bfg;

        // Attach all to viewmodel holder, hide inactive
        for (const [id, model] of Object.entries(this.viewmodels)) {
            model.position.set(0.28, -0.25, -0.55);
            model.visible = (parseInt(id) === this.currentWeaponId);
            this.viewmodelHolder.add(model);
        }
    }

    switchWeapon(id) {
        if (!this.weapons[id]) return;
        this.currentWeaponId = id;
        for (const [key, model] of Object.entries(this.viewmodels)) {
            model.visible = (parseInt(key) === id);
        }
        window.quakeAudio.playPickup('weapon');
    }

    // Fire current active weapon
    fire(shooter, targets, colliders, isQuadDamage = false) {
        const weapon = this.weapons[this.currentWeaponId];
        const now = performance.now() / 1000;

        if (now - this.lastFireTime < weapon.fireRate) return false;
        if (shooter.isPlayer && weapon.ammo <= 0) return false;

        this.lastFireTime = now;
        if (shooter.isPlayer && weapon.ammo !== Infinity) {
            weapon.ammo--;
        }

        // Trigger viewmodel recoil
        this.recoilZ = 0.08;
        this.recoilRot = 0.06;

        // Dynamic Muzzle Flash Light color based on weapon
        let flashColor = 0xffaa22;
        if (weapon.id === 5) flashColor = 0x00ffff; // Railgun cyan
        else if (weapon.id === 6) flashColor = 0xaa00ff; // Plasma purple
        else if (weapon.id === 7) flashColor = 0x00ff44; // BFG green

        this.muzzleLight.color.setHex(flashColor);
        this.muzzleLight.intensity = (weapon.id === 7) ? 6.0 : 3.0;
        
        // Also cast dynamic flash light in the world at shooter position
        const worldFlash = new THREE.PointLight(flashColor, 3.5, 12);
        const flashOrigin = shooter.isPlayer ? this.camera.position.clone() : shooter.position.clone().add(new THREE.Vector3(0, 1.4, 0));
        worldFlash.position.copy(flashOrigin);
        this.scene.add(worldFlash);
        setTimeout(() => {
            this.muzzleLight.intensity = 0;
            this.scene.remove(worldFlash);
        }, 65);

        // Sound effect
        window.quakeAudio.playWeaponFire(weapon.id);

        const damageMult = isQuadDamage ? 3.0 : 1.0;
        const shootPos = shooter.isPlayer ? this.camera.position.clone() : shooter.position.clone().add(new THREE.Vector3(0, 1.4, 0));
        
        let shootDir = new THREE.Vector3();
        if (shooter.isPlayer) {
            this.camera.getWorldDirection(shootDir);
        } else {
            shootDir = shooter.aimDirection.clone().normalize();
        }

        if (weapon.isHitscan) {
            if (weapon.id === 3) {
                // Shotgun: 11 pellets
                for (let i = 0; i < weapon.pellets; i++) {
                    const spreadDir = shootDir.clone().add(new THREE.Vector3(
                        (Math.random() - 0.5) * weapon.spread,
                        (Math.random() - 0.5) * weapon.spread,
                        (Math.random() - 0.5) * weapon.spread
                    )).normalize();
                    this.executeHitscan(shootPos, spreadDir, weapon.damage * damageMult, weapon.range, shooter, targets, colliders, false);
                }
            } else if (weapon.id === 5) {
                // Railgun: perfect beam
                const hit = this.executeHitscan(shootPos, shootDir, weapon.damage * damageMult, weapon.range, shooter, targets, colliders, true);
                if (shooter.isPlayer) {
                    if (hit) {
                        this.consecutiveRailHits++;
                        if (this.consecutiveRailHits >= 2) {
                            window.quakeAudio.announce("Impressive!");
                            if (window.gameEngine) window.gameEngine.showMedal("IMPRESSIVE!");
                            this.consecutiveRailHits = 0;
                        }
                    } else {
                        this.consecutiveRailHits = 0;
                    }
                }
            } else if (weapon.id === 2) {
                // Machinegun
                const spreadDir = shootDir.clone().add(new THREE.Vector3(
                    (Math.random() - 0.5) * weapon.spread,
                    (Math.random() - 0.5) * weapon.spread,
                    (Math.random() - 0.5) * weapon.spread
                )).normalize();
                this.executeHitscan(shootPos, spreadDir, weapon.damage * damageMult, weapon.range, shooter, targets, colliders, false);
            } else if (weapon.id === 1) {
                // Gauntlet
                const hit = this.executeHitscan(shootPos, shootDir, weapon.damage * damageMult, weapon.range, shooter, targets, colliders, false);
                if (hit && hit.dead && shooter.isPlayer) {
                    window.quakeAudio.announce("Humiliation!");
                    if (window.gameEngine) window.gameEngine.showMedal("HUMILIATION!");
                }
            }
        } else {
            // Projectile weapons (Rocket & Plasma)
            this.spawnProjectile(weapon, shootPos, shootDir, shooter, damageMult);
        }

        return true;
    }

    // Raycast hitscan check against colliders & targets
    executeHitscan(origin, direction, damage, maxRange, shooter, targets, colliders, isRailgun) {
        let closestDist = maxRange;
        let hitTarget = null;
        let hitPoint = origin.clone().add(direction.clone().multiplyScalar(maxRange));

        // 1. Raycast against world geometry
        for (const col of colliders) {
            if (col.isTrigger) continue;
            const intersectDist = this.rayBoxIntersection(origin, direction, col);
            if (intersectDist !== null && intersectDist < closestDist) {
                closestDist = intersectDist;
                hitPoint = origin.clone().add(direction.clone().multiplyScalar(intersectDist));
            }
        }

        // 2. Raycast against entities
        for (const target of targets) {
            if (target === shooter || !target.alive) continue;
            const tPos = target.position.clone().add(new THREE.Vector3(0, 0.9, 0)); // center of body
            const distToRay = this.distPointToRay(tPos, origin, direction);
            if (distToRay < 0.7) {
                const targetDist = origin.distanceTo(tPos);
                if (targetDist < closestDist) {
                    closestDist = targetDist;
                    hitTarget = target;
                    hitPoint = tPos;
                }
            }
        }

        // Visual tracer / spiral beam
        if (isRailgun) {
            this.createRailgunBeam(origin, hitPoint);
        } else {
            this.createBulletTracer(origin, hitPoint);
        }

        // Hit resolution
        if (hitTarget) {
            hitTarget.takeDamage(damage, this.weapons[this.currentWeaponId].name, shooter);
            if (shooter.isPlayer) {
                window.quakeAudio.playHitDing();
                this.showHitMarker();
            }
            this.spawnBloodParticles(hitPoint);
            return { hit: true, dead: !hitTarget.alive };
        } else {
            this.spawnImpactSparks(hitPoint);
            return null;
        }
    }

    // Spawn Projectile (Rocket / Plasma / BFG)
    spawnProjectile(weapon, origin, direction, shooter, damageMult) {
        const isRocket = (weapon.id === 4);
        const isBFG = (weapon.id === 7);
        const group = new THREE.Group();

        if (isRocket) {
            // Rocket body & fins
            const geom = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.rotation.x = Math.PI / 2;
            group.add(mesh);

            const light = new THREE.PointLight(0xff6600, 1.5, 6);
            group.add(light);
        } else if (isBFG) {
            // Giant green BFG orb
            const geom = new THREE.SphereGeometry(0.45, 16, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0x00ff44 });
            const mesh = new THREE.Mesh(geom, mat);
            group.add(mesh);

            const light = new THREE.PointLight(0x00ff33, 4.0, 12);
            group.add(light);
        } else {
            // Plasma sphere
            const geom = new THREE.SphereGeometry(0.18, 8, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
            const mesh = new THREE.Mesh(geom, mat);
            group.add(mesh);

            const light = new THREE.PointLight(0x00aaff, 1.8, 5);
            group.add(light);
        }

        group.position.copy(origin).add(direction.clone().multiplyScalar(0.5));
        this.scene.add(group);

        this.projectiles.push({
            mesh: group,
            velocity: direction.clone().multiplyScalar(weapon.projSpeed),
            weapon: weapon,
            shooter: shooter,
            damage: weapon.damage * damageMult,
            isRocket: isRocket,
            isBFG: isBFG,
            aliveTime: 0
        });
    }

    updateProjectiles(dt, targets, colliders, player) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.aliveTime += dt;

            // Spawn rocket smoke particles
            if (p.isRocket) {
                this.spawnRocketSmoke(p.mesh.position);
            }

            const step = p.velocity.clone().multiplyScalar(dt);
            const nextPos = p.mesh.position.clone().add(step);

            let hit = false;
            let hitPoint = nextPos;

            // Check world collision
            for (const col of colliders) {
                if (col.isTrigger) continue;
                if (nextPos.x >= col.min.x && nextPos.x <= col.max.x &&
                    nextPos.y >= col.min.y && nextPos.y <= col.max.y &&
                    nextPos.z >= col.min.z && nextPos.z <= col.max.z) {
                    hit = true;
                    hitPoint = nextPos;
                    break;
                }
            }

            // Check target collision
            if (!hit) {
                for (const target of targets) {
                    if (target === p.shooter || !target.alive) continue;
                    if (nextPos.distanceTo(target.position.clone().add(new THREE.Vector3(0, 0.9, 0))) < 0.8) {
                        hit = true;
                        hitPoint = nextPos;
                        break;
                    }
                }
            }

            if (hit || p.aliveTime > 5.0) {
                this.explodeProjectile(p, hitPoint, targets, player);
                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
            } else {
                p.mesh.position.copy(nextPos);
            }
        }
    }

    explodeProjectile(p, pos, targets, player) {
        if (p.isBFG) {
            window.quakeAudio.playExplosion();
            this.spawnBFGExplosionVisual(pos);

            const radius = p.weapon.splashRadius;
            for (const target of targets) {
                if (!target.alive) continue;
                const tCenter = target.position.clone().add(new THREE.Vector3(0, 0.8, 0));
                const dist = pos.distanceTo(tCenter);
                if (dist < radius) {
                    const falloff = 1.0 - (dist / radius);
                    const splashDmg = p.damage * falloff;
                    target.takeDamage(splashDmg, 'BFG10K', p.shooter);

                    const impulseDir = tCenter.clone().sub(pos).normalize();
                    target.velocity.add(impulseDir.multiplyScalar(falloff * 24.0));

                    if (p.shooter.isPlayer && target !== player) {
                        window.quakeAudio.playHitDing();
                        this.showHitMarker();
                    }
                }
            }
            if (p.shooter.isPlayer) {
                window.quakeAudio.announce("Excellent!");
            }
            this.addImpactDecal(pos, 3.5, 0x003311);
        } else if (p.isRocket) {
            window.quakeAudio.playExplosion();
            this.spawnExplosionVisual(pos);
            this.addImpactDecal(pos, 2.2, 0x111111);

            // Splash Damage & Rocket Jumping
            const radius = p.weapon.splashRadius;
            for (const target of targets) {
                if (!target.alive) continue;
                const tCenter = target.position.clone().add(new THREE.Vector3(0, 0.8, 0));
                const dist = pos.distanceTo(tCenter);
                if (dist < radius) {
                    const falloff = 1.0 - (dist / radius);
                    const splashDmg = p.damage * falloff;
                    target.takeDamage(splashDmg, 'Rocket', p.shooter);

                    // Explosion knockback impulse
                    const impulseDir = tCenter.clone().sub(pos).normalize();
                    target.velocity.add(impulseDir.multiplyScalar(falloff * 18.0));

                    if (p.shooter.isPlayer && target !== player) {
                        window.quakeAudio.playHitDing();
                        this.showHitMarker();
                    }
                }
            }

            // Rocket Jump Physics for Player
            if (p.shooter === player) {
                const pCenter = player.position.clone().add(new THREE.Vector3(0, 0.2, 0));
                const distToFeet = pos.distanceTo(pCenter);
                if (distToFeet < radius) {
                    const jumpImpulse = (1.0 - distToFeet / radius) * 19.0;
                    const knockback = pCenter.clone().sub(pos).normalize();
                    // Heavily favor upward impulse for classic Quake rocket jumps
                    knockback.y = Math.max(0.6, knockback.y);
                    knockback.normalize();
                    player.velocity.add(knockback.multiplyScalar(jumpImpulse));
                }
            }
        } else {
            // Plasma impact
            this.spawnPlasmaImpact(pos);
            const radius = p.weapon.splashRadius;
            for (const target of targets) {
                if (!target.alive) continue;
                const dist = pos.distanceTo(target.position.clone().add(new THREE.Vector3(0, 0.8, 0)));
                if (dist < radius) {
                    target.takeDamage(p.damage, 'Plasma Gun', p.shooter);
                    if (p.shooter.isPlayer && target !== player) {
                        window.quakeAudio.playHitDing();
                        this.showHitMarker();
                    }
                }
            }
        }
    }

    // Legendary Railgun Spiral Visual
    createRailgunBeam(start, end) {
        const dist = start.distanceTo(end);
        const dir = end.clone().sub(start).normalize();

        // 1. Core straight beam
        const coreGeom = new THREE.BufferGeometry().setFromPoints([start, end]);
        const coreMat = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
        const coreLine = new THREE.Line(coreGeom, coreMat);
        this.scene.add(coreLine);

        // 2. Swirling spiral beam
        const spiralPoints = [];
        const segments = Math.floor(dist * 6);
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(dir, up).normalize();
        const realUp = new THREE.Vector3().crossVectors(right, dir).normalize();

        for (let i = 0; i <= segments; i++) {
            const fraction = i / segments;
            const p = start.clone().lerp(end, fraction);
            const angle = fraction * Math.PI * 18;
            const radius = 0.2;
            p.add(right.clone().multiplyScalar(Math.cos(angle) * radius));
            p.add(realUp.clone().multiplyScalar(Math.sin(angle) * radius));
            spiralPoints.push(p);
        }

        const spiralGeom = new THREE.BufferGeometry().setFromPoints(spiralPoints);
        const spiralMat = new THREE.LineBasicMaterial({ color: 0x33ff66, linewidth: 2 });
        const spiralLine = new THREE.Line(spiralGeom, spiralMat);
        this.scene.add(spiralLine);

        this.beams.push({ obj1: coreLine, obj2: spiralLine, age: 0, maxAge: 0.75 });
    }

    createBulletTracer(start, end) {
        const geom = new THREE.BufferGeometry().setFromPoints([start, end]);
        const mat = new THREE.LineBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.8 });
        const line = new THREE.Line(geom, mat);
        this.scene.add(line);
        this.beams.push({ obj1: line, obj2: null, age: 0, maxAge: 0.1 });
    }

    spawnBFGExplosionVisual(pos) {
        const light = new THREE.PointLight(0x00ff44, 5, 14);
        light.position.copy(pos);
        this.scene.add(light);
        setTimeout(() => this.scene.remove(light), 150);

        const count = Math.min(20, Math.max(5, this.maxParticles - this.particles.length));
        for (let i = 0; i < count; i++) {
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 14,
                (Math.random() - 0.2) * 12,
                (Math.random() - 0.5) * 14
            );
            const mesh = new THREE.Mesh(
                this._boxGeomSmall,
                Math.random() > 0.3 ? this._bfgMat1 : this._bfgMat2
            );
            mesh.position.copy(pos);
            this.scene.add(mesh);
            this.particles.push({ mesh, vel, age: 0, maxAge: 0.45 + Math.random() * 0.25 });
        }
    }

    spawnExplosionVisual(pos) {
        // Flash light
        const light = new THREE.PointLight(0xff6600, 4, 10);
        light.position.copy(pos);
        this.scene.add(light);
        setTimeout(() => this.scene.remove(light), 100);

        // Debris / Fireball particles using pooled geometries
        const count = Math.min(16, Math.max(4, this.maxParticles - this.particles.length));
        for (let i = 0; i < count; i++) {
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.2) * 9,
                (Math.random() - 0.5) * 10
            );
            const mesh = new THREE.Mesh(
                this._boxGeomSmall,
                Math.random() > 0.3 ? this._fireMat1 : this._fireMat2
            );
            mesh.position.copy(pos);
            this.scene.add(mesh);
            this.particles.push({ mesh, vel, age: 0, maxAge: 0.35 + Math.random() * 0.2 });
        }
    }

    spawnRocketSmoke(pos) {
        if (this.particles.length >= this.maxParticles) return;
        const mesh = new THREE.Mesh(this._boxGeomTiny, this._smokeMat);
        mesh.position.copy(pos);
        this.scene.add(mesh);
        this.particles.push({
            mesh,
            vel: new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() * 0.6), (Math.random() - 0.5) * 0.4),
            age: 0,
            maxAge: 0.35
        });
    }

    spawnPlasmaImpact(pos) {
        const count = Math.min(8, Math.max(2, this.maxParticles - this.particles.length));
        for (let i = 0; i < count; i++) {
            const vel = new THREE.Vector3((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7);
            const mesh = new THREE.Mesh(this._boxGeomTiny, this._plasmaMat);
            mesh.position.copy(pos);
            this.scene.add(mesh);
            this.particles.push({ mesh, vel, age: 0, maxAge: 0.25 });
        }
    }

    spawnBloodParticles(pos) {
        const count = Math.min(8, Math.max(2, this.maxParticles - this.particles.length));
        for (let i = 0; i < count; i++) {
            const vel = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3.5, (Math.random() - 0.5) * 4);
            const mesh = new THREE.Mesh(this._boxGeomTiny, this._bloodMat);
            mesh.position.copy(pos);
            this.scene.add(mesh);
            this.particles.push({ mesh, vel, age: 0, maxAge: 0.3 });
        }
    }

    spawnImpactSparks(pos) {
        const count = Math.min(4, Math.max(1, this.maxParticles - this.particles.length));
        for (let i = 0; i < count; i++) {
            const vel = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 4, (Math.random() - 0.5) * 4);
            const mesh = new THREE.Mesh(this._boxGeomTiny, this._sparkMat);
            mesh.position.copy(pos);
            this.scene.add(mesh);
            this.particles.push({ mesh, vel, age: 0, maxAge: 0.2 });
        }
        this.addImpactDecal(pos);
    }

    addImpactDecal(pos) {
        const mesh = new THREE.Mesh(this._decalGeom, this._decalMat);
        mesh.position.copy(pos);
        this.scene.add(mesh);
        this.decals.push(mesh);

        if (this.decals.length > this.maxDecals) {
            const oldest = this.decals.shift();
            this.scene.remove(oldest);
        }
    }

    showHitMarker() {
        const marker = document.getElementById('hit-marker');
        if (marker) {
            marker.style.opacity = '1';
            setTimeout(() => { marker.style.opacity = '0'; }, 80);
        }
    }

    // Update animations, particles & fading beams
    update(dt, isMoving) {
        // 1. Viewmodel sway & bobbing
        if (isMoving) {
            this.bobTime += dt * 14;
        }
        const bobX = Math.cos(this.bobTime * 0.5) * 0.02;
        const bobY = Math.sin(this.bobTime) * 0.015;

        this.recoilZ = Math.max(0, this.recoilZ - dt * 0.8);
        this.recoilRot = Math.max(0, this.recoilRot - dt * 0.8);

        const currentModel = this.viewmodels[this.currentWeaponId];
        if (currentModel) {
            currentModel.position.set(0.28 + bobX, -0.25 + bobY, -0.55 + this.recoilZ);
            currentModel.rotation.x = -this.recoilRot;

            // Spin gauntlet saw
            if (this.currentWeaponId === 1 && currentModel.userData.blade) {
                currentModel.userData.blade.rotation.z += dt * 35;
            }
        }

        // 2. Beams fade
        for (let i = this.beams.length - 1; i >= 0; i--) {
            const b = this.beams[i];
            b.age += dt;
            const alpha = 1.0 - (b.age / b.maxAge);
            if (alpha <= 0) {
                if (b.obj1) this.scene.remove(b.obj1);
                if (b.obj2) this.scene.remove(b.obj2);
                this.beams.splice(i, 1);
            } else {
                if (b.obj1 && b.obj1.material) b.obj1.material.opacity = alpha;
                if (b.obj2 && b.obj2.material) b.obj2.material.opacity = alpha;
            }
        }

        // 3. Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.age += dt;
            if (p.age >= p.maxAge) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            } else {
                p.vel.y -= 15.0 * dt; // gravity
                p.mesh.position.add(p.vel.clone().multiplyScalar(dt));
            }
        }
    }

    // Math Helpers
    distPointToRay(point, rayOrigin, rayDir) {
        const v = point.clone().sub(rayOrigin);
        const projection = v.dot(rayDir);
        if (projection < 0) return Infinity;
        const closestPoint = rayOrigin.clone().add(rayDir.clone().multiplyScalar(projection));
        return point.distanceTo(closestPoint);
    }

    rayBoxIntersection(origin, dir, box) {
        let tmin = (box.min.x - origin.x) / dir.x;
        let tmax = (box.max.x - origin.x) / dir.x;
        if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

        let tymin = (box.min.y - origin.y) / dir.y;
        let tymax = (box.max.y - origin.y) / dir.y;
        if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

        if ((tmin > tymax) || (tymin > tmax)) return null;
        if (tymin > tmin) tmin = tymin;
        if (tymax < tmax) tmax = tymax;

        let tzmin = (box.min.z - origin.z) / dir.z;
        let tzmax = (box.max.z - origin.z) / dir.z;
        if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

        if ((tmin > tzmax) || (tzmin > tmax)) return null;
        if (tzmin > tmin) tmin = tzmin;
        if (tzmax < tmax) tmax = tzmax;

        return (tmin >= 0) ? tmin : (tmax >= 0 ? tmax : null);
    }
}

window.WeaponSystem = WeaponSystem;

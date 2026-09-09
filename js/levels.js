// Quake 3 Arena Levels Architecture
// Contains 3 escalating 3D arenas: The Courtyard, Gothic Temple (Jump Pads), and The Longest Yard (Q3DM17)

class LevelManager {
    constructor(scene) {
        this.scene = scene;
        this.currentLevel = 1;
        this.colliders = [];
        this.jumpPads = [];
        this.teleporters = [];
        this.pickups = [];
        this.waypoints = [];
        this.spawnPoints = [];
        this.levelGroup = new THREE.Group();
        this.scene.add(this.levelGroup);
        this.animatedTextures = [];
    }

    clearLevel() {
        while (this.levelGroup.children.length > 0) {
            const obj = this.levelGroup.children[0];
            this.levelGroup.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                else obj.material.dispose();
            }
        }
        this.colliders = [];
        this.jumpPads = [];
        this.teleporters = [];
        this.pickups = [];
        this.waypoints = [];
        this.spawnPoints = [];
        this.animatedTextures = [];
    }

    loadLevel(levelIndex) {
        this.clearLevel();
        this.currentLevel = levelIndex;

        switch (levelIndex) {
            case 1:
                return this.buildCourtyard();
            case 2:
                return this.buildGothicTemple();
            case 3:
                return this.buildTheLongestYard();
            case 4:
                return this.buildBrimstoneCore();
            case 5:
                return this.buildCryptOfTheDamned();
            case 6:
                return this.buildSpaceChamber();
            case 7:
                return this.buildTheIronCitadel();
            case 8:
                return this.buildTheVoidSanctuary();
            case 9:
                return this.buildTheFinalAltar();
            default:
                return this.buildCourtyard();
        }
    }

    // Helper: Add solid box collider & mesh
    addBox(x, y, z, w, h, d, material, isTrigger = false) {
        const geom = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geom, material);
        mesh.position.set(x, y + h / 2, z);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        this.levelGroup.add(mesh);

        const collider = {
            min: new THREE.Vector3(x - w / 2, y, z - d / 2),
            max: new THREE.Vector3(x + w / 2, y + h, z + d / 2),
            isTrigger: isTrigger,
            mesh: mesh
        };
        this.colliders.push(collider);
        return collider;
    }

    // Helper: Add Jump Pad (Bounce Pad)
    addJumpPad(x, y, z, targetVelocity) {
        const padTex = window.quakeTextures.getJumpPadTexture();
        const mat = new THREE.MeshStandardMaterial({
            map: padTex,
            emissive: 0xff4400,
            emissiveIntensity: 0.4
        });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 3), mat);
        mesh.position.set(x, y + 0.2, z);
        this.levelGroup.add(mesh);

        const padLight = new THREE.PointLight(0xff6600, 2, 8);
        padLight.position.set(x, y + 1.2, z);
        this.levelGroup.add(padLight);

        this.jumpPads.push({
            position: new THREE.Vector3(x, y, z),
            radius: 1.8,
            targetVelocity: targetVelocity,
            mesh: mesh,
            light: padLight
        });
    }

    // Helper: Add Teleporter
    addTeleporter(x, y, z, destPos, destYaw) {
        const tex = window.quakeTextures.getTeleporterTexture();
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
        const geom = new THREE.PlaneGeometry(2.2, 3.5);
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, y + 1.75, z);
        this.levelGroup.add(mesh);

        const light = new THREE.PointLight(0x00e5ff, 2.5, 8);
        light.position.set(x, y + 1.8, z);
        this.levelGroup.add(light);

        this.teleporters.push({
            position: new THREE.Vector3(x, y, z),
            radius: 1.6,
            destination: destPos,
            destYaw: destYaw,
            mesh: mesh
        });
        this.animatedTextures.push(tex);
    }

    // Helper: Add Rotating Item Pickup
    addPickup(type, x, y, z, value = 25) {
        const group = new THREE.Group();
        group.position.set(x, y + 0.8, z);

        let mesh;
        let color = 0x00ff88;

        if (type === 'health') {
            color = (value > 50) ? 0x00e5ff : 0x00ff88;
            // Cross shape
            const g1 = new THREE.BoxGeometry(0.8, 0.25, 0.25);
            const g2 = new THREE.BoxGeometry(0.25, 0.8, 0.25);
            const m = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.5 });
            mesh = new THREE.Group();
            mesh.add(new THREE.Mesh(g1, m));
            mesh.add(new THREE.Mesh(g2, m));
        } else if (type === 'armor') {
            color = 0xffbb00;
            // Yellow Armor vest/diamond
            const geom = new THREE.OctahedronGeometry(0.45);
            const mat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.6 });
            mesh = new THREE.Mesh(geom, mat);
        } else if (type === 'quad') {
            color = 0x0066ff;
            // Quad Damage Logo
            const geom = new THREE.TorusGeometry(0.5, 0.15, 8, 16);
            const mat = new THREE.MeshStandardMaterial({ color: color, emissive: 0x0088ff, emissiveIntensity: 0.9 });
            mesh = new THREE.Mesh(geom, mat);
        } else if (type === 'weapon') {
            // Authentic 3D visual weapon pickup model
            mesh = this.createVisualWeaponMesh(value);
            color = this.getWeaponPickupColor(value);
        } else {
            color = 0xff3300;
            const geom = new THREE.BoxGeometry(0.9, 0.2, 0.2);
            const mat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.5 });
            mesh = new THREE.Mesh(geom, mat);
        }

        group.add(mesh);

        // Ground circular glowing pedestal ring
        const pedestalRingGeom = new THREE.RingGeometry(0.5, 0.7, 16);
        const pedestalRingMat = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const ringMesh = new THREE.Mesh(pedestalRingGeom, pedestalRingMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.y = -0.75;
        group.add(ringMesh);

        const light = new THREE.PointLight(color, 1.4, 6);
        group.add(light);

        this.levelGroup.add(group);

        this.pickups.push({
            type: type,
            value: value,
            position: new THREE.Vector3(x, y, z),
            group: group,
            mesh: mesh,
            active: true,
            respawnTime: 0
        });
    }

    getWeaponPickupColor(weaponId) {
        switch (weaponId) {
            case 1: return 0xaaaaaa; // Gauntlet
            case 2: return 0xffcc44; // Machinegun
            case 3: return 0xff8800; // Shotgun
            case 4: return 0xff2200; // Rocket Launcher
            case 5: return 0x00e5ff; // Railgun
            case 6: return 0xaa00ff; // Plasma Gun
            case 7: return 0x00ff44; // BFG10K
            default: return 0xff4400;
        }
    }

    createVisualWeaponMesh(weaponId) {
        const weaponGroup = new THREE.Group();
        weaponGroup.scale.set(1.4, 1.4, 1.4); // Scale up for pickup visibility

        if (weaponId === 1) {
            // Gauntlet
            const gBody = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 }));
            const sawBlade = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 }));
            sawBlade.rotation.x = Math.PI / 2;
            sawBlade.position.set(0, 0, -0.25);
            weaponGroup.add(gBody);
            weaponGroup.add(sawBlade);
        } else if (weaponId === 2) {
            // Machinegun
            const mgBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.5), new THREE.MeshStandardMaterial({ color: 0x2b2b30, metalness: 0.7 }));
            const mgBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.9 }));
            mgBarrel.rotation.x = Math.PI / 2;
            mgBarrel.position.set(0, 0.03, -0.4);
            const mag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.1), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            mag.position.set(0, -0.12, 0);
            weaponGroup.add(mgBody);
            weaponGroup.add(mgBarrel);
            weaponGroup.add(mag);
        } else if (weaponId === 3) {
            // Double Barrel Shotgun
            const sgBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.4), new THREE.MeshStandardMaterial({ color: 0x4a2a15, roughness: 0.6 }));
            const barrelMat = new THREE.MeshStandardMaterial({ color: 0x222225, metalness: 0.9 });
            const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.55, 8), barrelMat);
            const b2 = b1.clone();
            b1.rotation.x = Math.PI / 2;
            b1.position.set(-0.045, 0.04, -0.4);
            b2.rotation.x = Math.PI / 2;
            b2.position.set(0.045, 0.04, -0.4);
            weaponGroup.add(sgBody);
            weaponGroup.add(b1);
            weaponGroup.add(b2);
        } else if (weaponId === 4) {
            // Rocket Launcher (Iconic red tube + ring)
            const rlBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.75, 12), new THREE.MeshStandardMaterial({ color: 0xa82015, metalness: 0.4, roughness: 0.3 }));
            rlBody.rotation.x = Math.PI / 2;
            const rlMuzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.2, 12), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 }));
            rlMuzzle.rotation.x = Math.PI / 2;
            rlMuzzle.position.set(0, 0, -0.44);
            const rlRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 16), new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.6 }));
            rlRing.position.set(0, 0, -0.2);
            weaponGroup.add(rlBody);
            weaponGroup.add(rlMuzzle);
            weaponGroup.add(rlRing);
        } else if (weaponId === 5) {
            // Railgun (Futuristic dark chassis + dual cyan accelerator rails)
            const rgBody = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.15, 0.85), new THREE.MeshStandardMaterial({ color: 0x15202c, metalness: 0.8 }));
            const railMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.8 });
            const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.75), railMat);
            const r2 = r1.clone();
            r1.position.set(-0.065, 0.05, -0.38);
            r2.position.set(0.065, 0.05, -0.38);
            weaponGroup.add(rgBody);
            weaponGroup.add(r1);
            weaponGroup.add(r2);
        } else if (weaponId === 6) {
            // Plasma Gun (Purple frame + glowing violet plasma cell)
            const pgBody = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.6), new THREE.MeshStandardMaterial({ color: 0x251433, metalness: 0.6 }));
            const pgCore = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), new THREE.MeshStandardMaterial({ color: 0xbb00ff, emissive: 0xbb00ff, emissiveIntensity: 1.0 }));
            pgCore.position.set(0, 0.08, -0.1);
            const pgNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.28, 8), new THREE.MeshStandardMaterial({ color: 0x3d4b68, metalness: 0.8 }));
            pgNozzle.rotation.x = Math.PI / 2;
            pgNozzle.position.set(0, 0.03, -0.38);
            weaponGroup.add(pgBody);
            weaponGroup.add(pgCore);
            weaponGroup.add(pgNozzle);
        } else if (weaponId === 7) {
            // BFG10K (Heavy green Cybernetic chassis + glowing green reactor core)
            const bfgBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.75), new THREE.MeshStandardMaterial({ color: 0x1f2e1f, metalness: 0.8, roughness: 0.3 }));
            const bfgReactor = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), new THREE.MeshStandardMaterial({ color: 0x00ff44, emissive: 0x00ff44, emissiveIntensity: 1.2 }));
            bfgReactor.position.set(0, 0.11, -0.1);
            const bfgBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.35, 12), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 }));
            bfgBarrel.rotation.x = Math.PI / 2;
            bfgBarrel.position.set(0, 0.03, -0.48);
            weaponGroup.add(bfgBody);
            weaponGroup.add(bfgReactor);
            weaponGroup.add(bfgBarrel);
        }

        // Tilt weapon diagonally for dynamic floating showcase
        weaponGroup.rotation.z = 0.2;
        weaponGroup.rotation.x = 0.15;
        return weaponGroup;
    }

    // ==========================================
    // LEVEL 1: THE COURTYARD (Intro Arena)
    // ==========================================
    buildCourtyard() {
        const stoneTex = window.quakeTextures.getGothicStone();
        stoneTex.repeat.set(4, 4);
        const metalTex = window.quakeTextures.getMetalPanel();
        metalTex.repeat.set(2, 2);

        const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.8 });
        const metalMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.5, metalness: 0.6 });

        // Sky & Fog - Clear atmospheric visibility
        this.scene.background = new THREE.Color(0x242032);
        this.scene.fog = new THREE.FogExp2(0x242032, 0.007); // Gentle fog so entire arena is always fully visible

        // Ambient & Directional Sun Light (High visibility & contrast)
        const hemi = new THREE.HemisphereLight(0xffeedd, 0x443355, 0.85);
        this.levelGroup.add(hemi);
        const dir = new THREE.DirectionalLight(0xffca88, 1.1);
        dir.position.set(25, 45, 20);
        this.levelGroup.add(dir);

        // Fill Light for dark corners
        const fillLight = new THREE.DirectionalLight(0x6688cc, 0.45);
        fillLight.position.set(-25, 30, -20);
        this.levelGroup.add(fillLight);

        // Arena Floor (50x50)
        this.addBox(0, -1, 0, 50, 1, 50, stoneMat);

        // Outer Enclosure Walls
        this.addBox(0, 0, -25, 50, 8, 2, stoneMat);
        this.addBox(0, 0, 25, 50, 8, 2, stoneMat);
        this.addBox(-25, 0, 0, 2, 8, 50, stoneMat);
        this.addBox(25, 0, 0, 2, 8, 50, stoneMat);

        // 4 Grand Gothic Stone Pillars
        const pillarPositions = [
            [-10, 0, -10], [10, 0, -10],
            [-10, 0, 10], [10, 0, 10]
        ];
        pillarPositions.forEach(([px, py, pz]) => {
            this.addBox(px, py, pz, 3.5, 9, 3.5, stoneMat);
            // Torch flame on pillar
            const torch = new THREE.PointLight(0xff6600, 2, 12);
            torch.position.set(px, 4.5, pz);
            this.levelGroup.add(torch);
        });

        // Elevated Central Pedestal (Rocket Launcher Spawn)
        this.addBox(0, 0, 0, 10, 1.2, 10, metalMat);
        this.addPickup('weapon', 0, 1.2, 0, 4); // Rocket Launcher!

        // North & South Raised Balconies with ramps
        this.addBox(0, 0, -18, 28, 3.5, 6, metalMat);
        this.addBox(0, 0, 18, 28, 3.5, 6, metalMat);

        // East & West Perimeter Elevated Catwalks (Tier-2 Architecture)
        this.addBox(-20, 0, 0, 6, 3.5, 30, metalMat);
        this.addBox(20, 0, 0, 6, 3.5, 30, metalMat);

        // Gothic Arches & Overhead Overpass Bridges connecting catwalks to center
        this.addBox(-10, 3.5, 0, 14, 0.8, 4, metalMat);
        this.addBox(10, 3.5, 0, 14, 0.8, 4, metalMat);

        // Stone Arch Pillars for Bridges
        this.addBox(-15, 0, -2, 2, 3.5, 2, stoneMat);
        this.addBox(-15, 0, 2, 2, 3.5, 2, stoneMat);
        this.addBox(15, 0, -2, 2, 3.5, 2, stoneMat);
        this.addBox(15, 0, 2, 2, 3.5, 2, stoneMat);

        // Balcony Stairs & Access Ramps
        this.addBox(-12, 0, -14, 4, 1.8, 3, stoneMat);
        this.addBox(12, 0, -14, 4, 1.8, 3, stoneMat);
        this.addBox(-12, 0, 14, 4, 1.8, 3, stoneMat);
        this.addBox(12, 0, 14, 4, 1.8, 3, stoneMat);
        this.addBox(-18, 0, -14, 3, 1.8, 4, stoneMat);
        this.addBox(18, 0, 14, 3, 1.8, 4, stoneMat);

        // Courtyard Upper Sniper Loft above North Balcony (Y=7.5)
        this.addBox(0, 7.5, -22, 16, 0.8, 5, metalMat);
        this.addJumpPad(0, 3.5, -16, new THREE.Vector3(0, 15.0, -12.0)); // Launches to upper sniper loft!

        // Pickups & Weapons (Rich 3D visual weapon placement)
        this.addPickup('armor', 0, 3.5, -18, 50); // Yellow Armor
        this.addPickup('health', 0, 3.5, 18, 50); // +50 Health
        this.addPickup('armor', 0, 7.5, -22, 100); // Red Heavy Armor on Sniper Loft!
        this.addPickup('health', -18, 0, 0, 25);
        this.addPickup('health', 18, 0, 0, 25);
        this.addPickup('health', -20, 3.5, 0, 50);
        this.addPickup('health', 20, 3.5, 0, 50);

        this.addPickup('weapon', -18, 0, -18, 3); // Shotgun
        this.addPickup('weapon', 18, 0, 18, 5);  // Railgun
        this.addPickup('weapon', -20, 3.5, 10, 6); // Plasma Gun on West Catwalk!
        this.addPickup('weapon', 20, 3.5, -10, 2); // Machinegun on East Catwalk!
        this.addPickup('weapon', 0, 7.5, -22, 5);  // Railgun on Upper Sniper Loft!

        // Waypoints for AI Navigation
        this.waypoints = [
            new THREE.Vector3(0, 1.2, 0),
            new THREE.Vector3(0, 3.5, -18),
            new THREE.Vector3(0, 3.5, 18),
            new THREE.Vector3(-20, 3.5, 0),
            new THREE.Vector3(20, 3.5, 0),
            new THREE.Vector3(0, 7.5, -22),
            new THREE.Vector3(-15, 0, -15),
            new THREE.Vector3(15, 0, -15),
            new THREE.Vector3(-15, 0, 15),
            new THREE.Vector3(15, 0, 15),
            new THREE.Vector3(-18, 0, 0),
            new THREE.Vector3(18, 0, 0)
        ];

        // Spawn points
        this.spawnPoints = [
            { pos: new THREE.Vector3(0, 0, 12), yaw: Math.PI },
            { pos: new THREE.Vector3(0, 0, -12), yaw: 0 },
            { pos: new THREE.Vector3(-15, 0, 0), yaw: Math.PI / 2 },
            { pos: new THREE.Vector3(15, 0, 0), yaw: -Math.PI / 2 }
        ];

        return {
            name: "Level 1: The Courtyard",
            fragLimit: 10,
            botCount: 2
        };
    }

    // ==========================================
    // LEVEL 2: GOTHIC TEMPLE (The Bouncy Map)
    // ==========================================
    buildGothicTemple() {
        const stoneTex = window.quakeTextures.getGothicStone();
        stoneTex.repeat.set(5, 5);
        const metalTex = window.quakeTextures.getMetalPanel();
        metalTex.repeat.set(3, 3);

        const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.75 });
        const metalMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.5, metalness: 0.7 });

        this.scene.background = new THREE.Color(0x1a1024);
        this.scene.fog = new THREE.FogExp2(0x1a1024, 0.006); // Clear cathedral atmosphere

        const hemi = new THREE.HemisphereLight(0xeeccff, 0x442255, 0.85);
        this.levelGroup.add(hemi);
        const cathedralSun = new THREE.DirectionalLight(0xffddaa, 1.0);
        cathedralSun.position.set(20, 50, 20);
        this.levelGroup.add(cathedralSun);

        // Main Lower Floor
        this.addBox(0, -1, 0, 60, 1, 60, stoneMat);

        // Deadly Animated Lava Pit in Cathedral Center Trench
        const lavaMat = window.quakeTextures.getLavaMaterial();
        this.addBox(0, -0.4, 0, 18, 0.4, 18, lavaMat);
        const lavaLight = new THREE.PointLight(0xff3300, 3, 14);
        lavaLight.position.set(0, 1.5, 0);
        this.levelGroup.add(lavaLight);

        // Surrounding high fortress walls
        this.addBox(0, 0, -30, 60, 14, 2, stoneMat);
        this.addBox(0, 0, 30, 60, 14, 2, stoneMat);
        this.addBox(-30, 0, 0, 2, 14, 60, stoneMat);
        this.addBox(30, 0, 0, 2, 14, 60, stoneMat);

        // High Balcony Ledge (Y=8) at the North Wall
        this.addBox(0, 8, -24, 36, 1, 10, metalMat);

        // High Sniper Tower (Y=10) at the South Wall
        this.addBox(0, 10, 24, 18, 1, 10, metalMat);

        // Central floating MegaHealth altar (Y=6)
        this.addBox(0, 6, 0, 6, 0.8, 6, metalMat);
        this.addPickup('health', 0, 6.8, 0, 100); // MEGAHEALTH (+100)!

        // Cathedral Architectural Buttresses & Vaulted Columns
        const buttressPositions = [
            [-12, 0, -12], [12, 0, -12],
            [-12, 0, 12], [12, 0, 12]
        ];
        buttressPositions.forEach(([bx, by, bz]) => {
            this.addBox(bx, by, bz, 3.2, 14, 3.2, stoneMat);
            // Lateral flying buttress crossbeams
            this.addBox(bx * 0.7, 9, bz * 0.7, 4, 1.2, 4, stoneMat);
        });

        // East & West Flanking Mezzanine Terraces (Y=5)
        this.addBox(-24, 5, 0, 8, 1, 24, metalMat);
        this.addBox(24, 5, 0, 8, 1, 24, metalMat);

        // Vaulted Arch Bridges connecting North Balcony to Mezzanine Terraces
        this.addBox(-18, 6.5, -16, 5, 0.8, 12, metalMat);
        this.addBox(18, 6.5, -16, 5, 0.8, 12, metalMat);

        // Jump Pad 1: Launches from ground directly onto North Balcony!
        // Launches with vx=0, vy=19, vz=-18
        this.addJumpPad(0, 0, -8, new THREE.Vector3(0, 20.0, -16.0));

        // Jump Pad 2: Launches from ground up to South Sniper Tower!
        this.addJumpPad(0, 0, 8, new THREE.Vector3(0, 22.0, 18.0));

        // Jump Pad 3 & 4: Cross-map diagonal jumps to center MegaHealth!
        this.addJumpPad(-18, 0, 0, new THREE.Vector3(16.0, 16.0, 0));
        this.addJumpPad(18, 0, 0, new THREE.Vector3(-16.0, 16.0, 0));

        // Jump Pad 5 & 6: Mezzanine Terraces to High Sniper Tower!
        this.addJumpPad(-24, 5, 8, new THREE.Vector3(18.0, 15.0, 12.0));
        this.addJumpPad(24, 5, 8, new THREE.Vector3(-18.0, 15.0, 12.0));

        // Teleporter on the North Balcony leading to Sniper Tower
        this.addTeleporter(12, 8, -24, new THREE.Vector3(0, 11, 24), Math.PI);

        // Weapons and Pickups
        this.addPickup('weapon', 0, 10.8, 24, 5); // Railgun on the sniper perch!
        this.addPickup('weapon', -12, 8.8, -24, 4); // Rocket Launcher on North Balcony
        this.addPickup('weapon', 0, 0, -16, 3); // Shotgun lower ground
        this.addPickup('weapon', -24, 5.8, 0, 6); // Plasma Gun on West Mezzanine
        this.addPickup('weapon', 24, 5.8, 0, 7);  // BFG10K on East Mezzanine!
        this.addPickup('armor', -20, 0, -20, 100); // Heavy Red Armor (+100)
        this.addPickup('armor', 20, 0, 20, 50); // Yellow Armor (+50)
        this.addPickup('armor', 0, 8.8, -24, 50); // Yellow Armor North Balcony
        this.addPickup('health', -20, 0, 20, 25);
        this.addPickup('health', 20, 0, -20, 25);

        // Atmospheric Gothic Torch Lights
        const lightColors = [0xff4400, 0xaa00ff, 0x00e5ff, 0xff6600];
        [-20, 20].forEach((lx, idx) => {
            [-20, 20].forEach((lz, jdx) => {
                const pLight = new THREE.PointLight(lightColors[(idx + jdx) % 4], 2.5, 18);
                pLight.position.set(lx, 6, lz);
                this.levelGroup.add(pLight);
            });
        });

        // Waypoints
        this.waypoints = [
            new THREE.Vector3(0, 0, -8),
            new THREE.Vector3(0, 8.8, -24),
            new THREE.Vector3(0, 0, 8),
            new THREE.Vector3(0, 10.8, 24),
            new THREE.Vector3(-18, 0, 0),
            new THREE.Vector3(18, 0, 0),
            new THREE.Vector3(0, 6.8, 0),
            new THREE.Vector3(-20, 0, -20),
            new THREE.Vector3(20, 0, 20)
        ];

        this.spawnPoints = [
            { pos: new THREE.Vector3(-15, 0, -15), yaw: Math.PI / 4 },
            { pos: new THREE.Vector3(15, 0, 15), yaw: -3 * Math.PI / 4 },
            { pos: new THREE.Vector3(0, 8.8, -22), yaw: 0 },
            { pos: new THREE.Vector3(0, 10.8, 22), yaw: Math.PI }
        ];

        return {
            name: "Level 2: Gothic Temple",
            fragLimit: 15,
            botCount: 3
        };
    }

    // ==========================================
    // LEVEL 3: THE LONGEST YARD (Q3DM17 in Space)
    // ==========================================
    buildTheLongestYard() {
        const metalTex = window.quakeTextures.getMetalPanel();
        metalTex.repeat.set(4, 4);
        const metalMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.4, metalness: 0.8 });

        // Cosmic Skybox & Lighting
        const spaceTex = window.quakeTextures.getSpaceSkybox();
        this.scene.background = spaceTex;
        this.scene.fog = null; // Infinite space view!

        const hemi = new THREE.HemisphereLight(0x8899ff, 0x111122, 0.8);
        this.levelGroup.add(hemi);

        // 1. Lower Main Base Platform (Center)
        this.addBox(0, 0, 0, 24, 1.5, 34, metalMat);

        // 2. High Upper Temple Platform (North)
        this.addBox(0, 16, -42, 22, 1.5, 22, metalMat);

        // 3. Isolated Floating Sniper Platform (South - Railgun)
        this.addBox(0, 6, 40, 14, 1.5, 14, metalMat);

        // 4. Central Hovering Quad Damage Pedestal (Hovering between main & upper platform)
        this.addBox(0, 9, -18, 6, 0.8, 6, metalMat);
        this.addPickup('quad', 0, 10.0, -18); // QUAD DAMAGE (3x Damage)!

        // 5. Flanking East & West Outer Floating Satellites (Tier-2 Space Platforms)
        this.addBox(-26, 4, 0, 10, 1.2, 10, metalMat);
        this.addBox(26, 4, 0, 10, 1.2, 10, metalMat);

        // 6. Under-deck Sub-Level Hangar Catwalk beneath the Main Platform (Y=-4)
        this.addBox(0, -4, 0, 12, 0.8, 26, metalMat);
        // Under-deck support pillars
        this.addBox(-5, -4, -10, 1.5, 4, 1.5, metalMat);
        this.addBox(5, -4, -10, 1.5, 4, 1.5, metalMat);
        this.addBox(-5, -4, 10, 1.5, 4, 1.5, metalMat);
        this.addBox(5, -4, 10, 1.5, 4, 1.5, metalMat);

        // Teleporter from Under-deck Hangar straight up to Main Platform
        this.addTeleporter(0, -4, -10, new THREE.Vector3(0, 2.5, 0), 0);

        // High-Velocity Jump Pads (The hallmark of Q3DM17!)
        // Jump Pad A: On Main platform, launches player across the abyss to the Upper Temple!
        this.addJumpPad(0, 1.5, -12, new THREE.Vector3(0, 25.0, -28.0));

        // Jump Pad B: On Upper Temple, launches player back down to Main!
        this.addJumpPad(0, 17.5, -34, new THREE.Vector3(0, 12.0, 32.0));

        // Jump Pad C: On Main platform, launches player to South Railgun Platform!
        this.addJumpPad(0, 1.5, 12, new THREE.Vector3(0, 18.0, 25.0));

        // Jump Pad D: On South Sniper Platform, launches back to center
        this.addJumpPad(0, 7.5, 36, new THREE.Vector3(0, 14.0, -26.0));

        // Lateral Jump Pads to Outer Space Satellites
        this.addJumpPad(-9, 1.5, 0, new THREE.Vector3(-18.0, 12.0, 0));
        this.addJumpPad(9, 1.5, 0, new THREE.Vector3(18.0, 12.0, 0));

        // Satellite Launchers returning to Main deck
        this.addJumpPad(-26, 5.2, 0, new THREE.Vector3(20.0, 14.0, 0));
        this.addJumpPad(26, 5.2, 0, new THREE.Vector3(-20.0, 14.0, 0));

        // Weapons and Pickups with full visual 3D presentation
        this.addPickup('weapon', 0, 7.5, 40, 5); // Railgun on sniper ledge!
        this.addPickup('weapon', 0, 17.5, -42, 4); // Rocket Launcher on high temple!
        this.addPickup('weapon', -26, 5.2, 0, 7);  // BFG10K on West Outer Satellite!
        this.addPickup('weapon', 26, 5.2, 0, 6);   // Plasma Gun on East Outer Satellite!
        this.addPickup('weapon', 0, -3.2, 8, 4);   // Secret Rocket Launcher in Under-deck Hangar!
        this.addPickup('weapon', -8, 1.5, -6, 2);  // Machinegun on Main deck
        this.addPickup('weapon', 8, 1.5, -6, 3);   // Shotgun on Main deck
        this.addPickup('armor', 0, 1.5, 0, 100);   // Red Armor center
        this.addPickup('armor', 0, -3.2, 0, 100);  // Red Armor Under-deck
        this.addPickup('health', -8, 1.5, 8, 50);
        this.addPickup('health', 8, 1.5, 8, 50);
        this.addPickup('health', 0, 17.5, -48, 100); // MegaHealth behind temple
        this.addPickup('health', -26, 5.2, 3, 50);
        this.addPickup('health', 26, 5.2, 3, 50);

        // Atmospheric Neon Lights in space
        const spaceLight1 = new THREE.PointLight(0x00e5ff, 3, 25);
        spaceLight1.position.set(0, 12, -18);
        this.levelGroup.add(spaceLight1);

        const spaceLight2 = new THREE.PointLight(0xff00bb, 2, 20);
        spaceLight2.position.set(0, 20, -42);
        this.levelGroup.add(spaceLight2);

        const satLight1 = new THREE.PointLight(0x00ff44, 2.5, 16);
        satLight1.position.set(-26, 8, 0);
        this.levelGroup.add(satLight1);

        const satLight2 = new THREE.PointLight(0xaa00ff, 2.5, 16);
        satLight2.position.set(26, 8, 0);
        this.levelGroup.add(satLight2);

        // Waypoints
        this.waypoints = [
            new THREE.Vector3(0, 1.5, 0),
            new THREE.Vector3(0, 1.5, -12),
            new THREE.Vector3(0, 17.5, -42),
            new THREE.Vector3(0, 1.5, 12),
            new THREE.Vector3(0, 7.5, 40),
            new THREE.Vector3(0, 9.8, -18),
            new THREE.Vector3(-26, 5.2, 0),
            new THREE.Vector3(26, 5.2, 0),
            new THREE.Vector3(0, -3.2, 0),
            new THREE.Vector3(-8, 1.5, 0),
            new THREE.Vector3(8, 1.5, 0)
        ];

        this.spawnPoints = [
            { pos: new THREE.Vector3(0, 1.5, 6), yaw: 0 },
            { pos: new THREE.Vector3(-6, 1.5, -4), yaw: Math.PI / 2 },
            { pos: new THREE.Vector3(6, 1.5, -4), yaw: -Math.PI / 2 },
            { pos: new THREE.Vector3(0, 17.5, -40), yaw: Math.PI }
        ];

        return {
            name: "Level 3: The Longest Yard (Q3DM17)",
            fragLimit: 20,
            botCount: 3
        };
    }

    // ==========================================
    // LEVEL 4: BRIMSTONE CORE (Volcanic Reactor)
    // ==========================================
    buildBrimstoneCore() {
        const metalTex = window.quakeTextures.getMetalPanel();
        metalTex.repeat.set(4, 4);
        const metalMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.3, metalness: 0.85 });
        const lavaMat = window.quakeTextures.getLavaMaterial();

        this.scene.background = new THREE.Color(0x2d0b06);
        this.scene.fog = new THREE.FogExp2(0x2d0b06, 0.007); // Clear volcanic visibility across entire 80x80 arena

        const hemi = new THREE.HemisphereLight(0xff8855, 0x441100, 0.9);
        this.levelGroup.add(hemi);
        const sun = new THREE.DirectionalLight(0xffaa77, 1.0);
        sun.position.set(30, 60, 30);
        this.levelGroup.add(sun);

        // Huge Boiling Lava Lake Floor (80x80)
        this.addBox(0, -2, 0, 80, 1, 80, lavaMat);
        const lavaCoreLight = new THREE.PointLight(0xff5500, 5, 45);
        lavaCoreLight.position.set(0, 4, 0);
        this.levelGroup.add(lavaCoreLight);

        // High Outer Metal Blast Walls
        this.addBox(0, 0, -40, 80, 18, 2, metalMat);
        this.addBox(0, 0, 40, 80, 18, 2, metalMat);
        this.addBox(-40, 0, 0, 2, 18, 80, metalMat);
        this.addBox(40, 0, 0, 2, 18, 80, metalMat);

        // 4 Raised Corner Bastions (Y=6)
        [[-25, -25], [25, -25], [-25, 25], [25, 25]].forEach(([cx, cz]) => {
            this.addBox(cx, 0, cz, 16, 6, 16, metalMat);
        });

        // Suspended Cross Bridges Connecting Bastions (Y=6)
        this.addBox(0, 6, -25, 34, 0.8, 5, metalMat); // North Bridge
        this.addBox(0, 6, 25, 34, 0.8, 5, metalMat);  // South Bridge
        this.addBox(-25, 6, 0, 5, 0.8, 34, metalMat); // West Bridge
        this.addBox(25, 6, 0, 5, 0.8, 34, metalMat);  // East Bridge

        // Central Reactor Island (Y=2)
        this.addBox(0, 0, 0, 18, 3, 18, metalMat);

        // High Central BFG Shrine (Y=11)
        this.addBox(0, 11, 0, 6, 0.8, 6, metalMat);
        this.addPickup('weapon', 0, 12.0, 0, 7); // THE BFG10K!

        // Mega Jump Pads launching from Corner Bastions straight onto the High BFG Shrine!
        this.addJumpPad(-20, 6, -20, new THREE.Vector3(16, 18, 16));
        this.addJumpPad(20, 6, -20, new THREE.Vector3(-16, 18, 16));
        this.addJumpPad(-20, 6, 20, new THREE.Vector3(16, 18, -16));
        this.addJumpPad(20, 6, 20, new THREE.Vector3(-16, 18, -16));

        // Jump Pads from Center Island to Corner Bastions
        this.addJumpPad(0, 3, 0, new THREE.Vector3(0, 16, 22));

        // Pickups
        this.addPickup('armor', 0, 3.5, 0, 100); // Red Armor Center
        this.addPickup('quad', 25, 6.8, -25);    // Quad Damage on North-East Bastion!
        this.addPickup('health', -25, 6.8, 25, 100); // MegaHealth on South-West Bastion!
        this.addPickup('weapon', -25, 6.8, -25, 5); // Railgun North-West
        this.addPickup('weapon', 25, 6.8, 25, 4);   // Rocket Launcher South-East

        // Waypoints for AI
        this.waypoints = [
            new THREE.Vector3(0, 3, 0),
            new THREE.Vector3(0, 12, 0),
            new THREE.Vector3(-25, 6.8, -25),
            new THREE.Vector3(25, 6.8, -25),
            new THREE.Vector3(-25, 6.8, 25),
            new THREE.Vector3(25, 6.8, 25),
            new THREE.Vector3(0, 6.8, -25),
            new THREE.Vector3(0, 6.8, 25)
        ];

        // Spawn points
        this.spawnPoints = [
            { pos: new THREE.Vector3(-22, 6.8, -22), yaw: Math.PI / 4 },
            { pos: new THREE.Vector3(22, 6.8, -22), yaw: -Math.PI / 4 },
            { pos: new THREE.Vector3(-22, 6.8, 22), yaw: 3 * Math.PI / 4 },
            { pos: new THREE.Vector3(22, 6.8, 22), yaw: -3 * Math.PI / 4 }
        ];

        return {
            name: "Level 4: Brimstone Core",
            fragLimit: 25,
            botCount: 4
        };
    }

    // ==========================================
    // LEVEL 5: CRYPT OF THE DAMNED (Underground Catacombs)
    // ==========================================
    buildCryptOfTheDamned() {
        const stoneTex = window.quakeTextures.getGothicStone();
        stoneTex.repeat.set(6, 6);
        const metalTex = window.quakeTextures.getMetalPanel();
        metalTex.repeat.set(3, 3);

        const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.85 });
        const metalMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.45, metalness: 0.7 });

        this.scene.background = new THREE.Color(0x101518);
        this.scene.fog = new THREE.FogExp2(0x101518, 0.007); // High visibility across entire crypt

        // Crisp emerald & spectral ambient crypt lighting
        const hemi = new THREE.HemisphereLight(0x66ffcc, 0x152220, 0.85);
        this.levelGroup.add(hemi);
        const cryptSun = new THREE.DirectionalLight(0x88ffdd, 0.7);
        cryptSun.position.set(20, 40, 15);
        this.levelGroup.add(cryptSun);

        // Main Crypt Floor (70x70)
        this.addBox(0, -1, 0, 70, 1, 70, stoneMat);

        // Massive Outer Crypt Walls (Height 16)
        this.addBox(0, 0, -35, 70, 16, 2, stoneMat);
        this.addBox(0, 0, 35, 70, 16, 2, stoneMat);
        this.addBox(-35, 0, 0, 2, 16, 70, stoneMat);
        this.addBox(35, 0, 0, 2, 16, 70, stoneMat);

        // Central Sarcophagus Dais (Y=2)
        this.addBox(0, 0, 0, 14, 2, 14, stoneMat);
        this.addPickup('quad', 0, 2.8, 0); // Quad Damage on Sarcophagus!

        // Water Pools in East & West Wings (Swimming & Submerge areas!)
        const waterGeom = new THREE.PlaneGeometry(16, 24);
        const waterMat = new THREE.MeshStandardMaterial({ color: 0x00aacc, transparent: true, opacity: 0.6, roughness: 0.1 });
        const waterMesh1 = new THREE.Mesh(waterGeom, waterMat);
        waterMesh1.rotation.x = -Math.PI / 2;
        waterMesh1.position.set(-22, 0.1, 0);
        this.levelGroup.add(waterMesh1);

        const waterMesh2 = waterMesh1.clone();
        waterMesh2.position.set(22, 0.1, 0);
        this.levelGroup.add(waterMesh2);

        // Add water triggers to colliders
        this.colliders.push({
            min: new THREE.Vector3(-30, -3, -12),
            max: new THREE.Vector3(-14, 0.5, 12),
            isWater: true,
            isTrigger: true
        });
        this.colliders.push({
            min: new THREE.Vector3(14, -3, -12),
            max: new THREE.Vector3(30, 0.5, 12),
            isWater: true,
            isTrigger: true
        });

        // 8 Vaulted Crypt Columns with Green Torches
        const colPos = [
            [-12, -18], [12, -18], [-12, 18], [12, 18],
            [-24, -24], [24, -24], [-24, 24], [24, 24]
        ];
        colPos.forEach(([cx, cz]) => {
            this.addBox(cx, 0, cz, 3, 16, 3, stoneMat);
            const greenTorch = new THREE.PointLight(0x00ff88, 2.5, 15);
            greenTorch.position.set(cx, 6, cz);
            this.levelGroup.add(greenTorch);
        });

        // High Catacomb Gallery Ledge (North Wall, Y=8)
        this.addBox(0, 8, -26, 40, 1, 10, metalMat);
        this.addPickup('weapon', 0, 9.0, -26, 5); // Railgun perched in the crypt!

        // Crypt Jump Pads
        // Pad 1: Launches from West Water Pool to North Gallery
        this.addJumpPad(-18, 0, -8, new THREE.Vector3(12, 18, -16));
        // Pad 2: Launches from East Water Pool to North Gallery
        this.addJumpPad(18, 0, -8, new THREE.Vector3(-12, 18, -16));

        // Weapons & Pickups
        this.addPickup('weapon', -22, 0.5, 0, 7); // BFG10K in West Crypt!
        this.addPickup('weapon', 22, 0.5, 0, 4);  // Rocket Launcher in East Crypt!
        this.addPickup('armor', 0, 8.8, -22, 100); // Heavy Red Armor
        this.addPickup('health', -22, 0.5, 18, 50);
        this.addPickup('health', 22, 0.5, 18, 50);

        // Waypoints
        this.waypoints = [
            new THREE.Vector3(0, 2, 0),
            new THREE.Vector3(0, 8.8, -26),
            new THREE.Vector3(-22, 0.5, 0),
            new THREE.Vector3(22, 0.5, 0),
            new THREE.Vector3(-18, 0, -8),
            new THREE.Vector3(18, 0, -8),
            new THREE.Vector3(0, 0, 20)
        ];

        this.spawnPoints = [
            { pos: new THREE.Vector3(0, 0, 22), yaw: 0 },
            { pos: new THREE.Vector3(-22, 0.5, 18), yaw: Math.PI / 4 },
            { pos: new THREE.Vector3(22, 0.5, 18), yaw: -Math.PI / 4 },
            { pos: new THREE.Vector3(0, 8.8, -24), yaw: Math.PI }
        ];

        return {
            name: "Level 5: Crypt of the Damned",
            fragLimit: 30,
            botCount: 4
        };
    }

    // ==========================================
    // LEVEL 6: SPACE CHAMBER (Orbital Arena)
    // ==========================================
    buildSpaceChamber() {
        const metalTex = window.quakeTextures.getMetalPanel();
        metalTex.repeat.set(4, 4);
        const metalMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.25, metalness: 0.9 });

        // Cosmic Nebula Skybox
        const spaceTex = window.quakeTextures.getSpaceSkybox();
        this.scene.background = spaceTex;
        this.scene.fog = null;

        const hemi = new THREE.HemisphereLight(0x00e5ff, 0x110033, 0.9);
        this.levelGroup.add(hemi);

        // Lower Hexagonal Flight Deck (Center, Y=0)
        this.addBox(0, 0, 0, 28, 1.5, 28, metalMat);

        // 4 Outer Satellite Gun Pods hovering in deep space (North, South, East, West)
        this.addBox(0, 8, -42, 14, 1.2, 14, metalMat); // North Pod (Railgun)
        this.addBox(0, 8, 42, 14, 1.2, 14, metalMat);  // South Pod (Rocket Launcher)
        this.addBox(-42, 8, 0, 14, 1.2, 14, metalMat); // West Pod (BFG10K)
        this.addBox(42, 8, 0, 14, 1.2, 14, metalMat);  // East Pod (Plasma Gun)

        // Super High Orbital Spire (Center High, Y=22)
        this.addBox(0, 22, 0, 8, 1.2, 8, metalMat);
        this.addPickup('quad', 0, 23.2, 0); // Quad Damage high above the cosmos!

        // Giant Teleporter Loop connecting the 4 Satellite Pods
        this.addTeleporter(0, 9.2, -40, new THREE.Vector3(38, 9.2, 0), -Math.PI / 2); // North -> East
        this.addTeleporter(40, 9.2, 0, new THREE.Vector3(0, 9.2, 38), Math.PI);        // East -> South
        this.addTeleporter(0, 9.2, 40, new THREE.Vector3(-38, 9.2, 0), Math.PI / 2);   // South -> West
        this.addTeleporter(-40, 9.2, 0, new THREE.Vector3(0, 9.2, -38), 0);            // West -> North

        // Orbital Acceleration Jump Pads from Center Deck to Satellite Pods
        this.addJumpPad(0, 1.5, -10, new THREE.Vector3(0, 20.0, -32.0)); // Center to North
        this.addJumpPad(0, 1.5, 10, new THREE.Vector3(0, 20.0, 32.0));  // Center to South
        this.addJumpPad(-10, 1.5, 0, new THREE.Vector3(-32.0, 20.0, 0)); // Center to West
        this.addJumpPad(10, 1.5, 0, new THREE.Vector3(32.0, 20.0, 0));  // Center to East

        // Super Vertical Jump Pad to Orbital Spire (Quad Damage)
        this.addJumpPad(0, 1.5, 0, new THREE.Vector3(0, 32.0, 0)); // Sky launch!

        // Weapons
        this.addPickup('weapon', 0, 9.2, -42, 5); // Railgun
        this.addPickup('weapon', 0, 9.2, 42, 4);  // Rocket Launcher
        this.addPickup('weapon', -42, 9.2, 0, 7); // BFG10K
        this.addPickup('weapon', 42, 9.2, 0, 6);  // Plasma Gun
        this.addPickup('armor', 0, 1.5, -6, 100);
        this.addPickup('health', 0, 1.5, 6, 100);

        // Glowing Cosmic Neon Beacons
        const beacon1 = new THREE.PointLight(0x00e5ff, 4, 30);
        beacon1.position.set(0, 24, 0);
        this.levelGroup.add(beacon1);

        // Waypoints
        this.waypoints = [
            new THREE.Vector3(0, 1.5, 0),
            new THREE.Vector3(0, 9.2, -42),
            new THREE.Vector3(0, 9.2, 42),
            new THREE.Vector3(-42, 9.2, 0),
            new THREE.Vector3(42, 9.2, 0),
            new THREE.Vector3(0, 23.2, 0)
        ];

        this.spawnPoints = [
            { pos: new THREE.Vector3(0, 1.5, -6), yaw: 0 },
            { pos: new THREE.Vector3(0, 1.5, 6), yaw: Math.PI },
            { pos: new THREE.Vector3(-6, 1.5, 0), yaw: Math.PI / 2 },
            { pos: new THREE.Vector3(6, 1.5, 0), yaw: -Math.PI / 2 }
        ];

        return {
            name: "Level 6: Space Chamber",
            fragLimit: 35,
            botCount: 5
        };
    }

    // ==========================================
    // LEVEL 7: THE IRON CITADEL (Multi-Tier Fortress)
    // ==========================================
    buildTheIronCitadel() {
        const metalTex = window.quakeTextures.getMetalPanel();
        metalTex.repeat.set(5, 5);
        const stoneTex = window.quakeTextures.getGothicStone();
        stoneTex.repeat.set(4, 4);

        const metalMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.35, metalness: 0.8 });
        const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.75 });

        this.scene.background = new THREE.Color(0x15121c);
        this.scene.fog = new THREE.FogExp2(0x15121c, 0.012);

        const hemi = new THREE.HemisphereLight(0xffcc88, 0x110822, 0.7);
        this.levelGroup.add(hemi);

        // Tier 1: Ground Courtyard (Y=0, 80x80)
        this.addBox(0, -1, 0, 80, 1, 80, stoneMat);

        // Fortified Perimeter Citadel Walls (Height: 22)
        this.addBox(0, 0, -40, 80, 22, 2, stoneMat);
        this.addBox(0, 0, 40, 80, 22, 2, stoneMat);
        this.addBox(-40, 0, 0, 2, 22, 80, stoneMat);
        this.addBox(40, 0, 0, 2, 22, 80, stoneMat);

        // Tier 2: Mid-Level Ring Ramparts (Y=7, Outer Walkways)
        this.addBox(0, 7, -30, 60, 1, 10, metalMat);
        this.addBox(0, 7, 30, 60, 1, 10, metalMat);
        this.addBox(-30, 7, 0, 10, 1, 50, metalMat);
        this.addBox(30, 7, 0, 10, 1, 50, metalMat);

        // Tier 3: High Iron Keep (Y=14, Center Platform 24x24)
        this.addBox(0, 14, 0, 24, 1.2, 24, metalMat);
        this.addPickup('weapon', 0, 15.2, 0, 7); // Central BFG10K Shrine!

        // 4 Grand Watchtowers at the corners (Height: 25)
        [[-32, -32], [32, -32], [-32, 32], [32, 32]].forEach(([tx, tz]) => {
            this.addBox(tx, 0, tz, 8, 25, 8, metalMat);
            const beacon = new THREE.PointLight(0xffaa00, 3, 20);
            beacon.position.set(tx, 16, tz);
            this.levelGroup.add(beacon);
        });

        // Vertical Lift Jump Pads: Launch from Ground Tier directly up to Mid-Level Ramparts
        this.addJumpPad(-25, 0, -20, new THREE.Vector3(0, 18.0, 0));
        this.addJumpPad(25, 0, -20, new THREE.Vector3(0, 18.0, 0));
        this.addJumpPad(-25, 0, 20, new THREE.Vector3(0, 18.0, 0));
        this.addJumpPad(25, 0, 20, new THREE.Vector3(0, 18.0, 0));

        // High Trajectory Catapults from Mid Ramparts to High Iron Keep
        this.addJumpPad(0, 7, -25, new THREE.Vector3(0, 19.0, 18.0));
        this.addJumpPad(0, 7, 25, new THREE.Vector3(0, 19.0, -18.0));

        // Teleporters from Ground to Watchtower Perches
        this.addTeleporter(-15, 0, 0, new THREE.Vector3(-32, 17, -32), Math.PI / 4);
        this.addTeleporter(15, 0, 0, new THREE.Vector3(32, 17, 32), -3 * Math.PI / 4);

        // Pickups
        this.addPickup('quad', 0, 0.8, 0);          // Quad Damage Ground Center
        this.addPickup('armor', 0, 7.8, -30, 100);   // Heavy Armor Mid North
        this.addPickup('armor', 0, 7.8, 30, 100);    // Heavy Armor Mid South
        this.addPickup('health', -30, 7.8, 0, 100);  // MegaHealth Mid West
        this.addPickup('weapon', 30, 7.8, 0, 5);     // Railgun Mid East
        this.addPickup('weapon', -32, 17.5, -32, 4); // Rocket Launcher on Watchtower

        // Waypoints
        this.waypoints = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 7.8, -30),
            new THREE.Vector3(0, 7.8, 30),
            new THREE.Vector3(-30, 7.8, 0),
            new THREE.Vector3(30, 7.8, 0),
            new THREE.Vector3(0, 15.2, 0),
            new THREE.Vector3(-32, 17.5, -32),
            new THREE.Vector3(32, 17.5, 32)
        ];

        this.spawnPoints = [
            { pos: new THREE.Vector3(0, 0, 15), yaw: Math.PI },
            { pos: new THREE.Vector3(0, 0, -15), yaw: 0 },
            { pos: new THREE.Vector3(-25, 7.8, 0), yaw: Math.PI / 2 },
            { pos: new THREE.Vector3(25, 7.8, 0), yaw: -Math.PI / 2 }
        ];

        return {
            name: "Level 7: The Iron Citadel",
            fragLimit: 40,
            botCount: 5
        };
    }

    // ==========================================
    // LEVEL 8: THE VOID SANCTUARY (Cosmic Ring Duel)
    // ==========================================
    buildTheVoidSanctuary() {
        const metalTex = window.quakeTextures.getMetalPanel();
        metalTex.repeat.set(4, 4);
        const stoneTex = window.quakeTextures.getGothicStone();
        stoneTex.repeat.set(3, 3);

        const metalMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.2, metalness: 0.95 });
        const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.7 });

        const spaceTex = window.quakeTextures.getSpaceSkybox();
        this.scene.background = spaceTex;
        this.scene.fog = null;

        const hemi = new THREE.HemisphereLight(0xff00ff, 0x00ffff, 0.9);
        this.levelGroup.add(hemi);

        // Center Floating Ring Arena (Octagon Outer Ring)
        this.addBox(0, 0, -18, 24, 1.2, 8, metalMat);
        this.addBox(0, 0, 18, 24, 1.2, 8, metalMat);
        this.addBox(-18, 0, 0, 8, 1.2, 24, metalMat);
        this.addBox(18, 0, 0, 8, 1.2, 24, metalMat);

        // 4 Diagonal Corner Connectors
        this.addBox(-14, 0, -14, 8, 1.2, 8, stoneMat);
        this.addBox(14, 0, -14, 8, 1.2, 8, stoneMat);
        this.addBox(-14, 0, 14, 8, 1.2, 8, stoneMat);
        this.addBox(14, 0, 14, 8, 1.2, 8, stoneMat);

        // Center Void Hole: An endless abyss with floating Quad Damage hovering directly over the void!
        this.addBox(0, 4, 0, 6, 0.6, 6, metalMat);
        this.addPickup('quad', 0, 5.0, 0); // Quad Damage in center hole!

        // Outer Floating Sniper Satellite Rocks (Height: 12)
        this.addBox(0, 12, -45, 12, 1.2, 12, metalMat); // North Railgun Rock
        this.addBox(0, 12, 45, 12, 1.2, 12, metalMat);  // South BFG Rock
        this.addBox(-45, 12, 0, 12, 1.2, 12, metalMat); // West Rocket Rock
        this.addBox(45, 12, 0, 12, 1.2, 12, metalMat);  // East Plasma Rock

        // Cross Jump Pads to Outer Satellite Rocks
        this.addJumpPad(0, 1.2, -18, new THREE.Vector3(0, 22.0, -32.0));
        this.addJumpPad(0, 1.2, 18, new THREE.Vector3(0, 22.0, 32.0));
        this.addJumpPad(-18, 1.2, 0, new THREE.Vector3(-32.0, 22.0, 0));
        this.addJumpPad(18, 1.2, 0, new THREE.Vector3(32.0, 22.0, 0));

        // Return Jump Pads from Satellite Rocks to Center Ring
        this.addJumpPad(0, 13.2, -40, new THREE.Vector3(0, 12.0, 28.0));
        this.addJumpPad(0, 13.2, 40, new THREE.Vector3(0, 12.0, -28.0));
        this.addJumpPad(-40, 13.2, 0, new THREE.Vector3(28.0, 12.0, 0));
        this.addJumpPad(40, 13.2, 0, new THREE.Vector3(-28.0, 12.0, 0));

        // Center Jump Pad over the void hole to launch player onto the hovering Quad!
        this.addJumpPad(-6, 1.2, 0, new THREE.Vector3(6, 14.0, 0));
        this.addJumpPad(6, 1.2, 0, new THREE.Vector3(-6, 14.0, 0));

        // Weapons
        this.addPickup('weapon', 0, 13.2, -45, 5); // Railgun North
        this.addPickup('weapon', 0, 13.2, 45, 7);  // BFG10K South
        this.addPickup('weapon', -45, 13.2, 0, 4); // Rocket Launcher West
        this.addPickup('weapon', 45, 13.2, 0, 6);  // Plasma Gun East

        this.addPickup('armor', -14, 1.2, -14, 100);
        this.addPickup('health', 14, 1.2, 14, 100);
        this.addPickup('health', -14, 1.2, 14, 50);
        this.addPickup('health', 14, 1.2, -14, 50);

        // Atmospheric Pulsing Cosmic Lights
        const voidLight1 = new THREE.PointLight(0xff00bb, 4, 30);
        voidLight1.position.set(0, 6, 0);
        this.levelGroup.add(voidLight1);

        const voidLight2 = new THREE.PointLight(0x00ffff, 3, 25);
        voidLight2.position.set(0, 18, -45);
        this.levelGroup.add(voidLight2);

        // Waypoints
        this.waypoints = [
            new THREE.Vector3(0, 1.2, -18),
            new THREE.Vector3(0, 1.2, 18),
            new THREE.Vector3(-18, 1.2, 0),
            new THREE.Vector3(18, 1.2, 0),
            new THREE.Vector3(0, 5.0, 0),
            new THREE.Vector3(0, 13.2, -45),
            new THREE.Vector3(0, 13.2, 45)
        ];

        this.spawnPoints = [
            { pos: new THREE.Vector3(-14, 1.2, -14), yaw: Math.PI / 4 },
            { pos: new THREE.Vector3(14, 1.2, -14), yaw: -Math.PI / 4 },
            { pos: new THREE.Vector3(-14, 1.2, 14), yaw: 3 * Math.PI / 4 },
            { pos: new THREE.Vector3(14, 1.2, 14), yaw: -3 * Math.PI / 4 }
        ];

        return {
            name: "Level 8: The Void Sanctuary",
            fragLimit: 45,
            botCount: 6
        };
    }

    // ==========================================
    // LEVEL 9: THE FINAL ALTAR (Boss Arena vs Xaero)
    // ==========================================
    buildTheFinalAltar() {
        const stoneTex = window.quakeTextures.getGothicStone();
        stoneTex.repeat.set(6, 6);
        const metalTex = window.quakeTextures.getMetalPanel();
        metalTex.repeat.set(4, 4);

        const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.6, metalness: 0.3 });
        const metalMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.2, metalness: 0.95 });

        // Cosmic Blood Skybox / Dark Red Crimson Nebula
        this.scene.background = new THREE.Color(0x180205);
        this.scene.fog = new THREE.FogExp2(0x180205, 0.012);

        const hemi = new THREE.HemisphereLight(0xff3344, 0x110005, 0.9);
        this.levelGroup.add(hemi);

        // Tier 1: Grand Crimson Altar Floor (60x60, Y=0)
        this.addBox(0, -1, 0, 60, 1, 60, stoneMat);

        // High Obsidian Monolith Walls
        this.addBox(0, 0, -30, 60, 24, 2, metalMat);
        this.addBox(0, 0, 30, 60, 24, 2, metalMat);
        this.addBox(-30, 0, 0, 2, 24, 60, metalMat);
        this.addBox(30, 0, 0, 2, 24, 60, metalMat);

        // Central Elevated Throne of Champions (Y=5, 16x16)
        this.addBox(0, 0, 0, 16, 5, 16, stoneMat);
        this.addPickup('weapon', 0, 6.2, 0, 7); // Center BFG10K on Throne!

        // 4 Grand Gothic Spire Columns at corners with golden flame beacons (Height: 28)
        [[-22, -22], [22, -22], [-22, 22], [22, 22]].forEach(([px, pz]) => {
            this.addBox(px, 0, pz, 4, 28, 4, stoneMat);
            const beacon = new THREE.PointLight(0xff2200, 3.5, 20);
            beacon.position.set(px, 12, pz);
            this.levelGroup.add(beacon);
        });

        // 2 High Sniper Catwalks (North & South Wall, Height: 12)
        this.addBox(0, 12, -24, 40, 1, 8, metalMat);
        this.addBox(0, 12, 24, 40, 1, 8, metalMat);

        // Pickups on Catwalks
        this.addPickup('weapon', 0, 13.2, -24, 5); // Railgun North Catwalk
        this.addPickup('weapon', 0, 13.2, 24, 4);  // Rocket Launcher South Catwalk
        this.addPickup('quad', -15, 13.2, -24);    // Quad Damage on Catwalk Ledge!

        // Jump Pads:
        // 4 Jump Pads from Ground Floor straight up onto Central Throne
        this.addJumpPad(0, 0, -18, new THREE.Vector3(0, 18.0, 12.0));
        this.addJumpPad(0, 0, 18, new THREE.Vector3(0, 18.0, -12.0));
        this.addJumpPad(-18, 0, 0, new THREE.Vector3(12.0, 18.0, 0));
        this.addJumpPad(18, 0, 0, new THREE.Vector3(-12.0, 18.0, 0));

        // 2 Catapult Pads from Throne to North/South Sniper Catwalks
        this.addJumpPad(0, 5, -6, new THREE.Vector3(0, 18.0, -16.0));
        this.addJumpPad(0, 5, 6, new THREE.Vector3(0, 18.0, 16.0));

        // Pickups
        this.addPickup('armor', 0, 0.8, -12, 100);
        this.addPickup('health', 0, 0.8, 12, 100);
        this.addPickup('armor', -20, 0.8, 0, 50);
        this.addPickup('health', 20, 0.8, 0, 50);

        // Waypoints
        this.waypoints = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 6.2, 0),
            new THREE.Vector3(0, 13.2, -24),
            new THREE.Vector3(0, 13.2, 24),
            new THREE.Vector3(-20, 0, 0),
            new THREE.Vector3(20, 0, 0),
            new THREE.Vector3(0, 0, -18),
            new THREE.Vector3(0, 0, 18)
        ];

        // Spawn points
        this.spawnPoints = [
            { pos: new THREE.Vector3(-18, 0, -18), yaw: Math.PI / 4 },
            { pos: new THREE.Vector3(18, 0, -18), yaw: -Math.PI / 4 },
            { pos: new THREE.Vector3(-18, 0, 18), yaw: 3 * Math.PI / 4 },
            { pos: new THREE.Vector3(18, 0, 18), yaw: -3 * Math.PI / 4 }
        ];

        return {
            name: "Level 9: The Final Altar (Xaero's Domain)",
            fragLimit: 50,
            botCount: 6
        };
    }

    // Check Jump Pads, Teleporters & Pickups
    update(dt, entities, player) {
        // 1. Animate Pickups (spin & bob)
        const time = performance.now() * 0.001;
        const numEntities = entities.length;
        const numPickups = this.pickups.length;

        for (let i = 0; i < numPickups; i++) {
            const p = this.pickups[i];
            if (!p.active) {
                p.respawnTime -= dt;
                if (p.respawnTime <= 0) {
                    p.active = true;
                    p.group.visible = true;
                }
                continue;
            }

            p.mesh.rotation.y += dt * 2.5;
            p.mesh.position.y = Math.sin(time * 3 + p.position.x) * 0.12;

            // Check touch by player or bot (squared distance avoids Math.sqrt)
            for (let j = 0; j < numEntities; j++) {
                const ent = entities[j];
                if (!ent.alive) continue;
                if (ent.position.distanceToSquared(p.position) < 3.24) { // 1.8^2
                    this.consumePickup(p, ent, player);
                    break;
                }
            }
        }

        // 2. Animate Jump Pads & Check Triggers
        const numJumpPads = this.jumpPads.length;
        for (let i = 0; i < numJumpPads; i++) {
            const jp = this.jumpPads[i];
            const rSq = jp.radius * jp.radius;
            for (let j = 0; j < numEntities; j++) {
                const ent = entities[j];
                if (!ent.alive) continue;
                if (Math.abs(ent.position.y - jp.position.y) < 1.2 && ent.position.distanceToSquared(jp.position) < rSq) {
                    ent.velocity.copy(jp.targetVelocity);
                    ent.onGround = false;
                    if (ent.isPlayer) {
                        window.quakeAudio.playJumpPad();
                    }
                }
            }
        }

        // 3. Check Teleporters
        const numTeleporters = this.teleporters.length;
        for (let i = 0; i < numTeleporters; i++) {
            const tp = this.teleporters[i];
            const rSq = tp.radius * tp.radius;
            for (let j = 0; j < numEntities; j++) {
                const ent = entities[j];
                if (!ent.alive) continue;
                if (ent.position.distanceToSquared(tp.position) < rSq) {
                    ent.position.copy(tp.destination);
                    ent.velocity.set(0, 0, 0);
                    ent.yaw = tp.destYaw;
                    if (ent.isPlayer) {
                        window.quakeAudio.playTeleport();
                    }
                }
            }
        }
    }

    consumePickup(p, entity, player) {
        let picked = false;
        if (p.type === 'health') {
            if (entity.health < (p.value > 50 ? 200 : 100)) {
                entity.health = Math.min(200, entity.health + p.value);
                picked = true;
                if (entity.isPlayer) window.quakeAudio.playPickup('health');
            }
        } else if (p.type === 'armor') {
            if (entity.armor < 200) {
                entity.armor = Math.min(200, entity.armor + p.value);
                picked = true;
                if (entity.isPlayer) window.quakeAudio.playPickup('armor');
            }
        } else if (p.type === 'quad') {
            entity.quadTime = 30.0; // 30 seconds of Quad Damage!
            picked = true;
            if (entity.isPlayer) {
                window.quakeAudio.playQuadPickup();
            }
        } else if (p.type === 'weapon') {
            if (entity.isPlayer) {
                const w = window.gameEngine.weaponSystem.weapons[p.value];
                if (w) {
                    w.ammo = Math.min(w.maxAmmo, w.ammo + 20);
                    window.quakeAudio.playPickup('weapon');
                    picked = true;
                }
            } else {
                picked = true;
            }
        }

        if (picked) {
            p.active = false;
            p.group.visible = false;
            p.respawnTime = (p.type === 'quad' ? 60.0 : (p.value > 50 ? 35.0 : 15.0));
        }
    }
}

window.LevelManager = LevelManager;

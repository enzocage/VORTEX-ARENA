// Quake 3 Arena In-Game 3D Level Editor
// Allows placing blocks, ramps, jump pads, teleporters, weapon/item spawns, and exporting/importing JSON maps

class LevelEditor {
    constructor(scene, camera, levelManager) {
        this.scene = scene;
        this.camera = camera;
        this.levelManager = levelManager;
        this.active = false;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.gridSize = 2.0;

        // Editor tools
        this.toolTypes = ['block', 'ramp', 'jumppad', 'teleporter', 'weapon_spawn', 'health_spawn', 'armor_spawn', 'quad_spawn', 'bot_spawn'];
        this.currentTool = 'block';

        // Editor placement cursor mesh
        this.cursorGeom = new THREE.BoxGeometry(2, 2, 2);
        this.cursorMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, wireframe: true });
        this.cursorMesh = new THREE.Mesh(this.cursorGeom, this.cursorMat);
        this.cursorMesh.visible = false;
        this.scene.add(this.cursorMesh);

        // Custom placed elements container
        this.placedItems = [];
        this.customLevelGroup = new THREE.Group();
        this.scene.add(this.customLevelGroup);

        // UI DOM elements
        this.editorUI = null;
        this.createEditorUI();
        this.bindEvents();
    }

    createEditorUI() {
        const div = document.createElement('div');
        div.id = 'editor-overlay';
        div.style.cssText = `
            position: absolute;
            top: clamp(10px, 2vh, 25px);
            left: clamp(10px, 2vw, 25px);
            background: rgba(15, 15, 22, 0.94);
            border: 2px solid #00e5ff;
            box-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
            border-radius: 8px;
            padding: clamp(10px, 1.8vh, 16px);
            z-index: 200;
            display: none;
            color: #fff;
            font-family: 'Teko', sans-serif;
            width: min(88vw, 280px);
            max-height: 90vh;
            overflow-y: auto;
        `;

        div.innerHTML = `
            <div style="font-size: 26px; font-weight: bold; color: #00e5ff; border-bottom: 1px solid #444; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <span>3D LEVEL EDITOR</span>
                <span style="font-size: 16px; color: #aaa;">[Taste E / ESC]</span>
            </div>
            <div style="font-size: 18px; margin-bottom: 6px; color: #ffd700;">WERKZEUG WÄHLEN:</div>
            <select id="editor-tool-select" style="width: 100%; background: #222; color: #fff; border: 1px solid #555; padding: 6px; font-size: 18px; font-family: 'Teko'; border-radius: 4px; margin-bottom: 12px;">
                <option value="block">Solid Block (2x2x2)</option>
                <option value="jumppad">Jump Pad (Bounce 18 UPS)</option>
                <option value="teleporter">Teleporter Portal</option>
                <option value="weapon_spawn">Weapon (Rocket Launcher)</option>
                <option value="health_spawn">Health (+50)</option>
                <option value="armor_spawn">Armor (+50)</option>
                <option value="quad_spawn">Quad Damage</option>
                <option value="bot_spawn">Bot Spawn Point</option>
            </select>
            <div style="font-size: 18px; margin-bottom: 6px; color: #ffd700;">RASTER-GRÖSSE:</div>
            <select id="editor-grid-select" style="width: 100%; background: #222; color: #fff; border: 1px solid #555; padding: 6px; font-size: 18px; font-family: 'Teko'; border-radius: 4px; margin-bottom: 15px;">
                <option value="1">1 Meter</option>
                <option value="2" selected>2 Meter (Standard)</option>
                <option value="4">4 Meter (Groß)</option>
            </select>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button id="editor-export-btn" style="background: #0088cc; border: 1px solid #00e5ff; color: #fff; font-size: 18px; font-family: 'Teko'; padding: 6px; border-radius: 4px; cursor: pointer;">MAP EXPORTIEREN (JSON)</button>
                <button id="editor-import-btn" style="background: #336644; border: 1px solid #00ff88; color: #fff; font-size: 18px; font-family: 'Teko'; padding: 6px; border-radius: 4px; cursor: pointer;">MAP IMPORTIEREN</button>
                <button id="editor-clear-btn" style="background: #aa2222; border: 1px solid #ff4444; color: #fff; font-size: 18px; font-family: 'Teko'; padding: 6px; border-radius: 4px; cursor: pointer;">ALLE PLATZIERTEN LÖSCHEN</button>
            </div>
            <div style="margin-top: 12px; font-size: 15px; color: #888; line-height: 1.2;">
                * Linksklick: Objekt setzen<br>
                * Rechtsklick: Objekt entfernen<br>
                * E: Editor an/aus
            </div>
            <input type="file" id="editor-file-input" style="display: none;" accept=".json">
        `;
        document.body.appendChild(div);
        this.editorUI = div;

        document.getElementById('editor-tool-select').addEventListener('change', (e) => {
            this.currentTool = e.target.value;
            this.updateCursorGeometry();
        });

        document.getElementById('editor-grid-select').addEventListener('change', (e) => {
            this.gridSize = parseFloat(e.target.value);
            this.updateCursorGeometry();
        });

        document.getElementById('editor-export-btn').addEventListener('click', () => this.exportMap());
        document.getElementById('editor-clear-btn').addEventListener('click', () => this.clearCustomItems());

        const fileInput = document.getElementById('editor-file-input');
        document.getElementById('editor-import-btn').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.importMap(e));
    }

    updateCursorGeometry() {
        this.cursorMesh.geometry.dispose();
        if (this.currentTool === 'block') {
            this.cursorMesh.geometry = new THREE.BoxGeometry(this.gridSize, this.gridSize, this.gridSize);
        } else if (this.currentTool === 'jumppad') {
            this.cursorMesh.geometry = new THREE.BoxGeometry(3, 0.4, 3);
        } else {
            this.cursorMesh.geometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8);
        }
    }

    toggleEditor() {
        this.active = !this.active;
        this.editorUI.style.display = this.active ? 'block' : 'none';
        this.cursorMesh.visible = this.active;

        if (this.active) {
            document.exitPointerLock();
        } else {
            document.getElementById('canvas-container').querySelector('canvas').requestPointerLock();
        }
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE') {
                this.toggleEditor();
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.active) return;
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.updateRaycast();
        });

        window.addEventListener('mousedown', (e) => {
            if (!this.active) return;
            // Prevent placing if clicking over editor UI
            if (e.target.closest('#editor-overlay')) return;

            if (e.button === 0) {
                this.placeCurrentItem();
            } else if (e.button === 2) {
                this.removeHoveredItem();
            }
        });

        // Prevent context menu in editor
        window.addEventListener('contextmenu', (e) => {
            if (this.active) e.preventDefault();
        });
    }

    updateRaycast() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const allMeshes = this.levelManager.colliders.map(c => c.mesh).filter(m => m !== undefined);
        this.customLevelGroup.children.forEach(c => allMeshes.push(c));

        const intersects = this.raycaster.intersectObjects(allMeshes, false);
        if (intersects.length > 0) {
            const hit = intersects[0];
            const p = hit.point.clone().add(hit.face.normal.clone().multiplyScalar(this.gridSize * 0.5));
            
            // Snap to grid
            this.cursorMesh.position.x = Math.round(p.x / this.gridSize) * this.gridSize;
            this.cursorMesh.position.y = Math.round(p.y / this.gridSize) * this.gridSize;
            this.cursorMesh.position.z = Math.round(p.z / this.gridSize) * this.gridSize;
        }
    }

    placeCurrentItem() {
        const pos = this.cursorMesh.position.clone();

        if (this.currentTool === 'block') {
            const stoneMat = new THREE.MeshStandardMaterial({ map: window.quakeTextures.getGothicStone(), roughness: 0.8 });
            const boxCol = this.levelManager.addBox(pos.x, pos.y - this.gridSize / 2, pos.z, this.gridSize, this.gridSize, this.gridSize, stoneMat);
            this.placedItems.push({ type: 'block', pos: pos, size: this.gridSize, collider: boxCol });
        } else if (this.currentTool === 'jumppad') {
            this.levelManager.addJumpPad(pos.x, pos.y - 0.2, pos.z, new THREE.Vector3(0, 20, -15));
            this.placedItems.push({ type: 'jumppad', pos: pos });
        } else if (this.currentTool === 'teleporter') {
            this.levelManager.addTeleporter(pos.x, pos.y, pos.z, new THREE.Vector3(0, 5, 0), 0);
            this.placedItems.push({ type: 'teleporter', pos: pos });
        } else if (this.currentTool === 'weapon_spawn') {
            this.levelManager.addPickup('weapon', pos.x, pos.y, pos.z, 4);
            this.placedItems.push({ type: 'weapon_spawn', pos: pos });
        } else if (this.currentTool === 'health_spawn') {
            this.levelManager.addPickup('health', pos.x, pos.y, pos.z, 50);
            this.placedItems.push({ type: 'health_spawn', pos: pos });
        } else if (this.currentTool === 'armor_spawn') {
            this.levelManager.addPickup('armor', pos.x, pos.y, pos.z, 50);
            this.placedItems.push({ type: 'armor_spawn', pos: pos });
        } else if (this.currentTool === 'quad_spawn') {
            this.levelManager.addPickup('quad', pos.x, pos.y, pos.z);
            this.placedItems.push({ type: 'quad_spawn', pos: pos });
        } else if (this.currentTool === 'bot_spawn') {
            this.levelManager.spawnPoints.push({ pos: pos, yaw: 0 });
            this.placedItems.push({ type: 'bot_spawn', pos: pos });
        }

        window.quakeAudio.playPickup('weapon');
    }

    removeHoveredItem() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const meshes = this.levelManager.colliders.map(c => c.mesh).filter(m => m !== undefined);
        const intersects = this.raycaster.intersectObjects(meshes, false);

        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            // Find in level colliders and remove
            const idx = this.levelManager.colliders.findIndex(c => c.mesh === hitMesh);
            if (idx !== -1) {
                this.levelManager.levelGroup.remove(hitMesh);
                this.levelManager.colliders.splice(idx, 1);
                window.quakeAudio.playExplosion();
            }
        }
    }

    clearCustomItems() {
        for (const item of this.placedItems) {
            if (item.collider && item.collider.mesh) {
                this.levelManager.levelGroup.remove(item.collider.mesh);
            }
        }
        this.placedItems = [];
    }

    exportMap() {
        const data = {
            name: "Custom Quake 3 Arena Map",
            version: 1.0,
            items: this.placedItems.map(item => ({
                type: item.type,
                pos: { x: item.pos.x, y: item.pos.y, z: item.pos.z },
                size: item.size || 2
            }))
        };

        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quake3_custom_map_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importMap(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.items && Array.isArray(data.items)) {
                    this.clearCustomItems();
                    for (const it of data.items) {
                        this.cursorMesh.position.set(it.pos.x, it.pos.y, it.pos.z);
                        this.currentTool = it.type;
                        this.gridSize = it.size || 2;
                        this.placeCurrentItem();
                    }
                    alert(`Map "${data.name}" mit ${data.items.length} Objekten erfolgreich geladen!`);
                }
            } catch (err) {
                alert("Fehler beim Lesen der Map-JSON: " + err);
            }
        };
        reader.readAsText(file);
    }
}

window.LevelEditor = LevelEditor;

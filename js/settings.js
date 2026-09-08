// Quake 3 Arena In-Game Settings, FOV, Crosshair Customizer & Audio Controls

class SettingsManager {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.settings = {
            fov: 90,
            sensitivity: 0.0022,
            masterVolume: 0.8,
            crosshairType: 'cross', // cross, dot, circle
            crosshairColor: '#00ff80',
            bloodEnabled: true
        };

        this.loadSettings();
        this.createSettingsUI();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('quake3_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn("Could not read local storage settings:", e);
        }
        this.applySettings();
    }

    saveSettings() {
        try {
            localStorage.setItem('quake3_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn("Could not save settings:", e);
        }
        this.applySettings();
    }

    applySettings() {
        if (this.game && this.game.camera) {
            this.game.camera.fov = this.settings.fov;
            this.game.camera.updateProjectionMatrix();
        }

        if (window.quakeAudio && window.quakeAudio.masterGain) {
            window.quakeAudio.masterGain.gain.value = this.settings.masterVolume;
        }

        // Crosshair update
        const ch = document.querySelector('.crosshair');
        if (ch) {
            const dot = ch.querySelector('.center-dot');
            if (this.settings.crosshairType === 'dot') {
                ch.style.border = 'none';
                ch.style.borderRadius = '50%';
                if (dot) dot.style.display = 'block';
            } else if (this.settings.crosshairType === 'circle') {
                ch.style.border = `2px solid ${this.settings.crosshairColor}`;
                ch.style.borderRadius = '50%';
                if (dot) dot.style.display = 'block';
            } else {
                ch.style.border = 'none';
                ch.style.borderRadius = '0';
                if (dot) dot.style.display = 'block';
            }
        }
    }

    createSettingsUI() {
        const div = document.createElement('div');
        div.id = 'settings-modal';
        div.className = 'modal-screen';
        div.style.display = 'none';
        div.style.zIndex = '150';

        div.innerHTML = `
            <div class="modal-content" style="max-width: 550px;">
                <h2 class="modal-title" style="font-size: 42px; color: #00e5ff;">GAME SETTINGS</h2>
                <div style="display: flex; flex-direction: column; gap: 15px; margin: 20px 0; text-align: left;">
                    <div>
                        <label style="font-size: 22px; color: #ffd700; display: flex; justify-content: space-between;">
                            <span>FIELD OF VIEW (FOV):</span>
                            <span id="fov-display">${this.settings.fov}°</span>
                        </label>
                        <input type="range" id="fov-slider" min="70" max="120" value="${this.settings.fov}" style="width: 100%; cursor: pointer;">
                    </div>
                    <div>
                        <label style="font-size: 22px; color: #ffd700; display: flex; justify-content: space-between;">
                            <span>MAUS-EMPFINDLICHKEIT:</span>
                            <span id="sens-display">${(this.settings.sensitivity * 1000).toFixed(1)}</span>
                        </label>
                        <input type="range" id="sens-slider" min="5" max="50" value="${this.settings.sensitivity * 10000}" style="width: 100%; cursor: pointer;">
                    </div>
                    <div>
                        <label style="font-size: 22px; color: #ffd700; display: flex; justify-content: space-between;">
                            <span>LAUTSTÄRKE:</span>
                            <span id="vol-display">${Math.round(this.settings.masterVolume * 100)}%</span>
                        </label>
                        <input type="range" id="vol-slider" min="0" max="100" value="${this.settings.masterVolume * 100}" style="width: 100%; cursor: pointer;">
                    </div>
                    <div>
                        <label style="font-size: 22px; color: #ffd700; display: block; margin-bottom: 5px;">FADENKREUZ-STIL:</label>
                        <select id="crosshair-select" style="width: 100%; background: #222; color: #fff; border: 1px solid #555; padding: 6px; font-size: 18px; font-family: 'Teko'; border-radius: 4px;">
                            <option value="cross" ${this.settings.crosshairType === 'cross' ? 'selected' : ''}>Klassisches Fadenkreuz (+)</option>
                            <option value="dot" ${this.settings.crosshairType === 'dot' ? 'selected' : ''}>Punkt (Dot)</option>
                            <option value="circle" ${this.settings.crosshairType === 'circle' ? 'selected' : ''}>Kreis mit Punkt</option>
                        </select>
                    </div>
                </div>
                <button class="start-btn" id="close-settings-btn" style="width: 100%; font-size: 26px;">SCHLIESSEN & SPEICHERN</button>
            </div>
        `;

        document.body.appendChild(div);

        // Bind events
        document.getElementById('fov-slider').addEventListener('input', (e) => {
            this.settings.fov = parseInt(e.target.value);
            document.getElementById('fov-display').textContent = `${this.settings.fov}°`;
            this.applySettings();
        });

        document.getElementById('sens-slider').addEventListener('input', (e) => {
            this.settings.sensitivity = parseInt(e.target.value) / 10000;
            document.getElementById('sens-display').textContent = (this.settings.sensitivity * 1000).toFixed(1);
        });

        document.getElementById('vol-slider').addEventListener('input', (e) => {
            this.settings.masterVolume = parseInt(e.target.value) / 100;
            document.getElementById('vol-display').textContent = `${Math.round(this.settings.masterVolume * 100)}%`;
            this.applySettings();
        });

        document.getElementById('crosshair-select').addEventListener('change', (e) => {
            this.settings.crosshairType = e.target.value;
            this.applySettings();
        });

        document.getElementById('close-settings-btn').addEventListener('click', () => {
            this.saveSettings();
            div.style.display = 'none';
            if (this.game.matchActive) {
                document.getElementById('canvas-container').querySelector('canvas').requestPointerLock();
            }
        });
    }

    toggleSettings() {
        const div = document.getElementById('settings-modal');
        if (div.style.display === 'none' || !div.style.display) {
            div.style.display = 'flex';
            document.exitPointerLock();
        } else {
            this.saveSettings();
            div.style.display = 'none';
            if (this.game.matchActive) {
                document.getElementById('canvas-container').querySelector('canvas').requestPointerLock();
            }
        }
    }
}

window.SettingsManager = SettingsManager;

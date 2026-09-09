# Vortex Arena 🌀

[![WebGL 3D](https://img.shields.io/badge/Render-WebGL%20%2F%20Three.js-blue.svg)]()
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Vanilla%20JS)-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platforms](https://img.shields.io/badge/Platform-Browser%20(Chrome%20%7C%20Edge%20%7C%20Firefox)-orange.svg)]()

> **Vortex Arena** ist ein rasanter, vollwertiger 3D-Retro-Arena-Ego-Shooter im Browser, inspiriert von den legendären Arena-FPS-Klassikern der späten 90er Jahre. Das Spiel wurde von Grund auf in **reinem HTML5, WebGL (Three.js) und der Web Audio API** entwickelt – 100 % autark, ohne Build-Tools, Node.js-Server oder externe Frameworks.

---

## ⚡ Spielfunktionen im Überblick

### 1. Echte VQ3 / CPM Movement-Physik (`pmove`)
* **Reibungs- & Beschleunigungs-Modell**: Mathematisch exakte Implementation von `pm_friction` und Luftbeschleunigung (`pm_airaccelerate`).
* **Strafe-Jumping & Bunny-Hopping**: Wer im Sprung schräg vorwärts läuft und die Maus synchron mitdreht, baut kontinuierlich Horizontalgeschwindigkeit auf (sichtbar am Live-Speedometer in UPS von 320 bis weit über 650+ UPS!).
* **Rocket-Jumping**: Explosionen am Boden verleihen gewaltigen Vertikalimpuls für spektakuläre Höhensprünge.
* **Flüssigkeits- & Schwimmphysik**: Eintauchen in Wasser/Säure mit realistischer Viskosität, Auftrieb (Leertaste halten) und Tiefen-Platschsounds.
* **Jump-Pads**: Parabelförmige Katapultflüge mit vorgegebenen Geschwindigkeitsvektoren.

---

### 2. Das 7-Waffen-Arsenal
1. **Circular Saw (SAW)**: Rotierende Kreissäge für den tödlichen Nahkampf (*Humiliation-Auszeichnung*).
2. **Machinegun (MG)**: Schnellfeuer-Hitscan mit Mündungsfeuer und Einschlagfunken.
3. **Combat Shotgun (SG)**: Fächerschuss mit 11 Pellets für verheerenden Nahbereichsschaden.
4. **Rocket Launcher (RL)**: Projektile mit dynamischem Rauchpartikelschweif, Splash-Damage und Rocket-Jumps.
5. **Railgun (RG)**: Präziser Scharfschützen-Energiestrahl mit cyanfarbener **Spiral-Partikelhelix** und 100 Sofortschaden (*Impressive-Auszeichnung*).
6. **Plasma Rifle (PG)**: Schnell fliegende ionisierte Plasma-Orbs mit violettem Leuchtschein.
7. **Vortex BFG (BFG)**: Kolossale Superwaffe mit gigantischer grüner Plasmakugel und 9-Meter-Schockwelle (150 Schaden).

---

### 3. 9 Aufsteigende 3D-Arenen

| Level | Name | Beschreibung & Mechaniken |
| :---: | :--- | :--- |
| **1** | **The Courtyard** | Symmetrischer gotischer Steinhof mit Säulen, Balkonen und Raketenwerfer-Podest. |
| **2** | **Gothic Temple** | Mehrstöckige Kathedrale mit 4 Jump-Pads, MegaHealth und kochendem Lavagraben. |
| **3** | **The Longest Yard** | Schwebende Plattformen im All über dem endlosen Weltraumabgrund mit Hochgeschwindigkeits-Jump-Pads. |
| **4** | **Brimstone Core** | Gewaltiger Vulkanreaktor über einem 80x80m großen Lavameer mit 4 Eckbastionen und schwebenden Hängebrücken. |
| **5** | **Crypt of the Damned** | Düstere Katakomben mit 2 überfluteten Wasserflügeln, Schwimmphysik und Scharfschützen-Galerie. |
| **6** | **Space Chamber** | Orbitale Station mit Rundlauf-Teleportern, 4 Satelliten-Waffenplattformen und 22m hohem Orbitalschrein. |
| **7** | **The Iron Citadel** | Gewaltige 3-stufige Eisenfestung (80x80m) mit 4 Wachtürmen (25m Höhe) und Vertikalliften. |
| **8** | **The Void Sanctuary** | Achteckige Weltraum-Ringarena mit zentralem Leerenloch, schwebendem Quad Damage und Außenfelsen. |
| **9** | **The Final Altar** | Monumentale Boss-Arena gegen Arena-Lord Xaero mit erhabenem Champion-Thron und 50-Frag-Finale. |

---

### 4. Integrierter 3D In-Game Level-Editor (Taste `E`)
* Im laufenden Spiel jederzeit per Taste **`E`** zwischen Ego-Perspektive und 3D-Editor umschalten.
* **Raycast-Platzierung mit Raster-Snap** (1m, 2m oder 4m Raster).
* Setzen und Entfernen von:
  * Solid Blocks (2x2x2)
  * Jump-Pads mit definiertem Impuls
  * Teleporter-Portalen
  * Waffen-Spawns, Health, Armor, Quad Damage und Bot-Spawnpunkten.
* **Rechtsklick**: Platzierten Block sofort löschen.
* **JSON Export & Import**: Selbst gebaute Arenen mit einem Klick als `.json`-Datei auf die Festplatte exportieren oder vorhandene Maps laden.

---

### 5. Hochentwickelte Bot-KI
* **Predictive Lead Aiming**: Bots antizipieren die Laufrichtung des Spielers bei langsamen Projektilen (Raketen, Plasma, BFG) und schießen in den Laufweg.
* **Kreis-Strafing & Bunny-Hop Ausweichen**: Bots umkreisen den Gegner im Gefecht und führen unberechenbare Sprungmanöver aus.
* **Taktischer Rückzug**: Fällt die Gesundheit unter 35 HP, fliehen Bots gezielt zu entfernten Wegpunkten auf der Suche nach Medipacks.

---

### 6. Grafik, Audio & UI
* **Dynamische Mündungsfeuer-Weltbeleuchtung**: Schüsse werfen in Echtzeit farbcodierte Lichtreflexe (Cyan, Violett, Smaragdgrün) an Wände und Decken.
* **Persistente Oberflächen-Decals**: Einschusslöcher und rauchende Explosionskrater bleiben an Wänden haften.
* **Animierte Lava-Shader**: Prozedural berechnete, blubbernde Lava mit dynamischen Hitzeblasen.
* **3D Stereo Spatial Audio**: Richtungs- und distanzabhängige Soundortung von Schritten, Schüssen und Schmerzenslauten.
* **Gladiator-HUD**: Klassische Ziffernfarben, Speedometer in UPS und animiertes Portrait-Gesicht, das bei Treffern Schmerzgrimassen schneidet und bei niedrigen HP blutig wird.
* **Tournament Medaillen**: Animierte Pop-in Auszeichnungen (*★ IMPRESSIVE! ★*, *★ HUMILIATION! ★*, *★ EXCELLENT! ★*).
* **In-Game Optionen (Taste `O`)**: Stufenloser FOV-Slider (70° bis 120° Quake-Pro-View), Mausempfindlichkeit, Lautstärke, Fadenkreuz-Stile sowie Grafikpresets & Live-FPS-Counter.
* **120 FPS High-Refresh Engine (Optimiert für Intel Arc 140V & moderne iGPUs)**:
  * Zero-GC Physikschleife ohne permanente Objekt-Allokationen in der Hauptberechnung.
  * Geometrie- & Material-Pooling für Partikelsysteme und Decals.
  * Textur- und 2D-HUD-Throttling zur Entlastung des Haupt-Renderthreads.
  * Ultra-Performance-Modus mit PixelRatio-1:1-Locking für ruckelfreie 120 FPS bei ca. 8,3 ms Frametime.

---

## 🎮 Steuerung

| Taste | Aktion |
| :--- | :--- |
| **W, A, S, D** / **Pfeiltasten** | Fortbewegung (**S**: Stoppt automatisches Gehen) |
| **Taste C** / **NumLock** | **Automatisches Gehen an / aus** (Auto-Walk / Auto-Forward) |
| **Maus** | Umschauen (Pointer Lock) |
| **Linksklick** | Waffe abfeuern |
| **Leertaste** | Springen / Strafe-Jumping / Auftauchen im Wasser |
| **1 bis 7** oder **Mausrad** | Waffen wechseln (1: SAW, 2: MG, 3: SG, 4: RL, 5: RG, 6: PG, 7: BFG) |
| **Taste E** | 3D Level-Editor an / aus |
| **Taste O** | Optionen & Spieleinstellungen (FOV, Sens, Sound, Crosshair) |
| **TAB** | Live-Scoreboard anzeigen |
| **Rechtsklick im Editor** | Ausgewählten Block entfernen |

---

## 🚀 Schnellstart

### 1. Direkt im Browser (100% Offline-fähig)
Öffne die Datei `index.html` einfach per Doppelklick in einem modernen Webbrowser (**Google Chrome, Microsoft Edge, Firefox, Brave**). Three.js ist lokal im Ordner `lib/` hinterlegt – es ist **keine Internetverbindung erforderlich**.

### 2. Über das mitgelieferte PowerShell-Startskript (Windows)
```powershell
cd quake3
.\run_game.ps1
```
*Startet einen internen Server auf `http://localhost:8080` und öffnet das Spiel automatisch im Standardbrowser.*

---

## 👥 Credits
* **Coding & Game Design**: Felix Schmidt
* **Music / Soundtrack**: Venjent (*Looping In-Game Arena Track: [usysqd.mp3](https://files.catbox.moe/usysqd.mp3)*)

---

## 📜 Lizenz & Urheberrechtshinweis

Dieses Projekt ist unter der **MIT-Lizenz** lizenziert – freie Nutzung, Modifikation und Weitergabe gestattet.

*Alle Grafiken, Shader, 3D-Geometrien, Texturen, Audio-Synthesen und Soundeffekte wurden prozedural bzw. eigenständig ohne urheberrechtlich geschützte Originaldateien Dritter erstellt.*

# Quake III Arena - HTML5 WebGL Edition

Ein vollwertiger, moderner 3D-Klon des legendären **Quake III Arena** im Browser – entwickelt mit Three.js, Web Audio API und nativer Quake-Physik.

[![Quake 3 Arena Web](https://img.shields.io/badge/Quake%203-Arena%20WebGL-red.svg)](https://github.com/enzocage/quake3)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Zero-Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen.svg)]()

---

## 🔥 Features im Überblick

### 1. 3 Aufsteigende 3D-Arenen
* **Level 1: The Courtyard** – Klassische gotische Arena mit Steinsäulen, Balkonen und Raketenwerfer im Zentrum.
* **Level 2: Gothic Temple** – Vertikale Kathedrale mit 4 **Jump-Pads**, MegaHealth (+100), Teleportern und Scharfschützen-Plattformen.
* **Level 3: The Longest Yard (Q3DM17)** – Die legendäre Weltraum-Karte mit schwebenden Plattformen im All, weiten Jump-Pad-Sprüngen, schwebendem **Quad Damage** und tödlichem Weltraum-Abgrund.

### 2. Echte Quake 3 Movement-Physik (`pmove`)
* Authentische Bodenreibung (`pm_friction`) und Luftbeschleunigung (`pm_airaccelerate`).
* **Strafe-Jumping / Bunny-Hopping**: Kontinuierlicher Geschwindigkeitszuwachs (320 bis 650+ UPS) bei synchroner Mausdrehung.
* **Rocket-Jumping**: Raketenschüsse auf den Boden verleihen gewaltigen Vertikalimpuls.
* **Jump-Pads**: Exakte parabelförmige Katapultflüge.

### 3. Vollständiges Waffenarsenal (7 Waffen)
1. **Gauntlet (GNT)**: Rotierende Säge für Nahkampf ("Humiliation!").
2. **Machinegun (MG)**: Schnellfeuer-Hitscan mit Mündungsfeuer.
3. **Shotgun (SG)**: Fächerschuss mit 11 Pellets für den Nahkampf.
4. **Rocket Launcher (RL)**: Projektile mit Rauchpartikelspur, Splash-Damage und Rocket-Jumps.
5. **Railgun (RG)**: Sofortiger 100-Schaden-Strahl mit originaler **grün-blauer Spiral-Partikelhelix** ("Impressive!").
6. **Plasma Gun (PG)**: Schnell fliegende blaue Plasmaorbs mit Flächeneffekt.
7. **BFG10K (BFG)**: Kolossale Superwaffe mit gigantischer grüner Plasmakugel und verheerender 9-Meter-Schockwelle (150 Schaden).

### 4. Integrierter 3D Level-Editor (Taste `E`)
* Im laufenden Spiel per Taste `E` in den Editor-Modus wechseln.
* **Raycast-Platzierung mit Raster-Snap** (1m, 2m, 4m).
* Beliebige Blöcke, Jump-Pads, Teleporter, Waffen, Health, Armor, Quad Damage und Bot-Spawns platzieren.
* **JSON Map Export & Import**: Eigene Arenen exportieren und teilen.

### 5. Taktische Bot-KI & Predictive Aiming
* **Vorhalte-Zielen (Predictive Lead)**: Bots antizipieren Bewegungen bei Raketen, Plasma und BFG.
* **Kreis-Strafing & Bunny-Hop Ausweichen**: Dynamische Ausweichmanöver im Gefecht.
* **Taktischer Rückzug**: Flucht zu Medipacks bei HP < 35.

### 6. Quake 3 HUD & Spatial 3D Audio
* Quake 3 Statusleiste mit Rüstung, Gesundheit, Munition.
* **Animiertes Sarge-Gesicht**: Blickt mit den Augen mit, raucht eine Zigarre, schneidet Schmerzgrimassen und wird bei niedrigen HP blutig.
* **Hit-Marker & Signature "Ding"-Ton** bei Treffern.
* **Quake Announcer**: Sprachansagen ("Fight!", "Impressive!", "Humiliation!", "Quad Damage!", "Excellent!").
* **Einstellungsmenü (Taste `O`)**: FOV-Slider (70° bis 120°), Mausempfindlichkeit, Lautstärke und Fadenkreuz-Stile.

---

## 🚀 Spiel starten

### Über das PowerShell-Startskript
```powershell
cd quake3-arena-web
.\run_game.ps1
```

### Direkt im Browser
Öffne `index.html` direkt in Microsoft Edge oder Google Chrome (funktioniert 100% offline, Three.js ist lokal in `lib/` enthalten).

---

## 🎮 Steuerung

| Taste | Funktion |
| :--- | :--- |
| **WASD / Pfeiltasten** | Bewegen |
| **Maus** | Umschauen |
| **Linksklick** | Schießen |
| **Leertaste** | Springen / Strafe-Jump / Bunnyhop |
| **1 - 7 / Mausrad** | Waffen wechseln (1: GNT bis 7: BFG) |
| **TAB** | Scoreboard anzeigen |
| **Taste E** | 3D Level-Editor an/aus |
| **Taste O** | Optionen & Settings (FOV, Sens, Sound) |
| **Rechtsklick im Editor** | Platzierten Block löschen |

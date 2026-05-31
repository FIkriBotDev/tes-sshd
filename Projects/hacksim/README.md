# Hacker Life Simulator 3D

**Version 2.0 — Project Eclipse**

Browser-based 3D Open World Investigation RPG. Live in Neo Satria City, solve mysteries, upgrade hardware, and uncover Project Eclipse.

---

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Controls

| Action       | Desktop         | Mobile              |
|--------------|-----------------|---------------------|
| Move         | WASD            | Left joystick       |
| Look         | Mouse           | Right drag          |
| Sprint       | Shift           | —                   |
| Interact     | E               | E button            |
| Exit computer| ESC             | ESC                 |

---

## Project Structure

```
src/
├── components/
│   ├── MainMenu/       — Main menu, new game, import/export
│   ├── World/          — 3D scenes, player controller, NPCs
│   │   └── scenes/     — Apartment, City
│   ├── ExOS/           — Fictional OS interface
│   │   └── apps/       — Terminal, Mail, Missions, Scanner, Inventory, Status, Marketplace, Research
│   ├── HUD/            — In-game HUD, minimap
│   ├── Dialogue/       — NPC dialogue system
│   └── UI/             — Loading, Settings, Interaction prompt, Mobile controls
├── stores/
│   └── gameStore.ts    — Zustand global state
├── data/
│   ├── missions.ts     — All missions
│   ├── npcs.ts         — NPC data & dialogues
│   ├── mail.ts         — Starting emails
│   ├── shopItems.ts    — Hardware & consumables
│   └── initialState.ts — Default player state
├── types/
│   └── game.ts         — All TypeScript types
└── utils/
    ├── saveSystem.ts       — LocalStorage save/load
    └── terminalCommands.ts — Terminal command processor
```

---

## Audio

Place `backsound-menu.mp3` in `public/audio/` for main menu music.

---

## Save System

- **Auto-save**: Triggers on mission complete, level up, purchase
- **Export**: Downloads `hls3d-save-TIMESTAMP.json`
- **Import**: Upload any valid save JSON file

---

## Story Chapters

1. The Missing Packet
2. Project Eclipse
3. Ghost Network
4. The Watchers
5. The Seven Architects
6. Digital Shadows
7. The Vault
8. Revelation
9. Eclipse Awakens
10. The Last Node

---

## Tech Stack

- React 18 + TypeScript
- Three.js + React Three Fiber + Drei
- Tailwind CSS + Framer Motion
- Zustand (state management)
- Vite (build tool)

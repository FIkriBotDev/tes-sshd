import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  GameScreen, PlayerStats, SkillTree, Hardware,
  InventoryItem, Mission, MissionStatus, StoryProgress,
  MailMessage, District, GameSettings, SaveData, ReputationRank,
} from '../types';
import { INITIAL_HARDWARE, INITIAL_SKILLS, INITIAL_STATS, INITIAL_STORY } from '../data/initialState';
import { MISSIONS_DATA } from '../data/missions';
import { MAIL_DATA } from '../data/mail';
import { saveToLocalStorage, loadFromLocalStorage } from '../utils/saveSystem';

interface GameState {
  // ── Screen ──────────────────────────────────────────────
  screen: GameScreen;
  setScreen: (screen: GameScreen) => void;

  // ── Player ──────────────────────────────────────────────
  playerName: string;
  stats: PlayerStats;
  skills: SkillTree;
  hardware: Hardware;
  inventory: InventoryItem[];
  playtime: number;

  // ── World ───────────────────────────────────────────────
  unlockedDistricts: District[];
  nearbyInteractable: string | null;
  setNearbyInteractable: (id: string | null) => void;
  isUsingComputer: boolean;
  setUsingComputer: (val: boolean) => void;
  currentLocation: string;
  setCurrentLocation: (loc: string) => void;

  // ── Missions ────────────────────────────────────────────
  missions: Mission[];
  activeMissionId: string | null;
  setActiveMission: (id: string | null) => void;
  completeMissionObjective: (missionId: string, objectiveId: string) => void;
  completeMission: (missionId: string) => void;

  // ── Story ───────────────────────────────────────────────
  story: StoryProgress;
  setStoryFlag: (flag: string, value: boolean) => void;

  // ── Mail ────────────────────────────────────────────────
  mail: MailMessage[];
  markMailRead: (id: string) => void;
  addMail: (msg: MailMessage) => void;

  // ── NPC ─────────────────────────────────────────────────
  discoveredNPCs: string[];
  discoverNPC: (id: string) => void;
  activeDialogueNPC: string | null;
  setActiveDialogueNPC: (id: string | null) => void;

  // ── Settings ────────────────────────────────────────────
  settings: GameSettings;
  updateSettings: (partial: Partial<GameSettings>) => void;

  // ── Save / Load ─────────────────────────────────────────
  hasSave: boolean;
  newGame: (name: string) => void;
  saveGame: () => void;
  loadGame: () => boolean;
  exportSave: () => void;
  importSave: (json: string) => boolean;

  // ── Progression ─────────────────────────────────────────
  addXP: (amount: number) => void;
  addMoney: (amount: number) => void;
  addReputation: (amount: number) => void;
  addInventoryItem: (item: InventoryItem) => void;
  removeInventoryItem: (id: string, qty?: number) => void;
  upgradeSkill: (skill: keyof SkillTree) => void;
  installHardware: (slot: string, item: import('../types').HardwareItem) => void;
}

function calcReputationRank(rep: number): ReputationRank {
  if (rep >= 900) return 'Cyber Legend';
  if (rep >= 700) return 'Elite Operator';
  if (rep >= 500) return 'Cyber Specialist';
  if (rep >= 350) return 'Cyber Investigator';
  if (rep >= 200) return 'Network Specialist';
  if (rep >= 100) return 'Junior Analyst';
  if (rep >= 30)  return 'Script Beginner';
  return 'Unknown';
}

function calcXPToNext(level: number): number {
  return Math.floor(100 * Math.pow(1.4, level - 1));
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // ── Screen ──────────────────────────────────────────────
    screen: 'main-menu',
    setScreen: (screen) => set({ screen }),

    // ── Player ──────────────────────────────────────────────
    playerName: 'Player',
    stats: INITIAL_STATS,
    skills: INITIAL_SKILLS,
    hardware: INITIAL_HARDWARE,
    inventory: [],
    playtime: 0,

    // ── World ───────────────────────────────────────────────
    unlockedDistricts: ['residential'],
    nearbyInteractable: null,
    setNearbyInteractable: (id) => set({ nearbyInteractable: id }),
    isUsingComputer: false,
    setUsingComputer: (val) => set({ isUsingComputer: val }),
    currentLocation: 'apartment',
    setCurrentLocation: (loc) => set({ currentLocation: loc }),

    // ── Missions ────────────────────────────────────────────
    missions: MISSIONS_DATA,
    activeMissionId: null,
    setActiveMission: (id) => set({ activeMissionId: id }),

    completeMissionObjective: (missionId, objectiveId) => {
      set((state) => ({
        missions: state.missions.map((m) =>
          m.id === missionId
            ? {
                ...m,
                objectives: m.objectives.map((o) =>
                  o.id === objectiveId ? { ...o, completed: true } : o
                ),
              }
            : m
        ),
      }));
    },

    completeMission: (missionId) => {
      const mission = get().missions.find((m) => m.id === missionId);
      if (!mission) return;
      set((state) => ({
        missions: state.missions.map((m) =>
          m.id === missionId ? { ...m, status: 'completed' as MissionStatus } : m
        ),
        activeMissionId: state.activeMissionId === missionId ? null : state.activeMissionId,
      }));
      get().addXP(mission.rewards.xp);
      get().addMoney(mission.rewards.money);
      get().addReputation(mission.rewards.reputation);
    },

    // ── Story ───────────────────────────────────────────────
    story: INITIAL_STORY,
    setStoryFlag: (flag, value) =>
      set((state) => ({
        story: { ...state.story, flags: { ...state.story.flags, [flag]: value } },
      })),

    // ── Mail ────────────────────────────────────────────────
    mail: MAIL_DATA,
    markMailRead: (id) =>
      set((state) => ({
        mail: state.mail.map((m) => (m.id === id ? { ...m, read: true } : m)),
      })),
    addMail: (msg) => set((state) => ({ mail: [msg, ...state.mail] })),

    // ── NPC ─────────────────────────────────────────────────
    discoveredNPCs: [],
    discoverNPC: (id) =>
      set((state) => ({
        discoveredNPCs: state.discoveredNPCs.includes(id)
          ? state.discoveredNPCs
          : [...state.discoveredNPCs, id],
      })),
    activeDialogueNPC: null,
    setActiveDialogueNPC: (id) => set({ activeDialogueNPC: id }),

    // ── Settings ────────────────────────────────────────────
    settings: {
      masterVolume: 0.7,
      musicVolume: 0.3,
      sfxVolume: 0.6,
      mouseSensitivity: 0.5,
      fov: 75,
      showFPS: false,
      language: 'en',
      graphicsQuality: 'high',
    },
    updateSettings: (partial) =>
      set((state) => ({ settings: { ...state.settings, ...partial } })),

    // ── Save / Load ─────────────────────────────────────────
    hasSave: loadFromLocalStorage() !== null,

    newGame: (name) => {
      set({
        playerName: name,
        stats: INITIAL_STATS,
        skills: INITIAL_SKILLS,
        hardware: INITIAL_HARDWARE,
        inventory: [],
        missions: MISSIONS_DATA,
        story: INITIAL_STORY,
        mail: MAIL_DATA,
        discoveredNPCs: [],
        unlockedDistricts: ['residential'],
        playtime: 0,
        screen: 'loading',
      });
      setTimeout(() => {
        get().saveGame();
        set({ screen: 'world', hasSave: true });
      }, 2000);
    },

    saveGame: () => {
      const s = get();
      const data: SaveData = {
        version: '2.0.0',
        timestamp: Date.now(),
        playerName: s.playerName,
        stats: s.stats,
        skills: s.skills,
        hardware: s.hardware,
        inventory: s.inventory,
        missions: Object.fromEntries(s.missions.map((m) => [m.id, m.status])),
        story: s.story,
        mail: s.mail,
        discoveredNPCs: s.discoveredNPCs,
        unlockedDistricts: s.unlockedDistricts,
        settings: s.settings,
        playtime: s.playtime,
      };
      saveToLocalStorage(data);
    },

    loadGame: () => {
      const data = loadFromLocalStorage();
      if (!data) return false;
      set({
        playerName: data.playerName,
        stats: data.stats,
        skills: data.skills,
        hardware: data.hardware,
        inventory: data.inventory,
        story: data.story,
        mail: data.mail,
        discoveredNPCs: data.discoveredNPCs,
        unlockedDistricts: data.unlockedDistricts,
        settings: data.settings,
        playtime: data.playtime,
        missions: MISSIONS_DATA.map((m) => ({
          ...m,
          status: data.missions[m.id] ?? m.status,
        })),
        screen: 'world',
        hasSave: true,
      });
      return true;
    },

    exportSave: () => {
      get().saveGame();
      const data = loadFromLocalStorage();
      if (!data) return;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hls3d-save-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },

    importSave: (json) => {
      try {
        const data: SaveData = JSON.parse(json);
        if (!data.version || !data.playerName) return false;
        saveToLocalStorage(data);
        return get().loadGame();
      } catch {
        return false;
      }
    },

    // ── Progression ─────────────────────────────────────────
    addXP: (amount) => {
      set((state) => {
        let { level, xp, xpToNext } = state.stats;
        xp += amount;
        while (xp >= xpToNext) {
          xp -= xpToNext;
          level++;
          xpToNext = calcXPToNext(level);
        }
        return { stats: { ...state.stats, level, xp, xpToNext } };
      });
    },

    addMoney: (amount) =>
      set((state) => ({
        stats: { ...state.stats, money: Math.max(0, state.stats.money + amount) },
      })),

    addReputation: (amount) =>
      set((state) => {
        const rep = Math.max(0, Math.min(1000, state.stats.reputation + amount));
        return {
          stats: {
            ...state.stats,
            reputation: rep,
            reputationRank: calcReputationRank(rep),
          },
        };
      }),

    addInventoryItem: (item) =>
      set((state) => {
        const existing = state.inventory.find((i) => i.id === item.id);
        if (existing) {
          return {
            inventory: state.inventory.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          };
        }
        return { inventory: [...state.inventory, item] };
      }),

    removeInventoryItem: (id, qty = 1) =>
      set((state) => ({
        inventory: state.inventory
          .map((i) => (i.id === id ? { ...i, quantity: i.quantity - qty } : i))
          .filter((i) => i.quantity > 0),
      })),

    upgradeSkill: (skill) =>
      set((state) => {
        const current = state.skills[skill];
        if (current >= 10) return state;
        const cost = (current + 1) * 500;
        if (state.stats.money < cost) return state;
        return {
          skills: { ...state.skills, [skill]: current + 1 },
          stats: { ...state.stats, money: state.stats.money - cost },
        };
      }),

    // Install hardware directly (used by marketplace)
    installHardware: (slot, item) =>
      set((state) => ({
        hardware: { ...state.hardware, [slot]: item },
      })),
  }))
);

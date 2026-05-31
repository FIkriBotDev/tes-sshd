// ============================================================
// CORE GAME TYPES — Hacker Life Simulator 3D
// ============================================================

export type GameScreen =
  | 'main-menu'
  | 'loading'
  | 'world'
  | 'exos'
  | 'dialogue'
  | 'settings'
  | 'credits';

export type District =
  | 'residential'
  | 'shopping'
  | 'university'
  | 'business'
  | 'industrial'
  | 'datacenter'
  | 'underground'
  | 'government'
  | 'techpark';

// ── Player ──────────────────────────────────────────────────

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNext: number;
  money: number;
  reputation: number;
  reputationRank: ReputationRank;
}

export type ReputationRank =
  | 'Unknown'
  | 'Script Beginner'
  | 'Junior Analyst'
  | 'Network Specialist'
  | 'Cyber Investigator'
  | 'Cyber Specialist'
  | 'Elite Operator'
  | 'Cyber Legend';

export interface SkillTree {
  networking: number;
  programming: number;
  research: number;
  osint: number;
  cryptography: number;
  digitalForensics: number;
  automation: number;
  socialEngineering: number;
}

export interface Hardware {
  cpu: HardwareItem;
  ram: HardwareItem;
  ssd: HardwareItem;
  gpu: HardwareItem;
  monitor: HardwareItem;
  router: HardwareItem;
  serverRack: HardwareItem | null;
  aiAssistant: HardwareItem | null;
}

export interface HardwareItem {
  id: string;
  name: string;
  tier: number; // 1-5
  bonus: string;
}

// ── Inventory ───────────────────────────────────────────────

export type ItemCategory =
  | 'research-note'
  | 'encrypted-drive'
  | 'usb-device'
  | 'blueprint'
  | 'credential'
  | 'network-key'
  | 'hardware-part'
  | 'rare-artifact'
  | 'consumable';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  quantity: number;
  data?: Record<string, unknown>; // mission-specific payload
}

// ── Missions ────────────────────────────────────────────────

export type MissionStatus = 'locked' | 'available' | 'active' | 'completed' | 'failed';
export type MissionType = 'story' | 'side' | 'daily';

export interface MissionObjective {
  id: string;
  description: string;
  completed: boolean;
  type: 'visit' | 'talk' | 'scan' | 'collect' | 'analyze' | 'decrypt' | 'investigate';
  targetId?: string; // NPC id, location id, item id
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  chapter?: number;
  status: MissionStatus;
  objectives: MissionObjective[];
  rewards: {
    xp: number;
    money: number;
    reputation: number;
    items?: string[]; // item ids
  };
  requiredLevel?: number;
  requiredReputation?: number;
}

// ── Story ────────────────────────────────────────────────────

export type ChapterId =
  | 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5'
  | 'ch6' | 'ch7' | 'ch8' | 'ch9' | 'ch10';

export interface StoryProgress {
  currentChapter: ChapterId;
  completedChapters: ChapterId[];
  flags: Record<string, boolean>; // story flags / choices
}

// ── NPCs ─────────────────────────────────────────────────────

export type NPCOccupation =
  | 'student' | 'teacher' | 'programmer' | 'shop-owner'
  | 'researcher' | 'security-analyst' | 'delivery-driver'
  | 'cafe-employee' | 'corporate-executive' | 'unknown';

export interface NPCScheduleEntry {
  hour: number; // 0-23
  location: string;
  activity: string;
}

export interface NPC {
  id: string;
  name: string;
  occupation: NPCOccupation;
  district: District;
  schedule: NPCScheduleEntry[];
  dialogues: DialogueTree;
  isKeyNPC: boolean;
  metByPlayer: boolean;
}

export interface DialogueTree {
  greeting: string;
  lines: DialogueLine[];
}

export interface DialogueLine {
  id: string;
  text: string;
  responses?: DialogueResponse[];
  triggersFlag?: string;
  givesItem?: string;
  startsMission?: string;
}

export interface DialogueResponse {
  text: string;
  nextId?: string;
  endsDialogue?: boolean;
}

// ── Mail ─────────────────────────────────────────────────────

export interface MailMessage {
  id: string;
  from: string;
  subject: string;
  body: string;
  timestamp: number;
  read: boolean;
  attachments?: string[]; // item ids
  triggersMission?: string;
}

// ── Save Data ────────────────────────────────────────────────

export interface SaveData {
  version: string;
  timestamp: number;
  playerName: string;
  stats: PlayerStats;
  skills: SkillTree;
  hardware: Hardware;
  inventory: InventoryItem[];
  missions: Record<string, MissionStatus>;
  story: StoryProgress;
  mail: MailMessage[];
  discoveredNPCs: string[];
  unlockedDistricts: District[];
  settings: GameSettings;
  playtime: number; // seconds
}

// ── Settings ─────────────────────────────────────────────────

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  mouseSensitivity: number;
  fov: number;
  showFPS: boolean;
  language: string;
  graphicsQuality: 'low' | 'medium' | 'high';
}

// ── World ─────────────────────────────────────────────────────

export interface WorldLocation {
  id: string;
  name: string;
  district: District;
  position: [number, number, number];
  interactable: boolean;
  unlocked: boolean;
  description: string;
}

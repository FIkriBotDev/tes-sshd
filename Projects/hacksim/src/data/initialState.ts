import type { PlayerStats, SkillTree, Hardware, StoryProgress } from '../types';

export const INITIAL_STATS: PlayerStats = {
  level: 1,
  xp: 0,
  xpToNext: 100,
  money: 500,
  reputation: 0,
  reputationRank: 'Unknown',
};

export const INITIAL_SKILLS: SkillTree = {
  networking: 1,
  programming: 1,
  research: 1,
  osint: 0,
  cryptography: 0,
  digitalForensics: 0,
  automation: 0,
  socialEngineering: 0,
};

export const INITIAL_HARDWARE: Hardware = {
  cpu: { id: 'cpu-t1', name: 'Basic CPU X1', tier: 1, bonus: 'Standard processing speed' },
  ram: { id: 'ram-t1', name: '4GB DDR3', tier: 1, bonus: 'Basic multitasking' },
  ssd: { id: 'ssd-t1', name: '128GB SSD', tier: 1, bonus: 'Standard storage' },
  gpu: { id: 'gpu-t1', name: 'Integrated Graphics', tier: 1, bonus: 'Basic rendering' },
  monitor: { id: 'mon-t1', name: '19" Monitor', tier: 1, bonus: 'Standard display' },
  router: { id: 'rtr-t1', name: 'Basic Router v1', tier: 1, bonus: '10 Mbps connection' },
  serverRack: null,
  aiAssistant: null,
};

export const INITIAL_STORY: StoryProgress = {
  currentChapter: 'ch1',
  completedChapters: [],
  flags: {},
};

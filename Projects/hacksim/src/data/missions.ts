import type { Mission } from '../types';

export const MISSIONS_DATA: Mission[] = [
  // ── CHAPTER 1 ──────────────────────────────────────────────
  {
    id: 'ch1-m1',
    title: 'The Missing Packet',
    description:
      'You received an anonymous email: "There is something wrong with this city." Investigate the source.',
    type: 'story',
    chapter: 1,
    status: 'available',
    objectives: [
      { id: 'obj1', description: 'Read the anonymous email', completed: false, type: 'investigate', targetId: 'mail-anon-01' },
      { id: 'obj2', description: 'Use your computer to trace the email header', completed: false, type: 'scan', targetId: 'home-computer' },
      { id: 'obj3', description: 'Visit the Cyber Cafe and ask around', completed: false, type: 'visit', targetId: 'cyber-cafe' },
      { id: 'obj4', description: 'Talk to Zara at the Cyber Cafe', completed: false, type: 'talk', targetId: 'npc-zara' },
    ],
    rewards: { xp: 150, money: 200, reputation: 10 },
    requiredLevel: 1,
  },
  {
    id: 'ch1-m2',
    title: 'First Scan',
    description: 'Learn to use the Network Scanner. Scan the local network from your apartment.',
    type: 'story',
    chapter: 1,
    status: 'locked',
    objectives: [
      { id: 'obj1', description: 'Open ExOS on your computer', completed: false, type: 'investigate', targetId: 'home-computer' },
      { id: 'obj2', description: 'Run the Network Scanner app', completed: false, type: 'scan' },
      { id: 'obj3', description: 'Analyze the scan results', completed: false, type: 'analyze' },
    ],
    rewards: { xp: 100, money: 150, reputation: 5 },
    requiredLevel: 1,
  },

  // ── SIDE MISSIONS ──────────────────────────────────────────
  {
    id: 'side-m1',
    title: 'Lost Research',
    description:
      'Professor Hana at the University reports that research files have gone missing from the server.',
    type: 'side',
    status: 'available',
    objectives: [
      { id: 'obj1', description: 'Visit the University', completed: false, type: 'visit', targetId: 'university' },
      { id: 'obj2', description: 'Talk to Professor Hana', completed: false, type: 'talk', targetId: 'npc-hana' },
      { id: 'obj3', description: 'Access the research server terminal', completed: false, type: 'scan', targetId: 'uni-server' },
      { id: 'obj4', description: 'Read the access logs', completed: false, type: 'investigate' },
      { id: 'obj5', description: 'Identify the suspicious user account', completed: false, type: 'analyze' },
      { id: 'obj6', description: 'Report findings to Professor Hana', completed: false, type: 'talk', targetId: 'npc-hana' },
    ],
    rewards: { xp: 200, money: 350, reputation: 20, items: ['item-research-note-01'] },
    requiredLevel: 2,
  },
  {
    id: 'side-m2',
    title: 'Delivery Disruption',
    description: 'A delivery driver named Riko says his route app keeps crashing. Something is interfering with the network.',
    type: 'side',
    status: 'available',
    objectives: [
      { id: 'obj1', description: 'Talk to Riko near the Shopping District', completed: false, type: 'talk', targetId: 'npc-riko' },
      { id: 'obj2', description: 'Scan the Shopping District network', completed: false, type: 'scan' },
      { id: 'obj3', description: 'Find the interference source', completed: false, type: 'investigate' },
      { id: 'obj4', description: 'Decrypt the interference signal', completed: false, type: 'decrypt' },
    ],
    rewards: { xp: 120, money: 250, reputation: 15 },
    requiredLevel: 1,
  },
  {
    id: 'side-m3',
    title: 'Hardware Hunt',
    description: 'The Computer Store owner Marcus has a special RAM module but needs you to retrieve a component from the warehouse.',
    type: 'side',
    status: 'available',
    objectives: [
      { id: 'obj1', description: 'Talk to Marcus at the Computer Store', completed: false, type: 'talk', targetId: 'npc-marcus' },
      { id: 'obj2', description: 'Visit the Industrial District warehouse', completed: false, type: 'visit', targetId: 'industrial-warehouse' },
      { id: 'obj3', description: 'Collect the RAM module', completed: false, type: 'collect', targetId: 'item-ram-t2' },
      { id: 'obj4', description: 'Return to Marcus', completed: false, type: 'talk', targetId: 'npc-marcus' },
    ],
    rewards: { xp: 80, money: 0, reputation: 10, items: ['ram-t2'] },
    requiredLevel: 1,
  },

  // ── CHAPTER 2 ──────────────────────────────────────────────
  {
    id: 'ch2-m1',
    title: 'Project Eclipse',
    description: 'The email trail leads to a classified project. Dig deeper into the corporate network.',
    type: 'story',
    chapter: 2,
    status: 'locked',
    objectives: [
      { id: 'obj1', description: 'Decrypt the second anonymous message', completed: false, type: 'decrypt' },
      { id: 'obj2', description: 'Visit the Business District', completed: false, type: 'visit', targetId: 'business-district' },
      { id: 'obj3', description: 'Find a way into the corporate building', completed: false, type: 'investigate' },
      { id: 'obj4', description: 'Access the internal network terminal', completed: false, type: 'scan', targetId: 'corp-terminal' },
      { id: 'obj5', description: 'Download the Project Eclipse file fragment', completed: false, type: 'collect' },
    ],
    rewards: { xp: 300, money: 500, reputation: 30, items: ['item-eclipse-fragment-01'] },
    requiredLevel: 3,
  },
];

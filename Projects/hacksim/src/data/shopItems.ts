export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'hardware' | 'consumable' | 'software';
  tier: number;
  requiredLevel?: number;
  hardwareSlot?: string;
  bonus?: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  // ── CPU ──────────────────────────────────────────────────
  { id: 'cpu-t2', name: 'QuadCore X4', description: 'Faster processing. Reduces scan time.', price: 800, category: 'hardware', tier: 2, requiredLevel: 2, hardwareSlot: 'cpu', bonus: '2x scan speed' },
  { id: 'cpu-t3', name: 'OctoCore X8', description: 'High-performance CPU for complex operations.', price: 2500, category: 'hardware', tier: 3, requiredLevel: 5, hardwareSlot: 'cpu', bonus: '4x scan speed, unlock automation' },
  { id: 'cpu-t4', name: 'NexCore X16', description: 'Elite processor. Unlocks advanced missions.', price: 8000, category: 'hardware', tier: 4, requiredLevel: 8, hardwareSlot: 'cpu', bonus: '8x speed, AI processing' },

  // ── RAM ──────────────────────────────────────────────────
  { id: 'ram-t2', name: '16GB DDR4', description: 'Better multitasking. Run more apps simultaneously.', price: 600, category: 'hardware', tier: 2, requiredLevel: 2, hardwareSlot: 'ram', bonus: 'Run 3 apps at once' },
  { id: 'ram-t3', name: '32GB DDR5', description: 'High-capacity memory for research operations.', price: 1800, category: 'hardware', tier: 3, requiredLevel: 5, hardwareSlot: 'ram', bonus: 'Run 6 apps, faster research' },

  // ── SSD ──────────────────────────────────────────────────
  { id: 'ssd-t2', name: '512GB NVMe', description: 'Faster storage. Quicker file access.', price: 500, category: 'hardware', tier: 2, requiredLevel: 2, hardwareSlot: 'ssd', bonus: 'Faster file operations' },
  { id: 'ssd-t3', name: '2TB NVMe Pro', description: 'Large capacity for storing evidence and data.', price: 1500, category: 'hardware', tier: 3, requiredLevel: 4, hardwareSlot: 'ssd', bonus: 'Store more items, faster decrypt' },

  // ── GPU ──────────────────────────────────────────────────
  { id: 'gpu-t2', name: 'RenderX 4060', description: 'Dedicated GPU. Enables visual analysis tools.', price: 1200, category: 'hardware', tier: 2, requiredLevel: 3, hardwareSlot: 'gpu', bonus: 'Visual analysis unlocked' },
  { id: 'gpu-t3', name: 'RenderX 4090', description: 'High-end GPU for advanced cryptography.', price: 4000, category: 'hardware', tier: 3, requiredLevel: 6, hardwareSlot: 'gpu', bonus: 'Crypto acceleration, 3D mapping' },

  // ── Router ───────────────────────────────────────────────
  { id: 'rtr-t2', name: 'NetPro Router v2', description: 'Faster connection. Better scan range.', price: 700, category: 'hardware', tier: 2, requiredLevel: 2, hardwareSlot: 'router', bonus: '100 Mbps, wider scan range' },
  { id: 'rtr-t3', name: 'NetPro Router v3', description: 'Advanced routing. Enables deep packet analysis.', price: 2200, category: 'hardware', tier: 3, requiredLevel: 5, hardwareSlot: 'router', bonus: '1 Gbps, deep packet analysis' },

  // ── Monitor ──────────────────────────────────────────────
  { id: 'mon-t2', name: '27" Dual Monitor', description: 'Dual screen setup. Better multitasking UI.', price: 900, category: 'hardware', tier: 2, requiredLevel: 2, hardwareSlot: 'monitor', bonus: 'Dual app view' },
  { id: 'mon-t3', name: '32" Triple Setup', description: 'Triple monitor array. Maximum workspace.', price: 3000, category: 'hardware', tier: 3, requiredLevel: 6, hardwareSlot: 'monitor', bonus: 'Triple app view, enhanced UI' },

  // ── Consumables ──────────────────────────────────────────
  { id: 'energy-drink', name: 'Energy Drink', description: 'Restores focus. Temporary XP boost.', price: 25, category: 'consumable', tier: 1, bonus: '+10% XP for 5 minutes' },
  { id: 'coffee', name: 'Black Coffee', description: 'Classic programmer fuel.', price: 15, category: 'consumable', tier: 1, bonus: '+5% speed for 3 minutes' },
];

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../stores/gameStore';
import type { InventoryItem, ItemCategory } from '../../../types';

const CATEGORY_ICONS: Record<ItemCategory, string> = {
  'research-note':   '📄',
  'encrypted-drive': '💾',
  'usb-device':      '🔌',
  'blueprint':       '📐',
  'credential':      '🔑',
  'network-key':     '🗝',
  'hardware-part':   '⚙',
  'rare-artifact':   '◈',
  'consumable':      '☕',
};

const CATEGORY_COLOR: Record<ItemCategory, string> = {
  'research-note':   'text-[#00aaff]',
  'encrypted-drive': 'text-[#ffb300]',
  'usb-device':      'text-[#00ff41]',
  'blueprint':       'text-[#44ffcc]',
  'credential':      'text-[#ff8844]',
  'network-key':     'text-[#cc88ff]',
  'hardware-part':   'text-[#88ff44]',
  'rare-artifact':   'text-[#ff44aa]',
  'consumable':      'text-[#ffcc44]',
};

const ALL_CATEGORIES: ItemCategory[] = [
  'research-note', 'encrypted-drive', 'usb-device', 'blueprint',
  'credential', 'network-key', 'hardware-part', 'rare-artifact', 'consumable',
];

export default function InventoryApp() {
  const { inventory, removeInventoryItem } = useGameStore();
  const [filter, setFilter] = useState<ItemCategory | 'all'>('all');
  const [selected, setSelected] = useState<InventoryItem | null>(null);

  const filtered = filter === 'all'
    ? inventory
    : inventory.filter((i) => i.category === filter);

  const usedCategories = new Set(inventory.map((i) => i.category));

  return (
    <motion.div
      className="h-full flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Sidebar: categories */}
      <div className="w-44 border-r border-[#1a3a1a] flex flex-col">
        <div className="px-4 py-3 border-b border-[#1a3a1a] bg-[#0d1a0d]">
          <span className="text-[#00ff41] font-mono text-sm font-bold">INVENTORY</span>
          <div className="text-[#3a6a3a] font-mono text-xs mt-0.5">{inventory.length} items</div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <button
            onClick={() => setFilter('all')}
            className={`w-full text-left px-4 py-2 font-mono text-xs transition-colors ${
              filter === 'all' ? 'text-[#00ff41] bg-[#00ff41]/10' : 'text-[#3a6a3a] hover:text-[#6aaa6a]'
            }`}
          >
            All Items
          </button>
          {ALL_CATEGORIES.filter((c) => usedCategories.has(c)).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`w-full text-left px-4 py-2 font-mono text-xs transition-colors flex items-center gap-2 ${
                filter === cat ? 'text-[#00ff41] bg-[#00ff41]/10' : 'text-[#3a6a3a] hover:text-[#6aaa6a]'
              }`}
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              <span className="capitalize truncate">{cat.replace('-', ' ')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Item grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1a3a1a] bg-[#0d1a0d]">
          <span className="text-[#3a6a3a] font-mono text-xs">
            {filtered.length} item{filtered.length !== 1 ? 's' : ''} {filter !== 'all' ? `— ${filter.replace('-', ' ')}` : ''}
          </span>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <span className="text-[#1a3a1a] font-mono text-4xl mb-3">▣</span>
                <span className="text-[#2a4a2a] font-mono text-sm">No items found</span>
                <span className="text-[#1a3a1a] font-mono text-xs mt-1">
                  Complete missions to collect items
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {filtered.map((item) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setSelected(selected?.id === item.id ? null : item)}
                    className={`p-3 rounded border text-left transition-all ${
                      selected?.id === item.id
                        ? 'border-[#00ff41]/50 bg-[#00ff41]/10'
                        : 'border-[#1a3a1a] bg-[#0d1a0d]/50 hover:border-[#2a5a2a]'
                    }`}
                  >
                    <div className={`text-xl mb-2 ${CATEGORY_COLOR[item.category]}`}>
                      {CATEGORY_ICONS[item.category]}
                    </div>
                    <div className="text-[#6aaa6a] font-mono text-xs font-bold leading-tight mb-1 truncate">
                      {item.name}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-xs ${CATEGORY_COLOR[item.category]}`}>
                        {item.category.replace('-', ' ')}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[#3a6a3a] font-mono text-xs">x{item.quantity}</span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-56 border-l border-[#1a3a1a] p-4 flex flex-col"
              >
                <div className={`text-3xl mb-3 ${CATEGORY_COLOR[selected.category]}`}>
                  {CATEGORY_ICONS[selected.category]}
                </div>
                <h3 className="text-[#00ff41] font-mono text-sm font-bold mb-1">{selected.name}</h3>
                <div className={`font-mono text-xs mb-3 ${CATEGORY_COLOR[selected.category]}`}>
                  {selected.category.replace('-', ' ').toUpperCase()}
                </div>
                <p className="text-[#6aaa6a] font-mono text-xs leading-relaxed flex-1">
                  {selected.description}
                </p>
                <div className="mt-4 pt-4 border-t border-[#1a3a1a]">
                  <div className="flex justify-between text-xs font-mono mb-3">
                    <span className="text-[#3a6a3a]">Quantity</span>
                    <span className="text-[#00ff41]">{selected.quantity}</span>
                  </div>
                  {selected.category === 'consumable' && (
                    <button
                      onClick={() => { removeInventoryItem(selected.id, 1); setSelected(null); }}
                      className="w-full py-2 border border-[#00ff41]/30 text-[#00ff41] font-mono text-xs rounded hover:bg-[#00ff41]/10 transition-colors"
                    >
                      Use Item
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

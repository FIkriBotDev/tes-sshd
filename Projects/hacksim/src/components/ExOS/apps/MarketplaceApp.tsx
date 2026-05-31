import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../stores/gameStore';
import { SHOP_ITEMS, type ShopItem } from '../../../data/shopItems';

const CATEGORY_FILTER = ['all', 'hardware', 'consumable', 'software'] as const;
type Filter = typeof CATEGORY_FILTER[number];

export default function MarketplaceApp() {
  const { stats, hardware, addMoney, addInventoryItem, installHardware } = useGameStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [notification, setNotification] = useState<{ msg: string; ok: boolean } | null>(null);

  const filtered = SHOP_ITEMS.filter((item) => {
    if (filter !== 'all' && item.category !== filter) return false;
    return true;
  });

  const showNotif = (msg: string, ok: boolean) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 2500);
  };

  const handleBuy = (item: ShopItem) => {
    if (stats.money < item.price) {
      showNotif(`Insufficient credits. Need $${item.price - stats.money} more.`, false);
      return;
    }
    if (item.requiredLevel && stats.level < item.requiredLevel) {
      showNotif(`Requires Level ${item.requiredLevel}.`, false);
      return;
    }

    addMoney(-item.price);

    if (item.category === 'hardware' && item.hardwareSlot) {
      const slot = item.hardwareSlot;
      installHardware(slot, { id: item.id, name: item.name, tier: item.tier, bonus: item.bonus ?? '' });
      showNotif(`${item.name} installed successfully!`, true);
    } else {
      addInventoryItem({
        id: item.id,
        name: item.name,
        description: item.description,
        category: 'consumable',
        quantity: 1,
      });
      showNotif(`${item.name} added to inventory.`, true);
    }
  };

  const canAfford = (item: ShopItem) => stats.money >= item.price;
  const meetsLevel = (item: ShopItem) => !item.requiredLevel || stats.level >= item.requiredLevel;

  return (
    <motion.div
      className="h-full flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="px-6 py-3 border-b border-[#1a3a1a] bg-[#0d1a0d] flex items-center justify-between">
        <div>
          <span className="text-[#00ff41] font-mono text-sm font-bold">MARKETPLACE</span>
          <span className="ml-3 text-[#3a6a3a] font-mono text-xs">Chen's Tech & Supply</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#3a6a3a] font-mono text-xs">Balance:</span>
          <span className="text-[#ffb300] font-mono text-sm font-bold">${stats.money.toLocaleString()}</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-[#1a3a1a] bg-[#0a0f0a]">
        {CATEGORY_FILTER.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 font-mono text-xs transition-colors capitalize ${
              filter === f
                ? 'text-[#00ff41] border-b-2 border-[#00ff41] bg-[#00ff41]/5'
                : 'text-[#3a6a3a] hover:text-[#6aaa6a]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mx-6 mt-3 px-4 py-2 rounded border font-mono text-xs ${
              notification.ok
                ? 'border-[#00ff41]/40 text-[#00ff41] bg-[#00ff41]/10'
                : 'border-[#ff4444]/40 text-[#ff4444] bg-[#ff4444]/10'
            }`}
          >
            {notification.ok ? '✓ ' : '✗ '}{notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Item list */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => {
              const affordable = canAfford(item);
              const levelOk = meetsLevel(item);
              const available = affordable && levelOk;

              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelected(selected?.id === item.id ? null : item)}
                  className={`p-4 rounded border text-left transition-all ${
                    selected?.id === item.id
                      ? 'border-[#00ff41]/50 bg-[#00ff41]/10'
                      : available
                        ? 'border-[#1a3a1a] bg-[#0d1a0d]/50 hover:border-[#2a5a2a]'
                        : 'border-[#1a3a1a]/50 bg-[#0a0f0a]/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[#6aaa6a] font-mono text-xs font-bold leading-tight pr-2">
                      {item.name}
                    </span>
                    <span className={`font-mono text-xs shrink-0 font-bold ${affordable ? 'text-[#ffb300]' : 'text-[#ff4444]'}`}>
                      ${item.price.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[#3a6a3a] font-mono text-xs leading-relaxed mb-2 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <TierBadge tier={item.tier} />
                    {item.requiredLevel && (
                      <span className={`font-mono text-xs ${levelOk ? 'text-[#3a6a3a]' : 'text-[#ff4444]'}`}>
                        Lv.{item.requiredLevel}+
                      </span>
                    )}
                    {item.hardwareSlot && (
                      <span className="text-[#2a4a2a] font-mono text-xs capitalize">
                        {item.hardwareSlot}
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Detail / Buy panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-64 border-l border-[#1a3a1a] p-5 flex flex-col"
            >
              <h3 className="text-[#00ff41] font-mono text-sm font-bold mb-1">{selected.name}</h3>
              <TierBadge tier={selected.tier} />

              <div className="h-px bg-[#1a3a1a] my-4" />

              <p className="text-[#6aaa6a] font-mono text-xs leading-relaxed flex-1">
                {selected.description}
              </p>

              {selected.bonus && (
                <div className="mt-3 p-3 rounded border border-[#00ff41]/20 bg-[#00ff41]/5">
                  <span className="text-[#00ff41] font-mono text-xs">⚡ {selected.bonus}</span>
                </div>
              )}

              <div className="mt-4 space-y-2">
                {selected.requiredLevel && (
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-[#3a6a3a]">Required Level</span>
                    <span className={meetsLevel(selected) ? 'text-[#00ff41]' : 'text-[#ff4444]'}>
                      {selected.requiredLevel}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-[#3a6a3a]">Price</span>
                  <span className="text-[#ffb300] font-bold">${selected.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-[#3a6a3a]">Your Balance</span>
                  <span className={canAfford(selected) ? 'text-[#00ff41]' : 'text-[#ff4444]'}>
                    ${stats.money.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleBuy(selected)}
                disabled={!canAfford(selected) || !meetsLevel(selected)}
                className="mt-4 w-full py-2.5 border font-mono text-sm rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed border-[#00ff41]/40 text-[#00ff41] hover:bg-[#00ff41]/10"
                style={canAfford(selected) && meetsLevel(selected) ? { boxShadow: '0 0 10px rgba(0,255,65,0.1)' } : {}}
              >
                Buy — ${selected.price.toLocaleString()}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function TierBadge({ tier }: { tier: number }) {
  const colors = ['', '#6aaa6a', '#00aaff', '#ffb300', '#cc88ff', '#ff44aa'];
  const c = colors[tier] ?? '#6aaa6a';
  return (
    <span className="inline-block font-mono text-xs px-1.5 py-0.5 rounded border" style={{
      color: c, borderColor: `${c}40`, background: `${c}10`,
    }}>
      Tier {tier}
    </span>
  );
}

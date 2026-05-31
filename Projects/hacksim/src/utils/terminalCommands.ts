interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success' | 'system';
  text: string;
}

type Store = ReturnType<typeof import('../stores/gameStore').useGameStore.getState>;

function out(text: string): TerminalLine { return { type: 'output', text }; }
function err(text: string): TerminalLine { return { type: 'error', text }; }
function ok(text: string): TerminalLine  { return { type: 'success', text }; }
function sys(text: string): TerminalLine { return { type: 'system', text }; }
function blank(): TerminalLine           { return { type: 'output', text: '' }; }

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function processCommand(raw: string, store: Store): Promise<TerminalLine[]> {
  const parts = raw.trim().toLowerCase().split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  await delay(80 + Math.random() * 120);

  switch (cmd) {
    // ── help ──────────────────────────────────────────────
    case 'help':
      return [
        sys('─── ExOS Terminal Commands ───────────────────────'),
        out('  help          Show this help message'),
        out('  status        Show player status & hardware'),
        out('  scan          Scan local network'),
        out('  enumerate     Enumerate discovered nodes'),
        out('  analyze <id>  Analyze a network node'),
        out('  decrypt <id>  Attempt to decrypt a file'),
        out('  investigate   Review active investigation'),
        out('  mail          Check mail (shortcut)'),
        out('  inventory     List inventory items'),
        out('  missions      List active missions'),
        out('  research      Open research database'),
        out('  market        Open marketplace'),
        out('  upgrade       Show upgrade options'),
        out('  save          Save game progress'),
        out('  clear         Clear terminal'),
        out('  whoami        Display operator info'),
        out('  ping <host>   Ping a network host'),
        out('  ls            List current directory'),
        out('  cat <file>    Read a file'),
        sys('──────────────────────────────────────────────────'),
        blank(),
      ];

    // ── clear ─────────────────────────────────────────────
    case 'clear':
    case 'cls':
      // Signal to clear — handled by returning special marker
      return [{ type: 'system', text: '__CLEAR__' }];

    // ── whoami ────────────────────────────────────────────
    case 'whoami':
      return [
        out(`Operator  : ${store.playerName}`),
        out(`Level     : ${store.stats.level}`),
        out(`Rank      : ${store.stats.reputationRank}`),
        out(`Credits   : $${store.stats.money.toLocaleString()}`),
        out(`Chapter   : ${store.story.currentChapter.toUpperCase()}`),
        blank(),
      ];

    // ── status ────────────────────────────────────────────
    case 'status': {
      const { stats, skills, hardware } = store;
      return [
        sys('─── SYSTEM STATUS ────────────────────────────────'),
        out(`Operator  : ${store.playerName}`),
        out(`Level     : ${stats.level}  (${stats.xp}/${stats.xpToNext} XP)`),
        out(`Credits   : $${stats.money.toLocaleString()}`),
        out(`Reputation: ${stats.reputation} pts — ${stats.reputationRank}`),
        blank(),
        sys('─── HARDWARE ─────────────────────────────────────'),
        out(`CPU       : ${hardware.cpu.name} [Tier ${hardware.cpu.tier}]`),
        out(`RAM       : ${hardware.ram.name} [Tier ${hardware.ram.tier}]`),
        out(`SSD       : ${hardware.ssd.name} [Tier ${hardware.ssd.tier}]`),
        out(`GPU       : ${hardware.gpu.name} [Tier ${hardware.gpu.tier}]`),
        out(`Router    : ${hardware.router.name} [Tier ${hardware.router.tier}]`),
        blank(),
        sys('─── SKILLS ───────────────────────────────────────'),
        out(`Networking      : ${'█'.repeat(skills.networking)}${'░'.repeat(10 - skills.networking)} ${skills.networking}/10`),
        out(`Programming     : ${'█'.repeat(skills.programming)}${'░'.repeat(10 - skills.programming)} ${skills.programming}/10`),
        out(`Research        : ${'█'.repeat(skills.research)}${'░'.repeat(10 - skills.research)} ${skills.research}/10`),
        out(`OSINT           : ${'█'.repeat(skills.osint)}${'░'.repeat(10 - skills.osint)} ${skills.osint}/10`),
        out(`Cryptography    : ${'█'.repeat(skills.cryptography)}${'░'.repeat(10 - skills.cryptography)} ${skills.cryptography}/10`),
        out(`Digital Forensics: ${'█'.repeat(skills.digitalForensics)}${'░'.repeat(10 - skills.digitalForensics)} ${skills.digitalForensics}/10`),
        blank(),
      ];
    }

    // ── scan ──────────────────────────────────────────────
    case 'scan': {
      const tier = store.hardware.router.tier;
      return [
        sys('─── NETWORK SCAN ─────────────────────────────────'),
        out('Initializing scanner...'),
        out(`Router: ${store.hardware.router.name}`),
        out(`Scan range: ${tier * 10} nodes`),
        out(''),
        out('Scanning local subnet 192.168.1.0/24...'),
        out(''),
        out('  [FOUND] 192.168.1.1    — Router (Gateway)'),
        out('  [FOUND] 192.168.1.100  — Home Computer (localhost)'),
        out('  [FOUND] 192.168.1.101  — Unknown Device'),
        ...(tier >= 2 ? [
          out('  [FOUND] 192.168.1.150  — Neighbor Device'),
          out('  [FOUND] 192.168.1.200  — Smart TV'),
        ] : []),
        out(''),
        out(`Scan complete. ${tier >= 2 ? 5 : 3} nodes discovered.`),
        out('Use "analyze <ip>" to investigate a node.'),
        blank(),
      ];
    }

    // ── enumerate ─────────────────────────────────────────
    case 'enumerate':
      return [
        sys('─── NODE ENUMERATION ─────────────────────────────'),
        out('Known nodes in current session:'),
        out(''),
        out('  ID  IP Address       Hostname          Status'),
        out('  ─── ──────────────── ───────────────── ──────'),
        out('  001 192.168.1.1      gateway.local     ONLINE'),
        out('  002 192.168.1.100    localhost         ONLINE'),
        out('  003 192.168.1.101    unknown-device    ONLINE'),
        out(''),
        out('Run "scan" to discover more nodes.'),
        blank(),
      ];

    // ── analyze ───────────────────────────────────────────
    case 'analyze': {
      const target = args[0];
      if (!target) return [err('Usage: analyze <ip-address>'), blank()];
      if (target === '192.168.1.101') {
        store.addXP(15);
        return [
          sys(`─── ANALYZING ${target} ──────────────────────────`),
          out('Running port scan...'),
          out('Running service detection...'),
          out(''),
          out('  Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)'),
          out('  OS fingerprint: Unknown Linux variant'),
          out('  Hostname: ECLIPSE-NODE-03'),
          out(''),
          ok('  [!] Suspicious hostname detected: ECLIPSE-NODE-03'),
          ok('  [!] This node may be related to Project Eclipse.'),
          out(''),
          out('Investigation note added to Research Lab.'),
          ok('+15 XP — Suspicious node identified'),
          blank(),
        ];
      }
      return [
        sys(`─── ANALYZING ${target} ──────────────────────────`),
        out('Running analysis...'),
        out(`  Target: ${target}`),
        out('  Status: Standard network device'),
        out('  No suspicious activity detected.'),
        blank(),
      ];
    }

    // ── decrypt ───────────────────────────────────────────
    case 'decrypt': {
      const fileId = args[0];
      if (!fileId) return [err('Usage: decrypt <file-id>'), blank()];
      const cryptoSkill = store.skills.cryptography;
      if (cryptoSkill < 1) {
        return [
          err('Decryption failed: Cryptography skill required.'),
          out('Upgrade your Cryptography skill to decrypt files.'),
          blank(),
        ];
      }
      return [
        sys(`─── DECRYPTING ${fileId} ─────────────────────────`),
        out(`Cryptography skill: ${cryptoSkill}/10`),
        out('Attempting decryption...'),
        out('Running cipher analysis...'),
        out(''),
        out('File appears to use AES-128 encryption.'),
        out('Brute force estimated time: calculating...'),
        out(''),
        cryptoSkill >= 3
          ? ok('Decryption successful. File contents available in Inventory.')
          : err('Decryption failed. Cryptography skill too low (need level 3).'),
        blank(),
      ];
    }

    // ── investigate ───────────────────────────────────────
    case 'investigate': {
      const activeMission = store.missions.find((m) => m.id === store.activeMissionId);
      if (!activeMission) {
        return [
          out('No active investigation.'),
          out('Use "missions" to view available cases.'),
          blank(),
        ];
      }
      const pending = activeMission.objectives.filter((o) => !o.completed);
      const done = activeMission.objectives.filter((o) => o.completed);
      return [
        sys(`─── INVESTIGATION: ${activeMission.title.toUpperCase()} ─`),
        out(activeMission.description),
        out(''),
        sys('Completed objectives:'),
        ...done.map((o) => ok(`  [✓] ${o.description}`)),
        blank(),
        sys('Pending objectives:'),
        ...pending.map((o) => out(`  [ ] ${o.description}`)),
        blank(),
        out(`Rewards: ${activeMission.rewards.xp} XP | $${activeMission.rewards.money} | ${activeMission.rewards.reputation} REP`),
        blank(),
      ];
    }

    // ── mail ──────────────────────────────────────────────
    case 'mail': {
      const unread = store.mail.filter((m) => !m.read);
      return [
        sys('─── MAIL ─────────────────────────────────────────'),
        out(`${store.mail.length} messages (${unread.length} unread)`),
        out(''),
        ...store.mail.map((m, i) =>
          out(`  ${m.read ? ' ' : '●'} [${i + 1}] ${m.from.padEnd(25)} ${m.subject}`)
        ),
        out(''),
        out('Open the Mail app to read messages.'),
        blank(),
      ];
    }

    // ── inventory ─────────────────────────────────────────
    case 'inventory': {
      const items = store.inventory;
      if (items.length === 0) {
        return [out('Inventory is empty.'), blank()];
      }
      return [
        sys('─── INVENTORY ────────────────────────────────────'),
        ...items.map((item) => out(`  [${item.category.toUpperCase()}] ${item.name} x${item.quantity}`)),
        blank(),
      ];
    }

    // ── missions ──────────────────────────────────────────
    case 'missions': {
      const available = store.missions.filter((m) => m.status === 'available' || m.status === 'active');
      return [
        sys('─── MISSIONS ─────────────────────────────────────'),
        ...available.map((m) =>
          out(`  [${m.status.toUpperCase()}] ${m.title} — ${m.type.toUpperCase()}`)
        ),
        out(''),
        out('Open the Missions app for full details.'),
        blank(),
      ];
    }

    // ── save ──────────────────────────────────────────────
    case 'save':
      store.saveGame();
      return [ok('Game saved successfully.'), blank()];

    // ── ping ──────────────────────────────────────────────
    case 'ping': {
      const host = args[0] || '192.168.1.1';
      return [
        out(`PING ${host}: 56 data bytes`),
        out(`64 bytes from ${host}: icmp_seq=0 ttl=64 time=1.2 ms`),
        out(`64 bytes from ${host}: icmp_seq=1 ttl=64 time=0.9 ms`),
        out(`64 bytes from ${host}: icmp_seq=2 ttl=64 time=1.1 ms`),
        out(''),
        out(`--- ${host} ping statistics ---`),
        out('3 packets transmitted, 3 received, 0% packet loss'),
        blank(),
      ];
    }

    // ── ls ────────────────────────────────────────────────
    case 'ls':
      return [
        out('total 8'),
        out('drwxr-xr-x  documents/'),
        out('drwxr-xr-x  downloads/'),
        out('drwxr-xr-x  research/'),
        out('-rw-r--r--  readme.txt'),
        out('-rw-r--r--  network.log'),
        blank(),
      ];

    // ── cat ───────────────────────────────────────────────
    case 'cat': {
      const file = args[0];
      if (!file) return [err('Usage: cat <filename>'), blank()];
      if (file === 'readme.txt') {
        return [
          out('ExOS Personal Notes'),
          out('───────────────────'),
          out('Remember: The anonymous email. Meridian Street. Zara.'),
          out('Something is wrong with this city.'),
          out('Find out what Project Eclipse is.'),
          blank(),
        ];
      }
      if (file === 'network.log') {
        return [
          out('[2047-03-15 02:14:33] Unusual traffic detected on port 9999'),
          out('[2047-03-15 02:14:35] Destination: 10.0.eclipse.7 (unresolved)'),
          out('[2047-03-15 02:14:36] Packet size: 4096 bytes — encrypted'),
          out('[2047-03-15 02:14:40] Connection terminated by remote host'),
          blank(),
        ];
      }
      return [err(`cat: ${file}: No such file or directory`), blank()];
    }

    // ── upgrade ───────────────────────────────────────────
    case 'upgrade':
      return [
        sys('─── UPGRADE OPTIONS ──────────────────────────────'),
        out('Visit the Marketplace app to upgrade hardware.'),
        out('Visit the Research Lab to upgrade skills.'),
        out(''),
        out('Current hardware tiers:'),
        out(`  CPU    : Tier ${store.hardware.cpu.tier}`),
        out(`  RAM    : Tier ${store.hardware.ram.tier}`),
        out(`  Router : Tier ${store.hardware.router.tier}`),
        blank(),
      ];

    // ── research ──────────────────────────────────────────
    case 'research':
      return [out('Opening Research Lab...'), blank()];

    // ── market ────────────────────────────────────────────
    case 'market':
    case 'marketplace':
      return [out('Opening Marketplace...'), blank()];

    // ── unknown ───────────────────────────────────────────
    default:
      return [
        err(`Command not found: ${cmd}`),
        out('Type "help" for available commands.'),
        blank(),
      ];
  }
}

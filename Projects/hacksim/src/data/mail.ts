import type { MailMessage } from '../types';

export const MAIL_DATA: MailMessage[] = [
  {
    id: 'mail-anon-01',
    from: 'anonymous@null.net',
    subject: 'There is something wrong with this city.',
    body: `You don't know me.

But I know what you're capable of.

Something is happening in Neo Satria City. People are disappearing. Scientists. Researchers. People who asked too many questions.

I've been watching the network traffic for months. There are packets going somewhere they shouldn't. Encrypted. Routed through nodes that don't officially exist.

I call it Project Eclipse.

If you want to know the truth — start with the Cyber Cafe on Meridian Street. Ask for Zara. Tell her the packet is missing.

She'll know what it means.

Be careful. They are watching.

— A Friend`,
    timestamp: Date.now() - 3600000,
    read: false,
    triggersMission: 'ch1-m1',
  },
  {
    id: 'mail-welcome-01',
    from: 'system@exos.local',
    subject: 'Welcome to ExOS v4.2.1',
    body: `ExOS v4.2.1 — Initialization Complete.

System Status: ONLINE
Network: CONNECTED
Security: ACTIVE

Available Applications:
  > Terminal     — Command line interface
  > Mail         — Encrypted communications
  > Missions     — Active investigation board
  > Scanner      — Network analysis tool
  > Inventory    — Item management
  > Research Lab — Knowledge database
  > Marketplace  — Buy & sell equipment
  > Files        — Document storage
  > Status       — System & player info

Type 'help' in Terminal for a list of commands.

Good luck out there.

— ExOS System`,
    timestamp: Date.now() - 7200000,
    read: false,
  },
];

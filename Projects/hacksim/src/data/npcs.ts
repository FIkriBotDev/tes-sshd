import type { NPC } from '../types';

export const NPCS_DATA: NPC[] = [
  {
    id: 'npc-zara',
    name: 'Zara Voss',
    occupation: 'programmer',
    district: 'shopping',
    isKeyNPC: true,
    metByPlayer: false,
    schedule: [
      { hour: 9,  location: 'cyber-cafe',       activity: 'Working on laptop' },
      { hour: 13, location: 'cyber-cafe',        activity: 'Having lunch' },
      { hour: 15, location: 'cyber-cafe',        activity: 'Meeting contacts' },
      { hour: 20, location: 'residential-block', activity: 'Heading home' },
      { hour: 23, location: 'apartment-zara',    activity: 'Sleeping' },
    ],
    dialogues: {
      greeting: "Hey. You look like you're looking for something.",
      lines: [
        {
          id: 'zara-01',
          text: "The packet is missing? ...How do you know that phrase?",
          responses: [
            { text: "I got an email. Anonymous.", nextId: 'zara-02' },
            { text: "I'm just asking around.", nextId: 'zara-03' },
          ],
        },
        {
          id: 'zara-02',
          text: "Then they found you. Or you found them. Either way, you're in it now. Come back when you've scanned your home network. You'll see something strange.",
          triggersFlag: 'met_zara',
          responses: [{ text: "I'll do that.", endsDialogue: true }],
        },
        {
          id: 'zara-03',
          text: "Sure you are. Come back when you're ready to be honest.",
          responses: [{ text: "Okay.", endsDialogue: true }],
        },
      ],
    },
  },
  {
    id: 'npc-hana',
    name: 'Professor Hana Reyes',
    occupation: 'teacher',
    district: 'university',
    isKeyNPC: true,
    metByPlayer: false,
    schedule: [
      { hour: 8,  location: 'university-office', activity: 'Morning prep' },
      { hour: 10, location: 'university-lab',    activity: 'Teaching class' },
      { hour: 13, location: 'university-cafe',   activity: 'Lunch break' },
      { hour: 15, location: 'university-office', activity: 'Research work' },
      { hour: 18, location: 'residential-block', activity: 'Going home' },
    ],
    dialogues: {
      greeting: "Oh, hello. Are you a student? I don't recognize you.",
      lines: [
        {
          id: 'hana-01',
          text: "My research files... three months of work. Gone. The IT department says there's no trace. But I know someone accessed that server.",
          responses: [
            { text: "I can look into it.", nextId: 'hana-02' },
            { text: "What kind of research?", nextId: 'hana-03' },
          ],
        },
        {
          id: 'hana-02',
          text: "You can? The server terminal is in Lab 3B. I'll give you access. Please — find out who did this.",
          startsMission: 'side-m1',
          responses: [{ text: "I'm on it.", endsDialogue: true }],
        },
        {
          id: 'hana-03',
          text: "Network topology mapping. Specifically, I was documenting unusual traffic patterns in the city's infrastructure. Now you understand why I'm worried.",
          responses: [{ text: "I'll help you find the files.", nextId: 'hana-02' }],
        },
      ],
    },
  },
  {
    id: 'npc-marcus',
    name: 'Marcus Chen',
    occupation: 'shop-owner',
    district: 'shopping',
    isKeyNPC: false,
    metByPlayer: false,
    schedule: [
      { hour: 9,  location: 'computer-store', activity: 'Opening shop' },
      { hour: 12, location: 'computer-store', activity: 'Serving customers' },
      { hour: 18, location: 'computer-store', activity: 'Closing up' },
      { hour: 20, location: 'residential-block', activity: 'Home' },
    ],
    dialogues: {
      greeting: "Welcome to Chen's Tech! Best hardware in Neo Satria. What are you looking for?",
      lines: [
        {
          id: 'marcus-01',
          text: "I've got a DDR4 16GB module that just came in. But I need someone to pick up a component from my warehouse contact in the Industrial District. Interested?",
          responses: [
            { text: "Sure, I'll get it.", nextId: 'marcus-02' },
            { text: "Just browsing for now.", endsDialogue: true },
          ],
        },
        {
          id: 'marcus-02',
          text: "Great. Head to the warehouse on Sector 7, Industrial District. Ask for the Chen order. Bring it back and the RAM is yours.",
          startsMission: 'side-m3',
          responses: [{ text: "Got it.", endsDialogue: true }],
        },
      ],
    },
  },
  {
    id: 'npc-riko',
    name: 'Riko Tanaka',
    occupation: 'delivery-driver',
    district: 'shopping',
    isKeyNPC: false,
    metByPlayer: false,
    schedule: [
      { hour: 7,  location: 'shopping-district', activity: 'Starting deliveries' },
      { hour: 12, location: 'shopping-district', activity: 'Lunch break' },
      { hour: 14, location: 'shopping-district', activity: 'Afternoon deliveries' },
      { hour: 19, location: 'residential-block', activity: 'Done for the day' },
    ],
    dialogues: {
      greeting: "Hey, watch it — I'm trying to figure out why my app keeps crashing.",
      lines: [
        {
          id: 'riko-01',
          text: "Third time today. My delivery app just freezes. GPS goes haywire. Something's messing with the network around here.",
          responses: [
            { text: "I can scan the network and find out.", nextId: 'riko-02' },
            { text: "Sounds frustrating.", endsDialogue: true },
          ],
        },
        {
          id: 'riko-02',
          text: "You can do that? Man, if you fix this I'll owe you one. The interference seems worst near the old electronics shop.",
          startsMission: 'side-m2',
          responses: [{ text: "I'll check it out.", endsDialogue: true }],
        },
      ],
    },
  },
  {
    id: 'npc-leo',
    name: 'Leo Park',
    occupation: 'student',
    district: 'university',
    isKeyNPC: false,
    metByPlayer: false,
    schedule: [
      { hour: 8,  location: 'university-campus', activity: 'Morning class' },
      { hour: 12, location: 'university-cafe',   activity: 'Lunch' },
      { hour: 14, location: 'university-library', activity: 'Studying' },
      { hour: 18, location: 'cyber-cafe',         activity: 'Gaming' },
      { hour: 22, location: 'residential-block',  activity: 'Home' },
    ],
    dialogues: {
      greeting: "Oh hey. You're not in my class, are you?",
      lines: [
        {
          id: 'leo-01',
          text: "I've been noticing weird stuff on the campus network. Packets going to addresses that don't resolve. My professor says I'm imagining it.",
          responses: [
            { text: "What kind of addresses?", nextId: 'leo-02' },
            { text: "Interesting. I'll keep that in mind.", endsDialogue: true },
          ],
        },
        {
          id: 'leo-02',
          text: "They all start with 10.0.eclipse. Which isn't a real subnet. But the traffic is real. I saved the logs if you want them.",
          givesItem: 'item-network-log-01',
          responses: [{ text: "Yes, I'll take those logs.", endsDialogue: true }],
        },
      ],
    },
  },
];

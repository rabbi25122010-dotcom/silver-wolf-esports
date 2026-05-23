import { Match, LeaderboardEntry, RuleCategory } from './types';

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'm1',
    title: 'আইডি লেভেল ৫৫+ থাকতে হবে - Normal Full Map Match',
    subTitle: 'Misha Character নেওয়া যাবে না - কাস্টমে নিজের টিমমেট কে নিয়ে একসাথে গ্রুপ এন্ট্রি করতে হবে বাধ্যতামূলক!',
    date: '2026-05-25 at 03:45 pm',
    winPrize: 90,
    entryType: 'SQUAD',
    entryFee: 54,
    perKill: 0,
    map: 'Bermuda',
    version: 'MOBILE',
    totalSlots: 12,
    occupiedSlots: 2,
    startsAt: '25-May-2026 03:45 PM BST',
    startsInSeconds: 180000, 
    joinedTeams: ['Team Alpha', 'Team Apex'],
    roomDetails: {
      released: false,
    },
    prizeDetails: {
      first: '50 TK',
      second: '25 TK',
      third: '15 TK',
      perKill: 'Disabled (0 BDT)'
    }
  },
  {
    id: 'm2',
    title: 'আইডি লেভেল ৫৫+ থাকতে হবে - Normal Full Map Match',
    subTitle: 'Misha Character নেওয়া যাবে না - কাস্টমে নিজের টিমমেট কে নিয়ে একসাথে গ্রুপ এন্ট্রি করতে হবে বাধ্যতামূলক!',
    date: '2026-05-25 at 07:35 pm',
    winPrize: 90,
    entryType: 'SQUAD',
    entryFee: 54,
    perKill: 0,
    map: 'Bermuda',
    version: 'MOBILE',
    totalSlots: 12,
    occupiedSlots: 1,
    startsAt: '25-May-2026 07:35 PM BST',
    startsInSeconds: 194000, 
    joinedTeams: ['Silver Wolf Org'],
    roomDetails: {
      released: false,
    },
    prizeDetails: {
      first: '50 TK',
      second: '25 TK',
      third: '15 TK',
      perKill: 'Disabled (0 BDT)'
    }
  },
  {
    id: 'm3',
    title: 'Squad Kalahari Showdown - Extreme Wolf Arena',
    subTitle: 'No Grenades or Launcher. Misha block active. Proof of booyah required within 15m.',
    date: '2026-05-26 at 10:00 pm',
    winPrize: 120,
    entryType: 'SQUAD',
    entryFee: 30,
    perKill: 0,
    map: 'Kalahari',
    version: 'MOBILE',
    totalSlots: 12,
    occupiedSlots: 4,
    startsAt: '26-May-2026 10:00 PM BST',
    startsInSeconds: 298000,
    joinedTeams: ['Sniper Squad', 'Wolf Pack', 'Ranger Org', 'Apex Elite'],
    roomDetails: {
      released: false,
    },
    prizeDetails: {
      first: '70 TK',
      second: '35 TK',
      third: '15 TK',
      perKill: 'Disabled (0 BDT)'
    }
  }
];

export const TOP_PLAYERS: LeaderboardEntry[] = [];

export const RULE_CATEGORIES: RuleCategory[] = [
  {
    id: 'solo',
    titleBn: 'Solo FullMap',
    titleEn: 'Solo FullMap',
    rulesBn: [
      'ম্যাচ শুরুর সময় দেখে নিজের আইডি ও ক্যারেক্টার দিয়ে জয়েন করবেন।',
      'আইডি লেভেল ৫৫+ থাকতে হবে। কম লেভেলের আইডি দিয়ে ঢুকলে কাস্টম রুম থেকে কিক দেওয়া হবে এবং কোনো রিফান্ড দেওয়া হবে না।',
      'হ্যাক বা কনফিগারেশন ফাইল ব্যবহার করলে সরাসরি আমাদের অ্যাপ এবং কাস্টম টুর্নামেন্ট থেকে আজীবনের জন্য ব্যান করা হবে।'
    ],
    rulesEn: [
      'Join exactly using your registered ID and character name at the scheduled match time.',
      'Your Free Fire ID level must be 55+. Lower levels will be kicked out of the room with no refund.',
      'Usage of any hack, scripting, or config files will lead to lifetime ban from Silver Wolf.'
    ]
  },
  {
    id: 'duo',
    titleBn: 'Duo FullMap',
    titleEn: 'Duo FullMap',
    rulesBn: [
      'Duo and Squad Full Map Match এর নিয়মাবলী এবং শর্তসমূহ:',
      'এক্সে ম্যাচ ডেওয়া হবে না। নিজ আইডি দিয়ে আইডন্ট প্লেয়ার হিসেবে এড দিয়ে জয়েন করবেন। অন্য কারো আইডির সাথে নাম না মিললে কাস্টম থেকে কিক করা হবে।',
      'Duo সাথে কাস্টমে ঢোকার আগে আপনার টিমমেটকে ইনভাইট দিয়ে একটি গ্রুপ বানিয়ে কাস্টমে জয়েন করবেন। কাস্টমে জয়েন করে টিম লিস্ট চেক করবেন, কেউ যদি Solo থাকে তাকে কাস্টম থেকে কিক দেওয়া হবে এবং তার টিম ম্যাচ খেলতে পারবে না।',
      'এম আইডির লেভেল অবশ্যই ৫৫ এর ওপরে হতে হবে, অন্যথায় রিফান্ড পাবেন না।',
      'কাস্টম খেলায় টিমমেটদের সাথে কোঅর্ডিনেশন জরুরি, কাস্টমে জিতার পর স্ক্রিনশট দিতে হবে।'
    ],
    rulesEn: [
      'Duo and Squad Match Rules & Regulations:',
      'No multi-device entries using the same player tag in the custom room.',
      'Before entering a Duo lobby, invite your teammate first to create a Group, then join the lobby together. If you join as a Solo, you will be kicked, and your teammates won\'t receive rewards.',
      'Team members\' Free Fire overall accounts must be level 55+, otherwise no refund will be initiated.',
      'Lobby coordination is strictly monitored. Share a clear screenshot of the end results with kill feed for verify.'
    ]
  },
  {
    id: 'survival',
    titleBn: 'BR Survival',
    titleEn: 'BR Survival',
    rulesBn: [
      'BR Survival ম্যাপে সারভাইভাল পয়েন্ট এবং পজিশন পয়েন্ট অত্যন্ত গুরুত্বপূর্ণ।',
      'ম্যাচ শুরু হওয়ার সময়সূচীর ২ থেকে ৪ মিনিট আগে কাস্টম রুম আইডি ও পাসওয়ার্ড দেওয়া হবে।',
      'কাস্টম রুমে যেকোনো জায়গায় বসার নিয়ম নেই, আপনি যে টিম স্লট বুক করেছেন শুধুমাত্র সেই স্লট নাম্বারে বসবেন।'
    ],
    rulesEn: [
      'In Battle Royale Survival, placement points are prioritized heavily.',
      'Room ID and Password are provided 2 to 4 minutes before the actual match starts.',
      'Do not sit randomly in slots. Only settle in the team slot you have booked during slot booking.'
    ]
  }
];

export const DEMO_MINI_LOGS_BN = [
  '৳৫০০ উত্তোলন সফলভাবে সম্পন্ন হয়েছে (+৪৪****১২)',
  '৳১০০০ সফলভাবে যোগ করা হয়েছে (+৮৮****৪৫)',
  'নতুন স্লট ম্যাচ #m1 এ বুক হয়েছে (+৪৩****৯২)',
  '৳১২০০ সফলভাবে উত্তোলন সম্পন্ন হয়েছে (+১৭****৩৪)',
  'নতুন টিম "Silent Wolves" স্কোয়াড ১ এ জয়েন করেছে!',
  '৳১৫০ উত্তোলন সফল হয়েছে (+১৫****৯৮)',
];

export const DEMO_MINI_LOGS_EN = [
  'Withdrawal of BDT 500 successfully completed (+44****12)',
  'Deposit of BDT 1000 successfully added (+88****45)',
  'New slot successfully booked on Match #m1 (+43****92)',
  'Withdrawal of BDT 1200 completed successfully (+17****34)',
  'New Team "Silent Wolves" joined Squad Slot 1!',
  'Withdrawal of BDT 150 successfully processed (+15****98)',
];

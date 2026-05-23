export interface Match {
  id: string;
  title: string;
  subTitle: string;
  date: string;
  winPrize: number;
  entryType: 'SOLO' | 'DUO' | 'SQUAD';
  entryFee: number;
  perKill: number;
  map: 'Bermuda' | 'Purgatory' | 'Kalahari' | 'Alpine' | '3-Map Series (Bermuda, Purgatory, Kalahari)';
  version: 'MOBILE' | 'PC' | 'BOTH';
  totalSlots: number;
  occupiedSlots: number;
  startsAt: string; // ISO or human string
  startsInSeconds: number; // For live countdowns
  joinedTeams: string[];
  joinedTeamIgls?: Record<string, string>;
  joinedMobiles?: Record<string, string>;
  unjoinedTeams?: string[];
  unjoinedMobiles?: string[];
  roomDetails: {
    released: boolean;
    roomId?: string;
    password?: string;
    note?: string;
  };
  prizeDetails: {
    first: string;
    second: string;
    third: string;
    fourth?: string;
    perKill: string;
  };
}

export interface UserProfile {
  teamName: string;
  iglGameName: string;
  mobile: string;
  email: string;
  balance: number;
  winningBalance: number;
  joinedMatchesCount: number;
  notificationsEnabled: boolean;
  drawOverAppsEnabled: boolean;
  isLoggedIn: boolean;
  teamLogo?: string;
  role?: 'USER' | 'HOST_ADMIN' | 'POINT_TABLE_ADMIN' | 'OWNER';
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW';
  amount: number;
  method: 'bKash' | 'Nagad';
  accountNo: string;
  transactionId?: string; // only for deposit
  status: 'PENDING' | 'SUCCESS' | 'REJECTED';
  date: string;
  matchId?: string;       // Linked match booking request
  isManual?: boolean;     // Whether this was submitted manually
  metaTeamName?: string;  // Dynamic squad name typed at checkout
  metaIglName?: string;   // Dynamic IGL name typed at checkout
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  amount: number;
}

export interface RuleCategory {
  id: string;
  titleBn: string;
  titleEn: string;
  rulesBn: string[];
  rulesEn: string[];
}

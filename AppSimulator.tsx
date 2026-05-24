import { database } from "./firebase";
import { ref, set, onValue } from "firebase/database";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Wallet as WalletIcon, User, Bell, AlertTriangle, Play, CheckCircle, 
  ArrowLeft, Copy, Eye, EyeOff, Shield, LogOut, HelpCircle, ArrowRight,
  Sparkles, DollarSign, Smartphone, Volume2, VolumeX, Headphones, MessageSquare,
  Trash2
} from 'lucide-react';
import { Match, UserProfile, Transaction, RuleCategory, LeaderboardEntry } from './types';
import { INITIAL_MATCHES, TOP_PLAYERS, RULE_CATEGORIES, DEMO_MINI_LOGS_BN, DEMO_MINI_LOGS_EN } from './data';
import { playGlassChime, storage } from './utils';
import { motion } from 'motion/react';

interface AppSimulatorProps {
  language: 'bn' | 'en';
  setLanguage: (lang: 'bn' | 'en') => void;
}

export default function AppSimulator({ language, setLanguage }: AppSimulatorProps) {
  // App Boot State
  const [booting, setBooting] = useState<boolean>(true);
  const [bootProgress, setBootProgress] = useState<number>(0);
  const [splashLogoErr, setSplashLogoErr] = useState<boolean>(false);

  // Global sound configuration check hook
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => storage.get('sound_enabled', true));
  useEffect(() => {
    storage.set('sound_enabled', soundEnabled);
    (window as any).soundEnabled = soundEnabled;
  }, [soundEnabled]);

  // Overridden Custom High-Fidelity Alert state
  const [customAlert, setCustomAlert] = useState<{message: string} | null>(null);
  
  // Local alert override to bypass raw window.alert with a glass dialog panel
  const alert = (msg: string) => {
    setCustomAlert({ message: msg });
    if (soundEnabled) {
      playGlassChime();
    }
  };

  // Profile Settings Edit States (Team name & logo modification)
  const [profileTeamName, setProfileTeamName] = useState('');
  const [profileLogo, setProfileLogo] = useState('');

  // App Session / User State
  const [user, setUser] = useState<UserProfile>(() => {
    return storage.get<UserProfile>('user_profile', {
      teamName: 'Team Wolves BD',
      iglGameName: 'SilverWolf_IGL',
      mobile: '01894558893',
      email: 'silverwolf.ofc@gmail.com',
      balance: 0,
      winningBalance: 0,
      joinedMatchesCount: 0,
      notificationsEnabled: true,
      drawOverAppsEnabled: true,
      isLoggedIn: false // Starts signed out for a pure production launch experience
    });
  });

  // Track session on profile updates
  useEffect(() => {
    storage.set('user_profile', user);
  }, [user]);

  // Production Launch Secure Database Purge and Clear Cache
  useEffect(() => {
    const isDbFlushed = storage.get('db_launch_flushed_v3', false);
    if (!isDbFlushed) {
      storage.set('db_launch_flushed_v3', true);
      
      const freshUser: UserProfile = {
        teamName: 'Team Wolves BD',
        iglGameName: 'SilverWolf_IGL',
        mobile: '01894558893',
        email: 'silverwolf.ofc@gmail.com',
        balance: 0,
        winningBalance: 0,
        joinedMatchesCount: 0,
        notificationsEnabled: true,
        drawOverAppsEnabled: true,
        isLoggedIn: false,
        role: 'USER'
      };
      storage.set('user_profile', freshUser);
      setUser(freshUser);
      setAuthView('SIGNUP');

      storage.set('users_list', []);
      setUsersList([]);

      storage.set('transactions', []);
      setTransactions([]);
    }
  }, []);

  // Auth Fields for Sign up
  const [signupTeam, setSignupTeam] = useState('');
  const [signupLogo, setSignupLogo] = useState('');
  const [signupIgl, setSignupIgl] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupTerms, setSignupTerms] = useState(false);
  
  // Auth view switcher (SIGNUP, LOGIN, APP)
    const [authView, setAuthView] = useState<'SIGNUP' | 'LOGIN' | 'APP'>(() => {
    const savedView = storage.get('current_auth_view', 'SIGNUP');
    return savedView as 'SIGNUP' | 'LOGIN' | 'APP';
  });

  useEffect(() => {
    storage.set('current_auth_view', authView);
  }, [authView]);

  // Main navigation tab
  const [activeTab, setActiveTab] = useState<'matches' | 'wallet' | 'profile'>('matches');

  // Multi-screen stack within tabs
  const [activeSubScreen, setActiveSubScreen] = useState<string>('main'); // 'main', 'join_match', 'add_money', 'withdraw', 'rules', 'leaderboard', 'profile_edit'
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const [checkoutTeamName, setCheckoutTeamName] = useState<string>('');
  const [checkoutIglName, setCheckoutIglName] = useState<string>('');

  useEffect(() => {
    if (selectedMatch) {
      setCheckoutTeamName(user.teamName || '');
      setCheckoutIglName(user.iglGameName || '');
    }
  }, [selectedMatch, user.teamName, user.iglGameName]);

      // // Local state for dynamic changes
  const [matches, setMatches] = useState<Match[]>([]);

  // ১. ডাটাবেস থেকে রিয়েল-টাইমে ম্যাচ লিস্ট লোড করা (সব ইউজারের জন্য)
  useEffect(() => {
    const matchesRef = ref(database, "matches");
    onValue(matchesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMatches(Object.values(data));
      } else {
        setMatches([]); 
      }
    });
  }, []);

   const handleUpdateMatch = (updatedMatches: any) => {
    // নিরাপত্তা লক: অ্যাপ যদি রিফ্রেশের কারণে ভুল করে ফাঁকা বা খালি ডাটা পাঠায়, তবে তা ডাটাবেস মুছবে না
    if (!updatedMatches || (Array.isArray(updatedMatches) && updatedMatches.length === 0)) {
      console.log("ফাঁকা ডাটা ওভাররাইট করা ব্লক করা হয়েছে।");
      return;
    }
    set(ref(database, "matches"), updatedMatches)
      .then(() => console.log("ডাটাবেসে সফলভাবে সেভ হয়েছে!"))
      .catch((error) => console.error("সেভ করতে সমস্যা:", error));
  };
  
  // Dynamic state for persistent rankings/leaderboard (starts as empty fresh state)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    return storage.get<LeaderboardEntry[]>('leaderboard_data', []);
  });
  useEffect(() => {
    storage.set('leaderboard_data', leaderboard);
  }, [leaderboard]);

  // Transactions list (starts empty for fresh deployment)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const DEFAULT_TRANSACTIONS: Transaction[] = [
      {
        id: 'tx_preset_1',
        type: 'DEPOSIT',
        amount: 500,
        method: 'bKash',
        accountNo: '01711111111',
        transactionId: 'BKX928K0',
        status: 'PENDING',
        isManual: true,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      {
        id: 'tx_preset_2',
        type: 'DEPOSIT',
        amount: 300,
        method: 'Nagad',
        accountNo: '01522222222',
        transactionId: 'NGD5519P',
        status: 'PENDING',
        isManual: true,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      {
        id: 'tx_preset_3',
        type: 'WITHDRAW',
        amount: 150,
        method: 'bKash',
        accountNo: '01822222222',
        status: 'PENDING',
        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      {
        id: 'tx_preset_4',
        type: 'DEPOSIT',
        amount: 1000,
        method: 'bKash',
        accountNo: '01903362784',
        transactionId: 'BKX11111',
        status: 'SUCCESS',
        isManual: false, // Represents an instant payment gateway log
        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
      }
    ];
    const rawTxs = storage.get<Transaction[]>('transactions', DEFAULT_TRANSACTIONS);
    const seen = new Set<string>();
    return rawTxs.filter(tx => {
      if (!tx || !tx.id) return false;
      if (seen.has(tx.id)) return false;
      seen.add(tx.id);
      return true;
    });
  });

  useEffect(() => {
    storage.set('transactions', transactions);
  }, [transactions]);

  // Admin Mode & Custom Rule States
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [rulesPanelCategories, setRulesPanelCategories] = useState<RuleCategory[]>(() => {
    return storage.get<RuleCategory[]>('custom_rules_categories', RULE_CATEGORIES);
  });
  useEffect(() => {
    storage.set('custom_rules_categories', rulesPanelCategories);
  }, [rulesPanelCategories]);

  // Form states for adding and editing rules categories
  const [newCatId, setNewCatId] = useState('');
  const [newCatTitleBn, setNewCatTitleBn] = useState('');
  const [newCatTitleEn, setNewCatTitleEn] = useState('');

  const [selectedCatForEditId, setSelectedCatForEditId] = useState<string>('duo');
  const [editCatTitleBn, setEditCatTitleBn] = useState('');
  const [editCatTitleEn, setEditCatTitleEn] = useState('');
  const [editCatRulesBn, setEditCatRulesBn] = useState('');
  const [editCatRulesEn, setEditCatRulesEn] = useState('');

  useEffect(() => {
    const cat = rulesPanelCategories.find(c => c.id === selectedCatForEditId);
    if (cat) {
      setEditCatTitleBn(cat.titleBn);
      setEditCatTitleEn(cat.titleEn);
      setEditCatRulesBn((cat.rulesBn || []).join('\n'));
      setEditCatRulesEn((cat.rulesEn || []).join('\n'));
    } else {
      setEditCatTitleBn('');
      setEditCatTitleEn('');
      setEditCatRulesBn('');
      setEditCatRulesEn('');
    }
  }, [selectedCatForEditId, rulesPanelCategories]);

  // Configuration Settings (Admin editable MFS and Support links)
  const [bKashNumber, setBKashNumber] = useState<string>(() => {
    return storage.get<string>('mfs_bkash_number', '01894558893');
  });
  const [nagadNumber, setNagadNumber] = useState<string>(() => {
    return storage.get<string>('mfs_nagad_number', '01894558893');
  });
  const [telegramSupportLink, setTelegramSupportLink] = useState<string>(() => {
    return storage.get<string>('telegram_support_link', 'https://t.me/silverwolf_official_support');
  });
  const [whatsAppSupportLink, setWhatsAppSupportLink] = useState<string>(() => {
    return storage.get<string>('whatsapp_support_link', 'https://wa.me/8801894558893');
  });

  // Dedicated Editable about links
  const [aboutTelegramLink, setAboutTelegramLink] = useState<string>(() => {
    return storage.get<string>('about_telegram_link', 'https://t.me/silverwolf_official');
  });
  const [aboutMessengerLink, setAboutMessengerLink] = useState<string>(() => {
    return storage.get<string>('about_messenger_link', 'https://m.me/join/silverwolf');
  });
  const [aboutTiktokLink, setAboutTiktokLink] = useState<string>(() => {
    return storage.get<string>('about_tiktok_link', 'https://www.tiktok.com/@silverwolf_esports');
  });
  const [aboutWhatsappLink, setAboutWhatsappLink] = useState<string>(() => {
    return storage.get<string>('about_whatsapp_link', 'https://chat.whatsapp.com/silverwolf_channel');
  });

  // High-Fidelity Slot receipt popup details
  const [slotPopupDetails, setSlotPopupDetails] = useState<{
    show: boolean;
    slotNumber: number;
    teamName: string;
    matchTitle: string;
  } | null>(null);

  const [matchGuidelinesBn, setMatchGuidelinesBn] = useState<string>(() => {
    return storage.get<string>('match_guidelines_bn', 
      `১. স্লট: আপনাকে দেওয়া নির্দিষ্ট স্লট নাম্বারে বসুন। অন্য কেউ বসে থাকলে Observe-এ গিয়ে খালি হওয়া পর্যন্ত অপেক্ষা করুন। 🪑\n২. টিম নাম: রুমে ঢুকে মেসেজ অপশনে হ্যাশট্যাগ দিয়ে নিজের টিমের নাম লিখুন (যেমন: #1 SILVER_WOLF)। 📝\n৩. ফুল স্কোয়াড: অবশ্যই ৪ জন নিয়ে ঢুকবেন।\n৪. ৩টি ম্যাচ: একটি ম্যাচ শেষে বের হবেন না, মোট ৩টি ম্যাচ হবে।`
    );
  });
  const [matchGuidelinesEn, setMatchGuidelinesEn] = useState<string>(() => {
    return storage.get<string>('match_guidelines_en',
      `1. Slot: Sit on your designated slot number. If occupied, go to Observer and wait until free. 🪑\n2. Team Name: Type hashtag team name inside the room message box (e.g., #1 SILVER_WOLF). 📝\n3. Full Squad: Must join as a group of 4 players.\n4. 3 Matches: Do not leave after one match; a total of 3 consecutive matches will play.`
    );
  });

  const [supportDockOpen, setSupportDockOpen] = useState<boolean>(false);
  const [flashNotification, setFlashNotification] = useState<{show: boolean, textEn: string, textBn: string} | null>(null);

  const triggerFlashNotification = (textEn: string, textBn: string) => {
    setFlashNotification({ show: true, textEn, textBn });
    setTimeout(() => {
      setFlashNotification(null);
    }, 4000);
  };

  useEffect(() => {
    storage.set('mfs_bkash_number', bKashNumber);
  }, [bKashNumber]);
  useEffect(() => {
    storage.set('mfs_nagad_number', nagadNumber);
  }, [nagadNumber]);
  useEffect(() => {
    storage.set('telegram_support_link', telegramSupportLink);
  }, [telegramSupportLink]);
  useEffect(() => {
    storage.set('whatsapp_support_link', whatsAppSupportLink);
  }, [whatsAppSupportLink]);
  
  useEffect(() => {
    storage.set('about_telegram_link', aboutTelegramLink);
  }, [aboutTelegramLink]);
  useEffect(() => {
    storage.set('about_messenger_link', aboutMessengerLink);
  }, [aboutMessengerLink]);
  useEffect(() => {
    storage.set('about_tiktok_link', aboutTiktokLink);
  }, [aboutTiktokLink]);
  useEffect(() => {
    storage.set('about_whatsapp_link', aboutWhatsappLink);
  }, [aboutWhatsappLink]);

  useEffect(() => {
    storage.set('match_guidelines_bn', matchGuidelinesBn);
  }, [matchGuidelinesBn]);
  useEffect(() => {
    storage.set('match_guidelines_en', matchGuidelinesEn);
  }, [matchGuidelinesEn]);

  // Activity Log State
  const [activityLogs, setActivityLogs] = useState<{id: string; timestamp: string; actor: string; action: string}[]>(() => {
    const rawLogs = storage.get<{id: string; timestamp: string; actor: string; action: string}[]>('activity_logs', []);
    const seen = new Set<string>();
    return rawLogs.filter(log => {
      if (!log || !log.id) return false;
      if (seen.has(log.id)) return false;
      seen.add(log.id);
      return true;
    });
  });
  useEffect(() => {
    storage.set('activity_logs', activityLogs);
  }, [activityLogs]);

  // Central logger function
  const logActivity = (actorName: string, actionText: string) => {
    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      actor: actorName || 'System',
      action: actionText
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const triggerToast = (msg: string) => {
    triggerFlashNotification(msg, msg);
  };

  const parseMatchDateToTimestamp = (dateStr: string): number => {
    try {
      if (!dateStr) return Date.now();
      let clean = dateStr.trim();
      
      clean = clean.replace(/BST/gi, '').trim();

      // Parse: "2026-05-25 at 03:45 pm" or "2026-05-25 15:45"
      if (clean.includes(' at ')) {
        const parts = clean.split(' at ');
        const datePart = parts[0]; 
        const timePart = parts[1].replace(/pm/i, ' PM').replace(/am/i, ' AM').trim();
        let [time, meridiem] = timePart.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (meridiem && meridiem.toUpperCase() === 'PM' && hours < 12) {
          hours += 12;
        } else if (meridiem && meridiem.toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }
        const hStr = hours < 10 ? `0${hours}` : `${hours}`;
        const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
        const isoStr = `${datePart}T${hStr}:${mStr}:00`;
        const d = new Date(isoStr);
        if (!isNaN(d.getTime())) {
          return d.getTime();
        }
      }

      // Parse standard "25-May-2026 09:30 PM"
      const dashParts = clean.split('-');
      if (dashParts.length === 3) {
        const day = dashParts[0].trim();
        const monthName = dashParts[1].trim();
        const rest = dashParts[2].trim();
        const yearAndTime = rest.split(/\s+/);
        const year = yearAndTime[0];
        const timeStr = yearAndTime.slice(1).join(' ');
        clean = `${monthName} ${day}, ${year} ${timeStr}`;
      }

      clean = clean.replace(/\s+/g, ' ');

      const parsed = Date.parse(clean);
      if (!isNaN(parsed)) {
        return parsed;
      }

      const backup = new Date(clean);
      if (!isNaN(backup.getTime())) {
        return backup.getTime();
      }
    } catch (e) {
      console.error("Match Date Parsing Failed:", dateStr, e);
    }
    return new Date('2026-05-25T22:00:00').getTime();
  };

  // Ensure the Delete Button has the absolute correct Match ID parameter and executes immediate DB purge
  const handleDeleteMatch = async (matchId: string) => {
    try {
      // FORCE an immediate database delete call to the backend API
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // CRITICAL: Instantly update the Frontend UI State so the card vanishes immediately
        setMatches((prevMatches) => prevMatches.filter((match) => match.id !== matchId));
        
        // Ensure standard local storage updates to achieve "No Cache Retention"
        const dbMatches = storage.get<Match[]>('matches_data', INITIAL_MATCHES);
        const updatedDb = dbMatches.filter(m => m.id !== matchId);
        storage.set('matches_data', updatedDb);

        // Force a silent background data re-validation/refresh
        triggerToast("Match successfully deleted!");
        logActivity('Owner', `ম্যাচ ID #${matchId.toUpperCase()} সফলভাবে ডাটাবেস থেকে মুছে ফেলা হয়েছে।`);
        playGlassChime();
      } else {
        console.error("Failed to delete match from server database.");
        // Reliable offline/fallback state correction
        setMatches((prevMatches) => prevMatches.filter((match) => match.id !== matchId));
        const dbMatches = storage.get<Match[]>('matches_data', INITIAL_MATCHES);
        const updatedDb = dbMatches.filter(m => m.id !== matchId);
        storage.set('matches_data', updatedDb);
        triggerToast("Match successfully deleted!");
      }
    } catch (error) {
      console.error("Network or database connection error during match deletion:", error);
      // Reliable offline/fallback state correction
      setMatches((prevMatches) => prevMatches.filter((match) => match.id !== matchId));
      const dbMatches = storage.get<Match[]>('matches_data', INITIAL_MATCHES);
      const updatedDb = dbMatches.filter(m => m.id !== matchId);
      storage.set('matches_data', updatedDb);
      triggerToast("Match successfully deleted!");
    }
  };

  // Active listener for room credentials dispatch
  const [notifiedDispatches, setNotifiedDispatches] = useState<string[]>([]);
  useEffect(() => {
    if (!user || !user.isLoggedIn) return;
    matches.forEach(m => {
      if (m.roomDetails?.released) {
        const isJoined = m.joinedTeams?.includes(user.teamName);
        const isUnjoined = (m.unjoinedMobiles || []).includes(user.mobile) || (m.unjoinedTeams || []).includes(user.teamName);
        if (isJoined && !isUnjoined && !notifiedDispatches.includes(m.id)) {
          triggerFlashNotification(
            `Credentials released for Match #${m.id.toUpperCase()}!`,
            `ম্যাচ #${m.id.toUpperCase()} এর রুম আইডি এবং পাসওয়ার্ড উন্মুক্ত করা হয়েছে!`
          );
          setNotifiedDispatches(prev => [...prev, m.id]);
          playGlassChime();
        }
      }
    });
  }, [matches, user, notifiedDispatches]);

  // Seeded Pre-payment profiles for stable simulation
  const DEFAULT_USERS: UserProfile[] = [
    {
      teamName: 'Supreme Wolf Owner',
      iglGameName: 'Owner_Rabbi',
      mobile: '01903362784',
      email: 'rabbi25122010@gmail.com',
      balance: 1500,
      winningBalance: 500,
      joinedMatchesCount: 0,
      notificationsEnabled: true,
      drawOverAppsEnabled: true,
      isLoggedIn: false,
      role: 'OWNER'
    },
    {
      teamName: 'Warriors Express',
      iglGameName: 'Warrior_IGL',
      mobile: '01822222222',
      email: 'warriorexp@gmail.com',
      balance: 750,
      winningBalance: 120,
      joinedMatchesCount: 0,
      notificationsEnabled: true,
      drawOverAppsEnabled: true,
      isLoggedIn: false,
      role: 'HOST_ADMIN'
    },
    {
      teamName: 'Elite Force Pro',
      iglGameName: 'Force_IGL',
      mobile: '01633333333',
      email: 'eliteforce@gmail.com',
      balance: 450,
      winningBalance: 0,
      joinedMatchesCount: 0,
      notificationsEnabled: true,
      drawOverAppsEnabled: true,
      isLoggedIn: false,
      role: 'POINT_TABLE_ADMIN'
    },
    {
      teamName: 'Alpha Wolves',
      iglGameName: 'Alpha_Lobo',
      mobile: '01711111111',
      email: 'alpha@gmail.com',
      balance: 320,
      winningBalance: 0,
      joinedMatchesCount: 0,
      notificationsEnabled: true,
      drawOverAppsEnabled: true,
      isLoggedIn: false,
      role: 'USER'
    },
    {
      teamName: 'Beta Squad FF',
      iglGameName: 'Beta_Fighter',
      mobile: '01522222222',
      email: 'beta@gmail.com',
      balance: 100,
      winningBalance: 0,
      joinedMatchesCount: 0,
      notificationsEnabled: true,
      drawOverAppsEnabled: true,
      isLoggedIn: false,
      role: 'USER'
    }
  ];

  // Registered Local Users state
  const [usersList, setUsersList] = useState<UserProfile[]>(() => {
    return storage.get<UserProfile[]>('users_list', DEFAULT_USERS);
  });
  useEffect(() => {
    storage.set('users_list', usersList);
  }, [usersList]);

  // Bi-directional state synchronizer helper with clean value normalizations
  const isUserEqual = (u1: any, u2: any) => {
    if (!u1 || !u2) return u1 === u2;

    const n = (val: any) => {
      if (val === undefined || val === null) return '';
      return String(val).trim();
    };

    const num = (val: any) => {
      if (val === undefined || val === null) return 0;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    const bool = (val: any) => {
      return !!val;
    };

    return (
      n(u1.mobile) === n(u2.mobile) &&
      n(u1.email) === n(u2.email) &&
      n(u1.teamName) === n(u2.teamName) &&
      n(u1.iglGameName) === n(u2.iglGameName) &&
      num(u1.balance) === num(u2.balance) &&
      num(u1.winningBalance) === num(u2.winningBalance) &&
      num(u1.joinedMatchesCount) === num(u2.joinedMatchesCount) &&
      bool(u1.notificationsEnabled) === bool(u2.notificationsEnabled) &&
      bool(u1.drawOverAppsEnabled) === bool(u2.drawOverAppsEnabled) &&
      bool(u1.isLoggedIn) === bool(u2.isLoggedIn) &&
      n(u1.teamLogo) === n(u2.teamLogo) &&
      n(u1.role) === n(u2.role) &&
      bool(u1.banned) === bool(u2.banned)
    );
  };

  // Safely synchronize changes from the active logged-in user state to the general memory database (users_list)
  useEffect(() => {
    if (!user || !user.mobile) return;
    setUsersList(prev => {
      const idx = prev.findIndex(u => u.mobile === user.mobile);
      if (idx > -1) {
        const matched = prev[idx];
        if (!isUserEqual(matched, user)) {
          const updated = [...prev];
          updated[idx] = { ...matched, ...user };
          return updated;
        }
      } else {
        return [...prev, user];
      }
      return prev;
    });
  }, [user]);

  // Safely pull updates from the general memory database (users_list) back to the active user state (e.g. balance updates from admins)
  useEffect(() => {
    if (!user || !user.mobile) return;
    const matched = usersList.find(u => u.mobile === user.mobile);
    if (matched) {
      if (!isUserEqual(matched, user)) {
        setUser(prev => {
          if (prev && !isUserEqual(matched, prev)) {
            return { ...prev, ...matched };
          }
          return prev;
        });
      }
    }
  }, [usersList]);

  // Hidden tester gesture states
  const [showDevConsole, setShowDevConsole] = useState<boolean>(false);
  const [devTaps, setDevTaps] = useState<number>(0);

  // Administrative filters & panels
  const [ownerUserSearch, setOwnerUserSearch] = useState<string>('');
  const [ownerFinanceTab, setOwnerFinanceTab] = useState<'manual' | 'instant'>('manual');

  // Multi-tier Custom Prizes Configuration
  const [prizeTier1, setPrizeTier1] = useState<string>('৳১৮০ (60%)');
  const [prizeTier2, setPrizeTier2] = useState<string>('৳৯০ (30%)');
  const [prizeTier3, setPrizeTier3] = useState<string>('৳৩০ (10%)');
  const [prizeTier4, setPrizeTier4] = useState<string>('');

  // Interactive Live Roster Grid state
  const [expandedSquadsId, setExpandedSquadsId] = useState<string | null>(null);

  // Custom award payout overlay states
  const [payoutOverlayOpen, setPayoutOverlayOpen] = useState<boolean>(false);
  const [selectedTeamForPayout, setSelectedTeamForPayout] = useState<string>('');
  const [payoutAmount, setPayoutAmount] = useState<string>('150');

  // Embedded payment input states
  const [embeddedTxId, setEmbeddedTxId] = useState<string>('');
  const [isVerifyingEmbedded, setIsVerifyingEmbedded] = useState<boolean>(false);

  // Multi-tiered Admin Panel Interactive States
  const [adminActiveTab, setAdminActiveTab] = useState<'host' | 'pt' | 'owner'>('owner');
  
  // Host Admin states
  const [newMatchTitle, setNewMatchTitle] = useState('');
  const [newMatchSubtitle, setNewMatchSubtitle] = useState('');
  const [newMatchFee, setNewMatchFee] = useState(50);
  const [newMatchPrize, setNewMatchPrize] = useState(300);
  const [newMatchStartsAt, setNewMatchStartsAt] = useState('25-May-2026 09:30 PM BST');
  const [newMatchMap, setNewMatchMap] = useState<'Bermuda' | 'Purgatory' | 'Kalahari' | 'Alpine' | '3-Map Series (Bermuda, Purgatory, Kalahari)'>('3-Map Series (Bermuda, Purgatory, Kalahari)');
  const [newMatchLevelReq, setNewMatchLevelReq] = useState('55+');

  const [selectedMatchForRoom, setSelectedMatchForRoom] = useState<string>('');
  const [newRoomId, setNewRoomId] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [newRoomNote, setNewRoomNote] = useState('');

  // Point Table Admin states
  const [selectedMatchForResults, setSelectedMatchForResults] = useState<string>('');
  const [resultsPositions, setResultsPositions] = useState<Record<string, string>>({});
  const [resultsScreenshot, setResultsScreenshot] = useState<string>('');

  // Owner Financial states
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<string>('');
  const [newBalanceAmount, setNewBalanceAmount] = useState<number>(0);

  // Stuck transaction simulation state for Auto-Refund 30-min
  const [stuckTxActive, setStuckTxActive] = useState<boolean>(true);
  const [refundCountdown, setRefundCountdown] = useState<number>(1800); // 30 minutes in seconds
  const [stuckTxIdStr] = useState<string>('SLWSTUCK2026X');

  // Onboarding Alert states
  const [showNotificationOverlay, setShowNotificationOverlay] = useState<boolean>(false);
  const [showDrawOverAppsOverlay, setShowDrawOverAppsOverlay] = useState<boolean>(false);
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => storage.get('has_onboarded', false));

  // Dynamic glass notification alert state
  const [slotAlert, setSlotAlert] = useState<{show: boolean, textBn: string, textEn: string} | null>(null);
  
  // Custom transaction alerts from logs
  const [currentMiniLogIndex, setCurrentMiniLogIndex] = useState(0);

  // Match countdown simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setMatches(prevMatches => 
        prevMatches.map(m => {
          const targetMs = parseMatchDateToTimestamp(m.date);
          // Compare live against current device system time
          const diffSecs = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
          return { ...m, startsInSeconds: diffSecs };
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Refund simulation tick countdown
  useEffect(() => {
    if (!stuckTxActive) return;
    const interval = setInterval(() => {
      setRefundCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setStuckTxActive(false);
          // Auto-Refund completed! Trigger notification and refund state
          setUser(p => ({ ...p, balance: p.balance + 150 })); // automatic rollback returned BDT 150!
          // Add system notification alert
          setSlotAlert({
            show: true,
            textBn: '⏱️ ৩০ মিনিট অতিক্রান্ত! টাকা আনভেরিফাইড থাকায় ৳১৫০ স্বয়ংক্রিয় রিফান্ড করা হয়েছে।',
            textEn: '⏱️ 30 Mins expired! BDT 150 has been automatically refunded due to unverified status.'
          });
          playGlassChime();
          // Hide alert after 8s
          setTimeout(() => setSlotAlert(null), 8000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stuckTxActive]);

  // Format seconds to [DD Day : HH Hours : MM Minutes : SS Seconds Remaining]
  const formatCountdown = (totalSecs: number) => {
    if (totalSecs <= 0) {
      return "[00 Day : 00 Hours : 00 Minutes : 00 Seconds Remaining]";
    }
    const days = Math.floor(totalSecs / 86400);
    const hrs = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    const dStr = days < 10 ? `0${days}` : `${days}`;
    const hStr = hrs < 10 ? `0${hrs}` : `${hrs}`;
    const mStr = mins < 10 ? `0${mins}` : `${mins}`;
    const sStr = secs < 10 ? `0${secs}` : `${secs}`;
    
    const dLabel = days === 1 ? "Day" : "Days";
    const hLabel = hrs === 1 ? "Hour" : "Hours";
    const mLabel = mins === 1 ? "Minute" : "Minutes";
    const sLabel = secs === 1 ? "Second" : "Seconds";

    return `[${dStr} ${dLabel} : ${hStr} ${hLabel} : ${mStr} ${mLabel} : ${sStr} ${sLabel} Remaining]`;
  };

  // Boot Simulation
  useEffect(() => {
    if (booting) {
      const interval = setInterval(() => {
        setBootProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setBooting(false);
              // Trigger onboarding alerts on first run
              if (!hasOnboarded) {
                setShowNotificationOverlay(true);
              }
            }, 600);
            return 100;
          }
          return prev + 4;
        });
      }, 120);
      return () => clearInterval(interval);
    }
  }, [booting]);

  // Periodic Slot Release Alert (simulated every 45s)
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger new slot drop event
      const matchesToUpdate = [...matches];
      const matchIndex = Math.floor(Math.random() * matchesToUpdate.length);
      const targetMatch = matchesToUpdate[matchIndex];
      
      if (targetMatch && targetMatch.occupiedSlots < targetMatch.totalSlots) {
        // Decrease remaining slots
        targetMatch.occupiedSlots += 1;
        setMatches(matchesToUpdate);
        
        // Notify
        playGlassChime();
        setSlotAlert({
          show: true,
          textBn: `🚨 কাস্টম ম্যাচ ${targetMatch.id.toUpperCase()} স্লট বুকিং চলছে! মাত্র কয়েকটি স্লট বাকি আছে!`,
          textEn: `🚨 Slots are dropping now for Match ${targetMatch.id.toUpperCase()}! Only few slots left!`
        });
        
        // Auto hide after 8 seconds
        setTimeout(() => {
          setSlotAlert(null);
        }, 8000);
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [matches]);

  // Automated Mini-logs cycle (every 10s)
  useEffect(() => {
    const logInterval = setInterval(() => {
      setCurrentMiniLogIndex(prev => {
        const list = language === 'bn' ? DEMO_MINI_LOGS_BN : DEMO_MINI_LOGS_EN;
        return (prev + 1) % list.length;
      });
    }, 10000);
    return () => clearInterval(logInterval);
  }, [language]);

  // Simulated & Real REST API Backend interface representing the main API layer
  const triggerBackendDeleteMatchApi = async (matchId: string): Promise<boolean> => {
    try {
      console.log(`[HTTP Request] Triggering backend delete row request: DELETE /api/matches/${matchId}`);
      
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error Status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log(`[HTTP Response 200 OK] Database cascaded successfully via Express backend.`, responseData);
      
      // Update local storage database immediately to completely purge the row from database
      const dbMatches = storage.get<Match[]>('matches_data', INITIAL_MATCHES);
      const updatedDb = dbMatches.filter(m => m.id !== matchId);
      storage.set('matches_data', updatedDb);
      
      return true;
    } catch (e) {
      console.warn("Express API server not running or network blocked, executing offline/local storage database purge directly", e);
      
      // Local database self-contained purge fallback
      const dbMatches = storage.get<Match[]>('matches_data', INITIAL_MATCHES);
      const updatedDb = dbMatches.filter(m => m.id !== matchId);
      storage.set('matches_data', updatedDb);
      
      return true; // Self-contained fallback is fully successful locally
    }
  };

  // Auth Handlers
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupTeam || !signupIgl || !signupMobile || !signupPassword) {
      alert(language === 'bn' ? "দয়া করে সকল তথ্য পূরণ করুন।" : "Please fill in all details.");
      return;
    }
    if (!signupTerms) {
      alert(language === 'bn' ? "নিবন্ধন সম্পন্ন করতে শর্তাবলীতে সম্মতি দিন।" : "Please agree to the Terms & Conditions.");
      return;
    }

    // Strict Unique Mobile Check
    const registeredMobiles = storage.get<string[]>('registered_mobiles', ['01894558893']);
    if (registeredMobiles.includes(signupMobile)) {
      alert(language === 'bn'
        ? "এই মোবাইল নাম্বারটি দিয়ে ইতিমধ্যে নিবন্ধন করা হয়েছে! দয়া করে আপনার নিজস্ব ভিন্ন ইউনিক মোবাইল নাম্বার দিন।"
        : "This mobile number is already registered! Each squad must register with a unique number."
      );
      return;
    }

    // Save mobile to registered database
    storage.set('registered_mobiles', [...registeredMobiles, signupMobile]);

    const newUser: UserProfile = {
      teamName: signupTeam,
      iglGameName: signupIgl,
      mobile: signupMobile,
      email: signupMobile + '@gmail.com',
      balance: 0, // Purged for production launch
      winningBalance: 0,
      joinedMatchesCount: 0,
      notificationsEnabled: true,
      drawOverAppsEnabled: true,
      isLoggedIn: true,
      teamLogo: signupLogo || '/input_file_2.png',
      role: 'USER'
    };

    setUser(newUser);
    setUsersList(prev => {
      // Avoid duplicate registration entries
      if (prev.some(u => u.mobile === newUser.mobile)) {
        return prev;
      }
      return [...prev, newUser];
    });
    setAuthView('APP');
    setActiveTab('matches');
    setActiveSubScreen('main');
    
    // Trigger onboarding alerts
    setHasOnboarded(false);
    setShowNotificationOverlay(true);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const loginMobile = signupMobile ? signupMobile.trim() : '01894558893';
    const loginPass = signupPassword ? signupPassword.trim() : '';
    
    let newUser: UserProfile;

    if (loginMobile === '01903362784' && loginPass === 'rabbi3052') {
      newUser = {
        teamName: 'Supreme Wolf Owner',
        iglGameName: 'Owner_Rabbi',
        mobile: '01903362784',
        email: 'rabbi25122010@gmail.com',
        balance: 0,
        winningBalance: 0,
        joinedMatchesCount: 0,
        notificationsEnabled: true,
        drawOverAppsEnabled: true,
        isLoggedIn: true,
        role: 'OWNER'
      };
      logActivity('Owner', 'সুপার-এডমিন ওনার (Super-Admin) হিসেবে সিস্টেমে লগইন করেছেন।');
    } else {
      // Find user from memory database
      const existingUser = usersList.find(u => u.mobile === loginMobile);
      if (existingUser) {
        newUser = {
          ...existingUser,
          isLoggedIn: true
        };
        logActivity(existingUser.iglGameName, `${existingUser.role || 'USER'} হিসেবে অলরেডি রেজিস্টার্ড আইডি দিয়ে লগইন করেছেন।`);
      } else {
        newUser = {
          teamName: 'Team Wolves BD',
          iglGameName: 'SilverWolf_IGL',
          mobile: loginMobile,
          email: loginMobile + '@gmail.com',
          balance: 0,
          winningBalance: 0,
          joinedMatchesCount: 0,
          notificationsEnabled: true,
          drawOverAppsEnabled: true,
          isLoggedIn: true,
          role: 'USER'
        };
        // Add to users database
        setUsersList(prev => [...prev, newUser]);
        logActivity('SilverWolf_IGL', 'নতুন ইউজার হিসেবে সিস্টেমে প্রথমবার প্রবেশ করেছেন।');
      }
    }

    setUser(newUser);
    setAuthView('APP');
    setActiveTab('profile'); // Open profile so they can see their Admin Options instantly!
    setActiveSubScreen('main');
    playGlassChime();
  };

  // Onboarding Confirmation Setup
  const confirmNotifications = () => {
    setUser(prev => ({ ...prev, notificationsEnabled: true }));
    setShowNotificationOverlay(false);
    setShowDrawOverAppsOverlay(true); // chain to next permission
  };

  const confirmDrawOverApps = () => {
    setUser(prev => ({ ...prev, drawOverAppsEnabled: true }));
    setShowDrawOverAppsOverlay(false);
    setHasOnboarded(true);
    storage.set('has_onboarded', true);
    playGlassChime();
  };

  // Match Join Logic
  const [selectedWalletMethod, setSelectedWalletMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [selectedMatchJoined, setSelectedMatchJoined] = useState<boolean>(false);

  const startJoinMatch = (match: Match) => {
    if (match.joinedTeams.includes(user.teamName)) {
      alert(language === 'bn' 
        ? 'আপনি ইতিমধ্যে এই ম্যাচে সফলভাবে জয়েন করেছেন!' 
        : 'You are already registered for this tournament match!'
      );
      return;
    }

    // Check if free tournament (0 BDT entry fee)
    if (Number(match.entryFee) === 0) {
      const activeTeamName = user.teamName || `SQUAD_${user.mobile.slice(-4)}`;
      const activeIglName = user.iglGameName || 'PLAYER';
      
      // Update matches slot, teamName mapping and custom match-specific mappings live
      setMatches(prev => 
        prev.map(m => {
          if (m.id === match.id) {
            const currentIgls = m.joinedTeamIgls || {};
            const currentMobiles = m.joinedMobiles || {};
            return {
              ...m,
              occupiedSlots: Math.min(m.totalSlots, m.occupiedSlots + 1),
              joinedTeams: [...m.joinedTeams, activeTeamName],
              joinedTeamIgls: {
                ...currentIgls,
                [activeTeamName]: activeIglName
              },
              joinedMobiles: {
                ...currentMobiles,
                [activeTeamName]: user.mobile
              }
            };
          }
          return m;
        })
      );

      // Increment profile synchronously
      setUser(prev => ({
        ...prev,
        joinedMatchesCount: prev.joinedMatchesCount + 1
      }));

      // Log transaction
      const freeTx: Transaction = {
        id: 'tx_free_join_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        type: 'WITHDRAW',
        amount: 0,
        method: 'bKash',
        accountNo: user.mobile,
        metaTeamName: activeTeamName,
        metaIglName: activeIglName,
        status: 'SUCCESS',
        isManual: false,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      setTransactions(prev => [freeTx, ...prev]);

      logActivity(activeIglName, `ফ্রি টুর্নামেন্ট ম্যাচ #${match.id.toUpperCase()} এ সফলভাবে সরাসরি জয়েন করেছেন।`);
      
      const newSlotNumber = match.joinedTeams.length + 1;
      setSlotPopupDetails({
        show: true,
        slotNumber: newSlotNumber,
        teamName: activeTeamName,
        matchTitle: match.title
      });

      triggerFlashNotification(
        `🐺 Free Tournament Slot Booked! Registered for Match #${match.id.toUpperCase()}.`,
        `🐺 ফ্রি টুর্নামেন্ট বুকিং সফল! অভিনন্দন, আপনি #${match.id.toUpperCase()} ম্যাচে জয়েন করেছেন।`
      );
      playGlassChime();
      return;
    }

    setSelectedMatch(match);
    setSelectedMatchJoined(false);
    setActiveSubScreen('join_match');
  };

  const handleUnjoinMatch = (match: Match) => {
    const timeLimitSecs = 10800; // 3 hours limit (3 * 3600)
    const remainingSeconds = Number(match.startsInSeconds);

    if (remainingSeconds < timeLimitSecs) {
      alert(language === 'bn'
        ? `দুঃখিত, ম্যাচ শুরু হতে মাত্র ${Math.floor(remainingSeconds / 3600)} ঘণ্টা ${Math.floor((remainingSeconds % 3600) / 60)} মিনিট বাকি থাকায় স্লট বাতিল বা রিফান্ড সম্ভব নয় (৩ ঘণ্টার কম রয়েছে)।`
        : `Sorry, slot cancellation is locked. Only ${Math.floor(remainingSeconds / 3600)}h ${Math.floor((remainingSeconds % 3600) / 60)}m remaining (minimum 3-hour comparative limit required).`
      );
      return;
    }

    const fee = Number(match.entryFee);
    const userMobile = user.mobile;

    // Discover what team the user had joined with (search match mappings first)
    const registeredTeam = match.joinedTeams.find(team => match.joinedMobiles?.[team] === userMobile) || user.teamName;
    const updatedBalance = Number(user.balance) + fee;

    // 1. Update Current Profile State synchronously
    setUser(prev => ({
      ...prev,
      balance: updatedBalance,
      joinedMatchesCount: Math.max(0, prev.joinedMatchesCount - 1)
    }));

    // 2. Synchronize in Users List
    setUsersList(prevList => prevList.map(u => {
      if (u.mobile === userMobile) {
        return {
          ...u,
          balance: updatedBalance,
          joinedMatchesCount: Math.max(0, u.joinedMatchesCount - 1)
        };
      }
      return u;
    }));

    // 3. Subtract slot count and filter lists live
    setMatches(prevMatches => 
      prevMatches.map(m => {
        if (m.id === match.id) {
          const updatedIgls = { ...(m.joinedTeamIgls || {}) };
          const updatedMobiles = { ...(m.joinedMobiles || {}) };
          delete updatedIgls[registeredTeam];
          delete updatedMobiles[registeredTeam];

          const previousUnjoinedTeams = m.unjoinedTeams || [];
          const previousUnjoinedMobiles = m.unjoinedMobiles || [];

          return {
            ...m,
            occupiedSlots: Math.max(0, m.occupiedSlots - 1),
            joinedTeams: m.joinedTeams.filter(team => team !== registeredTeam),
            joinedTeamIgls: updatedIgls,
            joinedMobiles: updatedMobiles,
            unjoinedTeams: previousUnjoinedTeams.includes(registeredTeam) ? previousUnjoinedTeams : [...previousUnjoinedTeams, registeredTeam],
            unjoinedMobiles: previousUnjoinedMobiles.includes(userMobile) ? previousUnjoinedMobiles : [...previousUnjoinedMobiles, userMobile]
          };
        }
        return m;
      })
    );

    // 4. Record refund transaction log
    const refundTx: Transaction = {
      id: 'tx_refund_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      type: 'DEPOSIT',
      amount: fee,
      method: 'bKash', 
      accountNo: userMobile,
      status: 'SUCCESS',
      isManual: false,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setTransactions(prevTx => [refundTx, ...prevTx]);

    // 5. Log activity trace
    logActivity(user.iglGameName || 'Player', `ম্যাচ #${match.id.toUpperCase()} এর স্লট ১টি বাতিল করে ৳${fee} রিফান্ড পেয়েছেন।`);

    playGlassChime();

    // Trigger visual toast
    triggerFlashNotification(
      `Slot cancelled successfully! ৳${fee} credited to your ledger.`,
      `স্লট বাতিল সম্পন্ন হয়েছে! ৳${fee} আপনার ওয়ালেটে রিফান্ড করা হয়েছে।`
    );
  };

  const handleConfirmPayAndJoin = () => {
    if (!selectedMatch) return;

    const activeTeamName = checkoutTeamName.trim() || user.teamName;
    const activeIglName = checkoutIglName.trim() || user.iglGameName || 'N/A';

    if (!activeTeamName) {
      alert(language === 'bn' ? 'দয়া করে টিমের নাম প্রদান করুন!' : 'Please enter a valid Team Name!');
      return;
    }

    if (selectedMatch.joinedTeams.includes(activeTeamName)) {
      alert(language === 'bn' 
        ? 'এই টিমের নাম ইতিমধ্যে এই ম্যাচে যুক্ত রয়েছে!' 
        : 'This team is already registered for this tournament match!'
      );
      return;
    }
    
    if (user.balance < selectedMatch.entryFee) {
      alert(language === 'bn' 
        ? `আপনার ব্যালেন্স কম! প্রয়োজনীয় ফি: ৳${selectedMatch.entryFee}। দয়া করে ওয়ালেটে টাকা এড করুন।` 
        : `Insufficient balance! Required fee: BDT ${selectedMatch.entryFee}. Please add money to your wallet.`
      );
      setActiveTab('wallet');
      setActiveSubScreen('add_money');
      return;
    }

    // Deduct and increment profile synchronously
    setUser(prev => ({
      ...prev,
      balance: prev.balance - selectedMatch.entryFee,
      joinedMatchesCount: prev.joinedMatchesCount + 1
    }));

    // Update matches slot, teamName mapping and custom match-specific mappings live
    setMatches(prev => 
      prev.map(m => {
        if (m.id === selectedMatch.id) {
          const currentIgls = m.joinedTeamIgls || {};
          const currentMobiles = m.joinedMobiles || {};
          return {
            ...m,
            occupiedSlots: Math.min(m.totalSlots, m.occupiedSlots + 1),
            joinedTeams: [...m.joinedTeams, activeTeamName],
            joinedTeamIgls: {
              ...currentIgls,
              [activeTeamName]: activeIglName
            },
            joinedMobiles: {
              ...currentMobiles,
              [activeTeamName]: user.mobile
            }
          };
        }
        return m;
      })
    );

    // Save transaction with identity tags integrated
    const newTx: Transaction = {
      id: 'tx_join_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      type: 'WITHDRAW',
      amount: selectedMatch.entryFee,
      method: selectedWalletMethod,
      accountNo: user.mobile,
      metaTeamName: activeTeamName,
      metaIglName: activeIglName,
      status: 'SUCCESS',
      isManual: false,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setTransactions(prev => [newTx, ...prev]);

    const paidSlotNumber = selectedMatch.joinedTeams.length + 1;
    setSlotPopupDetails({
      show: true,
      slotNumber: paidSlotNumber,
      teamName: activeTeamName,
      matchTitle: selectedMatch.title
    });

    setSelectedMatchJoined(true);
    playGlassChime();
    
    // Quick overlay flash notification
    triggerFlashNotification(
      `🐺 Success! ${activeTeamName} registered for Match #${selectedMatch.id.toUpperCase()}.`,
      `🐺 অভিনন্দন! আপনি সফলভাবে ${selectedMatch.id.toUpperCase()} কাস্টম রুমে ${activeTeamName} হিসেবে জয়েন করেছেন।`
    );

    setTimeout(() => {
      setActiveSubScreen('main');
    }, 1500);
  };

  // Deposit Logic
  const [depositAmount, setDepositAmount] = useState<string>('100');
  const [depositTxId, setDepositTxId] = useState<string>('');
  const [depositMethod, setDepositMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [depositPending, setDepositPending] = useState<boolean>(false);

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || !depositTxId) {
      alert(language === 'bn' ? "দয়া করে সেন্ট মানি করার পর ট্রানজেকশন আইডি প্রদান করুন।" : "Please enter the BDT amount and Transaction ID.");
      return;
    }

    const addedAmt = parseFloat(depositAmount) || 0;
    if (addedAmt < 25) {
      alert(language === 'bn' ? "সর্বনিম্ন ২৫ টাকা ডিপোজিট করতে হবে" : "Minimum deposit amount is 25 TK.");
      return;
    }

    setDepositPending(true);
    
    // Simulate server verification delay
    setTimeout(() => {
      const addedAmt = parseFloat(depositAmount) || 0;

      // Append transaction as PENDING to be approved manually by Admin or Owner!
      const newTx: Transaction = {
        id: 'tx_dep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        type: 'DEPOSIT',
        amount: addedAmt,
        method: depositMethod,
        accountNo: user.mobile,
        transactionId: depositTxId.toUpperCase(),
        status: 'PENDING',
        isManual: true,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      setTransactions(prev => [newTx, ...prev]);

      setDepositPending(false);
      setDepositAmount('');
      setDepositTxId('');
      playGlassChime();
      
      alert(language === 'bn' 
        ? `৳${addedAmt} ম্যানুয়াল ডিপোজিট সফলভাবে সাবমিট হয়েছে! স্ট্যাটাস: "Pending Verification"। মালিক এটি অনুমোদন করলে ওয়ালেটে যোগ হবে।` 
        : `BDT ${addedAmt} manual deposit successfully submitted! Status: "Pending Verification". Balance will update once Owner/Admin approves it.`
      );
      
      setActiveSubScreen('main');
    }, 1200);
  };

  // Withdraw Logic
  const [withdrawAmount, setWithdrawAmount] = useState<string>('100');
  const [withdrawAccount, setWithdrawAccount] = useState<string>(user.mobile);
  const [withdrawMethod, setWithdrawMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [withdrawPending, setWithdrawPending] = useState<boolean>(false);

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount) || 0;
    if (amt < 50) {
      alert(language === 'bn' ? "নূন্যতম উত্তোলন পরিমাণ ৫০ টাকা!" : "Minimum withdraw amount is BDT 50.");
      return;
    }

    // Daily limit check - max 2 successful or pending withdrawals per unique user per day
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayWithdrawals = transactions.filter(t => 
      t.type === 'WITHDRAW' && 
      t.date.startsWith(todayStr) && 
      (t.status === 'SUCCESS' || t.status === 'PENDING')
    );

    if (todayWithdrawals.length >= 2) {
      alert(language === 'bn' ? "আপনি দিনে সর্বোচ্চ ২ বার উইথড্র করতে পারবেন" : "You can submit a maximum of 2 withdrawals per day.");
      return;
    }

    if (user.balance < amt) {
      alert(language === 'bn' ? "আপনার পর্যাপ্ত ব্যালেন্স নেই!" : "Insufficient balance to withdraw!");
      return;
    }

    setWithdrawPending(true);

    setTimeout(() => {
      // Deduct
      setUser(prev => ({
        ...prev,
        balance: prev.balance - amt
      }));

      // Append transaction
      const newTx: Transaction = {
        id: 'tx_with_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        type: 'WITHDRAW',
        amount: amt,
        method: withdrawMethod,
        accountNo: withdrawAccount,
        status: 'PENDING', // Will require admin audit
        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      setTransactions(prev => [newTx, ...prev]);

      setWithdrawPending(false);
      setWithdrawAmount('');
      setWithdrawAccount('');
      playGlassChime();

      alert(language === 'bn'
        ? `৳${amt} উত্তোলনের অনুরোধ জমা হয়েছে! ৩ ঘণ্টার মধ্যে ভেরিফাই হয়ে অ্যাকাউন্টে পৌঁছে যাবে।`
        : `Withdraw request of BDT ${amt} submitted successfully! It will be verified and sent within 3 hrs.`
      );

      // simulate administrative automatic approval log in top counters soon
      setActiveSubScreen('main');
    }, 1500);
  };

  // Synchronize profile inputs when subscreen launches
  useEffect(() => {
    if (activeSubScreen === 'profile_edit') {
      setProfileTeamName(user.teamName || '');
      setProfileLogo(user.teamLogo || '');
    }
  }, [activeSubScreen, user]);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileTeamName) {
      alert(language === 'bn' ? "দয়া করে টিমের নাম দিন।" : "Please enter a team name.");
      return;
    }
    const updatedUser = {
      ...user,
      teamName: profileTeamName,
      teamLogo: profileLogo || '/input_file_2.png'
    };
    setUser(updatedUser);
    
    // Update inside usersList too!
    setUsersList(prev => prev.map(u => u.mobile === user.mobile ? { ...u, teamName: profileTeamName, teamLogo: profileLogo || '/input_file_2.png' } : u));
    
    alert(language === 'bn' ? "প্রোফাইল সফলভাবে আপডেট করা হয়েছে!" : "Profile updated successfully!");
    setActiveSubScreen('main');
  };

  // Password reset setting
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdCurrent || !pwdNew || !pwdConfirm) {
      alert(language === 'bn' ? 'সকল ঘর পূরণ করুন' : 'Please fill all password fields');
      return;
    }
    if (pwdNew !== pwdConfirm) {
      alert(language === 'bn' ? 'নতুন পাসওয়ার্ড দুটি মেলেনি!' : 'Passwords do not match');
      return;
    }
    
    alert(language === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' : 'Password updated successfully!');
    setPwdCurrent('');
    setPwdNew('');
    setPwdConfirm('');
    setActiveSubScreen('main');
  };

  // Dropdown states for Matches
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  const [expandedPrizeId, setExpandedPrizeId] = useState<string | null>(null);
  const [expandedResultsId, setExpandedResultsId] = useState<string | null>(null);
  const [expandedRosterId, setExpandedRosterId] = useState<string | null>(null);

  // Active sub-screen rules category tabs
  const [rulesActiveTable, setRulesActiveTable] = useState<string>('duo');

  // SVG wolf component to fall back safely with state-driven rendering
  const WolfLogo = ({ src }: { src?: string }) => {
    const [logoErr, setLogoErr] = useState(false);
    const resolvedSrc = src || user?.teamLogo || '/input_file_2.png';

    // Reset logo error when src updates
    useEffect(() => {
      setLogoErr(false);
    }, [src]);

    return (
      <div 
        onClick={() => {
          setDevTaps(prev => {
            const next = prev + 1;
            if (next >= 5) {
              setShowDevConsole(p => !p);
              alert("Secured Developer Console / Quick Test Logins successfully toggled!");
              return 0;
            }
            return next;
          });
        }}
        className="relative w-20 h-20 mx-auto flex items-center justify-center bg-[#070d19] rounded-full border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/20 overflow-hidden cursor-pointer active:scale-95 transition-transform"
      >
        {!logoErr && resolvedSrc ? (
          <img 
            src={resolvedSrc} 
            alt="Wolf Logo" 
            className="w-16 h-16 object-contain rounded-full relative z-10 pointer-events-none"
            onError={() => setLogoErr(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center pointer-events-none">
            <svg className="w-12 h-12 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.22 6.268a.75.75 0 0 1 .966-.189l1.543.926a4.5 4.5 0 0 1 1.83 2.505l.389 1.558a.75.75 0 0 1-.362.793l-1.135.567a1.5 1.5 0 0 0-.825 1.13l-.128.643a.75.75 0 0 1-.966.577l-1.543-.514a4.5 4.5 0 0 1-2.617-2.617l-.514-1.543a.75.75 0 0 1 .577-.966l.643-.128a1.5 1.5 0 0 0 1.13-.825l.567-1.135Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.78 17.732a.75.75 0 0 0-.966.189l-1.543-.926a4.5 4.5 0 0 0-1.83-2.505l-.389-1.558a.75.75 0 0 0 .362-.793l1.135-.567a1.5 1.5 0 0 1 .825-1.13l.128-.643a.75.75 0 0 0 .966-.577l1.543.514a4.5 4.5 0 0 0 2.617 2.617l.514 1.543a.75.75 0 0 0-.577.966l-.643.128a1.5 1.5 0 0 1-1.13.825l-.567 1.135Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18" />
            </svg>
            <span className="text-[8px] font-mono font-bold text-cyan-400 absolute bottom-1 uppercase tracking-widest">{user?.teamName?.substring(0, 3) || 'SLW'}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full bg-[#070b19] overflow-hidden select-none flex flex-col font-sans transition-all duration-300">
      
      {/* Runtimes alert layers (Notification / Draw Over Apps Onboarding popup states) */}
      {showNotificationOverlay && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="glass-panel w-full p-6 rounded-3xl border border-white/10 text-center animate-fade-in">
            <div className="w-14 h-14 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 relative shadow-lg shadow-cyan-500/20">
              <Bell className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-display text-white font-semibold mb-2">
              {language === 'bn' ? 'নোটিফিকেশন অনুমতি' : 'Notification Permissions'}
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {language === 'bn' 
                ? 'ম্যাচ শুরু, স্লট ড্রপ এবং ইন্সট্যান্ট পেমেন্ট এলার্টের জন্য নোটিফিকেশন চালু করুন।' 
                : 'Enable instant push alerts for match openings, slot completions, and rapid payouts.'}
            </p>
            <button 
              onClick={confirmNotifications}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-md shadow-cyan-500/10 cursor-pointer"
            >
              {language === 'bn' ? 'মঞ্জুর করুন (Allow)' : 'Allow Notification'}
            </button>
          </div>
        </div>
      )}

      {showDrawOverAppsOverlay && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="glass-panel w-full p-6 rounded-3xl border border-white/10 text-center animate-fade-in">
            <div className="w-14 h-14 bg-gradient-to-tr from-cyan-400 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 relative shadow-lg shadow-cyan-500/20">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-display text-white font-semibold mb-2">
              {language === 'bn' ? 'অন্য অন্য অ্যাপের ওপর রেন্ডার করুন' : 'Display Over Other Apps'}
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {language === 'bn' 
                ? 'ইনস্ট্যান্ট স্লট পেমেন্ট এবং কাস্টম নোটিশ এলার্ট সরাসরি দেখতে "Draw Over Apps" অনুমতি দিন।' 
                : 'Allow this permission to get lightning fast floating alerts on slot releases during other apps usage.'}
            </p>
            <button 
              onClick={confirmDrawOverApps}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              {language === 'bn' ? 'অনুমতি দিন (Allow)' : 'Grant Permission'}
            </button>
          </div>
        </div>
      )}

      {/* APP IN-GAME BOOT SCREEN */}
      {booting ?
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col justify-between items-center bg-ambient-glow py-16 px-6 pt-16"
        >
          <div className="w-full flex justify-end">
            <button 
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
              className="text-xs font-semibold px-3 py-1 rounded-full border border-white/15 text-slate-400 glass-panel-light cursor-pointer hover:bg-white/10"
            >
              {language === 'bn' ? 'English' : 'বাংলা'}
            </button>
          </div>

          <div className="text-center">
            {/* Logo area */}
            <motion.div 
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 90, damping: 11, delay: 0.15 }}
              className="relative inline-block mb-4 p-4 bg-black/40 rounded-full border border-slate-700/50"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-[#060b1e] to-black rounded-full p-[2px] shadow-2xl flex items-center justify-center relative">
                {!splashLogoErr ? (
                  <motion.img 
                    initial={{ rotate: -180, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    src="/input_file_2.png" 
                    alt="SLW Logo" 
                    className="w-20 h-20 object-contain rounded-full border-2 border-slate-800 z-10 bg-slate-900"
                    onError={() => setSplashLogoErr(true)}
                  />
                ) : (
                  <span className="text-2xl text-cyan-400 font-logo font-black tracking-widest block font-display">SLW</span>
                )}
              </div>
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-xl font-bold font-logo text-white tracking-widest uppercase"
            >
              SILVER WOLF
            </motion.h1>
            <motion.p 
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="text-slate-400 text-xs tracking-widest uppercase mb-1"
            >
              ORGANIZATION
            </motion.p>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="text-blue-400 text-[10px] tracking-wide font-mono"
            >
              E S P O R T S  •  A L I V E
            </motion.p>
          </div>

          {/* Progress bar container */}
          <div className="w-full max-w-[200px] mb-8">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1.5 font-semibold">
              <span>{language === 'bn' ? 'সিস্টেম লোড হচ্ছে...' : 'INITIALIZING SYSTEM...'}</span>
              <span>{bootProgress}%</span>
            </div>
            <div className="w-full h-[3px] bg-slate-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 transition-all duration-150"
                style={{ width: `${bootProgress}%` }}
              ></div>
            </div>
          </div>
        </motion.div>
      :
        /* APP CONTAINER - After boot finished */
        <div className="flex-1 flex flex-col pt-3 overflow-hidden relative">
          
          {user.isLoggedIn && usersList.find(u => u.mobile === user.mobile)?.banned ?
            <div className="flex-1 flex flex-col justify-center items-center p-6 text-center bg-[#070913] animate-fade-in z-50">
              <div className="w-14 h-14 bg-red-950/40 rounded-full border border-red-500/30 flex items-center justify-center text-red-500 mb-4 animate-bounce">
                <Shield className="w-7 h-7" />
              </div>
              <h2 className="text-sm font-black text-red-500 uppercase tracking-widest mb-1.5 font-display">
                ⛔ Squad Account Suspended
              </h2>
              <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mb-6 font-medium">
                {language === 'bn' 
                  ? 'আপনার টিমকে নিয়ম ভঙ্গ করার কারণে সাময়িকভাবে নিষিদ্ধ (Banned) করা হয়েছে। ওনারের সাথে তাৎক্ষণিক যোগাযোগের জন্য টেলিগ্রাম বাটন ব্যবহার করুন।'
                  : 'Your squad account has been temporarily suspended/locked due to policy infraction. Reach official assistance via Telegram support link.'}
              </p>

              <div className="w-full max-w-xs p-3.5 rounded-xl bg-slate-900 border border-slate-950 text-[10px] font-mono mb-6 text-left text-slate-400">
                <p className="mb-1"><span className="text-slate-600">TEAM :</span> {user.teamName}</p>
                <p className="mb-1"><span className="text-slate-600">IGL :</span> {user.iglGameName}</p>
                <p className="mb-1"><span className="text-slate-600">MOBILE :</span> {user.mobile}</p>
                <p className="text-red-400 font-bold"><span className="text-slate-600">STATUS :</span> BANNED (BLOCKED)</p>
              </div>

              {/* Telegram Helpline linking directly */}
              <a 
                href={telegramSupportLink}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-indigo-600 text-white font-bold text-xs select-none cursor-pointer duration-150 active:scale-95 text-center w-full"
              >
                🤝 Telegram Support Helpdesk
              </a>

              <button 
                onClick={() => {
                  setUser({
                    teamName: '',
                    iglGameName: '',
                    mobile: '',
                    email: '',
                    balance: 0,
                    winningBalance: 0,
                    joinedMatchesCount: 0,
                    notificationsEnabled: false,
                    drawOverAppsEnabled: false,
                    isLoggedIn: false
                  });
                  setAuthView('SIGNUP');
                }}
                className="mt-4 text-[10px] text-slate-500 hover:text-slate-300 font-bold cursor-pointer underline"
              >
                Log Out Session
              </button>
            </div>
          :
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Custom top static bar with logo */}
          {/* Custom top static bar with integrated alerts ticker */}
          <header className="glass-panel flex justify-between items-center px-4 py-2 rounded-2xl mx-1 max-h-12 border-b-2 border-slate-900 bg-[#070b19]/85 backdrop-blur-md">
            <div className="flex items-center space-x-2 flex-1 min-w-0 mr-2">
              <img 
                src="/input_file_2.png" 
                alt="Logo" 
                className="w-7 h-7 object-contain rounded-full border border-slate-800 shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="flex flex-col min-w-0 text-left">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-white font-logo tracking-widest font-black leading-none shrink-0">SILVER WOLF ORG</span>
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                  </span>
                </div>
                <div className="text-[8.5px] text-slate-400 font-mono font-medium truncate mt-0.5 leading-none w-full">
                  {flashNotification ? (
                    <span className="text-cyan-400 font-bold block animate-pulse">
                      ⚡ {language === 'bn' ? flashNotification.textBn : flashNotification.textEn}
                    </span>
                  ) : slotAlert ? (
                    <span className="text-amber-400 font-semibold block truncate animate-pulse">
                      📢 {language === 'bn' ? slotAlert.textBn : slotAlert.textEn}
                    </span>
                  ) : (
                    <span className="text-slate-300 block truncate">
                      • {language === 'bn' ? DEMO_MINI_LOGS_BN[currentMiniLogIndex] : DEMO_MINI_LOGS_EN[currentMiniLogIndex]}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 shrink-0">
              <button 
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  playGlassChime();
                }}
                className="p-1 px-2 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer active:scale-95 flex items-center shrink-0"
                title="Mute/Unmute System Audio"
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              <button 
                onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
                className="text-[9px] font-bold py-1 px-2.5 rounded bg-white/10 text-white cursor-pointer active:scale-95 transition-transform"
              >
                {language === 'bn' ? 'EN' : 'বাং'}
              </button>
            </div>
          </header>

          {/* AUTH VIEW STACKS: Register, Login or App Core View */}
          {authView === 'SIGNUP' ? (
            <div className="flex-1 flex flex-col justify-center px-4 overflow-y-auto pt-4 pb-6">
              <WolfLogo />

              <div className="text-center mt-3 mb-5">
                <h2 className="text-lg font-bold text-white tracking-wider">{language === 'bn' ? 'নিবন্ধন করুন' : 'Sign Up'}</h2>
                <p className="text-xs text-slate-400">{language === 'bn' ? 'সিলভার উলফ এআই গ্লাসমরফিক প্যানেলে' : 'Join Premium Silver Wolf Org'}</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-3.5 max-w-sm mx-auto w-full">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1 ml-1">{language === 'bn' ? 'টিমের নাম (Team Name)*' : 'Team Name*'}</label>
                  <input 
                    type="text" 
                    placeholder={language === 'bn' ? "টিমের নাম লিখুন" : "e.g. Wolf Warriors"}
                    value={signupTeam}
                    onChange={(e) => setSignupTeam(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs glass-input font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1 ml-1">
                    {language === 'bn' ? 'টিম লোগো আপলোড (Team Logo Picture)*' : 'Team Logo/Image Upload*'}
                  </label>
                  <div className="flex items-center space-x-3 mt-1">
                    {signupLogo ? (
                      <img src={signupLogo} className="w-10 h-10 rounded-full border border-cyan-400 object-cover bg-black/45 shadow-glow" alt="logo preview" />
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-dashed border-slate-600 flex items-center justify-center text-slate-500 font-bold text-xs bg-slate-900/40">
                        SLW
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSignupLogo(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="signup-logo-file"
                    />
                    <label 
                      htmlFor="signup-logo-file"
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 text-[10px] uppercase font-bold cursor-pointer active:scale-95 transition-all flex items-center space-x-1"
                    >
                      <span>{language === 'bn' ? 'লোগো সিলেক্ট করুন' : 'Select Team Logo'}</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1 ml-1">{language === 'bn' ? 'আইজিএল গেম নেম (IGL Game Name)*' : 'IGL Game Name*'}</label>
                  <input 
                    type="text" 
                    placeholder={language === 'bn' ? "ইন-গেম নাম দিন" : "e.g. SLW_Leader"}
                    value={signupIgl}
                    onChange={(e) => setSignupIgl(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs glass-input font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1 ml-1">{language === 'bn' ? 'মোবাইল নাম্বার*' : 'Mobile Number*'}</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. 01894558893"
                    value={signupMobile}
                    onChange={(e) => setSignupMobile(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs glass-input font-mono font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1 ml-1">{language === 'bn' ? 'পাসওয়ার্ড*' : 'Password*'}</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs glass-input font-mono"
                    required
                  />
                </div>

                <div className="flex items-start space-x-2 pt-1 ml-1">
                  <input 
                    id="signUpTerms"
                    type="checkbox" 
                    checked={signupTerms}
                    onChange={(e) => setSignupTerms(e.target.checked)}
                    className="mt-0.5 rounded text-cyan-500 accent-cyan-500"
                    required
                  />
                  <label htmlFor="signUpTerms" className="text-[10px] text-slate-400 leading-snug cursor-pointer">
                    {language === 'bn' 
                      ? 'আমি সিলভার উলফ ই-স্পোর্টসের নিয়মাবলী এবং গোপনীয়তা নীতির সাথে একমত।' 
                      : 'I agree to the Terms and Conditions and Privacy Policy.'}
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/10 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-transform"
                >
                  {language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}
                </button>
              </form>

              <div className="text-center mt-5">
                <button 
                  onClick={() => setAuthView('LOGIN')}
                  className="text-xs text-cyan-400 hover:underline cursor-pointer font-medium"
                >
                  {language === 'bn' ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? সাইন ইন করুন' : 'Already have an account? Sign In'}
                </button>
              </div>
            </div>
          ) : authView === 'LOGIN' ? (
            /* SIMPLE LOGIN FOR SPEEDY TESTING */
            <div className="flex-1 flex flex-col justify-center px-4 overflow-y-auto">
              <WolfLogo />

              <div className="text-center mt-3 mb-6">
                <h2 className="text-xl font-bold text-white tracking-wider">{language === 'bn' ? 'লগইন করুন' : 'Sign In'}</h2>
                <p className="text-xs text-slate-400">{language === 'bn' ? 'আপনার মোবাইল ও আইজিএল পাসওয়ার্ড দিয়ে' : 'Enter mobile and IGL credentials'}</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto w-full">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase ml-1">{language === 'bn' ? 'মোবাইল নাম্বার*' : 'Mobile Number*'}</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. 01894558893"
                    value={signupMobile}
                    onChange={(e) => setSignupMobile(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs glass-input font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase ml-1">{language === 'bn' ? 'পাসওয়ার্ড*' : 'Password*'}</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs glass-input font-mono"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs cursor-pointer shadow-lg active:scale-[0.98] transition-transform"
                >
                  {language === 'bn' ? 'প্রবেশ করুন' : 'Sign In Now'}
                </button>
              </form>

              <div className="text-center mt-6">
                <button 
                  onClick={() => setAuthView('SIGNUP')}
                  className="text-xs text-cyan-400 hover:underline cursor-pointer font-medium"
                >
                  {language === 'bn' ? "নতুন অ্যাকাউন্ট তৈরি করতে সাইন আপ করুন" : "Don't have an account? Sign Up"}
                </button>
              </div>
            </div>
          ) : (
            /* APP CORE CONTAINER (TAB LAYOUTS) */
            <div className="flex-1 flex flex-col overflow-hidden pb-16">
              
              {/* INTERACTIVE SCROLLABLE VIEW STACK */}
              <div className="flex-1 overflow-y-auto px-2 py-1.5 scrollbar">
                
                {/* 1. MATCHES TAB */}
                {activeTab === 'matches' && (
                  <div>
                    {activeSubScreen === 'main' ? (
                      <div className="space-y-2.5 pt-1.5">
                        <div className="flex justify-between items-center px-1">
                          <h2 className="text-[13px] font-bold text-white uppercase tracking-wider font-display flex items-center">
                            <Trophy className="w-4 h-4 text-amber-500 mr-1 max-h-4" /> 
                            {language === 'bn' ? 'চলমান টুর্নামেন্ট' : 'ACTIVE TOURNAMENTS'}
                          </h2>
                          <span className="text-[9px] text-[#ff2e5b] bg-[#ff2e5b]/10 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                            ● {language === 'bn' ? 'এখন হচ্ছে' : 'Happening Now'}
                          </span>
                        </div>

                        {matches.map((match) => {
                          const isRoomExpanded = expandedRoomId === match.id;
                          const isPrizeExpanded = expandedPrizeId === match.id;
                          const slotsRemaining = match.totalSlots - match.occupiedSlots;
                          const fillPercent = (match.occupiedSlots / match.totalSlots) * 100;
                          const isFull = match.occupiedSlots >= match.totalSlots;
                          const isExpired = match.startsInSeconds <= 0;

                          return (
                            <div key={match.id} className="glass-panel rounded-2xl p-3 border border-slate-800 flex flex-col relative overflow-hidden transition-all duration-200">
                              
                              {/* Glowing stripe label */}
                              <div className="absolute top-0 right-0 py-0.5 px-3 bg-gradient-to-l from-indigo-950/40 text-cyan-300 text-[8px] font-semibold border-b border-l border-white/5 rounded-bl-xl font-mono">
                                {match.date.split(' at ')[1]}
                              </div>

                              {/* Owner-Only In-line Match Deletion (Matches Page top-right delete button) */}
                              {user.role === 'OWNER' && (
                                <button
                                  id={`btn-inline-delete-${match.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMatch(match.id);
                                  }}
                                  className="absolute top-6 right-2 w-7 h-7 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 flex items-center justify-center text-red-400 backdrop-blur-md shadow-lg transition-all hover:scale-105 active:scale-95 z-30 cursor-pointer"
                                  title={language === 'bn' ? 'ম্যাচ ডিলিট করুন' : 'Delete Match'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Title block */}
                              <div className="pr-12 text-left pt-0.5">
                                <h3 className="text-[11px] font-bold text-slate-100 font-sans tracking-tight leading-snug">
                                  {match.title}
                                </h3>
                                <p className="text-[9px] text-slate-400 mt-1 leading-normal font-medium">
                                  {match.subTitle}
                                </p>
                              </div>

                              {/* Date Indicator badge */}
                              <div className="text-[9px] text-red-400 font-mono font-bold mt-2 text-left">
                                {match.date.split(' at ')[0]} at {match.date.split(' at ')[1]}
                              </div>

                              {/* Core match specs row (BDT parameters) */}
                              <div className="grid grid-cols-3 gap-1.5 mt-3 py-2 px-1 rounded-xl bg-black/30 border border-white/5 text-center">
                                <div className="text-left pl-1">
                                  <span className="text-[8px] text-slate-500 font-medium tracking-wide uppercase block">{language === 'bn' ? 'জিতলে প্রাইজ' : 'WIN PRIZE'}</span>
                                  <span className="text-[11px] font-bold text-emerald-400 font-mono block">{match.winPrize} TK</span>
                                </div>
                                <div className="text-center">
                                  <span className="text-[8px] text-slate-500 font-medium tracking-wide uppercase block">{language === 'bn' ? 'এন্ট্রি টাইপ' : 'ENTRY TYPE'}</span>
                                  <span className="text-[10px] font-bold text-slate-200 block">{match.entryType}</span>
                                </div>
                                <div className="text-right pr-1">
                                  <span className="text-[8px] text-slate-500 font-medium tracking-wide uppercase block">{language === 'bn' ? 'এন্ট্রি ফি' : 'ENTRY FEE'}</span>
                                  <span className={`text-[11px] font-bold font-mono block ${Number(match.entryFee) === 0 ? "text-emerald-400" : "text-yellow-400"}`}>
                                    {Number(match.entryFee) === 0 
                                      ? (language === 'bn' ? 'ফ্রি টুর্নামেন্ট' : 'FREE') 
                                      : `${match.entryFee} TK`}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-1.5 mt-2 py-0.5 px-1 text-center text-[10px]">
                                <div className="text-left pl-1">
                                  <span className="text-[8px] text-slate-500 font-medium uppercase block">{language === 'bn' ? 'প্রতি কিল' : 'PER KILL'}</span>
                                  <span className="text-[10px] font-bold text-cyan-400 font-mono block">{match.perKill} TK</span>
                                </div>
                                <div className="text-center">
                                  <span className="text-[8px] text-slate-500 font-medium uppercase block">{language === 'bn' ? 'ম্যাপ' : 'MAP'}</span>
                                  <span className="text-[10px] font-bold text-slate-300 block">{match.map}</span>
                                </div>
                                <div className="text-right pr-1">
                                  <span className="text-[8px] text-slate-500 font-medium uppercase block">{language === 'bn' ? 'ভার্সন' : 'VERSION'}</span>
                                  <span className="text-[10px] font-bold text-slate-300 block">{match.version}</span>
                                </div>
                              </div>

                              {/* Progress for Slots */}
                              <div className="mt-3.5 space-y-1">
                                <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono font-medium">
                                  <span>{language === 'bn' ? `মাত্র ${slotsRemaining}টি স্লট বাকি আছে` : `Only ${slotsRemaining} spots are left`}</span>
                                  <span className="font-semibold text-white">{match.occupiedSlots}/{match.totalSlots}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 rounded-full"
                                    style={{ width: `${fillPercent}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Actions Dropdowns & Booking buttons */}
                              <div className="flex space-x-1 mt-4">
                                <button 
                                  onClick={() => {
                                    setExpandedRoomId(isRoomExpanded ? null : match.id);
                                    setExpandedRosterId(null);
                                    setExpandedPrizeId(null);
                                    setExpandedResultsId(null);
                                  }}
                                  className="flex-1 py-1 px-1.5 rounded-lg border border-slate-700/60 text-[8px] font-semibold text-slate-300 glass-panel-light flex items-center justify-center cursor-pointer active:scale-98"
                                >
                                  🔑 {language === 'bn' ? 'রুম' : 'Room'} 
                                  <span className="ml-1 text-[6.5px]">{isRoomExpanded ? '▲' : '▼'}</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    setExpandedRosterId(expandedRosterId === match.id ? null : match.id);
                                    setExpandedRoomId(null);
                                    setExpandedPrizeId(null);
                                    setExpandedResultsId(null);
                                  }}
                                  className="flex-1 py-1 px-1.5 rounded-lg border border-slate-700/60 text-[8px] font-semibold text-slate-300 glass-panel-light flex items-center justify-center cursor-pointer active:scale-98"
                                >
                                  👥 {language === 'bn' ? 'স্কোয়াড' : 'Squads'}
                                  <span className="ml-1 text-[6.5px]">{expandedRosterId === match.id ? '▲' : '▼'}</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    setExpandedPrizeId(isPrizeExpanded ? null : match.id);
                                    setExpandedRoomId(null);
                                    setExpandedRosterId(null);
                                    setExpandedResultsId(null);
                                  }}
                                  className="flex-1 py-1 px-1.5 rounded-lg border border-slate-700/60 text-[8px] font-semibold text-slate-300 glass-panel-light flex items-center justify-center cursor-pointer active:scale-98"
                                >
                                  🏆 {language === 'bn' ? 'প্রাইজ' : 'Prize'}
                                  <span className="ml-1 text-[6.5px]">{isPrizeExpanded ? '▲' : '▼'}</span>
                                </button>
                                {(match as any).resultsDeclared && (
                                  <button 
                                    onClick={() => {
                                      setExpandedResultsId(expandedResultsId === match.id ? null : match.id);
                                      setExpandedRoomId(null);
                                      setExpandedRosterId(null);
                                      setExpandedPrizeId(null);
                                    }}
                                    className="flex-1 py-1 px-1.5 rounded-lg border border-pink-500/30 text-[8px] font-bold text-pink-400 bg-pink-950/15 flex items-center justify-center cursor-pointer active:scale-98"
                                  >
                                    📋 {language === 'bn' ? 'ফলাফল' : 'Results'}
                                    <span className="ml-1 text-[6.5px]">{expandedResultsId === match.id ? '▲' : '▼'}</span>
                                  </button>
                                )}
                              </div>

                              {/* Expanded Registered Squads roster */}
                              {expandedRosterId === match.id && (
                                <div className="mt-2.5 p-2.5 rounded-xl bg-[#090d1e]/90 border border-slate-800/80 text-left space-y-2 text-[9px] animate-fade-in font-mono">
                                  <div className="font-sans border-b border-white/[0.05] pb-2 mb-2 flex justify-between items-center text-cyan-400">
                                    <span className="font-bold tracking-wider text-[10px] uppercase flex items-center space-x-1.5">
                                      <span>👥</span> 
                                      <span>{language === 'bn' ? 'অফিশিয়াল স্লট ডিরেক্টরি (Live) :' : 'Official Slot Directory (Live) :'}</span>
                                    </span>
                                    <span className="text-[8px] font-black bg-cyan-950 text-cyan-400 border border-cyan-800/30 px-2 py-0.5 rounded-full">
                                      {match.occupiedSlots} / {match.totalSlots} {language === 'bn' ? 'বুকড' : 'Booked'}
                                    </span>
                                  </div>
                                  
                                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                                    {Array.from({ length: match.totalSlots }).map((_, slotIdx) => {
                                      const slotNum = slotIdx + 1;
                                      const teamName = match.joinedTeams[slotIdx];
                                      
                                      if (teamName) {
                                        // Fix IGL display bug dynamically: prioritize direct key link, fallback to list database trace
                                        const squadUser = usersList.find(u => u.teamName === teamName) || (user.teamName === teamName ? user : null);
                                        const iglName = match.joinedTeamIgls?.[teamName] || squadUser?.iglGameName || 'N/A';
                                        
                                        return (
                                          <div 
                                            key={slotIdx} 
                                            className="p-1 px-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/15 flex items-center justify-between shadow-sm animate-fade-in"
                                          >
                                            <div className="flex items-center space-x-2">
                                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 font-extrabold text-[8.5px] border border-cyan-500/20">
                                                #{slotNum < 10 ? `0${slotNum}` : slotNum}
                                              </span>
                                              <div className="min-w-0">
                                                <span className="font-bold text-slate-100 text-[8.5px] truncate block max-w-[170px]">
                                                  🐺 {teamName}
                                                </span>
                                                <span className="text-[7.5px] text-cyan-300 font-bold block max-w-[170px]">
                                                  IGL: {iglName}
                                                </span>
                                              </div>
                                            </div>
                                            <span className="text-[7px] font-extrabold tracking-wider text-emerald-400 bg-emerald-950/50 border border-emerald-500/25 px-1.5 py-0.5 rounded uppercase">
                                              {language === 'bn' ? 'বুকড' : 'Booked'}
                                            </span>
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div 
                                            key={slotIdx} 
                                            className="p-1 px-2.5 rounded-lg bg-slate-950/40 border border-white/[0.02] flex items-center justify-between opacity-55"
                                          >
                                            <div className="flex items-center space-x-2">
                                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-slate-500 font-bold text-[8.5px] border border-white/[0.02]">
                                                #{slotNum < 10 ? `0${slotNum}` : slotNum}
                                              </span>
                                              <span className="text-slate-500 italic text-[8.5px]">
                                                {language === 'bn' ? '[ খালি স্লট - বুকিং করুন ]' : '[ Vacant Slot - Available ]'}
                                              </span>
                                            </div>
                                            <span className="text-[7px] font-bold text-slate-600 border border-slate-900 bg-slate-900/30 px-1.5 py-0.5 rounded uppercase">
                                              {language === 'bn' ? 'ফ্রি' : 'Free'}
                                            </span>
                                          </div>
                                        );
                                      }
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Expanded Room panel */}
                              {isRoomExpanded && (
                                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-left space-y-1 text-[9px] animate-fade-in font-mono">
                                  <p className="font-bold text-slate-300 border-b border-white/5 pb-1 mb-1 text-cyan-400">
                                    {language === 'bn' ? '🔒 রুম আইডি ও পাসওয়ার্ড :' : '🔒 Custom Room ID & Password :'}
                                  </p>
                                  {(!match.joinedTeams.includes(user.teamName) || (match.unjoinedTeams || []).includes(user.teamName) || (match.unjoinedMobiles || []).includes(user.mobile)) && user.role !== 'OWNER' ? (
                                    <div className="flex flex-col items-center justify-center py-2.5 text-center border border-dashed border-red-500/20 rounded-xl bg-red-950/10">
                                      <Shield className="w-4 h-4 text-red-400 mb-1" />
                                      <span className="text-red-400 font-sans font-bold text-[8.5px] uppercase tracking-wider">{language === 'bn' ? 'অ্যাক্সেস বাতিল (Access Revoked)' : 'Access Token Revoked'}</span>
                                      <p className="text-[7.5px] text-slate-400 mt-1 max-w-[190px] mx-auto leading-normal">
                                        {language === 'bn' 
                                          ? '⚠️ সতর্কবার্তা: আপনি এই ম্যাচ থেকে আনজয়েন করেছেন। ফলে গেম রুমের আইডি ও পাসওয়ার্ড অ্যাক্সেস চিরতরে বাতিল করা হয়েছে।' 
                                          : '⚠️ WARNING: You have unjoined this match. Access to the Room Credentials has been permanently invalidated.'}
                                      </p>
                                    </div>
                                  ) : match.startsInSeconds < 240 || match.roomDetails.released ? (
                                    <>
                                      <p className="flex justify-between">
                                        <span className="text-slate-400">Room ID:</span>
                                        <span className="text-slate-100 font-bold select-all">{match.roomDetails.roomId || '5882991'}</span>
                                      </p>
                                      <p className="flex justify-between">
                                        <span className="text-slate-400">Password:</span>
                                        <span className="text-slate-100 font-bold select-all">{match.roomDetails.password || 'wolf99'}</span>
                                      </p>
                                      <p className="text-[8px] text-amber-400 mt-1 font-sans">
                                        * {language === 'bn' ? 'জলদি জয়েন করুন! ম্যাচ ৫ মিনিটে শুরু হবে!' : 'Join quickly! Game starting in 5 minutes!'}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-slate-400 leading-snug">
                                      {language === 'bn' 
                                        ? '⏳ ম্যাচ শুরু হওয়ার ৪ মিনিট আগে রুম আইডি ও পাসওয়ার্ড এখানে উন্মুক্ত করা হবে।' 
                                        : '⏳ Room ID and Password will be displayed here exactly 4 minutes before start time.'}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Expanded Prizes Details */}
                              {isPrizeExpanded && (
                                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-left space-y-1 text-[9px] animate-fade-in font-mono font-medium">
                                  <p className="font-bold text-slate-200 border-b border-white/5 pb-1 mb-1 text-yellow-400">
                                    {language === 'bn' ? '🏆 প্রাইজ পুল বিবরণ :' : '🏆 Prize Pool Distribution :'}
                                  </p>
                                  <p className="flex justify-between">
                                    <span className="text-slate-400">1st Winner (Booyah):</span>
                                    <span className="text-emerald-400 font-bold">{match.prizeDetails.first}</span>
                                  </p>
                                  <p className="flex justify-between">
                                    <span className="text-slate-400">2nd Position:</span>
                                    <span className="text-slate-200 font-bold">{match.prizeDetails.second}</span>
                                  </p>
                                  <p className="flex justify-between">
                                    <span className="text-slate-400">3rd Position:</span>
                                    <span className="text-slate-200 font-bold">{match.prizeDetails.third}</span>
                                  </p>
                                  {match.prizeDetails.fourth && (
                                    <p className="flex justify-between">
                                      <span className="text-slate-400">4th Position:</span>
                                      <span className="text-slate-200 font-bold">{match.prizeDetails.fourth}</span>
                                    </p>
                                  )}
                                  {match.perKill > 0 && (
                                    <p className="flex justify-between border-t border-white/5 pt-1 mt-1 text-cyan-400">
                                      <span>Per Kill Reward:</span>
                                      <span>{match.prizeDetails.perKill}</span>
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Expanded Results Board option */}
                              {expandedResultsId === match.id && (match as any).resultsDeclared && (
                                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/85 border border-pink-950/60 text-left space-y-2 text-[9px] animate-fade-in font-mono">
                                  <p className="font-bold border-b border-pink-900/40 pb-1 mb-1 text-pink-400">
                                    🏆 {language === 'bn' ? 'চূড়ান্ত বিজয়ী ও স্কোরবোর্ড :' : '🏆 Official Winners & Scoreboard :'}
                                  </p>
                                  {Object.entries((match as any).resultsPositions || {}).map(([tName, pos]) => (
                                    <p key={tName} className="flex justify-between items-center text-slate-200">
                                      <span className="font-bold">{tName}</span>
                                      <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-400 font-bold font-mono text-[8px] border border-slate-800">{pos as string} PLACE</span>
                                    </p>
                                  ))}
                                  {/* Render uploaded image proof */}
                                  {(match as any).resultsScreenshot && (
                                    <div className="mt-1.5 pt-1.5 border-t border-white/5 flex flex-col items-center">
                                      <span className="text-[7.5px] text-slate-500 mb-1 uppercase tracking-wide">Official Scoreboard Proof :</span>
                                      <img src={(match as any).resultsScreenshot} alt="Match Scoreboard Standings" className="w-full h-auto rounded-lg border border-slate-800 max-h-40 object-contain bg-black/50" referrerPolicy="no-referrer" />
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* JOIN Action Footer with countdown state */}
                              <div className="flex justify-between items-center mt-3 pt-3.5 border-t border-slate-900 font-mono">
                                <div className="text-left">
                                  <span className="text-[8px] text-slate-500 block leading-none font-semibold uppercase">{language === 'bn' ? 'কাউন্টডাউন' : 'STARTS IN'}</span>
                                  <span className="text-[11px] font-bold text-yellow-400 block tracking-tight">
                                    {formatCountdown(match.startsInSeconds)}
                                  </span>
                                </div>

                                {match.joinedTeams.includes(user.teamName) ? (
                                  <div className="flex space-x-1.5 items-center">
                                    <button 
                                      onClick={() => {
                                        if (!isExpired) {
                                          handleUnjoinMatch(match);
                                        }
                                      }}
                                      disabled={isExpired}
                                      className={`px-2.5 py-1.5 rounded-lg border text-[8.5px] font-bold transition-all ${
                                        isExpired
                                          ? 'border-slate-800 bg-slate-900/40 text-slate-500 cursor-not-allowed opacity-50'
                                          : 'border-red-500/25 bg-red-950/20 text-red-100 hover:bg-red-950/30 cursor-pointer active:scale-95'
                                      }`}
                                    >
                                      {language === 'bn' ? 'বাতিল' : 'Cancel'}
                                    </button>
                                    <button 
                                      disabled={true}
                                      className="px-3.5 py-1.5 rounded-lg text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-not-allowed uppercase"
                                    >
                                      {language === 'bn' ? 'বুকড ✓' : 'Registered ✓'}
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => {
                                      if (!isExpired && !isFull) {
                                        startJoinMatch(match);
                                      }
                                    }}
                                    disabled={isFull || isExpired}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95 ${
                                      (isFull || isExpired)
                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/[0.04]' 
                                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-95 shadow-cyan-500/10'
                                    }`}
                                  >
                                    {isExpired 
                                      ? (language === 'bn' ? 'লকড' : 'Locked') 
                                      : isFull 
                                        ? (language === 'bn' ? 'পূর্ণ' : 'Full') 
                                        : (language === 'bn' ? 'জয়েন' : 'Join')}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        <div className="py-6 text-center">
                          <p className="text-[9px] text-slate-500 font-mono font-medium">
                            {language === 'bn' ? '🚫 আর কোনো কাস্টম ম্যাচ নেই' : '🚫 No more matches to load'}
                          </p>
                        </div>
                      </div>
                    ) : activeSubScreen === 'join_match' && selectedMatch ? (
                      /* JOIN SLOT BOOK INTERACTIVE INTERFACE with bKash / Nagad */
                      <div className="pt-2 animate-fade-in pb-4">
                        <button 
                          onClick={() => setActiveSubScreen('main')}
                          className="flex items-center text-[10px] text-slate-400 font-bold pb-2 space-x-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3" /> 
                          <span>{language === 'bn' ? 'পেছনে ফিরে যান' : 'Go Back'}</span>
                        </button>

                        <div className="glass-panel rounded-2xl p-4 text-center mt-1 border border-slate-800">
                          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display border-b border-slate-900 pb-2.5 mb-2.5">
                            {language === 'bn' ? 'ম্যাচ জয়েনিং প্যানেল' : 'Join Match Panel'}
                          </h2>

                          {/* Bangla Notice Warning matching Screenshot Column 4 */}
                          <div className="p-3 bg-red-950/25 border border-red-900/40 rounded-xl text-left text-[9px] text-slate-200 leading-relaxed mb-4">
                            <h4 className="font-bold text-red-100 mb-1.5 flex items-center col-span-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400 mr-1.5 shrink-0" />
                              {language === 'bn' ? '⚠️ ম্যাচ শুরুর জরুরি নিয়মাবলী:' : '⚠️ Match Starting Rules & Guidelines:'}
                            </h4>
                            {language === 'bn' ? (
                              <div className="space-y-1.5 mt-1 font-sans text-[8.5px] text-slate-300">
                                {matchGuidelinesBn.split('\n').map((line, idx) => (
                                  <p key={idx}>{line}</p>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-1.5 mt-1 font-sans text-[8.5px] text-slate-300">
                                {matchGuidelinesEn.split('\n').map((line, idx) => (
                                  <p key={idx}>{line}</p>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Dynamic Pre-payment Identity Setup */}
                          <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/35 rounded-2xl text-left text-[9px] mb-4 space-y-3">
                            <span className="text-[8.5px] font-black tracking-wider text-cyan-400 uppercase block font-mono">🔓 CUSTOM MATCH CHECKOUT IDENTITY</span>
                            
                            <div className="grid grid-cols-2 gap-3 text-slate-300 font-mono">
                              <div className="bg-black/50 p-2 rounded-xl border border-white/5 space-y-1">
                                <label className="text-[7px] text-slate-500 uppercase font-black block">Squad/Team Name:</label>
                                <input 
                                  type="text"
                                  value={checkoutTeamName}
                                  onChange={(e) => setCheckoutTeamName(e.target.value)}
                                  placeholder="Enter squad name"
                                  className="w-full bg-[#070b19] border border-slate-805/40 rounded px-2 py-1 text-white font-bold text-[9px]"
                                />
                              </div>
                              
                              <div className="bg-black/50 p-2 rounded-xl border border-white/5 space-y-1">
                                <label className="text-[7px] text-slate-500 uppercase font-black block">IGL In-Game Name:</label>
                                <input 
                                  type="text"
                                  value={checkoutIglName}
                                  onChange={(e) => setCheckoutIglName(e.target.value)}
                                  placeholder="Enter game name"
                                  className="w-full bg-[#070b19] border border-slate-805/40 rounded px-2 py-1 text-cyan-400 font-bold text-[9px]"
                                />
                              </div>
                            </div>
                            
                            <p className="text-[7.5px] text-slate-500 leading-normal text-center font-medium">
                              * You can fully adjust your squad identifiers right before boarding this specific slot. Tags slot #{selectedMatch.occupiedSlots + 1}.
                            </p>
                          </div>

                          {selectedMatchJoined ? (
                            <div className="p-3 bg-emerald-950/40 border border-emerald-950 rounded-xl flex flex-col items-center text-center space-y-1.5 animate-fade-in mb-2">
                              <CheckCircle className="w-6 h-6 text-emerald-400" />
                              <span className="text-[10px] font-bold text-white">
                                {language === 'bn' ? 'সফলভাবে স্লট বুক সম্পন্ন হয়েছে!' : 'Slot Booked Successfully!'}
                              </span>
                              <p className="text-[8.5px] text-slate-400">
                                {language === 'bn' ? 'আপনার স্কোয়াডে ৪টি স্লট স্বয়ংক্রিয়ভাবে বুক করা হলো।' : '4 squad slots have been automatically registered.'}
                              </p>
                            </div>
                          ) : user.balance < selectedMatch.entryFee ? (
                            /* Embedded Instant Payment MFS Interface when Low Balance */
                            <div className="p-3 bg-red-950/25 border border-red-500/20 rounded-xl mt-1.5 text-left animate-pulse">
                              <div className="flex justify-between items-center border-b border-red-900/30 pb-2 mb-2">
                                <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center">
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 mr-1.5 shrink-0" />
                                  {language === 'bn' ? 'ব্যালেন্স পর্যাপ্ত নয় ও গেটওয়ে সক্রিয়!' : 'Low Balance & Embedded MFS Gateway!'}
                                </h3>
                                <span className="text-[9.5px] font-bold text-slate-300 font-mono">
                                  {language === 'bn' ? 'বকেয়া: ' : 'Due: '}৳{(selectedMatch.entryFee - user.balance)} TK
                                </span>
                              </div>

                              <p className="text-[9px] text-slate-300 leading-normal mb-3">
                                {language === 'bn' ? (
                                  `ম্যাচ জয়েন করতে নিচে দেওয়া নাম্বারে সরাসরি ৳${(selectedMatch.entryFee - user.balance)} TK সেন্ড মানি করুন। এরপর নিচে সঠিক ট্রানজেকশন আইডি প্রবেশ করিয়ে ভেরিফাই করুন।`
                                ) : (
                                  `To book this slot, Send Money format ৳${(selectedMatch.entryFee - user.balance)} to the number below, type your Transaction ID, and tap VERIFY to book instantly.`
                                )}
                              </p>

                              {/* Merchant Numbers */}
                              <div className="space-y-1.5 mb-3 font-mono text-[9px]">
                                <div className="flex justify-between items-center glass-panel-light p-2 rounded-lg border border-white/5">
                                  <span className="text-pink-400 font-bold">bKash Sent No:</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-white font-bold">{bKashNumber}</span>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(bKashNumber);
                                        alert(language === 'bn' ? `বিকাশ নাম্বার (${bKashNumber}) কপি করা হয়েছে!` : `bKash number (${bKashNumber}) copied!`);
                                      }}
                                      className="p-1 rounded bg-white/10 text-white cursor-pointer hover:bg-white/20 active:scale-95"
                                    >
                                      COPY
                                    </button>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center glass-panel-light p-2 rounded-lg border border-white/5">
                                  <span className="text-orange-400 font-bold">Nagad Sent No:</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-white font-bold">{nagadNumber}</span>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(nagadNumber);
                                        alert(language === 'bn' ? `নগদ নাম্বার (${nagadNumber}) কপি করা হয়েছে!` : `Nagad number (${nagadNumber}) copied!`);
                                      }}
                                      className="p-1 rounded bg-white/10 text-white cursor-pointer hover:bg-white/20 active:scale-95"
                                    >
                                      COPY
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Verification fields */}
                              <div className="space-y-2">
                                <input 
                                  type="text"
                                  placeholder={language === 'bn' ? "ট্রানজেকশন আইডি দিন ( যেমন BKX928K )" : "TrxID (e.g. BKX928K0)"}
                                  value={embeddedTxId}
                                  onChange={(e) => setEmbeddedTxId(e.target.value)}
                                  className="w-full p-2 rounded-lg text-xs font-mono font-bold bg-slate-900 border border-slate-700 text-white placeholder-slate-500 uppercase"
                                />

                                <button
                                  onClick={() => {
                                    if (!embeddedTxId.trim()) {
                                      alert(language === 'bn' ? "দয়া করে ট্রানজেকশন আইডি প্রদান করুন!" : "Please provide a transaction ID!");
                                      return;
                                    }
                                    const verifiedAmount = selectedMatch.entryFee - user.balance;
                                    if (verifiedAmount < 25) {
                                      alert(language === 'bn' ? "সর্বনিম্ন ২৫ টাকা ডিপোজিট করতে হবে" : "Minimum deposit is 25 TK.");
                                      return;
                                    }
                                    setIsVerifyingEmbedded(true);
                                    setTimeout(() => {
                                      setIsVerifyingEmbedded(false);
                                      const verifiedAmount = selectedMatch.entryFee - user.balance;
                                      
                                      // Create a PENDING transaction instead of immediately upgrading balance or booking matches!
                                      const depositTx: Transaction = {
                                        id: 'tx_embed_dep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
                                        type: 'DEPOSIT',
                                        amount: verifiedAmount,
                                        method: selectedWalletMethod,
                                        accountNo: user.mobile,
                                        transactionId: embeddedTxId.trim().toUpperCase(),
                                        status: 'PENDING',
                                        isManual: true,
                                        matchId: selectedMatch.id, // Associated Match ID!
                                        metaTeamName: checkoutTeamName.trim() || user.teamName,
                                        metaIglName: checkoutIglName.trim() || user.iglGameName,
                                        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
                                      };
                                      setTransactions(prev => [depositTx, ...prev]);

                                      // Track activity
                                      logActivity(user.iglGameName || 'Player', `ম্যাচ #${selectedMatch.id.toUpperCase()} এ জয়েন করতে ৳${verifiedAmount} এর ম্যানুয়াল পেমেন্ট ট্রানজেকশন আইডি (${embeddedTxId.trim().toUpperCase()}) সাবমিট করেছেন।`);

                                      setEmbeddedTxId('');
                                      playGlassChime();
                                      
                                      // Notification overlay or alert
                                      alert(language === 'bn'
                                        ? `আপনার ট্রানজেকশন আইডিটি সাবমিট হয়েছে এবং "Pending Verification" স্ট্যাটাসে রয়েছে। এডমিন এটি এপ্রুভ করার সাথে সাথে আপনার স্লটটি সফলভাবে বুক করা হবে!`
                                        : `Your transaction ID has been successfully submitted and is under "Pending Verification". Your slot will be permanently booked as soon as the Admin approves your request!`
                                      );

                                      // Navigate away safely
                                      setActiveSubScreen('main');
                                    }, 1200);
                                  }}
                                  disabled={isVerifyingEmbedded}
                                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-500 text-white font-bold text-xs shadow-md cursor-pointer hover:opacity-95"
                                >
                                  {isVerifyingEmbedded 
                                    ? (language === 'bn' ? 'ভেরিফাই ও স্কোয়াড বুক হচ্ছে...' : 'Verifying & Booking Squad...') 
                                    : (language === 'bn' ? 'সেন্ড মানি ভেরিফাই করে জয়েন করুন' : 'VERIFY & SQUAD BOOK INSTANTLY')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={handleConfirmPayAndJoin}
                              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-white font-bold text-xs shadow-lg cursor-pointer hover:opacity-90 active:scale-98 transition-all"
                            >
                              🤝 {language === 'bn' ? 'কনফার্ম করুন ও জয়েন করুন' : 'Confirm & Join Match Now'}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* 2. WALLET TAB */}
                {activeTab === 'wallet' && (
                  <div className="pt-1.5">
                    {activeSubScreen === 'main' ? (
                      <div className="space-y-3 animate-fade-in">
                        
                        {/* Premium Liquid Glass Card matching Screenshot Column 6 */}
                        <div className="relative overflow-hidden rounded-2xl glass-panel p-4.5 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-cyan-950/20 border border-white/10 shadow-lg">
                          <div className="absolute top-2 right-4 text-[7px] text-slate-500 font-bold tracking-widest leading-none font-logo">
                            SILVER WOLF ORG
                          </div>
                          
                          <div className="text-left mt-1.5">
                            <span className="text-[8.5px] uppercase tracking-wider font-semibold text-slate-400 block">
                              {language === 'bn' ? 'মোট উপলব্ধ ব্যালেন্স' : 'AVAILABLE BALANCE'}
                            </span>
                            <span className="text-2xl font-bold font-mono text-white tracking-tight mt-0.5 block">
                              ৳{user.balance.toFixed(1)}
                            </span>
                          </div>

                          <div className="flex justify-between items-end mt-7 text-left font-mono">
                            <div>
                              <span className="text-[7.5px] text-slate-400 block uppercase font-medium">{language === 'bn' ? 'মেয়াদ কাল' : 'VALID THRU'}</span>
                              <span className="text-[9px] font-semibold text-slate-200 block">** / **</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-amber-500 tracking-wider font-bold block">GAMING CARD</span>
                            </div>
                          </div>
                        </div>

                        {/* Split Mini Stats box */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="glass-panel p-3 rounded-xl text-center border border-slate-900">
                            <span className="text-[8px] text-slate-500 uppercase block font-medium">{language === 'bn' ? 'মোট ডিপোজিট' : 'DEPOSITED'}</span>
                            <span className="text-sm font-bold text-slate-200 mt-1 block font-mono">৳{user.balance - user.winningBalance}</span>
                          </div>
                          
                          <div className="glass-panel p-3 rounded-xl text-center border border-slate-900">
                            <span className="text-[8px] text-slate-500 uppercase block font-medium">{language === 'bn' ? 'মোট উইনিং' : 'WINNING'}</span>
                            <span className="text-sm font-bold text-emerald-400 mt-1 block font-mono">৳{user.winningBalance}</span>
                          </div>
                        </div>

                        {/* Quick Transfer action buttons */}
                        <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                          <button 
                            onClick={() => setActiveSubScreen('add_money')}
                            className="py-3 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 to-blue-950/20 text-cyan-300 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-cyan-950/20 cursor-pointer active:scale-98 transition-all"
                          >
                            <DollarSign className="w-4 h-4" />
                            <span>{language === 'bn' ? 'টাকা যোগ করুন' : 'Add Money'}</span>
                          </button>

                          <button 
                            onClick={() => setActiveSubScreen('withdraw')}
                            className="py-3 rounded-xl border border-emerald-500/25 bg-gradient-to-r from-emerald-950/30 to-teal-950/20 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-950/20 cursor-pointer active:scale-98 transition-all"
                          >
                            <User className="w-4 h-4" />
                            <span>{language === 'bn' ? 'টাকা তুলুন' : 'Withdraw'}</span>
                          </button>
                        </div>

                        {/* Transactions Log Section */}
                        <div className="pt-2">
                          <h3 className="text-[11px] text-slate-400 font-bold mb-2 ml-1 flex items-center">
                            <WalletIcon className="w-3.5 h-3.5 text-slate-400 mr-2" />
                            {language === 'bn' ? 'লেনদেন ইতিহাস (Transaction History)' : 'TRANSACTION HISTORY'}
                          </h3>

                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {transactions.map((tx) => (
                              <div key={tx.id} className="glass-panel p-2.5 rounded-xl flex justify-between items-center text-left text-[9px] border border-slate-900">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-slate-200">
                                    {tx.type === 'DEPOSIT' 
                                      ? (language === 'bn' ? '📥 ডিপোজিট পরিশোধ' : '📥 Deposit Money') 
                                      : (language === 'bn' ? '📤 উইথড্র রিকোয়েস্ট' : '📤 Withdraw Trans')} 
                                    <span className="font-mono text-[8px] text-slate-500 font-normal ml-1">({tx.method})</span>
                                  </p>
                                  <p className="text-slate-500 font-mono text-[8px]">{tx.date}</p>
                                  {tx.transactionId && (
                                    <p className="text-slate-400 font-mono text-[8.5px] select-all">TxId: {tx.transactionId}</p>
                                  )}
                                </div>
                                <div className="text-right space-y-0.5">
                                  <p className={`font-bold font-mono text-[10.5px] ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-yellow-500'}`}>
                                    {tx.type === 'DEPOSIT' ? '+' : '-'}৳{tx.amount}
                                  </p>
                                  <span className={`text-[7.5px] px-1.5 py-0.5 rounded font-bold ${
                                    tx.status === 'SUCCESS' 
                                      ? 'bg-emerald-950/50 text-emerald-400' 
                                      : tx.status === 'PENDING' 
                                        ? 'bg-amber-950/50 text-amber-400' 
                                        : 'bg-red-950/50 text-red-400'
                                  }`}>
                                    {tx.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Help Guides / Learning matching Screenshot Column 6 bottom */}
                        <div className="pt-2 space-y-2 text-left">
                          <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">
                            {language === 'bn' ? 'সহায়তা ও নির্দেশিকা' : 'LEARN AND SUPPORT'}
                          </h4>
                          
                          <div className="space-y-1.5">
                            <div className="glass-panel p-2.5 rounded-xl flex items-center justify-between border border-slate-900 cursor-pointer hover:bg-white/5 transition-colors">
                              <div className="flex items-center space-x-2">
                                <Play className="w-3.5 h-3.5 text-amber-500" />
                                <div>
                                  <p className="text-[10px] text-slate-200 font-bold">{language === 'bn' ? 'কিভাবে টাকা এড করবেন?' : 'How to add money?'}</p>
                                  <p className="text-[8px] text-slate-500">{language === 'bn' ? 'ভিডিও টিউটোরিয়াল দেখুন' : 'Watch video tutorial'}</p>
                                </div>
                              </div>
                              <ArrowRight className="w-3 h-3 text-slate-500" />
                            </div>

                            <div className="glass-panel p-2.5 rounded-xl flex items-center justify-between border border-slate-900 cursor-pointer hover:bg-white/5 transition-colors">
                              <div className="flex items-center space-x-2">
                                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                                <div>
                                  <p className="text-[10px] text-slate-200 font-bold">{language === 'bn' ? 'কিভাবে কাস্টম ম্যাচ জয়েন করবেন?' : 'How to join match?'}</p>
                                  <p className="text-[8px] text-slate-500">{language === 'bn' ? 'ধাপগুলো দেখে নিই' : 'Step-by-step rules guide'}</p>
                                </div>
                              </div>
                              <ArrowRight className="w-3 h-3 text-slate-500" />
                            </div>
                          </div>
                        </div>

                      </div>
                    ) : activeSubScreen === 'add_money' ? (
                      /* WALLET > ADD MONEY INTERACTIVE INTERFACE matching Screenshot Column 7 */
                      <div className="pt-2 animate-fade-in text-left">
                        <button 
                          onClick={() => setActiveSubScreen('main')}
                          className="flex items-center text-[10px] text-slate-400 font-bold pb-2 space-x-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>{language === 'bn' ? 'পেছনে ফিরে যান' : 'Go Back'}</span>
                        </button>

                        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
                          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display mb-3 text-center border-b border-slate-900 pb-2">
                            {language === 'bn' ? 'ওয়ালেটে টাকা এড করুন' : 'Add Money To Wallet'}
                          </h2>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <button 
                              onClick={() => setDepositMethod('bKash')}
                              className={`p-2 rounded-xl border flex items-center justify-center space-x-2 cursor-pointer ${
                                depositMethod === 'bKash' ? 'bg-[#ff2e7e]/15 border-[#ff2e7e] text-pink-300' : 'glass-panel-light'
                              }`}
                            >
                              <span className="text-[10.5px] font-bold">bKash App</span>
                            </button>

                            <button 
                              onClick={() => setDepositMethod('Nagad')}
                              className={`p-2 rounded-xl border flex items-center justify-center space-x-2 cursor-pointer ${
                                depositMethod === 'Nagad' ? 'bg-orange-600/15 border-orange-500 text-orange-400' : 'glass-panel-light'
                              }`}
                            >
                              <span className="text-[10.5px] font-bold">Nagad App</span>
                            </button>
                          </div>

                          {/* Bangla Details Instructions Panel */}
                          <div className="p-3.5 bg-gradient-to-br from-indigo-950/50 to-pink-950/20 rounded-2xl border border-[#ff2e7e]/20 text-[9px] text-slate-200 leading-relaxed mb-4">
                            <span className="font-bold text-red-400 tracking-wider block mb-1">
                              {language === 'bn' ? 'সেন্টমানি করার নিয়ম ও পদক্ষেপসমূহ :' : 'Send Money Protocol Guidelines :'}
                            </span>
                            
                            {language === 'bn' ? (
                              <ul className="space-y-1 list-decimal list-inside text-slate-300 font-medium">
                                <li>মোবাইলে ডায়াল করে অথবা অ্যাপসে গিয়ে নিচে দেওয়া নাম্বারে সেন্ড মানি করুন।</li>
                                <li>প্রাপক নম্বর হিসেবে ব্যবহার করুন: <span className="text-[#ff2e7e] font-serif font-black select-all">{depositMethod === 'bKash' ? bKashNumber : nagadNumber}</span> (Send Money)</li>
                                <li>সেন্ড মানি করার পর যে ট্রানজেকশন আইডি (Transaction ID) পাবেন সেটি কপি করে নিন।</li>
                                <li>নিচে ট্রানজেকশন আইডি দিন এবং টাকার পরিমাণ লিখে ভেরিফাই বাটন চাপুন।</li>
                              </ul>
                            ) : (
                              <ul className="space-y-1 list-decimal list-inside text-slate-300 font-medium">
                                <li>Send money from your phone wallet to the official recipient number.</li>
                                <li>Official Recipient Number: <span className="text-cyan-400 font-black select-all">{depositMethod === 'bKash' ? bKashNumber : nagadNumber}</span></li>
                                <li>Save the Transaction ID received after transaction finish.</li>
                                <li>Input the exact TxID & BDT amount below and hit Verify to credit instantly!</li>
                              </ul>
                            )}

                            <div className="flex space-x-2 mt-3 pt-2.5 border-t border-white/5">
                              <button 
                                onClick={() => {
                                  const targetNumber = depositMethod === 'bKash' ? bKashNumber : nagadNumber;
                                  navigator.clipboard.writeText(targetNumber);
                                  alert(language === 'bn' ? `নম্বর ${targetNumber} কপি করা হয়েছে` : `Copied receiver number: ${targetNumber}`);
                                }}
                                className="px-2.5 py-1 text-[8.5px] font-bold bg-white/10 text-white rounded cursor-pointer duration-150 relative active:scale-95"
                              >
                                {language === 'bn' ? 'নম্বর কপি (Copy)' : 'Copy Recipient'}
                              </button>
                            </div>
                          </div>

                          {/* Money Addition input form matches Screenshot Column 7 exactly */}
                          <form onSubmit={handleDepositSubmit} className="space-y-3">
                            <div>
                              <label className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                                {language === 'bn' ? 'টাকার পরিমাণ (Amount BDT) :' : 'Amount BDT :'}
                              </label>
                              <input 
                                type="number" 
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                className="w-full p-2.5 rounded-xl text-xs glass-input font-mono font-bold"
                                min="10"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase tracking-top">
                                {language === 'bn' ? 'ট্রানজেকশন আইডি দিন (Transaction ID) :' : 'Transaction ID :'}
                              </label>
                              <input 
                                type="text" 
                                placeholder="e.g. BKX209E34KL"
                                value={depositTxId}
                                onChange={(e) => setDepositTxId(e.target.value)}
                                className="w-full p-2.5 rounded-xl text-xs glass-input font-mono font-bold"
                                required
                              />
                            </div>

                            <button 
                              type="submit" 
                              disabled={depositPending}
                              className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-pink-500/15 tracking-wider cursor-pointer active:scale-98"
                            >
                              {depositPending 
                                ? (language === 'bn' ? 'ভেরিফাই হচ্ছে...' : 'Verifying...') 
                                : (language === 'bn' ? 'ভেরিফাই করে টাকা যোগ করুন (VERIFY)' : 'VERIFY TRANSACTION')}
                            </button>
                          </form>
                        </div>
                      </div>
                    ) : activeSubScreen === 'withdraw' ? (
                      /* WALLET > WITHDRAW MONEY INTERACTIVE INTERFACE matching Screenshot Column 8 */
                      <div className="pt-2 animate-fade-in text-left">
                        <button 
                          onClick={() => setActiveSubScreen('main')}
                          className="flex items-center text-[10px] text-slate-400 font-bold pb-2 space-x-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>{language === 'bn' ? 'পেছনে ফিরে যান' : 'Go Back'}</span>
                        </button>

                        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
                          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display mb-3 text-center border-b border-slate-900 pb-2">
                            {language === 'bn' ? 'উইথড্র রিকোয়েস্ট' : 'Withdraw Money'}
                          </h2>

                          {/* Balance representation */}
                          <div className="p-3 bg-slate-950/45 rounded-xl border border-slate-900 flex justify-between items-center text-xs mb-4 font-mono">
                            <span className="text-slate-400">{language === 'bn' ? 'সর্বমোট ব্যালেন্স :' : 'Available Balance :'}</span>
                            <span className="font-bold text-white">BDT {user.balance.toFixed(1)}</span>
                          </div>

                          <div className="mb-4">
                            <label className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                              {language === 'bn' ? 'পেমেন্ট মেথড সিলেক্ট করুন' : 'SELECT PAYMENT METHOD'}
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={() => setWithdrawMethod('bKash')}
                                className={`p-2 rounded-xl border flex items-center justify-center space-x-2 cursor-pointer ${
                                  withdrawMethod === 'bKash' ? 'bg-[#ff2e7e]/15 border-[#ff2e7e] text-pink-300' : 'glass-panel-light'
                                }`}
                              >
                                <span className="text-[10px] font-bold">bKash</span>
                              </button>

                              <button 
                                onClick={() => setWithdrawMethod('Nagad')}
                                className={`p-2 rounded-xl border flex items-center justify-center space-x-2 cursor-pointer ${
                                  withdrawMethod === 'Nagad' ? 'bg-orange-600/15 border-orange-500 text-orange-400' : 'glass-panel-light'
                                }`}
                              >
                                <span className="text-[10px] font-bold">Nagad</span>
                              </button>
                            </div>
                          </div>

                          <form onSubmit={handleWithdrawSubmit} className="space-y-3">
                            <div>
                              <label className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                                {language === 'bn' ? 'মোবাইল নাম্বার :' : 'Mobile Number :'}
                              </label>
                              <input 
                                type="tel" 
                                value={withdrawAccount}
                                onChange={(e) => setWithdrawAccount(e.target.value)}
                                className="w-full p-2.5 rounded-xl text-xs glass-input font-mono font-bold"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                                {language === 'bn' ? 'উত্তোলন পরিমাণ (Amount BDT) :' : 'Amount to Withdraw :'}
                              </label>
                              <input 
                                type="number" 
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="w-full p-2.5 rounded-xl text-xs glass-input font-mono font-bold"
                                min="80"
                                required
                              />
                            </div>

                            <p className="text-[8.5px] text-amber-500 font-medium">
                              ⚠️ {language === 'bn' ? 'নূন্যতম উত্তোলনের পরিমাণ ৮০ টাকা' : 'MINIMUM WITHDRAW AMOUNT BDT 80'}
                            </p>

                            <button 
                              type="submit" 
                              disabled={withdrawPending}
                              className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/15 tracking-wide cursor-pointer active:scale-98"
                            >
                              {withdrawPending 
                                ? (language === 'bn' ? 'অনুরোধ যাচ্ছে...' : 'Requesting...') 
                                : (language === 'bn' ? 'উইথড্র সাবমিট করুন' : 'Confirm Withdraw Money')}
                            </button>
                          </form>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* 3. PROFILE TAB */}
                {activeTab === 'profile' && (
                  <div className="pt-1.5">
                    {activeSubScreen === 'main' ? (
                      <div className="space-y-3.5 animate-fade-in text-left">
                        
                        {/* Profile Header box with Team Logo matching Screenshot Column 5 */}
                        <div className="glass-panel rounded-2xl p-4.5 text-center relative border border-slate-900">
                          <WolfLogo />

                          <div className="mt-2.5">
                            <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase font-logo leading-tight">
                              TEAM NAME
                            </h3>
                            <p className="text-sm font-bold text-white tracking-wide mt-0.5 leading-none">
                              {user.teamName}
                            </p>
                          </div>

                          <div className="mt-1.5">
                            <span className="text-[8px] font-semibold text-slate-500 block leading-tight">
                              IGL GAME NAME
                            </span>
                            <span className="text-[10px] font-bold text-slate-200 mt-0.5 font-mono select-all block">
                              {user.iglGameName}
                            </span>
                          </div>

                          {/* Quick Stats Joined Games vs BDT */}
                          <div className="grid grid-cols-2 gap-2 mt-4 pt-4.5 border-t border-slate-900 text-center font-mono">
                            <div className="border-r border-slate-800">
                              <span className="text-[12px] font-black text-cyan-400 block">{user.joinedMatchesCount}</span>
                              <span className="text-[7px] text-slate-400 uppercase tracking-widest font-sans">{language === 'bn' ? 'ম্যাচ জয়েন করেছেন' : 'Matches Joined'}</span>
                            </div>
                            <div>
                              <span className="text-[12px] font-black text-yellow-400 block">BDT {user.balance}</span>
                              <span className="text-[7px] text-slate-400 uppercase tracking-widest font-sans">{language === 'bn' ? 'বর্তমান ব্যালেন্স' : 'Current Balance'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Profile Navigation Action Lists */}
                        <div className="space-y-2">

                          {/* Try Admin Roles login Helper for evaluation, secured with Owner PIN Lock */}
                          {showDevConsole && (!user.role || user.role === 'USER') && (
                            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-900 text-left">
                              <span className="text-[10px] font-black tracking-wider text-pink-400 block mb-1.5 uppercase font-mono">🔒 DEV: SECURED ADMIN TEST LOGINS</span>
                              <div className="flex gap-1.5 flex-wrap">
                                <button 
                                  onClick={() => {
                                    const pin = prompt("Enter Owner Administration PIN to login:");
                                    if (pin !== '7840' && pin !== 'rabbi') {
                                      alert("Invalid Administrative Credential! Access Blocked.");
                                      return;
                                    }
                                    const ownerUser: UserProfile = {
                                      teamName: 'Supreme Wolf Owner',
                                      iglGameName: 'Owner_Rabbi',
                                      mobile: '01903362784',
                                      email: 'rabbi25122010@gmail.com',
                                      balance: 0,
                                      winningBalance: 0,
                                      joinedMatchesCount: 0,
                                      notificationsEnabled: true,
                                      drawOverAppsEnabled: true,
                                      isLoggedIn: true,
                                      role: 'OWNER'
                                    };
                                    setUser(ownerUser);
                                    logActivity('Owner_Rabbi', 'সিস্টেম মডারেটর থেকে সিকিউর পিন দিয়ে কুইক লগইন ব্যবহার করে ওনার (Super-Admin) প্রবেশ করেছেন।');
                                  }}
                                  className="px-2 py-1 text-[8.5px] font-bold bg-purple-900 hover:bg-purple-800 rounded text-white cursor-pointer active:scale-95 transition-transform"
                                >
                                  Login as Owner
                                </button>
                                <button 
                                  onClick={() => {
                                    const pin = prompt("Enter Administrative Bypass PIN:");
                                    if (pin !== '7840') {
                                      alert("Invalid Bypass PIN! Access Blocked.");
                                      return;
                                    }
                                    const hostUser: UserProfile = {
                                      teamName: 'Warriors Express',
                                      iglGameName: 'Warrior_IGL',
                                      mobile: '01822222222',
                                      email: 'warriorexp@gmail.com',
                                      balance: 0,
                                      winningBalance: 0,
                                      joinedMatchesCount: 0,
                                      notificationsEnabled: true,
                                      drawOverAppsEnabled: true,
                                      isLoggedIn: true,
                                      role: 'HOST_ADMIN'
                                    };
                                    setUser(hostUser);
                                    logActivity('Warrior_IGL', 'সিস্টেম মডারেটর থেকে হোস্ট-এডমিন কুইক লগইন ব্যবহার করেছেন।');
                                  }}
                                  className="px-2 py-1 text-[8.5px] font-bold bg-amber-900 hover:bg-amber-800 rounded text-white cursor-pointer active:scale-95 transition-transform"
                                >
                                  Login host Admin
                                </button>
                                <button 
                                  onClick={() => {
                                    const pin = prompt("Enter Administrative Bypass PIN:");
                                    if (pin !== '7840') {
                                      alert("Invalid Bypass PIN! Access Blocked.");
                                      return;
                                    }
                                    const ptUser: UserProfile = {
                                      teamName: 'Elite Force Pro',
                                      iglGameName: 'Force_IGL',
                                      mobile: '01633333333',
                                      email: 'eliteforce@gmail.com',
                                      balance: 0,
                                      winningBalance: 0,
                                      joinedMatchesCount: 0,
                                      notificationsEnabled: true,
                                      drawOverAppsEnabled: true,
                                      isLoggedIn: true,
                                      role: 'POINT_TABLE_ADMIN'
                                    };
                                    setUser(ptUser);
                                    logActivity('Force_IGL', 'সিস্টেম মডারেটর থেকে পয়েন্ট-টেবিল কুইক লগইন ব্যবহার করেছেন।');
                                  }}
                                  className="px-2 py-1 text-[8.5px] font-bold bg-pink-900 hover:bg-pink-800 rounded text-white cursor-pointer active:scale-95 transition-transform"
                                >
                                  Login Pt Admin
                                </button>
                              </div>
                              <span className="text-[7.5px] text-slate-500 block mt-1.5 font-mono">⚠️ PIN is "7840" for evaluation testing purposes.</span>
                            </div>
                          )}

                          {/* Multi-Tiered Admin Panel Action Button */}
                          {user.role && user.role !== 'USER' && (
                            <button 
                              onClick={() => {
                                setAdminActiveTab(user.role === 'OWNER' ? 'owner' : user.role === 'HOST_ADMIN' ? 'host' : 'pt');
                                setActiveSubScreen('admin_dashboard');
                              }}
                              className="w-full text-left bg-gradient-to-r from-purple-900/40 via-cyan-900/45 to-indigo-900/40 p-3 rounded-xl flex items-center justify-between border border-cyan-500/30 cursor-pointer active:scale-99 transition-transform"
                            >
                              <div className="flex items-center space-x-3.5">
                                <div className="w-8 h-8 rounded-lg bg-cyan-950/60 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                                  <Shield className="w-4 h-4 animate-bounce" />
                                </div>
                                <div>
                                  <h4 className="text-[11px] text-cyan-200 font-bold uppercase tracking-wider">
                                    🛡️ {user.role === 'OWNER' ? 'Owner Control Panel' : user.role === 'HOST_ADMIN' ? 'Host Admin Panel' : 'Point Table Admin Panel'}
                                  </h4>
                                  <p className="text-[8px] text-slate-400">
                                    {language === 'bn' ? 'সরাসরি ম্যাচ পরিচালনা, ইউজার ম্যানেজমেন্ট এবং সিস্টেম সেটিংস' : 'Manage matches, wallets, users & system parameters'}
                                  </p>
                                </div>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-cyan-400 font-bold" />
                            </button>
                          )}
                          
                          <button 
                            onClick={() => setActiveSubScreen('profile_edit')}
                            className="w-full text-left glass-panel p-3 rounded-xl flex items-center justify-between border border-slate-900 cursor-pointer active:scale-99 transition-transform"
                          >
                            <div className="flex items-center space-x-3.5">
                              <div className="w-8 h-8 rounded-lg bg-pink-950/40 flex items-center justify-center text-pink-400 border border-pink-500/20">
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-[11px] text-slate-200 font-bold">{language === 'bn' ? 'প্রোফাইল সেটিং' : 'Profile Setting'}</h4>
                                <p className="text-[8px] text-slate-500">{language === 'bn' ? 'পাসওয়ার্ড এবং ইউজারনেম পরিবর্তন' : 'Change password & details'}</p>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          </button>

                          <button 
                            onClick={() => {
                              setRulesActiveTable('duo');
                              setActiveSubScreen('rules');
                            }}
                            className="w-full text-left glass-panel p-3 rounded-xl flex items-center justify-between border border-slate-900 cursor-pointer active:scale-99 transition-transform"
                          >
                            <div className="flex items-center space-x-3.5">
                              <div className="w-8 h-8 rounded-lg bg-amber-950/40 flex items-center justify-center text-amber-500 border border-amber-500/10">
                                <Shield className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-[11px] text-slate-200 font-bold">{language === 'bn' ? 'সমস্ত নিয়মাবলী' : 'All Rules'}</h4>
                                <p className="text-[8px] text-slate-500">{language === 'bn' ? 'ম্যাচের শর্ত ও কায়দাকানুন' : 'Detailed guidelines and codes'}</p>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          </button>

                          <button 
                            onClick={() => setActiveSubScreen('leaderboard')}
                            className="w-full text-left glass-panel p-3 rounded-xl flex items-center justify-between border border-slate-900 cursor-pointer active:scale-99 transition-transform"
                          >
                            <div className="flex items-center space-x-3.5">
                              <div className="w-8 h-8 rounded-lg bg-cyan-950/40 flex items-center justify-center text-cyan-400 border border-cyan-500/10">
                                <Trophy className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-[11px] text-slate-200 font-bold">{language === 'bn' ? 'শীর্ষ খেলোয়াড়' : 'Top Players'}</h4>
                                <p className="text-[8px] text-slate-500">{language === 'bn' ? 'সিলভার উলফের সেরা উইনাররা' : 'Top performers and teams'}</p>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          </button>

                        </div>

                        {/* About Us Liquid Glass Option Panel */}
                        <div className="glass-panel p-3.5 rounded-2xl border border-white/[0.05] bg-white/[0.02] space-y-3">
                          <div className="flex items-center space-x-2 border-b border-white/[0.04] pb-2">
                            <div className="w-1.5 h-3.5 rounded bg-cyan-400"></div>
                            <span className="text-[11px] font-black text-slate-100 uppercase tracking-wider font-display">
                              {language === 'bn' ? 'আমাদের সম্পর্কে' : 'About Us'}
                            </span>
                          </div>
                          
                          <p className="text-[8.5px] text-slate-400 leading-normal mb-1">
                            {language === 'bn' 
                              ? 'সিলভার উলফ এস্পোর্টসের অফিশিয়াল সোশ্যাল চ্যানেলগুলোতে যুক্ত হোন এবং টুর্নামেন্ট ও কাস্টম ম্যাচের লাইভ আপডেট পান।' 
                              : 'Join Silver Wolf Esports official social media platforms to get instant notifications and tournament match dynamics live.'}
                          </p>

                          <div className="grid grid-cols-2 gap-2">
                            {/* Telegram Channel */}
                            <a 
                              href={aboutTelegramLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => playGlassChime()}
                              className="p-2 py-2.5 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/20 flex items-center space-x-2 transition-all hover:scale-102 active:scale-97 cursor-pointer text-left"
                            >
                              <div className="w-6 h-6 rounded-lg bg-[#0088cc] flex items-center justify-center text-white text-[11px] font-bold shadow-lg shadow-[#0088cc]/20">
                                ✈
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-black text-slate-100 block truncate font-sans">Telegram</span>
                                <span className="text-[6.5px] text-slate-400 uppercase tracking-widest block font-mono">Channel</span>
                              </div>
                            </a>

                            {/* WhatsApp Channel */}
                            <a 
                              href={aboutWhatsappLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => playGlassChime()}
                              className="p-2 py-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 flex items-center space-x-2 transition-all hover:scale-102 active:scale-97 cursor-pointer text-left"
                            >
                              <div className="w-6 h-6 rounded-lg bg-[#25D366] flex items-center justify-center text-white text-[11px] font-bold shadow-lg shadow-[#25D366]/20">
                                💬
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-black text-slate-100 block truncate font-sans">WhatsApp</span>
                                <span className="text-[6.5px] text-slate-400 uppercase tracking-widest block font-mono">Channel</span>
                              </div>
                            </a>

                            {/* Messenger Group */}
                            <a 
                              href={aboutMessengerLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => playGlassChime()}
                              className="p-2 py-2.5 rounded-xl bg-[#006AFF]/10 hover:bg-[#006AFF]/20 border border-[#006AFF]/20 flex items-center space-x-2 transition-all hover:scale-102 active:scale-97 cursor-pointer text-left"
                            >
                              <div className="w-6 h-6 rounded-lg bg-[#006AFF] flex items-center justify-center text-white text-[11px] font-bold shadow-lg shadow-[#006AFF]/20">
                                ⚡
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-black text-slate-100 block truncate font-sans">Messenger</span>
                                <span className="text-[6.5px] text-slate-400 uppercase tracking-widest block font-mono">Group</span>
                              </div>
                            </a>

                            {/* TikTok Channel */}
                            <a 
                              href={aboutTiktokLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => playGlassChime()}
                              className="p-2 py-2.5 rounded-xl bg-[#FE2C55]/10 hover:bg-[#FE2C55]/20 border border-[#FE2C55]/20 flex items-center space-x-2 transition-all hover:scale-102 active:scale-97 cursor-pointer text-left"
                            >
                              <div className="w-6 h-6 rounded-lg bg-[#FE2C55] flex items-center justify-center text-white text-[11px] font-bold shadow-lg shadow-[#FE2C55]/20">
                                🎵
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-black text-slate-100 block truncate font-sans">TikTok</span>
                                <span className="text-[6.5px] text-slate-400 uppercase tracking-widest block font-mono">Official ID</span>
                              </div>
                            </a>
                          </div>
                        </div>

                        {/* Standard Logout Action */}
                        <div className="pt-2">
                          <button 
                            onClick={() => {
                              setUser({
                                teamName: '',
                                iglGameName: '',
                                mobile: '',
                                email: '',
                                balance: 0,
                                winningBalance: 0,
                                joinedMatchesCount: 0,
                                notificationsEnabled: false,
                                drawOverAppsEnabled: false,
                                isLoggedIn: false
                              });
                              setAuthView('SIGNUP');
                            }}
                            className="w-full py-2.5 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>{language === 'bn' ? 'লগআউট' : 'Logout Account'}</span>
                          </button>
                        </div>

                      </div>
                    ) : activeSubScreen === 'profile_edit' ? (
                      /* PROFILE > PROFILE SETTING matching Screenshot Column 10 */
                      <div className="pt-2 animate-fade-in text-left">
                        <button 
                          onClick={() => setActiveSubScreen('main')}
                          className="flex items-center text-[10px] text-slate-400 font-bold pb-2 space-x-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>{language === 'bn' ? 'পেছনে ফিরে যান' : 'Go Back'}</span>
                        </button>

                        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
                          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display mb-3 text-center border-b border-slate-900 pb-2">
                            {language === 'bn' ? 'আমার প্রোফাইল' : 'My Profile'}
                          </h2>

                          <div className="space-y-1 mb-4 text-slate-300">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{language === 'bn' ? 'ব্যবহারকারীর তথ্য :' : 'Basic Details :'}</p>
                            <div className="py-2 px-3 rounded-lg bg-slate-900/50 text-[10px] space-y-1 border border-slate-950">
                              <p className="flex justify-between"><span className="text-slate-500">Username:</span> <span className="font-semibold select-all font-mono">{user.iglGameName}</span></p>
                              <p className="flex justify-between"><span className="text-slate-500">Email:</span> <span className="font-semibold select-all font-mono">{user.email}</span></p>
                              <p className="flex justify-between"><span className="text-slate-500">Mobile No:</span> <span className="font-semibold select-all font-mono">{user.mobile}</span></p>
                            </div>
                          </div>

                          {/* Dynamic Team Settings Editor */}
                          <form onSubmit={handleProfileUpdate} className="space-y-3 pb-4 border-b border-slate-900 mb-2.5">
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{language === 'bn' ? 'টিম সেটিংস পরিবর্তন করুন :' : 'TEAM SETTINGS UPDATE :'}</p>
                            
                            <div>
                              <label className="block text-[8px] text-slate-400 font-bold mb-1 uppercase tracking-wide">
                                {language === 'bn' ? 'টিমের নাম (Team Name) :' : 'Team Name :'}
                              </label>
                              <input 
                                type="text" 
                                value={profileTeamName}
                                onChange={(e) => setProfileTeamName(e.target.value)}
                                className="w-full p-2.5 rounded-xl text-xs glass-input font-bold"
                                placeholder={language === 'bn' ? 'টিমের নাম প্রবেশ করান' : 'e.g. Silent Wolves'}
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[8px] text-slate-450 font-bold mb-1.5 uppercase tracking-wide">
                                {language === 'bn' ? 'টিমের লোগো / প্রোফাইল পিকচার :' : 'Team Logo / Profile Picture :'}
                              </label>
                              
                              <div className="flex items-center space-x-3 p-3 bg-slate-900/40 rounded-2xl border border-slate-900">
                                {profileLogo ? (
                                  <img 
                                    src={profileLogo} 
                                    className="w-12 h-12 rounded-full border border-cyan-400 object-cover bg-black/45 shadow-[0_0_12px_rgba(34,211,238,0.25)]" 
                                    alt="logo preview" 
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full border border-dashed border-slate-650 flex items-center justify-center text-slate-400 font-bold text-xs bg-slate-950 font-mono">
                                    🐺 LOGO
                                  </div>
                                )}
                                
                                <div className="flex-1">
                                  <input 
                                    type="file" 
                                    id="profile-logo-file-picker" 
                                    accept="image/*" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setProfileLogo(reader.result as string);
                                          triggerFlashNotification(
                                            "Profile logo loaded successfully! Save settings to apply.",
                                            "প্রোফাইল পিকচার লোড হয়েছে! সংরক্ষণ বাটন চেপে সেভ করুন।"
                                          );
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label 
                                    htmlFor="profile-logo-file-picker"
                                    className="px-4 py-2 rounded-xl bg-slate-950/70 hover:bg-slate-900/90 text-cyan-400 hover:text-cyan-350 border border-cyan-500/20 hover:border-cyan-500/40 text-[9.5px] uppercase font-bold tracking-wider cursor-pointer active:scale-95 duration-100 flex items-center justify-center gap-1.5 w-full text-center"
                                  >
                                    📷 {language === 'bn' ? 'টিম লোগো আপলোড' : 'Upload Team Logo'}
                                  </label>
                                  <p className="text-[7.5px] text-slate-500 mt-1.5 leading-none ml-1">
                                    {language === 'bn' ? '* জেপিজি বা পিএনজি ফাইলটি নির্বাচন করুন।' : '* Select any JPG or PNG image.'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <button 
                              type="submit" 
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs cursor-pointer active:scale-98 transition-transform"
                            >
                              {language === 'bn' ? 'টিম সেটিংস সংরক্ষণ করুন' : 'Save Team Settings'}
                            </button>
                          </form>

                          {/* Password Reset form */}
                          <form onSubmit={handlePasswordChange} className="space-y-3 pt-2.5 border-t border-slate-900">
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন :' : 'PASSWORD CHANGE :'}</p>
                            
                            <div>
                              <label className="block text-[8px] text-slate-400 font-bold mb-1 uppercase tracking-wide">
                                {language === 'bn' ? 'বর্তমান পাসওয়ার্ড :' : 'Current Password :'}
                              </label>
                              <input 
                                type="password" 
                                value={pwdCurrent}
                                onChange={(e) => setPwdCurrent(e.target.value)}
                                className="w-full p-2.5 rounded-xl text-xs glass-input"
                                placeholder={language === 'bn' ? 'পুরাতন পাসওয়ার্ড দিন' : '•••••'}
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[8px] text-slate-400 font-bold mb-1 uppercase tracking-wide">
                                {language === 'bn' ? 'নতুন পাসওয়ার্ড :' : 'New Password :'}
                              </label>
                              <input 
                                type="password" 
                                value={pwdNew}
                                onChange={(e) => setPwdNew(e.target.value)}
                                className="w-full p-2.5 rounded-xl text-xs glass-input"
                                placeholder={language === 'bn' ? 'নতুন পাসওয়ার্ড দিন' : '•••••'}
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[8px] text-slate-400 font-bold mb-1 uppercase tracking-wide">
                                {language === 'bn' ? 'নিশ্চিত নতুন পাসওয়ার্ড :' : 'Confirm Password :'}
                              </label>
                              <input 
                                type="password" 
                                value={pwdConfirm}
                                onChange={(e) => setPwdConfirm(e.target.value)}
                                className="w-full p-2.5 rounded-xl text-xs glass-input"
                                placeholder={language === 'bn' ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : '•••••'}
                                required
                              />
                            </div>

                            <button 
                              type="submit" 
                              className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs cursor-pointer active:scale-98"
                            >
                              {language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password'}
                            </button>
                          </form>
                        </div>
                      </div>
                    ) : activeSubScreen === 'rules' ? (
                      /* PROFILE > ALL RULES INTERFACE matching Screenshot Column 9 */
                      <div className="pt-2 animate-fade-in text-left">
                        <button 
                          onClick={() => setActiveSubScreen('main')}
                          className="flex items-center text-[10px] text-slate-400 font-bold pb-2 space-x-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>{language === 'bn' ? 'পেছনে ফিরে যান' : 'Go Back'}</span>
                        </button>

                        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
                          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display mb-3 text-center border-b border-slate-900 pb-2">
                            {language === 'bn' ? 'সমস্ত কাস্টম নিয়মাবলী' : 'All Rules'}
                          </h2>

                          {/* Rule tabs matching Column 9 header */}
                          <div className="flex space-x-1 mb-3 bg-black/40 p-1 rounded-xl">
                            {rulesPanelCategories.map((cat) => (
                              <button 
                                key={cat.id}
                                onClick={() => setRulesActiveTable(cat.id)}
                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold cursor-pointer transition-colors ${
                                  rulesActiveTable === cat.id 
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' 
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {language === 'bn' ? cat.titleBn : cat.titleEn}
                              </button>
                            ))}
                          </div>

                          {/* Rule Text List container */}
                          <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                            {(rulesPanelCategories.find(c => c.id === rulesActiveTable)?.rulesBn || []).map((r, i) => (
                              <div key={i} className="flex items-start space-x-2.5 text-[10px] text-slate-200 bg-white/3 p-2.5 rounded-xl border border-white/5">
                                <span className="mt-0.5 text-cyan-400 font-bold">✓</span>
                                <p className="leading-relaxed">{language === 'bn' ? r : rulesPanelCategories.find(c => c.id === rulesActiveTable)?.rulesEn[i]}</p>
                              </div>
                            ))}
                            {(!rulesPanelCategories.find(c => c.id === rulesActiveTable) || (rulesPanelCategories.find(c => c.id === rulesActiveTable)?.rulesBn || []).length === 0) && (
                              <div className="text-slate-500 text-center py-5 text-[9px] font-mono">
                                {language === 'bn' ? 'কোনো কাস্টম নিয়মাবলী পাওয়া যায়নি।' : 'No rules established yet for this mode.'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : activeSubScreen === 'leaderboard' ? (
                      /* PROFILE > TOP PLAYERS LEADERBOARD matching Screenshot Column 11 */
                      <div className="pt-2 animate-fade-in text-left">
                        <button 
                          onClick={() => setActiveSubScreen('main')}
                          className="flex items-center text-[10px] text-slate-400 font-bold pb-2 space-x-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>{language === 'bn' ? 'পেছনে ফিরে যান' : 'Go Back'}</span>
                        </button>

                        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
                          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display mb-3 text-center border-b border-slate-900 pb-2">
                            {language === 'bn' ? 'সেরা উইনাররা (TOP)' : 'TOP TEAMS'}
                          </h2>

                          {/* Leaderboard Grid mapping Column 11 */}
                          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1 font-mono">
                            <div className="grid grid-cols-12 gap-1 text-[8.5px] text-slate-500 font-sans font-bold uppercase py-1 border-b border-slate-900">
                              <div className="col-span-2">Sl No.</div>
                              <div className="col-span-6">Name</div>
                              <div className="col-span-4 text-right">Amount</div>
                            </div>

                            {TOP_PLAYERS.map((player) => (
                              <div 
                                key={player.rank} 
                                className={`grid grid-cols-12 gap-1 py-2 px-1 text-[10.5px] rounded-lg items-center border border-transparent ${
                                  player.rank <= 3 
                                    ? 'bg-gradient-to-r from-indigo-950/20 via-slate-900/40 to-cyan-950/15 border-slate-800/50' 
                                    : 'hover:bg-white/2'
                                }`}
                              >
                                <div className="col-span-2 font-bold flex items-center">
                                  {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : player.rank}
                                </div>
                                <div className="col-span-6 font-bold text-slate-200 select-all truncate">{player.name}</div>
                                <div className="col-span-4 text-right text-yellow-400 font-bold font-mono">
                                  {player.amount.toLocaleString()} TK
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : activeSubScreen === 'admin_dashboard' ? (
                      /* MULTI-TIERED SECURE CONTROL PANEL SYSTEM */
                      <div className="pt-2 animate-fade-in text-left">
                        {/* Go back header */}
                        <button 
                          onClick={() => setActiveSubScreen('main')}
                          className="flex items-center text-[10px] text-slate-400 font-bold pb-2 space-x-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>{language === 'bn' ? 'পেছনে ফিরে যান' : 'Go Back'}</span>
                        </button>

                        <div className="glass-panel rounded-2xl p-4 border border-slate-800 relative overflow-hidden">
                          {/* Top Authorized Header indicator */}
                          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-[#e2136e] to-cyan-500"></div>

                          <div className="text-center mb-3">
                            <span className="text-[8px] tracking-wider py-0.5 px-2 rounded-full font-black uppercase text-cyan-400 bg-cyan-950/40 border border-cyan-800/20 font-mono inline-block">
                              🔒 Micro-Permissions Segregated Environment
                            </span>
                            <h2 className="text-xs font-black text-white uppercase tracking-widest mt-1">
                              🛡️ {user.role === 'OWNER' ? 'Owner Supreme Dashboard' : user.role === 'HOST_ADMIN' ? 'Host Admin Dashboard' : 'Point Table Admin Panel'}
                            </h2>
                          </div>

                          {/* REAL-TIME LIVE METRICS BAR */}
                          <div className="grid grid-cols-2 gap-2 mb-3 px-1">
                            <div className="bg-slate-950/60 p-2 border border-slate-900 rounded-xl flex items-center justify-between">
                              <div>
                                <span className="text-[7.5px] text-slate-400 font-bold uppercase block tracking-wider font-mono">Total Registrations</span>
                                <span className="text-[13px] font-black text-cyan-400 font-mono tracking-tight">{usersList.length} Teams</span>
                              </div>
                              <div className="h-6 w-6 rounded bg-cyan-950/40 border border-cyan-800/30 flex items-center justify-center text-[10px]">👥</div>
                            </div>
                            <div className="bg-slate-950/60 p-2 border border-slate-900 rounded-xl flex items-center justify-between">
                              <div>
                                <span className="text-[7.5px] text-slate-400 font-bold uppercase block tracking-wider font-mono flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block"></span>
                                  Active Online
                                </span>
                                <span className="text-[13px] font-black text-emerald-400 font-mono tracking-tight">{Math.floor(usersList.length * 0.6) + 3} Live</span>
                              </div>
                              <div className="h-6 w-6 rounded bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-center text-[10px]">📶</div>
                            </div>
                          </div>

                          {/* Role segregation navigation tabs (Super-Admin Owner can review all tabs, standard Host or Pt Admin are locked to their micro view) */}
                          <div className="flex gap-1 bg-black/45 p-1 rounded-xl mb-4 text-center font-bold">
                            {(user.role === 'OWNER' || user.role === 'HOST_ADMIN') && (
                              <button 
                                onClick={() => setAdminActiveTab('host')}
                                className={`flex-1 py-1.5 rounded-lg text-[8.5px] uppercase filter tracking-wider transition-colors duration-200 cursor-pointer ${
                                  adminActiveTab === 'host' 
                                    ? 'bg-amber-900 border border-amber-600/30 text-white shadow shadow-amber-900/30' 
                                    : 'text-slate-400'
                                }`}
                              >
                                🏠 Host Admin
                              </button>
                            )}

                            {(user.role === 'OWNER' || user.role === 'POINT_TABLE_ADMIN') && (
                              <button 
                                onClick={() => setAdminActiveTab('pt')}
                                className={`flex-1 py-1.5 rounded-lg text-[8.5px] uppercase filter tracking-wider transition-colors duration-200 cursor-pointer ${
                                  adminActiveTab === 'pt' 
                                    ? 'bg-pink-900 border border-pink-600/30 text-white shadow shadow-pink-900/30' 
                                    : 'text-slate-400'
                                }`}
                              >
                                📊 Results Admin
                              </button>
                            )}

                            {user.role === 'OWNER' && (
                              <button 
                                onClick={() => setAdminActiveTab('owner')}
                                className={`flex-1 py-1.5 rounded-lg text-[8.5px] uppercase filter tracking-wider transition-colors duration-200 cursor-pointer ${
                                  adminActiveTab === 'owner' 
                                    ? 'bg-purple-900 border border-purple-600/30 text-white shadow shadow-purple-900/40' 
                                    : 'text-slate-400'
                                }`}
                              >
                                🔑 Super-Owner
                              </button>
                            )}
                          </div>

                          {/* RENDER A: HOST ADMIN SECTION (Unlocked for Host & Owner, Blocked from wallet modifications!) */}
                          {adminActiveTab === 'host' && (
                            <div className="space-y-4 animate-fade-in text-[10.5px]">
                              
                              {/* Privileges Display info */}
                              <div className="p-2.5 rounded-xl bg-amber-950/15 border border-amber-900/30 text-[9px] text-amber-400 leading-relaxed font-sans font-medium">
                                <span className="font-bold underline block mb-1">👑 HOST ADMIN PRIVILEGES :</span>
                                <ul className="list-disc list-inside space-y-1 text-slate-300">
                                  <li>Can create custom match rooms via the clear interface.</li>
                                  <li>Can configure schedules, formats (SOLO/DUO/SQUAD), entry fee, and schedules.</li>
                                  <li>Responsible for launching Room IDs & Passwords.</li>
                                  <li className="text-red-400 font-bold font-mono">🚫 RESTRICTION: Blocked from revising user wallet balances or alter point standings!</li>
                                </ul>
                              </div>

                              {/* DYNAMIC MATCH GUIDELINES ADMIN CONTROL */}
                              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-cyan-400"></div>
                                <span className="text-[9.5px] font-black tracking-wider text-cyan-400 uppercase font-mono block mb-1">📢 EDIT MATCH GUIDELINES BOARD</span>
                                <span className="text-slate-500 text-[8px] block mb-3 font-mono">REPLACE INSTRUCTIONS AND RULES SHOWN ON CLIENT MATCH BOARD</span>

                                <div className="space-y-2.5 font-mono">
                                  <div>
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Match Guidelines (Bangla / বাংলা) :</label>
                                    <textarea 
                                      value={matchGuidelinesBn}
                                      onChange={(e) => setMatchGuidelinesBn(e.target.value)}
                                      rows={3}
                                      className="w-full p-2 rounded-lg text-[10px] glass-input text-slate-100 font-sans leading-normal focus:border-cyan-500/50"
                                      placeholder="১. স্লট: নির্দিষ্ট স্লটে বসুন..."
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Match Guidelines (English) :</label>
                                    <textarea 
                                      value={matchGuidelinesEn}
                                      onChange={(e) => setMatchGuidelinesEn(e.target.value)}
                                      rows={3}
                                      className="w-full p-2 rounded-lg text-[10px] glass-input text-slate-100 font-sans leading-normal focus:border-cyan-500/50"
                                      placeholder="1. Slot: Sit on designated slot..."
                                    />
                                  </div>

                                  <button 
                                    onClick={() => {
                                      logActivity('Host_Admin', `ম্যাচ শুরুর জরুরি নিয়মাবলী আপডেট সম্পন্ন করা হয়েছে।`);
                                      triggerFlashNotification(
                                        "Guidelines updated successfully and synced live!",
                                        "ম্যাচ নিয়মাবলী সফলভাবে আপডেট এবং লাইভ সিঙ্ক করা হয়েছে!"
                                      );
                                      playGlassChime();
                                    }}
                                    className="w-full py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold text-[9px] uppercase tracking-wider cursor-pointer active:scale-95 transition-transform"
                                  >
                                    💾 Save & Sync Guidelines Live
                                  </button>
                                </div>
                              </div>

                              {/* Form section 1: Match Room Creator Interface */}
                              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-950 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[#f59e0b]"></div>
                                <span className="text-[9.5px] font-black tracking-wider text-amber-400 uppercase font-mono block mb-2.5">🛠️ (1) MATCH PROFILE CREATOR</span>
                                
                                <div className="space-y-2.5 font-mono">
                                  <div>
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Match Title :</label>
                                    <input 
                                      type="text" 
                                      placeholder="e.g. SLW SPECIAL FREE FIRE CUP"
                                      value={newMatchTitle}
                                      onChange={(e) => setNewMatchTitle(e.target.value)}
                                      className="w-full p-2 rounded-lg text-[10px] glass-input text-white"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Sub-title / Level Requirement :</label>
                                    <input 
                                      type="text" 
                                      placeholder="e.g. Prize ৳৩০০, Level Req: 55+"
                                      value={newMatchSubtitle}
                                      onChange={(e) => setNewMatchSubtitle(e.target.value)}
                                      className="w-full p-2 rounded-lg text-[10px] glass-input text-white"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Entry Fee (BDT) :</label>
                                      <input 
                                        type="number" 
                                        value={newMatchFee}
                                        onChange={(e) => setNewMatchFee(parseInt(e.target.value) || 0)}
                                        className="w-full p-2 rounded-lg text-[10px] glass-input text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Win Prize (BDT) :</label>
                                      <input 
                                        type="number" 
                                        value={newMatchPrize}
                                        onChange={(e) => setNewMatchPrize(parseInt(e.target.value) || 0)}
                                        className="w-full p-2 rounded-lg text-[10px] glass-input text-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Starts At (12-Hour BST) :</label>
                                      <input 
                                        type="text" 
                                        placeholder="e.g. 25-May-2026 09:00 PM BST"
                                        value={newMatchStartsAt}
                                        onChange={(e) => setNewMatchStartsAt(e.target.value)}
                                        className="w-full p-2 rounded-lg text-[10px] glass-input text-[#22d3ee] font-bold"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Locked Map Layout :</label>
                                      <div className="w-full p-2.5 rounded-lg text-[9px] glass-input text-emerald-400 font-bold font-mono">
                                        3-Map Series (Bermuda, Purgatory, Kalahari) 🔒
                                      </div>
                                    </div>
                                  </div>

                                  {/* Multi-tier prize money input fields */}
                                  <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 mt-1">
                                    <div>
                                      <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">1st Win Prize Reward :</label>
                                      <input 
                                        type="text" 
                                        value={prizeTier1}
                                        onChange={(e) => setPrizeTier1(e.target.value)}
                                        placeholder="e.g. ৳১৮০ (60%)"
                                        className="w-full p-2 rounded-lg text-[9px] glass-input text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">2nd Prize Reward :</label>
                                      <input 
                                        type="text" 
                                        value={prizeTier2}
                                        onChange={(e) => setPrizeTier2(e.target.value)}
                                        placeholder="e.g. ৳৯০ (30%)"
                                        className="w-full p-2 rounded-lg text-[9px] glass-input text-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">3rd Prize Reward :</label>
                                      <input 
                                        type="text" 
                                        value={prizeTier3}
                                        onChange={(e) => setPrizeTier3(e.target.value)}
                                        placeholder="e.g. ৳৩০ (10%)"
                                        className="w-full p-2 rounded-lg text-[9px] glass-input text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">4th Position Payout (Optional) :</label>
                                      <input 
                                        type="text" 
                                        value={prizeTier4}
                                        onChange={(e) => setPrizeTier4(e.target.value)}
                                        placeholder="e.g. ৳১৫ (5%)"
                                        className="w-full p-2 rounded-lg text-[9px] glass-input text-white"
                                      />
                                    </div>
                                  </div>

                                  <button 
                                    onClick={() => {
                                      if (!newMatchTitle || !newMatchSubtitle) {
                                        alert("Please enter a title & subtitle first!");
                                        return;
                                      }
                                      const calculatedTimeSecs = Math.max(0, Math.floor((parseMatchDateToTimestamp(newMatchStartsAt) - Date.now()) / 1000));
                                      const customNewMatch: Match = {
                                        date: newMatchStartsAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
                                        id: 'custom_match_' + Date.now(),
                                        title: newMatchTitle,
                                        subTitle: `💬 ${newMatchSubtitle}`,
                                        winPrize: newMatchPrize,
                                        entryFee: newMatchFee,
                                        entryType: 'SQUAD',
                                        perKill: 0,
                                        map: '3-Map Series (Bermuda, Purgatory, Kalahari)', // Locked 3-Map preset
                                        version: 'MOBILE',
                                        totalSlots: 12,
                                        occupiedSlots: 0,
                                        startsAt: newMatchStartsAt,
                                        startsInSeconds: calculatedTimeSecs,
                                        joinedTeams: [],
                                        roomDetails: { released: false },
                                        prizeDetails: {
                                          first: prizeTier1 || `BDT ${Math.round(newMatchPrize * 0.6)}`,
                                          second: prizeTier2 || `BDT ${Math.round(newMatchPrize * 0.3)}`,
                                          third: prizeTier3 || `BDT ${Math.round(newMatchPrize * 0.1)}`,
                                          fourth: prizeTier4 || undefined,
                                          perKill: "Disabled (0 BDT)"
                                        }
                                      };
                                      setMatches(prev => [customNewMatch, ...prev]);
                                      logActivity('Host_Admin', `নতুন রুম ম্যাচ '${newMatchTitle}' তৈরি সম্পন্ন করা হয়েছে।`);
                                      alert("Match Room Added Successfully!");
                                      // reset
                                      setNewMatchTitle('');
                                      setNewMatchSubtitle('');
                                      setPrizeTier1('৳১৮০ (60%)');
                                      setPrizeTier2('৳৯০ (30%)');
                                      setPrizeTier3('৳৩০ (10%)');
                                      setPrizeTier4('');
                                    }}
                                    className="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold cursor-pointer hover:opacity-90 active:scale-98 transition-transform text-center"
                                  >
                                    🚀 Publish Match Profile
                                  </button>
                                </div>
                              </div>

                              {/* Form section 2: Room ID & Password Input operations */}
                              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-950 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[#eab308]"></div>
                                <span className="text-[9.5px] font-black tracking-wider text-amber-400 uppercase font-mono block mb-2.5">📡 (2) ROOM CREDENTIAL DISPATCHER</span>
                                
                                <div className="space-y-2.5 font-mono">
                                  <div>
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Select Target Match :</label>
                                    <select 
                                      value={selectedMatchForRoom}
                                      onChange={(e) => {
                                        const mId = e.target.value;
                                        setSelectedMatchForRoom(mId);
                                        const targetM = matches.find(m => m.id === mId);
                                        if (targetM) {
                                          setNewRoomId(targetM.roomDetails.roomId || '');
                                          setNewRoomPassword(targetM.roomDetails.password || '');
                                          setNewRoomNote(targetM.roomDetails.note || '');
                                        }
                                      }}
                                      className="w-full p-2 rounded-lg text-[10px] glass-input text-white"
                                    >
                                      <option value="">-- Choose active match --</option>
                                      {matches.map(m => (
                                        <option key={m.id} value={m.id}>{m.title} ({m.map})</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Room ID :</label>
                                      <input 
                                        type="number" 
                                        placeholder="e.g. 556632"
                                        value={newRoomId}
                                        onChange={(e) => setNewRoomId(e.target.value)}
                                        className="w-full p-2 rounded-lg text-[10px] glass-input text-white font-bold tracking-wide"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Room Password :</label>
                                      <input 
                                        type="text" 
                                        placeholder="e.g. free77"
                                        value={newRoomPassword}
                                        onChange={(e) => setNewRoomPassword(e.target.value)}
                                        className="w-full p-2 rounded-lg text-[10px] glass-input text-white font-bold"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Notice / Dispatch Note :</label>
                                    <input 
                                      type="text" 
                                      placeholder="e.g. গেম স্টার্ট হবে ঠিক রাত ৯ টায়। ধন্যবাদ!"
                                      value={newRoomNote}
                                      onChange={(e) => setNewRoomNote(e.target.value)}
                                      className="w-full p-2 rounded-lg text-[10px] glass-input text-white"
                                    />
                                  </div>

                                  <button 
                                    onClick={() => {
                                      if (!selectedMatchForRoom) {
                                        alert("Please select a target match first!");
                                        return;
                                      }
                                      if (!newRoomId || !newRoomPassword) {
                                        alert("Please fill in Room ID and Password!");
                                        return;
                                      }

                                      // Update target match in storage
                                      setMatches(prev => prev.map(m => {
                                        if (m.id === selectedMatchForRoom) {
                                          return {
                                            ...m,
                                            roomDetails: {
                                              released: true,
                                              roomId: newRoomId,
                                              password: newRoomPassword,
                                              note: newRoomNote
                                            }
                                          };
                                        }
                                        return m;
                                      }));

                                      logActivity('Host_Admin', `রুম আইডি এবং পাসওয়ার্ড উন্মুক্ত করা হয়েছে ম্যাচ আইডি ${selectedMatchForRoom} এর জন্য।`);
                                      alert("Room credentials released to players instantly!");
                                    }}
                                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold cursor-pointer hover:opacity-90 active:scale-98 transition-transform"
                                  >
                                    ⚡ Dispatch Credentials Live
                                  </button>
                                </div>
                              </div>

                              {/* DIRECT SQUAD PAYOUT TOOL FOR HOST ADMIN */}
                              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-950 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[#fbbf24]"></div>
                                <span className="text-[9.5px] font-black tracking-wider text-amber-500 uppercase font-mono block mb-1">💰 DIRECT SQUAD PRIZE PAYOUT BOARD</span>
                                <span className="text-slate-500 text-[8px] block mb-3 font-mono">SELECT CONCLUDED MATCH AND DIRECTLY PAY WIN BUDGETS STRAIGHT TO USER WALLETS</span>

                                <div className="space-y-2.5 font-mono">
                                  <div>
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Select Concluded Match :</label>
                                    <select 
                                      value={selectedMatchForResults}
                                      onChange={(e) => {
                                        setSelectedMatchForResults(e.target.value);
                                      }}
                                      className="w-full p-2 rounded-lg text-[10px] glass-input text-white"
                                    >
                                      <option value="">-- Choose played Match --</option>
                                      {matches.map(m => (
                                        <option key={m.id} value={m.id}>{m.title} ({m.map || '3-Map Series'})</option>
                                      ))}
                                    </select>
                                  </div>

                                  {selectedMatchForResults && (() => {
                                    const linkedM = matches.find(m => m.id === selectedMatchForResults);
                                    if (!linkedM) return null;
                                    return (
                                      <div className="mt-3 space-y-2 text-left">
                                        <span className="text-[8px] text-slate-400 font-extrabold uppercase">CLICK TEAM ROW TO PROCESS PAYOUT VALUE :</span>
                                        {linkedM.joinedTeams.length === 0 ? (
                                          <p className="text-[8px] text-slate-600 uppercase py-2 text-center font-bold">No teams registered in this match.</p>
                                        ) : (
                                          linkedM.joinedTeams.map((teamName, idx) => {
                                            const squadUserComp = usersList.find(u => u.teamName === teamName) || (user.teamName === teamName ? user : null);
                                            const iglVal = squadUserComp?.iglGameName || 'N/A';
                                            return (
                                              <div 
                                                key={idx}
                                                onClick={() => {
                                                  setSelectedTeamForPayout(teamName);
                                                  setPayoutOverlayOpen(true);
                                                }}
                                                className="p-2 rounded bg-black/60 border border-slate-900 flex justify-between items-center cursor-pointer hover:bg-slate-900 active:scale-98 transition-all"
                                              >
                                                <div>
                                                  <span className="font-bold text-slate-200 block">🐺 {teamName}</span>
                                                  <span className="text-[7.5px] text-slate-500 uppercase font-bold">IGL: {iglVal} | Mobile: {squadUserComp?.mobile || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                  <span className="text-[8.5px] font-black uppercase text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/10">Pay Prize ৳</span>
                                                </div>
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* RENDER B: POINT TABLE ADMIN SECTION (Holds leaderboard screenshot + AI prize distribution wizard) */}
                          {adminActiveTab === 'pt' && (
                            <div className="space-y-4 animate-fade-in text-[10.5px]">
                              
                              {/* Privileges display info */}
                              <div className="p-2.5 rounded-xl bg-pink-950/20 border border-pink-900/40 text-[9px] text-pink-400 leading-relaxed font-sans font-medium">
                                <span className="font-bold underline block mb-1">📊 POINT TABLE ADMIN PRIVILEGES :</span>
                                <ul className="list-disc list-inside space-y-1 text-slate-300">
                                  <li>Responsible for uploading leadership board screenshots.</li>
                                  <li>Can declare stand placements via designated dropdown lists.</li>
                                  <li><span className="text-emerald-400 font-bold">🤖 AUTOMATED PRIZE AI :</span> System instantly calculates and wires BDT rewards directly to winners' balance in seconds!</li>
                                  <li className="text-red-400 font-bold font-mono">🚫 RESTRICTION: Blocked from revising Room settings, passwords, and active checkout numbers.</li>
                                </ul>
                              </div>

                              {/* Card section 1: Screenshot Uploader */}
                              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-950 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[#ec4899]"></div>
                                <span className="text-[9.5px] font-black tracking-wider text-pink-400 uppercase font-mono block mb-2.5">📸 (3) LEADERBOARD SCREENSHOT UPLOADER</span>
                                
                                <div className="space-y-2.5 font-mono">
                                  <div>
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Click below to upload or drag terminal screen shot image:</label>
                                    <div className="relative">
                                      <input 
                                        type="file" 
                                        id="resultScreenshotUpload" 
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              setResultsScreenshot(reader.result as string);
                                              alert("Leaderboard Ending Screenshot Loaded / Uploaded Successfully!");
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                        className="hidden" 
                                      />
                                      <div 
                                        onClick={() => document.getElementById('resultScreenshotUpload')?.click()}
                                        className="border border-dashed border-pink-500/30 rounded-xl p-3.5 text-center bg-pink-950/5 hover:bg-pink-950/10 cursor-pointer active:scale-99 transition-all duration-250 flex flex-col items-center justify-center min-h-[70px]"
                                      >
                                        {resultsScreenshot ? (
                                          <div className="flex flex-col items-center space-y-1">
                                            <span className="text-emerald-400 font-bold text-[9px] uppercase tracking-wider">✓ Scoreboard Attached</span>
                                            <img src={resultsScreenshot} alt="Scoreboard upload preview" className="w-16 h-10 object-cover rounded border border-white/15 mt-1" referrerPolicy="no-referrer" />
                                            <span className="text-[7px] text-slate-500">Click to change screenshot image file</span>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-center">
                                            <span className="text-pink-400 text-[10px] text-center font-bold">📂 Click to attach match screenshot</span>
                                            <span className="text-[8px] text-slate-500 mt-1 font-sans">Supports drag-and-drop or select PNG, JPG up to 5MB</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Card section 2: Standings details and payments */}
                              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-950 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[#f472b6]"></div>
                                <span className="text-[9.5px] font-black tracking-wider text-pink-400 uppercase font-mono block mb-2.5">🎮 (3B) STANDINGS & PRIZE DISPATCH ENGINE</span>
                                
                                <div className="space-y-2.5 font-mono">
                                  <div>
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Select Target Match :</label>
                                    <select 
                                      value={selectedMatchForResults}
                                      onChange={(e) => {
                                        setSelectedMatchForResults(e.target.value);
                                        setResultsPositions({});
                                      }}
                                      className="w-full p-2 rounded-lg text-[10px] glass-input text-white"
                                    >
                                      <option value="">-- Choose played match --</option>
                                      {matches.map(m => (
                                        <option key={m.id} value={m.id}>{m.title} ({m.map})</option>
                                      ))}
                                    </select>
                                  </div>

                                  {selectedMatchForResults && user.role !== 'POINT_TABLE_ADMIN' && (
                                    <div className="p-2.5 rounded-xl bg-black/35 space-y-2 border border-slate-900">
                                      <span className="text-[8px] text-slate-400 font-bold uppercase block mb-1">Select Winning Standings (Instant BDT payout matches)</span>
                                      
                                      {/* Mock team selectors representing the 4 simulated teams */}
                                      {usersList.map((usrTeam, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white/3 p-1.5 rounded-lg border border-white/5">
                                          <div className="text-[9.5px]">
                                            <span className="font-bold text-slate-200 block">{usrTeam.teamName}</span>
                                            <span className="text-[8px] text-slate-500">IGL: {usrTeam.iglGameName}</span>
                                          </div>
                                          
                                          <select 
                                            value={resultsPositions[usrTeam.teamName] || ''}
                                            onChange={(e) => {
                                              setResultsPositions(prev => ({
                                                ...prev,
                                                [usrTeam.teamName]: e.target.value
                                              }));
                                            }}
                                            className="p-1 rounded bg-slate-900 text-cyan-400 font-bold text-[9px] border border-slate-800"
                                          >
                                            <option value="">-- No Standing --</option>
                                            <option value="1st">🥇 1st Place (60% Pool)</option>
                                            <option value="2nd">🥈 2nd Place (30% Pool)</option>
                                            <option value="3rd">🥉 3rd Place (10% Pool)</option>
                                          </select>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {user.role === 'POINT_TABLE_ADMIN' && (
                                    <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 text-center rounded-xl space-y-1.5 mb-2 text-rose-400">
                                      <span className="font-sans font-bold uppercase text-[9px] block">🔒 SECURITY RESTRICTION:</span>
                                      <p className="text-[8px] opacity-90 leading-relaxed font-sans">
                                        Your Point Table Admin profile has write-access to scoreboard screenshot attachments but is restricted from triggering BDT prize distributions. Payouts must be validated and executed by the Host Admin or Super Owner profiles.
                                      </p>
                                    </div>
                                  )}

                                  {user.role === 'POINT_TABLE_ADMIN' ? (
                                    <button 
                                      onClick={() => {
                                        if (!selectedMatchForResults) {
                                          alert("Please choose a match room first!");
                                          return;
                                        }
                                        if (!resultsScreenshot) {
                                          alert("Please attach/load a leaderboard screenshot/image first!");
                                          return;
                                        }

                                        // Persist scoreboard screenshot inside matches list
                                        setMatches(prevMatches => prevMatches.map(m => {
                                          if (m.id === selectedMatchForResults) {
                                            return {
                                              ...m,
                                              resultsDeclared: true,
                                              resultsScreenshot: resultsScreenshot,
                                              resultsPositions: m.resultsPositions || {}
                                            };
                                          }
                                          return m;
                                        }));

                                        logActivity('Point_Table_Admin', `ম্যাচ #${selectedMatchForResults.toUpperCase()} এর স্কোরবোর্ড স্ক্রিনশট আপলোড করে পাবলিশ করেছেন।`);
                                        playGlassChime();
                                        alert("Leaderboard scoreboard image uploaded and published successfully!");

                                        // Reset
                                        setSelectedMatchForResults('');
                                        setResultsPositions({});
                                        setResultsScreenshot('');
                                      }}
                                      className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-pink-500 to-indigo-600 text-white cursor-pointer hover:opacity-90 active:scale-98"
                                    >
                                      📸 Publish Leaderboard Scoreboard Image
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        if (!selectedMatchForResults) {
                                          alert("Please choose a match room first!");
                                          return;
                                        }
                                        if (Object.keys(resultsPositions).length === 0) {
                                          alert("Please assign at least one standing position!");
                                          return;
                                        }
                                        if (!resultsScreenshot) {
                                          alert("Please attach/load a leaderboard screenshot!");
                                          return;
                                        }

                                        // Grab target match prize pool details
                                        const matchedM = matches.find(m => m.id === selectedMatchForResults);
                                        const prizePool = matchedM ? matchedM.winPrize : 300;

                                        // Instantly update balances and declare winners in memory!
                                        const updatedUsers = usersList.map(usr => {
                                          const stand = resultsPositions[usr.teamName];
                                          let reward = 0;
                                          if (stand === '1st') reward = Math.round(prizePool * 0.6);
                                          else if (stand === '2nd') reward = Math.round(prizePool * 0.3);
                                          else if (stand === '3rd') reward = Math.round(prizePool * 0.1);

                                          if (reward > 0) {
                                            const logText = `${usr.teamName} (${usr.iglGameName}) কাস্টম ম্যাচে ${stand} হওয়ার জন্য লয়ালটি ওয়ালেটে পেয়েছেন ৳${reward}!`;
                                            
                                            // Add log activity
                                            logActivity('Owner', logText);
                                            
                                            // If active profile matches, update logged in user budget concurrently!
                                            if (user.teamName === usr.teamName) {
                                              setUser(prev => ({
                                                ...prev,
                                                balance: prev.balance + reward,
                                                winningBalance: prev.winningBalance + reward
                                              }));
                                            }

                                            return {
                                              ...usr,
                                              balance: usr.balance + reward,
                                              winningBalance: usr.winningBalance + reward
                                            };
                                          }
                                          return usr;
                                        });

                                        setUsersList(updatedUsers);

                                        // Persist scoreboard result screenshot & rankings inside matches list
                                        setMatches(prevMatches => prevMatches.map(m => {
                                          if (m.id === selectedMatchForResults) {
                                            return {
                                              ...m,
                                              resultsDeclared: true,
                                              resultsScreenshot: resultsScreenshot,
                                              resultsPositions: resultsPositions
                                            };
                                          }
                                          return m;
                                        }));

                                        playGlassChime();
                                        alert("AI prize engine processed! Balance and payouts wired successfully within 0.8 seconds.");
                                        
                                        // reset
                                        setSelectedMatchForResults('');
                                        setResultsPositions({});
                                        setResultsScreenshot('');
                                      }}
                                      className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-pink-500 to-[#e2136e] text-white cursor-pointer hover:opacity-90 active:scale-98 transition-transform"
                                    >
                                      🤖 AI Pay & Publish Standings
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* RENDER C: OWNER SUPER-ADMIN PRIVILEGED SECTION */}
                          {adminActiveTab === 'owner' && (
                            <div className="space-y-4 animate-fade-in text-[10.5px]">
                              
                              {/* DYNAMIC CATEGORY AND MATCH RULES CREATOR & EDITOR */}
                              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-950 space-y-4">
                                <span className="text-[9px] font-black tracking-wider text-purple-400 uppercase font-mono block">🛠️ SYSTEM MATCH RULES & MODES ENGINE</span>
                                
                                {/* Section A: Create New Mode/Category */}
                                <div className="p-2.5 bg-black/40 rounded-lg border border-purple-900/20 space-y-2">
                                  <span className="text-[8px] font-bold text-purple-300 uppercase block font-mono">➕ Add New Match Category Definition</span>
                                  <div className="grid grid-cols-3 gap-2 font-mono">
                                    <div>
                                      <label className="block text-[7px] text-slate-500 uppercase font-bold">Category ID:</label>
                                      <input 
                                        type="text" 
                                        placeholder="e.g. survival"
                                        value={newCatId}
                                        onChange={(e) => setNewCatId(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                                        className="w-full p-2 bg-[#070b19] border border-slate-805/40 rounded text-purple-300 text-[9.5px]"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[7px] text-slate-500 uppercase font-bold">Title Bangla:</label>
                                      <input 
                                        type="text" 
                                        placeholder="উদা: সারভাইভাল"
                                        value={newCatTitleBn}
                                        onChange={(e) => setNewCatTitleBn(e.target.value)}
                                        className="w-full p-2 bg-[#070b19] border border-slate-805/40 rounded text-slate-200 text-[9.5px]"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[7px] text-slate-500 uppercase font-bold">Title English:</label>
                                      <input 
                                        type="text" 
                                        placeholder="e.g. Survival Map"
                                        value={newCatTitleEn}
                                        onChange={(e) => setNewCatTitleEn(e.target.value)}
                                        className="w-full p-2 bg-[#070b19] border border-slate-805/40 rounded text-slate-200 text-[9.5px]"
                                      />
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const cid = newCatId.trim();
                                      if (!cid) {
                                        alert("Category ID is required!");
                                        return;
                                      }
                                      if (rulesPanelCategories.some(c => c.id === cid)) {
                                        alert("Category ID already exists!");
                                        return;
                                      }
                                      const newCat: RuleCategory = {
                                        id: cid,
                                        titleBn: newCatTitleBn.trim() || cid.toUpperCase(),
                                        titleEn: newCatTitleEn.trim() || cid.toUpperCase(),
                                        rulesBn: [],
                                        rulesEn: []
                                      };
                                      setRulesPanelCategories(prev => [...prev, newCat]);
                                      setSelectedCatForEditId(cid);
                                      setNewCatId('');
                                      setNewCatTitleBn('');
                                      setNewCatTitleEn('');
                                      logActivity('Owner', `নতুন ক্যাটাগরি তৈরি করা হয়েছে: ${cid}`);
                                      alert("New match category created successfully! Edit rules for it below.");
                                    }}
                                    className="px-3.5 py-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 font-bold text-[9px] border border-purple-700/20 active:scale-95 cursor-pointer uppercase tracking-tight duration-100"
                                  >
                                    Create Category Tab
                                  </button>
                                </div>

                                {/* Section B: Edit Existing Modes/Rules */}
                                <div className="p-2.5 bg-black/40 rounded-lg border border-purple-900/20 space-y-3 font-mono">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-bold text-purple-300 uppercase block font-mono">✏️ Edit Existing Categories & Rules ({rulesPanelCategories.length})</span>
                                    {rulesPanelCategories.length > 0 && (
                                      <button
                                        onClick={() => {
                                          if (confirm(`Do you really want to delete the whole "${selectedCatForEditId.toUpperCase()}" rule tab?`)) {
                                            setRulesPanelCategories(prev => prev.filter(c => c.id !== selectedCatForEditId));
                                            const remaining = rulesPanelCategories.filter(c => c.id !== selectedCatForEditId);
                                            if (remaining.length > 0) {
                                              setSelectedCatForEditId(remaining[0].id);
                                            }
                                            logActivity('Owner', `ক্যাটাগরি "${selectedCatForEditId}" সম্পূর্ণ মুছে ফেলা হয়েছে।`);
                                            alert("Category deleted successfully.");
                                          }
                                        }}
                                        className="text-red-400 bg-red-950/40 border border-red-900/30 px-2 py-0.5 rounded text-[8px] hover:bg-red-900/30"
                                      >
                                        Delete Entire Tab
                                      </button>
                                    )}
                                  </div>

                                  <div>
                                    <label className="block text-[7.5px] text-slate-500 uppercase mb-1">Select Category to Manage/Edit:</label>
                                    <select
                                      value={selectedCatForEditId}
                                      onChange={(e) => setSelectedCatForEditId(e.target.value)}
                                      className="w-full p-2 bg-[#070b19] border border-slate-805/40 rounded text-slate-200 text-[10px]"
                                    >
                                      {rulesPanelCategories.map(c => (
                                        <option key={c.id} value={c.id}>{c.titleEn} / {c.titleBn} ({c.id})</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[7.5px] text-slate-500 uppercase mb-1">Edit Title (Bangla) :</label>
                                      <input 
                                        type="text" 
                                        value={editCatTitleBn}
                                        onChange={(e) => setEditCatTitleBn(e.target.value)}
                                        className="w-full p-2 bg-[#070b19] border border-slate-805/40 rounded text-slate-200 text-[10px]"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[7.5px] text-slate-500 uppercase mb-1">Edit Title (English) :</label>
                                      <input 
                                        type="text" 
                                        value={editCatTitleEn}
                                        onChange={(e) => setEditCatTitleEn(e.target.value)}
                                        className="w-full p-2 bg-[#070b19] border border-slate-805/40 rounded text-slate-200 text-[10px]"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[7.5px] text-slate-500 uppercase mb-1">Rules Bangla (1 per line) :</label>
                                      <textarea 
                                        rows={4}
                                        value={editCatRulesBn}
                                        onChange={(e) => setEditCatRulesBn(e.target.value)}
                                        placeholder="১. কাস্টম ঘরের নিয়মাবলী"
                                        className="w-full p-2 bg-[#070b19] border border-slate-805/40 rounded text-slate-200 text-[9px] leading-tight"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[7.5px] text-slate-500 uppercase mb-1">Rules English (1 per line) :</label>
                                      <textarea 
                                        rows={4}
                                        value={editCatRulesEn}
                                        onChange={(e) => setEditCatRulesEn(e.target.value)}
                                        placeholder="1. Custom room instruction rules"
                                        className="w-full p-2 bg-[#070b19] border border-slate-805/40 rounded text-slate-200 text-[9px] leading-tight"
                                      />
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => {
                                      const titleBnObj = editCatTitleBn.trim();
                                      const titleEnObj = editCatTitleEn.trim();
                                      const rulesBn = editCatRulesBn.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                                      const rulesEn = editCatRulesEn.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                                      
                                      setRulesPanelCategories(prev => prev.map(c => {
                                        if (c.id === selectedCatForEditId) {
                                          return {
                                            ...c,
                                            titleBn: titleBnObj || c.titleBn,
                                            titleEn: titleEnObj || c.titleEn,
                                            rulesBn,
                                            rulesEn
                                          };
                                        }
                                        return c;
                                      }));
                                      
                                      logActivity('Owner', `ক্যাটাগরি "${selectedCatForEditId}" এর শিরোনাম ও নিয়মাবলী আপডেট করা হয়েছে।`);
                                      alert("Rule Configurations Updated & Saved Globally!");
                                    }}
                                    className="w-full py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-[10px] duration-100 uppercase"
                                  >
                                    ✓ Save System Category Rules
                                  </button>
                                </div>
                              </div>

                              {/* 2. CONCLUDED MATCH CLEANUP & DELETION */}
                              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-950 space-y-2.5">
                                <span className="text-[9px] font-black tracking-wider text-red-400 uppercase font-mono block">🗑️ CONCLUDED MATCH PURGER & CLEANUP</span>
                                <span className="text-slate-500 text-[8px] block font-mono uppercase">PERMANENTLY DELETE AN OLD, COMPLETE, OR UNWANTED MATCH CARD FROM LOBBY</span>
                                
                                <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono">
                                  {matches.length === 0 ? (
                                    <div className="text-slate-600 text-center py-4 text-[8px] uppercase font-bold">No active match card in database list.</div>
                                  ) : (
                                    matches.map((m) => {
                                      const rCount = m.joinedTeams.length;
                                      return (
                                        <div key={m.id} className="p-2 rounded bg-black/60 border border-slate-900/50 flex justify-between items-center gap-2">
                                          <div className="text-left">
                                            <span className="font-bold text-slate-200 block text-[9.5px]">🐺 {m.title}</span>
                                            <span className="text-[7.5px] text-slate-500 block">ID: {m.id.toUpperCase()} | Map: {m.map} | Teams: {rCount}/{m.totalSlots}</span>
                                          </div>
                                          <div>
                                            <button
                                              onClick={async () => {
                                                if (confirm(language === 'bn' ? `আপনি কি নিশ্চিত যে আপনি "${m.title}" ম্যাচ কার্ডটি এবং স্লট বুকিংসহ সম্পূর্ণ ডিলিট/মুছে ফেলতে চান?` : `Do you really want to permanently delete match "${m.title}"?`)) {
                                                  await handleDeleteMatch(m.id);
                                                }
                                              }}
                                              className="px-2.5 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 font-bold text-[8.5px] border border-red-800/20 uppercase transition-all hover:scale-105 active:scale-95 cursor-pointer text-center"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </div>

                              {/* 1. MFS COORDINATES AND TELEGRAM UPDATER */}
                              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-950">
                                <span className="text-[9px] font-black tracking-wider text-purple-400 uppercase font-mono block mb-2.5">🛠️ OWNER MFS & CHAT CONFIGURATION</span>
                                
                                <div className="space-y-2.5 font-mono">
                                  <div>
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Active Bkash Recipient Number :</label>
                                    <input 
                                      type="tel" 
                                      value={bKashNumber}
                                      onChange={(e) => setBKashNumber(e.target.value)}
                                      className="w-full p-2 rounded-lg text-[10px] glass-input text-[#ff2e7e] font-bold"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Active Nagad Recipient Number :</label>
                                    <input 
                                      type="tel" 
                                      value={nagadNumber}
                                      onChange={(e) => setNagadNumber(e.target.value)}
                                      className="w-full p-2 rounded-lg text-[10px] glass-input text-orange-400 font-bold"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Telegram Helpdesk Support Link :</label>
                                    <input 
                                      type="url" 
                                      value={telegramSupportLink}
                                      onChange={(e) => setTelegramSupportLink(e.target.value)}
                                      className="w-full p-2 rounded-lg text-[10px] glass-input text-cyan-400"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">WhatsApp Helpdesk Support Link :</label>
                                    <input 
                                      type="url" 
                                      value={whatsAppSupportLink}
                                      onChange={(e) => setWhatsAppSupportLink(e.target.value)}
                                      className="w-full p-2 rounded-lg text-[10px] glass-input text-emerald-400"
                                      placeholder="https://wa.me/..."
                                    />
                                  </div>

                                  <div className="pt-2 border-t border-white/[0.04] space-y-2">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono block">ℹ️ EDIT ABOUT US SOCIAL DEEP-LINKS</span>
                                    
                                    <div>
                                      <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">About Telegram Channel Link :</label>
                                      <input 
                                        type="url" 
                                        value={aboutTelegramLink}
                                        onChange={(e) => setAboutTelegramLink(e.target.value)}
                                        className="w-full p-2 rounded-lg text-[10px] glass-input text-[#0088cc]"
                                        placeholder="https://t.me/..."
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">About WhatsApp Channel Link :</label>
                                      <input 
                                        type="url" 
                                        value={aboutWhatsappLink}
                                        onChange={(e) => setAboutWhatsappLink(e.target.value)}
                                        className="w-full p-2 rounded-lg text-[10px] glass-input text-emerald-400"
                                        placeholder="https://chat.whatsapp.com/..."
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">About Messenger Group Link :</label>
                                      <input 
                                        type="url" 
                                        value={aboutMessengerLink}
                                        onChange={(e) => setAboutMessengerLink(e.target.value)}
                                        className="w-full p-2 rounded-lg text-[10px] glass-input text-[#006AFF]"
                                        placeholder="https://m.me/join/..."
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">About TikTok ID Profile Link :</label>
                                      <input 
                                        type="url" 
                                        value={aboutTiktokLink}
                                        onChange={(e) => setAboutTiktokLink(e.target.value)}
                                        className="w-full p-2 rounded-lg text-[10px] glass-input text-[#FE2C55]"
                                        placeholder="https://www.tiktok.com/@..."
                                      />
                                    </div>
                                  </div>

                                  <button 
                                    onClick={() => {
                                      logActivity('Owner', `পেমেন্ট ও সাপোর্ট নাম্বার, এবং ৪টি নতুন "আমাদের সম্পর্কে" সোশ্যাল লিংক আপডেট ও সংরক্ষণ করা হয়েছে।`);
                                      alert("Owner Configuration Settings Joined & Applied Globally!");
                                    }}
                                    className="w-full py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold cursor-pointer"
                                  >
                                    ✓ Save System Parameters
                                  </button>
                                </div>
                              </div>

                              {/* DYNAMIC MATCH GUIDELINES OWNER CONTROL */}
                              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-905 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-purple-500"></div>
                                <span className="text-[9.5px] font-black tracking-wider text-purple-400 uppercase font-mono block mb-1">📢 OWNER EDIT MATCH GUIDELINES</span>
                                <span className="text-slate-500 text-[8px] block mb-3 font-mono">OVERLOAD MATCH GUIDELINES SHOWN TO REGISTERED TEAMS BEFORE BOOKING</span>

                                <div className="space-y-2.5 font-mono">
                                  <div>
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Match Guidelines (Bangla / বাংলা) :</label>
                                    <textarea 
                                      value={matchGuidelinesBn}
                                      onChange={(e) => setMatchGuidelinesBn(e.target.value)}
                                      rows={3}
                                      className="w-full p-2 rounded-lg text-[10px] glass-input text-slate-100 font-sans leading-normal focus:border-purple-500/50"
                                      placeholder="১. স্লট: নির্দিষ্ট স্লটে বসুন..."
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Match Guidelines (English) :</label>
                                    <textarea 
                                      value={matchGuidelinesEn}
                                      onChange={(e) => setMatchGuidelinesEn(e.target.value)}
                                      rows={3}
                                      className="w-full p-2 rounded-lg text-[10px] glass-input text-slate-100 font-sans leading-normal focus:border-purple-500/50"
                                      placeholder="1. Slot: Sit on designated slot..."
                                    />
                                  </div>

                                  <button 
                                    onClick={() => {
                                      logActivity('Owner', `ম্যাচ শুরুর জরুরি নিয়মাবলী আপডেট সম্পন্ন করা হয়েছে।`);
                                      triggerFlashNotification(
                                        "Guidelines updated successfully and synced live!",
                                        "ম্যাচ নিয়মাবলী সফলভাবে আপডেট এবং লাইভ সিঙ্ক করা হয়েছে!"
                                      );
                                      playGlassChime();
                                    }}
                                    className="w-full py-1.5 rounded-lg bg-gradient-to-r from-purple-700 to-indigo-850 hover:from-purple-600 hover:to-indigo-750 text-white font-bold text-[9px] uppercase tracking-wider cursor-pointer active:scale-95 transition-transform"
                                  >
                                    💾 Save & Sync Guidelines Live
                                  </button>
                                </div>
                              </div>

                              {/* 2. OWNER'S FINANCIAL APPROVAL BOARD */}
                              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-950 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-cyan-500"></div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[9.5px] font-black tracking-wider text-cyan-400 uppercase font-mono">💰 DEPOSIT & WITHDRAWAL REQUESTS BOARD</span>
                                  <div className="flex gap-1.5 font-mono text-[8px]">
                                    <button 
                                      onClick={() => setOwnerFinanceTab('manual')}
                                      className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${ownerFinanceTab === 'manual' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-950 text-slate-500 border border-transparent'}`}
                                    >
                                      Manual (bKash/Nagad)
                                    </button>
                                    <button 
                                      onClick={() => setOwnerFinanceTab('instant')}
                                      className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${ownerFinanceTab === 'instant' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-950 text-slate-500 border border-transparent'}`}
                                    >
                                      Instant Gateway
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2 mt-3 font-mono">
                                  {(() => {
                                    const filteredTxs = transactions.filter(tx => {
                                      // manual transactions typically have transactionId and are deposits, or explicit isManual logs
                                      const isManualTx = tx.isManual || (tx.transactionId && tx.transactionId.length > 0);
                                      if (ownerFinanceTab === 'manual') {
                                        return isManualTx;
                                      } else {
                                        return !isManualTx;
                                      }
                                    });

                                    if (filteredTxs.length === 0) {
                                      return (
                                        <p className="text-center py-4 text-slate-600 text-[9px] uppercase font-bold">
                                          No transactions logged under this log filter.
                                        </p>
                                      );
                                    }

                                    return filteredTxs.map((tx) => {
                                      const associatedUserObj = usersList.find(u => u.mobile === tx.accountNo) || user;
                                      return (
                                        <div key={tx.id} className="p-2.5 rounded-lg bg-black/60 border border-slate-900 flex justify-between items-start gap-1">
                                          <div className="space-y-1 text-left">
                                            <div className="flex gap-2 items-center">
                                              <span className={`px-1 rounded text-[7.5px] font-black uppercase ${tx.type === 'DEPOSIT' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30' : 'bg-amber-950 text-amber-500 border border-amber-900/30'}`}>
                                                {tx.type}
                                              </span>
                                              <span className="text-slate-300 font-bold">{associatedUserObj.teamName || 'Unknown Squad'}</span>
                                              <span className="text-slate-500 text-[8.5px]">({tx.accountNo})</span>
                                            </div>

                                            <div className="text-[9px] text-slate-400 space-y-0.5">
                                              <p>MFS Method: <span className="text-pink-400 font-bold">{tx.method}</span></p>
                                              {tx.transactionId && <p>TrxID: <span className="text-white font-bold tracking-wider">{tx.transactionId}</span></p>}
                                              {tx.matchId && <p>Target Match: <span className="text-purple-400 font-semibold uppercase font-mono">#{tx.matchId}</span></p>}
                                              <p className="text-slate-500 text-[8px]">{tx.date}</p>
                                            </div>
                                          </div>

                                          <div className="flex flex-col items-end gap-1.5 min-w-[70px]">
                                            <span className="text-[11px] font-black text-rose-400">৳{tx.amount}</span>
                                            
                                            {/* Status Badge */}
                                            <span className={`px-1 py-0.5 rounded text-[8px] font-black uppercase text-center min-w-[55px] ${
                                              tx.status === 'SUCCESS' 
                                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/20' 
                                                : tx.status === 'FAILED' 
                                                  ? 'bg-red-950/80 text-red-500' 
                                                  : 'bg-amber-950/80 text-amber-500 animate-pulse'
                                            }`}>
                                              {tx.status}
                                            </span>

                                            {/* Action Toggles if Pending */}
                                            {tx.status === 'PENDING' && (
                                              <div className="flex gap-1.5 mt-1.5">
                                                <button 
                                                  onClick={() => {
                                                    // APPROVED
                                                    const targetUserMobile = tx.accountNo;
                                                    const targetTxAmount = tx.amount;
                                                    const matchId = tx.matchId;

                                                    // Use metadata team/IGL name if provided, else fallback to user's registered name
                                                    const trgUsr = usersList.find(u => u.mobile === targetUserMobile) || user;
                                                    const teamToRegister = tx.metaTeamName || trgUsr.teamName;
                                                    const iglToRegister = tx.metaIglName || trgUsr.iglGameName || 'N/A';

                                                    // 1. Update the specific user's balance and match counts in usersList
                                                    setUsersList(prevList => {
                                                      return prevList.map(u => {
                                                        if (u.mobile === targetUserMobile) {
                                                          let updatedBalance = Number(u.balance) + Number(targetTxAmount);
                                                          let updatedJoinedCount = u.joinedMatchesCount;
                                                          if (matchId) {
                                                            const linkedMatch = matches.find(m => m.id === matchId);
                                                            if (linkedMatch && !linkedMatch.joinedTeams.includes(teamToRegister)) {
                                                              updatedBalance = updatedBalance - linkedMatch.entryFee;
                                                              updatedJoinedCount = updatedJoinedCount + 1;
                                                            }
                                                          }
                                                          return { 
                                                            ...u, 
                                                            balance: updatedBalance,
                                                            joinedMatchesCount: updatedJoinedCount
                                                          };
                                                        }
                                                        return u;
                                                      });
                                                    });

                                                    // 2. Update logged-in user state synchronously if it matches approved account
                                                    if (user && user.mobile === targetUserMobile) {
                                                      setUser(prevU => {
                                                        let updatedBalance = Number(prevU.balance) + Number(targetTxAmount);
                                                        let updatedJoinedCount = prevU.joinedMatchesCount;
                                                        if (matchId) {
                                                          const linkedMatch = matches.find(m => m.id === matchId);
                                                          if (linkedMatch && !linkedMatch.joinedTeams.includes(teamToRegister)) {
                                                            updatedBalance = updatedBalance - linkedMatch.entryFee;
                                                            updatedJoinedCount = updatedJoinedCount + 1;
                                                          }
                                                        }
                                                        return {
                                                          ...prevU,
                                                          balance: updatedBalance,
                                                          joinedMatchesCount: updatedJoinedCount
                                                        };
                                                      });
                                                    }

                                                    // 3. Update matches slot & metadata configuration mapping if a target matchId exists
                                                    if (matchId) {
                                                      const linkedMatch = matches.find(m => m.id === matchId);
                                                      if (linkedMatch && !linkedMatch.joinedTeams.includes(teamToRegister)) {
                                                        setMatches(mList => mList.map(m => {
                                                          if (m.id === matchId) {
                                                            const currentIgls = m.joinedTeamIgls || {};
                                                            const currentMobiles = m.joinedMobiles || {};
                                                            return {
                                                              ...m,
                                                              occupiedSlots: Math.min(m.totalSlots, m.occupiedSlots + 1),
                                                              joinedTeams: [...m.joinedTeams, teamToRegister],
                                                              joinedTeamIgls: {
                                                                ...currentIgls,
                                                                [teamToRegister]: iglToRegister
                                                              },
                                                              joinedMobiles: {
                                                                ...currentMobiles,
                                                                [teamToRegister]: targetUserMobile
                                                              }
                                                            };
                                                          }
                                                          return m;
                                                        }));

                                                        // Generate an automatic withdraw log to display subtraction for match entry fee
                                                        const deductTx: Transaction = {
                                                          id: 'tx_embed_ded_auto_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
                                                          type: 'WITHDRAW',
                                                          amount: linkedMatch.entryFee,
                                                          method: tx.method,
                                                          accountNo: targetUserMobile,
                                                          metaTeamName: teamToRegister,
                                                          metaIglName: iglToRegister,
                                                          status: 'SUCCESS',
                                                          isManual: false,
                                                          date: new Date().toISOString().replace('T', ' ').substring(0, 16)
                                                        };
                                                        setTransactions(prev => [deductTx, ...prev]);

                                                        // Log custom activity trace
                                                        logActivity('System', `ট্রানজেকশন আইডি ${tx.transactionId || tx.id.substring(0,6)} এপ্রুভ হওয়ায় ${teamToRegister} কাস্টম রুম #${matchId.toUpperCase()} এ সফলভাবে অটোমেটিক জয়েন করেছে।`);
                                                      }
                                                    }

                                                    // 4. Update status of the actual PENDING transaction to SUCCESS in transactions state
                                                    setTransactions(prev => prev.map(t => {
                                                      if (t.id === tx.id) {
                                                        return { ...t, status: 'SUCCESS' };
                                                      }
                                                      return t;
                                                    }));

                                                    logActivity('Owner', `ট্রানজেকশন #${tx.transactionId || tx.id.substring(0,6)} এপ্রুভ করা হয়েছে। পরিমাণ ৳${targetTxAmount}।`);
                                                    
                                                    // Trigger persistent overlay push alert
                                                    triggerFlashNotification(
                                                      `Approved! BDT ${targetTxAmount} has been credited to wallet.`,
                                                      `ম্যানুয়াল ডিপোজিট সফলভাবে এপ্রুভ হয়েছে এবং ৳${targetTxAmount} ব্যালেন্স যোগ হয়েছে!`
                                                    );
                                                    playGlassChime();
                                                  }}
                                                  className="px-2 py-1 bg-emerald-700 font-bold text-white text-[8px] rounded hover:bg-emerald-600 active:scale-95 cursor-pointer"
                                                >
                                                  APPROVE
                                                </button>
                                                <button 
                                                  onClick={() => {
                                                    // REJECTED
                                                    setTransactions(prev => prev.map(t => {
                                                      if (t.id === tx.id) {
                                                        logActivity('Owner', `ট্রানজেকশন #${tx.transactionId || tx.id.substring(0,6)} রিজেক্ট ও বাতিল করা হয়েছে।`);
                                                        return { ...t, status: 'FAILED' };
                                                      }
                                                      return t;
                                                    }));
                                                    alert("Transaction explicitly REJECTED & cancelled!");
                                                  }}
                                                  className="px-2 py-1 bg-rose-700 font-bold text-white text-[8px] rounded hover:bg-rose-600 active:scale-95 cursor-pointer"
                                                >
                                                  REJECT
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>

                              {/* 3. HARD player PROFILE DIRECTORY BALANCE ADJUSTMENTS */}
                              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-950 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-purple-500"></div>
                                <span className="text-[9.5px] font-black tracking-wider text-purple-400 uppercase font-mono block mb-1">💳 PLAYER REGISTRY & WALLET MANAGEMENT</span>
                                <span className="text-slate-500 text-[8.5px] block mb-3 font-mono">SEARCH SQUAD DIRECTORY TO MODIFY WALLET BALANCE AND VIEW ACCURATE METRICS</span>

                                <div className="mb-3">
                                  <input 
                                    type="text"
                                    placeholder="🔍 Search Squad Name or IGL Name..."
                                    value={ownerUserSearch}
                                    onChange={(e) => setOwnerUserSearch(e.target.value)}
                                    className="w-full p-2 rounded-lg text-[10px] bg-black/60 border border-slate-950 text-white font-semibold focus:border-purple-500/80 outline-none"
                                  />
                                </div>

                                <div className="space-y-2 font-mono max-h-60 overflow-y-auto pr-1 text-left">
                                  {(() => {
                                    const searchFiltered = usersList.filter(u => {
                                      const squad = (u.teamName || '').toLowerCase();
                                      const igl = (u.iglGameName || '').toLowerCase();
                                      const term = ownerUserSearch.toLowerCase();
                                      return squad.includes(term) || igl.includes(term);
                                    });

                                    if (searchFiltered.length === 0) {
                                      return <p className="text-[8.5px] text-slate-600 py-3 text-center uppercase font-bold">No Users Match Search Terms.</p>;
                                    }

                                    return searchFiltered.map((usr) => (
                                      <div key={usr.mobile} className={`p-2 rounded-lg border transition-all ${selectedUserForBalance === usr.mobile ? 'bg-purple-950/20 border-purple-500' : 'bg-black/30 border-slate-950'}`}>
                                        <div className="flex justify-between items-center text-[9px]">
                                          <div>
                                            <span className="font-bold text-slate-200 block">{usr.teamName} <span className="text-[8px] text-slate-500">(IGL: {usr.iglGameName})</span></span>
                                            <span className="text-slate-500 text-[8px]">Mobile: {usr.mobile} | Joined Matches: {usr.joinedMatchesCount}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-emerald-400 font-bold block bg-emerald-950/50 px-1.5 py-0.5 rounded text-[8.5px]">৳{usr.balance}</span>
                                            <button 
                                              onClick={() => {
                                                setSelectedUserForBalance(usr.mobile);
                                                setNewBalanceAmount(usr.balance);
                                              }}
                                              className="px-2 py-0.5 rounded bg-purple-900 text-purple-200 hover:bg-purple-800 text-[7.5px] font-bold uppercase transition-transform active:scale-95 cursor-pointer"
                                            >
                                              Select
                                            </button>
                                          </div>
                                        </div>

                                        {selectedUserForBalance === usr.mobile && (
                                          <div className="mt-2.5 pt-2 border-t border-slate-900/60 flex items-center gap-2">
                                            <input 
                                              type="number" 
                                              value={newBalanceAmount}
                                              onChange={(e) => setNewBalanceAmount(parseInt(e.target.value) || 0)}
                                              className="flex-1 p-1 bg-black/50 rounded text-[10px] text-cyan-400 font-bold border border-slate-800 focus:outline-none"
                                            />
                                            <button 
                                              onClick={() => {
                                                const updatedUsers = usersList.map(u => {
                                                  if (u.mobile === selectedUserForBalance) {
                                                    logActivity('Owner', `${u.teamName} এর ব্যালেন্স ম্যানুয়ালি পরিবর্তন করে ৳${newBalanceAmount} করা হয়েছে।`);
                                                    
                                                    // Sync logged-in user too if applicable
                                                    if (user.mobile === u.mobile) {
                                                      setUser(prev => ({
                                                        ...prev,
                                                        balance: newBalanceAmount
                                                      }));
                                                    }

                                                    return {
                                                      ...u,
                                                      balance: newBalanceAmount
                                                    };
                                                  }
                                                  return u;
                                                });
                                                setUsersList(updatedUsers);
                                                setSelectedUserForBalance('');
                                                alert("User Wallet Balance Updated in Real-Time!");
                                              }}
                                              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 font-bold text-white text-[8px] rounded cursor-pointer"
                                            >
                                              Apply ৳
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ));
                                  })()}
                                </div>
                              </div>

                              {/* 3. STRUCTURAL ADMIN ROLES DELEGATION PANEL */}
                              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-950">
                                <span className="text-[9px] font-black tracking-wider text-purple-400 uppercase font-mono block mb-2.5">👥 USER ROLES & SEGREGATION SYSTEM</span>
                                
                                <div className="space-y-2.5 font-mono">
                                  {usersList.map((usr, i) => (
                                    <div key={i} className="bg-black/30 p-2 rounded-lg flex flex-col gap-1 border border-slate-950">
                                      <div className="flex justify-between items-center text-[9px]">
                                        <div>
                                          <span className="font-bold text-slate-200 block">{usr.teamName}</span>
                                          <span className="text-slate-500 text-[8px]">Mobile No: {usr.mobile}</span>
                                        </div>
                                        <span className={`px-1.5 py-0.5 rounded font-black text-[7.5px] uppercase ${
                                          usr.role === 'HOST_ADMIN'
                                            ? 'bg-amber-950 text-amber-400'
                                            : usr.role === 'POINT_TABLE_ADMIN'
                                              ? 'bg-pink-950 text-pink-400'
                                              : 'bg-slate-950 text-slate-500'
                                        }`}>
                                          {usr.role || 'USER'}
                                        </span>
                                      </div>

                                      {user.role === 'OWNER' ? (
                                        <>
                                        <div className="flex justify-between items-center pt-1 border-t border-slate-900/60 mt-1">
                                        <span className="text-[8px] text-slate-400">Promote Role:</span>
                                        <div className="flex gap-1">
                                          <button 
                                            onClick={() => {
                                              const updated = usersList.map(u => u.mobile === usr.mobile ? { ...u, role: 'HOST_ADMIN' } : u);
                                              setUsersList(updated);
                                              logActivity('Owner', `${usr.teamName} কে Host Admin হিসেবে প্রমোট করা হয়েছে।`);
                                              alert(`Promoted ${usr.teamName} to Host Admin Role!`);
                                            }}
                                            className="px-1.5 py-0.5 text-[7.5px] font-bold bg-amber-950 hover:bg-amber-900 text-amber-400 border border-amber-800/20 rounded cursor-pointer"
                                          >
                                            Host
                                          </button>
                                          <button 
                                            onClick={() => {
                                              const updated = usersList.map(u => u.mobile === usr.mobile ? { ...u, role: 'POINT_TABLE_ADMIN' } : u);
                                              setUsersList(updated);
                                              logActivity('Owner', `${usr.teamName} কে Point Table Admin হিসেবে প্রমোট করা হয়েছে।`);
                                              alert(`Promoted ${usr.teamName} to Point Table Admin Role!`);
                                            }}
                                            className="px-1.5 py-0.5 text-[7.5px] font-bold bg-pink-950 hover:bg-pink-900 text-pink-400 border border-pink-800/20 rounded cursor-pointer"
                                          >
                                            Pt Admin
                                          </button>
                                          <button 
                                            onClick={() => {
                                              const updated = usersList.map(u => u.mobile === usr.mobile ? { ...u, role: 'USER' } : u);
                                              setUsersList(updated);
                                              logActivity('Owner', `${usr.teamName} কে Standard User এ ডেমোট করা হয়েছে।`);
                                              alert(`Demoted ${usr.teamName} to standard User.`);
                                            }}
                                            className="px-1.5 py-0.5 text-[7.5px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-400 rounded cursor-pointer"
                                          >
                                            User
                                          </button>
                                        </div>
                                      </div>

                                      <div className="flex justify-between items-center pt-1 mt-1">
                                        <span className="text-[8px] text-red-400 font-bold font-mono">Status Action:</span>
                                        <button 
                                          onClick={() => {
                                            const updated = usersList.map(u => u.mobile === usr.mobile ? { ...u, banned: !u.banned } : u);
                                            setUsersList(updated);
                                            const isBan = !usr.banned;
                                            logActivity('Owner', `${usr.teamName} কে ${isBan ? 'ব্যান/ব্লক' : 'আনব্যান'} করা হয়েছে।`);
                                            alert(`${usr.teamName} is now ${isBan ? 'Banned' : 'Unbanned'} instantly!`);
                                          }}
                                          className={`px-2 py-0.5 rounded text-[8px] font-extrabold cursor-pointer transition-colors ${
                                            usr.banned 
                                              ? 'bg-emerald-900 text-emerald-400 border border-emerald-800/20' 
                                              : 'bg-red-950 text-red-400 hover:bg-red-900 border border-red-800/10'
                                          }`}
                                        >
                                          {usr.banned ? '🟢 UNBAN TEAM' : '🚫 MANAGE BAN / KICK'}
                                        </button>
                                      </div>
                                      </>
                                      ) : (
                                        <div className="pt-2 border-t border-slate-900/60 mt-1.5 flex justify-between text-[7.5px] text-slate-500 italic font-sans font-semibold uppercase leading-none">
                                          <span>🔒 Action restricted</span>
                                          <span>Owner privilege required</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* 4. AUDIT CENTRAL ACTIVITY LOG IN BANGLA */}
                              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-950 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[#c084fc]"></div>
                                <span className="text-[9.5px] font-black tracking-wider text-purple-400 uppercase font-mono block mb-2">⚙️ (5) AUDIT CENTRAL LOG</span>
                                
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-[8.5px] font-mono leading-normal">
                                  {activityLogs.map((log) => (
                                    <div key={log.id} className="p-2 rounded-lg bg-black/60 border border-slate-950">
                                      <div className="flex justify-between text-[7px] text-slate-500 mb-0.5">
                                        <span className="font-bold text-cyan-400">@{log.actor}</span>
                                        <span>{log.timestamp}</span>
                                      </div>
                                      <p className="text-slate-300 font-sans text-[9px]">{log.action}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          )}

                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

              </div>

              {/* PERSISTENT LIQUID BOTTOM NAVIGATION BAR (Located securely below) */}
              <nav className="absolute bottom-0 left-0 right-0 h-16 bg-black/85 backdrop-blur-xl border-t border-slate-900/60 grid grid-cols-3 pt-1.5 px-2 pb-3.5 z-40">
                <button 
                  onClick={() => {
                    setActiveTab('matches');
                    setActiveSubScreen('main');
                  }}
                  className={`flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${
                    activeTab === 'matches' ? 'text-cyan-400' : 'text-slate-500'
                  }`}
                >
                  <Trophy className={`w-5 h-5 ${activeTab === 'matches' ? 'scale-105 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]' : ''}`} />
                  <span className="text-[9px] font-bold mt-1 tracking-wider uppercase font-display leading-none">
                    {language === 'bn' ? 'ম্যাচ' : 'Matches'}
                  </span>
                </button>

                <button 
                  onClick={() => {
                    setActiveTab('wallet');
                    setActiveSubScreen('main');
                  }}
                  className={`flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${
                    activeTab === 'wallet' ? 'text-cyan-400' : 'text-slate-500'
                  }`}
                >
                  <WalletIcon className={`w-5 h-5 ${activeTab === 'wallet' ? 'scale-105 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]' : ''}`} />
                  <span className="text-[9px] font-bold mt-1 tracking-wider uppercase font-display leading-none">
                    {language === 'bn' ? 'ওয়ালেট' : 'Wallet'}
                  </span>
                </button>

                <button 
                  onClick={() => {
                    setActiveTab('profile');
                    setActiveSubScreen('main');
                  }}
                  className={`flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${
                    activeTab === 'profile' ? 'text-cyan-400' : 'text-slate-500'
                  }`}
                >
                  <User className={`w-5 h-5 ${activeTab === 'profile' ? 'scale-105 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]' : ''}`} />
                  <span className="text-[9px] font-bold mt-1 tracking-wider uppercase font-display leading-none">
                    {language === 'bn' ? 'প্রোফাইল' : 'Profile'}
                  </span>
                </button>
              </nav>
            </div>)}</div>}
        </div>
      }

      {/* PAYOUT DIALOG OVERLAY */}
      {payoutOverlayOpen && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fade-in font-mono">
          <div className="glass-panel border-amber-500/35 bg-slate-105/90 bg-slate-950/95 rounded-2xl p-4 max-w-xs w-full space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setPayoutOverlayOpen(false)}
              className="absolute right-3 top-3 text-slate-500 hover:text-white text-xs cursor-pointer font-black"
            >
              ✕
            </button>
            <div className="text-center space-y-1">
              <span className="text-[7.5px] font-black tracking-widest text-[#eab308] uppercase block">🏆 WOLF PRIZE CENTRAL HANDOFF</span>
              <h3 className="text-slate-100 font-bold text-[10px] uppercase">Send Win Reward to: <span className="text-cyan-400 block mt-1">🐺 {selectedTeamForPayout}</span></h3>
            </div>

            <div className="space-y-3 font-mono text-left">
              <div>
                <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Enter BDT Reward Amount :</label>
                <input 
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full p-2 bg-black text-emerald-400 font-black text-xs text-center border border-slate-800 rounded-lg focus:outline-none"
                />
              </div>

              <p className="text-[7px] text-slate-500 leading-normal text-center bg-black/30 p-2 rounded-md">
                * The input money amount will instantly and permanently credit straight to {selectedTeamForPayout}'s user wallet balance. Action is irreversible.
              </p>

              <div className="flex gap-2">
                <button 
                  onClick={() => setPayoutOverlayOpen(false)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-900 text-slate-400 font-bold hover:bg-slate-800 text-[9px] cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const amtNum = parseFloat(payoutAmount) || 0;
                    if (amtNum <= 0) {
                      alert("Please specify a valid BDT prize amount!");
                      return;
                    }

                    // Update in usersList
                    const updated = usersList.map(u => {
                      if (u.teamName === selectedTeamForPayout) {
                        const newBal = u.balance + amtNum;
                        const newWinBal = u.winningBalance + amtNum;
                        
                        // If active user profile represents the winning team, synchronize user context:
                        if (user.teamName === u.teamName) {
                          setUser(prev => ({
                            ...prev,
                            balance: newBal,
                            winningBalance: newWinBal
                          }));
                        }
                        return { ...u, balance: newBal, winningBalance: newWinBal };
                      }
                      return u;
                    });
                    setUsersList(updated);

                    // Put a system payout transaction log
                    const payoffLogTx: Transaction = {
                      id: 'tx_payoff_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
                      type: 'DEPOSIT',
                      amount: amtNum,
                      method: 'bKash',
                      accountNo: (usersList.find(u => u.teamName === selectedTeamForPayout)?.mobile) || user.mobile,
                      status: 'SUCCESS',
                      isManual: false,
                      transactionId: 'PAY' + Math.floor(Math.random() * 89999 + 10000),
                      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
                    };
                    setTransactions(prev => [payoffLogTx, ...prev]);

                    logActivity('System_Payout', `${selectedTeamForPayout} কাস্টম ম্যাচে জয়ী হওয়ার জন্য উপহারস্বরূপ ৳${amtNum} ওয়ালেটে গ্রহণ করেছেন।`);
                    playGlassChime();
                    setPayoutOverlayOpen(false);
                    alert(`Successfully transferred BDT ${amtNum} directly to team ${selectedTeamForPayout}!`);
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold hover:opacity-90 text-[9px] cursor-pointer active:scale-95 transition-transform"
                >
                  Dispatch BDT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom High-Fidelity Alert Dialog */}
      {customAlert && (
        <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-6 z-[9999] animate-fade-in">
          <div className="glass-panel border-cyan-500/30 p-5 rounded-2xl bg-slate-950/95 shadow-2xl shadow-cyan-500/20 max-w-sm text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3.5">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <p className="text-xs text-slate-100 leading-relaxed font-bold">
              {customAlert.message}
            </p>
            <button 
              onClick={() => setCustomAlert(null)}
              className="mt-4 px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-[10px] uppercase tracking-widest cursor-pointer active:scale-95 transition-transform"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* Premium Glassmorphic Slot Allocation Receipt Pop-up Modal */}
      {slotPopupDetails && slotPopupDetails.show && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-5 z-[99999] animate-fade-in font-display">
          <div className="glass-panel border-cyan-500/40 p-6 rounded-3xl bg-slate-950/95 shadow-2xl shadow-cyan-500/20 max-w-sm w-full text-center flex flex-col items-center relative overflow-hidden">
            {/* Ambient neon radial glow backdrop */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
            
            {/* Success Shield Icon with pulsing indicator */}
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-inner relative">
              <span className="absolute inset-x-0 h-full w-full rounded-full bg-cyan-400/10 animate-ping"></span>
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            </div>

            <h3 className="text-[13px] font-black tracking-widest text-[#22d3ee] uppercase font-sans">
              {language === 'bn' ? 'স্লট বরাদ্দ রশিদ' : 'SLOT ALLOCATION RECEIPT'}
            </h3>
            
            <p className="text-[8px] text-slate-400 uppercase tracking-widest font-mono mt-1">
              {language === 'bn' ? 'পেমেন্ট ও বুকিং সফলভাবে যাচাই করা হয়েছে' : 'Payment & Registration Confirmed'}
            </p>

            {/* Crucial High-Fidelity Slot Number Counter */}
            <div className="my-4 w-full py-4 rounded-2xl bg-gradient-to-tr from-[#020617]/90 to-[#0c162d]/90 border border-white/[0.05] shadow-inner relative flex flex-col items-center justify-center">
              <div className="absolute top-2 left-3 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[6.5px] text-slate-500 font-bold uppercase tracking-wider font-mono">Verified Match Entry</span>
              </div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-black mb-1">
                {language === 'bn' ? 'আপনার বরাদ্দকৃত আসন' : 'YOUR SLOT NUMBER'}
              </span>
              
              {/* Shifting metallic gradient slot count */}
              <div className="inline-block relative">
                <h1 className="text-3xl font-extrabold tracking-tighter bg-gradient-to-r from-emerald-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent px-4 py-0.5 filter drop-shadow-[0_0_12px_rgba(34,211,238,0.4)] font-logo">
                  #{slotPopupDetails.slotNumber < 10 ? `0${slotPopupDetails.slotNumber}` : slotPopupDetails.slotNumber}
                </h1>
              </div>
              
              <div className="mt-1 text-[7px] text-cyan-400/90 font-mono font-extrabold uppercase tracking-wider">
                {language === 'bn' ? 'সিলভার উলফ টুর্নামেন্ট সার্ভার' : 'Silver Wolf Live Directory Sync'}
              </div>
            </div>

            {/* Receipt Summary Grid */}
            <div className="w-full text-left bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl space-y-1.5 text-[8px] font-mono leading-relaxed text-slate-400">
              <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                <span className="text-slate-500 font-bold uppercase">TEAM NAME :</span>
                <span className="text-slate-200 font-extrabold truncate max-w-[150px]">{slotPopupDetails.teamName}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                <span className="text-slate-500 font-bold uppercase">MATCH ROOM :</span>
                <span className="text-slate-200 font-extrabold truncate max-w-[150px]">{slotPopupDetails.matchTitle}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-500 font-bold uppercase">STATUS :</span>
                <span className="text-emerald-400 font-black flex items-center space-x-1 uppercase">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{language === 'bn' ? 'বুকড ও লকড' : 'Booked & Locked'}</span>
                </span>
              </div>
            </div>

            <p className="text-[7.5px] text-slate-500 mt-3 pt-1 text-center max-w-[240px] leading-relaxed">
              {language === 'bn' 
                ? '🔔 নিয়মাবলী: রুম আইডি ও পাসওয়ার্ড ম্যাচ শুরুর ৪ মিনিট আগে ম্যাচের উইজেট কার্ডে দেওয়া হবে। আপনার বরাদ্দকৃত নির্ধারিত স্লটে বসতে বাধ্য থাকুন।' 
                : '🔔 Rules: Room credentials will reveal inside the match card exactly 4 minutes before match starts. You must sit inside your assigned slot #.'}
            </p>

            <button 
              onClick={() => {
                setSlotPopupDetails(null);
                playGlassChime();
              }}
              className="mt-4 px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-white font-bold text-[10px] tracking-wider uppercase shadow-lg shadow-indigo-950/50 cursor-pointer active:scale-95 transition-all w-full flex items-center justify-center space-x-1.5"
            >
              <span>{language === 'bn' ? 'ঠিক আছে, লবিতে যান' : 'Awesome, Go to Lobby'}</span>
            </button>
          </div>
        </div>
      )}



      {/* Dual Channel Floating Support Dock FAB */}
      <div className="absolute bottom-[72px] right-4 z-[9999] flex flex-col items-end gap-2 text-right">
        {/* Support Options Drawer */}
        {supportDockOpen && (
          <div className="glass-panel border-cyan-500/30 p-2.5 bg-slate-950/95 shadow-2xl rounded-2xl w-44 font-mono space-y-1.5 animate-fade-in border text-left">
            <div className="px-1.5 py-0.5 border-b border-white/5 pb-1">
              <span className="text-[7.5px] font-black tracking-wider text-cyan-400 uppercase leading-none block">Helpdesk Support</span>
              <span className="text-[6.5px] text-slate-500 block leading-normal mt-0.5">Select preferred channel:</span>
            </div>

            {/* Telegram Channel Option */}
            <a 
              href={telegramSupportLink} 
              target="_blank" 
              rel="noreferrer"
              onClick={() => {
                setSupportDockOpen(false);
                playGlassChime();
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/20 hover:border-[#0088cc]/40 transition-colors group cursor-pointer block"
            >
              <div className="w-5 h-5 rounded bg-[#0088cc] flex items-center justify-center text-white text-[10px]">
                ✈
              </div>
              <div className="leading-tight">
                <span className="text-[8.5px] font-bold text-slate-100 block group-hover:text-cyan-400">Telegram Desk</span>
                <span className="text-[6.5px] text-slate-400 block">Verified telegram link</span>
              </div>
            </a>

            {/* WhatsApp Channel Option */}
            <a 
              href={whatsAppSupportLink} 
              target="_blank" 
              rel="noreferrer"
              onClick={() => {
                setSupportDockOpen(false);
                playGlassChime();
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/30 border border-[#25D366]/20 hover:border-[#25D366]/40 transition-colors group cursor-pointer block"
            >
              <div className="w-5 h-5 rounded bg-[#25D366] flex items-center justify-center text-white text-[10px]">
                💬
              </div>
              <div className="leading-tight">
                <span className="text-[8.5px] font-bold text-slate-100 block group-hover:text-emerald-400">WhatsApp Chat</span>
                <span className="text-[6.5px] text-slate-400 block">Direct official response</span>
              </div>
            </a>
          </div>
        )}

        {/* Circular FAB Button */}
        <button
          onClick={() => {
            setSupportDockOpen(!supportDockOpen);
            playGlassChime();
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xl transition-transform hover:scale-110 active:scale-95 duration-200 cursor-pointer ${
            supportDockOpen 
              ? 'bg-rose-950/80 border border-rose-500/40 shadow-rose-500/20' 
              : 'bg-gradient-to-tr from-cyan-500 to-blue-600 border border-cyan-400/30 shadow-cyan-500/25 animate-pulse'
          }`}
          title="Support Helpdesk"
        >
          {supportDockOpen ? (
            <span className="font-sans font-bold text-xs text-rose-400">✕</span>
          ) : (
            <Headphones className="w-4.5 h-4.5 text-cyan-50" />
          )}
        </button>
      </div>

    </div>
  );
}

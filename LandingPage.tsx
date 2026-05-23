import React from 'react';
import { 
  Download, Trophy, Shield, Smartphone, Zap, Sparkles, 
  CheckCircle, Users, Percent, HelpCircle, ArrowRight
} from 'lucide-react';

interface LandingPageProps {
  language: 'bn' | 'en';
  setLanguage: (lang: 'bn' | 'en') => void;
  onLaunchAndroidSim: () => void;
}

export default function LandingPage({ language, setLanguage, onLaunchAndroidSim }: LandingPageProps) {
  return (
    <div className="flex-1 w-full text-left font-sans text-slate-100 flex flex-col justify-between p-6 lg:p-12 overflow-y-auto bg-transparent relative z-10 scrollbar">
      
      {/* Upper header */}
      <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
        <div className="flex items-center space-x-3.5">
          <img 
            src="/input_file_2.png" 
            alt="SLW Crest" 
            className="w-12 h-12 object-contain rounded-full shadow-lg border border-cyan-500/20"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <span className="text-xl font-logo tracking-widest font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-400 to-white block leading-none">
              SILVER WOLF
            </span>
            <span className="text-[9px] tracking-widest text-cyan-400 font-bold block mt-1">
              ORGANIZATION ESPORTS
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="text-xs font-semibold py-1.5 px-3.5 rounded-full glass-panel-light text-slate-300 hover:text-white transition-colors duration-150 cursor-pointer active:scale-95"
          >
            {language === 'bn' ? 'English Version' : 'বাংলা সংস্করণ'}
          </button>
        </div>
      </div>

      {/* Main Grid Banner Hero */}
      <div className="my-auto space-y-6 max-w-xl">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-cyan-950/40 border border-cyan-500/20 rounded-full text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{language === 'bn' ? 'অফিসিয়াল টুর্নামেন্ট পোর্টাল' : 'Official Tournament Portal'}</span>
        </div>

        <h1 className="text-3xl lg:text-5xl font-bold font-display leading-[1.12] tracking-tight">
          {language === 'bn' ? (
            <>
              সিলভার উলফ কাস্টম <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
                ই-স্পোর্টস প্লেগ্রাউন্ড
              </span>
            </>
          ) : (
            <>
              Silver Wolf Custom <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
                Esports Playground
              </span>
            </>
          )}
        </h1>

        <p className="text-slate-400 text-xs lg:text-sm leading-relaxed font-normal">
          {language === 'bn' ? (
            'বাংলাদেশে মোবাইল গেমিং টুর্নামেন্টের সবচেয়ে নির্ভরযোগ্য প্ল্যাটফর্ম। আমাদের রিয়েল-টাইম স্লট বুকিং সিস্টেম ও ডাবল-ভেরিফাইড পেমেন্ট ইন্টিগ্রেশনের মাধ্যমে নিরাপদ ম্যাচে জয়েন করুন এবং ইনস্ট্যান্ট উইথড্র করুন সরাসরি বিকাশ ও রকেট/নগদ এর মাধ্যমে।'
          ) : (
            'The absolute gold standard of Free Fire Custom Tournaments in South Asia. Complete with multi-tier anti-cheat verification, liquid-glass visual interfaces, and instant payout processing directly to your preferred local mobile wallets.'
          )}
        </p>

        {/* Action button trigger simulator or apk downloads */}
        <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
          <button 
            onClick={onLaunchAndroidSim}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/15 flex items-center justify-center space-x-2 hover:opacity-95 cursor-pointer active:scale-98 transition-all"
          >
            <Smartphone className="w-4 h-4 text-white" />
            <span>
              {language === 'bn' ? 'মোবাইল অ্যাপ ট্রাই করুন' : 'Launch Mobile App Emulator'}
            </span>
          </button>

          <a 
            href="#install-guide"
            className="px-6 py-3.5 rounded-xl glass-panel-light border border-white/5 text-slate-300 font-semibold text-xs flex items-center justify-center space-x-2 text-center hover:bg-white/10 active:scale-98 transition-all"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>{language === 'bn' ? 'ডাউনলোড গাইড (.APK)' : 'Download Application APK'}</span>
          </a>
        </div>

        {/* Live Counters Stats Display */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
          <div>
            <span className="text-lg lg:text-2xl font-black text-white font-mono block">১০,০০০+</span>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">{language === 'bn' ? 'সক্রিয় খেলোয়াড়' : 'Active Players'}</span>
          </div>
          <div>
            <span className="text-lg lg:text-2xl font-black text-cyan-400 font-mono block">৳২.৫M+</span>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">{language === 'bn' ? 'মোট পুরষ্কার বিতরণ' : 'Prizes Distributed'}</span>
          </div>
          <div>
            <span className="text-lg lg:text-2xl font-black text-emerald-400 font-mono block">১০০%</span>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">{language === 'bn' ? 'ইন্সট্যান্ট পেমেন্ট' : 'Payout Guarantee'}</span>
          </div>
        </div>
      </div>

      {/* Feature Block bottom - Bento Boxes */}
      <div id="install-guide" className="mt-12 pt-8 border-t border-white/5">
        <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-4">
          {language === 'bn' ? 'কেন সিলভার উলফ অ্যাপ ব্যবহার করবেন?' : 'PREMIUM APP ADVANTAGES'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <div className="glass-panel p-4 rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/40 flex items-center justify-center mb-3 text-cyan-400 border border-cyan-500/15">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5 leading-none">
              {language === 'bn' ? 'রিয়েল-টাইম স্লট বুকিং চিম' : 'Liquid-Glass Slot Chime'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
              {language === 'bn' ? (
                'যখনই আমাদের মডারেটর নতুন স্লট ড্রপ করবে সাথে সাথে প্রিমিয়াম নোটিফিকেশন অ্যালার্ম টোন ও কাউন্টডাউন সহ লাইভ স্লট এলার্ট ট্রিপ করে।'
              ) : (
                'Experience state of art WebAudio synthesizer chimes echoing instantly on slot drops. Keep drawing apps enabled for absolute booking edge.'
              )}
            </p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/40 flex items-center justify-center mb-3 text-emerald-400 border border-emerald-500/10">
              <Shield className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5 leading-none">
              {language === 'bn' ? 'ডবল-ভেরিফাইড পেমেন্ট ওয়ালেট' : 'Double-Verified Wallets'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
              {language === 'bn' ? (
                'বিকাশ এবং নগদ ইনস্ট্যান্ট ভেরিফিকেশন সিস্টেম। কোনো ম্যানুয়াল হ্যাসেল ছাড়াই আপনার ওয়ালেটে টাকা এড বা উইথড্র বাটন ব্যবহার সরাসরি ইন্টিগ্রেটেড।'
              ) : (
                'Fully encrypted deposits and administrative double-audit withdrawals for safe transactions starting with low threshold of 80 BDT.'
              )}
            </p>
          </div>
        </div>

        {/* Footer branding */}
        <p className="text-slate-600 text-[10px] mt-6 leading-relaxed font-mono font-medium">
          {language === 'bn' ? '© ২০২৬ সিলভার উলফ ই-স্পোর্টস। সর্বস্বত্ব সংরক্ষিত।' : '© 2026 SILVER WOLF ESPORTS CO. ALL RIGHTS RESERVED.'}
        </p>
      </div>

    </div>
  );
}

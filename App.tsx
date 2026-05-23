import React, { useState } from 'react';
import AppSimulator from './components/AppSimulator';

export default function App() {
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');

  return (
    <div className="w-full h-screen bg-[#070b19] overflow-hidden select-none relative">
      <AppSimulator 
        language={language}
        setLanguage={setLanguage}
      />
    </div>
  );
}

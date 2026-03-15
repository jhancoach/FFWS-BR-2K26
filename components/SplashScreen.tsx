
import React from 'react';
import { Flame } from 'lucide-react';
import { AppConfig } from '../types';
import { LOGO_URL } from '../constants';

interface SplashScreenProps {
  config?: AppConfig;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ config }) => {
  const title1 = config?.titlePart1 || "FFWSBR";
  const title2 = config?.titlePart2 || "2026";
  const sub = config?.subtitle || "Elite Competitiva";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#3b0764_0%,_#0a0a0a_100%)]"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#f97316] to-transparent opacity-50"></div>
      
      <div className="relative z-10 flex flex-col items-center animate-float">
        {/* Logo Oficial Principal centralizada */}
        <div className="relative mb-12">
            <div className="absolute -inset-16 bg-[#f97316] rounded-full opacity-10 blur-3xl animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-[#2d0a31]/40 to-[#000]/80 p-6 rounded-[50px] border border-[#f97316]/20 shadow-[0_0_80px_rgba(249,115,22,0.3)] flex items-center justify-center w-56 h-56 md:w-80 md:h-80 group">
                <img 
                    src={LOGO_URL} 
                    alt="Logo Oficial" 
                    className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(249,115,22,0.6)] group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute -bottom-4 -right-4 bg-gradient-to-tr from-[#f97316] to-[#facc15] rounded-full p-4 border-4 border-[#0a050a] shadow-[0_0_20px_rgba(249,115,22,0.5)]">
                    <Flame size={32} className="text-black" fill="black"/>
                </div>
            </div>
        </div>

        {/* Text */}
        <h1 className="text-6xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white via-[#facc15] to-[#f97316] tracking-tight font-display mb-2 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] uppercase">
          {title1} <span className="text-[#facc15]">{title2}</span>
        </h1>
        <div className="flex items-center gap-4">
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent to-[#f97316]"></div>
            <p className="text-[#f97316] tracking-[0.4em] text-sm md:text-xl font-extrabold uppercase drop-shadow-sm whitespace-nowrap">
            {sub}
            </p>
            <div className="h-[2px] w-24 bg-gradient-to-l from-transparent to-[#f97316]"></div>
        </div>
      </div>

      {/* Loading Bar */}
      <div className="relative z-10 mt-20 w-80 h-2 bg-gray-950 rounded-full overflow-hidden border border-white/10 p-0.5">
        <div className="h-full bg-gradient-to-r from-[#701a75] via-[#f97316] to-[#facc15] shadow-[0_0_20px_#f97316] rounded-full animate-loading-bar"></div>
      </div>
      
      <div className="mt-6 text-[11px] text-gray-500 font-mono tracking-widest uppercase opacity-80 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping"></span>
        Sincronizando Banco de Dados FFWSBR...
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 60%; transform: translateX(0%); }
          100% { width: 100%; transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 2.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;


import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Shield, Skull, RefreshCw, Menu, X, Printer, Download, Settings, Map } from 'lucide-react';
import { CSV_URLS, LOGO_URL } from '../constants';
import { AppConfig } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onRefresh: () => void;
  loading: boolean;
  lastUpdated: Date | null;
  config: AppConfig;
}

const Layout: React.FC<LayoutProps> = ({ children, onRefresh, loading, lastUpdated, config }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: 'Classificação', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Jogadores', path: '/players', icon: <Users size={20} /> },
    { name: 'Times', path: '/teams', icon: <Shield size={20} /> },
    { name: 'Killfeed', path: '/killfeed', icon: <Skull size={20} /> },
    { name: 'Estudos', path: '/estudos', icon: <Map size={20} /> },
  ];

  const handlePrint = () => { window.print(); };

  const handleExportCSV = () => {
      const link = document.createElement('a');
      link.href = CSV_URLS.fDetalhes;
      link.setAttribute('download', 'FFWSBR2026_Dados.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen text-gray-100 flex flex-col bg-transparent">
      {/* Navbar Temática */}
      <nav className="glass sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Logo Dinâmica Oficial */}
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.hash = '/'}>
              <div className="relative">
                 <div className="absolute inset-0 bg-[#f97316] rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                 <div className="relative bg-gradient-to-br from-[#2d0a31] to-black p-0.5 rounded-xl border border-[#f97316]/30 overflow-hidden w-16 h-16 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                    <img src={LOGO_URL} alt="FFWSBR 2026 Logo" className="w-full h-full object-contain scale-110" />
                 </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-black italic tracking-widest font-display leading-none text-white drop-shadow-md uppercase">
                  {config.titlePart1} <span className="text-[#facc15]">{config.titlePart2}</span>
                </h1>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse"></span>
                    <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">{config.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-2 bg-black/50 p-1.5 rounded-xl border border-white/5 backdrop-blur-sm">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 font-display uppercase tracking-wide ${
                      isActive
                        ? 'bg-gradient-to-r from-[#f97316] to-[#facc15] text-black shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-105'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <div className="hidden xl:flex flex-col items-end mr-2">
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Live Status</span>
                  <span className="text-xs text-[#facc15] font-mono font-bold">{lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}</span>
              </div>

              <div className="flex items-center bg-black/60 rounded-xl border border-white/10 p-1">
                  <button onClick={handlePrint} title="Imprimir" className="p-2.5 text-gray-400 hover:text-[#facc15] hover:bg-white/5 rounded-lg transition-colors"><Printer size={18} /></button>
                  <div className="w-px h-4 bg-white/10 mx-1"></div>
                  <button onClick={handleExportCSV} title="Exportar CSV" className="p-2.5 text-gray-400 hover:text-[#facc15] hover:bg-white/5 rounded-lg transition-colors"><Download size={18} /></button>
                  <div className="w-px h-4 bg-white/10 mx-1"></div>
                  <NavLink to="/admin" title="Configurações" className={({ isActive }) => `p-2.5 rounded-lg transition-colors ${isActive ? 'text-[#facc15] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Settings size={18} /></NavLink>
              </div>

              <button
                onClick={onRefresh}
                disabled={loading}
                className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#701a75] to-[#4b164c] hover:from-[#4b164c] hover:to-[#701a75] text-white rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(112,26,117,0.3)] border border-white/10 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline font-display uppercase tracking-wide">{loading ? '...' : 'Live'}</span>
              </button>

              <div className="md:hidden">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300 hover:text-white p-2">
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0a050a] border-b border-[#f97316]/20 animate-in slide-in-from-top-2">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 block px-4 py-3 rounded-lg text-base font-bold font-display uppercase ${
                      isActive
                        ? 'bg-[#f97316]/10 text-[#facc15] border border-[#f97316]/30'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {children}
      </main>
      
      <footer className="border-t border-white/5 py-6 mt-8 bg-black/40 no-print">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-xs font-mono flex flex-col items-center gap-2">
            <span>&copy; 2026 {config.titlePart1} {config.titlePart2} OFFICIAL DASHBOARD.</span>
            <div className="flex gap-2 text-[10px] text-gray-600 uppercase">
                <span className="text-[#f97316]">Domínio Total</span>
                <span>•</span>
                <span className="text-[#facc15]">Fogo Cruzado</span>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

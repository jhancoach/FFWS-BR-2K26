import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Database, AlertTriangle, Check, Type } from 'lucide-react';
import { CSV_URLS, DEFAULT_CONFIG } from '../constants';
import { getActiveUrls, getAppConfig } from '../services/dataService';

interface AdminProps {
  onRefresh: () => void;
}

const Admin: React.FC<AdminProps> = ({ onRefresh }) => {
  const [urls, setUrls] = useState<typeof CSV_URLS>(getActiveUrls());
  const [config, setConfig] = useState(getAppConfig());
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'facts' | 'dims'>('general');

  useEffect(() => {
    setUrls(getActiveUrls());
    setConfig(getAppConfig());
  }, []);

  const handleUrlChange = (key: keyof typeof CSV_URLS, value: string) => {
    setUrls(prev => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  const handleConfigChange = (key: keyof typeof DEFAULT_CONFIG, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('MUNDIAL_DASHBOARD_URLS', JSON.stringify(urls));
    localStorage.setItem('MUNDIAL_DASHBOARD_CONFIG', JSON.stringify(config));
    setIsSaved(true);
    onRefresh();
    setTimeout(() => setIsSaved(false), 3000);
    alert('Sistema reconfigurado com sucesso!');
  };

  const handleReset = () => {
    if (window.confirm('Deseja resetar para a configuração de fábrica?')) {
      localStorage.removeItem('MUNDIAL_DASHBOARD_URLS');
      localStorage.removeItem('MUNDIAL_DASHBOARD_CONFIG');
      setUrls(CSV_URLS);
      setConfig(DEFAULT_CONFIG);
      onRefresh();
    }
  };

  const factKeys = ['fDetalhes', 'fPlayersDados', 'fKillFeed', 'fPersonagens', 'fKilldia'];
  const dimKeys = Object.keys(CSV_URLS).filter(k => !factKeys.includes(k));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="bg-gradient-to-br from-[#2d0a31] to-black p-8 rounded-2xl border border-[#f97316]/20 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5 text-[#facc15]">
             <Database size={150} />
         </div>
         <div className="relative z-10">
            <h1 className="text-3xl font-black italic text-white flex items-center gap-3 uppercase">
                <Database className="text-[#facc15]" /> Centro de Comando
            </h1>
            <p className="text-gray-400 mt-2 text-sm max-w-lg">
                Gerencie as fontes de dados e a identidade do evento. Alterações são aplicadas instantaneamente no seu terminal.
            </p>
         </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-1">
          {['general', 'facts', 'dims'].map((t) => (
            <button 
               key={t}
               onClick={() => setActiveTab(t as any)}
               className={`px-6 py-3 text-sm font-bold uppercase tracking-wide rounded-t-lg transition-colors border-b-2 ${activeTab === t ? 'text-[#facc15] border-[#facc15] bg-white/5' : 'text-gray-500 border-transparent hover:text-white'}`}
            >
               {t === 'general' ? 'Geral' : t === 'facts' ? 'Fontes Base' : 'Dimensões'}
            </button>
          ))}
      </div>

      <div className="bg-[#1a051a]/60 backdrop-blur-md p-6 rounded-b-2xl rounded-tr-2xl border border-white/5 shadow-lg min-h-[400px]">
          {activeTab === 'general' && (
              <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Título Principal</label>
                          <input type="text" value={config.titlePart1} onChange={(e) => handleConfigChange('titlePart1', e.target.value)} className="w-full bg-black text-white p-3 rounded-lg border border-gray-800 focus:border-[#facc15] outline-none font-bold" />
                      </div>
                      <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Sufixo (Ano/Destaque)</label>
                          <input type="text" value={config.titlePart2} onChange={(e) => handleConfigChange('titlePart2', e.target.value)} className="w-full bg-black text-[#facc15] p-3 rounded-lg border border-gray-800 focus:border-[#facc15] outline-none font-bold" />
                      </div>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Subtítulo / Edição</label>
                      <input type="text" value={config.subtitle} onChange={(e) => handleConfigChange('subtitle', e.target.value)} className="w-full bg-black text-gray-300 p-3 rounded-lg border border-gray-800 focus:border-[#facc15] outline-none uppercase text-xs font-bold tracking-widest" />
                  </div>
              </div>
          )}

          {activeTab !== 'general' && (
              <div className="space-y-4">
                  {(activeTab === 'facts' ? factKeys : dimKeys).map(key => (
                      <div key={key} className="bg-black/40 p-4 rounded-xl border border-white/5">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{key}</label>
                          <input type="text" value={urls[key as keyof typeof CSV_URLS]} onChange={(e) => handleUrlChange(key as keyof typeof CSV_URLS, e.target.value)} className="w-full bg-black text-gray-400 p-2.5 rounded border border-gray-800 focus:border-[#f97316] outline-none text-xs font-mono" />
                      </div>
                  ))}
              </div>
          )}
      </div>

      <div className="sticky bottom-6 bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex justify-between items-center shadow-2xl z-50">
          <button onClick={handleReset} className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-red-500/70 hover:text-red-500 transition-colors flex items-center gap-2"><RotateCcw size={16}/> Reset Geral</button>
          <button onClick={handleSave} className="px-10 py-3 bg-gradient-to-r from-[#f97316] to-[#facc15] text-black rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-[#f97316]/20 hover:scale-105 transition-all flex items-center gap-2">
            <Save size={18}/> Salvar Configurações
          </button>
      </div>
    </div>
  );
};

export default Admin;
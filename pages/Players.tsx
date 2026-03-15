
import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardData, PlayerData, CharacterData } from '../types';
import { Trophy, Crown, User, Swords, Zap, BarChart2, Scale, Map as MapIcon, Skull, ChevronRight, Sparkles, X, Activity, Info, Crosshair, Shield, ArrowLeft, Disc, Flame, Target, AlertCircle, LayoutGrid, MapPin, Hash, Target as TargetIcon, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList, Cell, YAxis, CartesianGrid } from 'recharts';
import FilterBar from '../components/FilterBar';

interface PlayersProps {
  data: DashboardData;
}

const Players: React.FC<PlayersProps> = ({ data }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'ranking' | 'chars' | 'report' | 'auditoria'>('ranking');
  const [activeHabFilter, setActiveHabFilter] = useState<string>('All');
  
  const [filters, setFilters] = useState({
    team: [] as string[],
    players: [] as string[],
    weapon: [] as string[],
    safe: [] as string[],
    map: [] as string[],
    rodada: [] as string[],
    queda: [] as string[],
    confrontation: [] as string[]
  });

  useEffect(() => {
    if (location.state?.player) {
      setFilters(prev => ({ ...prev, players: [location.state.player] }));
      setActiveTab('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();
  const cleanKey = (s: string) => s.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();

  // Opções de filtro dinâmicas: Se selecionar RD, as opções de Q são apenas daquela RD
  const filterOptions = useMemo(() => {
    const teams = Array.from(new Set(data.players.map(p => p.TIME))).filter(Boolean).sort();
    
    const players = data.playersDimension.length > 0 
        ? data.playersDimension.map(d => d.Name).sort()
        : Array.from(new Set(data.players.map(p => p.PLAYER))).filter(Boolean).sort();
    
    // Filtramos os dados base para pegar as opções de queda baseadas na rodada selecionada
    const baseDataForDrops = data.players.filter(p => 
        filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(p.RD))
    );

    const maps = Array.from(new Set([...data.players.map(p => p.MAPA), ...data.killFeed.map(k => k.MAPA)])).filter(Boolean).sort();
    const rounds = Array.from(new Set([...data.players.map(p => p.RD), ...data.killFeed.map(k => k.RD)])).filter(Boolean).sort();
    const quedas = Array.from(new Set(baseDataForDrops.map(p => p.Q))).filter(Boolean).sort();
    const activeHabs = Array.from(new Set(data.characters.map(c => c.Hab1))).filter(Boolean).sort();

    return { teams, players, weapons: [], safes: [], maps, rounds, quedas, confrontations: [], activeHabs };
  }, [data.players, data.killFeed, data.characters, data.playersDimension, filters.rodada]);

  const charactersMap = useMemo(() => {
      const m = new Map<string, any>();
      data.characters.forEach(c => {
          if (!c.Player) return;
          const key = normalize(c.Player);
          const findDimImg = (dims: any[], name: string) => {
             if (!name) return undefined;
             const target = cleanKey(name);
             return dims.find(d => cleanKey(d.Name) === target)?.IMG;
          };
          if (!m.has(key)) {
              m.set(key, {
                  ...c,
                  hab1Img: findDimImg(data.hab1, c.Hab1),
                  hab2Img: findDimImg(data.hab2, c.Hab2),
                  hab3Img: findDimImg(data.hab3, c.Hab3),
                  hab4Img: findDimImg(data.hab4, c.Hab4),
                  petImg: findDimImg(data.pets, c.Pet),
                  itemImg: findDimImg(data.items, c.Item),
              });
          }
      });
      return m;
  }, [data.characters, data.hab1, data.hab2, data.hab3, data.hab4, data.pets, data.items]);

  // Ranking com Filtragem Estrita (RD AND Q)
  const rankingData = useMemo(() => {
    if (activeTab !== 'ranking' && activeTab !== 'auditoria') return [];

    const filtered = data.players.filter(p => {
        if (filters.team.length > 0 && !filters.team.includes(p.TIME)) return false;
        if (filters.players.length > 0 && !filters.players.some(fp => normalize(fp) === normalize(p.PLAYER))) return false;
        if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return false;
        
        // FILTRO ESTRITO: Se selecionar RD e Q, deve bater os dois simultaneamente no registro
        const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(p.RD));
        const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(p.Q));
        
        return matchRD && matchQ;
    });

    const statsMap = new Map<string, { kills: number; matches: number; team: string }>();
    filtered.forEach(p => {
        const kills = parseInt(p.Abates || '0');
        if (!statsMap.has(p.PLAYER)) {
            statsMap.set(p.PLAYER, { kills, matches: 1, team: p.TIME });
        } else {
            const s = statsMap.get(p.PLAYER)!;
            s.kills += kills;
            s.matches += 1;
        }
    });

    return Array.from(statsMap.entries()).map(([name, stat]) => ({
        name, team: stat.team, kills: stat.kills, matches: stat.matches,
        avg: stat.matches > 0 ? (stat.kills / stat.matches).toFixed(2) : '0.00',
        loadout: charactersMap.get(normalize(name))
    })).sort((a, b) => b.kills - a.kills);
  }, [data.players, filters, activeTab, charactersMap]);

  // Auditoria de Kills com a mesma Filtragem Estrita
  const auditData = useMemo(() => {
    if (activeTab !== 'auditoria') return [];

    const feedFiltered = data.killFeed.filter(k => {
        if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(k.MAPA))) return false;
        
        // FILTRO ESTRITO NO FEED: RD AND Q
        const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(k.RD));
        const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(k.Q));
        
        return matchRD && matchQ;
    });

    const feedKillsMap = new Map<string, number>();
    feedFiltered.forEach(k => {
        const p = normalize(k.PLAYER);
        feedKillsMap.set(p, (feedKillsMap.get(p) || 0) + 1);
    });

    return rankingData.map(p => {
        const factKills = p.kills;
        const feedKills = feedKillsMap.get(normalize(p.name)) || 0;
        const diff = factKills - feedKills;
        return {
            ...p,
            factKills,
            feedKills,
            diff,
            status: diff === 0 ? 'OK' : 'DISCREPÂNCIA'
        };
    }).sort((a,b) => Math.abs(b.diff) - Math.abs(a.diff) || b.factKills - a.factKills);
  }, [rankingData, data.killFeed, filters, activeTab]);

  const charactersData = useMemo(() => {
    return data.characters.filter(c => {
        if (!c.Player) return false;
        if (filters.team.length > 0 && !filters.team.includes(c.Time)) return false;
        if (filters.players.length > 0 && !filters.players.some(fp => normalize(fp) === normalize(c.Player))) return false;
        if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(c.Mapa))) return false;
        
        // FILTRO ESTRITO NOS LOADOUTS: RD AND Q
        const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(c.Rd));
        const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(c.Q));
        
        if (!(matchRD && matchQ)) return false;
        if (activeHabFilter !== 'All' && normalize(c.Hab1) !== normalize(activeHabFilter)) return false;
        return true;
    }).map(c => {
         const findDimImg = (dims: any[], name: string) => {
             if (!name) return undefined;
             const target = cleanKey(name);
             return dims.find(d => cleanKey(d.Name) === target)?.IMG;
         }
         return {
             ...c,
             hab1Img: findDimImg(data.hab1, c.Hab1),
             hab2Img: findDimImg(data.hab2, c.Hab2),
             hab3Img: findDimImg(data.hab3, c.Hab3),
             hab4Img: findDimImg(data.hab4, c.Hab4),
             petImg: findDimImg(data.pets, c.Pet),
             itemImg: findDimImg(data.items, c.Item),
             teamImg: data.teamsReference.find(t => normalize(t.TIME) === normalize(c.Time))?.IMG
         };
    });
  }, [data.characters, filters, data.hab1, data.hab2, data.hab3, data.hab4, data.pets, data.items, data.teamsReference, activeHabFilter]);

  const usageStats = useMemo(() => {
    if (activeHabFilter === 'All') return null;
    const total = data.characters.length || 1;
    const count = charactersData.length;
    const percent = ((count / total) * 100).toFixed(1);
    return { count, percent };
  }, [charactersData, data.characters, activeHabFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2 no-print">
        {[
            { id: 'ranking', label: 'Ranking Geral', icon: <Trophy size={18} /> },
            { id: 'chars', label: 'Loadouts', icon: <User size={18} /> },
            { id: 'auditoria', label: 'Auditoria Kills', icon: <Shield size={18} /> },
            { id: 'report', label: 'Perfil Individual', icon: <BarChart2 size={18} /> },
        ].map(tab => (
            <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold uppercase transition-all tracking-wider ${activeTab === tab.id ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                {tab.icon} {tab.label}
            </button>
        ))}
      </div>

      <FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />

      <div className="min-h-[600px]">
          {activeTab === 'ranking' && (
            <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-xl animate-in fade-in duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-[#0a0a0a] text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">#</th>
                                <th className="px-6 py-4">Jogador</th>
                                <th className="px-6 py-4">Equipe</th>
                                <th className="px-6 py-4 text-center">Ativa</th>
                                <th className="px-6 py-4 text-center text-red-500">Abates</th>
                                <th className="px-6 py-4 text-center text-yellow-500">Média</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-sm font-medium">
                            {rankingData.map((player, idx) => (
                                <tr key={idx} onClick={() => { setFilters(prev => ({...prev, players: [player.name]})); setActiveTab('report'); }} className="hover:bg-yellow-900/10 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4 text-gray-600 font-mono text-center">{idx + 1}</td>
                                    <td className="px-6 py-4 font-bold text-white uppercase italic flex items-center gap-2">
                                        {player.name}
                                        <ChevronRight size={14} className="text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 uppercase text-[10px] tracking-widest">{player.team}</td>
                                    <td className="px-6 py-4 text-center">
                                        {player.loadout?.hab1Img ? (
                                            <div className="flex justify-center items-center">
                                                <div className="w-8 h-8 rounded-lg bg-black border border-yellow-500/30 p-1 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                                                    <img src={player.loadout.hab1Img} className="w-full h-full object-contain" alt={player.loadout.Hab1} />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-700 font-black italic opacity-20">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center text-red-400 font-black text-lg">{player.kills}</td>
                                    <td className="px-6 py-4 text-center text-yellow-400 font-bold">{player.avg}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {activeTab === 'auditoria' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                  {/* Banner de Status do Filtro */}
                  {(filters.rodada.length > 0 || filters.queda.length > 0) && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <Info size={16} className="text-yellow-500" />
                              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                  Recorte: {filters.rodada.length > 0 ? filters.rodada.join(', ') : 'Todas Rodadas'} 
                                  {filters.queda.length > 0 ? ` • Queda ${filters.queda.join(', ')}` : ''}
                              </span>
                          </div>
                          <button onClick={() => setFilters(p => ({...p, rodada: [], queda: []}))} className="text-[9px] font-black text-yellow-500 uppercase hover:underline">Limpar Recorte</button>
                      </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-lg flex flex-col items-center">
                          <Skull className="text-gray-500 mb-2" size={20} />
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Kills em Fato</span>
                          <span className="text-3xl font-black text-white italic">{auditData.reduce((a,b) => a + b.factKills, 0)}</span>
                      </div>
                      <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-lg flex flex-col items-center">
                          <Activity className="text-yellow-500 mb-2" size={20} />
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Kills em Feed</span>
                          <span className="text-3xl font-black text-yellow-500 italic">{auditData.reduce((a,b) => a + b.feedKills, 0)}</span>
                      </div>
                      <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-lg flex flex-col items-center">
                          <AlertTriangle className="text-red-500 mb-2" size={20} />
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Divergência Total</span>
                          <span className="text-3xl font-black text-red-500 italic">{auditData.reduce((a,b) => a + Math.abs(b.diff), 0)}</span>
                      </div>
                  </div>

                  <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-[#0a0a0a] text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Jogador / Equipe</th>
                                    <th className="px-6 py-4 text-center">Fato (Consolidado)</th>
                                    <th className="px-6 py-4 text-center">Feed (Unitário)</th>
                                    <th className="px-6 py-4 text-center">Diferença</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 text-sm font-medium">
                                {auditData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-white uppercase italic">{row.name}</span>
                                                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{row.team}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-gray-300">{row.factKills}</td>
                                        <td className="px-6 py-4 text-center font-mono text-yellow-500/80">{row.feedKills}</td>
                                        <td className={`px-6 py-4 text-center font-black ${row.diff !== 0 ? 'text-red-500 scale-110' : 'text-gray-700 opacity-20'}`}>
                                            {row.diff > 0 ? `+${row.diff}` : row.diff === 0 ? '0' : row.diff}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {row.diff === 0 ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 text-[9px] font-black uppercase tracking-widest">
                                                    <CheckCircle2 size={12}/> OK
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 text-[9px] font-black uppercase tracking-widest">
                                                    <AlertCircle size={12}/> DISCREPÂNCIA
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                  </div>
              </div>
          )}

          {activeTab === 'chars' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                            <div className="text-yellow-500 font-black uppercase text-xs tracking-widest flex items-center gap-2"><Flame size={16} /> Habilidade Ativa:</div>
                            <select 
                                value={activeHabFilter} 
                                onChange={(e) => setActiveHabFilter(e.target.value)}
                                className="bg-black text-white p-2.5 rounded-xl border border-gray-800 text-xs font-bold uppercase outline-none focus:border-yellow-500 min-w-[200px] transition-colors"
                            >
                                <option value="All">Todas as Ativas</option>
                                {filterOptions.activeHabs.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-4 bg-black/60 px-6 py-3 rounded-2xl border border-white/5">
                            {usageStats ? (
                                <>
                                    <div className="flex flex-col items-center border-r border-white/10 pr-4">
                                        <span className="text-yellow-500 font-black text-xl leading-none">{usageStats.count}</span>
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Jogadores</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-white font-black text-xl leading-none italic">{usageStats.percent}%</span>
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Popularidade Meta</span>
                                    </div>
                                    <div className="ml-2">
                                        <Activity size={24} className="text-yellow-500 animate-pulse opacity-50" />
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-end">
                                    <span className="text-gray-500 text-[10px] font-mono uppercase tracking-widest">Meta de Jogo Geral</span>
                                    <span className="text-white font-black text-sm uppercase italic">Total: {data.characters.length} Loadouts</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {charactersData.length > 0 ? charactersData.map((char, idx) => (
                            <div key={idx} className="bg-[#0e0e11] rounded-2xl p-6 border border-gray-800/60 flex flex-col md:flex-row gap-8 items-center hover:border-yellow-500/20 transition-all shadow-2xl group">
                                <div className="w-full md:w-64 flex items-center gap-5 border-b md:border-b-0 md:border-r border-gray-800/60 pb-5 md:pb-0 pr-0 md:pr-8">
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#1a1a1a] to-black flex items-center justify-center overflow-hidden border-2 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)] p-1 flex-shrink-0 group-hover:scale-105 transition-transform">
                                        {char.teamImg ? <img src={char.teamImg} className="w-full h-full object-contain" alt={char.Time}/> : <div className="bg-gray-800 w-full h-full rounded-full flex items-center justify-center"><User className="text-gray-500" size={32}/></div>}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-black text-white text-2xl truncate uppercase italic leading-none tracking-tighter group-hover:text-yellow-500 transition-colors">{char.Player}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-sm text-yellow-500 font-black uppercase tracking-widest opacity-80">{char.Time}</span>
                                            <span className="text-[10px] text-gray-600 font-mono font-bold px-2 py-0.5 bg-white/5 rounded">Q{char.Q}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 w-full flex items-center gap-3 overflow-x-auto pb-4 md:pb-0 custom-scrollbar justify-between">
                                    <PremiumLoadoutCard title="ATIVA" name={char.Hab1} img={char.hab1Img} highlight />
                                    <PremiumLoadoutCard title="HAB 2" name={char.Hab2} img={char.hab2Img} />
                                    <PremiumLoadoutCard title="HAB 3" name={char.Hab3} img={char.hab3Img} />
                                    <PremiumLoadoutCard title="HAB 4" name={char.Hab4} img={char.hab4Img} />
                                    <PremiumLoadoutCard title="PET" name={char.Pet} img={char.petImg} />
                                    <PremiumLoadoutCard title="ITEM" name={char.Item} img={char.itemImg} />
                                </div>
                            </div>
                        )) : (
                            <div className="py-24 text-center text-gray-700 font-black italic uppercase tracking-widest border border-dashed border-gray-800 rounded-3xl">
                                {data.characters.length === 0 ? "Buscando dados em fPersonagens..." : "Nenhum Loadout filtrado para esta seleção."}
                            </div>
                        )}
                    </div>
              </div>
          )}

          {activeTab === 'report' && (
              <div className="animate-in fade-in duration-300">
                  {filters.players.length === 1 ? (
                      <div className="space-y-4">
                           <button onClick={() => { setFilters(prev => ({...prev, players: []})); setActiveTab('ranking'); }} className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1 font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg border border-white/5 transition-colors">
                               <ArrowLeft size={14}/> Voltar para Ranking
                           </button>
                           <PlayerProfile data={data} playerName={filters.players[0]} filters={filters} characters={data.characters} />
                      </div>
                  ) : (
                      <div className="bg-[#1a1a1a] rounded-2xl p-24 text-center border border-gray-800 shadow-inner">
                          <User size={64} className="mx-auto text-gray-800 mb-6" />
                          <h3 className="text-2xl font-black text-gray-400 uppercase italic tracking-tighter">Selecione UM jogador no Ranking para ver o Perfil</h3>
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};

const PremiumLoadoutCard = ({ title, name, img, highlight }: any) => (
  <div className={`flex flex-col items-center flex-shrink-0 group w-[110px]`}>
    <div className={`w-full flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 ${highlight ? 'bg-yellow-500/5 border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.15)] scale-[1.05] z-10' : 'bg-[#121215] border-gray-800/60 hover:border-gray-600'}`}>
        <span className={`text-[9px] font-black uppercase mb-4 tracking-[0.2em] ${highlight ? 'text-yellow-500/60' : 'text-gray-500'}`}>
            {title}
        </span>
        <div className={`w-14 h-14 rounded-2xl bg-black/60 border border-gray-800/80 flex items-center justify-center p-1.5 shadow-inner mb-4 overflow-hidden group-hover:scale-110 transition-transform`}>
            {img ? <img src={img} alt={name} className="w-full h-full object-contain" /> : <Zap size={16} className="text-gray-600 opacity-20" />}
        </div>
        <div className="w-full text-center overflow-hidden">
            <span className={`text-[10px] font-black uppercase italic truncate block tracking-tighter ${highlight ? 'text-yellow-500 underline underline-offset-4 decoration-yellow-500/30' : 'text-gray-300'}`}>
                {name || '-'}
            </span>
        </div>
    </div>
  </div>
);

const PlayerProfile = ({ data, playerName, filters, characters }: any) => {
    const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();
    const cleanKey = (s: string) => s.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();

    const stats = useMemo(() => {
        const records = data.players.filter((p: PlayerData) => {
            if (normalize(p.PLAYER) !== normalize(playerName)) return false;
            if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(p.RD))) return false;
            if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return false;
            if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(p.Q))) return false;
            return true;
        });

        const mapKillsMap: Record<string, number> = {};
        records.forEach(r => {
            const m = r.MAPA || 'DESCONHECIDO';
            mapKillsMap[m] = (mapKillsMap[m] || 0) + (parseInt(r.Abates) || 0);
        });
        const mapKills = Object.entries(mapKillsMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);

        const roundKillsMap: Record<string, number> = {};
        records.forEach(r => {
            const rd = r.RD || 'N/A';
            roundKillsMap[rd] = (roundKillsMap[rd] || 0) + (parseInt(r.Abates) || 0);
        });
        const roundKills = Object.entries(roundKillsMap).map(([name, count]) => ({ name, count })).sort((a,b) => {
            const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        const dropKillsMap: Record<string, number> = {};
        records.forEach(r => {
            const q = r.Q || 'N/A';
            dropKillsMap[q] = (dropKillsMap[q] || 0) + (parseInt(r.Abates) || 0);
        });
        const dropKills = Object.entries(dropKillsMap).map(([name, count]) => ({ name, count })).sort((a,b) => {
            const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        const playerSafeKillsMap: Record<string, number> = {};
        data.killFeed.filter((k: any) => normalize(k.PLAYER) === normalize(playerName)).forEach((k: any) => {
             const safe = k.SAFE || 'OUT';
             playerSafeKillsMap[safe] = (playerSafeKillsMap[safe] || 0) + 1;
        });
        const safeKills = Object.entries(playerSafeKillsMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);

        const totalKills = records.reduce((acc: number, r: PlayerData) => acc + (parseInt(r.Abates) || 0), 0);
        const totalMatches = records.length; 
        const team = records[0]?.TIME || data.players.find(p => normalize(p.PLAYER) === normalize(playerName))?.TIME || 'N/A';
        const teamImg = data.teamsReference.find(t => normalize(t.TIME) === normalize(team))?.IMG;

        const findDimImg = (dims: any[], name: string) => {
            if (!name) return undefined;
            const target = cleanKey(name);
            return dims.find(d => cleanKey(d.Name) === target)?.IMG;
        }

        const rawLoadout = characters.find((l: any) => normalize(l.Player) === normalize(playerName));
        const currentLoadout = rawLoadout ? {
            ...rawLoadout,
            hab1Img: findDimImg(data.hab1, rawLoadout.Hab1),
            hab2Img: findDimImg(data.hab2, rawLoadout.Hab2),
            hab3Img: findDimImg(data.hab3, rawLoadout.Hab3),
            hab4Img: findDimImg(data.hab4, rawLoadout.Hab4),
            petImg: findDimImg(data.pets, rawLoadout.Pet),
            itemImg: findDimImg(data.items, rawLoadout.Item),
        } : null;

        return { team, teamImg, kills: totalKills, matches: totalMatches, avg: totalMatches > 0 ? (totalKills / totalMatches).toFixed(2) : '0.00', loadout: currentLoadout, safeKills, mapKills, roundKills, dropKills };
    }, [data, playerName, filters, characters]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-br from-[#1a1a1a] to-black p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                     <User size={200} className="text-yellow-500" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-24 h-24 rounded-full bg-black border-4 border-yellow-500/50 flex items-center justify-center overflow-hidden p-1 shadow-lg">
                        {stats.teamImg ? <img src={stats.teamImg} className="w-full h-full object-contain" alt={stats.team}/> : <User className="text-gray-500" size={40} />}
                    </div>
                    <div>
                        <h2 className="text-4xl font-black italic text-white uppercase leading-none tracking-tighter">{playerName}</h2>
                        <div className="flex items-center gap-2 mt-2">
                             <Shield size={14} className="text-yellow-500" />
                             <span className="text-yellow-500 font-black uppercase tracking-[0.2em] text-xs block">{stats.team}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-4 relative z-10">
                    <MetricCard label="Abates" value={stats.kills} color="text-red-500" />
                    <MetricCard label="Salas" value={stats.matches} color="text-blue-400" />
                    <MetricCard label="Média" value={stats.avg} color="text-yellow-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0e0e11] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col">
                    <h3 className="text-[11px] font-black text-white uppercase mb-6 flex items-center gap-3 tracking-widest"><MapIcon size={16} className="text-yellow-500" /> PERFORMANCE POR MAPA</h3>
                    <div className="space-y-4 flex-1">
                         {stats.mapKills.length > 0 ? stats.mapKills.map((map, i) => (
                             <div key={i} className="space-y-2">
                                 <div className="flex justify-between items-end">
                                     <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{map.name}</span>
                                     <span className="text-xs font-black text-white italic">{map.count} KILLS</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                     <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full" style={{ width: `${(map.count / (stats.kills || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                         )) : (
                             <div className="flex-1 flex items-center justify-center text-gray-700 font-black italic uppercase text-[10px]">Sem dados de mapas</div>
                         )}
                    </div>
                </div>

                <div className="bg-[#0e0e11] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col">
                    <h3 className="text-[11px] font-black text-white uppercase mb-6 flex items-center gap-3 tracking-widest"><Hash size={16} className="text-blue-400" /> ABATES POR RODADA</h3>
                    <div className="space-y-4 flex-1">
                         {stats.roundKills.length > 0 ? stats.roundKills.map((rd, i) => (
                             <div key={i} className="space-y-2">
                                 <div className="flex justify-between items-end">
                                     <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{rd.name}</span>
                                     <span className="text-xs font-black text-white italic">{rd.count} KILLS</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                     <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{ width: `${(rd.count / (stats.kills || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                         )) : (
                             <div className="flex-1 flex items-center justify-center text-gray-700 font-black italic uppercase text-[10px]">Sem registros de rodada</div>
                         )}
                    </div>
                </div>

                <div className="bg-[#0e0e11] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col">
                    <h3 className="text-[11px] font-black text-white uppercase mb-6 flex items-center gap-3 tracking-widest"><TargetIcon size={16} className="text-yellow-400" /> ABATES POR QUEDA (Q)</h3>
                    <div className="space-y-4 flex-1">
                         {stats.dropKills.length > 0 ? stats.dropKills.map((q, i) => (
                             <div key={i} className="space-y-2">
                                 <div className="flex justify-between items-end">
                                     <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">PARTIDA {q.name}</span>
                                     <span className="text-xs font-black text-yellow-400 italic">{q.count} KILLS</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                     <div className="h-full bg-gradient-to-r from-yellow-700 to-yellow-500 rounded-full" style={{ width: `${(q.count / (stats.kills || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                         )) : (
                             <div className="flex-1 flex items-center justify-center text-gray-700 font-black italic uppercase text-[10px]">Sem registros de quedas</div>
                         )}
                    </div>
                </div>

                <div className="bg-[#0e0e11] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col">
                    <h3 className="text-[11px] font-black text-white uppercase mb-6 flex items-center gap-3 tracking-widest"><Disc size={16} className="text-red-500" /> ABATES POR SAFE</h3>
                    <div className="space-y-4 flex-1">
                         {stats.safeKills.length > 0 ? stats.safeKills.map((safe, i) => (
                             <div key={i} className="space-y-2">
                                 <div className="flex justify-between items-end">
                                     <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">SAFE {safe.name}</span>
                                     <span className="text-xs font-black text-red-500 italic">{safe.count} KILLS</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                     <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{ width: `${(safe.count / (stats.safeKills.reduce((a,b) => a + b.count, 0) || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                         )) : (
                             <div className="flex-1 flex items-center justify-center text-gray-700 font-black italic uppercase text-[10px]">Sem registros no KillFeed</div>
                         )}
                    </div>
                </div>
            </div>

            {/* Loadout Competitivo */}
            {stats.loadout && (
                <div className="bg-[#0e0e11] p-8 rounded-3xl border border-gray-800 shadow-xl">
                    <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                        <h3 className="text-sm font-black text-white uppercase flex items-center gap-3 tracking-widest"><Zap size={18} className="text-yellow-500" /> CONFIGURAÇÃO ATUAL</h3>
                        <span className="text-[10px] text-gray-500 font-mono italic">ÚLTIMA QUEDA: Q{stats.loadout.Q}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-between">
                         <PremiumLoadoutCard title="ATIVA" name={stats.loadout.Hab1} img={stats.loadout.hab1Img} highlight />
                         <PremiumLoadoutCard title="HAB 2" name={stats.loadout.Hab2} img={stats.loadout.hab2Img} />
                         <PremiumLoadoutCard title="HAB 3" name={stats.loadout.Hab3} img={stats.loadout.hab3Img} />
                         <PremiumLoadoutCard title="HAB 4" name={stats.loadout.Hab4} img={stats.loadout.hab4Img} />
                         <PremiumLoadoutCard title="PET" name={stats.loadout.Pet} img={stats.loadout.petImg} />
                         <PremiumLoadoutCard title="ITEM" name={stats.loadout.Item} img={stats.loadout.itemImg} />
                    </div>
                </div>
            )}
        </div>
    );
};

const MetricCard = ({ label, value, color }: any) => (
    <div className="text-center px-6 py-4 rounded-2xl bg-black/60 border border-white/5 shadow-inner min-w-[110px] flex flex-col justify-center">
        <span className={`block text-3xl font-black ${color} italic leading-none`}>{value}</span>
        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-2">{label}</span>
    </div>
);

export default Players;

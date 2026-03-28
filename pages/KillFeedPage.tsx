
import React, { useState, useMemo } from 'react';
import { DashboardData } from '../types';
import { Crosshair, ShieldAlert, Swords, Disc, List, User, FilterX, Shield, History, Clock, MapPin, Target, Skull } from 'lucide-react';
import FilterBar from '../components/FilterBar';

interface KillFeedPageProps {
  data: DashboardData;
}

const KillFeedPage: React.FC<KillFeedPageProps> = ({ data }) => {
  const [tab, setTab] = useState<'kills' | 'deaths'>('kills');
  
  const [filters, setFilters] = useState({
    team: [] as string[], 
    players: [] as string[], 
    weapon: [] as string[], 
    safe: [] as string[], 
    map: [] as string[], 
    rodada: [] as string[], 
    queda: [] as string[],
    confrontation: [] as string[],
    grupo: [] as string[]
  });

  const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

  // Mapeamento de Jogador para Time
  const playerToTeamMap = useMemo(() => {
    const map = new Map<string, string>();
    data.players.forEach(p => {
      if (p.PLAYER && p.TIME) map.set(normalize(p.PLAYER), p.TIME);
    });
    return map;
  }, [data.players]);

  const filterOptions = useMemo(() => ({
    teams: Array.from(new Set(data.players.map(p => p.TIME))).filter(Boolean).sort(),
    players: Array.from(new Set([...data.killFeed.map(k => k.PLAYER), ...data.killFeed.map(k => k.VITIMA)])).filter(Boolean).sort(),
    weapons: Array.from(new Set(data.killFeed.map(k => k.ARMA))).filter(Boolean).sort(),
    safes: Array.from(new Set(data.killFeed.map(k => k.SAFE))).filter(Boolean).sort(),
    maps: Array.from(new Set(data.killFeed.map(k => k.MAPA))).filter(Boolean).sort(),
    rounds: Array.from(new Set(data.killFeed.map(k => k.RD))).filter(Boolean).sort(),
    confrontations: Array.from(new Set(data.killFeed.map(k => k.CONFRONTO))).filter(Boolean).sort(),
    quedas: Array.from(new Set(data.killFeed.map(k => k.Q))).filter(Boolean).sort(),
    grupos: Array.from(new Set(data.teamsReference.map(t => t.GRUPO))).filter(Boolean).sort() as string[],
  }), [data.killFeed, data.players, data.teamsReference]);

  const handleToggleFilter = (key: keyof typeof filters, value: string) => {
      setFilters(prev => {
          const current = prev[key] as string[];
          const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
          return { ...prev, [key]: next };
      });
  };

  const filteredFeed = useMemo(() => {
    const teamGroupMap = new Map<string, string>();
    data.teamsReference.forEach(t => {
        if (t.TIME && t.GRUPO) teamGroupMap.set(normalize(t.TIME), normalize(t.GRUPO));
    });

    return data.killFeed.filter(k => {
      if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(k.MAPA))) return false;
      
      const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(k.RD));
      const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(k.Q));
      if (!(matchRD && matchQ)) return false;

      if (filters.confrontation.length > 0 && !filters.confrontation.includes(k.CONFRONTO)) return false;
      if (filters.weapon.length > 0 && !filters.weapon.includes(k.ARMA)) return false;
      if (filters.safe.length > 0 && !filters.safe.includes(k.SAFE)) return false;

      // Filtro de Grupo
      if (filters.grupo.length > 0) {
          const kTeam = playerToTeamMap.get(normalize(k.PLAYER));
          const vTeam = playerToTeamMap.get(normalize(k.VITIMA));
          
          if (tab === 'kills') {
              const kGroup = kTeam ? teamGroupMap.get(normalize(kTeam)) : null;
              if (!kGroup || !filters.grupo.some(g => normalize(g) === kGroup)) return false;
          } else {
              const vGroup = vTeam ? teamGroupMap.get(normalize(vTeam)) : null;
              if (!vGroup || !filters.grupo.some(g => normalize(g) === vGroup)) return false;
          }
      }

      // Lógica de filtragem direcionada por Aba
      if (filters.team.length > 0) {
        const kTeam = playerToTeamMap.get(normalize(k.PLAYER));
        const vTeam = playerToTeamMap.get(normalize(k.VITIMA));
        
        // Se estamos na aba de Letais, o filtro de equipe foca em quem MATOU para ver quem ela matou na lista lateral
        if (tab === 'kills') {
            if (!kTeam || !filters.team.includes(kTeam)) return false;
        } else {
            // Se estamos na aba de Vítimas, o filtro foca em quem MORREU para ver quem a matou na lista lateral
            if (!vTeam || !filters.team.includes(vTeam)) return false;
        }
      }

      if (filters.players.length > 0) {
          if (tab === 'kills') {
              if (!filters.players.some(p => normalize(p) === normalize(k.PLAYER))) return false;
          } else {
              if (!filters.players.some(p => normalize(p) === normalize(k.VITIMA))) return false;
          }
      }
      return true;
    });
  }, [data.killFeed, filters, playerToTeamMap, tab]);

  const stats = useMemo(() => {
    const weaponCounts: Record<string, number> = {};
    const safeCounts: Record<string, number> = {};
    const playerCounts: Record<string, number> = {}; 
    const killerTeamCounts: Record<string, number> = {};
    const victimTeamCounts: Record<string, number> = {};

    filteredFeed.forEach(row => {
        if (row.ARMA && row.ARMA.trim() !== '') {
            weaponCounts[row.ARMA] = (weaponCounts[row.ARMA] || 0) + 1;
        }
        if (row.SAFE && row.SAFE.trim() !== '') {
            safeCounts[row.SAFE] = (safeCounts[row.SAFE] || 0) + 1;
        }
        
        // Jogadores principais por aba
        const pName = tab === 'kills' ? row.PLAYER : row.VITIMA;
        if (pName && pName.trim() !== '') {
            playerCounts[pName] = (playerCounts[pName] || 0) + 1;
        }

        // Equipes (Sempre calculamos ambas para alimentar as listas laterais)
        const kTeam = playerToTeamMap.get(normalize(row.PLAYER));
        if (kTeam) killerTeamCounts[kTeam] = (killerTeamCounts[kTeam] || 0) + 1;

        const vTeam = playerToTeamMap.get(normalize(row.VITIMA));
        if (vTeam) victimTeamCounts[vTeam] = (victimTeamCounts[vTeam] || 0) + 1;
    });

    return { weaponCounts, safeCounts, playerCounts, killerTeamCounts, victimTeamCounts };
  }, [filteredFeed, tab, playerToTeamMap]);

  const getWeaponImg = (name: string) => {
      if (!name) return undefined;
      const w = data.weapons.find(w => w.Arma.trim().toLowerCase() === name.trim().toLowerCase());
      return w?.IMG;
  };

  const getSafeImg = (name: string) => {
      if (!name) return undefined;
      const s = data.safes.find(s => s.Safe.trim().toLowerCase() === name.trim().toLowerCase());
      return s?.IMG;
  };

  const getTeamImg = (name: string) => {
    if (!name) return undefined;
    return data.teamsReference.find(t => normalize(t.TIME) === normalize(name))?.IMG;
  };

  const getPlayerImg = (name: string, isVictim: boolean = false) => {
      if (!name) return undefined;
      const cleanName = normalize(name);
      if (isVictim) {
          return data.victimsDimension.find(p => normalize(p.Name) === cleanName)?.IMG;
      } else {
          return data.playersDimension.find(p => normalize(p.Name) === cleanName)?.IMG;
      }
  };

  const weaponList = Object.entries(stats.weaponCounts).map(([name, count]) => ({name, count: count as number}));
  const safeList = Object.entries(stats.safeCounts).map(([name, count]) => ({name, count: count as number}));
  const playerList = Object.entries(stats.playerCounts).map(([name, count]) => ({name, count: count as number}));
  const killerTeamList = Object.entries(stats.killerTeamCounts).map(([name, count]) => ({name, count: count as number}));
  const victimTeamList = Object.entries(stats.victimTeamCounts).map(([name, count]) => ({name, count: count as number}));
  const totalEvents = filteredFeed.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-black italic text-white flex items-center gap-2 uppercase tracking-wide">
                {tab === 'kills' ? <Crosshair className="text-green-500" size={28}/> : <ShieldAlert className="text-red-600" size={28}/>}
                {tab === 'kills' ? 'MUNDIAL 2025 • Central de Abates' : 'MUNDIAL 2025 • Análise de Baixas'}
            </h2>
            <div className="flex bg-black p-1.5 rounded-xl border border-gray-800 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <button 
                    onClick={() => { setTab('kills'); setFilters(prev => ({...prev, players: [], team: []})); }}
                    className={`px-6 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 uppercase tracking-widest ${tab === 'kills' ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'text-gray-500 hover:text-white hover:bg-gray-900'}`}
                >
                    <Crosshair size={14} /> LETAIS
                </button>
                <button 
                    onClick={() => { setTab('deaths'); setFilters(prev => ({...prev, players: [], team: []})); }}
                    className={`px-6 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 uppercase tracking-widest ${tab === 'deaths' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-gray-500 hover:text-white hover:bg-gray-900'}`}
                >
                    <ShieldAlert size={14} /> VÍTIMAS
                </button>
            </div>
        </div>
        
        <FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <StatGrid 
                title={tab === 'kills' ? "Arsenal Fatal" : "Armas Eliminadoras"} 
                items={weaponList} 
                getImage={getWeaponImg} 
                icon={<Swords size={16}/>} 
                color="text-orange-500" 
                onSelect={(val) => handleToggleFilter('weapon', val)} 
                activeValues={filters.weapon} 
            />
            
            <StatGrid 
                title="Confrontos por Safe" 
                items={safeList} 
                getImage={getSafeImg} 
                icon={<Disc size={16}/>} 
                color="text-blue-500" 
                onSelect={(val) => handleToggleFilter('safe', val)} 
                activeValues={filters.safe} 
            />

            {/* LISTA 3: Clicável para filtrar a lateral */}
            <RenderList 
                title={tab === 'kills' ? "Mais Letais (Abates)" : "Mais Vulneráveis (Mortes)"} 
                items={tab === 'kills' ? killerTeamList : victimTeamList} 
                icon={<Shield size={16} className="text-yellow-500"/>} 
                totalCount={totalEvents} 
                getImage={getTeamImg}
                isTeam
                onSelect={(name) => handleToggleFilter('team', name)}
                activeValues={filters.team}
            />

            {/* LISTA 4 (RESULTADO): Não clicável, reflete o filtro da Lista 3 */}
            <RenderList 
                title={tab === 'kills' ? "Equipes que mais Morrem" : "Equipes que mais Abatem"} 
                items={tab === 'kills' ? victimTeamList : killerTeamList} 
                icon={<Skull size={16} className={tab === 'kills' ? "text-red-500" : "text-green-500"}/>} 
                totalCount={totalEvents} 
                getImage={getTeamImg}
                isTeam
                isVictimList
                /* onSelect omitido para manter não clicável */
            />

            {/* LISTA 5: Clicável para filtrar a lateral */}
            <RenderList 
                title={tab === 'kills' ? "Top Atiradores" : "Perfil de Baixas"} 
                items={playerList} 
                icon={<User size={16} className="text-yellow-500"/>} 
                totalCount={totalEvents} 
                getImage={(name: string) => getPlayerImg(name, tab === 'deaths')}
                isPlayer
                onSelect={(name: string) => handleToggleFilter('players', name)}
                activeValues={filters.players}
            />
        </div>

        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-black/60 p-6 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-lg font-black italic text-white flex items-center gap-3 uppercase tracking-tighter">
                    <History className="text-yellow-500" size={20} />
                    Live Kill Log - {tab === 'kills' ? 'ABATES' : 'MORTES'}
                </h3>
                <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{totalEvents} Eventos Filtrados</span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#050505] text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em]">
                        <tr>
                            <th className="px-6 py-4">Confronto</th>
                            <th className="px-6 py-4">Arma Utilizada</th>
                            <th className="px-6 py-4">Zona / Safe</th>
                            <th className="px-6 py-4">Ambiente / Rodada</th>
                            <th className="px-6 py-4 text-center">Tag</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                        {filteredFeed.length > 0 ? filteredFeed.map((k, i) => {
                            const killerTeam = playerToTeamMap.get(normalize(k.PLAYER));
                            const victimTeam = playerToTeamMap.get(normalize(k.VITIMA));
                            const isKillerSelected = killerTeam && filters.team.includes(killerTeam);
                            const isVictimSelected = victimTeam && filters.team.includes(victimTeam);

                            return (
                                <tr key={i} className={`hover:bg-white/5 transition-colors group ${isKillerSelected || isVictimSelected ? 'bg-yellow-500/5' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-black italic uppercase ${isKillerSelected ? 'text-yellow-500 underline' : tab === 'kills' ? 'text-green-500' : 'text-gray-400'}`}>
                                                        {k.PLAYER}
                                                    </span>
                                                    <Swords size={12} className="text-gray-700" />
                                                    <span className={`text-sm font-black italic uppercase ${isVictimSelected ? 'text-yellow-500 underline' : tab === 'deaths' ? 'text-red-500' : 'text-gray-400'}`}>
                                                        {k.VITIMA}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isKillerSelected ? 'text-yellow-500/80' : 'text-gray-600'}`}>
                                                        {killerTeam || 'N/A'}
                                                    </span>
                                                    <span className="text-gray-800">•</span>
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isVictimSelected ? 'text-yellow-500/80' : 'text-gray-600'}`}>
                                                        {victimTeam || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-black rounded border border-gray-800 p-1 flex items-center justify-center shadow-inner">
                                                {getWeaponImg(k.ARMA) ? <img src={getWeaponImg(k.ARMA)} alt={k.ARMA} className="w-full h-full object-contain" /> : <Swords size={14} className="opacity-20 text-gray-400" />}
                                            </div>
                                            <span className="text-[11px] font-black text-white uppercase italic tracking-tighter">{k.ARMA}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Disc size={14} className="text-blue-500 opacity-50" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Safe {k.SAFE}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={12} className="text-yellow-500 opacity-50" />
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-tight">{k.MAPA}</span>
                                            </div>
                                            <span className="text-[9px] text-gray-600 font-bold mt-1">Rd {k.RD} • Q{k.Q}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/5 text-[9px] font-mono text-gray-500 group-hover:text-yellow-500 transition-colors">
                                            <Target size={10} /> {k.CONFRONTO}
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={5} className="py-20 text-center text-gray-700 font-black italic uppercase tracking-widest opacity-20">
                                    Nenhum log disponível para os filtros atuais
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

const RenderList = ({ title, items, icon, totalCount, getImage, isTeam, isPlayer, onSelect, activeValues = [], isVictimList }: any) => (
    <div className={`bg-[#1a1a1a] rounded-xl border ${isVictimList ? 'border-red-500/20' : 'border-gray-800'} overflow-hidden flex flex-col h-full shadow-lg transition-all ${onSelect ? 'hover:border-yellow-600/30' : ''}`}>
        <div className="p-4 border-b border-gray-800 bg-black/80">
            <h3 className={`font-black uppercase text-[11px] tracking-widest flex items-center gap-2 ${isVictimList ? 'text-red-500' : 'text-white'}`}>
                {icon}{title}
            </h3>
        </div>
        <div className="overflow-y-auto max-h-[400px] p-2 space-y-1 custom-scrollbar bg-black/20">
            {items.sort((a:any,b:any) => b.count - a.count).map((item:any, i:number) => {
                const percent = totalCount ? ((item.count / totalCount) * 100).toFixed(1) : "0.0";
                const img = getImage && getImage(item.name);
                const isActive = activeValues.includes(item.name);
                
                return (
                <div 
                    key={i} 
                    onClick={() => onSelect && onSelect(item.name)}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all border ${onSelect ? 'cursor-pointer hover:bg-white/5 hover:border-gray-800' : 'cursor-default border-transparent'} group ${isActive ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] scale-[1.02]' : ''}`}
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`text-[10px] font-mono font-bold w-4 ${isActive ? 'text-yellow-500' : 'text-gray-600'}`}>#{i+1}</span>
                        {(isTeam || isPlayer) && (
                            <div className={`w-8 h-8 rounded border p-1 flex items-center justify-center shrink-0 transition-colors bg-black ${isActive ? 'border-yellow-500' : 'border-gray-800'}`}>
                                {img ? <img src={img} className="w-full h-full object-contain" alt={item.name}/> : isTeam ? <Shield size={12} className="opacity-20" /> : <User size={12} className="opacity-20" />}
                            </div>
                        )}
                        <div className="flex-1 min-w-0 pr-2">
                            <span className={`text-[11px] font-black truncate block group-hover:text-white uppercase italic leading-none ${isActive ? 'text-yellow-400' : isVictimList ? 'text-red-400' : 'text-gray-300'}`}>
                                {item.name}
                            </span>
                            <div className="w-full bg-gray-950 h-1 mt-2 rounded-full overflow-hidden border border-white/5">
                                <div className={`h-full rounded-full transition-all duration-700 ${isVictimList ? 'bg-red-600/40' : isActive ? 'bg-yellow-400' : 'bg-yellow-600/40'}`} style={{ width: `${percent}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end pl-2">
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded shadow-sm transition-all ${isVictimList ? 'bg-red-900/40 text-red-500 border border-red-500/30' : isActive ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400 group-hover:bg-yellow-500 group-hover:text-black'}`}>
                            {item.count}
                        </span>
                    </div>
                </div>
            )})}
            {items.length === 0 && <div className="p-8 text-center text-gray-800 font-black italic uppercase text-[9px]">Sem dados</div>}
        </div>
    </div>
);

const StatGrid = ({ title, items, getImage, icon, color, onSelect, activeValues }: any) => (
    <div className={`bg-[#1a1a1a] rounded-xl border ${activeValues.length > 0 ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'border-gray-800'} flex flex-col h-full shadow-lg overflow-hidden transition-all duration-300`}>
       <div className="p-4 border-b border-gray-800 bg-black/80 flex justify-between items-center">
            <h3 className={`font-black uppercase text-[11px] tracking-widest flex items-center gap-2 ${color}`}>{icon} {title}</h3>
       </div>
       <div className="p-4 overflow-y-auto max-h-[400px] custom-scrollbar bg-black/10">
            <div className="grid grid-cols-2 gap-3">
                {items.sort((a:any,b:any) => b.count - a.count).map((item:any, i:number) => (
                    <div key={i} onClick={() => onSelect && onSelect(item.name)} className={`rounded-xl border p-3 flex flex-col items-center relative group cursor-pointer transition-all shadow-md ${activeValues.includes(item.name) ? 'bg-yellow-900/20 border-yellow-500 scale-[1.05] z-10' : 'bg-[#0f0f0f] border-gray-800 hover:border-yellow-500/50 hover:bg-[#252525]'}`}>
                        <div className="absolute top-2 left-2 text-[9px] font-mono text-gray-600 font-bold">#{i+1}</div>
                        <div className="absolute top-2 right-2 font-bold text-white text-[9px] bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800 shadow-inner">{item.count}</div>
                        <div className="h-10 w-full flex items-center justify-center my-2 mt-4">
                            {getImage && getImage(item.name) ? (
                                <img src={getImage(item.name)} className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-500" alt={item.name}/>
                            ) : (
                                <Swords size={18} className="text-gray-800 opacity-20" />
                            )}
                        </div>
                        <div className={`text-[9px] font-black text-center truncate w-full mt-2 px-1 rounded py-1 border uppercase italic tracking-tighter transition-colors ${activeValues.includes(item.name) ? 'text-black bg-yellow-500 border-yellow-600' : 'text-gray-400 bg-[#151515] border-gray-800/50'}`}>
                            {item.name || "N/A"}
                        </div>
                    </div>
                ))}
                {items.length === 0 && <div className="col-span-2 py-10 text-center text-gray-800 font-black italic uppercase text-[9px]">Sem registros</div>}
            </div>
       </div>
    </div>
);

export default KillFeedPage;

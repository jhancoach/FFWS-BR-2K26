
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardData, TeamStats, PlayerData, KillFeed, MatchDetails } from '../types';
import { calculateTeamStats } from '../services/dataService';
import { Shield, TrendingUp, Users, ArrowLeft, Target, Award, Crosshair, Map as MapIcon, BarChart3, Star, Disc, Activity, Layers, Zap, ListOrdered, Trophy, ChevronDown, Medal, CheckCircle2, Flame, TrendingDown, LayoutGrid } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList, PieChart, Pie, Cell, Legend, CartesianGrid, YAxis } from 'recharts';
import FilterBar from '../components/FilterBar';

interface TeamsProps {
  data: DashboardData;
}

const COLORS = ['#EAB308', '#F97316', '#EF4444', '#3B82F6', '#A855F7', '#10B981', '#6366F1', '#EC4899'];

const Teams: React.FC<TeamsProps> = ({ data }) => {
  const location = useLocation();
  const navigate = useNavigate();

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

  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [selectedDrop, setSelectedDrop] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'gallery' | 'mapRanking' | 'bottomRanking'>('gallery');

  useEffect(() => {
      if (location.state?.team) {
          setFilters(prev => ({ ...prev, team: [location.state.team] }));
          window.history.replaceState({}, document.title);
      }
  }, [location.state]);

  const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

  const filteredTeamStats = useMemo(() => {
    const filteredDetails = data.details.filter(d => {
      if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(d.MAPA))) return false;
      if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(d.RD))) return false;
      if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(d.Q))) return false;
      return true;
    });
    const stats = calculateTeamStats({ ...data, details: filteredDetails });
    
    // Filtro de Grupo
    if (filters.grupo.length > 0) {
      return stats.filter(s => s.grupo && filters.grupo.some(g => normalize(g) === normalize(s.grupo)));
    }
    
    return stats;
  }, [data, filters]);
  
  const filterOptions = useMemo(() => ({
    teams: Array.from(new Set(data.players.map(p => p.TIME))).filter(Boolean).sort(),
    players: [], 
    weapons: [], 
    safes: [], 
    maps: Array.from(new Set(data.players.map(p => p.MAPA))).filter(Boolean).sort(),
    rounds: Array.from(new Set(data.players.map(p => p.RD))).filter(Boolean).sort(),
    quedas: Array.from(new Set(data.players.map(p => p.Q))).filter(Boolean).sort(),
    confrontations: [],
    grupos: Array.from(new Set(data.teamsReference.map(t => t.GRUPO))).filter(Boolean).sort() as string[]
  }), [data.players, data.teamsReference]);

  const selectedTeamName = filters.team.length === 1 ? filters.team[0] : null;
  const selectedTeamStats = selectedTeamName ? filteredTeamStats.find(t => t.name === selectedTeamName) : null;

  // Reset local states if team changes
  useEffect(() => {
    setSelectedMap(null);
    setSelectedDrop(null);
    setSelectedPosition(null);
  }, [selectedTeamName]);

  // Roster do time ordenado por kills
  const teamRosterData = useMemo(() => {
      const rosters: Record<string, { name: string, kills: number, matches: number, avg: string }[]> = {};
      
      const filteredPlayers = data.players.filter(p => {
          if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return false;
          if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(p.RD))) return false;
          if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(p.Q))) return false;
          return true;
      });

      filteredPlayers.forEach(p => {
          if (!p.TIME) return;
          if (!rosters[p.TIME]) rosters[p.TIME] = [];
          
          let player = rosters[p.TIME].find(pl => pl.name === p.PLAYER);
          if (!player) {
              player = { name: p.PLAYER, kills: 0, matches: 0, avg: '0.00' };
              rosters[p.TIME].push(player);
          }
          player.kills += parseInt(p.Abates || '0');
          player.matches += 1;
      });

      Object.keys(rosters).forEach(t => {
          rosters[t].forEach(p => {
              p.avg = p.matches > 0 ? (p.kills / p.matches).toFixed(2) : '0.00';
          });
          rosters[t].sort((a, b) => b.kills - a.kills);
      });

      return rosters;
  }, [data.players, filters]);

  // Estatísticas de Posição (Quantidade de partidas por posição)
  const positionStatsData = useMemo(() => {
    if (!selectedTeamName) return [];
    const counts: Record<number, number> = {};
    data.details.filter(d => d.TIME === selectedTeamName).forEach(d => {
        const pos = parseInt(d.POS) || 0;
        if (pos > 0) counts[pos] = (counts[pos] || 0) + 1;
    });
    return Object.entries(counts).map(([pos, count]) => ({ 
        pos: parseInt(pos), 
        count 
    })).sort((a, b) => a.pos - b.pos);
  }, [data.details, selectedTeamName]);

  // Evolução por Rodada
  const evolutionData = useMemo(() => {
     if (!selectedTeamName) return [];
     const roundsMap = new Map<string, { rd: string, pts: number, kills: number }>();
     data.details.filter(d => d.TIME === selectedTeamName).forEach(d => {
         if (!d.RD) return;
         if (!roundsMap.has(d.RD)) roundsMap.set(d.RD, { rd: d.RD, pts: 0, kills: 0 });
         const r = roundsMap.get(d.RD)!;
         r.pts += parseInt(d.PTS) || 0;
         r.kills += parseInt(d.ABTS) || 0;
     });
     return Array.from(roundsMap.values()).sort((a,b) => {
         const numA = parseInt(a.rd.replace(/\D/g, '')) || 0;
         const numB = parseInt(b.rd.replace(/\D/g, '')) || 0;
         return numA - numB;
     });
  }, [data.details, selectedTeamName]);

  // Detalhes das partidas para a posição selecionada
  const selectedPositionMatchDetails = useMemo(() => {
    if (!selectedTeamName || selectedPosition === null) return [];
    return data.details.filter(d => d.TIME === selectedTeamName && parseInt(d.POS) === selectedPosition)
      .sort((a, b) => {
        const rdA = parseInt(a.RD.replace(/\D/g, '')) || 0;
        const rdB = parseInt(b.RD.replace(/\D/g, '')) || 0;
        if (rdA !== rdB) return rdA - rdB;
        return (parseInt(a.Q) || 0) - (parseInt(b.Q) || 0);
      });
  }, [data.details, selectedTeamName, selectedPosition]);

  // Detalhes das partidas para o mapa selecionado
  const selectedMapMatchDetails = useMemo(() => {
    if (!selectedTeamName || !selectedMap) return [];
    return data.details.filter(d => d.TIME === selectedTeamName && normalize(d.MAPA) === normalize(selectedMap))
      .sort((a, b) => {
        const rdA = parseInt(a.RD.replace(/\D/g, '')) || 0;
        const rdB = parseInt(b.RD.replace(/\D/g, '')) || 0;
        if (rdA !== rdB) return rdA - rdB;
        return (parseInt(a.Q) || 0) - (parseInt(b.Q) || 0);
      });
  }, [data.details, selectedTeamName, selectedMap]);

  // Performance por Partida / Queda
  const dropStatsData = useMemo(() => {
      if (!selectedTeamName) return [];
      const stats = new Map<string, { q: string, pts: number, kills: number, matches: number }>();

      data.details.filter(d => d.TIME === selectedTeamName).forEach(d => {
          const q = d.Q || '1';
          if (!stats.has(q)) stats.set(q, { q, pts: 0, kills: 0, matches: 0 });
          const s = stats.get(q)!;
          s.pts += parseInt(d.PTS) || 0;
          s.kills += parseInt(d.ABTS) || 0;
          s.matches += 1;
      });

      return Array.from(stats.values()).map(s => ({
          ...s,
          avgPts: (s.pts / s.matches).toFixed(2),
          avgKills: (s.kills / s.matches).toFixed(2)
      })).sort((a, b) => parseInt(a.q) - parseInt(b.q));
  }, [data.details, selectedTeamName]);

  // Detalhes das partidas para a queda selecionada
  const selectedDropMatchDetails = useMemo(() => {
    if (!selectedTeamName || !selectedDrop) return [];
    return data.details.filter(d => d.TIME === selectedTeamName && normalize(d.Q) === normalize(selectedDrop))
      .sort((a, b) => {
        const rdA = parseInt(a.RD.replace(/\D/g, '')) || 0;
        const rdB = parseInt(b.RD.replace(/\D/g, '')) || 0;
        return rdA - rdB;
      });
  }, [data.details, selectedTeamName, selectedDrop]);

  // Performance por Mapa Completo
  const mapPerformanceData = useMemo(() => {
    if (!selectedTeamName) return [];
    const stats = new Map<string, { map: string, pts: number, ptsc: number, kills: number, matches: number, booyahs: number }>();
    
    data.details.filter(d => d.TIME === selectedTeamName).forEach(d => {
        const m = d.MAPA || 'N/A';
        if (!stats.has(m)) stats.set(m, { map: m, pts: 0, ptsc: 0, kills: 0, matches: 0, booyahs: 0 });
        const s = stats.get(m)!;
        s.pts += parseInt(d.PTS) || 0;
        s.ptsc += parseInt(d.PTSC) || 0;
        s.kills += parseInt(d.ABTS) || 0;
        s.matches += 1;
        if (parseInt(d.B) > 0) s.booyahs += 1;
    });

    return Array.from(stats.values()).map(s => ({
        ...s,
        avgPts: (s.pts / s.matches).toFixed(2),
        avgPtsc: (s.ptsc / s.matches).toFixed(2),
        avgKills: (s.kills / s.matches).toFixed(2)
    })).sort((a, b) => b.pts - a.pts);
  }, [data.details, selectedTeamName]);

  // Abates por Safe
  const safeStatsData = useMemo(() => {
    if (!selectedTeamName) return [];
    const teamPlayers = new Set(data.players.filter(p => p.TIME === selectedTeamName).map(p => normalize(p.PLAYER)));
    const safeCounts: Record<string, number> = {};

    data.killFeed.forEach(k => {
        if (teamPlayers.has(normalize(k.PLAYER))) {
            const safe = k.SAFE || 'OUT';
            safeCounts[safe] = (safeCounts[safe] || 0) + 1;
        }
    });

    return Object.entries(safeCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [data.killFeed, data.players, selectedTeamName]);

  // Classificação por Mapa (Comparativo)
  const mapRankings = useMemo(() => {
    const maps = Array.from(new Set(data.details.map(d => d.MAPA))).filter(Boolean) as string[];
    return maps.map(mapName => {
      const mapDetails = data.details.filter(d => normalize(d.MAPA) === normalize(mapName));
      const stats = calculateTeamStats({ ...data, details: mapDetails });
      return { mapName, stats };
    });
  }, [data]);

  // Piores Times (Bottom Rankings)
  const bottomRankings = useMemo(() => {
    const stats = [...filteredTeamStats];
    return {
      pts: [...stats].sort((a, b) => a.pts - b.pts).slice(0, 12),
      ptsc: [...stats].sort((a, b) => a.ptsc - b.ptsc).slice(0, 12),
      booyahs: [...stats].sort((a, b) => a.b - b.b).slice(0, 12),
      avgPts: [...stats].sort((a, b) => a.avgPts - b.avgPts).slice(0, 12),
      avgAbts: [...stats].sort((a, b) => a.avgAbts - b.avgAbts).slice(0, 12),
    };
  }, [filteredTeamStats]);

  const handlePlayerClick = (playerName: string) => {
    navigate('/players', { state: { player: playerName } });
  };

  if (data.loading) return <div className="text-center py-20 animate-pulse text-yellow-500 font-bold uppercase italic tracking-widest">Processando Equipes...</div>;

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center no-print">
            <FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />
            
            <div className="flex items-center gap-4">
                {!selectedTeamName && (
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                        <button 
                            onClick={() => setActiveTab('gallery')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'gallery' ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            <LayoutGrid size={14} /> Galeria
                        </button>
                        <button 
                            onClick={() => setActiveTab('mapRanking')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'mapRanking' ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            <MapIcon size={14} /> Por Mapa
                        </button>
                        <button 
                            onClick={() => setActiveTab('bottomRanking')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'bottomRanking' ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            <TrendingDown size={14} /> Piores
                        </button>
                    </div>
                )}

                {selectedTeamName && (
                    <button 
                        onClick={() => {
                            if (selectedMap) setSelectedMap(null);
                            else if (selectedDrop) setSelectedDrop(null);
                            else if (selectedPosition !== null) setSelectedPosition(null);
                            else setFilters(prev => ({...prev, team: []}));
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-yellow-500 rounded-xl transition-all text-xs font-black uppercase tracking-widest border border-white/5"
                    >
                        <ArrowLeft size={16} /> {(selectedMap || selectedDrop || selectedPosition !== null) ? `Voltar ao Perfil` : `Voltar à Galeria`}
                    </button>
                )}
            </div>
        </div>

        {selectedTeamName && selectedTeamStats ? (
            <div className="space-y-8 animate-in fade-in duration-500 pb-10">
                {/* Header do Time */}
                <div className="bg-[#1a1a1a] rounded-3xl p-8 border border-gray-800 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-black">
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                         <Shield size={220} className="text-yellow-500" />
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                         <div className="w-40 h-40 bg-black rounded-3xl border-2 border-yellow-500/30 flex items-center justify-center overflow-hidden shadow-2xl p-4 rotate-2 hover:rotate-0 transition-transform duration-500">
                             {selectedTeamStats.image ? (
                                 <img src={selectedTeamStats.image} alt={selectedTeamStats.name} className="w-full h-full object-contain" />
                             ) : (
                                 <Shield size={80} className="text-gray-800" />
                             )}
                         </div>
                         <div className="text-center md:text-left space-y-4">
                             <div className="flex items-center gap-3 justify-center md:justify-start">
                                <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">PRO LEAGUE</span>
                                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">DADOS FILTRADOS</span>
                             </div>
                             <h1 className="text-5xl md:text-7xl font-black italic text-white tracking-tighter uppercase leading-none">{selectedTeamStats.name}</h1>
                             <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                 <StatBadge label="PONTOS" value={selectedTeamStats.pts} color="text-yellow-500" />
                                 <StatBadge label="VITÓRIAS" value={selectedTeamStats.b} color="text-orange-500" />
                                 <StatBadge label="KILLS" value={selectedTeamStats.abts} color="text-red-500" />
                                 <StatBadge label="MÉDIA EQUIPE" value={selectedTeamStats.avgAbts} color="text-blue-500" />
                             </div>
                         </div>
                    </div>
                </div>

                {/* Roster Performance Ordenada por Kills - GRID RESPONSIVO (SEM SCROLL) */}
                <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-xl">
                    <h3 className="text-white font-black text-sm mb-8 flex items-center gap-3 uppercase tracking-widest">
                        <Users size={20} className="text-yellow-500"/> ROSTER PERFORMANCE (ORDENADO)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {teamRosterData[selectedTeamName]?.map((player, idx) => {
                            const totalKills = teamRosterData[selectedTeamName].reduce((acc, curr) => acc + curr.kills, 0) || 1;
                            const percent = ((player.kills / totalKills) * 100).toFixed(1);
                            return (
                                <div 
                                    key={idx} 
                                    onClick={() => handlePlayerClick(player.name)} 
                                    className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-4 group cursor-pointer hover:border-yellow-500/40 transition-all active:scale-[0.98] shadow-lg"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black italic text-[10px] border transition-colors ${idx === 0 ? 'bg-yellow-500 text-black border-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-gray-900 text-gray-500 border-gray-800 group-hover:border-yellow-500/30'}`}>
                                                {idx + 1}º
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-white font-black text-xs uppercase italic group-hover:text-yellow-500 transition-colors tracking-tight truncate">{player.name}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">{player.matches} JOGOS</span>
                                                    <span className="text-[8px] text-blue-400 font-black italic">AVG: {player.avg}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="flex flex-col items-end">
                                                <span className="text-red-500 font-black text-lg leading-none italic">{player.kills}</span>
                                                <span className="text-[9px] text-blue-400 font-black italic mt-0.5">{percent}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-950 h-1 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <div className={`h-full rounded-full transition-all duration-700 ${idx === 0 ? 'bg-yellow-500' : 'bg-red-500/60'}`} style={{ width: `${percent}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                        {(!teamRosterData[selectedTeamName] || teamRosterData[selectedTeamName].length === 0) && (
                            <div className="col-span-full py-8 text-center text-[10px] text-gray-700 font-black uppercase italic tracking-widest">Sem roster registrado</div>
                        )}
                    </div>
                </div>

                {/* Grid Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Seção de Detalhes Dinâmicos (Mapa, Queda ou Posição) */}
                        {(selectedMap || selectedDrop || selectedPosition !== null) ? (
                            <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-yellow-500/40 shadow-2xl animate-in zoom-in-95 duration-300">
                                <div className="flex justify-between items-center mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-yellow-500 rounded-2xl text-black">
                                            {selectedMap ? <MapIcon size={24} /> : selectedDrop ? <Zap size={24} /> : <Trophy size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                                                {selectedMap || (selectedDrop ? `QUEDA ${selectedDrop}` : `${selectedPosition}º LUGAR`)}
                                            </h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Relatório Detalhado de Performance</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => { setSelectedMap(null); setSelectedDrop(null); setSelectedPosition(null); }}
                                        className="text-[10px] font-black text-yellow-500 hover:text-white uppercase tracking-widest border border-yellow-500/20 px-4 py-2 rounded-xl transition-all"
                                    >
                                        Fechar Detalhes
                                    </button>
                                </div>

                                <div className="bg-black/30 rounded-2xl border border-gray-800 overflow-hidden shadow-inner">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-black/80 text-[10px] text-gray-500 uppercase font-black tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">{selectedMap ? "Partida" : "Mapa / Partida"}</th>
                                                <th className="px-6 py-4 text-center">Posição</th>
                                                <th className="px-6 py-4 text-center">PTS</th>
                                                <th className="px-6 py-4 text-center">PTS/C</th>
                                                <th className="px-6 py-4 text-center">Abates</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {(selectedMap ? selectedMapMatchDetails : selectedDrop ? selectedDropMatchDetails : selectedPositionMatchDetails).map((match, idx) => (
                                                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-white uppercase italic">
                                                                {selectedMap ? `Queda ${match.Q}` : `${match.MAPA} (Q${match.Q})`}
                                                            </span>
                                                            <span className="text-[9px] text-gray-600 font-bold uppercase">Rodada {match.RD}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black italic text-xs border ${parseInt(match.POS) === 1 ? 'bg-yellow-500 text-black border-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-gray-900 text-gray-400 border-gray-800'}`}>
                                                            {match.POS}º
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-black text-yellow-500 italic">{match.PTS}</td>
                                                    <td className="px-6 py-4 text-center font-black text-orange-500 italic">{match.PTSC}</td>
                                                    <td className="px-6 py-4 text-center font-black text-red-500 italic">{match.ABTS}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Gráfico de Evolução */}
                                <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-xl">
                                    <h3 className="text-white font-black text-sm mb-12 flex items-center gap-3 uppercase tracking-widest">
                                        <TrendingUp size={20} className="text-yellow-500"/> HISTÓRICO DE PERFORMANCE
                                    </h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={evolutionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                                <XAxis dataKey="rd" stroke="#444" fontSize={11} fontWeight="bold" axisLine={false} tickLine={false} />
                                                <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '15px' }} />
                                                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                                <Bar dataKey="pts" name="Pontos" fill="#EAB308" radius={[4, 4, 0, 0]} barSize={35}>
                                                    <LabelList dataKey="pts" position="top" fill="#fff" fontSize={10} fontWeight="900" />
                                                </Bar>
                                                <Bar dataKey="kills" name="Abates" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={35}>
                                                    <LabelList dataKey="kills" position="top" fill="#fff" fontSize={10} fontWeight="900" />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Performance Territorial (MAPAS) */}
                                <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-xl">
                                    <h3 className="text-white font-black text-sm mb-8 flex items-center gap-3 uppercase tracking-widest">
                                        <MapIcon size={20} className="text-blue-500"/> DOMÍNIO TERRITORIAL (CLIQUE PARA DETALHES)
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {mapPerformanceData.map((m, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => setSelectedMap(m.map)}
                                                className="bg-black/40 border border-white/5 rounded-2xl p-6 hover:border-yellow-500/60 hover:bg-yellow-500/5 transition-all group relative overflow-hidden cursor-pointer shadow-lg active:scale-95"
                                            >
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <h4 className="text-white font-black italic uppercase text-2xl leading-none tracking-tight group-hover:text-yellow-500 transition-colors">{m.map}</h4>
                                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 block">{m.matches} QUEDAS DISPUTADAS</span>
                                                    </div>
                                                    <div className="bg-yellow-500 text-black px-2 py-1 rounded text-[10px] font-black italic shadow-lg">
                                                        {m.booyahs} BOOYAHS
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-gray-600 font-black uppercase">PTS TOTAL</span>
                                                        <span className="text-2xl font-black text-yellow-500 italic">{m.pts}</span>
                                                        <span className="text-[8px] text-gray-500 font-mono mt-1">AVG: {m.avgPts}</span>
                                                    </div>
                                                    <div className="flex flex-col border-l border-white/5 pl-4">
                                                        <span className="text-[9px] text-gray-600 font-black uppercase">PTS/C</span>
                                                        <span className="text-2xl font-black text-orange-500 italic">{m.ptsc}</span>
                                                        <span className="text-[8px] text-gray-500 font-mono mt-1">AVG: {m.avgPtsc}</span>
                                                    </div>
                                                    <div className="flex flex-col border-l border-white/5 pl-4">
                                                        <span className="text-[9px] text-gray-600 font-black uppercase">ABATES</span>
                                                        <span className="text-2xl font-black text-red-500 italic">{m.kills}</span>
                                                        <span className="text-[8px] text-gray-500 font-mono mt-1">AVG: {m.avgKills}</span>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                    <span className="text-[8px] font-black text-yellow-500 uppercase italic">Ver mais</span>
                                                    <ChevronDown size={12} className="text-yellow-500 -rotate-90" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* MOVIDO: Distribuição por Safe (Posicionamento atualizado conforme solicitado) */}
                                <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-xl">
                                    <h3 className="text-white font-black text-sm mb-8 flex items-center gap-3 uppercase tracking-widest">
                                        <Disc size={20} className="text-red-500"/> DISTRIBUIÇÃO POR SAFE
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                        {safeStatsData.map((s, i) => {
                                            const maxSafe = Math.max(...safeStatsData.map(x => x.count)) || 1;
                                            const percent = ((s.count / maxSafe) * 100);
                                            return (
                                                <div key={i} className="space-y-2">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                            <Disc size={12} className="text-red-600 opacity-50" /> SAFE {s.name}
                                                        </span>
                                                        <span className="text-xs font-black text-white italic">{s.count} ABATES</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                                        <div className="h-full bg-gradient-to-r from-red-800 to-red-500 rounded-full" style={{ width: `${percent}%` }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {safeStatsData.length === 0 && <div className="col-span-2 py-8 text-center text-[10px] text-gray-700 font-black uppercase italic tracking-widest">Sem logs de abates registrados</div>}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        {/* Sumário de Posições Interativo */}
                        <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-xl">
                            <h3 className="text-white font-black text-sm mb-8 flex items-center gap-3 uppercase tracking-widest">
                                <Trophy size={20} className="text-yellow-500"/> SUMÁRIO DE POSIÇÕES (CLIQUE)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {positionStatsData.map((p, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => setSelectedPosition(p.pos)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group hover:bg-yellow-500/10 ${selectedPosition === p.pos ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'border-white/5 bg-black/40'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black italic text-sm border flex-shrink-0 transition-colors ${p.pos === 1 || selectedPosition === p.pos ? 'bg-yellow-500 text-black border-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-gray-900 text-gray-500 border-gray-800'}`}>
                                            {p.pos}º
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${selectedPosition === p.pos ? 'text-yellow-500' : 'text-gray-600'}`}>LUGAR</span>
                                            <div className="flex items-end gap-1.5 mt-1">
                                                <span className="text-2xl font-black text-white italic leading-none">{p.count}x</span>
                                            </div>
                                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter mt-1 opacity-60">FREQUÊNCIA</span>
                                        </div>
                                    </div>
                                ))}
                                {positionStatsData.length === 0 && (
                                    <div className="col-span-2 py-8 text-center text-[10px] text-gray-700 font-black uppercase italic tracking-widest">Sem dados de posição</div>
                                )}
                            </div>
                        </div>

                        {/* Performance por Partida (QUEDAS) */}
                        <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-xl">
                            <h3 className="text-white font-black text-sm mb-8 flex items-center gap-3 uppercase tracking-widest">
                                <Zap size={20} className="text-orange-500"/> PERFORMANCE POR QUEDA (CLIQUE)
                            </h3>
                            <div className="space-y-4">
                                {dropStatsData.map((d, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => setSelectedDrop(d.q)}
                                        className={`bg-black/40 rounded-2xl p-4 border transition-all cursor-pointer group hover:bg-yellow-500/10 ${selectedDrop === d.q ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-white/5'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center font-black text-sm italic transition-colors ${selectedDrop === d.q ? 'text-white bg-yellow-600' : 'text-yellow-500'}`}>
                                                    Q{d.q}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-white font-black text-lg leading-none">{d.pts} <small className="text-[10px] text-gray-500 uppercase">Pts</small></span>
                                                        <span className="text-red-500 font-black text-lg leading-none">{d.kills} <small className="text-[10px] text-gray-500 uppercase">Kills</small></span>
                                                    </div>
                                                    <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">
                                                        MÉDIAS: {d.avgPts} P / {d.avgKills} K
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronDown size={14} className={`text-gray-700 transition-transform ${selectedDrop === d.q ? 'rotate-180 text-yellow-500' : '-rotate-90 group-hover:text-yellow-500'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ) : activeTab === 'mapRanking' ? (
            <div className="space-y-12 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {mapRankings.map((m, idx) => (
                        <div key={idx} className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
                            <div className="bg-gradient-to-r from-blue-900/40 to-black p-6 border-b border-gray-800 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-600 rounded-2xl text-white">
                                        <MapIcon size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{m.mapName}</h3>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Classificação Geral por Território</p>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-black/40 text-[9px] text-gray-500 uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4 w-12 text-center">#</th>
                                            <th className="px-6 py-4">Equipe</th>
                                            <th className="px-6 py-4 text-center">PTS</th>
                                            <th className="px-6 py-4 text-center">B</th>
                                            <th className="px-6 py-4 text-center">KILLS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {m.stats.slice(0, 12).map((team, tIdx) => (
                                            <tr key={tIdx} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setFilters(prev => ({...prev, team: [team.name]}))}>
                                                <td className="px-6 py-4 text-center font-mono text-[10px] text-gray-600">{tIdx + 1}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-black rounded-lg border border-gray-800 p-1 flex items-center justify-center">
                                                            {team.image ? <img src={team.image} alt={team.name} className="w-full h-full object-contain" /> : <Shield size={14} className="text-gray-700" />}
                                                        </div>
                                                        <span className="text-xs font-black text-white uppercase italic">{team.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-black text-yellow-500 italic text-sm">{team.pts}</td>
                                                <td className="px-6 py-4 text-center font-black text-orange-500 italic text-sm">{team.b}</td>
                                                <td className="px-6 py-4 text-center font-black text-red-500 italic text-sm">{team.abts}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ) : activeTab === 'bottomRanking' ? (
            <div className="space-y-12 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <BottomList title="Piores em Pontos" data={bottomRankings.pts} metric="pts" label="PTS" color="text-yellow-500" onSelect={(name) => setFilters(prev => ({...prev, team: [name]}))} />
                    <BottomList title="Piores em PTS/C" data={bottomRankings.ptsc} metric="ptsc" label="PTS/C" color="text-orange-500" onSelect={(name) => setFilters(prev => ({...prev, team: [name]}))} />
                    <BottomList title="Piores em Booyahs" data={bottomRankings.booyahs} metric="b" label="BOOYAHS" color="text-blue-500" onSelect={(name) => setFilters(prev => ({...prev, team: [name]}))} />
                    <BottomList title="Piores Médias (PTS)" data={bottomRankings.avgPts} metric="avgPts" label="AVG PTS" color="text-yellow-400" onSelect={(name) => setFilters(prev => ({...prev, team: [name]}))} />
                    <BottomList title="Piores Médias (KILLS)" data={bottomRankings.avgAbts} metric="avgAbts" label="AVG KILLS" color="text-red-500" onSelect={(name) => setFilters(prev => ({...prev, team: [name]}))} />
                </div>
            </div>
        ) : (
            /* Galeria de Times */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                {filteredTeamStats.filter(t => filters.team.length === 0 || filters.team.includes(t.name)).map(team => (
                    <div 
                        key={team.name} 
                        onClick={() => setFilters(prev => ({...prev, team: [team.name]}))}
                        className="bg-[#1a1a1a] rounded-3xl p-6 border border-gray-800 shadow-xl hover:border-yellow-500/40 hover:translate-y-[-5px] transition-all cursor-pointer group flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center border border-gray-800 p-2 group-hover:scale-110 group-hover:border-yellow-500 transition-all">
                                {team.image ? <img src={team.image} alt={team.name} className="w-full h-full object-contain" /> : <Shield className="text-gray-800" size={24} />}
                            </div>
                            <div className="text-right">
                                <h3 className="text-xl font-black italic text-white uppercase leading-none group-hover:text-yellow-500 transition-colors">{team.name}</h3>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 block">{team.pts} PONTOS</span>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-center">
                            <div className="text-[10px] font-black text-yellow-500/50 uppercase tracking-widest group-hover:text-yellow-500 transition-colors">VER PERFIL COMPLETO →</div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

const StatBadge = ({ label, value, color }: any) => (
    <div className="bg-black/60 px-5 py-3 rounded-2xl border border-white/5 text-center min-w-[100px] shadow-inner">
        <span className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">{label}</span>
        <span className={`block text-2xl font-black ${color} italic`}>{value}</span>
    </div>
);

const BottomList = ({ title, data, metric, label, color, onSelect }: any) => (
    <div className="bg-[#1a1a1a] rounded-3xl border border-red-900/20 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-red-900/20 to-black p-5 border-b border-gray-800 flex items-center gap-3">
            <TrendingDown size={18} className="text-red-500" />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
        </div>
        <div className="divide-y divide-gray-800/50">
            {data.map((team: any, idx: number) => (
                <div key={idx} onClick={() => onSelect(team.name)} className="px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-gray-600 w-4">#{idx + 1}</span>
                        <div className="w-8 h-8 bg-black rounded-lg border border-gray-800 p-1 flex items-center justify-center">
                            {team.image ? <img src={team.image} alt={team.name} className="w-full h-full object-contain" /> : <Shield size={14} className="text-gray-700" />}
                        </div>
                        <span className="text-xs font-bold text-gray-300 uppercase italic group-hover:text-white transition-colors">{team.name}</span>
                    </div>
                    <div className="text-right">
                        <span className={`text-sm font-black italic ${color}`}>{team[metric]}</span>
                        <span className="block text-[8px] text-gray-600 font-black uppercase tracking-tighter">{label}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default Teams;

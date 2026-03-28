
import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardData, TeamStats } from '../types';
import { calculateTeamStats } from '../services/dataService';
import { Trophy, Crosshair, Crown, Layers, Star, ChevronRight, Shield, CheckCircle2, TrendingUp, Medal } from 'lucide-react';
import FilterBar from '../components/FilterBar';

interface LeaderboardProps {
  data: DashboardData;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ data }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<TeamStats[]>([]);
  const [phase, setPhase] = useState<'ALL' | 'QUALIFIERS' | 'FINALS'>('ALL');
  
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

  // Filtros baseados estritamente na fDetalhes (data.details)
  const filterOptions = useMemo(() => ({
    teams: Array.from(new Set(data.details.map(d => d.TIME))).filter(Boolean).sort(),
    players: [],
    weapons: [],
    safes: [],
    maps: Array.from(new Set(data.details.map(d => d.MAPA))).filter(Boolean).sort(),
    rounds: Array.from(new Set(data.details.map(d => d.RD))).filter(Boolean).sort(),
    quedas: Array.from(new Set(data.details.map(d => d.Q))).filter(Boolean).sort(),
    confrontations: Array.from(new Set(data.details.map(d => d.CONFRONTO))).filter(Boolean).sort(),
    grupos: Array.from(new Set(data.teamsReference.map(t => t.GRUPO))).filter(Boolean).sort() as string[],
  }), [data.details, data.teamsReference]);

  const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

  useEffect(() => {
    if (!data.loading) {
      const filteredDetails = data.details.filter(d => {
        if (filters.team.length > 0 && !filters.team.includes(d.TIME)) return false;
        if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(d.MAPA))) return false;
        if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(d.RD))) return false;
        if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(d.Q))) return false;
        if (filters.confrontation.length > 0 && !filters.confrontation.includes(d.CONFRONTO)) return false;

        const roundNum = parseInt(d.RD.replace(/\D/g, '')) || 0;
        if (phase === 'QUALIFIERS' && (roundNum < 1 || roundNum > 20)) return false;
        if (phase === 'FINALS' && roundNum <= 20) return false;

        return true;
      });

      const filteredData = { ...data, details: filteredDetails };
      let calculatedStats = calculateTeamStats(filteredData);
      
      // Filtro de Grupo
      if (filters.grupo.length > 0) {
        calculatedStats = calculatedStats.filter(s => s.grupo && filters.grupo.some(g => normalize(g) === normalize(s.grupo)));
      }
      
      setStats(calculatedStats);
    }
  }, [data, filters, phase]);

  const handleTeamClick = (teamName: string) => {
      navigate('/teams', { state: { team: teamName } });
  };

  const leftStats = useMemo(() => stats.slice(0, 12), [stats]);
  const rightStats = useMemo(() => stats.slice(12, 24), [stats]);

  if (data.loading) return <div className="text-center py-20 text-yellow-500 animate-pulse font-bold uppercase tracking-widest italic">CARREGANDO CLASSIFICAÇÃO...</div>;

  const topBooyahs = [...stats].sort((a, b) => b.b - a.b || b.pts - a.pts).slice(0, 3);
  const topPtsc = [...stats].sort((a, b) => b.ptsc - a.ptsc || b.pts - a.pts).slice(0, 3);
  const topAbts = [...stats].sort((a, b) => b.abts - a.abts || b.pts - a.pts).slice(0, 3);

  const Top3Card = ({ title, icon, teams, metricKey, metricLabel, colorClass }: any) => (
    <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 relative overflow-hidden group hover:border-yellow-600/50 transition-all shadow-lg">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
        {icon}
      </div>
      <h3 className="text-lg font-black uppercase italic text-gray-200 mb-4 flex items-center gap-2">
        <span className={colorClass}>{icon}</span> {title}
      </h3>
      <div className="space-y-4">
        {teams.map((team: any, idx: number) => (
          <div 
            key={team.name} 
            onClick={() => handleTeamClick(team.name)}
            className="flex items-center justify-between bg-[#0f0f0f] p-3 rounded-xl border border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-sm skew-x-[-10deg] flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : 'bg-orange-700 text-white'}`}>
                {idx + 1}
              </div>
              <div className="flex items-center gap-2">
                 {team.image && <img src={team.image} alt={team.name} className="w-8 h-8 rounded-full object-cover bg-black border border-gray-700" />}
                 <span className="font-bold text-gray-200 text-sm hover:text-yellow-400 uppercase tracking-tight">{team.name}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`block font-black text-xl italic ${colorClass}`}>{team[metricKey]}</span>
              <span className="text-[9px] text-gray-500 uppercase font-bold">{metricLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TableHeader = () => (
    <thead className="bg-[#0f0f0f] text-gray-400 text-[10px] uppercase font-bold tracking-wider">
      <tr>
        <th className="px-3 py-4 text-center">#</th>
        <th className="px-3 py-4">Equipe</th>
        <th className="px-3 py-4 text-center bg-yellow-900/10 text-yellow-500 font-black">PTS</th>
        <th className="px-3 py-4 text-center text-orange-400/80">PTS/C</th>
        <th className="px-3 py-4 text-center text-yellow-600/80">M.PTS</th>
        <th className="px-3 py-4 text-center">ABTS</th>
        <th className="px-3 py-4 text-center text-red-500/80">M.ABTS</th>
        <th className="px-3 py-4 text-center">B</th>
        <th className="px-3 py-4 text-center">S</th>
      </tr>
    </thead>
  );

  const TableRow = ({ team, index }: { team: TeamStats, index: number, key?: React.Key }) => {
    const isTop12 = index < 12;
    
    return (
      <tr 
        onClick={() => handleTeamClick(team.name)} 
        className={`hover:bg-yellow-900/10 transition-colors group cursor-pointer border-b border-gray-800/50 ${isTop12 ? 'relative overflow-hidden bg-yellow-500/5' : ''}`}
      >
        <td className="px-3 py-3 text-center font-mono text-[11px] relative">
            {isTop12 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 shadow-[0_0_10px_#facc15]"></div>}
            <span className={isTop12 ? 'text-yellow-500 font-black' : 'text-gray-500'}>{index + 1}</span>
        </td>
        <td className="px-3 py-3 font-bold text-white flex items-center gap-2">
          {team.image && <img src={team.image} className="w-7 h-7 object-contain" alt={team.name}/>}
          <div className="flex flex-col">
            <span className={`uppercase italic text-[11px] truncate max-w-[90px] ${isTop12 ? 'text-yellow-400' : ''}`}>
                {team.name}
            </span>
            {isTop12 && (
                <span className="text-[7px] font-black text-yellow-600 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 size={7} /> FINALISTA
                </span>
            )}
          </div>
        </td>
        <td className={`px-3 py-3 text-center font-black text-sm ${isTop12 ? 'text-white bg-yellow-600/20' : 'text-yellow-500 bg-yellow-900/5'}`}>{team.pts}</td>
        <td className="px-3 py-3 text-center text-orange-400/70 font-bold text-[11px]">{team.ptsc}</td>
        <td className="px-3 py-3 text-center text-yellow-600/60 font-mono text-[10px]">{team.avgPts}</td>
        <td className="px-3 py-3 text-center text-red-400 font-bold text-[11px]">{team.abts}</td>
        <td className="px-3 py-3 text-center text-red-600/60 font-mono text-[10px]">{team.avgAbts}</td>
        <td className="px-3 py-3 text-center text-yellow-600 font-bold text-[11px]">{team.b}</td>
        <td className="px-3 py-3 text-center text-gray-400 text-[11px]">{team.s}</td>
      </tr>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex bg-[#1a1a1a] p-1.5 rounded-xl border border-gray-800">
            <button onClick={() => setPhase('ALL')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${phase === 'ALL' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}><Layers size={14}/> Geral</button>
            <button onClick={() => setPhase('QUALIFIERS')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${phase === 'QUALIFIERS' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}><Crosshair size={14}/> Classificatórias</button>
            <button onClick={() => setPhase('FINALS')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${phase === 'FINALS' ? 'bg-yellow-500 text-black' : 'text-gray-400'}`}><Star size={14}/> Final</button>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-xl flex items-center gap-3">
             <Crown size={18} className="text-yellow-500" />
             <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Critério: Pontos &gt; Booyahs &gt; Abates</span>
          </div>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Top3Card title="Top 3 Booyahs" icon={<Trophy size={24} />} teams={topBooyahs} metricKey="b" metricLabel="Vitórias" colorClass="text-yellow-500" />
        <Top3Card title="Top 3 PTS/C" icon={<Medal size={24} />} teams={topPtsc} metricKey="ptsc" metricLabel="Pts Colocação" colorClass="text-orange-400" />
        <Top3Card title="Top 3 Abates" icon={<Crosshair size={24} />} teams={topAbts} metricKey="abts" metricLabel="Abates" colorClass="text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
          <div className="bg-[#0a0a0a] px-4 py-2 border-b border-gray-800 flex items-center justify-between">
            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">Tier 1 • Top 1-12</span>
            <div className="flex items-center gap-2">
                <TrendingUp size={12} className="text-yellow-500/50" />
                <span className="text-[9px] text-gray-600 uppercase font-bold">Resumo Competitivo</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <TableHeader />
              <tbody className="divide-y divide-gray-800 text-sm font-medium">
                {leftStats.map((team, index) => (
                  <TableRow key={team.name} team={team} index={index} />
                ))}
                {leftStats.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-gray-600 italic uppercase text-[10px]">Sem dados para esta filtragem</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
          <div className="bg-[#0a0a0a] px-4 py-2 border-b border-gray-800 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Tier 2 • Top 13-24</span>
            <Shield size={14} className="text-gray-600 opacity-50" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <TableHeader />
              <tbody className="divide-y divide-gray-800 text-sm font-medium">
                {rightStats.map((team, index) => (
                  <TableRow key={team.name} team={team} index={index + 12} />
                ))}
                {rightStats.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-gray-600 italic uppercase text-[10px]">Nenhuma equipe nesta faixa</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

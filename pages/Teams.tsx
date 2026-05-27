
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardData, TeamStats, PlayerData, KillFeed, MatchDetails } from '../types';
import { calculateTeamStats } from '../services/dataService';
import { Shield, TrendingUp, Users, ArrowLeft, Target, Award, Crosshair, Map as MapIcon, BarChart3, Star, Disc, Activity, Layers, Zap, ListOrdered, Trophy, ChevronDown, Medal, CheckCircle2, Flame, TrendingDown, LayoutGrid, MapPin, Scale, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList, PieChart, Pie, Cell, Legend, CartesianGrid, YAxis } from 'recharts';
import FilterBar from '../components/FilterBar';

interface TeamsProps {
  data: DashboardData;
}

const COLORS = ['#EAB308', '#F97316', '#EF4444', '#3B82F6', '#A855F7', '#10B981', '#6366F1', '#EC4899'];

const getTeamCharacteristic = (percentAbts: number, percentPos: number) => {
  const diff = Math.abs(percentAbts - percentPos);
  if (diff <= 5) return { label: 'Equilibrado', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: <Activity size={14} /> };
  if (percentAbts > percentPos) return { label: 'Agressivo', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <Flame size={14} /> };
  return { label: 'Posicional', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: <Target size={14} /> };
};

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
  const [activeTab, setActiveTab] = useState<'gallery' | 'mapRanking' | 'bottomRanking' | 'mapAnalysis' | 'safeAnalysis' | 'comparison' | 'pointsTable' | 'teamRounds'>('gallery');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'pts', direction: 'desc' });
  const [compareTeamB, setCompareTeamB] = useState<string | null>(null);

  const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

  // Análise de Comparação por Mapa
  const comparisonMapStats = useMemo(() => {
    if (!filters.team[0] || !compareTeamB) return [];
    
    const teamA = filters.team[0];
    const teamB = compareTeamB;
    
    const maps = Array.from(new Set(data.details.map(d => d.MAPA))).filter(Boolean) as string[];
    
    return maps.map(mapName => {
      const mapDetails = data.details.filter(d => normalize(d.MAPA) === normalize(mapName));
      
      // Filtros Globais (Rodada, Queda, Confronto) para os detalhes do mapa
      const mapFilteredDetails = mapDetails.filter(d => {
          if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(d.RD))) return false;
          if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(d.Q))) return false;
          if (filters.confrontation.length > 0 && !filters.confrontation.some(c => normalize(c) === normalize(d.CONFRONTO))) return false;
          return true;
      });

      const statsA = calculateTeamStats({ ...data, details: mapFilteredDetails.filter(d => normalize(d.TIME) === normalize(teamA)) })[0] || {
        pts: 0, ptsc: 0, abts: 0, s: 0, avgPts: 0, avgAbts: 0, avgPtsc: 0
      };
      
      const statsB = calculateTeamStats({ ...data, details: mapFilteredDetails.filter(d => normalize(d.TIME) === normalize(teamB)) })[0] || {
        pts: 0, ptsc: 0, abts: 0, s: 0, avgPts: 0, avgAbts: 0, avgPtsc: 0
      };
      
      return {
        mapName,
        teamA: statsA,
        teamB: statsB
      };
    });
  }, [data, filters, compareTeamB]);

  useEffect(() => {
      if (location.state?.team) {
          setFilters(prev => ({ ...prev, team: [location.state.team] }));
          window.history.replaceState({}, document.title);
      }
  }, [location.state]);

  const filteredData = useMemo(() => {
    const filteredDetails = data.details.filter(d => {
      if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(d.MAPA))) return false;
      if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(d.RD))) return false;
      if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(d.Q))) return false;
      if (filters.confrontation.length > 0 && !filters.confrontation.some(c => normalize(c) === normalize(d.CONFRONTO))) return false;
      return true;
    });

    const filteredPlayers = data.players.filter(p => {
      if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return false;
      if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(p.RD))) return false;
      if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(p.Q))) return false;
      if (filters.confrontation.length > 0 && !filters.confrontation.some(c => normalize(c) === normalize(p.CONFRONTO))) return false;
      return true;
    });

    const filteredKillFeed = data.killFeed.filter(k => {
      if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(k.MAPA))) return false;
      if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(k.RD))) return false;
      if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(k.Q))) return false;
      if (filters.confrontation.length > 0 && !filters.confrontation.some(c => normalize(c) === normalize(k.CONFRONTO))) return false;
      return true;
    });

    return {
      ...data,
      details: filteredDetails,
      players: filteredPlayers,
      killFeed: filteredKillFeed
    };
  }, [data, filters]);

  const filteredTeamStats = useMemo(() => {
    const stats = calculateTeamStats(filteredData);
    
    // Filtro de Grupo
    if (filters.grupo.length > 0) {
      return stats.filter(s => s.grupo && filters.grupo.some(g => normalize(g) === normalize(s.grupo)));
    }
    
    return stats;
  }, [filteredData, filters.grupo]);
  
  const filterOptions = useMemo(() => ({
    teams: Array.from(new Set(data.players.map(p => p.TIME))).filter(Boolean).sort(),
    players: [], 
    weapons: [], 
    safes: [], 
    maps: Array.from(new Set(data.players.map(p => p.MAPA))).filter(Boolean).sort(),
    rounds: Array.from(new Set(data.players.map(p => p.RD))).filter(Boolean).sort(),
    quedas: Array.from(new Set(data.players.map(p => p.Q))).filter(Boolean).sort(),
    confrontations: Array.from(new Set([
      ...data.confrontationsDimension.map(c => c.CONFRONTO),
      ...data.killFeed.map(k => k.CONFRONTO),
      ...data.details.map(d => d.CONFRONTO),
      ...data.characters.map(c => c.Confronto),
      ...data.players.map(p => p.CONFRONTO)
    ].filter(Boolean))).sort(),
    grupos: Array.from(new Set(data.teamsReference.map(t => t.GRUPO))).filter(Boolean).sort() as string[]
  }), [data.players, data.teamsReference, data.confrontationsDimension, data.killFeed, data.details, data.characters]);

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
      
      filteredData.players.forEach(p => {
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
  }, [filteredData.players]);

  // Estatísticas de Posição (Quantidade de partidas por posição)
  const positionStatsData = useMemo(() => {
    if (!selectedTeamName) return [];
    const counts: Record<number, number> = {};
    filteredData.details.filter(d => d.TIME === selectedTeamName).forEach(d => {
        const pos = parseInt(d.POS) || 0;
        if (pos > 0) counts[pos] = (counts[pos] || 0) + 1;
    });
    return Object.entries(counts).map(([pos, count]) => ({ 
        pos: parseInt(pos), 
        count 
    })).sort((a, b) => a.pos - b.pos);
  }, [filteredData.details, selectedTeamName]);

  // Evolução por Rodada e Confronto
  const evolutionData = useMemo(() => {
     if (!selectedTeamName) return [];
     const matchesMap = new Map<string, { label: string, rd: string, confronto: string, pts: number, kills: number }>();
     
     filteredData.details.filter(d => d.TIME === selectedTeamName).forEach(d => {
         if (!d.RD) return;
         const conf = d.CONFRONTO || '';
         const key = `${conf}|${d.RD}`;
         
         if (!matchesMap.has(key)) {
             matchesMap.set(key, { 
                 label: conf ? `${conf} - R${d.RD}` : `R${d.RD}`,
                 rd: d.RD, 
                 confronto: conf,
                 pts: 0, 
                 kills: 0
             });
         }
         const m = matchesMap.get(key)!;
         m.pts += parseInt(d.PTS) || 0;
         m.kills += parseInt(d.ABTS) || 0;
     });

     return Array.from(matchesMap.values()).sort((a, b) => {
         const rdA = parseInt(a.rd.replace(/\D/g, '')) || 0;
         const rdB = parseInt(b.rd.replace(/\D/g, '')) || 0;
         if (rdA !== rdB) return rdA - rdB;

         const confA = parseInt(a.confronto.replace(/\D/g, '')) || 0;
         const confB = parseInt(b.confronto.replace(/\D/g, '')) || 0;
         if (confA !== confB) return confA - confB;
         return a.confronto.localeCompare(b.confronto);
     });
  }, [filteredData.details, selectedTeamName]);

  // Detalhes das partidas para a posição selecionada
  const selectedPositionMatchDetails = useMemo(() => {
    if (!selectedTeamName || selectedPosition === null) return [];
    return filteredData.details.filter(d => d.TIME === selectedTeamName && parseInt(d.POS) === selectedPosition)
      .sort((a, b) => {
        const rdA = parseInt(a.RD.replace(/\D/g, '')) || 0;
        const rdB = parseInt(b.RD.replace(/\D/g, '')) || 0;
        if (rdA !== rdB) return rdA - rdB;
        return (parseInt(a.Q) || 0) - (parseInt(b.Q) || 0);
      });
  }, [filteredData.details, selectedTeamName, selectedPosition]);

  // Detalhes das partidas para o mapa selecionado
  const selectedMapMatchDetails = useMemo(() => {
    if (!selectedTeamName || !selectedMap) return [];
    return filteredData.details.filter(d => d.TIME === selectedTeamName && normalize(d.MAPA) === normalize(selectedMap))
      .sort((a, b) => {
        const rdA = parseInt(a.RD.replace(/\D/g, '')) || 0;
        const rdB = parseInt(b.RD.replace(/\D/g, '')) || 0;
        if (rdA !== rdB) return rdA - rdB;
        return (parseInt(a.Q) || 0) - (parseInt(b.Q) || 0);
      });
  }, [filteredData.details, selectedTeamName, selectedMap]);

  // Performance por Partida / Queda
  const dropStatsData = useMemo(() => {
      if (!selectedTeamName) return [];
      const stats = new Map<string, { q: string, pts: number, kills: number, matches: number }>();

      filteredData.details.filter(d => d.TIME === selectedTeamName).forEach(d => {
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
  }, [filteredData.details, selectedTeamName]);

  // Detalhes das partidas para a queda selecionada
  const selectedDropMatchDetails = useMemo(() => {
    if (!selectedTeamName || !selectedDrop) return [];
    return filteredData.details.filter(d => d.TIME === selectedTeamName && normalize(d.Q) === normalize(selectedDrop))
      .sort((a, b) => {
        const rdA = parseInt(a.RD.replace(/\D/g, '')) || 0;
        const rdB = parseInt(b.RD.replace(/\D/g, '')) || 0;
        return rdA - rdB;
      });
  }, [filteredData.details, selectedTeamName, selectedDrop]);

  // Performance por Mapa Completo
  const mapPerformanceData = useMemo(() => {
    if (!selectedTeamName) return [];
    const stats = new Map<string, { map: string, pts: number, ptsc: number, kills: number, matches: number, booyahs: number }>();
    
    filteredData.details.filter(d => d.TIME === selectedTeamName).forEach(d => {
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
  }, [filteredData.details, selectedTeamName]);

  // Abates por Safe
  const safeStatsData = useMemo(() => {
    if (!selectedTeamName) return [];
    const teamPlayers = new Set(filteredData.players.filter(p => p.TIME === selectedTeamName).map(p => normalize(p.PLAYER)));
    const safeCounts: Record<string, number> = {};

    filteredData.killFeed.forEach(k => {
        if (teamPlayers.has(normalize(k.PLAYER))) {
            const safe = k.SAFE || 'OUT';
            safeCounts[safe] = (safeCounts[safe] || 0) + 1;
        }
    });

    return Object.entries(safeCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [filteredData.killFeed, filteredData.players, selectedTeamName]);

  // Classificação por Mapa (Comparativo)
  const mapRankings = useMemo(() => {
    const maps = Array.from(new Set(filteredData.details.map(d => d.MAPA))).filter(Boolean) as string[];
    return maps.map(mapName => {
      const mapDetails = filteredData.details.filter(d => normalize(d.MAPA) === normalize(mapName));
      const stats = calculateTeamStats({ ...filteredData, details: mapDetails });
      
      // Aplicar Ordenação
      const sortedStats = [...stats].sort((a: any, b: any) => {
        const aValue = a[sortConfig.key] ?? 0;
        const bValue = b[sortConfig.key] ?? 0;
        if (sortConfig.direction === 'asc') return aValue > bValue ? 1 : -1;
        return aValue < bValue ? 1 : -1;
      });

      return { mapName, stats: sortedStats };
    });
  }, [filteredData, sortConfig]);

  const toggleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

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

  // Lista ordenada de todas as rodadas / dias
  const sortedRoundsList = useMemo(() => {
    const uniqueRounds = Array.from(new Set(data.details.map(d => d.RD))).filter(Boolean) as string[];
    return uniqueRounds.sort((a: string, b: string) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [data.details]);

  // Formata o cabeçalho da rodada para "Day X" se for numérico, correspondendo ao print do usuário
  const formatRoundHeader = (rd: string) => {
    const num = parseInt(rd.replace(/\D/g, ''));
    if (!isNaN(num)) {
      return `Day ${num}`;
    }
    return rd;
  };

  // Mapeamento de pontos por rodada e time
  const teamRoundPoints = useMemo(() => {
    const pointsMap: Record<string, Record<string, number>> = {};
    
    data.details.forEach(d => {
      const teamName = d.TIME;
      const round = d.RD;
      if (!teamName || !round) return;
      
      if (!pointsMap[teamName]) {
        pointsMap[teamName] = {};
      }
      const pts = parseInt(d.PTS) || 0;
      pointsMap[teamName][round] = (pointsMap[teamName][round] || 0) + pts;
    });
    
    return pointsMap;
  }, [data.details]);

  // Tendências de Rank baseadas no acumulado anterior ao último round
  const rankTrends = useMemo(() => {
    const trends: Record<string, { change: number; type: 'up' | 'down' | 'neutral' }> = {};
    
    if (sortedRoundsList.length <= 1) {
      return trends;
    }

    const penultimaRounds = sortedRoundsList.slice(0, -1);
    const prevTeamStats: Record<string, { pts: number; b: number; abts: number; name: string }> = {};

    data.details.forEach(row => {
      const teamName = row.TIME;
      if (!teamName || !row.RD || !penultimaRounds.includes(row.RD)) return;

      if (!prevTeamStats[teamName]) {
        prevTeamStats[teamName] = { pts: 0, b: 0, abts: 0, name: teamName };
      }
      const pStats = prevTeamStats[teamName];
      pStats.pts += parseInt(row.PTS) || 0;
      pStats.b += parseInt(row.B) || 0;
      pStats.abts += parseInt(row.ABTS) || 0;
    });

    const sortedPrevTeams = Object.values(prevTeamStats).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.b !== a.b) return b.b - a.b;
      return b.abts - a.abts;
    });

    filteredTeamStats.forEach((teamCurrent, currentIdx) => {
      const prevIdx = sortedPrevTeams.findIndex(t => t.name === teamCurrent.name);
      if (prevIdx === -1) {
        trends[teamCurrent.name] = { change: 0, type: 'neutral' };
      } else {
        const change = prevIdx - currentIdx; 
        if (change > 0) {
          trends[teamCurrent.name] = { change, type: 'up' };
        } else if (change < 0) {
          trends[teamCurrent.name] = { change: Math.abs(change), type: 'down' };
        } else {
          trends[teamCurrent.name] = { change: 0, type: 'neutral' };
        }
      }
    });

    return trends;
  }, [data.details, sortedRoundsList, filteredTeamStats]);

  // Rodadas jogadas pelo time selecionado
  const selectedTeamRounds = useMemo(() => {
    if (!selectedTeamName) return [];
    
    const roundsMap: Record<string, {
      round: string;
      confrontos: string[];
      matches: MatchDetails[];
      pts: number;
      ptsc: number;
      abts: number;
      booyahs: number;
    }> = {};

    data.details.forEach(d => {
      if (normalize(d.TIME) !== normalize(selectedTeamName)) return;
      const rd = d.RD;
      if (!rd) return;

      if (!roundsMap[rd]) {
        roundsMap[rd] = {
          round: rd,
          confrontos: [],
          matches: [],
          pts: 0,
          ptsc: 0,
          abts: 0,
          booyahs: 0
        };
      }

      const rdData = roundsMap[rd];
      rdData.matches.push(d);
      rdData.pts += parseInt(d.PTS) || 0;
      rdData.ptsc += parseInt(d.PTSC) || 0;
      rdData.abts += parseInt(d.ABTS) || 0;
      if (parseInt(d.B) > 0) {
        rdData.booyahs += 1;
      }
      if (d.CONFRONTO && !rdData.confrontos.includes(d.CONFRONTO)) {
        rdData.confrontos.push(d.CONFRONTO);
      }
    });

    return Object.values(roundsMap).sort((a, b) => {
      const numA = parseInt(a.round.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.round.replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.round.localeCompare(b.round);
    });
  }, [data.details, selectedTeamName]);

  const teamsList = useMemo(() => {
    return filteredTeamStats.map(t => ({ name: t.name, image: t.image, grupo: t.grupo, pts: t.pts })).sort((a,b) => a.name.localeCompare(b.name));
  }, [filteredTeamStats]);

  // Análise de Mapas por Queda
  const mapAnalysisData = useMemo(() => {
    const analysis: Record<string, Record<string, number>> = {};
    const totalsPerDrop: Record<string, number> = {};
    const seenMatches = new Set<string>();

    data.details.forEach(d => {
      const matchKey = `${d.CONFRONTO}-${d.RD}-${d.Q}`;
      if (seenMatches.has(matchKey)) return;
      seenMatches.add(matchKey);

      const drop = d.Q || '1';
      const map = d.MAPA;
      if (!map || !drop) return;

      if (!analysis[drop]) analysis[drop] = {};
      if (!totalsPerDrop[drop]) totalsPerDrop[drop] = 0;

      analysis[drop][map] = (analysis[drop][map] || 0) + 1;
      totalsPerDrop[drop]++;
    });

    return { analysis, totalsPerDrop };
  }, [data.details]);

  // Análise de Fechamento de Safe (Onde Fechou)
  const safeAnalysisData = useMemo(() => {
    const analysis: Record<string, { totals: number, locals: Record<string, number> }> = {};
    const seenMatches = new Set<string>();

    data.details.forEach(d => {
      const matchKey = `${d.CONFRONTO}-${d.RD}-${d.Q}`;
      if (seenMatches.has(matchKey)) return;
      seenMatches.add(matchKey);

      const map = d.MAPA;
      const local = d.ONDE_FECHOU;
      if (!map || !local) return;

      if (!analysis[map]) analysis[map] = { totals: 0, locals: {} };
      analysis[map].locals[local] = (analysis[map].locals[local] || 0) + 1;
      analysis[map].totals++;
    });

    return analysis;
  }, [data.details]);

  const handlePlayerClick = (playerName: string) => {
    navigate('/players', { state: { player: playerName } });
  };

  if (data.loading) return <div className="text-center py-20 animate-pulse text-yellow-500 font-bold uppercase italic tracking-widest">Processando Equipes...</div>;

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center no-print">
            <FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />
            
            <div className="flex items-center gap-4">
                {(!selectedTeamName || activeTab === 'comparison' || activeTab === 'teamRounds') && (
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
                        <button 
                            onClick={() => setActiveTab('mapAnalysis')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'mapAnalysis' ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            <BarChart3 size={14} /> Análise Mapas
                        </button>
                        <button 
                            onClick={() => setActiveTab('safeAnalysis')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'safeAnalysis' ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            <MapPin size={14} /> Onde Fechou
                        </button>
                        <button 
                            onClick={() => setActiveTab('comparison')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'comparison' ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Scale size={14} /> Comparar
                        </button>
                        <button 
                            onClick={() => setActiveTab('pointsTable')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'pointsTable' ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            <ListOrdered size={14} /> Tabela de Pontos
                        </button>
                        <button 
                            onClick={() => setActiveTab('teamRounds')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'teamRounds' ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Calendar size={14} /> Rodadas por Time
                        </button>
                    </div>
                )}
                
                {selectedTeamName && activeTab !== 'comparison' && activeTab !== 'teamRounds' && (
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

        {selectedTeamName && selectedTeamStats && activeTab !== 'comparison' && activeTab !== 'teamRounds' ? (
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
                                {(() => {
                                    const char = getTeamCharacteristic(selectedTeamStats.percentAbts, selectedTeamStats.percentPos);
                                    return (
                                        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${char.bg} ${char.border} ${char.color} text-[9px] font-black uppercase tracking-widest shadow-lg`}>
                                            {char.icon}
                                            {char.label}
                                        </div>
                                    );
                                })()}
                             </div>
                             <h1 className="text-5xl md:text-7xl font-black italic text-white tracking-tighter uppercase leading-none">{selectedTeamStats.name}</h1>
                             <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                 <StatBadge label="PONTOS" value={selectedTeamStats.pts} color="text-yellow-500" />
                                 <StatBadge label="VITÓRIAS" value={selectedTeamStats.b} color="text-orange-500" />
                                 <StatBadge label="KILLS" value={selectedTeamStats.abts} color="text-red-500" />
                                 <StatBadge label="MÉDIA EQUIPE" value={selectedTeamStats.avgAbts} color="text-blue-500" />
                                 <button 
                                     onClick={() => setActiveTab('comparison')}
                                     className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-yellow-500 hover:text-black text-yellow-500 hover:scale-105 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border border-white/5"
                                 >
                                     <Scale size={16} /> Comparar este Time
                                 </button>
                             </div>
                             
                             <div className="mt-6 max-w-md">
                                 <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2 italic">
                                     <span className="text-red-500 flex items-center gap-1"><Flame size={10}/> ABATES ({selectedTeamStats.percentAbts}%)</span>
                                     <span className="text-yellow-500 flex items-center gap-1">POSIÇÃO ({selectedTeamStats.percentPos}%) <Target size={10}/></span>
                                 </div>
                                 <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden flex border border-white/5 shadow-inner">
                                     <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all duration-1000" style={{ width: `${selectedTeamStats.percentAbts}%` }}></div>
                                     <div className="h-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)] transition-all duration-1000" style={{ width: `${selectedTeamStats.percentPos}%` }}></div>
                                 </div>
                                 <p className="text-[8px] text-gray-500 mt-2 font-bold uppercase tracking-widest italic leading-relaxed">
                                     * Distribuição baseada na origem dos pontos totais da equipe.
                                 </p>
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
                                                <XAxis dataKey="label" stroke="#444" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                                                <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                                                <Tooltip 
                                                    cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '15px' }}
                                                    labelStyle={{ color: '#EAB308', fontWeight: 'bold', marginBottom: '5px' }}
                                                />
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
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {mapRankings.map((m, idx) => (
                        <div key={idx} className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl flex flex-col">
                            <div className="bg-gradient-to-r from-blue-900/20 to-black px-4 py-3 border-b border-gray-800 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-600/20 rounded-xl text-blue-500">
                                        <MapIcon size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">{m.mapName}</h3>
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Performance por Território</p>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full">
                                <table className="w-full text-left border-collapse table-fixed">
                                    <thead className="bg-black/40 text-[8px] text-gray-500 uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="px-2 py-3 w-8 text-center">#</th>
                                            <th className="px-2 py-3 w-32 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('name')}>
                                                Equipe {sortConfig.key === 'name' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                                            </th>
                                            <th className="px-1 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('s')}>
                                                S {sortConfig.key === 's' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                                            </th>
                                            <th className="px-1 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('pts')}>
                                                PTS {sortConfig.key === 'pts' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                                            </th>
                                            <th className="px-1 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('b')}>
                                                B {sortConfig.key === 'b' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                                            </th>
                                            <th className="px-1 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('abts')}>
                                                K {sortConfig.key === 'abts' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                                            </th>
                                            <th className="px-1 py-3 text-center cursor-pointer hover:text-white transition-colors text-[7px]" onClick={() => toggleSort('avgPts')}>
                                                AVG P {sortConfig.key === 'avgPts' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                                            </th>
                                            <th className="px-1 py-3 text-center cursor-pointer hover:text-white transition-colors text-[7px]" onClick={() => toggleSort('avgAbts')}>
                                                AVG K {sortConfig.key === 'avgAbts' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                                            </th>
                                            <th className="px-1 py-3 text-center cursor-pointer hover:text-white transition-colors text-[7px]" onClick={() => toggleSort('avgPtsc')}>
                                                AVG POS {sortConfig.key === 'avgPtsc' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/30">
                                        {m.stats.slice(0, 10).map((team, tIdx) => (
                                            <tr key={tIdx} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setFilters(prev => ({...prev, team: [team.name]}))}>
                                                <td className="px-2 py-2 text-center font-mono text-[9px] text-gray-600">{tIdx + 1}</td>
                                                <td className="px-2 py-2">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <div className="w-5 h-5 bg-black rounded border border-gray-800 p-0.5 flex-shrink-0">
                                                            {team.image ? <img src={team.image} alt={team.name} className="w-full h-full object-contain" /> : <Shield size={10} className="text-gray-700" />}
                                                        </div>
                                                        <span className="text-[9px] font-black text-white uppercase italic truncate">{team.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-1 py-2 text-center font-black text-gray-500 italic text-[10px]">{team.s}</td>
                                                <td className="px-1 py-2 text-center font-black text-yellow-500 italic text-[10px]">{team.pts}</td>
                                                <td className="px-1 py-2 text-center font-black text-orange-500 italic text-[10px]">{team.b}</td>
                                                <td className="px-1 py-2 text-center font-black text-red-500 italic text-[10px]">{team.abts}</td>
                                                <td className="px-1 py-2 text-center font-black text-yellow-400/80 italic text-[9px]">{team.avgPts}</td>
                                                <td className="px-1 py-2 text-center font-black text-red-400/80 italic text-[9px]">{team.avgAbts}</td>
                                                <td className="px-1 py-2 text-center font-black text-blue-400/80 italic text-[9px]">{team.avgPtsc}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ) : activeTab === 'mapAnalysis' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(dropNum => {
                        const dropStr = dropNum.toString();
                        const dropData: Record<string, number> = mapAnalysisData.analysis[dropStr] || {};
                        const total: number = mapAnalysisData.totalsPerDrop[dropStr] || 0;
                        
                        // Sort maps by frequency
                        const sortedMaps = Object.entries(dropData).sort((a, b) => (b[1] as number) - (a[1] as number));

                        return (
                            <div key={dropNum} className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-xl flex flex-col">
                                <div className="bg-gradient-to-r from-yellow-500/10 to-transparent p-5 border-b border-gray-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-yellow-500 text-black rounded-lg flex items-center justify-center font-black italic">
                                            {dropNum}º
                                        </div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Queda</h3>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">{total} SALAS TOTAIS</span>
                                </div>
                                <div className="p-6 space-y-4 flex-grow">
                                    {sortedMaps.length > 0 ? (
                                        sortedMaps.map(([mapName, count]) => {
                                            const percentage = total > 0 ? (((count as number) / total) * 100).toFixed(1) : "0.0";
                                            return (
                                                <div key={mapName} className="space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-xs font-black text-white uppercase italic">{mapName}</span>
                                                        <div className="text-right">
                                                            <span className="text-[10px] text-yellow-500 font-black">{percentage}%</span>
                                                            <span className="text-[9px] text-gray-500 font-bold ml-2 uppercase">({count}x)</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full" 
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-8 text-gray-600 text-[10px] font-bold uppercase tracking-widest italic">
                                            Sem dados para esta queda
                                        </div>
                                    )}
                                </div>
                                {sortedMaps.length > 0 && (
                                    <div className="p-4 bg-black/40 border-t border-gray-800/50">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            <TrendingUp size={12} className="text-green-500" />
                                            Chance para próxima: 
                                            <span className="text-white ml-auto">
                                                {sortedMaps[0][0]} ({total > 0 ? (((sortedMaps[0][1] as number) / total) * 100).toFixed(0) : "0"}%)
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        ) : activeTab === 'safeAnalysis' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(safeAnalysisData).map(([mapName, entry]) => {
                        const data = entry as { totals: number, locals: Record<string, number> };
                        const sortedLocals = Object.entries(data.locals).sort((a, b) => (b[1] as number) - (a[1] as number));
                        
                        return (
                            <div key={mapName} className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-xl flex flex-col">
                                <div className="bg-gradient-to-r from-red-500/10 to-transparent p-5 border-b border-gray-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center">
                                            <Target size={18} />
                                        </div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">{mapName}</h3>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">{data.totals} FECHAMENTOS</span>
                                </div>
                                <div className="p-6 space-y-4 flex-grow">
                                    {sortedLocals.map(([local, count]) => {
                                        const percentage = data.totals > 0 ? (((count as number) / data.totals) * 100).toFixed(1) : "0.0";
                                        return (
                                            <div key={local} className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs font-black text-white uppercase italic">{local}</span>
                                                    <div className="text-right">
                                                        <span className="text-[10px] text-red-500 font-black">{percentage}%</span>
                                                        <span className="text-[9px] text-gray-500 font-bold ml-2 uppercase">({count}x)</span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" 
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="p-4 bg-black/40 border-t border-gray-800/50">
                                    <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                        <MapPin size={12} className="text-red-500" />
                                        Hot Zone: 
                                        <span className="text-white ml-auto italic">
                                            {sortedLocals[0][0]}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {Object.keys(safeAnalysisData).length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <p className="text-gray-500 font-black uppercase tracking-widest italic animate-pulse">
                                Nenhum dado de fechamento de safe encontrado...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        ) : activeTab === 'comparison' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                     {/* Team A Selection */}
                     <div className="w-full md:w-80 p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                         <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] block">Equipe A</label>
                         <select 
                             value={filters.team[0] || ''} 
                             onChange={(e) => setFilters(prev => ({...prev, team: e.target.value ? [e.target.value] : []}))}
                             className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white text-xs font-black uppercase tracking-widest outline-none focus:border-yellow-500 transition-all"
                         >
                             <option value="" disabled>Selecione...</option>
                             {filterOptions.teams.map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                     </div>

                     <div className="relative group">
                         <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-xl group-hover:bg-yellow-500/30 transition-all animate-pulse" />
                         <div className="relative w-14 h-14 bg-yellow-500 rounded-full flex items-center justify-center text-black font-black italic shadow-2xl z-10 border-4 border-black text-xl">VS</div>
                     </div>

                     {/* Team B Selection */}
                     <div className="w-full md:w-80 p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                         <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] block">Equipe B</label>
                         <select 
                             value={compareTeamB || ''} 
                             onChange={(e) => setCompareTeamB(e.target.value || null)}
                             className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white text-xs font-black uppercase tracking-widest outline-none focus:border-yellow-500 transition-all"
                         >
                             <option value="" disabled>Selecione...</option>
                             {filterOptions.teams.map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                     </div>
                </div>

                {filters.team[0] && compareTeamB ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {[filters.team[0], compareTeamB].map((teamName, idx) => {
                                const stats = filteredTeamStats.find(s => s.name === teamName);
                                if (!stats) return null;
                                return (
                                    <div key={teamName} className={`bg-[#1a1a1a] rounded-[40px] p-8 border ${idx === 0 ? 'border-yellow-500/20' : 'border-blue-500/20'} shadow-2xl relative overflow-hidden group`}>
                                        <div className={`absolute top-0 right-0 w-64 h-64 ${idx === 0 ? 'bg-yellow-500/5' : 'bg-blue-500/5'} blur-[100px] -mr-32 -mt-32 rounded-full`} />
                                        
                                        <div className="flex items-center gap-6 mb-12 relative">
                                            <div className={`w-24 h-24 bg-black rounded-3xl flex items-center justify-center border ${idx === 0 ? 'border-yellow-500/40' : 'border-blue-500/40'} p-4 shadow-2xl group-hover:scale-105 transition-transform`}>
                                                {stats.image ? <img src={stats.image} alt={stats.name} className="w-full h-full object-contain" /> : <Shield className="text-gray-800" size={40} />}
                                            </div>
                                            <div>
                                                <h3 className="text-4xl font-black italic text-white uppercase tracking-tighter mb-2">{stats.name}</h3>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-4 py-1.5 rounded-full ${idx === 0 ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'} text-[10px] font-black uppercase tracking-widest`}>
                                                        {stats.grupo || 'SEM GRUPO'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{stats.s} QUEDAS JOGADAS</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mb-8">
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">PTS TOTAL</span>
                                                <span className={`text-2xl font-black italic ${idx === 0 ? 'text-yellow-500' : 'text-blue-400'}`}>{stats.pts}</span>
                                            </div>
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">BOOYAHS</span>
                                                <span className={`text-2xl font-black italic ${idx === 0 ? 'text-orange-500' : 'text-blue-400'}`}>{stats.b}</span>
                                            </div>
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">KILLS</span>
                                                <span className="text-2xl font-black italic text-red-500">{stats.abts}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-2">
                                                <span className="text-gray-500">Média Pts/Queda</span>
                                                <span className="text-white">{stats.avgPts}</span>
                                            </div>
                                            <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                                                <div className={`h-full ${idx === 0 ? 'bg-yellow-500' : 'bg-blue-500'} rounded-full`} style={{ width: `${Math.min((stats.avgPts / 20) * 100, 100)}%` }} />
                                            </div>

                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-2 pt-2">
                                                <span className="text-gray-500">Média Kills/Queda</span>
                                                <span className="text-white">{stats.avgAbts}</span>
                                            </div>
                                            <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                                                <div className={`h-full bg-red-500 rounded-full`} style={{ width: `${Math.min((stats.avgAbts / 15) * 100, 100)}%` }} />
                                            </div>
                                            
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-2 pt-2">
                                                <span className="text-gray-500">% Pontos por Posição</span>
                                                <span className="text-white">{stats.percentPos}%</span>
                                            </div>
                                            <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${stats.percentPos}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Comparison per Map */}
                        <div className="space-y-6">
                            <div className="flex flex-col items-center">
                                <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-4" />
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] italic">Comparativo por Território</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {comparisonMapStats.map((m, idx) => (
                                    <div key={idx} className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-xl flex flex-col">
                                        <div className="bg-black/40 p-4 border-b border-gray-800 flex justify-center items-center gap-3">
                                            <MapIcon size={14} className="text-gray-500" />
                                            <span className="text-xs font-black text-white uppercase italic tracking-widest">{m.mapName}</span>
                                        </div>
                                        <div className="p-5 flex-grow">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="text-left">
                                                    <span className="text-[8px] text-yellow-500 font-black block leading-none mb-1">TEAM A</span>
                                                    <span className="text-[10px] text-white font-black truncate max-w-[80px] block">{filters.team[0]}</span>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-[8px] font-black text-gray-500">VS</div>
                                                <div className="text-right">
                                                    <span className="text-[8px] text-blue-500 font-black block leading-none mb-1">TEAM B</span>
                                                    <span className="text-[10px] text-white font-black truncate max-w-[80px] block">{compareTeamB}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {/* PTS Comparison */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[8px] font-black uppercase text-gray-500">
                                                        <span>PTS Total: {m.teamA.pts}</span>
                                                        <span>{m.teamB.pts}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-black rounded-full overflow-hidden flex">
                                                        <div className="h-full bg-yellow-500" style={{ width: `${(m.teamA.pts + m.teamB.pts) > 0 ? (m.teamA.pts / (m.teamA.pts + m.teamB.pts)) * 100 : 50}%` }} />
                                                        <div className="h-full bg-blue-500" style={{ width: `${(m.teamA.pts + m.teamB.pts) > 0 ? (m.teamB.pts / (m.teamA.pts + m.teamB.pts)) * 100 : 50}%` }} />
                                                    </div>
                                                </div>

                                                {/* KILLS Comparison */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[8px] font-black uppercase text-gray-500 border-t border-white/5 pt-1">
                                                        <span>Kills: {m.teamA.abts}</span>
                                                        <span>{m.teamB.abts}</span>
                                                    </div>
                                                    <div className="h-1 bg-black rounded-full overflow-hidden flex">
                                                        <div className="h-full bg-red-600" style={{ width: `${(m.teamA.abts + m.teamB.abts) > 0 ? (m.teamA.abts / (m.teamA.abts + m.teamB.abts)) * 100 : 50}%` }} />
                                                        <div className="h-full bg-red-400" style={{ width: `${(m.teamA.abts + m.teamB.abts) > 0 ? (m.teamB.abts / (m.teamA.abts + m.teamB.abts)) * 100 : 50}%` }} />
                                                    </div>
                                                </div>

                                                {/* POS PTS Comparison */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[8px] font-black uppercase text-gray-500 border-t border-white/5 pt-1">
                                                        <span>Pts Pos: {m.teamA.ptsc}</span>
                                                        <span>{m.teamB.ptsc}</span>
                                                    </div>
                                                    <div className="h-1 bg-black rounded-full overflow-hidden flex">
                                                        <div className="h-full bg-orange-600" style={{ width: `${(m.teamA.ptsc + m.teamB.ptsc) > 0 ? (m.teamA.ptsc / (m.teamA.ptsc + m.teamB.ptsc)) * 100 : 50}%` }} />
                                                        <div className="h-full bg-orange-400" style={{ width: `${(m.teamA.ptsc + m.teamB.ptsc) > 0 ? (m.teamB.ptsc / (m.teamA.ptsc + m.teamB.ptsc)) * 100 : 50}%` }} />
                                                    </div>
                                                </div>

                                                {/* Averages Grid */}
                                                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-800">
                                                    <div className="bg-black/40 rounded-xl p-2 text-center">
                                                        <span className="text-[7px] text-gray-500 font-bold block mb-1">AVG PTS (A vs B)</span>
                                                        <div className="flex justify-center items-center gap-1">
                                                            <span className="text-[9px] font-black text-yellow-500 italic">{m.teamA.avgPts}</span>
                                                            <span className="text-[7px] text-gray-700">|</span>
                                                            <span className="text-[9px] font-black text-blue-400 italic">{m.teamB.avgPts}</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-black/40 rounded-xl p-2 text-center">
                                                        <span className="text-[7px] text-gray-500 font-bold block mb-1">AVG KLLS (A vs B)</span>
                                                        <div className="flex justify-center items-center gap-1">
                                                            <span className="text-[9px] font-black text-red-500 italic">{m.teamA.avgAbts}</span>
                                                            <span className="text-[7px] text-gray-700">|</span>
                                                            <span className="text-[9px] font-black text-red-400 italic">{m.teamB.avgAbts}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Comparison Table for detailed metrics */}
                        <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl no-print">
                            <div className="bg-black/40 px-8 py-6 border-b border-gray-800 flex items-center justify-between">
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Métricas Diretas</h3>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <tbody className="divide-y divide-gray-800/30">
                                        {[
                                            { label: 'Total de Pontos', key: 'pts', color: 'text-yellow-500' },
                                            { label: 'Média de Pontos', key: 'avgPts', color: 'text-white' },
                                            { label: 'Total de Booyahs', key: 'b', color: 'text-orange-500' },
                                            { label: 'Total de Abates', key: 'abts', color: 'text-red-500' },
                                            { label: 'Média de Abates', key: 'avgAbts', color: 'text-white' },
                                            { label: 'Média Pts Posição', key: 'avgPtsc', color: 'text-blue-400' },
                                            { label: '% Abates no Score', key: 'percentAbts', color: 'text-gray-400' },
                                            { label: '% Posição no Score', key: 'percentPos', color: 'text-gray-400' },
                                        ].map((row, rIdx) => {
                                            const valA = filteredTeamStats.find(s => s.name === filters.team[0])?.[row.key as keyof TeamStats] as number || 0;
                                            const valB = filteredTeamStats.find(s => s.name === compareTeamB)?.[row.key as keyof TeamStats] as number || 0;
                                            const isBetterA = valA > valB;
                                            const isBetterB = valB > valA;

                                            return (
                                                <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className={`px-8 py-4 text-center font-black ${isBetterA ? 'text-yellow-500 scale-110' : 'text-gray-600'} transition-all`}>
                                                        {valA}{(row.key.includes('percent')) ? '%' : ''}
                                                    </td>
                                                    <td className="px-8 py-4 text-center text-[10px] font-black text-white uppercase tracking-widest bg-black/20 italic">
                                                        {row.label}
                                                    </td>
                                                    <td className={`px-8 py-4 text-center font-black ${isBetterB ? 'text-blue-500 scale-110' : 'text-gray-600'} transition-all`}>
                                                        {valB}{(row.key.includes('percent')) ? '%' : ''}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#1a1a1a] rounded-[50px] border-2 border-dashed border-gray-800 py-32 flex flex-col items-center justify-center space-y-6">
                         <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center text-gray-700">
                             <Scale size={40} />
                         </div>
                         <div className="text-center">
                             <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Modo de Comparação</h3>
                             <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto">Selecione duas equipes nos campos acima para comparar estatísticas head-to-head.</p>
                         </div>
                    </div>
                )}
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
        ) : activeTab === 'pointsTable' ? (
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-gray-800 shadow-xl overflow-hidden">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-widest flex items-center gap-3">
                                <ListOrdered size={20} className="text-yellow-500"/> TABELA DE PONTOS POR RODADA
                            </h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Classificação Geral & evolução de pontos de todos os times</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                                <span className="w-2 h-2 rounded bg-blue-500 inline-block shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span> LÍDER (1º)
                            </span>
                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                                <span className="w-2 h-2 rounded bg-[#10b981] inline-block shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> FINALISTAS (2-12º)
                            </span>
                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                                <span className="w-2 h-2 rounded bg-red-700 inline-block shadow-[0_0_8px_rgba(239,68,68,0.4)]"></span> REBAIXAMENTO (13º+)
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto w-full rounded-2xl border border-gray-800/60 shadow-inner scrollbar-thin scrollbar-thumb-gray-800">
                        <table className="w-full text-left border-collapse table-auto whitespace-nowrap">
                            <thead className="bg-[#0f0f0f] border-b border-gray-800 text-gray-400 text-[10px] uppercase font-black tracking-wider">
                                <tr>
                                    <th className="px-4 py-4 text-center w-16">#</th>
                                    <th className="px-4 py-4 text-center w-14">TEND</th>
                                    <th className="px-4 py-4 min-w-[200px]">Equipe</th>
                                    <th className="px-4 py-4 text-center bg-yellow-900/10 text-yellow-500 w-24">PTS</th>
                                    {sortedRoundsList.map(round => (
                                        <th key={round} className="px-4 py-4 text-center min-w-[80px] font-bold text-gray-300">
                                            {formatRoundHeader(round)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/40">
                                {filteredTeamStats.map((team, index) => {
                                    const rank = index + 1;
                                    const trend = rankTrends[team.name] || { change: 0, type: 'neutral' };
                                    
                                    // Determinar a cor do badge de rank do print do Free Fire
                                    let rankBadgeClass = "w-6 h-6 rounded flex items-center justify-center font-black text-xs ";
                                    if (rank === 1) {
                                        rankBadgeClass += "bg-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.6)]";
                                    } else if (rank <= 12) {
                                        rankBadgeClass += "bg-[#10b981] text-black shadow-[0_0_8px_rgba(16,185,129,0.5)]";
                                    } else {
                                        rankBadgeClass += "bg-red-950/80 text-white border border-red-800/30";
                                    }

                                    // Determinar as bordas esquerdas das divisões
                                    let rowBorderClass = "hover:bg-white/[0.03] transition-colors ";
                                    if (rank <= 12) {
                                        rowBorderClass += "border-l-[4px] border-[#10b981] bg-emerald-500/[0.01]";
                                    } else {
                                        rowBorderClass += "border-l-[4px] border-red-700 bg-red-500/[0.01]";
                                    }

                                    return (
                                        <tr key={team.name} className={rowBorderClass}>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center items-center">
                                                    <span className={rankBadgeClass}>{rank}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center font-bold text-xs">
                                                    {trend.type === 'up' && (
                                                        <span className="text-emerald-400 flex items-center gap-0.5">
                                                            <ArrowUp size={12} className="stroke-[3]" /> {trend.change}
                                                        </span>
                                                    )}
                                                    {trend.type === 'down' && (
                                                        <span className="text-red-500 flex items-center gap-0.5">
                                                            <ArrowDown size={12} className="stroke-[3]" /> {trend.change}
                                                        </span>
                                                    )}
                                                    {trend.type === 'neutral' && (
                                                        <span className="text-gray-600 font-bold">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-black border border-gray-800 p-1 flex-shrink-0 flex items-center justify-center">
                                                        {team.image ? (
                                                            <img src={team.image} alt={team.name} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <Shield size={16} className="text-gray-700" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black uppercase italic tracking-tight">{team.name}</span>
                                                        {team.grupo && (
                                                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{team.grupo}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center font-black text-sm italic text-yellow-500 bg-yellow-950/10">
                                                {team.pts}
                                            </td>
                                            {sortedRoundsList.map(round => {
                                                const pts = teamRoundPoints[team.name]?.[round];
                                                const isExistent = pts !== undefined;
                                                return (
                                                    <td key={round} className="px-4 py-3 text-center font-bold text-xs font-mono">
                                                        {isExistent ? (
                                                            <span className="text-white font-black">{pts}</span>
                                                        ) : (
                                                            <span className="text-gray-700 font-bold">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        ) : activeTab === 'teamRounds' ? (
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-gray-800 shadow-xl overflow-hidden">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-widest flex items-center gap-3">
                                <Calendar size={20} className="text-yellow-500"/> HISTÓRICO DE RODADAS POR EQUIPE
                            </h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
                                Visualize quais rodadas uma equipe jogou e os detalhes de sua performance em cada queda
                            </p>
                        </div>
                    </div>

                    {/* Seleção de equipe */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-black/40 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 flex-wrap">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Selecionar Equipe:</label>
                            <select 
                                value={selectedTeamName || ''} 
                                onChange={(e) => setFilters(prev => ({ ...prev, team: e.target.value ? [e.target.value] : [] }))}
                                className="bg-black text-white text-xs font-black uppercase tracking-wider py-2 px-4 rounded-xl border border-gray-800 focus:border-yellow-500 outline-none cursor-pointer"
                            >
                                <option value="">-- Escolha uma Equipe --</option>
                                {teamsList.map(t => (
                                    <option key={t.name} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        {selectedTeamName && (
                            <button 
                                onClick={() => setFilters(prev => ({ ...prev, team: [] }))}
                                className="text-[10px] font-black text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-xl border border-red-500/20 uppercase tracking-widest transition-colors scale-100 hover:scale-[1.02] active:scale-95"
                            >
                                Limpar Seleção
                            </button>
                        )}
                    </div>

                    {selectedTeamName && selectedTeamStats ? (
                        <div className="space-y-6">
                            {/* Card de Resumo do Time Selecionado */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                                    <div className="w-14 h-14 bg-black rounded-xl border border-gray-800 p-2 flex items-center justify-center relative shrink-0">
                                        {selectedTeamStats.image ? (
                                            <img src={selectedTeamStats.image} alt={selectedTeamStats.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <Shield size={24} className="text-gray-700" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest block">EQUIPE</span>
                                        <h4 className="text-lg font-black italic uppercase leading-none text-white truncate">{selectedTeamStats.name}</h4>
                                        {selectedTeamStats.grupo && (
                                            <span className="text-[8px] text-yellow-500 font-bold uppercase tracking-widest mt-1 block">{selectedTeamStats.grupo}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 text-center flex flex-col justify-center">
                                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest block mb-1">PONTOS TOTAIS</span>
                                    <span className="text-2xl font-black italic leading-none text-yellow-500">{selectedTeamStats.pts}</span>
                                </div>
                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 text-center flex flex-col justify-center">
                                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest block mb-1">ABATES (KILLS)</span>
                                    <span className="text-2xl font-black italic leading-none text-red-500">{selectedTeamStats.abts}</span>
                                </div>
                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 text-center flex flex-col justify-center">
                                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest block mb-1">BOOYAHS (VITÓRIAS)</span>
                                    <span className="text-2xl font-black italic leading-none text-orange-500">{selectedTeamStats.b}</span>
                                </div>
                            </div>

                            {/* Lista de Rodadas */}
                            <h4 className="text-white font-black uppercase tracking-widest text-xs mt-8 mb-4 border-l-2 border-yellow-500 pl-3">
                                RODADAS DISPUTADAS ({selectedTeamRounds.length})
                            </h4>

                            <div className="space-y-4">
                                {selectedTeamRounds.map((rdData) => (
                                    <div key={rdData.round} className="bg-black/30 rounded-2xl border border-gray-800 overflow-hidden shadow-lg">
                                        {/* Cabeçalho da Rodada */}
                                        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141414] border-b border-gray-800">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center font-black text-yellow-500 text-sm">
                                                    RD
                                                </div>
                                                <div>
                                                    <h5 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                                        RODADA {rdData.round}
                                                    </h5>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                        <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Confrontos:</span>
                                                        {rdData.confrontos.map(conf => (
                                                            <span key={conf} className="bg-white/5 border border-white/5 text-[8px] font-black uppercase text-gray-400 px-2 py-0.5 rounded">
                                                                {conf}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="text-center bg-black/60 px-3 py-1.5 rounded-xl border border-white/5 min-w-[70px]">
                                                    <span className="block text-[7px] text-gray-500 font-black uppercase tracking-widest">Pontos</span>
                                                    <span className="text-xs font-black text-yellow-500 leading-none mt-1 inline-block">{rdData.pts}</span>
                                                </div>
                                                <div className="text-center bg-black/60 px-3 py-1.5 rounded-xl border border-white/5 min-w-[70px]">
                                                    <span className="block text-[7px] text-gray-500 font-black uppercase tracking-widest">Kills</span>
                                                    <span className="text-xs font-black text-red-500 leading-none mt-1 inline-block">{rdData.abts}</span>
                                                </div>
                                                <div className="text-center bg-black/60 px-3 py-1.5 rounded-xl border border-white/5 min-w-[70px]">
                                                    <span className="block text-[7px] text-gray-500 font-black uppercase tracking-widest">Posição</span>
                                                    <span className="text-xs font-black text-blue-400 leading-none mt-1 inline-block">{rdData.ptsc}</span>
                                                </div>
                                                <div className="text-center bg-black/60 px-3 py-1.5 rounded-xl border border-white/5 min-w-[70px]">
                                                    <span className="block text-[7px] text-gray-500 font-black uppercase tracking-widest">Booyahs</span>
                                                    <span className="text-xs font-black text-orange-500 leading-none mt-1 inline-block">{rdData.booyahs}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quedas Jogadas */}
                                        <div className="p-4 overflow-x-auto w-full">
                                            <table className="w-full text-left border-collapse table-auto whitespace-nowrap">
                                                <thead className="bg-black/50 text-gray-500 text-[8px] uppercase font-black tracking-widest border-b border-gray-800">
                                                    <tr>
                                                        <th className="px-4 py-2.5">Queda</th>
                                                        <th className="px-4 py-2.5">Mapa</th>
                                                        <th className="px-4 py-2.5 text-center">Posição</th>
                                                        <th className="px-4 py-2.5 text-center text-yellow-500">Pontos</th>
                                                        <th className="px-4 py-2.5 text-center text-orange-500">Pts Pos</th>
                                                        <th className="px-4 py-2.5 text-center text-red-500">Abates</th>
                                                        <th className="px-4 py-2.5 text-center">Booyah</th>
                                                        <th className="px-4 py-2.5">Onde Fechou</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-800/30 text-xs">
                                                    {rdData.matches.map((m, mIdx) => (
                                                        <tr key={mIdx} className="hover:bg-white/[0.02] transition-colors">
                                                            <td className="px-4 py-3 font-semibold text-gray-400">Queda {m.Q}</td>
                                                            <td className="px-4 py-3 font-bold text-white uppercase italic tracking-wider text-[10px]">{m.MAPA}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black italic text-xs border ${parseInt(m.POS) === 1 ? 'bg-yellow-500 text-black border-yellow-600' : 'bg-gray-950 text-gray-400 border-gray-800'}`}>
                                                                    {m.POS}º
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center font-black text-yellow-500">{m.PTS}</td>
                                                            <td className="px-4 py-3 text-center font-black text-orange-400">{m.PTSC}</td>
                                                            <td className="px-4 py-3 text-center font-black text-red-500">{m.ABTS}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                {parseInt(m.B) > 0 ? (
                                                                    <span className="bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black text-[8px] uppercase tracking-tighter">BOOYAH</span>
                                                                ) : (
                                                                    <span className="text-gray-700 font-bold">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {m.ONDE_FECHOU ? (
                                                                    <span className="bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-red-500/20 shadow-md">
                                                                        {m.ONDE_FECHOU}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-600 font-bold text-[10px]">-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                                {selectedTeamRounds.length === 0 && (
                                    <div className="py-12 text-center text-[10px] text-gray-600 font-black uppercase italic tracking-widest bg-black/10 rounded-2xl border border-dashed border-gray-800">
                                        Nenhuma rodada encontrada para esta equipe no momento.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center py-12 bg-black/20 rounded-3xl border border-dashed border-gray-800">
                                <Calendar size={40} className="text-yellow-500 mx-auto opacity-70 mb-4" />
                                <h4 className="text-white font-black uppercase italic tracking-widest text-sm">Nenhuma Equipe Selecionada</h4>
                                <p className="text-xs text-gray-500 font-medium mt-1">Escolha uma equipe abaixo ou na barra superior para listar suas rodadas.</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {teamsList.map(t => (
                                    <div 
                                        key={t.name}
                                        onClick={() => setFilters(prev => ({ ...prev, team: [t.name] }))}
                                        className="bg-black/30 rounded-2xl p-4 border border-gray-800/80 hover:border-yellow-500/40 cursor-pointer hover:bg-yellow-500/[0.02] flex flex-col items-center justify-center text-center transition-all group scale-100 hover:scale-[1.03] active:scale-95 shadow-md"
                                    >
                                        <div className="w-12 h-12 bg-black rounded-xl border border-gray-800 p-1.5 flex items-center justify-center shrink-0 mb-3 group-hover:border-yellow-500 transition-all">
                                            {t.image ? (
                                                <img src={t.image} alt={t.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <Shield size={18} className="text-gray-700" />
                                            )}
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-tight text-white group-hover:text-yellow-500 transition-colors">{t.name}</span>
                                        <span className="text-[8px] text-yellow-500/60 font-black uppercase mt-1 block">{t.pts} PTS</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                                <div className="flex flex-col items-end gap-1 mt-1">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">{team.pts} PONTOS</span>
                                    {(() => {
                                        const char = getTeamCharacteristic(team.percentAbts, team.percentPos);
                                        return (
                                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${char.bg} ${char.border} ${char.color} text-[8px] font-black uppercase tracking-widest`}>
                                                {char.icon}
                                                {char.label}
                                            </div>
                                        );
                                    })()}
                                </div>
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
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-300 uppercase italic group-hover:text-white transition-colors leading-none">{team.name}</span>
                            {(() => {
                                const char = getTeamCharacteristic(team.percentAbts, team.percentPos);
                                return (
                                    <div className={`flex items-center gap-1 mt-1 ${char.color} text-[7px] font-black uppercase tracking-widest`}>
                                        {char.icon}
                                        {char.label}
                                    </div>
                                );
                            })()}
                        </div>
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

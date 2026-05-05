
import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardData, PlayerData, CharacterData } from '../types';
import { Trophy, Crown, User, Swords, Zap, BarChart2, Scale, Map as MapIcon, Skull, ChevronRight, ChevronDown, ChevronUp, Sparkles, X, Activity, Info, Crosshair, Shield, ArrowLeft, Disc, Flame, Target, AlertCircle, LayoutGrid, MapPin, Hash, Target as TargetIcon, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList, Cell, YAxis, CartesianGrid } from 'recharts';
import FilterBar from '../components/FilterBar';

interface PlayersProps {
  data: DashboardData;
}

const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();
const cleanKey = (s: string) => s.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();

// Helper para converter strings numéricas em inteiros, removendo pontos e vírgulas de formatação
const parseNumber = (val: string | undefined | null): number => {
  if (!val) return 0;
  // Remove tudo que não for dígito
  const cleaned = val.toString().replace(/\D/g, '');
  return parseInt(cleaned) || 0;
};

const Players: React.FC<PlayersProps> = ({ data }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'ranking' | 'chars' | 'report' | 'auditoria' | 'stats' | 'roles' | 'compare'>('ranking');
  const [rankingSubTab, setRankingSubTab] = useState<'general' | 'maps' | 'safes'>('general');
  const [activeRole, setActiveRole] = useState<string>('');
  const [roleSort, setRoleSort] = useState<{ field: string, direction: 'asc' | 'desc' }>({ field: 'kills', direction: 'desc' });
  const [rankingSort, setRankingSort] = useState<{ field: string, direction: 'asc' | 'desc' }>({ field: 'kills', direction: 'desc' });
  const [comparePlayers, setComparePlayers] = useState<{p1: string, p2: string}>({p1: '', p2: ''});
  const [activeHabFilter, setActiveHabFilter] = useState<string>('All');
  
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

  useEffect(() => {
    if (location.state?.player) {
      setFilters(prev => ({ ...prev, players: [location.state.player] }));
      setActiveTab('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
    const grupos = Array.from(new Set(data.teamsReference.map(t => t.GRUPO))).filter(Boolean).sort() as string[];

    const confrontations = Array.from(new Set([
      ...data.confrontationsDimension.map(c => c.CONFRONTO),
      ...data.killFeed.map(k => k.CONFRONTO),
      ...data.details.map(d => d.CONFRONTO),
      ...data.characters.map(c => c.Confronto),
      ...data.players.map(p => p.CONFRONTO)
    ].filter(Boolean))).sort();

    return { teams, players, weapons: [], safes: [], maps, rounds, quedas, confrontations, activeHabs, grupos };
  }, [data.players, data.killFeed, data.characters, data.playersDimension, data.teamsReference, data.confrontationsDimension, data.details, filters.rodada]);

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

  const allSafeNames = useMemo(() => {
    const safes = new Set<string>();
    data.killFeed.forEach(k => {
        if (k.SAFE) safes.add(k.SAFE);
        else safes.add('OUT');
    });
    return Array.from(safes).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
    });
  }, [data.killFeed]);

  // Ranking com Filtragem Estrita (RD AND Q)
  const rankingData = useMemo(() => {
    if (activeTab !== 'ranking' && activeTab !== 'auditoria' && activeTab !== 'stats' && activeTab !== 'roles' && activeTab !== 'compare') return [];

    const teamGroupMap = new Map<string, string>();
    data.teamsReference.forEach(t => {
        if (t.TIME && t.GRUPO) teamGroupMap.set(normalize(t.TIME), normalize(t.GRUPO));
    });

    const filtered = data.players.filter(p => {
        if (filters.team.length > 0 && !filters.team.includes(p.TIME)) return false;
        if (filters.players.length > 0 && !filters.players.some(fp => normalize(fp) === normalize(p.PLAYER))) return false;
        if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return false;
        
        // Filtro de Grupo
        if (filters.grupo.length > 0) {
            const teamGroup = teamGroupMap.get(normalize(p.TIME));
            if (!teamGroup || !filters.grupo.some(g => normalize(g) === teamGroup)) return false;
        }

        // FILTRO ESTRITO: Se selecionar RD e Q, deve bater os dois simultaneamente no registro
        const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(p.RD));
        const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(p.Q));
        
        return matchRD && matchQ;
    });

    const statsMap = new Map<string, { 
        kills: number; 
        damage: number; 
        hs: number; 
        knocks: number; 
        assists: number; 
        gelos: number;
        gelosDestruidos: number;
        reviveu: number;
        aliadosRevividos: number;
        mvp: number;
        matches: number; 
        zeroKills: number;
        withKills: number;
        team: string;
        mapStats: Map<string, { kills: number, matches: number }>;
    }>();
    filtered.forEach(p => {
        const kills = parseNumber(p.Abates);
        const damage = parseNumber(p.Dano);
        const hs = parseNumber(p.HS);
        const knocks = parseNumber(p.Deitados);
        const assists = parseNumber(p.Assistencias);
        const gelos = parseNumber(p.Gelos);
        const gelosDestruidos = parseNumber(p.GelosDestruidos);
        const reviveu = parseNumber(p.Reviveu);
        const aliadosRevividos = parseNumber(p.AliadosRevividos);
        const mvp = parseNumber(p.MVP);
        const mapName = normalize(p.MAPA) || 'N/A';
        
        if (!statsMap.has(p.PLAYER)) {
            const ms = new Map();
            ms.set(mapName, { kills, matches: 1 });
            statsMap.set(p.PLAYER, { 
                kills, damage, hs, knocks, assists, 
                gelos, gelosDestruidos, reviveu, aliadosRevividos,
                mvp,
                matches: 1, team: p.TIME,
                zeroKills: kills === 0 ? 1 : 0,
                withKills: kills > 0 ? 1 : 0,
                mapStats: ms
            });
        } else {
            const s = statsMap.get(p.PLAYER)!;
            s.kills += kills;
            s.damage += damage;
            s.hs += hs;
            s.knocks += knocks;
            s.assists += assists;
            s.gelos += gelos;
            s.gelosDestruidos += gelosDestruidos;
            s.reviveu += reviveu;
            s.aliadosRevividos += aliadosRevividos;
            s.mvp += mvp;
            s.matches += 1;
            s.zeroKills += kills === 0 ? 1 : 0;
            s.withKills += kills > 0 ? 1 : 0;

            const ms = s.mapStats.get(mapName) || { kills: 0, matches: 0 };
            ms.kills += kills;
            ms.matches += 1;
            s.mapStats.set(mapName, ms);
        }
    });

    const filteredKillFeed = data.killFeed.filter(k => {
        const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(k.RD));
        const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(k.Q));
        return matchRD && matchQ;
    });

    const playerSafes = new Map<string, Map<string, number>>();
    const allSafeNames = new Set<string>();

    filteredKillFeed.forEach(k => {
        const killer = k.PLAYER; // Fixed from k.MATADOR
        if (!killer) return;
        const safeVal = k.SAFE || 'OUT';
        allSafeNames.add(safeVal);
        
        if (!playerSafes.has(killer)) playerSafes.set(killer, new Map());
        const sMap = playerSafes.get(killer)!;
        sMap.set(safeVal, (sMap.get(safeVal) || 0) + 1);
    });

    const teamKillsMap = new Map<string, number>();
    statsMap.forEach(stat => {
        teamKillsMap.set(stat.team, (teamKillsMap.get(stat.team) || 0) + stat.kills);
    });

    return Array.from(statsMap.entries()).map(([name, stat]) => {
        const dim = data.playersDimension.find(d => normalize(d.Name) === normalize(name));
        
        const safeKillsMap = playerSafes.get(name) || new Map();
        const safeKills: Record<string, number> = {};
        let totalSafeKills = 0;
        allSafeNames.forEach(safeName => {
            const count = safeKillsMap.get(safeName) || 0;
            safeKills[safeName] = count;
            totalSafeKills += count;
        });
        
        const mapKills: Record<string, number> = {};
        stat.mapStats.forEach((v, k) => {
            mapKills[k] = v.kills;
        });

        const teamTotalKills = teamKillsMap.get(stat.team) || 0;
        const killContributionPct = teamTotalKills > 0 ? ((stat.kills / teamTotalKills) * 100).toFixed(1) : '0.0';

        return {
            name, 
            team: stat.team, 
            kills: stat.kills, 
            diff: stat.kills - stat.matches,
            damage: stat.damage,
            hs: stat.hs,
            knocks: stat.knocks,
            assists: stat.assists,
            gelos: stat.gelos,
            gelosDestruidos: stat.gelosDestruidos,
            reviveu: stat.reviveu,
            aliadosRevividos: stat.aliadosRevividos,
            mvp: stat.mvp,
            matches: stat.matches,
            zeroKills: stat.zeroKills,
            withKills: stat.withKills,
            zeroKillsPct: stat.matches > 0 ? ((stat.zeroKills / stat.matches) * 100).toFixed(1) : '0.0',
            withKillsPct: stat.matches > 0 ? ((stat.withKills / stat.matches) * 100).toFixed(1) : '0.0',
            funcao: dim?.Funcao || 'N/A',
            funcao2: dim?.Funcao2 || 'N/A',
            avg: stat.matches > 0 ? (stat.kills / stat.matches).toFixed(2) : '0.00',
            avgDmg: stat.matches > 0 ? (stat.damage / stat.matches).toFixed(0) : '0',
            avgKnocks: stat.matches > 0 ? (stat.knocks / stat.matches).toFixed(2) : '0.00',
            killContributionPct,
            teamTotalKills,
            safeKills,
            totalSafeKills,
            mapKills,
            loadout: charactersMap.get(normalize(name))
        };
    }).sort((a, b) => {
        const valA = a[rankingSort.field as keyof typeof a];
        const valB = b[rankingSort.field as keyof typeof b];
        
        // Handle mapKills and safeKills if sorting by them
        if (rankingSort.field.startsWith('map_')) {
            const mapName = rankingSort.field.replace('map_', '');
            const mA = (a.mapKills as any)[mapName] || 0;
            const mB = (b.mapKills as any)[mapName] || 0;
            return rankingSort.direction === 'asc' ? mA - mB : mB - mA;
        }
        if (rankingSort.field.startsWith('safe_')) {
            const safeName = rankingSort.field.replace('safe_', '');
            const sA = (a.safeKills as any)[safeName] || 0;
            const sB = (b.safeKills as any)[safeName] || 0;
            return rankingSort.direction === 'asc' ? sA - sB : sB - sA;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);
            if (!isNaN(numA) && !isNaN(numB)) {
                return rankingSort.direction === 'asc' ? numA - numB : numB - numA;
            }
            return rankingSort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        const numA = valA as number;
        const numB = valB as number;
        
        if (rankingSort.direction === 'asc') {
            return numA - numB;
        } else {
            return numB - numA;
        }
    });
  }, [data.players, data.playersDimension, data.killFeed, filters, activeTab, charactersMap, rankingSort, allSafeNames]);

  const handleRoleSort = (field: string) => {
    setRoleSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleRankingSort = (field: string) => {
    setRankingSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Auditoria de Kills com a mesma Filtragem Estrita
  const rolesData = useMemo(() => {
    if (activeTab !== 'roles') return { players: [], bestsByRole: [] };
    
    const playersWithRoles: any[] = [];
    
    data.playersDimension.forEach(d => {
        const stats = rankingData.find(r => normalize(r.name) === normalize(d.Name));
        const basePlayer = {
            name: d.Name,
            img: d.IMG,
            team: stats?.team || 'N/A',
            kills: stats?.kills || 0,
            diff: stats?.diff || 0,
            avg: stats?.avg || '0.00',
            damage: stats?.damage || 0,
            avgDmg: stats?.avgDmg || '0',
            hs: stats?.hs || 0,
            knocks: stats?.knocks || 0,
            avgKnocks: stats?.avgKnocks || '0.00',
            matches: stats?.matches || 0,
            assists: stats?.assists || 0,
            gelos: stats?.gelos || 0,
            gelosDestruidos: stats?.gelosDestruidos || 0,
            reviveu: stats?.reviveu || 0,
            aliadosRevividos: stats?.aliadosRevividos || 0,
            mvp: stats?.mvp || 0
        };

        const role1 = d.Funcao?.trim().toUpperCase();
        const role2 = d.Funcao2?.trim().toUpperCase();

        if (role1 && role1 !== 'N/A') {
            playersWithRoles.push({ ...basePlayer, funcao: role1, funcao2: role2 || 'N/A' });
        }
        if (role2 && role2 !== 'N/A' && role2 !== role1) {
            playersWithRoles.push({ ...basePlayer, funcao: role2, funcao2: role1 || 'N/A' });
        }
        if ((!role1 || role1 === 'N/A') && (!role2 || role2 === 'N/A')) {
            playersWithRoles.push({ ...basePlayer, funcao: 'N/A', funcao2: 'N/A' });
        }
    });

    const roles = Array.from(new Set(playersWithRoles.map(r => r.funcao))).sort();
    
    const bestsByRole = roles.map(role => {
        const rolePlayers = playersWithRoles.filter(p => p.funcao === role);
        
        // Sort players based on roleSort state
        const sortedPlayers = [...rolePlayers].sort((a, b) => {
            const valA = a[roleSort.field];
            const valB = b[roleSort.field];
            
            // Handle numeric strings (like avg stats)
            const numA = typeof valA === 'string' ? parseFloat(valA) : valA;
            const numB = typeof valB === 'string' ? parseFloat(valB) : valB;
            
            if (roleSort.direction === 'asc') {
                return numA - numB;
            } else {
                return numB - numA;
            }
        });

        return {
            role,
            bestKills: [...rolePlayers].sort((a,b) => b.kills - a.kills)[0],
            bestDamage: [...rolePlayers].sort((a,b) => b.damage - a.damage)[0],
            bestAssists: [...rolePlayers].sort((a,b) => b.assists - a.assists)[0],
            bestHS: [...rolePlayers].sort((a,b) => b.hs - a.hs)[0],
            bestKnocks: [...rolePlayers].sort((a,b) => b.knocks - a.knocks)[0],
            bestGelos: [...rolePlayers].sort((a,b) => b.gelos - a.gelos)[0],
            bestGelosDestruidos: [...rolePlayers].sort((a,b) => b.gelosDestruidos - a.gelosDestruidos)[0],
            bestReviveu: [...rolePlayers].sort((a,b) => b.reviveu - a.reviveu)[0],
            bestAliadosRevividos: [...rolePlayers].sort((a,b) => b.aliadosRevividos - a.aliadosRevividos)[0],
            bestMVP: [...rolePlayers].sort((a,b) => b.mvp - a.mvp)[0],
            players: sortedPlayers
        };
    });

    return { players: playersWithRoles, bestsByRole };
  }, [data.playersDimension, rankingData, activeTab, roleSort]);

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

  const allPlayersList = useMemo(() => {
    return data.playersDimension.length > 0 
        ? data.playersDimension.map(d => ({ name: d.Name, img: d.IMG, team: d.Time }))
        : Array.from(new Set(data.players.map(p => p.PLAYER))).filter(Boolean).map(name => ({ name, img: undefined, team: undefined }));
  }, [data.playersDimension, data.players]);

  const compareData = useMemo(() => {
    if (activeTab !== 'compare') return { p1: null, p2: null };
    const p1 = rankingData.find(r => normalize(r.name) === normalize(comparePlayers.p1));
    const p2 = rankingData.find(r => normalize(r.name) === normalize(comparePlayers.p2));
    return { p1, p2 };
  }, [rankingData, comparePlayers, activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2 no-print">
        {[
            { id: 'ranking', label: 'Ranking Geral', icon: <Trophy size={18} /> },
            { id: 'stats', label: 'Estatísticas', icon: <BarChart2 size={18} /> },
            { id: 'roles', label: 'Funções', icon: <LayoutGrid size={18} /> },
            { id: 'chars', label: 'Loadouts', icon: <User size={18} /> },
            { id: 'auditoria', label: 'Auditoria Kills', icon: <Shield size={18} /> },
            { id: 'compare', label: 'Duelo', icon: <Swords size={18} /> },
            { id: 'report', label: 'Perfil Individual', icon: <Activity size={18} /> },
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
          {activeTab === 'roles' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
                  {/* Seleção de Função */}
                  <div className="flex flex-wrap gap-2 p-1 bg-black/20 rounded-xl border border-white/5">
                      {rolesData.bestsByRole.map(group => (
                          <button
                              key={group.role}
                              onClick={() => setActiveRole(group.role)}
                              className={`px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                  (activeRole === group.role || (!activeRole && rolesData.bestsByRole[0]?.role === group.role))
                                      ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-105'
                                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                              }`}
                          >
                              {group.role}
                          </button>
                      ))}
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                      {/* Agrupamento por Função */}
                      {rolesData.bestsByRole
                        .filter(group => !activeRole ? group.role === rolesData.bestsByRole[0]?.role : group.role === activeRole)
                        .map(group => (
                          <div key={group.role} className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl flex flex-col">
                              <div className="bg-gradient-to-r from-black/60 to-transparent px-8 py-5 border-b border-white/5 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                      <div className={`w-2 h-8 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)] ${group.role === 'CPT' ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                                      <h3 className="text-lg font-black text-white uppercase tracking-widest italic">{group.role}</h3>
                                  </div>
                                  <div className="flex flex-col items-end">
                                      <span className="text-[10px] font-black text-yellow-500 tracking-widest uppercase">Efetivo Total</span>
                                      <span className="text-xl font-black text-white italic leading-none">{group.players.length}</span>
                                  </div>
                              </div>

                              {/* Melhores da Função */}
                              <div className="bg-black/20 p-6 grid grid-cols-2 sm:grid-cols-5 gap-4 border-b border-white/5">
                                  {[
                                      { label: 'Kills', best: group.bestKills, val: group.bestKills?.kills, color: 'text-red-500' },
                                      { label: 'Dano', best: group.bestDamage, val: group.bestDamage?.damage, color: 'text-gray-400' },
                                      { label: 'Assists', best: group.bestAssists, val: group.bestAssists?.assists, color: 'text-blue-400' },
                                      { label: 'HS', best: group.bestHS, val: group.bestHS?.hs, color: 'text-yellow-500' },
                                      { label: 'MVP', best: group.bestMVP, val: group.bestMVP?.mvp, color: 'text-yellow-500' }
                                  ].map((b, i) => (
                                      <div key={i} className="flex flex-col items-center text-center p-2 rounded-xl bg-white/5 border border-white/5">
                                          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">{b.label}</span>
                                          <span className={`text-xs font-black italic ${b.color}`}>{b.val}</span>
                                          <span className="text-[7px] font-bold text-gray-600 uppercase truncate w-full mt-1">{b.best?.name}</span>
                                      </div>
                                  ))}
                              </div>

                              <div className="p-2 overflow-x-auto custom-scrollbar">
                                  <table className="w-full text-left border-separate border-spacing-y-1">
                                      <thead>
                                          <tr className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                                              <th className="px-3 py-2 cursor-pointer hover:text-white transition-colors" onClick={() => handleRoleSort('name')}>
                                                  <div className="flex items-center gap-1">
                                                      Jogador
                                                      {roleSort.field === 'name' && (roleSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                  </div>
                                              </th>
                                              <th className="px-1 py-2 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleRoleSort('kills')}>
                                                  <div className="flex items-center justify-center gap-1">
                                                      K
                                                      {roleSort.field === 'kills' && (roleSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                  </div>
                                              </th>
                                              <th className="px-1 py-2 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleRoleSort('diff')}>
                                                  <div className="flex items-center justify-center gap-1">
                                                      S
                                                      {roleSort.field === 'diff' && (roleSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                  </div>
                                              </th>
                                              <th className="px-1 py-2 text-center text-yellow-500 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRoleSort('avg')}>
                                                  <div className="flex items-center justify-center gap-1">
                                                      AVG K
                                                      {roleSort.field === 'avg' && (roleSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                  </div>
                                              </th>
                                              <th className="px-1 py-2 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleRoleSort('damage')}>
                                                  <div className="flex items-center justify-center gap-1">
                                                      DMG
                                                      {roleSort.field === 'damage' && (roleSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                  </div>
                                              </th>
                                              <th className="px-1 py-2 text-center text-yellow-500 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRoleSort('avgDmg')}>
                                                  <div className="flex items-center justify-center gap-1">
                                                      AVG D
                                                      {roleSort.field === 'avgDmg' && (roleSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                  </div>
                                              </th>
                                              <th className="px-1 py-2 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleRoleSort('assists')}>
                                                  <div className="flex items-center justify-center gap-1">
                                                      AST
                                                      {roleSort.field === 'assists' && (roleSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                  </div>
                                              </th>
                                              <th className="px-1 py-2 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleRoleSort('hs')}>
                                                  <div className="flex items-center justify-center gap-1">
                                                      HS
                                                      {roleSort.field === 'hs' && (roleSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                  </div>
                                              </th>
                                              <th className="px-1 py-2 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleRoleSort('knocks')}>
                                                  <div className="flex items-center justify-center gap-1">
                                                      KNK
                                                      {roleSort.field === 'knocks' && (roleSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                  </div>
                                              </th>
                                              <th className="px-1 py-2 text-center text-yellow-500 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRoleSort('avgKnocks')}>
                                                  <div className="flex items-center justify-center gap-1">
                                                      AVG KNK
                                                      {roleSort.field === 'avgKnocks' && (roleSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                  </div>
                                              </th>
                                              <th className="px-1 py-2 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleRoleSort('matches')}>
                                                  <div className="flex items-center justify-center gap-1">
                                                      PJ
                                                      {roleSort.field === 'matches' && (roleSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                  </div>
                                              </th>
                                              <th className="px-1 py-2 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleRoleSort('gelos')}>
                                                  <div className="flex items-center justify-center gap-1">
                                                      GLO
                                                      {roleSort.field === 'gelos' && (roleSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                  </div>
                                              </th>
                                              <th className="px-1 py-2 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleRoleSort('gelosDestruidos')}>
                                                  <div className="flex items-center justify-center gap-1">
                                                      DES
                                                      {roleSort.field === 'gelosDestruidos' && (roleSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                  </div>
                                              </th>
                                              <th className="px-1 py-2 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleRoleSort('reviveu')}>
                                                  <div className="flex items-center justify-center gap-1">
                                                      REV
                                                      {roleSort.field === 'reviveu' && (roleSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                  </div>
                                              </th>
                                              <th className="px-1 py-2 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleRoleSort('aliadosRevividos')}>
                                                  <div className="flex items-center justify-center gap-1">
                                                      ALR
                                                      {roleSort.field === 'aliadosRevividos' && (roleSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                  </div>
                                              </th>
                                              <th className="px-1 py-2 text-center text-yellow-500 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRoleSort('mvp')}>
                                                  <div className="flex items-center justify-center gap-1">
                                                      MVP
                                                      {roleSort.field === 'mvp' && (roleSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                  </div>
                                              </th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {group.players.map(p => {
                                              return (
                                                  <tr key={`${group.role}-${p.name}`} onClick={() => { setFilters(prev => ({...prev, players: [p.name]})); setActiveTab('report'); }} className="bg-black/40 hover:bg-white/5 transition-all cursor-pointer group rounded-lg">
                                                      <td className="px-3 py-2 rounded-l-lg">
                                                          <div className="flex items-center gap-2">
                                                              <div className="w-6 h-6 rounded-full bg-black border border-white/10 overflow-hidden flex-shrink-0">
                                                                  {p.img ? (
                                                                      <img src={p.img} className="w-full h-full object-cover" alt={p.name} referrerPolicy="no-referrer" />
                                                                  ) : (
                                                                      <div className="w-full h-full flex items-center justify-center text-gray-700 bg-black"><User size={12} /></div>
                                                                  )}
                                                              </div>
                                                              <div className="flex flex-col min-w-0">
                                                                  <span className="text-[10px] font-black text-white uppercase italic truncate group-hover:text-yellow-500 transition-colors">{p.name}</span>
                                                                  <span className="text-[7px] font-black text-gray-600 uppercase truncate">{p.team}</span>
                                                              </div>
                                                          </div>
                                                      </td>
                                                      <td className="px-1 py-2 text-center text-[10px] font-black text-red-500 italic">{p.kills}</td>
                                                      <td className={`px-1 py-2 text-center text-[10px] font-black italic ${p.diff > 0 ? 'text-green-500' : p.diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                                          {p.diff > 0 ? `+${p.diff}` : p.diff}
                                                      </td>
                                                      <td className="px-1 py-2 text-center text-[9px] font-black text-yellow-500 italic bg-yellow-500/5">{p.avg}</td>
                                                      <td className="px-1 py-2 text-center text-[9px] font-mono text-gray-400">{p.damage}</td>
                                                      <td className="px-1 py-2 text-center text-[9px] font-black text-yellow-500 italic bg-yellow-500/5">{p.avgDmg}</td>
                                                      <td className="px-1 py-2 text-center text-[9px] font-black text-blue-400">{p.assists}</td>
                                                      <td className="px-1 py-2 text-center text-[9px] font-mono text-yellow-500/70">{p.hs}</td>
                                                      <td className="px-1 py-2 text-center text-[9px] font-black text-orange-500">{p.knocks}</td>
                                                      <td className="px-1 py-2 text-center text-[9px] font-black text-yellow-500 italic bg-yellow-500/5">{p.avgKnocks}</td>
                                                      <td className="px-1 py-2 text-center text-[9px] font-black text-white">{p.matches}</td>
                                                      <td className="px-1 py-2 text-center text-[9px] font-mono text-cyan-400">{p.gelos}</td>
                                                      <td className="px-1 py-2 text-center text-[9px] font-mono text-purple-400">{p.gelosDestruidos}</td>
                                                      <td className="px-1 py-2 text-center text-[9px] font-mono text-green-400">{p.reviveu}</td>
                                                      <td className="px-1 py-2 text-center text-[9px] font-mono text-emerald-400">{p.aliadosRevividos}</td>
                                                      <td className="px-1 py-2 text-center text-[10px] font-black text-yellow-500 italic rounded-r-lg bg-yellow-500/5">{p.mvp}</td>
                                                  </tr>
                                              );
                                          })}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'compare' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Seleção Jogador 1 */}
                      <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 p-8 shadow-2xl">
                          <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-4 block">Desafiante 1</label>
                          <select 
                              value={comparePlayers.p1} 
                              onChange={(e) => setComparePlayers(prev => ({...prev, p1: e.target.value}))}
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-yellow-500 outline-none transition-all"
                          >
                              <option value="">Selecione um jogador...</option>
                              {allPlayersList.map(p => (
                                  <option key={p.name} value={p.name}>{p.name}</option>
                              ))}
                          </select>
                          {compareData.p1 && (
                              <div className="mt-8 flex flex-col items-center">
                                  <div className="w-32 h-32 rounded-full border-4 border-yellow-500/20 overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.1)] mb-4">
                                      {compareData.p1.img ? (
                                          <img src={compareData.p1.img} className="w-full h-full object-cover" alt={compareData.p1.name} referrerPolicy="no-referrer" />
                                      ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-700 bg-black"><User size={48} /></div>
                                      )}
                                  </div>
                                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">{compareData.p1.name}</h4>
                                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{compareData.p1.team}</span>
                              </div>
                          )}
                      </div>

                      {/* Seleção Jogador 2 */}
                      <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 p-8 shadow-2xl">
                          <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-4 block">Desafiante 2</label>
                          <select 
                              value={comparePlayers.p2} 
                              onChange={(e) => setComparePlayers(prev => ({...prev, p2: e.target.value}))}
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-yellow-500 outline-none transition-all"
                          >
                              <option value="">Selecione um jogador...</option>
                              {allPlayersList.map(p => (
                                  <option key={p.name} value={p.name}>{p.name}</option>
                              ))}
                          </select>
                          {compareData.p2 && (
                              <div className="mt-8 flex flex-col items-center">
                                  <div className="w-32 h-32 rounded-full border-4 border-blue-500/20 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.1)] mb-4">
                                      {compareData.p2.img ? (
                                          <img src={compareData.p2.img} className="w-full h-full object-cover" alt={compareData.p2.name} referrerPolicy="no-referrer" />
                                      ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-700 bg-black"><User size={48} /></div>
                                      )}
                                  </div>
                                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">{compareData.p2.name}</h4>
                                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{compareData.p2.team}</span>
                              </div>
                          )}
                      </div>
                  </div>

                  {compareData.p1 && compareData.p2 && (
                      <div className="space-y-8">
                          {/* Estatísticas Gerais */}
                          <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
                              <div className="bg-black/40 px-8 py-6 border-b border-white/5 text-center">
                                  <h3 className="text-sm font-black text-yellow-500 uppercase tracking-[0.3em] italic">Comparativo de Performance</h3>
                              </div>
                              <div className="p-8 space-y-6">
                                  {[
                                      { label: 'Abates Totais', key: 'kills' },
                                      { label: 'Abates por Queda', key: 'avg' },
                                      { label: 'Partidas Jogadas', key: 'matches' },
                                      { label: 'Dano Total', key: 'damage' },
                                      { label: 'Média Dano', key: 'avgDmg' },
                                      { label: 'Assistências', key: 'assists' },
                                      { label: 'Headshots', key: 'hs' },
                                      { label: 'Deitados', key: 'knocks' },
                                      { label: 'Gelos', key: 'gelos' },
                                      { label: 'Gelos Destruídos', key: 'gelosDestruidos' },
                                      { label: 'Reviveu', key: 'reviveu' },
                                      { label: 'Aliados Revividos', key: 'aliadosRevividos' },
                                      { label: 'MVP', key: 'mvp' },
                                  ].map((stat) => {
                                      const val1 = parseFloat(compareData.p1![stat.key as keyof typeof compareData.p1] as any);
                                      const val2 = parseFloat(compareData.p2![stat.key as keyof typeof compareData.p2] as any);
                                      const isP1Better = val1 > val2;
                                      const isP2Better = val2 > val1;

                                      return (
                                          <div key={stat.key} className="space-y-2">
                                              <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                  <span className={isP1Better ? 'text-yellow-500' : ''}>{compareData.p1![stat.key as keyof typeof compareData.p1] as any}</span>
                                                  <span className="text-white">{stat.label}</span>
                                                  <span className={isP2Better ? 'text-blue-500' : ''}>{compareData.p2![stat.key as keyof typeof compareData.p2] as any}</span>
                                              </div>
                                              <div className="h-2 bg-black rounded-full overflow-hidden flex">
                                                  <div 
                                                      className={`h-full transition-all duration-1000 ${isP1Better ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-gray-800'}`} 
                                                      style={{ width: `${(val1 / (val1 + val2 || 1)) * 100}%` }}
                                                  ></div>
                                                  <div 
                                                      className={`h-full transition-all duration-1000 ${isP2Better ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray-800'}`} 
                                                      style={{ width: `${(val2 / (val1 + val2 || 1)) * 100}%` }}
                                                  ></div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>

                          {/* Abates por Mapa */}
                          <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
                              <div className="bg-black/40 px-8 py-6 border-b border-white/5 text-center">
                                  <h3 className="text-sm font-black text-yellow-500 uppercase tracking-[0.3em] italic">Abates por Mapa</h3>
                              </div>
                              <div className="p-8 space-y-6">
                                  {Array.from(new Set([...Object.keys(compareData.p1.mapKills), ...Object.keys(compareData.p2.mapKills)])).sort().map(mapName => {
                                      const val1 = compareData.p1!.mapKills[mapName] || 0;
                                      const val2 = compareData.p2!.mapKills[mapName] || 0;
                                      const isP1Better = val1 > val2;
                                      const isP2Better = val2 > val1;

                                      return (
                                          <div key={mapName} className="space-y-2">
                                              <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                  <span className={isP1Better ? 'text-yellow-500' : ''}>{val1}</span>
                                                  <span className="text-white">{mapName}</span>
                                                  <span className={isP2Better ? 'text-blue-500' : ''}>{val2}</span>
                                              </div>
                                              <div className="h-2 bg-black rounded-full overflow-hidden flex">
                                                  <div 
                                                      className={`h-full transition-all duration-1000 ${isP1Better ? 'bg-yellow-500' : 'bg-gray-800'}`} 
                                                      style={{ width: `${(val1 / (val1 + val2 || 1)) * 100}%` }}
                                                  ></div>
                                                  <div 
                                                      className={`h-full transition-all duration-1000 ${isP2Better ? 'bg-blue-500' : 'bg-gray-800'}`} 
                                                      style={{ width: `${(val2 / (val1 + val2 || 1)) * 100}%` }}
                                                  ></div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>

                          {/* Abates por Safe */}
                          <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
                              <div className="bg-black/40 px-8 py-6 border-b border-white/5 text-center">
                                  <h3 className="text-sm font-black text-yellow-500 uppercase tracking-[0.3em] italic">Abates por Safe</h3>
                              </div>
                              <div className="p-8 space-y-6">
                                  {[1, 2, 3, 4, 5, 6, 7, 8].map(safeNum => {
                                      const key = `safe${safeNum}`;
                                      const val1 = compareData.p1!.safeKills[key] || 0;
                                      const val2 = compareData.p2!.safeKills[key] || 0;
                                      const isP1Better = val1 > val2;
                                      const isP2Better = val2 > val1;

                                      return (
                                          <div key={key} className="space-y-2">
                                              <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                  <span className={isP1Better ? 'text-yellow-500' : ''}>{val1}</span>
                                                  <span className="text-white">Safe {safeNum}</span>
                                                  <span className={isP2Better ? 'text-blue-500' : ''}>{val2}</span>
                                              </div>
                                              <div className="h-2 bg-black rounded-full overflow-hidden flex">
                                                  <div 
                                                      className={`h-full transition-all duration-1000 ${isP1Better ? 'bg-yellow-500' : 'bg-gray-800'}`} 
                                                      style={{ width: `${(val1 / (val1 + val2 || 1)) * 100}%` }}
                                                  ></div>
                                                  <div 
                                                      className={`h-full transition-all duration-1000 ${isP2Better ? 'bg-blue-500' : 'bg-gray-800'}`} 
                                                      style={{ width: `${(val2 / (val1 + val2 || 1)) * 100}%` }}
                                                  ></div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'stats' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* Top Dano */}
                  <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 shadow-xl">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-red-500/10 rounded-lg"><Flame className="text-red-500" size={20} /></div>
                          <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Top Dano Total</h3>
                      </div>
                      <div className="space-y-3">
                          {rankingData.sort((a,b) => b.damage - a.damage).slice(0, 10).map((p, i) => (
                              <div key={p.name} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 hover:border-red-500/30 transition-all group">
                                  <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-black text-gray-600 w-4">#{i+1}</span>
                                      <span className="text-[11px] font-black text-white uppercase italic group-hover:text-red-500 transition-colors">{p.name}</span>
                                  </div>
                                  <span className="text-xs font-black text-red-500 italic">{p.damage.toLocaleString()}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Top HS */}
                  <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 shadow-xl">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-yellow-500/10 rounded-lg"><Target className="text-yellow-500" size={20} /></div>
                          <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Top Headshots</h3>
                      </div>
                      <div className="space-y-3">
                          {rankingData.sort((a,b) => b.hs - a.hs).slice(0, 10).map((p, i) => (
                              <div key={p.name} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-all group">
                                  <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-black text-gray-600 w-4">#{i+1}</span>
                                      <span className="text-[11px] font-black text-white uppercase italic group-hover:text-yellow-500 transition-colors">{p.name}</span>
                                  </div>
                                  <span className="text-xs font-black text-yellow-500 italic">{p.hs} HS</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Top Média Kills */}
                  <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 shadow-xl">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-blue-500/10 rounded-lg"><Zap className="text-blue-500" size={20} /></div>
                          <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Top Média de Kills</h3>
                      </div>
                      <div className="space-y-3">
                          {rankingData.sort((a,b) => parseFloat(b.avg) - parseFloat(a.avg)).slice(0, 10).map((p, i) => (
                              <div key={p.name} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all group">
                                  <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-black text-gray-600 w-4">#{i+1}</span>
                                      <span className="text-[11px] font-black text-white uppercase italic group-hover:text-blue-500 transition-colors">{p.name}</span>
                                  </div>
                                  <span className="text-xs font-black text-blue-500 italic">{p.avg} AVG</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Top Safe Kills */}
                  <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 shadow-xl">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-emerald-500/10 rounded-lg"><MapPin className="text-emerald-500" size={20} /></div>
                          <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Top Abates em Safes</h3>
                      </div>
                      <div className="space-y-3">
                          {rankingData.sort((a,b) => b.totalSafeKills - a.totalSafeKills).slice(0, 10).map((p, i) => (
                              <div key={p.name} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                                  <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-black text-gray-600 w-4">#{i+1}</span>
                                      <span className="text-[11px] font-black text-white uppercase italic group-hover:text-emerald-500 transition-colors">{p.name}</span>
                                  </div>
                                  <span className="text-xs font-black text-emerald-500 italic">{p.totalSafeKills} SAFES</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'ranking' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Sub-tabs para Ranking Geral */}
                <div className="flex flex-wrap gap-2 p-1 bg-black/20 rounded-xl border border-white/5 w-fit">
                    {[
                        { id: 'general', label: 'Estatísticas Gerais', icon: <BarChart2 size={14} /> },
                        { id: 'maps', label: 'Abates por Mapa', icon: <MapIcon size={14} /> },
                        { id: 'safes', label: 'Abates por Safe', icon: <Target size={14} /> },
                    ].map(sub => (
                        <button
                            key={sub.id}
                            onClick={() => setRankingSubTab(sub.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                rankingSubTab === sub.id
                                    ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {sub.icon}
                            {sub.label}
                        </button>
                    ))}
                </div>

                <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left whitespace-nowrap border-separate border-spacing-0">
                        <thead className="bg-[#0a0a0a] text-gray-500 text-[9px] uppercase font-bold tracking-widest sticky top-0 z-20">
                            <tr>
                                <th className="px-4 py-4 w-12 text-center border-b border-gray-800">#</th>
                                <th className="px-4 py-4 border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('name')}>
                                    <div className="flex items-center gap-1">
                                        Jogador
                                        {rankingSort.field === 'name' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                    </div>
                                </th>
                                <th className="px-4 py-4 border-b border-gray-800">Equipe</th>
                                <th className="px-4 py-4 text-center border-b border-gray-800">Função</th>
                                <th className="px-4 py-4 text-center border-b border-gray-800">Ativa</th>
                                
                                {rankingSubTab === 'general' && (
                                    <>
                                        {/* Colunas de Funções */}
                                        <th className="px-2 py-4 text-center text-red-500 border-b border-gray-800 cursor-pointer hover:text-red-400 transition-colors" onClick={() => handleRankingSort('kills')}>
                                            <div className="flex items-center justify-center gap-1">
                                                K
                                                {rankingSort.field === 'kills' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('diff')}>
                                            <div className="flex items-center justify-center gap-1">
                                                S
                                                {rankingSort.field === 'diff' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center text-blue-400 border-b border-gray-800 cursor-pointer hover:text-blue-300 transition-colors" onClick={() => handleRankingSort('killContributionPct')}>
                                            <div className="flex items-center justify-center gap-1">
                                                % C
                                                {rankingSort.field === 'killContributionPct' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center text-yellow-500 border-b border-gray-800 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRankingSort('avg')}>
                                            <div className="flex items-center justify-center gap-1">
                                                AVG K
                                                {rankingSort.field === 'avg' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center text-green-400 border-b border-gray-800 cursor-pointer hover:text-green-300 transition-colors" onClick={() => handleRankingSort('withKills')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Q. C/ KILL
                                                {rankingSort.field === 'withKills' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center text-red-500 border-b border-gray-800 cursor-pointer hover:text-red-400 transition-colors" onClick={() => handleRankingSort('zeroKills')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Q. ZERO
                                                {rankingSort.field === 'zeroKills' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('damage')}>
                                            <div className="flex items-center justify-center gap-1">
                                                DMG
                                                {rankingSort.field === 'damage' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center text-yellow-500 border-b border-gray-800 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRankingSort('avgDmg')}>
                                            <div className="flex items-center justify-center gap-1">
                                                AVG D
                                                {rankingSort.field === 'avgDmg' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('assists')}>
                                            <div className="flex items-center justify-center gap-1">
                                                AST
                                                {rankingSort.field === 'assists' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('hs')}>
                                            <div className="flex items-center justify-center gap-1">
                                                HS
                                                {rankingSort.field === 'hs' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('knocks')}>
                                            <div className="flex items-center justify-center gap-1">
                                                KNK
                                                {rankingSort.field === 'knocks' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center text-yellow-500 border-b border-gray-800 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRankingSort('avgKnocks')}>
                                            <div className="flex items-center justify-center gap-1">
                                                AVG KNK
                                                {rankingSort.field === 'avgKnocks' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('matches')}>
                                            <div className="flex items-center justify-center gap-1">
                                                PJ
                                                {rankingSort.field === 'matches' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('gelos')}>
                                            <div className="flex items-center justify-center gap-1">
                                                GLO
                                                {rankingSort.field === 'gelos' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('gelosDestruidos')}>
                                            <div className="flex items-center justify-center gap-1">
                                                DES
                                                {rankingSort.field === 'gelosDestruidos' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('reviveu')}>
                                            <div className="flex items-center justify-center gap-1">
                                                REV
                                                {rankingSort.field === 'reviveu' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('aliadosRevividos')}>
                                            <div className="flex items-center justify-center gap-1">
                                                ALR
                                                {rankingSort.field === 'aliadosRevividos' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center text-yellow-500 border-b border-gray-800 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRankingSort('mvp')}>
                                            <div className="flex items-center justify-center gap-1">
                                                MVP
                                                {rankingSort.field === 'mvp' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                    </>
                                )}

                                {rankingSubTab === 'maps' && (
                                    <>
                                        {/* Abates por Mapa */}
                                        {filterOptions.maps.map(mapName => (
                                            <th key={mapName} className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort(`map_${mapName}`)}>
                                                <div className="flex items-center justify-center gap-1">
                                                    {mapName}
                                                    {rankingSort.field === `map_${mapName}` && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                </div>
                                            </th>
                                        ))}
                                    </>
                                )}

                                {rankingSubTab === 'safes' && (
                                    <>
                                        {/* Abates por Safe */}
                                        <th className="px-2 py-4 text-center text-yellow-500 border-b border-gray-800 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRankingSort('totalSafeKills')}>
                                            <div className="flex items-center justify-center gap-1">
                                                TOT S
                                                {rankingSort.field === 'totalSafeKills' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        {allSafeNames.map(safeName => (
                                            <th key={safeName} className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort(`safe_${safeName}`)}>
                                                <div className="flex items-center justify-center gap-1">
                                                    {safeName === 'OUT' ? 'OUT' : `S${safeName}`}
                                                    {rankingSort.field === `safe_${safeName}` && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                </div>
                                            </th>
                                        ))}
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-[11px] font-medium">
                            {rankingData.map((player, idx) => (
                                <tr key={idx} onClick={() => { setFilters(prev => ({...prev, players: [player.name]})); setActiveTab('report'); }} className="hover:bg-yellow-900/10 transition-colors cursor-pointer group">
                                    <td className="px-4 py-3 text-gray-600 font-mono text-center">{idx + 1}</td>
                                    <td className="px-4 py-3 font-bold text-white uppercase italic flex items-center gap-2">
                                        {player.name}
                                        <ChevronRight size={12} className="text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 uppercase text-[9px] tracking-widest">{player.team}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`text-[9px] font-black uppercase italic ${player.funcao === 'CPT' ? 'text-yellow-500' : 'text-gray-400'}`}>{player.funcao}</span>
                                            {player.funcao2 !== 'N/A' && <span className="text-[7px] text-gray-600 font-bold uppercase">{player.funcao2}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {player.loadout?.hab1Img ? (
                                            <div className="flex justify-center items-center">
                                                <div className="w-6 h-6 rounded-lg bg-black border border-yellow-500/30 p-1 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                                                    <img src={player.loadout.hab1Img} className="w-full h-full object-contain" alt={player.loadout.Hab1} />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-700 font-black italic opacity-20">-</span>
                                        )}
                                    </td>
                                    
                                    {rankingSubTab === 'general' && (
                                        <>
                                            {/* Dados de Funções */}
                                            <td className="px-2 py-3 text-center text-red-400 font-black text-sm">{player.kills}</td>
                                            <td className={`px-2 py-3 text-center font-black text-sm ${player.diff > 0 ? 'text-green-500' : player.diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                                {player.diff > 0 ? `+${player.diff}` : player.diff}
                                            </td>
                                            <td className="px-2 py-3 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-black text-blue-400 italic">{player.killContributionPct}%</span>
                                                    <span className="text-[7px] text-gray-600 font-bold uppercase">DO TIME</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 text-center text-yellow-500 font-black italic bg-yellow-500/5">{player.avg}</td>
                                            <td className="px-2 py-3 text-center w-24">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[11px] font-black text-green-400">{player.withKills}</span>
                                                    <span className="text-[8px] text-gray-500 font-bold">({player.withKillsPct}%)</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 text-center w-24 border-r border-gray-800/30">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[11px] font-black text-red-500">{player.zeroKills}</span>
                                                    <span className="text-[8px] text-gray-500 font-bold">({player.zeroKillsPct}%)</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 text-center text-gray-300 font-mono">{player.damage}</td>
                                            <td className="px-2 py-3 text-center text-yellow-500 font-black italic bg-yellow-500/5">{player.avgDmg}</td>
                                            <td className="px-2 py-3 text-center text-blue-400 font-black">{player.assists}</td>
                                            <td className="px-2 py-3 text-center text-yellow-500 font-mono">{player.hs}</td>
                                            <td className="px-2 py-3 text-center text-orange-500 font-black">{player.knocks}</td>
                                            <td className="px-2 py-3 text-center text-yellow-500 font-black italic bg-yellow-500/5">{player.avgKnocks}</td>
                                            <td className="px-2 py-3 text-center text-white font-black">{player.matches}</td>
                                            <td className="px-2 py-3 text-center text-cyan-400 font-mono">{player.gelos}</td>
                                            <td className="px-2 py-3 text-center text-purple-400 font-mono">{player.gelosDestruidos}</td>
                                            <td className="px-2 py-3 text-center text-green-400 font-mono">{player.reviveu}</td>
                                            <td className="px-2 py-3 text-center text-emerald-400 font-mono">{player.aliadosRevividos}</td>
                                            <td className="px-2 py-3 text-center text-yellow-500 font-black italic bg-yellow-500/5">{player.mvp}</td>
                                        </>
                                    )}

                                    {rankingSubTab === 'maps' && (
                                        <>
                                            {/* Abates por Mapa */}
                                            {filterOptions.maps.map(mapName => (
                                                <td key={mapName} className="px-2 py-3 text-center text-gray-400 font-mono">
                                                    {player.mapKills[mapName] || 0}
                                                </td>
                                            ))}
                                        </>
                                    )}

                                    {rankingSubTab === 'safes' && (
                                        <>
                                            {/* Abates por Safe */}
                                            <td className="px-2 py-3 text-center text-yellow-500 font-black italic bg-yellow-500/5">{player.totalSafeKills}</td>
                                            {allSafeNames.map(safeName => (
                                                <td key={safeName} className="px-2 py-3 text-center text-gray-500 font-mono">
                                                    {player.safeKills[safeName] || 0}
                                                </td>
                                            ))}
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
        const mapDamageMap: Record<string, number> = {};
        records.forEach(r => {
            const m = r.MAPA || 'DESCONHECIDO';
            mapKillsMap[m] = (mapKillsMap[m] || 0) + parseNumber(r.Abates);
            mapDamageMap[m] = (mapDamageMap[m] || 0) + parseNumber(r.Dano);
        });
        const mapKills = Object.entries(mapKillsMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
        const mapDamage = Object.entries(mapDamageMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);

        const roundKillsMap: Record<string, number> = {};
        records.forEach(r => {
            const rd = r.RD || 'N/A';
            roundKillsMap[rd] = (roundKillsMap[rd] || 0) + parseNumber(r.Abates);
        });
        const roundKills = Object.entries(roundKillsMap).map(([name, count]) => ({ name, count })).sort((a,b) => {
            const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        const dropKillsMap: Record<string, number> = {};
        records.forEach(r => {
            const q = r.Q || 'N/A';
            dropKillsMap[q] = (dropKillsMap[q] || 0) + parseNumber(r.Abates);
        });
        const dropKills = Object.entries(dropKillsMap).map(([name, count]) => ({ name, count })).sort((a,b) => {
            const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        const playerSafeKillsMap: Record<string, number> = {};
        const topVictimsMap: Record<string, number> = {};
        data.killFeed.filter((k: any) => normalize(k.PLAYER) === normalize(playerName)).forEach((k: any) => {
             const safe = k.SAFE || 'OUT';
             playerSafeKillsMap[safe] = (playerSafeKillsMap[safe] || 0) + 1;
             
             const victim = k.VITIMA;
             if (victim) topVictimsMap[victim] = (topVictimsMap[victim] || 0) + 1;
        });
        const safeKills = Object.entries(playerSafeKillsMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
        const topVictims = Object.entries(topVictimsMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 5);

        const topKillersMap: Record<string, number> = {};
        data.killFeed.filter((k: any) => normalize(k.VITIMA) === normalize(playerName)).forEach((k: any) => {
             const killer = k.PLAYER;
             if (killer) topKillersMap[killer] = (topKillersMap[killer] || 0) + 1;
        });
        const topKillers = Object.entries(topKillersMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 5);

        const totalKills = records.reduce((acc: number, r: PlayerData) => acc + parseNumber(r.Abates), 0);
        const totalDamage = records.reduce((acc: number, r: PlayerData) => acc + parseNumber(r.Dano), 0);
        const totalHS = records.reduce((acc: number, r: PlayerData) => acc + parseNumber(r.HS), 0);
        const totalKnocks = records.reduce((acc: number, r: PlayerData) => acc + parseNumber(r.Deitados), 0);
        const totalAssists = records.reduce((acc: number, r: PlayerData) => acc + parseNumber(r.Assistencias), 0);
        
        const totalMatches = records.length; 
        const zeroKillsMatches = records.filter((r: PlayerData) => parseNumber(r.Abates) === 0).length;
        const withKillsMatches = records.filter((r: PlayerData) => parseNumber(r.Abates) > 0).length;
        const zeroKillsPct = totalMatches > 0 ? ((zeroKillsMatches / totalMatches) * 100).toFixed(1) : '0.0';
        const withKillsPct = totalMatches > 0 ? ((withKillsMatches / totalMatches) * 100).toFixed(1) : '0.0';

        const team = records[0]?.TIME || data.players.find(p => normalize(p.PLAYER) === normalize(playerName))?.TIME || 'N/A';
        const teamImg = data.teamsReference.find(t => normalize(t.TIME) === normalize(team))?.IMG;

        const teamRecords = data.players.filter((p: PlayerData) => {
            if (normalize(p.TIME) !== normalize(team)) return false;
            if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(p.RD))) return false;
            if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return false;
            if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(p.Q))) return false;
            return true;
        });
        const teamTotalKills = teamRecords.reduce((acc: number, r: PlayerData) => acc + parseNumber(r.Abates), 0);
        const killContributionPct = teamTotalKills > 0 ? ((totalKills / teamTotalKills) * 100).toFixed(1) : '0.0';

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

        const playerDim = data.playersDimension.find(d => normalize(d.Name) === normalize(playerName));
        const funcao = playerDim?.Funcao || 'N/A';
        const funcao2 = playerDim?.Funcao2 || 'N/A';

        const diff = totalKills - totalMatches;

        return { 
            team, 
            teamImg, 
            funcao,
            funcao2,
            kills: totalKills, 
            damage: totalDamage,
            hs: totalHS,
            knocks: totalKnocks,
            assists: totalAssists,
            matches: totalMatches, 
            zeroKillsMatches,
            withKillsMatches,
            zeroKillsPct,
            withKillsPct,
            diff,
            avg: totalMatches > 0 ? (totalKills / totalMatches).toFixed(2) : '0.00', 
            avgDmg: totalMatches > 0 ? (totalDamage / totalMatches).toFixed(0) : '0',
            killContributionPct,
            teamTotalKills,
            loadout: currentLoadout, 
            safeKills, 
            mapKills, 
            mapDamage,
            roundKills, 
            dropKills, 
            topVictims, 
            topKillers 
        };
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
                        <div className="flex items-center gap-3">
                            <h2 className="text-4xl font-black italic text-white uppercase leading-none tracking-tighter">{playerName}</h2>
                            {stats.funcao !== 'N/A' && (
                                <div className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${stats.funcao === 'CPT' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                    {stats.funcao}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                             <Shield size={14} className="text-yellow-500" />
                             <span className="text-yellow-500 font-black uppercase tracking-[0.2em] text-xs block">{stats.team}</span>
                             {stats.funcao2 !== 'N/A' && (
                                <>
                                    <span className="text-gray-700 mx-1">•</span>
                                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px] italic">{stats.funcao2}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-4 relative z-10">
                    <MetricCard label="Abates" value={stats.kills} color="text-red-500" />
                    <MetricCard label="Salas" value={stats.matches} color="text-blue-400" />
                    <MetricCard 
                        label="Q. C/ Kill" 
                        value={`${stats.withKillsMatches} (${stats.withKillsPct}%)`} 
                        color="text-green-500" 
                    />
                    <MetricCard 
                        label="Q. Zerada" 
                        value={`${stats.zeroKillsMatches} (${stats.zeroKillsPct}%)`} 
                        color="text-red-500" 
                    />
                    <MetricCard 
                        label="Saldo" 
                        value={stats.diff > 0 ? `+${stats.diff}` : stats.diff} 
                        color={stats.diff > 0 ? "text-green-500" : stats.diff < 0 ? "text-red-600" : "text-gray-400"} 
                    />
                    <MetricCard label="Dano" value={stats.damage} color="text-gray-300" />
                    <MetricCard label="HS" value={stats.hs} color="text-yellow-500" />
                    <MetricCard label="Deitados" value={stats.knocks} color="text-orange-500" />
                    <MetricCard label="Assist." value={stats.assists} color="text-blue-400" />
                    <MetricCard label="Média" value={stats.avg} color="text-yellow-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800 flex flex-col items-center">
                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Dano Médio</span>
                    <span className="text-xl font-black text-white italic">{stats.avgDmg}</span>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800 flex flex-col items-center">
                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">% Headshot</span>
                    <span className="text-xl font-black text-yellow-500 italic">
                        {stats.kills > 0 ? ((stats.hs / stats.kills) * 100).toFixed(1) : '0.0'}%
                    </span>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800 flex flex-col items-center">
                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Knocks/Kills</span>
                    <span className="text-xl font-black text-orange-500 italic">
                        {stats.kills > 0 ? (stats.knocks / stats.kills).toFixed(2) : '0.00'}
                    </span>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800 flex flex-col items-center">
                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">% Contribuição</span>
                    <span className="text-xl font-black text-blue-400 italic">{stats.killContributionPct}%</span>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800 flex flex-col items-center">
                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Participação</span>
                    <span className="text-xl font-black text-blue-400 italic">
                        {stats.kills + stats.assists}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0e0e11] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col">
                    <h3 className="text-[11px] font-black text-white uppercase mb-6 flex items-center gap-3 tracking-widest"><MapIcon size={16} className="text-yellow-500" /> PERFORMANCE POR MAPA</h3>
                    <div className="space-y-4 flex-1">
                         {stats.mapKills.length > 0 ? stats.mapKills.map((map, i) => {
                             const mapDmg = stats.mapDamage.find(md => md.name === map.name)?.count || 0;
                             return (
                             <div key={i} className="space-y-2">
                                 <div className="flex justify-between items-end">
                                     <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{map.name}</span>
                                     <div className="flex gap-3">
                                         <span className="text-[10px] font-black text-gray-400 italic uppercase">{mapDmg} DANO</span>
                                         <span className="text-xs font-black text-white italic">{map.count} KILLS</span>
                                     </div>
                                 </div>
                                 <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                     <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full" style={{ width: `${(map.count / (stats.kills || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                         )}) : (
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-[#0e0e11] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col">
                    <h3 className="text-[11px] font-black text-white uppercase mb-6 flex items-center gap-3 tracking-widest"><Crosshair size={16} className="text-green-500" /> MAIORES VÍTIMAS</h3>
                    <div className="space-y-4 flex-1">
                         {stats.topVictims.length > 0 ? stats.topVictims.map((victim, i) => (
                             <div key={i} className="space-y-2">
                                 <div className="flex justify-between items-end">
                                     <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{victim.name}</span>
                                     <span className="text-xs font-black text-green-500 italic">{victim.count} ABATES</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                     <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full" style={{ width: `${(victim.count / (stats.topVictims[0]?.count || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                         )) : (
                             <div className="flex-1 flex items-center justify-center text-gray-700 font-black italic uppercase text-[10px]">Sem vítimas registradas</div>
                         )}
                    </div>
                </div>

                <div className="bg-[#0e0e11] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col">
                    <h3 className="text-[11px] font-black text-white uppercase mb-6 flex items-center gap-3 tracking-widest"><Skull size={16} className="text-red-500" /> MAIORES ALGOZES</h3>
                    <div className="space-y-4 flex-1">
                         {stats.topKillers.length > 0 ? stats.topKillers.map((killer, i) => (
                             <div key={i} className="space-y-2">
                                 <div className="flex justify-between items-end">
                                     <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{killer.name}</span>
                                     <span className="text-xs font-black text-red-500 italic">{killer.count} MORTES</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                     <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{ width: `${(killer.count / (stats.topKillers[0]?.count || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                         )) : (
                             <div className="flex-1 flex items-center justify-center text-gray-700 font-black italic uppercase text-[10px]">Sem mortes registradas</div>
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

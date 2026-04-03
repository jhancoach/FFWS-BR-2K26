
import { CSV_URLS, DEFAULT_CONFIG } from '../constants';
import { parseCSV } from '../utils/csvParser';
import { DashboardData, PlayerData, KillFeed, MatchDetails, CharacterData, TeamStats, TeamReference, WeaponData, SafeData, GenericDimData, AppConfig } from '../types';

export const getActiveUrls = () => {
  try {
    const saved = localStorage.getItem('MUNDIAL_DASHBOARD_URLS');
    if (saved) {
      return { ...CSV_URLS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Error reading custom URLs", e);
  }
  return CSV_URLS;
};

export const getAppConfig = (): AppConfig => {
  try {
    const saved = localStorage.getItem('MUNDIAL_DASHBOARD_CONFIG');
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Error reading app config", e);
  }
  return DEFAULT_CONFIG;
};

const cleanKey = (s: string) => 
  s.toString()
   .toLowerCase()
   .normalize("NFD")
   .replace(/[\u0300-\u036f]/g, "") 
   .replace(/[^a-z0-9]/g, "")
   .trim();

const parseNumber = (val: string | undefined | null): number => {
  if (!val) return 0;
  const cleaned = val.toString().replace(/\D/g, '');
  return parseInt(cleaned) || 0;
};

const getVal = (row: any, aliases: string[]) => {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const target = cleanKey(alias);
    const foundKey = keys.find(k => cleanKey(k) === target);
    if (foundKey && row[foundKey] !== undefined) {
      return row[foundKey].toString().trim();
    }
  }
  return '';
};

const normalizeDim = (data: any[], keyName: string): GenericDimData[] => {
  return data.map(row => {
    let name = getVal(row, [keyName, keyName.replace(/(\d)/, ' $1'), 'Nome', 'Name', 'NOME', 'PERSONAGEM', 'PLAYER', 'JOGADOR', 'PET', 'ITEM', 'HABILIDADE']);
    let img = getVal(row, ['IMG', 'Img', 'img', 'Imagem', 'URL', 'Url', 'Link', 'IMAGEM', 'FOTO', 'FOTO PLAYER']);
    let funcao = getVal(row, ['FUNÇÃO', 'FUNCAO', 'Função', 'Funcao', 'ROLE', 'Role']);
    let funcao2 = getVal(row, ['FUNÇÃO 2', 'FUNCAO 2', 'Função 2', 'Funcao 2', 'ROLE 2', 'Role 2']);
    return { Name: name || '', IMG: img || '', Funcao: funcao, Funcao2: funcao2 };
  }).filter(r => r.Name && r.Name.trim() !== '');
};

const safeFetch = async (url: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.text();
    } catch (e) {
        console.error(`Falha ao carregar URL: ${url}`, e);
        return "";
    }
};

export const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    const activeUrls = getActiveUrls();
    const urls = [
      activeUrls.fPlayersDados, activeUrls.fKillFeed, activeUrls.fDetalhes, activeUrls.fPersonagens,
      activeUrls.dTime, activeUrls.dPlayer, activeUrls.dArma, activeUrls.dSafe, activeUrls.dHab1, 
      activeUrls.dHab2, activeUrls.dHab3, activeUrls.dHab4, activeUrls.dPets, activeUrls.dItem,
      activeUrls.dVitima
    ];

    const responses = await Promise.all(urls.map(url => safeFetch(url)));
    
    // Parse players (Fonte Fato: fPlayersDados)
    const players: PlayerData[] = parseCSV<any>(responses[0]).map(row => {
        const player = getVal(row, ['PLAYER', 'Player', 'Jogador', 'JOGADOR', 'NOME', 'COMPETIDOR']);
        let time = getVal(row, ['TIME', 'Time', 'Equipe', 'EQUIPE', 'TAG']);
        
        // Patch: VITNXP is in TS, not E1
        if (player.toUpperCase() === 'VITNXP') {
            time = 'TS';
        }

        return {
            PLAYER: player,
            TIME: time,
            S: getVal(row, ['S', 'Partida', 'Quedas', 'Q', 'QUEDAS']),
            Abates: getVal(row, ['ABATES', 'Abates', 'Kills', 'KILLS', 'ABTS', 'KILL']) || '0',
            Dano: getVal(row, ['DANO', 'Damage', 'DMG']),
            HS: getVal(row, ['HS', 'Headshot', 'HEADSHOTS', 'CAPA']),
            Deitados: getVal(row, ['DEITADOS', 'Knockdowns', 'KNOCKS', 'DEITOU']),
            Assistencias: getVal(row, ['ASSISTENCIAS', 'Assists', 'ASSIST']),
            Gelos: getVal(row, ['GELOS', 'Walls', 'GELO']),
            GelosDestruidos: getVal(row, ['GELOS DESTRUIDOS', 'Walls Destroyed', 'GELO DESTRUIDO']),
            Reviveu: getVal(row, ['REVIVEU', 'Revived']),
            AliadosRevividos: getVal(row, ['ALIADOS REVIVIDOS', 'Allies Revived']),
            MVP: getVal(row, ['MVP', 'Mvp', 'M.V.P']),
            MAPA: getVal(row, ['MAPA', 'Mapa', 'Map']),
            RD: getVal(row, ['RD', 'Rd', 'Rodada', 'Round']),
            Q: getVal(row, ['Q', 'QUEDA', 'Queda', 'PARTIDA']) || getVal(row, ['S', 'Partida'])
        };
    }).filter(p => p.PLAYER);

    // Parse KillFeed (Fonte Fato)
    const killFeed: KillFeed[] = parseCSV<any>(responses[1]).map(row => ({
        PLAYER: getVal(row, ['PLAYER', 'Player', 'Killer', 'Matador']),
        VITIMA: getVal(row, ['VITIMA', 'Vitima', 'Victim', 'QUEM MORREU']),
        ARMA: getVal(row, ['ARMA', 'Arma', 'Weapon']),
        CONFRONTO: getVal(row, ['CONFRONTO', 'Confronto']),
        MAPA: getVal(row, ['MAPA', 'Mapa', 'Map']),
        RD: getVal(row, ['RD', 'Rd', 'Rodada']),
        Q: getVal(row, ['Q', 'QUEDA', 'Queda']),
        SAFE: getVal(row, ['SAFE', 'Safe'])
    })).filter(k => k.PLAYER);

    // Parse Detalhes (Fonte Fato)
    const details: MatchDetails[] = parseCSV<any>(responses[2]).map(row => ({
        TIME: getVal(row, ['TIME', 'Time', 'Equipe']),
        MAPA: getVal(row, ['MAPA', 'Mapa']),
        RD: getVal(row, ['RD', 'Rd', 'Rodada']),
        CONFRONTO: getVal(row, ['CONFRONTO', 'Confronto']),
        PTS: getVal(row, ['PTS', 'PONTOS', 'PONTOS TOTAL']) || '0',
        PTSC: getVal(row, ['PTSC', 'PTS/C', 'COLOCACAO']) || '0',
        POS: getVal(row, ['POS', 'POSICAO']) || '0',
        ABTS: getVal(row, ['ABTS', 'ABATES']) || '0',
        B: getVal(row, ['B', 'BOOYAH', 'VITORIA']) || '0',
        S: getVal(row, ['S', 'PARTIDA', 'QUEDAS']) || '1',
        Q: getVal(row, ['Q', 'QUEDA', 'Queda', 'PARTIDA']) || '1'
    })).filter(d => d.TIME);
    
    // Parse Loadouts (Fonte Fato)
    const characters: CharacterData[] = parseCSV<any>(responses[3]).map(row => {
        const player = getVal(row, ['Player', 'Jogador', 'PLAYER', 'NOME']);
        let time = getVal(row, ['Time', 'Equipe', 'TIME']);

        // Patch: VITNXP is in TS, not E1
        if (player.toUpperCase() === 'VITNXP') {
            time = 'TS';
        }

        return {
            Player: player,
            Time: time,
            Hab1: getVal(row, ['Hab1', 'Hab 1', 'Ativa']),
            Hab2: getVal(row, ['Hab2', 'Hab 2', 'Passiva 1']),
            Hab3: getVal(row, ['Hab3', 'Hab 3', 'Passiva 2']),
            Hab4: getVal(row, ['Hab4', 'Hab 4', 'Passiva 3']),
            Pet: getVal(row, ['Pet', 'PET']),
            Item: getVal(row, ['Item', 'ITEM']),
            Rd: getVal(row, ['Rd', 'RD', 'Rodada']),
            Confronto: getVal(row, ['Confronto', 'CONFRONTO']),
            Mapa: getVal(row, ['Mapa', 'MAPA']),
            S: getVal(row, ['S', 'Partida', 'Quedas', 'Q', 'QUEDA']),
            Q: getVal(row, ['Q', 'QUEDA', 'Queda', 'PARTIDA']) || getVal(row, ['S', 'Partida'])
        };
    }).filter(c => c.Player);

    return {
      players, killFeed, details, characters,
      teamsReference: parseCSV<any>(responses[4]).map(row => ({
        TIME: getVal(row, ['TIME', 'Time', 'Equipe', 'EQUIPE']),
        IMG: getVal(row, ['IMG', 'Img', 'Imagem', 'URL']),
        GRUPO: getVal(row, ['GRUPO', 'Grupo', 'Group', 'GROUP', 'G'])
      })),
      playersDimension: normalizeDim(parseCSV<any>(responses[5]), 'Player'),
      weapons: parseCSV<any>(responses[6]).map(r => ({ Arma: getVal(r, ['Arma', 'ARMA']), IMG: getVal(r, ['IMG', 'Img']) })),
      safes: parseCSV<any>(responses[7]).map(r => ({ Safe: getVal(r, ['Safe', 'SAFE']), IMG: getVal(r, ['IMG', 'Img']) })),
      hab1: normalizeDim(parseCSV<any>(responses[8]), 'Hab1'),
      hab2: normalizeDim(parseCSV<any>(responses[9]), 'Hab2'),
      hab3: normalizeDim(parseCSV<any>(responses[10]), 'Hab3'),
      hab4: normalizeDim(parseCSV<any>(responses[11]), 'Hab4'),
      pets: normalizeDim(parseCSV<any>(responses[12]), 'Pet'),
      items: normalizeDim(parseCSV<any>(responses[13]), 'Item'),
      victimsDimension: normalizeDim(parseCSV<any>(responses[14]), 'Vitima'),
      loading: false, lastUpdated: new Date()
    };
  } catch (error) {
    console.error("Erro crítico ao buscar dados:", error);
    return { players: [], killFeed: [], details: [], characters: [], teamsReference: [], playersDimension: [], victimsDimension: [], weapons: [], safes: [], hab1: [], hab2: [], hab3: [], hab4: [], pets: [], items: [], loading: false, lastUpdated: null };
  }
};

export const calculateTeamStats = (data: DashboardData): TeamStats[] => {
  const teamMap = new Map<string, TeamStats>();
  const lastMatchTracker = new Map<string, { rd: number, q: number, pos: number }>();
  const teamImages = new Map<string, string>();
  const teamGroups = new Map<string, string>();
  
  data.teamsReference.forEach(t => { 
    if (t.TIME && t.IMG) teamImages.set(t.TIME, t.IMG); 
    if (t.TIME && t.GRUPO) teamGroups.set(t.TIME, t.GRUPO);
  });

  data.details.forEach(row => {
    const teamName = row.TIME;
    if (!teamName) return;
    
    if (!teamMap.has(teamName)) {
      teamMap.set(teamName, { 
        name: teamName, 
        image: teamImages.get(teamName), 
        grupo: teamGroups.get(teamName),
        s: 0, b: 0, ptsc: 0, abts: 0, pts: 0, 
        avgAbts: 0, avgPts: 0, avgPtsc: 0, 
        percentPos: 0, percentAbts: 0, 
        lastPos: 99 // Default alto para melhor colocação ser menor valor
      });
    }
    
    const stats = teamMap.get(teamName)!;
    stats.pts += parseNumber(row.PTS);
    stats.ptsc += parseNumber(row.PTSC);
    stats.abts += parseNumber(row.ABTS);
    stats.b += parseNumber(row.B);
    stats.s += parseNumber(row.S);

    // Lógica para rastrear a posição na última queda real
    const currentRD = parseNumber(row.RD);
    const currentQ = parseNumber(row.Q);
    const currentPos = parseNumber(row.POS) || 99;

    const last = lastMatchTracker.get(teamName);
    if (!last || (currentRD > last.rd) || (currentRD === last.rd && currentQ > last.q)) {
        lastMatchTracker.set(teamName, { rd: currentRD, q: currentQ, pos: currentPos });
        stats.lastPos = currentPos;
    }
  });

  return Array.from(teamMap.values()).map(stats => {
    if (stats.s > 0) {
      stats.avgAbts = parseFloat((stats.abts / stats.s).toFixed(2));
      stats.avgPts = parseFloat((stats.pts / stats.s).toFixed(2));
      stats.avgPtsc = parseFloat((stats.ptsc / stats.s).toFixed(2));
    }
    return stats;
  }).sort((a, b) => {
    // Critério Principal: Pontos Total
    if (b.pts !== a.pts) return b.pts - a.pts;
    
    // 1º Desempate: Booyahs (Vitórias)
    if (b.b !== a.b) return b.b - a.b;
    
    // 2º Desempate: Abates Total
    if (b.abts !== a.abts) return b.abts - a.abts;
    
    // 3º Desempate: Melhor colocação na última queda (menor posição é melhor)
    return a.lastPos - b.lastPos;
  });
};

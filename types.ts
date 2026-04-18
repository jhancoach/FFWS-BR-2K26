
export interface PlayerData {
  PLAYER: string; 
  TIME: string;   
  S: string;      
  Abates: string;
  Dano?: string;
  HS?: string;
  Deitados?: string;
  Assistencias?: string;
  Gelos?: string;
  GelosDestruidos?: string;
  Reviveu?: string;
  AliadosRevividos?: string;
  MVP?: string;
  MAPA?: string;
  RD?: string;
  CONFRONTO?: string;
  Q?: string;
}

export interface KillFeed {
  PLAYER: string;
  VITIMA: string;
  ARMA: string;
  CONFRONTO: string;
  MAPA: string;
  RD: string;
  Q: string;
  SAFE: string;
  Tempo?: string;
}

export interface MatchDetails {
  TIME: string;
  MAPA: string;
  RD: string;
  CONFRONTO: string;
  PTS: string;
  PTSC: string; 
  POS: string;
  ABTS: string;
  B: string;
  S: string;
  Q: string; 
  ONDE_FECHOU?: string;
}

export interface CharacterData {
  Player: string;
  Time: string;
  Hab1: string;
  Hab2: string;
  Hab3: string;
  Hab4: string;
  Pet: string;
  Item: string;
  Rd: string;        
  Confronto: string; 
  Mapa: string;      
  S: string;  
  Q: string;       
}

export interface TeamReference {
  TIME: string;
  IMG?: string;
  GRUPO?: string;
}

export interface WeaponData {
  Arma: string;
  IMG: string;
}

export interface SafeData {
  Safe: string;
  IMG: string;
}

export interface ConfrontationDimension {
  CONFRONTO: string;
  IMG?: string;
}

export interface GenericDimData {
  Name: string; 
  IMG: string;
  Funcao?: string;
  Funcao2?: string;
}

export interface AppConfig {
  titlePart1: string;
  titlePart2: string;
  subtitle: string;
}

export interface DashboardData {
  players: PlayerData[];
  killFeed: KillFeed[];
  details: MatchDetails[];
  characters: CharacterData[];
  teamsReference: TeamReference[];
  playersDimension: GenericDimData[];
  victimsDimension: GenericDimData[];
  weapons: WeaponData[];
  safes: SafeData[];
  hab1: GenericDimData[];
  hab2: GenericDimData[];
  hab3: GenericDimData[];
  hab4: GenericDimData[];
  pets: GenericDimData[];
  items: GenericDimData[];
  confrontationsDimension: ConfrontationDimension[];
  loading: boolean;
  lastUpdated: Date | null;
}

export interface TeamStats {
  name: string;
  image?: string;
  grupo?: string;
  s: number;
  b: number;
  ptsc: number;
  abts: number;
  pts: number;
  avgAbts: number;
  avgPts: number;
  avgPtsc: number;
  percentPos: number;
  percentAbts: number;
  lastPos: number; // Armazena a posição na última queda para desempate
}

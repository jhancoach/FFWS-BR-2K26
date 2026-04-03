import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, Search, Check, ChevronDown } from 'lucide-react';

interface FilterState {
  team: string[];
  players: string[];
  weapon: string[];
  safe: string[];
  map: string[];
  rodada: string[];
  queda: string[];
  confrontation: string[];
  grupo: string[];
}

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  options: {
    teams: string[];
    players: string[];
    weapons: string[];
    safes: string[];
    maps: string[];
    rounds: string[];
    quedas: string[];
    confrontations: string[];
    grupos: string[];
  };
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, options }) => {
  const [isOpen, setIsOpen] = useState(false);

  const clearFilters = () => {
    setFilters({
      team: [],
      players: [],
      weapon: [],
      safe: [],
      map: [],
      rodada: [],
      queda: [],
      confrontation: [],
      grupo: []
    });
  };

  // Fix: Explicitly cast Object.values to string[][] to avoid the "property 'length' does not exist on type 'unknown'" error.
  const hasActiveFilters = (Object.values(filters) as string[][]).some(f => f.length > 0);

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6 border border-gray-800 shadow-md relative z-40">
      <div className="flex justify-between items-center md:hidden mb-4" onClick={() => setIsOpen(!isOpen)}>
        <span className="text-white font-bold flex items-center gap-2 uppercase tracking-wide"><Filter size={18}/> Filtros Avançados</span>
        <span className="text-yellow-500 text-sm font-bold">{isOpen ? 'FECHAR' : 'ABRIR'}</span>
      </div>

      <div className={`${isOpen ? 'block' : 'hidden'} md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6`}>
        <MultiSelect label="Jogadores" selected={filters.players} options={options.players} onChange={(v) => setFilters(p => ({...p, players: v}))} highlight />
        <MultiSelect label="Equipes" selected={filters.team} options={options.teams} onChange={(v) => setFilters(p => ({...p, team: v}))} />
        <MultiSelect label="Grupo" selected={filters.grupo} options={options.grupos} onChange={(v) => setFilters(p => ({...p, grupo: v}))} />
        <MultiSelect label="Confrontos" selected={filters.confrontation} options={options.confrontations} onChange={(v) => setFilters(p => ({...p, confrontation: v}))} />
        <MultiSelect label="Mapas" selected={filters.map} options={options.maps} onChange={(v) => setFilters(p => ({...p, map: v}))} />
        <MultiSelect label="Rodadas (RD)" selected={filters.rodada} options={options.rounds} onChange={(v) => setFilters(p => ({...p, rodada: v}))} />
        <MultiSelect label="Quedas (Q)" selected={filters.queda} options={options.quedas} onChange={(v) => setFilters(p => ({...p, queda: v}))} />
        {options.weapons.length > 0 && <MultiSelect label="Armas" selected={filters.weapon} options={options.weapons} onChange={(v) => setFilters(p => ({...p, weapon: v}))} />}
        {options.safes.length > 0 && <MultiSelect label="Safes" selected={filters.safe} options={options.safes} onChange={(v) => setFilters(p => ({...p, safe: v}))} />}
      </div>

      {hasActiveFilters && (
        <div className="mt-6 flex justify-end border-t border-white/5 pt-4">
          <button onClick={clearFilters} className="text-red-500 text-[10px] flex items-center gap-1 hover:text-red-400 font-black uppercase tracking-widest transition-colors">
            <X size={14} /> Resetar Filtros
          </button>
        </div>
      )}
    </div>
  );
};

interface MultiSelectProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (values: string[]) => void;
    highlight?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange, highlight }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const toggleOption = (option: string) => {
        const newSelected = selected.includes(option)
            ? selected.filter(s => s !== option)
            : [...selected, option];
        onChange(newSelected);
    };

    const filteredOptions = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col relative" ref={wrapperRef}>
            <label className="text-[10px] text-gray-500 uppercase mb-1.5 font-black tracking-widest">{label}</label>
            <div 
                className={`bg-black rounded-xl border transition-all duration-300 px-3 py-2.5 flex justify-between items-center cursor-pointer min-h-[42px] ${open ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-gray-800 hover:border-gray-600'}`}
                onClick={() => setOpen(!open)}
            >
                <div className="flex flex-wrap gap-1 max-w-[90%]">
                    {selected.length === 0 ? (
                        <span className="text-gray-600 text-[11px] font-bold uppercase italic">Todos(as)</span>
                    ) : (
                        <span className={`text-[11px] font-black uppercase italic ${highlight ? 'text-yellow-500' : 'text-white'}`}>
                            {selected.length === 1 ? selected[0] : `${selected.length} Selecionados`}
                        </span>
                    )}
                </div>
                <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </div>

            {open && (
                <div className="absolute top-full left-0 w-full mt-2 bg-[#121215] border border-gray-700 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-[100] max-h-72 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-gray-800 bg-black/40">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input 
                                type="text" 
                                placeholder="Filtrar..." 
                                className="w-full bg-black text-white p-2 pl-9 rounded-lg border border-gray-800 text-[11px] font-bold focus:outline-none focus:border-yellow-500 placeholder-gray-700"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                            <div 
                                key={opt} 
                                className={`px-4 py-3 hover:bg-yellow-500/10 cursor-pointer flex items-center justify-between text-[11px] font-bold border-b border-white/5 last:border-0 transition-colors ${selected.includes(opt) ? 'bg-yellow-500/5 text-yellow-500' : 'text-gray-400 hover:text-white'}`}
                                onClick={() => toggleOption(opt)}
                            >
                                <span className="uppercase italic">{opt}</span>
                                {selected.includes(opt) && <Check size={14} className="text-yellow-500" />}
                            </div>
                        )) : (
                            <div className="p-4 text-gray-600 text-[10px] text-center font-black uppercase italic tracking-widest">Nenhum resultado</div>
                        )}
                    </div>
                </div>
            )}

            {selected.length > 0 && (
                 <div className="flex flex-wrap gap-1 mt-2">
                    {selected.map(s => (
                        <div key={s} className="group flex items-center gap-1.5 bg-yellow-500 text-black px-2 py-0.5 rounded-md font-black text-[9px] uppercase italic shadow-sm hover:bg-yellow-400 transition-colors">
                            {s}
                            <button onClick={(e) => { e.stopPropagation(); toggleOption(s); }} className="hover:text-red-700 transition-colors">
                                <X size={10} strokeWidth={4}/>
                            </button>
                        </div>
                    ))}
                 </div>
            )}
        </div>
    );
};

export default FilterBar;
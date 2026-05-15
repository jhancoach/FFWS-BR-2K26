import React, { useState, useEffect, useRef } from 'react';
import { Map, Trash2, Crosshair, ZoomIn, ZoomOut, Move, LogIn, LogOut, X } from 'lucide-react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, User } from 'firebase/auth';

const MAPS = [
    { id: 'BER', name: 'Bermuda', url: 'https://i.ibb.co/q34yct8f/BERMUDA-MAPA.png' },
    { id: 'PUR', name: 'Purgatório', url: 'https://i.ibb.co/G4sGkqk1/image.png' },
    { id: 'KAL', name: 'Kalahari', url: 'https://i.ibb.co/7t4mHjWy/image.png' },
    { id: 'NT', name: 'Nova Terra', url: 'https://i.ibb.co/vC4pT91L/image.png' },
    { id: 'SOL', name: 'Solara', url: 'https://i.ibb.co/sdQ8hqbM/image.png' }
];

// Resolving clicking into a relative coordinate (0-100% of width/height).
// Or we can use a grid. Let's use a 50x50 grid.
const GRID_SIZE = 50; 

interface SafePoint {
    x: number;
    y: number;
    count: number;
}

const Studies: React.FC = () => {
    const [selectedMap, setSelectedMap] = useState(MAPS[0]);
    const [points, setPoints] = useState<SafePoint[]>([]);
    
    // Zoom and Pan state
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [user, setUser] = useState<User | null>(null);

    // Auth Modal State
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [authMessage, setAuthMessage] = useState('');
    
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        setPoints([]);
        setZoom(1);
        setPan({ x: 0, y: 0 });

        const unsubscribeSnapshot = onSnapshot(doc(db, 'studies', selectedMap.id), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                if (data && data.points) {
                    try {
                        const parsed = JSON.parse(data.points);
                        setPoints(parsed);
                    } catch (e) {
                        setPoints([]);
                    }
                } else {
                    setPoints([]);
                }
            } else {
                setPoints([]);
            }
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, `studies/${selectedMap.id}`);
        });

        return () => unsubscribeSnapshot();
    }, [selectedMap]);

    const savePoints = async (newPoints: SafePoint[]) => {
        if (!user) {
            alert("Faça login com a conta de admin para adicionar ou remover marcações.");
            return;
        }

        const previousPoints = [...points];
        setPoints(newPoints); // Optimistic UI update

        try {
            await setDoc(doc(db, 'studies', selectedMap.id), {
                mapId: selectedMap.id,
                points: JSON.stringify(newPoints)
            });
        } catch (error) {
            console.error(error);
            setPoints(previousPoints); // Revert on failure
            alert("Permissão negada ou erro ao salvar pontos.");
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setAuthMessage('');
        
        if (authPassword !== '221120') {
            setAuthError("Senha incorreta!");
            return;
        }

        const adminEmail = 'admin@ffws.com';
        const securePassword = 'ffws_admin_secure_password_221120'; // This ensures the account password length requirement is met securely

        try {
            await signInWithEmailAndPassword(auth, adminEmail, securePassword);
            setShowAuthModal(false);
            setAuthPassword('');
        } catch (error: any) {
            try {
                // First time ever getting initialized
                await createUserWithEmailAndPassword(auth, adminEmail, securePassword);
                setShowAuthModal(false);
                setAuthPassword('');
            } catch (createError: any) {
                setAuthError("Erro de sistema: " + createError.message);
            }
        }
    };

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) return; // Prevent adding points when dragging
        
        const rect = e.currentTarget.getBoundingClientRect();
        
        // Compute click coordinates relative to the original image dimensions without zoom
        // rect width and height are the visual size (including zoom if transformed, but we attach click to the inner container or image)
        
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

        // Snap to grid or just use coordinate points and cluster them visually
        // Clustering visually via overlapping radial gradients is smoother, 
        // but user asked "numero de vezes em que a safe fechou ao clicar... vai acrescentando a quantidade".
        // Let's quantize the coordinates to 2% blocks (e.g. 50x50 grid)
        const cellX = Math.floor(xPercent / 2) * 2;
        const cellY = Math.floor(yPercent / 2) * 2;

        const existingPointIndex = points.findIndex(p => p.x === cellX && p.y === cellY);

        if (existingPointIndex >= 0) {
            const newPoints = [...points];
            newPoints[existingPointIndex].count += 1;
            savePoints(newPoints);
        } else {
            savePoints([...points, { x: cellX, y: cellY, count: 1 }]);
        }
    };

    const handleMapRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

        const cellX = Math.floor(xPercent / 2) * 2;
        const cellY = Math.floor(yPercent / 2) * 2;

        const existingPointIndex = points.findIndex(p => p.x === cellX && p.y === cellY);

        if (existingPointIndex >= 0) {
            const newPoints = [...points];
            if (newPoints[existingPointIndex].count > 1) {
                newPoints[existingPointIndex].count -= 1;
            } else {
                newPoints.splice(existingPointIndex, 1);
            }
            savePoints(newPoints);
        }
    }

    const handleClear = () => {
        if (!user) {
            alert("Faça login com a conta de admin para usar esta função.");
            return;
        }
        if (window.confirm("Deseja realmente limpar todos os pontos deste mapa?")) {
            savePoints([]);
        }
    };

    const maxCount = Math.max(...points.map(p => p.count), 1);

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500 relative">
            
            {showAuthModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
                        <button 
                            onClick={() => setShowAuthModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-2xl font-black uppercase italic tracking-widest text-white mb-6">Autenticação</h2>
                        
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Senha de Administrador</label>
                                <input 
                                    type="password" 
                                    value={authPassword}
                                    onChange={e => setAuthPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                                    required
                                    autoFocus
                                    placeholder="Digite a senha..."
                                />
                            </div>

                            {authError && <div className="text-red-500 text-sm font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20">{authError}</div>}
                            {authMessage && <div className="text-green-500 text-sm font-bold bg-green-500/10 p-3 rounded-lg border border-green-500/20">{authMessage}</div>}

                            <div className="flex flex-col gap-3 pt-4">
                                <button type="submit" className="w-full bg-yellow-500 text-black font-black uppercase tracking-widest py-3 rounded-lg hover:bg-yellow-400 transition-colors">
                                    Entrar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black uppercase italic tracking-widest text-white shadow-sm flex items-center gap-4">
                        Estudos de Safe
                        {user ? (
                            <div className="flex items-center gap-2 ml-4">
                                <button onClick={() => signOut(auth)} className="text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-full flex items-center gap-2 transition-colors shadow-sm border border-red-500/20">
                                    <LogOut size={12} /> Sair (Admin)
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setShowAuthModal(true)} className="text-xs font-bold text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 px-3 py-1.5 rounded-full flex items-center gap-2 transition-colors ml-4 shadow-sm border border-yellow-500/20">
                                <LogIn size={12} /> Login de Administrador
                            </button>
                        )}
                    </h1>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Clique para adicionar, botão direito para remover.</p>
                </div>
                
                <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 shadow-inner">
                    {MAPS.map(map => (
                        <button 
                            key={map.id}
                            onClick={() => setSelectedMap(map)}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                selectedMap.id === map.id 
                                ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {map.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 p-6 flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
                {/* Controls */}
                <div className="absolute top-8 right-8 z-20 flex flex-col gap-2 bg-black/80 p-2 rounded-xl border border-gray-800 backdrop-blur-sm">
                    <button onClick={() => setZoom(z => Math.min(z + 0.5, 4))} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Zoom In">
                        <ZoomIn size={20} />
                    </button>
                    <button onClick={() => setZoom(z => Math.max(z - 0.5, 1))} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Zoom Out">
                        <ZoomOut size={20} />
                    </button>
                    <button onClick={() => {setZoom(1); setPan({x:0,y:0})}} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Reset">
                        <Move size={20} />
                    </button>
                    <div className="h-px bg-white/10 my-1"></div>
                    <button onClick={handleClear} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors" title="Limpar Mapa">
                        <Trash2 size={20} />
                    </button>
                </div>

                <div 
                    className="relative w-full max-w-[800px] aspect-square rounded-2xl overflow-hidden bg-[#0a0a0a] border-2 border-gray-800 cursor-crosshair shadow-inner flex items-center justify-center"
                    ref={containerRef}
                    onWheel={(e) => {
                        e.preventDefault();
                        if (e.deltaY < 0) {
                            setZoom(z => Math.min(z + 0.2, 4));
                        } else {
                            setZoom(z => Math.max(z - 0.2, 1));
                        }
                    }}
                    onMouseDown={(e) => {
                        if (e.button === 1 || e.altKey) { // Middle click or Alt+Click for dragging
                            e.preventDefault();
                            setIsDragging(true);
                            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                        }
                    }}
                    onMouseMove={(e) => {
                        if (isDragging) {
                            setPan({
                                x: e.clientX - dragStart.x,
                                y: e.clientY - dragStart.y
                            });
                        }
                    }}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                >
                    {/* The map and overlay layer that zooms and pans */}
                    <div 
                        className="relative w-full h-full transition-transform duration-75 ease-out origin-center"
                        style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
                    >
                        <img 
                            src={selectedMap.url} 
                            alt={selectedMap.name} 
                            className="w-full h-full object-cover select-none pointer-events-none opacity-80" 
                            draggable={false}
                        />

                        {/* Interactive layer exactly matching image size */}
                        <div 
                            className="absolute inset-0 z-10" 
                            onClick={handleMapClick}
                            onContextMenu={handleMapRightClick}
                        >
                            {points.map((p, i) => {
                                // Intensity for heat coloring
                                const intensity = p.count / maxCount;
                                
                                // Color logic: Low (Yellow/Green) -> Mid (Orange) -> High (Red)
                                let bgColor = 'bg-yellow-400';
                                if (intensity > 0.3) bgColor = 'bg-orange-500';
                                if (intensity > 0.6) bgColor = 'bg-red-500';
                                if (intensity > 0.8) bgColor = 'bg-red-600';

                                return (
                                    <div 
                                        key={i}
                                        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                                        style={{ left: `${p.x + 1}%`, top: `${p.y + 1}%` }} // +1% to offset center of 2% block
                                    >
                                        <div className={`absolute w-12 h-12 rounded-full ${bgColor} blur-md opacity-40 mix-blend-screen`}></div>
                                        <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
                                            <div className="bg-black/80 rounded-sm border border-white/20 px-1 py-0.5 shadow-xl text-center flex flex-col items-center min-w-[20px]">
                                                <span className={`text-[10px] font-black text-white leading-none`}>{p.count}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6 bg-black/40 px-8 py-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <Crosshair size={18} className="text-yellow-500" />
                        <div>
                            <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total de Fechamentos Marcados</span>
                            <span className="block text-xl font-black text-white italic leading-none">{points.reduce((acc, p) => acc + p.count, 0)}</span>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-gray-800 mx-2"></div>
                    <div className="flex items-center gap-3">
                        <Map size={18} className="text-blue-500" />
                        <div>
                            <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest">Zonas Distintas</span>
                            <span className="block text-xl font-black text-white italic leading-none">{points.length}</span>
                        </div>
                    </div>
                 </div>
                 
            </div>
        </div>
    );
};

export default Studies;

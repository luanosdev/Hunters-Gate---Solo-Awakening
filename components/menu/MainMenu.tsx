
import React, { useState } from 'react';
import { Player, PortalMission, Item, EquipmentSlot, StatType } from '../../types';
import { RANK_META, SHOP_ITEMS, RARITY_COLORS } from '../../constants';
import { Coins, MapPin, Briefcase, ShoppingBag, Lock, Skull, Ghost, Crown, Circle, Swords, Shirt, Diamond, Hand, Club, Footprints, Plus } from 'lucide-react';
import { ItemIcon } from '../ui/ItemIcon';

interface MainMenuProps {
    player: Player;
    score: number;
    missions: PortalMission[];
    onStartMission: (mission: PortalMission) => void;
    renderEquipSlot: (slot: EquipmentSlot, icon: React.ReactNode) => React.ReactNode;
    handleDragOver: (e: React.DragEvent) => void;
    handleDropOnInventory: (e: React.DragEvent) => void;
    handleDragStart: (e: React.DragEvent, item: Item, source: 'INVENTORY' | 'GROUND' | 'EQUIPPED', slot?: EquipmentSlot) => void;
    onItemClick: (item: Item, type: 'INVENTORY' | 'SHOP_BUY' | 'SHOP_SELL') => void;
    onUpgradeStat?: (stat: StatType) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ player, score, missions, onStartMission, renderEquipSlot, handleDragOver, handleDropOnInventory, handleDragStart, onItemClick, onUpgradeStat }) => {
    const [menuTab, setMenuTab] = useState<'MISSIONS' | 'INVENTORY' | 'SHOP'>('MISSIONS');
    const hasWeapon = !!player.equipment.MAIN_HAND;

    const stats: { key: StatType, label: string }[] = [
        { key: 'strength', label: 'Strength' },
        { key: 'agility', label: 'Agility' },
        { key: 'vitality', label: 'Vitality' },
        { key: 'perception', label: 'Perception' },
        { key: 'intelligence', label: 'Intelligence' },
    ];

    return (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center p-8 overflow-y-auto">
            <div className="max-w-6xl w-full relative">
                <header className="mb-8 text-center">
                    <h1 className="text-5xl font-bold text-blue-500 mb-2 uppercase tracking-tighter" style={{ textShadow: '0 0 30px rgba(59,130,246,0.5)' }}>Hunter's Gate</h1>
                    <div className="mt-4 inline-flex items-center gap-6 bg-slate-800 p-2 rounded-full border border-slate-700 px-8">
                        <span className="text-blue-300">Rank: <span className="font-bold text-white">{player.level}</span></span>
                        <span className="w-px h-4 bg-slate-600"></span>
                        <div className="flex items-center gap-2 text-yellow-500">
                            <Coins size={16} />
                            <span className="font-bold">{score} G</span>
                        </div>
                    </div>
                </header>

                <div className="flex justify-center gap-4 mb-8">
                    <button onClick={() => setMenuTab('MISSIONS')} className={`px-6 py-2 rounded uppercase font-bold tracking-wider transition-all ${menuTab === 'MISSIONS' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><div className="flex items-center gap-2"><MapPin size={18} /> Portals</div></button>
                    <button onClick={() => setMenuTab('INVENTORY')} className={`px-6 py-2 rounded uppercase font-bold tracking-wider transition-all ${menuTab === 'INVENTORY' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><div className="flex items-center gap-2"><Briefcase size={18} /> Inventory</div></button>
                    <button onClick={() => setMenuTab('SHOP')} className={`px-6 py-2 rounded uppercase font-bold tracking-wider transition-all ${menuTab === 'SHOP' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><div className="flex items-center gap-2"><ShoppingBag size={18} /> Shop</div></button>
                </div>

                <div className="min-h-[500px]">
                    {menuTab === 'MISSIONS' && (
                        <div className="flex flex-wrap justify-center items-end gap-6 h-96">
                            {missions.map((mission) => {
                                const meta = RANK_META[mission.rank] || RANK_META['E'];
                                return (
                                    <div key={mission.id} onClick={() => { if(hasWeapon) onStartMission(mission); }} className={`relative group transition-all flex flex-col justify-end bg-slate-900 border rounded-t-full overflow-hidden w-48 ${meta.heightClass} ${hasWeapon ? 'cursor-pointer hover:scale-105' : 'opacity-50 grayscale cursor-not-allowed'}`} style={{ borderColor: hasWeapon ? meta.color : '#333', boxShadow: hasWeapon ? `0 0 20px ${meta.shadow}` : 'none' }}>
                                        <div className="absolute inset-0 opacity-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" style={{ backgroundColor: meta.color }}></div>
                                        <div className="absolute inset-0 bg-black/40"></div>
                                        <div className="absolute inset-0 mix-blend-overlay opacity-30 animate-pulse" style={{ backgroundColor: meta.color }}></div>
                                        
                                        {!hasWeapon && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                                                <div className="bg-red-900/80 px-2 py-1 rounded border border-red-500 flex items-center gap-1">
                                                    <Lock size={12} className="text-red-300"/>
                                                    <span className="text-[10px] font-bold text-red-100 uppercase">Need Weapon</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="relative z-10 p-4 text-center">
                                            <div className="text-6xl font-black mb-2 drop-shadow-md" style={{ color: meta.color }}>{mission.rank}</div>
                                            <div className="text-xs text-white bg-black/50 px-2 py-1 rounded backdrop-blur-sm mb-2">{mission.description}</div>
                                            <div className="flex justify-center gap-1 mb-2">{[...Array(mission.difficulty)].map((_,i) => <Skull key={i} size={12} className="text-red-500" />)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {menuTab === 'INVENTORY' && (
                        <div className="grid grid-cols-2 gap-8 bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                            {/* Equipment Grid */}
                            <div className="flex flex-col items-center gap-4">
                                <h3 className="text-xl font-bold text-slate-300 uppercase">Equipped</h3>
                                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800/30 rounded-lg">
                                    <div className="flex justify-center">{renderEquipSlot('CAPE', <Ghost size={24} />)}</div>
                                    <div className="flex justify-center">{renderEquipSlot('HEAD', <Crown size={24} />)}</div>
                                    <div className="flex justify-center">{renderEquipSlot('NECK', <Circle size={24} />)}</div>
                                    
                                    <div className="flex justify-center">{renderEquipSlot('MAIN_HAND', <Swords size={24} />)}</div>
                                    <div className="flex justify-center">{renderEquipSlot('CHEST', <Shirt size={24} />)}</div>
                                    <div className="flex justify-center">{renderEquipSlot('RING1', <Diamond size={24} />)}</div>
                                    
                                    <div className="flex justify-center">{renderEquipSlot('GLOVES', <Hand size={24} />)}</div>
                                    <div className="flex justify-center">{renderEquipSlot('LEGS', <Club size={24} />)}</div>
                                    <div className="flex justify-center">{renderEquipSlot('RING2', <Diamond size={24} />)}</div>
                                    
                                    <div></div>
                                    <div className="flex justify-center">{renderEquipSlot('BOOTS', <Footprints size={24} />)}</div>
                                    <div></div>
                                </div>
                                
                                {/* Stats Panel in Main Menu */}
                                <div className="w-full bg-slate-900 border border-slate-800 rounded p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-bold text-slate-400 uppercase">Attributes</h4>
                                        {player.attributePoints > 0 && <span className="text-yellow-500 font-mono text-xs font-bold">{player.attributePoints} PTS Available</span>}
                                    </div>
                                    <div className="space-y-1">
                                        {stats.map(s => (
                                            <div key={s.key} className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500 uppercase">{s.label}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-mono">{player[s.key]}</span>
                                                    {player.attributePoints > 0 && onUpgradeStat && (
                                                        <button onClick={() => onUpgradeStat(s.key)} className="text-blue-500 hover:text-white"><Plus size={12} /></button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Backpack */}
                            <div onDragOver={handleDragOver} onDrop={handleDropOnInventory}>
                                <h3 className="text-xl font-bold text-slate-300 uppercase mb-6">Storage ({player.inventory.length}/20)</h3>
                                <div className="grid grid-cols-5 gap-2">
                                    {player.inventory.map((item, idx) => (
                                        <div key={item.id + idx} className="aspect-square bg-slate-900 border border-slate-700 hover:border-blue-500 rounded p-2 relative group cursor-pointer cursor-move" draggable onDragStart={(e) => handleDragStart(e, item, 'INVENTORY')} onClick={() => { onItemClick(item, 'INVENTORY'); }}>
                                            <div className="flex items-center justify-center h-full hover:scale-110 transition-transform" style={{ color: RARITY_COLORS[item.rarity] }}>
                                                <ItemIcon item={item} size={20} />
                                            </div>
                                        </div>
                                    ))}
                                    {[...Array(Math.max(0, 20 - player.inventory.length))].map((_, i) => <div key={`e_${i}`} className="aspect-square bg-slate-900/50 border border-slate-800 rounded"></div>)}
                                </div>
                            </div>
                        </div>
                    )}

                    {menuTab === 'SHOP' && (
                        <div className="grid grid-cols-2 gap-8 h-full">
                            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                                <h3 className="text-xl font-bold text-blue-400 uppercase mb-4 border-b border-slate-700 pb-2">Hunter's Association Store</h3>
                                <div className="space-y-3 overflow-y-auto max-h-96 custom-scrollbar pr-2">
                                    {SHOP_ITEMS.map((item) => (
                                        <div key={item.id} className="bg-slate-900 p-3 rounded flex items-center justify-between border border-slate-800 hover:border-blue-500 transition-colors cursor-pointer" onClick={() => { onItemClick(item, 'SHOP_BUY'); }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center" style={{ color: RARITY_COLORS[item.rarity] }}>
                                                    <ItemIcon item={item} size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm" style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</p>
                                                    <div className="text-[10px] text-slate-400 flex gap-2"><span>Pwr: {item.power}x</span></div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-yellow-500 font-bold">{item.price} G</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                                <h3 className="text-xl font-bold text-green-400 uppercase mb-4 border-b border-slate-700 pb-2">Sell Loot</h3>
                                <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-96 custom-scrollbar">
                                    {player.inventory.map((item, idx) => (
                                        <div key={item.id + idx} className="bg-slate-900 p-2 rounded flex flex-col gap-2 border border-slate-800 group relative cursor-pointer" onClick={() => { onItemClick(item, 'SHOP_SELL'); }}>
                                            <div className="flex items-center gap-2">
                                                <div className="text-xs" style={{ color: RARITY_COLORS[item.rarity] }}>
                                                    <ItemIcon item={item} size={16} />
                                                </div>
                                                <span className="text-xs font-bold truncate flex-1" style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</span>
                                            </div>
                                            <div className="text-[10px] text-green-400 text-center">Sell for {Math.floor(item.price / 2)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

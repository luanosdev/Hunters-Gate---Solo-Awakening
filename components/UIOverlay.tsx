import React, { useState } from 'react';
import { Player, GameState, WeaponType, Rarity, Item, PortalMission, Enemy, EquipmentSlot } from '../types';
import { RARITY_COLORS, DODGE_COOLDOWN, RANK_META, SHOP_ITEMS } from '../constants';
import { Shield, Swords, Crosshair, Sparkles, Hand, Backpack, MapPin, Skull, ChevronsRight, Wind, ShoppingBag, Briefcase, Coins, Heart, Eye, Brain, BicepsFlexed, Plus, X, Shirt, Crown, Footprints, Club, Target, Circle, Diamond, Ghost, Lock } from 'lucide-react';

interface UIProps {
  gameState: GameState;
  player: Player;
  activeBoss: Enemy | null;
  score: number;
  dungeonTimer?: number;
  missions: PortalMission[];
  groundItems: (Item & { x: number, y: number })[];
  onStartMission: (mission: PortalMission) => void;
  onRestart: () => void;
  onEquip: (item: Item, targetSlot?: EquipmentSlot) => void;
  onEquipFromGround?: (item: Item) => void;
  onUnequip: (slot: EquipmentSlot) => void;
  onDrop: (item: Item) => void;
  onDropEquipped?: (slot: EquipmentSlot) => void;
  onPickup: (item: Item) => void;
  onBuy?: (item: Item) => void;
  onSell?: (item: Item) => void;
  onUpgradeStat?: (stat: 'strength' | 'agility' | 'vitality' | 'perception' | 'intelligence') => void;
}

const ProgressBar = ({ current, max, color }: { current: number; max: number; color: string }) => (
  <div className="w-full h-3 bg-gray-900 rounded-sm border border-gray-700 overflow-hidden relative shadow-[0_0_5px_rgba(0,0,0,0.5)]">
     <div className="absolute inset-0 bg-gray-800/50"></div>
    <div
      className="h-full transition-all duration-200 relative z-10"
      style={{ width: `${Math.max(0, Math.min(100, (current / max) * 100))}%`, backgroundColor: color }}
    />
  </div>
);

const RarityBadge = ({ rarity }: { rarity: Rarity }) => (
  <span className="text-[10px] px-1 rounded bg-black/50 border border-white/10" style={{ color: RARITY_COLORS[rarity] }}>
    {rarity}
  </span>
);

// Helper to render consistent icons based on item type/slot
const getItemIcon = (item: Item, size: number = 24) => {
    if (item.type === WeaponType.SWORD) return <Swords size={size} />;
    if (item.type === WeaponType.BOW) return <Crosshair size={size} />;
    if (item.type === WeaponType.STAFF) return <Sparkles size={size} />;
    
    // Armor / Accessory mapping
    switch (item.slot) {
        case 'HEAD': return <Crown size={size} />;
        case 'CHEST': return <Shirt size={size} />;
        case 'LEGS': return <Club size={size} />; // Represents pants/leggings abstractly or use another icon
        case 'BOOTS': return <Footprints size={size} />;
        case 'GLOVES': return <Hand size={size} />;
        case 'CAPE': return <Ghost size={size} />;
        case 'NECK': return <Circle size={size} />;
        case 'RING1': 
        case 'RING2': return <Diamond size={size} />;
        default: return <Shield size={size} />;
    }
};

const ItemDetailModal = ({ item, context, onClose, actions }: { item: Item; context: 'INVENTORY' | 'GROUND' | 'EQUIPPED' | 'SHOP_BUY' | 'SHOP_SELL'; onClose: () => void; actions: React.ReactNode }) => {
    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="w-80 bg-slate-900 border border-blue-500/50 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.2)]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 bg-slate-800 border-b border-slate-700 relative">
                    <h3 className="text-xl font-bold uppercase tracking-wider" style={{ color: item.color }}>{item.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-slate-400 uppercase">{item.rarity} {item.type} {item.setName ? `(${item.setName} Set)` : ''}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 uppercase">{context.replace('_', ' ')}</span>
                    </div>
                    <button onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white"><X size={20}/></button>
                </div>
                
                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                            <span className="block text-xs text-slate-500 uppercase">Power</span>
                            <span className="text-yellow-400 font-mono text-lg">{item.power}x</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                            <span className="block text-xs text-slate-500 uppercase">Quality</span>
                            <span className="text-blue-400 font-mono text-lg">{item.quality}</span>
                        </div>
                    </div>

                    {/* Base Stats */}
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                        {item.baseStat ? (
                            <div className="flex justify-between items-center px-2">
                                <span className="uppercase text-xs text-slate-400">{item.baseStat.type}</span>
                                <span className="font-bold text-lg text-white">+{item.baseStat.value}</span>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center px-2">
                                <span className="uppercase text-xs text-slate-400">Damage</span>
                                <span className="font-bold text-lg text-white">{item.baseDamage}</span>
                            </div>
                        )}
                    </div>

                    {/* Scaling (Weapons only) */}
                    {item.type !== 'ARMOR' && item.type !== 'ACCESSORY' && (
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                            <span className="block text-xs text-slate-500 uppercase mb-1">Scaling</span>
                            <div className="flex justify-between items-center px-2">
                                <span className="text-[10px] text-red-400">STR: {item.scaling.strength}</span>
                                <span className="text-[10px] text-green-400">AGI: {item.scaling.agility}</span>
                                <span className="text-[10px] text-purple-400">INT: {item.scaling.intelligence}</span>
                            </div>
                        </div>
                    )}

                    {/* Affixes */}
                    {item.affixes.length > 0 && (
                        <div>
                            <span className="block text-xs text-slate-500 uppercase mb-1">Bonus Effects</span>
                            <div className="space-y-1">
                                {item.affixes.map((affix, idx) => (
                                    <div key={idx} className="flex justify-between text-xs bg-slate-800/50 px-2 py-1 rounded">
                                        <span className="uppercase text-blue-200">{affix.type}</span>
                                        <span className="text-green-400">+{affix.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="text-center text-xs text-yellow-600">Value: {item.price} G</div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex gap-2">
                    {actions}
                </div>
            </div>
        </div>
    );
}

export const UIOverlay: React.FC<UIProps> = ({ 
  gameState, player, activeBoss, score, dungeonTimer, missions, groundItems,
  onStartMission, onRestart, onEquip, onEquipFromGround, onUnequip, onDrop, onDropEquipped, onPickup, onBuy, onSell, onUpgradeStat
}) => {
  const [menuTab, setMenuTab] = useState<'MISSIONS' | 'INVENTORY' | 'SHOP'>('MISSIONS');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [interactionType, setInteractionType] = useState<'INVENTORY' | 'GROUND' | 'EQUIPPED' | 'SHOP_BUY' | 'SHOP_SELL' | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null); // Track which slot was clicked

  const handleDragStart = (e: React.DragEvent, item: Item, source: 'INVENTORY' | 'GROUND' | 'EQUIPPED', slot?: EquipmentSlot) => {
      e.dataTransfer.setData('application/json', JSON.stringify({ item, source, slot }));
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  // Helper to render an Equipment Slot
  const renderEquipSlot = (slot: EquipmentSlot, icon: React.ReactNode) => {
      const item = player.equipment[slot];
      return (
          <div 
            className="w-14 h-14 bg-slate-900 border border-slate-700 rounded flex items-center justify-center relative group cursor-pointer hover:border-blue-500 transition-colors"
            onDragOver={handleDragOver}
            onDrop={(e) => {
                e.preventDefault();
                try {
                    const data = JSON.parse(e.dataTransfer.getData('application/json'));
                    // Check if item slot matches or is compatible (Ring1/Ring2)
                    const isCompatible = data.item.slot === slot || (data.item.slot === 'RING1' && (slot === 'RING1' || slot === 'RING2'));
                    
                    if (data.source === 'INVENTORY' && isCompatible) onEquip(data.item, slot);
                    if (data.source === 'GROUND' && isCompatible) onEquipFromGround?.(data.item);
                } catch(err) {}
            }}
            onClick={() => {
                if (item) {
                    setSelectedItem(item);
                    setInteractionType('EQUIPPED');
                    setSelectedSlot(slot);
                }
            }}
          >
              {item ? (
                  <div 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, item, 'EQUIPPED', slot)}
                    className="w-full h-full flex items-center justify-center"
                    style={{ color: RARITY_COLORS[item.rarity] }}
                  >
                      {getItemIcon(item, 28)}
                  </div>
              ) : (
                  <div className="text-slate-700">{icon}</div>
              )}
              {/* Tooltip */}
              {item && (
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-[10px] p-1 rounded whitespace-nowrap z-50">
                      {item.name}
                  </div>
              )}
          </div>
      );
  };

  const handleDropOnVicinity = (e: React.DragEvent) => {
      e.preventDefault();
      try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'));
          if (data.source === 'INVENTORY') onDrop(data.item);
          else if (data.source === 'EQUIPPED' && data.slot) onDropEquipped?.(data.slot);
      } catch (err) {}
  };

  const handleDropOnInventory = (e: React.DragEvent) => {
      e.preventDefault();
      try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'));
          if (data.source === 'GROUND') onPickup(data.item);
          else if (data.source === 'EQUIPPED' && data.slot) onUnequip(data.slot);
      } catch (err) {}
  };

  // --- GAME OVER ---
  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 animate-in fade-in duration-1000">
        <h1 className="text-7xl font-black text-red-600 mb-4 tracking-tighter" style={{ textShadow: '0 0 50px #ef4444' }}>VOCÊ MORREU</h1>
        <div className="w-16 h-1 bg-red-800 mb-8"></div>
        <p className="text-sm text-gray-500 uppercase tracking-widest animate-pulse">Retornando ao Menu...</p>
      </div>
    );
  }

  // --- MODAL RENDER ---
  const modal = selectedItem && interactionType && (
    <ItemDetailModal 
        item={selectedItem} 
        context={interactionType}
        onClose={() => setSelectedItem(null)}
        actions={
            <>
                {interactionType === 'INVENTORY' && (
                    <>
                        <button onClick={() => { onEquip(selectedItem); setSelectedItem(null); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold uppercase text-xs">Equip</button>
                        <button onClick={() => { onDrop(selectedItem); setSelectedItem(null); }} className="flex-1 bg-red-600/50 hover:bg-red-500 text-white py-2 rounded font-bold uppercase text-xs">Drop</button>
                    </>
                )}
                {interactionType === 'EQUIPPED' && selectedSlot && (
                    <button onClick={() => { onUnequip(selectedSlot); setSelectedItem(null); }} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded font-bold uppercase text-xs">Unequip</button>
                )}
                {interactionType === 'GROUND' && (
                    <>
                        <button onClick={() => { onPickup(selectedItem); setSelectedItem(null); }} className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded font-bold uppercase text-xs">Pickup</button>
                        <button onClick={() => { onEquipFromGround?.(selectedItem); setSelectedItem(null); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold uppercase text-xs">Equip</button>
                    </>
                )}
                {interactionType === 'SHOP_BUY' && (
                    <button disabled={score < selectedItem.price} onClick={() => { onBuy?.(selectedItem); setSelectedItem(null); }} className={`flex-1 py-2 rounded font-bold uppercase text-xs ${score >= selectedItem.price ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-slate-700 text-slate-500'}`}>
                        Buy ({selectedItem.price} G)
                    </button>
                )}
                {interactionType === 'SHOP_SELL' && (
                    <button onClick={() => { onSell?.(selectedItem); setSelectedItem(null); }} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold uppercase text-xs">
                        Sell ({Math.floor(selectedItem.price / 2)} G)
                    </button>
                )}
            </>
        }
    />
  );

  const hasWeapon = !!player.equipment.MAIN_HAND;

  // --- RENDER CONTENT ---
  return (
      <>
        {modal}

        {gameState === GameState.DUNGEON && (
            <>
                <div className="absolute top-0 inset-x-0 h-1 bg-gray-900 z-50">
                    <div className="h-full bg-yellow-500 shadow-[0_0_10px_#eab308]" style={{ width: `${(player.exp / (player.level * 100)) * 100}%` }}></div>
                </div>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-yellow-500/80 uppercase tracking-widest z-50 drop-shadow-md">
                    Level {player.level}
                </div>

                <InGameHUD 
                    player={player} 
                    dungeonTimer={dungeonTimer} 
                    activeBoss={activeBoss} 
                    inventoryOpen={player.inventoryOpen}
                    groundItems={groundItems}
                    onEquip={onEquip}
                    onEquipFromGround={onEquipFromGround}
                    onUnequip={onUnequip}
                    onDrop={onDrop}
                    onDropEquipped={onDropEquipped}
                    onPickup={onPickup}
                    onItemClick={(item, type) => { setSelectedItem(item); setInteractionType(type); }}
                    renderEquipSlot={renderEquipSlot} // Pass the render function down
                    handleDropOnInventory={handleDropOnInventory}
                    handleDropOnVicinity={handleDropOnVicinity}
                    handleDragStart={handleDragStart}
                />
            </>
        )}

        {gameState === GameState.MENU && (
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
                                <div className="flex flex-col items-center">
                                    <h3 className="text-xl font-bold text-slate-300 uppercase mb-6">Equipped</h3>
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
                                </div>

                                {/* Backpack */}
                                <div onDragOver={handleDragOver} onDrop={handleDropOnInventory}>
                                    <h3 className="text-xl font-bold text-slate-300 uppercase mb-6">Storage ({player.inventory.length}/20)</h3>
                                    <div className="grid grid-cols-5 gap-2">
                                        {player.inventory.map((item, idx) => (
                                            <div key={item.id + idx} className="aspect-square bg-slate-900 border border-slate-700 hover:border-blue-500 rounded p-2 relative group cursor-pointer cursor-move" draggable onDragStart={(e) => handleDragStart(e, item, 'INVENTORY')} onClick={() => { setSelectedItem(item); setInteractionType('INVENTORY'); }}>
                                                <div className="flex items-center justify-center h-full hover:scale-110 transition-transform" style={{ color: RARITY_COLORS[item.rarity] }}>
                                                    {getItemIcon(item, 20)}
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
                                            <div key={item.id} className="bg-slate-900 p-3 rounded flex items-center justify-between border border-slate-800 hover:border-blue-500 transition-colors cursor-pointer" onClick={() => { setSelectedItem(item); setInteractionType('SHOP_BUY'); }}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center" style={{ color: RARITY_COLORS[item.rarity] }}>
                                                        {getItemIcon(item, 20)}
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
                                            <div key={item.id + idx} className="bg-slate-900 p-2 rounded flex flex-col gap-2 border border-slate-800 group relative cursor-pointer" onClick={() => { setSelectedItem(item); setInteractionType('SHOP_SELL'); }}>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-xs" style={{ color: RARITY_COLORS[item.rarity] }}>
                                                        {getItemIcon(item, 16)}
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
        )}
      </>
  );
};

const InGameHUD: React.FC<any> = ({ player, dungeonTimer, activeBoss, inventoryOpen, groundItems, onEquip, onEquipFromGround, onUnequip, onDrop, onDropEquipped, onPickup, onItemClick, renderEquipSlot, handleDropOnInventory, handleDropOnVicinity, handleDragStart }) => {
    
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

    return (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-6 left-4 w-60 pointer-events-auto z-10 flex flex-col gap-1">
              <div className="flex justify-between items-end"><span className="text-red-500 font-bold text-xs uppercase drop-shadow-md">HP</span><span className="text-white text-[10px] drop-shadow-md font-mono">{Math.round(player.hp)} / {player.maxHp}</span></div>
              <ProgressBar current={player.hp} max={player.maxHp} color="#ef4444" />
              <div className="flex justify-between items-end mt-1"><span className="text-blue-500 font-bold text-xs uppercase drop-shadow-md">MP</span><span className="text-white text-[10px] drop-shadow-md font-mono">{Math.round(player.mana)} / {player.maxMana}</span></div>
              <ProgressBar current={player.mana} max={player.maxMana} color="#3b82f6" />
          </div>
    
          {dungeonTimer !== undefined && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center pointer-events-auto">
               <div className={`px-8 py-2 rounded-sm border-x-4 backdrop-blur-sm shadow-2xl transition-colors duration-500 ${dungeonTimer < 60 ? 'bg-red-950/80 border-red-600 animate-pulse' : 'bg-slate-900/80 border-blue-600'}`}>
                 <p className="text-slate-400 text-[10px] tracking-widest uppercase mb-1">Gate Collapse Imminent</p>
                 <p className={`text-3xl font-mono ${dungeonTimer < 60 ? 'text-red-500' : 'text-blue-100'}`}>{Math.floor(dungeonTimer / 60)}:{(Math.floor(dungeonTimer) % 60).toString().padStart(2, '0')}</p>
               </div>
            </div>
          )}
    
          {activeBoss && activeBoss.state !== 'IDLE' && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[600px] max-w-[90%] pointer-events-none animate-in fade-in slide-in-from-bottom-10 duration-1000 z-20">
                <h2 className="text-center text-red-500 font-bold uppercase tracking-[0.2em] text-lg mb-1 drop-shadow-md" style={{ textShadow: '0 0 10px black' }}>{activeBoss.type === 'BOSS' ? 'Dungeon Monarch' : 'Elite Enemy'}</h2>
                <div className="w-full h-6 bg-black/80 border border-slate-600 relative overflow-hidden rounded-sm">
                    <div className="h-full bg-red-700 transition-all duration-200 relative" style={{ width: `${(activeBoss.hp / activeBoss.maxHp) * 100}%` }}><div className="absolute inset-0 bg-gradient-to-b from-red-500/20 to-transparent"></div></div>
                    {activeBoss.state === 'PREPARING' && <div className="absolute top-0 left-0 h-1 bg-yellow-400 animate-pulse w-full"></div>}
                </div>
            </div>
          )}
    
          {!inventoryOpen && (
            <div className="absolute bottom-6 right-6 flex flex-col gap-4 items-end pointer-events-auto animate-in slide-in-from-right-10 fade-in duration-500">
               <div className="flex items-end gap-3">
                  <div className="flex flex-col items-center gap-1">
                     <div className="w-12 h-12 bg-slate-900 border border-slate-600 rounded flex items-center justify-center relative shadow-lg overflow-hidden">
                        <div className="absolute inset-0 bg-blue-900/20"></div>
                        <Wind size={20} className="text-blue-400 relative z-10" />
                        <span className="absolute bottom-0.5 right-1 text-[8px] text-slate-500 font-bold">SPACE</span>
                        {player.dodgeCooldown > 0 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20"><span className="text-xs font-bold text-white">{player.dodgeCooldown.toFixed(1)}</span></div>}
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="w-16 h-16 bg-slate-900 border-2 border-yellow-600 rounded flex items-center justify-center relative shadow-lg">
                        {!player.equipment.MAIN_HAND && <Hand className="text-slate-600" />}
                        {player.equipment.MAIN_HAND?.type === WeaponType.SWORD && <Swords size={28} className="text-yellow-500" />}
                        {player.equipment.MAIN_HAND?.type === WeaponType.BOW && <Crosshair size={28} className="text-yellow-500" />}
                        {player.equipment.MAIN_HAND?.type === WeaponType.STAFF && <Sparkles size={28} className="text-yellow-500" />}
                        <span className="absolute bottom-1 right-1 text-[10px] text-yellow-700 font-bold">LMB</span>
                        {player.attackCooldown > 0 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-mono font-bold rounded">{player.attackCooldown.toFixed(1)}</div>}
                    </div>
                  </div>
               </div>
               <div className="flex items-center gap-2"><span className="text-xs text-slate-400 uppercase tracking-wider">Press <span className="text-white font-bold border border-slate-600 rounded px-1">TAB</span> for Inventory</span></div>
            </div>
          )}
    
          {inventoryOpen && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
               <div className="w-[90%] max-w-5xl h-[70vh] flex gap-4">
                  
                  {/* Vicinity */}
                  <div className="flex-1 bg-slate-900/90 border border-slate-700 flex flex-col rounded-lg overflow-hidden transition-colors" onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnVicinity}>
                     <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center"><h3 className="font-bold text-slate-200 uppercase tracking-wide">Vicinity</h3><MapPin size={16} className="text-slate-500" /></div>
                     <div className="flex-1 p-4 overflow-y-auto space-y-2 custom-scrollbar">
                        {groundItems.length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-600 italic border-2 border-dashed border-slate-800 rounded"><span>No items nearby</span></div>}
                        {groundItems.map((item: any, idx: number) => (
                           <div key={item.id + idx} draggable onDragStart={(e) => handleDragStart(e, item, 'GROUND')} onClick={() => onItemClick(item, 'GROUND')} className="bg-slate-800 border border-slate-700 p-2 rounded flex items-center gap-3 cursor-move hover:bg-slate-700 hover:border-blue-500 transition-all">
                              <div className="w-10 h-10 bg-black/40 rounded flex items-center justify-center" style={{ color: RARITY_COLORS[item.rarity as Rarity] }}>
                                 {getItemIcon(item, 20)}
                              </div>
                              <div className="flex-1"><p className="font-bold text-sm" style={{ color: RARITY_COLORS[item.rarity as Rarity] }}>{item.name}</p></div>
                           </div>
                        ))}
                     </div>
                  </div>
    
                  {/* Equipment Paper Doll */}
                  <div className="w-80 flex flex-col gap-4">
                      <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-4 flex flex-col items-center transition-colors">
                          <h3 className="font-bold text-slate-200 uppercase tracking-wide mb-4 w-full text-center border-b border-slate-800 pb-2">Equipment</h3>
                          <div className="grid grid-cols-3 gap-2">
                                <div className="flex justify-center">{renderEquipSlot('CAPE', <Ghost size={20} />)}</div>
                                <div className="flex justify-center">{renderEquipSlot('HEAD', <Crown size={20} />)}</div>
                                <div className="flex justify-center">{renderEquipSlot('NECK', <Circle size={20} />)}</div>
                                
                                <div className="flex justify-center">{renderEquipSlot('MAIN_HAND', <Swords size={20} />)}</div>
                                <div className="flex justify-center">{renderEquipSlot('CHEST', <Shirt size={20} />)}</div>
                                <div className="flex justify-center">{renderEquipSlot('RING1', <Diamond size={20} />)}</div>
                                
                                <div className="flex justify-center">{renderEquipSlot('GLOVES', <Hand size={20} />)}</div>
                                <div className="flex justify-center">{renderEquipSlot('LEGS', <Club size={20} />)}</div>
                                <div className="flex justify-center">{renderEquipSlot('RING2', <Diamond size={20} />)}</div>
                                
                                <div></div>
                                <div className="flex justify-center">{renderEquipSlot('BOOTS', <Footprints size={20} />)}</div>
                                <div></div>
                          </div>
                      </div>
                      
                      <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-4 flex-1">
                          <h3 className="font-bold text-slate-200 uppercase tracking-wide mb-2">Stats</h3>
                          <div className="space-y-2 text-sm text-slate-400">
                              <div className="flex justify-between"><span>Attack Pwr</span><span className="text-white">{Math.floor(player.damage || 0)}</span></div>
                              <div className="flex justify-between"><span>Atk Speed</span><span className="text-white">{(player.attackSpeed || 1.0).toFixed(2)}/s</span></div>
                              <div className="flex justify-between"><span>Speed</span><span className="text-white">{player.speed}</span></div>
                          </div>
                      </div>
                  </div>
    
                  {/* Inventory */}
                  <div className="flex-1 bg-slate-900/90 border border-slate-700 flex flex-col rounded-lg overflow-hidden transition-colors" onDragOver={handleDragOver} onDrop={handleDropOnInventory}>
                     <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center"><h3 className="font-bold text-slate-200 uppercase tracking-wide">Backpack</h3><div className="text-xs text-slate-500">{player.inventory.length} / 20 Slots</div></div>
                     <div className="flex-1 p-4">
                        <div className="grid grid-cols-4 gap-2">
                            {player.inventory.map((item, idx) => (
                                <div key={item.id + idx} className="aspect-square bg-slate-800 border border-slate-600 hover:border-blue-400 cursor-pointer rounded p-2 flex flex-col items-center justify-between group relative cursor-move hover:scale-105 transition-transform" draggable onDragStart={(e) => handleDragStart(e, item, 'INVENTORY')} onClick={() => onItemClick(item, 'INVENTORY')}>
                                    <div style={{ color: RARITY_COLORS[item.rarity] }}>
                                        {getItemIcon(item, 24)}
                                    </div>
                                    <p className="text-[10px] text-center w-full truncate text-slate-300 group-hover:text-white">{item.name}</p>
                                </div>
                            ))}
                            {[...Array(Math.max(0, 20 - player.inventory.length))].map((_, i) => <div key={`empty_${i}`} className="aspect-square bg-slate-800/30 border border-slate-800 rounded"></div>)}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
    );
};
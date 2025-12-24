import React from 'react';
import { Player, Enemy, Item, EquipmentSlot, WeaponType } from '../../types';
import { RARITY_COLORS } from '../../constants';
import { ProgressBar } from '../ui/ProgressBar';
import { ItemIcon } from '../ui/ItemIcon';
import { Wind, Hand, Swords, Crosshair, Sparkles, MapPin, Ghost, Crown, Circle, Shirt, Diamond, Club, Footprints } from 'lucide-react';

interface InGameHUDProps {
  player: Player;
  dungeonTimer?: number;
  activeBoss: Enemy | null;
  inventoryOpen: boolean;
  groundItems: (Item & { x: number, y: number })[];
  onEquip: (item: Item, targetSlot?: EquipmentSlot) => void;
  onEquipFromGround?: (item: Item) => void;
  onUnequip: (slot: EquipmentSlot) => void;
  onDrop: (item: Item) => void;
  onDropEquipped?: (slot: EquipmentSlot) => void;
  onPickup: (item: Item) => void;
  onItemClick: (item: Item, type: string) => void;
  renderEquipSlot: (slot: EquipmentSlot, icon: React.ReactNode) => React.ReactNode;
  handleDropOnInventory: (e: React.DragEvent) => void;
  handleDropOnVicinity: (e: React.DragEvent) => void;
  handleDragStart: (e: React.DragEvent, item: Item, source: 'INVENTORY' | 'GROUND' | 'EQUIPPED', slot?: EquipmentSlot) => void;
}

export const InGameHUD: React.FC<InGameHUDProps> = ({ player, dungeonTimer, activeBoss, inventoryOpen, groundItems, onEquip, onEquipFromGround, onUnequip, onDrop, onDropEquipped, onPickup, onItemClick, renderEquipSlot, handleDropOnInventory, handleDropOnVicinity, handleDragStart }) => {
    
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
                        {groundItems.map((item, idx) => (
                           <div key={item.id + idx} draggable onDragStart={(e) => handleDragStart(e, item, 'GROUND')} onClick={() => onItemClick(item, 'GROUND')} className="bg-slate-800 border border-slate-700 p-2 rounded flex items-center gap-3 cursor-move hover:bg-slate-700 hover:border-blue-500 transition-all">
                              <div className="w-10 h-10 bg-black/40 rounded flex items-center justify-center" style={{ color: RARITY_COLORS[item.rarity] }}>
                                 <ItemIcon item={item} size={20} />
                              </div>
                              <div className="flex-1"><p className="font-bold text-sm" style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</p></div>
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
                                        <ItemIcon item={item} size={24} />
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
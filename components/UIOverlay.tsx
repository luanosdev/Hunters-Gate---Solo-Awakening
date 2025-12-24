
import React, { useState } from 'react';
import { Player, GameState, Item, PortalMission, Enemy, EquipmentSlot } from '../types';
import { RARITY_COLORS } from '../constants';
import { InGameHUD } from './hud/InGameHUD';
import { MainMenu } from './menu/MainMenu';
import { ItemDetailModal } from './modals/ItemDetailModal';
import { AttributeModal } from './modals/AttributeModal';
import { ItemIcon } from './ui/ItemIcon';

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

export const UIOverlay: React.FC<UIProps> = ({ 
  gameState, player, activeBoss, score, dungeonTimer, missions, groundItems,
  onStartMission, onRestart, onEquip, onEquipFromGround, onUnequip, onDrop, onDropEquipped, onPickup, onBuy, onSell, onUpgradeStat
}) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [interactionType, setInteractionType] = useState<'INVENTORY' | 'GROUND' | 'EQUIPPED' | 'SHOP_BUY' | 'SHOP_SELL' | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null); // Track which slot was clicked

  const handleDragStart = (e: React.DragEvent, item: Item, source: 'INVENTORY' | 'GROUND' | 'EQUIPPED', slot?: EquipmentSlot) => {
      e.dataTransfer.setData('application/json', JSON.stringify({ item, source, slot }));
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const handleDropOnInventory = (e: React.DragEvent) => {
      e.preventDefault();
      try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'));
          if (data.source === 'GROUND') onPickup(data.item);
          else if (data.source === 'EQUIPPED' && data.slot) onUnequip(data.slot);
      } catch (err) {}
  };

  const handleDropOnVicinity = (e: React.DragEvent) => {
      e.preventDefault();
      try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'));
          if (data.source === 'INVENTORY') onDrop(data.item);
          else if (data.source === 'EQUIPPED' && data.slot) onDropEquipped?.(data.slot);
      } catch (err) {}
  };

  // Helper to render an Equipment Slot (Used in both HUD and Menu)
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
                      <ItemIcon item={item} size={28} />
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

  return (
      <>
        {modal}
        
        {/* Persistent Attribute Modal when Points Available */}
        {onUpgradeStat && <AttributeModal player={player} onUpgrade={onUpgradeStat} />}

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
                    onItemClick={(item, type) => { setSelectedItem(item); setInteractionType(type as any); }}
                    renderEquipSlot={renderEquipSlot} 
                    handleDropOnInventory={handleDropOnInventory}
                    handleDropOnVicinity={handleDropOnVicinity}
                    handleDragStart={handleDragStart}
                />
            </>
        )}

        {gameState === GameState.MENU && (
            <MainMenu 
                player={player}
                score={score}
                missions={missions}
                onStartMission={onStartMission}
                renderEquipSlot={renderEquipSlot}
                handleDragOver={handleDragOver}
                handleDropOnInventory={handleDropOnInventory}
                handleDragStart={handleDragStart}
                onItemClick={(item, type) => { setSelectedItem(item); setInteractionType(type); }}
                onUpgradeStat={onUpgradeStat}
            />
        )}
      </>
  );
};

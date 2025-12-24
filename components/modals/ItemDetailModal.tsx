import React from 'react';
import { Item } from '../../types';
import { X } from 'lucide-react';
import { ItemIcon } from '../ui/ItemIcon';

interface ItemDetailModalProps {
    item: Item;
    context: 'INVENTORY' | 'GROUND' | 'EQUIPPED' | 'SHOP_BUY' | 'SHOP_SELL';
    onClose: () => void;
    actions: React.ReactNode;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, context, onClose, actions }) => {
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
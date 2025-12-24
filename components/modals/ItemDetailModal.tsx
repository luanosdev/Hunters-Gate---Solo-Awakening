
import React from 'react';
import { Item } from '../../types';
import { X } from 'lucide-react';

interface ItemDetailModalProps {
    item: Item;
    context: 'INVENTORY' | 'GROUND' | 'EQUIPPED' | 'SHOP_BUY' | 'SHOP_SELL';
    onClose: () => void;
    actions: React.ReactNode;
}

const StatBar = ({ label, value, max, baseline, format }: { label: string, value: number, max: number, baseline: number, format: (v: number) => string }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    // Color Logic
    let colorClass = 'bg-slate-500';
    if (label === 'Power') {
        if (value < 1.0) colorClass = 'bg-red-500';
        else if (value < 1.2) colorClass = 'bg-blue-400';
        else colorClass = 'bg-yellow-400';
    } else {
        if (value < 1.5) colorClass = 'bg-slate-500';
        else if (value < 3.0) colorClass = 'bg-blue-400';
        else colorClass = 'bg-purple-500';
    }

    return (
        <div className="w-full">
            <div className="flex justify-between text-xs uppercase mb-1">
                <span className="text-slate-400 font-bold">{label}</span>
                <span className={`${value >= baseline ? 'text-white' : 'text-red-400'}`}>{format(value)}</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
                {/* Baseline Marker */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-slate-600 z-10" style={{ left: `${(baseline/max)*100}%` }}></div>
                <div 
                    className={`h-full ${colorClass} transition-all duration-300`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

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
                    
                    {/* Visual Stats (Power/Quality) */}
                    <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-3">
                        <StatBar 
                            label="Power Effectiveness" 
                            value={item.power} 
                            max={1.6} 
                            baseline={1.0}
                            format={(v) => `${(v * 100).toFixed(0)}%`} 
                        />
                        <StatBar 
                            label="Item Quality" 
                            value={item.quality} 
                            max={5.0} 
                            baseline={2.5}
                            format={(v) => v.toFixed(1)} 
                        />
                    </div>

                    {/* Base Stats */}
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                        {item.baseStat ? (
                            <div className="flex justify-between items-center px-2">
                                <span className="uppercase text-xs text-slate-400 font-bold tracking-wide">{item.baseStat.type}</span>
                                <span className="font-bold text-lg text-white">+{item.baseStat.value}</span>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center px-2">
                                <span className="uppercase text-xs text-slate-400 font-bold tracking-wide">Base Damage</span>
                                <span className="font-bold text-lg text-white">{item.baseDamage}</span>
                            </div>
                        )}
                    </div>

                    {/* Scaling (Weapons only) */}
                    {item.type !== 'ARMOR' && item.type !== 'ACCESSORY' && (
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                            <span className="block text-xs text-slate-500 uppercase mb-1 font-bold">Attribute Scaling</span>
                            <div className="flex justify-between items-center px-2">
                                <span className="text-xs font-mono text-red-400">STR: <span className="text-white">{item.scaling.strength}</span></span>
                                <span className="text-xs font-mono text-green-400">AGI: <span className="text-white">{item.scaling.agility}</span></span>
                                <span className="text-xs font-mono text-purple-400">INT: <span className="text-white">{item.scaling.intelligence}</span></span>
                            </div>
                        </div>
                    )}

                    {/* Affixes */}
                    {item.affixes.length > 0 && (
                        <div>
                            <span className="block text-xs text-slate-500 uppercase mb-1 font-bold">Bonus Effects</span>
                            <div className="space-y-1">
                                {item.affixes.map((affix, idx) => (
                                    <div key={idx} className="flex justify-between text-xs bg-slate-800/50 px-2 py-1.5 rounded border border-slate-700/50">
                                        <span className="uppercase text-blue-200 font-bold text-[10px]">{affix.type}</span>
                                        <span className="text-green-400 font-mono">+{affix.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="text-center text-xs text-yellow-600 border-t border-slate-800 pt-2">Market Value: {item.price} G</div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex gap-2">
                    {actions}
                </div>
            </div>
        </div>
    );
}

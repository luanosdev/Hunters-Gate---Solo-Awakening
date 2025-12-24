
import React from 'react';
import { Player, StatType } from '../../types';
import { Plus, Activity } from 'lucide-react';

interface AttributeModalProps {
    player: Player;
    onUpgrade: (stat: StatType) => void;
}

export const AttributeModal: React.FC<AttributeModalProps> = ({ player, onUpgrade }) => {
    const stats: { key: StatType, label: string }[] = [
        { key: 'strength', label: 'Strength' },
        { key: 'agility', label: 'Agility' },
        { key: 'vitality', label: 'Vitality' },
        { key: 'perception', label: 'Perception' },
        { key: 'intelligence', label: 'Intelligence' },
    ];

    if (player.attributePoints <= 0) return null;

    return (
        <div className="absolute top-24 right-4 bg-slate-900/95 border border-blue-500/50 p-4 rounded-lg w-64 backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-in slide-in-from-right-10 fade-in pointer-events-auto z-40">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-blue-400" />
                    <h3 className="font-bold text-blue-400 uppercase tracking-widest text-sm">System</h3>
                </div>
                <span className="text-yellow-500 font-mono font-bold animate-pulse">{player.attributePoints} PTS</span>
            </div>
            
            <div className="space-y-3">
                {stats.map(s => (
                    <div key={s.key} className="flex items-center justify-between group">
                        <span className="text-slate-400 text-xs uppercase font-bold group-hover:text-white transition-colors">{s.label}</span>
                        <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-white text-sm">{player[s.key]}</span>
                            <button 
                                onClick={() => onUpgrade(s.key)} 
                                className="bg-blue-600 hover:bg-blue-500 text-white rounded p-0.5 transition-colors shadow-lg hover:shadow-blue-500/50"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-4 pt-2 border-t border-slate-700 space-y-1">
                 <div className="flex justify-between text-[10px] text-slate-500"><span>Damage</span><span className="text-slate-300">{Math.floor(player.damage || 0)}</span></div>
                 <div className="flex justify-between text-[10px] text-slate-500"><span>Speed</span><span className="text-slate-300">{Math.floor(player.speed)}</span></div>
            </div>
        </div>
    );
};

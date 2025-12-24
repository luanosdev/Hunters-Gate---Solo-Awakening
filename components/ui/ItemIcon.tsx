import React from 'react';
import { Item, WeaponType } from '../../types';
import { Shield, Swords, Crosshair, Sparkles, Hand, Crown, Shirt, Club, Footprints, Ghost, Circle, Diamond } from 'lucide-react';

interface ItemIconProps {
  item: Item;
  size?: number;
}

export const ItemIcon: React.FC<ItemIconProps> = ({ item, size = 24 }) => {
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
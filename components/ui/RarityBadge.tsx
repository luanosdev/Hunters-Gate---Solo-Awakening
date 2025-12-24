import React from 'react';
import { Rarity } from '../../types';
import { RARITY_COLORS } from '../../constants';

export const RarityBadge = ({ rarity }: { rarity: Rarity }) => (
  <span className="text-[10px] px-1 rounded bg-black/50 border border-white/10" style={{ color: RARITY_COLORS[rarity] }}>
    {rarity}
  </span>
);
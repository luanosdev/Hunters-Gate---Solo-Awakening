import { Item, Rarity, EquipmentSlot, WeaponType, StatType, ScalingGrade, ItemAffix, ExperienceOrb } from '../types';
import { RARITY_COLORS, STANDARD_SETS, BOSS_SETS, SLOT_STAT_MULTIPLIERS } from '../constants';

export const generateLoot = (x: number, y: number, level: number): Item & {x: number, y: number} => {
  const rand = Math.random();
  let rarity = Rarity.COMMON;
  if (rand > 0.95) rarity = Rarity.LEGENDARY;
  else if (rand > 0.85) rarity = Rarity.EPIC;
  else if (rand > 0.6) rarity = Rarity.RARE;

  return generateItem(x, y, level, rarity);
};

export const generateBossLoot = (x: number, y: number, level: number, bossId: string, rank: string): Item & {x: number, y: number} => {
    // Rarity depends on Dungeon Rank
    let rarity = Rarity.RARE;
    if (rank === 'E' || rank === 'D') rarity = Rarity.RARE;
    else if (rank === 'C' || rank === 'B') rarity = Rarity.EPIC;
    else if (rank === 'A' || rank === 'S') rarity = Rarity.LEGENDARY;

    const bossSet = BOSS_SETS[bossId];
    if (!bossSet) return generateItem(x, y, level, rarity); // Fallback

    return generateItem(x, y, level, rarity, bossSet);
};

export const generateXpOrbs = (x: number, y: number, amount: number): ExperienceOrb[] => {
    const orbs: ExperienceOrb[] = [];
    // Split XP into multiple orbs for visual effect, but cap at 10 to avoid performance hit
    const count = Math.max(1, Math.min(10, Math.ceil(amount / 5))); 
    const valPerOrb = Math.ceil(amount / count);

    for(let i=0; i<count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 150;
        orbs.push({
            id: Math.random().toString(),
            x, y,
            value: valPerOrb,
            radius: 3 + Math.random() * 3,
            color: '#22d3ee', // Cyan-400
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        });
    }
    return orbs;
};

const generateItem = (x: number, y: number, level: number, rarity: Rarity, forcedSet?: {name: string, baseStat: StatType}): Item & {x: number, y: number} => {
  // Decide Slot (Weighted: Weapon 20%, Armor 50%, Accessory 30%)
  const slotRoll = Math.random();
  let slot: EquipmentSlot = 'MAIN_HAND';
  if (slotRoll > 0.8) slot = 'MAIN_HAND';
  else if (slotRoll > 0.3) {
      const armorSlots: EquipmentSlot[] = ['HEAD', 'CHEST', 'LEGS', 'BOOTS', 'GLOVES', 'CAPE'];
      slot = armorSlots[Math.floor(Math.random() * armorSlots.length)];
  } else {
      const accSlots: EquipmentSlot[] = ['NECK', 'RING1']; 
      slot = accSlots[Math.floor(Math.random() * accSlots.length)];
  }

  // Quality calculation
  let quality = 0.5 + (Math.random() * Math.random()) * 4.5; // Skewed low
  if (rarity === Rarity.LEGENDARY) quality = 3.0 + Math.random() * 2.0;

  // Power
  let basePower = 0.8 + Math.random() * 0.4;
  if (rarity === Rarity.RARE) basePower += 0.1;
  if (rarity === Rarity.EPIC) basePower += 0.2;
  if (rarity === Rarity.LEGENDARY) basePower += 0.3;
  const power = Math.min(1.5, Math.max(0.8, basePower));

  let name = '';
  let type: any = 'ARMOR';
  let scalings: { s: ScalingGrade, a: ScalingGrade, i: ScalingGrade } = { s: '-', a: '-', i: '-' };
  let baseDmg = 0;
  let baseSpeed = 0;
  let baseRange = 0;
  let baseStat: { type: StatType, value: number } | undefined = undefined;
  let setName = "";

  // 1. WEAPON GENERATION
  if (slot === 'MAIN_HAND') {
      const wTypes = [WeaponType.SWORD, WeaponType.BOW, WeaponType.STAFF];
      const wType = wTypes[Math.floor(Math.random() * wTypes.length)];
      type = wType;
      baseDmg = 10 + (level * 2);
      
      const prefix = rarity === Rarity.COMMON ? 'Rusty' : rarity === Rarity.RARE ? 'Iron' : rarity === Rarity.EPIC ? 'Shadow' : 'Demon';
      
      if (forcedSet) {
          name = `${forcedSet.name} Weapon`; 
      } else {
        if (wType === WeaponType.SWORD) name = `${prefix} Blade`;
        else if (wType === WeaponType.BOW) name = `${prefix} Longbow`;
        else if (wType === WeaponType.STAFF) name = `${prefix} Staff`;
      }

      if (wType === WeaponType.SWORD) {
          scalings.s = rarity === Rarity.LEGENDARY ? 'S' : rarity === Rarity.EPIC ? 'A' : rarity === Rarity.RARE ? 'B' : 'C';
          scalings.a = 'D';
          baseSpeed = 1.5; baseRange = 80;
      } else if (wType === WeaponType.BOW) {
          scalings.a = rarity === Rarity.LEGENDARY ? 'S' : rarity === Rarity.EPIC ? 'A' : rarity === Rarity.RARE ? 'B' : 'C';
          scalings.s = 'E';
          baseSpeed = 2; baseRange = 400;
      } else if (wType === WeaponType.STAFF) {
          scalings.i = rarity === Rarity.LEGENDARY ? 'S' : rarity === Rarity.EPIC ? 'A' : rarity === Rarity.RARE ? 'B' : 'C';
          baseSpeed = 0.8; baseRange = 400;
      }
  } 
  // 2. ARMOR / ACCESSORY GENERATION
  else {
      type = (slot === 'NECK' || slot === 'RING1') ? 'ACCESSORY' : 'ARMOR';
      
      const set = forcedSet || STANDARD_SETS[Math.floor(Math.random() * STANDARD_SETS.length)];
      setName = set.name;
      
      const slotNameMap: Record<string, string> = {
          'HEAD': 'Helm', 'CHEST': 'Armor', 'LEGS': 'Leggings', 'BOOTS': 'Boots', 'GLOVES': 'Gauntlets', 'CAPE': 'Cape', 'NECK': 'Amulet', 'RING1': 'Ring'
      };
      name = `${set.name} ${slotNameMap[slot] || 'Item'}`;

      // Calculate Fixed Attribute based on Slot Multiplier, Quality AND Power
      const multiplier = SLOT_STAT_MULTIPLIERS[slot] || 1;
      // Fixed: Added 'power' to the calculation below
      const statVal = Math.ceil(multiplier * quality * power * (1 + (level * 0.1)));
      baseStat = { type: set.baseStat, value: statVal };
  }

  // Affixes
  const affixCount = rarity === Rarity.LEGENDARY ? 3 : rarity === Rarity.EPIC ? 2 : rarity === Rarity.RARE ? 1 : 0;
  const possibleStats: StatType[] = ['strength', 'agility', 'vitality', 'perception', 'intelligence'];
  const affixes: ItemAffix[] = [];
  for (let i = 0; i < affixCount; i++) {
      const stat = possibleStats[Math.floor(Math.random() * possibleStats.length)];
      const val = Math.ceil(quality * (1 + Math.random() * 2)); 
      affixes.push({ type: stat, value: val });
  }

  const price = Math.floor((baseDmg || 10) * power * quality * 10 * (1 + affixCount));

  return {
    id: Math.random().toString(36).substr(2, 9),
    x, y,
    name,
    type,
    slot,
    setName,
    rarity,
    baseDamage: Math.floor(baseDmg),
    baseAttackSpeed: baseSpeed,
    baseRange: baseRange,
    power: parseFloat(power.toFixed(2)),
    quality: parseFloat(quality.toFixed(1)),
    scaling: { strength: scalings.s, agility: scalings.a, intelligence: scalings.i },
    baseStat,
    affixes,
    color: RARITY_COLORS[rarity],
    price: price
  };
}
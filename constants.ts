
import { WeaponType, Rarity, Item, ScalingGrade, EquipmentSlot, StatType } from './types';

// Fallback to non-zero values if window dimensions are missing or zero
export const CANVAS_WIDTH = window.innerWidth || 1024;
export const CANVAS_HEIGHT = window.innerHeight || 768;

export const PLAYER_BASE_SPEED = 240; // Pixels per second
export const OUT_OF_COMBAT_DELAY = 3000; // ms
export const OUT_OF_COMBAT_SPEED_MULT = 1.5;

export const PLAYER_ATTACK_SLOW = 0.5;
export const DODGE_SPEED_MULT = 3.0; // Faster dash
export const DODGE_DURATION = 0.25; // Slightly shorter, snappier
export const DODGE_COOLDOWN = 1.2;

export const TILE_SIZE = 64;
// Increased Dungeon grid size for larger rooms
export const DUNGEON_WIDTH = 70;
export const DUNGEON_HEIGHT = 70;

export const RARITY_COLORS = {
  [Rarity.COMMON]: '#94a3b8',
  [Rarity.RARE]: '#3b82f6',
  [Rarity.EPIC]: '#a855f7',
  [Rarity.LEGENDARY]: '#f59e0b',
};

// Scaling Multipliers: Affects how much the attribute contributes to the weapon stats
export const SCALING_FACTORS: Record<ScalingGrade, number> = {
    'S': 2.5,
    'A': 2.0,
    'B': 1.5,
    'C': 1.0,
    'D': 0.75,
    'E': 0.5,
    '-': 0.0
};

// Portal Visuals based on Rank
export const RANK_META: Record<string, { color: string, shadow: string, heightClass: string }> = {
    'E': { color: '#94a3b8', shadow: 'rgba(148, 163, 184, 0.5)', heightClass: 'h-48' },
    'D': { color: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.5)', heightClass: 'h-56' },
    'C': { color: '#22c55e', shadow: 'rgba(34, 197, 94, 0.5)', heightClass: 'h-64' },
    'B': { color: '#eab308', shadow: 'rgba(234, 179, 8, 0.5)', heightClass: 'h-72' },
    'A': { color: '#ef4444', shadow: 'rgba(239, 68, 68, 0.5)', heightClass: 'h-80' },
    'S': { color: '#7f1d1d', shadow: 'rgba(127, 29, 29, 0.8)', heightClass: 'h-96' },
};

export const STARTING_WEAPON: Item = {
  id: 'starter_sword',
  name: "Hunter's Dagger",
  type: WeaponType.SWORD,
  slot: 'MAIN_HAND',
  rarity: Rarity.COMMON,
  baseDamage: 12,
  baseAttackSpeed: 1.5,
  baseRange: 140,
  power: 1.0,
  quality: 1.0,
  scaling: { strength: 'C', agility: 'D', intelligence: '-' },
  affixes: [],
  color: '#cbd5e1',
  price: 0
};

export const ENEMY_TYPES = {
  GRUNT: {
    hp: 40,
    speed: 160,
    damage: 10,
    radius: 20,
    color: '#ef4444',
    xp: 10
  },
  CASTER: {
    hp: 30,
    speed: 100,
    damage: 25,
    radius: 20,
    color: '#a855f7',
    xp: 20
  },
  BOSS: {
    hp: 800,
    speed: 130,
    damage: 50,
    radius: 45,
    color: '#b91c1c',
    xp: 500
  }
};

interface ItemSet {
    name: string;
    baseStat: StatType;
}

export const ITEM_SETS: ItemSet[] = [
    { name: "Warlord", baseStat: 'strength' },
    { name: "Ranger", baseStat: 'agility' },
    { name: "Sorcerer", baseStat: 'intelligence' },
    { name: "Guardian", baseStat: 'vitality' },
    { name: "Assassin", baseStat: 'perception' }
];

// Base Multipliers for Slots (How much base stat they give relative to Quality)
export const SLOT_STAT_MULTIPLIERS: Record<EquipmentSlot, number> = {
    'MAIN_HAND': 0, // Weapons use Damage, not base stat usually (handled separately)
    'HEAD': 3,
    'CHEST': 5,
    'LEGS': 4,
    'BOOTS': 2,
    'GLOVES': 2,
    'CAPE': 1,
    'NECK': 2,
    'RING1': 1,
    'RING2': 1
};

export const SHOP_ITEMS: Item[] = [
    {
        id: 'shop_starter_rusty',
        name: "Training Sword",
        type: WeaponType.SWORD,
        slot: 'MAIN_HAND',
        rarity: Rarity.COMMON,
        baseDamage: 10,
        baseAttackSpeed: 1.3,
        baseRange: 130,
        power: 0.8,
        quality: 0.5,
        scaling: { strength: 'D', agility: '-', intelligence: '-' },
        affixes: [],
        color: RARITY_COLORS[Rarity.COMMON],
        price: 50
    },
    {
        id: 'shop_sword_rare',
        name: "Knight's Blade",
        type: WeaponType.SWORD,
        slot: 'MAIN_HAND',
        rarity: Rarity.RARE,
        baseDamage: 25,
        baseAttackSpeed: 1.4,
        baseRange: 150,
        power: 1.1,
        quality: 2.0,
        scaling: { strength: 'B', agility: 'D', intelligence: '-' },
        affixes: [{type: 'strength', value: 3}],
        color: RARITY_COLORS[Rarity.RARE],
        price: 1500
    },
    {
        id: 'shop_chest_rare',
        name: "Warlord's Plate",
        type: 'ARMOR',
        slot: 'CHEST',
        rarity: Rarity.RARE,
        setName: "Warlord",
        baseStat: { type: 'strength', value: 10 },
        baseDamage: 0, baseAttackSpeed: 0, baseRange: 0, power: 1, quality: 2.0,
        scaling: { strength: '-', agility: '-', intelligence: '-' },
        affixes: [{type: 'vitality', value: 5}],
        color: RARITY_COLORS[Rarity.RARE],
        price: 1200
    }
];



import { WeaponType, Rarity, Item, ScalingGrade, EquipmentSlot, StatType, DungeonTheme, Enemy } from './types';

export const CANVAS_WIDTH = window.innerWidth || 1024;
export const CANVAS_HEIGHT = window.innerHeight || 768;

export const DUNGEON_WIDTH = 256;
export const DUNGEON_HEIGHT = 256;

export const PLAYER_BASE_SPEED = 240; 
export const OUT_OF_COMBAT_DELAY = 3000; 
export const OUT_OF_COMBAT_SPEED_MULT = 1.5;
export const PLAYER_ATTACK_SLOW = 0.5;
export const DODGE_SPEED_MULT = 3.0; 
export const DODGE_DURATION = 0.25; 
export const DODGE_COOLDOWN = 1.2;

export const TILE_SIZE = 64;

export const RARITY_COLORS = {
  [Rarity.COMMON]: '#94a3b8',
  [Rarity.RARE]: '#3b82f6',
  [Rarity.EPIC]: '#a855f7',
  [Rarity.LEGENDARY]: '#f59e0b',
};

export const SCALING_FACTORS: Record<ScalingGrade, number> = {
    'S': 2.5, 'A': 2.0, 'B': 1.5, 'C': 1.0, 'D': 0.75, 'E': 0.5, '-': 0.0
};

export const RANK_META: Record<string, { color: string, shadow: string, heightClass: string, sizeMult: number }> = {
    'E': { color: '#94a3b8', shadow: 'rgba(148, 163, 184, 0.5)', heightClass: 'h-48', sizeMult: 1.0 },
    'D': { color: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.5)', heightClass: 'h-56', sizeMult: 1.2 },
    'C': { color: '#22c55e', shadow: 'rgba(34, 197, 94, 0.5)', heightClass: 'h-64', sizeMult: 1.4 },
    'B': { color: '#eab308', shadow: 'rgba(234, 179, 8, 0.5)', heightClass: 'h-72', sizeMult: 1.6 },
    'A': { color: '#ef4444', shadow: 'rgba(239, 68, 68, 0.5)', heightClass: 'h-80', sizeMult: 1.8 },
    'S': { color: '#7f1d1d', shadow: 'rgba(127, 29, 29, 0.8)', heightClass: 'h-96', sizeMult: 2.2 },
};

export const THEME_CONFIG: Record<DungeonTheme, { floor: string, wall: string, ambient: string }> = {
    CAVE: { floor: '#334155', wall: '#0f172a', ambient: '#000000' },
    DESERT: { floor: '#d4a373', wall: '#a98467', ambient: '#3d2b1f' },
    FOREST: { floor: '#2d4a22', wall: '#1a2f16', ambient: '#0a1a0a' }
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

// --- ENEMY DEFINITIONS ---
type EnemyTemplate = Omit<Enemy, 'id' | 'x' | 'y' | 'targetPos' | 'patrolTarget' | 'telegraphTimer' | 'attackTimer' | 'originX' | 'originY' | 'patrolTimer' | 'isDead'>;

export const BASE_ENEMIES: Record<string, EnemyTemplate> = {
    // CAVE (Standard)
    GOBLIN: {
        name: 'Goblin', radius: 18, color: '#ef4444', hp: 30, maxHp: 30, speed: 170, damage: 8,
        type: 'GRUNT', state: 'IDLE', aggroRange: 250, attackRange: 30, attackCooldown: 1.5, telegraphDuration: 0,
        isRanged: false, hasShield: false, isPhasing: false, isBurrower: false
    },
    ORC_WARRIOR: {
        name: 'Orc', radius: 25, color: '#b91c1c', hp: 80, maxHp: 80, speed: 120, damage: 20,
        type: 'GRUNT', state: 'IDLE', aggroRange: 300, attackRange: 40, attackCooldown: 2.0, telegraphDuration: 0,
        isRanged: false, hasShield: true, isPhasing: false, isBurrower: false
    },

    // DESERT (Open, Burrowing)
    SAND_WORM: {
        name: 'Sand Worm', radius: 20, color: '#eab308', hp: 50, maxHp: 50, speed: 100, damage: 15,
        type: 'GRUNT', state: 'BURROWED', aggroRange: 150, attackRange: 40, attackCooldown: 1.0, telegraphDuration: 0,
        isRanged: false, hasShield: false, isPhasing: false, isBurrower: true
    },
    DESERT_MAGE: {
        name: 'Dust Mage', radius: 18, color: '#fcd34d', hp: 40, maxHp: 40, speed: 90, damage: 12,
        type: 'CASTER', state: 'IDLE', aggroRange: 400, attackRange: 300, attackCooldown: 3.0, telegraphDuration: 1.0,
        isRanged: true, hasShield: false, isPhasing: false, isBurrower: false
    },

    // FOREST (Phasing, Organic)
    SPIRIT: {
        name: 'Forest Spirit', radius: 15, color: '#4ade80', hp: 35, maxHp: 35, speed: 110, damage: 12,
        type: 'GRUNT', state: 'IDLE', aggroRange: 300, attackRange: 25, attackCooldown: 1.2, telegraphDuration: 0,
        isRanged: false, hasShield: false, isPhasing: true, isBurrower: false
    },
    ENT_GUARD: {
        name: 'Ancient Ent', radius: 30, color: '#14532d', hp: 120, maxHp: 120, speed: 60, damage: 25,
        type: 'GRUNT', state: 'IDLE', aggroRange: 200, attackRange: 50, attackCooldown: 2.5, telegraphDuration: 0,
        isRanged: false, hasShield: true, isPhasing: false, isBurrower: false
    },
    
    // --- UNIQUE BOSSES ---
    KARGAL: {
        name: 'Kargal, Iron Crusher', bossId: 'KARGAL', radius: 50, color: '#64748b', hp: 1000, maxHp: 1000, speed: 90, damage: 70,
        type: 'BOSS', state: 'IDLE', aggroRange: 600, attackRange: 100, attackCooldown: 3.0, telegraphDuration: 1.5,
        isRanged: false, hasShield: true, isPhasing: false, isBurrower: false
    },
    XERATH: {
        name: 'Xerath, Sand Scourge', bossId: 'XERATH', radius: 60, color: '#a16207', hp: 800, maxHp: 800, speed: 180, damage: 45,
        type: 'BOSS', state: 'BURROWED', aggroRange: 400, attackRange: 200, attackCooldown: 2.0, telegraphDuration: 0.8,
        isRanged: true, hasShield: false, isPhasing: false, isBurrower: true
    },
    ELARA: {
        name: 'Elara, Twisted Matriarch', bossId: 'ELARA', radius: 55, color: '#166534', hp: 1200, maxHp: 1200, speed: 80, damage: 40,
        type: 'BOSS', state: 'IDLE', aggroRange: 600, attackRange: 450, attackCooldown: 3.5, telegraphDuration: 1.5,
        isRanged: true, hasShield: true, isPhasing: true, isBurrower: false
    }
};

export const THEME_ENEMIES: Record<DungeonTheme, string[]> = {
    CAVE: ['GOBLIN', 'ORC_WARRIOR'],
    DESERT: ['SAND_WORM', 'DESERT_MAGE'],
    FOREST: ['SPIRIT', 'ENT_GUARD']
};

export const THEME_BOSSES: Record<DungeonTheme, string> = {
    CAVE: 'KARGAL',
    DESERT: 'XERATH',
    FOREST: 'ELARA'
};

// --- ITEM SETS ---
// Standard Sets
export const STANDARD_SETS: { name: string, baseStat: StatType }[] = [
    { name: "Warlord", baseStat: 'strength' },
    { name: "Ranger", baseStat: 'agility' },
    { name: "Sorcerer", baseStat: 'intelligence' },
    { name: "Guardian", baseStat: 'vitality' },
    { name: "Assassin", baseStat: 'perception' }
];

// Boss Unique Sets
export const BOSS_SETS: Record<string, { name: string, baseStat: StatType, color: string }> = {
    KARGAL: { name: "Iron Will", baseStat: 'vitality', color: '#64748b' },
    XERATH: { name: "Sandstorm", baseStat: 'agility', color: '#eab308' },
    ELARA: { name: "Nature's Wrath", baseStat: 'intelligence', color: '#22c55e' }
};

export const SLOT_STAT_MULTIPLIERS: Record<EquipmentSlot, number> = {
    'MAIN_HAND': 0, 'HEAD': 3, 'CHEST': 5, 'LEGS': 4, 'BOOTS': 2, 'GLOVES': 2, 'CAPE': 1, 'NECK': 2, 'RING1': 1, 'RING2': 1
};

export const SHOP_ITEMS: Item[] = [
    {
        id: 'shop_starter_rusty', name: "Training Sword", type: WeaponType.SWORD, slot: 'MAIN_HAND', rarity: Rarity.COMMON,
        baseDamage: 10, baseAttackSpeed: 1.3, baseRange: 130, power: 0.8, quality: 0.5,
        scaling: { strength: 'D', agility: '-', intelligence: '-' }, affixes: [], color: RARITY_COLORS[Rarity.COMMON], price: 50
    },
    {
        id: 'shop_sword_rare', name: "Knight's Blade", type: WeaponType.SWORD, slot: 'MAIN_HAND', rarity: Rarity.RARE,
        baseDamage: 25, baseAttackSpeed: 1.4, baseRange: 150, power: 1.1, quality: 2.0,
        scaling: { strength: 'B', agility: 'D', intelligence: '-' }, affixes: [{type: 'strength', value: 3}], color: RARITY_COLORS[Rarity.RARE], price: 1500
    },
    {
        id: 'shop_chest_rare', name: "Warlord's Plate", type: 'ARMOR', slot: 'CHEST', rarity: Rarity.RARE, setName: "Warlord",
        baseStat: { type: 'strength', value: 10 }, baseDamage: 0, baseAttackSpeed: 0, baseRange: 0, power: 1, quality: 2.0,
        scaling: { strength: '-', agility: '-', intelligence: '-' }, affixes: [{type: 'vitality', value: 5}], color: RARITY_COLORS[Rarity.RARE], price: 1200
    }
];

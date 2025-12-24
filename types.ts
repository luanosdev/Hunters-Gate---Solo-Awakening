
export enum GameState {
  MENU,
  DUNGEON,
  GAME_OVER
}

export enum WeaponType {
  SWORD = 'SWORD',
  BOW = 'BOW',
  STAFF = 'STAFF'
}

export type EquipmentSlot = 'MAIN_HAND' | 'HEAD' | 'CHEST' | 'LEGS' | 'BOOTS' | 'GLOVES' | 'CAPE' | 'NECK' | 'RING1' | 'RING2';

export enum Rarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export type ScalingGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | '-';

export type StatType = 'strength' | 'agility' | 'vitality' | 'perception' | 'intelligence';

export interface ItemAffix {
  type: StatType;
  value: number;
}

export interface ItemScaling {
  strength: ScalingGrade;
  agility: ScalingGrade;
  intelligence: ScalingGrade;
}

export enum TileType {
  WALL = 0,
  FLOOR = 1,
  DOOR = 2
}

export interface Item {
  id: string;
  name: string;
  type: WeaponType | 'ARMOR' | 'ACCESSORY'; 
  slot: EquipmentSlot;
  rarity: Rarity;
  setName?: string; 
  baseDamage: number;
  baseAttackSpeed: number; 
  baseRange: number;
  power: number; 
  quality: number;
  baseStat?: { type: StatType, value: number }; 
  scaling: ItemScaling; 
  affixes: ItemAffix[];
  color: string;
  price: number;
  icon?: string;
}

export interface ExperienceOrb {
  id: string;
  x: number;
  y: number;
  value: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  hp: number;
  maxHp: number;
  speed: number;
  isDead: boolean;
}

export interface Player extends Entity {
  mana: number;
  maxMana: number;
  equipment: Record<EquipmentSlot, Item | null>;
  inventory: Item[];
  level: number;
  exp: number;
  attributePoints: number;
  strength: number;     
  agility: number;      
  vitality: number;     
  perception: number;   
  intelligence: number; 
  damage?: number;
  attackSpeed?: number;
  isAttacking: boolean;
  attackCooldown: number;
  attackVisualTimer: number;
  isDodging: boolean;
  dodgeCooldown: number;
  dodgeDuration: number;
  facingAngle: number;
  inventoryOpen: boolean;
  lastCombatTime: number;
}

export type DungeonTheme = 'CAVE' | 'DESERT' | 'FOREST';

export interface Enemy extends Entity {
  // Appearance
  name: string;
  type: 'GRUNT' | 'CASTER' | 'BOSS';
  bossId?: string; // Specific ID for unique bosses (e.g., 'KARGAL')
  
  // Stats
  aggroRange: number;
  attackRange: number;
  attackCooldown: number;
  attackTimer: number;
  damage: number;
  
  // AI State
  state: 'IDLE' | 'CHASE' | 'PREPARING' | 'ATTACKING' | 'BURROWED';
  telegraphTimer: number;
  telegraphDuration: number;
  targetPos?: { x: number, y: number };
  
  originX: number;
  originY: number;
  patrolTarget?: {x: number, y: number};
  patrolTimer: number;

  // New Mechanics
  isRanged: boolean;
  hasShield: boolean;
  isPhasing: boolean; // Walks through walls
  isBurrower: boolean; // Hides in ground
  engaged?: boolean; // For bosses, true if fight started
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  owner: 'PLAYER' | 'ENEMY';
  lifeTime: number;
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface PortalMission {
  id: string;
  rank: string;
  theme: DungeonTheme;
  timeLeft: number; 
  difficulty: number;
  description: string;
  enemyCount: number;
  bossType: string;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}

export interface GameWorld {
  width: number;
  height: number;
  tiles: TileType[][];
  tileSize: number;
  theme: DungeonTheme;
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  activeMissions: PortalMission[];
  particles: Particle[];
  texts: FloatingText[];
  items: (Item & { x: number, y: number })[];
  xpOrbs: ExperienceOrb[];
  camera: { x: number, y: number };
  score: number;
  bossRoom?: { x: number, y: number, w: number, h: number };
}

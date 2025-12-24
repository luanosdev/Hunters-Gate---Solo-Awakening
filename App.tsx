import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, GameWorld, Player, Entity, Enemy, Projectile, PortalMission, Particle, FloatingText, WeaponType, Rarity, Item, TileType, ExperienceOrb, ItemAffix, StatType, ScalingGrade, EquipmentSlot } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_BASE_SPEED, PLAYER_ATTACK_SLOW, DODGE_SPEED_MULT, DODGE_DURATION, DODGE_COOLDOWN, TILE_SIZE, DUNGEON_WIDTH, DUNGEON_HEIGHT, RARITY_COLORS, STARTING_WEAPON, ENEMY_TYPES, OUT_OF_COMBAT_DELAY, OUT_OF_COMBAT_SPEED_MULT, SCALING_FACTORS, ITEM_SETS, SLOT_STAT_MULTIPLIERS } from './constants';
import { UIOverlay } from './components/UIOverlay';

// Initial World Setup
const INITIAL_PLAYER: Player = {
  id: 'player',
  x: 0, 
  y: 0,
  radius: 16,
  color: '#3b82f6',
  hp: 100,
  maxHp: 100,
  mana: 100,
  maxMana: 100,
  speed: PLAYER_BASE_SPEED,
  isDead: false,
  // Initialize all slots as null except weapon
  equipment: {
      MAIN_HAND: STARTING_WEAPON,
      HEAD: null,
      CHEST: null,
      LEGS: null,
      BOOTS: null,
      GLOVES: null,
      CAPE: null,
      NECK: null,
      RING1: null,
      RING2: null
  },
  inventory: [],
  level: 1,
  exp: 0,
  attributePoints: 0,
  strength: 5,
  agility: 5,
  vitality: 5,
  perception: 5,
  intelligence: 5,
  isAttacking: false,
  attackCooldown: 0,
  attackVisualTimer: 0,
  isDodging: false,
  dodgeCooldown: 0,
  dodgeDuration: 0,
  facingAngle: 0,
  inventoryOpen: false,
  lastCombatTime: 0
};

// --- Helper Functions ---

const distance = (a: { x: number, y: number }, b: { x: number, y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

const checkCollision = (a: { x: number, y: number, radius: number }, b: { x: number, y: number, radius: number }) => {
  return distance(a, b) < (a.radius + b.radius);
};

const resolveWallCollision = (entity: Entity & { radius: number }, tiles: TileType[][], tileSize: number) => {
    const minX = Math.floor((entity.x - entity.radius) / tileSize);
    const maxX = Math.floor((entity.x + entity.radius) / tileSize);
    const minY = Math.floor((entity.y - entity.radius) / tileSize);
    const maxY = Math.floor((entity.y + entity.radius) / tileSize);

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            if (y < 0 || y >= tiles.length || x < 0 || x >= tiles[0].length || tiles[y][x] === TileType.WALL) {
                const tileLeft = x * tileSize;
                const tileRight = (x + 1) * tileSize;
                const tileTop = y * tileSize;
                const tileBottom = (y + 1) * tileSize;

                const closestX = Math.max(tileLeft, Math.min(entity.x, tileRight));
                const closestY = Math.max(tileTop, Math.min(entity.y, tileBottom));

                const distX = entity.x - closestX;
                const distY = entity.y - closestY;
                const distSq = distX * distX + distY * distY;

                if (distSq < entity.radius * entity.radius && distSq > 0) {
                    const dist = Math.sqrt(distSq);
                    const overlap = entity.radius - dist;
                    const nx = distX / dist;
                    const ny = distY / dist;
                    entity.x += nx * overlap;
                    entity.y += ny * overlap;
                }
            }
        }
    }
};

// --- IMPROVED LOOT GENERATION ---
const generateLoot = (x: number, y: number, level: number): Item & {x: number, y: number} => {
  const rand = Math.random();
  let rarity = Rarity.COMMON;
  if (rand > 0.95) rarity = Rarity.LEGENDARY;
  else if (rand > 0.85) rarity = Rarity.EPIC;
  else if (rand > 0.6) rarity = Rarity.RARE;

  // Decide Slot (Weighted: Weapon 20%, Armor 50%, Accessory 30%)
  const slotRoll = Math.random();
  let slot: EquipmentSlot = 'MAIN_HAND';
  if (slotRoll > 0.8) slot = 'MAIN_HAND';
  else if (slotRoll > 0.3) {
      const armorSlots: EquipmentSlot[] = ['HEAD', 'CHEST', 'LEGS', 'BOOTS', 'GLOVES', 'CAPE'];
      slot = armorSlots[Math.floor(Math.random() * armorSlots.length)];
  } else {
      const accSlots: EquipmentSlot[] = ['NECK', 'RING1']; // RING1 used for generation, can equip to RING2
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
      
      if (wType === WeaponType.SWORD) {
          name = `${prefix} Blade`;
          scalings.s = rarity === Rarity.LEGENDARY ? 'S' : rarity === Rarity.EPIC ? 'A' : rarity === Rarity.RARE ? 'B' : 'C';
          scalings.a = 'D';
          baseSpeed = 1.5; baseRange = 80;
      } else if (wType === WeaponType.BOW) {
          name = `${prefix} Longbow`;
          scalings.a = rarity === Rarity.LEGENDARY ? 'S' : rarity === Rarity.EPIC ? 'A' : rarity === Rarity.RARE ? 'B' : 'C';
          scalings.s = 'E';
          baseSpeed = 2; baseRange = 400;
      } else if (wType === WeaponType.STAFF) {
          name = `${prefix} Staff`;
          scalings.i = rarity === Rarity.LEGENDARY ? 'S' : rarity === Rarity.EPIC ? 'A' : rarity === Rarity.RARE ? 'B' : 'C';
          baseSpeed = 0.8; baseRange = 400;
      }
  } 
  // 2. ARMOR / ACCESSORY GENERATION
  else {
      type = (slot === 'NECK' || slot === 'RING1') ? 'ACCESSORY' : 'ARMOR';
      // Pick a Set
      const set = ITEM_SETS[Math.floor(Math.random() * ITEM_SETS.length)];
      setName = set.name;
      
      const slotNameMap: Record<string, string> = {
          'HEAD': 'Helm', 'CHEST': 'Armor', 'LEGS': 'Leggings', 'BOOTS': 'Boots', 'GLOVES': 'Gauntlets', 'CAPE': 'Cape', 'NECK': 'Amulet', 'RING1': 'Ring'
      };
      name = `${set.name} ${slotNameMap[slot] || 'Item'}`;

      // Calculate Fixed Attribute based on Slot Multiplier and Quality
      const multiplier = SLOT_STAT_MULTIPLIERS[slot] || 1;
      const statVal = Math.ceil(multiplier * quality * (1 + (level * 0.1)));
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
};

const generateXpOrbs = (x: number, y: number, amount: number): ExperienceOrb[] => {
    const orbs: ExperienceOrb[] = [];
    const orbValue = 10;
    const count = Math.ceil(amount / orbValue);
    for(let i=0; i<count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 100;
        orbs.push({ id: Math.random().toString(), x, y, value: orbValue, radius: 4 + Math.random() * 2, color: '#00ffff', vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
    }
    return orbs;
};

// --- STATS CALCULATION ---
const getEffectiveStats = (player: Player) => {
    const stats = {
        strength: player.strength,
        agility: player.agility,
        vitality: player.vitality,
        perception: player.perception,
        intelligence: player.intelligence
    };

    // Iterate over ALL equipped items
    Object.values(player.equipment).forEach(item => {
        if (item) {
            // Add Base Stat (from Armor/Accessories)
            if (item.baseStat) {
                stats[item.baseStat.type] += item.baseStat.value;
            }
            // Add Affixes
            item.affixes.forEach(affix => {
                stats[affix.type] += affix.value;
            });
        }
    });
    return stats;
};

const calculateWeaponStats = (player: Player) => {
    const weapon = player.equipment.MAIN_HAND;
    if (!weapon) return { damage: 5, range: 50, attackSpeed: 1.0, bonusArc: 0, aoeRadius: 0 };

    const effectiveStats = getEffectiveStats(player);

    let totalDamage = weapon.baseDamage * weapon.power;

    const strFactor = SCALING_FACTORS[weapon.scaling.strength || '-'];
    const agiFactor = SCALING_FACTORS[weapon.scaling.agility || '-'];
    const intFactor = SCALING_FACTORS[weapon.scaling.intelligence || '-'];

    totalDamage += (effectiveStats.strength * strFactor);
    totalDamage += (effectiveStats.agility * agiFactor);
    totalDamage += (effectiveStats.intelligence * intFactor);

    let range = weapon.baseRange;
    let bonusArc = 0;
    let aoeRadius = 0;

    if (weapon.type === WeaponType.SWORD) {
        range += (effectiveStats.strength * strFactor * 2);
        bonusArc = effectiveStats.strength * strFactor * 0.01;
    } else if (weapon.type === WeaponType.BOW) {
        range += (effectiveStats.agility * agiFactor * 10);
    } else if (weapon.type === WeaponType.STAFF) {
        aoeRadius = 60 + (effectiveStats.intelligence * intFactor * 4);
    }

    const spdMod = 1 + (effectiveStats.perception * 0.01);
    const attackSpeed = weapon.baseAttackSpeed * spdMod;

    return { damage: totalDamage, range, attackSpeed, bonusArc, aoeRadius };
};

// Re-calculate Player Stats (MaxHP, Damage, Speed) based on Stats
const recalculatePlayerStats = (player: Player) => {
    const effectiveStats = getEffectiveStats(player);
    
    // 1 Vitality = 5 HP. Base HP = 75 (Since initial 5 Vit gives 100 HP)
    const newMaxHp = 75 + (effectiveStats.vitality * 5);
    const hpRatio = player.hp / player.maxHp;
    
    player.maxHp = newMaxHp;
    // Optional: Keep same percentage of HP or just clamp. Let's clamp to max.
    player.hp = Math.min(player.hp, player.maxHp);
    
    const combatStats = calculateWeaponStats(player);
    player.damage = combatStats.damage;
    player.attackSpeed = combatStats.attackSpeed;
    
    return player;
};

const generateMissions = (playerLevel: number): PortalMission[] => {
  const missions: PortalMission[] = [];
  const ranks = ['E', 'D', 'C', 'B', 'A', 'S'];
  const baseDifficulty = Math.ceil(playerLevel / 5);

  for (let i = 0; i < 3; i++) {
    const rankIndex = Math.min(5, Math.max(0, Math.floor((playerLevel - 1) / 10) + Math.floor(Math.random() * 3) - 1));
    const rank = ranks[rankIndex];
    
    missions.push({
      id: Math.random().toString(),
      rank,
      timeLeft: 300 + Math.random() * 300,
      difficulty: baseDifficulty + Math.floor(Math.random() * 2),
      description: `Clear the ${rank}-Rank Gate`,
      enemyCount: 20 + Math.floor(Math.random() * 20),
      bossType: 'Boss'
    });
  }
  return missions;
};

const generateDungeonMap = () => {
    const width = DUNGEON_WIDTH;
    const height = DUNGEON_HEIGHT;
    const tiles: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.WALL));
    const rooms: {x: number, y: number, w: number, h: number}[] = [];

    const MIN_ROOM_SIZE = 6;
    const MAX_ROOM_SIZE = 12;
    const MAX_ROOMS = 15;

    for (let i = 0; i < MAX_ROOMS; i++) {
        const w = Math.floor(Math.random() * (MAX_ROOM_SIZE - MIN_ROOM_SIZE + 1)) + MIN_ROOM_SIZE;
        const h = Math.floor(Math.random() * (MAX_ROOM_SIZE - MIN_ROOM_SIZE + 1)) + MIN_ROOM_SIZE;
        const x = Math.floor(Math.random() * (width - w - 2)) + 1;
        const y = Math.floor(Math.random() * (height - h - 2)) + 1;

        const newRoom = { x, y, w, h };
        
        let failed = false;
        for (const other of rooms) {
            if (x < other.x + other.w + 1 && x + w + 1 > other.x && y < other.y + other.h + 1 && y + h + 1 > other.y) {
                failed = true;
                break;
            }
        }

        if (!failed) {
            for (let ry = y; ry < y + h; ry++) {
                for (let rx = x; rx < x + w; rx++) {
                    tiles[ry][rx] = TileType.FLOOR;
                }
            }

            if (rooms.length > 0) {
                const prev = rooms[rooms.length - 1];
                const prevCX = Math.floor(prev.x + prev.w / 2);
                const prevCY = Math.floor(prev.y + prev.h / 2);
                const newCX = Math.floor(x + w / 2);
                const newCY = Math.floor(y + h / 2);

                if (Math.random() > 0.5) {
                    const minX = Math.min(prevCX, newCX);
                    const maxX = Math.max(prevCX, newCX);
                    for (let cx = minX; cx <= maxX; cx++) tiles[prevCY][cx] = TileType.FLOOR;
                    
                    const minY = Math.min(prevCY, newCY);
                    const maxY = Math.max(prevCY, newCY);
                    for (let cy = minY; cy <= maxY; cy++) tiles[cy][newCX] = TileType.FLOOR;
                } else {
                    const minY = Math.min(prevCY, newCY);
                    const maxY = Math.max(prevCY, newCY);
                    for (let cy = minY; cy <= maxY; cy++) tiles[cy][prevCX] = TileType.FLOOR;

                    const minX = Math.min(prevCX, newCX);
                    const maxX = Math.max(prevCX, newCX);
                    for (let cx = minX; cx <= maxX; cx++) tiles[newCY][cx] = TileType.FLOOR;
                }
            }
            rooms.push(newRoom);
        }
    }

    const startRoom = rooms[0];
    const endRoom = rooms[rooms.length - 1];

    const startPos = { x: (startRoom.x + startRoom.w / 2) * TILE_SIZE, y: (startRoom.y + startRoom.h / 2) * TILE_SIZE };
    const bossPos = { x: (endRoom.x + endRoom.w / 2) * TILE_SIZE, y: (endRoom.y + endRoom.h / 2) * TILE_SIZE };

    return { tiles, startPos, bossPos, rooms };
};

// --- RAYCASTING VISIBILITY (Reverted to robust version) ---
interface Point { x: number; y: number; }
interface Segment { a: Point; b: Point; }

const getIntersection = (rayOrigin: Point, rayDir: Point, segment: Segment): Point | null => {
  const r_px = rayOrigin.x;
  const r_py = rayOrigin.y;
  const r_dx = rayDir.x;
  const r_dy = rayDir.y;
  
  const s_px = segment.a.x;
  const s_py = segment.a.y;
  const s_dx = segment.b.x - segment.a.x;
  const s_dy = segment.b.y - segment.a.y;

  const r_mag = Math.sqrt(r_dx * r_dx + r_dy * r_dy);
  const s_mag = Math.sqrt(s_dx * s_dx + s_dy * s_dy);

  if (r_dx / r_mag === s_dx / s_mag && r_dy / r_mag === s_dy / s_mag) return null;

  const T2 = (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) / (s_dx * r_dy - s_dy * r_dx);
  const T1 = (s_px + s_dx * T2 - r_px) / r_dx;

  if (T1 < 0) return null;
  if (T2 < 0 || T2 > 1) return null;

  return {
    x: r_px + r_dx * T1,
    y: r_py + r_dy * T1
  };
};

const calculateVisibility = (origin: Point, radius: number, tiles: TileType[][]) => {
    const segments: Segment[] = [];
    
    const gridX = Math.floor(origin.x / TILE_SIZE);
    const gridY = Math.floor(origin.y / TILE_SIZE);
    const range = Math.ceil(radius / TILE_SIZE) + 1;
    
    for(let y = gridY - range; y <= gridY + range; y++) {
        for(let x = gridX - range; x <= gridX + range; x++) {
            if (y >= 0 && y < DUNGEON_HEIGHT && x >= 0 && x < DUNGEON_WIDTH) {
                if (tiles[y][x] === TileType.WALL) {
                    const top = y * TILE_SIZE;
                    const bottom = (y + 1) * TILE_SIZE;
                    const left = x * TILE_SIZE;
                    const right = (x + 1) * TILE_SIZE;
                    
                    if (y === 0 || tiles[y-1][x] !== TileType.WALL) segments.push({ a: {x: left, y: top}, b: {x: right, y: top} });
                    if (y === DUNGEON_HEIGHT - 1 || tiles[y+1][x] !== TileType.WALL) segments.push({ a: {x: left, y: bottom}, b: {x: right, y: bottom} });
                    if (x === 0 || tiles[y][x-1] !== TileType.WALL) segments.push({ a: {x: left, y: top}, b: {x: left, y: bottom} });
                    if (x === DUNGEON_WIDTH - 1 || tiles[y][x+1] !== TileType.WALL) segments.push({ a: {x: right, y: top}, b: {x: right, y: bottom} });
                }
            }
        }
    }
    
    const boxMinX = origin.x - radius; const boxMaxX = origin.x + radius;
    const boxMinY = origin.y - radius; const boxMaxY = origin.y + radius;
    segments.push({ a: {x: boxMinX, y: boxMinY}, b: {x: boxMaxX, y: boxMinY} });
    segments.push({ a: {x: boxMaxX, y: boxMinY}, b: {x: boxMaxX, y: boxMaxY} });
    segments.push({ a: {x: boxMaxX, y: boxMaxY}, b: {x: boxMinX, y: boxMaxY} });
    segments.push({ a: {x: boxMinX, y: boxMaxY}, b: {x: boxMinX, y: boxMinY} });

    const uniqueAngles = new Set<number>();
    segments.forEach(seg => {
        [seg.a, seg.b].forEach(p => {
             const angle = Math.atan2(p.y - origin.y, p.x - origin.x);
             uniqueAngles.add(angle);
             uniqueAngles.add(angle - 0.0001);
             uniqueAngles.add(angle + 0.0001);
        });
    });

    const intersects: {x: number, y: number, angle: number}[] = [];
    uniqueAngles.forEach(angle => {
         const dx = Math.cos(angle);
         const dy = Math.sin(angle);
         const rayDir = { x: dx, y: dy };
         let closest: Point | null = null;
         let minDist = Infinity;

         segments.forEach(seg => {
             const p = getIntersection(origin, rayDir, seg);
             if (p) {
                 const d = (p.x - origin.x)**2 + (p.y - origin.y)**2;
                 if (d < minDist) { minDist = d; closest = p; }
             }
         });

         if (closest) intersects.push({ ...closest, angle });
    });

    intersects.sort((a, b) => a.angle - b.angle);
    return intersects;
};


export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [uiPlayer, setUiPlayer] = useState<Player>(INITIAL_PLAYER);
  const [activeBoss, setActiveBoss] = useState<Enemy | null>(null);
  const [score, setScore] = useState(0);
  const [dungeonTimer, setDungeonTimer] = useState<number | undefined>(undefined);
  const [missions, setMissions] = useState<PortalMission[]>([]);

  const worldRef = useRef<GameWorld>({
    width: 0, height: 0, tiles: [], tileSize: TILE_SIZE,
    player: { ...INITIAL_PLAYER },
    enemies: [], projectiles: [], activeMissions: [], particles: [], texts: [], items: [], xpOrbs: [],
    camera: { x: 0, y: 0 }, score: 0
  });

  const inputsRef = useRef({
    up: false, down: false, left: false, right: false,
    attack: false, dodge: false, pickup: false, mouseX: 0, mouseY: 0, inventoryToggle: false
  });

  useEffect(() => {
    const ms = generateMissions(1);
    setMissions(ms);
    worldRef.current.activeMissions = ms;
    const mask = document.createElement('canvas');
    mask.width = CANVAS_WIDTH;
    mask.height = CANVAS_HEIGHT;
    maskCanvasRef.current = mask;
  }, []);

  useEffect(() => {
    if (gameState === GameState.GAME_OVER) {
      const timer = setTimeout(() => { restartGame(); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') inputsRef.current.up = true;
      if (e.code === 'KeyS') inputsRef.current.down = true;
      if (e.code === 'KeyA') inputsRef.current.left = true;
      if (e.code === 'KeyD') inputsRef.current.right = true;
      if (e.code === 'Space') inputsRef.current.dodge = true;
      if (e.code === 'KeyF') inputsRef.current.pickup = true;
      if (e.code === 'Tab') { e.preventDefault(); const p = worldRef.current.player; p.inventoryOpen = !p.inventoryOpen; }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') inputsRef.current.up = false;
      if (e.code === 'KeyS') inputsRef.current.down = false;
      if (e.code === 'KeyA') inputsRef.current.left = false;
      if (e.code === 'KeyD') inputsRef.current.right = false;
      if (e.code === 'Space') inputsRef.current.dodge = false;
      if (e.code === 'KeyF') inputsRef.current.pickup = false;
    };
    const handleMouseMove = (e: MouseEvent) => { inputsRef.current.mouseX = e.clientX; inputsRef.current.mouseY = e.clientY; };
    const handleMouseDown = () => { inputsRef.current.attack = true; };
    const handleMouseUp = () => { inputsRef.current.attack = false; };

    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mousedown', handleMouseDown); window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mousedown', handleMouseDown); window.removeEventListener('mouseup', handleMouseUp); };
  }, []);

  const update = useCallback((dt: number) => {
    const world = worldRef.current;
    const inputs = inputsRef.current;
    const player = world.player;

    if (gameState === GameState.MENU) return;

    if (player.hp <= 0) { player.isDead = true; player.hp = 0; }
    if (player.isDead) { if (gameState !== GameState.GAME_OVER) setGameState(GameState.GAME_OVER); return; }
    if (player.inventoryOpen) return;

    const screenCenterX = CANVAS_WIDTH / 2;
    const screenCenterY = CANVAS_HEIGHT / 2;
    const dx = inputs.mouseX - screenCenterX;
    const dy = inputs.mouseY - screenCenterY;
    player.facingAngle = Math.atan2(dy, dx);

    if (player.dodgeDuration > 0) { player.dodgeDuration -= dt; player.isDodging = true; } else { player.isDodging = false; }
    if (player.dodgeCooldown > 0) player.dodgeCooldown -= dt;
    if (player.attackCooldown > 0) player.attackCooldown -= dt;
    if (player.attackVisualTimer > 0) player.attackVisualTimer -= dt;

    let vx = 0; let vy = 0;
    if (inputs.up) vy -= 1; if (inputs.down) vy += 1; if (inputs.left) vx -= 1; if (inputs.right) vx += 1;
    if (vx !== 0 || vy !== 0) { const len = Math.hypot(vx, vy); vx /= len; vy /= len; }

    if (inputs.dodge && player.dodgeCooldown <= 0 && !player.isDodging) {
        player.isDodging = true; player.dodgeDuration = DODGE_DURATION; player.dodgeCooldown = DODGE_COOLDOWN;
        if (vx === 0 && vy === 0) { vx = Math.cos(player.facingAngle); vy = Math.sin(player.facingAngle); }
        player.lastCombatTime = performance.now();
        for(let i=0; i<5; i++) { world.particles.push({ id: Math.random().toString(), x: player.x, y: player.y, vx: -vx * 100 + (Math.random()-0.5)*50, vy: -vy * 100 + (Math.random()-0.5)*50, life: 0.3, maxLife: 0.3, color: 'rgba(100, 200, 255, 0.5)', size: 10 }); }
    }

    let currentSpeed = player.speed;
    const timeSinceCombat = performance.now() - player.lastCombatTime;
    const isSprinting = timeSinceCombat > OUT_OF_COMBAT_DELAY && !player.isDodging && !inputs.attack;

    if (player.isDodging) currentSpeed *= DODGE_SPEED_MULT;
    else if (isSprinting) currentSpeed *= OUT_OF_COMBAT_SPEED_MULT;
    else if (inputs.attack && player.equipment.MAIN_HAND) currentSpeed *= PLAYER_ATTACK_SLOW;

    player.x += vx * currentSpeed * dt;
    player.y += vy * currentSpeed * dt;
    resolveWallCollision(player, world.tiles, world.tileSize);

    if (inputs.pickup) {
        let closestItem: Item & {x: number, y: number} | null = null;
        let minDist = 100;
        for(const item of world.items) { const d = distance(player, item); if (d < minDist) { minDist = d; closestItem = item; } }
        if (closestItem) { pickupItem(closestItem); inputs.pickup = false; }
    }

    player.isAttacking = inputs.attack;
    const combatStats = calculateWeaponStats(player);

    if (inputs.attack && player.attackCooldown <= 0 && !player.isDodging && player.equipment.MAIN_HAND) {
      player.attackCooldown = 1 / combatStats.attackSpeed;
      player.lastCombatTime = performance.now(); 
      const weapon = player.equipment.MAIN_HAND;
      
      if (weapon.type === WeaponType.SWORD) {
        player.attackVisualTimer = 0.3;
        const CONE_ANGLE = Math.PI / 3 + combatStats.bonusArc;
        world.enemies.forEach(enemy => {
           const dist = distance(player, enemy);
           if (dist < combatStats.range + enemy.radius) {
             const angleToEnemy = Math.atan2(enemy.y - player.y, enemy.x - player.x);
             let angleDiff = angleToEnemy - player.facingAngle;
             while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
             while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
             if (Math.abs(angleDiff) < CONE_ANGLE / 2) { 
                enemy.hp -= combatStats.damage;
                if (enemy.type !== 'BOSS') enemy.state = 'CHASE'; 
                world.texts.push({ id: Math.random().toString(), x: enemy.x, y: enemy.y, text: Math.round(combatStats.damage).toString(), color: '#fff', life: 0.5, vy: -50 });
             }
           }
        });
        world.particles.push({ id: Math.random().toString(), x: player.x, y: player.y, vx: 0, vy: 0, life: 0.15, maxLife: 0.15, color: 'rgba(200, 200, 255, 0.5)', size: combatStats.range });
      } else if (weapon.type === WeaponType.BOW) {
        world.projectiles.push({ id: Math.random().toString(), x: player.x, y: player.y, vx: Math.cos(player.facingAngle) * 700, vy: Math.sin(player.facingAngle) * 700, radius: 4, damage: combatStats.damage, owner: 'PLAYER', lifeTime: 1.5, color: '#3b82f6' });
      } else if (weapon.type === WeaponType.STAFF) {
        player.attackVisualTimer = 0.3; 
        const worldMouseX = world.camera.x + inputs.mouseX - (CANVAS_WIDTH/2);
        const worldMouseY = world.camera.y + inputs.mouseY - (CANVAS_HEIGHT/2);
        const dx = worldMouseX - player.x; const dy = worldMouseY - player.y;
        const dist = Math.hypot(dx, dy);
        const actualDist = Math.min(dist, combatStats.range);
        const angle = Math.atan2(dy, dx);
        const targetX = player.x + Math.cos(angle) * actualDist;
        const targetY = player.y + Math.sin(angle) * actualDist;
        world.particles.push({ id: Math.random().toString(), x: targetX, y: targetY, vx: 0, vy: 0, life: 0.5, maxLife: 0.5, color: 'rgba(59, 130, 246, 0.4)', size: combatStats.aoeRadius });
        world.enemies.forEach(enemy => {
          if (distance({x: targetX, y: targetY}, enemy) < combatStats.aoeRadius + enemy.radius) {
            enemy.hp -= combatStats.damage;
            if (enemy.type !== 'BOSS') enemy.state = 'CHASE';
            world.texts.push({ id: Math.random().toString(), x: enemy.x, y: enemy.y, text: Math.round(combatStats.damage).toString(), color: '#3b82f6', life: 0.5, vy: -50 });
          }
        });
      }
    }

    for (let i = world.projectiles.length - 1; i >= 0; i--) {
      const p = world.projectiles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.lifeTime -= dt;
      const gridX = Math.floor(p.x / TILE_SIZE); const gridY = Math.floor(p.y / TILE_SIZE);
      if (gridX < 0 || gridX >= DUNGEON_WIDTH || gridY < 0 || gridY >= DUNGEON_HEIGHT || world.tiles[gridY][gridX] === TileType.WALL) { world.projectiles.splice(i, 1); continue; }
      let hit = false;
      if (p.owner === 'PLAYER') {
        for (const enemy of world.enemies) {
          if (checkCollision(p, enemy)) {
            enemy.hp -= p.damage;
            if (enemy.type !== 'BOSS') enemy.state = 'CHASE';
            hit = true;
            world.texts.push({ id: Math.random().toString(), x: enemy.x, y: enemy.y, text: Math.round(p.damage).toString(), color: '#fff', life: 0.5, vy: -50 });
            break;
          }
        }
      } else {
        if (checkCollision(p, player) && !player.isDodging) {
          player.hp -= p.damage; player.lastCombatTime = performance.now(); hit = true;
          world.texts.push({ id: Math.random().toString(), x: player.x, y: player.y, text: `-${Math.round(p.damage)}`, color: '#ef4444', life: 0.8, vy: -30 });
        }
      }
      if (p.lifeTime <= 0 || hit) world.projectiles.splice(i, 1);
    }

    for (let i = world.xpOrbs.length - 1; i >= 0; i--) {
        const orb = world.xpOrbs[i];
        orb.x += orb.vx * dt; orb.y += orb.vy * dt; orb.vx *= 0.9; orb.vy *= 0.9;
        if (distance(player, orb) < player.radius + orb.radius + 10) {
            player.exp += orb.value;
            world.texts.push({id: Math.random().toString(), x: player.x, y: player.y - 20, text: `+${orb.value} XP`, color: '#00ffff', life: 0.5, vy: -50});
            if (player.exp >= player.level * 100) {
                player.level++; player.exp = 0; player.attributePoints += 3;
                world.texts.push({id: Math.random().toString(), x: player.x, y: player.y - 40, text: "LEVEL UP!", color: "#ffd700", life: 2, vy: -20});
            }
            world.xpOrbs.splice(i, 1);
        }
    }

    for (let i = world.enemies.length - 1; i >= 0; i--) {
      const enemy = world.enemies[i];
      resolveWallCollision(enemy, world.tiles, world.tileSize);
      if (enemy.hp <= 0) {
        if (Math.random() < 0.4) world.items.push(generateLoot(enemy.x, enemy.y, player.level));
        const xpAmount = (enemy.type === 'BOSS' ? 500 : enemy.type === 'GRUNT' ? 10 : 20);
        world.xpOrbs.push(...generateXpOrbs(enemy.x, enemy.y, xpAmount));
        world.score += (enemy.type === 'BOSS' ? 500 : 50);
        world.enemies.splice(i, 1);
        if (enemy.type === 'BOSS') { setTimeout(() => { setGameState(GameState.MENU); setMissions(generateMissions(player.level)); }, 4000); world.texts.push({id: Math.random().toString(), x: enemy.x, y: enemy.y, text: "DUNGEON CLEARED", color: "#ffd700", life: 3, vy: -10}); }
        continue;
      }
      
      const distToPlayer = distance(enemy, player);
      if (enemy.state === 'IDLE') {
          if (distToPlayer < enemy.aggroRange) { enemy.state = 'CHASE'; } 
          else {
              if (enemy.patrolTimer > 0) enemy.patrolTimer -= dt;
              else {
                  if (!enemy.patrolTarget) { const angle = Math.random() * Math.PI * 2; const dist = Math.random() * 150; enemy.patrolTarget = { x: enemy.originX + Math.cos(angle) * dist, y: enemy.originY + Math.sin(angle) * dist }; enemy.patrolTimer = 2 + Math.random() * 3; } else { enemy.patrolTarget = undefined; enemy.patrolTimer = 1 + Math.random() * 2; }
              }
              if (enemy.patrolTarget) { const dx = enemy.patrolTarget.x - enemy.x; const dy = enemy.patrolTarget.y - enemy.y; const dist = Math.hypot(dx, dy); if (dist > 5) { enemy.x += (dx / dist) * (enemy.speed * 0.5) * dt; } else { enemy.patrolTarget = undefined; enemy.patrolTimer = 1; } }
          }
      } else if (enemy.type === 'GRUNT') {
         if (enemy.state === 'CHASE') {
             const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
             enemy.x += Math.cos(angle) * enemy.speed * dt; enemy.y += Math.sin(angle) * enemy.speed * dt;
             if (distToPlayer < enemy.radius + player.radius && !player.isDodging) { if (Math.random() < dt * 2) { player.hp -= enemy.damage; player.lastCombatTime = performance.now(); world.texts.push({id: Math.random().toString(), x: player.x, y: player.y, text: `-${enemy.damage}`, color: "#ef4444", life: 0.5, vy: -30}); } }
         }
      } else if (enemy.type === 'CASTER' || enemy.type === 'BOSS') {
          if (enemy.attackTimer > 0) enemy.attackTimer -= dt;
          if (enemy.state === 'CHASE') {
               if (distToPlayer > enemy.attackRange * 0.7) { const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x); enemy.x += Math.cos(angle) * enemy.speed * dt; enemy.y += Math.sin(angle) * enemy.speed * dt; } 
               else if (enemy.attackTimer <= 0) { enemy.state = 'PREPARING'; enemy.targetPos = { x: player.x, y: player.y }; enemy.telegraphTimer = enemy.telegraphDuration; }
          }
          if (enemy.state === 'PREPARING') {
              enemy.telegraphTimer -= dt;
              if (enemy.telegraphTimer <= 0) {
                  enemy.state = 'ATTACKING';
                  if (enemy.targetPos) {
                      const explosionRadius = enemy.type === 'BOSS' ? 80 : 40;
                      if (distance(enemy.targetPos, player) < explosionRadius && !player.isDodging) { player.hp -= enemy.damage; player.lastCombatTime = performance.now(); world.texts.push({id: Math.random().toString(), x: player.x, y: player.y, text: `-${enemy.damage}`, color: "#ef4444", life: 0.5, vy: -30}); }
                      world.particles.push({id: Math.random().toString(), x: enemy.targetPos.x, y: enemy.targetPos.y, vx: 0, vy: 0, life: 0.4, maxLife: 0.4, size: explosionRadius, color: 'rgba(239, 68, 68, 0.5)'});
                  }
                  enemy.attackTimer = enemy.attackCooldown; enemy.state = 'CHASE';
              }
          }
      }
    }

    for (let i = world.texts.length - 1; i >= 0; i--) { const t = world.texts[i]; t.life -= dt; t.y += t.vy * dt; if (t.life <= 0) world.texts.splice(i, 1); }
    for (let i = world.particles.length - 1; i >= 0; i--) { const p = world.particles[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) world.particles.splice(i, 1); }

    if (gameState === GameState.DUNGEON && dungeonTimer !== undefined) { setDungeonTimer(prev => (prev ? prev - dt : 0)); if (dungeonTimer <= 0) player.hp = 0; }

    const camSpeed = isSprinting ? 8 : 5;
    world.camera.x += (player.x - world.camera.x) * camSpeed * dt;
    world.camera.y += (player.y - world.camera.y) * camSpeed * dt;

  }, [gameState, dungeonTimer]);

  const handleUpgradeStat = (stat: 'strength' | 'agility' | 'vitality' | 'perception' | 'intelligence') => {
      const p = worldRef.current.player;
      if (p.attributePoints > 0) { 
          p[stat] += 1; 
          p.attributePoints -= 1; 
          
          recalculatePlayerStats(p);
          setUiPlayer({...p}); 
      }
  };

  const startMission = (mission: PortalMission) => {
      const w = worldRef.current;
      
      // Validation: Must have Main Hand equipped
      if (!w.player.equipment.MAIN_HAND) {
          w.texts.push({ id: Math.random().toString(), x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2, text: "WEAPON REQUIRED!", color: "#ef4444", life: 1.5, vy: -20 });
          return;
      }

      const { tiles, startPos, bossPos, rooms } = generateDungeonMap();
      w.tiles = tiles; w.width = DUNGEON_WIDTH * TILE_SIZE; w.height = DUNGEON_HEIGHT * TILE_SIZE; w.player.x = startPos.x; w.player.y = startPos.y;
      w.enemies = []; w.items = []; w.xpOrbs = []; w.projectiles = [];
      
      for(let i=1; i<rooms.length-1; i++) {
          const room = rooms[i];
          const count = Math.floor(Math.random() * 3) + 1;
          for(let k=0; k<count; k++) {
              const isCaster = Math.random() > 0.7;
              const stats = isCaster ? ENEMY_TYPES.CASTER : ENEMY_TYPES.GRUNT;
              const ex = (room.x + Math.random()*room.w) * TILE_SIZE;
              const ey = (room.y + Math.random()*room.h) * TILE_SIZE;
              w.enemies.push({ id: `e_${i}_${k}`, x: ex, y: ey, type: isCaster ? 'CASTER' : 'GRUNT', state: 'IDLE', ...stats, maxHp: stats.hp, attackTimer: 0, telegraphTimer: 0, telegraphDuration: 1.5, aggroRange: 300, attackRange: isCaster ? 250 : 30, attackCooldown: 2, originX: ex, originY: ey, patrolTimer: 0, isDead: false });
          }
      }
      const bossMaxHp = ENEMY_TYPES.BOSS.hp * mission.difficulty;
      w.enemies.push({ id: 'BOSS', x: bossPos.x, y: bossPos.y, type: 'BOSS', state: 'IDLE', ...ENEMY_TYPES.BOSS, maxHp: bossMaxHp, hp: bossMaxHp, damage: ENEMY_TYPES.BOSS.damage * (1 + mission.difficulty * 0.1), attackTimer: 0, telegraphTimer: 0, telegraphDuration: 1.0, aggroRange: 500, attackRange: 150, attackCooldown: 3, originX: bossPos.x, originY: bossPos.y, patrolTimer: 0, isDead: false });

      setDungeonTimer(mission.timeLeft);
      setGameState(GameState.DUNGEON);
      w.player.lastCombatTime = performance.now();
  };

  const restartGame = () => {
      // PRESERVE GOLD (SCORE)
      const keptScore = worldRef.current.score;
      
      // Reset Player Structure
      worldRef.current.player = { 
          ...INITIAL_PLAYER, 
          equipment: {
              ...INITIAL_PLAYER.equipment
          },
          inventory: []
      };
      
      // Restore Score
      worldRef.current.score = keptScore;
      setScore(keptScore);
      
      setGameState(GameState.MENU);
      setMissions(generateMissions(1));
  };

  // --- UPDATED INVENTORY LOGIC ---
  const equipItem = (item: Item, targetSlot?: EquipmentSlot) => {
      const player = worldRef.current.player;
      
      // Determine slot
      let slotToEquip = targetSlot;
      if (!slotToEquip) {
          // If no target slot, infer from item.slot
          if (item.slot === 'RING1') {
              // Logic: Try Ring 1, then Ring 2, else swap Ring 1
              if (!player.equipment.RING1) slotToEquip = 'RING1';
              else if (!player.equipment.RING2) slotToEquip = 'RING2';
              else slotToEquip = 'RING1';
          } else {
              slotToEquip = item.slot;
          }
      }

      if (slotToEquip) {
          const currentEquipped = player.equipment[slotToEquip];
          
          player.equipment[slotToEquip] = item;
          player.inventory = player.inventory.filter(i => i.id !== item.id);
          
          if(currentEquipped) {
              player.inventory.push(currentEquipped);
          }
          
          recalculatePlayerStats(player);
          setUiPlayer({...player});
      }
  };

  const equipFromGround = (item: Item) => {
      equipItem(item); // Uses default logic to find slot
      // Remove from ground happens inside 'pickupItem' usually, but here we do direct swap
      worldRef.current.items = worldRef.current.items.filter(i => i.id !== item.id);
  };

  const unequipItem = (slot: EquipmentSlot) => {
      const player = worldRef.current.player;
      const equipped = player.equipment[slot];
      if (equipped && player.inventory.length < 20) {
          player.inventory.push(equipped);
          player.equipment[slot] = null;
          
          recalculatePlayerStats(player);
          setUiPlayer({...player});
      }
  };

  const dropItem = (item: Item) => {
      const w = worldRef.current;
      const p = w.player;
      p.inventory = p.inventory.filter(i => i.id !== item.id);
      w.items.push({ ...item, x: p.x + (Math.random() - 0.5) * 50, y: p.y + (Math.random() - 0.5) * 50 });
      setUiPlayer({...p});
  };

  const dropEquippedItem = (slot: EquipmentSlot) => {
      const w = worldRef.current;
      const p = w.player;
      const equipped = p.equipment[slot];
      if (equipped) {
          w.items.push({ ...equipped, x: p.x + (Math.random() - 0.5) * 50, y: p.y + (Math.random() - 0.5) * 50 });
          p.equipment[slot] = null;
          
          recalculatePlayerStats(p);
          setUiPlayer({...p});
      }
  };

  const pickupItem = (item: Item) => {
      const p = worldRef.current.player;
      if (p.inventory.length < 20) {
          p.inventory.push(item);
          worldRef.current.items = worldRef.current.items.filter(i => i.id !== item.id);
          setUiPlayer({...p});
          worldRef.current.texts.push({ id: Math.random().toString(), x: p.x, y: p.y - 40, text: `+ ${item.name}`, color: item.color, life: 1, vy: -50 });
      } else {
          worldRef.current.texts.push({ id: Math.random().toString(), x: p.x, y: p.y - 40, text: "Inventory Full", color: "#ef4444", life: 1, vy: -50 });
      }
  };

  const handleBuy = (item: Item) => {
      const w = worldRef.current;
      if (w.score >= item.price && w.player.inventory.length < 20) {
          w.score -= item.price;
          setScore(w.score);
          w.player.inventory.push({ ...item, id: Math.random().toString() });
          setUiPlayer({...w.player});
      }
  };

  const handleSell = (item: Item) => {
      const w = worldRef.current;
      const sellPrice = Math.floor(item.price / 2);
      w.score += sellPrice;
      setScore(w.score);
      w.player.inventory = w.player.inventory.filter(i => i.id !== item.id);
      setUiPlayer({...w.player});
  };

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (gameState === GameState.DUNGEON) { update(dt); }
      
      // Update UI player reference for seamless HP bar updates
      if (gameState === GameState.DUNGEON) {
          setUiPlayer(prev => ({ ...worldRef.current.player }));
      }
      
      setScore(worldRef.current.score);
      const boss = worldRef.current.enemies.find(e => e.type === 'BOSS');
      setActiveBoss(boss || null);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx && gameState === GameState.DUNGEON) {
        const world = worldRef.current;
        const player = world.player;
        
        ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.save(); ctx.translate(CANVAS_WIDTH / 2 - world.camera.x, CANVAS_HEIGHT / 2 - world.camera.y);

        const startX = Math.floor((world.camera.x - CANVAS_WIDTH/2) / TILE_SIZE);
        const endX = startX + Math.ceil(CANVAS_WIDTH / TILE_SIZE) + 1;
        const startY = Math.floor((world.camera.y - CANVAS_HEIGHT/2) / TILE_SIZE);
        const endY = startY + Math.ceil(CANVAS_HEIGHT / TILE_SIZE) + 1;

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if(y >= 0 && y < world.tiles.length && x >= 0 && x < world.tiles[0].length) {
                    const tile = world.tiles[y][x];
                    if (tile === TileType.FLOOR) { ctx.fillStyle = '#334155'; ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE + 1, TILE_SIZE + 1); } 
                    else { ctx.fillStyle = '#1e293b'; ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE + 1, TILE_SIZE + 1); }
                }
            }
        }

        world.xpOrbs.forEach(orb => { ctx.save(); ctx.translate(orb.x, orb.y); ctx.shadowColor = orb.color; ctx.shadowBlur = 15; ctx.fillStyle = orb.color; ctx.beginPath(); ctx.arc(0, 0, orb.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });

        world.items.forEach(item => {
             ctx.save(); ctx.translate(item.x, item.y); ctx.shadowColor = item.color; ctx.shadowBlur = 10; ctx.fillStyle = item.color;
             ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 0); ctx.lineTo(0, 8); ctx.lineTo(-6, 0); ctx.fill(); ctx.restore();
             const d = Math.hypot(item.x - player.x, item.y - player.y);
             if (d < 100) { ctx.save(); ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = item.color; ctx.shadowColor = '#000'; ctx.shadowBlur = 4; ctx.lineWidth = 3; ctx.strokeText(`${item.name}`, 0, -20); ctx.fillText(`${item.name}`, 0, -20); ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.fillText(`[F]`, 0, -8); ctx.restore(); }
        });

        world.enemies.forEach(e => {
            ctx.save(); ctx.translate(e.x, e.y);
            if (e.state === 'PREPARING' && e.targetPos) { ctx.save(); ctx.translate(-e.x + e.targetPos.x, -e.y + e.targetPos.y); const ratio = 1 - (e.telegraphTimer / e.telegraphDuration); const radius = e.type === 'BOSS' ? 80 : 40; ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, radius * ratio, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
            ctx.fillStyle = e.color; if (e.state === 'ATTACKING') ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
            const hpPct = e.hp / e.maxHp; ctx.fillStyle = '#000'; ctx.fillRect(-15, -e.radius - 10, 30, 4); ctx.fillStyle = '#ef4444'; ctx.fillRect(-15, -e.radius - 10, 30 * hpPct, 4);
            if (e.type === 'BOSS') { ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, e.radius + 5, 0, Math.PI * 2); ctx.stroke(); }
            ctx.restore();
        });

        ctx.save(); ctx.translate(player.x, player.y);
        const timeSinceCombat = time - player.lastCombatTime;
        const isSprinting = timeSinceCombat > OUT_OF_COMBAT_DELAY && !player.isDodging && !player.isAttacking;
        if (isSprinting) { ctx.fillStyle = '#60a5fa'; ctx.textAlign = 'center'; ctx.font = 'bold 20px monospace'; ctx.fillText('>>', 0, -player.radius - 15); }
        ctx.rotate(player.facingAngle);
        ctx.fillStyle = player.isDodging ? '#93c5fd' : '#3b82f6'; ctx.beginPath(); ctx.arc(0, 0, player.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(player.radius, 0); ctx.lineTo(player.radius - 5, -5); ctx.lineTo(player.radius - 5, 5); ctx.fill();
        if (player.equipment.MAIN_HAND) { ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, 5); ctx.lineTo(25, 5); ctx.stroke(); }
        ctx.restore();

        if (player.attackVisualTimer > 0 && player.equipment.MAIN_HAND?.type === WeaponType.SWORD) { const angle = Math.PI / 3; const alpha = Math.max(0, player.attackVisualTimer / 0.3); ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.facingAngle); ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, player.equipment.MAIN_HAND.baseRange, -angle/2, angle/2); ctx.lineTo(0,0); ctx.fill(); ctx.restore(); }

        world.projectiles.forEach(p => { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill(); });
        world.particles.forEach(p => { ctx.save(); ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color; ctx.beginPath(); if (p.size > 10) { ctx.arc(p.x, p.y, p.size * (1 - p.life/p.maxLife), 0, Math.PI * 2); ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.stroke(); } else { ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); });
        world.texts.forEach(t => { ctx.fillStyle = t.color; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(t.text, t.x, t.y); ctx.fillText(t.text, t.x, t.y); });

        ctx.restore();

        if (maskCanvasRef.current) {
            const maskCtx = maskCanvasRef.current.getContext('2d');
            if (maskCtx) {
                maskCtx.globalCompositeOperation = 'source-over'; maskCtx.fillStyle = 'rgba(0, 0, 0, 0.94)'; maskCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); maskCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                maskCtx.globalCompositeOperation = 'destination-out';
                const drawPlayerLight = () => {
                    const radius = 350; const poly = calculateVisibility(player, radius, world.tiles);
                    if (poly.length > 0) { maskCtx.save(); maskCtx.beginPath(); const startX = poly[0].x - world.camera.x + CANVAS_WIDTH/2; const startY = poly[0].y - world.camera.y + CANVAS_HEIGHT/2; maskCtx.moveTo(startX, startY); for (let i = 1; i < poly.length; i++) { const px = poly[i].x - world.camera.x + CANVAS_WIDTH/2; const py = poly[i].y - world.camera.y + CANVAS_HEIGHT/2; maskCtx.lineTo(px, py); } maskCtx.closePath(); maskCtx.clip(); const screenX = player.x - world.camera.x + CANVAS_WIDTH/2; const screenY = player.y - world.camera.y + CANVAS_HEIGHT/2; const grad = maskCtx.createRadialGradient(screenX, screenY, radius * 0.2, screenX, screenY, radius); grad.addColorStop(0, `rgba(0,0,0,1)`); grad.addColorStop(1, 'rgba(0,0,0,0)'); maskCtx.fillStyle = grad; maskCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); maskCtx.restore(); }
                };
                const drawSimpleLight = (worldX: number, worldY: number, radius: number, intensity: number) => { const screenX = worldX - world.camera.x + CANVAS_WIDTH/2; const screenY = worldY - world.camera.y + CANVAS_HEIGHT/2; if (screenX < -radius || screenX > CANVAS_WIDTH + radius || screenY < -radius || screenY > CANVAS_HEIGHT + radius) return; const grad = maskCtx.createRadialGradient(screenX, screenY, radius * 0.2, screenX, screenY, radius); grad.addColorStop(0, `rgba(0,0,0,${intensity})`); grad.addColorStop(1, 'rgba(0,0,0,0)'); maskCtx.fillStyle = grad; maskCtx.beginPath(); maskCtx.arc(screenX, screenY, radius, 0, Math.PI*2); maskCtx.fill(); };
                drawPlayerLight();
                world.projectiles.forEach(p => { if (p.owner === 'PLAYER') drawSimpleLight(p.x, p.y, 100, 0.8); });
                if (activeBoss) { drawSimpleLight(activeBoss.x, activeBoss.y, 250, 0.6); }
                world.items.forEach(item => { const radius = item.rarity === Rarity.LEGENDARY ? 100 : item.rarity === Rarity.EPIC ? 80 : 50; const intensity = item.rarity === Rarity.LEGENDARY ? 0.7 : 0.4; drawSimpleLight(item.x, item.y, radius, intensity); });
                world.xpOrbs.forEach(orb => { drawSimpleLight(orb.x, orb.y, 40, 0.4); });
                ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(maskCanvasRef.current, 0, 0); ctx.restore();
            }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };
    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, dungeonTimer]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block" />
      <UIOverlay 
        gameState={gameState} 
        player={uiPlayer} 
        activeBoss={activeBoss}
        score={score}
        dungeonTimer={dungeonTimer}
        missions={missions}
        groundItems={worldRef.current.items.filter(i => distance(i, worldRef.current.player) < 150)} 
        onStartMission={startMission}
        onRestart={restartGame}
        onEquip={equipItem}
        onEquipFromGround={equipFromGround}
        onUnequip={unequipItem}
        onDrop={dropItem}
        onDropEquipped={dropEquippedItem}
        onPickup={pickupItem}
        onBuy={handleBuy}
        onSell={handleSell}
        onUpgradeStat={handleUpgradeStat}
      />
    </div>
  );
}
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, GameWorld, Player, Enemy, PortalMission, WeaponType, Item, TileType, EquipmentSlot } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_BASE_SPEED, PLAYER_ATTACK_SLOW, DODGE_SPEED_MULT, DODGE_DURATION, DODGE_COOLDOWN, TILE_SIZE, DUNGEON_WIDTH, DUNGEON_HEIGHT, STARTING_WEAPON, ENEMY_TYPES, OUT_OF_COMBAT_DELAY, OUT_OF_COMBAT_SPEED_MULT } from './constants';
import { UIOverlay } from './components/UIOverlay';

// Systems & Helpers
import { distance, checkCollision } from './utils/math';
import { resolveWallCollision } from './systems/physics';
import { calculateWeaponStats, recalculatePlayerStats } from './systems/stats';
import { generateLoot, generateXpOrbs } from './systems/loot';
import { generateMissions, generateDungeonMap } from './systems/dungeon';
import { renderGame } from './systems/renderer';
import { useGameInput } from './hooks/useGameInput';

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

  // Extracted Hook for Input Logic
  const inputsRef = useGameInput(worldRef);

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

  // Main Game Loop Logic
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
              w.enemies.push({ id: `e_${i}_${k}`, x: ex, y: ey, type: isCaster ? 'CASTER' : 'GRUNT', state: 'IDLE', ...(stats as any), maxHp: stats.hp, attackTimer: 0, telegraphTimer: 0, telegraphDuration: 1.5, aggroRange: 300, attackRange: isCaster ? 250 : 30, attackCooldown: 2, originX: ex, originY: ey, patrolTimer: 0, isDead: false });
          }
      }
      const bossMaxHp = ENEMY_TYPES.BOSS.hp * mission.difficulty;
      w.enemies.push({ id: 'BOSS', x: bossPos.x, y: bossPos.y, type: 'BOSS', state: 'IDLE', ...(ENEMY_TYPES.BOSS as any), maxHp: bossMaxHp, hp: bossMaxHp, damage: ENEMY_TYPES.BOSS.damage * (1 + mission.difficulty * 0.1), attackTimer: 0, telegraphTimer: 0, telegraphDuration: 1.0, aggroRange: 500, attackRange: 150, attackCooldown: 3, originX: bossPos.x, originY: bossPos.y, patrolTimer: 0, isDead: false });

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
      if (canvas && gameState === GameState.DUNGEON) {
          const mask = maskCanvasRef.current;
          if (mask) {
              // Delegated Rendering
              renderGame({
                  canvas,
                  maskCanvas: mask,
                  world: worldRef.current,
                  activeBoss: boss || null,
                  time
              });
          }
      }
      animationFrameId = requestAnimationFrame(render);
    };
    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, dungeonTimer]);

  console.log(process.env)
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

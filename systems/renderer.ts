
import { GameWorld, Enemy, TileType, WeaponType, Rarity } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, OUT_OF_COMBAT_DELAY } from '../constants';
import { calculateVisibility } from './visibility';

interface RenderProps {
    canvas: HTMLCanvasElement;
    maskCanvas: HTMLCanvasElement;
    world: GameWorld;
    activeBoss: Enemy | null;
    time: number;
}

export const renderGame = ({ canvas, maskCanvas, world, activeBoss, time }: RenderProps) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const player = world.player;
    
    // Clear Screen
    ctx.fillStyle = '#000000'; 
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.save(); 
    ctx.translate(CANVAS_WIDTH / 2 - world.camera.x, CANVAS_HEIGHT / 2 - world.camera.y);

    // --- DRAW MAP ---
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

    // --- DRAW ORBS ---
    world.xpOrbs.forEach(orb => { 
        ctx.save(); 
        ctx.translate(orb.x, orb.y); 
        ctx.shadowColor = orb.color; 
        ctx.shadowBlur = 15; 
        ctx.fillStyle = orb.color; 
        ctx.beginPath(); 
        ctx.arc(0, 0, orb.radius, 0, Math.PI * 2); 
        ctx.fill(); 
        ctx.restore(); 
    });

    // --- DRAW ITEMS ---
    world.items.forEach(item => {
            ctx.save(); 
            ctx.translate(item.x, item.y); 
            ctx.shadowColor = item.color; 
            ctx.shadowBlur = 10; 
            ctx.fillStyle = item.color;
            ctx.beginPath(); 
            ctx.moveTo(0, -8); 
            ctx.lineTo(6, 0); 
            ctx.lineTo(0, 8); 
            ctx.lineTo(-6, 0); 
            ctx.fill(); 
            ctx.restore();
            
            const d = Math.hypot(item.x - player.x, item.y - player.y);
            if (d < 100) { 
                ctx.save(); 
                ctx.font = 'bold 12px monospace'; 
                ctx.textAlign = 'center'; 
                ctx.fillStyle = item.color; 
                ctx.shadowColor = '#000'; 
                ctx.shadowBlur = 4; 
                ctx.lineWidth = 3; 
                ctx.strokeText(`${item.name}`, 0, -20); 
                ctx.fillText(`${item.name}`, 0, -20); 
                ctx.fillStyle = '#fff'; 
                ctx.font = '10px sans-serif'; 
                ctx.fillText(`[F]`, 0, -8); 
                ctx.restore(); 
            }
    });

    // --- DRAW ENEMIES ---
    world.enemies.forEach(e => {
        ctx.save(); 
        ctx.translate(e.x, e.y);
        
        // Telegraph
        if (e.state === 'PREPARING' && e.targetPos) { 
            ctx.save(); 
            ctx.translate(-e.x + e.targetPos.x, -e.y + e.targetPos.y); 
            const ratio = 1 - (e.telegraphTimer / e.telegraphDuration); 
            const radius = e.type === 'BOSS' ? 80 : 40; 
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; 
            ctx.beginPath(); 
            ctx.arc(0, 0, radius, 0, Math.PI*2); 
            ctx.fill(); 
            ctx.strokeStyle = '#ef4444'; 
            ctx.lineWidth = 2; 
            ctx.beginPath(); 
            ctx.arc(0, 0, radius * ratio, 0, Math.PI * 2); 
            ctx.stroke(); 
            ctx.restore(); 
        }
        
        // Body
        ctx.fillStyle = e.color; 
        if (e.state === 'ATTACKING') ctx.fillStyle = '#fff';
        ctx.beginPath(); 
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2); 
        ctx.fill();
        
        // HP Bar
        const hpPct = e.hp / e.maxHp; 
        ctx.fillStyle = '#000'; 
        ctx.fillRect(-15, -e.radius - 10, 30, 4); 
        ctx.fillStyle = '#ef4444'; 
        ctx.fillRect(-15, -e.radius - 10, 30 * hpPct, 4);
        
        if (e.type === 'BOSS') { 
            ctx.strokeStyle = '#ef4444'; 
            ctx.lineWidth = 2; 
            ctx.beginPath(); 
            ctx.arc(0, 0, e.radius + 5, 0, Math.PI * 2); 
            ctx.stroke(); 
        }
        ctx.restore();
    });

    // --- DRAW PLAYER ---
    ctx.save(); 
    ctx.translate(player.x, player.y);
    const timeSinceCombat = time - player.lastCombatTime;
    const isSprinting = timeSinceCombat > OUT_OF_COMBAT_DELAY && !player.isDodging && !player.isAttacking;
    
    if (isSprinting) { 
        ctx.fillStyle = '#60a5fa'; 
        ctx.textAlign = 'center'; 
        ctx.font = 'bold 20px monospace'; 
        ctx.fillText('>>', 0, -player.radius - 15); 
    }
    
    ctx.rotate(player.facingAngle);
    ctx.fillStyle = player.isDodging ? '#93c5fd' : '#3b82f6'; 
    ctx.beginPath(); 
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2); 
    ctx.fill();
    
    // Direction Indicator
    ctx.fillStyle = '#fff'; 
    ctx.beginPath(); 
    ctx.moveTo(player.radius, 0); 
    ctx.lineTo(player.radius - 5, -5); 
    ctx.lineTo(player.radius - 5, 5); 
    ctx.fill();
    
    // Weapon
    if (player.equipment.MAIN_HAND) { 
        ctx.strokeStyle = '#cbd5e1'; 
        ctx.lineWidth = 3; 
        ctx.beginPath(); 
        ctx.moveTo(10, 5); 
        ctx.lineTo(25, 5); 
        ctx.stroke(); 
    }
    ctx.restore();

    // Attack Visuals
    if (player.attackVisualTimer > 0 && player.equipment.MAIN_HAND?.type === WeaponType.SWORD) { 
        const angle = Math.PI / 3; 
        const alpha = Math.max(0, player.attackVisualTimer / 0.3); 
        ctx.save(); 
        ctx.translate(player.x, player.y); 
        ctx.rotate(player.facingAngle); 
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`; 
        ctx.beginPath(); 
        ctx.moveTo(0, 0); 
        ctx.arc(0, 0, player.equipment.MAIN_HAND.baseRange, -angle/2, angle/2); 
        ctx.lineTo(0,0); 
        ctx.fill(); 
        ctx.restore(); 
    }

    // --- DRAW PARTICLES & PROJECTILES & TEXT ---
    world.projectiles.forEach(p => { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill(); });
    world.particles.forEach(p => { 
        ctx.save(); 
        ctx.globalAlpha = p.life / p.maxLife; 
        ctx.fillStyle = p.color; 
        ctx.beginPath(); 
        if (p.size > 10) { 
            ctx.arc(p.x, p.y, p.size * (1 - p.life/p.maxLife), 0, Math.PI * 2); 
            ctx.strokeStyle = p.color; 
            ctx.lineWidth = 2; 
            ctx.stroke(); 
        } else { 
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); 
            ctx.fill(); 
        } 
        ctx.restore(); 
    });
    
    world.texts.forEach(t => { 
        ctx.fillStyle = t.color; 
        ctx.font = 'bold 16px sans-serif'; 
        ctx.textAlign = 'center'; 
        ctx.lineWidth = 3; 
        ctx.strokeStyle = '#000'; 
        ctx.strokeText(t.text, t.x, t.y); 
        ctx.fillText(t.text, t.x, t.y); 
    });

    ctx.restore();

    // --- LIGHTING / FOG OF WAR (MASKING) ---
    const maskCtx = maskCanvas.getContext('2d');
    if (maskCtx) {
        maskCtx.globalCompositeOperation = 'source-over'; 
        maskCtx.fillStyle = 'rgba(0, 0, 0, 0.94)'; 
        maskCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); 
        maskCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        maskCtx.globalCompositeOperation = 'destination-out';
        
        const drawPlayerLight = () => {
            const radius = 350; 
            const poly = calculateVisibility(player, radius, world.tiles);
            if (poly.length > 0) { 
                maskCtx.save(); 
                maskCtx.beginPath(); 
                const startX = poly[0].x - world.camera.x + CANVAS_WIDTH/2; 
                const startY = poly[0].y - world.camera.y + CANVAS_HEIGHT/2; 
                maskCtx.moveTo(startX, startY); 
                for (let i = 1; i < poly.length; i++) { 
                    const px = poly[i].x - world.camera.x + CANVAS_WIDTH/2; 
                    const py = poly[i].y - world.camera.y + CANVAS_HEIGHT/2; 
                    maskCtx.lineTo(px, py); 
                } 
                maskCtx.closePath(); 
                maskCtx.clip(); 
                const screenX = player.x - world.camera.x + CANVAS_WIDTH/2; 
                const screenY = player.y - world.camera.y + CANVAS_HEIGHT/2; 
                const grad = maskCtx.createRadialGradient(screenX, screenY, radius * 0.2, screenX, screenY, radius); 
                grad.addColorStop(0, `rgba(0,0,0,1)`); 
                grad.addColorStop(1, 'rgba(0,0,0,0)'); 
                maskCtx.fillStyle = grad; 
                maskCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); 
                maskCtx.restore(); 
            }
        };

        const drawSimpleLight = (worldX: number, worldY: number, radius: number, intensity: number) => { 
            const screenX = worldX - world.camera.x + CANVAS_WIDTH/2; 
            const screenY = worldY - world.camera.y + CANVAS_HEIGHT/2; 
            if (screenX < -radius || screenX > CANVAS_WIDTH + radius || screenY < -radius || screenY > CANVAS_HEIGHT + radius) return; 
            const grad = maskCtx.createRadialGradient(screenX, screenY, radius * 0.2, screenX, screenY, radius); 
            grad.addColorStop(0, `rgba(0,0,0,${intensity})`); 
            grad.addColorStop(1, 'rgba(0,0,0,0)'); 
            maskCtx.fillStyle = grad; 
            maskCtx.beginPath(); 
            maskCtx.arc(screenX, screenY, radius, 0, Math.PI*2); 
            maskCtx.fill(); 
        };

        drawPlayerLight();
        world.projectiles.forEach(p => { if (p.owner === 'PLAYER') drawSimpleLight(p.x, p.y, 100, 0.8); });
        if (activeBoss) { drawSimpleLight(activeBoss.x, activeBoss.y, 250, 0.6); }
        world.items.forEach(item => { 
            const radius = item.rarity === Rarity.LEGENDARY ? 100 : item.rarity === Rarity.EPIC ? 80 : 50; 
            const intensity = item.rarity === Rarity.LEGENDARY ? 0.7 : 0.4; 
            drawSimpleLight(item.x, item.y, radius, intensity); 
        });
        world.xpOrbs.forEach(orb => { drawSimpleLight(orb.x, orb.y, 40, 0.4); });
        
        // Apply Mask
        ctx.save(); 
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.globalCompositeOperation = 'source-over'; 
        ctx.drawImage(maskCanvas, 0, 0); 
        ctx.restore();
    }
}

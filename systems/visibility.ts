
import { TileType } from '../types';
import { DUNGEON_WIDTH, DUNGEON_HEIGHT, TILE_SIZE } from '../constants';

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

export const calculateVisibility = (origin: Point, radius: number, tiles: TileType[][]) => {
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

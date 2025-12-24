
import { PortalMission, TileType } from '../types';
import { DUNGEON_WIDTH, DUNGEON_HEIGHT, TILE_SIZE } from '../constants';

export const generateMissions = (playerLevel: number): PortalMission[] => {
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

export const generateDungeonMap = () => {
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

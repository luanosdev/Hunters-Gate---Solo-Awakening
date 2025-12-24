
import { PortalMission, TileType, DungeonTheme } from '../types';
import { TILE_SIZE, RANK_META } from '../constants';

export const generateMissions = (playerLevel: number): PortalMission[] => {
  const missions: PortalMission[] = [];
  const ranks = ['E', 'D', 'C', 'B', 'A', 'S'];
  const themes: DungeonTheme[] = ['CAVE', 'DESERT', 'FOREST'];
  const baseDifficulty = Math.ceil(playerLevel / 5);

  for (let i = 0; i < 3; i++) {
    const rankIndex = Math.min(5, Math.max(0, Math.floor((playerLevel - 1) / 10) + Math.floor(Math.random() * 3) - 1));
    const rank = ranks[rankIndex];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    
    missions.push({
      id: Math.random().toString(),
      rank,
      theme,
      timeLeft: 300 + Math.random() * 300,
      difficulty: baseDifficulty + Math.floor(Math.random() * 2),
      description: `Clear the ${theme.charAt(0) + theme.slice(1).toLowerCase()} Gate`,
      enemyCount: 20 + Math.floor(Math.random() * 20),
      bossType: 'Boss'
    });
  }
  return missions;
};

export const generateDungeonMap = (theme: DungeonTheme, rank: string) => {
    // Rank determines size
    const rankMult = RANK_META[rank]?.sizeMult || 1.0;
    const width = Math.floor(70 * rankMult);
    const height = Math.floor(70 * rankMult);

    const tiles: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.WALL));
    const rooms: {x: number, y: number, w: number, h: number}[] = [];

    // Theme determines structure parameters
    let minRoom = 6;
    let maxRoom = 12;
    let maxRooms = Math.floor(15 * rankMult);
    
    if (theme === 'DESERT') {
        minRoom = 15;
        maxRoom = 30;
        maxRooms = Math.floor(6 * rankMult); // Few giant rooms
    } else if (theme === 'CAVE') {
        minRoom = 6;
        maxRoom = 12; // Standard
    } else if (theme === 'FOREST') {
        minRoom = 8;
        maxRoom = 18; // Varied
    }

    for (let i = 0; i < maxRooms; i++) {
        // Boss Room (Last room logic)
        const isBossRoom = i === maxRooms - 1;
        const roomW = isBossRoom ? 20 : Math.floor(Math.random() * (maxRoom - minRoom + 1)) + minRoom;
        const roomH = isBossRoom ? 20 : Math.floor(Math.random() * (maxRoom - minRoom + 1)) + minRoom;
        
        // Ensure bounds
        const x = Math.floor(Math.random() * (width - roomW - 2)) + 1;
        const y = Math.floor(Math.random() * (height - roomH - 2)) + 1;

        const newRoom = { x, y, w: roomW, h: roomH };
        
        let failed = false;
        // Collision check between rooms
        for (const other of rooms) {
            // Add padding
            if (x < other.x + other.w + 2 && x + roomW + 2 > other.x && y < other.y + other.h + 2 && y + roomH + 2 > other.y) {
                failed = true;
                break;
            }
        }

        if (!failed) {
            // Carve Room
            for (let ry = y; ry < y + roomH; ry++) {
                for (let rx = x; rx < x + roomW; rx++) {
                    tiles[ry][rx] = TileType.FLOOR;
                }
            }

            // Connect to previous room
            if (rooms.length > 0) {
                const prev = rooms[rooms.length - 1];
                const prevCX = Math.floor(prev.x + prev.w / 2);
                const prevCY = Math.floor(prev.y + prev.h / 2);
                const newCX = Math.floor(x + roomW / 2);
                const newCY = Math.floor(y + roomH / 2);

                // For Desert, make wide corridors
                const corridorWidth = theme === 'DESERT' ? 3 : 1;

                if (Math.random() > 0.5) {
                    const minX = Math.min(prevCX, newCX);
                    const maxX = Math.max(prevCX, newCX);
                    for (let cx = minX; cx <= maxX; cx++) {
                        for(let cw = 0; cw < corridorWidth; cw++) tiles[prevCY + cw][cx] = TileType.FLOOR;
                    }
                    
                    const minY = Math.min(prevCY, newCY);
                    const maxY = Math.max(prevCY, newCY);
                    for (let cy = minY; cy <= maxY; cy++) {
                         for(let cw = 0; cw < corridorWidth; cw++) tiles[cy][newCX + cw] = TileType.FLOOR;
                    }
                } else {
                    const minY = Math.min(prevCY, newCY);
                    const maxY = Math.max(prevCY, newCY);
                    for (let cy = minY; cy <= maxY; cy++) {
                        for(let cw = 0; cw < corridorWidth; cw++) tiles[cy][prevCX + cw] = TileType.FLOOR;
                    }

                    const minX = Math.min(prevCX, newCX);
                    const maxX = Math.max(prevCX, newCX);
                    for (let cx = minX; cx <= maxX; cx++) {
                        for(let cw = 0; cw < corridorWidth; cw++) tiles[newCY + cw][cx] = TileType.FLOOR;
                    }
                }
            }
            rooms.push(newRoom);
        }
    }

    // Safety check if generation failed to make rooms
    if (rooms.length === 0) {
        // Fallback room
        const cx = Math.floor(width/2);
        const cy = Math.floor(height/2);
        for(let y=cy-5; y<cy+5; y++) for(let x=cx-5; x<cx+5; x++) tiles[y][x] = TileType.FLOOR;
        rooms.push({x: cx-5, y: cy-5, w: 10, h: 10});
    }

    const startRoom = rooms[0];
    const endRoom = rooms[rooms.length - 1];

    const startPos = { x: (startRoom.x + startRoom.w / 2) * TILE_SIZE, y: (startRoom.y + startRoom.h / 2) * TILE_SIZE };
    const bossPos = { x: (endRoom.x + endRoom.w / 2) * TILE_SIZE, y: (endRoom.y + endRoom.h / 2) * TILE_SIZE };
    
    // Explicitly define boss room for logic usage
    const bossRoom = endRoom;

    return { tiles, startPos, bossPos, rooms, bossRoom, width: width * TILE_SIZE, height: height * TILE_SIZE };
};

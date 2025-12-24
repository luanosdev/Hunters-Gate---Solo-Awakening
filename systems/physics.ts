
import { Entity, TileType } from '../types';

export const resolveWallCollision = (entity: Entity & { radius: number }, tiles: TileType[][], tileSize: number) => {
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

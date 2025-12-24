
export const distance = (a: { x: number, y: number }, b: { x: number, y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

export const checkCollision = (a: { x: number, y: number, radius: number }, b: { x: number, y: number, radius: number }) => {
  return distance(a, b) < (a.radius + b.radius);
};

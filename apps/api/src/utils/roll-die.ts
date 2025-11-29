export function rollDie(faces: number = 20): number {
  return Math.floor(Math.random() * faces) + 1;
}

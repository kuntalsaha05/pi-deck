import type { MazeCell } from "../types/solver-types";

/**
 * Recursive Backtracking (DFS) maze generator.
 * Kept in a separate file to avoid circular imports.
 */
export function generateMazeRecursiveBacktracking(
  rows: number,
  cols: number,
): MazeCell[][] {
  const grid: MazeCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      type: "wall" as const,
      weight: 1 as const,
      isWeighted: false,
    })),
  );

  function inBounds(r: number, c: number): boolean {
    return r >= 0 && r < rows && c >= 0 && c < cols;
  }

  function carve(r: number, c: number): void {
    grid[r][c].type = "path";

    const directions: [number, number][] = [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
    ].sort(() => Math.random() - 0.5) as [number, number][];

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc) && grid[nr][nc].type === "wall") {
        // Carve the wall between
        grid[r + dr / 2][c + dc / 2].type = "path";
        carve(nr, nc);
      }
    }
  }

  // Start carving from top-left cell (must be odd coordinates)
  carve(0, 0);

  // Set start and end
  grid[0][0].type = "start";
  grid[rows - 1][cols - 1].type = "end";

  return grid;
}

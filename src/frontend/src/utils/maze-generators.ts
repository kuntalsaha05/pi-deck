import type { MazeCell, MazeGenerationMethod } from "../types/solver-types";

export const GENERATION_LABELS: Record<MazeGenerationMethod, string> = {
  "recursive-backtracking": "Recursive Backtracking",
  prims: "Prim's Algorithm",
  "recursive-division": "Recursive Division",
};

function emptyGrid(rows: number, cols: number): MazeCell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      type: "path" as const,
      weight: 1 as const,
      isWeighted: false,
    })),
  );
}

function wallGrid(rows: number, cols: number): MazeCell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      type: "wall" as const,
      weight: 1 as const,
      isWeighted: false,
    })),
  );
}

function setStart(grid: MazeCell[][], rows: number, cols: number): void {
  grid[0][0].type = "start";
  grid[rows - 1][cols - 1].type = "end";
}

export function primsAlgorithm(rows: number, cols: number): MazeCell[][] {
  const grid = wallGrid(rows, cols);

  function inBounds(r: number, c: number): boolean {
    return r >= 0 && c < cols && c >= 0 && r < rows;
  }

  function neighbors2(r: number, c: number): [number, number][] {
    return (
      [
        [r - 2, c],
        [r + 2, c],
        [r, c - 2],
        [r, c + 2],
      ] as [number, number][]
    ).filter(([nr, nc]) => inBounds(nr, nc));
  }

  // Start from (0,0)
  grid[0][0].type = "path";
  const frontier: [number, number][] = neighbors2(0, 0);
  const inMaze = new Set<string>(["0,0"]);
  const frontierSet = new Set<string>(frontier.map(([r, c]) => `${r},${c}`));

  while (frontier.length > 0) {
    const idx = Math.floor(Math.random() * frontier.length);
    const [r, c] = frontier.splice(idx, 1)[0];
    frontierSet.delete(`${r},${c}`);

    // Find neighbors that are in maze
    const mazeNeighbors = neighbors2(r, c).filter(([nr, nc]) =>
      inMaze.has(`${nr},${nc}`),
    );

    if (mazeNeighbors.length === 0) continue;

    const [nr, nc] =
      mazeNeighbors[Math.floor(Math.random() * mazeNeighbors.length)];

    // Carve passage between (r,c) and (nr,nc)
    const midR = (r + nr) / 2;
    const midC = (c + nc) / 2;
    grid[r][c].type = "path";
    grid[midR][midC].type = "path";
    inMaze.add(`${r},${c}`);

    // Add new frontier cells
    for (const [fr, fc] of neighbors2(r, c)) {
      const fk = `${fr},${fc}`;
      if (!inMaze.has(fk) && !frontierSet.has(fk)) {
        frontierSet.add(fk);
        frontier.push([fr, fc]);
      }
    }
  }

  setStart(grid, rows, cols);
  return grid;
}

export function recursiveDivision(rows: number, cols: number): MazeCell[][] {
  const grid = emptyGrid(rows, cols);

  // Outer walls
  for (let c = 0; c < cols; c++) {
    grid[0][c].type = "wall";
    grid[rows - 1][c].type = "wall";
  }
  for (let r = 0; r < rows; r++) {
    grid[r][0].type = "wall";
    grid[r][cols - 1].type = "wall";
  }

  function divide(
    rStart: number,
    rEnd: number,
    cStart: number,
    cEnd: number,
  ): void {
    const width = cEnd - cStart;
    const height = rEnd - rStart;

    if (width < 2 || height < 2) return;

    // Choose orientation: prefer splitting the longer dimension
    const horizontal =
      height > width ? true : width > height ? false : Math.random() < 0.5;

    if (horizontal) {
      // Draw horizontal wall
      const wallR = rStart + 1 + Math.floor(Math.random() * (height - 1));
      // Leave a passage
      const passC = cStart + Math.floor(Math.random() * width);

      for (let c = cStart; c <= cEnd; c++) {
        if (c !== passC) {
          grid[wallR][c].type = "wall";
        }
      }

      divide(rStart, wallR - 1, cStart, cEnd);
      divide(wallR + 1, rEnd, cStart, cEnd);
    } else {
      // Draw vertical wall
      const wallC = cStart + 1 + Math.floor(Math.random() * (width - 1));
      const passR = rStart + Math.floor(Math.random() * height);

      for (let r = rStart; r <= rEnd; r++) {
        if (r !== passR) {
          grid[r][wallC].type = "wall";
        }
      }

      divide(rStart, rEnd, cStart, wallC - 1);
      divide(rStart, rEnd, wallC + 1, cEnd);
    }
  }

  divide(1, rows - 2, 1, cols - 2);
  setStart(grid, rows, cols);
  return grid;
}

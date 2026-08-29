import type { MazeAlgorithm, MazeCell } from "../types/solver-types";

export const ALGORITHM_LABELS: Record<MazeAlgorithm, string> = {
  bfs: "Breadth-First Search",
  astar: "A* Search",
  dijkstra: "Dijkstra's Algorithm",
  dfs: "Depth-First Search",
  greedy: "Greedy Best-First",
};

type Coord = [number, number];
type AlgoResult = { visited: Coord[]; path: Coord[] };

function isWalkable(grid: MazeCell[][], r: number, c: number): boolean {
  return (
    r >= 0 &&
    c >= 0 &&
    r < grid.length &&
    c < grid[0].length &&
    grid[r][c].type !== "wall"
  );
}

function getNeighbors(grid: MazeCell[][], r: number, c: number): Coord[] {
  return (
    [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ] as Coord[]
  ).filter(([nr, nc]) => isWalkable(grid, nr, nc));
}

function reconstructPath(
  cameFrom: Map<string, Coord | null>,
  start: Coord,
  end: Coord,
): Coord[] {
  const path: Coord[] = [];
  let current: Coord | null = end;
  const startKey = `${start[0]},${start[1]}`;

  while (current) {
    path.unshift(current);
    const k = `${current[0]},${current[1]}`;
    if (k === startKey) break;
    current = cameFrom.get(k) ?? null;
  }

  return path;
}

function heuristic(a: Coord, b: Coord): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

export function dijkstra(
  grid: MazeCell[][],
  start: Coord,
  end: Coord,
): AlgoResult {
  const visited: Coord[] = [];
  const dist = new Map<string, number>();
  const cameFrom = new Map<string, Coord | null>();

  // Min-heap via simple sorted array (acceptable for grid sizes used)
  type Node = { coord: Coord; cost: number };
  const queue: Node[] = [{ coord: start, cost: 0 }];

  const startKey = `${start[0]},${start[1]}`;
  dist.set(startKey, 0);
  cameFrom.set(startKey, null);

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const { coord, cost } = queue.shift()!;
    const [r, c] = coord;
    const k = `${r},${c}`;

    if ((dist.get(k) ?? Number.POSITIVE_INFINITY) < cost) continue;
    visited.push(coord);

    if (r === end[0] && c === end[1]) {
      return { visited, path: reconstructPath(cameFrom, start, end) };
    }

    for (const [nr, nc] of getNeighbors(grid, r, c)) {
      const nk = `${nr},${nc}`;
      const cellWeight = grid[nr][nc].weight;
      const newCost = cost + cellWeight;

      if (newCost < (dist.get(nk) ?? Number.POSITIVE_INFINITY)) {
        dist.set(nk, newCost);
        cameFrom.set(nk, coord);
        queue.push({ coord: [nr, nc], cost: newCost });
      }
    }
  }

  return { visited, path: [] };
}

export function dfs(grid: MazeCell[][], start: Coord, end: Coord): AlgoResult {
  const visited: Coord[] = [];
  const cameFrom = new Map<string, Coord | null>();
  const visitedSet = new Set<string>();
  const stack: Coord[] = [start];

  const startKey = `${start[0]},${start[1]}`;
  cameFrom.set(startKey, null);
  visitedSet.add(startKey);

  while (stack.length > 0) {
    const coord = stack.pop()!;
    const [r, c] = coord;
    visited.push(coord);

    if (r === end[0] && c === end[1]) {
      return { visited, path: reconstructPath(cameFrom, start, end) };
    }

    for (const [nr, nc] of getNeighbors(grid, r, c)) {
      const nk = `${nr},${nc}`;
      if (!visitedSet.has(nk)) {
        visitedSet.add(nk);
        cameFrom.set(nk, coord);
        stack.push([nr, nc]);
      }
    }
  }

  return { visited, path: [] };
}

export function greedyBestFirst(
  grid: MazeCell[][],
  start: Coord,
  end: Coord,
): AlgoResult {
  const visited: Coord[] = [];
  const cameFrom = new Map<string, Coord | null>();
  const visitedSet = new Set<string>();

  type Node = { coord: Coord; h: number };
  const queue: Node[] = [{ coord: start, h: heuristic(start, end) }];

  const startKey = `${start[0]},${start[1]}`;
  cameFrom.set(startKey, null);
  visitedSet.add(startKey);

  while (queue.length > 0) {
    queue.sort((a, b) => a.h - b.h);
    const { coord } = queue.shift()!;
    const [r, c] = coord;
    visited.push(coord);

    if (r === end[0] && c === end[1]) {
      return { visited, path: reconstructPath(cameFrom, start, end) };
    }

    for (const [nr, nc] of getNeighbors(grid, r, c)) {
      const nk = `${nr},${nc}`;
      if (!visitedSet.has(nk)) {
        visitedSet.add(nk);
        cameFrom.set(nk, coord);
        queue.push({ coord: [nr, nc], h: heuristic([nr, nc], end) });
      }
    }
  }

  return { visited, path: [] };
}

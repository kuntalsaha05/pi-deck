import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  GitCompare,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CellWeight = 1 | 2 | 3;

type MazeCell = {
  walls: { N: boolean; S: boolean; E: boolean; W: boolean };
  visited: boolean;
  weight: CellWeight;
};

type MazeGrid = MazeCell[][];

type AlgorithmKey = "bfs" | "astar" | "dijkstra" | "dfs" | "greedy";
type GenerationKey = "backtracking" | "prims" | "division";
type SizeKey = "small" | "medium" | "large";
type SpeedKey = "slow" | "medium" | "fast";
type AnimPhase = "idle" | "playing" | "paused" | "complete";

interface SearchResult {
  order: [number, number][];
  path: [number, number][];
}

interface MazeSolverProps {
  isDark: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZES: Record<SizeKey, { rows: number; cols: number }> = {
  small: { rows: 10, cols: 10 },
  medium: { rows: 15, cols: 15 },
  large: { rows: 20, cols: 20 },
};

const SPEED_DELAYS: Record<SpeedKey, number> = {
  slow: 200,
  medium: 50,
  fast: 10,
};

const ALGO_LABELS: Record<AlgorithmKey, string> = {
  bfs: "BFS",
  astar: "A*",
  dijkstra: "Dijkstra",
  dfs: "DFS",
  greedy: "Greedy",
};

const GEN_LABELS: Record<GenerationKey, string> = {
  backtracking: "Recursive Backtracking",
  prims: "Prim's Algorithm",
  division: "Recursive Division",
};

const LS_KEY = "maze-state";

const DIRS: ["N" | "S" | "E" | "W", number, number][] = [
  ["N", -1, 0],
  ["S", 1, 0],
  ["E", 0, 1],
  ["W", 0, -1],
];
const OPP: Record<string, "N" | "S" | "E" | "W"> = {
  N: "S",
  S: "N",
  E: "W",
  W: "E",
};

// ─── Grid Helpers ─────────────────────────────────────────────────────────────

function initGrid(rows: number, cols: number): MazeGrid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      visited: false,
      walls: { N: true, S: true, E: true, W: true },
      weight: 1 as CellWeight,
    })),
  );
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Maze Generation ──────────────────────────────────────────────────────────

function genBacktracking(rows: number, cols: number): MazeGrid {
  const grid = initGrid(rows, cols);
  const stack: [number, number][] = [[0, 0]];
  grid[0][0].visited = true;
  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const neighbors = shuffle(
      DIRS.map(([dir, dr, dc]) => ({ dir, nr: r + dr, nc: c + dc })).filter(
        ({ nr, nc }) =>
          nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].visited,
      ),
    );
    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const { dir, nr, nc } = neighbors[0];
      grid[r][c].walls[dir] = false;
      grid[nr][nc].walls[OPP[dir]] = false;
      grid[nr][nc].visited = true;
      stack.push([nr, nc]);
    }
  }
  return grid;
}

function genPrims(rows: number, cols: number): MazeGrid {
  const grid = initGrid(rows, cols);
  grid[0][0].visited = true;
  const frontier: {
    r: number;
    c: number;
    pr: number;
    pc: number;
    dir: "N" | "S" | "E" | "W";
  }[] = [];

  const addFrontier = (r: number, c: number) => {
    for (const [dir, dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        !grid[nr][nc].visited
      ) {
        frontier.push({ r: nr, c: nc, pr: r, pc: c, dir });
      }
    }
  };

  addFrontier(0, 0);

  while (frontier.length > 0) {
    const idx = Math.floor(Math.random() * frontier.length);
    const { r, c, pr, pc, dir } = frontier[idx];
    frontier.splice(idx, 1);
    if (grid[r][c].visited) continue;
    grid[r][c].visited = true;
    grid[pr][pc].walls[dir] = false;
    grid[r][c].walls[OPP[dir]] = false;
    addFrontier(r, c);
  }
  return grid;
}

function genDivision(rows: number, cols: number): MazeGrid {
  const grid = initGrid(rows, cols);
  // Start: open all interior walls (fully connected), then add dividing walls
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c].walls = {
        N: r === 0,
        S: r === rows - 1,
        E: c === cols - 1,
        W: c === 0,
      };
    }
  }

  function divide(
    rStart: number,
    cStart: number,
    height: number,
    width: number,
    horizontal: boolean,
  ) {
    if (height < 2 || width < 2) return;
    if (horizontal) {
      // Pick a row to draw wall on
      const wallRow = rStart + Math.floor(Math.random() * (height - 1));
      const passageCol = cStart + Math.floor(Math.random() * width);
      for (let c = cStart; c < cStart + width; c++) {
        if (c !== passageCol) {
          grid[wallRow][c].walls.S = true;
          if (wallRow + 1 < rows) grid[wallRow + 1][c].walls.N = true;
        }
      }
      divide(rStart, cStart, wallRow - rStart + 1, width, width < height / 2);
      divide(
        wallRow + 1,
        cStart,
        height - (wallRow - rStart + 1),
        width,
        width < (height - (wallRow - rStart + 1)) / 2,
      );
    } else {
      const wallCol = cStart + Math.floor(Math.random() * (width - 1));
      const passageRow = rStart + Math.floor(Math.random() * height);
      for (let r = rStart; r < rStart + height; r++) {
        if (r !== passageRow) {
          grid[r][wallCol].walls.E = true;
          if (wallCol + 1 < cols) grid[r][wallCol + 1].walls.W = true;
        }
      }
      divide(rStart, cStart, height, wallCol - cStart + 1, height < width / 2);
      divide(
        rStart,
        wallCol + 1,
        height,
        width - (wallCol - cStart + 1),
        height < (width - (wallCol - cStart + 1)) / 2,
      );
    }
  }

  divide(0, 0, rows, cols, cols > rows);
  return grid;
}

function generateMaze(
  method: GenerationKey,
  rows: number,
  cols: number,
): MazeGrid {
  switch (method) {
    case "prims":
      return genPrims(rows, cols);
    case "division":
      return genDivision(rows, cols);
    default:
      return genBacktracking(rows, cols);
  }
}

// ─── Search Algorithms ────────────────────────────────────────────────────────

function getNeighbors(
  maze: MazeGrid,
  r: number,
  c: number,
  rows: number,
  cols: number,
): { nr: number; nc: number; weight: number }[] {
  const result: { nr: number; nc: number; weight: number }[] = [];
  for (const [dir, dr, dc] of DIRS) {
    const nr = r + dr;
    const nc = c + dc;
    if (
      nr >= 0 &&
      nr < rows &&
      nc >= 0 &&
      nc < cols &&
      !maze[r][c].walls[dir]
    ) {
      result.push({ nr, nc, weight: maze[nr][nc].weight });
    }
  }
  return result;
}

function bfsSearch(maze: MazeGrid, rows: number, cols: number): SearchResult {
  const goal: [number, number] = [rows - 1, cols - 1];
  const queue: [number, number][] = [[0, 0]];
  const visited = new Set<string>(["0,0"]);
  const parent = new Map<string, [number, number] | null>([["0,0", null]]);
  const order: [number, number][] = [];
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    order.push([r, c]);
    if (r === goal[0] && c === goal[1]) break;
    for (const { nr, nc } of getNeighbors(maze, r, c, rows, cols)) {
      const key = `${nr},${nc}`;
      if (!visited.has(key)) {
        visited.add(key);
        parent.set(key, [r, c]);
        queue.push([nr, nc]);
      }
    }
  }
  return { order, path: backtrack(parent, goal) };
}

function astarSearch(
  maze: MazeGrid,
  rows: number,
  cols: number,
  useWeights = true,
): SearchResult {
  const goal: [number, number] = [rows - 1, cols - 1];
  const h = (r: number, c: number) =>
    Math.abs(r - goal[0]) + Math.abs(c - goal[1]);
  type PQ = { f: number; g: number; r: number; c: number };
  const open: PQ[] = [{ f: h(0, 0), g: 0, r: 0, c: 0 }];
  const gScore = new Map<string, number>([["0,0", 0]]);
  const parent = new Map<string, [number, number] | null>([["0,0", null]]);
  const closed = new Set<string>();
  const order: [number, number][] = [];
  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const { r, c } = open.shift()!;
    const key = `${r},${c}`;
    if (closed.has(key)) continue;
    closed.add(key);
    order.push([r, c]);
    if (r === goal[0] && c === goal[1]) break;
    for (const { nr, nc, weight } of getNeighbors(maze, r, c, rows, cols)) {
      const nkey = `${nr},${nc}`;
      if (closed.has(nkey)) continue;
      const cost = useWeights ? weight : 1;
      const g = (gScore.get(key) ?? Number.POSITIVE_INFINITY) + cost;
      if (g < (gScore.get(nkey) ?? Number.POSITIVE_INFINITY)) {
        gScore.set(nkey, g);
        parent.set(nkey, [r, c]);
        open.push({ f: g + h(nr, nc), r: nr, c: nc, g });
      }
    }
  }
  return { order, path: backtrack(parent, goal) };
}

function dijkstraSearch(
  maze: MazeGrid,
  rows: number,
  cols: number,
): SearchResult {
  const goal: [number, number] = [rows - 1, cols - 1];
  type PQ = { dist: number; r: number; c: number };
  const open: PQ[] = [{ dist: 0, r: 0, c: 0 }];
  const dist = new Map<string, number>([["0,0", 0]]);
  const parent = new Map<string, [number, number] | null>([["0,0", null]]);
  const visited = new Set<string>();
  const order: [number, number][] = [];
  while (open.length > 0) {
    open.sort((a, b) => a.dist - b.dist);
    const { r, c } = open.shift()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);
    order.push([r, c]);
    if (r === goal[0] && c === goal[1]) break;
    for (const { nr, nc, weight } of getNeighbors(maze, r, c, rows, cols)) {
      const nkey = `${nr},${nc}`;
      if (visited.has(nkey)) continue;
      const d = (dist.get(key) ?? Number.POSITIVE_INFINITY) + weight;
      if (d < (dist.get(nkey) ?? Number.POSITIVE_INFINITY)) {
        dist.set(nkey, d);
        parent.set(nkey, [r, c]);
        open.push({ dist: d, r: nr, c: nc });
      }
    }
  }
  return { order, path: backtrack(parent, goal) };
}

function dfsSearch(maze: MazeGrid, rows: number, cols: number): SearchResult {
  const goal: [number, number] = [rows - 1, cols - 1];
  const stack: [number, number][] = [[0, 0]];
  const visited = new Set<string>(["0,0"]);
  const parent = new Map<string, [number, number] | null>([["0,0", null]]);
  const order: [number, number][] = [];
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    order.push([r, c]);
    if (r === goal[0] && c === goal[1]) break;
    for (const { nr, nc } of getNeighbors(maze, r, c, rows, cols)) {
      const key = `${nr},${nc}`;
      if (!visited.has(key)) {
        visited.add(key);
        parent.set(key, [r, c]);
        stack.push([nr, nc]);
      }
    }
  }
  return { order, path: backtrack(parent, goal) };
}

function greedySearch(
  maze: MazeGrid,
  rows: number,
  cols: number,
): SearchResult {
  const goal: [number, number] = [rows - 1, cols - 1];
  const h = (r: number, c: number) =>
    Math.abs(r - goal[0]) + Math.abs(c - goal[1]);
  type PQ = { h: number; r: number; c: number };
  const open: PQ[] = [{ h: h(0, 0), r: 0, c: 0 }];
  const visited = new Set<string>(["0,0"]);
  const parent = new Map<string, [number, number] | null>([["0,0", null]]);
  const order: [number, number][] = [];
  while (open.length > 0) {
    open.sort((a, b) => a.h - b.h);
    const { r, c } = open.shift()!;
    order.push([r, c]);
    if (r === goal[0] && c === goal[1]) break;
    for (const { nr, nc } of getNeighbors(maze, r, c, rows, cols)) {
      const key = `${nr},${nc}`;
      if (!visited.has(key)) {
        visited.add(key);
        parent.set(key, [r, c]);
        open.push({ h: h(nr, nc), r: nr, c: nc });
      }
    }
  }
  return { order, path: backtrack(parent, goal) };
}

function backtrack(
  parent: Map<string, [number, number] | null>,
  goal: [number, number],
): [number, number][] {
  const path: [number, number][] = [];
  let cur: [number, number] | null | undefined = goal;
  while (cur != null) {
    path.unshift(cur);
    cur = parent.get(`${cur[0]},${cur[1]}`);
  }
  return path.length > 1 ? path : [];
}

function runAlgorithm(
  algo: AlgorithmKey,
  maze: MazeGrid,
  rows: number,
  cols: number,
): SearchResult {
  switch (algo) {
    case "bfs":
      return bfsSearch(maze, rows, cols);
    case "astar":
      return astarSearch(maze, rows, cols, true);
    case "dijkstra":
      return dijkstraSearch(maze, rows, cols);
    case "dfs":
      return dfsSearch(maze, rows, cols);
    case "greedy":
      return greedySearch(maze, rows, cols);
  }
}

// ─── Animation Frame Builder ──────────────────────────────────────────────────

interface AnimFrame {
  explored: Set<string>;
  path: [number, number][];
}

function buildFrames(result: SearchResult): AnimFrame[] {
  const frames: AnimFrame[] = [];
  const explored = new Set<string>();
  for (const [r, c] of result.order) {
    explored.add(`${r},${c}`);
    frames.push({ explored: new Set(explored), path: [] });
  }
  // Final frame with path
  frames.push({ explored: new Set(explored), path: result.path });
  return frames;
}

// ─── Canvas Drawing ───────────────────────────────────────────────────────────

interface DrawOptions {
  maze: MazeGrid;
  frame: AnimFrame;
  rows: number;
  cols: number;
  isDark: boolean;
  showWeights: boolean;
  label?: string;
}

function drawMazeOnCanvas(canvas: HTMLCanvasElement, opts: DrawOptions) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { maze, frame, rows, cols, isDark, showWeights, label } = opts;
  const W = canvas.width;
  const H = canvas.height;
  const cellW = W / cols;
  const cellH = H / rows;

  const bg = isDark ? "#0B1525" : "#F0F4FF";
  const wallColor = isDark ? "#22304A" : "#8B9DB8";
  const exploredColor = isDark
    ? "rgba(124,58,237,0.25)"
    : "rgba(139,92,246,0.15)";
  const pathLineColor = isDark
    ? "rgba(34,211,238,0.5)"
    : "rgba(14,165,233,0.4)";

  // Weight colors (amber palette)
  const weightColors: Record<CellWeight, string> = {
    1: isDark ? "rgba(251,191,36,0.15)" : "rgba(245,158,11,0.1)",
    2: isDark ? "rgba(251,191,36,0.35)" : "rgba(245,158,11,0.25)",
    3: isDark ? "rgba(239,68,68,0.35)" : "rgba(220,38,38,0.2)",
  };

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Draw weight backgrounds first
  if (showWeights) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const w = maze[r][c].weight;
        if (w > 1) {
          ctx.fillStyle = weightColors[w];
          ctx.fillRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);
        }
      }
    }
  }

  // Explored cells
  for (const key of frame.explored) {
    const [cr, cc] = key.split(",").map(Number);
    ctx.fillStyle = exploredColor;
    ctx.fillRect(cc * cellW + 1, cr * cellH + 1, cellW - 2, cellH - 2);
  }

  // Path cells
  const pathLen = frame.path.length;
  for (let i = 0; i < pathLen; i++) {
    const [pr, pc] = frame.path[i];
    const t = pathLen > 1 ? i / (pathLen - 1) : 0;
    const ri = Math.round(34 + t * (178 - 34));
    const gi = Math.round(211 + t * (107 - 211));
    const bi = Math.round(238 + t * (255 - 238));
    ctx.fillStyle = `rgba(${ri},${gi},${bi},0.85)`;
    ctx.fillRect(pc * cellW + 1, pr * cellH + 1, cellW - 2, cellH - 2);
  }

  // Walls
  ctx.strokeStyle = wallColor;
  ctx.lineWidth = 1.5;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = maze[r][c];
      const x = c * cellW;
      const y = r * cellH;
      ctx.beginPath();
      if (cell.walls.N) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + cellW, y);
      }
      if (cell.walls.S) {
        ctx.moveTo(x, y + cellH);
        ctx.lineTo(x + cellW, y + cellH);
      }
      if (cell.walls.W) {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + cellH);
      }
      if (cell.walls.E) {
        ctx.moveTo(x + cellW, y);
        ctx.lineTo(x + cellW, y + cellH);
      }
      ctx.stroke();
    }
  }

  // Start badge
  ctx.fillStyle = "#22C55E";
  ctx.beginPath();
  ctx.roundRect(2, 2, cellW - 4, cellH - 4, 3);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = `bold ${Math.min(cellW, cellH) * 0.45}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("S", cellW / 2, cellH / 2);

  // End badge
  const ex = (cols - 1) * cellW;
  const ey = (rows - 1) * cellH;
  ctx.fillStyle = "#EF4444";
  ctx.beginPath();
  ctx.roundRect(ex + 2, ey + 2, cellW - 4, cellH - 4, 3);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.fillText("E", ex + cellW / 2, ey + cellH / 2);

  // Path glow line
  if (frame.path.length > 1) {
    ctx.strokeStyle = pathLineColor;
    ctx.lineWidth = Math.max(2, cellW * 0.25);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    const [sr, sc] = frame.path[0];
    ctx.moveTo(sc * cellW + cellW / 2, sr * cellH + cellH / 2);
    for (let i = 1; i < pathLen; i++) {
      const [pr, pc] = frame.path[i];
      ctx.lineTo(pc * cellW + cellW / 2, pr * cellH + cellH / 2);
    }
    ctx.stroke();
  }

  // Weight digit labels (small grids only)
  if (showWeights && cellW > 16) {
    ctx.font = `bold ${Math.min(cellW, cellH) * 0.3}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const w = maze[r][c].weight;
        if (w > 1) {
          ctx.fillStyle = isDark
            ? "rgba(251,191,36,0.8)"
            : "rgba(180,100,0,0.7)";
          ctx.fillText(String(w), c * cellW + cellW / 2, r * cellH + cellH / 2);
        }
      }
    }
  }

  // Border
  ctx.strokeStyle = isDark ? "#334155" : "#CBD5E8";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, W, H);

  // Comparison label overlay
  if (label) {
    ctx.fillStyle = isDark ? "rgba(11,21,37,0.8)" : "rgba(240,244,255,0.85)";
    ctx.fillRect(4, 4, label.length * 8 + 12, 20);
    ctx.fillStyle = isDark ? "#22d3ee" : "#0ea5e9";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(label, 10, 7);
  }
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

interface SavedState {
  maze: MazeGrid;
  sizeKey: SizeKey;
  genMethod: GenerationKey;
}

function saveToLS(state: SavedState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {}
}

function loadFromLS(): SavedState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedState;
  } catch {
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const EMPTY_FRAME: AnimFrame = { explored: new Set(), path: [] };

export default function MazeSolver({ isDark }: MazeSolverProps) {
  // Settings
  const [sizeKey, setSizeKey] = useState<SizeKey>("medium");
  const [algo1, setAlgo1] = useState<AlgorithmKey>("astar");
  const [algo2, setAlgo2] = useState<AlgorithmKey>("bfs");
  const [speedKey, setSpeedKey] = useState<SpeedKey>("medium");
  const [genMethod, setGenMethod] = useState<GenerationKey>("backtracking");
  const [compareMode, setCompareMode] = useState(false);
  const [weightMode, setWeightMode] = useState(false);

  // Maze data
  const [maze, setMaze] = useState<MazeGrid>(() => {
    const saved = loadFromLS();
    if (saved?.sizeKey) {
      setSizeKey(saved.sizeKey);
      if (saved.genMethod) setGenMethod(saved.genMethod);
      return saved.maze;
    }
    return generateMaze("backtracking", SIZES.medium.rows, SIZES.medium.cols);
  });

  // Animation
  const [animPhase, setAnimPhase] = useState<AnimPhase>("idle");
  const [frameIdx, setFrameIdx] = useState(0);
  const [frames1, setFrames1] = useState<AnimFrame[]>([]);
  const [frames2, setFrames2] = useState<AnimFrame[]>([]);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [status, setStatus] = useState("Ready");

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const frameIdxRef = useRef(0);
  const animPhaseRef = useRef<AnimPhase>("idle");

  const canvasRef1 = useRef<HTMLCanvasElement>(null);
  const canvasRef2 = useRef<HTMLCanvasElement>(null);

  const { rows, cols } = SIZES[sizeKey];
  const totalFrames = frames1.length;

  // Sync refs
  useEffect(() => {
    frameIdxRef.current = frameIdx;
  }, [frameIdx]);
  useEffect(() => {
    animPhaseRef.current = animPhase;
  }, [animPhase]);

  const emptyFrame = EMPTY_FRAME;

  // ── Draw ──────────────────────────────────────────────────────────────────

  const redraw = useCallback(
    (idx: number, f1: AnimFrame[], f2: AnimFrame[]) => {
      if (canvasRef1.current) {
        drawMazeOnCanvas(canvasRef1.current, {
          maze,
          frame: f1[idx] ?? emptyFrame,
          rows,
          cols,
          isDark,
          showWeights: weightMode,
          label: compareMode ? ALGO_LABELS[algo1] : undefined,
        });
      }
      if (compareMode && canvasRef2.current) {
        drawMazeOnCanvas(canvasRef2.current, {
          maze,
          frame: f2[idx] ?? emptyFrame,
          rows,
          cols,
          isDark,
          showWeights: weightMode,
          label: ALGO_LABELS[algo2],
        });
      }
    },
    [
      maze,
      rows,
      cols,
      isDark,
      weightMode,
      compareMode,
      algo1,
      algo2,
      emptyFrame,
    ],
  );

  // Redraw on frame/frames change
  useEffect(() => {
    redraw(frameIdx, frames1, frames2);
  }, [frameIdx, frames1, frames2, redraw]);

  // Draw empty maze on mount/maze change
  useEffect(() => {
    if (frames1.length === 0) {
      redraw(0, [], []);
    }
  }, [redraw, frames1.length]);

  // ── Animation loop ────────────────────────────────────────────────────────

  const stopAnim = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const startLoop = useCallback(
    (f1: AnimFrame[], _f2: AnimFrame[], startIdx: number, delay: number) => {
      const loop = (now: number) => {
        if (animPhaseRef.current !== "playing") return;
        if (now - lastTickRef.current >= delay) {
          lastTickRef.current = now;
          const next = frameIdxRef.current + 1;
          const maxIdx = f1.length - 1;
          if (next >= maxIdx) {
            frameIdxRef.current = maxIdx;
            setFrameIdx(maxIdx);
            animPhaseRef.current = "complete";
            setAnimPhase("complete");
            setStatus(
              `Done! Path: ${f1[maxIdx]?.path?.length > 0 ? f1[maxIdx].path.length - 1 : 0} steps`,
            );
            return;
          }
          frameIdxRef.current = next;
          setFrameIdx(next);
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      frameIdxRef.current = startIdx;
      rafRef.current = requestAnimationFrame(loop);
    },
    [],
  );

  // ── Controls ──────────────────────────────────────────────────────────────

  const handleSolve = useCallback(() => {
    if (animPhase === "playing") return;

    stopAnim();
    const start = performance.now();
    const r1 = runAlgorithm(algo1, maze, rows, cols);
    const r2 = compareMode
      ? runAlgorithm(algo2, maze, rows, cols)
      : { order: [], path: [] };
    const elapsed = performance.now() - start;
    setElapsedMs(Math.round(elapsed));

    if (r1.order.length === 0) {
      setStatus("No path found");
      return;
    }

    const f1 = buildFrames(r1);
    const f2 = compareMode ? buildFrames(r2) : [];
    setFrames1(f1);
    setFrames2(f2);
    setFrameIdx(0);
    frameIdxRef.current = 0;
    animPhaseRef.current = "playing";
    setAnimPhase("playing");
    setStatus("Searching...");
    lastTickRef.current = 0;
    startLoop(f1, f2, 0, SPEED_DELAYS[speedKey]);
  }, [
    animPhase,
    stopAnim,
    algo1,
    algo2,
    maze,
    rows,
    cols,
    compareMode,
    speedKey,
    startLoop,
  ]);

  const handlePlayPause = useCallback(() => {
    if (animPhase === "playing") {
      stopAnim();
      animPhaseRef.current = "paused";
      setAnimPhase("paused");
      setStatus("Paused");
    } else if (animPhase === "paused") {
      animPhaseRef.current = "playing";
      setAnimPhase("playing");
      setStatus("Searching...");
      lastTickRef.current = 0;
      startLoop(frames1, frames2, frameIdxRef.current, SPEED_DELAYS[speedKey]);
    }
  }, [animPhase, stopAnim, startLoop, frames1, frames2, speedKey]);

  const handleRewind = useCallback(() => {
    stopAnim();
    animPhaseRef.current = "paused";
    setAnimPhase("paused");
    frameIdxRef.current = 0;
    setFrameIdx(0);
    setStatus("Paused");
  }, [stopAnim]);

  const handleFastForward = useCallback(() => {
    stopAnim();
    const last = frames1.length - 1;
    if (last < 0) return;
    frameIdxRef.current = last;
    setFrameIdx(last);
    animPhaseRef.current = "complete";
    setAnimPhase("complete");
    const finalPath = frames1[last]?.path ?? [];
    setStatus(
      `Done! Path: ${finalPath.length > 0 ? finalPath.length - 1 : 0} steps`,
    );
  }, [stopAnim, frames1]);

  const handleStepBack = useCallback(() => {
    if (animPhase === "playing") {
      stopAnim();
      animPhaseRef.current = "paused";
      setAnimPhase("paused");
    }
    const next = Math.max(0, frameIdxRef.current - 1);
    frameIdxRef.current = next;
    setFrameIdx(next);
    setStatus("Paused");
  }, [animPhase, stopAnim]);

  const handleStepForward = useCallback(() => {
    if (animPhase === "playing") {
      stopAnim();
      animPhaseRef.current = "paused";
      setAnimPhase("paused");
    }
    const next = Math.min(frames1.length - 1 || 0, frameIdxRef.current + 1);
    frameIdxRef.current = next;
    setFrameIdx(next);
    setStatus("Paused");
  }, [animPhase, stopAnim, frames1.length]);

  const handleReset = useCallback(() => {
    stopAnim();
    animPhaseRef.current = "idle";
    setAnimPhase("idle");
    setFrameIdx(0);
    setFrames1([]);
    setFrames2([]);
    setElapsedMs(null);
    setStatus("Ready");
  }, [stopAnim]);

  const handleNewMaze = useCallback(() => {
    stopAnim();
    animPhaseRef.current = "idle";
    setAnimPhase("idle");
    setFrameIdx(0);
    setFrames1([]);
    setFrames2([]);
    setElapsedMs(null);
    const newM = generateMaze(genMethod, rows, cols);
    setMaze(newM);
    setStatus("Ready");
    saveToLS({ maze: newM, sizeKey, genMethod });
  }, [stopAnim, genMethod, rows, cols, sizeKey]);

  const handleSizeChange = useCallback(
    (key: SizeKey) => {
      stopAnim();
      animPhaseRef.current = "idle";
      setAnimPhase("idle");
      setFrameIdx(0);
      setFrames1([]);
      setFrames2([]);
      setElapsedMs(null);
      setSizeKey(key);
      const { rows: nr, cols: nc } = SIZES[key];
      const newM = generateMaze(genMethod, nr, nc);
      setMaze(newM);
      setStatus("Ready");
      saveToLS({ maze: newM, sizeKey: key, genMethod });
    },
    [stopAnim, genMethod],
  );

  // ── Weight cell click ──────────────────────────────────────────────────────

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!weightMode) return;
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const c = Math.floor((x / canvas.clientWidth) * cols);
      const r = Math.floor((y / canvas.clientHeight) * rows);
      if (r < 0 || r >= rows || c < 0 || c >= cols) return;
      // Skip start/end
      if ((r === 0 && c === 0) || (r === rows - 1 && c === cols - 1)) return;
      setMaze((prev) => {
        const next = prev.map((row) => row.map((cell) => ({ ...cell })));
        const cur = next[r][c].weight;
        next[r][c].weight = ((cur % 3) + 1) as CellWeight;
        return next;
      });
    },
    [weightMode, rows, cols],
  );

  // ── Keyboard shortcut ──────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        if (
          animPhaseRef.current === "idle" ||
          animPhaseRef.current === "complete"
        ) {
          handleSolve();
        } else {
          handlePlayPause();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSolve, handlePlayPause]);

  // Cleanup on unmount
  useEffect(() => () => stopAnim(), [stopAnim]);

  // ── Derived display values ─────────────────────────────────────────────────

  const currentPath = frames1[frameIdx]?.path ?? [];
  const exploredCount = frames1[frameIdx]?.explored?.size ?? 0;
  const progress = totalFrames > 1 ? frameIdx / (totalFrames - 1) : 0;

  const statusColor =
    animPhase === "complete"
      ? "text-emerald-400"
      : animPhase === "playing"
        ? "text-cyan-400 animate-pulse"
        : animPhase === "paused"
          ? "text-amber-400"
          : "text-muted-foreground";

  const canSolve = animPhase === "idle" || animPhase === "complete";
  const hasFrames = frames1.length > 0;
  const isPlaying = animPhase === "playing";

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl border border-border bg-card card-glow p-5 flex flex-col gap-4"
      data-ocid="maze.card"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl tracking-wide">
            MAZE SOLVER
          </h2>
          <p className={`text-sm mt-0.5 ${statusColor}`}>{status}</p>
        </div>
        <div className="flex items-center gap-2">
          {elapsedMs != null && (
            <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded-md tabular-nums">
              {elapsedMs}ms
            </span>
          )}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center neon-glow">
            <span className="text-white text-lg">🌐</span>
          </div>
        </div>
      </div>

      {/* Row 1: Size + Generation */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium shrink-0">
            Size:
          </span>
          {(["small", "medium", "large"] as const).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => handleSizeChange(s)}
              disabled={isPlaying}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all capitalize disabled:opacity-40 ${
                sizeKey === s
                  ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-400"
                  : "border-border hover:border-cyan-500/30 hover:bg-cyan-500/5"
              }`}
              data-ocid="maze.size_tab"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium shrink-0">
            Gen:
          </span>
          <select
            value={genMethod}
            onChange={(e) => setGenMethod(e.target.value as GenerationKey)}
            disabled={isPlaying}
            className="text-xs rounded-lg border border-border bg-background px-2 py-1 text-foreground disabled:opacity-40 cursor-pointer"
            data-ocid="maze.gen_select"
          >
            {(Object.keys(GEN_LABELS) as GenerationKey[]).map((k) => (
              <option key={k} value={k}>
                {GEN_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Algorithm + Compare toggle + Weight toggle */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium shrink-0">
            Algo:
          </span>
          <select
            value={algo1}
            onChange={(e) => setAlgo1(e.target.value as AlgorithmKey)}
            disabled={isPlaying}
            className="text-xs rounded-lg border border-border bg-background px-2 py-1 text-foreground disabled:opacity-40 cursor-pointer"
            data-ocid="maze.algo1_select"
          >
            {(Object.keys(ALGO_LABELS) as AlgorithmKey[]).map((k) => (
              <option key={k} value={k}>
                {ALGO_LABELS[k]}
              </option>
            ))}
          </select>
          {compareMode && (
            <>
              <span className="text-xs text-muted-foreground">vs</span>
              <select
                value={algo2}
                onChange={(e) => setAlgo2(e.target.value as AlgorithmKey)}
                disabled={isPlaying}
                className="text-xs rounded-lg border border-border bg-background px-2 py-1 text-foreground disabled:opacity-40 cursor-pointer"
                data-ocid="maze.algo2_select"
              >
                {(Object.keys(ALGO_LABELS) as AlgorithmKey[]).map((k) => (
                  <option key={k} value={k}>
                    {ALGO_LABELS[k]}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setCompareMode((v) => !v);
            handleReset();
          }}
          disabled={isPlaying}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40 ${
            compareMode
              ? "border-purple-500/60 bg-purple-500/15 text-purple-400"
              : "border-border hover:border-purple-500/30 hover:bg-purple-500/5 text-muted-foreground"
          }`}
          data-ocid="maze.compare_toggle"
        >
          <GitCompare size={12} />
          Compare
        </button>

        <button
          type="button"
          onClick={() => {
            setWeightMode((v) => !v);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
            weightMode
              ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
              : "border-border hover:border-amber-500/30 hover:bg-amber-500/5 text-muted-foreground"
          }`}
          data-ocid="maze.weight_toggle"
        >
          ⚖ Weights
        </button>
      </div>

      {/* Canvas(es) */}
      <div className={`flex gap-3 ${compareMode ? "flex-row flex-wrap" : ""}`}>
        <div
          className={`relative rounded-xl overflow-hidden border border-border ${compareMode ? "flex-1 min-w-[160px]" : "w-full"}`}
        >
          <canvas
            ref={canvasRef1}
            width={420}
            height={420}
            className="w-full block"
            style={{
              imageRendering: "pixelated",
              cursor: weightMode ? "crosshair" : "default",
            }}
            onClick={handleCanvasClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
              }
            }}
            tabIndex={weightMode ? 0 : undefined}
            aria-label={
              weightMode
                ? "Maze canvas — click cells to set weights"
                : "Maze canvas"
            }
            data-ocid="maze.canvas_target"
          />
          {isPlaying && (
            <div
              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 text-cyan-400 text-xs"
              data-ocid="maze.loading_state"
            >
              <Loader2 size={10} className="animate-spin" />
              {exploredCount}
            </div>
          )}
        </div>
        {compareMode && (
          <div className="relative rounded-xl overflow-hidden border border-border flex-1 min-w-[160px]">
            <canvas
              ref={canvasRef2}
              width={420}
              height={420}
              className="w-full block"
              style={{ imageRendering: "pixelated" }}
              data-ocid="maze.canvas_compare"
            />
          </div>
        )}
      </div>

      {/* Progress bar */}
      {hasFrames && (
        <div className="step-progress">
          <div
            className="step-progress-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {/* Step controls */}
      {hasFrames && (
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRewind}
              className="playback-button"
              aria-label="Rewind to start"
              data-ocid="maze.step_rewind"
            >
              <ChevronFirst size={16} />
            </button>
            <button
              type="button"
              onClick={handleStepBack}
              className="playback-button"
              aria-label="Step backward"
              data-ocid="maze.step_back"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handlePlayPause}
              disabled={
                animPhase === "complete" &&
                frameIdx >= frames1.length - 1 &&
                frames1[frameIdx]?.path?.length > 0
              }
              className="playback-button w-12"
              aria-label={isPlaying ? "Pause" : "Play"}
              data-ocid="maze.play_pause"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              type="button"
              onClick={handleStepForward}
              className="playback-button"
              aria-label="Step forward"
              data-ocid="maze.step_forward"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={handleFastForward}
              className="playback-button"
              aria-label="Fast forward to end"
              data-ocid="maze.step_end"
            >
              <ChevronLast size={16} />
            </button>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums font-mono">
            {frameIdx + 1} / {totalFrames}
          </span>
        </div>
      )}

      {/* Speed */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
          Speed:
        </span>
        <div className="flex items-center gap-2 flex-1">
          {(["slow", "medium", "fast"] as const).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setSpeedKey(s)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                speedKey === s
                  ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-400"
                  : "border-border hover:bg-accent text-muted-foreground"
              }`}
              data-ocid="maze.speed_tab"
            >
              {s}
            </button>
          ))}
        </div>
        <span className="kbd-shortcut ml-1">Space</span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={isPlaying}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-border hover:bg-accent transition-all disabled:opacity-40"
          data-ocid="maze.reset_button"
        >
          <RotateCcw size={13} />
          Reset
        </button>
        <button
          type="button"
          onClick={handleNewMaze}
          disabled={isPlaying}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-border hover:bg-accent transition-all disabled:opacity-40"
          data-ocid="maze.new_maze_button"
        >
          <Shuffle size={13} />
          New Maze
        </button>
        <button
          type="button"
          onClick={canSolve ? handleSolve : handlePlayPause}
          disabled={false}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-900 hover:opacity-90 transition-all shadow-neon disabled:opacity-50"
          data-ocid="maze.primary_button"
        >
          {isPlaying ? (
            <>
              <Pause size={14} />
              Pause
            </>
          ) : canSolve ? (
            <>
              <Play size={14} />
              Animate Path
            </>
          ) : (
            <>
              <Play size={14} />
              Resume
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Algorithm", value: ALGO_LABELS[algo1] },
          { label: "Grid", value: `${rows}×${cols}` },
          {
            label: "Path",
            value:
              currentPath.length > 0 ? String(currentPath.length - 1) : "—",
          },
          {
            label: "Explored",
            value: exploredCount > 0 ? String(exploredCount) : "—",
          },
        ].map((info) => (
          <div
            key={info.label}
            className="p-2.5 rounded-xl border border-border bg-muted/30 text-center"
          >
            <div className="text-xs text-muted-foreground mb-0.5">
              {info.label}
            </div>
            <div className="font-display font-bold text-sm gradient-text">
              {info.value}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500" />S - Start
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-500" />E - End
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-purple-500/40" />
          Explored
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-cyan-500/80" />
          Path
        </span>
        {weightMode && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-400/60" />
            Weight (click to set)
          </span>
        )}
      </div>
    </motion.div>
  );
}

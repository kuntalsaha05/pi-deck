import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AnimationState,
  MazeAlgorithm,
  MazeCell,
  MazeGenerationMethod,
  WeightType,
} from "../types/solver-types";
import { dfs, dijkstra, greedyBestFirst } from "../utils/maze-algorithms";
import { primsAlgorithm, recursiveDivision } from "../utils/maze-generators";
import { generateMazeRecursiveBacktracking } from "../utils/maze-generators-bt";

const STORAGE_KEY = "maze-state";

type Coord = [number, number];

interface SavedMazeState {
  gridData: Array<Array<{ type: string; weight: number; isWeighted: boolean }>>;
  algorithm: MazeAlgorithm;
  generationMethod: MazeGenerationMethod;
  gridSize: number;
}

function generateMaze(
  method: MazeGenerationMethod,
  size: number,
): MazeCell[][] {
  switch (method) {
    case "prims":
      return primsAlgorithm(size, size);
    case "recursive-division":
      return recursiveDivision(size, size);
    default:
      return generateMazeRecursiveBacktracking(size, size);
  }
}

function runAlgorithm(
  grid: MazeCell[][],
  alg: MazeAlgorithm,
  start: Coord,
  end: Coord,
): { visited: Coord[]; path: Coord[] } {
  switch (alg) {
    case "dijkstra":
      return dijkstra(grid, start, end);
    case "dfs":
      return dfs(grid, start, end);
    case "greedy":
      return greedyBestFirst(grid, start, end);
    case "bfs": {
      // BFS - unweighted uniform cost search
      const visited: Coord[] = [];
      const cameFrom = new Map<string, Coord | null>();
      const visitedSet = new Set<string>();
      const queue: Coord[] = [start];
      cameFrom.set(`${start[0]},${start[1]}`, null);
      visitedSet.add(`${start[0]},${start[1]}`);

      while (queue.length > 0) {
        const [r, c] = queue.shift()!;
        visited.push([r, c]);
        if (r === end[0] && c === end[1]) {
          const path: Coord[] = [];
          let cur: Coord | null = [r, c];
          const sk = `${start[0]},${start[1]}`;
          while (cur) {
            path.unshift(cur);
            const k = `${cur[0]},${cur[1]}`;
            if (k === sk) break;
            cur = cameFrom.get(k) ?? null;
          }
          return { visited, path };
        }
        for (const [nr, nc] of [
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1],
        ] as Coord[]) {
          const nk = `${nr},${nc}`;
          if (
            nr >= 0 &&
            nc >= 0 &&
            nr < grid.length &&
            nc < grid[0].length &&
            grid[nr][nc].type !== "wall" &&
            !visitedSet.has(nk)
          ) {
            visitedSet.add(nk);
            cameFrom.set(nk, [r, c]);
            queue.push([nr, nc]);
          }
        }
      }
      return { visited, path: [] };
    }
    case "astar": {
      // A* algorithm
      const h = (a: Coord, b: Coord) =>
        Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
      const visited: Coord[] = [];
      const dist = new Map<string, number>();
      const cameFrom = new Map<string, Coord | null>();
      type Node = { coord: Coord; f: number };
      const open: Node[] = [{ coord: start, f: h(start, end) }];
      const sk = `${start[0]},${start[1]}`;
      dist.set(sk, 0);
      cameFrom.set(sk, null);

      while (open.length > 0) {
        open.sort((a, b) => a.f - b.f);
        const { coord } = open.shift()!;
        const [r, c] = coord;
        const k = `${r},${c}`;
        visited.push(coord);
        if (r === end[0] && c === end[1]) {
          const path: Coord[] = [];
          let cur: Coord | null = coord;
          while (cur) {
            path.unshift(cur);
            const ck = `${cur[0]},${cur[1]}`;
            if (ck === sk) break;
            cur = cameFrom.get(ck) ?? null;
          }
          return { visited, path };
        }
        const g = dist.get(k) ?? Number.POSITIVE_INFINITY;
        for (const [nr, nc] of [
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1],
        ] as Coord[]) {
          if (nr < 0 || nc < 0 || nr >= grid.length || nc >= grid[0].length)
            continue;
          if (grid[nr][nc].type === "wall") continue;
          const nk = `${nr},${nc}`;
          const ng = g + grid[nr][nc].weight;
          if (ng < (dist.get(nk) ?? Number.POSITIVE_INFINITY)) {
            dist.set(nk, ng);
            cameFrom.set(nk, coord);
            open.push({ coord: [nr, nc], f: ng + h([nr, nc], end) });
          }
        }
      }
      return { visited, path: [] };
    }
    default:
      return { visited: [], path: [] };
  }
}

export function useMaze() {
  const [grid, setGrid] = useState<MazeCell[][]>([]);
  const [algorithm, setAlgorithm] = useState<MazeAlgorithm>("bfs");
  const [algorithm2, setAlgorithm2] = useState<MazeAlgorithm>("astar");
  const [generationMethod, setGenerationMethod] =
    useState<MazeGenerationMethod>("recursive-backtracking");
  const [gridSize, setGridSize] = useState(21);
  const [weightMode, setWeightMode] = useState(false);
  const [animationState, setAnimationState] = useState<AnimationState>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [comparisonMode, setComparisonMode] = useState(false);

  const [visitedCells, setVisitedCells] = useState<Coord[]>([]);
  const [pathCells, setPathCells] = useState<Coord[]>([]);
  const [visitedCells2, setVisitedCells2] = useState<Coord[]>([]);
  const [pathCells2, setPathCells2] = useState<Coord[]>([]);

  // Full solve data for playback
  const solveDataRef = useRef<{ visited: Coord[]; path: Coord[] } | null>(null);
  const solveData2Ref = useRef<{ visited: Coord[]; path: Coord[] } | null>(
    null,
  );
  const animIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAnimation = useCallback(() => {
    if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current);
      animIntervalRef.current = null;
    }
  }, []);

  const getStartEnd = useCallback(
    (g: MazeCell[][]): { start: Coord; end: Coord } => {
      let start: Coord = [0, 0];
      let end: Coord = [g.length - 1, g[0].length - 1];
      for (let r = 0; r < g.length; r++) {
        for (let c = 0; c < g[r].length; c++) {
          if (g[r][c].type === "start") start = [r, c];
          if (g[r][c].type === "end") end = [r, c];
        }
      }
      return { start, end };
    },
    [],
  );

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedMazeState = JSON.parse(raw);
        const restored: MazeCell[][] = saved.gridData.map((row) =>
          row.map((cell) => ({
            type: cell.type as MazeCell["type"],
            weight: cell.weight as WeightType,
            isWeighted: cell.isWeighted,
          })),
        );
        setGrid(restored);
        setAlgorithm(saved.algorithm);
        setGenerationMethod(saved.generationMethod);
        setGridSize(saved.gridSize);
        return;
      }
    } catch {
      // ignore
    }
    // Generate default maze
    const g = generateMaze("recursive-backtracking", 21);
    setGrid(g);
  }, []);

  const doGenerateMaze = useCallback(() => {
    stopAnimation();
    setAnimationState("idle");
    setCurrentStep(0);
    setTotalSteps(0);
    setVisitedCells([]);
    setPathCells([]);
    setVisitedCells2([]);
    setPathCells2([]);
    solveDataRef.current = null;
    solveData2Ref.current = null;

    const g = generateMaze(generationMethod, gridSize);
    setGrid(g);

    try {
      const state: SavedMazeState = {
        gridData: g.map((row) =>
          row.map((cell) => ({
            type: cell.type,
            weight: cell.weight,
            isWeighted: cell.isWeighted,
          })),
        ),
        algorithm,
        generationMethod,
        gridSize,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [generationMethod, gridSize, algorithm, stopAnimation]);

  const solveMaze = useCallback(() => {
    if (grid.length === 0) return;
    stopAnimation();

    const { start, end } = getStartEnd(grid);
    const result1 = runAlgorithm(grid, algorithm, start, end);
    solveDataRef.current = result1;

    let result2 = { visited: [] as Coord[], path: [] as Coord[] };
    if (comparisonMode) {
      result2 = runAlgorithm(grid, algorithm2, start, end);
      solveData2Ref.current = result2;
    }

    const total = result1.visited.length + result1.path.length;
    setTotalSteps(total);
    setCurrentStep(0);
    setVisitedCells([]);
    setPathCells([]);
    setVisitedCells2([]);
    setPathCells2([]);
    setAnimationState("playing");
  }, [grid, algorithm, algorithm2, comparisonMode, stopAnimation, getStartEnd]);

  // Animation loop
  useEffect(() => {
    if (animationState !== "playing") {
      stopAnimation();
      return;
    }

    const data = solveDataRef.current;
    if (!data) return;

    const allSteps = [...data.visited, ...data.path];
    const data2 = solveData2Ref.current;
    const allSteps2 = data2 ? [...data2.visited, ...data2.path] : [];

    animIntervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;

        if (next <= data.visited.length) {
          setVisitedCells(allSteps.slice(0, next));
        } else {
          setVisitedCells(data.visited);
          setPathCells(allSteps.slice(data.visited.length, next));
        }

        if (comparisonMode && data2) {
          if (next <= data2.visited.length) {
            setVisitedCells2(allSteps2.slice(0, next));
          } else {
            setVisitedCells2(data2.visited);
            setPathCells2(allSteps2.slice(data2.visited.length, next));
          }
        }

        if (next >= allSteps.length) {
          setAnimationState("complete");
          return allSteps.length;
        }

        return next;
      });
    }, 30);

    return () => stopAnimation();
  }, [animationState, comparisonMode, stopAnimation]);

  const togglePlay = useCallback(() => {
    setAnimationState((prev) => {
      if (prev === "playing") return "paused";
      if (prev === "paused" || prev === "idle") return "playing";
      return "idle";
    });
  }, []);

  const rewind = useCallback(() => {
    stopAnimation();
    setCurrentStep(0);
    setVisitedCells([]);
    setPathCells([]);
    setVisitedCells2([]);
    setPathCells2([]);
    setAnimationState("idle");
  }, [stopAnimation]);

  const fastForward = useCallback(() => {
    const data = solveDataRef.current;
    if (!data) return;
    stopAnimation();
    setVisitedCells(data.visited);
    setPathCells(data.path);
    if (comparisonMode && solveData2Ref.current) {
      setVisitedCells2(solveData2Ref.current.visited);
      setPathCells2(solveData2Ref.current.path);
    }
    setCurrentStep(data.visited.length + data.path.length);
    setAnimationState("complete");
  }, [comparisonMode, stopAnimation]);

  const stepForward = useCallback(() => {
    const data = solveDataRef.current;
    if (!data) return;
    setAnimationState("paused");
    setCurrentStep((prev) => {
      const next = Math.min(prev + 1, data.visited.length + data.path.length);
      const allSteps = [...data.visited, ...data.path];
      if (next <= data.visited.length) {
        setVisitedCells(allSteps.slice(0, next));
      } else {
        setVisitedCells(data.visited);
        setPathCells(allSteps.slice(data.visited.length, next));
      }
      return next;
    });
  }, []);

  const stepBackward = useCallback(() => {
    const data = solveDataRef.current;
    if (!data) return;
    setAnimationState("paused");
    setCurrentStep((prev) => {
      const next = Math.max(prev - 1, 0);
      const allSteps = [...data.visited, ...data.path];
      if (next <= data.visited.length) {
        setVisitedCells(allSteps.slice(0, next));
        setPathCells([]);
      } else {
        setVisitedCells(data.visited);
        setPathCells(allSteps.slice(data.visited.length, next));
      }
      return next;
    });
  }, []);

  const setWeight = useCallback(
    (row: number, col: number, weight: WeightType) => {
      setGrid((prev) =>
        prev.map((r, ri) =>
          r.map((cell, ci) => {
            if (
              ri === row &&
              ci === col &&
              cell.type !== "wall" &&
              cell.type !== "start" &&
              cell.type !== "end"
            ) {
              return { ...cell, weight, isWeighted: weight > 1 };
            }
            return cell;
          }),
        ),
      );
    },
    [],
  );

  return {
    grid,
    algorithm,
    algorithm2,
    generationMethod,
    gridSize,
    weightMode,
    animationState,
    currentStep,
    totalSteps,
    comparisonMode,
    visitedCells,
    pathCells,
    visitedCells2,
    pathCells2,
    setAlgorithm,
    setAlgorithm2,
    setGenerationMethod,
    setGridSize,
    setWeightMode,
    setComparisonMode,
    generateMaze: doGenerateMaze,
    solveMaze,
    togglePlay,
    rewind,
    fastForward,
    stepForward,
    stepBackward,
    setWeight,
  };
}

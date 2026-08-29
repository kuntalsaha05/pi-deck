export type SudokuDifficulty = "easy" | "medium" | "hard";

export interface SudokuCell {
  value: number;
  isGiven: boolean;
  isHint: boolean;
  isError: boolean;
  notes: Set<number>;
}

export interface SudokuScore {
  time: number;
  hintsUsed: number;
  mistakes: number;
  difficulty: SudokuDifficulty;
  algorithm: string;
  timestamp: number;
  puzzleId: string;
}

export type MazeAlgorithm = "bfs" | "astar" | "dijkstra" | "dfs" | "greedy";

export type MazeGenerationMethod =
  | "recursive-backtracking"
  | "prims"
  | "recursive-division";

export type CellType =
  | "wall"
  | "path"
  | "start"
  | "end"
  | "visited"
  | "frontier"
  | "solution";

export type WeightType = 1 | 2 | 3;

export interface MazeCell {
  type: CellType;
  weight: WeightType;
  isWeighted: boolean;
}

export interface MazeScore {
  time: number;
  steps: number;
  pathLength: number;
  algorithm: MazeAlgorithm;
  generationMethod: MazeGenerationMethod;
  gridSize: number;
  timestamp: number;
}

export interface LeaderboardEntry {
  id: string;
  category: string;
  score: SudokuScore | MazeScore;
  rank: number;
}

export interface AppSettings {
  soundEnabled: boolean;
  volume: number;
  animationSpeed: number;
  theme: "light" | "dark" | "system";
}

export type AnimationState = "idle" | "playing" | "paused" | "complete";

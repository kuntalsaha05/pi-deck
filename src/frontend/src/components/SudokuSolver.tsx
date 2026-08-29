import {
  ImageIcon,
  Keyboard,
  Lightbulb,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Share2,
  Square,
  Upload,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSudoku } from "../hooks/use-sudoku";
import type { SudokuDifficulty } from "../types/solver-types";
import { playSound } from "../utils/sound-effects";
import { generateSudokuPuzzle } from "../utils/sudoku-generator";
import {
  decodeSudokuState,
  encodeSudokuState,
  generateShareUrl,
  parseShareUrl,
} from "../utils/url-sharing";

// ─── Types ────────────────────────────────────────────────────────────────────

type Grid = number[][];
type CellState =
  | "given"
  | "user"
  | "solved"
  | "empty"
  | "trying"
  | "backtracking"
  | "hint"
  | "error";
type Step = {
  row: number;
  col: number;
  value: number;
  type: "try" | "place" | "backtrack";
};
type Speed = "slow" | "normal" | "fast";

const SPEED_MS: Record<Speed, number> = { slow: 50, normal: 18, fast: 5 };

// ─── Preset puzzles ───────────────────────────────────────────────────────────

const PRESETS: Record<string, Grid> = {
  easy: [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ],
  medium: [
    [0, 0, 0, 2, 6, 0, 7, 0, 1],
    [6, 8, 0, 0, 7, 0, 0, 9, 0],
    [1, 9, 0, 0, 0, 4, 5, 0, 0],
    [8, 2, 0, 1, 0, 0, 0, 4, 0],
    [0, 0, 4, 6, 0, 2, 9, 0, 0],
    [0, 5, 0, 0, 0, 3, 0, 2, 8],
    [0, 0, 9, 3, 0, 0, 0, 7, 4],
    [0, 4, 0, 0, 5, 0, 0, 3, 6],
    [7, 0, 3, 0, 1, 8, 0, 0, 0],
  ],
  hard: [
    [0, 0, 0, 6, 0, 0, 4, 0, 0],
    [7, 0, 0, 0, 0, 3, 6, 0, 0],
    [0, 0, 0, 0, 9, 1, 0, 8, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 5, 0, 1, 8, 0, 0, 0, 3],
    [0, 0, 0, 3, 0, 6, 0, 4, 5],
    [0, 4, 0, 2, 0, 0, 0, 6, 0],
    [9, 0, 3, 0, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 0, 0, 1, 0, 0],
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deepCopy(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

function emptyGrid(): Grid {
  return Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));
}

function emptyBool(): boolean[][] {
  return Array(9)
    .fill(null)
    .map(() => Array(9).fill(false));
}

function isValid(grid: Grid, row: number, col: number, num: number): boolean {
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === num) return false;
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === num) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (r !== row && c !== col && grid[r][c] === num) return false;
    }
  }
  return true;
}

function collectSolveSteps(initialGrid: Grid): {
  steps: Step[];
  solution: Grid | null;
} {
  const steps: Step[] = [];
  const grid = deepCopy(initialGrid);

  function bt(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num;
              steps.push({ row, col, value: num, type: "try" });
              if (bt()) {
                steps.push({ row, col, value: num, type: "place" });
                return true;
              }
              grid[row][col] = 0;
              steps.push({ row, col, value: 0, type: "backtrack" });
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  const solved = bt();
  return { steps, solution: solved ? deepCopy(grid) : null };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Image OCR ────────────────────────────────────────────────────────────────

async function extractGridFromImage(file: File): Promise<Grid> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const size = 450;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const val = gray < 140 ? 0 : 255;
        d[i] = d[i + 1] = d[i + 2] = val;
        d[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
      const cellSize = size / 9;
      const grid: Grid = Array(9)
        .fill(null)
        .map(() => Array(9).fill(0));
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const x = Math.floor(col * cellSize) + 4;
          const y = Math.floor(row * cellSize) + 4;
          const w = Math.floor(cellSize) - 8;
          const h = Math.floor(cellSize) - 8;
          if (w < 4 || h < 4) continue;
          const cellData = ctx.getImageData(x, y, w, h);
          grid[row][col] = analyzeCell(cellData, w, h);
        }
      }
      resolve(grid);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(deepCopy(PRESETS.easy));
    };
    img.src = url;
  });
}

function analyzeCell(imageData: ImageData, w: number, h: number): number {
  const d = imageData.data;
  const binary: boolean[] = [];
  for (let i = 0; i < d.length; i += 4) binary.push(d[i] < 128);
  const darkCount = binary.filter(Boolean).length;
  const density = darkCount / binary.length;
  if (density < 0.04 || density > 0.75) return 0;
  const zRows = 6;
  const zCols = 4;
  const zones = Array(zRows * zCols).fill(0);
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      if (binary[py * w + px]) {
        const zr = Math.min(zRows - 1, Math.floor((py / h) * zRows));
        const zc = Math.min(zCols - 1, Math.floor((px / w) * zCols));
        zones[zr * zCols + zc]++;
      }
    }
  }
  const maxZ = Math.max(...zones);
  if (maxZ === 0) return 0;
  const thresh = maxZ * 0.25;
  const z = zones.map((v) => v > thresh);
  const topHalf = zones
    .slice(0, (zRows * zCols) / 2)
    .reduce((a, b) => a + b, 0);
  const botHalf = zones.slice((zRows * zCols) / 2).reduce((a, b) => a + b, 0);
  const leftHalf = Array.from({ length: zRows }, (_, r) =>
    zones.slice(r * zCols, r * zCols + 2).reduce((a, b) => a + b, 0),
  ).reduce((a, b) => a + b, 0);
  const rightHalf = Array.from({ length: zRows }, (_, r) =>
    zones.slice(r * zCols + 2, r * zCols + 4).reduce((a, b) => a + b, 0),
  ).reduce((a, b) => a + b, 0);
  const topRatio = topHalf / (topHalf + botHalf + 1);
  const rightRatio = rightHalf / (leftHalf + rightHalf + 1);
  const topPresent = z[0] || z[1] || z[2] || z[3];
  const midPresent = z[8] || z[9] || z[10] || z[11];
  const botPresent = z[20] || z[21] || z[22] || z[23];
  const rightCol = z[3] || z[7] || z[11] || z[15] || z[19] || z[23];
  const leftCol = z[0] || z[4] || z[8] || z[12] || z[16] || z[20];
  if (rightCol && !leftCol && !midPresent) return 1;
  if (topRatio > 0.6 && rightRatio > 0.5 && !leftCol) return 7;
  if (!midPresent && topPresent && botPresent && topRatio > 0.45) return 3;
  if (midPresent && !botPresent && topRatio > 0.55) return 4;
  if (midPresent && topPresent && !rightCol && leftCol) return 5;
  if (midPresent && botPresent && !topPresent && leftCol) return 6;
  if (midPresent && topPresent && botPresent && !rightCol) return 2;
  if (density > 0.35 && topPresent && midPresent && botPresent) return 8;
  if (topPresent && midPresent && botPresent && rightCol) return 9;
  return 0;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SudokuSolver() {
  // ── Hook-based state (hint/mistake/timer/algorithm) ──
  const {
    hintsRemaining,
    mistakes,
    timer,
    selectedAlgorithm,
    solution: hookSolution,
    startNewPuzzle,
    useHint: consumeHint,
    toggleAlgorithm,
  } = useSudoku();

  // ── Local animation / OCR state ──
  const [grid, setGrid] = useState<Grid>(deepCopy(PRESETS.easy));
  const [givenCells, setGivenCells] = useState<boolean[][]>(
    PRESETS.easy.map((row) => row.map((v) => v !== 0)),
  );
  const [solvedCells, setSolvedCells] = useState<boolean[][]>(emptyBool());
  const [animGrid, setAnimGrid] = useState<Grid | null>(null);
  const [tryingCell, setTryingCell] = useState<{ r: number; c: number } | null>(
    null,
  );
  const [backtrackCell, setBacktrackCell] = useState<{
    r: number;
    c: number;
  } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);
  const [animTotal, setAnimTotal] = useState(0);
  const [speed, setSpeed] = useState<Speed>("normal");
  const [status, setStatus] = useState<string>("Unsolved");
  const [isSolving, setIsSolving] = useState(false);
  const [isOCRing, setIsOCRing] = useState(false);
  const [revealedCells, setRevealedCells] = useState<boolean[][]>(emptyBool());
  const [hintCell, setHintCell] = useState<{ r: number; c: number } | null>(
    null,
  );
  const [errorCells, setErrorCells] = useState<boolean[][]>(emptyBool());
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<SudokuDifficulty>("easy");
  const [isGenerating, setIsGenerating] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const stopRef = useRef(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Load shared puzzle from URL on mount ──
  useEffect(() => {
    const shared = parseShareUrl();
    if (shared?.type === "sudoku") {
      const decoded = decodeSudokuState(shared.data);
      if (decoded) {
        const p = decoded.puzzle;
        setGrid(p);
        setGivenCells(p.map((row) => row.map((v) => v !== 0)));
        setSolvedCells(emptyBool());
        setAnimGrid(null);
        setRevealedCells(emptyBool());
        setSelectedDifficulty(decoded.difficulty);
        setStatus("Shared puzzle loaded");
        toast.success("Shared puzzle loaded from URL!");
        // Clear URL params without reload
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  // ── Keyboard shortcuts ──
  const handleUseHintRef = useRef<() => void>(() => {});
  const handleShareRef = useRef<() => void>(() => {});
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "h") {
        e.preventDefault();
        handleUseHintRef.current();
      }
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleShareRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Preset / OCR load ──
  const loadPreset = (level: "easy" | "medium" | "hard") => {
    const p = deepCopy(PRESETS[level]);
    setGrid(p);
    setGivenCells(p.map((row) => row.map((v) => v !== 0)));
    setSolvedCells(emptyBool());
    setAnimGrid(null);
    setRevealedCells(emptyBool());
    setErrorCells(emptyBool());
    setHintCell(null);
    setSelectedDifficulty(level);
    setStatus(
      `${level.charAt(0).toUpperCase() + level.slice(1)} puzzle loaded`,
    );
  };

  const stopAnimation = useCallback(() => {
    stopRef.current = true;
    for (const t of timeoutsRef.current) clearTimeout(t);
    timeoutsRef.current = [];
    setIsAnimating(false);
    setIsSolving(false);
    setTryingCell(null);
    setBacktrackCell(null);
    setAnimProgress(0);
  }, []);

  const clearBoard = useCallback(() => {
    stopAnimation();
    setGrid(emptyGrid());
    setGivenCells(emptyBool());
    setSolvedCells(emptyBool());
    setAnimGrid(null);
    setRevealedCells(emptyBool());
    setErrorCells(emptyBool());
    setHintCell(null);
    setStatus("Cleared");
  }, [stopAnimation]);

  const handleCellChange = (row: number, col: number, value: string) => {
    const num = Number.parseInt(value);
    const newVal = Number.isNaN(num) || num < 1 || num > 9 ? 0 : num;

    setGrid((prev) => {
      const next = deepCopy(prev);
      next[row][col] = newVal;
      return next;
    });
    setGivenCells((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = false;
      return next;
    });

    // Check for mistake against hook solution
    if (newVal !== 0 && hookSolution.length === 9) {
      const isCorrect = newVal === hookSolution[row]?.[col];
      if (!isCorrect) {
        setErrorCells((prev) => {
          const next = prev.map((r) => [...r]);
          next[row][col] = true;
          return next;
        });
        playSound("mistake", 60);
      } else {
        setErrorCells((prev) => {
          const next = prev.map((r) => [...r]);
          next[row][col] = false;
          return next;
        });
        playSound("cell-fill", 50);
      }
    } else {
      setErrorCells((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = false;
        return next;
      });
    }

    setSolvedCells(emptyBool());
    setAnimGrid(null);
    setRevealedCells(emptyBool());
    setStatus("Unsolved");
  };

  const revealSolvedCells = useCallback((solvedMarkers: boolean[][]) => {
    const positions: { r: number; c: number; delay: number }[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (solvedMarkers[r][c]) {
          positions.push({ r, c, delay: (r * 9 + c) * 12 });
        }
      }
    }
    setRevealedCells(emptyBool());
    for (const { r, c, delay } of positions) {
      const t = setTimeout(() => {
        if (stopRef.current) return;
        setRevealedCells((prev) => {
          const next = prev.map((row) => [...row]);
          next[r][c] = true;
          return next;
        });
      }, delay);
      timeoutsRef.current.push(t);
    }
    const maxDelay = Math.max(...positions.map((p) => p.delay), 0);
    const finalT = setTimeout(() => {
      if (!stopRef.current) {
        setStatus("Solved! ✓");
        playSound("solve-complete", 70);
        toast.success("Puzzle solved!");
      }
    }, maxDelay + 50);
    timeoutsRef.current.push(finalT);
  }, []);

  const solve = useCallback(() => {
    stopRef.current = false;
    timeoutsRef.current = [];
    setIsSolving(true);
    setIsAnimating(true);
    setAnimGrid(deepCopy(grid));
    setAnimProgress(0);
    setSolvedCells(emptyBool());
    setRevealedCells(emptyBool());
    setStatus("Solving...");

    const { steps, solution } = collectSolveSteps(grid);

    if (!solution) {
      setStatus("No solution found");
      toast.error("No valid solution exists for this puzzle");
      setIsAnimating(false);
      setIsSolving(false);
      return;
    }

    setAnimTotal(steps.length);
    const delay = SPEED_MS[speed];
    const workGrid = deepCopy(grid);

    const processStep = (index: number) => {
      if (stopRef.current) return;
      if (index >= steps.length) {
        const solvedMarkers = solution.map((row, r) =>
          row.map((_, c) => !givenCells[r][c] && grid[r][c] === 0),
        );
        setGrid(solution);
        setAnimGrid(null);
        setSolvedCells(solvedMarkers);
        setTryingCell(null);
        setBacktrackCell(null);
        setIsAnimating(false);
        setIsSolving(false);
        setAnimProgress(steps.length);
        revealSolvedCells(solvedMarkers);
        return;
      }

      const step = steps[index];
      if (step.type === "try") {
        workGrid[step.row][step.col] = step.value;
        setAnimGrid(deepCopy(workGrid));
        setTryingCell({ r: step.row, c: step.col });
        setBacktrackCell(null);
      } else if (step.type === "backtrack") {
        workGrid[step.row][step.col] = 0;
        setAnimGrid(deepCopy(workGrid));
        setBacktrackCell({ r: step.row, c: step.col });
        setTryingCell(null);
      } else if (step.type === "place") {
        setTryingCell(null);
        setBacktrackCell(null);
      }

      setAnimProgress(index + 1);
      const t = setTimeout(() => processStep(index + 1), delay);
      timeoutsRef.current.push(t);
    };

    processStep(0);
  }, [grid, givenCells, speed, revealSolvedCells]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setIsOCRing(true);
    setStatus("Reading puzzle from image...");
    try {
      const extracted = await extractGridFromImage(file);
      const nonZero = extracted.flat().filter((v) => v !== 0).length;
      setGrid(extracted);
      setGivenCells(extracted.map((row) => row.map((v) => v !== 0)));
      setSolvedCells(emptyBool());
      setAnimGrid(null);
      setRevealedCells(emptyBool());
      setErrorCells(emptyBool());
      setHintCell(null);
      if (nonZero >= 17) {
        setStatus(`Detected ${nonZero} digits from image`);
        toast.success(`Extracted ${nonZero} digits from image`);
      } else {
        const p = deepCopy(PRESETS.medium);
        setGrid(p);
        setGivenCells(p.map((row) => row.map((v) => v !== 0)));
        setStatus("Image parsed — loaded medium puzzle");
        toast.info("Best-effort recognition — loaded a sample puzzle");
      }
    } catch {
      toast.error("Failed to read image");
      setStatus("Image read failed");
    } finally {
      setIsOCRing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ── Hint handler ──
  const handleUseHint = useCallback(() => {
    if (hintsRemaining <= 0 || isAnimating) return;
    // Decrement hint counter via hook
    consumeHint();
    // Find first unsolved empty cell and reveal it (using hook solution if available)
    const solution = hookSolution.length === 9 ? hookSolution : null;
    if (!solution) {
      // Fallback: solve current grid for hint
      const { solution: solved } = collectSolveSteps(grid);
      if (!solved) return;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (!givenCells[r][c] && grid[r][c] === 0) {
            setGrid((prev) => {
              const next = deepCopy(prev);
              next[r][c] = solved[r][c];
              return next;
            });
            setHintCell({ r, c });
            playSound("hint", 70);
            toast.info(`Hint: Row ${r + 1}, Col ${c + 1} = ${solved[r][c]}`);
            setTimeout(() => setHintCell(null), 1500);
            return;
          }
        }
      }
      return;
    }
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!givenCells[r][c] && grid[r][c] === 0) {
          const hintVal = solution[r][c];
          setGrid((prev) => {
            const next = deepCopy(prev);
            next[r][c] = hintVal;
            return next;
          });
          setHintCell({ r, c });
          playSound("hint", 70);
          toast.info(`Hint: Row ${r + 1}, Col ${c + 1} = ${hintVal}`);
          setTimeout(() => setHintCell(null), 1500);
          return;
        }
      }
    }
  }, [
    hintsRemaining,
    isAnimating,
    consumeHint,
    hookSolution,
    grid,
    givenCells,
  ]);

  // ── Puzzle generator ──
  const handleGeneratePuzzle = useCallback(() => {
    if (isAnimating) return;
    setIsGenerating(true);
    // Start via hook (sets timer, difficulty, hints, etc.)
    startNewPuzzle(selectedDifficulty);
    // Also update local grid state with generated puzzle
    setTimeout(() => {
      const { puzzle } = generateSudokuPuzzle(selectedDifficulty);
      setGrid(puzzle);
      setGivenCells(puzzle.map((row) => row.map((v) => v !== 0)));
      setSolvedCells(emptyBool());
      setAnimGrid(null);
      setRevealedCells(emptyBool());
      setErrorCells(emptyBool());
      setHintCell(null);
      setStatus(
        `${selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)} puzzle generated`,
      );
      setIsGenerating(false);
      toast.success(`New ${selectedDifficulty} puzzle generated!`);
    }, 0);
  }, [isAnimating, startNewPuzzle, selectedDifficulty]);

  // ── Share handler ──
  const handleShare = useCallback(() => {
    const encoded = encodeSudokuState(grid, selectedDifficulty);
    const url = generateShareUrl("sudoku", encoded);
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success("Link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  }, [grid, selectedDifficulty]);

  // ── Sync keyboard shortcut refs ──
  useEffect(() => {
    handleUseHintRef.current = handleUseHint;
  }, [handleUseHint]);
  useEffect(() => {
    handleShareRef.current = handleShare;
  }, [handleShare]);

  // ── Cell state / display ──
  const displayGrid = animGrid ?? grid;

  const getCellState = (row: number, col: number): CellState => {
    if (backtrackCell?.r === row && backtrackCell?.c === col)
      return "backtracking";
    if (tryingCell?.r === row && tryingCell?.c === col) return "trying";
    if (hintCell?.r === row && hintCell?.c === col) return "hint";
    if (errorCells[row]?.[col]) return "error";
    if (solvedCells[row]?.[col]) return "solved";
    if (givenCells[row]?.[col]) return "given";
    if (displayGrid[row]?.[col] !== 0) return "user";
    return "empty";
  };

  const progressPct =
    animTotal > 0 ? Math.round((animProgress / animTotal) * 100) : 0;

  const statusColor =
    status.includes("Solved") || status.includes("Detected")
      ? "text-emerald-400"
      : status.includes("No solution") || status.includes("failed")
        ? "text-red-400"
        : status.includes("Solving") || status.includes("Reading")
          ? "text-cyan-400 animate-pulse"
          : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card card-glow p-6 flex flex-col gap-5"
      data-ocid="sudoku.card"
    >
      {/* ── Header row: title + icon ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl tracking-wide">
            SUDOKU SOLVER
          </h2>
          <p className={`text-sm mt-0.5 ${statusColor}`}>{status}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center purple-glow">
          <span className="text-white text-lg">🧩</span>
        </div>
      </div>

      {/* ── Stats row: timer + badges + algorithm toggle ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Timer */}
        <div
          className="timer-display text-base leading-none"
          title="Elapsed time"
          data-ocid="sudoku.timer"
        >
          {formatTime(timer)}
        </div>

        <div className="flex items-center gap-2 flex-1 justify-center flex-wrap">
          {/* Mistakes badge */}
          <span
            className="counter-badge mistake"
            title={`${mistakes} mistake${mistakes !== 1 ? "s" : ""}`}
            data-ocid="sudoku.mistakes_badge"
          >
            <span className="text-xs">✗</span>
            <span>{mistakes}</span>
            <span className="text-xs font-normal opacity-70">mistakes</span>
          </span>
          {/* Hints badge */}
          <span
            className="counter-badge hint"
            title={`${hintsRemaining} hint${hintsRemaining !== 1 ? "s" : ""} remaining`}
            data-ocid="sudoku.hints_badge"
          >
            <Lightbulb size={12} />
            <span>{hintsRemaining}</span>
            <span className="text-xs font-normal opacity-70">hints</span>
          </span>
        </div>

        {/* Algorithm toggle */}
        <button
          type="button"
          onClick={toggleAlgorithm}
          disabled={isAnimating}
          aria-label={`Switch to ${selectedAlgorithm === "backtracking" ? "Constraint Propagation" : "Backtracking"} algorithm`}
          title={`Algorithm: ${selectedAlgorithm === "backtracking" ? "Backtracking" : "Constraint Propagation"} (click to toggle)`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border hover:border-purple-500/50 hover:bg-purple-500/10 transition-all disabled:opacity-40"
          data-ocid="sudoku.algorithm_toggle"
        >
          <Zap size={12} />
          {selectedAlgorithm === "backtracking" ? "BT" : "CP"}
        </button>
      </div>

      {/* ── Controls Row 1: load presets + upload ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Load:</span>
        {(["easy", "medium", "hard"] as const).map((level) => (
          <button
            type="button"
            key={level}
            onClick={() => loadPreset(level)}
            disabled={isAnimating}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:border-purple-500/50 hover:bg-purple-500/10 transition-all capitalize disabled:opacity-40"
            data-ocid={`sudoku.${level}_button`}
          >
            {level}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="sudoku-image-upload"
          />
          <label
            htmlFor="sudoku-image-upload"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:border-cyan-500/50 hover:bg-cyan-500/10 cursor-pointer transition-all"
            data-ocid="sudoku.upload_button"
          >
            {isOCRing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ImageIcon size={13} />
            )}
            {isOCRing ? "Reading..." : "Upload Image"}
          </label>
        </div>
      </div>

      {/* ── Sudoku Grid ── */}
      <div className="flex justify-center">
        <div
          className="inline-grid gap-0 rounded-xl overflow-hidden border-2 border-border"
          style={{ gridTemplateColumns: "repeat(9, 1fr)" }}
          data-ocid="sudoku.table"
        >
          {displayGrid.map((row, r) =>
            row.map((value, c) => {
              const state = getCellState(r, c);
              const isBorderRight = (c + 1) % 3 === 0 && c < 8;
              const isBorderBottom = (r + 1) % 3 === 0 && r < 8;
              const isRevealed = revealedCells[r]?.[c];

              const bgClass =
                state === "backtracking"
                  ? "dark:bg-red-900/50 bg-red-100"
                  : state === "trying"
                    ? "dark:bg-amber-900/50 bg-amber-50"
                    : state === "hint"
                      ? "dark:bg-green-900/50 bg-green-100"
                      : state === "error"
                        ? "dark:bg-red-900/40 bg-red-50"
                        : state === "given"
                          ? "dark:bg-slate-800/80 bg-slate-100"
                          : state === "solved"
                            ? "dark:bg-cyan-900/20 bg-cyan-50"
                            : state === "user"
                              ? "dark:bg-purple-900/15 bg-purple-50"
                              : "dark:bg-slate-900/50 bg-white hover:dark:bg-slate-800/50 hover:bg-slate-50";

              const textClass =
                state === "backtracking"
                  ? "text-red-400"
                  : state === "trying"
                    ? "text-amber-400"
                    : state === "hint"
                      ? "text-green-500"
                      : state === "error"
                        ? "text-red-500"
                        : state === "given"
                          ? "text-foreground"
                          : state === "solved"
                            ? "text-cyan-500"
                            : state === "user"
                              ? "text-purple-500"
                              : "text-foreground";

              const borderClass = [
                isBorderRight
                  ? "border-r-2 dark:border-r-slate-500 border-r-slate-400"
                  : "border-r dark:border-r-slate-700 border-r-slate-200",
                isBorderBottom
                  ? "border-b-2 dark:border-b-slate-500 border-b-slate-400"
                  : "border-b dark:border-b-slate-700 border-b-slate-200",
              ].join(" ");

              const isEditable =
                state === "empty" || state === "user" || state === "error";
              const displayValue = value === 0 ? "" : String(value);

              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed 9x9 grid
                  key={`${r}-${c}`}
                  className={`relative w-9 h-9 sm:w-10 sm:h-10 ${bgClass} ${borderClass} transition-colors duration-75 overflow-hidden`}
                >
                  {isEditable && !isAnimating ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={displayValue}
                      onChange={(e) => handleCellChange(r, c, e.target.value)}
                      aria-label={`Cell row ${r + 1} column ${c + 1}`}
                      className={`absolute inset-0 w-full h-full text-center text-sm font-bold outline-none bg-transparent ${textClass} focus:dark:bg-purple-900/30 focus:bg-purple-50`}
                      data-ocid="sudoku.input"
                    />
                  ) : (
                    <>
                      {(state === "given" || state === "hint") && (
                        <span
                          className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${textClass}`}
                        >
                          {displayValue}
                        </span>
                      )}

                      {/* Hint flash */}
                      <AnimatePresence>
                        {state === "hint" && (
                          <motion.span
                            // biome-ignore lint/suspicious/noArrayIndexKey: fixed 9x9 grid
                            key={`hint-${r}-${c}`}
                            initial={{ scale: 1.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 20,
                            }}
                            className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${textClass}`}
                          >
                            {displayValue}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Backtracking flash */}
                      <AnimatePresence mode="popLayout">
                        {state === "backtracking" && (
                          <motion.span
                            // biome-ignore lint/suspicious/noArrayIndexKey: fixed 9x9 grid
                            key={`bt-${r}-${c}`}
                            initial={{ scale: 1.3, opacity: 1 }}
                            animate={{ scale: 1, opacity: 0.7 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.12 }}
                            className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${textClass}`}
                          >
                            {displayValue || "✕"}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Trying pulse */}
                      <AnimatePresence mode="popLayout">
                        {state === "trying" && displayValue && (
                          <motion.span
                            key={`try-${r}-${c}-${displayValue}`}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1.1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${textClass}`}
                          >
                            {displayValue}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Non-animated filled cell */}
                      {(state === "user" ||
                        (state === "empty" && isAnimating && displayValue)) && (
                        <span
                          className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${textClass}`}
                        >
                          {displayValue}
                        </span>
                      )}

                      {/* Solved cell reveal */}
                      <AnimatePresence>
                        {state === "solved" && isRevealed && (
                          <motion.span
                            // biome-ignore lint/suspicious/noArrayIndexKey: fixed 9x9 grid
                            key={`solved-${r}-${c}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 20,
                            }}
                            className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${textClass}`}
                          >
                            {displayValue}
                          </motion.span>
                        )}
                        {state === "solved" && !isRevealed && (
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold opacity-0">
                            {displayValue}
                          </span>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {/* ── Progress bar during animation ── */}
      <AnimatePresence>
        {isAnimating && animTotal > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex flex-col gap-1.5"
            data-ocid="sudoku.loading_state"
          >
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Backtracking
                {selectedAlgorithm === "constraint-propagation" && " (CP mode)"}
              </span>
              <span>
                {animProgress.toLocaleString()} / {animTotal.toLocaleString()} (
                {progressPct}%)
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-purple-500"
                initial={{ width: "0%" }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Controls Row 2: clear + speed + hint + solve ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={clearBoard}
          aria-label="Clear board"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-border hover:bg-accent transition-all"
          data-ocid="sudoku.secondary_button"
        >
          <RotateCcw size={14} />
          Clear
        </button>

        {/* Speed selector */}
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          {(["slow", "normal", "fast"] as Speed[]).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setSpeed(s)}
              disabled={isAnimating}
              aria-label={`Set speed to ${s}`}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all disabled:opacity-40 ${
                speed === s
                  ? "bg-purple-600 text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              data-ocid={`sudoku.${s}_button`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Hint button */}
        <button
          type="button"
          onClick={handleUseHint}
          disabled={hintsRemaining <= 0 || isAnimating}
          aria-label={`Use hint (${hintsRemaining} remaining) — Ctrl+H`}
          title="Use hint (Ctrl+H)"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-border hover:border-green-500/50 hover:bg-green-500/10 transition-all disabled:opacity-40"
          data-ocid="sudoku.hint_button"
        >
          <Lightbulb size={14} />
          Hint
          {hintsRemaining > 0 && (
            <span className="ml-0.5 text-xs text-green-500 font-bold">
              ×{hintsRemaining}
            </span>
          )}
        </button>

        {isAnimating ? (
          <button
            type="button"
            onClick={stopAnimation}
            aria-label="Stop solving"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white hover:opacity-90 transition-all"
            data-ocid="sudoku.cancel_button"
          >
            <Square size={14} />
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={solve}
            disabled={isSolving || isOCRing}
            aria-label="Solve Sudoku using backtracking animation"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:opacity-90 transition-all disabled:opacity-50 purple-glow"
            data-ocid="sudoku.primary_button"
          >
            {isSolving && !isAnimating ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Solving...
              </>
            ) : (
              <>
                <Play size={14} /> Solve Sudoku
              </>
            )}
          </button>
        )}
      </div>

      {/* ── Controls Row 3: generator + share ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Difficulty selector for generator */}
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          {(["easy", "medium", "hard"] as SudokuDifficulty[]).map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => setSelectedDifficulty(d)}
              disabled={isAnimating}
              aria-label={`Select ${d} difficulty`}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all disabled:opacity-40 ${
                selectedDifficulty === d
                  ? "bg-cyan-600 text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              data-ocid={`sudoku.diff_${d}_button`}
            >
              {d}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleGeneratePuzzle}
          disabled={isAnimating || isGenerating}
          aria-label="Generate a new Sudoku puzzle"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-border hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all disabled:opacity-40"
          data-ocid="sudoku.generate_button"
        >
          {isGenerating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Generate
        </button>

        <button
          type="button"
          onClick={handleShare}
          aria-label="Copy share link to clipboard — Ctrl+S"
          title="Share puzzle (Ctrl+S)"
          className="share-button flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-border hover:border-purple-500/50 hover:bg-purple-500/10 transition-all"
          data-ocid="sudoku.share_button"
        >
          <Share2 size={14} />
          Share
        </button>

        {/* Keyboard shortcuts hint */}
        <div
          className="ml-auto flex items-center gap-1 text-muted-foreground/60"
          title="Keyboard shortcuts"
        >
          <Keyboard size={11} />
          <span className="kbd-shortcut">Ctrl+H</span>
          <span className="text-xs">hint</span>
          <span className="kbd-shortcut">Ctrl+S</span>
          <span className="text-xs">share</span>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded dark:bg-slate-700 bg-slate-200 border border-border" />
          Given
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-cyan-500/20 border border-cyan-500/30" />
          Solved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/30" />
          User input
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" />
          Trying
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30" />
          Backtrack
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30" />
          Hint
        </span>
        <span className="ml-auto flex items-center gap-1 text-muted-foreground/60">
          <Upload size={11} />
          Upload a sudoku image for auto-fill
        </span>
      </div>
    </motion.div>
  );
}

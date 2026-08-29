import { useCallback, useEffect, useRef, useState } from "react";
import type { SudokuCell, SudokuDifficulty } from "../types/solver-types";
import {
  generateSudokuPuzzle,
  getHint,
  isSudokuComplete,
  validateCell,
} from "../utils/sudoku-generator";

const STORAGE_KEY = "sudoku-state";

const HINTS_BY_DIFFICULTY: Record<SudokuDifficulty, number> = {
  easy: 5,
  medium: 3,
  hard: 1,
};

function makeCellGrid(
  puzzle: number[][],
  solution: number[][],
): SudokuCell[][] {
  return puzzle.map((row, r) =>
    row.map((val, c) => ({
      value: val,
      isGiven: val !== 0,
      isHint: false,
      isError: val !== 0 && val !== solution[r][c],
      notes: new Set<number>(),
    })),
  );
}

interface SavedState {
  puzzle: number[][];
  solution: number[][];
  difficulty: SudokuDifficulty;
  hintsRemaining: number;
  mistakes: number;
  timer: number;
  selectedAlgorithm: "backtracking" | "constraint-propagation";
  cellValues: number[][];
  cellGiven: boolean[][];
  cellHint: boolean[][];
}

export function useSudoku() {
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>("medium");
  const [puzzle, setPuzzle] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [cells, setCells] = useState<SudokuCell[][]>([]);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [mistakes, setMistakes] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<
    "backtracking" | "constraint-propagation"
  >("backtracking");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSolved =
    cells.length === 9 &&
    solution.length === 9 &&
    isSudokuComplete(
      cells.map((row) => row.map((c) => c.value)),
      solution,
    );

  // Timer
  useEffect(() => {
    if (isRunning && !isSolved) {
      intervalRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isSolved]);

  // Auto-save
  useEffect(() => {
    if (cells.length === 0 || puzzle.length === 0) return;
    const state: SavedState = {
      puzzle,
      solution,
      difficulty,
      hintsRemaining,
      mistakes,
      timer,
      selectedAlgorithm,
      cellValues: cells.map((row) => row.map((c) => c.value)),
      cellGiven: cells.map((row) => row.map((c) => c.isGiven)),
      cellHint: cells.map((row) => row.map((c) => c.isHint)),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage errors
    }
  }, [
    cells,
    puzzle,
    solution,
    difficulty,
    hintsRemaining,
    mistakes,
    timer,
    selectedAlgorithm,
  ]);

  // Restore on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedState = JSON.parse(raw);
        setPuzzle(saved.puzzle);
        setSolution(saved.solution);
        setDifficulty(saved.difficulty);
        setHintsRemaining(saved.hintsRemaining);
        setMistakes(saved.mistakes);
        setTimer(saved.timer);
        setSelectedAlgorithm(saved.selectedAlgorithm);

        const restored: SudokuCell[][] = saved.cellValues.map((row, r) =>
          row.map((val, c) => ({
            value: val,
            isGiven: saved.cellGiven[r][c],
            isHint: saved.cellHint[r][c],
            isError: val !== 0 && val !== saved.solution[r][c],
            notes: new Set<number>(),
          })),
        );
        setCells(restored);
        setIsRunning(true);
        return;
      }
    } catch {
      // ignore
    }
    // No saved state — start fresh
    startNewPuzzle("medium");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNewPuzzle = useCallback((diff: SudokuDifficulty) => {
    const { puzzle: p, solution: s } = generateSudokuPuzzle(diff);
    setPuzzle(p);
    setSolution(s);
    setDifficulty(diff);
    setHintsRemaining(HINTS_BY_DIFFICULTY[diff]);
    setMistakes(0);
    setTimer(0);
    setIsRunning(true);
    setCells(makeCellGrid(p, s));
  }, []);

  const useHint = useCallback(() => {
    if (hintsRemaining <= 0 || isSolved) return;
    const currentGrid = cells.map((row) => row.map((c) => c.value));
    const hint = getHint(currentGrid, solution);
    if (!hint) return;

    setHintsRemaining((h) => h - 1);
    setCells((prev) =>
      prev.map((row, r) =>
        row.map((cell, c) => {
          if (r === hint.row && c === hint.col) {
            return { ...cell, value: hint.value, isHint: true, isError: false };
          }
          return cell;
        }),
      ),
    );
  }, [hintsRemaining, isSolved, cells, solution]);

  const setCellValue = useCallback(
    (row: number, col: number, value: number) => {
      if (cells[row]?.[col]?.isGiven || cells[row]?.[col]?.isHint) return;

      const currentGrid = cells.map((r) => r.map((c) => c.value));
      const isValid = validateCell(currentGrid, row, col, value);
      const isCorrect = value === 0 || value === solution[row][col];

      if (value !== 0 && !isCorrect) {
        setMistakes((m) => m + 1);
      }

      setCells((prev) =>
        prev.map((r, ri) =>
          r.map((cell, ci) => {
            if (ri === row && ci === col) {
              return {
                ...cell,
                value,
                isError: value !== 0 && (!isValid || !isCorrect),
              };
            }
            return cell;
          }),
        ),
      );
    },
    [cells, solution],
  );

  const toggleAlgorithm = useCallback(() => {
    setSelectedAlgorithm((alg) =>
      alg === "backtracking" ? "constraint-propagation" : "backtracking",
    );
  }, []);

  return {
    puzzle,
    solution,
    cells,
    difficulty,
    hintsRemaining,
    mistakes,
    timer,
    isRunning,
    selectedAlgorithm,
    isSolved,
    startNewPuzzle,
    useHint,
    setCellValue,
    toggleAlgorithm,
    setIsRunning,
  };
}

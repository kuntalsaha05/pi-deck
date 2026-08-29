import type { SudokuDifficulty } from "../types/solver-types";

export function isValidSudoku(
  grid: number[][],
  row: number,
  col: number,
  num: number,
): boolean {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] === num) return false;
  }
  // Check column
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num) return false;
  }
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[boxRow + r][boxCol + c] === num) return false;
    }
  }
  return true;
}

export function solveSudokuBacktracking(grid: number[][]): number[][] | null {
  const copy = grid.map((row) => [...row]);

  function solve(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (copy[row][col] === 0) {
          // Shuffle candidates for randomness
          const candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(
            () => Math.random() - 0.5,
          );
          for (const num of candidates) {
            if (isValidSudoku(copy, row, col, num)) {
              copy[row][col] = num;
              if (solve()) return true;
              copy[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  return solve() ? copy : null;
}

function countSolutions(grid: number[][], limit = 2): number {
  let count = 0;

  function solve(): void {
    if (count >= limit) return;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValidSudoku(grid, row, col, num)) {
              grid[row][col] = num;
              solve();
              grid[row][col] = 0;
              if (count >= limit) return;
            }
          }
          return;
        }
      }
    }
    count++;
  }

  solve();
  return count;
}

export function removeCells(
  solution: number[][],
  difficulty: SudokuDifficulty,
): number[][] {
  const removeCounts = { easy: 30, medium: 45, hard: 55 };
  const toRemove = removeCounts[difficulty];
  const puzzle = solution.map((row) => [...row]);

  const cells: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      cells.push([r, c]);
    }
  }
  // Shuffle cells
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  let removed = 0;
  for (const [r, c] of cells) {
    if (removed >= toRemove) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;

    const testGrid = puzzle.map((row) => [...row]);
    if (countSolutions(testGrid) === 1) {
      removed++;
    } else {
      puzzle[r][c] = backup;
    }
  }

  return puzzle;
}

export function generateSudokuPuzzle(difficulty: SudokuDifficulty): {
  puzzle: number[][];
  solution: number[][];
} {
  const empty = Array.from({ length: 9 }, () => Array(9).fill(0));
  const solution = solveSudokuBacktracking(empty);
  if (!solution) {
    // Fallback (should never happen)
    return { puzzle: empty, solution: empty };
  }
  const puzzle = removeCells(solution, difficulty);
  return { puzzle, solution };
}

export function getHint(
  puzzle: number[][],
  solution: number[][],
): { row: number; col: number; value: number } | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (puzzle[row][col] !== solution[row][col]) {
        return { row, col, value: solution[row][col] };
      }
    }
  }
  return null;
}

export function validateCell(
  grid: number[][],
  row: number,
  col: number,
  value: number,
): boolean {
  if (value === 0) return true;
  const testGrid = grid.map((r, ri) =>
    r.map((c, ci) => (ri === row && ci === col ? 0 : c)),
  );
  return isValidSudoku(testGrid, row, col, value);
}

export function isSudokuComplete(
  grid: number[][],
  solution: number[][],
): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] !== solution[row][col]) return false;
    }
  }
  return true;
}

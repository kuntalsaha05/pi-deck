import type {
  MazeCell,
  MazeGenerationMethod,
  SudokuDifficulty,
} from "../types/solver-types";

// Simple base64 encoding helpers
function toBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return btoa(str);
  }
}

function fromBase64(str: string): string {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return atob(str);
  }
}

// ─── Sudoku ───────────────────────────────────────────────────────────────────

export function encodeSudokuState(
  puzzle: number[][],
  difficulty: SudokuDifficulty,
): string {
  const flat = puzzle.flat().join("");
  const payload = JSON.stringify({ flat, difficulty });
  return toBase64(payload);
}

export function decodeSudokuState(
  encoded: string,
): { puzzle: number[][]; difficulty: SudokuDifficulty } | null {
  try {
    const payload = fromBase64(encoded);
    const { flat, difficulty } = JSON.parse(payload) as {
      flat: string;
      difficulty: SudokuDifficulty;
    };

    if (flat.length !== 81) return null;

    const puzzle: number[][] = [];
    for (let r = 0; r < 9; r++) {
      puzzle.push(
        flat
          .slice(r * 9, (r + 1) * 9)
          .split("")
          .map(Number),
      );
    }

    return { puzzle, difficulty };
  } catch {
    return null;
  }
}

// ─── Maze ─────────────────────────────────────────────────────────────────────

export function encodeMazeState(
  grid: MazeCell[][],
  generationMethod: MazeGenerationMethod,
): string {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const flat = grid.flat().map((cell) => ({
    t: cell.type,
    w: cell.weight,
    iw: cell.isWeighted,
  }));
  const payload = JSON.stringify({ rows, cols, flat, generationMethod });
  return toBase64(payload);
}

export function decodeMazeState(
  encoded: string,
): { grid: MazeCell[][]; generationMethod: MazeGenerationMethod } | null {
  try {
    const payload = fromBase64(encoded);
    const { rows, cols, flat, generationMethod } = JSON.parse(payload) as {
      rows: number;
      cols: number;
      flat: Array<{ t: string; w: number; iw: boolean }>;
      generationMethod: MazeGenerationMethod;
    };

    const grid: MazeCell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: MazeCell[] = [];
      for (let c = 0; c < cols; c++) {
        const item = flat[r * cols + c];
        row.push({
          type: item.t as MazeCell["type"],
          weight: item.w as MazeCell["weight"],
          isWeighted: item.iw,
        });
      }
      grid.push(row);
    }

    return { grid, generationMethod };
  } catch {
    return null;
  }
}

// ─── URL helpers ─────────────────────────────────────────────────────────────

export function generateShareUrl(
  type: "sudoku" | "maze",
  encoded: string,
): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}?share=${type}&data=${encodeURIComponent(encoded)}`;
}

export function parseShareUrl(): {
  type: "sudoku" | "maze";
  data: string;
} | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const type = params.get("share") as "sudoku" | "maze" | null;
  const data = params.get("data");

  if (!type || !data || (type !== "sudoku" && type !== "maze")) return null;

  return { type, data };
}

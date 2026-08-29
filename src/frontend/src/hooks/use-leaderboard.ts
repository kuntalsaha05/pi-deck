import { useCallback } from "react";
import type {
  LeaderboardEntry,
  MazeScore,
  SudokuScore,
} from "../types/solver-types";

const STORAGE_KEY = "leaderboard-data";

interface LeaderboardData {
  entries: Record<string, Array<Omit<LeaderboardEntry, "rank">>>;
}

function loadData(): LeaderboardData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LeaderboardData;
  } catch {
    // ignore
  }
  return { entries: {} };
}

function saveData(data: LeaderboardData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function getScoreTime(score: SudokuScore | MazeScore): number {
  return score.time;
}

export function useLeaderboard() {
  const getEntries = useCallback((category: string): LeaderboardEntry[] => {
    const data = loadData();
    const raw = data.entries[category] ?? [];
    return raw
      .sort((a, b) => getScoreTime(a.score) - getScoreTime(b.score))
      .slice(0, 10)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  }, []);

  const addEntry = useCallback(
    (
      category: string,
      score: SudokuScore | MazeScore,
    ): { isNewRecord: boolean; rank: number } => {
      const data = loadData();
      if (!data.entries[category]) {
        data.entries[category] = [];
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      data.entries[category].push({ id, category, score });

      // Keep top 50
      data.entries[category] = data.entries[category]
        .sort((a, b) => getScoreTime(a.score) - getScoreTime(b.score))
        .slice(0, 50);

      saveData(data);

      const entries = getEntries(category);
      const rank =
        entries.findIndex((e) => e.score.timestamp === score.timestamp) + 1;
      const isNewRecord = rank === 1;

      return { isNewRecord, rank: rank > 0 ? rank : entries.length };
    },
    [getEntries],
  );

  const clearLeaderboard = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const getAllStats = useCallback(() => {
    const data = loadData();
    let totalSolved = 0;
    let totalTime = 0;
    let totalMistakes = 0;
    let totalHints = 0;

    for (const entries of Object.values(data.entries)) {
      for (const entry of entries) {
        totalSolved++;
        totalTime += entry.score.time;
        if ("mistakes" in entry.score) {
          totalMistakes += (entry.score as SudokuScore).mistakes;
        }
        if ("hintsUsed" in entry.score) {
          totalHints += (entry.score as SudokuScore).hintsUsed;
        }
      }
    }

    return {
      totalSolved,
      avgSolveTime: totalSolved > 0 ? Math.round(totalTime / totalSolved) : 0,
      totalMistakes,
      totalHints,
    };
  }, []);

  return { getEntries, addEntry, clearLeaderboard, getAllStats };
}

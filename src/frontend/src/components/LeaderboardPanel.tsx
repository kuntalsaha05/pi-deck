import { useLeaderboard } from "@/hooks/use-leaderboard";
import type {
  LeaderboardEntry,
  MazeScore,
  SudokuScore,
} from "@/types/solver-types";
import { Trophy, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface LeaderboardPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "rank-badge gold";
  if (rank === 2) return "rank-badge silver";
  if (rank === 3) return "rank-badge bronze";
  return "rank-badge";
}

function SudokuRow({
  entry,
  index,
}: { entry: LeaderboardEntry; index: number }) {
  const score = entry.score as SudokuScore;
  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
    >
      <td className="py-2 px-3 text-center">
        <span className={rankBadgeClass(entry.rank)}>{entry.rank}</span>
      </td>
      <td className="py-2 px-3 font-mono text-sm tabular-nums text-foreground">
        {formatTime(score.time)}
      </td>
      <td className="py-2 px-3 text-sm capitalize text-muted-foreground">
        {score.difficulty}
      </td>
      <td className="py-2 px-3 text-sm text-muted-foreground">
        {score.algorithm}
      </td>
      <td className="py-2 px-3 text-sm text-muted-foreground">
        {formatDate(score.timestamp)}
      </td>
    </motion.tr>
  );
}

function MazeRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const score = entry.score as MazeScore;
  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
    >
      <td className="py-2 px-3 text-center">
        <span className={rankBadgeClass(entry.rank)}>{entry.rank}</span>
      </td>
      <td className="py-2 px-3 font-mono text-sm tabular-nums text-foreground">
        {formatTime(score.time)}
      </td>
      <td className="py-2 px-3 text-sm text-muted-foreground">
        {score.gridSize}×{score.gridSize}
      </td>
      <td className="py-2 px-3 text-sm text-muted-foreground uppercase">
        {score.algorithm}
      </td>
      <td className="py-2 px-3 text-sm text-muted-foreground">
        {formatDate(score.timestamp)}
      </td>
    </motion.tr>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 gap-3 text-center"
      data-ocid="leaderboard.empty"
    >
      <Trophy size={40} className="text-muted-foreground/40" />
      <p className="font-display font-semibold text-muted-foreground">
        No records yet
      </p>
      <p className="text-sm text-muted-foreground/60">
        Complete a puzzle to appear here
      </p>
    </div>
  );
}

export default function LeaderboardPanel({
  isOpen,
  onClose,
}: LeaderboardPanelProps) {
  const [activeTab, setActiveTab] = useState<"sudoku" | "maze">("sudoku");
  const { getEntries, clearLeaderboard, getAllStats } = useLeaderboard();
  const [confirmClear, setConfirmClear] = useState(false);

  const sudokuEntries = getEntries("sudoku");
  const mazeEntries = getEntries("maze");
  const stats = getAllStats();

  const entries = activeTab === "sudoku" ? sudokuEntries : mazeEntries;

  const handleClear = () => {
    if (confirmClear) {
      clearLeaderboard();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
          data-ocid="leaderboard.overlay"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="w-full max-w-xl rounded-2xl dark:glass glass-light shadow-2xl flex flex-col"
            style={{ maxHeight: "85vh" }}
            data-ocid="leaderboard.panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-primary" />
                <h2 className="font-display font-bold text-lg">Leaderboard</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                aria-label="Close leaderboard"
                data-ocid="leaderboard.close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4 shrink-0">
              {(["sudoku", "maze"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                    activeTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  data-ocid={`leaderboard.tab_${tab}`}
                >
                  {tab === "sudoku" ? "🧩" : "🌐"}{" "}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto px-6 pt-3 pb-2 min-h-0">
              {entries.length === 0 ? (
                <EmptyState />
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
                        #
                      </th>
                      <th className="pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Time
                      </th>
                      <th className="pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {activeTab === "sudoku" ? "Difficulty" : "Size"}
                      </th>
                      <th className="pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Algorithm
                      </th>
                      <th className="pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, i) =>
                      activeTab === "sudoku" ? (
                        <SudokuRow key={entry.id} entry={entry} index={i} />
                      ) : (
                        <MazeRow key={entry.id} entry={entry} index={i} />
                      ),
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Personal Stats */}
            <div className="px-6 py-4 border-t border-border shrink-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Personal Stats
              </p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Solved", value: stats.totalSolved },
                  { label: "Avg Time", value: formatTime(stats.avgSolveTime) },
                  { label: "Mistakes", value: stats.totalMistakes },
                  { label: "Hints", value: stats.totalHints },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center p-2 rounded-lg bg-muted/30"
                    data-ocid="leaderboard.stat"
                  >
                    <span className="score-value text-base">{stat.value}</span>
                    <span className="score-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 shrink-0 flex justify-end">
              <button
                type="button"
                onClick={handleClear}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  confirmClear
                    ? "bg-destructive/20 text-destructive border border-destructive/40 hover:bg-destructive/30"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
                data-ocid="leaderboard.clear_all"
              >
                {confirmClear ? "Confirm Clear All" : "Clear All Records"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

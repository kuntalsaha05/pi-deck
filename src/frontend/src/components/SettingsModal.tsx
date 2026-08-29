import { useAppSettings } from "@/hooks/use-app-settings";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { Settings, Volume2, VolumeX, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ThemeOption = "light" | "dark" | "system";

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useAppSettings();
  const { clearLeaderboard } = useLeaderboard();
  const { setTheme } = useTheme();
  const [confirmClearPuzzles, setConfirmClearPuzzles] = useState(false);
  const [confirmClearLeaderboard, setConfirmClearLeaderboard] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync next-themes with settings
  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme, setTheme]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleClearPuzzles = () => {
    if (confirmClearPuzzles) {
      try {
        localStorage.removeItem("sudoku-saved");
        localStorage.removeItem("maze-saved");
      } catch {
        // ignore
      }
      setConfirmClearPuzzles(false);
    } else {
      setConfirmClearPuzzles(true);
      setTimeout(() => setConfirmClearPuzzles(false), 3000);
    }
  };

  const handleClearLeaderboard = () => {
    if (confirmClearLeaderboard) {
      clearLeaderboard();
      setConfirmClearLeaderboard(false);
    } else {
      setConfirmClearLeaderboard(true);
      setTimeout(() => setConfirmClearLeaderboard(false), 3000);
    }
  };

  const themeOptions: { value: ThemeOption; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          data-ocid="settings.overlay"
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-md rounded-2xl dark:glass glass-light shadow-2xl outline-none"
            data-ocid="settings.panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-primary" />
                <h2 className="font-display font-bold text-lg">Settings</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                aria-label="Close settings"
                data-ocid="settings.close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
              {/* Sound & Audio */}
              <section className="settings-group" data-ocid="settings.sound">
                <div className="flex items-center justify-between">
                  <span className="settings-label">Sound &amp; Audio</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateSettings({ soundEnabled: !settings.soundEnabled })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        updateSettings({
                          soundEnabled: !settings.soundEnabled,
                        });
                    }}
                    className={`sound-toggle ${settings.soundEnabled ? "active" : ""}`}
                    aria-label={
                      settings.soundEnabled ? "Disable sound" : "Enable sound"
                    }
                    data-ocid="settings.sound_toggle"
                  />
                </div>
                <div className="flex items-center gap-3">
                  {settings.soundEnabled ? (
                    <Volume2 size={16} className="text-primary shrink-0" />
                  ) : (
                    <VolumeX
                      size={16}
                      className="text-muted-foreground shrink-0"
                    />
                  )}
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.volume}
                    onChange={(e) =>
                      updateSettings({ volume: Number(e.target.value) })
                    }
                    disabled={!settings.soundEnabled}
                    className="settings-slider"
                    aria-label="Volume"
                    data-ocid="settings.volume_slider"
                  />
                  <span className="text-sm font-mono text-muted-foreground w-8 text-right shrink-0">
                    {settings.volume}
                  </span>
                </div>
              </section>

              {/* Animation Speed */}
              <section
                className="settings-group"
                data-ocid="settings.animation"
              >
                <span className="settings-label">Animation Speed</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-6 shrink-0">
                    0.5×
                  </span>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.25}
                    value={settings.animationSpeed}
                    onChange={(e) =>
                      updateSettings({ animationSpeed: Number(e.target.value) })
                    }
                    className="settings-slider"
                    aria-label="Animation speed"
                    data-ocid="settings.speed_slider"
                  />
                  <span className="text-xs text-muted-foreground w-6 shrink-0">
                    2×
                  </span>
                  <span className="text-sm font-mono text-primary font-bold w-8 text-right shrink-0">
                    {settings.animationSpeed}×
                  </span>
                </div>
              </section>

              {/* Theme */}
              <section className="settings-group" data-ocid="settings.theme">
                <span className="settings-label">Theme</span>
                <div className="flex gap-2">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateSettings({ theme: opt.value })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        settings.theme === opt.value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                      data-ocid={`settings.theme_${opt.value}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Data Management */}
              <section className="settings-group" data-ocid="settings.data">
                <span className="settings-label">Data Management</span>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      {confirmClearPuzzles
                        ? "Are you sure? This cannot be undone."
                        : "Remove all saved puzzles"}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearPuzzles}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                        confirmClearPuzzles
                          ? "bg-destructive/20 text-destructive border border-destructive/40 hover:bg-destructive/30"
                          : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                      data-ocid="settings.clear_puzzles"
                    >
                      {confirmClearPuzzles ? "Confirm" : "Clear Puzzles"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      {confirmClearLeaderboard
                        ? "Are you sure? All scores will be lost."
                        : "Remove all leaderboard scores"}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearLeaderboard}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                        confirmClearLeaderboard
                          ? "bg-destructive/20 text-destructive border border-destructive/40 hover:bg-destructive/30"
                          : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                      data-ocid="settings.clear_leaderboard"
                    >
                      {confirmClearLeaderboard
                        ? "Confirm"
                        : "Clear Leaderboard"}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

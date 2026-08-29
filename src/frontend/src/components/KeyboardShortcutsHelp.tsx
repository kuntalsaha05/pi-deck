import { Keyboard, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["Ctrl", "H"], description: "Reveal hint", category: "Sudoku" },
  { keys: ["Ctrl", "S"], description: "Save puzzle", category: "General" },
  { keys: ["Ctrl", "L"], description: "Load puzzle", category: "General" },
  { keys: ["Space"], description: "Play / Pause animation", category: "Maze" },
  { keys: ["?"], description: "Open keyboard shortcuts", category: "General" },
  { keys: ["Esc"], description: "Close any open panel", category: "General" },
];

const CATEGORIES = ["General", "Sudoku", "Maze"] as const;

export default function KeyboardShortcutsHelp({
  isOpen,
  onClose,
}: KeyboardShortcutsHelpProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

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
          data-ocid="shortcuts.overlay"
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-md rounded-2xl dark:glass glass-light shadow-2xl outline-none"
            data-ocid="shortcuts.panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Keyboard size={18} className="text-primary" />
                <h2 className="font-display font-bold text-lg">
                  Keyboard Shortcuts
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                aria-label="Close keyboard shortcuts"
                data-ocid="shortcuts.close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">
              {CATEGORIES.map((cat) => {
                const shortcuts = SHORTCUTS.filter((s) => s.category === cat);
                return (
                  <section
                    key={cat}
                    data-ocid={`shortcuts.section_${cat.toLowerCase()}`}
                  >
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      {cat}
                    </p>
                    <div className="flex flex-col gap-1">
                      {shortcuts.map((shortcut) => (
                        <motion.div
                          key={shortcut.description}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                          data-ocid="shortcuts.row"
                        >
                          <span className="text-sm text-foreground">
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, idx) => (
                              <span key={key}>
                                <kbd className="kbd-shortcut">{key}</kbd>
                                {idx < shortcut.keys.length - 1 && (
                                  <span className="text-muted-foreground/60 text-xs mx-0.5">
                                    +
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="px-6 pb-5">
              <p className="text-xs text-muted-foreground/60 text-center">
                Press <kbd className="kbd-shortcut">?</kbd> anytime to toggle
                this panel
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import type { ReactNode } from "react";
import BottomNav from "./BottomNav";
import StatusBar from "./StatusBar";

interface DeckLayoutProps {
  children: ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

/**
 * DeckLayout — Fixed 1024×600 Android Auto layout for Raspberry Pi touchscreen.
 * StatusBar (44px) → content (flex, fills remaining) → BottomNav (82px)
 */
export default function DeckLayout({
  children,
  activePage,
  onNavigate,
}: DeckLayoutProps) {
  return (
    <div
      className="aa-root"
      style={{ margin: "0 auto" }}
      data-ocid="deck.layout"
    >
      <StatusBar />
      <main
        style={{ flex: 1, display: "flex", minHeight: 0 }}
        data-ocid="deck.content"
      >
        {children}
      </main>
      <BottomNav activePage={activePage} onNavigate={onNavigate} />
    </div>
  );
}

import DeckLayout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import MapsPage from "@/pages/MapsPage";
import MediaPage from "@/pages/MediaPage";
import PhonePage from "@/pages/PhonePage";
import SettingsPage from "@/pages/SettingsPage";
import { useState } from "react";

type Page = "home" | "phone" | "media" | "maps" | "settings";

export default function App() {
  const [activePage, setActivePage] = useState<Page>("home");

  const handleNavigate = (page: string) => {
    if (["home", "phone", "media", "maps", "settings"].includes(page)) {
      setActivePage(page as Page);
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case "home":
        return <HomePage onNavigate={handleNavigate} />;
      case "phone":
        return <PhonePage />;
      case "media":
        return <MediaPage />;
      case "maps":
        return <MapsPage />;
      case "settings":
        return <SettingsPage />;
    }
  };

  return (
    <DeckLayout activePage={activePage} onNavigate={handleNavigate}>
      {renderPage()}
    </DeckLayout>
  );
}

export type WidgetState = "idle" | "active" | "loading" | "error";

export interface Widget {
  id: string;
  label: string;
  icon: string; // lucide-react icon name or emoji fallback
  color?: string; // accent color class or hex
  badge?: number | string;
  state?: WidgetState;
  page?: string; // page key to navigate to
  action?: string; // named action identifier (bound later)
}

export interface NavItem {
  id: string;
  label: string;
  icon: string; // lucide icon name
  page: string;
}

export interface DeckPage {
  id: string;
  title: string;
  widgets: Widget[];
}

export interface NavSection {
  items: NavItem[];
  activeId: string;
}

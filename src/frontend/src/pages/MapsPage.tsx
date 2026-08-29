import {
  AlertTriangle,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crosshair,
  Fuel,
  Gauge,
  MapPin,
  Navigation2,
  Route,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

interface Place {
  name: string;
  address: string;
  eta: string;
  distance: string;
  isFavorite?: boolean;
}

const RECENT_PLACES: Place[] = [
  {
    name: "Home",
    address: "14 Willowbrook Lane",
    eta: "8 min",
    distance: "3.2 km",
    isFavorite: true,
  },
  {
    name: "Work",
    address: "500 Tech Park Blvd",
    eta: "22 min",
    distance: "14.7 km",
    isFavorite: true,
  },
  {
    name: "Supermarket",
    address: "88 Green Valley Rd",
    eta: "5 min",
    distance: "1.8 km",
  },
  {
    name: "Gas Station",
    address: "Corner of Main & 5th",
    eta: "3 min",
    distance: "0.9 km",
  },
  {
    name: "Airport",
    address: "Terminal 3, Int'l",
    eta: "35 min",
    distance: "28.1 km",
  },
];

interface TripStat {
  label: string;
  value: string;
  unit: string;
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  highlight?: boolean;
}

const TRIP_STATS: TripStat[] = [
  { label: "Speed", value: "72", unit: "km/h", Icon: Gauge, highlight: false },
  { label: "ETA", value: "18", unit: "min", Icon: Clock, highlight: true },
  {
    label: "Distance",
    value: "11.4",
    unit: "km",
    Icon: Route,
    highlight: false,
  },
  { label: "Fuel", value: "58", unit: "%", Icon: Fuel, highlight: false },
];

const TURN_INSTRUCTIONS = [
  { direction: "right", street: "Tech Park Blvd", distance: "800 m" },
  { direction: "left", street: "Innovation Ave", distance: "1.2 km" },
];

export default function MapsPage() {
  const [activePlace, setActivePlace] = useState<string | null>("Work");
  const [searchFocused, setSearchFocused] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState(0);

  const instruction = TURN_INSTRUCTIONS[currentInstruction];

  return (
    <div
      className="flex h-full"
      style={{ background: "oklch(var(--streamdeck-bg))" }}
      data-ocid="maps.page"
    >
      {/* ── Left: Map canvas ── */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.17 0.015 250) 0%, oklch(0.12 0.01 250) 100%)",
          borderRight: "1px solid oklch(var(--streamdeck-border))",
        }}
        data-ocid="maps.canvas_target"
      >
        {/* Grid roads background */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 600 500"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          style={{ opacity: 0.12 }}
        >
          {/* Grid lines */}
          {[60, 120, 180, 240, 300, 360, 420, 480, 540].map((v) => (
            <g key={v}>
              <line
                x1={v}
                y1="0"
                x2={v}
                y2="500"
                stroke="white"
                strokeWidth="0.5"
              />
              <line
                x1="0"
                y1={v * 0.833}
                x2="600"
                y2={v * 0.833}
                stroke="white"
                strokeWidth="0.5"
              />
            </g>
          ))}
          {/* Major roads */}
          <line
            x1="100"
            y1="0"
            x2="400"
            y2="500"
            stroke="white"
            strokeWidth="2.5"
          />
          <line
            x1="0"
            y1="180"
            x2="600"
            y2="240"
            stroke="white"
            strokeWidth="2.5"
          />
          <line
            x1="0"
            y1="320"
            x2="600"
            y2="280"
            stroke="white"
            strokeWidth="1.5"
          />
          <line
            x1="480"
            y1="0"
            x2="480"
            y2="500"
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>

        {/* Destination pin */}
        <div
          className="absolute flex flex-col items-center"
          style={{ top: "28%", left: "62%" }}
          data-ocid="maps.map_marker"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: "oklch(0.65 0.22 27)",
              boxShadow: "0 0 16px oklch(0.65 0.22 27 / 0.6)",
            }}
          >
            <MapPin size={16} style={{ color: "white" }} />
          </div>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full mt-1"
            style={{
              background: "oklch(0.65 0.22 27 / 0.15)",
              color: "oklch(0.65 0.22 27)",
              border: "1px solid oklch(0.65 0.22 27 / 0.4)",
            }}
          >
            Work
          </span>
        </div>

        {/* Car position */}
        <div
          className="absolute flex items-center justify-center w-10 h-10 rounded-full"
          style={{
            top: "62%",
            left: "28%",
            background: "oklch(var(--streamdeck-accent))",
            boxShadow: "0 0 20px oklch(var(--streamdeck-accent) / 0.6)",
            border: "2px solid oklch(0.95 0 0 / 0.3)",
          }}
        >
          <Car size={18} style={{ color: "oklch(var(--streamdeck-bg))" }} />
        </div>

        {/* Route path */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 600 500"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {/* Route shadow */}
          <path
            d="M 168 310 C 220 260 280 220 350 170 Q 390 145 372 140"
            stroke="oklch(var(--streamdeck-accent))"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            opacity="0.3"
          />
          {/* Route line */}
          <path
            d="M 168 310 C 220 260 280 220 350 170 Q 390 145 372 140"
            stroke="oklch(var(--streamdeck-accent))"
            strokeWidth="4"
            fill="none"
            strokeDasharray="10 5"
            strokeLinecap="round"
          />
          {/* Turn point */}
          <circle
            cx="280"
            cy="225"
            r="5"
            fill="oklch(var(--streamdeck-accent))"
          />
        </svg>

        {/* Turn instruction overlay */}
        <div
          className="absolute top-3 left-3 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: "oklch(var(--streamdeck-surface) / 0.95)",
            border: "1px solid oklch(var(--streamdeck-border))",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 20px oklch(0 0 0 / 0.4)",
          }}
          data-ocid="maps.turn_instruction"
        >
          {/* Turn arrow */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "oklch(var(--streamdeck-accent) / 0.15)" }}
          >
            {instruction.direction === "right" ? (
              <ChevronRight
                size={24}
                style={{ color: "oklch(var(--streamdeck-accent))" }}
              />
            ) : (
              <ChevronLeft
                size={24}
                style={{ color: "oklch(var(--streamdeck-accent))" }}
              />
            )}
          </div>
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wide leading-none mb-0.5"
              style={{ color: "oklch(var(--streamdeck-accent))" }}
            >
              Turn {instruction.direction}
            </p>
            <p
              className="text-sm font-bold leading-tight"
              style={{ color: "oklch(var(--streamdeck-text-primary))" }}
            >
              {instruction.street}
            </p>
            <p
              className="text-xs"
              style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
            >
              in {instruction.distance}
            </p>
          </div>
          {/* Next instruction chevron */}
          <button
            type="button"
            onClick={() =>
              setCurrentInstruction((v) => (v + 1) % TURN_INSTRUCTIONS.length)
            }
            className="ml-2 shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Next instruction"
            data-ocid="maps.next_instruction_button"
          >
            <ChevronRight
              size={16}
              style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
            />
          </button>
        </div>

        {/* Traffic alert */}
        <div
          className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{
            background: "oklch(0.77 0.15 80 / 0.15)",
            border: "1px solid oklch(0.77 0.15 80 / 0.35)",
            color: "oklch(0.77 0.15 80)",
            backdropFilter: "blur(6px)",
          }}
          data-ocid="maps.traffic_alert"
        >
          <AlertTriangle size={13} />
          Moderate traffic · +4 min
        </div>

        {/* Re-center button */}
        <button
          type="button"
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: "oklch(var(--streamdeck-surface))",
            border: "1px solid oklch(var(--streamdeck-border))",
            color: "oklch(var(--streamdeck-accent))",
          }}
          aria-label="Re-center map"
          data-ocid="maps.recenter_button"
        >
          <Crosshair size={18} />
        </button>

        {/* Speed indicator */}
        <div
          className="absolute top-3 right-3 flex flex-col items-center justify-center w-14 h-14 rounded-full"
          style={{
            background: "oklch(var(--streamdeck-surface) / 0.95)",
            border: "2px solid oklch(var(--streamdeck-border))",
          }}
          data-ocid="maps.speedometer"
        >
          <span
            className="text-lg font-bold tabular-nums leading-none"
            style={{ color: "oklch(var(--streamdeck-text-primary))" }}
          >
            72
          </span>
          <span
            className="text-xs leading-none"
            style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
          >
            km/h
          </span>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div
        className="flex flex-col overflow-y-auto gap-2 py-3"
        style={{ width: 220 }}
        data-ocid="maps.right_panel"
      >
        {/* Search */}
        <div className="px-3">
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
            style={{
              background: searchFocused
                ? "oklch(var(--streamdeck-accent) / 0.08)"
                : "oklch(var(--streamdeck-surface))",
              border: searchFocused
                ? "1px solid oklch(var(--streamdeck-accent) / 0.4)"
                : "1px solid oklch(var(--streamdeck-border))",
            }}
          >
            <Search
              size={14}
              style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
            />
            <input
              type="text"
              placeholder="Search places…"
              className="flex-1 bg-transparent text-xs outline-none"
              style={{ color: "oklch(var(--streamdeck-text-primary))" }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              data-ocid="maps.search_input"
            />
          </div>
        </div>

        {/* Trip stats */}
        <div className="grid grid-cols-2 gap-2 px-3">
          {TRIP_STATS.map(({ label, value, unit, Icon, highlight }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center py-2 rounded-xl"
              style={{
                background: highlight
                  ? "oklch(var(--streamdeck-accent) / 0.12)"
                  : "oklch(var(--streamdeck-surface))",
                border: highlight
                  ? "1px solid oklch(var(--streamdeck-accent) / 0.3)"
                  : "1px solid oklch(var(--streamdeck-border))",
              }}
              data-ocid={`maps.stat_${label.toLowerCase()}`}
            >
              <Icon
                size={13}
                style={{
                  color: highlight
                    ? "oklch(var(--streamdeck-accent))"
                    : "oklch(var(--streamdeck-text-secondary))",
                  marginBottom: 2,
                }}
              />
              <span
                className="text-base font-bold tabular-nums leading-none"
                style={{
                  color: highlight
                    ? "oklch(var(--streamdeck-accent))"
                    : "oklch(var(--streamdeck-text-primary))",
                }}
              >
                {value}
              </span>
              <span
                className="text-xs leading-none mt-0.5"
                style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
              >
                {unit}
              </span>
            </div>
          ))}
        </div>

        {/* Navigate CTA */}
        <div className="px-3">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{
              background: "oklch(var(--streamdeck-accent))",
              color: "oklch(var(--streamdeck-bg))",
              boxShadow: "0 0 16px oklch(var(--streamdeck-accent) / 0.3)",
            }}
            data-ocid="maps.navigate_button"
          >
            <Navigation2 size={16} />
            Navigate
          </button>
        </div>

        {/* Recent places */}
        <p
          className="text-xs font-bold uppercase tracking-widest px-4 mt-1"
          style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
        >
          Recents
        </p>

        <div className="flex flex-col gap-1 px-2 pb-2">
          {RECENT_PLACES.map((place, i) => {
            const isActive = activePlace === place.name;
            return (
              <button
                key={place.name}
                type="button"
                onClick={() => setActivePlace(place.name)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all active:scale-[0.98]"
                style={{
                  background: isActive
                    ? "oklch(var(--streamdeck-accent) / 0.12)"
                    : "oklch(var(--streamdeck-surface))",
                  border: isActive
                    ? "1px solid oklch(var(--streamdeck-accent) / 0.3)"
                    : "1px solid oklch(var(--streamdeck-border))",
                }}
                data-ocid={`maps.recent.${i + 1}`}
              >
                {place.isFavorite ? (
                  <Star
                    size={12}
                    fill="currentColor"
                    style={{
                      color: "oklch(var(--streamdeck-accent))",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <TrendingUp
                    size={12}
                    style={{
                      color: "oklch(var(--streamdeck-text-secondary))",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-semibold truncate"
                    style={{ color: "oklch(var(--streamdeck-text-primary))" }}
                  >
                    {place.name}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
                  >
                    {place.eta} · {place.distance}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

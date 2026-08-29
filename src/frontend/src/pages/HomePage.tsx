import { CornerUpLeft, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ── Dark isometric-style map SVG ──────────────────────────────────────────────
function MapSVG() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 660 430"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Deep dark blue map base */}
      <rect width="660" height="430" fill="#12192b" />

      {/* City block grid — major roads (wider, slightly lighter) */}
      {/* Horizontals */}
      <line x1="0" y1="80" x2="660" y2="80" stroke="#1e2d45" strokeWidth="16" />
      <line
        x1="0"
        y1="160"
        x2="660"
        y2="160"
        stroke="#1e2d45"
        strokeWidth="10"
      />
      <line
        x1="0"
        y1="230"
        x2="660"
        y2="230"
        stroke="#253448"
        strokeWidth="18"
      />
      <line
        x1="0"
        y1="310"
        x2="660"
        y2="310"
        stroke="#1e2d45"
        strokeWidth="10"
      />
      <line
        x1="0"
        y1="380"
        x2="660"
        y2="380"
        stroke="#1e2d45"
        strokeWidth="10"
      />
      {/* Verticals */}
      <line x1="90" y1="0" x2="90" y2="430" stroke="#1e2d45" strokeWidth="10" />
      <line
        x1="180"
        y1="0"
        x2="180"
        y2="430"
        stroke="#253448"
        strokeWidth="16"
      />
      <line
        x1="270"
        y1="0"
        x2="270"
        y2="430"
        stroke="#1e2d45"
        strokeWidth="10"
      />
      <line
        x1="360"
        y1="0"
        x2="360"
        y2="430"
        stroke="#1e2d45"
        strokeWidth="10"
      />
      <line
        x1="450"
        y1="0"
        x2="450"
        y2="430"
        stroke="#253448"
        strokeWidth="14"
      />
      <line
        x1="540"
        y1="0"
        x2="540"
        y2="430"
        stroke="#1e2d45"
        strokeWidth="10"
      />
      <line
        x1="630"
        y1="0"
        x2="630"
        y2="430"
        stroke="#1e2d45"
        strokeWidth="8"
      />
      {/* Minor streets */}
      <line x1="0" y1="40" x2="660" y2="40" stroke="#182035" strokeWidth="5" />
      <line
        x1="0"
        y1="120"
        x2="660"
        y2="120"
        stroke="#182035"
        strokeWidth="5"
      />
      <line
        x1="0"
        y1="195"
        x2="660"
        y2="195"
        stroke="#182035"
        strokeWidth="5"
      />
      <line
        x1="0"
        y1="270"
        x2="660"
        y2="270"
        stroke="#182035"
        strokeWidth="5"
      />
      <line
        x1="0"
        y1="345"
        x2="660"
        y2="345"
        stroke="#182035"
        strokeWidth="5"
      />
      <line x1="45" y1="0" x2="45" y2="430" stroke="#182035" strokeWidth="5" />
      <line
        x1="135"
        y1="0"
        x2="135"
        y2="430"
        stroke="#182035"
        strokeWidth="5"
      />
      <line
        x1="225"
        y1="0"
        x2="225"
        y2="430"
        stroke="#182035"
        strokeWidth="5"
      />
      <line
        x1="315"
        y1="0"
        x2="315"
        y2="430"
        stroke="#182035"
        strokeWidth="5"
      />
      <line
        x1="405"
        y1="0"
        x2="405"
        y2="430"
        stroke="#182035"
        strokeWidth="5"
      />
      <line
        x1="495"
        y1="0"
        x2="495"
        y2="430"
        stroke="#182035"
        strokeWidth="5"
      />
      <line
        x1="585"
        y1="0"
        x2="585"
        y2="430"
        stroke="#182035"
        strokeWidth="5"
      />

      {/* Building blocks — city buildings in dark teal-grey */}
      {[
        [10, 10, 70, 60],
        [100, 10, 70, 60],
        [190, 10, 70, 60],
        [280, 10, 70, 60],
        [370, 10, 70, 60],
        [460, 10, 70, 60],
        [550, 10, 70, 60],
        [10, 90, 70, 60],
        [100, 90, 70, 60],
        [280, 90, 70, 60],
        [370, 90, 70, 60],
        [460, 90, 70, 60],
        [550, 90, 70, 60],
        [10, 170, 70, 50],
        [100, 170, 70, 50],
        [190, 170, 70, 50],
        [370, 170, 70, 50],
        [460, 170, 70, 50],
        [550, 170, 70, 50],
        [10, 240, 70, 60],
        [100, 240, 70, 60],
        [190, 240, 70, 60],
        [280, 240, 70, 60],
        [460, 240, 70, 60],
        [550, 240, 70, 60],
        [10, 320, 70, 50],
        [190, 320, 70, 50],
        [280, 320, 70, 50],
        [370, 320, 70, 50],
        [460, 320, 70, 50],
        [550, 320, 70, 50],
        [10, 390, 70, 34],
        [100, 390, 70, 34],
        [190, 390, 70, 34],
        [280, 390, 70, 34],
        [370, 390, 70, 34],
        [550, 390, 70, 34],
      ].map(([x, y, w, h], i) => (
        <rect
          key={`blk-${x}-${y}`}
          x={x}
          y={y}
          width={w}
          height={h}
          fill={i % 5 === 0 ? "#1a2a40" : i % 3 === 0 ? "#172339" : "#16203a"}
          rx="2"
        />
      ))}

      {/* Park blocks (teal/dark green) */}
      <rect x="190" y="90" width="70" height="60" fill="#0d2a1c" rx="2" />
      <rect x="370" y="320" width="70" height="50" fill="#0d2a1c" rx="2" />

      {/* Teal route line — highlighted path going up */}
      {/* Shadow/glow first */}
      <polyline
        points="330,430 330,230 180,230 180,0"
        fill="none"
        stroke="#00bcd4"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.25"
      />
      {/* Main route */}
      <polyline
        points="330,430 330,230 180,230 180,0"
        fill="none"
        stroke="#00bcd4"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Animated dash overlay on route */}
      <polyline
        points="330,430 330,230 180,230 180,0"
        fill="none"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="10 16"
        strokeLinejoin="round"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-52"
          dur="1s"
          repeatCount="indefinite"
        />
      </polyline>

      {/* Car position marker at route center */}
      <g transform="translate(330, 280)">
        {/* Outer glow ring */}
        <circle r="22" fill="rgba(0,140,180,0.15)" />
        <circle r="18" fill="rgba(100,170,220,0.2)" />
        {/* Dark bg circle */}
        <circle r="14" fill="#1c2e4a" />
        {/* Arrow/car indicator */}
        <polygon points="0,-8 6,5 0,2 -6,5" fill="#a0c8e0" />
      </g>
    </svg>
  );
}

// ── Direction banner (green card, top of map) ─────────────────────────────────
function DirectionBanner() {
  return (
    <div
      className="absolute z-10"
      style={{
        top: 10,
        left: 10,
        right: 10,
        background: "#388e3c",
        borderRadius: 14,
        padding: "12px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
      data-ocid="home.direction_banner"
    >
      {/* Turn arrow icon */}
      <div
        style={{
          width: 52,
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <CornerUpLeft size={38} color="white" strokeWidth={2.5} />
      </div>

      {/* Time + street name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.1,
          }}
        >
          37 min
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 400,
            color: "rgba(255,255,255,0.9)",
            lineHeight: 1.2,
            marginTop: 2,
          }}
        >
          Street Porated Rd
        </div>
      </div>
    </div>
  );
}

// ── ETA strip (bottom of map) ─────────────────────────────────────────────────
function EtaStrip() {
  return (
    <div
      className="absolute z-10"
      style={{
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(18,20,28,0.88)",
        borderRadius: "0 0 14px 14px",
        padding: "11px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
      data-ocid="home.eta_strip"
    >
      <span style={{ fontSize: 16, fontWeight: 500, color: "#e0e0e0" }}>
        ETA 2:59
      </span>
      <span style={{ fontSize: 18, color: "#555", fontWeight: 300 }}>·</span>
      <span style={{ fontSize: 16, fontWeight: 500, color: "#e0e0e0" }}>
        03 min
      </span>
      <span style={{ fontSize: 18, color: "#555", fontWeight: 300 }}>·</span>
      <span style={{ fontSize: 16, fontWeight: 500, color: "#e0e0e0" }}>
        54.1 km
      </span>
    </div>
  );
}

// ── Album art — Nirvana-style warm square ─────────────────────────────────────
function NirvanaArt({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      style={{ borderRadius: 8, flexShrink: 0, display: "block" }}
      role="img"
      aria-label="Don't Haan album art"
    >
      {/* Warm sandy/golden background */}
      <rect width="160" height="160" fill="#c4975a" />
      {/* Top texture bands */}
      <rect x="0" y="0" width="160" height="30" fill="#b8863e" opacity="0.6" />
      {/* Abstract figure shape (Nirvana-like) */}
      <ellipse cx="80" cy="72" rx="28" ry="35" fill="#e8c980" />
      <ellipse cx="80" cy="52" rx="16" ry="18" fill="#d4a84b" />
      {/* Wings / spread arms */}
      <path d="M52 75 Q30 60 10 75 Q30 90 52 80Z" fill="#d4b060" />
      <path d="M108 75 Q130 60 150 75 Q130 90 108 80Z" fill="#d4b060" />
      {/* Body */}
      <rect x="68" y="90" width="24" height="40" rx="12" fill="#c49040" />
      {/* Small text at bottom */}
      <rect
        x="20"
        y="138"
        width="120"
        height="14"
        rx="3"
        fill="#a06820"
        opacity="0.7"
      />
      <text
        x="80"
        y="149"
        textAnchor="middle"
        fill="#f5dfa0"
        fontSize="9"
        fontWeight="600"
        letterSpacing="2"
      >
        IL NANGG
      </text>
      {/* Top label */}
      <text
        x="80"
        y="22"
        textAnchor="middle"
        fill="#f5dfa0"
        fontSize="10"
        fontWeight="700"
        letterSpacing="3"
      >
        NIRVANA
      </text>
    </svg>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full">
      <div
        style={{
          width: "100%",
          height: 4,
          background: "#3a3a3c",
          borderRadius: 2,
          position: "relative",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#9e9e9e",
            borderRadius: 2,
          }}
        />
        {/* Thumb */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${progress}%`,
            transform: "translate(-50%, -50%)",
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#e0e0e0",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 5,
          fontSize: 13,
          color: "#9e9e9e",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span>0:21</span>
        <span>3:43</span>
      </div>
    </div>
  );
}

// ── Media panel ───────────────────────────────────────────────────────────────
function MediaPanel() {
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(9.5); // ~0:21 of 3:43
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(
        () => setProgress((p) => (p >= 100 ? 0 : p + 0.05)),
        200,
      );
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing]);

  return (
    <div className="aa-media" style={{ gap: 0 }} data-ocid="home.media_panel">
      {/* Song title + artist */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
          data-ocid="home.song_title"
        >
          Don't Haan
        </div>
        <div
          style={{
            fontSize: 14,
            color: "#9e9e9e",
            marginTop: 3,
            lineHeight: 1.3,
          }}
          data-ocid="home.song_artist"
        >
          Mahay Googin · Dhnyshow...
        </div>
      </div>

      {/* Album art — takes most of the space */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
        }}
      >
        <NirvanaArt size={150} />
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 14 }} data-ocid="home.progress_bar">
        <ProgressBar progress={progress} />
      </div>

      {/* Playback controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginTop: 12,
        }}
        data-ocid="home.media_controls"
      >
        {/* Prev */}
        <button
          type="button"
          aria-label="Previous"
          data-ocid="home.prev_button"
          className="aa-ctrl"
          style={{ width: 48, height: 48 }}
        >
          <SkipBack size={28} color="white" strokeWidth={2} />
        </button>

        {/* Play/Pause — large circle */}
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          data-ocid="home.play_pause_button"
          className="aa-ctrl-play"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? (
            <Pause size={32} color="white" strokeWidth={2.5} />
          ) : (
            <Play size={32} color="white" strokeWidth={2.5} />
          )}
        </button>

        {/* Next */}
        <button
          type="button"
          aria-label="Next"
          data-ocid="home.next_button"
          className="aa-ctrl"
          style={{ width: 48, height: 48 }}
        >
          <SkipForward size={28} color="white" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
interface HomePageProps {
  onNavigate?: (page: string) => void;
}

export default function HomePage({ onNavigate: _onNavigate }: HomePageProps) {
  return (
    <div className="aa-content" data-ocid="home.page">
      {/* Map Panel */}
      <div className="aa-map" data-ocid="home.map_panel">
        <MapSVG />
        <DirectionBanner />
        <EtaStrip />
      </div>

      {/* Media Panel */}
      <MediaPanel />
    </div>
  );
}

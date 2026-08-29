import { Home, MessageSquare, Mic, Phone, PlayCircle } from "lucide-react";
import { useState } from "react";

// Google Maps-style colored icon
function MapsIcon() {
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <rect width="28" height="28" rx="6" fill="white" />
      <rect x="0" y="0" width="14" height="14" rx="6" fill="#4285F4" />
      <rect x="14" y="0" width="14" height="14" fill="#34A853" />
      <rect x="0" y="14" width="14" height="14" fill="#FBBC04" />
      <rect x="14" y="14" width="14" height="14" rx="6" fill="#EA4335" />
      <circle cx="14" cy="11" r="3" fill="white" />
      <path
        d="M14 14 L14 20"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Navigation compass icon
function NavCompassIcon({
  size = 26,
  color = "white",
}: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="13" cy="13" r="11" stroke={color} strokeWidth="2" />
      <polygon points="13,4 16,13 13,11 10,13" fill={color} />
      <polygon points="13,22 16,13 13,15 10,13" fill={color} opacity="0.5" />
    </svg>
  );
}

interface NavBtnProps {
  label: string;
  icon: React.ReactNode;
  page?: string;
  isActive?: boolean;
  isMic?: boolean;
  onNavigate?: (page: string) => void;
}

function NavBtn({
  label,
  icon,
  page,
  isActive,
  isMic,
  onNavigate,
}: NavBtnProps) {
  const [pressed, setPressed] = useState(false);

  if (isMic) {
    return (
      <button
        type="button"
        aria-label="Voice Assistant"
        data-ocid="bottomnav.mic_button"
        className="aa-micbtn"
        style={{ transform: pressed ? "scale(0.91)" : "scale(1)" }}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
      >
        {icon}
        <span style={{ fontSize: 11, color: "white", fontWeight: 500 }}>
          Assistant
        </span>
      </button>
    );
  }

  const bg = isActive ? "#1a4fa8" : "#2a2a2d";

  return (
    <button
      type="button"
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      data-ocid={`bottomnav.${page ?? label.toLowerCase()}_tab`}
      className="aa-navbtn"
      style={{
        background: bg,
        transform: pressed ? "scale(0.92)" : "scale(1)",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => {
        setPressed(false);
        if (page && onNavigate) onNavigate(page);
      }}
      onPointerLeave={() => setPressed(false)}
    >
      <div style={{ color: "white" }}>{icon}</div>
      <span className="aa-navlabel">{label}</span>
    </button>
  );
}

interface BottomNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  return (
    <nav
      className="aa-navbar"
      data-ocid="bottomnav.panel"
      aria-label="Main navigation"
    >
      <NavBtn
        label="Phone"
        icon={<Phone size={24} strokeWidth={1.8} />}
        page="phone"
        isActive={activePage === "phone"}
        onNavigate={onNavigate}
      />
      <NavBtn
        label="Messages"
        icon={<MessageSquare size={24} strokeWidth={1.8} />}
        page="settings"
        isActive={activePage === "settings"}
        onNavigate={onNavigate}
      />
      <NavBtn
        label="Media"
        icon={<PlayCircle size={24} strokeWidth={1.8} />}
        page="media"
        isActive={activePage === "media"}
        onNavigate={onNavigate}
      />

      {/* Center MIC button */}
      <NavBtn
        label="Assistant"
        icon={<Mic size={28} strokeWidth={2} />}
        isMic
      />

      <NavBtn
        label="Home"
        icon={<Home size={24} strokeWidth={1.8} />}
        page="home"
        isActive={activePage === "home"}
        onNavigate={onNavigate}
      />
      <NavBtn
        label="Home"
        icon={<NavCompassIcon size={24} />}
        page="maps"
        isActive={false}
        onNavigate={onNavigate}
      />
      <NavBtn
        label="Maps"
        icon={<MapsIcon />}
        page="maps"
        isActive={activePage === "maps"}
        onNavigate={onNavigate}
      />
    </nav>
  );
}

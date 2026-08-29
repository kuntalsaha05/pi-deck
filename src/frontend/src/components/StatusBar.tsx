import { useClock } from "@/hooks/use-clock";
import { Bell } from "lucide-react";

// WiFi triangle icon matching Android Auto style
function WifiIcon() {
  return (
    <svg
      width="20"
      height="16"
      viewBox="0 0 20 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 12.5 L10 12.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M7 9.5 Q10 7 13 9.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M4.5 7 Q10 3 15.5 7"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M2 4.5 Q10 -1 18 4.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// Signal bars icon matching Android Auto
function SignalIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <rect x="0" y="10" width="3" height="6" rx="0.5" fill="white" />
      <rect x="4.5" y="7" width="3" height="9" rx="0.5" fill="white" />
      <rect x="9" y="4" width="3" height="12" rx="0.5" fill="white" />
      <rect x="13.5" y="1" width="3" height="15" rx="0.5" fill="white" />
    </svg>
  );
}

// Battery icon
function BatteryIcon() {
  return (
    <svg
      width="22"
      height="14"
      viewBox="0 0 22 14"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="0.5"
        y="1.5"
        width="18"
        height="11"
        rx="2"
        stroke="white"
        strokeWidth="1.5"
      />
      <rect x="2" y="3" width="13" height="8" rx="1" fill="white" />
      <path d="M19.5 5 L19.5 9 Q21.5 8 21.5 7 Q21.5 6 19.5 5Z" fill="white" />
    </svg>
  );
}

// Temperature icon
function TempIcon() {
  return (
    <svg
      width="14"
      height="16"
      viewBox="0 0 14 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="7" cy="12" r="3.5" fill="white" />
      <rect x="6" y="1" width="2" height="9" rx="1" fill="white" />
    </svg>
  );
}

export default function StatusBar() {
  const { seconds, hours, minutes } = useClock();

  // Format as HH:MM:SS in 24-hour format
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const timeDisplay = `${hh}:${mm}:${ss}`;

  return (
    <div className="aa-statusbar" data-ocid="statusbar.panel">
      {/* Left: Clock + bell */}
      <div className="flex items-center gap-3" data-ocid="statusbar.left">
        <span
          className="font-mono font-bold"
          style={{ fontSize: 20, color: "#ffffff", letterSpacing: "0.04em" }}
          data-ocid="statusbar.clock"
        >
          {timeDisplay}
        </span>
        <div className="relative" data-ocid="statusbar.notifications">
          <Bell size={18} color="#ffffff" strokeWidth={1.8} />
        </div>
      </div>

      {/* Right: temp + wifi + signal + battery */}
      <div className="flex items-center gap-3" data-ocid="statusbar.right">
        <div className="flex items-center gap-1">
          <TempIcon />
          <span style={{ fontSize: 14, color: "#ffffff", fontWeight: 500 }}>
            28°
          </span>
        </div>
        <WifiIcon />
        <SignalIcon />
        <BatteryIcon />
      </div>
    </div>
  );
}

import {
  Bell,
  Bluetooth,
  ChevronRight,
  Cpu,
  type LucideProps,
  Maximize2,
  Minimize2,
  Monitor,
  Moon,
  Server,
  Shield,
  Smartphone,
  Sun,
  Terminal,
  ThermometerSun,
  Volume2,
  Wifi,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useState } from "react";

// --- Persisted settings hook ---
function useSetting<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`deck_setting_${key}`);
      return stored !== null ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  const set = (v: T) => {
    setValue(v);
    try {
      localStorage.setItem(`deck_setting_${key}`, JSON.stringify(v));
    } catch {
      // ignore
    }
  };

  return [value, set];
}

// --- Toggle component ---
interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  id: string;
}

function Toggle({ value, onChange, id }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="relative inline-flex items-center rounded-full transition-all duration-200"
      style={{
        width: 48,
        height: 26,
        background: value
          ? "oklch(var(--streamdeck-accent))"
          : "oklch(var(--streamdeck-border))",
        flexShrink: 0,
        boxShadow: value
          ? "0 0 10px oklch(var(--streamdeck-accent) / 0.3)"
          : "none",
      }}
      data-ocid={`settings.${id}_switch`}
    >
      <span
        className="absolute rounded-full transition-transform duration-200"
        style={{
          width: 20,
          height: 20,
          background: "oklch(0.98 0 0)",
          transform: value ? "translateX(24px)" : "translateX(3px)",
          boxShadow: "0 1px 4px oklch(0 0 0 / 0.3)",
        }}
      />
    </button>
  );
}

// --- Slider component ---
interface SliderRowProps {
  label: string;
  icon: React.ComponentType<LucideProps>;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit: string;
  id: string;
}

function SliderRow({
  label,
  icon: Icon,
  value,
  onChange,
  min = 0,
  max = 100,
  unit,
  id,
}: SliderRowProps) {
  return (
    <div className="flex items-center gap-3">
      <Icon
        size={16}
        style={{ color: "oklch(var(--streamdeck-accent))", flexShrink: 0 }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-semibold"
            style={{ color: "oklch(var(--streamdeck-text-primary))" }}
          >
            {label}
          </span>
          <span
            className="text-xs tabular-nums"
            style={{ color: "oklch(var(--streamdeck-accent))" }}
          >
            {value}
            {unit}
          </span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, oklch(var(--streamdeck-accent)) ${((value - min) / (max - min)) * 100}%, oklch(var(--streamdeck-border)) ${((value - min) / (max - min)) * 100}%)`,
          }}
          aria-label={label}
          data-ocid={`settings.${id}_slider`}
        />
      </div>
    </div>
  );
}

// --- Section card ---
function SettingsCard({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="text-xs font-bold uppercase tracking-widest mb-2 px-1"
        style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
      >
        {title}
      </p>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "oklch(var(--streamdeck-surface))",
          border: "1px solid oklch(var(--streamdeck-border))",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SettingsRow({
  label,
  icon: Icon,
  rightElement,
  onClick,
  id,
}: {
  label: string;
  icon: React.ComponentType<LucideProps>;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  id: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-all"
      style={{ borderColor: "oklch(var(--streamdeck-border))" }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter") onClick();
            }
          : undefined
      }
      data-ocid={`settings.row.${id}`}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "oklch(var(--streamdeck-accent) / 0.12)" }}
      >
        <Icon size={16} style={{ color: "oklch(var(--streamdeck-accent))" }} />
      </div>
      <span
        className="flex-1 text-sm font-semibold"
        style={{ color: "oklch(var(--streamdeck-text-primary))" }}
      >
        {label}
      </span>
      {rightElement ??
        (onClick ? (
          <ChevronRight
            size={14}
            style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
          />
        ) : null)}
    </div>
  );
}

type GridCols = 2 | 3 | 4;
type FontSize = "small" | "medium" | "large";

export default function SettingsPage() {
  // Persisted settings
  const [darkMode, setDarkMode] = useSetting("dark_mode", true);
  const [wifi, setWifi] = useSetting("wifi", true);
  const [bluetooth, setBluetooth] = useSetting("bluetooth", true);
  const [notifications, setNotifications] = useSetting("notifications", true);
  const [notifSound, setNotifSound] = useSetting("notif_sound", true);
  const [volume, setVolume] = useSetting("volume", 72);
  const [brightness, setBrightness] = useSetting("brightness", 85);
  const [gridCols, setGridCols] = useSetting<GridCols>("grid_cols", 4);
  const [fontSize, setFontSize] = useSetting<FontSize>("font_size", "medium");
  const [nightMode, setNightMode] = useSetting("night_mode", false);

  // Simulate save confirmation
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 1500);
      return () => clearTimeout(t);
    }
  }, [saved]);

  const DEVICE_INFO = [
    { label: "Device", value: "Raspberry Pi 5", Icon: Smartphone },
    { label: "Resolution", value: "1024 × 600", Icon: Monitor },
    { label: "CPU Temp", value: "42°C", Icon: ThermometerSun },
    { label: "Memory", value: "4 GB RAM", Icon: Cpu },
    { label: "Hostname", value: "streamdeck-pi", Icon: Server },
    { label: "OS", value: "Raspberry Pi OS", Icon: Terminal },
    { label: "Version", value: "v1.0.0", Icon: Shield },
  ];

  const fontSizeOptions: FontSize[] = ["small", "medium", "large"];

  return (
    <div
      className="flex h-full"
      style={{ background: "oklch(var(--streamdeck-bg))" }}
      data-ocid="settings.page"
    >
      {/* ── Left: Controls ── */}
      <div
        className="flex flex-col w-[55%] py-4 px-4 gap-4 border-r overflow-y-auto"
        style={{ borderColor: "oklch(var(--streamdeck-border))" }}
      >
        {/* Display */}
        <SettingsCard title="Display">
          <SettingsRow
            label="Dark Mode"
            icon={Moon}
            id="dark_mode"
            rightElement={
              <Toggle value={darkMode} onChange={setDarkMode} id="dark_mode" />
            }
          />
          <SettingsRow
            label="Night Mode"
            icon={Sun}
            id="night_mode"
            rightElement={
              <Toggle
                value={nightMode}
                onChange={setNightMode}
                id="night_mode"
              />
            }
          />
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: "oklch(var(--streamdeck-border))" }}
          >
            <SliderRow
              label="Brightness"
              icon={Monitor}
              value={brightness}
              onChange={setBrightness}
              unit="%"
              id="brightness"
            />
          </div>
          {/* Font size */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "oklch(var(--streamdeck-accent) / 0.12)" }}
              >
                <ZoomIn
                  size={16}
                  style={{ color: "oklch(var(--streamdeck-accent))" }}
                />
              </div>
              <span
                className="flex-1 text-sm font-semibold"
                style={{ color: "oklch(var(--streamdeck-text-primary))" }}
              >
                Font Size
              </span>
              <div className="flex gap-1">
                {fontSizeOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFontSize(opt)}
                    className="px-2 py-1 rounded-lg text-xs font-semibold transition-all capitalize"
                    style={{
                      background:
                        fontSize === opt
                          ? "oklch(var(--streamdeck-accent))"
                          : "oklch(var(--streamdeck-bg))",
                      color:
                        fontSize === opt
                          ? "oklch(var(--streamdeck-bg))"
                          : "oklch(var(--streamdeck-text-secondary))",
                      border: "1px solid oklch(var(--streamdeck-border))",
                    }}
                    data-ocid={`settings.font_size_${opt}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SettingsCard>

        {/* Sound */}
        <SettingsCard title="Sound">
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: "oklch(var(--streamdeck-border))" }}
          >
            <SliderRow
              label="Volume"
              icon={Volume2}
              value={volume}
              onChange={setVolume}
              unit="%"
              id="volume"
            />
          </div>
          <SettingsRow
            label="Notification Sounds"
            icon={Bell}
            id="notif_sound"
            rightElement={
              <Toggle
                value={notifSound}
                onChange={setNotifSound}
                id="notif_sound"
              />
            }
          />
        </SettingsCard>

        {/* Layout */}
        <SettingsCard title="Layout">
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: "oklch(var(--streamdeck-border))" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "oklch(var(--streamdeck-accent) / 0.12)" }}
              >
                <Maximize2
                  size={16}
                  style={{ color: "oklch(var(--streamdeck-accent))" }}
                />
              </div>
              <span
                className="flex-1 text-sm font-semibold"
                style={{ color: "oklch(var(--streamdeck-text-primary))" }}
              >
                Grid Columns
              </span>
              <div className="flex gap-1">
                {([2, 3, 4] as GridCols[]).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setGridCols(col)}
                    className="w-8 h-8 rounded-lg text-sm font-bold transition-all"
                    style={{
                      background:
                        gridCols === col
                          ? "oklch(var(--streamdeck-accent))"
                          : "oklch(var(--streamdeck-bg))",
                      color:
                        gridCols === col
                          ? "oklch(var(--streamdeck-bg))"
                          : "oklch(var(--streamdeck-text-secondary))",
                      border: "1px solid oklch(var(--streamdeck-border))",
                    }}
                    data-ocid={`settings.grid_cols_${col}`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "oklch(var(--streamdeck-accent) / 0.12)" }}
              >
                <Minimize2
                  size={16}
                  style={{ color: "oklch(var(--streamdeck-accent))" }}
                />
              </div>
              <span
                className="flex-1 text-sm font-semibold"
                style={{ color: "oklch(var(--streamdeck-text-primary))" }}
              >
                Widget Size
              </span>
              <div className="flex gap-1">
                {(["S", "M", "L"] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background:
                        sz === "M"
                          ? "oklch(var(--streamdeck-accent))"
                          : "oklch(var(--streamdeck-bg))",
                      color:
                        sz === "M"
                          ? "oklch(var(--streamdeck-bg))"
                          : "oklch(var(--streamdeck-text-secondary))",
                      border: "1px solid oklch(var(--streamdeck-border))",
                    }}
                    data-ocid={`settings.widget_size_${sz}`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SettingsCard>

        {/* Connectivity */}
        <SettingsCard title="Connectivity">
          <SettingsRow
            label="WiFi"
            icon={Wifi}
            id="wifi"
            rightElement={<Toggle value={wifi} onChange={setWifi} id="wifi" />}
          />
          <SettingsRow
            label="Bluetooth"
            icon={Bluetooth}
            id="bluetooth"
            rightElement={
              <Toggle
                value={bluetooth}
                onChange={setBluetooth}
                id="bluetooth"
              />
            }
          />
          <SettingsRow
            label="Notifications"
            icon={Bell}
            id="notifications"
            rightElement={
              <Toggle
                value={notifications}
                onChange={setNotifications}
                id="notifications"
              />
            }
          />
        </SettingsCard>
      </div>

      {/* ── Right: Device info ── */}
      <div
        className="flex flex-col flex-1 py-4 px-4 gap-4 overflow-y-auto"
        data-ocid="settings.info_panel"
      >
        <SettingsCard title="Device Info">
          {DEVICE_INFO.map(({ label, value, Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
              style={{ borderColor: "oklch(var(--streamdeck-border))" }}
              data-ocid={`settings.info_${label.toLowerCase().replace(/\s/g, "_")}`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "oklch(var(--streamdeck-accent) / 0.1)" }}
              >
                <Icon
                  size={15}
                  style={{ color: "oklch(var(--streamdeck-accent))" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs"
                  style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
                >
                  {label}
                </p>
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: "oklch(var(--streamdeck-text-primary))" }}
                >
                  {value}
                </p>
              </div>
            </div>
          ))}
        </SettingsCard>

        {/* Save button */}
        <button
          type="button"
          onClick={() => setSaved(true)}
          className="w-full py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
          style={{
            background: saved
              ? "oklch(var(--streamdeck-success))"
              : "oklch(var(--streamdeck-accent))",
            color: "oklch(var(--streamdeck-bg))",
            boxShadow: `0 0 16px ${saved ? "oklch(var(--streamdeck-success) / 0.3)" : "oklch(var(--streamdeck-accent) / 0.3)"}`,
          }}
          data-ocid="settings.save_button"
        >
          {saved ? "✓ Settings Saved" : "Save Settings"}
        </button>

        {/* Branding */}
        <div
          className="flex flex-col items-center gap-1 pt-3 mt-auto"
          style={{ borderTop: "1px solid oklch(var(--streamdeck-border))" }}
        >
          <p
            className="text-xs"
            style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
          >
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "oklch(var(--streamdeck-accent))" }}
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

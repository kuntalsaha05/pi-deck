import {
  ChevronRight,
  Heart,
  ListMusic,
  Pause,
  Play,
  Radio,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Usb,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useState } from "react";

interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  durationSecs: number;
}

const TRACKS: Track[] = [
  {
    id: 1,
    title: "Midnight Drive",
    artist: "Neon Dusk",
    album: "Citylights",
    duration: "3:47",
    durationSecs: 227,
  },
  {
    id: 2,
    title: "Velocity",
    artist: "Pulse Engine",
    album: "Override",
    duration: "4:12",
    durationSecs: 252,
  },
  {
    id: 3,
    title: "Oceanic Highway",
    artist: "Coastal Wave",
    album: "Horizon",
    duration: "5:03",
    durationSecs: 303,
  },
  {
    id: 4,
    title: "Urban Echo",
    artist: "Static Iris",
    album: "Reverb",
    duration: "3:22",
    durationSecs: 202,
  },
  {
    id: 5,
    title: "Signal Lost",
    artist: "Ctrl+Alt+Drift",
    album: "Latency",
    duration: "4:55",
    durationSecs: 295,
  },
  {
    id: 6,
    title: "Fade Protocol",
    artist: "Neon Dusk",
    album: "Citylights",
    duration: "3:58",
    durationSecs: 238,
  },
  {
    id: 7,
    title: "Grid Walker",
    artist: "Pulse Engine",
    album: "Override",
    duration: "4:33",
    durationSecs: 273,
  },
];

type Source = "spotify" | "radio" | "usb";

const SOURCES: {
  id: Source;
  label: string;
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}[] = [
  { id: "spotify", label: "Spotify", Icon: ListMusic },
  { id: "radio", label: "Radio", Icon: Radio },
  { id: "usb", label: "USB", Icon: Usb },
];

type RepeatMode = "off" | "all" | "one";

export default function MediaPage() {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [liked, setLiked] = useState(false);
  const [volume, setVolume] = useState(72);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(38);
  const [source, setSource] = useState<Source>("spotify");
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");

  const track = TRACKS[currentTrack];

  const prev = () =>
    setCurrentTrack((i) => (i - 1 + TRACKS.length) % TRACKS.length);
  const next = () => setCurrentTrack((i) => (i + 1) % TRACKS.length);

  const progressSecs = Math.round((progress / 100) * track.durationSecs);
  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const repeatIcon = repeat === "one" ? Repeat1 : Repeat;
  const repeatActive = repeat !== "off";

  const effectiveVolume = muted ? 0 : volume;

  return (
    <div
      className="flex h-full"
      style={{ background: "oklch(var(--streamdeck-bg))" }}
      data-ocid="media.page"
    >
      {/* ── Left: Now Playing ── */}
      <div
        className="flex flex-col w-[46%] px-5 py-4 border-r gap-3"
        style={{ borderColor: "oklch(var(--streamdeck-border))" }}
        data-ocid="media.now_playing"
      >
        {/* Source tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl self-center"
          style={{ background: "oklch(var(--streamdeck-surface))" }}
          data-ocid="media.source_tabs"
        >
          {SOURCES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSource(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background:
                  source === id
                    ? "oklch(var(--streamdeck-accent))"
                    : "transparent",
                color:
                  source === id
                    ? "oklch(var(--streamdeck-bg))"
                    : "oklch(var(--streamdeck-text-secondary))",
              }}
              data-ocid={`media.source_tab.${id}`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Album art */}
        <div className="flex items-center gap-4">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.45 0.18 255), oklch(0.35 0.12 280))",
              boxShadow: "0 8px 24px oklch(var(--streamdeck-accent) / 0.3)",
            }}
          >
            <ListMusic size={40} style={{ color: "oklch(0.95 0 0 / 0.5)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="text-lg font-bold truncate leading-tight"
              style={{ color: "oklch(var(--streamdeck-text-primary))" }}
              data-ocid="media.track_title"
            >
              {track.title}
            </h2>
            <p
              className="text-sm truncate mt-0.5"
              style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
              data-ocid="media.track_artist"
            >
              {track.artist}
            </p>
            <p
              className="text-xs truncate mt-0.5"
              style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
            >
              {track.album}
            </p>

            {/* Like button */}
            <button
              type="button"
              onClick={() => setLiked((v) => !v)}
              className="mt-2 flex items-center gap-1 text-xs transition-all"
              style={{
                color: liked
                  ? "oklch(0.65 0.22 27)"
                  : "oklch(var(--streamdeck-text-secondary))",
              }}
              aria-label={liked ? "Unlike" : "Like"}
              data-ocid="media.like_button"
            >
              <Heart size={14} fill={liked ? "currentColor" : "none"} />
              {liked ? "Liked" : "Like"}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full" data-ocid="media.progress_bar">
          <div
            role="slider"
            aria-label="Playback progress"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            className="relative w-full h-2 rounded-full overflow-hidden cursor-pointer"
            style={{ background: "oklch(var(--streamdeck-border))" }}
            onClick={(e) => {
              const rect = (
                e.currentTarget as HTMLElement
              ).getBoundingClientRect();
              const pct = ((e.clientX - rect.left) / rect.width) * 100;
              setProgress(Math.max(0, Math.min(100, pct)));
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight")
                setProgress((p) => Math.min(100, p + 5));
              if (e.key === "ArrowLeft") setProgress((p) => Math.max(0, p - 5));
            }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: "oklch(var(--streamdeck-accent))",
                boxShadow: "0 0 8px oklch(var(--streamdeck-accent) / 0.5)",
              }}
            />
          </div>
          <div
            className="flex justify-between text-xs mt-1 tabular-nums"
            style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
          >
            <span>{formatTime(progressSecs)}</span>
            <span>{track.duration}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => setShuffle((v) => !v)}
            className="p-2 rounded-lg transition-all"
            style={{
              color: shuffle
                ? "oklch(var(--streamdeck-accent))"
                : "oklch(var(--streamdeck-text-secondary))",
            }}
            aria-label="Shuffle"
            data-ocid="media.shuffle_button"
          >
            <Shuffle size={18} />
          </button>

          {/* Prev */}
          <button
            type="button"
            onClick={prev}
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all active:scale-90"
            style={{
              background: "oklch(var(--streamdeck-surface))",
              border: "1px solid oklch(var(--streamdeck-border))",
              color: "oklch(var(--streamdeck-text-primary))",
            }}
            aria-label="Previous"
            data-ocid="media.prev_button"
          >
            <SkipBack size={22} />
          </button>

          {/* Play/Pause */}
          <button
            type="button"
            onClick={() => setIsPlaying((v) => !v)}
            className="flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{
              width: 64,
              height: 64,
              background: "oklch(var(--streamdeck-accent))",
              color: "oklch(var(--streamdeck-bg))",
              boxShadow: "0 0 20px oklch(var(--streamdeck-accent) / 0.4)",
            }}
            aria-label={isPlaying ? "Pause" : "Play"}
            data-ocid="media.play_button"
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={next}
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all active:scale-90"
            style={{
              background: "oklch(var(--streamdeck-surface))",
              border: "1px solid oklch(var(--streamdeck-border))",
              color: "oklch(var(--streamdeck-text-primary))",
            }}
            aria-label="Next"
            data-ocid="media.next_button"
          >
            <SkipForward size={22} />
          </button>

          {/* Repeat */}
          <button
            type="button"
            onClick={() =>
              setRepeat((v) =>
                v === "off" ? "all" : v === "all" ? "one" : "off",
              )
            }
            className="p-2 rounded-lg transition-all"
            style={{
              color: repeatActive
                ? "oklch(var(--streamdeck-accent))"
                : "oklch(var(--streamdeck-text-secondary))",
            }}
            aria-label="Repeat"
            data-ocid="media.repeat_button"
          >
            {repeatIcon === Repeat1 ? (
              <Repeat1 size={18} />
            ) : (
              <Repeat size={18} />
            )}
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={() => setMuted((v) => !v)}
            aria-label={muted ? "Unmute" : "Mute"}
            className="shrink-0"
            data-ocid="media.mute_button"
          >
            {muted ? (
              <VolumeX
                size={16}
                style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
              />
            ) : (
              <Volume2
                size={16}
                style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
              />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={effectiveVolume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              setMuted(false);
            }}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, oklch(var(--streamdeck-accent)) ${effectiveVolume}%, oklch(var(--streamdeck-border)) ${effectiveVolume}%)`,
            }}
            aria-label="Volume"
            data-ocid="media.volume_slider"
          />
          <span
            className="text-xs tabular-nums w-8 text-right"
            style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
          >
            {effectiveVolume}%
          </span>
        </div>
      </div>

      {/* ── Right: Queue ── */}
      <div
        className="flex flex-col flex-1 py-3 overflow-hidden"
        data-ocid="media.playlist"
      >
        <div className="flex items-center justify-between px-4 mb-2">
          <h2
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
          >
            Up Next
          </h2>
          <span
            className="text-xs"
            style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
          >
            {TRACKS.length} tracks
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {TRACKS.map((t, i) => {
            const isCurrent = i === currentTrack;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setCurrentTrack(i);
                  setIsPlaying(true);
                  setProgress(0);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left mb-1"
                style={{
                  background: isCurrent
                    ? "oklch(var(--streamdeck-accent) / 0.12)"
                    : "transparent",
                  border: isCurrent
                    ? "1px solid oklch(var(--streamdeck-accent) / 0.3)"
                    : "1px solid transparent",
                }}
                data-ocid={`media.track.${i + 1}`}
              >
                <span
                  className="text-xs font-bold w-5 text-center shrink-0"
                  style={{
                    color: isCurrent
                      ? "oklch(var(--streamdeck-accent))"
                      : "oklch(var(--streamdeck-text-secondary))",
                  }}
                >
                  {isCurrent && isPlaying ? "▶" : i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{
                      color: isCurrent
                        ? "oklch(var(--streamdeck-accent))"
                        : "oklch(var(--streamdeck-text-primary))",
                    }}
                  >
                    {t.title}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
                  >
                    {t.artist}
                  </p>
                </div>
                <span
                  className="text-xs shrink-0 tabular-nums"
                  style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
                >
                  {t.duration}
                </span>
                <ChevronRight
                  size={12}
                  style={{
                    color: "oklch(var(--streamdeck-text-secondary))",
                    flexShrink: 0,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

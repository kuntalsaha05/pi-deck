import {
  Delete,
  Mic,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  PhoneOutgoing,
  UserCircle2,
  X,
} from "lucide-react";
import { useState } from "react";

interface RecentCall {
  name: string;
  number: string;
  type: "incoming" | "outgoing" | "missed";
  time: string;
  duration?: string;
}

const RECENTS: RecentCall[] = [
  {
    name: "Alice Turner",
    number: "+1 555-0101",
    type: "incoming",
    time: "10:32 AM",
    duration: "4m 12s",
  },
  {
    name: "Bob Mitchell",
    number: "+1 555-0188",
    type: "outgoing",
    time: "9:14 AM",
    duration: "1m 07s",
  },
  {
    name: "Work Office",
    number: "+1 555-0212",
    type: "missed",
    time: "Yesterday",
  },
  {
    name: "Emma Johnson",
    number: "+1 555-0345",
    type: "incoming",
    time: "Yesterday",
    duration: "8m 30s",
  },
  {
    name: "Dad",
    number: "+1 555-0999",
    type: "outgoing",
    time: "Mon",
    duration: "12m 44s",
  },
  { name: "Sarah Lee", number: "+1 555-0567", type: "missed", time: "Sun" },
];

const DIALPAD = [
  [
    { char: "1", sub: "" },
    { char: "2", sub: "ABC" },
    { char: "3", sub: "DEF" },
  ],
  [
    { char: "4", sub: "GHI" },
    { char: "5", sub: "JKL" },
    { char: "6", sub: "MNO" },
  ],
  [
    { char: "7", sub: "PQRS" },
    { char: "8", sub: "TUV" },
    { char: "9", sub: "WXYZ" },
  ],
  [
    { char: "*", sub: "" },
    { char: "0", sub: "+" },
    { char: "#", sub: "" },
  ],
];

export default function PhonePage() {
  const [dialValue, setDialValue] = useState("");
  const [activeCall, setActiveCall] = useState<{
    name: string;
    number: string;
  } | null>(null);
  const [callTimer, setCallTimer] = useState(0);

  const handleDial = (char: string) => {
    if (dialValue.length < 15) setDialValue((v) => v + char);
  };

  const handleDelete = () => setDialValue((v) => v.slice(0, -1));

  const handleCall = () => {
    if (dialValue.length > 0) {
      setActiveCall({ name: "Unknown", number: dialValue });
      setCallTimer(0);
    }
  };

  const handleCallContact = (call: RecentCall) => {
    setActiveCall({ name: call.name, number: call.number });
    setCallTimer(0);
    setDialValue("");
  };

  const handleEndCall = () => {
    setActiveCall(null);
    setCallTimer(0);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const callTypeColor = (type: RecentCall["type"]) => {
    if (type === "missed") return "oklch(0.65 0.22 27)";
    if (type === "incoming") return "oklch(var(--streamdeck-success))";
    return "oklch(var(--streamdeck-accent))";
  };

  const CallTypeIcon = ({ type }: { type: RecentCall["type"] }) => {
    const color = callTypeColor(type);
    if (type === "missed") return <PhoneMissed size={13} style={{ color }} />;
    if (type === "incoming")
      return <PhoneIncoming size={13} style={{ color }} />;
    return <PhoneOutgoing size={13} style={{ color }} />;
  };

  return (
    <div
      className="flex h-full"
      style={{ background: "oklch(var(--streamdeck-bg))" }}
      data-ocid="phone.page"
    >
      {/* ── Left: Recents + active call banner ── */}
      <div
        className="flex flex-col w-1/2 border-r"
        style={{ borderColor: "oklch(var(--streamdeck-border))" }}
        data-ocid="phone.recents_panel"
      >
        {/* Active call banner */}
        {activeCall && (
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{
              background: "oklch(var(--streamdeck-success) / 0.12)",
              borderColor: "oklch(var(--streamdeck-success) / 0.3)",
            }}
            data-ocid="phone.active_call_banner"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "oklch(var(--streamdeck-success) / 0.2)" }}
              >
                <PhoneCall
                  size={18}
                  style={{ color: "oklch(var(--streamdeck-success))" }}
                />
              </div>
              <div>
                <p
                  className="text-sm font-bold leading-tight"
                  style={{ color: "oklch(var(--streamdeck-text-primary))" }}
                >
                  {activeCall.name}
                </p>
                <p
                  className="text-xs tabular-nums"
                  style={{ color: "oklch(var(--streamdeck-success))" }}
                >
                  {formatDuration(callTimer)} · Connected
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleEndCall}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90"
              style={{ background: "oklch(0.62 0.22 27)" }}
              aria-label="End call"
              data-ocid="phone.end_active_button"
            >
              <X size={18} style={{ color: "oklch(0.98 0 0)" }} />
            </button>
          </div>
        )}

        {/* Recents header */}
        <p
          className="text-xs font-bold uppercase tracking-widest px-4 pt-3 pb-2"
          style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
        >
          Recent Calls
        </p>

        {/* Recents list */}
        <div className="flex-1 overflow-y-auto" data-ocid="phone.recents_list">
          {RECENTS.map((call, i) => (
            <button
              key={`${call.number}-${i}`}
              type="button"
              onClick={() => handleCallContact(call)}
              className="w-full flex items-center gap-3 px-4 py-3 transition-all text-left active:scale-[0.98]"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "oklch(var(--streamdeck-surface))";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
              data-ocid={`phone.recent.${i + 1}`}
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(var(--streamdeck-accent) / 0.15)" }}
              >
                <UserCircle2
                  size={22}
                  style={{ color: "oklch(var(--streamdeck-accent))" }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: "oklch(var(--streamdeck-text-primary))" }}
                >
                  {call.name}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
                >
                  {call.number}
                </p>
              </div>

              {/* Meta */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <CallTypeIcon type={call.type} />
                <span
                  className="text-xs"
                  style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
                >
                  {call.time}
                </span>
                {call.duration && (
                  <span
                    className="text-xs"
                    style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
                  >
                    {call.duration}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: Dialpad ── */}
      <div
        className="flex flex-col items-center justify-center w-1/2 gap-2 px-6 py-4"
        data-ocid="phone.dialpad"
      >
        {/* Display */}
        <div
          className="w-full flex items-center px-5 py-3 rounded-2xl mb-1"
          style={{
            background: "oklch(var(--streamdeck-surface))",
            border: "1px solid oklch(var(--streamdeck-border))",
            minHeight: 56,
          }}
        >
          <span
            className="flex-1 text-xl font-bold tabular-nums tracking-widest text-center"
            style={{ color: "oklch(var(--streamdeck-text-primary))" }}
            data-ocid="phone.dial_input"
          >
            {dialValue || <span style={{ opacity: 0.3 }}>—</span>}
          </span>
          {dialValue && (
            <button
              type="button"
              onClick={handleDelete}
              className="ml-2 p-2 rounded-lg transition-all opacity-60 hover:opacity-100"
              aria-label="Delete digit"
              data-ocid="phone.delete_button"
            >
              <Delete
                size={20}
                style={{ color: "oklch(var(--streamdeck-text-secondary))" }}
              />
            </button>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {DIALPAD.flat().map(({ char, sub }) => (
            <button
              key={char}
              type="button"
              onClick={() => handleDial(char)}
              className="flex flex-col items-center justify-center rounded-2xl transition-all active:scale-90"
              style={{
                height: 76,
                background: "oklch(var(--streamdeck-surface))",
                border: "1px solid oklch(var(--streamdeck-border))",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "oklch(var(--streamdeck-accent) / 0.12)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "oklch(var(--streamdeck-accent) / 0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "oklch(var(--streamdeck-surface))";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "oklch(var(--streamdeck-border))";
              }}
              data-ocid={`phone.dialpad_key.${char}`}
            >
              <span
                className="text-lg font-bold leading-none"
                style={{ color: "oklch(var(--streamdeck-text-primary))" }}
              >
                {char}
              </span>
              {sub && (
                <span
                  className="text-xs leading-none mt-0.5"
                  style={{
                    color: "oklch(var(--streamdeck-text-secondary))",
                    fontSize: "0.6rem",
                  }}
                >
                  {sub}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Action row */}
        <div className="flex gap-2 w-full mt-1">
          {/* Call */}
          <button
            type="button"
            onClick={handleCall}
            disabled={dialValue.length === 0}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl font-bold text-base transition-all active:scale-95"
            style={{
              height: 76,
              background:
                dialValue.length > 0
                  ? "oklch(var(--streamdeck-success))"
                  : "oklch(var(--streamdeck-surface))",
              color:
                dialValue.length > 0
                  ? "oklch(var(--streamdeck-bg))"
                  : "oklch(var(--streamdeck-text-secondary))",
              border:
                dialValue.length > 0
                  ? "none"
                  : "1px solid oklch(var(--streamdeck-border))",
            }}
            data-ocid="phone.call_button"
          >
            <PhoneCall size={22} />
            Call
          </button>

          {/* Mic */}
          <button
            type="button"
            className="flex items-center justify-center rounded-2xl transition-all active:scale-90"
            style={{
              width: 76,
              height: 76,
              background: "oklch(var(--streamdeck-surface))",
              border: "1px solid oklch(var(--streamdeck-border))",
              color: "oklch(var(--streamdeck-accent))",
            }}
            aria-label="Microphone"
            data-ocid="phone.mic_button"
          >
            <Mic size={22} />
          </button>

          {/* End */}
          <button
            type="button"
            onClick={handleEndCall}
            disabled={!activeCall}
            className="flex items-center justify-center rounded-2xl transition-all active:scale-90"
            style={{
              width: 76,
              height: 76,
              background: activeCall
                ? "oklch(0.62 0.22 27)"
                : "oklch(var(--streamdeck-surface))",
              border: activeCall
                ? "none"
                : "1px solid oklch(var(--streamdeck-border))",
              color: activeCall
                ? "oklch(0.98 0 0)"
                : "oklch(var(--streamdeck-text-secondary))",
            }}
            aria-label="End call"
            data-ocid="phone.end_button"
          >
            <PhoneOff size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

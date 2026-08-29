import { useEffect, useState } from "react";

export interface ClockState {
  time: string; // HH:MM:SS
  date: string; // e.g. "Sat, Apr 18"
  hours: number;
  minutes: number;
  seconds: number;
}

function formatTime(d: Date): string {
  const rawH = d.getHours();
  const h = rawH === 0 ? 12 : rawH > 12 ? rawH - 12 : rawH;
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = rawH >= 12 ? "PM" : "AM";
  return `${h}:${m} ${ampm}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function useClock(): ClockState {
  const [state, setState] = useState<ClockState>(() => {
    const now = new Date();
    return {
      time: formatTime(now),
      date: formatDate(now),
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
    };
  });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setState({
        time: formatTime(now),
        date: formatDate(now),
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: now.getSeconds(),
      });
    };

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return state;
}

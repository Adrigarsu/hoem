"use client";

import { useEffect, useState } from "react";

// Seconds to wait before something can be asked for again, such as another verification link.
// Counted from an end time rather than by ticks, because browsers slow down timers in background
// tabs.
export function useCooldown(seconds: number) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (endsAt === null) return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) setEndsAt(null);
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  function start() {
    setEndsAt(Date.now() + seconds * 1000);
    setSecondsLeft(seconds);
  }

  return { secondsLeft, start };
}

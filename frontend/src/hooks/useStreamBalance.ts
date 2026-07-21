import { useEffect, useState } from "react";
import type { EmployeeBalance } from "../sdk/yieldflow-sdk";
import { useAnimatedNumber, clampPercent } from "../animation-utils";

export function useStreamBalance(balance: EmployeeBalance | null) {
  const [liveTarget, setLiveTarget] = useState(0);
  const liveBalance = useAnimatedNumber(liveTarget, 500);

  useEffect(() => {
    if (!balance) {
      setLiveTarget(0);
      return;
    }

    const base = parseFloat(balance.unlockedAmount);
    const rate = parseFloat(balance.ratePerSecond);
    const startTime = Date.now();
    setLiveTarget(base);

    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setLiveTarget(base + elapsed * rate);
    }, 280);

    return () => window.clearInterval(timer);
  }, [balance]);

  const streamProgress = clampPercent(
    balance
      ? (Number(balance.unlockedAmount) / Math.max(Number(balance.streamCap) || 1, 1)) * 100
      : 0,
  );

  return { liveBalance, streamProgress };
}

import { useMemo, useState } from "react";
import type { EmployerStats } from "../sdk/yieldflow-sdk";
import { formatMoney } from "../utils";
import type { DisplayStats } from "../types";

export function useStats() {
  const [stats, setStats] = useState<EmployerStats | null>(null);

  const displayStats: DisplayStats = useMemo(
    () => ({
      totalPool: stats ? formatMoney(parseFloat(stats.totalPool)) : "--",
      yieldEarned: stats ? formatMoney(parseFloat(stats.yieldEarned)) : "--",
      bufferAmount: stats ? formatMoney(parseFloat(stats.bufferAmount)) : "--",
      activeEmployees: stats ? stats.activeEmployees : 0,
      projectedApy: stats?.projectedApy ?? "--",
      bufferPercent: stats?.bufferPercent ?? 0,
      yieldRoutePercent: stats?.yieldRoutePercent ?? 0,
    }),
    [stats],
  );

  return { stats, setStats, displayStats };
}

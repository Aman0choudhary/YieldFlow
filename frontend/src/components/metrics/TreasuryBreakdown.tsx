import type { EmployeeBalance } from "../../sdk/yieldflow-sdk";
import type { DisplayStats } from "../../types";
import { formatMoney } from "../../utils";

type TreasuryBreakdownProps = {
  displayStats: DisplayStats;
  balance: EmployeeBalance | null;
  liveBalance: number;
};

/**
 * PRD Dashboard premium layer: Available / Streaming / Locked / Yield.
 * Derived from employer stats + employee stream snapshot (no new DB).
 */
export function TreasuryBreakdown({ displayStats, balance, liveBalance }: TreasuryBreakdownProps) {
  const pool = Number(String(displayStats.totalPool).replace(/[^0-9.]/g, "")) || 0;
  const buffer = Number(String(displayStats.bufferAmount).replace(/[^0-9.]/g, "")) || 0;
  const yieldEarned = Number(String(displayStats.yieldEarned).replace(/[^0-9.]/g, "")) || 0;
  const yieldPrincipal = Math.max(0, pool - buffer);
  const unlocked = balance ? liveBalance : 0;
  const cap = balance ? Number(balance.streamCap) || 0 : 0;
  const locked = balance ? Math.max(0, cap - unlocked) : 0;

  const rows = [
    {
      id: "available",
      label: "Available buffer",
      value: formatMoney(buffer, 2),
      detail: `${displayStats.bufferPercent}% instant liquidity`,
      width: pool > 0 ? Math.min(100, (buffer / pool) * 100) : 0,
    },
    {
      id: "streaming",
      label: "Streaming unlocked",
      value: balance ? formatMoney(unlocked, 2) : "--",
      detail: balance ? "Employee-available now" : "Sign in to stream",
      width: cap > 0 ? Math.min(100, (unlocked / cap) * 100) : 0,
    },
    {
      id: "locked",
      label: "Still locked",
      value: balance ? formatMoney(locked, 2) : "--",
      detail: "Remaining stream cap",
      width: cap > 0 ? Math.min(100, (locked / cap) * 100) : 0,
    },
    {
      id: "yield",
      label: "Yield principal + earned",
      value: formatMoney(yieldPrincipal + yieldEarned, 2),
      detail: `${displayStats.yieldRoutePercent}% route · ${displayStats.projectedApy}% APY`,
      width:
        pool > 0
          ? Math.min(100, ((yieldPrincipal + yieldEarned) / (pool + yieldEarned || 1)) * 100)
          : 0,
    },
  ];

  return (
    <section className="chart-panel glass-panel treasury-breakdown" aria-label="Treasury breakdown">
      <div className="panel-header">
        <div>
          <p className="label">Treasury breakdown</p>
          <h2>Where capital sits</h2>
        </div>
        <span className="chip">Live model</span>
      </div>
      <div className="treasury-grid">
        {rows.map((row) => (
          <div key={row.id} className="treasury-row">
            <div className="allocation-meta">
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
            <div className="allocation-bar" aria-hidden="true">
              <span style={{ width: `${row.width}%` }} />
            </div>
            <small className="muted">{row.detail}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

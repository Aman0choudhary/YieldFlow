import { Activity, AlertTriangle, CheckCircle2, Network, ShieldCheck, Wallet } from "lucide-react";
import type { EmployeeSession, EmployerStats } from "../sdk/yieldflow-sdk";
import type { QueuedTx } from "../types";

type HealthStripProps = {
  employee: EmployeeSession | null;
  stats: EmployerStats | null;
  transactionQueue: QueuedTx[];
  sdkMode: string;
  networkLabel: string;
};

type HealthState = "healthy" | "warning" | "error" | "offline";

function stateFor(active: boolean, warn = false, error = false): HealthState {
  if (error) return "error";
  if (!active) return "offline";
  if (warn) return "warning";
  return "healthy";
}

function labelFor(state: HealthState): string {
  if (state === "healthy") return "Healthy";
  if (state === "warning") return "Warning";
  if (state === "error") return "Error";
  return "Offline";
}

export function HealthStrip({
  employee,
  stats,
  transactionQueue,
  sdkMode,
  networkLabel,
}: HealthStripProps) {
  const pending = transactionQueue.filter(
    (tx) => tx.status === "pending" || tx.status === "submitted",
  ).length;
  const failed = transactionQueue.filter((tx) => tx.status === "failed").length;

  const items: Array<{
    id: string;
    title: string;
    detail: string;
    state: HealthState;
    icon: typeof Wallet;
  }> = [
    {
      id: "treasury",
      title: "Treasury",
      detail: stats ? `Pool live · ${stats.bufferPercent}% buffer` : "Awaiting stats",
      state: stateFor(Boolean(stats)),
      icon: Wallet,
    },
    {
      id: "stream",
      title: "Stream engine",
      detail: employee ? "Passkey stream active" : "Session offline",
      state: stateFor(Boolean(employee)),
      icon: Activity,
    },
    {
      id: "queue",
      title: "Settlement queue",
      detail:
        failed > 0
          ? `${failed} failed`
          : pending > 0
            ? `${pending} in flight`
            : "Clear",
      state: stateFor(true, pending > 0, failed > 0),
      icon: ShieldCheck,
    },
    {
      id: "network",
      title: "Network",
      detail: `${networkLabel} · ${sdkMode}`,
      state: stateFor(true, sdkMode !== "mock" && sdkMode !== "stellar"),
      icon: Network,
    },
  ];

  return (
    <section className="health-strip" aria-label="System health">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article key={item.id} className={`health-chip health-${item.state}`}>
            <div className="health-chip-top">
              <Icon size={14} aria-hidden="true" />
              <span className="health-state">{labelFor(item.state)}</span>
            </div>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
            {item.state === "error" && (
              <span className="health-alert" aria-hidden="true">
                <AlertTriangle size={12} />
              </span>
            )}
            {item.state === "healthy" && (
              <span className="health-ok" aria-hidden="true">
                <CheckCircle2 size={12} />
              </span>
            )}
          </article>
        );
      })}
    </section>
  );
}

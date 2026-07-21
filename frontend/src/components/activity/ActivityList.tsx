import { Activity, Filter } from "lucide-react";
import type { ActivityItem } from "../../sdk/yieldflow-sdk";
import { kindIcons, kindLabel, kindDetail, shortAddress } from "../../utils";

type ActivityListProps = {
  items: ActivityItem[];
  compact?: boolean;
  expandedActivityId: string | null;
  onToggleExpand: (id: string | null) => void;
  onOpenDetail?: (item: ActivityItem) => void;
};

const statusClass = (status: string | undefined) => {
  if (!status || status === "confirmed") return "status-confirmed";
  if (status === "pending" || status === "submitted") return "status-pending";
  if (status === "failed") return "status-failed";
  return "";
};

export function ActivityList({
  items,
  compact = false,
  expandedActivityId,
  onToggleExpand,
  onOpenDetail,
}: ActivityListProps) {
  if (!items.length) {
    return (
      <div className="empty-state">
        <div className="empty-icons">
          <Filter size={18} />
          <Activity size={18} />
        </div>
        <strong>No matching activity</strong>
        <p>Try another filter or run a deposit / withdrawal on Flows to seed the feed.</p>
      </div>
    );
  }

  return (
    <>
      {!compact && (
        <div className="ledger-header" aria-hidden="true">
          <span />
          <span>Event</span>
          <span>Amount</span>
        </div>
      )}
      {items.map((item, index) => {
        const Icon = kindIcons[item.kind] ?? Activity;
        const expanded = expandedActivityId === item.id;
        const status = item.status ?? "confirmed";
        return (
          <button
            key={item.id}
            type="button"
            className={`activity-row activity-enter${expanded ? " expanded" : ""}${compact ? "" : " ledger-row"}`}
            style={{ ["--enter-delay" as string]: `${index * 40}ms` }}
            aria-expanded={expanded}
            onClick={() => {
              onToggleExpand(expanded ? null : item.id);
              if (!compact && onOpenDetail) onOpenDetail(item);
            }}
          >
            <div
              className="activity-icon"
              style={{
                background:
                  item.kind === "withdraw"
                    ? "rgba(255, 103, 102, 0.18)"
                    : "rgba(202, 40, 81, 0.14)",
              }}
            >
              <Icon size={16} />
            </div>
            <div className="activity-copy">
              <strong>{item.label ?? kindLabel[item.kind]}</strong>
              <small>
                {item.timestamp}
                {item.txHash ? ` · ${shortAddress(item.txHash)}` : ""}
              </small>
              {expanded && !compact && (
                <p className="activity-detail">
                  {kindDetail[item.kind]}
                  {item.counterparty ? ` Counterparty: ${item.counterparty}.` : ""}
                </p>
              )}
            </div>
            <div className="activity-side">
              <div className="activity-amount">{item.amount}</div>
              {!compact && (
                <span className={`status-badge ${statusClass(status)}`}>
                  {status}
                </span>
              )}
              {compact && <small>{kindLabel[item.kind]}</small>}
            </div>
          </button>
        );
      })}
    </>
  );
}

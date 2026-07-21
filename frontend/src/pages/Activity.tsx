import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  GitBranch,
  Loader2,
  ArrowDownRight,
  Search,
  X,
} from "lucide-react";
import type { ActivityItem, TransactionDetail } from "../sdk/yieldflow-sdk";
import { getTransactionDetail } from "../sdk/yieldflow-sdk";
import type { ActivityFilter, QueuedTx, StatusFilter } from "../types";
import { activityFilters, explorerUrl, shortAddress, statusFilters } from "../utils";
import { formatRelativeTime } from "../animation-utils";
import { ActivityList } from "../components/activity/ActivityList";

type ActivityPageProps = {
  filteredActivity: ActivityItem[];
  activityFilter: ActivityFilter;
  statusFilter: StatusFilter;
  searchQuery: string;
  transactionQueue: QueuedTx[];
  expandedActivityId: string | null;
  detailItem: ActivityItem | null;
  onToggleExpand: (id: string | null) => void;
  onFilterChange: (filter: ActivityFilter) => void;
  onStatusFilterChange: (filter: StatusFilter) => void;
  onSearchChange: (query: string) => void;
  onOpenDetail: (item: ActivityItem | null) => void;
  onExportCsv: () => void;
  onNavigate: (page: "flows" | "dashboard" | "activity") => void;
};

export default function ActivityPage({
  filteredActivity,
  activityFilter,
  statusFilter,
  searchQuery,
  transactionQueue,
  expandedActivityId,
  detailItem,
  onToggleExpand,
  onFilterChange,
  onStatusFilterChange,
  onSearchChange,
  onOpenDetail,
  onExportCsv,
  onNavigate,
}: ActivityPageProps) {
  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [queueStatus, setQueueStatus] = useState<"all" | "pending" | "confirmed" | "failed">("all");
  const [copied, setCopied] = useState(false);

  const pendingCount = transactionQueue.filter(
    (tx) => tx.status === "pending" || tx.status === "submitted",
  ).length;
  const failedCount = transactionQueue.filter((tx) => tx.status === "failed").length;
  const confirmedCount = transactionQueue.filter((tx) => tx.status === "confirmed").length;

  const boardQueue = transactionQueue.filter((tx) => {
    if (queueStatus === "all") return true;
    if (queueStatus === "pending") return tx.status === "pending" || tx.status === "submitted";
    return tx.status === queueStatus;
  });

  useEffect(() => {
    if (!detailItem?.txHash) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    void getTransactionDetail(detailItem.txHash)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [detailItem]);

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="dashboard-grid page-enter">
      <section className="activity-panel glass-panel activity-full">
        <div className="panel-header">
          <div>
            <p className="label">Activity ledger</p>
            <h2>All settlement events</h2>
          </div>
          <div className="header-actions">
            <button className="chip chip-btn" type="button" onClick={onExportCsv}>
              <Download size={14} />
              Export CSV
            </button>
            <span className="chip">{filteredActivity.length} shown</span>
          </div>
        </div>

        <div className="search-row">
          <label className="search-field" htmlFor="activity-search">
            <Search size={16} />
            <input
              id="activity-search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search hash, amount, label..."
            />
          </label>
        </div>

        <div className="filter-row" role="tablist" aria-label="Activity kind filters">
          {activityFilters.map((filter) => {
            const selected = activityFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`filter-chip${selected ? " active" : ""}`}
                onClick={() => onFilterChange(filter.id)}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="filter-row" role="tablist" aria-label="Activity status filters">
          {statusFilters.map((filter) => {
            const selected = statusFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`filter-chip${selected ? " active" : ""}`}
                onClick={() => onStatusFilterChange(filter.id)}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="activity-list activity-list-full">
          {filteredActivity.length ? (
            <ActivityList
              items={filteredActivity}
              expandedActivityId={expandedActivityId}
              onToggleExpand={onToggleExpand}
              onOpenDetail={onOpenDetail}
            />
          ) : (
            <div className="empty-state">
              <strong>No matching ledger rows</strong>
              <p>
                Try another filter or search, or operate the pipeline on Flows to create deposits
                and withdrawals.
              </p>
              <button className="secondary-btn" type="button" onClick={() => onNavigate("flows")}>
                <GitBranch size={16} />
                Open Flows
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="chart-panel glass-panel">
        <div className="panel-header">
          <div>
            <p className="label">Transaction queue board</p>
            <h2>Pending · confirmed · failed</h2>
          </div>
          <span className="chip">{transactionQueue.length || 0}</span>
        </div>

        <div className="integrity-strip">
          <span>
            <strong>{pendingCount}</strong> pending
          </span>
          <span>
            <strong>{confirmedCount}</strong> confirmed
          </span>
          <span>
            <strong>{failedCount}</strong> failed
          </span>
        </div>

        <div className="filter-row" role="tablist" aria-label="Queue board filters">
          {(
            [
              ["all", "All"],
              ["pending", "Pending"],
              ["confirmed", "Confirmed"],
              ["failed", "Failed"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={queueStatus === id}
              className={`filter-chip${queueStatus === id ? " active" : ""}`}
              onClick={() => setQueueStatus(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {boardQueue.length === 0 ? (
          <div className="empty-state compact-empty">
            <div className="empty-icons">
              <CheckCircle2 size={18} />
            </div>
            <strong>Queue is clear</strong>
            <p>Fund payroll or request a payout on Flows to watch pending to confirmed hops.</p>
            <button className="secondary-btn" type="button" onClick={() => onNavigate("flows")}>
              <GitBranch size={16} />
              Operate on Flows
            </button>
          </div>
        ) : (
          <div className="activity-list">
            {boardQueue.map((tx) => (
              <div className="activity-row static-row" key={tx.txHash}>
                <div
                  className="activity-icon"
                  style={{
                    background:
                      tx.status === "failed"
                        ? "rgba(255, 103, 102, 0.2)"
                        : tx.status === "confirmed"
                          ? "rgba(255, 177, 115, 0.18)"
                          : "rgba(202, 40, 81, 0.16)",
                  }}
                >
                  {tx.status === "confirmed" ? (
                    <CheckCircle2 size={16} />
                  ) : tx.status === "failed" ? (
                    <ArrowDownRight size={16} />
                  ) : (
                    <Loader2 className="spin" size={16} />
                  )}
                </div>
                <div className="activity-copy">
                  <strong>
                    {tx.kind === "deposit" ? "Payroll deposit" : "Withdrawal"} · {tx.status}
                  </strong>
                  <small>
                    {formatRelativeTime(tx.startedAt)} · {shortAddress(tx.txHash)}
                  </small>
                </div>
                <div className="activity-side">
                  <div className="activity-amount">{tx.amount}</div>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="icon-chip"
                      onClick={() => void copyHash(tx.txHash)}
                      aria-label="Copy transaction hash"
                    >
                      <Copy size={12} />
                    </button>
                    <a
                      className="icon-chip"
                      href={explorerUrl(tx.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open in mock explorer"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {copied && <p className="muted copy-toast">Hash copied</p>}
      </section>

      <section className="live-balance-panel glass-panel">
        <div className="panel-header">
          <div>
            <p className="label">Cross links</p>
            <h2>Operate elsewhere</h2>
          </div>
        </div>

        <p className="muted">
          Activity is audit-only. Funding, allocation, and stream controls live on Flows. Session
          health lives on Dashboard.
        </p>

        <div className="dashboard-actions stacked-actions">
          <button className="primary-btn" type="button" onClick={() => onNavigate("flows")}>
            <GitBranch size={16} />
            Replay / fund on Flows
          </button>
          <button className="secondary-btn" type="button" onClick={() => onNavigate("dashboard")}>
            Open Dashboard health
          </button>
        </div>
      </section>

      {detailItem && (
        <div className="drawer-backdrop" role="presentation" onClick={() => onOpenDetail(null)}>
          <aside
            className="detail-drawer glass-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Activity detail"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-header">
              <div>
                <p className="label">Detail drawer</p>
                <h2>{detailItem.label}</h2>
              </div>
              <button
                type="button"
                className="chip chip-btn"
                onClick={() => onOpenDetail(null)}
                aria-label="Close detail"
              >
                <X size={14} />
              </button>
            </div>

            <div className="split-preview">
              <div className="setting-row">
                <strong>{detailItem.amount}</strong>
                <small>Amount</small>
              </div>
              <div className="setting-row">
                <strong>{detailItem.status ?? "confirmed"}</strong>
                <small>Status</small>
              </div>
              <div className="setting-row">
                <strong>{detailItem.counterparty ?? "—"}</strong>
                <small>Counterparty</small>
              </div>
              <div className="setting-row">
                <strong>{detailItem.kind}</strong>
                <small>Kind · related stream</small>
              </div>
            </div>

            {detailItem.txHash && (
              <div className="tx-hash drawer-hash">
                <code>{detailItem.txHash}</code>
                <button
                  type="button"
                  className="icon-chip"
                  onClick={() => void copyHash(detailItem.txHash!)}
                >
                  <Copy size={12} />
                </button>
                <a
                  className="icon-chip"
                  href={explorerUrl(detailItem.txHash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            <div className="drawer-section">
              <p className="label">Step timeline</p>
              {detailLoading && <p className="muted">Loading steps...</p>}
              {!detailLoading && detail && (
                <div className="hop-timeline">
                  {detail.steps.map((step, index) => (
                    <div
                      key={`${step.label}-${index}`}
                      className={`hop-step ${
                        step.status === "failed"
                          ? "failed"
                          : step.status === "pending" || step.status === "submitted"
                            ? "current"
                            : step.status === "confirmed"
                              ? "done"
                              : "idle"
                      }`}
                    >
                      <span className="hop-dot" />
                      <div>
                        <strong>{step.label}</strong>
                        <small>
                          {step.at} · {step.status}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!detailLoading && !detail && detailItem.txHash && (
                <p className="muted">No step timeline for seed rows without live tx meta.</p>
              )}
            </div>

            {detailItem.kind === "deposit" || detailItem.kind === "withdraw" ? (
              <button
                className="primary-btn"
                type="button"
                onClick={() => {
                  onOpenDetail(null);
                  onNavigate("flows");
                }}
              >
                <GitBranch size={16} />
                Replay on Flows
              </button>
            ) : null}
          </aside>
        </div>
      )}
    </section>
  );
}

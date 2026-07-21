import { useCallback, useMemo, useState } from "react";
import { getActivity } from "../sdk/yieldflow-sdk";
import type { ActivityItem, TxStatus } from "../sdk/yieldflow-sdk";
import type { ActivityFilter, StatusFilter } from "../types";

export function useActivity() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<ActivityItem | null>(null);

  /** Prefer SDK as source of truth; use only for optimistic/local merge when needed. */
  const pushActivity = useCallback((item: ActivityItem) => {
    setActivity((current) =>
      [item, ...current.filter((row) => row.id !== item.id)].slice(0, 80),
    );
  }, []);

  /** Reload ledger from mock/real SDK (localStorage-backed in mock). */
  const reloadActivity = useCallback(async () => {
    const items = await getActivity();
    setActivity(items);
    return items;
  }, []);

  const filteredActivity = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activity.filter((item) => {
      if (activityFilter !== "all" && item.kind !== activityFilter) return false;
      if (statusFilter !== "all" && (item.status ?? "confirmed") !== statusFilter) return false;
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.amount.toLowerCase().includes(q) ||
        (item.txHash ?? "").toLowerCase().includes(q) ||
        (item.counterparty ?? "").toLowerCase().includes(q) ||
        item.kind.toLowerCase().includes(q)
      );
    });
  }, [activity, activityFilter, statusFilter, searchQuery]);

  const exportCsv = useCallback(() => {
    const header = ["id", "kind", "label", "timestamp", "amount", "status", "txHash", "counterparty"];
    const rows = filteredActivity.map((item) =>
      [
        item.id,
        item.kind,
        item.label,
        item.timestamp,
        item.amount,
        item.status ?? "confirmed",
        item.txHash ?? "",
        item.counterparty ?? "",
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yieldflow-activity-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredActivity]);

  const patchActivityStatus = useCallback((txHash: string, status: TxStatus) => {
    setActivity((current) =>
      current.map((item) => (item.txHash === txHash ? { ...item, status } : item)),
    );
  }, []);

  return {
    activity,
    setActivity,
    activityFilter,
    setActivityFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    expandedActivityId,
    setExpandedActivityId,
    detailItem,
    setDetailItem,
    filteredActivity,
    pushActivity,
    reloadActivity,
    exportCsv,
    patchActivityStatus,
  };
}

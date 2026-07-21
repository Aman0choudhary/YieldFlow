import { useCallback, useEffect, useRef, useState } from "react";
import { getTransactionStatus, getEmployerStats } from "../sdk/yieldflow-sdk";
import type { EmployerStats, TxStatus } from "../sdk/yieldflow-sdk";
import type { QueuedTx, Notification } from "../types";

export function useTransactions(
  employeeId: string | null,
  addNotification: (message: string, type: Notification["type"]) => void,
  refreshBalance: (employeeId: string) => Promise<void>,
  setStats: (stats: EmployerStats) => void,
  patchActivityStatus?: (txHash: string, status: TxStatus) => void,
  reloadActivity?: () => Promise<unknown>,
) {
  const [transactionQueue, setTransactionQueue] = useState<QueuedTx[]>([]);
  const inflightRef = useRef(false);

  const activeTx = transactionQueue.find(
    (tx) => tx.status === "pending" || tx.status === "submitted",
  );

  const queueTransaction = useCallback((tx: QueuedTx) => {
    setTransactionQueue((current) => [tx, ...current].slice(0, 12));
  }, []);

  useEffect(() => {
    const pending = transactionQueue.filter(
      (tx) => tx.status === "pending" || tx.status === "submitted",
    );
    if (!pending.length) return;

    const poll = window.setInterval(async () => {
      if (inflightRef.current) return;
      inflightRef.current = true;
      try {
        const results = await Promise.allSettled(
          pending.map(async (tx) => {
            const status = await getTransactionStatus(tx.txHash);
            if (status === tx.status) return;

            setTransactionQueue((current) =>
              current.map((item) =>
                item.txHash === tx.txHash ? { ...item, status } : item,
              ),
            );

            // Patch existing ledger row only — never invent a second "confirmed" row.
            patchActivityStatus?.(tx.txHash, status);

            if (status === "confirmed") {
              addNotification("Transaction confirmed", "success");
              await reloadActivity?.();
              if (employeeId) {
                await refreshBalance(employeeId);
              }
              if (tx.kind === "deposit") {
                const refreshedStats = await getEmployerStats();
                setStats(refreshedStats);
              }
            }

            if (status === "failed") {
              addNotification("Transaction failed", "error");
              await reloadActivity?.();
            }
          }),
        );

        results.forEach((result, i) => {
          if (result.status === "rejected") {
            console.error(`Tx poll error for ${pending[i]?.txHash}:`, result.reason);
          }
        });
      } finally {
        inflightRef.current = false;
      }
    }, 1800);

    return () => window.clearInterval(poll);
  }, [
    transactionQueue,
    employeeId,
    addNotification,
    refreshBalance,
    setStats,
    patchActivityStatus,
    reloadActivity,
  ]);

  return { transactionQueue, activeTx, queueTransaction };
}

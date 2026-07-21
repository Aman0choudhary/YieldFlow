import { ArrowDownRight, ArrowUpRight, CheckCircle2, ExternalLink, X } from "lucide-react";
import type { DisplayStats } from "../types";
import { explorerUrl, formatMoney, shortAddress } from "../utils";

export type ReceiptData = {
  type: "deposit" | "withdraw";
  amount: string;
  txHash: string;
};

type ReceiptDialogProps = {
  receipt: ReceiptData;
  displayStats: DisplayStats;
  onClose: () => void;
  onOpenActivity: () => void;
};

export function ReceiptDialog({
  receipt,
  displayStats,
  onClose,
  onOpenActivity,
}: ReceiptDialogProps) {
  const numeric = Number(receipt.amount.replace(/[^0-9.]/g, "")) || 0;
  const isDeposit = receipt.type === "deposit";

  return (
    <div className="drawer-backdrop confirm-backdrop" role="presentation" onClick={onClose}>
      <div
        className="confirm-dialog receipt-dialog glass-panel"
        role="dialog"
        aria-modal="true"
        aria-label={isDeposit ? "Deposit receipt" : "Withdrawal receipt"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <div>
            <p className="label">Settlement receipt</p>
            <h2>{isDeposit ? "Pay run submitted" : "Payout submitted"}</h2>
          </div>
          <button type="button" className="chip chip-btn" onClick={onClose} aria-label="Close receipt">
            <X size={14} />
          </button>
        </div>

        <div className="confirm-hero">
          <div className="confirm-icon-ring receipt-success-ring">
            <CheckCircle2 size={28} />
          </div>
          <strong className="confirm-amount-value">
            {isDeposit ? `$${receipt.amount}` : formatMoney(numeric, 2)}
          </strong>
          <small>USDC · pending confirmation</small>
        </div>

        {isDeposit && (
          <div className="confirm-preview split-preview">
            <div className="setting-row">
              <strong>{formatMoney(numeric * (displayStats.bufferPercent / 100), 2)}</strong>
              <small>Buffer route ({displayStats.bufferPercent}%)</small>
            </div>
            <div className="setting-row">
              <strong>
                {formatMoney(numeric * (displayStats.yieldRoutePercent / 100), 2)}
              </strong>
              <small>Yield route ({displayStats.yieldRoutePercent}%)</small>
            </div>
            <div className="setting-row">
              <strong>{displayStats.projectedApy}%</strong>
              <small>Projected APY</small>
            </div>
          </div>
        )}

        {!isDeposit && (
          <div className="confirm-preview split-preview">
            <div className="setting-row">
              <strong>{formatMoney(numeric, 2)}</strong>
              <small>Unlocked amount settling</small>
            </div>
            <div className="setting-row">
              <strong>Passkey wallet</strong>
              <small>Destination</small>
            </div>
          </div>
        )}

        <div className="tx-hash drawer-hash receipt-hash">
          <code title={receipt.txHash}>{shortAddress(receipt.txHash)}</code>
          <a
            className="icon-chip"
            href={explorerUrl(receipt.txHash)}
            target="_blank"
            rel="noreferrer"
            aria-label="Open in explorer"
          >
            <ExternalLink size={12} />
          </a>
        </div>

        <div className="confirm-actions">
          <button
            className="primary-btn"
            type="button"
            onClick={() => {
              onOpenActivity();
              onClose();
            }}
          >
            {isDeposit ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            View in audit ledger
          </button>
          <button className="secondary-btn" type="button" onClick={onClose}>
            Keep operating
          </button>
        </div>
      </div>
    </div>
  );
}

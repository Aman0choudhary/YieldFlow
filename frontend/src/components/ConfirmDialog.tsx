import { ArrowDownRight, ArrowUpRight, AlertTriangle, X } from "lucide-react";
import type { DisplayStats } from "../types";
import { formatMoney } from "../utils";

type ConfirmDialogProps = {
  type: "deposit" | "withdraw";
  amount: string;
  displayStats: DisplayStats;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  type,
  amount,
  displayStats,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const numeric = Number(amount.replace(/[^0-9.]/g, "")) || 0;
  const isDeposit = type === "deposit";

  return (
    <div className="drawer-backdrop confirm-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="confirm-dialog glass-panel"
        role="dialog"
        aria-modal="true"
        aria-label={isDeposit ? "Confirm payroll deposit" : "Confirm withdrawal"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <div>
            <p className="label">{isDeposit ? "Confirm deposit" : "Confirm withdrawal"}</p>
            <h2>{isDeposit ? "Fund pay run" : "Settle to wallet"}</h2>
          </div>
          <button type="button" className="chip chip-btn" onClick={onCancel} aria-label="Cancel">
            <X size={14} />
          </button>
        </div>

        <div className="confirm-hero">
          <div className="confirm-icon-ring">
            {isDeposit ? <ArrowUpRight size={28} /> : <ArrowDownRight size={28} />}
          </div>
          <strong className="confirm-amount-value">
            {isDeposit ? `$${amount}` : formatMoney(numeric, 2)}
          </strong>
          <small>USDC</small>
        </div>

        {isDeposit && (
          <div className="confirm-preview split-preview">
            <div className="setting-row">
              <strong>{formatMoney(numeric * (displayStats.bufferPercent / 100), 2)}</strong>
              <small>Buffer ({displayStats.bufferPercent}%)</small>
            </div>
            <div className="setting-row">
              <strong>
                {formatMoney(numeric * (displayStats.yieldRoutePercent / 100), 2)}
              </strong>
              <small>Yield route ({displayStats.yieldRoutePercent}%)</small>
            </div>
            <div className="setting-row">
              <strong>{displayStats.projectedApy}%</strong>
              <small>Projected APY after deposit</small>
            </div>
          </div>
        )}

        {!isDeposit && (
          <div className="confirm-preview split-preview">
            <div className="setting-row">
              <strong>{formatMoney(numeric, 2)}</strong>
              <small>Unlocked balance to settle</small>
            </div>
            <div className="setting-row">
              <strong>Passkey wallet</strong>
              <small>Destination</small>
            </div>
          </div>
        )}

        <div className="confirm-warning">
          <AlertTriangle size={14} />
          <span>
            {isDeposit
              ? "This will fund the payroll pool. Capital is allocated to buffer and yield routes immediately."
              : "This will settle your unlocked USDC to the passkey-bound wallet. The stream continues after settlement."}
          </span>
        </div>

        <div className="confirm-actions">
          <button className="primary-btn" type="button" onClick={onConfirm}>
            {isDeposit ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {isDeposit ? "Confirm deposit" : "Confirm withdrawal"}
          </button>
          <button className="secondary-btn" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

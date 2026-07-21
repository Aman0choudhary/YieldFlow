import { RefreshCcw, Settings2, X } from "lucide-react";

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
  sdkMode: string;
  networkLabel: string;
  resetting: boolean;
  onResetDemo: () => void;
};

export function SettingsPanel({
  open,
  onClose,
  sdkMode,
  networkLabel,
  resetting,
  onResetDemo,
}: SettingsPanelProps) {
  if (!open) return null;

  return (
    <div className="drawer-backdrop confirm-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="settings-panel glass-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Demo settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <div>
            <p className="label">Settings</p>
            <h2>Demo controls</h2>
          </div>
          <button type="button" className="chip chip-btn" onClick={onClose} aria-label="Close settings">
            <X size={14} />
          </button>
        </div>

        <div className="split-preview">
          <div className="setting-row">
            <strong>{sdkMode}</strong>
            <small>SDK mode (VITE_YIELDFLOW_SDK)</small>
          </div>
          <div className="setting-row">
            <strong>{networkLabel}</strong>
            <small>Network label</small>
          </div>
        </div>

        <p className="muted">
          Reset clears mock localStorage (session, pool, deposits, activity) and reloads seed ledger
          rows. Use before a live demo.
        </p>

        <div className="confirm-actions">
          <button
            className="primary-btn"
            type="button"
            onClick={onResetDemo}
            disabled={resetting}
          >
            <RefreshCcw size={16} className={resetting ? "spin" : undefined} />
            {resetting ? "Resetting..." : "Reset demo state"}
          </button>
          <button className="secondary-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="muted settings-hint">
          <Settings2 size={12} /> Phase 3 live chain uses the same UI once contract IDs are configured.
        </p>
      </aside>
    </div>
  );
}

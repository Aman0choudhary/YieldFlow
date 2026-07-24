import { useEffect, useState } from "react";
import { DEMO_EMPLOYEE_ADDRESS, DEMO_EMPLOYEE_ID, sdk } from "../sdk/yieldflow-sdk";
import { SectionHeader } from "./SectionHeader";

type Row = {
  id: string;
  name: string;
  role: string;
  status: "pending" | "approved" | "paused";
  department: string;
  monthlyRate: string;
  hourlyStreamRate: string;
  wallet: string;
  passkeyStatus: string;
  message?: string;
};

export function ApprovalScreen({ onNavigate }: { onNavigate: (view: any) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(DEMO_EMPLOYEE_ID);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Row[]>([
    {
      id: DEMO_EMPLOYEE_ID,
      name: "Demo Employee",
      role: "Live Testnet Stream",
      status: "pending",
      department: "YieldFlow MVP",
      monthlyRate: "Live stream",
      hourlyStreamRate: "On-chain rate",
      wallet: DEMO_EMPLOYEE_ADDRESS,
      passkeyStatus: "Demo session / Passkey-shaped UX",
    },
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await sdk.getApprovalStatus(DEMO_EMPLOYEE_ID);
        if (cancelled) return;
        const bal = await sdk.getEmployeeBalance(DEMO_EMPLOYEE_ID);
        if (cancelled) return;
        setEmployees((rows) =>
          rows.map((row) =>
            row.id === DEMO_EMPLOYEE_ID
              ? {
                  ...row,
                  status: status.approved ? "approved" : "pending",
                  wallet: status.walletAddress || DEMO_EMPLOYEE_ADDRESS,
                  monthlyRate: `$${(bal.streamCap ?? 0).toFixed(2)} stream cap`,
                  hourlyStreamRate: `$${(bal.ratePerSecond * 3600).toFixed(4)}/hr`,
                  message: status.approved ? "Stream active on-chain" : "No active stream detected",
                }
              : row
          )
        );
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load approval status");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBusyId(id);
    setError(null);
    try {
      const res = await sdk.approveEmployeePeriod(id);
      setEmployees((rows) =>
        rows.map((emp) =>
          emp.id === id
            ? {
                ...emp,
                status: res.approved ? "approved" : emp.status,
                message: res.message || (res.txId ? `Tx ${res.txId.slice(0, 12)}…` : undefined),
              }
            : emp
        )
      );
      if (!res.approved) {
        setError(res.message || "Approval did not complete");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve stream failed");
    } finally {
      setBusyId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      <section className="section-block" style={{ paddingTop: "var(--spacer-32)" }}>
        <SectionHeader
          index="01"
          eyebrow="STREAM AUTHORIZATION"
          thesis="Authorize the live testnet employee stream."
          paragraph="Approve checks on-chain stream state. If missing, the API attempts create_stream with the employer signer."
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 var(--spacer-24)",
            marginBottom: "var(--spacer-16)",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button className="btn btn-outline" style={{ fontSize: "12px" }} onClick={() => onNavigate("login")}>
            ← Back to Home Landing
          </button>
          <button className="btn btn-outline" style={{ fontSize: "12px" }} onClick={() => onNavigate("employer")}>
            ← Back to Treasury Dashboard
          </button>
        </div>

        {error && (
          <p className="label" style={{ color: "var(--pink)", padding: "0 var(--spacer-24)" }}>
            {error}
          </p>
        )}

        <div className="df-grid" style={{ marginTop: "var(--spacer-16)" }}>
          <div className="df-cell full-width slide-up" style={{ padding: 0 }}>
            {employees.map((emp) => {
              const isExpanded = expandedId === emp.id;
              return (
                <div key={emp.id} className="expandable-card" onClick={() => toggleExpand(emp.id)}>
                  <div className="expandable-card-header">
                    <div>
                      <h3 style={{ fontSize: "18px", marginBottom: "4px" }}>{emp.name}</h3>
                      <span className="label" style={{ color: "var(--grey-300)" }}>
                        {emp.role} · {emp.department}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacer-24)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor:
                              emp.status === "approved"
                                ? "var(--theme-accent)"
                                : emp.status === "pending"
                                  ? "var(--orange)"
                                  : "var(--pink)",
                          }}
                        />
                        <span
                          className="label"
                          style={{
                            color: emp.status === "approved" ? "var(--theme-accent)" : "var(--theme-fg)",
                          }}
                        >
                          {emp.status}
                        </span>
                      </div>

                      {emp.status !== "approved" && (
                        <button
                          className="btn"
                          style={{ padding: "8px 16px", fontSize: "12px" }}
                          disabled={busyId === emp.id}
                          onClick={(e) => void handleApprove(emp.id, e)}
                        >
                          {busyId === emp.id ? "Approving…" : "Approve Stream"}
                        </button>
                      )}

                      <span className="label" style={{ color: "var(--grey-300)", fontSize: "12px" }}>
                        {isExpanded ? "▲ Hide Detail" : "▼ Expand Detail"}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="expandable-card-body fade-in">
                      <div>
                        <span className="label" style={{ color: "var(--grey-300)" }}>
                          STREAM ALLOCATION
                        </span>
                        <div style={{ fontFamily: "FK Roman Standard", fontSize: "20px", marginTop: "4px" }}>
                          {emp.monthlyRate}
                        </div>
                      </div>
                      <div>
                        <span className="label" style={{ color: "var(--grey-300)" }}>
                          HOURLY STREAM RATE
                        </span>
                        <div
                          style={{
                            fontFamily: "FK Roman Standard",
                            fontSize: "20px",
                            marginTop: "4px",
                            color: "var(--theme-accent)",
                          }}
                        >
                          {emp.hourlyStreamRate}
                        </div>
                      </div>
                      <div>
                        <span className="label" style={{ color: "var(--grey-300)" }}>
                          SOROBAN WALLET
                        </span>
                        <div style={{ fontFamily: "NON Natural Mono", fontSize: "12px", marginTop: "4px", wordBreak: "break-all" }}>
                          {emp.wallet}
                        </div>
                      </div>
                      <div>
                        <span className="label" style={{ color: "var(--grey-300)" }}>
                          AUTH / STATUS
                        </span>
                        <div
                          style={{
                            fontFamily: "NON Natural Mono",
                            fontSize: "12px",
                            marginTop: "4px",
                            color: "var(--theme-accent)",
                          }}
                        >
                          {emp.message || emp.passkeyStatus}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-block">
        <SectionHeader
          index="02"
          eyebrow="NOTE"
          thesis="MVP authorization surface."
          paragraph="Only the live demo employee is wired to testnet contracts. Multi-employee HR approvals remain UI-ready for the next milestone."
        />
      </section>
    </>
  );
}
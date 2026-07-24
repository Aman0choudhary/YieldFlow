import { useState } from 'react';
import { sdk } from '../sdk/yieldflow-sdk';
import { SectionHeader } from './SectionHeader';

export function ApprovalScreen({ onNavigate }: { onNavigate: (view: any) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>('emp_001');

  const [employees, setEmployees] = useState([
    {
      id: 'emp_001',
      name: 'Alice Chen',
      role: 'Staff Systems Engineer',
      status: 'pending',
      department: 'Infrastructure',
      monthlyRate: '$14,500.00',
      hourlyStreamRate: '$90.62/hr',
      wallet: 'G...82K1',
      passkeyStatus: 'Verified (FaceID)'
    },
    {
      id: 'emp_002',
      name: 'Bob Smith',
      role: 'Lead UI Architect',
      status: 'approved',
      department: 'Frontend Design',
      monthlyRate: '$12,800.00',
      hourlyStreamRate: '$80.00/hr',
      wallet: 'G...39X4',
      passkeyStatus: 'Verified (TouchID)'
    },
    {
      id: 'emp_003',
      name: 'Charlie Davis',
      role: 'Smart Contract Auditor',
      status: 'paused',
      department: 'Security & Soroban',
      monthlyRate: '$16,000.00',
      hourlyStreamRate: '$100.00/hr',
      wallet: 'G...99B2',
      passkeyStatus: 'Hardware Token'
    }
  ]);

  const mockAuditHistory = [
    { id: 'aud_501', worker: 'Elena Rostova', action: 'Stream Approved', rate: '$11,000/mo', date: '2026-07-21', admin: 'Treasury Admin #1' },
    { id: 'aud_502', worker: 'Marcus Vance', action: 'Rate Adjusted (+8%)', rate: '$13,500/mo', date: '2026-07-15', admin: 'HR Admin' },
    { id: 'aud_503', worker: 'David K.', action: 'Stream Terminated', rate: '$0.00', date: '2026-07-01', admin: 'Treasury Admin #2' }
  ];

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await sdk.approveEmployeePeriod(id);
    if (res.approved) {
      setEmployees(employees.map(emp => emp.id === id ? { ...emp, status: 'approved' } : emp));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      {/* 01 — STREAM MANAGEMENT */}
      <section className="section-block" style={{ paddingTop: 'var(--spacer-32)' }}>
        <SectionHeader
          index="01"
          eyebrow="STREAM AUTHORIZATION"
          thesis="Review worker authorizations & Soroban contract parameters."
          paragraph="Click or hover any employee row to expand smart contract allocation, hourly stream rate, and hardware passkey credentials (Dragonfly bio reveal style)."
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 var(--spacer-24)', marginBottom: 'var(--spacer-16)' }}>
          <button className="btn btn-outline" style={{ fontSize: '12px' }} onClick={() => onNavigate('login')}>
            ← Back to Home Landing
          </button>
          <button className="btn btn-outline" style={{ fontSize: '12px' }} onClick={() => onNavigate('employer')}>
            ← Back to Treasury Dashboard
          </button>
        </div>

        <div className="df-grid" style={{ marginTop: 'var(--spacer-16)' }}>
          <div className="df-cell full-width slide-up" style={{ padding: 0 }}>
            {employees.map((emp) => {
              const isExpanded = expandedId === emp.id;
              return (
                <div
                  key={emp.id}
                  className="expandable-card"
                  onClick={() => toggleExpand(emp.id)}
                >
                  <div className="expandable-card-header">
                    <div>
                      <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{emp.name}</h3>
                      <span className="label" style={{ color: 'var(--grey-300)' }}>
                        {emp.role} · {emp.department}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacer-24)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: emp.status === 'approved' ? 'var(--theme-accent)' : 
                                         emp.status === 'pending' ? 'var(--orange)' : 'var(--pink)'
                        }} />
                        <span className="label" style={{
                          color: emp.status === 'approved' ? 'var(--theme-accent)' : 'var(--theme-fg)'
                        }}>
                          {emp.status}
                        </span>
                      </div>

                      {emp.status !== 'approved' && (
                        <button
                          className="btn"
                          style={{ padding: '8px 16px', fontSize: '12px' }}
                          onClick={(e) => handleApprove(emp.id, e)}
                        >
                          Approve Stream
                        </button>
                      )}

                      <span className="label" style={{ color: 'var(--grey-300)', fontSize: '12px' }}>
                        {isExpanded ? '▲ Hide Detail' : '▼ Expand Detail'}
                      </span>
                    </div>
                  </div>

                  {/* EXPANDABLE DETAIL (Dragonfly Show Bio pattern) */}
                  {isExpanded && (
                    <div className="expandable-card-body fade-in">
                      <div>
                        <span className="label" style={{ color: 'var(--grey-300)' }}>MONTHLY ALLOCATION</span>
                        <div style={{ fontFamily: 'FK Roman Standard', fontSize: '20px', marginTop: '4px' }}>{emp.monthlyRate}</div>
                      </div>
                      <div>
                        <span className="label" style={{ color: 'var(--grey-300)' }}>HOURLY STREAM RATE</span>
                        <div style={{ fontFamily: 'FK Roman Standard', fontSize: '20px', marginTop: '4px', color: 'var(--theme-accent)' }}>{emp.hourlyStreamRate}</div>
                      </div>
                      <div>
                        <span className="label" style={{ color: 'var(--grey-300)' }}>SOROBAN WALLET</span>
                        <div style={{ fontFamily: 'NON Natural Mono', fontSize: '14px', marginTop: '4px' }}>{emp.wallet}</div>
                      </div>
                      <div>
                        <span className="label" style={{ color: 'var(--grey-300)' }}>PASSKEY VERIFICATION</span>
                        <div style={{ fontFamily: 'NON Natural Mono', fontSize: '14px', marginTop: '4px', color: 'var(--theme-accent)' }}>{emp.passkeyStatus}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 02 — APPROVAL AUDIT LOG */}
      <section className="section-block">
        <SectionHeader
          index="02"
          eyebrow="AUDIT LOG"
          thesis="Historical stream activations & adjustments."
          paragraph="Immutable log of stream parameter updates signed by treasury multisig keypairs."
        />

        <div className="df-grid" style={{ marginTop: 'var(--spacer-24)' }}>
          <div className="df-cell full-width slide-up" style={{ animationDelay: '0.2s', padding: 0 }}>
            <table className="table-df">
              <thead>
                <tr>
                  <th>Audit Ref</th>
                  <th>Worker Name</th>
                  <th>Action Executed</th>
                  <th>Monthly Allocation</th>
                  <th>Timestamp</th>
                  <th>Authorizing Admin</th>
                </tr>
              </thead>
              <tbody>
                {mockAuditHistory.map((item) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--grey-300)' }}>{item.id}</td>
                    <td style={{ fontWeight: 600 }}>{item.worker}</td>
                    <td style={{ color: 'var(--theme-accent)' }}>{item.action}</td>
                    <td>{item.rate}</td>
                    <td style={{ color: 'var(--grey-300)' }}>{item.date}</td>
                    <td style={{ color: 'var(--grey-300)' }}>{item.admin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

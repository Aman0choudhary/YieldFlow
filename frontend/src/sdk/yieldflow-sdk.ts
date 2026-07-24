import type { YieldFlowSDK, TxStatus, EmployerStats, EmployeeBalance, ApprovalStatus } from './types';

// Mock implementation for UI prototyping
class MockYieldFlowSDK implements YieldFlowSDK {
  async connectEmployer(): Promise<{ address: string }> {
    return new Promise((resolve) => setTimeout(() => resolve({ address: 'GXYZ...1234' }), 500));
  }

  async depositPayroll(_amount: number): Promise<TxStatus> {
    return new Promise((resolve) => setTimeout(() => resolve({ txId: '0xabc...def', status: 'success' }), 1200));
  }

  async getEmployerStats(): Promise<EmployerStats> {
    return new Promise((resolve) => setTimeout(() => resolve({
      totalPool: 250000.00,
      yieldEarned: 1245.50,
      bufferStatus: {
        available: 50000.00,
        earningYield: 200000.00
      }
    }), 300));
  }

  async loginEmployee(): Promise<{ employeeId: string }> {
    return new Promise((resolve) => setTimeout(() => resolve({ employeeId: 'emp_001' }), 800));
  }

  async getEmployeeBalance(_id: string): Promise<EmployeeBalance> {
    return new Promise((resolve) => setTimeout(() => resolve({
      unlockedAmount: 3450.25,
      // Approx $0.001 per second
      ratePerSecond: 0.0012
    }), 400));
  }

  async withdraw(_id: string): Promise<TxStatus & { amountReceived: number }> {
    return new Promise((resolve) => setTimeout(() => resolve({
      txId: '0xdef...789',
      status: 'success',
      amountReceived: 3450.25
    }), 1500));
  }

  async approveEmployeePeriod(_id: string): Promise<{ approved: boolean }> {
    return new Promise((resolve) => setTimeout(() => resolve({ approved: true }), 600));
  }

  async getApprovalStatus(_id: string): Promise<ApprovalStatus> {
    return new Promise((resolve) => setTimeout(() => resolve({ approved: true }), 300));
  }
}

export const sdk = new MockYieldFlowSDK();

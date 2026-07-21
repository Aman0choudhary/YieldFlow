import { useCallback, useState } from "react";
import {
  connectEmployer,
  getEmployeeBalance,
  loginEmployee,
  restoreEmployeeSession,
} from "../sdk/yieldflow-sdk";
import type {
  EmployeeBalance,
  EmployeeSession,
  EmployerConnection,
} from "../sdk/yieldflow-sdk";
import type { Notification } from "../types";

export function useSession(
  addNotification: (message: string, type: Notification["type"]) => void,
  reloadActivity?: () => Promise<unknown>,
) {
  const [employer, setEmployer] = useState<EmployerConnection | null>(null);
  const [employee, setEmployee] = useState<EmployeeSession | null>(null);
  const [balance, setBalance] = useState<EmployeeBalance | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  const initEmployer = useCallback(async () => {
    const connection = await connectEmployer();
    setEmployer(connection);
    return connection;
  }, []);

  const restoreSession = useCallback(async () => {
    const restore = await restoreEmployeeSession();
    if (restore.employeeId) {
      setEmployee({
        employeeId: restore.employeeId,
        name: "Aditiya Sharma",
        walletAddress: "CCONTRACT...PASSKEY...YF01",
      });
      const nextBalance = await getEmployeeBalance(restore.employeeId);
      setBalance(nextBalance);
    }
  }, []);

  const clearSession = useCallback(() => {
    setEmployee(null);
    setBalance(null);
  }, []);

  const handleLogin = useCallback(async () => {
    if (authenticating) return;
    setAuthenticating(true);

    try {
      const session = await loginEmployee();
      setEmployee(session);
      addNotification("Passkey login complete.", "success");
      // SDK already wrote the auth ledger row — reload, do not double-push.
      await reloadActivity?.();
      const nextBalance = await getEmployeeBalance(session.employeeId);
      setBalance(nextBalance);
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      addNotification(message, "error");
      return null;
    } finally {
      setAuthenticating(false);
    }
  }, [authenticating, addNotification, reloadActivity]);

  const refreshBalance = useCallback(async (employeeId: string) => {
    const refreshed = await getEmployeeBalance(employeeId);
    setBalance(refreshed);
  }, []);

  return {
    employer,
    employee,
    balance,
    authenticating,
    initEmployer,
    restoreSession,
    handleLogin,
    refreshBalance,
    setBalance,
    clearSession,
  };
}

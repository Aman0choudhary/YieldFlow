import { useCallback, useEffect, useState } from "react";
import type { Notification } from "../types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (message: string, type: Notification["type"]) => {
      const next: Notification = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: type === "success" ? "Success" : type === "error" ? "Failed" : "Update",
        message,
        type,
        timestamp: Date.now(),
      };
      setNotifications((current) => [next, ...current].slice(0, 4));
    },
    [],
  );

  useEffect(() => {
    if (!notifications.length) return;
    const timer = window.setTimeout(() => {
      setNotifications((current) => current.slice(1));
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [notifications]);

  return { notifications, addNotification };
}

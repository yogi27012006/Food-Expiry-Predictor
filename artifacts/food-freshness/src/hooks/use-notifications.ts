import { useEffect, useState } from "react";
import { useListFoodItems } from "@workspace/api-client-react";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const { data: items } = useListFoodItems();

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  useEffect(() => {
    if (permission !== "granted" || !items) return;

    const notifiedKeys = JSON.parse(localStorage.getItem("notified_food_items") || "[]");
    let newNotifications = 0;

    items.forEach((item) => {
      // Notify if expiring today or tomorrow (daysUntilExpiry <= 1)
      if (item.daysUntilExpiry <= 1 && !notifiedKeys.includes(item.id)) {
        const title = item.daysUntilExpiry < 0 
          ? "Food Expired!" 
          : item.daysUntilExpiry === 0 
            ? "Expiring Today!" 
            : "Expiring Tomorrow!";
            
        new Notification(title, {
          body: `${item.foodName || 'An item'} is ${item.freshnessLabel.toLowerCase()} and needs attention.`,
          icon: "/favicon.svg"
        });

        notifiedKeys.push(item.id);
        newNotifications++;
      }
    });

    if (newNotifications > 0) {
      localStorage.setItem("notified_food_items", JSON.stringify(notifiedKeys));
    }
  }, [items, permission]);

  const expiringCount = items?.filter(i => i.daysUntilExpiry <= 2).length || 0;

  return {
    permission,
    requestPermission,
    expiringCount
  };
}

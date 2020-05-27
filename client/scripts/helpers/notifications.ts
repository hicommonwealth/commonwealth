
import { Notification } from 'models';

export const sortNotifications = (n: Notification[], prop: string, prop2: string) => {
  return Object.values(n.reduce((acc, obj) => {
    const key = obj[prop][prop2];
    if (!acc[key]) acc[key] = [];
    acc[key].push(obj);
    return acc;
  }, {}));
};

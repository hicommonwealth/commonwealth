import { Notification, NotificationSubscription } from 'models';

export const batchNotifications = (n: Notification[], prop: string, prop2: string) => {
  return Object.values(n.reduce((acc, obj) => {
    const key = obj[prop][prop2];
    if (!acc[key]) acc[key] = [];
    acc[key].push(obj);
    return acc;
  }, {}));
};

export const sortNotifications = (n: Notification[]) => {
  const batched =  batchNotifications(n, 'subscription', 'objectId');
  const unbatchChainEvents = [];
  batched.forEach((a: Notification[]) => {
    if (a[0].chainEvent) {
      a.forEach((n2) => unbatchChainEvents.push([n2]));
    } else {
      unbatchChainEvents.push(a);
    }
  });
  unbatchChainEvents.sort((a, b) => {
    return a[0].createdAt - b[0].createdAt;
  });
  return unbatchChainEvents;
};

export const sortSubscriptions = (n: NotificationSubscription[], prop: string) => {
  return Object.values(n.reduce((acc, obj) => {
    const key = obj[prop];
    if (!acc[key]) acc[key] = [];
    acc[key].push(obj);
    return acc;
  }, {}));
};

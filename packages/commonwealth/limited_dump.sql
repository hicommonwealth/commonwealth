\COPY (SELECT * FROM "Notifications" n WHERE n.created_at > NOW() - interval '15 days') TO 'Notifications.dat' WITH BINARY;
\COPY (SELECT s.* FROM "Subscriptions" s where s.id IN(SELECT nr.subscription_id FROM "NotificationsRead" nr INNER JOIN "Notifications" n on nr.notification_id = n.id WHERE n.created_at > NOW() - interval '15 days')) TO 'Subscriptions.dat' WITH BINARY;
\COPY (SELECT nr.* FROM "NotificationsRead" nr WHERE nr.notification_id IN (SELECT n.id FROM "Notifications" n WHERE n.created_at > NOW() - interval '15 days')) TO 'NotificationsRead.dat' WITH BINARY;

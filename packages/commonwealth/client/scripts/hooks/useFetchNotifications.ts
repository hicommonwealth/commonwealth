import {
  useKnockClient,
  useNotifications,
  useNotificationStore,
} from '@knocklabs/react';
import { useEffect } from 'react';

const KNOCK_IN_APP_FEED_ID =
  process.env.KNOCK_IN_APP_FEED_ID || 'fc6e68e5-b7b9-49c1-8fab-6dd7e3510ffb';

const useFetchNotifications = () => {
  const knockClient = useKnockClient();
  const feedClient = useNotifications(knockClient, KNOCK_IN_APP_FEED_ID);

  const { items } = useNotificationStore(feedClient);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        await feedClient.fetch();
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, [feedClient]);

  return { items };
};

export default useFetchNotifications;

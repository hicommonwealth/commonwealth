import {
  useKnockClient,
  useNotifications,
  useNotificationStore,
} from '@knocklabs/react';
import { useEffect } from 'react';
import useFetchPublicEnvVarQuery from '../configuration/fetchPublicEnvVar';

const useFetchNotifications = () => {
  const { data: configurationData } = useFetchPublicEnvVarQuery();

  const knockClient = useKnockClient();
  const feedClient = useNotifications(
    knockClient,
    configurationData!.KNOCK_IN_APP_FEED_ID,
  );

  const { items } = useNotificationStore(feedClient);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        await feedClient.fetch();
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications(); // eslint-disable-line @typescript-eslint/no-floating-promises
  }, [feedClient]);

  return { items, feedClient };
};

export default useFetchNotifications;

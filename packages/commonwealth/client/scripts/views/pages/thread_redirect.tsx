import axios from 'axios';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect } from 'react';
import app from 'state';
import { PageLoading } from './loading';

export default function ThreadRedirect({ identifier }: { identifier: string }) {
  const navigate = useCommonNavigate();

  useEffect(() => {
    const getThreadCommunity = async () => {
      const threadId = identifier.split('-')[0];

      const response = await axios
        .get(`${app.serverUrl()}/getThreads`, {
          params: {
            ids: [threadId],
          },
        })
        .then((r) => r['data']['result'][0])
        .catch(() => null);

      if (response && response.chain) {
        navigate(`/discussion/${identifier}`, {}, response.chain);
      } else {
        navigate('/error');
      }
    };
    getThreadCommunity();
  }, [navigate, identifier]);

  return <PageLoading />;
}

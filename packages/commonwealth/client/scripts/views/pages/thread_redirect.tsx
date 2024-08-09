import axios from 'axios';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect } from 'react';
import { SERVER_URL } from 'state/api/config';
import { PageLoading } from './loading';

const ThreadRedirect = ({ identifier }: { identifier: string }) => {
  const navigate = useCommonNavigate();

  useEffect(() => {
    const getThreadCommunity = async () => {
      const threadId = identifier.split('-')[0];

      const response = await axios
        .get(`${SERVER_URL}/getThreads`, {
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
};

export default ThreadRedirect;

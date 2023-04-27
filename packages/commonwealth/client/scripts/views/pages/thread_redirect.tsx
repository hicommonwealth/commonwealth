import React, { useEffect } from 'react';

import app from 'state';
import { PageLoading } from './loading';
import { useCommonNavigate } from 'navigation/helpers';

export default function ThreadRedirect({ identifier }: { identifier: string }) {
  const navigate = useCommonNavigate();

  useEffect(() => {
    const getThreadCommunity = async () => {
      const threadId = identifier.split('-')[0];

      const res = await app.threads.getThreadCommunityId(threadId);

      if (res && res.chain) {
        navigate(`/discussion/${identifier}`, {}, res.chain);
      } else {
        navigate('/error');
      }
    };
    getThreadCommunity();
  }, [navigate, identifier]);

  return <PageLoading />;
}

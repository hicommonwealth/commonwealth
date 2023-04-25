import React, { useEffect } from 'react';
import { NavigateOptions } from 'react-router-dom';

import app from 'state';
import { PageLoading } from './loading';
import { DefaultPage } from 'common-common/src/types';
import { useCommonNavigate } from 'navigation/helpers';
import { featureFlags } from 'helpers/feature-flags';

export default function ThreadRedirect({ identifier }) {
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

import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useGetThreadsByIdQuery } from 'state/api/threads';
import { LoadingIndicator } from '../components/LoadingIndicator/LoadingIndicator';

const ThreadRedirect = ({ identifier }: { identifier: string }) => {
  const navigate = useCommonNavigate();

  const threadId = parseInt(identifier.split('-')[0]);
  const { data: threads, error } = useGetThreadsByIdQuery({
    thread_ids: [threadId],
    apiCallEnabled: !!threadId,
  });
  const foundThread = threads?.[0];

  useRunOnceOnCondition({
    callback: () => {
      !foundThread || error
        ? navigate('/error')
        : navigate(
            `/discussion/${identifier}${window.location.search}`,
            { replace: true },
            foundThread?.community_id,
          );
    },
    shouldRun: !!(foundThread || error),
  });

  return <LoadingIndicator />;
};

export default ThreadRedirect;

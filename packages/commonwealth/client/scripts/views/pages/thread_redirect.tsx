import useGetThreadByIdQuery from 'client/scripts/state/api/threads/getThreadById';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { LoadingIndicator } from '../components/LoadingIndicator/LoadingIndicator';

const ThreadRedirect = ({ identifier }: { identifier: string }) => {
  const navigate = useCommonNavigate();

  const threadId = parseInt(identifier.split('-')[0]);
  const { data: foundThread, error } = useGetThreadByIdQuery(
    threadId,
    !!threadId,
  );

  useRunOnceOnCondition({
    callback: () => {
      !foundThread || error
        ? navigate('/error')
        : navigate(
            `/discussion/${identifier}${window.location.search}`,
            { replace: true },
            foundThread?.communityId,
          );
    },
    shouldRun: !!(foundThread || error),
  });

  return <LoadingIndicator />;
};

export default ThreadRedirect;

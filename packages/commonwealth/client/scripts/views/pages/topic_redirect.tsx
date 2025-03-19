import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useGetTopicByIdQuery } from 'state/api/topics';
import { PageLoading } from './loading';

const ThreadRedirect = ({ id }: { id: number }) => {
  const navigate = useCommonNavigate();

  const topicId = parseInt(`${id}`);
  const { data: topic, error } = useGetTopicByIdQuery({
    topicId: topicId,
    apiEnabled: !!topicId,
  });

  useRunOnceOnCondition({
    callback: () => {
      !topic || error
        ? navigate('/error')
        : navigate(
            `/discussions/${topic.name}${window.location.search}`,
            { replace: true },
            topic?.community_id,
          );
    },
    shouldRun: !!(topic || error),
  });

  return <PageLoading />;
};

export default ThreadRedirect;

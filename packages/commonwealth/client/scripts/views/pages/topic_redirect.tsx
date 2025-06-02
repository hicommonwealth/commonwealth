import { generateUrlPartForTopicIdentifiers } from '@hicommonwealth/shared';
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
      if (!topic || error) {
        navigate('/error');
        return;
      }

      // redirect to thread creation with the specified topic
      const params = new URLSearchParams(window.location.search);
      const newThread = params.get('newThread') === 'true';
      if (newThread) {
        const newParams = new URLSearchParams(window.location.search);
        newParams.delete('newThread');
        newParams.append('topic', topic.id);
        navigate(
          `/new/discussion?${newParams.toString()}`,
          { replace: true },
          topic?.community_id,
        );
        return;
      }

      // redirect to thread list view for the provided topic
      navigate(
        `/discussions/${generateUrlPartForTopicIdentifiers(topic.id, topic.name)}${window.location.search}`,
        { replace: true },
        topic?.community_id,
      );
    },
    shouldRun: !!(topic || error),
  });

  return <PageLoading />;
};

export default ThreadRedirect;

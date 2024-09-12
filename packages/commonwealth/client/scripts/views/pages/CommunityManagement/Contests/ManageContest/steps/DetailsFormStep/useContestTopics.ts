import { useEffect, useState } from 'react';

import app from 'state';
import { useFetchTopicsQuery } from 'state/api/topics';

import { ContestFormData } from '../../types';

interface UseContestTopicsProps {
  initialToggledTopicList: ContestFormData['toggledTopicList'];
}

const useContestTopics = ({
  initialToggledTopicList,
}: UseContestTopicsProps) => {
  const [toggledTopicList, setToggledTopicList] = useState<
    ContestFormData['toggledTopicList']
  >(initialToggledTopicList || []);

  const communityId = app.activeChainId() || '';
  const { data: topicsData } = useFetchTopicsQuery({
    communityId,
    apiEnabled: !!communityId,
  });

  // @ts-expect-error StrictNullChecks
  const sortedTopics = [...topicsData]?.sort((a, b) => {
    if (!a.order || !b.order) {
      return 1;
    }

    // if order is not defined, push topic to the end of the list
    return a.order - b.order;
  });

  // we need separate state to handle topic toggling
  useEffect(() => {
    if (topicsData) {
      const mappedTopics = topicsData.map(({ name, id }) => ({
        name,
        id,
        // for brand-new contest, set all
        // topics to false by default, otherwise restore existing state
        checked: initialToggledTopicList
          ? !!initialToggledTopicList?.find((t) => t.id === id)?.checked
          : false,
      }));
      setToggledTopicList(mappedTopics);
    }
  }, [initialToggledTopicList, topicsData]);

  const handleToggleTopic = (topicId: number) => {
    const isChecked = toggledTopicList.find(
      (topic) => topic.id === topicId,
    )?.checked;

    // only one can be checked at a time
    const mappedTopics = toggledTopicList.map((topic) => {
      if (topic.id === topicId) {
        return {
          ...topic,
          checked: !isChecked,
        };
      }
      return {
        ...topic,
        checked: false,
      };
    });

    setToggledTopicList(mappedTopics);
  };

  const topicsEnabledError = toggledTopicList.every(({ checked }) => !checked);

  return {
    toggledTopicList,
    handleToggleTopic,
    sortedTopics,
    topicsEnabledError,
  };
};

export default useContestTopics;

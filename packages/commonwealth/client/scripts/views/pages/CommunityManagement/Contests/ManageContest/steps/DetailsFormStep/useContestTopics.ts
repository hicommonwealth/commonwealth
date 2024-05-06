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
  const [allTopicsToggled, setAllTopicsToggled] = useState(
    initialToggledTopicList?.every(({ checked }) => checked),
  );
  const [toggledTopicList, setToggledTopicList] = useState<
    ContestFormData['toggledTopicList']
  >(initialToggledTopicList || []);

  const { data: topicsData } = useFetchTopicsQuery({
    communityId: app.activeChainId(),
  });

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
        // for brand-new contest, set all topics to true by default
        // otherwise, take value from saved contest
        checked: initialToggledTopicList
          ? !!initialToggledTopicList?.find((t) => t.id === id)?.checked
          : true,
      }));
      setToggledTopicList(mappedTopics);
      setAllTopicsToggled(mappedTopics.every(({ checked }) => checked));
    }
  }, [initialToggledTopicList, topicsData]);

  const handleToggleTopic = (topicId: number) => {
    const isChecked = toggledTopicList.find(
      (topic) => topic.id === topicId,
    )?.checked;

    const mappedTopics = toggledTopicList.map((topic) => {
      if (topic.id === topicId) {
        return {
          ...topic,
          checked: !isChecked,
        };
      }
      return topic;
    });

    const allChecked = mappedTopics.every(({ checked }) => checked);

    setToggledTopicList(mappedTopics);
    setAllTopicsToggled(allChecked);
  };

  const handleToggleAllTopics = () => {
    const mappedTopics = toggledTopicList?.map((topic) => ({
      name: topic.name,
      id: topic.id,
      checked: !allTopicsToggled,
    }));

    setToggledTopicList(mappedTopics);
    setAllTopicsToggled((prevState) => !prevState);
  };

  const topicsEnabledError = toggledTopicList.every(({ checked }) => !checked);

  return {
    allTopicsToggled,
    handleToggleAllTopics,
    toggledTopicList,
    handleToggleTopic,
    sortedTopics,
    topicsEnabledError,
  };
};

export default useContestTopics;

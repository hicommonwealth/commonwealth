import { notifyError } from 'client/scripts/controllers/app/notifications';
import type Topic from 'client/scripts/models/Topic';
import app from 'client/scripts/state';
import {
  useFetchTopicsQuery,
  useUpdateFeaturedTopicsOrderMutation,
} from 'client/scripts/state/api/topics';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/cw_button';
import DraggableTopicsList from 'client/scripts/views/modals/order_topics_modal/draggable_topics_list';
import React, { useState } from 'react';

export const ManageTopicsSection = () => {
  const getFilteredTopics = (rawTopics: Topic[]): Topic[] => {
    const topics = rawTopics
      .filter((topic) => topic.featuredInSidebar)
      .map((topic) => ({ ...topic } as Topic));

    if (!topics.length) return [];

    if (!topics[0].order) {
      return topics
        .sort((a, b) => a.name.localeCompare(b.name))
        .reduce((acc, curr, index) => {
          return [...acc, { ...curr, order: index + 1 }];
        }, []);
    } else {
      return topics.sort((a, b) => a.order - b.order);
    }
  };

  const { data: rawTopics } = useFetchTopicsQuery({
    communityId: app.activeChainId(),
  });

  const { mutateAsync: updateFeaturedTopicsOrder } =
    useUpdateFeaturedTopicsOrderMutation();

  const [topics, setTopics] = useState<Topic[]>(() =>
    getFilteredTopics(rawTopics),
  );

  const handleSave = async () => {
    try {
      await updateFeaturedTopicsOrder({ featuredTopics: topics });
    } catch (err) {
      notifyError('Failed to update order');
    }
  };

  return (
    <div className="OrderTopicsModal">
      <div className="content">
        <div className="featured-topic-list">
          {topics.length ? (
            <DraggableTopicsList topics={topics} setTopics={setTopics} />
          ) : (
            <CWText>No Topics to Reorder</CWText>
          )}
        </div>
      </div>
      <div className="footer">
        <CWButton
          label="Revert Changes"
          buttonType="secondary"
          buttonHeight="sm"
        />
        <CWButton
          buttonType="primary"
          buttonHeight="sm"
          onClick={handleSave}
          label="Save"
        />
      </div>
    </div>
  );
};

import { notifyError } from 'client/scripts/controllers/app/notifications';
import useBrowserWindow from 'client/scripts/hooks/useBrowserWindow';
import type Topic from 'client/scripts/models/Topic';
import app from 'client/scripts/state';
import {
  useFetchTopicsQuery,
  useUpdateFeaturedTopicsOrderMutation,
} from 'client/scripts/state/api/topics';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWModal } from 'client/scripts/views/components/component_kit/new_designs/CWModal';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/cw_button';
import { EditTopicModal } from 'client/scripts/views/modals/edit_topic_modal';
import DraggableTopicsList from 'client/scripts/views/modals/order_topics_modal/draggable_topics_list';
import React, { useState } from 'react';
import './ManageTopicsSection.scss';

export const ManageTopicsSection = () => {
  const getFilteredTopics = (rawTopics: Topic[]): Topic[] => {
    const topics = rawTopics
      .filter((topic) => topic.featuredInSidebar)
      .map((topic) => ({ ...topic } as Topic));

    if (!topics.length) return [];

    if (!topics[0].order) {
      return [...topics]
        .sort((a, b) => a.name.localeCompare(b.name))
        .reduce((acc, curr, index) => {
          return [...acc, { ...curr, order: index + 1 }];
        }, []);
    } else {
      return [...topics].sort((a, b) => a.order - b.order);
    }
  };

  const { isWindowExtraSmall } = useBrowserWindow({});

  const { data: rawTopics } = useFetchTopicsQuery({
    communityId: app.activeChainId(),
  });

  const { mutateAsync: updateFeaturedTopicsOrder } =
    useUpdateFeaturedTopicsOrderMutation();

  const [topics, setTopics] = useState<Topic[]>(() =>
    getFilteredTopics(rawTopics),
  );

  const [topicSelectedToEdit, setTopicSelectedToEdit] = useState<Topic>(null);

  const handleSave = async () => {
    try {
      await updateFeaturedTopicsOrder({ featuredTopics: topics });
    } catch (err) {
      notifyError('Failed to update order');
    }
  };

  const handleReversion = () => {
    setTopics(getFilteredTopics(rawTopics));
  };

  return (
    <div className="ManageTopicsSection">
      <div className="content">
        <div className="featured-topic-list">
          {topics.length ? (
            <DraggableTopicsList
              topics={getFilteredTopics(rawTopics)}
              setTopics={setTopics}
              onEdit={setTopicSelectedToEdit}
            />
          ) : (
            <CWText>No Topics to Reorder</CWText>
          )}
        </div>
      </div>
      <div className="actions">
        <CWButton
          label="Revert Changes"
          buttonType="tertiary"
          buttonWidth={isWindowExtraSmall ? 'full' : 'narrow'}
          buttonHeight="med"
          onClick={handleReversion}
        />
        <CWButton
          buttonType="primary"
          buttonHeight="med"
          buttonWidth={isWindowExtraSmall ? 'full' : 'narrow'}
          onClick={handleSave}
          label="Save Changes"
        />
      </div>

      <CWModal
        size="medium"
        content={
          <EditTopicModal
            topic={topicSelectedToEdit}
            onModalClose={() => {
              setTopicSelectedToEdit(null);
            }}
            noRedirect={true}
          />
        }
        onClose={() => setTopicSelectedToEdit(null)}
        open={!!topicSelectedToEdit}
      />
    </div>
  );
};

import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import useBrowserWindow from 'client/scripts/hooks/useBrowserWindow';
import type Topic from 'client/scripts/models/Topic';
import app from 'client/scripts/state';
import {
  useFetchTopicsQuery,
  useUpdateFeaturedTopicsOrderMutation,
} from 'client/scripts/state/api/topics';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import CWIconButton from 'client/scripts/views/components/component_kit/new_designs/CWIconButton';
import { CWModal } from 'client/scripts/views/components/component_kit/new_designs/CWModal';
import { EditTopicModal } from 'client/scripts/views/modals/edit_topic_modal';
import DraggableTopicsList from 'client/scripts/views/modals/order_topics_modal/draggable_topics_list';
import React, { useEffect, useState } from 'react';
import './ManageTopicsSection.scss';

export const ManageTopicsSection = () => {
  const getFeaturedTopics = (rawTopics: Topic[]): Topic[] => {
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

  const getRegularTopics = (rawTopics: Topic[]): Topic[] => {
    const topics = rawTopics
      .filter((topic) => !topic.featuredInSidebar)
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

  const [featuredTopics, setFeaturedTopics] = useState<Topic[]>(() =>
    getFeaturedTopics(rawTopics),
  );

  const [regularTopics, setRegularTopics] = useState<Topic[]>(() =>
    getRegularTopics(rawTopics),
  );

  const initialFeaturedTopics = getFeaturedTopics(rawTopics);

  const [topicSelectedToEdit, setTopicSelectedToEdit] = useState<Topic>(null);

  const handleSave = async () => {
    try {
      await updateFeaturedTopicsOrder({ featuredTopics: featuredTopics });
      notifySuccess('Topic order updated!');
    } catch (err) {
      notifyError('Failed to update topic order');
    }
  };

  const handleReversion = () => {
    setFeaturedTopics(initialFeaturedTopics);
  };

  useEffect(() => {
    setFeaturedTopics(getFeaturedTopics(rawTopics));
    setRegularTopics(getRegularTopics(rawTopics));
  }, [rawTopics]);

  return (
    <div className="ManageTopicsSection">
      <div className="content">
        <div className="featured-topic-list">
          <div className="header">
            <CWText type="h4">Featured Topics</CWText>
            <CWText type="b1">
              Manage the topics that appear in the sidebar of your community
            </CWText>
          </div>

          {featuredTopics.length ? (
            <DraggableTopicsList
              topics={featuredTopics}
              setTopics={setFeaturedTopics}
              onEdit={setTopicSelectedToEdit}
            />
          ) : (
            <CWText>No Topics to Reorder</CWText>
          )}
        </div>

        <div className="regular-topic-list">
          <div className="header">
            <CWText type="h4">Other Topics</CWText>
            <CWText type="b1">
              Manage the topics that appear in the discussion filter dropdown
            </CWText>
          </div>

          <div className="topic-list-container">
            {regularTopics.length ? (
              regularTopics.map((regTopic, index) => (
                <div key={index} className="topic-row">
                  <CWText>
                    {regTopic.name}
                    <CWIconButton
                      iconName="pencil"
                      buttonSize="sm"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setTopicSelectedToEdit(regTopic);
                      }}
                    />
                  </CWText>
                </div>
              ))
            ) : (
              <CWText>No Topics to View</CWText>
            )}
          </div>
        </div>
      </div>
      <div className="actions">
        <CWButton
          label="Revert Changes"
          buttonType="tertiary"
          buttonWidth={isWindowExtraSmall ? 'full' : 'narrow'}
          buttonHeight="med"
          onClick={handleReversion}
          disabled={initialFeaturedTopics.every(
            (value, index) => value.id === featuredTopics[index].id,
          )}
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

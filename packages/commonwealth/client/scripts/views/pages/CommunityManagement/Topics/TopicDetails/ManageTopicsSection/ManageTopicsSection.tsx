import { notifyError, notifySuccess } from 'controllers/app/notifications';
import useBrowserWindow from 'hooks/useBrowserWindow';
import type { Topic } from 'models/Topic';
import React, { useEffect, useState } from 'react';
import app from 'state';
import {
  useFetchTopicsQuery,
  useRefreshWeightedVotesMutation,
} from 'state/api/topics';
import {
  updateFeaturedTopicsOrderPayload,
  useUpdateFeaturedTopicsOrderMutation,
} from 'state/api/topics/updateFeaturedTopicsOrder';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { EditTopicModal } from 'views/modals/edit_topic_modal';
import DraggableTopicsList from 'views/modals/order_topics_modal/draggable_topics_list';
import './ManageTopicsSection.scss';

export const ManageTopicsSection = () => {
  const hasWeightedVoting = (topic: Topic): boolean => {
    console.log('topic', topic);
    return !!topic.weighted_voting;
  };

  const isRecalculationDisabled = (topic: Topic): boolean => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Check if a recalculation is currently in progress
    if (topic.recalculated_votes_start && !topic.recalculated_votes_finish) {
      return true;
    }

    // Check if the last recalculation was less than 5 minutes ago
    if (
      topic.recalculated_votes_start &&
      new Date(topic.recalculated_votes_start) > fiveMinutesAgo
    ) {
      return true;
    }

    return false;
  };

  const getLastRefreshText = (topic: Topic): string | null => {
    if (!topic.recalculated_votes_finish) {
      return null;
    }

    const finishTime = new Date(topic.recalculated_votes_finish);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - finishTime.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) {
      return 'Last refreshed less than a minute ago';
    } else if (diffInMinutes === 1) {
      return 'Last refreshed 1 minute ago';
    } else if (diffInMinutes < 60) {
      return `Last refreshed ${diffInMinutes} minutes ago`;
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours === 1) {
        return 'Last refreshed 1 hour ago';
      } else if (diffInHours < 24) {
        return `Last refreshed ${diffInHours} hours ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) {
          return 'Last refreshed 1 day ago';
        } else {
          return `Last refreshed ${diffInDays} days ago`;
        }
      }
    }
  };

  const getFeaturedTopics = (rawTopics: Topic[]): Topic[] => {
    const topics = rawTopics
      .filter((topic) => topic.featured_in_sidebar && !topic.archived_at)
      .map((topic) => ({ ...topic }) as Topic);

    if (!topics.length) return [];

    if (!topics[0].order) {
      return [...topics]
        .sort((a, b) => a.name.localeCompare(b.name))
        .reduce((acc, curr, index) => {
          return [...acc, { ...curr, order: index + 1 }];
        }, []);
    } else {
      // @ts-expect-error <StrictNullChecks/>
      return [...topics].sort((a, b) => a.order - b.order);
    }
  };

  const getRegularTopics = (rawTopics: Topic[]): Topic[] => {
    const topics = rawTopics
      .filter((topic) => !topic.featured_in_sidebar && !topic.archived_at)
      .map((topic) => ({ ...topic }) as Topic);

    if (!topics.length) return [];

    if (!topics[0].order) {
      return [...topics]
        .sort((a, b) => a.name.localeCompare(b.name))
        .reduce((acc, curr, index) => {
          return [...acc, { ...curr, order: index + 1 }];
        }, []);
    } else {
      // @ts-expect-error <StrictNullChecks/>
      return [...topics].sort((a, b) => a.order - b.order);
    }
  };

  const getArchivedTopics = (rawTopics: Topic[]): Topic[] => {
    const topics = rawTopics
      .filter((topic) => topic.archived_at)
      .map((topic) => ({ ...topic }) as Topic);

    if (!topics.length) return [];

    if (!topics[0].order) {
      return [...topics]
        .sort((a, b) => a.name.localeCompare(b.name))
        .reduce((acc, curr, index) => {
          return [...acc, { ...curr, order: index + 1 }];
        }, []);
    } else {
      // @ts-expect-error <StrictNullChecks/>
      return [...topics].sort((a, b) => a.order - b.order);
    }
  };

  const { isWindowExtraSmall } = useBrowserWindow({});

  const communityId = app.activeChainId() || '';
  const { data: rawTopics } = useFetchTopicsQuery({
    communityId,
    includeArchivedTopics: true,
    apiEnabled: !!communityId,
  });

  const { mutateAsync: updateFeaturedTopicsOrder } =
    useUpdateFeaturedTopicsOrderMutation();

  const { mutateAsync: refreshWeightedVotes, isPending: isRefreshingVotes } =
    useRefreshWeightedVotesMutation();

  const [featuredTopics, setFeaturedTopics] = useState<Topic[]>(() =>
    // @ts-expect-error <StrictNullChecks/>
    getFeaturedTopics(rawTopics),
  );

  const [regularTopics, setRegularTopics] = useState<Topic[]>(() =>
    // @ts-expect-error <StrictNullChecks/>
    getRegularTopics(rawTopics),
  );

  const [archivedTopics, setArchivedTopics] = useState<Topic[]>(() =>
    // @ts-expect-error <StrictNullChecks/>
    getArchivedTopics(rawTopics),
  );

  // @ts-expect-error <StrictNullChecks/>
  const initialFeaturedTopics = getFeaturedTopics(rawTopics);

  // @ts-expect-error <StrictNullChecks/>
  const [topicSelectedToEdit, setTopicSelectedToEdit] = useState<Topic>(null);

  // Track which topic is being recalculated
  const [recalculatingTopicId, setRecalculatingTopicId] = useState<
    number | null
  >(null);

  const handleSave = async () => {
    try {
      await updateFeaturedTopicsOrder(
        updateFeaturedTopicsOrderPayload({ featuredTopics }),
      );
      notifySuccess('Settings saved.');
    } catch (err) {
      notifyError('Failed to update topic order');
    }
  };

  const handleReversion = () => {
    setFeaturedTopics(initialFeaturedTopics);
  };

  const handleRecalculateVotes = async (topic: Topic) => {
    if (!topic.id) return;

    setRecalculatingTopicId(topic.id);
    try {
      await refreshWeightedVotes({
        topic_id: topic.id,
        community_id: communityId,
      });
    } catch (err) {
      console.error('Failed to recalculate votes:', err);
    } finally {
      setRecalculatingTopicId(null);
    }
  };

  useEffect(() => {
    // @ts-expect-error <StrictNullChecks/>
    setFeaturedTopics(getFeaturedTopics(rawTopics));
    // @ts-expect-error <StrictNullChecks/>
    setRegularTopics(getRegularTopics(rawTopics));
    // @ts-expect-error <StrictNullChecks/>
    setArchivedTopics(getArchivedTopics(rawTopics));
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
              hasWeightedVoting={hasWeightedVoting}
              onRecalculateVotes={handleRecalculateVotes}
              recalculatingTopicId={recalculatingTopicId}
              isRefreshingVotes={isRefreshingVotes}
              isRecalculationDisabled={isRecalculationDisabled}
              getLastRefreshText={getLastRefreshText}
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
                    <div className="topic-actions">
                      <CWIconButton
                        iconName="pencil"
                        buttonSize="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTopicSelectedToEdit(regTopic);
                        }}
                      />
                      {hasWeightedVoting(regTopic) && (
                        <div className="recalculate-votes-section">
                          <CWButton
                            label="Recalculate Votes"
                            buttonType="secondary"
                            buttonHeight="sm"
                            buttonWidth="narrow"
                            disabled={
                              recalculatingTopicId === regTopic.id ||
                              isRefreshingVotes ||
                              isRecalculationDisabled(regTopic)
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRecalculateVotes(regTopic);
                            }}
                          />
                          {getLastRefreshText(regTopic) && (
                            <CWText
                              type="caption"
                              className="last-refresh-text"
                            >
                              {getLastRefreshText(regTopic)}
                            </CWText>
                          )}
                        </div>
                      )}
                    </div>
                  </CWText>
                </div>
              ))
            ) : (
              <CWText>No Topics to View</CWText>
            )}
          </div>
        </div>

        <div className="regular-topic-list">
          <div className="header">
            <CWText type="h4">Archived Topics</CWText>
            <CWText type="b1">
              Manage the topics that you archived earlier
            </CWText>
          </div>

          <div className="topic-list-container">
            {archivedTopics.length ? (
              archivedTopics.map((regTopic, index) => (
                <div key={index} className="topic-row">
                  <CWText>
                    {regTopic.name}
                    <div className="topic-actions">
                      <CWIconButton
                        iconName="pencil"
                        buttonSize="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTopicSelectedToEdit(regTopic);
                        }}
                      />
                      {hasWeightedVoting(regTopic) && (
                        <div className="recalculate-votes-section">
                          <CWButton
                            label="Recalculate Votes"
                            buttonType="secondary"
                            buttonHeight="sm"
                            buttonWidth="narrow"
                            disabled={
                              recalculatingTopicId === regTopic.id ||
                              isRefreshingVotes ||
                              isRecalculationDisabled(regTopic)
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRecalculateVotes(regTopic);
                            }}
                          />
                          {getLastRefreshText(regTopic) && (
                            <CWText
                              type="caption"
                              className="last-refresh-text"
                            >
                              {getLastRefreshText(regTopic)}
                            </CWText>
                          )}
                        </div>
                      )}
                    </div>
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
            (value, index) => value.id === featuredTopics?.[index]?.id,
          )}
        />
        <CWButton
          buttonType="primary"
          buttonHeight="med"
          buttonWidth={isWindowExtraSmall ? 'full' : 'narrow'}
          onClick={() => {
            handleSave().catch(console.error);
          }}
          label="Save Changes"
        />
      </div>

      <CWModal
        size="medium"
        content={
          <EditTopicModal
            topic={topicSelectedToEdit}
            onModalClose={() => {
              // @ts-expect-error <StrictNullChecks/>
              setTopicSelectedToEdit(null);
            }}
            noRedirect={true}
          />
        }
        // @ts-expect-error <StrictNullChecks/>
        onClose={() => setTopicSelectedToEdit(null)}
        open={!!topicSelectedToEdit}
      />
    </div>
  );
};

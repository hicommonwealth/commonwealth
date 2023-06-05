import React, { useEffect, useState } from 'react';

import { parseCustomStages } from 'helpers';
import { isUndefined } from 'helpers/typeGuards';
import type Topic from '../../../models/Topic';
import { ThreadStage } from '../../../models/types';

import 'pages/discussions/recent_threads_header.scss';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import { StagesMenu } from './stages_menu';
import { TopicsMenu } from './topics_menu';
import { useCommonNavigate } from 'navigation/helpers';
import { Modal } from 'views/components/component_kit/cw_modal';
import { EditTopicModal } from 'views/modals/edit_topic_modal';
import useForceRerender from 'hooks/useForceRerender';
import useSidebarStore from 'state/ui/sidebar';
import { NewThreadForm } from '../../components/NewThreadForm';

type RecentThreadsHeaderProps = {
  stage: string;
  topic: string;
  totalThreadCount: number;
};

export const RecentThreadsHeader = ({
  stage,
  topic,
  totalThreadCount,
}: RecentThreadsHeaderProps) => {
  const navigate = useCommonNavigate();
  const [topicSelectedToEdit, setTopicSelectedToEdit] = useState<Topic>(null);
  const { stagesEnabled, customStages } = app.chain?.meta || {};

  const topics = app.topics.getByCommunity(app.activeChainId());

  const featuredTopics = topics
    .filter((t) => t.featuredInSidebar)
    .sort((a, b) => a.name.localeCompare(b.name))
    .sort((a, b) => a.order - b.order);

  const otherTopics = topics
    .filter((t) => !t.featuredInSidebar)
    .sort((a, b) => a.name.localeCompare(b.name));

  const selectedTopic = topics.find((t) => topic && topic === t.name);

  const stages = !customStages
    ? [
        ThreadStage.Discussion,
        ThreadStage.ProposalInReview,
        ThreadStage.Voting,
        ThreadStage.Passed,
        ThreadStage.Failed,
      ]
    : parseCustomStages(customStages);

  const selectedStage = stages.find((s) => s === (stage as ThreadStage));

  const buildUrlAndNavigate = (updatedTopic: string, updatedStage: string) => {
    let url = updatedTopic ? `/${updatedTopic}` : '';
    url += updatedStage ? `?stage=${updatedStage}` : '';
    navigate(`/discussions${url}`);
  };

  const onTopicChange = (updatedTopic) => {
    buildUrlAndNavigate(
      updatedTopic,
      stage // keep the current stage in url if any
    );
  };

  const onStageChange = (updatedStage) => {
    buildUrlAndNavigate(
      topic, // keep the current topic in url (if any)
      updatedStage
    );
  };

  return (
    <div className="RecentThreadsHeader">
      {app.chain?.meta && (
        <div className="header-row">
          <div className="buttons-row">
            {topics.length > 0 && (
              <TopicsMenu
                featuredTopics={featuredTopics}
                otherTopics={otherTopics}
                selectedTopic={selectedTopic}
                topic={topic}
                onEditClick={(editTopic) => setTopicSelectedToEdit(editTopic)}
                onTopicChange={onTopicChange}
              />
            )}
            {stagesEnabled && (
              <StagesMenu
                selectedStage={selectedStage}
                stage={stage}
                stages={stages}
                onStageChange={onStageChange}
              />
            )}
          </div>
        </div>
      )}

      <Modal
        content={
          <EditTopicModal
            topic={topicSelectedToEdit}
            onModalClose={() => setTopicSelectedToEdit(null)}
          />
        }
        onClose={() => setTopicSelectedToEdit(null)}
        open={!!topicSelectedToEdit}
      />
    </div>
  );
};

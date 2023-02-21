import React, { useEffect, useState } from 'react';

import { parseCustomStages } from 'helpers';
import { isUndefined } from 'helpers/typeGuards';
import { ThreadStage } from 'models';

import 'pages/discussions/recent_threads_header.scss';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import { StagesMenu } from './stages_menu';
import { TopicsMenu } from './topics_menu';
import { useCommonNavigate } from 'navigation/helpers';

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

  const [windowIsExtraSmall, setWindowIsExtraSmall] = useState(
    isWindowExtraSmall(window.innerWidth)
  );

  useEffect(() => {
    const onResize = () => {
      setWindowIsExtraSmall(isWindowExtraSmall(window.innerWidth));
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const { stagesEnabled, customStages } = app.chain.meta;

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

  return (
    <div className="RecentThreadsHeader">
      {isUndefined(topic) && (
        <>
          <div className="header-row">
            <CWText type="h3" fontWeight="semiBold" className="header-text">
              All Discussions
            </CWText>
            <div className="count-and-button">
              <CWText
                type="caption"
                fontWeight="medium"
                className="thread-count-text"
              >
                {totalThreadCount} Threads
              </CWText>
              {windowIsExtraSmall ? (
                <CWIconButton
                  iconName="plusCircle"
                  iconButtonTheme="black"
                  onClick={() => {
                    navigate('/new/discussion');
                  }}
                />
              ) : (
                <CWButton
                  buttonType="mini-black"
                  label="Create Thread"
                  iconLeft="plus"
                  onClick={() => {
                    navigate('/new/discussion');
                  }}
                />
              )}
            </div>
          </div>
          <CWText className="subheader-text">
            This section is for the community to discuss how to manage the
            community treasury and spending on contributor grants, community
            initiatives, liquidity mining and other programs.
          </CWText>
        </>
      )}
      {app.chain?.meta && (
        <div className="buttons-row">
          {topics.length > 0 && (
            <TopicsMenu
              featuredTopics={featuredTopics}
              otherTopics={otherTopics}
              selectedTopic={selectedTopic}
              topic={topic}
            />
          )}
          {stagesEnabled && (
            <StagesMenu
              selectedStage={selectedStage}
              stage={stage}
              stages={stages}
            />
          )}
        </div>
      )}
    </div>
  );
};

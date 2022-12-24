/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'pages/discussions/recent_threads_header.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { parseCustomStages } from 'helpers';
import { isUndefined } from 'helpers/typeGuards';
import { ThreadStage } from 'models';
import { TopicsMenu } from './topics_menu';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import { StagesMenu } from './stages_menu';

type RecentThreadsHeaderAttrs = {
  stage: string;
  topic: string;
  totalThreadCount: number;
};

export class RecentThreadsHeader extends ClassComponent<RecentThreadsHeaderAttrs> {
  private isWindowExtraSmall: boolean;

  onResize() {
    this.isWindowExtraSmall = isWindowExtraSmall(window.innerWidth);
    redraw();
  }

  oninit() {
    this.isWindowExtraSmall = isWindowExtraSmall(window.innerWidth);

    window.addEventListener('resize', () => {
      this.onResize();
    });
  }

  onremove() {
    window.removeEventListener('resize', () => {
      this.onResize();
    });
  }

  view(vnode: ResultNode<RecentThreadsHeaderAttrs>) {
    const { topic, stage, totalThreadCount } = vnode.attrs;

    const { stagesEnabled, customStages } = app.chain?.meta;

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
              <CWText type="h3" fontWeight="semiBold" class="header-text">
                All Discussions
              </CWText>
              <div className="count-and-button">
                <CWText
                  type="caption"
                  fontWeight="medium"
                  class="thread-count-text"
                >
                  {totalThreadCount} Threads
                </CWText>
                {this.isWindowExtraSmall ? (
                  <CWIconButton
                    iconName="plusCircle"
                    iconButtonTheme="black"
                    onClick={() => {
                      navigateToSubpage('/new/discussion');
                    }}
                  />
                ) : (
                  <CWButton
                    buttonType="mini-black"
                    label="Create Thread"
                    iconName="plus"
                    onClick={() => {
                      navigateToSubpage('/new/discussion');
                    }}
                  />
                )}
              </div>
            </div>
            <CWText class="subheader-text">
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
  }
}

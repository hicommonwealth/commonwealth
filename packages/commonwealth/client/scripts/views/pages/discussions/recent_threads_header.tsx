/* @jsx m */

import m from 'mithril';

import 'pages/discussions/recent_threads_header.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { parseCustomStages } from 'helpers';
import { isUndefined } from 'helpers/typeGuards';
import { ThreadStage } from 'models';
import { TopicsMenu } from './topics_menu';
import { StagesMenu } from './stages_menu';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';

type DiscussionFilterBarAttrs = {
  stage: string;
  topic: string;
  totalThreadCount: number;
};

export class RecentThreadsHeader
  implements m.ClassComponent<DiscussionFilterBarAttrs>
{
  private isWindowExtraSmall: boolean;

  onResize() {
    this.isWindowExtraSmall = isWindowExtraSmall(window.innerWidth);
    m.redraw();
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

  view(vnode: m.Vnode<DiscussionFilterBarAttrs>) {
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
      <div class="RecentThreadsHeader">
        {isUndefined(topic) && (
          <>
            <div class="header-row">
              <CWText type="h3" fontWeight="semiBold" className="header-text">
                All Discussions
              </CWText>
              <div class="count-and-button">
                <CWText
                  type="caption"
                  fontWeight="medium"
                  className="thread-count-text"
                >
                  {totalThreadCount} Threads
                </CWText>
                {this.isWindowExtraSmall ? (
                  <CWIconButton
                    iconName="plusCircle"
                    iconButtonTheme="black"
                    onclick={() => {
                      navigateToSubpage('/new/discussion');
                    }}
                  />
                ) : (
                  <CWButton
                    buttonType="mini"
                    label="Create Thread"
                    iconName="plus"
                    onclick={() => {
                      navigateToSubpage('/new/discussion');
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
          <div class="buttons-row">
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
                selectedState={selectedStage}
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

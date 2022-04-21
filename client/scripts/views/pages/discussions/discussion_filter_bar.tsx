/* @jsx m */

import m from 'mithril';
import { Button } from 'construct-ui';

import 'pages/discussions/discussion_filter_bar.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { parseCustomStages } from 'helpers';
import { OffchainThreadStage } from 'models';
import { onFeaturedDiscussionPage } from './helpers';
import { TopicsMenu } from './topics_menu';
import { StagesMenu } from './stages_menu';

type DiscussionFilterBarAttrs = {
  disabled: boolean;
  parentState: any;
  stage: string;
  topic: string;
};

export class DiscussionFilterBar
  implements m.ClassComponent<DiscussionFilterBarAttrs>
{
  view(vnode) {
    const { topic, stage, disabled, parentState } = vnode.attrs;

    const communityInfo = app.chain?.meta?.chain;

    if (!communityInfo) return;

    const { stagesEnabled, customStages } = communityInfo;

    const topics  = app.topics.getByCommunity(app.activeChainId());

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
          OffchainThreadStage.Discussion,
          OffchainThreadStage.ProposalInReview,
          OffchainThreadStage.Voting,
          OffchainThreadStage.Passed,
          OffchainThreadStage.Failed,
        ]
      : parseCustomStages(customStages);

    const selectedStage = stages.find((s) => s === (stage as any));

    const topicSelected = onFeaturedDiscussionPage(m.route.get(), topic);

    const summaryViewEnabled =
      vnode.attrs.parentState.summaryView && !topicSelected;

    return (
      <div class="DiscussionFilterBar">
        {topics.length > 0 && (
          <TopicsMenu
            disabled={disabled}
            featuredTopics={featuredTopics}
            otherTopics={otherTopics}
            parentState={parentState}
            selectedTopic={selectedTopic}
            topic={topic}
          />
        )}
        {stagesEnabled && (
          <StagesMenu
            disabled={disabled}
            parentState={parentState}
            selectedState={selectedStage}
            stage={stage}
            stages={stages}
          />
        )}
        {topics.length > 0 && (
          <>
            <Button
              rounded={true}
              compact={true}
              class={`${summaryViewEnabled ? 'active' : ''}`}
              label="Summary"
              size="sm"
              disabled={disabled}
              onclick={async (e) => {
                e.preventDefault();
                localStorage.setItem('discussion-summary-toggle', 'true');
                parentState.summaryView = true;
                navigateToSubpage('/');
              }}
            />
            <Button
              rounded={true}
              compact={true}
              class={`${!summaryViewEnabled ? 'active' : ''}`}
              label="Latest"
              size="sm"
              disabled={disabled}
              onclick={async (e) => {
                e.preventDefault();
                parentState.summaryView = false;
                localStorage.setItem('discussion-summary-toggle', 'false');
              }}
            />
          </>
        )}
      </div>
    );
  }
}

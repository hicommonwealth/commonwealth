/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/discussions/discussion_filter_bar.scss';

import app from 'state';
import { parseCustomStages } from 'helpers';
import { ThreadStage } from 'models';
import { TopicsMenu } from './topics_menu';
import { StagesMenu } from './stages_menu';

type DiscussionFilterBarAttrs = {
  disabled: boolean;
  parentState: any;
  stage: string;
  topic: string;
};

export class DiscussionFilterBar
  extends ClassComponent<DiscussionFilterBarAttrs>
{
  view(vnode: m.Vnode<DiscussionFilterBarAttrs>) {
    const { topic, stage, disabled, parentState } = vnode.attrs;

    const communityInfo = app.chain?.meta;

    if (!communityInfo) return;

    const { stagesEnabled, customStages } = communityInfo;

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
      </div>
    );
  }
}

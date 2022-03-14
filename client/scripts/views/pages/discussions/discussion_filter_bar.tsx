/* @jsx m */

import m from 'mithril';
import {
  Button,
  Icons,
  Icon,
  PopoverMenu,
  MenuItem,
  MenuDivider,
} from 'construct-ui';

import 'pages/discussions/discussion_filter_bar.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { offchainThreadStageToLabel, parseCustomStages } from 'helpers';
import { OffchainThreadStage } from 'models';
import EditTopicModal from 'views/modals/edit_topic_modal';
import { onFeaturedDiscussionPage } from './helpers';

type DiscussionFilterBarAttrs = {
  disabled: boolean;
  parentState;
  stage: string;
  topic: string;
};

export class DiscussionFilterBar
  implements m.ClassComponent<DiscussionFilterBarAttrs>
{
  view(vnode) {
    const { topic, stage, disabled } = vnode.attrs;

    const communityInfo = app.chain?.meta?.chain;
    if (!communityInfo) return;
    const { stagesEnabled, customStages } = communityInfo;

    const featuredTopicIds = communityInfo.featuredTopics;

    const topics = app.topics
      .getByCommunity(app.activeChainId())
      .map(
        ({
          id,
          name,
          description,
          telegram,
          featuredInSidebar,
          featuredInNewPost,
          defaultOffchainTemplate,
        }) => {
          return {
            id,
            name,
            description,
            telegram,
            featured_order: featuredTopicIds.indexOf(`${id}`),
            featuredInSidebar,
            featuredInNewPost,
            defaultOffchainTemplate,
          };
        }
      );

    const featuredTopics = topics
      .filter((t) => t.featured_order !== -1)
      .sort((a, b) => Number(a.featured_order) - Number(b.featured_order));

    const otherTopics = topics
      .filter((t) => t.featured_order === -1)
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
          <PopoverMenu
            trigger={
              <Button
                rounded={true}
                compac={true}
                label={selectedTopic ? `Topic: ${topic}` : 'All Topics'}
                iconRight={Icons.CHEVRON_DOWN}
                size="sm"
                disabled={disabled}
              />
            }
            inline={true}
            hasArrow={false}
            transitionDuration={0}
            closeOnContentClick={true}
            content={
              <div class="discussions-topic-items">
                <MenuItem
                  active={m.route.get() === `/${app.activeChainId()}` || !topic}
                  iconLeft={
                    m.route.get() === `/${app.activeChainId()}` || !topic
                      ? Icons.CHECK
                      : null
                  }
                  label="All Topics"
                  onclick={() => {
                    localStorage.setItem('discussion-summary-toggle', 'false');
                    vnode.attrs.parentState.summaryView = false;
                    navigateToSubpage('/');
                  }}
                />
                ,
                <MenuDivider />,
                {featuredTopics
                  .concat(otherTopics)
                  .map(
                    ({
                      id,
                      name,
                      description,
                      telegram,
                      featuredInSidebar,
                      featuredInNewPost,
                      defaultOffchainTemplate,
                    }) => {
                      const active =
                        m.route.get() ===
                          `/${app.activeChainId()}/discussions/${encodeURI(
                            name.toString().trim()
                          )}` ||
                        (topic && topic === name);

                      return (
                        <MenuItem
                          key={name}
                          active={active}
                          onclick={(e) => {
                            e.preventDefault();
                            navigateToSubpage(`/discussions/${name}`);
                            vnode.attrs.parentState.summaryView = false;
                            localStorage.setItem(
                              'discussion-summary-toggle',
                              'false'
                            );
                          }}
                          label={
                            <div class="topic-menu-item">
                              {active && <Icon name={Icons.CHECK} />}
                              <div class="topic-menu-item-name">{name}</div>
                              {app.user?.isAdminOfEntity({
                                chain: app.activeChainId(),
                              }) && (
                                <Button
                                  size="xs"
                                  label="Edit"
                                  compact={true}
                                  rounded={true}
                                  onclick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    app.modals.create({
                                      modal: EditTopicModal,
                                      data: {
                                        id,
                                        name,
                                        description,
                                        telegram,
                                        featuredInSidebar,
                                        featuredInNewPost,
                                        defaultOffchainTemplate,
                                      },
                                    });
                                  }}
                                />
                              )}
                            </div>
                          }
                        />
                      );
                    }
                  )}
              </div>
            }
          />
        )}
        {stagesEnabled && (
          <PopoverMenu
            trigger={
              <Button
                rounded={true}
                compact={true}
                label={
                  selectedStage
                    ? `Stage: ${offchainThreadStageToLabel(selectedStage)}`
                    : 'All Stages'
                }
                iconRight={Icons.CHEVRON_DOWN}
                size="sm"
                disabled={disabled}
              />
            }
            inline={true}
            hasArrow={false}
            transitionDuration={0}
            closeOnContentClick={true}
            content={
              <div class="discussions-stage-items">
                <MenuItem
                  onclick={(e) => {
                    e.preventDefault();
                    vnode.attrs.parentState.summaryView = false;
                    localStorage.setItem('discussion-summary-toggle', 'false');
                    navigateToSubpage('/');
                  }}
                  active={!stage}
                  iconLeft={!stage ? Icons.CHECK : null}
                  label="All Stages"
                />
                <MenuDivider />
                {stages.map((targetStage) => (
                  <MenuItem
                    active={stage === targetStage}
                    iconLeft={stage === targetStage ? Icons.CHECK : null}
                    onclick={(e) => {
                      e.preventDefault();
                      vnode.attrs.parentState.summaryView = false;
                      localStorage.setItem(
                        'discussion-summary-toggle',
                        'false'
                      );
                      navigateToSubpage(`/?stage=${targetStage}`);
                    }}
                    label={[
                      `${offchainThreadStageToLabel(targetStage)}`,
                      targetStage === OffchainThreadStage.Voting && (
                        <div class="discussions-stage-count">
                          {app.threads.numVotingThreads}
                        </div>
                      ),
                    ]}
                  />
                ))}
                )
              </div>
            }
          />
        )}
        {
          (topics.length > 0 && (
            <Button
              rounded={true}
              compact={true}
              class={`summary-toggle ${
                summaryViewEnabled ? 'active' : 'inactive'
              }`}
              label="Summary"
              size="sm"
              disabled={disabled}
              onclick={async (e) => {
                e.preventDefault();
                localStorage.setItem('discussion-summary-toggle', 'true');
                vnode.attrs.parentState.summaryView = true;
                navigateToSubpage('/');
              }}
            />
          ),
          (
            <Button
              rounded={true}
              compact={true}
              class={`latest-toggle ${
                summaryViewEnabled ? 'inactive' : 'active'
              }`}
              label="Latest"
              size="sm"
              disabled={disabled}
              onclick={async (e) => {
                e.preventDefault();
                vnode.attrs.parentState.summaryView = false;
                localStorage.setItem('discussion-summary-toggle', 'false');
              }}
            />
          ))
        }
      </div>
    );
  }
}

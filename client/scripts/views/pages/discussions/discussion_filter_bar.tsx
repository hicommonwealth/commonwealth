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

export const ALL_PROPOSALS_KEY = 'COMMONWEALTH_ALL_PROPOSALS';

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

    return m('DiscussionFilterBar', [
      topics.length > 0 &&
        m(PopoverMenu, {
          trigger: m(Button, {
            rounded: true,
            compact: true,
            label: selectedTopic ? `Topic: ${topic}` : 'All Topics',
            iconRight: Icons.CHEVRON_DOWN,
            size: 'sm',
            disabled,
          }),
          inline: true,
          hasArrow: false,
          transitionDuration: 0,
          closeOnContentClick: true,
          content: m('.discussions-topic-items', [
            m(MenuItem, {
              active: m.route.get() === `/${app.activeChainId()}` || !topic,
              iconLeft:
                m.route.get() === `/${app.activeChainId()}` || !topic
                  ? Icons.CHECK
                  : null,
              label: 'All Topics',
              onclick: () => {
                localStorage.setItem('discussion-summary-toggle', 'false');
                vnode.attrs.parentState.summaryView = false;
                navigateToSubpage('/');
              },
            }),
            m(MenuDivider),
            // featured topics
            featuredTopics
              .concat(otherTopics)
              .map(
                (
                  {
                    id,
                    name,
                    description,
                    telegram,
                    featuredInSidebar,
                    featuredInNewPost,
                    defaultOffchainTemplate,
                  },
                  idx
                ) => {
                  const active =
                    m.route.get() ===
                      `/${app.activeChainId()}/discussions/${encodeURI(
                        name.toString().trim()
                      )}` ||
                    (topic && topic === name);
                  return m(MenuItem, {
                    key: name,
                    active,
                    // iconLeft: active ? Icons.CHECK : null,
                    onclick: (e) => {
                      e.preventDefault();
                      navigateToSubpage(`/discussions/${name}`);
                      vnode.attrs.parentState.summaryView = false;
                      localStorage.setItem(
                        'discussion-summary-toggle',
                        'false'
                      );
                    },
                    label: m('.topic-menu-item', [
                      active && m(Icon, { name: Icons.CHECK }),
                      m('.topic-menu-item-name', name),
                      app.user?.isAdminOfEntity({
                        chain: app.activeChainId(),
                      }) &&
                        m(Button, {
                          size: 'xs',
                          label: 'Edit',
                          class: 'edit-topic-button',
                          compact: true,
                          rounded: true,
                          onclick: (e) => {
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
                          },
                        }),
                    ]),
                  });
                }
              ),
          ]),
        }),
      stagesEnabled &&
        m(PopoverMenu, {
          trigger: m(Button, {
            rounded: true,
            compact: true,
            class: 'stage-filter',
            label: selectedStage
              ? `Stage: ${offchainThreadStageToLabel(selectedStage)}`
              : 'All Stages',
            iconRight: Icons.CHEVRON_DOWN,
            size: 'sm',
            disabled,
          }),
          inline: true,
          hasArrow: false,
          transitionDuration: 0,
          closeOnContentClick: true,
          class: 'StagesFilterPopover',
          content: m('.discussions-stage-items', [
            m(MenuItem, {
              onclick: (e) => {
                e.preventDefault();
                vnode.attrs.parentState.summaryView = false;
                localStorage.setItem('discussion-summary-toggle', 'false');
                navigateToSubpage('/');
              },
              active: !stage,
              iconLeft: !stage ? Icons.CHECK : null,
              label: 'All Stages',
            }),
            m(MenuDivider),
            stages.map((targetStage) =>
              m(MenuItem, {
                active: stage === targetStage,
                iconLeft: stage === targetStage ? Icons.CHECK : null,
                onclick: (e) => {
                  e.preventDefault();
                  vnode.attrs.parentState.summaryView = false;
                  localStorage.setItem('discussion-summary-toggle', 'false');
                  navigateToSubpage(`/?stage=${targetStage}`);
                },
                label: [
                  `${offchainThreadStageToLabel(targetStage)}`,
                  targetStage === OffchainThreadStage.Voting &&
                    m(
                      '.discussions-stage-count',
                      `${app.threads.numVotingThreads}`
                    ),
                ],
              })
            ),
          ]),
        }),
      topics.length > 0 &&
        m(Button, {
          rounded: true,
          compact: true,
          class: `summary-toggle ${summaryViewEnabled ? 'active' : 'inactive'}`,
          label: 'Summary',
          size: 'sm',
          disabled,
          onclick: async (e) => {
            e.preventDefault();
            localStorage.setItem('discussion-summary-toggle', 'true');
            vnode.attrs.parentState.summaryView = true;
            navigateToSubpage('/');
          },
        }),
      m(Button, {
        rounded: true,
        compact: true,
        class: `latest-toggle ${summaryViewEnabled ? 'inactive' : 'active'}`,
        label: 'Latest',
        size: 'sm',
        disabled,
        onclick: async (e) => {
          e.preventDefault();
          vnode.attrs.parentState.summaryView = false;
          localStorage.setItem('discussion-summary-toggle', 'false');
        },
      }),
    ]);
  }
}

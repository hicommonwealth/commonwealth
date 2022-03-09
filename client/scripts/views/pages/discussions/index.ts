import $ from 'jquery';
import _ from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import moment from 'moment';
import {
  Spinner,
  Button,
  Icons,
  Icon,
  PopoverMenu,
  MenuItem,
  MenuDivider,
} from 'construct-ui';

import 'pages/discussions/index.scss';
import 'components/dropdown_icon.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import {
  pluralize,
  offchainThreadStageToLabel,
  parseCustomStages,
  link,
} from 'helpers';
import {
  NodeInfo,
  OffchainThreadStage,
  OffchainThread,
  ITokenAdapter,
} from 'models';
import { updateLastVisited } from 'controllers/app/login';
import { INITIAL_PAGE_SIZE } from 'controllers/server/threads';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import EmptyListingPlaceholder from 'views/components/empty_topic_placeholder';
import LoadingRow from 'views/components/loading_row';
import Listing from 'views/pages/listing';
import NewTopicModal from 'views/modals/new_topic_modal';
import EditTopicThresholdsModal from 'views/modals/edit_topic_thresholds_modal';
import EditTopicModal from 'views/modals/edit_topic_modal';
import CreateInviteModal from 'views/modals/create_invite_modal';
import { PinnedListing } from './pinned_listing';
import { DiscussionRow } from './discussion_row';
import { SummaryListing } from './summary_listing';

export const ALL_PROPOSALS_KEY = 'COMMONWEALTH_ALL_PROPOSALS';

const getLastUpdate = (proposal: OffchainThread): number => {
  const lastComment = app.comments.lastCommented(proposal)?.unix() || 0;
  const createdAt = proposal.createdAt?.unix() || 0;
  const lastUpdate = Math.max(createdAt, lastComment);
  return lastUpdate;
};

const getLastSeenDivider = (hasText = true) => {
  return m(
    '.LastSeenDivider',
    hasText ? [m('hr'), m('span', 'Last visit'), m('hr')] : [m('hr')]
  );
};

const onFeaturedDiscussionPage = (p, topic) =>
  decodeURI(p).endsWith(`/discussions/${topic}`);

export const CommunityOptionsPopover: m.Component<{}> = {
  view: (vnode) => {
    const isAdmin =
      app.user.isSiteAdmin ||
      app.user.isAdminOfEntity({
        chain: app.activeChainId(),
      });
    const isMod = app.user.isRoleOfCommunity({
      role: 'moderator',
      chain: app.activeChainId(),
    });
    if (!isAdmin && !isMod) return;

    // add extra width to compensate for an icon that isn't centered inside its boundaries
    const DropdownIcon = m('.dropdown-wrapper', [
      m(Icon, {
        name: Icons.CHEVRON_DOWN,
      }),
      m('.dropdown-spacer', {}),
    ]);

    return m(PopoverMenu, {
      class: 'community-options-popover',
      position: 'bottom',
      transitionDuration: 0,
      hoverCloseDelay: 0,
      closeOnContentClick: true,
      trigger: DropdownIcon,
      content: [
        isAdmin &&
          m(MenuItem, {
            label: 'New topic',
            onclick: (e) => {
              e.preventDefault();
              app.modals.create({ modal: NewTopicModal });
            },
          }),
        isAdmin &&
          ITokenAdapter.instanceOf(app.chain) &&
          m(MenuItem, {
            label: 'Edit topic thresholds',
            onclick: (e) => {
              e.preventDefault();
              app.modals.create({ modal: EditTopicThresholdsModal });
            },
          }),
        isAdmin &&
          m(MenuItem, {
            label: 'Invite members',
            onclick: (e) => {
              e.preventDefault();
              const data = { chainInfo: app.chain.meta.chain };
              app.modals.create({
                modal: CreateInviteModal,
                data,
              });
            },
          }),
        isAdmin &&
          m(MenuItem, {
            label: link(
              'a',
              `${app.isCustomDomain() ? '' : `/${app.activeChainId()}`}/manage`,
              'Manage community'
            ),
          }),
        (isAdmin || isMod) &&
          app.activeChainId() &&
          m(MenuItem, {
            label: 'Analytics',
            onclick: (e) => navigateToSubpage('/analytics'),
          }),
      ],
    });
  },
};

const DiscussionFilterBar: m.Component<
  { topic: string; stage: string; parentState; disabled: boolean },
  {}
> = {
  view: (vnode) => {
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

    return m('.DiscussionFilterBar', [
      topics.length > 0 &&
        m(PopoverMenu, {
          trigger: m(Button, {
            rounded: true,
            compact: true,
            class: 'topic-filter',
            label: selectedTopic ? `Topic: ${topic}` : 'All Topics',
            iconRight: Icons.CHEVRON_DOWN,
            size: 'sm',
            disabled,
          }),
          inline: true,
          hasArrow: false,
          transitionDuration: 0,
          closeOnContentClick: true,
          class: 'TopicsFilterPopover',
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
            stages.map((targetStage, index) =>
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
  },
};

// comparator
const orderDiscussionsbyLastComment = (a, b) => {
  // tslint:disable-next-line
  const tsB = Math.max(+b.createdAt, +(b.lastCommentedOn || 0));
  const tsA = Math.max(+a.createdAt, +(a.lastCommentedOn || 0));
  return tsB - tsA;
};

const DiscussionsPage: m.Component<
  {
    topic?: string;
  },
  {
    lookback?: { [community: string]: moment.Moment };
    postsDepleted: { [community: string]: boolean };
    topicInitialized: { [community: string]: boolean };
    lastSubpage: string;
    lastVisitedUpdated?: boolean;
    onscroll: any;
    summaryView: boolean;
    summaryViewInitialized: boolean;
    recentThreads: OffchainThread[];
    loadingRecentThreads: boolean;
    activityFetched: boolean;
  }
> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {
      'Page Name': 'DiscussionsPage',
      Scope: app.activeChainId(),
    });

    const returningFromThread =
      app.lastNavigatedBack() &&
      app.lastNavigatedFrom().includes('/discussion/');
    if (
      returningFromThread &&
      localStorage[`${app.activeChainId()}-discussions-scrollY`]
    ) {
      setTimeout(() => {
        window.scrollTo(
          0,
          Number(localStorage[`${app.activeChainId()}-discussions-scrollY`])
        );
      }, 100);
    }

    if (app.user.unseenPosts[app.activeChainId()]) {
      app.user.unseenPosts[app.activeChainId()]['activePosts'] = 0;
      app.user.unseenPosts[app.activeChainId()]['threads'] = 0;
    }
  },
  oninit: (vnode) => {
    vnode.state.lookback = {};
    vnode.state.postsDepleted = {};
    vnode.state.topicInitialized = {};
    vnode.state.topicInitialized[ALL_PROPOSALS_KEY] = false;
    const topic = vnode.attrs.topic;
    const stage = m.route.param('stage');
    const subpage =
      topic || stage ? `${topic || ''}#${stage || ''}` : ALL_PROPOSALS_KEY;
    const returningFromThread =
      app.lastNavigatedBack() &&
      app.lastNavigatedFrom().includes('/discussion/');
    vnode.state.lookback[subpage] =
      returningFromThread &&
      localStorage[`${app.activeChainId()}-lookback-${subpage}`]
        ? moment.unix(
            parseInt(
              localStorage[`${app.activeChainId()}-lookback-${subpage}`],
              10
            )
          )
        : moment.isMoment(vnode.state.lookback[subpage])
        ? vnode.state.lookback[subpage]
        : moment();
  },
  view: (vnode) => {
    let { topic } = vnode.attrs;

    if (!app.chain) return;
    if (!vnode.state.summaryViewInitialized) {
      if (app.chain?.meta?.chain?.defaultSummaryView) {
        vnode.state.summaryView = true;
      }
      if (app.lastNavigatedBack()) {
        if (localStorage.getItem('discussion-summary-toggle') === 'true') {
          vnode.state.summaryView = true;
        }
      } else {
        if (!vnode.state.summaryView) {
          localStorage.setItem('discussion-summary-toggle', 'false');
        }
      }
      vnode.state.summaryViewInitialized = true;
    }
    let { summaryView, recentThreads, lastSubpage } = vnode.state;
    const topicSelected = onFeaturedDiscussionPage(m.route.get(), topic);
    const onSummaryView = summaryView && !topicSelected;

    if (
      onSummaryView &&
      !vnode.state.activityFetched &&
      !vnode.state.loadingRecentThreads
    ) {
      vnode.state.loadingRecentThreads = true;
      app.recentActivity
        .getRecentTopicActivity({
          chainId: app.activeChainId(),
        })
        .then((res) => {
          vnode.state.activityFetched = true;
          vnode.state.loadingRecentThreads = false;
          vnode.state.recentThreads = res;
          m.redraw();
        });
    }

    let stage = m.route.param('stage');
    const activeEntity = app.chain;
    if (!activeEntity)
      return m(PageLoading, {
        title: 'Discussions',
        showNewProposalButton: true,
      });

    if (onSummaryView) {
      // overwrite any topic- or stage-scoping in URL
      topic = null;
      stage = null;
    }
    const subpage =
      topic || stage ? `${topic || ''}#${stage || ''}` : ALL_PROPOSALS_KEY;

    const activeNode = app.chain?.meta;
    const selectedNodes = app.config.nodes
      .getAll()
      .filter(
        (n) =>
          activeNode &&
          n.url === activeNode.url &&
          n.chain &&
          activeNode.chain &&
          n.chain.id === activeNode.chain.id
      );
    const selectedNode = selectedNodes.length > 0 && selectedNodes[0];

    const communityName = selectedNode ? selectedNode.chain.name : '';

    const allLastVisited =
      typeof app.user.lastVisited === 'string'
        ? JSON.parse(app.user.lastVisited)
        : app.user.lastVisited;
    if (!vnode.state.lastVisitedUpdated) {
      vnode.state.lastVisitedUpdated = true;
      updateLastVisited((activeEntity.meta as NodeInfo).chain);
    }

    // select the appropriate lastVisited timestamp from the chain||community & convert to Moment
    // for easy comparison with weekly indexes' msecAgo
    const id = (activeEntity.meta as NodeInfo).chain.id;
    const lastVisited = moment(allLastVisited[id]).utc();

    let sortedListing = [];
    let pinnedListing = [];
    // fetch unique addresses count for pinned threads
    if (!app.threadUniqueAddressesCount.getInitializedPinned()) {
      app.threadUniqueAddressesCount.fetchThreadsUniqueAddresses({
        threads: app.threads.listingStore
          .getByCommunityTopicAndStage(app.activeChainId(), topic, stage)
          .filter((t) => t.pinned),
        chainId: app.activeChainId(),
        pinned: true,
      });
    }

    const allThreads = app.threads.listingStore
      .getByCommunityTopicAndStage(app.activeChainId(), topic, stage)
      .sort(orderDiscussionsbyLastComment);

    if (allThreads.length > 0) {
      // pinned threads - inserted at the top of the listing
      const pinnedThreads = allThreads.filter((t) => t.pinned);
      if (pinnedThreads.length > 0) {
        sortedListing.push(m(PinnedListing, { proposals: pinnedThreads }));
        pinnedListing.push(m(PinnedListing, { proposals: pinnedThreads }));
        pinnedListing.push(m('.PinnedDivider', m('hr')));
      }
    }

    const unpinnedThreads = allThreads.filter((t) => !t.pinned);

    const firstThread = unpinnedThreads[0];
    const lastThread = unpinnedThreads[unpinnedThreads.length - 1];

    if (unpinnedThreads.length > 0) {
      let visitMarkerPlaced = false;
      vnode.state.lookback[subpage] = moment.unix(
        getLastUpdate(unpinnedThreads[unpinnedThreads.length - 1])
      );

      if (allThreads.length > unpinnedThreads.length) {
        if (firstThread) {
          if (getLastUpdate(firstThread) > lastVisited.unix()) {
            sortedListing.push(getLastSeenDivider(false));
          } else {
            sortedListing.push(m('.PinnedDivider', m('hr')));
          }
        }
      }

      const allThreadsSeen = () =>
        firstThread && getLastUpdate(firstThread) < lastVisited.unix();
      const noThreadsSeen = () =>
        lastThread && getLastUpdate(lastThread) > lastVisited.unix();

      if (noThreadsSeen() || allThreadsSeen()) {
        sortedListing.push(
          m(
            '.discussion-group-wrap',
            unpinnedThreads.map((proposal) => m(DiscussionRow, { proposal }))
          )
        );
      } else {
        let count = 0;
        unpinnedThreads.forEach((proposal) => {
          if (
            !visitMarkerPlaced &&
            getLastUpdate(proposal) < lastVisited.unix()
          ) {
            const sortedListingCopy = sortedListing;
            sortedListing = [
              m('.discussion-group-wrap', sortedListingCopy),
              getLastSeenDivider(),
              m('.discussion-group-wrap', [m(DiscussionRow, { proposal })]),
            ];
            visitMarkerPlaced = true;
            count += 1;
          } else {
            if (visitMarkerPlaced) {
              sortedListing[2].children.push(m(DiscussionRow, { proposal }));
            } else {
              sortedListing.push(m(DiscussionRow, { proposal }));
            }
            count += 1;
          }
        });
      }
    }

    // TODO: Refactor this logic in light of summary system
    const newSubpage = subpage !== lastSubpage;

    if (newSubpage) {
      $(window).off('scroll');

      let topicId;
      if (topic) {
        topicId = app.topics.getByName(topic, app.activeChainId())?.id;
        if (!topicId) {
          return m(
            Sublayout,
            {
              class: 'DiscussionsPage',
              title: 'Discussions',
              showNewProposalButton: true,
            },
            [
              m(EmptyListingPlaceholder, {
                communityName: app.activeChainId(),
                topicName: topic,
              }),
            ]
          );
        }
      }

      if (!moment.isMoment(vnode.state.lookback[subpage])) {
        vnode.state.lookback[subpage] = moment();
      }

      // cutoffDate is the furthest date, back in the forum history, that has been fetched
      // and stored for a given community subpage. It is used in the loadNextPage threads ctrlr
      // function as the query cutoff, fetching only threads older than it.
      const options = {
        chainId: app.activeChainId(),
        cutoffDate: vnode.state.lookback[subpage],
        topicId,
        stage,
      };

      if (!vnode.state.topicInitialized[subpage]) {
        // Fetch first page of posts
        app.threads.loadNextPage(options).then((morePostsRemaining) => {
          if (!morePostsRemaining) vnode.state.postsDepleted[subpage] = true;
          m.redraw();
        });
        vnode.state.topicInitialized[subpage] = true;
      } else if (
        allThreads.length < INITIAL_PAGE_SIZE &&
        subpage === ALL_PROPOSALS_KEY
      ) {
        vnode.state.postsDepleted[subpage] = true;
      }

      // Initialize infiniteScroll
      vnode.state.onscroll = _.debounce(async () => {
        if (vnode.state.postsDepleted[subpage]) return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > scrollHeight - 400) {
          options.cutoffDate = vnode.state.lookback[subpage];
          const morePostsRemaining = await app.threads.loadNextPage(options);
          if (!morePostsRemaining) vnode.state.postsDepleted[subpage] = true;
          m.redraw();
        }
      }, 400);

      // Trigger a scroll event after this render cycle
      // NOTE: If the window is resized to increase its height, we may
      // get stuck in a state where the user cannot scroll and thus
      // new posts can never be loaded.
      setTimeout(() => {
        if ($('.DiscussionsPage').height() < $(document).height()) {
          $(window).trigger('scroll');
        }
      }, 0);

      $(window).on('scroll', vnode.state.onscroll);

      vnode.state.lastSubpage = subpage;
    }

    let topicName;
    let topicDescription;
    if (topic && app.activeChainId()) {
      const topics = app.topics.getByCommunity(app.activeChainId());
      const topicObject = topics.find((t) => t.name === topic);
      topicName = topicObject?.name;
      topicDescription = topicObject?.description;
    }

    localStorage.setItem(
      `${app.activeChainId()}-lookback-${subpage}`,
      `${vnode.state.lookback[subpage].unix()}`
    );
    const stillFetching =
      unpinnedThreads.length === 0 && !vnode.state.postsDepleted[subpage];
    const isLoading =
      vnode.state.loadingRecentThreads ||
      !activeEntity ||
      !activeEntity.serverLoaded ||
      stillFetching;
    const isEmpty =
      !isLoading &&
      allThreads.length === 0 &&
      vnode.state.postsDepleted[subpage] === true;
    const postsDepleted =
      allThreads.length > 0 && vnode.state.postsDepleted[subpage];

    return m(
      Sublayout,
      {
        class: 'DiscussionsPage',
        title: ['Discussions'],
        description: topicDescription,
        showNewProposalButton: true,
      },
      [
        app.chain && [
          m('.discussions-main', [
            !isEmpty &&
              m(DiscussionFilterBar, {
                topic: topicName,
                stage,
                parentState: vnode.state,
                disabled: isLoading || stillFetching,
              }),
            m('.listing-wrap', [
              onSummaryView
                ? isLoading
                  ? m(LoadingRow)
                  : m(Listing, {
                      content: [
                        // ...pinnedListing,
                        m(SummaryListing, { recentThreads }),
                      ],
                    })
                : [
                    isLoading
                      ? m(LoadingRow)
                      : isEmpty
                      ? m(EmptyListingPlaceholder, {
                          stageName: stage,
                          communityName,
                          topicName,
                        })
                      : m(Listing, { content: sortedListing }),
                    postsDepleted
                      ? m('.infinite-scroll-reached-end', [
                          `Showing ${allThreads.length} of ${pluralize(
                            allThreads.length,
                            'thread'
                          )}`,
                          topic ? ` under the topic '${topic}'` : '',
                        ])
                      : isEmpty
                      ? null
                      : m('.infinite-scroll-spinner-wrap', [
                          m(Spinner, {
                            active: !vnode.state.postsDepleted[subpage],
                            size: 'lg',
                          }),
                        ]),
                  ],
            ]),
          ]),
        ],
      ]
    );
  },
};

export default DiscussionsPage;

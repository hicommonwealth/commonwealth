import 'pages/discussions/index.scss';

import $ from 'jquery';
import _ from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import moment from 'moment';
import app from 'state';

import { Spinner, Button, ButtonGroup, Icons, Icon, PopoverMenu, MenuItem, MenuDivider } from 'construct-ui';
import { pluralize, offchainThreadStageToLabel } from 'helpers';
import { NodeInfo, CommunityInfo, OffchainThreadStage, OffchainThread } from 'models';

import { updateLastVisited } from 'controllers/app/login';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import EmptyTopicPlaceholder, { EmptyStagePlaceholder } from 'views/components/empty_topic_placeholder';
import LoadingRow from 'views/components/loading_row';
import Listing from 'views/pages/listing';
import NewTopicModal from 'views/modals/new_topic_modal';
import EditTopicModal from 'views/modals/edit_topic_modal';
import CreateInviteModal from 'views/modals/create_invite_modal';

import { INITIAL_PAGE_SIZE } from 'controllers/server/threads';
import PinnedListing from './pinned_listing';
import DiscussionRow from './discussion_row';

export const ALL_PROPOSALS_KEY = 'COMMONWEALTH_ALL_PROPOSALS';

const getLastUpdate = (proposal: OffchainThread): number => {
  const lastComment = app.comments.lastCommented(proposal)?.unix() || 0;
  const createdAt = proposal.createdAt?.unix() || 0;
  const lastUpdate = Math.max(createdAt, lastComment);
  return lastUpdate;
};

const getLastSeenDivider = (hasText = true) => {
  return m('.LastSeenDivider', hasText ? [
    m('hr'),
    m('span', 'Last visit'),
    m('hr'),
  ] : [
    m('hr'),
  ]);
};

export const CommunityOptionsPopover: m.Component<{ isAdmin: boolean, isMod: boolean }, {}> = {
  view: (vnode) => {
    const { isAdmin, isMod } = vnode.attrs;
    if (!isAdmin && !isMod && !app.community?.meta.invitesEnabled) return;
    return m(PopoverMenu, {
      class: 'community-options-popover',
      position: 'bottom',
      transitionDuration: 0,
      hoverCloseDelay: 0,
      closeOnContentClick: true,
      trigger: m(Icon, {
        name: Icons.CHEVRON_DOWN,
        style: 'margin-left: 6px;',
      }),
      content: [
        isAdmin && m(MenuItem, {
          label: 'New topic',
          onclick: (e) => {
            e.preventDefault();
            app.modals.create({ modal: NewTopicModal });
          }
        }),
        (app.community?.meta.invitesEnabled || isAdmin) && m(MenuItem, {
          label: 'Invite members',
          onclick: (e) => {
            e.preventDefault();
            const data = app.activeCommunityId()
              ? { communityInfo: app.community.meta } : { chainInfo: app.chain.meta.chain };
            app.modals.create({
              modal: CreateInviteModal,
              data,
            });
          },
        }),
        isAdmin && m(MenuItem, {
          label: 'Manage community',
          onclick: (e) => {
            e.preventDefault();
            app.modals.lazyCreate('manage_community_modal');
          }
        }),
        (isAdmin || isMod) && app.activeId() && m(MenuItem, {
          label: 'Analytics',
          onclick: (e) => m.route.set(`/${app.activeId()}/analytics`),
        }),
      ],
    });
  }
};

const DiscussionStagesBar: m.Component<{ topic: string, stage: string }, {}> = {
  view: (vnode) => {
    const { topic, stage } = vnode.attrs;

    const featuredTopicIds = app.community?.meta?.featuredTopics || app.chain?.meta?.chain?.featuredTopics;
    const topics = app.topics.getByCommunity(app.activeId()).map(({ id, name, description, telegram }) => {
      return { id, name, description, telegram, featured_order: featuredTopicIds.indexOf(`${id}`) };
    });
    const featuredTopics = topics.filter((t) => t.featured_order !== -1)
      .sort((a, b) => Number(a.featured_order) - Number(b.featured_order));
    const otherTopics = topics.filter((t) => t.featured_order === -1)
      .sort((a, b) => a.name.localeCompare(b.name));

    const selectedTopic = topics.find((t) => topic && topic === t.name);
    const selectedStage = [
      OffchainThreadStage.Discussion,
      OffchainThreadStage.ProposalInReview,
      OffchainThreadStage.Voting,
      OffchainThreadStage.Passed,
      OffchainThreadStage.Failed,
    ].find((s) => s === stage as any);

    return m('.DiscussionStagesBar.discussions-stages', [
      topics.length > 0 && m(PopoverMenu, {
        trigger: m(Button, {
          rounded: true,
          compact: true,
          class: 'discussions-topic',
          label: selectedTopic ? `Filter: ${topic}` : 'All Discussions',
          iconRight: Icons.CHEVRON_DOWN,
          size: 'sm',
        }),
        inline: true,
        hasArrow: false,
        transitionDuration: 0,
        closeOnContentClick: true,
        class: 'DiscussionStagesBarTopicsPopover',
        content: m('.discussions-topic-items', [
          m(MenuItem, {
            active: (m.route.get() === `/${app.activeId()}` || !topic),
            iconLeft: (m.route.get() === `/${app.activeId()}` || !topic) ? Icons.CHECK : null,
            label: 'All Discussions',
            onclick: () => { m.route.set(`/${app.activeId()}`); },
          }),
          m(MenuDivider),
          // featured topics
          featuredTopics.concat(otherTopics).map(({ id, name, description, telegram }, idx) => m(MenuItem, {
            key: name,
            active: (m.route.get() === `/${app.activeId()}/discussions/${encodeURI(name.toString().trim())}`
                     || (topic && topic === name)),
            iconLeft: (m.route.get() === `/${app.activeId()}/discussions/${encodeURI(name.toString().trim())}`
                        || (topic && topic === name)) ? Icons.CHECK : null,
            onclick: (e) => {
              e.preventDefault();
              m.route.set(`/${app.activeId()}/discussions/${name}`);
            },
            label: m('.topic-menu-item', [
              m('.topic-menu-item-name', name),
              app.user?.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() }) && m(Button, {
                size: 'xs',
                label: 'Edit',
                class: 'edit-topic-button',
                compact: true,
                rounded: true,
                onclick: (e) => {
                  e.preventDefault();
                  app.modals.create({
                    modal: EditTopicModal,
                    data: { id, name, description, telegram },
                  });
                }
              }),
            ]),
          })),
        ]),
      }),
      m(PopoverMenu, {
        trigger: m(Button, {
          rounded: true,
          compact: true,
          class: 'discussions-stage',
          label: selectedStage ? `Filter: ${offchainThreadStageToLabel(selectedStage)}` : 'All Stages',
          iconRight: Icons.CHEVRON_DOWN,
          size: 'sm',
        }),
        inline: true,
        hasArrow: false,
        transitionDuration: 0,
        closeOnContentClick: true,
        class: 'DiscussionStagesBarTopicsPopover',
        content: m('.discussions-stage-items', [
          m(MenuItem, {
            onclick: (e) => {
              e.preventDefault();
              m.route.set(`/${app.activeId()}`);
            },
            active: !stage,
            iconLeft: !stage ? Icons.CHECK : null,
            label: 'All Stages'
          }),
          m(MenuDivider),
          [
            // OffchainThreadStage.Discussion,
            OffchainThreadStage.ProposalInReview,
            OffchainThreadStage.Voting,
            OffchainThreadStage.Passed,
            OffchainThreadStage.Failed,
          ].map((targetStage, index) => m(MenuItem, {
            active: stage === targetStage,
            iconLeft: stage === targetStage ? Icons.CHECK : null,
            onclick: (e) => {
              e.preventDefault();
              m.route.set(`/${app.activeId()}?stage=${targetStage}`);
            },
            label: [
              `${offchainThreadStageToLabel(targetStage)}`,
              targetStage === OffchainThreadStage.ProposalInReview
                && [ ' ', m('.discussions-stage-count', `${app.threads.numPrevotingThreads}`) ],
              targetStage === OffchainThreadStage.Voting
                && [ ' ', m('.discussions-stage-count', `${app.threads.numVotingThreads}`) ],
            ],
          })),
        ]),
      }),
    ]);
  }
};

const DiscussionsPage: m.Component<{ topic?: string }, {
  lookback?: { [community: string]: moment.Moment};
  postsDepleted: { [community: string]: boolean };
  topicInitialized: { [community: string]: boolean };
  lastSubpage: string;
  lastVisitedUpdated?: boolean;
  onscroll: any;
}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {
      'Page Name': 'DiscussionsPage',
      Scope: app.activeId(),
    });

    const returningFromThread = (app.lastNavigatedBack() && app.lastNavigatedFrom().includes('/proposal/discussion/'));
    if (returningFromThread && localStorage[`${app.activeId()}-discussions-scrollY`]) {
      setTimeout(() => {
        window.scrollTo(0, Number(localStorage[`${app.activeId()}-discussions-scrollY`]));
      }, 100);
    }

    if (app.user.unseenPosts[app.activeId()]) {
      app.user.unseenPosts[app.activeId()]['activePosts'] = 0;
      app.user.unseenPosts[app.activeId()]['threads'] = 0;
    }
  },
  oninit: (vnode) => {
    vnode.state.lookback = {};
    vnode.state.postsDepleted = {};
    vnode.state.topicInitialized = {};
    vnode.state.topicInitialized[ALL_PROPOSALS_KEY] = true;
    const topic = vnode.attrs.topic;
    const stage = m.route.param('stage');
    const subpage = (topic || stage) ? `${topic || ''}#${stage || ''}` : ALL_PROPOSALS_KEY;
    const returningFromThread = (app.lastNavigatedBack() && app.lastNavigatedFrom().includes('/proposal/discussion/'));
    vnode.state.lookback[subpage] = (returningFromThread && localStorage[`${app.activeId()}-lookback-${subpage}`])
      ? moment.unix(parseInt(localStorage[`${app.activeId()}-lookback-${subpage}`], 10))
      : moment.isMoment(vnode.state.lookback[subpage])
        ? vnode.state.lookback[subpage]
        : moment();
  },
  view: (vnode) => {
    const { topic } = vnode.attrs;
    const stage = m.route.param('stage');
    const activeEntity = app.community ? app.community : app.chain;
    if (!activeEntity) return m(PageLoading, {
      title: 'Discussions',
      showNewProposalButton: true,
    });

    const subpage = (topic || stage) ? `${topic || ''}#${stage || ''}` : ALL_PROPOSALS_KEY;

    // add chain compatibility (node info?)
    if (app.community && !activeEntity?.serverLoaded) return m(PageLoading, {
      title: 'Discussions',
      showNewProposalButton: true,
    });

    const activeNode = app.chain?.meta;
    const selectedNodes = app.config.nodes.getAll().filter((n) => activeNode && n.url === activeNode.url
                                       && n.chain && activeNode.chain && n.chain.id === activeNode.chain.id);
    const selectedNode = selectedNodes.length > 0 && selectedNodes[0];
    const selectedCommunity = app.community;

    const communityName = selectedNode
      ? selectedNode.chain.name : selectedCommunity ? selectedCommunity.meta.name : '';

    const allLastVisited = (typeof app.user.lastVisited === 'string')
      ? JSON.parse(app.user.lastVisited)
      : app.user.lastVisited;
    if (!vnode.state.lastVisitedUpdated) {
      vnode.state.lastVisitedUpdated = true;
      updateLastVisited(app.community
        ? (activeEntity.meta as CommunityInfo)
        : (activeEntity.meta as NodeInfo).chain);
    }

    // select the appropriate lastVisited timestamp from the chain||community & convert to Moment
    // for easy comparison with weekly indexes' msecAgo
    const id = (activeEntity.meta as NodeInfo).chain
      ? (activeEntity.meta as NodeInfo).chain.id
      : (activeEntity.meta as CommunityInfo).id;
    const lastVisited = moment(allLastVisited[id]).utc();

    // comparator
    const orderDiscussionsbyLastComment = (a, b) => {
      // tslint:disable-next-line
      const tsB = Math.max(+b.createdAt, +(app.comments.lastCommented(b) || 0));
      const tsA = Math.max(+a.createdAt, +(app.comments.lastCommented(a) || 0));
      return tsB - tsA;
    };

    const orderByDateReverseChronological = (a, b) => {
      // tslint:disable-next-line
      const tsB = Math.max(+b.createdAt);
      const tsA = Math.max(+a.createdAt);
      return tsA - tsB;
    };

    let listing = [];
    const allThreads = app.threads.listingStore
      .getByCommunityAndTopic(app.activeId(), topic, stage)
      .sort(orderDiscussionsbyLastComment);

    if (allThreads.length > 0) {
      // pinned threads - inserted at the top of the listing
      const pinnedThreads = allThreads.filter((t) => t.pinned);
      if (pinnedThreads.length > 0) {
        listing.push(m(PinnedListing, { proposals: pinnedThreads }));
      }
    }

    const sortedThreads = allThreads.filter((t) => !t.pinned);

    const firstThread = sortedThreads[0];
    const lastThread = sortedThreads[sortedThreads.length - 1];

    if (sortedThreads.length > 0) {
      let visitMarkerPlaced = false;
      vnode.state.lookback[subpage] = moment.unix(getLastUpdate(sortedThreads[sortedThreads.length - 1]));

      if (allThreads.length > sortedThreads.length) {
        if (firstThread) {
          if (getLastUpdate(firstThread) > lastVisited.unix()) {
            listing.push(getLastSeenDivider(false));
          } else {
            listing.push(m('.PinnedDivider', m('hr')));
          }
        }
      }

      const allThreadsSeen = () => firstThread && getLastUpdate(firstThread) < lastVisited.unix();
      const noThreadsSeen = () => lastThread && getLastUpdate(lastThread) > lastVisited.unix();

      if (noThreadsSeen() || allThreadsSeen()) {
        listing.push(m('.discussion-group-wrap', sortedThreads
          .map((proposal) => m(DiscussionRow, { proposal }))));
      } else {
        let count = 0;
        sortedThreads.forEach((proposal) => {
          const row = m(DiscussionRow, { proposal });
          if (!visitMarkerPlaced && getLastUpdate(proposal) < lastVisited.unix()) {
            listing = [m('.discussion-group-wrap', listing), getLastSeenDivider(), m('.discussion-group-wrap', [row])];
            visitMarkerPlaced = true;
            count += 1;
          } else {
            if (visitMarkerPlaced) {
              listing[2].children.push(row);
            } else {
              listing.push(row);
            }
            count += 1;
          }
        });
      }
    }

    const newSubpage = subpage !== vnode.state.lastSubpage;

    if (newSubpage) {
      $(window).off('scroll');

      let topicId;
      if (topic) {
        topicId = app.topics.getByName(topic, app.activeId())?.id;
        if (!topicId) {
          return m(Sublayout, {
            class: 'DiscussionsPage',
            title: 'Discussions',
            showNewProposalButton: true,
          }, [
            m(EmptyTopicPlaceholder, {
              communityName: app.activeId(),
              topicName: topic,
            }),
          ]);
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
        communityId: app.activeCommunityId(),
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
      } else if (allThreads.length < INITIAL_PAGE_SIZE && subpage === ALL_PROPOSALS_KEY) {
        vnode.state.postsDepleted[subpage] = true;
      }

      // Initialize infiniteScroll
      vnode.state.onscroll = _.debounce(async () => {
        if (vnode.state.postsDepleted[subpage]) return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > (scrollHeight - 400)) {
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

    let topicId;
    let topicName;
    let topicDescription;
    if (topic && app.activeId()) {
      const topics = app.topics.getByCommunity(app.activeId());
      const topicObject = topics.find((t) => t.name === topic);
      topicId = topicObject?.id;
      topicName = topicObject?.name;
      topicDescription = topicObject?.description;
    }

    localStorage.setItem(`${app.activeId()}-lookback-${subpage}`, `${vnode.state.lookback[subpage].unix()}`);
    const stillFetching = (allThreads.length === 0 && vnode.state.postsDepleted[subpage] === false);
    const emptyTopic = (allThreads.length === 0 && vnode.state.postsDepleted[subpage] === true && !stage);
    const emptyStage = (allThreads.length === 0 && vnode.state.postsDepleted[subpage] === true && !!stage);

    const isAdmin = app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() });
    const isMod = app.user.isRoleOfCommunity({
      role: 'moderator', chain: app.activeChainId(), community: app.activeCommunityId()
    });

    return m(Sublayout, {
      class: 'DiscussionsPage',
      title: [
        'Discussions',
        (isAdmin || isMod || app.community?.meta.invitesEnabled)
        && m(CommunityOptionsPopover, { isAdmin, isMod })
      ],
      description: topicDescription,
      showNewProposalButton: true,
    }, [
      (app.chain || app.community) && [
        m('.discussions-main', [
          m(DiscussionStagesBar, { topic: topicName, stage }),
          (app.chain && (!activeEntity || !activeEntity.serverLoaded || stillFetching))
            ? m('.discussions-main', [
              m(LoadingRow),
            ])
            : emptyTopic
              ? m(EmptyTopicPlaceholder, { communityName, topicName: topic })
              : emptyStage
                ? m(EmptyStagePlaceholder)
                : listing.length === 0
                  ? m('.topic-loading-spinner-wrap', [ m(Spinner, { active: true, size: 'lg' }) ])
                  : m(Listing, { content: listing }),
          // TODO: Incorporate infinite scroll into generic Listing component
          (allThreads.length && vnode.state.postsDepleted[subpage])
            ? m('.infinite-scroll-reached-end', [
              `Showing ${allThreads.length} of ${pluralize(allThreads.length, 'thread')}`,
              (topic ? ` under the topic '${topic}'` : '')
            ])
            : (allThreads.length)
              ? m('.infinite-scroll-spinner-wrap', [
                m(Spinner, { active: !vnode.state.postsDepleted[subpage], size: 'lg' })
              ])
              : null
        ])
      ]
    ]);
  }
};

export default DiscussionsPage;

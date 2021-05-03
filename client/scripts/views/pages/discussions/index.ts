import 'pages/discussions/index.scss';

import $ from 'jquery';
import _ from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import moment from 'moment';
import app from 'state';

import { Spinner, Button, ButtonGroup, Icons, Icon, PopoverMenu, MenuItem } from 'construct-ui';
import { pluralize, offchainThreadStageToLabel, externalLink } from 'helpers';
import { NodeInfo, CommunityInfo, OffchainThreadStage, OffchainThread } from 'models';

import { updateLastVisited } from 'controllers/app/login';
import { notifyError } from 'controllers/app/notifications';
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
  const lastComment = app.comments.lastCommented(proposal)?.unix();
  const createdAt = proposal.createdAt?.unix();
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

const DiscussionStagesBar: m.Component<{ topic: string, stage: string }, {}> = {
  view: (vnode) => {
    const { topic, stage } = vnode.attrs;
    return m('.DiscussionStagesBar.discussions-stages', [
      m(ButtonGroup, [
        m(Button, {
          rounded: true,
          compact: true,
          size: 'sm',
          class: 'discussions-stage',
          onclick: (e) => {
            e.preventDefault();
            m.route.set(topic ? `/${app.activeId()}/discussions/${encodeURI(topic.trim())}` : `/${app.activeId()}`);
          },
          active: !stage,
          label: 'All Stages'
        }),
        [
          OffchainThreadStage.Discussion,
          OffchainThreadStage.ProposalInReview,
          OffchainThreadStage.Voting,
          OffchainThreadStage.Passed,
          OffchainThreadStage.Failed,
          OffchainThreadStage.Abandoned,
        ].map((targetStage, index) => m(Button, {
          class: 'discussions-stage',
          active: stage === targetStage,
          rounded: true,
          size: 'sm',
          onclick: (e) => {
            e.preventDefault();
            m.route.set(
              topic
                ? `/${app.activeId()}/discussions/${encodeURI(topic.trim())}?stage=${targetStage}`
                : `/${app.activeId()}?stage=${targetStage}`
            );
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
    ]);
  }
};

const DiscussionsPage: m.Component<{ topic?: string }, {
  lookback?: { [community: string]: moment.Moment} ;
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
      ? moment(parseInt(localStorage[`${app.activeId()}-lookback-${subpage}`], 10))
      : moment.isMoment(vnode.state.lookback[subpage])
        ? vnode.state.lookback[subpage]
        : moment();
  },
  view: (vnode) => {
    const { topic } = vnode.attrs;
    const stage = m.route.param('stage');
    const activeEntity = app.community ? app.community : app.chain;
    if (!activeEntity) return m(PageLoading, {
      title: topic || 'Discussions',
      showNewProposalButton: true,
    });

    const subpage = (topic || stage) ? `${topic || ''}#${stage || ''}` : ALL_PROPOSALS_KEY;

    // add chain compatibility (node info?)
    if (!activeEntity?.serverLoaded) return m(PageLoading, {
      title: topic || 'Discussions',
      showNewProposalButton: true,
    });

    const activeNode = app.chain?.meta;
    const selectedNodes = app.config.nodes.getAll().filter((n) => activeNode && n.url === activeNode.url
                                       && n.chain && activeNode.chain && n.chain.id === activeNode.chain.id);
    const selectedNode = selectedNodes.length > 0 && selectedNodes[0];
    const selectedCommunity = app.community;

    // const communityName = selectedNode
    //   ? selectedNode.chain.name : selectedCommunity ? selectedCommunity.meta.name : '';
    const communityName = selectedCommunity ? selectedCommunity.meta.name : selectedNode ? selectedNode.chain.name : '';  // for CWP

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
            title: topic || 'Discussions',
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
    let topicTelegram;
    if (topic && app.activeId()) {
      const topics = app.topics.getByCommunity(app.activeId());
      const topicObject = topics.find((t) => t.name === topic);
      topicId = topicObject?.id;
      topicName = topicObject?.name;
      topicDescription = topicObject?.description;
      topicTelegram = topicObject?.telegram;
    }

    localStorage.setItem(`${app.activeId()}-lookback-${subpage}`, `${vnode.state.lookback[subpage].valueOf()}`);
    const stillFetching = (allThreads.length === 0 && vnode.state.postsDepleted[subpage] === false);
    const emptyTopic = (allThreads.length === 0 && vnode.state.postsDepleted[subpage] === true && !stage);
    const emptyStage = (allThreads.length === 0 && vnode.state.postsDepleted[subpage] === true && !!stage);

    const featuredTopics = {};
    const otherTopics = {};
    const featuredTopicIds = app.community?.meta?.featuredTopics || app.chain?.meta?.chain?.featuredTopics;

    const getTopicRow = (key, name, description, telegram) => m(Button, {
      rounded: true,
      compact: true,
      class: 'discussions-topic',
      key,
      active: (m.route.get() === `/${app.activeId()}/discussions/${encodeURI(name.toString().trim())}`
               || (topic && topic === key)),
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${app.activeId()}/discussions/${name}`);
      },
      label: [
        name,
        telegram && m(PopoverMenu, {
          inline: true,
          transitionDuration: 0,
          closeOnContentClick: true,
          closeOnOutsideClick: true,
          hasArrow: false,
          content: [
            m(MenuItem, {
              href: telegram,
              size: 'sm',
              onclick: (e) => {
                e.stopPropagation();
                e.preventDefault();
                window.open(telegram);
              },
              label: `Open ${name} Telegram chat`,
            }),
          ],
          trigger: m('a.topic-telegram', [ ' ', m(Icon, { name: Icons.MORE_HORIZONTAL }) ]),
        }),
      ],
      size: 'sm',
    });

    const allTopicsListItem = m(Button, {
      rounded: true,
      compact: true,
      class: 'discussions-topic',
      active: (m.route.get() === `/${app.activeId()}` || !topic),
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${app.activeId()}`);
      },
      label: 'All Discussions',
      size: 'sm',
    });

    app.topics.getByCommunity(app.activeId()).forEach(({ id, name, description, telegram }) => {
      if (featuredTopicIds.includes(`${id}`)) {
        featuredTopics[name] = { id, name, description, telegram, featured_order: featuredTopicIds.indexOf(`${id}`) };
      } else {
        otherTopics[name] = { id, name, description, telegram };
      }
    });
    const otherTopicListItems = Object.keys(otherTopics)
      .sort((a, b) => otherTopics[a].name.localeCompare(otherTopics[b].name))
      .map((name, idx) => getTopicRow(otherTopics[name].name, name, otherTopics[name].description, otherTopics[name].telegram));
    const featuredTopicListItems = Object.keys(featuredTopics)
      .sort((a, b) => Number(featuredTopics[a].featured_order) - Number(featuredTopics[b].featured_order))
      .map((name, idx) => getTopicRow(
        featuredTopics[name].name, name, featuredTopics[name].description, featuredTopics[name].telegram));

    const isAdmin = app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() });
    const isMod = app.user.isRoleOfCommunity({
      role: 'moderator', chain: app.activeChainId(), community: app.activeCommunityId()
    });

    return m(Sublayout, {
      class: 'DiscussionsPage',
      title: topic ? [
        topic,
        m.route.get().startsWith(`/${app.activeId()}/discussions/${encodeURI(topicName)}`)
          && app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })
          && m(PopoverMenu, {
            class: 'sidebar-edit-topic',
            position: 'bottom',
            transitionDuration: 0,
            hoverCloseDelay: 0,
            closeOnContentClick: true,
            trigger: m(Icon, {
              name: Icons.CHEVRON_DOWN,
              style: 'margin-left: 6px;',
            }),
            content: [
              m(MenuItem, {
                label: 'New topic',
                onclick: (e) => {
                  e.preventDefault();
                  app.modals.create({ modal: NewTopicModal });
                }
              }),
              m(MenuItem, {
                label: 'Edit topic',
                onclick: (e) => {
                  e.preventDefault();
                  app.modals.create({
                    modal: EditTopicModal,
                    data: { description: topicDescription, id: topicId, name: topicName, telegram: topicTelegram }
                  });
                }
              }),
            ],
          }),
      ] : [
        'Discussions',
        (isAdmin || isMod || app.community?.meta.invitesEnabled)
          && m(PopoverMenu, {
            class: 'sidebar-edit-topic',
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
          }),
      ],
      description: topicDescription,
      showNewProposalButton: true,
    }, [
      (app.chain || app.community) && [
        m('.discussions-main', [
          // topics
          app.topics.getByCommunity(app.activeId()).length > 0 && m('.discussions-topics', {
            // onupdate: (vvnode) => {
            //   if (app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })
            //       && !vnode.state.dragulaInitialized) {
            //     vnode.state.dragulaInitialized = true;
            //     dragula([vvnode.dom]).on('drop', async (el, target, source) => {
            //       const reorder = Array.from(source.children).map((child) => {
            //         return (child as HTMLElement).id;
            //       });
            //       await app.community.meta.updateFeaturedTopics(reorder);
            //     });
            //   }
            // }
          }, [
            allTopicsListItem,
            featuredTopicListItems,
            otherTopicListItems,
          ]),
          m(DiscussionStagesBar, { topic: topicName, stage }),
          (!activeEntity || !activeEntity.serverLoaded || stillFetching)
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

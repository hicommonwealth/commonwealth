import 'pages/notification_subscriptions.scss';

import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import { Button, Icons, ListItem, Table, SelectList, } from 'construct-ui';

import { NotificationSubscription, ChainInfo, CommunityInfo } from 'models';
import app from 'state';
import { NotificationCategories } from 'types';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import PageError from 'views/pages/error';
import { sortSubscriptions } from 'helpers/notifications';
import { ChainNotificationManagementPage } from './chainEventSettings';

const NOTIFICATION_TABLE_PRE_COPY = 'Notify me when...';
const COMMENT_NUM_PREFIX = 'Comment #';
const ALL_COMMUNITIES = 'All communities';

const NEW_COMMENTS_LABEL_PREFIX = 'New comments on ';
const NEW_REACTIONS_LABEL_PREFIX = 'New reactions on ';

const NEW_MENTIONS_LABEL = 'When someone mentions me';
const NEW_THREADS_INDIVIDUAL_COMMUNITY_LABEL = 'When a thread is created';
const NEW_THREADS_ALL_COMMUNITIES_LABEL = 'When a thread is created';
const NEW_ACTIVITY_LABEL = 'When there is new activity on';

const NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION = 'Immediately by email';
const NOTIFICATION_ON_OPTION = 'On';
const NOTIFICATION_ON_SOMETIMES_OPTION = '--';
const NOTIFICATION_OFF_OPTION = 'Off';

const singleLabel = (subscription: NotificationSubscription) => {
  const chainOrCommunityId = subscription.Chain
    ? subscription.Chain.id
    : subscription.OffchainCommunity
      ? subscription.OffchainCommunity.id
      : null;
  switch (subscription.category) {
    case (NotificationCategories.NewComment): {
      const threadOrComment = subscription.OffchainThread
        ? decodeURIComponent(subscription.OffchainThread.title)
        : subscription.OffchainComment
          ? decodeURIComponent(subscription.OffchainComment.id)
          : subscription.objectId;
      return subscription.OffchainThread
        ? [ NEW_COMMENTS_LABEL_PREFIX, m('a', {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${chainOrCommunityId}/proposal/discussion/${subscription.OffchainThread.id}`);
          }
        }, threadOrComment.toString()) ]
        : NEW_COMMENTS_LABEL_PREFIX + threadOrComment.toString();
    }
    case (NotificationCategories.NewReaction): {
      const threadOrComment = subscription.OffchainThread
        ? decodeURIComponent(subscription.OffchainThread.title)
        : subscription.OffchainComment
          ? decodeURIComponent(subscription.OffchainComment.id)
          : subscription.objectId;
      return subscription.OffchainThread
        ? [ NEW_REACTIONS_LABEL_PREFIX, m('a', {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${chainOrCommunityId}/proposal/discussion/${subscription.OffchainThread.id}`);
          }
        }, threadOrComment.toString()) ]
        : NEW_REACTIONS_LABEL_PREFIX + threadOrComment.toString();
    }
    default:
      break;
  }
};

const batchLabel = (subscriptions: NotificationSubscription[]) => {
  const chainOrCommunityId = subscriptions[0].Chain
    ? subscriptions[0].Chain.id
    : subscriptions[0].OffchainCommunity
      ? subscriptions[0].OffchainCommunity.id
      : null;

  const threadOrComment = subscriptions[0].OffchainThread
    ? decodeURIComponent(subscriptions[0].OffchainThread.title)
    : subscriptions[0].OffchainComment
      ? decodeURIComponent(subscriptions[0].OffchainComment.id)
      : subscriptions[0].objectId;

  return subscriptions[0].OffchainThread
    ? [ m('a', {
      href: '#',
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${chainOrCommunityId}/proposal/discussion/${subscriptions[0].OffchainThread.id}`);
      }
    }, threadOrComment.toString()) ]
    : COMMENT_NUM_PREFIX + threadOrComment.toString();
};

interface IBatchedSubscriptionRowAttrs {
  subscriptions: NotificationSubscription[];
  label?: string;
  bold?: boolean;
}

interface IBatchedSubscriptionRowState {
  option: string;
}

const BatchedSubscriptionRow: m.Component<IBatchedSubscriptionRowAttrs, IBatchedSubscriptionRowState> = {
  view: (vnode) => {
    const { label, bold, subscriptions } = vnode.attrs;
    const someActive = subscriptions.some((s) => s.isActive);
    const everyActive = subscriptions.every((s) => s.isActive);
    const someEmail = subscriptions.some((s) => s.immediateEmail);
    const everyEmail = subscriptions.some((s) => s.immediateEmail);
    if (everyActive && everyEmail) {
      vnode.state.option = NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION;
    } else if (everyActive && !someEmail) {
      vnode.state.option = NOTIFICATION_ON_OPTION;
    } else if (someActive) {
      vnode.state.option = NOTIFICATION_ON_OPTION;
    } else {
      vnode.state.option = NOTIFICATION_OFF_OPTION;
    }
    if (!subscriptions) return;
    return m('tr.BatchedSubscriptionRow', [
      m('td', {
        class: bold ? 'bold' : null,
      }, [
        label || ((subscriptions?.length > 1)
          ? batchLabel(subscriptions)
          : singleLabel(subscriptions[0])),
      ]),
      m('td', [
        m(SelectList, {
          class: 'BatchedNotificationSelectList',
          filterable: false,
          checkmark: false,
          emptyContent: null,
          inputAttrs: {
            class: 'BatchedNotificationSelectRow',
          },
          itemRender: (option: string) => {
            return m(ListItem, {
              label: option,
              selected: (vnode.state.option === option),
            });
          },
          items: [NOTIFICATION_OFF_OPTION, NOTIFICATION_ON_OPTION, NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION],
          trigger: m(Button, {
            align: 'left',
            compact: true,
            iconRight: Icons.CHEVRON_DOWN,
            label: vnode.state.option,
          }),
          onSelect: async (option: string) => {
            vnode.state.option = option;
            if (option === NOTIFICATION_OFF_OPTION) {
              if (someEmail) await app.user.notifications.disableImmediateEmails(subscriptions);
              if (someActive) await app.user.notifications.disableSubscriptions(subscriptions);
            } else if (option === NOTIFICATION_ON_OPTION) {
              await app.user.notifications.enableSubscriptions(subscriptions);
              if (someEmail) await app.user.notifications.disableImmediateEmails(subscriptions);
            } else if (option === NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION) {
              if (!everyActive) await app.user.notifications.enableSubscriptions(subscriptions);
              await app.user.notifications.enableImmediateEmails(subscriptions);
            }
            m.redraw();
          }
        })
      ]),
    ]);
  }
};

const NewThreadRow: m.Component<{ subscriptions: NotificationSubscription[], community: CommunityInfo | ChainInfo }> = {
  view: (vnode) => {
    const { subscriptions, community } = vnode.attrs;
    const subscription = subscriptions.find(
      (s) => (s.category === NotificationCategories.NewThread && s.objectId === community.id)
    );
    return subscription && m(BatchedSubscriptionRow, {
      subscriptions: [subscription],
      label: NEW_THREADS_INDIVIDUAL_COMMUNITY_LABEL,
      bold: true,
    });
  },
};

const NewActivityRow: m.Component = {
  view: (vnode) => {
    return m('tr.NewActivityRow', [
      m('td', NEW_ACTIVITY_LABEL),
      m('td'),
    ]);
  }
};

interface ICommunitySpecificNotificationsAttrs {
  community: CommunityInfo | ChainInfo;
  subscriptions: NotificationSubscription[];
}

const CommunitySpecificNotifications: m.Component<ICommunitySpecificNotificationsAttrs, {}> = {
  view: (vnode) => {
    const { community, subscriptions } = vnode.attrs;
    const filteredSubscriptions = subscriptions.filter(
      (s) => (s.OffchainCommunity?.id === community.id || s.Chain?.id === community.id)
        && s.category !== NotificationCategories.NewThread
        && s.category !== NotificationCategories.NewMention
        && s.category !== NotificationCategories.ChainEvent
        && !s.OffchainComment
    );
    const newThreads = subscriptions.find(
      (s) => (s.category === NotificationCategories.NewThread && s.objectId === community.id)
    );
    const batchedSubscriptions = sortSubscriptions(filteredSubscriptions, 'objectId');
    return [
      newThreads && m(NewThreadRow, { community, subscriptions }),
      batchedSubscriptions.length > 0 && m(NewActivityRow),
      // TODO: Filter community past-thread/comment subscriptions here into SubscriptionRows.
      batchedSubscriptions.length > 0 && batchedSubscriptions.map((subscriptions2: NotificationSubscription[]) => {
        return m(BatchedSubscriptionRow, {
          subscriptions: subscriptions2,
          key: subscriptions2[0].id,
        });
      })
    ];
  },
};

interface IGeneralNewThreadsAndCommentsAttrs {
  communities: CommunityInfo[];
  subscriptions: NotificationSubscription[];
}

interface IGeneralCommunityNotificationsState {
  generalStatus: boolean;
  emailStatus: boolean;
  generalOpen: boolean;
  emailOpen: boolean;
}

const GeneralNewThreadsAndComments:
  m.Component<IGeneralNewThreadsAndCommentsAttrs, IGeneralCommunityNotificationsState > = {
    oninit: (vnode) => {
      vnode.state.generalStatus = null;
      vnode.state.emailStatus = null;
      vnode.state.generalOpen = false;
      vnode.state.emailStatus = false;
    },
    view: (vnode) => {
      const { communities, subscriptions } = vnode.attrs;
      const communityIds = communities.map((c) => c.id);
      const threadSubs = subscriptions.filter((s) => communityIds.includes(s.objectId));
      return m(BatchedSubscriptionRow, {
        subscriptions: threadSubs,
        label: NEW_THREADS_ALL_COMMUNITIES_LABEL,
      });
    },
  };

interface IGeneralCommunityNotificationsAttrs {
  subscriptions: NotificationSubscription[];
  communities: CommunityInfo[];
}

const GeneralCommunityNotifications: m.Component<IGeneralCommunityNotificationsAttrs> = {
  view: (vnode) => {
    const { subscriptions, communities } = vnode.attrs;
    const mentionsSubscription = subscriptions.find((s) => s.category === NotificationCategories.NewMention);
    const chainIds = app.config.chains.getAll().map((c) => c.id);
    const batchedSubscriptions = sortSubscriptions(subscriptions.filter((s) => {
      return !chainIds.includes(s.objectId)
        && s.category !== NotificationCategories.NewMention
        && s.category !== NotificationCategories.NewThread
        && s.category !== NotificationCategories.ChainEvent
        && !s.OffchainComment;
    }), 'objectId');
    return [
      mentionsSubscription && m(BatchedSubscriptionRow, {
        subscriptions: [mentionsSubscription],
        label: NEW_MENTIONS_LABEL,
      }),
      m(GeneralNewThreadsAndComments, { communities, subscriptions }),
      batchedSubscriptions.map((subscriptions2: NotificationSubscription[]) => {
        return m(BatchedSubscriptionRow, { subscriptions: subscriptions2 });
      })
      // m(GeneralPastThreadsAndComments, { subscriptions }),
    ];
  },
};

interface ICommunityNotificationsAttrs {
  subscriptions: NotificationSubscription[];
  communities: CommunityInfo[];
  chains: ChainInfo[];
}

interface ICommunityNotificationsState {
  selectedCommunity: CommunityInfo | ChainInfo;
  selectedCommunityId: string;
  communityIds: string[];
}

const CommunityNotifications: m.Component<ICommunityNotificationsAttrs, ICommunityNotificationsState> = {
  oninit: (vnode) => {
    vnode.state.communityIds = [ALL_COMMUNITIES];
    vnode.attrs.communities.forEach((c) => vnode.state.communityIds.push(c.name));
    const roleChains = app.user.roles.map((r) => r.chain_id);
    vnode.attrs.chains.forEach((c) => {
      if (roleChains.includes(c.id)) vnode.state.communityIds.push(c.name);
    });
    vnode.state.communityIds.sort();
    vnode.state.selectedCommunityId = ALL_COMMUNITIES;
    vnode.state.selectedCommunity = null;
  },
  view: (vnode) => {
    const { subscriptions, communities, chains } = vnode.attrs;
    const { selectedCommunity, selectedCommunityId, communityIds } = vnode.state;
    if (!communities || !subscriptions) return;
    return m('.CommunityNotifications', [
      m('.header', [
        m(SelectList, {
          class: 'CommunityNotificationSelectList',
          filterable: false,
          checkmark: false,
          emptyContent: null,
          // inputAttrs: {
          //   class: 'CommunitySelectRow',
          // },
          itemRender: (community: string) => {
            return m(ListItem, {
              label: community,
              selected: (vnode.state.selectedCommunityId === community),
            });
          },
          items: communityIds,
          trigger: m(Button, {
            align: 'left',
            compact: true,
            iconRight: Icons.CHEVRON_DOWN,
            label: vnode.state.selectedCommunity
              ? vnode.state.selectedCommunityId
              : ALL_COMMUNITIES,
          }),
          onSelect: (community: string) => {
            vnode.state.selectedCommunity = communities.find((c) => c.name === community)
              || chains.find((c) => c.name === community);
            vnode.state.selectedCommunityId = vnode.state.selectedCommunity?.name || ALL_COMMUNITIES;
            m.redraw();
          }
        }),
      ]),
      m(Table, {
        class: 'NotificationsTable',
      }, [
        m('tr', [
          m('th', NOTIFICATION_TABLE_PRE_COPY),
          m('th', ''),
        ]),
        (selectedCommunityId === ALL_COMMUNITIES) && [
          m(GeneralCommunityNotifications, { communities, subscriptions }),
        ],
        (!!selectedCommunity)
          && m(CommunitySpecificNotifications, { subscriptions, community: selectedCommunity }),
      ]),
    ]);
  }
};

const NotificationSettingsPage: m.Component<{}, {
  selectedFilter: string;
  communities: CommunityInfo[];
  subscriptions: NotificationSubscription[];
}> = {
  oninit: async (vnode) => {
    if (!app.isLoggedIn) m.route.set('/');
    vnode.state.subscriptions = [];
    vnode.state.communities = [];
    vnode.state.selectedFilter = 'Community Notifications';

    $.get(`${app.serverUrl()}/viewSubscriptions`, {
      jwt: app.user.jwt,
    }).then((result) => {
      vnode.state.subscriptions = [];
      result.result.forEach((sub) => {
        vnode.state.subscriptions.push(NotificationSubscription.fromJSON(sub));
      });
      m.redraw();
    }, (error) => {
      m.route.set('/');
    });
    const communityIds = app.user.roles
      .filter((role) => role.offchain_community_id)
      .map((r) => r.offchain_community_id);
    vnode.state.communities = _.uniq(
      app.config.communities.getAll()
        .filter((c) => communityIds.includes(c.id))
    );
  },
  view: (vnode) => {
    const { communities, subscriptions } = vnode.state;
    const chains = _.uniq(app.config.chains.getAll());
    if (!app.loginStatusLoaded()) return m(PageLoading);
    if (!app.isLoggedIn()) return m(PageError, {
      message: 'This page requires you to be logged in.'
    });
    if (subscriptions.length < 1) return m(PageLoading);

    return m(Sublayout, {
      class: 'NotificationSettingsPage',
      title: 'Notifications',
    }, [
      m('.forum-container', [
        m(CommunityNotifications, { subscriptions, communities, chains, }),
      ]),
      m(ChainNotificationManagementPage, {
        chains,
      }),
    ]);
  },
};

export default NotificationSettingsPage;

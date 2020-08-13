import 'pages/subscriptions.scss';

import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import { Button, Icons, ListItem, Checkbox, Table, SelectList, } from 'construct-ui';

import { NotificationSubscription, ChainInfo, CommunityInfo } from 'models';
import app from 'state';
import { NotificationCategories } from 'types';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import PageError from 'views/pages/error';
import { sortSubscriptions } from 'helpers/notifications';

const ImmediateEmailCheckbox: m.Component<{
  subscription?: NotificationSubscription,
  subscriptions?: NotificationSubscription[]
}> = {
  view: (vnode) => {
    const { subscription, subscriptions } = vnode.attrs;
    if (subscription) {
      return m('td', [
        m(Checkbox, {
          disabled: !subscription.isActive,
          checked: subscription.immediateEmail,
          size: 'lg',
          onchange: async () => {
            if (subscription.immediateEmail) {
              await app.user.notifications.disableImmediateEmails([subscription]);
            } else {
              await app.user.notifications.enableImmediateEmails([subscription]);
            }
            m.redraw();
          },
        })
      ]);
    } else if (subscriptions) {
      const everyActive = subscriptions.every((s) => s.isActive);
      const someEmails = subscriptions.some((s) => s.immediateEmail);
      const everyEmail = subscriptions.every((s) => s.immediateEmail);
      return m('td', [
        m(Checkbox, {
          disabled: !everyActive,
          checked: everyEmail,
          indeterminate: someEmails && !everyEmail,
          size: 'lg',
          onchange: async () => {
            if (everyEmail) {
              await app.user.notifications.disableImmediateEmails(subscriptions);
            } else {
              await app.user.notifications.enableImmediateEmails(subscriptions);
            }
            m.redraw();
          },
        }),
      ]);
    }
  },
};

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
        ? m('a', {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${chainOrCommunityId}/proposal/discussion/${subscription.OffchainThread.id}`);
          }
        }, `New Comments on '${String(threadOrComment)}'`)
        : `New Comments on '${String(threadOrComment)}'`;
    }
    case (NotificationCategories.NewReaction): {
      const threadOrComment = subscription.OffchainThread
        ? decodeURIComponent(subscription.OffchainThread.title)
        : subscription.OffchainComment
          ? decodeURIComponent(subscription.OffchainComment.id)
          : subscription.objectId;
      return subscription.OffchainThread
        ? m('a', {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${chainOrCommunityId}/proposal/discussion/${subscription.OffchainThread.id}`);
          }
        }, `New Reactions on '${String(threadOrComment)}'`)
        : `New Reactions on '${String(threadOrComment)}'`;
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
    ? m('a', {
      href: '#',
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${chainOrCommunityId}/proposal/discussion/${subscriptions[0].OffchainThread.id}`);
      }
    }, `New Comments & Reactions on '${String(threadOrComment)}'`)
    : `New Comments & Reactions on 'Comment ${String(threadOrComment)}'`;
};

interface IBatchedSubscriptionRowAttrs {
  subscriptions: NotificationSubscription[];
  label?: string;
  bold?: boolean;
}

interface IBatchedSubscriptionRowState {
  subscriptions: NotificationSubscription[];
  paused: boolean;
}

const BatchedSubscriptionRow: m.Component<IBatchedSubscriptionRowAttrs, IBatchedSubscriptionRowState> = {
  oninit: (vnode) => {
    vnode.state.subscriptions = vnode.attrs.subscriptions;
  },
  view: (vnode) => {
    const { label, bold } = vnode.attrs;
    const { subscriptions } = vnode.state;
    const someActive = subscriptions.some((s) => s.isActive);
    const everyActive = subscriptions.every((s) => s.isActive);
    if (!subscriptions) return;
    return m('tr.SubscriptionRow', [
      m('td', {
        class: bold ? 'bold' : null,
      }, [
        (label) ? label
          : (subscriptions?.length > 1)
            ? batchLabel(subscriptions)
            : singleLabel(subscriptions[0]),
      ]),
      m('td', [
        m(Checkbox, {
          checked: everyActive,
          indeterminate: someActive && !everyActive,
          class: '',
          size: 'lg',
          onclick: async (e) => {
            e.preventDefault();
            if (everyActive) {
              await app.user.notifications.disableSubscriptions(subscriptions);
            } else {
              await app.user.notifications.enableSubscriptions(subscriptions);
            }
            m.redraw();
          }
        }),
      ]),
      subscriptions && app.user.email
        && m(ImmediateEmailCheckbox, { subscriptions, }),
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
      label: 'New Threads',
      bold: true
    });
  },
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
    const onComments = subscriptions.filter((s) => {
      return (s.OffchainCommunity?.id === community.id || s.Chain?.id === community.id) && s.OffchainComment;
    });
    const batchedSubscriptions = sortSubscriptions(filteredSubscriptions, 'objectId');
    if (filteredSubscriptions.length < 1 && onComments.length < 1) return;
    return [
      m(NewThreadRow, { community, subscriptions }),
      onComments.length > 0 && m(BatchedSubscriptionRow, {
        label: 'Notifications on Comments',
        subscriptions: onComments,
      }),
      // TODO: Filter community past-thread/comment subscriptions here into SubscriptionRows.
      batchedSubscriptions.map((subscriptions2: NotificationSubscription[]) => {
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
        label: 'New Threads (All Communities)',
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
      mentionsSubscription
        && m('tr.mentions.SubscriptionRow', [
          m('td', { class: 'bold', }, 'Mentions:'),
          m('td', [
            m(Checkbox, {
              size: 'lg',
              checked: mentionsSubscription.isActive,
              onchange: async (e) => {
                e.preventDefault();
                if (mentionsSubscription.isActive) {
                  await app.user.notifications.disableSubscriptions([mentionsSubscription]);
                } else {
                  await app.user.notifications.enableSubscriptions([mentionsSubscription]);
                }
                m.redraw();
              }
            }),
          ]),
          m(ImmediateEmailCheckbox, { subscription: mentionsSubscription }),
        ]),
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
    vnode.state.communityIds = ['All communities'];
    vnode.attrs.communities.forEach((c) => vnode.state.communityIds.push(c.name));
    const roleChains = app.user.roles.map((r) => r.chain_id);
    vnode.attrs.chains.forEach((c) => {
      if (roleChains.includes(c.id)) vnode.state.communityIds.push(c.name);
    });
    vnode.state.communityIds.sort();
    vnode.state.selectedCommunityId = 'All communities';
    vnode.state.selectedCommunity = null;
  },
  view: (vnode) => {
    const { subscriptions, communities, chains } = vnode.attrs;
    const { selectedCommunity, selectedCommunityId, communityIds } = vnode.state;
    if (!communities || !subscriptions) return;
    return m('.CommunityNotifications', [
      m('.header', [
        m(SelectList, {
          class: 'CommunitySelectList',
          filterable: false,
          checkmark: false,
          emptyContent: null,
          inputAttrs: {
            class: 'CommunitySelectRow',
          },
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
              : 'All communities',
          }),
          onSelect: (community: string) => {
            vnode.state.selectedCommunity = communities.find((c) => c.name === community)
              || chains.find((c) => c.name === community);
            vnode.state.selectedCommunityId = vnode.state.selectedCommunity?.name || 'All communities';
            m.redraw();
          }
        }),
      ]),
      m(Table, {
        class: 'NotificationsTable',
      }, [
        m('tr', [
          m('th', null),
          m('th', 'In app'),
          m('th', 'By email'),
        ]),
        (selectedCommunityId === 'All communities') && [
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
  oncreate: async (vnode) => {
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
      class: 'SubscriptionsPage',
      title: 'Notifications',
    }, [
      m('.forum-container', [
        m(CommunityNotifications, { subscriptions, communities, chains, }),
      ]),
    ]);
  },
};

export default NotificationSettingsPage;

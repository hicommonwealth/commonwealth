import 'pages/notification_subscriptions.scss';

import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import { Checkbox, Button, Icons, ListItem, Table, SelectList } from 'construct-ui';
import { SubstrateEvents, SubstrateTypes, IChainEventKind, TitlerFilter } from '@commonwealth/chain-events';

import app from 'state';
import { NotificationSubscription, ChainInfo, CommunityInfo, ChainNetwork } from 'models';
import { NotificationCategories } from 'types';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import PageError from 'views/pages/error';
import { sortSubscriptions } from 'helpers/notifications';
import {
  EdgewareChainNotificationTypes, KusamaChainNotificationTypes, PolkdotChainNotificationTypes, KulupuChainNotificationTypes
} from 'helpers/chain_notification_types';

const NOTIFICATION_TABLE_PRE_COPY = 'Off-chain discussions';
const CHAIN_NOTIFICATION_TABLE_PRE_COPY = 'On-chain events';

const COMMENT_NUM_PREFIX = 'Comment #';
const ALL_COMMUNITIES = 'All communities';

// left column - for identifying the notification type
const NEW_MENTIONS_LABEL = 'When someone mentions me';
const NEW_THREADS_LABEL = 'When a thread is created';
const NEW_ACTIVITY_LABEL = 'When there is new activity on';
const NEW_COMMENTS_LABEL_PREFIX = 'New comments on ';
const NEW_REACTIONS_LABEL_PREFIX = 'New reactions on ';

// right column - for selecting the notification frequency
const NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION = 'Immediately by email';
const NOTIFICATION_ON_OPTION = 'On';
const NOTIFICATION_ON_SOMETIMES_OPTION = '--';
const NOTIFICATION_OFF_OPTION = 'Off';

const BatchedSubscriptionRow: m.Component<{
  subscriptions: NotificationSubscription[];
  label?: string;
}, {
  option: string;
}> = {
  view: (vnode) => {
    const { label, subscriptions } = vnode.attrs;
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

    return m('tr.BatchedSubscriptionRow', [
      m('td.subscription-label', [
        label || ((subscriptions?.length > 1)
          ? batchLabel(subscriptions)
          : singleLabel(subscriptions[0])),
      ]),
      m('td.subscription-setting', [
        m(SelectList, {
          class: 'BatchedNotificationSelectList',
          filterable: false,
          checkmark: false,
          emptyContent: null,
          inputAttrs: {
            class: 'BatchedNotificationSelectRow',
          },
          popoverAttrs: {
            transitionDuration: 0,
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
            size: 'sm',
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
      label: NEW_THREADS_LABEL,
    });
  },
};

const EventSubscriptionRow: m.Component<{
    chain: string;
    kind: IChainEventKind;
    titler: TitlerFilter;
}, {}> = {
  view: (vnode) => {
    const { chain, kind } = vnode.attrs;
    const { title, description } = vnode.attrs.titler(kind);
    const objectId = `${chain}-${kind}`;
    const subscription = app.loginStatusLoaded && app.user.notifications.subscriptions
      .find((sub) => sub.category === NotificationCategories.ChainEvent
        && sub.objectId === objectId);
    return m('tr.EventSubscriptionRow', [
      m('td', `${title}`),
      app.loginStatusLoaded && m('td', [
        m(Checkbox, {
          checked: subscription && subscription.isActive,
          size: 'lg',
          onchange: async (e) => {
            e.preventDefault();
            if (subscription && subscription.isActive) {
              await app.user.notifications.disableSubscriptions([ subscription ]);
            } else if (subscription && !subscription.isActive) {
              await app.user.notifications.enableSubscriptions([ subscription ]);
            } else {
              await app.user.notifications.subscribe(NotificationCategories.ChainEvent, objectId);
            }
            m.redraw();
          }
        }),
      ]),
      m('td', [
        m(Checkbox, {
          disabled: !subscription?.isActive,
          checked: subscription?.isActive && subscription?.immediateEmail,
          size: 'lg',
          onchange: async (e) => {
            e.preventDefault();
            if (subscription && subscription.immediateEmail) {
              await app.user.notifications.disableImmediateEmails([ subscription ]);
            } else {
              await app.user.notifications.enableImmediateEmails([ subscription ]);
            }
            m.redraw();
          }
        }),
      ]),
    ]);
  }
};

/*  This currently is not in production. It is used for testing specific
    chain events and their related subscriptions. The EventSubscriptionRow
    above is also only used by IndividualEventSubscriptions.
*/
const IndividualEventSubscriptions: m.Component<{
  chain: ChainNetwork;
}, {
  eventKinds: IChainEventKind[];
  titler;
  allSupportedChains: string[];
  isSubscribedAll: boolean;
  isEmailAll: boolean;
}> = {
  oninit: (vnode) => {
    if (vnode.attrs.chain === ChainNetwork.Edgeware) {
      vnode.state.titler = SubstrateEvents.Title;
      vnode.state.eventKinds = SubstrateTypes.EventKinds;
    } else {
      vnode.state.titler = null;
      vnode.state.eventKinds = [];
    }
  },
  view: (vnode) => {
    const { eventKinds, titler } = vnode.state;

    const supportedChains = app.loginStatusLoaded
      ? app.config.chains.getAll()
        .filter((c) => vnode.state.allSupportedChains.includes(c.id))
        .sort((a, b) => a.id.localeCompare(b.id))
      : [];

    return [
      supportedChains.length > 0 && eventKinds.length > 0 && titler
        ? eventKinds.map((kind) => m(EventSubscriptionRow, {
          chain: vnode.attrs.chain,
          kind,
          titler,
          key: kind
        }))
        : m('No events available on this chain.'),
    ];
  },
};

const EventSubscriptionTypeRow: m.Component<{
  title: string;
  notificationTypeArray: string[];
}, { option: string, }> = {
  view: (vnode) => {
    const { title, notificationTypeArray, } = vnode.attrs;
    const subscriptions = app.user.notifications.subscriptions.filter((s) => {
      return (
        s.category === NotificationCategories.ChainEvent
        && notificationTypeArray.includes(s.objectId)
      );
    });
    const everySubscriptionActive = subscriptions.every((s) => s.isActive);
    const someSubscriptionsActive = subscriptions.some((s) => s.isActive);
    const everySubscriptionEmail = subscriptions.every((s) => s.immediateEmail);
    const someSubscriptionsEmail = subscriptions.some((s) => s.immediateEmail);
    const allSubscriptionsCreated = subscriptions.length === notificationTypeArray.length;

    if (allSubscriptionsCreated && everySubscriptionActive && everySubscriptionEmail) {
      vnode.state.option = NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION;
    } else if (allSubscriptionsCreated && everySubscriptionActive) {
      vnode.state.option = NOTIFICATION_ON_OPTION;
    } else {
      vnode.state.option = NOTIFICATION_OFF_OPTION;
    }

    return m('tr.EventSubscriptionTypeRow', [
      m('td', title),
      m('td', [
        m(SelectList, {
          class: 'EventSubscriptionTypeSelectList',
          filterable: false,
          checkmark: false,
          emptyContent: null,
          popoverAttrs: {
            transitionDuration: 0,
          },
          inputAttrs: {
            class: 'EventSubscriptionTypeSelectRow',
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
            size: 'sm',
          }),
          onSelect: async (option: string) => {
            vnode.state.option = option;
            if (option === NOTIFICATION_OFF_OPTION) {
              await app.user.notifications.disableImmediateEmails(subscriptions);
              await app.user.notifications.disableSubscriptions(subscriptions);
            } else if (option === NOTIFICATION_ON_OPTION) {
              if (!allSubscriptionsCreated) {
                await Promise.all(
                  notificationTypeArray.map((obj) => {
                    return app.user.notifications.subscribe(NotificationCategories.ChainEvent, obj);
                  })
                );
              } else {
                if (!everySubscriptionActive) await app.user.notifications.enableSubscriptions(subscriptions);
              }
              if (someSubscriptionsEmail) await app.user.notifications.disableImmediateEmails(subscriptions);
            } else if (option === NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION) {
              if (!allSubscriptionsCreated) {
                await Promise.all(
                  notificationTypeArray.map((obj) => {
                    return app.user.notifications.subscribe(NotificationCategories.ChainEvent, obj);
                  })
                ).then(async () => {
                  const newSubscriptions = app.user.notifications.subscriptions.filter((s) => {
                    return (
                      s.category === NotificationCategories.ChainEvent
                      && notificationTypeArray.includes(s.objectId)
                    );
                  });
                  await app.user.notifications.enableImmediateEmails(newSubscriptions);
                  m.redraw();
                });
              } else {
                if (!everySubscriptionActive) await app.user.notifications.enableSubscriptions(subscriptions);
                if (!everySubscriptionEmail) await app.user.notifications.enableImmediateEmails(subscriptions);
              }
            }
            m.redraw();
          }
        }),
      ]),
    ]);
  }
};

const EdgewareChainEvents: m.Component = {
  view: (vnode) => {
    return [
      m(EventSubscriptionTypeRow, { title: 'Council events', notificationTypeArray: EdgewareChainNotificationTypes.Council, }),
      m(EventSubscriptionTypeRow, { title: 'Democracy events', notificationTypeArray: EdgewareChainNotificationTypes.Democracy, }),
      m(EventSubscriptionTypeRow, { title: 'Preimage events', notificationTypeArray: EdgewareChainNotificationTypes.Preimage, }),
      m(EventSubscriptionTypeRow, { title: 'Signaling events', notificationTypeArray: EdgewareChainNotificationTypes.Signaling, }),
      m(EventSubscriptionTypeRow, { title: 'Treasury events', notificationTypeArray: EdgewareChainNotificationTypes.Treasury, }),
      m(EventSubscriptionTypeRow, { title: 'Validator events', notificationTypeArray: EdgewareChainNotificationTypes.Validator, }),
      m(EventSubscriptionTypeRow, { title: 'Vote events', notificationTypeArray: EdgewareChainNotificationTypes.Vote, }),
    ];
  }
};

const KusamaChainEvents: m.Component = {
  view: (vnode) => {
    return [
      m(EventSubscriptionTypeRow, { title: 'Council events', notificationTypeArray: KusamaChainNotificationTypes.Council, }),
      m(EventSubscriptionTypeRow, { title: 'Democracy events', notificationTypeArray: KusamaChainNotificationTypes.Democracy, }),
      m(EventSubscriptionTypeRow, { title: 'Preimage events', notificationTypeArray: KusamaChainNotificationTypes.Preimage, }),
      // m(EventSubscriptionTypeRow, { title: 'Treasury events', notificationTypeArray: KusamaChainNotificationTypes.Treasury, }),
      m(EventSubscriptionTypeRow, { title: 'Validator events', notificationTypeArray: KusamaChainNotificationTypes.Validator, }),
      m(EventSubscriptionTypeRow, { title: 'Vote events', notificationTypeArray: KusamaChainNotificationTypes.Vote, }),
    ];
  }
};

const PolkadotChainEvents: m.Component = {
  view: (vnode) => {
    return [
      m(EventSubscriptionTypeRow, { title: 'Council events', notificationTypeArray: PolkdotChainNotificationTypes.Council, }),
      m(EventSubscriptionTypeRow, { title: 'Democracy events', notificationTypeArray: PolkdotChainNotificationTypes.Democracy, }),
      m(EventSubscriptionTypeRow, { title: 'Preimage events', notificationTypeArray: PolkdotChainNotificationTypes.Preimage, }),
      // m(EventSubscriptionTypeRow, { title: 'Treasury events', notificationTypeArray: PolkdotChainNotificationTypes.Treasury, }),
      m(EventSubscriptionTypeRow, { title: 'Validator events', notificationTypeArray: PolkdotChainNotificationTypes.Validator, }),
      m(EventSubscriptionTypeRow, { title: 'Vote events', notificationTypeArray: PolkdotChainNotificationTypes.Vote, }),
    ];
  }
};

const KulupuChainEvents: m.Component = {
  view: (vnode) => {
    return [
      m(EventSubscriptionTypeRow, { title: 'Council events', notificationTypeArray: KulupuChainNotificationTypes.Council, }),
      m(EventSubscriptionTypeRow, { title: 'Democracy events', notificationTypeArray: KulupuChainNotificationTypes.Democracy, }),
      m(EventSubscriptionTypeRow, { title: 'Preimage events', notificationTypeArray: KulupuChainNotificationTypes.Preimage, }),
      // m(EventSubscriptionTypeRow, { title: 'Treasury events', notificationTypeArray: PolkdotChainNotificationTypes.Treasury, }),
      m(EventSubscriptionTypeRow, { title: 'Validator events', notificationTypeArray: KulupuChainNotificationTypes.Validator, }),
      m(EventSubscriptionTypeRow, { title: 'Vote events', notificationTypeArray: KulupuChainNotificationTypes.Vote, }),
    ];
  }
};

const IndividualCommunityNotifications: m.Component<{
  community: CommunityInfo | ChainInfo;
  subscriptions: NotificationSubscription[];
}, {}> = {
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
      batchedSubscriptions.length > 0 && m('tr.NewActivityRow', [
        m('td', NEW_ACTIVITY_LABEL),
        m('td'),
      ]),
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

const AllCommunitiesNotifications: m.Component<{
  subscriptions: NotificationSubscription[];
  communities: CommunityInfo[];
}> = {
  view: (vnode) => {
    const { subscriptions, communities } = vnode.attrs;
    const mentionsSubscription = subscriptions.find((s) => s.category === NotificationCategories.NewMention);
    const chainIds = app.config.chains.getAll().map((c) => c.id);
    const communityIds = communities.map((c) => c.id);
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
      m(BatchedSubscriptionRow, {
        subscriptions: subscriptions.filter((s) => communityIds.includes(s.objectId)),
        label: NEW_THREADS_LABEL,
      }),
      batchedSubscriptions.map((subscriptions2: NotificationSubscription[]) => {
        return m(BatchedSubscriptionRow, { subscriptions: subscriptions2 });
      })
    ];
  },
};

const NotificationSettingsPage: m.Component<{}, {
  communities: CommunityInfo[];
  subscriptions: NotificationSubscription[];
  selectedCommunity: CommunityInfo | ChainInfo;
  selectedCommunityId: string;
  selectableCommunityIds: string[];
}> = {
  oninit: async (vnode) => {
    if (!app.isLoggedIn) m.route.set('/');
    vnode.state.subscriptions = [];
    vnode.state.communities = [];

    // initialize vnode.state.subscriptions
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

    // initialize vnode.state.communities
    const selectableCommunityIds = app.user.roles
      .filter((role) => role.offchain_community_id)
      .map((r) => r.offchain_community_id);
    vnode.state.communities = _.uniq(
      app.config.communities.getAll()
        .filter((c) => selectableCommunityIds.includes(c.id))
    );

    // initialize selectableCommunityIds
    vnode.state.selectableCommunityIds = [ALL_COMMUNITIES];
    vnode.state.communities.forEach((c) => vnode.state.selectableCommunityIds.push(c.name));
    const chains = _.uniq(app.config.chains.getAll());
    const chainsWithRole = app.user.roles.map((r) => r.chain_id);
    chains.forEach((c) => {
      if (chainsWithRole.includes(c.id)) vnode.state.selectableCommunityIds.push(c.name);
    });
    vnode.state.selectableCommunityIds.sort();

    // initialize vnode.state.selectedCommunity, vnode.state.selectedCommunityId
    vnode.state.selectedCommunityId = ALL_COMMUNITIES;
    vnode.state.selectedCommunity = null;
  },
  view: (vnode) => {
    const { communities, subscriptions } = vnode.state;
    const { selectedCommunity, selectedCommunityId, selectableCommunityIds } = vnode.state;

    const chains = _.uniq(app.config.chains.getAll());
    if (!app.loginStatusLoaded()) return m(PageLoading);
    if (!app.isLoggedIn()) return m(PageError, {
      message: 'This page requires you to be logged in.'
    });
    if (subscriptions.length < 1) return m(PageLoading);

    return m(Sublayout, {
      class: 'NotificationSettingsPage',
      title: 'Notification Settings',
    }, [
      m('.forum-container', [
        communities && subscriptions && m('.CommunityNotifications', [
          m('.header', [
            m(SelectList, {
              class: 'CommunityNotificationSelectList',
              filterable: false,
              checkmark: false,
              emptyContent: null,
              popoverAttrs: {
                transitionDuration: 0,
              },
              itemRender: (community: string) => {
                return m(ListItem, {
                  label: community,
                  selected: (vnode.state.selectedCommunityId === community),
                });
              },
              items: selectableCommunityIds,
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
          m(Table, { class: 'NotificationsTable' }, [
            // off-chain discussion notifications
            m('tr', [
              m('th', NOTIFICATION_TABLE_PRE_COPY),
              m('th', ''),
            ]),
            selectedCommunityId === ALL_COMMUNITIES
              && m(AllCommunitiesNotifications, { communities, subscriptions }),
            selectedCommunity
              && m(IndividualCommunityNotifications, { subscriptions, community: selectedCommunity }),
            // on-chain event notifications
            selectedCommunity instanceof ChainInfo && [
              m('tr', [
                m('th', CHAIN_NOTIFICATION_TABLE_PRE_COPY),
                m('th', ''),
              ]),
              selectedCommunity.network === ChainNetwork.Edgeware && m(EdgewareChainEvents),
              selectedCommunity.network === ChainNetwork.Kulupu && m(KulupuChainEvents),
              selectedCommunity.network === ChainNetwork.Kusama && m(KusamaChainEvents),
              selectedCommunity.network === ChainNetwork.Polkadot && m(PolkadotChainEvents),
            ],
          ]),
        ]),
      ]),
    ]);
  },
};

export default NotificationSettingsPage;

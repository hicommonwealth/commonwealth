import 'pages/notifications.scss';

import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment-twitter';
import { Checkbox, Button, Icons, ListItem, Table, Tag, Grid, Col, SelectList, RadioGroup } from 'construct-ui';
import { SubstrateEvents, SubstrateTypes, IChainEventKind, TitlerFilter } from '@commonwealth/chain-events';

import app from 'state';
import { NotificationSubscription, ChainInfo, CommunityInfo, ChainNetwork } from 'models';
import { NotificationCategories } from 'types';

import { link, pluralize } from 'helpers';
import { sortSubscriptions } from 'helpers/notifications';
import {
  EdgewareChainNotificationTypes, KusamaChainNotificationTypes,
  PolkadotChainNotificationTypes, KulupuChainNotificationTypes
} from 'helpers/chain_notification_types';

import { notifyError } from 'controllers/app/notifications';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import PageError from 'views/pages/error';

const NOTIFICATION_TABLE_PRE_COPY = 'Off-chain discussion events';
const CHAIN_NOTIFICATION_TABLE_PRE_COPY = 'On-chain events';

const ALL_COMMUNITIES = 'All communities';

// left column - for identifying the notification type
const NEW_MENTIONS_LABEL = 'When someone mentions me';
const NEW_THREADS_LABEL = 'When a thread is created';
const NEW_ACTIVITY_LABEL = 'When there is new activity on...';
const NEW_COMMENTS_LABEL_SUFFIX = '(new comments only)';
const NEW_REACTIONS_LABEL_SUFFIX = '(new reactions only)';

// right column - for selecting the notification frequency
const NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION = 'On (immediate)';
const NOTIFICATION_ON_OPTION = 'On';
const NOTIFICATION_ON_SOMETIMES_OPTION = 'Multiple selections';
const NOTIFICATION_OFF_OPTION = 'Off';

const EmailIntervalConfiguration: m.Component<{}, { interval: string, saving: boolean }> = {
  view: (vnode) => {
    if (!app.user) return;
    if (vnode.state.interval === undefined) vnode.state.interval = app.user.emailInterval;

    return m(Grid, { class: 'EmailIntervalConfiguration' }, [
      m(Col, { class: 'email-interval-configuration-left', span: { xs: 12, md: 6 } }, [
        m('h4', 'Notification digest'),
        m('p', 'Receive a digest of your unread notifications'),
        m(RadioGroup, {
          options: ['daily', 'never'],
          name: 'interval',
          onchange: (e) => {
            vnode.state.saving = true;
            const value = (e.target as HTMLInputElement).value;

            $.post(`${app.serverUrl()}/writeUserSetting`, {
              jwt: app.user.jwt,
              key: 'updateEmailInterval',
              value,
            }).then((result) => {
              vnode.state.saving = false;
              vnode.state.interval = value;
              app.user.setEmailInterval(value);
              m.redraw();
            }).catch((err) => {
              vnode.state.saving = false;
              m.redraw();
            });
          },
          value: vnode.state.interval,
        }),
        !app.user.email
          ? m('p', [
            link('a', `/${app.activeId()}/settings`, 'Set an email'),
            ' to start receiving notification digests.'
          ])
          : !app.user.emailVerified ? m('p', [
            'Your email has not been verified. ',
            link('a', `/${app.activeId()}/settings`, 'Finish verification'),
            ' to continue receiving notification emails.'
          ]) : '',
        vnode.state.saving === false && m('p', 'Setting saved!'), // vnode.state.saving is undefined upon init
      ]),
      m(Col, { class: 'email-interval-configuration-right', span: { xs: 12, md: 6 } }, [
        m('h4', 'Immediate email notifications'),
        m('p', [
          'Select ',
          m('strong', 'On (immediate)'),
          ' to receive an email immediately when the selected event occurs'
        ]),
      ]),
    ]);
  }
};

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
    const everyEmail = subscriptions.every((s) => s.immediateEmail);
    if (everyActive && everyEmail) {
      vnode.state.option = NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION;
    } else if (everyActive && !someEmail) {
      vnode.state.option = NOTIFICATION_ON_OPTION;
    } else if (someActive || someEmail) {
      vnode.state.option = NOTIFICATION_ON_SOMETIMES_OPTION;
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

          return subscription.OffchainThread ? [
            link('a', `/${chainOrCommunityId}/proposal/discussion/${subscription.OffchainThread.id}`,
              threadOrComment.toString(), { target: '_blank' }),
            m('span.item-metadata', moment(subscription.OffchainThread.created_at).fromNow()),
            m('span.item-metadata', NEW_COMMENTS_LABEL_SUFFIX),
          ] : [
            threadOrComment.toString(),
            m('span.item-metadata', NEW_COMMENTS_LABEL_SUFFIX),
          ];
        }
        case (NotificationCategories.NewReaction): {
          const threadOrComment = subscription.OffchainThread
            ? decodeURIComponent(subscription.OffchainThread.title)
            : subscription.OffchainComment
              ? decodeURIComponent(subscription.OffchainComment.id)
              : subscription.objectId;
          return subscription.OffchainThread ? [
            link('a', `/${chainOrCommunityId}/proposal/discussion/${subscription.OffchainThread.id}`,
              threadOrComment.toString(), { target: '_blank' }),
            m('span.item-metadata', moment(subscription.OffchainThread.created_at).fromNow()),
            m('span.item-metadata', NEW_REACTIONS_LABEL_SUFFIX),
          ] : [
            threadOrComment.toString(),
            m('span.item-metadata', NEW_REACTIONS_LABEL_SUFFIX),
          ];
        }
        default:
          break;
      }
    };

    const batchLabel = (batchLabelSubscriptions: NotificationSubscription[]) => {
      const subscription = batchLabelSubscriptions[0];
      const chainOrCommunityId = subscription.Chain
        ? subscription.Chain.id
        : subscription.OffchainCommunity
          ? subscription.OffchainCommunity.id
          : null;

      const threadOrComment = subscription.OffchainThread
        ? decodeURIComponent(subscription.OffchainThread.title)
        : subscription.OffchainComment
          ? decodeURIComponent(subscription.OffchainComment.id)
          : subscription.objectId;

      return subscription.OffchainThread ? [
        link('a', `/${chainOrCommunityId}/proposal/discussion/${subscription.OffchainThread.id}`,
          threadOrComment.toString(), { target: '_blank' }),
        m('span.item-metadata', moment(subscription.OffchainThread.created_at).fromNow()),
      ] : [ threadOrComment.toString() ];
    };

    // hide subscriptions on threads/comments that have been deleted
    if (_.every(subscriptions, (s) => !s.OffchainComment && !s.OffchainThread
      && (s.category === NotificationCategories.NewComment || s.category === NotificationCategories.NewReaction))) {
      return;
    }

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
          items: [NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION, NOTIFICATION_ON_OPTION, NOTIFICATION_OFF_OPTION],
          trigger: m(Button, {
            align: 'left',
            compact: true,
            iconRight: Icons.CHEVRON_DOWN,
            label: vnode.state.option,
            size: 'sm',
            class: vnode.state.option === NOTIFICATION_ON_SOMETIMES_OPTION ? 'sometimes' : '',
          }),
          onSelect: async (option: string) => {
            vnode.state.option = option;
            try {
              if (subscriptions.length < 1) return;
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
            } catch (err) {
              notifyError(err.toString());
            }
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

// /*  This currently is not in production. It is used for testing specific
//     chain events and their related subscriptions.
// */
// const EventSubscriptionRow: m.Component<{
//     chain: string;
//     kind: IChainEventKind;
//     titler: TitlerFilter;
// }, {}> = {
//   view: (vnode) => {
//     const { chain, kind } = vnode.attrs;
//     const { title, description } = vnode.attrs.titler(kind);
//     const objectId = `${chain}-${kind}`;
//     const subscription = app.loginStatusLoaded && app.user.notifications.subscriptions
//       .find((sub) => sub.category === NotificationCategories.ChainEvent
//         && sub.objectId === objectId);
//     return m('tr.EventSubscriptionRow', [
//       m('td', `${title}`),
//       app.loginStatusLoaded && m('td', [
//         m(Checkbox, {
//           checked: subscription && subscription.isActive,
//           size: 'lg',
//           onchange: async (e) => {
//             e.preventDefault();
//             if (subscription && subscription.isActive) {
//               await app.user.notifications.disableSubscriptions([ subscription ]);
//             } else if (subscription && !subscription.isActive) {
//               await app.user.notifications.enableSubscriptions([ subscription ]);
//             } else {
//               await app.user.notifications.subscribe(NotificationCategories.ChainEvent, objectId);
//             }
//             m.redraw();
//           }
//         }),
//       ]),
//       m('td', [
//         m(Checkbox, {
//           disabled: !subscription?.isActive,
//           checked: subscription?.isActive && subscription?.immediateEmail,
//           size: 'lg',
//           onchange: async (e) => {
//             e.preventDefault();
//             if (subscription && subscription.immediateEmail) {
//               await app.user.notifications.disableImmediateEmails([ subscription ]);
//             } else {
//               await app.user.notifications.enableImmediateEmails([ subscription ]);
//             }
//             m.redraw();
//           }
//         }),
//       ]),
//     ]);
//   }
// };

// const IndividualEventSubscriptions: m.Component<{
//   chain: ChainNetwork;
// }, {
//   eventKinds: IChainEventKind[];
//   titler;
//   allSupportedChains: string[];
//   isSubscribedAll: boolean;
//   isEmailAll: boolean;
// }> = {
//   oninit: (vnode) => {
//     if (vnode.attrs.chain === ChainNetwork.Edgeware) {
//       vnode.state.titler = SubstrateEvents.Title;
//       vnode.state.eventKinds = SubstrateTypes.EventKinds;
//     } else {
//       vnode.state.titler = null;
//       vnode.state.eventKinds = [];
//     }
//   },
//   view: (vnode) => {
//     const { eventKinds, titler } = vnode.state;

//     const supportedChains = app.loginStatusLoaded
//       ? app.config.chains.getAll()
//         .filter((c) => vnode.state.allSupportedChains.includes(c.id))
//         .sort((a, b) => a.id.localeCompare(b.id))
//       : [];

//     return [
//       supportedChains.length > 0 && eventKinds.length > 0 && titler
//         ? eventKinds.map((kind) => m(EventSubscriptionRow, {
//           chain: vnode.attrs.chain,
//           kind,
//           titler,
//           key: kind
//         }))
//         : m('No events available on this chain.'),
//     ];
//   },
// };

const ChainEventSubscriptionRow: m.Component<{
  title: string;
  notificationTypeArray: string[];
  recommended?: boolean;
}, { option: string, }> = {
  view: (vnode) => {
    const { title, notificationTypeArray, recommended } = vnode.attrs;
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

    return m('tr.ChainEventSubscriptionRow', [
      m('td.subscription-label', [
        title,
        recommended && m(Tag, { size: 'xs', label: 'Recommended' }),
      ]),
      m('td.subscription-setting', [
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
          items: [NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION, NOTIFICATION_ON_OPTION, NOTIFICATION_OFF_OPTION],
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

const EdgewareChainEventNotifications: m.Component = {
  view: (vnode) => {
    return [
      m(ChainEventSubscriptionRow, { title: 'Council events', notificationTypeArray: EdgewareChainNotificationTypes.Council, recommended: true }),
      m(ChainEventSubscriptionRow, { title: 'Democracy events', notificationTypeArray: EdgewareChainNotificationTypes.Democracy, recommended: true }),
      m(ChainEventSubscriptionRow, { title: 'Signaling events', notificationTypeArray: EdgewareChainNotificationTypes.Signaling, recommended: true }),
      m(ChainEventSubscriptionRow, { title: 'Treasury events', notificationTypeArray: EdgewareChainNotificationTypes.Treasury, }),
      m(ChainEventSubscriptionRow, { title: 'Validator events', notificationTypeArray: EdgewareChainNotificationTypes.Validator, }),
      m(ChainEventSubscriptionRow, { title: 'Preimage events', notificationTypeArray: EdgewareChainNotificationTypes.Preimage, }),
      m(ChainEventSubscriptionRow, { title: 'Voting delegation events', notificationTypeArray: EdgewareChainNotificationTypes.VotingDelegation, }),
    ];
  }
};

const KusamaChainEventNotifications: m.Component = {
  view: (vnode) => {
    return [
      m(ChainEventSubscriptionRow, { title: 'Council events', notificationTypeArray: KusamaChainNotificationTypes.Council, recommended: true }),
      m(ChainEventSubscriptionRow, { title: 'Democracy events', notificationTypeArray: KusamaChainNotificationTypes.Democracy, recommended: true }),
      m(ChainEventSubscriptionRow, { title: 'Treasury events', notificationTypeArray: KusamaChainNotificationTypes.Treasury, recommended: true }),
      m(ChainEventSubscriptionRow, { title: 'Validator events', notificationTypeArray: KusamaChainNotificationTypes.Validator, }),
      m(ChainEventSubscriptionRow, { title: 'Preimage events', notificationTypeArray: KusamaChainNotificationTypes.Preimage, }),
      m(ChainEventSubscriptionRow, { title: 'Voting delegation events', notificationTypeArray: KusamaChainNotificationTypes.VotingDelegation, }),
    ];
  }
};

const PolkadotChainEventNotifications: m.Component = {
  view: (vnode) => {
    return [
      m(ChainEventSubscriptionRow, { title: 'Council events', notificationTypeArray: PolkadotChainNotificationTypes.Council, recommended: true }),
      m(ChainEventSubscriptionRow, { title: 'Democracy events', notificationTypeArray: PolkadotChainNotificationTypes.Democracy, recommended: true }),
      m(ChainEventSubscriptionRow, { title: 'Treasury events', notificationTypeArray: PolkadotChainNotificationTypes.Treasury, recommended: true }),
      m(ChainEventSubscriptionRow, { title: 'Validator events', notificationTypeArray: PolkadotChainNotificationTypes.Validator, }),
      m(ChainEventSubscriptionRow, { title: 'Preimage events', notificationTypeArray: PolkadotChainNotificationTypes.Preimage, }),
      m(ChainEventSubscriptionRow, { title: 'Voting delegation events', notificationTypeArray: PolkadotChainNotificationTypes.VotingDelegation, }),
    ];
  }
};

const KulupuChainEventNotifications: m.Component = {
  view: (vnode) => {
    return [
      m(ChainEventSubscriptionRow, { title: 'Council events', notificationTypeArray: KulupuChainNotificationTypes.Council, recommended: true }),
      m(ChainEventSubscriptionRow, { title: 'Democracy events', notificationTypeArray: KulupuChainNotificationTypes.Democracy, recommended: true }),
      m(ChainEventSubscriptionRow, { title: 'Treasury events', notificationTypeArray: KulupuChainNotificationTypes.Treasury, recommended: true }),
      m(ChainEventSubscriptionRow, { title: 'Validator events', notificationTypeArray: KulupuChainNotificationTypes.Validator, }),
      m(ChainEventSubscriptionRow, { title: 'Preimage events', notificationTypeArray: KulupuChainNotificationTypes.Preimage, }),
      m(ChainEventSubscriptionRow, { title: 'Voting delegation events', notificationTypeArray: KulupuChainNotificationTypes.VotingDelegation, }),
    ];
  }
};

const IndividualCommunityNotifications: m.Component<{
  community: CommunityInfo | ChainInfo;
  subscriptions: NotificationSubscription[];
}, {
  expanded: boolean;
}> = {
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
      vnode.state.expanded && batchedSubscriptions.map((subscriptions2: NotificationSubscription[]) => {
        return m(BatchedSubscriptionRow, {
          subscriptions: subscriptions2,
          key: subscriptions2[0].id,
        });
      }),
      batchedSubscriptions.length > 0 && m('tr', [
        m('td', { colspan: 2 }, [
          m('a.expand-notifications-link', {
            href: '#',
            onclick: (e) => { e.preventDefault(); vnode.state.expanded = !vnode.state.expanded; },
          }, [
            `${vnode.state.expanded ? 'Hide' : 'Show'} ${pluralize(batchedSubscriptions.length, 'thread')}`,
          ]),
        ]),
      ]),
    ];
  },
};

const AllCommunitiesNotifications: m.Component<{
  subscriptions: NotificationSubscription[];
  communities: string[];
}, {
  expanded: boolean;
}> = {
  view: (vnode) => {
    const { subscriptions, communities } = vnode.attrs;
    const mentionsSubscription = subscriptions.find((s) => s.category === NotificationCategories.NewMention);
    const chainIds = app.config.chains.getAll().map((c) => c.id);
    // const communityIds = communities.map((c) => c.id);
    const communityIds = communities;
    const batchedSubscriptions = sortSubscriptions(subscriptions.filter((s) => {
      return !chainIds.includes(s.objectId)
        && s.category !== NotificationCategories.NewMention
        && s.category !== NotificationCategories.NewThread
        && s.category !== NotificationCategories.ChainEvent
        && !s.OffchainComment;
    }), 'objectId');
    return [
      m(BatchedSubscriptionRow, {
        subscriptions: subscriptions.filter((s) => communityIds.includes(s.objectId)),
        label: NEW_THREADS_LABEL,
      }),
      mentionsSubscription && m(BatchedSubscriptionRow, {
        subscriptions: [mentionsSubscription],
        label: NEW_MENTIONS_LABEL,
      }),
      batchedSubscriptions.length > 0 && m('tr.NewActivityRow', [
        m('td', NEW_ACTIVITY_LABEL),
        m('td'),
      ]),
      vnode.state.expanded && batchedSubscriptions.map((subscriptions2: NotificationSubscription[]) => {
        return m(BatchedSubscriptionRow, { subscriptions: subscriptions2 });
      }),
      batchedSubscriptions.length > 0 && m('tr', [
        m('td', { colspan: 2 }, [
          m('a.expand-notifications-link', {
            href: '#',
            onclick: (e) => { e.preventDefault(); vnode.state.expanded = !vnode.state.expanded; },
          }, [
            `${vnode.state.expanded ? 'Hide' : 'Show'} ${pluralize(batchedSubscriptions.length, 'thread')}`,
          ]),
        ]),
      ]),
    ];
  },
};

const NotificationsPage: m.Component<{}, {
  communities: CommunityInfo[];
  subscriptions: NotificationSubscription[];
  selectedCommunity: CommunityInfo | ChainInfo;
  selectedCommunityId: string;
  selectableCommunityIds: string[];
  allCommunityIds: string[];
}> = {
  oninit: async (vnode) => {
    if (!app.isLoggedIn) {
      notifyError('Must be logged in to configure notifications');
      m.route.set('/');
    }
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
      notifyError('Could not load notification settings');
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

    // initialize vnode.state.allCommunityIds
    vnode.state.allCommunityIds = [];
    _.uniq(app.config.chains.getAll()).forEach((c) => vnode.state.allCommunityIds.push(c.id));
    vnode.state.communities.forEach((c) => vnode.state.allCommunityIds.push(c.id));

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
    const { selectedCommunity, selectedCommunityId, selectableCommunityIds, allCommunityIds } = vnode.state;
    const chains = _.uniq(app.config.chains.getAll());
    if (!app.loginStatusLoaded()) return m(PageLoading);
    if (!app.isLoggedIn()) return m(PageError, {
      message: 'This page requires you to be logged in.'
    });
    if (subscriptions.length < 1) return m(PageLoading);

    return m(Sublayout, {
      class: 'NotificationsPage',
      title: 'Notification Settings',
    }, [
      m('.forum-container', [
        m(EmailIntervalConfiguration),
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
            selectedCommunityId === ALL_COMMUNITIES && [
              m(AllCommunitiesNotifications, { communities: allCommunityIds, subscriptions }),
              m('tr.on-chain-events-header', m('th', { colspan: 2 }, 'Edgeware chain events')),
              m(EdgewareChainEventNotifications),
              m('tr.on-chain-events-header', m('th', { colspan: 2 }, 'Kulupu chain events')),
              m(KulupuChainEventNotifications),
              m('tr.on-chain-events-header', m('th', { colspan: 2 }, 'Kusama chain events')),
              m(KusamaChainEventNotifications),
              m('tr.on-chain-events-header', m('th', { colspan: 2 }, 'Polkadot chain events')),
              m(PolkadotChainEventNotifications),
            ],
            selectedCommunity
              && m(IndividualCommunityNotifications, { subscriptions, community: selectedCommunity }),
            // on-chain event notifications
            selectedCommunity instanceof ChainInfo && [
              m('tr.on-chain-events-header', m('th', { colspan: 2 }, CHAIN_NOTIFICATION_TABLE_PRE_COPY)),
              selectedCommunity.network === ChainNetwork.Edgeware && m(EdgewareChainEventNotifications),
              selectedCommunity.network === ChainNetwork.Kulupu && m(KulupuChainEventNotifications),
              selectedCommunity.network === ChainNetwork.Kusama && m(KusamaChainEventNotifications),
              selectedCommunity.network === ChainNetwork.Polkadot && m(PolkadotChainEventNotifications),
            ],
          ]),
        ]),
      ]),
    ]);
  },
};

export default NotificationsPage;

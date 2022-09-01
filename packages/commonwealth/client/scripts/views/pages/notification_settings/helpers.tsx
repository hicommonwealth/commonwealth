/* eslint-disable max-classes-per-file */
/* @jsx m */

// import m from 'mithril';
// import $ from 'jquery';
// import _ from 'lodash';
// import moment from 'moment';
// import { Button, Icons, ListItem, SelectList } from 'construct-ui';

// import 'pages/notification_settings/index.scss';

// import app from 'state';
// import { ProposalType, NotificationCategories } from 'common-common/src/types';
// import { getProposalUrlPath } from 'identifiers';
// import { link, pluralize } from 'helpers';
// import { sortSubscriptions } from 'helpers/notifications';
// import { notifyError } from 'controllers/app/notifications';
import { NotificationSubscription } from 'models';

// left column - for identifying the notification type
// const NEW_MENTIONS_LABEL = 'When someone mentions me';
// const NEW_COLLABORATIONS_LABEL =
//   'When someone adds me as an editor to a thread';
// const NEW_THREADS_LABEL = 'When a thread is created';
// const NEW_ACTIVITY_LABEL = 'When there is new activity on...';
// const NEW_COMMENTS_LABEL_SUFFIX = '(new comments only)';
// const NEW_REACTIONS_LABEL_SUFFIX = '(new reactions only)';

// // right column - for selecting the notification frequency
// const NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION = 'On (immediate)';
// const NOTIFICATION_ON_OPTION = 'On';
// const NOTIFICATION_ON_SOMETIMES_OPTION = 'Multiple';
// const NOTIFICATION_OFF_OPTION = 'Off';

export const bundleSubs = (
  subs: Array<NotificationSubscription>
): { [k: string]: Array<NotificationSubscription> } => {
  const result = {};
  for (const sub of subs) {
    if (result[sub.Chain.id]) {
      result[sub.Chain.id].push(sub);
    } else {
      result[sub.Chain.id] = [sub];
    }
  }
  return result;
};

// export class BatchedSubscriptionRow
//   implements
//     m.ClassComponent<{
//       subscriptions: NotificationSubscription[];
//       label?: string;
//     }>
// {
//   private loading: boolean;
//   private option: string;

//   view(vnode) {
//     const { label, subscriptions } = vnode.attrs;
//     const someActive = subscriptions.some((s) => s.isActive);
//     const everyActive = subscriptions.every((s) => s.isActive);
//     const someEmail = subscriptions.some((s) => s.immediateEmail);
//     const everyEmail = subscriptions.every((s) => s.immediateEmail);

//     if (everyActive && everyEmail) {
//       this.option = NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION;
//     } else if (everyActive && !someEmail) {
//       this.option = NOTIFICATION_ON_OPTION;
//     } else if (someActive || someEmail) {
//       this.option = NOTIFICATION_ON_SOMETIMES_OPTION;
//     } else {
//       this.option = NOTIFICATION_OFF_OPTION;
//     }

//     if (!subscriptions) return;

//     const singleLabel = (subscription: NotificationSubscription) => {
//       const chain = subscription.Chain || null;
//       switch (subscription.category) {
//         case NotificationCategories.NewComment: {
//           const threadOrComment = subscription.Thread
//             ? decodeURIComponent(subscription.Thread.title)
//             : subscription.Comment
//             ? decodeURIComponent(subscription.Comment.id)
//             : subscription.objectId;

//           return subscription.Thread
//             ? [
//                 link(
//                   'a',
//                   `/${chain}${getProposalUrlPath(
//                     ProposalType.Thread,
//                     subscription.Thread.id,
//                     true
//                   )}`,
//                   threadOrComment.toString(),
//                   { target: '_blank' }
//                 ),
//                 m(
//                   'span.item-metadata',
//                   moment(subscription.Thread.created_at).fromNow()
//                 ),
//                 m('span.item-metadata', NEW_COMMENTS_LABEL_SUFFIX),
//               ]
//             : [
//                 threadOrComment.toString(),
//                 m('span.item-metadata', NEW_COMMENTS_LABEL_SUFFIX),
//               ];
//         }
//         case NotificationCategories.NewReaction: {
//           const threadOrComment = subscription.Thread
//             ? decodeURIComponent(subscription.Thread.title)
//             : subscription.Comment
//             ? decodeURIComponent(subscription.Comment.id)
//             : subscription.objectId;
//           return subscription.Thread
//             ? [
//                 link(
//                   'a',
//                   `/${chain}${getProposalUrlPath(
//                     ProposalType.Thread,
//                     subscription.Thread.id,
//                     true
//                   )}`,
//                   threadOrComment.toString(),
//                   { target: '_blank' }
//                 ),
//                 m(
//                   'span.item-metadata',
//                   moment(subscription.Thread.created_at).fromNow()
//                 ),
//                 m('span.item-metadata', NEW_REACTIONS_LABEL_SUFFIX),
//               ]
//             : [
//                 threadOrComment.toString(),
//                 m('span.item-metadata', NEW_REACTIONS_LABEL_SUFFIX),
//               ];
//         }
//         default:
//           break;
//       }
//     };

//     const batchLabel = (
//       batchLabelSubscriptions: NotificationSubscription[]
//     ) => {
//       const subscription = batchLabelSubscriptions[0];
//       const chain = subscription.Chain || null;

//       const threadOrComment = subscription.Thread
//         ? decodeURIComponent(subscription.Thread.title)
//         : subscription.Comment
//         ? decodeURIComponent(subscription.Comment.id)
//         : subscription.objectId;

//       return subscription.Thread
//         ? [
//             link(
//               'a',
//               `/${chain}${getProposalUrlPath(
//                 ProposalType.Thread,
//                 subscription.Thread.id,
//                 true
//               )}`,
//               threadOrComment.toString(),
//               { target: '_blank' }
//             ),
//             m(
//               'span.item-metadata',
//               moment(subscription.Thread.created_at).fromNow()
//             ),
//           ]
//         : [threadOrComment.toString()];
//     };

//     // hide subscriptions on threads/comments that have been deleted
//     if (
//       _.every(
//         subscriptions,
//         (s) =>
//           !s.Comment &&
//           !s.Thread &&
//           (s.category === NotificationCategories.NewComment ||
//             s.category === NotificationCategories.NewReaction)
//       )
//     ) {
//       return;
//     }

//     return m('tr.BatchedSubscriptionRow', [
//       m('td.subscription-label', [
//         label ||
//           (subscriptions?.length > 1
//             ? batchLabel(subscriptions)
//             : singleLabel(subscriptions[0])),
//       ]),
//       m('td.subscription-setting', [
//         m(SelectList, {
//           class: 'BatchedNotificationSelectList',
//           filterable: false,
//           checkmark: false,
//           emptyContent: null,
//           inputAttrs: {
//             class: 'BatchedNotificationSelectRow',
//           },
//           popoverAttrs: {
//             transitionDuration: 0,
//           },
//           itemRender: (option: string) => {
//             return m(ListItem, {
//               label: option,
//               selected: this.option === option,
//             });
//           },
//           items: [
//             NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION,
//             NOTIFICATION_ON_OPTION,
//             NOTIFICATION_OFF_OPTION,
//           ],
//           trigger: m(Button, {
//             align: 'left',
//             compact: true,
//             rounded: true,
//             disabled: !app.user.emailVerified || this.loading,
//             iconRight: Icons.CHEVRON_DOWN,
//             label: this.option,
//             class:
//               this.option === NOTIFICATION_ON_SOMETIMES_OPTION
//                 ? 'sometimes'
//                 : '',
//           }),
//           onSelect: async (option: string) => {
//             this.option = option;
//             this.loading = true;
//             try {
//               if (subscriptions.length < 1) return;
//               if (option === NOTIFICATION_OFF_OPTION) {
//                 if (someEmail)
//                   await app.user.notifications.disableImmediateEmails(
//                     subscriptions
//                   );
//                 if (someActive)
//                   await app.user.notifications.disableSubscriptions(
//                     subscriptions
//                   );
//               } else if (option === NOTIFICATION_ON_OPTION) {
//                 await app.user.notifications.enableSubscriptions(subscriptions);
//                 if (someEmail)
//                   await app.user.notifications.disableImmediateEmails(
//                     subscriptions
//                   );
//               } else if (option === NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION) {
//                 if (!everyActive)
//                   await app.user.notifications.enableSubscriptions(
//                     subscriptions
//                   );
//                 await app.user.notifications.enableImmediateEmails(
//                   subscriptions
//                 );
//               }
//             } catch (err) {
//               notifyError(err.toString());
//             }
//             this.loading = false;
//             m.redraw();
//           },
//         }),
//       ]),
//     ]);
//   }
// }

// export class NewThreadRow
//   implements
//     m.ClassComponent<{
//       subscriptions: NotificationSubscription[];
//       community: ChainInfo;
//     }>
// {
//   view(vnode) {
//     const { subscriptions, community } = vnode.attrs;

//     const subscription = subscriptions.find(
//       (s) =>
//         s.category === NotificationCategories.NewThread &&
//         s.objectId === community.id
//     );

//     return (
//       subscription &&
//       m(BatchedSubscriptionRow, {
//         subscriptions: [subscription],
//         label: NEW_THREADS_LABEL,
//       })
//     );
//   }
// }

// export class ChainEventSubscriptionRow
//   implements
//     m.ClassComponent<{
//       title: string;
//       notificationTypeArray: string[];
//       recommended?: boolean;
//     }>
// {
//   private loading: boolean;
//   private option: string;

//   view(vnode) {
//     const { title, notificationTypeArray } = vnode.attrs;

//     const subscriptions = app.user.notifications.subscriptions.filter((s) => {
//       return (
//         s.category === NotificationCategories.ChainEvent &&
//         notificationTypeArray.includes(s.objectId)
//       );
//     });

//     const everySubscriptionActive = subscriptions.every((s) => s.isActive);
//     const everySubscriptionEmail = subscriptions.every((s) => s.immediateEmail);
//     const someSubscriptionsEmail = subscriptions.some((s) => s.immediateEmail);
//     const allSubscriptionsCreated =
//       subscriptions.length === notificationTypeArray.length;

//     if (
//       allSubscriptionsCreated &&
//       everySubscriptionActive &&
//       everySubscriptionEmail
//     ) {
//       this.option = NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION;
//     } else if (allSubscriptionsCreated && everySubscriptionActive) {
//       this.option = NOTIFICATION_ON_OPTION;
//     } else {
//       this.option = NOTIFICATION_OFF_OPTION;
//     }

//     return m('tr.ChainEventSubscriptionRow', [
//       m('td.subscription-label', [
//         title,
//         m('.ChainEventDetails', [
//           notificationTypeArray
//             .filter((s) => s.indexOf('reward') === -1) // filter out treasury-reward and reward events (they are silent)
//             .map((s) => `${s.replace(/^[a-z]+-/, '')}, `)
//             .join('')
//             .replace(/, $/, ''),
//         ]),
//       ]),
//       m('td.subscription-setting', [
//         m(SelectList, {
//           class: 'EventSubscriptionTypeSelectList',
//           filterable: false,
//           checkmark: false,
//           emptyContent: null,
//           popoverAttrs: {
//             transitionDuration: 0,
//           },
//           inputAttrs: {
//             class: 'EventSubscriptionTypeSelectRow',
//           },
//           itemRender: (option: string) => {
//             return m(ListItem, {
//               label: option,
//               selected: this.option === option,
//             });
//           },
//           items: [
//             NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION,
//             NOTIFICATION_ON_OPTION,
//             NOTIFICATION_OFF_OPTION,
//           ],
//           trigger: m(Button, {
//             align: 'left',
//             compact: true,
//             rounded: true,
//             disabled: !app.user.emailVerified || this.loading,
//             iconRight: Icons.CHEVRON_DOWN,
//             label: this.option,
//           }),
//           onSelect: async (option: string) => {
//             this.option = option;
//             this.loading = true;
//             if (option === NOTIFICATION_OFF_OPTION) {
//               await app.user.notifications.disableImmediateEmails(
//                 subscriptions
//               );
//               await app.user.notifications.disableSubscriptions(subscriptions);
//             } else if (option === NOTIFICATION_ON_OPTION) {
//               if (!allSubscriptionsCreated) {
//                 await Promise.all(
//                   notificationTypeArray.map((obj) => {
//                     return app.user.notifications.subscribe(
//                       NotificationCategories.ChainEvent,
//                       obj
//                     );
//                   })
//                 );
//               } else {
//                 if (!everySubscriptionActive)
//                   await app.user.notifications.enableSubscriptions(
//                     subscriptions
//                   );
//               }
//               if (someSubscriptionsEmail)
//                 await app.user.notifications.disableImmediateEmails(
//                   subscriptions
//                 );
//             } else if (option === NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION) {
//               if (!allSubscriptionsCreated) {
//                 await Promise.all(
//                   notificationTypeArray.map((obj) => {
//                     return app.user.notifications.subscribe(
//                       NotificationCategories.ChainEvent,
//                       obj
//                     );
//                   })
//                 ).then(async () => {
//                   const newSubscriptions =
//                     app.user.notifications.subscriptions.filter((s) => {
//                       return (
//                         s.category === NotificationCategories.ChainEvent &&
//                         notificationTypeArray.includes(s.objectId)
//                       );
//                     });
//                   await app.user.notifications.enableImmediateEmails(
//                     newSubscriptions
//                   );
//                   m.redraw();
//                 });
//               } else {
//                 if (!everySubscriptionActive)
//                   await app.user.notifications.enableSubscriptions(
//                     subscriptions
//                   );
//                 if (!everySubscriptionEmail)
//                   await app.user.notifications.enableImmediateEmails(
//                     subscriptions
//                   );
//               }
//             }
//             this.loading = false;
//             m.redraw();
//           },
//         }),
//       ]),
//     ]);
//   }
// }

// export class IndividualCommunityNotifications
//   implements
//     m.ClassComponent<{
//       community: ChainInfo;
//       subscriptions: NotificationSubscription[];
//     }>
// {
//   private expanded: boolean;

//   view(vnode) {
//     const { community, subscriptions } = vnode.attrs;
//     const filteredSubscriptions = subscriptions.filter(
//       (s) =>
//         s.Chain === community.id &&
//         s.category !== NotificationCategories.NewThread &&
//         s.category !== NotificationCategories.NewMention &&
//         s.category !== NotificationCategories.NewCollaboration &&
//         s.category !== NotificationCategories.ChainEvent &&
//         !s.Comment
//     );
//     const newThreads = subscriptions.find(
//       (s) =>
//         s.category === NotificationCategories.NewThread &&
//         s.objectId === community.id
//     );
//     const batchedSubscriptions = sortSubscriptions(
//       filteredSubscriptions,
//       'objectId'
//     );
//     return [
//       newThreads && m(NewThreadRow, { community, subscriptions }),
//       batchedSubscriptions.length > 0 &&
//         m('tr.NewActivityRow', [m('td', NEW_ACTIVITY_LABEL), m('td')]),
//       // TODO: Filter community past-thread/comment subscriptions here into SubscriptionRows.
//       this.expanded &&
//         batchedSubscriptions.map(
//           (subscriptions2: NotificationSubscription[]) => {
//             return m(BatchedSubscriptionRow, {
//               subscriptions: subscriptions2,
//               key: subscriptions2[0].id,
//             });
//           }
//         ),
//       batchedSubscriptions.length > 0 &&
//         m('tr', [
//           m('td', { colspan: 2 }, [
//             m(
//               'a.expand-notifications-link',
//               {
//                 href: '#',
//                 onclick: (e) => {
//                   e.preventDefault();
//                   this.expanded = !this.expanded;
//                 },
//               },
//               [
//                 `${this.expanded ? 'Hide' : 'Show'} ${pluralize(
//                   batchedSubscriptions.length,
//                   'thread'
//                 )}`,
//               ]
//             ),
//           ]),
//         ]),
//     ];
//   }
// }

// export class AllCommunitiesNotifications
//   implements
//     m.ClassComponent<{
//       subscriptions: NotificationSubscription[];
//       communities: string[];
//     }>
// {
//   private expanded: boolean;

//   view(vnode) {
//     const { subscriptions, communities } = vnode.attrs;
//     const mentionsSubscription = subscriptions.find(
//       (s) => s.category === NotificationCategories.NewMention
//     );
//     const collaborationsSubscription = subscriptions.find(
//       (s) => s.category === NotificationCategories.NewCollaboration
//     );
//     const chainIds = app.config.chains.getAll().map((c) => c.id);
//     const communityIds = communities;
//     const batchedSubscriptions = sortSubscriptions(
//       subscriptions.filter((s) => {
//         return (
//           !chainIds.includes(s.objectId) &&
//           s.category !== NotificationCategories.NewMention &&
//           s.category !== NotificationCategories.NewThread &&
//           s.category !== NotificationCategories.ChainEvent &&
//           !s.Comment
//         );
//       }),
//       'objectId'
//     );
//     return [
//       m(BatchedSubscriptionRow, {
//         subscriptions: subscriptions.filter((s) =>
//           communityIds.includes(s.objectId)
//         ),
//         label: NEW_THREADS_LABEL,
//       }),
//       mentionsSubscription &&
//         m(BatchedSubscriptionRow, {
//           subscriptions: [mentionsSubscription],
//           label: NEW_MENTIONS_LABEL,
//         }),
//       collaborationsSubscription &&
//         m(BatchedSubscriptionRow, {
//           subscriptions: [collaborationsSubscription],
//           label: NEW_COLLABORATIONS_LABEL,
//         }),
//       batchedSubscriptions.length > 0 &&
//         m('tr.NewActivityRow', [m('td', NEW_ACTIVITY_LABEL), m('td')]),
//       this.expanded &&
//         batchedSubscriptions.map(
//           (subscriptions2: NotificationSubscription[]) => {
//             return m(BatchedSubscriptionRow, { subscriptions: subscriptions2 });
//           }
//         ),
//       batchedSubscriptions.length > 0 &&
//         m('tr', [
//           m('td', { colspan: 2 }, [
//             m(
//               'a.expand-notifications-link',
//               {
//                 href: '#',
//                 onclick: (e) => {
//                   e.preventDefault();
//                   this.expanded = !this.expanded;
//                 },
//               },
//               [
//                 `${this.expanded ? 'Hide' : 'Show'} ${pluralize(
//                   batchedSubscriptions.length,
//                   'thread'
//                 )}`,
//               ]
//             ),
//           ]),
//         ]),
//     ];
//   }
// }

// export class EdgewareChainEventNotifications implements m.ClassComponent {
//     view() {
//       return [
//         m(ChainEventSubscriptionRow, {
//           title: 'Council events',
//           notificationTypeArray: EdgewareChainNotificationTypes.Council,
//           recommended: true,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Democracy events',
//           notificationTypeArray: EdgewareChainNotificationTypes.Democracy,
//           recommended: true,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Treasury events',
//           notificationTypeArray: EdgewareChainNotificationTypes.Treasury,
//           recommended: true,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Preimage events',
//           notificationTypeArray: EdgewareChainNotificationTypes.Preimage,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Voting delegation events',
//           notificationTypeArray: EdgewareChainNotificationTypes.VotingDelegation,
//         }),
//       ];
//     }
//   }

//   export class KusamaChainEventNotifications implements m.ClassComponent {
//     view() {
//       return [
//         m(ChainEventSubscriptionRow, {
//           title: 'Council events',
//           notificationTypeArray: KusamaChainNotificationTypes.Council,
//           recommended: true,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Democracy events',
//           notificationTypeArray: KusamaChainNotificationTypes.Democracy,
//           recommended: true,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Treasury events',
//           notificationTypeArray: KusamaChainNotificationTypes.Treasury,
//           recommended: true,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Preimage events',
//           notificationTypeArray: KusamaChainNotificationTypes.Preimage,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Voting delegation events',
//           notificationTypeArray: KusamaChainNotificationTypes.VotingDelegation,
//         }),
//       ];
//     }
//   }

//   export class PolkadotChainEventNotifications implements m.ClassComponent {
//     view() {
//       return [
//         m(ChainEventSubscriptionRow, {
//           title: 'Council events',
//           notificationTypeArray: PolkadotChainNotificationTypes.Council,
//           recommended: true,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Democracy events',
//           notificationTypeArray: PolkadotChainNotificationTypes.Democracy,
//           recommended: true,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Treasury events',
//           notificationTypeArray: PolkadotChainNotificationTypes.Treasury,
//           recommended: true,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Preimage events',
//           notificationTypeArray: PolkadotChainNotificationTypes.Preimage,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Voting delegation events',
//           notificationTypeArray: PolkadotChainNotificationTypes.VotingDelegation,
//         }),
//       ];
//     }
//   }

//   export class KulupuChainEventNotifications implements m.ClassComponent {
//     view() {
//       return [
//         m(ChainEventSubscriptionRow, {
//           title: 'Council events',
//           notificationTypeArray: KulupuChainNotificationTypes.Council,
//           recommended: true,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Democracy events',
//           notificationTypeArray: KulupuChainNotificationTypes.Democracy,
//           recommended: true,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Treasury events',
//           notificationTypeArray: KulupuChainNotificationTypes.Treasury,
//           recommended: true,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Preimage events',
//           notificationTypeArray: KulupuChainNotificationTypes.Preimage,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Voting delegation events',
//           notificationTypeArray: KulupuChainNotificationTypes.VotingDelegation,
//         }),
//       ];
//     }
//   }

//   export class DydxChainEventNotifications implements m.ClassComponent {
//     view() {
//       return [
//         m(ChainEventSubscriptionRow, {
//           title: 'Governance events',
//           notificationTypeArray: DydxChainNotificationTypes.Governance,
//           recommended: true,
//         }),
//         m(ChainEventSubscriptionRow, {
//           title: 'Token events',
//           notificationTypeArray: DydxChainNotificationTypes.Token,
//           recommended: true,
//         }),
//       ];
//     }
//   }

// export class EmailIntervalConfiguration implements m.ClassComponent {
//     private interval: string;
//     private saving: boolean;

//     view() {
//       if (!app.user) return;
//       if (this.interval === undefined) this.interval = app.user.emailInterval;

//       return (
//         <>
//           <RadioGroup
//             options={['daily', 'never']}
//             name="interval"
//             onchange={(e) => {
//               this.saving = true;
//               const value = (e.target as HTMLInputElement).value;

//               $.post(`${app.serverUrl()}/writeUserSetting`, {
//                 jwt: app.user.jwt,
//                 key: 'updateEmailInterval',
//                 value,
//               })
//                 .then(() => {
//                   this.saving = false;
//                   this.interval = value;
//                   app.user.setEmailInterval(value);
//                   m.redraw();
//                 })
//                 .catch(() => {
//                   this.saving = false;
//                   m.redraw();
//                 });
//             }}
//             value={this.interval}
//           />
//           {!app.user.email
//             ? m('p', [
//                 link('a', `/${app.activeChainId()}/settings`, 'Set an email'),
//                 ' to start receiving notification digests.',
//               ])
//             : !app.user.emailVerified
//             ? m('p', [
//                 'Your email has not been verified. ',
//                 link(
//                   'a',
//                   `/${app.activeChainId()}/settings`,
//                   'Finish verification'
//                 ),
//                 ' to continue receiving notification emails.',
//               ])
//             : ''}
//           {this.saving === false && m('p', 'Setting saved!')}
//           {/* this.saving is undefined upon init */}
//         </>
//       );
//     }
//   }

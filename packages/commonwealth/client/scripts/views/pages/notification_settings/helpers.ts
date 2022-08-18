// m(EmailIntervalConfiguration),
// communities &&
//   subscriptions &&
//  m('.CommunityNotifications', [
//    m('.header', [
//       m(SelectList, {
//        class: 'CommunityNotificationSelectList',
//        filterable: false,
//        checkmark: false,
//        emptyContent: null,
//        popoverAttrs: {
//          transitionDuration: 0,
//        },
//        itemRender: (community: string) => {
//          return m(ListItem, {
//            label: community,
//            selected: this.selectedCommunityId === community,
//          });
//        },
//        items: selectableCommunityIds,
//        trigger: m(Button, {
//          align: 'left',
//          compact: true,
//          rounded: true,
//          disabled: !app.user.emailVerified,
//          iconRight: Icons.CHEVRON_DOWN,
//          label: this.selectedCommunity
//            ? this.selectedCommunityId
//            : ALL_COMMUNITIES,
//        }),
//        onSelect: (community: string) => {
//          this.selectedCommunity =
//            communities.find((c) => c.name === community) ||
//            chains.find((c) => c.name === community);
//          this.selectedCommunityId =
//            this.selectedCommunity?.name || ALL_COMMUNITIES;
//          m.redraw();
//        },
//      }),
//    ]),
//    m(Table, { class: 'NotificationsTable' }, [
//      // off-chain discussion notifications
//      m('tr', [m('th', NOTIFICATION_TABLE_PRE_COPY), m('th', '')]),
//      selectedCommunityId === ALL_COMMUNITIES && [
//        m(AllCommunitiesNotifications, {
//          communities: allCommunityIds,
//          subscriptions,
//        }),
//        m(
//          'tr.on-chain-events-header',
//          m('th', { colspan: 2 }, 'Edgeware chain events')
//        ),
//        m(EdgewareChainEventNotifications),
//        m(
//          'tr.on-chain-events-header',
//          m('th', { colspan: 2 }, 'Kulupu chain events')
//        ),
//        m(KulupuChainEventNotifications),
//        m(
//          'tr.on-chain-events-header',
//          m('th', { colspan: 2 }, 'Kusama chain events')
//        ),
//        m(KusamaChainEventNotifications),
//        m(
//          'tr.on-chain-events-header',
//          m('th', { colspan: 2 }, 'Polkadot chain events')
//        ),
//        m(PolkadotChainEventNotifications),
//        m(
//          'tr.on-chain-events-header',
//          m('th', { colspan: 2 }, 'dYdX chain events')
//        ),
//        m(DydxChainEventNotifications),
//      ],
//      selectedCommunity &&
//        m(IndividualCommunityNotifications, {
//          subscriptions,
//          community: selectedCommunity,
//        }),
//      // on-chain event notifications
//      selectedCommunity instanceof ChainInfo && [
//        m(
//          'tr.on-chain-events-header',
//          m('th', { colspan: 2 }, CHAIN_NOTIFICATION_TABLE_PRE_COPY)
//        ),
//        selectedCommunity.network === ChainNetwork.Edgeware &&
//          m(EdgewareChainEventNotifications),
//        selectedCommunity.network === ChainNetwork.Kulupu &&
//          m(KulupuChainEventNotifications),
//        selectedCommunity.network === ChainNetwork.Kusama &&
//          m(KusamaChainEventNotifications),
//        selectedCommunity.network === ChainNetwork.Polkadot &&
//          m(PolkadotChainEventNotifications),
//        selectedCommunity.network === ChainNetwork.Aave &&
//          m(DydxChainEventNotifications),
//      ],
//    ]),
//  ]),

// const EmailIntervalConfiguration: m.Component<
//   {},
//   { interval: string; saving: boolean }
// > = {
//   view: (vnode) => {
//     if (!app.user) return;
//     if (vnode.state.interval === undefined)
//       vnode.state.interval = app.user.emailInterval;

//     return m(Grid, { class: 'EmailIntervalConfiguration' }, [
//       m(
//         Col,
//         { class: 'email-interval-configuration-left', span: { xs: 12, md: 6 } },
//         [
//           m('h4', 'Get notifications immediately'),
//           m(
//             'p',
//             {
//               style: 'margin-top: 8px',
//             },
//             [
//               'Select ',
//               m('strong', 'On (immediate)'),
//               ' to receive an email immediately when the selected event occurs',
//             ]
//           ),
//         ]
//       ),
//       m(
//         Col,
//         {
//           class: 'email-interval-configuration-right',
//           span: { xs: 12, md: 6 },
//         },
//         [
//           m('h4', 'Get notifications in a daily digest'),
//           m(RadioGroup, {
//             style: 'margin-top: 10px',
//             options: ['daily', 'never'],
//             name: 'interval',
//             onchange: (e) => {
//               vnode.state.saving = true;
//               const value = (e.target as HTMLInputElement).value;

//               $.post(`${app.serverUrl()}/writeUserSetting`, {
//                 jwt: app.user.jwt,
//                 key: 'updateEmailInterval',
//                 value,
//               })
//                 .then((result) => {
//                   vnode.state.saving = false;
//                   vnode.state.interval = value;
//                   app.user.setEmailInterval(value);
//                   m.redraw();
//                 })
//                 .catch((err) => {
//                   vnode.state.saving = false;
//                   m.redraw();
//                 });
//             },
//             value: vnode.state.interval,
//           }),
//           !app.user.email
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
//             : '',
//           vnode.state.saving === false && m('p', 'Setting saved!'), // vnode.state.saving is undefined upon init
//         ]
//       ),
//     ]);
//   },
// };

// const BatchedSubscriptionRow: m.Component<
//   {
//     subscriptions: NotificationSubscription[];
//     label?: string;
//   },
//   {
//     option: string;
//     loading: boolean;
//   }
// > = {
//   view: (vnode) => {
//     const { label, subscriptions } = vnode.attrs;
//     const someActive = subscriptions.some((s) => s.isActive);
//     const everyActive = subscriptions.every((s) => s.isActive);
//     const someEmail = subscriptions.some((s) => s.immediateEmail);
//     const everyEmail = subscriptions.every((s) => s.immediateEmail);
//     if (everyActive && everyEmail) {
//       vnode.state.option = NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION;
//     } else if (everyActive && !someEmail) {
//       vnode.state.option = NOTIFICATION_ON_OPTION;
//     } else if (someActive || someEmail) {
//       vnode.state.option = NOTIFICATION_ON_SOMETIMES_OPTION;
//     } else {
//       vnode.state.option = NOTIFICATION_OFF_OPTION;
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
//               selected: vnode.state.option === option,
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
//             disabled: !app.user.emailVerified || vnode.state.loading,
//             iconRight: Icons.CHEVRON_DOWN,
//             label: vnode.state.option,
//             class:
//               vnode.state.option === NOTIFICATION_ON_SOMETIMES_OPTION
//                 ? 'sometimes'
//                 : '',
//           }),
//           onSelect: async (option: string) => {
//             vnode.state.option = option;
//             vnode.state.loading = true;
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
//             vnode.state.loading = false;
//             m.redraw();
//           },
//         }),
//       ]),
//     ]);
//   },
// };

// const NewThreadRow: m.Component<{
//   subscriptions: NotificationSubscription[];
//   community: ChainInfo;
// }> = {
//   view: (vnode) => {
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
//   },
// };

// const ChainEventSubscriptionRow: m.Component<
//   {
//     title: string;
//     notificationTypeArray: string[];
//     recommended?: boolean;
//   },
//   { option: string; loading: boolean }
// > = {
//   view: (vnode) => {
//     const { title, notificationTypeArray, recommended } = vnode.attrs;
//     const subscriptions = app.user.notifications.subscriptions.filter((s) => {
//       return (
//         s.category === NotificationCategories.ChainEvent &&
//         notificationTypeArray.includes(s.objectId)
//       );
//     });
//     const everySubscriptionActive = subscriptions.every((s) => s.isActive);
//     const someSubscriptionsActive = subscriptions.some((s) => s.isActive);
//     const everySubscriptionEmail = subscriptions.every((s) => s.immediateEmail);
//     const someSubscriptionsEmail = subscriptions.some((s) => s.immediateEmail);
//     const allSubscriptionsCreated =
//       subscriptions.length === notificationTypeArray.length;

//     if (
//       allSubscriptionsCreated &&
//       everySubscriptionActive &&
//       everySubscriptionEmail
//     ) {
//       vnode.state.option = NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION;
//     } else if (allSubscriptionsCreated && everySubscriptionActive) {
//       vnode.state.option = NOTIFICATION_ON_OPTION;
//     } else {
//       vnode.state.option = NOTIFICATION_OFF_OPTION;
//     }

//     return m('tr.ChainEventSubscriptionRow', [
//       m('td.subscription-label', [
//         title,
//         recommended && m(Tag, { size: 'xs', label: 'Recommended' }),
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
//               selected: vnode.state.option === option,
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
//             disabled: !app.user.emailVerified || vnode.state.loading,
//             iconRight: Icons.CHEVRON_DOWN,
//             label: vnode.state.option,
//           }),
//           onSelect: async (option: string) => {
//             vnode.state.option = option;
//             vnode.state.loading = true;
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
//             vnode.state.loading = false;
//             m.redraw();
//           },
//         }),
//       ]),
//     ]);
//   },
// };

// const EdgewareChainEventNotifications: m.Component = {
//   view: (vnode) => {
//     return [
//       m(ChainEventSubscriptionRow, {
//         title: 'Council events',
//         notificationTypeArray: EdgewareChainNotificationTypes.Council,
//         recommended: true,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Democracy events',
//         notificationTypeArray: EdgewareChainNotificationTypes.Democracy,
//         recommended: true,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Treasury events',
//         notificationTypeArray: EdgewareChainNotificationTypes.Treasury,
//         recommended: true,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Preimage events',
//         notificationTypeArray: EdgewareChainNotificationTypes.Preimage,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Voting delegation events',
//         notificationTypeArray: EdgewareChainNotificationTypes.VotingDelegation,
//       }),
//     ];
//   },
// };

// const KusamaChainEventNotifications: m.Component = {
//   view: (vnode) => {
//     return [
//       m(ChainEventSubscriptionRow, {
//         title: 'Council events',
//         notificationTypeArray: KusamaChainNotificationTypes.Council,
//         recommended: true,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Democracy events',
//         notificationTypeArray: KusamaChainNotificationTypes.Democracy,
//         recommended: true,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Treasury events',
//         notificationTypeArray: KusamaChainNotificationTypes.Treasury,
//         recommended: true,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Preimage events',
//         notificationTypeArray: KusamaChainNotificationTypes.Preimage,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Voting delegation events',
//         notificationTypeArray: KusamaChainNotificationTypes.VotingDelegation,
//       }),
//     ];
//   },
// };

// const PolkadotChainEventNotifications: m.Component = {
//   view: (vnode) => {
//     return [
//       m(ChainEventSubscriptionRow, {
//         title: 'Council events',
//         notificationTypeArray: PolkadotChainNotificationTypes.Council,
//         recommended: true,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Democracy events',
//         notificationTypeArray: PolkadotChainNotificationTypes.Democracy,
//         recommended: true,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Treasury events',
//         notificationTypeArray: PolkadotChainNotificationTypes.Treasury,
//         recommended: true,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Preimage events',
//         notificationTypeArray: PolkadotChainNotificationTypes.Preimage,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Voting delegation events',
//         notificationTypeArray: PolkadotChainNotificationTypes.VotingDelegation,
//       }),
//     ];
//   },
// };

// const KulupuChainEventNotifications: m.Component = {
//   view: (vnode) => {
//     return [
//       m(ChainEventSubscriptionRow, {
//         title: 'Council events',
//         notificationTypeArray: KulupuChainNotificationTypes.Council,
//         recommended: true,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Democracy events',
//         notificationTypeArray: KulupuChainNotificationTypes.Democracy,
//         recommended: true,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Treasury events',
//         notificationTypeArray: KulupuChainNotificationTypes.Treasury,
//         recommended: true,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Preimage events',
//         notificationTypeArray: KulupuChainNotificationTypes.Preimage,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Voting delegation events',
//         notificationTypeArray: KulupuChainNotificationTypes.VotingDelegation,
//       }),
//     ];
//   },
// };

// const DydxChainEventNotifications: m.Component = {
//   view: (vnode) => {
//     return [
//       m(ChainEventSubscriptionRow, {
//         title: 'Governance events',
//         notificationTypeArray: DydxChainNotificationTypes.Governance,
//         recommended: true,
//       }),
//       m(ChainEventSubscriptionRow, {
//         title: 'Token events',
//         notificationTypeArray: DydxChainNotificationTypes.Token,
//         recommended: true,
//       }),
//     ];
//   },
// };

// const IndividualCommunityNotifications: m.Component<
//   {
//     community: ChainInfo;
//     subscriptions: NotificationSubscription[];
//   },
//   {
//     expanded: boolean;
//   }
// > = {
//   view: (vnode) => {
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
//       vnode.state.expanded &&
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
//                   vnode.state.expanded = !vnode.state.expanded;
//                 },
//               },
//               [
//                 `${vnode.state.expanded ? 'Hide' : 'Show'} ${pluralize(
//                   batchedSubscriptions.length,
//                   'thread'
//                 )}`,
//               ]
//             ),
//           ]),
//         ]),
//     ];
//   },
// };

// const AllCommunitiesNotifications: m.Component<
//   {
//     subscriptions: NotificationSubscription[];
//     communities: string[];
//   },
//   {
//     expanded: boolean;
//   }
// > = {
//   view: (vnode) => {
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
//       vnode.state.expanded &&
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
//                   vnode.state.expanded = !vnode.state.expanded;
//                 },
//               },
//               [
//                 `${vnode.state.expanded ? 'Hide' : 'Show'} ${pluralize(
//                   batchedSubscriptions.length,
//                   'thread'
//                 )}`,
//               ]
//             ),
//           ]),
//         ]),
//     ];
//   },
// };

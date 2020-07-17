// import 'pages/subscriptions.scss';
import 'components/sidebar/index.scss';


import m from 'mithril';
import $ from 'jquery';
import _, { capitalize } from 'lodash';

import { NotificationSubscription, ChainInfo, CommunityInfo } from 'models';
import app from 'state';
import { NotificationCategories } from 'types';
import { SubstrateEventKinds } from 'events/substrate/types';
import SubstrateTitlerFunc from 'events/substrate/filters/titler';
import { IChainEventKind, EventSupportingChains, TitlerFilter } from 'events/interfaces';
import { Button, Icons, Select, List, ListItem, Checkbox, Table, SelectList, Popover } from 'construct-ui';
import Sublayout from 'views/sublayout';

const ImmediateEmailCheckbox: m.Component<{subscription: NotificationSubscription}> = {
  view: (vnode) => {
    const { subscription } = vnode.attrs;
    return m('td', [
      m(Checkbox, {
        disabled: !subscription.isActive,
        checked: subscription.immediateEmail && subscription.isActive,
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
  },
};

interface ISubscriptionRowAttrs {
  subscription: NotificationSubscription;
  label?: string;
}

interface ISubscriptionRowState {
  subscription: NotificationSubscription;
  paused: boolean;
}

const labelMaker = (subscription: NotificationSubscription) => {
  const chainOrCommunityId = subscription.Chain
    ? subscription.Chain.id
    : subscription.OffchainCommunity
      ? subscription.OffchainCommunity.id
      : null;
  switch (subscription.category) {
    case (NotificationCategories.NewComment): {
      console.dir(subscription);
      const threadOrComment = subscription.OffchainThread
        ? subscription.OffchainThread.title
        : subscription.OffchainComment
          ? subscription.OffchainComment.id
          : subscription.objectId;
      return subscription.OffchainThread
        ? m('a',{
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${chainOrCommunityId}/proposal/discussion/${subscription.OffchainThread.id}`);
          }
        }, `New Comment on '${String(threadOrComment).slice(0, 12)}...'`)
        : `New Comment on '${String(threadOrComment).slice(0, 12)}...'`;
    }
    case (NotificationCategories.NewReaction): {
      const threadOrComment = subscription.OffchainThread
        ? subscription.OffchainThread.id
        : subscription.OffchainComment
          ? subscription.OffchainComment.id
          : subscription.objectId;
      return `New Reaction on ${String(threadOrComment).slice(0, 12)}...`;
    }
    default:
      break;
  }
};

const SubscriptionRow: m.Component<ISubscriptionRowAttrs, ISubscriptionRowState> = {
  oninit: (vnode) => {
    vnode.state.subscription = vnode.attrs.subscription;
  },
  view: (vnode) => {
    const { label } = vnode.attrs;
    const { subscription } = vnode.state;
    return m('tr.SubscriptionRow', [
      m('td', [
        label || labelMaker(subscription)]),
      m('td', [
        m(Checkbox, {
          checked: subscription.isActive,
          class: '',
          size: 'lg',
          onclick: async (e) => {
            e.preventDefault();
            if (subscription.isActive) {
              await app.user.notifications.disableSubscriptions([subscription]);
            } else {
              await app.user.notifications.enableSubscriptions([subscription]);
            }
            m.redraw();
          }
        }),
      ]),
      subscription && app.user.email
        && m(ImmediateEmailCheckbox, { subscription, }),
    ]);
  }
};

interface IEventSubscriptionRowAttrs {
  chain: string;
  kind: IChainEventKind;
  titler: TitlerFilter;
}

const EventSubscriptionRow: m.Component<IEventSubscriptionRowAttrs, {}> = {
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
          // label: subscription && subscription.isActive ? 'Notification on' : 'Notifications off',
          // iconLeft: subscription && subscription.isActive ? Icons.BELL : Icons.BELL_OFF,
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
          // label: subscription && subscription.isActive ? 'Notification on' : 'Notifications off',
          // iconLeft: subscription && subscription.isActive ? Icons.BELL : Icons.BELL_OFF,
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

interface IEventSubscriptionState {
  chain: string;
  eventKinds: IChainEventKind[];
  allSupportedChains: string[];
  isSubscribedAll: boolean;
  isEmailAll: boolean;
}

const EventSubscriptions: m.Component<{chain: ChainInfo}, IEventSubscriptionState> = {
  oninit: (vnode) => {
    vnode.state.chain = vnode.attrs.chain.id;
    vnode.state.eventKinds = SubstrateEventKinds;
    vnode.state.allSupportedChains = EventSupportingChains.sort();
    vnode.state.isSubscribedAll = false;
    vnode.state.isEmailAll = false;
  },
  view: (vnode) => {
    let titler;
    if (vnode.state.chain === 'edgeware' || vnode.state.chain === 'edgeware-local') {
      titler = SubstrateTitlerFunc;
      vnode.state.eventKinds = SubstrateEventKinds;
    } else {
      titler = null;
      vnode.state.eventKinds = [];
    }

    const allSubscriptions = app.user.notifications.subscriptions
      .filter((sub) => sub.category === NotificationCategories.ChainEvent
        && vnode.state.eventKinds.find((kind) => sub.objectId === `${vnode.state.chain}-${kind}`));
    const allActiveSubscriptions = allSubscriptions.filter((sub) => sub.isActive);
    vnode.state.isSubscribedAll = allActiveSubscriptions.length === vnode.state.eventKinds.length;
    vnode.state.isEmailAll = allActiveSubscriptions.every((s) => s.immediateEmail);
    const isSomeEmail = allActiveSubscriptions.some((s) => s.immediateEmail);
    console.log('email', vnode.state.isEmailAll);
    const indeterminate = (allActiveSubscriptions.length > 0 && !vnode.state.isSubscribedAll);

    const supportedChains = app.loginStatusLoaded
      ? app.config.chains.getAll()
        .filter((c) => vnode.state.allSupportedChains.includes(c.id))
        .sort((a, b) => a.id.localeCompare(b.id))
      : [];
    return m('.EventSubscriptions', [
      m('h2', vnode.attrs.chain.name),
      m(Table, {}, [
        m('tr', [
          m('th', null),
          m('th', 'In app'),
          m('th', 'By email'),
        ]),
        m('tr.EventSubscriptionRow', [
          m('td', 'Subscribe To All Chain Notifications'),
          app.loginStatusLoaded && m('td', [
            m(Checkbox, {
              class: '',
              checked: vnode.state.isSubscribedAll,
              indeterminate,
              size: 'lg',
              onchange: async (e) => {
                e.preventDefault();
                if (vnode.state.isSubscribedAll) {
                  await app.user.notifications.disableSubscriptions(allActiveSubscriptions);
                } else {
                  await Promise.all(
                    vnode.state.eventKinds.map((kind) => {
                      return app.user.notifications.subscribe(
                        NotificationCategories.ChainEvent,
                        `${vnode.state.chain}-${kind.toString()}`
                      );
                    })
                  );
                }
                m.redraw();
              }
            }),
          ]),
          m('td', [
            m(Checkbox, {
              class: '',
              disabled: !vnode.state.isSubscribedAll,
              checked: !isSomeEmail && vnode.state.isEmailAll,
              indeterminate: isSomeEmail && !vnode.state.isEmailAll,
              size: 'lg',
              onchange: async (e) => {
                e.preventDefault();
                if (!allActiveSubscriptions) return;
                if (vnode.state.isEmailAll) {
                  await app.user.notifications.disableImmediateEmails(allActiveSubscriptions);
                } else {
                  await app.user.notifications.enableImmediateEmails(allActiveSubscriptions);
                }
                m.redraw();
              }
            }),
          ]),
        ]),
        supportedChains.length > 0 && vnode.state.eventKinds.length > 0 && titler
          ? vnode.state.eventKinds.map((kind) => m(
            EventSubscriptionRow,
            { chain: vnode.state.chain, kind, titler },
          ))
          : m('No events available on this chain.')
      ]),
    ]);
  }
};

interface IChainOrCommNotifPageAttrs {
  subscriptions: NotificationSubscription[];
  selectedFilter?: string;
  chains?: ChainInfo[];
  communities?: CommunityInfo[];
}

const ChainNotificationManagementPage: m.Component<IChainOrCommNotifPageAttrs> = {
  view: (vnode) => {
    const { subscriptions, chains } = vnode.attrs;
    if (chains.length < 1) return;
    return m('ChainNotificationManagementPage', [
      m('h1', 'Subscribe to Chain Events'),
      chains.filter((c) => c.network === 'edgeware').map((chain) => {
        return [
          m(EventSubscriptions, {
            chain,
          }),
        ];
      }),
    ]);
  },
};

interface ISubscriptionSideBarListItemAttrs {
  label: string;
  id: string;
  selectedFilter: string;
  onChangeHandler: Function;
}

const SubscriptionSideBarListItem: m.Component<ISubscriptionSideBarListItemAttrs> = {
  view: (vnode) => {
    const { id, selectedFilter, onChangeHandler, label } = vnode.attrs;
    return m(ListItem, {
      active: selectedFilter === id,
      label,
      onclick: () => { onChangeHandler(id); },
    });
  },
};

interface ISubscriptionsPageSideBarAttrs {
  chains: ChainInfo[];
  communities: CommunityInfo[];
  selectedFilter: string;
  onChangeHandler: Function;
}

export const SubscriptionsPageSideBar: m.Component<ISubscriptionsPageSideBarAttrs> = {
  view: (vnode) => {
    const { selectedFilter, onChangeHandler, chains, communities } = vnode.attrs;
    return m('.Sidebar', {
      class: `${app.isLoggedIn() ? 'logged-in' : 'logged-out'} `
        + `${(app.community || app.chain) ? 'active-community' : 'no-active-community'}`,
    }, [
      m(List, { interactive: true, }, [
        m('h4', 'Notification Settings'),
        m(SubscriptionSideBarListItem, {
          label: 'Community Notifications',
          id: 'community-notifications',
          selectedFilter,
          onChangeHandler,
        }),
        m(SubscriptionSideBarListItem, {
          label: 'Chain Notifications',
          id: 'chain-notifications',
          selectedFilter,
          onChangeHandler,
        })
      ])
    ]);
  },
};

const NewThreadRow: m.Component<{ subscriptions: NotificationSubscription[], community: CommunityInfo }> = {
  view: (vnode) => {
    const { subscriptions, community } = vnode.attrs;
    const subscription = subscriptions.find(
      (s) => (s.category === NotificationCategories.NewThread && s.objectId === community.id)
    );
    return subscription && m(SubscriptionRow, { subscription, label: 'New Threads' });
  },
};

interface ICommunitySpecificNotificationsAttrs {
  community: CommunityInfo;
  subscriptions: NotificationSubscription[];
}

const CommunitySpecificNotifications: m.Component<ICommunitySpecificNotificationsAttrs, {}> = {
  view: (vnode) => {
    const { community, subscriptions } = vnode.attrs;
    const filteredSubscriptions = subscriptions.filter(
      (s) => s.OffchainCommunity?.id === community.id
        && s.category !== NotificationCategories.NewThread
        && s.category !== NotificationCategories.NewMention
    );
    console.dir(filteredSubscriptions);
    return [
      m(NewThreadRow, { community, subscriptions }),
      filteredSubscriptions.map((subscription) => {
        return m(SubscriptionRow, { subscription, });
      })
      // TODO: Filter community past-thread/comment subscriptions here into SubscriptionRows.
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
      const someThreads = threadSubs.some((s) => s.isActive);
      const everyThread = threadSubs.every((s) => s.isActive);
      vnode.state.generalStatus = everyThread;
      const someEmail = threadSubs.some((s) => s.isActive && s.immediateEmail && communityIds.includes(s.objectId));
      const everyEmail = threadSubs.every((s) => s.isActive && s.immediateEmail && communityIds.includes(s.objectId));
      vnode.state.emailStatus = everyEmail;
      const { generalStatus, emailStatus, generalOpen, emailOpen, } = vnode.state;

      return m('tr.GeneralNewThreadsAndComments', [
        m('td', 'All New threads and comments'),

        // NOT CENTERED, BUT WORKS
        // m(Popover, {
        //   closeOnEscapeKey: true,
        //   closeOnContentClick: true,
        //   content: m('div', 'hi'),
        //   interactionType: 'hover',
        //   trigger: m('td', [
        //     m(Checkbox, {
        //       indeterminate: (!everyThread && someThreads),
        //       checked: generalStatus,
        //       size: 'lg',
        //       onchange: async (e) => {
        //         e.preventDefault();
        //         if (generalStatus) {
        //           await app.user.notifications.disableSubscriptions(threadSubs);
        //         } else {
        //           await app.user.notifications.enableSubscriptions(threadSubs);
        //         }
        //         m.redraw();
        //       }
        //     }),
        //   ]),
        // }),

        // THIS DOESN'T WORK, BUT I EXPECT IT SHOULD. NO HOVER
        // m('td', [
        //   m(Popover, {
        //     closeOnEscapeKey: true,
        //     closeOnContentClick: true,
        //     content: m('div', 'hi'),
        //     interactionType: 'hover',
        //     trigger: m(Checkbox, {
        //       indeterminate: (!everyThread && someThreads),
        //       checked: generalStatus,
        //       size: 'lg',
        //       onchange: async (e) => {
        //         e.preventDefault();
        //         if (generalStatus) {
        //           await app.user.notifications.disableSubscriptions(threadSubs);
        //         } else {
        //           await app.user.notifications.enableSubscriptions(threadSubs);
        //         }
        //         m.redraw();
        //       }
        //     }),
        //   }),
        // ]),

        m('td', [
          m(Checkbox, {
            indeterminate: (!everyThread && someThreads),
            checked: generalStatus,
            size: 'lg',
            onchange: async (e) => {
              e.preventDefault();
              if (generalStatus) {
                await app.user.notifications.disableSubscriptions(threadSubs);
              } else {
                await app.user.notifications.enableSubscriptions(threadSubs);
              }
              m.redraw();
            }
          }),
        ]),
        m('td', [
          m(Checkbox, {
            disabled: !generalStatus,
            checked: emailStatus,
            indeterminate: (!everyEmail && someEmail),
            size: 'lg',
            onchange: async (e) => {
              e.preventDefault();
              if (emailStatus) {
                await app.user.notifications.disableImmediateEmails(threadSubs);
              } else {
                await app.user.notifications.enableImmediateEmails(threadSubs);
              }
              m.redraw();
            }
          })
        ])
      ]);
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
    return [
      mentionsSubscription
        && m('tr.mentions', [
          m('td', 'Mentions:'),
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
      subscriptions.filter((s) => !chainIds.includes(s.objectId)
        && s.category !== NotificationCategories.NewMention
        && s.category !== NotificationCategories.NewThread
      ).map((subscription) => {
        return m(SubscriptionRow, { subscription });
      })
      // m(GeneralPastThreadsAndComments, { subscriptions }),
    ];
  },
};

interface ICommunityNotificationsAttrs {
  subscriptions: NotificationSubscription[];
  communities: CommunityInfo[];
}

interface ICommunityNotificationsState {
  selectedCommunity: CommunityInfo;
  selectedCommunityId: string;
  communityIds: string[];
}

const CommunityNotifications: m.Component<ICommunityNotificationsAttrs, ICommunityNotificationsState> = {
  oninit: (vnode) => {
    vnode.state.selectedCommunity = null;
    vnode.state.selectedCommunityId = 'All communities';
    vnode.state.communityIds = ['All communities'];
    vnode.attrs.communities.forEach((c) => vnode.state.communityIds.push(c.name));
  },
  view: (vnode) => {
    const { subscriptions, communities } = vnode.attrs;
    const { selectedCommunity, selectedCommunityId, communityIds } = vnode.state;
    if (!communities || !subscriptions) return;
    return m('.CommunityNotifications', [
      m('.header', [
        m('h2', 'Discussions Notifications'),
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
            vnode.state.selectedCommunity = communities.find((c) => c.name === community);
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

interface INotificationSettingsState {
  selectedFilter: string;
  chains: ChainInfo[];
  communities: CommunityInfo[];
  subscriptions: NotificationSubscription[];
}

const NotificationSettingsPage: m.Component<{}, INotificationSettingsState> = {
  oninit: (vnode) => {
    vnode.state.chains = _.uniq(
      app.config.chains.getAll()
    );
    vnode.state.selectedFilter = 'community-notifications';
    vnode.state.subscriptions = [];
    vnode.state.communities = [];
  },
  oncreate: async (vnode) => {
    if (!app.isLoggedIn) m.route.set('/');
    $.post(`${app.serverUrl()}/viewSubscriptions`, {
      jwt: app.user.jwt,
    }).then((result) => {
      console.dir(result.result);
      vnode.state.subscriptions = [];
      result.result.forEach((sub) => {
        vnode.state.subscriptions.push(NotificationSubscription.fromJSON(sub));
      });
      console.dir(vnode.state.subscriptions);
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
    const { selectedFilter, chains, communities, subscriptions } = vnode.state;
    const chainIds = chains.map((c) => c.id);
    const communityIds = communities.map((c) => c.id);

    if (!app.loginStatusLoaded()) return;
    if (subscriptions.length < 1) return;
    return m(Sublayout, {
      class: 'SubscriptionsPage',
      leftSidebar: m(SubscriptionsPageSideBar, {
        selectedFilter,
        communities,
        chains,
        onChangeHandler: (v) => {
          vnode.state.selectedFilter = v;
          m.redraw();
        },
      }),
    }, [
      m('.forum-container', [
        (selectedFilter === 'community-notifications')
          && m(CommunityNotifications, { subscriptions, communities, }),
        (selectedFilter === 'chain-notifications')
          && m(ChainNotificationManagementPage, {
            subscriptions,
            chains,
          }),
      ]),
    ]);
  },
};

export default NotificationSettingsPage;

// import 'pages/subscriptions.scss';
import 'components/sidebar/index.scss';


import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';

import { NotificationSubscription, ChainInfo, CommunityInfo } from 'models';
import app from 'state';
import { NotificationCategories } from 'types';
import { SubstrateEventKinds } from 'events/edgeware/types';
import EdgewareTitlerFunc from 'events/edgeware/filters/titler';
import { IChainEventKind, EventSupportingChains, TitlerFilter } from 'events/interfaces';
import { Button, Icons, Select, List, ListItem, Tooltip, Icon, Input, ButtonGroup, Checkbox, Table } from 'construct-ui';
import { typeIncompatibleAnonSpreadMessage } from 'graphql/validation/rules/PossibleFragmentSpreads';
import Sublayout from 'views/sublayout';
import Tabs from 'views/components/widgets/tabs';
import { DropdownFormField } from 'views/components/forms';
import { async } from 'rxjs/internal/scheduler/async';

const EmailPanel: m.Component<{}, { email: string, interval: string, updateIntervalMessage: string, }> = {
  oninit: (vnode) => {
    vnode.state.updateIntervalMessage = null;
    vnode.state.interval = app.user.emailInterval;
    vnode.state.email = app.user.email;
  },
  view: (vnode) => {
    const { updateIntervalMessage, interval, email } = vnode.state;
    return m('.EmailPanel', [
      m('.EmailInterval', [
        m('h4', 'Receive notification emails:'),
        m(Select, {
          defaultValue: interval,
          options: ['daily', 'weekly', 'monthly', 'never'],
          onchange: async (e) => {
            vnode.state.interval = (e.target as any).value;
            try {
              if (vnode.state.interval === app.user.emailInterval) return;
              const response = await $.post(`${app.serverUrl()}/updateUserEmailInterval`, {
                'interval': vnode.state.interval,
                'jwt': app.user.jwt,
              });
              app.user.setEmailInterval(response.result.emailNotificationInterval);
              vnode.state.updateIntervalMessage = 'Successfully updated!';
              m.redraw();
            } catch (err) {
              vnode.state.interval = app.user.emailInterval;
              vnode.state.updateIntervalMessage = 'Error updating email interval';
              m.redraw();
              console.log('Failed to update email notification interval');
              throw new Error((err.responseJSON && err.responseJSON.error)
                ? err.responseJSON.error
                : 'Failed to update email notification interval');
            }
          },
        }),
        vnode.state.updateIntervalMessage && m('p.user-feedback', updateIntervalMessage),
      ]),
    ]);
  },
};

const UserNotifications: m.Component<{ subscriptions: NotificationSubscription[] }> = {
  view: (vnode) => {
    const { subscriptions } = vnode.attrs;
    const mentionsSubscription = subscriptions.find((s) => s.category === NotificationCategories.NewMention);
    return m('.UserNotifications', [
      mentionsSubscription
        && m('.MentionsButton', [
          m('h4', 'Mentions:'),
          m(Checkbox, {
            size: 'lg',
            // label: mentionsSubscription.isActive ? 'On' : 'Off',
            // intent: mentionsSubscription.isActive ? 'positive' : 'none',
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
    ]);
  },
};

const UserSubscriptions: m.Component<{ subscriptions: NotificationSubscription[] }> = {
  oninit: (vnode) => {
  },
  view: (vnode) => {
    return m('.UserSubscriptions', [
      m('h1', 'User Settings'),
      m(EmailPanel),
      m(UserNotifications, { subscriptions: vnode.attrs.subscriptions, })
    ]);
  }
};

interface ICoCSubscriptionsButtonAttrs {
  community?: CommunityInfo;
  chain?: ChainInfo;
}

const ChainOrCommunitySubscriptionButton: m.Component<ICoCSubscriptionsButtonAttrs, {}> = {
  view: (vnode) => {
    const subscriptions = app.user.notifications;
    const { chain, community } = vnode.attrs;
    const communityOrChain = community || chain;
    const communitySubscription = subscriptions.subscriptions
      .find((v) => v.category === NotificationCategories.NewThread && v.objectId === communityOrChain.id);

    return m('.ChainOrCommunitySubscriptionButton.NewThreadRow', [
      m('h4', 'New Threads:'),
      m(Button, {
        label: communitySubscription ? 'Notifications on' : 'Notifications off',
        iconLeft: communitySubscription ? Icons.BELL : Icons.BELL_OFF,
        class: 'ChainOrCommunitySubscriptionButton',
        href: '#',
        onclick: (e) => {
          e.preventDefault();
          if (communitySubscription) {
            subscriptions.deleteSubscription(communitySubscription).then(() => m.redraw());
          } else {
            subscriptions.subscribe(NotificationCategories.NewThread, communityOrChain.id).then(() => m.redraw());
          }
        },
      })]);
  }
};

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
}

interface ISubscriptionRowState {
  subscription: NotificationSubscription;
  paused: boolean;
}

const SubscriptionRow: m.Component<ISubscriptionRowAttrs, ISubscriptionRowState> = {
  oninit: (vnode) => {
    vnode.state.subscription = vnode.attrs.subscription;
  },
  view: (vnode) => {
    const { subscription } = vnode.state;
    const subscriptions = app.user.notifications;
    const activeSubscription = subscriptions.subscriptions
      .find((v) => v.category === subscription.category && v.objectId === subscription.objectId);
    if (activeSubscription) {
      vnode.state.subscription = activeSubscription;
    }
    return m('tr.SubscriptionRow', [
      m('td', `${vnode.state.subscription.objectId}: ${vnode.state.subscription.category}`),
      activeSubscription
        && m('td', [
          m(Checkbox, {
            checked: activeSubscription.isActive,
            class: '',
            size: 'lg',
            onclick: async (e) => {
              e.preventDefault();
              if (activeSubscription.isActive) {
                await subscriptions.disableSubscriptions([activeSubscription]);
              } else {
                await subscriptions.enableSubscriptions([activeSubscription]);
              }
              m.redraw();
            }
          }),
        ]),
      activeSubscription && app.user.email
        && m(ImmediateEmailCheckbox, { subscription: activeSubscription }),
      // m(Button, {
      //   class: '',
      //   size: 'sm',
      //   onclick: (e) => {
      //     e.preventDefault();
      //     if (activeSubscription) {
      //       subscriptions.deleteSubscription(activeSubscription).then(() => {
      //         m.redraw();
      //       });
      //     } else {
      //       subscriptions.subscribe(vnode.state.subscription.category, vnode.state.subscription.objectId).then(() => {
      //         m.redraw();
      //       });
      //     }
      //   },
      //   label: activeSubscription ? 'Notifications on' : 'Notifications off',
      //   iconLeft: activeSubscription ? Icons.BELL : Icons.BELL_OFF,
      // }),
    ]);
  }
};

interface IPauseToggleAttrs {
  pause: boolean,
  text: string,
  chains?: ChainInfo[],
  communities?: CommunityInfo[],
}

const PauseToggle: m.Component<IPauseToggleAttrs> = {
  view: (vnode) => {
    const { pause, text, chains, communities } = vnode.attrs;
    let { subscriptions } = app.user.notifications;
    if (chains) {
      const chainIds = chains.map((chain) => { return chain.id; });
      subscriptions = subscriptions.filter((subscription) => chainIds.includes(subscription.objectId));
    }
    if (communities) {
      const communtyIds = communities.map((com) => { return com.id; });
      subscriptions = subscriptions.filter((subscription) => communtyIds.includes(subscription.objectId));
    }
    return m(Button, {
      class: 'PauseToggle',
      label: text,
      size: 'sm',
      onclick: async (e) => {
        if (subscriptions.length > 0) {
          if (pause) {
            await app.user.notifications.disableSubscriptions(subscriptions);
            m.redraw();
          } else {
            await app.user.notifications.enableSubscriptions(subscriptions);
            m.redraw();
          }
        }
      },
    });
  }
};

const PauseButtons: m.Component = {
  view: (vnode) => {
    return m('.PauseButtons', [
      m(PauseToggle, {
        pause: true,
        text: 'Pause All Subcriptions',
      }),
      m(PauseToggle, {
        pause: false,
        text: 'Unpause All Subscription',
      }),
      m(PauseToggle, {
        pause: true,
        text: 'Pause Chain Subscriptions',
        chains: app.config.chains.getAll(),
      }),
      m(PauseToggle, {
        pause: false,
        text: 'Unpause Chain Subscriptions',
        chains: app.config.chains.getAll(),
      }),
      m(PauseToggle, {
        pause: true,
        text: 'Pause Community Subscriptions',
        communities: app.config.communities.getAll(),
      }),
      m(PauseToggle, {
        pause: false,
        text: 'Unpause Community Subscriptions',
        communities: app.config.communities.getAll(),
      }),
    ]);
  }
};

interface IActiveSubscriptionsState {
  subscriptions: NotificationSubscription[];
}

const ActiveSubscriptions: m.Component<{ subscriptions: NotificationSubscription[] }, IActiveSubscriptionsState> = {
  oninit: (vnode) => {
    vnode.state.subscriptions = vnode.attrs.subscriptions.filter(
      (s) => s.category !== NotificationCategories.NewMention
    );
  },
  view: (vnode) => {
    const subscriptions = vnode.state.subscriptions;
    return m('.ActiveSubscriptions', [
      m('h1', 'Active Subscriptions'),
      m(PauseButtons),
      m(Table, {}, [
        m('tr', [
          m('th', null),
          m('th', 'In app'),
          m('th', 'By email'),
        ]),
        subscriptions.length > 0
          ? subscriptions.sort((a, b) => a.objectId > b.objectId ? 1 : -1)
            .map((subscription) => m(SubscriptionRow, { subscription }))
          : m('div', 'No Active Subscriptions')
      ]),
    ]);
  },
};

interface IChainSubscriptionRowAttrs {
  chain: ChainInfo;
}

const ChainSubscriptionRow: m.Component<IChainSubscriptionRowAttrs, {}> = {
  view: (vnode) => {
    const { chain } = vnode.attrs;
    return m('.ChainSubscriptionRow', [
      m('h3', `${chain.name}`),
      m(ChainOrCommunitySubscriptionButton, { chain }),
    ]);
  }
};

const ChainSubscriptions: m.Component<{}, {chains: ChainInfo[]}> = {
  oninit: (vnode) => {
    vnode.state.chains = [];
  },
  view: (vnode) => {
    if (app.loginStatusLoaded) {
      vnode.state.chains = app.config.chains.getAll().sort((a, b) => a.id > b.id ? 1 : -1);
    }
    const chains = vnode.state.chains;
    return m('.ChainSubscriptions', [
      m('h1', 'Chains'),
      m('h2', 'Subscribe to New Threads:'),
      chains.length > 0
        ? chains.map((chain) => {
          return m(ChainSubscriptionRow, { chain });
        })
        : '',
    ]);
  }
};

interface ICommunitySubscriptionRowAttrs {
  community: CommunityInfo;
}

const CommunitySubscriptionRow: m.Component<ICommunitySubscriptionRowAttrs, {}> = {
  view: (vnode) => {
    const { community } = vnode.attrs;
    return m('.CommunitySubscriptionRow', [
      m('h3', `${community.name}:`),
      m(ChainOrCommunitySubscriptionButton, { community }),
    ]);
  }
};

interface ICommunitySubscriptionsState {
  communities: CommunityInfo[];
}

const CommunitySubscriptions: m.Component<{}, ICommunitySubscriptionsState> = {
  oninit: (vnode) => {
    vnode.state.communities = [];
  },
  view: (vnode) => {
    if (app.loginStatusLoaded) {
      vnode.state.communities = app.config.communities.getAll().sort((a, b) => a.id > b.id ? 1 : -1);
    }
    const communtities = vnode.state.communities;
    return m('.CommunitySubscriptions', [
      m('h1', 'Communities'),
      m('h2', 'Subscribe to New Threads:'),
      communtities.length > 0
        && communtities.map((community) => {
          return m(CommunitySubscriptionRow, { community });
        })
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
    return m('.EventSubscriptionRow', [
      m('h3', `${title}`),
      app.loginStatusLoaded && m(Button, {
        label: subscription && subscription.isActive ? 'Notification on' : 'Notifications off',
        iconLeft: subscription && subscription.isActive ? Icons.BELL : Icons.BELL_OFF,
        onclick: async (e) => {
          e.preventDefault();
          if (subscription && subscription.isActive) {
            await app.user.notifications.disableSubscriptions([ subscription ]);
          } else {
            await app.user.notifications.subscribe(NotificationCategories.ChainEvent, objectId);
          }
          setTimeout(() => { m.redraw(); }, 0);
        }
      }),
      m('span', description),
    ]);
  }
};

interface IEventSubscriptionState {
  chain: string;
  eventKinds: IChainEventKind[];
  allSupportedChains: string[];
  isSubscribedAll: boolean;
}

const EventSubscriptions: m.Component<{chain: ChainInfo}, IEventSubscriptionState> = {
  oninit: (vnode) => {
    vnode.state.chain = vnode.attrs.chain.id;
    vnode.state.eventKinds = SubstrateEventKinds;
    vnode.state.allSupportedChains = EventSupportingChains.sort();
    vnode.state.isSubscribedAll = false;
  },
  view: (vnode) => {
    let titler;
    if (vnode.state.chain === 'edgeware' || vnode.state.chain === 'edgeware-local') {
      titler = EdgewareTitlerFunc;
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

    const supportedChains = app.loginStatusLoaded
      ? app.config.chains.getAll()
        .filter((c) => vnode.state.allSupportedChains.includes(c.id))
        .sort((a, b) => a.id.localeCompare(b.id))
      : [];
    return m('.EventSubscriptions', [
      m('h1', 'On-Chain Events'),
      // supportedChains.length > 0 && m(Select, {
      //   name: 'chain',
      //   options: supportedChains.map((c) => c.name),
      //   onchange: (e) => {
      //     const { value } = e.target as any;
      //     vnode.state.chain = value;
      //     m.redraw(); // TODO TEST THIS SELECT COMPONENT REFRESH PROPERLY
      //     // setTimeout(() => { m.redraw(); }, 0);
      //   }
      // }),
      m('h2', 'Subscribe to New Events:'),
      m('.EventSubscriptionRow', [
        m('h3', 'Subscribe All'),
        app.loginStatusLoaded && m(Button, {
          class: 'activeSubscriptionButton',
          label: vnode.state.isSubscribedAll ? 'Notifications on' : 'Notifications off',
          iconLeft: vnode.state.isSubscribedAll ? Icons.BELL : Icons.BELL_OFF,
          onclick: async (e) => {
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
            setTimeout(() => { m.redraw(); }, 0);
          }
        }, vnode.state.isSubscribedAll
          ? [ m('span.icon-bell'), ' Notifications on' ]
          : [ m('span.icon-bell-off'), ' Notifications off' ]),
        m('span', 'Subscribe to all notifications on chain.'),
      ]),
      supportedChains.length > 0 && vnode.state.eventKinds.length > 0 && titler
        ? vnode.state.eventKinds.map((kind) => m(
          EventSubscriptionRow,
          { chain: vnode.state.chain, kind, titler },
        ))
        : m('No events available on this chain.')
    ]);
  }
};

interface IChainOrCommNotifPageAttrs {
  subscriptions: NotificationSubscription[];
  selectedFilter: string;
  chains?: ChainInfo[];
  communities?: CommunityInfo[];
}

const ChainNotificationManagementPage: m.Component<IChainOrCommNotifPageAttrs> = {
  view: (vnode) => {
    const { subscriptions, selectedFilter, chains } = vnode.attrs;
    const chain = chains.find((c) => c.id === selectedFilter);
    return m('ChainNotificationManagementPage', [
      m('h2', chain.name),
      m(ChainOrCommunitySubscriptionButton, { chain, }),
      m(EventSubscriptions, { chain }),
    ]);
  },
};

const CommunityNotificationManagementPage: m.Component<IChainOrCommNotifPageAttrs> = {
  view: (vnode) => {
    const { subscriptions, selectedFilter, communities } = vnode.attrs;
    const community = communities.find((c) => c.id === selectedFilter);
    const communitySubscriptions = subscriptions.filter((s) => s);
    return m('CommunityNotificationManagementPage', [
      m('h2', community.name),
      m(ChainOrCommunitySubscriptionButton, { community, }),
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
        m('h4', 'General'),
        m(SubscriptionSideBarListItem, {
          label: 'User Notifications',
          id: 'default',
          selectedFilter,
          onChangeHandler,
        }),
        m(SubscriptionSideBarListItem, {
          label: 'Active Subscriptions',
          id: 'active',
          selectedFilter,
          onChangeHandler,
        }),
        chains.length > 0
          && m('h4', 'Chains'),
        chains.map((chain) => {
          return m(SubscriptionSideBarListItem, {
            label: chain.name,
            id: chain.id,
            selectedFilter,
            onChangeHandler,
          });
        }),
        communities.length > 0
          && m('h4', 'Communites'),
        communities.map((community) => {
          return m(SubscriptionSideBarListItem, {
            label: community.name,
            id: community.id,
            selectedFilter,
            onChangeHandler,
          });
        }),
      ])
    ]);
  },
};

interface IGeneralNewThreadsAndCommentsAttrs {
  communities: CommunityInfo[];
  subscriptions: NotificationSubscription[];
}

interface IGeneralCommunityNotificationsState {
  generalStatus: boolean;
  emailStatus: boolean;
}

const GeneralNewThreadsAndComments:
  m.Component<IGeneralNewThreadsAndCommentsAttrs, IGeneralCommunityNotificationsState > = {
    oninit: (vnode) => {
      vnode.state.generalStatus = null;
      vnode.state.emailStatus = null;
    },
    onupdate: (vnode) => {
      const { communities, subscriptions } = vnode.attrs;
      const communityIds = communities.map((c) => c.id);
      const someThreads = subscriptions.some((s) => communityIds.includes(s.objectId));
      const everyThread = subscriptions.every((s) => communityIds.includes(s.objectId));
      vnode.state.generalStatus = (everyThread) ? true : (someThreads) ? null : false;
    },
    view: (vnode) => {
      const { communities, subscriptions } = vnode.attrs;
      const { generalStatus } = vnode.state;
      return m('tr.GeneralNewThreadsAndComments', [
        m('td', 'New threads and comments'),
        m('td', [
          m(Checkbox, {
            indeterminate: (generalStatus === null),
            checked: generalStatus,
            size: 'lg',
            onchange: async (e) => {
              e.preventDefault();
              if (generalStatus === null) {
                console.dir('indeterminate');
                // TODO: For each community, create New Thread/Comment subscriptions or mark isActive
                vnode.state.generalStatus = true;
              } else if (generalStatus) {
                console.dir('checked');
                // TODO: For each NewThread subscription, mark isActive false
                vnode.state.generalStatus = false;
              } else {
                console.dir('unchecked');
                // TODO: For each community, create New Thread/Comment subscriptions or mark isActive
                vnode.state.generalStatus = null;
              }
              m.redraw();
            }
          }),
        ]),
        m('td', [
          m(Checkbox, {
            disabled: !generalStatus,
            checked: emailStatus,
            indeterminate: (generalStatus === null),
            size: 'lg',
            onchange: async (e) => {
              e.preventDefault();
              if (generalStatus) {
                // TODO: mark all community-level subscriptions immediateEmail = false;
              } else {
                // TODO: mark all community-level subscriptions immediateEmail = true;
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
  communityIds: string[];
}

const CommunityNotifications: m.Component<ICommunityNotificationsAttrs, ICommunityNotificationsState> = {
  oninit: (vnode) => {
    vnode.state.selectedCommunity = null;
    vnode.state.communityIds = ['All communities'];
    vnode.attrs.communities.forEach((c) => vnode.state.communityIds.push(c.name));
  },
  view: (vnode) => {
    const { subscriptions, communities } = vnode.attrs;
    const { selectedCommunity, communityIds } = vnode.state;
    return m('.CommunityNotifications', [
      m('.header', [
        m('h2', 'Discussions Notifications'),
        m(Select, {
          default: 'All communities',
          options: communityIds,
          onchange: (e) => {
            const target = (e.target as any).value;
            if (target === 'All communities') {
              vnode.state.selectedCommunity = null;
            } else {
              const community = communities.find((c) => target === c.name);
              vnode.state.selectedCommunity = community;
            }
            m.redraw();
          },
        }),
      ]),
      m(Table, {
        class: 'NotificationsTable'
      }, [
        m('tr', [
          m('th', null),
          m('th', 'In app'),
          m('th', 'By email'),
        ]),
        (selectedCommunity === null) && [
          m(GeneralCommunityNotifications, { communities, subscriptions }),
        ]
      ])
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
    const communityIds = app.user.roles
      .filter((role) => role.offchain_community_id)
      .map((r) => r.offchain_community_id);
    vnode.state.communities = _.uniq(
      app.config.communities.getAll()
        .filter((c) => communityIds.includes(c.id))
    );
    const chainIds = app.user.roles
      .filter((role) => role.chain_id)
      .map((r) => r.chain_id);
    vnode.state.chains = _.uniq(
      app.config.chains.getAll()
        .filter((c) => chainIds.includes(c.id))
    );
    vnode.state.selectedFilter = 'default';
    vnode.state.subscriptions = [];
  },
  oncreate: async (vnode) => {
    if (!app.isLoggedIn) m.route.set('/');
    $.get(`${app.serverUrl()}/viewSubscriptions`, {
      jwt: app.user.jwt,
    }).then((result) => {
      result.result.forEach((sub) => {
        vnode.state.subscriptions.push(NotificationSubscription.fromJSON(sub));
      });
      m.redraw();
    }, (error) => {
      m.route.set('/');
    });
  },
  view: (vnode) => {
    const { selectedFilter, chains, communities, subscriptions } = vnode.state;
    const chainIds = chains.map((c) => c.id);
    const communityIds = communities.map((c) => c.id);

    if (!app.loginStatusLoaded()) return;
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
        (selectedFilter === 'default')
          && m(CommunityNotifications, { subscriptions, communities, }),
        // && m(UserSubscriptions, { subscriptions }),
        (selectedFilter === 'active')
          && m(ActiveSubscriptions, { subscriptions }),
        (chainIds.includes(selectedFilter))
          && m(ChainNotificationManagementPage, { subscriptions, selectedFilter, chains }),
        (communityIds.includes(selectedFilter))
          && m(CommunityNotificationManagementPage, { subscriptions, selectedFilter, communities }),
      ]),
    ]);
  },
};

export default NotificationSettingsPage;

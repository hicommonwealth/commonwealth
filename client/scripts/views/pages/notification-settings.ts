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
  label?: string;
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
    const { label } = vnode.attrs;
    const { subscription } = vnode.state;
    const subscriptions = app.user.notifications;
    const activeSubscription = subscriptions.subscriptions
      .find((v) => v.category === subscription.category && v.objectId === subscription.objectId);
    if (activeSubscription) {
      vnode.state.subscription = activeSubscription;
    }
    return m('tr.SubscriptionRow', [
      m('td', label || `${capitalize(vnode.state.subscription.objectId)}: ${vnode.state.subscription.category}`),
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

// interface IActiveSubscriptionsState {
//   subscriptions: NotificationSubscription[];
// }

// const ActiveSubscriptions: m.Component<{ subscriptions: NotificationSubscription[] }, IActiveSubscriptionsState> = {
//   oninit: (vnode) => {
//     vnode.state.subscriptions = vnode.attrs.subscriptions.filter(
//       (s) => s.category !== NotificationCategories.NewMention
//     );
//   },
//   view: (vnode) => {
//     const subscriptions = vnode.state.subscriptions;
//     return m('.ActiveSubscriptions', [
//       m('h1', 'Active Subscriptions'),
//       m(PauseButtons),
//       m(Table, {}, [
//         m('tr', [
//           m('th', null),
//           m('th', 'In app'),
//           m('th', 'By email'),
//         ]),
//         subscriptions.length > 0
//           ? subscriptions.sort((a, b) => a.objectId > b.objectId ? 1 : -1)
//             .map((subscription) => m(SubscriptionRow, { subscription }))
//           : m('div', 'No Active Subscriptions')
//       ]),
//     ]);
//   },
// };

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

const InAppCheckbox: m.Component<{ subscription: NotificationSubscription }> = {
  view: (vnode) => {
    const { subscription } = vnode.attrs;
    return m(Checkbox, {
      size: 'lg',
      checked: subscription.isActive,
      onchange: async (e) => {
        e.preventDefault();
        if (subscription.isActive) {
          await app.user.notifications.disableImmediateEmails([subscription]);
        } else {
          await app.user.notifications.enableImmediateEmails([subscription]);
        }
        m.redraw();
      }
    });
  },
};

const EmailCheckbox: m.Component<{ subscription: NotificationSubscription }> = {
  view: (vnode) => {
    const { subscription } = vnode.attrs;
    return m(Checkbox, {
      size: 'lg',
      disabled: subscription.isActive,
      checked: subscription.immediateEmail,
      onchange: async (e) => {
        e.preventDefault();
        if (subscription.immediateEmail) {
          await app.user.notifications.disableImmediateEmails([subscription]);
        } else {
          await app.user.notifications.enableImmediateEmails([subscription]);
        }
        m.redraw();
      }
    });
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
    return [
      m(NewThreadRow, { community, subscriptions }),
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
      subscriptions.filter((s) => !chainIds.includes(s.objectId)).map((subscription) => {
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
    // for testing, not production
    // vnode.state.selectedCommunity  = vnode.attrs.communities.find((c) => c.name === 'internal');
    // vnode.state.selectedCommunityId = vnode.state.selectedCommunity.name;
  },
  onupdate: (vnode) => {
    // if (vnode.attrs.communities.length > 0) {
    //   vnode.state.communityIds = ['All communities'];
    //   vnode.attrs.communities.forEach((c) => vnode.state.communityIds.push(c.name));
    // }
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

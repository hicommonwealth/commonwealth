import 'pages/_listing_page.scss';
import 'pages/subscriptions.scss';

import m from 'mithril';
import $ from 'jquery';
import { NotificationSubscription, ChainInfo, CommunityInfo } from 'models';
import app from 'state';
import { NotificationCategories } from 'types';
import { SubstrateEventKinds } from 'events/edgeware/types';
import EdgewareTitlerFunc from 'events/edgeware/filters/titler';
import { IChainEventKind, EventSupportingChains, TitlerFilter } from 'events/interfaces';
import ListingPage from './_listing_page';
import Tabs from '../components/widgets/tabs';
import { DropdownFormField } from '../components/forms';
import { Button, Icons, Select, List, ListItem } from 'construct-ui';
import { typeIncompatibleAnonSpreadMessage } from 'graphql/validation/rules/PossibleFragmentSpreads';
import _ from 'lodash';

const NotificationButtons: m.Component = {
  oninit: (vnode) => {
  },
  view: (vnode) => {
    let notifications: any[];
    if (app.loginStatusLoaded) {
      notifications = app.login.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix());
    }
    return m('.NotificationButtons', [
      m('h2', 'Notifications:'),
      m(Button, {
        label: 'Mark all as read',
        onclick: (e) => {
          e.preventDefault();
          if (notifications.length < 1) return;
          app.login.notifications.markAsRead(notifications).then(() => m.redraw());
        }
      }),
      m(Button, {
        label: 'Clear all read',
        onclick: (e) => {
          e.preventDefault();
          app.login.notifications.clearAllRead().then(() => m.redraw());
        }
      }),
    ]);
  }
};

interface ICoCSubscriptionsButtonAttrs {
  community?: CommunityInfo;
  chain?: ChainInfo;
}

const ChainOrCommunitySubscriptionButton: m.Component<ICoCSubscriptionsButtonAttrs, {}> = {
  view: (vnode) => {
    const subscriptions = app.login.notifications;
    const { chain, community } = vnode.attrs;
    const communityOrChain = community || chain;
    const communitySubscription = subscriptions.subscriptions
      .find((v) => v.category === NotificationCategories.NewThread && v.objectId === communityOrChain.id);

    return m(Button, {
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
    });
  }
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
    const subscriptions = app.login.notifications;
    const activeSubscription = subscriptions.subscriptions
      .find((v) => v.category === subscription.category && v.objectId === subscription.objectId);
    if (activeSubscription) {
      vnode.state.subscription = activeSubscription;
    }
    return m('.SubscriptionRow', [
      m('h3', `${vnode.state.subscription.objectId}`),
      m('h4', `Subscription Type: ${vnode.state.subscription.category}`),
      activeSubscription
        && m(Button, {
          label: activeSubscription.isActive ? 'Pause' : 'Unpause',
          iconLeft: activeSubscription.isActive ? Icons.VOLUME_2 : Icons.VOLUME_X,
          class: 'pauseButton',
          href: '#',
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
      m(Button, {
        class: 'activeSubscriptionButton',
        href: '#',
        onclick: (e) => {
          e.preventDefault();
          if (activeSubscription) {
            subscriptions.deleteSubscription(activeSubscription).then(() => {
              m.redraw();
            });
          } else {
            subscriptions.subscribe(vnode.state.subscription.category, vnode.state.subscription.objectId).then(() => {
              m.redraw();
            });
          }
        },
        label: activeSubscription ? 'Notifications on' : 'Notifications off',
        iconLeft: activeSubscription ? Icons.BELL : Icons.BELL_OFF,
      }),
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
    let { subscriptions } = app.login.notifications;
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
      onclick: async (e) => {
        if (subscriptions.length > 0) {
          if (pause) {
            await app.login.notifications.disableSubscriptions(subscriptions);
            m.redraw();
          } else {
            await app.login.notifications.enableSubscriptions(subscriptions);
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

const ActiveSubscriptions: m.Component<{}, IActiveSubscriptionsState> = {
  oninit: (vnode) => {
    vnode.state.subscriptions = [];
  },
  oncreate: async (vnode) => {
    if (!app.isLoggedIn) m.route.set('/');
    $.get(`${app.serverUrl()}/viewSubscriptions`, {
      jwt: app.login.jwt,
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
    const subscriptions = vnode.state.subscriptions;
    return m('.ActiveSubscriptions', [
      m('h1', 'Active Subscriptions'),
      m(PauseButtons),
      subscriptions.length > 0
        ? subscriptions.sort((a, b) => a.objectId > b.objectId ? 1 : -1)
          .map((subscription) => m(SubscriptionRow, { subscription }))
        : m('div', 'No Active Subscriptions')
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
    const subscription = app.loginStatusLoaded && app.login.notifications.subscriptions
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
            await app.login.notifications.disableSubscriptions([ subscription ]);
          } else {
            await app.login.notifications.subscribe(NotificationCategories.ChainEvent, objectId);
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

const EventSubscriptions: m.Component<{}, IEventSubscriptionState> = {
  oninit: (vnode) => {
    vnode.state.chain = EventSupportingChains.sort()[0];
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

    const allSubscriptions = app.login.notifications.subscriptions
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
      supportedChains.length > 0 && m(Select, {
        name: 'chain',
        options: supportedChains.map((c) => c.name),
        onchange: (e) => {
          const { value } = e.target as any;
          vnode.state.chain = value;
          m.redraw(); // TODO TEST THIS SELECT COMPONENT REFRESH PROPERLY
          // setTimeout(() => { m.redraw(); }, 0);
        }
      }),
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
              await app.login.notifications.disableSubscriptions(allActiveSubscriptions);
            } else {
              await Promise.all(
                vnode.state.eventKinds.map((kind) => {
                  return app.login.notifications.subscribe(
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

const SubscriptionsPageSideBar: m.Component<ISubscriptionsPageSideBarAttrs> = {
  view: (vnode) => {
    const { selectedFilter, onChangeHandler, chains, communities } = vnode.attrs;
    return m('.Sidebar', {
      class: `${app.isLoggedIn() ? 'logged-in' : 'logged-out'} `
        + `${(app.community || app.chain) ? 'active-community' : 'no-active-community'}`,
    }, [
      m(List, {
        class: 'SidebarMenu',
        interactive: true,
        size: 'lg',
      }, [
        // header
        m('.title-selector', [
          m('.title-selector-left', [
            m('.community-name', 'Notifications Manager'),
          ]),
        ]),
        m('h4', 'General'),
        m(SubscriptionSideBarListItem, {
          label: 'User Notifications',
          id: 'default',
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

interface ISubscriptionsPageState {
  selectedFilter: string;
  chains: ChainInfo[];
  communities: CommunityInfo[];
  subscriptions: NotificationSubscription[];
}
const SubscriptionsPage: m.Component<{}, ISubscriptionsPageState> = {
  oninit: (vnode) => {
    const communityIds = app.login.roles
      .filter((role) => role.offchain_community_id)
      .map((r) => r.offchain_community_id);
    vnode.state.communities = _.uniq(
      app.config.communities.getAll()
        .filter((c) => communityIds.includes(c.id))
    );
    const chainIds = app.login.roles
      .filter((role) => role.chain_id)
      .map((r) => r.chain_id);
    vnode.state.chains = _.uniq(
      app.config.chains.getAll()
        .filter((c) => chainIds.includes(c.id))
    );
    vnode.state.selectedFilter = 'default';
    vnode.state.subscriptions = app.login.notifications.subscriptions;
  },
  view: (vnode) => {
    const { selectedFilter, chains, communities, subscriptions } = vnode.state;

    return m('.SubscriptionsPage', [
      m(SubscriptionsPageSideBar, {
        selectedFilter,
        communities,
        chains,
        onChangeHandler: (v) => {
          vnode.state.selectedFilter = v;
          console.log(vnode.state.selectedFilter);
        },
      }),
      m('.forum-container', [
        (selectedFilter === 'default')
          && m(NotificationButtons),
        (selectedFilter === 'edgeware')
          && m(ChainSubscriptions),
        // m(Tabs, [{
        //   name: 'Active Subscriptions',
        //   content: m(ActiveSubscriptions),
        // }, {
        //   name: 'Chain Subscriptions',
        //   content: m(ChainSubscriptions),
        // }, {
        //   name: 'Community Subscriptions',
        //   content: m(CommunitySubscriptions),
        // }, {
        //   name: 'Event Subscriptions',
        //   content: m(EventSubscriptions),
        // }, {
        //   name: 'Notifications',
        //   content: m(NotificationButtons),
        // },
        // ]),
      ]),
    ]);
  },
};

export default SubscriptionsPage;

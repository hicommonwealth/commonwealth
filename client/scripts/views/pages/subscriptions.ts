import 'pages/_listing_page.scss';
import 'pages/subscriptions.scss';

import m from 'mithril';
import $ from 'jquery';
import { NotificationSubscription, ChainInfo, CommunityInfo } from 'models';
import app from 'state';
import { NotificationCategories } from 'types';
import Tabs from '../components/widgets/tabs';

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
      m('button', {
        onclick: (e) => {
          e.preventDefault();
          if (notifications.length < 1) return;
          app.login.notifications.markAsRead(notifications).then(() => m.redraw());
        }
      }, 'Mark all as read'),
      m('button', {
        onclick: (e) => {
          e.preventDefault();
          app.login.notifications.clearAllRead().then(() => m.redraw());
        }
      }, 'Clear all read'),
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

    return m('button.ChainOrCommunitySubscriptionButton', {
      class: communitySubscription ? 'formular-button-primary' : '',
      href: '#',
      onclick: (e) => {
        e.preventDefault();
        if (communitySubscription) {
          subscriptions.deleteSubscription(communitySubscription).then(() => m.redraw());
        } else {
          subscriptions.subscribe(NotificationCategories.NewThread, communityOrChain.id).then(() => m.redraw());
        }
      },
    }, [
      communitySubscription
        ? [ m('span.icon-bell'), ' Notifications on' ]
        : [ m('span.icon-bell-off'), ' Notifications off' ]
    ]);
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
        && m('button.pauseButton', {
          class: activeSubscription.isActive ? '' : 'formular-button-negative',
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
        }, activeSubscription.isActive ? 'Pause' : 'Unpause'),
      m('button.activeSubscriptionButton', {
        class: activeSubscription ? 'formular-button-primary' : '',
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
        }
      }, [
        activeSubscription
          ? [ m('span.icon-bell'), ' Notifications on' ]
          : [ m('span.icon-bell-off'), ' Notifications off' ]
      ]),
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
    return m('button.PauseToggle', {
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
    }, `${text}`);
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

const SubscriptionsPage: m.Component = {
  view: () => {
    return m('.SubscriptionsPage', [
      m('.forum-container', [
        m(Tabs, [{
          name: 'Active Subscriptions',
          content: m(ActiveSubscriptions),
        }, {
          name: 'Chain Subscriptions',
          content: m(ChainSubscriptions),
        }, {
          name: 'Community Subscriptions',
          content: m(CommunitySubscriptions),
        }, {
          name: 'Notifications',
          content: m(NotificationButtons),
        },
        ]),
      ]),
    ]);
  },
};

export default SubscriptionsPage;

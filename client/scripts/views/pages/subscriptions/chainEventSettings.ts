import 'pages/subscriptions.scss';

import m from 'mithril';
import _ from 'lodash';
import { Checkbox, Table, SelectList, Icons, Button, ListItem } from 'construct-ui';
import {
  SubstrateEvents, SubstrateTypes, IChainEventKind, EventSupportingChains, TitlerFilter
} from '@commonwealth/chain-events';
import { ChainInfo, CommunityInfo, ChainNetwork } from 'models';
import app from 'state';
import { NotificationCategories } from 'types';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import PageError from 'views/pages/error';
import {
  EdgewareChainNotificationTypes, KusamaChainNotificationTypes, PolkdotChainNotificationTypes
} from 'helpers/chain_notification_types';


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

const IndividualEventSubscriptions: m.Component<{
  chain: string;
}, {
  eventKinds: IChainEventKind[];
  titler;
  allSupportedChains: string[];
  isSubscribedAll: boolean;
  isEmailAll: boolean;
}> = {
  oninit: (vnode) => {
    if (vnode.attrs.chain === ChainNetwork.Edgeware || vnode.attrs.chain === 'edgeware-local') {
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

interface IEventSubscriptionTypeRowAttrs {
  title: string;
  notificationTypeArray: string[];
}

const EventSubscriptionTypeRow: m.Component<IEventSubscriptionTypeRowAttrs, { option: string, }> = {
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
      vnode.state.option = 'Notifications on (app + email)';
    } else if (allSubscriptionsCreated && everySubscriptionActive) {
      vnode.state.option = 'Notifications on (app only)';
    } else {
      vnode.state.option = 'Notifications off';
    }

    return m('tr.EventSubscriptionTypeRow', [
      m('td', { class: 'bold' }, title),
      m('td', [
        m(SelectList, {
          class: 'EventSubscriptionTypeSelectList',
          filterable: false,
          checkmark: false,
          emptyContent: null,
          inputAttrs: {
            class: 'EventSubscriptionTypeSelectRow',
          },
          itemRender: (option: string) => {
            return m(ListItem, {
              label: option,
              selected: (vnode.state.option === option),
            });
          },
          items: ['Notifications off', 'Notifications on (app only)', 'Notifications on (app + email)', ],
          trigger: m(Button, {
            align: 'left',
            compact: true,
            iconRight: Icons.CHEVRON_DOWN,
            label: vnode.state.option,
          }),
          onSelect: async (option: string) => {
            vnode.state.option = option;
            if (option === 'Notifications off') {
              await app.user.notifications.disableImmediateEmails(subscriptions);
              await app.user.notifications.disableSubscriptions(subscriptions);
            } else if (option === 'Notifications on (app only)') {
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
            } else if (option === 'Notifications on (app + email)') {
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

const EventSubscriptions: m.Component<{chain: ChainInfo}> = {
  view: (vnode) => {
    const { chain } = vnode.attrs;
    return m('.EventSubscriptions', [
      m(Table, {}, [
        m('tr', [
          m('th', null),
          m('th', 'Settings'),
        ]),
        (chain.id === ChainNetwork.Edgeware) && m(EdgewareChainEvents),
        (chain.id === ChainNetwork.Kusama) && m(KusamaChainEvents),
        (chain.id === ChainNetwork.Polkadot) && m(PolkadotChainEvents),
      ]),
    ]);
  }
};

const ChainNotificationManagementPage: m.Component<{ chains: ChainInfo[] }, { selectedChain: ChainInfo }> = {
  oninit: (vnode) => {
    const { chains } = vnode.attrs;
    const scope = m.route.param('scope');
    vnode.state.selectedChain = chains.find((c) => c.id === scope)
      || chains.find((c) => c.id === ChainNetwork.Edgeware);
  },
  view: (vnode) => {
    const { chains } = vnode.attrs;
    const chainIds = chains.map((c) => c.id);
    if (chains.length < 1) return;
    const validChains = ['edgeware', 'polkadot', 'kusama'];
    const filteredChains = chains.filter((c) => validChains.includes(c.id)).sort((a, b) => (a.id > b.id) ? 1 : -1);
    return m('ChainNotificationManagementPage', [
      m(SelectList, {
        class: 'ChainNotificationSelectList',
        filterable: false,
        checkmark: false,
        emptyContent: null,
        inputAttrs: {
          class: 'CommunitySelectRow',
        },
        itemRender: (chain: ChainInfo) => {
          return m(ListItem, {
            label: chain.name,
            selected: (vnode.state.selectedChain === chain),
          });
        },
        items: filteredChains,
        trigger: m(Button, {
          align: 'left',
          compact: true,
          iconRight: Icons.CHEVRON_DOWN,
          label: vnode.state.selectedChain
            ? vnode.state.selectedChain.name
            : 'Select Chain',
        }),
        onSelect: (chain: ChainInfo) => {
          vnode.state.selectedChain = chain;
          m.redraw();
        }
      }),
      m(EventSubscriptions, {
        chain: vnode.state.selectedChain,
      }),
    ]);
  },
};

const ChainEventSettingsPage: m.Component<{}> = {
  view: (vnode) => {
    const chains = _.uniq(
      app.config.chains.getAll()
    );
    if (!app.loginStatusLoaded()) return m(PageLoading);
    if (!app.isLoggedIn()) return m(PageError, {
      message: 'This page requires you to be logged in.'
    });

    return m(Sublayout, {
      class: 'SubscriptionsPage',
      title: 'Chain Notifications',
    }, [
      m('.forum-container', [
        m(ChainNotificationManagementPage, {
          chains,
        }),
      ]),
    ]);
  },
};

export default ChainEventSettingsPage;

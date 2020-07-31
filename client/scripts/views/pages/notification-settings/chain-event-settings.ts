import 'pages/subscriptions.scss';

import m from 'mithril';
import _ from 'lodash';
import { Checkbox, Table, SelectList, Icons, Button, ListItem } from 'construct-ui';

import { ChainInfo, CommunityInfo } from 'models';
import app from 'state';
import { NotificationCategories } from 'types';
import {
  SubstrateEvents, SubstrateTypes, IChainEventKind, EventSupportingChains, TitlerFilter
} from '@commonwealth/chain-events';

import Sublayout from 'views/sublayout';
import { EdgewareChainNotificationTypes, KusamaChainNotificationTypes, PolkdotChainNotificationTypes } from 'helpers/chain_notification_types';


interface IIndividualEventSubscriptionsState {
  chain: string;
  eventKinds: IChainEventKind[];
  allSupportedChains: string[];
  isSubscribedAll: boolean;
  isEmailAll: boolean;
}

const IndividualEventSubscriptions: m.Component<{}, IIndividualEventSubscriptionsState> = {
  view: (vnode) => {
    let titler;
    if (vnode.state.chain === 'edgeware' || vnode.state.chain === 'edgeware-local') {
      titler = SubstrateEvents.Title;
      vnode.state.eventKinds = SubstrateTypes.EventKinds;
    } else {
      titler = null;
      vnode.state.eventKinds = [];
    }   

    const supportedChains = app.loginStatusLoaded
    ? app.config.chains.getAll()
      .filter((c) => vnode.state.allSupportedChains.includes(c.id))
      .sort((a, b) => a.id.localeCompare(b.id))
    : [];

    return [
      supportedChains.length > 0 && vnode.state.eventKinds.length > 0 && titler
      ? vnode.state.eventKinds.map((kind) => m(
        EventSubscriptionRow,
        { chain: vnode.state.chain, kind, titler, key: kind },
      ))
      : m('No events available on this chain.'),
    ]
  },
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

interface IEventSubscriptionTypeRowAttrs {
    title: string;
    notificationTypeArray: string[];
  }
  
const EventSubscriptionTypeRow: m.Component<IEventSubscriptionTypeRowAttrs> = {
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
    const everySubscriptionEmail = subscriptions.every((s) => s.immediateEmail)
    const someSubscriptionsEmail = subscriptions.some((s) => s.immediateEmail);
    const allSubscriptionsCreated = subscriptions.length === notificationTypeArray.length;
    return m('tr.EventSubscriptionTypeRow', [
      m('td', { class: 'bold' }, title),
      m('td', [
        m(Checkbox, {
          checked: allSubscriptionsCreated && everySubscriptionActive,
          indeterminate: !everySubscriptionActive && someSubscriptionsActive,
          size: 'lg',
          onchange: async (e) => {
            e.preventDefault();
            if (allSubscriptionsCreated && everySubscriptionActive) {
              await app.user.notifications.disableSubscriptions(subscriptions);
            } else if (allSubscriptionsCreated && !someSubscriptionsActive) {
              await app.user.notifications.enableSubscriptions(subscriptions);
            } else {
              await Promise.all(
                notificationTypeArray.map((obj) => {
                  return app.user.notifications.subscribe(NotificationCategories.ChainEvent, obj);
                })
              )
            }
            m.redraw();
          }
        })
      ]),
      m('td', [
        m(Checkbox, {
          disabled: !everySubscriptionActive || !allSubscriptionsCreated,
          checked:  everySubscriptionEmail && allSubscriptionsCreated,
          indeterminate: !everySubscriptionEmail && someSubscriptionsEmail,
          size: 'lg',
          onchange: async (e) => {
            e.preventDefault();
            if (everySubscriptionEmail) {
              await app.user.notifications.disableImmediateEmails(subscriptions);
            } else {
              await app.user.notifications.enableImmediateEmails(subscriptions);
            }
            m.redraw();
          }
        }),
      ]),
    ]);
  }
};

const EdgewareChainEvents: m.Component = {
  view: (vnode) =>{
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
  view: (vnode) =>{
    return [
      m(EventSubscriptionTypeRow, { title: 'Council events', notificationTypeArray: KusamaChainNotificationTypes.Council, }),
      m(EventSubscriptionTypeRow, { title: 'Democracy events', notificationTypeArray: KusamaChainNotificationTypes.Democracy, }),
      m(EventSubscriptionTypeRow, { title: 'Preimage events', notificationTypeArray: KusamaChainNotificationTypes.Preimage, }),
      // m(EventSubscriptionTypeRow, { title: 'Treasury events', notificationTypeArray: KusamaChainNotificationTypes.Treasury, }),
      // m(EventSubscriptionTypeRow, { title: 'Signaling events', notificationTypeArray: KusamaChainNotificationTypes.Signaling, }),
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
      // m(EventSubscriptionTypeRow, { title: 'Signaling events', notificationTypeArray: PolkdotChainNotificationTypes.Signaling, }),
      // m(EventSubscriptionTypeRow, { title: 'Treasury events', notificationTypeArray: PolkdotChainNotificationTypes.Treasury, }),
      m(EventSubscriptionTypeRow, { title: 'Validator events', notificationTypeArray: PolkdotChainNotificationTypes.Validator, }),
      m(EventSubscriptionTypeRow, { title: 'Vote events', notificationTypeArray: PolkdotChainNotificationTypes.Vote, }),
    ]
  }
};


  
const EventSubscriptions: m.Component<{chain: ChainInfo}> = {
  view: (vnode) => {
    const { chain } = vnode.attrs;
    console.dir(chain);
    return m('.EventSubscriptions', [
      m('h2', vnode.attrs.chain.name),
      m(Table, {}, [
        m('tr', [
            m('th', null),
            m('th', 'In app'),
            m('th', 'By email'),
        ]),
        (chain.id === 'edgeware') && m(EdgewareChainEvents),
        (chain.id === 'kusama') && m(KusamaChainEvents),
        (chain.id === 'polkadot') && m(PolkadotChainEvents),
      ]),
    ]);
  }
};
  
const ChainNotificationManagementPage: m.Component<{chains: ChainInfo[],}, { selectedChain: ChainInfo,}> = {
    oninit: (vnode) => {
      const { chains } = vnode.attrs;
      const scope = m.route.param('scope');
      vnode.state.selectedChain = chains.find((c) => c.id === scope) || chains.find((c) => c.id === 'edgeware');
    },
    view: (vnode) => {
      const { chains } = vnode.attrs;
      const chainIds = chains.map((c) => c.id);
      if (chains.length < 1) return;
      const validChains = ['edgeware', 'polkadot', 'kusama'];
      const filteredChains = chains.filter((c) => validChains.includes(c.id)).sort((a,b) => (a.id > b.id) ? 1 : -1);
      return m('ChainNotificationManagementPage', [
        m('h2', 'Subscribe to Chain Events'),
        m(SelectList, {
          class: 'CommunitySelectList',
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

interface IChainEventSettingsPageState {
    chains: ChainInfo[];
  }

const ChainEventSettingsPage: m.Component<{}, IChainEventSettingsPageState> = {
  oninit: (vnode) => {
    vnode.state.chains = _.uniq(
      app.config.chains.getAll()
    );
  },
  view: (vnode) => {
    const { chains } = vnode.state;
    if (!app.loginStatusLoaded()) return;
    return m(Sublayout, {
      class: 'SubscriptionsPage',
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

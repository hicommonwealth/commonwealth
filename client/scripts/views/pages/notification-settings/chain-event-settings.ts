import 'pages/subscriptions.scss';

import m from 'mithril';
import _ from 'lodash';
import { Checkbox, Table } from 'construct-ui';

import { ChainInfo, CommunityInfo } from 'models';
import app from 'state';
import { NotificationCategories } from 'types';
import {
  SubstrateEvents, SubstrateTypes, IChainEventKind, EventSupportingChains, TitlerFilter
} from '@commonwealth/chain-events';

import Sublayout from 'views/sublayout';
import { EdgewareChainNotificationTypes } from 'helpers/chain_notification_types';

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
      const subscriptions = app.loginStatusLoaded && app.user.notifications.subscriptions.filter((s) => {
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
            checked:  everySubscriptionEmail,
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
      vnode.state.eventKinds = SubstrateTypes.EventKinds;
      vnode.state.allSupportedChains = EventSupportingChains.sort();
      vnode.state.isSubscribedAll = false;
      vnode.state.isEmailAll = false;
    },
    view: (vnode) => {
      let titler;
      if (vnode.state.chain === 'edgeware' || vnode.state.chain === 'edgeware-local') {
        titler = SubstrateEvents.Title;
        vnode.state.eventKinds = SubstrateTypes.EventKinds;
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
          m(EventSubscriptionTypeRow, { title: 'Council events', notificationTypeArray: EdgewareChainNotificationTypes.Council, }),
          m(EventSubscriptionTypeRow, { title: 'Democracy events', notificationTypeArray: EdgewareChainNotificationTypes.Democracy, }),
          m(EventSubscriptionTypeRow, { title: 'Preimage events', notificationTypeArray: EdgewareChainNotificationTypes.Preimage, }),
          m(EventSubscriptionTypeRow, { title: 'Treasury events', notificationTypeArray: EdgewareChainNotificationTypes.Treasury, }),
          m(EventSubscriptionTypeRow, { title: 'Signaling events', notificationTypeArray: EdgewareChainNotificationTypes.Signaling, }),
          m(EventSubscriptionTypeRow, { title: 'Validator events', notificationTypeArray: EdgewareChainNotificationTypes.Validator, }),
          m(EventSubscriptionTypeRow, { title: 'Vote events', notificationTypeArray: EdgewareChainNotificationTypes.Vote, }),
  
          // List all event kinds in the UI. Good for debugging.
          // supportedChains.length > 0 && vnode.state.eventKinds.length > 0 && titler
          //   ? vnode.state.eventKinds.map((kind) => m(
          //     EventSubscriptionRow,
          //     { chain: vnode.state.chain, kind, titler, key: kind },
          //   ))
          //   : m('No events available on this chain.'),
        ]),
      ]);
    }
  };

interface IChainNotifPageAttrs {
    selectedFilter?: string;
    chains?: ChainInfo[];
    communities?: CommunityInfo[];
  }
  
  const ChainNotificationManagementPage: m.Component<IChainNotifPageAttrs> = {
    view: (vnode) => {
      const { chains } = vnode.attrs;
      const chainIds = chains.map((c) => c.id);
      if (chains.length < 1) return;
      return m('ChainNotificationManagementPage', [
        m('h2', 'Subscribe to Chain Events'),
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

interface IChainEventSettingsPageState {
    chains: ChainInfo[];
  }

const ChainEventSettingsPage: m.Component<{}, IChainEventSettingsPageState> = {
    oninit: (vnode) => {
        vnode.state.chains = _.uniq(
          app.config.chains.getAll()
        );
      },
      oncreate: async (vnode) => {
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

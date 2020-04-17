import 'modals/manage_chain_notifications_modal.scss';

import app from 'state';
import $ from 'jquery';

import { default as m } from 'mithril';
import { NotificationSubscription, ChainClass } from 'models';

import { SubstrateEventKinds } from 'events/edgeware/types';
import { DropdownFormField } from '../components/forms';

interface ISubscriptionRowAttrs {
  subscription: NotificationSubscription;
}

const SubscriptionRow: m.Component<ISubscriptionRowAttrs> = {
  view: (vnode: m.VnodeDOM<ISubscriptionRowAttrs>) => {
    const { subscription } = vnode.attrs;
    return m('.subscription-row', [
      m('.subscription-row-label', `${subscription.category}: ${subscription.objectId}`),
      m('button.btn.formular-button-primary', {
        onclick: async (e) => {
          e.preventDefault();
          if (subscription.isActive) {
            await app.login.notifications.disableSubscriptions([ subscription ]);
          } else {
            await app.login.notifications.enableSubscriptions([ subscription ]);
          }
          // TODO: check this updates and that we don't need to store in state
          m.redraw();
        }
      }, subscription.isActive ? 'Deactivate' : 'Activate'),
    ]);
    // TODO: add delete button?
  },
};

interface IChainSubscriptionFormAttrs {
  subscriptions: NotificationSubscription[];
}

interface IChainSubscriptionFormState {
  subscriptionType: string;
}

const ChainSubscriptionForm: m.Component<IChainSubscriptionFormAttrs, IChainSubscriptionFormState> = {
  view: (vnode: m.VnodeDOM<IChainSubscriptionFormAttrs, IChainSubscriptionFormState>) => {
    const objectId = (subscriptionType) => {
      return `${app.chain.id}-${subscriptionType}`;
    };

    // TODO: we should have an "available check" of some sort here?
    //    or maybe fetch this data from server, to guarantee consistency?
    if (app.chain.class === ChainClass.Edgeware) {
      const availableSubscriptionTypes = SubstrateEventKinds
        // remove chain event subscriptions that already exist
        .filter((eventString) => !vnode.attrs.subscriptions
          .find((s) => s.category === 'chain-event' && s.objectId === objectId(eventString)));

      // set dropdown default
      if (availableSubscriptionTypes.length > 0 && !vnode.state.subscriptionType) {
        vnode.state.subscriptionType = availableSubscriptionTypes[0];
      }

      return m('.event-subscription', [
        m(DropdownFormField, {
          title: 'Chain Event Type:',
          name: 'chain-event-type',
          options: {
            class: availableSubscriptionTypes.length === 0 ? 'disabled' : '',
          },
          choices: availableSubscriptionTypes.map((t) => {
            return { name: t, label: t, value: t };
          }),
          callback: (result) => {
            vnode.state.subscriptionType = result;
            setTimeout(() => { m.redraw(); }, 0);
          },
        }),
        m('button.btn.formular-button-primary', {
          class: availableSubscriptionTypes.length === 0 ? 'disabled' : '',
          onclick: (e) => {
            e.preventDefault();
            app.login.notifications.subscribe('chain-event', objectId(vnode.state.subscriptionType))
              .then((res) => {
                // TODO: refactor this once component library is available
                m.redraw();
                setTimeout(() => {
                  vnode.state.subscriptionType = '' + $(e.target).closest('.event-subscription').find('select').val();
                }, 100);
              });
          }
        }, 'Subscribe'),
      ]);
    } else {
      return m('.event-subscription', 'Chain event subscription only available on Edgeware.');
    }
  },
};

const ManageChainNotificationsModal: m.Component = {
  view: (vnode: m.VnodeDOM) => {
    return m('.ManageChainNotificationsModal', [
      m('.header', 'Manage Chain Notifications'),

      // display all user subscriptions currently present
      m('.compact-modal-body', [
        app.login.notifications.subscriptions
          // push chain events to end of list
          .sort((s1, s2) => s1.category !== 'chain-event' ? -1 : (s2.category !== 'chain-event' ? 1 : 0))
          .map((subscription) => m(SubscriptionRow, { subscription })),
        m(ChainSubscriptionForm, { subscriptions: app.login.notifications.subscriptions }),
      ]),
    ]);
  },
};

export default ManageChainNotificationsModal;

import 'modals/webhook_settings_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Button, List, ListItem, Checkbox } from 'construct-ui';
import { Webhook } from 'models';
import { NotificationCategories } from 'types';
import { EdgewareChainNotificationTypes, KusamaChainNotificationTypes, KulupuChainNotificationTypes, PolkadotChainNotificationTypes } from 'helpers/chain_notification_types';
import { symbols } from 'helpers';
import { notifyError } from 'controllers/app/notifications';

interface IAttrs {
    webhook: Webhook;
    updateSuccessCallback: Function;
}

interface IState {
    selectedCategories: string[];
}
const forumNotificationTypes = [
    NotificationCategories.NewThread,
    NotificationCategories.NewComment,
    NotificationCategories.NewReaction,
]

const WebhookSettingsModal: m.Component<IAttrs, IState> = {
  oninit: (vnode) => {
    vnode.state.selectedCategories = [];
    vnode.attrs.webhook.categories.forEach((v) => vnode.state.selectedCategories.push(v));
  },
  view: (vnode) => {
    const { webhook } = vnode.attrs;
    const isChain = webhook.chain_id ? true : false;
    const chainNotifications = webhook.chain_id === 'edgeware' ? EdgewareChainNotificationTypes
      : webhook.chain_id === 'kusama' ? KusamaChainNotificationTypes
        : webhook.chain_id === 'kulupu' ? KulupuChainNotificationTypes
          : webhook.chain_id === 'polkadot' ? PolkadotChainNotificationTypes
            : {};
    const row = (label: string, values: string[]) => {
        const allValuesPresent = values.every((v) => vnode.state.selectedCategories.includes(v));
        const someValuesPresent = values.length > 1 && values.some((v) => vnode.state.selectedCategories.includes(v));
        return m(ListItem, {
            contentLeft: label,
            contentRight: m(Checkbox, {
                checked: allValuesPresent,
                indeterminate: someValuesPresent && !allValuesPresent,
                onchange: (e) => {
                    if (allValuesPresent) {
                        vnode.state.selectedCategories = vnode.state.selectedCategories
                            .filter((v) => !values.includes(v));
                        m.redraw();
                    } else {
                        values.forEach((v) => {
                            if (!vnode.state.selectedCategories.includes(v)) {
                                vnode.state.selectedCategories.push(v);
                            }
                        });
                        m.redraw();
                    }
                },
            }),
        });
    }
    return m('.WebhookSettingsModal.compact-modal-body-max', [
      m('.CompactModalExitButton.dark', {
        onclick: (e) => {
          e.preventDefault();
          $(e.target).trigger('modalexit');
        }
      }, symbols.times),
      m('.title-section', [
          m('h4', 'Webhook Settings'),
          m('p', 'Which events should trigger this webhook?'),
      ]),
      m('.forum-events', [
          m('h4', 'Off-chain discussions'),
          m(List, {
              interactive: false,
              size: 'sm',
          }, [
              row('New thread', [NotificationCategories.NewThread]),
              row('New comment', [NotificationCategories.NewComment]),
              row('New reaction', [NotificationCategories.NewReaction]),
          ])
      ]),
      isChain && m('.chain-events', [
        m('h4', 'On-chain events'),
        m(List, {
          interactive: false,
          size: 'sm',
        }, [
          // iterate over chain events
          Object.keys(chainNotifications).map((k) => row(`${k} event`, chainNotifications[k])),
        ])
      ]),
      m(Button, {
        label: 'Save webhook settings',
        class: 'settings-save-button',
        intent: 'primary',
        onclick: (e) => {
          e.preventDefault();
          const chainOrCommObj = webhook.chain_id
            ? { chain: webhook.chain_id }
            : { community: webhook.offchain_community_id };
          $.ajax({
            url: `${app.serverUrl()}/updateWebhook`,
            data: {
              webhookId: webhook.id,
              categories: vnode.state.selectedCategories,
              ...chainOrCommObj,
              jwt: app.user.jwt,
            },
            type: 'POST',
            success: (result) => {
              const updatedWebhook = Webhook.fromJSON(result.result);
              vnode.attrs.updateSuccessCallback(updatedWebhook);
              $(e.target).trigger('modalexit');
            },
            error: (err) => {
              notifyError(err.statusText);
              m.redraw();
            }
          });
        }
      })
    ]);
  }
};

export default WebhookSettingsModal;

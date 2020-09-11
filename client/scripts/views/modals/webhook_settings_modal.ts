import 'modals/webhook_settings_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Button, List, ListItem, Checkbox } from 'construct-ui';
import { Webhook } from 'models';
import { NotificationCategories } from 'types';
import { EdgewareChainNotificationTypes, KusamaChainNotificationTypes, KulupuChainNotificationTypes, PolkdotChainNotificationTypes } from 'helpers/chain_notification_types';
import { symbols } from 'helpers';

interface IAttrs {
    webhook: Webhook;
    updateSuccessCallback: Function;
}

interface IState {
    selectedCategories: string[];
    // webhook: Webhook;
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
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    const { webhook } = vnode.attrs;
    // const community = webhook.
    const isChain = webhook.chain_id ? true : false;
    const chainNotifications = webhook.chain_id === 'edgeware' ? EdgewareChainNotificationTypes 
      : webhook.chain_id === 'kusama' ? KusamaChainNotificationTypes
        : webhook.chain_id === 'kulupu' ? KulupuChainNotificationTypes
          : webhook.chain_id === 'polkadot' ? PolkdotChainNotificationTypes
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
          $(vnode.dom).trigger('modalexit');
        }
      }, symbols.times),
      m('.title-section', [
          m('h4', 'Webhook options'),
          m('p', 'Which events should trigger a notification?'),
      ]),
      m('.forum-events', [
          m('h4', 'Off-chain events'),
          m(List, {
              interactive: false,
              size: 'sm',
          }, [
              row('New Thread', [NotificationCategories.NewThread]),
              row('New Comment', [NotificationCategories.NewComment]),
              row('New Reaction', [NotificationCategories.NewReaction]),
          ])
      ]),
      isChain && m('.chain-events', [
        m('h4', 'On-chain events'),
        m(List, {
          interactive: false,
          size: 'sm',
        }, [
          // iterate chain events
          Object.keys(chainNotifications).map((k) => {
            return row(k.toString(), chainNotifications[k]);
          }),
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
              $(vnode.dom).trigger('modalexit');
            },
            error: (err) => {
              console.dir(err);
              m.redraw();
            }
          });
        }
      })
    ]);
  }
};

export default WebhookSettingsModal;

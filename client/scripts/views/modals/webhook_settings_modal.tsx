/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import { Button, List, ListItem, Checkbox } from 'construct-ui';

import 'modals/webhook_settings_modal.scss';

import app from 'state';
import { Webhook } from 'models';
import { NotificationCategories } from 'types';
import {
  EdgewareChainNotificationTypes,
  KusamaChainNotificationTypes,
  KulupuChainNotificationTypes,
  PolkadotChainNotificationTypes,
  DydxChainNotificationTypes,
} from 'helpers/chain_notification_types';
import { notifyError } from 'controllers/app/notifications';
import { CompactModalExitButton } from '../components/component_kit/cw_modal';

type WebhookSettingsModalAttrs = {
  updateSuccessCallback: () => void;
  webhook: Webhook;
};

export class WebhookSettingsModal
  implements m.ClassComponent<WebhookSettingsModalAttrs>
{
  private selectedCategories: string[];

  oninit(vnode) {
    this.selectedCategories = [];
    vnode.attrs.webhook.categories.forEach((v) =>
      this.selectedCategories.push(v)
    );
  }

  view(vnode) {
    const { webhook } = vnode.attrs;
    const isChain = !!webhook.chain_id;

    const chainNotifications =
      webhook.chain_id === 'edgeware'
        ? EdgewareChainNotificationTypes
        : webhook.chain_id === 'kusama'
        ? KusamaChainNotificationTypes
        : webhook.chain_id === 'kulupu'
        ? KulupuChainNotificationTypes
        : webhook.chain_id === 'polkadot'
        ? PolkadotChainNotificationTypes
        : webhook.chain_id === 'dydx'
        ? DydxChainNotificationTypes
        : {};

    const row = (label: string, values: string[]) => {
      const allValuesPresent = values.every((v) =>
        this.selectedCategories.includes(v)
      );

      const someValuesPresent =
        values.length > 1 &&
        values.some((v) => this.selectedCategories.includes(v));

      return (
        <ListItem
          contentLeft={label}
          contentRight={
            <Checkbox
              checked={allValuesPresent}
              indeterminate={someValuesPresent && !allValuesPresent}
              onchange={() => {
                if (allValuesPresent) {
                  this.selectedCategories = this.selectedCategories.filter(
                    (v) => !values.includes(v)
                  );
                  m.redraw();
                } else {
                  values.forEach((v) => {
                    if (!this.selectedCategories.includes(v)) {
                      this.selectedCategories.push(v);
                    }
                  });
                  m.redraw();
                }
              }}
            />
          }
        />
      );
    };

    return (
      <div class="WebhookSettingsModal">
        <div class="compact-modal-title">
          <h3>Webhook Settings</h3>
          <CompactModalExitButton />
        </div>
        <div class="compact-modal-body">
          <p>Which events should trigger this webhook?</p>
          <div class="forum-events">
            <h4>Off-chain discussions</h4>
            <List interactive={false} size="sm">
              {row('New thread', [NotificationCategories.NewThread])}
              {row('New comment', [NotificationCategories.NewComment])}
              {row('New reaction', [NotificationCategories.NewReaction])}
            </List>
          </div>
          {isChain && (
            <div class="chain-events">
              <h4>On-chain events</h4>
              <List interactive={false} size="sm">
                {/* iterate over chain events */}
                {Object.keys(chainNotifications).map((k) =>
                  row(`${k} event`, chainNotifications[k])
                )}
              </List>
            </div>
          )}
          <Button
            label="Save webhook settings"
            intent="primary"
            rounded={true}
            onclick={(e) => {
              e.preventDefault();
              const chainOrCommObj = { chain: webhook.chain_id };
              $.ajax({
                url: `${app.serverUrl()}/updateWebhook`,
                data: {
                  webhookId: webhook.id,
                  categories: this.selectedCategories,
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
                },
              });
            }}
          />
        </div>
      </div>
    );
  }
}

import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  } from 'mithrilInterop';
import { NotificationCategories } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
import {
  DydxChainNotificationTypes,
  EdgewareChainNotificationTypes,
  KulupuChainNotificationTypes,
  KusamaChainNotificationTypes,
  PolkadotChainNotificationTypes,
} from 'helpers/chain_notification_types';
import $ from 'jquery';

import 'modals/webhook_settings_modal.scss';
import { Webhook } from 'models';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { ModalExitButton } from '../components/component_kit/cw_modal';
import { CWText } from '../components/component_kit/cw_text';

type WebhookSettingsModalAttrs = {
  updateSuccessCallback: (webhook: Webhook) => void;
  webhook: Webhook;
};

export class WebhookSettingsModal extends ClassComponent<WebhookSettingsModalAttrs> {
  private selectedCategories: string[];

  oninit(vnode: ResultNode<WebhookSettingsModalAttrs>) {
    this.selectedCategories = [];
    vnode.attrs.webhook.categories.forEach((v) =>
      this.selectedCategories.push(v)
    );
  }

  view(vnode: ResultNode<WebhookSettingsModalAttrs>) {
    const { webhook } = vnode.attrs;
    const isChain = !!webhook.chain_id;

    // TODO: @ZAK make this generic or based on chain-event listening status on backend
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
        <CWCheckbox
          value=""
          checked={allValuesPresent}
          label={label}
          indeterminate={someValuesPresent && !allValuesPresent}
          onChange={() => {
            if (allValuesPresent) {
              this.selectedCategories = this.selectedCategories.filter(
                (v) => !values.includes(v)
              );
              redraw();
            } else {
              values.forEach((v) => {
                if (!this.selectedCategories.includes(v)) {
                  this.selectedCategories.push(v);
                }
              });
              redraw();
            }
          }}
        />
      );
    };

    return (
      <div className="WebhookSettingsModal">
        <div className="compact-modal-title">
          <h3>Webhook Settings</h3>
          <ModalExitButton />
        </div>
        <div className="compact-modal-body">
          <CWText>Which events should trigger this webhook?</CWText>
          <div className="checkbox-section">
            <CWText type="h5" fontWeight="semiBold">
              Off-chain discussions
            </CWText>
            {row('New thread', [NotificationCategories.NewThread])}
            {row('New comment', [NotificationCategories.NewComment])}
            {row('New reaction', [NotificationCategories.NewReaction])}
          </div>
          {isChain && Object.keys(chainNotifications).length > 0 && (
            <div className="checkbox-section">
              <CWText type="h5" fontWeight="semiBold">
                On-chain events
              </CWText>
              {/* iterate over chain events */}
              {Object.keys(chainNotifications).map((k) =>
                row(`${k} event`, chainNotifications[k])
              )}
            </div>
          )}
          <CWButton
            label="Save webhook settings"
            onClick={(e) => {
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
                  redraw();
                },
              });
            }}
          />
        </div>
      </div>
    );
  }
}

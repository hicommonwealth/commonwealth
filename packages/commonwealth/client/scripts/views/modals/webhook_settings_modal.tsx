import React from 'react';

import { redraw } from 'mithrilInterop';

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
import { CWText } from '../components/component_kit/cw_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

type WebhookSettingsModalProps = {
  onModalClose: () => void;
  updateSuccessCallback: (webhook: Webhook) => void;
  webhook: Webhook;
};

export const WebhookSettingsModal = (props: WebhookSettingsModalProps) => {
  const { onModalClose, updateSuccessCallback, webhook } = props;
  const [selectedCategories, setSelectedCategories] = React.useState<
    Array<string>
  >(webhook.categories);

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
      selectedCategories.includes(v)
    );

    const someValuesPresent =
      values.length > 1 && values.some((v) => selectedCategories.includes(v));

    return (
      <CWCheckbox
        key={label}
        value=""
        checked={allValuesPresent}
        label={label}
        indeterminate={someValuesPresent && !allValuesPresent}
        onChange={() => {
          if (allValuesPresent) {
            setSelectedCategories(
              selectedCategories.filter((v) => !values.includes(v))
            );
            redraw();
          } else {
            values.forEach((v) => {
              if (!selectedCategories.includes(v)) {
                selectedCategories.push(v);
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
        <CWIconButton iconName="close" onClick={() => onModalClose()} />
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
                categories: selectedCategories,
                ...chainOrCommObj,
                jwt: app.user.jwt,
              },
              type: 'POST',
              success: (result) => {
                const updatedWebhook = Webhook.fromJSON(result.result);
                updateSuccessCallback(updatedWebhook);
                onModalClose();
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
};

import React, { useState } from 'react';

import { NotificationCategories } from 'common-common/src/types';
import type Webhook from '../../models/Webhook';
import {
  DydxChainNotificationTypes,
  EdgewareChainNotificationTypes,
  KulupuChainNotificationTypes,
  KusamaChainNotificationTypes,
  PolkadotChainNotificationTypes,
} from '../../helpers/chain_notification_types';
import { CWButton } from '../components/component_kit/new_designs/cw_button';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWText } from '../components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';

import '../../../styles/modals/webhook_settings_modal.scss';

type WebhookSettingsModalProps = {
  onModalClose: () => void;
  updateWebhook: (webhook: Webhook, selectedCategories: Array<string>) => void;
  webhook: Webhook;
};

export const WebhookSettingsModal = ({
  onModalClose,
  updateWebhook,
  webhook,
}: WebhookSettingsModalProps) => {
  const [selectedCategories, setSelectedCategories] = useState<Array<string>>(
    webhook.categories
  );

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
        className="checkbox"
        key={label}
        value=""
        checked={allValuesPresent}
        label={label}
        indeterminate={someValuesPresent && !allValuesPresent}
        onChange={() => {
          if (allValuesPresent) {
            setSelectedCategories((prevState) =>
              prevState.filter((v) => !values.includes(v))
            );
          } else {
            values.forEach((v) => {
              if (!selectedCategories.includes(v)) {
                setSelectedCategories((prevState) => [...prevState, v]);
              }
            });
          }
        }}
      />
    );
  };

  return (
    <div className="WebhookSettingsModal">
      <CWModalHeader label="Webhook Settings" onModalClose={onModalClose} />
      <CWModalBody>
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
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Cancel"
          buttonType="secondary"
          buttonHeight="sm"
          onClick={onModalClose}
        />
        <CWButton
          label="Save settings"
          buttonType="primary"
          buttonHeight="sm"
          onClick={() => updateWebhook(webhook, selectedCategories)}
        />
      </CWModalFooter>
    </div>
  );
};

import {
  ChainBase,
  ChainNetwork,
  NotificationCategories,
  WebhookCategory,
} from '@hicommonwealth/core';
import React, { useState } from 'react';
import app from 'state';
import '../../../styles/modals/webhook_settings_modal.scss';
import type Webhook from '../../models/Webhook';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';

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
  const [selectedCategories, setSelectedCategories] = useState<
    Array<WebhookCategory>
  >(webhook.categories);

  let supportsChainEvents = false;
  if (app.chain.base === ChainBase.CosmosSDK) {
    supportsChainEvents = true;
  } else if (
    // TODO: @Timothee update once event labeling is implemented
    app.chain.base === ChainBase.Ethereum &&
    (app.chain.network === ChainNetwork.Compound ||
      app.chain.network === ChainNetwork.Aave)
  ) {
    supportsChainEvents = true;
  }

  const row = (label: string, values: WebhookCategory[]) => {
    const allValuesPresent = values.every((v) =>
      selectedCategories.includes(v),
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
              prevState.filter((v) => !values.includes(v)),
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
        {supportsChainEvents && (
          <div className="checkbox-section">
            <CWText type="h5" fontWeight="semiBold">
              On-chain events
            </CWText>
            {row('Proposal Events', [NotificationCategories.ChainEvent])}
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

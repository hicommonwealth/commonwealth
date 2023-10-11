import React, { useState } from 'react';
import 'modals/webhook_settings_modal.scss';
import type Webhook from '../../models/Webhook';
import {
  ChainBase,
  ChainNetwork,
  NotificationCategories,
} from 'common-common/src/types';
import { CWButton } from '../components/component_kit/cw_button';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWText } from '../components/component_kit/cw_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import app from 'state';
import { WebhookCategory } from 'types';

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
        {supportsChainEvents && (
          <div className="checkbox-section">
            <CWText type="h5" fontWeight="semiBold">
              On-chain events
            </CWText>
            {row('Proposal Events', [NotificationCategories.ChainEvent])}
          </div>
        )}
        <CWButton
          label="Save webhook settings"
          onClick={() => updateWebhook(webhook, selectedCategories)}
        />
      </div>
    </div>
  );
};

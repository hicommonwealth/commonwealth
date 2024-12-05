import { Webhook, WebhookSupportedEvents } from '@hicommonwealth/schemas';
import React, { useState } from 'react';
import z from 'zod';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import './webhook_settings_modal.scss';

type WebhookSettingsModalProps = {
  onModalClose: () => void;
  updateWebhook: (
    webhook: z.infer<typeof Webhook>,
    selectedEvents: Array<z.infer<typeof WebhookSupportedEvents>>,
  ) => void;
  webhook: z.infer<typeof Webhook>;
};

export const WebhookSettingsModal = ({
  onModalClose,
  updateWebhook,
  webhook,
}: WebhookSettingsModalProps) => {
  const [selectedEvents, setSelectedEvents] = useState<
    Array<z.infer<typeof WebhookSupportedEvents>>
  >(webhook.events);

  const row = (
    label: string,
    value: z.infer<typeof WebhookSupportedEvents>,
  ) => {
    const eventIsSelected = selectedEvents.includes(value);

    return (
      <CWCheckbox
        className="checkbox"
        key={label}
        value=""
        checked={eventIsSelected}
        label={label}
        onChange={() => {
          if (eventIsSelected) {
            setSelectedEvents((prevState) =>
              prevState.filter((v) => v !== value),
            );
          } else {
            setSelectedEvents((prevState) => [...prevState, value]);
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
            Discussions
          </CWText>
          {row('New Threads', 'ThreadCreated')}
          {row('New Comments', 'CommentCreated')}
        </div>
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
          onClick={() => updateWebhook(webhook, selectedEvents)}
        />
      </CWModalFooter>
    </div>
  );
};

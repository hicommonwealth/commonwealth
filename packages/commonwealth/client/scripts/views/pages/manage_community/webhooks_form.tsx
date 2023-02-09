import React from 'react';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { link, pluralize } from 'helpers';
import { redraw } from 'mithrilInterop';
import $ from 'jquery';
import { Webhook } from 'models';

import 'pages/manage_community/webhooks_form.scss';
import smartTruncate from 'smart-truncate';

import app from 'state';
import { WebhookSettingsModal } from 'views/modals/webhook_settings_modal';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { Modal } from '../../components/component_kit/cw_modal';

type WebhooksFormProps = {
  webhooks: Array<Webhook>;
};

export const WebhooksForm = (props: WebhooksFormProps) => {
  const { webhooks } = props;

  const [disabled, setDisabled] = React.useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = React.useState<string>('');
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  const chainOrCommObj = { chain: app.activeChainId() };

  const createWebhook = () => {
    setDisabled(true);

    // TODO: Change to POST /webhook
    $.post(`${app.serverUrl()}/createWebhook`, {
      ...chainOrCommObj,
      webhookUrl,
      auth: true,
      jwt: app.user.jwt,
    }).then(
      (result) => {
        setDisabled(false);

        if (result.status === 'Success') {
          const newWebhook = Webhook.fromJSON(result.result);

          webhooks.push(newWebhook);

          setIsModalOpen(true);

          setWebhookUrl('');
        } else {
          notifyError(result.message);
        }

        redraw();
      },
      (err) => {
        setDisabled(false);
        notifyError(err?.responseJSON?.error || 'Unknown error');
        redraw();
      }
    );
  };

  return (
    <div className="WebhooksForm">
      <div className="webhooks-container">
        {webhooks.map((webhook) => {
          const label =
            webhook.url.indexOf('discord') !== -1
              ? 'Discord'
              : webhook.url.indexOf('slack') !== -1
              ? 'Slack'
              : null;

          return (
            <div className="webhook-row" key={webhook.id}>
              <div className="webhook-info">
                <CWText>{smartTruncate(webhook.url, 25)}</CWText>
                {label && (
                  <CWText type="caption" className="webhook-tag-text">
                    {label}
                  </CWText>
                )}
                <CWText type="caption" className="webhook-tag-text">
                  {pluralize(webhook.categories.length, 'event')}
                </CWText>
              </div>
              <div className="buttons">
                <CWIconButton
                  iconName="gear"
                  iconSize="small"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsModalOpen(true);
                  }}
                />
                <CWIconButton
                  iconName="trash"
                  iconSize="small"
                  disabled={disabled}
                  onClick={(e) => {
                    e.preventDefault();
                    setDisabled(true);

                    // TODO: Change to DELETE /webhook
                    $.post(`${app.serverUrl()}/deleteWebhook`, {
                      ...chainOrCommObj,
                      webhookUrl: webhook.url,
                      auth: true,
                      jwt: app.user.jwt,
                    }).then(
                      (result) => {
                        setDisabled(false);

                        if (result.status === 'Success') {
                          const idx = webhooks.findIndex(
                            (w) => w.url === webhook.url
                          );

                          if (idx !== -1) {
                            webhooks.splice(idx, 1);
                          }

                          notifySuccess('Success! Webhook deleted');
                        } else {
                          notifyError(result.message);
                        }
                        redraw();
                      },
                      (err) => {
                        setDisabled(false);

                        notifyError(
                          err?.responseJSON?.error || 'Unknown error'
                        );

                        redraw();
                      }
                    );
                  }}
                />
                <Modal
                  content={
                    <WebhookSettingsModal
                      onModalClose={() => setIsModalOpen(false)}
                      webhook={webhook}
                      updateSuccessCallback={(wh) => {
                        const idx = webhooks.findIndex(
                          (wh2) => wh2.id === wh.id
                        );

                        webhooks[idx].categories = wh.categories;
                      }}
                    />
                  }
                  onClose={() => setIsModalOpen(false)}
                  open={isModalOpen}
                />
              </div>
            </div>
          );
        })}
      </div>
      {webhooks.length === 0 && (
        <CWText className="no-webhooks-text">
          No webhooks yet. Slack, Discord, and Telegram webhooks are supported.
          For more information and examples for setting these up, please view
          our
          {link('a', 'https://docs.commonwealth.im', [' documentation.'])}
        </CWText>
      )}
      <CWTextInput
        placeholder="https://hooks.slack.com/services/"
        value={webhookUrl}
        onInput={(e) => {
          setWebhookUrl(e.target.value);
        }}
      />
      <CWButton
        disabled={!webhookUrl}
        label="Add webhook"
        onClick={createWebhook}
      />
    </div>
  );
};

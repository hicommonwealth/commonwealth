import React, { useEffect, useState } from 'react';
import smartTruncate from 'smart-truncate';
import $ from 'jquery';

import 'pages/manage_community/webhooks_form.scss';

import app from 'state';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { link, pluralize } from 'helpers';
import { Webhook } from 'models';
import { WebhookSettingsModal } from 'views/modals/webhook_settings_modal';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { Modal } from '../../components/component_kit/cw_modal';
import { useCommonNavigate } from 'navigation/helpers';

export const WebhooksForm = () => {
  const navigate = useCommonNavigate();

  const [disabled, setDisabled] = useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = React.useState<string>('');
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [webhooks, setWebhooks] = useState<Array<Webhook>>([]);

  const chainOrCommObj = { chain: app.activeChainId() };

  useEffect(() => {
    const fetch = () => {
      $.get(`${app.serverUrl()}/getWebhooks`, {
        ...chainOrCommObj,
        auth: true,
        jwt: app.user.jwt,
      })
        .then(([webhooksResp]) => {
          if (webhooksResp.status !== 'Success') {
            throw new Error('Could not fetch community webhooks');
          }

          setWebhooks(webhooksResp.result);
        })
        .catch(() => {
          setWebhooks([]);
        });
    };

    fetch();
  }, [webhooks]);

  const createWebhook = () => {
    setDisabled(true);

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
          setWebhooks((prevState) => [...prevState, newWebhook]);
          setIsModalOpen(true);
          setWebhookUrl('');
        } else {
          notifyError(result.message);
        }
      },
      (err) => {
        setDisabled(false);
        notifyError(err?.responseJSON?.error || 'Unknown error');
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
                  onClick={() => setIsModalOpen(true)}
                />
                <CWIconButton
                  iconName="trash"
                  iconSize="small"
                  disabled={disabled}
                  onClick={() => {
                    setDisabled(true);

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
                      },
                      (err) => {
                        setDisabled(false);
                        notifyError(
                          err?.responseJSON?.error || 'Unknown error'
                        );
                      }
                    );
                  }}
                />
                <Modal
                  content={
                    <WebhookSettingsModal
                      onModalClose={() => setIsModalOpen(false)}
                      webhook={webhook}
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
          {link(
            'a',
            'https://docs.commonwealth.im',
            [' documentation.'],
            navigate
          )}
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

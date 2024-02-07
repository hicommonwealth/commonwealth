import axios from 'axios';
import { notifyError } from 'controllers/app/notifications';
import { pluralize } from 'helpers';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import 'pages/manage_community/webhooks_form.scss';
import React, { useMemo, useState } from 'react';
import smartTruncate from 'smart-truncate';
import app from 'state';
import { WebhookSettingsModal } from 'views/modals/webhook_settings_modal';
import type Webhook from '../../../models/Webhook';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';

export const WebhooksForm = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [webhooks, setWebhooks] = useState<Array<Webhook>>([]);

  const communityObj = useMemo(
    () => ({
      chain: app.activeChainId(),
    }),
    [],
  );

  useNecessaryEffect(() => {
    const fetch = async () => {
      try {
        const response = await axios.get(`${app.serverUrl()}/getWebhooks`, {
          params: {
            ...communityObj,
            auth: true,
            jwt: app.user.jwt,
          },
        });

        setWebhooks(response.data.result);
      } catch (err) {
        notifyError(err);
        setWebhooks([]);
      }
    };

    fetch();
  }, [communityObj]);

  const createWebhook = async () => {
    try {
      const response = await axios.post(`${app.serverUrl()}/createWebhook`, {
        ...communityObj,
        webhookUrl,
        auth: true,
        jwt: app.user.jwt,
      });

      const newWebhookFromServer = response.data.result;
      const newWebhooks = [...webhooks, newWebhookFromServer];

      setWebhooks(newWebhooks);
      setIsModalOpen(true);
      setWebhookUrl('');
    } catch (err) {
      notifyError(err);
    }
  };

  const deleteWebhook = async (webhook: Webhook) => {
    try {
      await axios.post(`${app.serverUrl()}/deleteWebhook`, {
        ...communityObj,
        webhookUrl: webhook.url,
        auth: true,
        jwt: app.user.jwt,
      });

      const filteredWebhooks = webhooks.filter(({ id }) => id !== webhook.id);
      setWebhooks(filteredWebhooks);
    } catch (err) {
      notifyError(err);
    }
  };

  const updateWebhook = async (
    webhook: Webhook,
    selectedCategories: Array<string>,
  ) => {
    try {
      const response = await axios.post(`${app.serverUrl()}/updateWebhook`, {
        ...communityObj,
        webhookId: webhook.id,
        categories: selectedCategories,
        jwt: app.user.jwt,
      });

      const updatedWebhookFromServer = response.data.result;

      const updatedWebhooks = webhooks.map((hook) =>
        hook.id === updatedWebhookFromServer.id
          ? updatedWebhookFromServer
          : hook,
      );

      setWebhooks(updatedWebhooks);
    } catch (err) {
      notifyError(err);
    }

    setIsModalOpen(false);
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
                  onClick={() => deleteWebhook(webhook)}
                />
                <CWModal
                  size="small"
                  content={
                    <WebhookSettingsModal
                      onModalClose={() => setIsModalOpen(false)}
                      updateWebhook={updateWebhook}
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
          our{' '}
          <a href="https://docs.commonwealth.im/commonwealth/for-admins-and-mods/capabilities/webhooks">
            documentation.
          </a>
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

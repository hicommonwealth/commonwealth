/* @jsx m */

import ClassComponent from 'class_component';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { link, pluralize } from 'helpers';
import $ from 'jquery';
import m from 'mithril';
import { Webhook } from 'models';

import 'pages/manage_community/webhooks_form.scss';
import smartTruncate from 'smart-truncate';

import app from 'state';
import { WebhookSettingsModal } from 'views/modals/webhook_settings_modal';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';

type WebhooksFormAttrs = {
  webhooks: Array<Webhook>;
};

export class WebhooksForm extends ClassComponent<WebhooksFormAttrs> {
  private disabled: boolean;
  private failure: boolean;
  private success: boolean;
  private webhookUrl: string;

  view(vnode: m.Vnode<WebhooksFormAttrs>) {
    const { webhooks } = vnode.attrs;
    const chainOrCommObj = { chain: app.activeChainId() };

    const createWebhook = () => {
      this.disabled = true;
      this.success = false;
      this.failure = false;

      // TODO: Change to POST /webhook
      $.post(`${app.serverUrl()}/createWebhook`, {
        ...chainOrCommObj,
        webhookUrl: this.webhookUrl,
        auth: true,
        jwt: app.user.jwt,
      }).then(
        (result) => {
          this.disabled = false;

          if (result.status === 'Success') {
            this.success = true;

            const newWebhook = Webhook.fromJSON(result.result);

            vnode.attrs.webhooks.push(newWebhook);

            app.modals.create({
              modal: WebhookSettingsModal,
              data: {
                webhook: newWebhook,
                updateSuccessCallback: (webhook) => {
                  const idx = vnode.attrs.webhooks.findIndex(
                    (wh) => wh.id === webhook.id
                  );
                  vnode.attrs.webhooks[idx].categories = webhook.categories;
                },
              },
            });

            this.webhookUrl = '';
          } else {
            this.failure = true;
            notifyError(result.message);
          }

          m.redraw();
        },
        (err) => {
          this.failure = true;
          this.disabled = false;
          notifyError(err?.responseJSON?.error || 'Unknown error');
          m.redraw();
        }
      );
    };

    return (
      <div class="WebhooksForm">
        <div class="webhooks-container">
          {webhooks.map((webhook) => {
            const label =
              webhook.url.indexOf('discord') !== -1
                ? 'Discord'
                : webhook.url.indexOf('slack') !== -1
                ? 'Slack'
                : null;

            return (
              <div class="webhook-row">
                <div class="webhook-info">
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
                <div class="buttons">
                  <CWIconButton
                    iconName="gear"
                    iconSize="small"
                    onclick={(e) => {
                      e.preventDefault();
                      app.modals.create({
                        modal: WebhookSettingsModal,
                        data: {
                          webhook,
                          updateSuccessCallback: (wh) => {
                            const idx = vnode.attrs.webhooks.findIndex(
                              (wh2) => wh2.id === wh.id
                            );
                            vnode.attrs.webhooks[idx].categories =
                              wh.categories;
                          },
                        },
                      });
                    }}
                  />
                  <CWIconButton
                    iconName="trash"
                    iconSize="small"
                    disabled={this.disabled}
                    onclick={(e) => {
                      e.preventDefault();
                      this.disabled = true;
                      this.success = false;
                      this.failure = false;

                      // TODO: Change to DELETE /webhook
                      $.post(`${app.serverUrl()}/deleteWebhook`, {
                        ...chainOrCommObj,
                        webhookUrl: webhook.url,
                        auth: true,
                        jwt: app.user.jwt,
                      }).then(
                        (result) => {
                          this.disabled = false;
                          if (result.status === 'Success') {
                            const idx = vnode.attrs.webhooks.findIndex(
                              (w) => w.url === webhook.url
                            );

                            if (idx !== -1) vnode.attrs.webhooks.splice(idx, 1);

                            this.success = true;

                            notifySuccess('Success! Webhook deleted');
                          } else {
                            this.failure = true;

                            notifyError(result.message);
                          }
                          m.redraw();
                        },
                        (err) => {
                          this.failure = true;

                          this.disabled = false;

                          notifyError(
                            err?.responseJSON?.error || 'Unknown error'
                          );

                          m.redraw();
                        }
                      );
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {webhooks.length === 0 && (
          <CWText className="no-webhooks-text">
            No webhooks yet. Slack, Discord, and Telegram webhooks are
            supported. For more information and examples for setting these up,
            please view our
            {link('a', 'https://docs.commonwealth.im', [' documentation.'])}
          </CWText>
        )}
        <CWTextInput
          placeholder="https://hooks.slack.com/services/"
          value={this.webhookUrl}
          oninput={(e) => {
            this.webhookUrl = e.target.value;
          }}
        />
        <CWButton
          disabled={!this.webhookUrl}
          label="Add webhook"
          onclick={createWebhook}
        />
      </div>
    );
  }
}

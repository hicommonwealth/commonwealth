/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import * as Cui from 'construct-ui';

import 'pages/manage_community/webhooks_form.scss';

import app from 'state';
import { Webhook } from 'models';
import { notifySuccess, notifyError } from 'controllers/app/notifications';
import WebhookSettingsModal from 'views/modals/webhook_settings_modal';
import { link, pluralize } from 'helpers';

type WebhooksFormAttrs = {
  webhooks: Webhook[];
};

export class WebhooksForm implements m.ClassComponent<WebhooksFormAttrs> {
  private disabled: boolean;
  private failure: boolean;
  private success: boolean;

  view(vnode) {
    const { webhooks } = vnode.attrs;
    const chainOrCommObj = { chain: app.activeChainId() };

    const createWebhook = (e) => {
      e.preventDefault();
      const $webhookInput = $(e.target)
        .closest('form')
        .find('[name="webhookUrl"]');
      const webhookUrl = $webhookInput.val();
      if (webhookUrl === null) return;

      this.disabled = true;
      this.success = false;
      this.failure = false;

      // TODO: Change to POST /webhook
      $.post(`${app.serverUrl()}/createWebhook`, {
        ...chainOrCommObj,
        webhookUrl,
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
            $webhookInput.val('');
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
      <Cui.Form class="WebhooksForm">
        <Cui.FormGroup>
          <Cui.List interactive={false}>
            {webhooks.map((webhook) => {
              const label =
                webhook.url.indexOf('discord') !== -1
                  ? 'Discord'
                  : webhook.url.indexOf('slack') !== -1
                  ? 'Slack'
                  : null;
              return (
                <Cui.ListItem
                  contentLeft={
                    <>
                      <div class="top" style="display: block;">
                        {webhook.url}
                      </div>
                      <div class="bottom">
                        {label && <Cui.Tag size="xs" label={label} />}
                        <Cui.Button
                          class="settings-button"
                          iconRight={Cui.Icons.SETTINGS}
                          rounded={true}
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
                        <Cui.Tag
                          size="xs"
                          label={pluralize(webhook.categories.length, 'event')}
                        />
                      </div>
                    </>
                  }
                  contentRight={
                    <Cui.Icon
                      name={Cui.Icons.X}
                      class={this.disabled ? 'disabled' : ''}
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
                              if (idx !== -1)
                                vnode.attrs.webhooks.splice(idx, 1);
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
                  }
                />
              );
            })}
            {webhooks.length === 0 && (
              <Cui.ListItem
                contentLeft={
                  <>
                    No webhooks yet. Slack, Discord, and Telegram webhooks are
                    supported. For more information and examples for setting
                    these up, please view our
                    {link('a', 'https://docs.commonwealth.im', [
                      ' documentation.',
                    ])}
                  </>
                }
              />
            )}
          </Cui.List>
        </Cui.FormGroup>
        <Cui.FormGroup>
          <Cui.Input
            name="webhookUrl"
            id="webhookUrl"
            autocomplete="off"
            placeholder="https://hooks.slack.com/services/"
          />
          <Cui.Button
            class="admin-panel-tab-button"
            intent="none"
            label="Add webhook"
            onclick={createWebhook}
            rounded={true}
          />
        </Cui.FormGroup>
      </Cui.Form>
    );
  }
}

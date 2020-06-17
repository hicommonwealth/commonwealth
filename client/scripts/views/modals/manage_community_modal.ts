import 'modals/manage_community_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';

import { CompactModalExitButton } from 'views/modal';

interface IWebhookData {
  url: string;
}

interface IWebhooksFormAttrs {
  webhooks: IWebhookData[];
}

interface IWebhooksFormState {
  success: boolean;
  successMsg: string;
  failure: boolean;
  disabled: boolean;
  error: string;
}

const WebhooksForm: m.Component<IWebhooksFormAttrs, IWebhooksFormState> = {
  view: (vnode: m.VnodeDOM<IWebhooksFormAttrs, IWebhooksFormState>) => {
    const { webhooks } = vnode.attrs;
    const chainOrCommObj = (app.chain) ? { chain: app.activeChainId() } : { community: app.activeCommunityId() };

    const createWebhook = (e) => {
      e.preventDefault();
      const $webhookInput = $(e.target).closest('form').find('[name="webhookUrl"]');
      const webhookUrl = $webhookInput.val();
      if (webhookUrl === null) return;

      vnode.state.disabled = true;
      vnode.state.success = false;
      vnode.state.failure = false;
      // TODO: Change to POST /webhook
      $.post(`${app.serverUrl()}/createWebhook`, {
        ...chainOrCommObj,
        webhookUrl,
        address: app.user.activeAccount.address,
        auth: true,
        jwt: app.login.jwt,
      }).then((result) => {
        vnode.state.disabled = false;
        if (result.status === 'Success') {
          vnode.state.success = true;
          vnode.state.successMsg = 'Success! Webhook created';
          vnode.attrs.webhooks.push({
            url: `${webhookUrl}`
          });
          $webhookInput.val('');
        } else {
          vnode.state.failure = true;
          vnode.state.error = result.message;
        }
        m.redraw();
      }, (err) => {
        vnode.state.failure = true;
        vnode.state.disabled = false;
        if (err.responseJSON) vnode.state.error = err.responseJSON.error;
        m.redraw();
      });
    };

    return m('form.WebhooksForm', [
      m('h3', 'Webhooks'),
      webhooks.map((webhook) => {
        return m('.webhook', [
          m('.webhook-url', webhook.url),
          m('a', {
            href: '#',
            class: vnode.state.disabled ? 'disabled' : '',
            type: 'submit',
            onclick: (e) => {
              e.preventDefault();

              vnode.state.disabled = true;
              vnode.state.success = false;
              vnode.state.failure = false;
              // TODO: Change to DELETE /webhook
              $.post(`${app.serverUrl()}/deleteWebhook`, {
                ...chainOrCommObj,
                webhookUrl: webhook.url,
                auth: true,
                jwt: app.login.jwt,
              }).then((result) => {
                vnode.state.disabled = false;
                if (result.status === 'Success') {
                  const idx = vnode.attrs.webhooks.findIndex((w) => `${w.url}` === `${webhook.url}`);
                  if (idx !== -1) vnode.attrs.webhooks.splice(idx, 1);
                  vnode.state.success = true;
                  vnode.state.successMsg = 'Webhook deleted!';
                } else {
                  vnode.state.failure = true;
                  vnode.state.error = result.message;
                }
                m.redraw();
              }, (err) => {
                vnode.state.failure = true;
                vnode.state.disabled = false;
                if (err.responseJSON) vnode.state.error = err.responseJSON.error;
                m.redraw();
              });
            }
          }, 'Remove')
        ]);
      }),
      webhooks.length === 0 && m('.no-webhooks', 'None'),
      m('label', {
        for: 'webhookUrl',
      }, 'Add new webhook'),
      m('input[type="text"].form-field', {
        name: 'webhookUrl',
        id: 'webhookUrl',
        autocomplete: 'off',
        placeholder: 'https://hooks.slack.com/services/',
      }),
      m('button', {
        class: vnode.state.disabled ? 'disabled' : '',
        type: 'submit',
        onclick: createWebhook,
      }, 'Add webhook'),
      vnode.state.success && m('.success-message', vnode.state.successMsg),
      vnode.state.failure && m('.error-message', [
        vnode.state.error || 'An error occurred'
      ]),
    ]);
  }
};

interface IManageCommunityModalAttrs {
  webhooks: IWebhookData[];
}

const ManageCommunityModal: m.Component<IManageCommunityModalAttrs> = {
  view: (vnode) => {
    const { webhooks } = vnode.attrs;
    return m('.ManageCommunityModal', [
      m('.compact-modal-title', [
        m('h3', 'Manage Community'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m(WebhooksForm, { webhooks }),
      ]),
    ]);
  }
};

export default ManageCommunityModal;

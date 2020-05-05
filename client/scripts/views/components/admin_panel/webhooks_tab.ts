import m from 'mithril';
import $ from 'jquery';
import { Button, Icon, Icons, ListItem, Input,
  List, Form, FormGroup } from 'construct-ui';
import app from 'state';


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
  view: (vnode) => {
    const { webhooks } = vnode.attrs;
    const chainOrCommObj = app.chain ? { chain: app.activeChainId() } : { community: app.activeCommunityId() };

    const createWebhook = (e) => {
      e.preventDefault();
      const $webhookInput = $(e.target).closest('form').find('[name="webhookUrl"]');
      const webhookUrl = $webhookInput.val();
      if (webhookUrl === null) return;

      vnode.state.disabled = true;
      vnode.state.success = false;
      vnode.state.failure = false;

      $.post(`${app.serverUrl()}/createWebhook`, {
        ...chainOrCommObj,
        webhookUrl,
        address: app.vm.activeAccount.address,
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


    return m(Form, {
      class: 'WebhooksForm',
    }, [
      m(FormGroup, [
        m('h3', 'Active webhooks:'),
        m(List, {
          interactive: false,
          class: 'ActiveWebhooks'
        }, [
          webhooks.map((webhook) => {
            return m(ListItem, {
              contentLeft: webhook.url,
              contentRight: m(Icon, {
                name: Icons.X,
                class: vnode.state.disabled ? 'disabled' : '',
                onclick: (e) => {
                  e.preventDefault();
                  vnode.state.disabled = true;
                  vnode.state.success = false;
                  vnode.state.failure = false;
                  $.post(`${app.serverUrl()}/deleteWebhook`, {
                    ...chainOrCommObj,
                    webhookUrl: webhook.url,
                    auth: true,
                    jwt: app.login.jwt,
                  }).then((result) => {
                    vnode.state.disabled = false;
                    if (result.status === 'Success') {
                      const idx = vnode.attrs.webhooks.findIndex((w) => w.url === `${webhook.url}`);
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
              }),
            });
          }),
          webhooks.length === 0 && m(ListItem, {
            contentLeft: 'No webhooks yet.'
          }),
        ]),
      ]),
      m(FormGroup, [
        m('h3', { for: 'webhookUrl', }, 'Add new webhook:'),
        m(Input, {
          name: 'webhookUrl',
          id: 'webhookUrl',
          autocomplete: 'off',
          placeholder: 'https://hooks.slack.com/services/',
        }),
        m(Button, {
          class: 'AdminTabPanelButton',
          type: 'submit',
          label: 'Add webhook',
          onclick: createWebhook,
        }),
        vnode.state.success && m('h3.success-message', vnode.state.successMsg),
        vnode.state.failure && m('h3.error-message', [
          vnode.state.error || 'An error occurred'
        ]),
      ]),
    ]);
  }
};

const WebhooksTab: m.Component<{webhooks: IWebhookData[]}> = {
  view: (vnode) => {
    const { webhooks } = vnode.attrs;
    return m(WebhooksForm, { webhooks });
  }
};

export default WebhooksTab;

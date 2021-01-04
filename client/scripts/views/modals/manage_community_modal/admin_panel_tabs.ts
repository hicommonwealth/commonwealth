import m from 'mithril';
import $ from 'jquery';

import { Tabs, TabItem, Button, Input, FormGroup, ListItem, Icons, Icon, List, RadioGroup, Form, Tag } from 'construct-ui';
import app from 'state';
import { RolePermission, Webhook } from 'models';
import { notifySuccess, notifyError } from 'controllers/app/notifications';
import WebhookSettingsModal from '../webhook_settings_modal';
import { pluralize } from 'helpers';

interface IWebhooksFormAttrs {
  webhooks: Webhook[];
}

interface IWebhooksFormState {
  success: boolean;
  failure: boolean;
  disabled: boolean;
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
      // TODO: Change to POST /webhook
      $.post(`${app.serverUrl()}/createWebhook`, {
        ...chainOrCommObj,
        webhookUrl,
        address: app.user.activeAccount.address,
        auth: true,
        jwt: app.user.jwt,
      }).then((result) => {
        vnode.state.disabled = false;
        if (result.status === 'Success') {
          vnode.state.success = true;
          notifySuccess('Webhook saved!');
          const newWebhook = Webhook.fromJSON(result.result);
          vnode.attrs.webhooks.push(newWebhook);
          app.modals.create({
            modal: WebhookSettingsModal,
            data: {
              webhook: newWebhook,
              updateSuccessCallback: (webhook) => {
                const idx = vnode.attrs.webhooks.findIndex((wh) => wh.id === webhook.id);
                vnode.attrs.webhooks[idx].categories = webhook.categories;
              }
            }
          });
          $webhookInput.val('');
        } else {
          vnode.state.failure = true;
          notifyError(result.message);
        }
        m.redraw();
      }, (err) => {
        vnode.state.failure = true;
        vnode.state.disabled = false;
        notifyError(err?.responseJSON?.error || 'Unknown error');
        m.redraw();
      });
    };


    return m(Form, {
      class: 'WebhooksForm',
    }, [
      m(FormGroup, [
        m(List, {
          interactive: false,
          class: 'active-webhooks'
        }, [
          webhooks.map((webhook) => {
            const label = (webhook.url.indexOf('discord') !== -1) ? 'Discord'
              : (webhook.url.indexOf('slack') !== -1) ? 'Slack'
                : null;
            return m(ListItem, {
              contentLeft: [
                m('.top', { style: `display: 'block';`}, webhook.url),
                m('.bottom', [
                  label && m(Tag, { label }),
                  m(Button, {
                    class: 'settings-button',
                    label: m(Icon, { name: Icons.SETTINGS, size: 'xs' }),
                    onclick: (e) => {
                      e.preventDefault();
                      app.modals.create({
                        modal: WebhookSettingsModal,
                        data: {
                          webhook,
                          updateSuccessCallback: (webhook) => {
                            const idx = vnode.attrs.webhooks.findIndex((wh) => wh.id === webhook.id);
                            vnode.attrs.webhooks[idx].categories = webhook.categories;
                          }
                        }
                      });
                      return;
                    }
                  }),
                  m(Tag, { label: pluralize(webhook.categories.length, 'event') }),
                ])],
              contentRight: m(Icon, {
                name: Icons.X,
                class: vnode.state.disabled ? 'disabled' : '',
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
                    jwt: app.user.jwt,
                  }).then((result) => {
                    vnode.state.disabled = false;
                    if (result.status === 'Success') {
                      const idx = vnode.attrs.webhooks.findIndex((w) => w.url === webhook.url);
                      if (idx !== -1) vnode.attrs.webhooks.splice(idx, 1);
                      vnode.state.success = true;
                      notifySuccess('Success! Webhook deleted');
                    } else {
                      vnode.state.failure = true;
                      notifyError(result.message);
                    }
                    m.redraw();
                  }, (err) => {
                    vnode.state.failure = true;
                    vnode.state.disabled = false;
                    notifyError(err?.responseJSON?.error || 'Unknown error');
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
        m(Input, {
          name: 'webhookUrl',
          id: 'webhookUrl',
          autocomplete: 'off',
          placeholder: 'https://hooks.slack.com/services/',
        }),
        m(Button, {
          class: 'admin-panel-tab-button',
          intent: 'none',
          label: 'Add webhook',
          style: 'margin: 10px 0',
          onclick: createWebhook,
        }),
      ]),
    ]);
  }
};


interface IUpgradeRolesFormAttrs {
  roleData: any[];
  onRoleUpgrade: Function;
}

interface IUpgradeRolesFormState {
  role: string;
  user: string;
}

const UpgradeRolesForm: m.Component<IUpgradeRolesFormAttrs, IUpgradeRolesFormState> = {
  view: (vnode) => {
    const { roleData, onRoleUpgrade } = vnode.attrs;
    const noAdmins = roleData.filter((role) => {
      return (role.permission === RolePermission.member) || (role.permission === RolePermission.moderator);
    });
    const names: string[] = noAdmins.map((role) => {
      const displayName = app.profiles.getProfile(role.Address.chain, role.Address.address).displayName;
      const roletext = (role.permission === 'moderator') ? '(moderator)' : '';
      return `${displayName}: ${role.Address.address.slice(0, 6)}...${roletext}`;
    });
    const chainOrCommObj = app.community
      ? { community: app.activeCommunityId() }
      : { chain: app.activeChainId() };
    return m('.UpgradeRolesForm', [
      m(RadioGroup, {
        name: 'members/mods',
        class: 'members-list',
        options: names,
        value: vnode.state.user,
        onchange: (e: Event) => { vnode.state.user = (e.currentTarget as HTMLInputElement).value; },
      }),
      m(RadioGroup, {
        name: 'roles',
        options: ['Admin', 'Moderator'],
        value: vnode.state.role,
        onchange: (e: Event) => { vnode.state.role = (e.currentTarget as HTMLInputElement).value; },
      }),
      m('.button-container', [
        m(Button, {
          class: 'admin-panel-tab-button',
          label: 'Upgrade Member',
          disabled: (!vnode.state.role || !vnode.state.user),
          onclick: () => {
            const indexOfName = names.indexOf(vnode.state.user);
            const user = noAdmins[indexOfName];
            const newRole = (vnode.state.role === 'Admin') ? 'admin'
              : (vnode.state.role === 'Moderator') ? 'moderator' : '';
            if (!user) return;
            if (!newRole) return;
            $.post(`${app.serverUrl()}/upgradeMember`, {
              new_role: newRole,
              address: user.Address.address,
              ...chainOrCommObj,
              jwt: app.user.jwt,
            }).then((r) => {
              if (r.status === 'Success') {
                notifySuccess('Member upgraded');
                delete vnode.state.user;
                delete vnode.state.role;
                m.redraw();
              } else {
                notifyError('Upgrade failed');
              }
              onRoleUpgrade(user, r.result);
            });
          },
        }),
      ]),
    ]);
  }
};

interface IAdminPanelTabsAttrs {
  defaultTab: number;
  roleData: any[];
  onRoleUpgrade: Function;
  webhooks: Webhook[];
}

const AdminPanelTabs: m.Component<IAdminPanelTabsAttrs, {index: number, }> = {
  oninit: (vnode) => {
    vnode.state.index = vnode.attrs.defaultTab;
  },
  view: (vnode) => {
    return m('.AdminPanelTabs', [
      m(Tabs, {
        align: 'left',
        bordered: true,
        fluid: true,
      }, [
        m(TabItem, {
          label: 'Webhooks',
          active: vnode.state.index === 2,
          onclick: () => { vnode.state.index = 2; },
        }),
        m(TabItem, {
          label: 'Admins',
          active: vnode.state.index === 1,
          onclick: () => { vnode.state.index = 1; },
        }),
      ]),
      (vnode.state.index === 1)
        && m(UpgradeRolesForm, {
          roleData: vnode.attrs.roleData,
          onRoleUpgrade: (x, y) => vnode.attrs.onRoleUpgrade(x, y),
        }),
      (vnode.state.index === 2)
        && m(WebhooksForm, { webhooks: vnode.attrs.webhooks }),
    ]);
  },
};

export default AdminPanelTabs;

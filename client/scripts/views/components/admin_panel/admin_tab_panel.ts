import m from 'mithril';
import $ from 'jquery';

import { Tabs, TabItem, Button, Input, FormGroup, ListItem, Icons, Icon, List, RadioGroup, Form } from 'construct-ui';
import app from 'state';
import { RolePermission } from 'models';


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
          class: 'active-webhooks'
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
                      const idx = vnode.attrs.webhooks.findIndex((w) => w.url === webhook.url);
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
          class: 'admin-tab-panel-button',
          intent: 'none',
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
      m('h3', 'Select Member:'),
      m(RadioGroup, {
        name: 'members/mods',
        class: 'members-list',
        options: names,
        value: vnode.state.user,
        onchange: (e: Event) => { vnode.state.user = (e.currentTarget as HTMLInputElement).value; },
      }),
      m('h3', 'Role Type:'),
      m(RadioGroup, {
        name: 'roles',
        options: ['Admin', 'Moderator'],
        value: vnode.state.role,
        onchange: (e: Event) => { vnode.state.role = (e.currentTarget as HTMLInputElement).value; },
      }),
      m(Button, {
        class: 'admin-tab-panel-button',
        label: 'Upgrade Member',
        onclick: () => {
          const indexOfName = names.indexOf(vnode.state.user);
          const user = noAdmins[indexOfName];
          const newRole = (vnode.state.role === 'Admin') ? 'admin'
            : (vnode.state.role === 'Moderator') ? 'moderator' : '';
          if (!user) return;
          $.post(`${app.serverUrl()}/upgradeMember`, {
            new_role: newRole,
            address: user.Address.address,
            ...chainOrCommObj,
            jwt: app.login.jwt,
          }).then((r) => {
            onRoleUpgrade(user, r.result);
          });
        },
      }),
    ]);
  }
};

interface IAdminTabPanelAttrs {
  defaultTab: number;
  roleData: any[];
  onRoleUpgrade: Function;
  webhooks;
}

const AdminTabPanel: m.Component<IAdminTabPanelAttrs, {index: number, }> = {
  oninit: (vnode) => {
    vnode.state.index = vnode.attrs.defaultTab;
  },
  view: (vnode) => {
    return m('.AdminTabPanel', [
      m(Tabs, {
        align: 'left',
        bordered: true,
        fluid: true,
      }, [
        m(TabItem, {
          label: 'Promote Admins',
          active: vnode.state.index === 1,
          onclick: () => { vnode.state.index = 1; },
        }),
        m(TabItem, {
          label: 'Webhooks',
          active: vnode.state.index === 2,
          onclick: () => { vnode.state.index = 2; },
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

export default AdminTabPanel;

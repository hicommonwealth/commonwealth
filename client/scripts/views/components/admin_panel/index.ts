import m, { Vnode } from 'mithril';
import $ from 'jquery';
import { OffchainThread, OffchainTag, CommunityInfo, RolePermission, ChainInfo, ChainNetwork, RoleInfo } from 'models';
import { Button, Classes, Dialog, Icon, Icons, Tag, TagInput, ListItem, Table, Input, List, TextArea, Switch, Tabs, TabItem, RadioGroup, Form, FormGroup, FormLabel } from 'construct-ui';
import app from 'state';
import { sortAdminsAndModsFirst } from 'views/pages/discussions/roles';
import User from '../widgets/user';
import 'components/admin_panel.scss';

const RoleRow: m.Component<{ roledata?, onRoleUpdate?: Function }> = {
  view: (vnode) => {
    if (!vnode.attrs.roledata || vnode.attrs.roledata.length === 0) return;
    const chainOrCommObj = app.community
      ? { community: app.activeCommunityId() }
      : { chain: app.activeChainId() };
    return m('.RoleData', [
          vnode.attrs.roledata?.map((role) => {
            return m('.role-item', [
              m(User, {
                user: [role.Address.address, role.Address.chain],
                linkify: true,
                tooltip: true,
              }),
              m(Icon, {
                name: Icons.X,
                size: 'xs',
                class: 'x',
                onclick: async () => {
                  await $.post(`${app.serverUrl()}/upgradeMember`, {
                    ...chainOrCommObj,
                    new_role: 'member',
                    address: role.Address.address,
                    jwt: app.login.jwt,
                  }).then((res) => {
                    console.dir(res);
                    if (res.status !== 'Success') {
                      throw new Error(`Got unsuccessful status: ${res.status}`);
                    }
                    vnode.attrs.onRoleUpdate(role, res.result);
                  }).catch((e) => console.error('Failed To demote admin'));
                },
              }),
            ]);
          })
    ]);
  }
};

interface ICommunityMetadataState {
    name: string;
    description: string;
    url: string;
    privacyToggled: boolean;
    invitesToggled: boolean;
}

interface IChainCommunityAttrs {
  community?: CommunityInfo;
  chain?: ChainInfo;
  onChangeHandler: Function;
  onRoleUpdate: Function;
  admins;
  mods;
}

interface ITableRowAttrs {
  title: string;
  defaultValue: string;
  disabled?: boolean;
  onChangeHandler: Function;
}

const TableRow: m.Component<ITableRowAttrs> = {
  view: (vnode) => {
    return m('tr', {
      class: 'TableRow',
    }, [
      m('td', { class: 'title-column', }, vnode.attrs.title),
      m('td', [
        m(Input, {
          defaultValue: vnode.attrs.defaultValue,
          fluid: true,
          disabled: vnode.attrs.disabled || false,
          onkeyup: (e) => { vnode.attrs.onChangeHandler((e.target as any).value); },
        }),
      ]),
    ]);
  }
};

interface IToggleRowAttrs {
  title: string;
  defaultValue: boolean;
  disabled?: boolean;
  onToggle: Function;
}

const ToggleRow: m.Component<IToggleRowAttrs, {toggled: boolean, checked: boolean}> = {
  oninit: (vnode) => {
    vnode.state.toggled = false;
    vnode.state.checked = vnode.attrs.defaultValue;
  },
  view: (vnode) => {
    return m('tr', [
      m('td', vnode.attrs.title),
      m('td', [
        m(Switch, {
          checked: vnode.state.checked,
          disabled: vnode.attrs.disabled || false,
          onchange: () => {
            vnode.state.toggled = !vnode.state.toggled;
            vnode.state.checked = !vnode.state.checked;
            vnode.attrs.onToggle(vnode.state.toggled);
          },
        })
      ])
    ]);
  },
};

const CommunityMetadata: m.Component<IChainCommunityAttrs, ICommunityMetadataState> = {
  oninit: (vnode) => {
    vnode.state.name = vnode.attrs.community.name;
    vnode.state.description = vnode.attrs.community.description;
    vnode.state.url = vnode.attrs.community.id;
  },
  view: (vnode) => {
    return m('.CommunityMetadata', [m(Table, {
      bordered: false,
      interactive: false,
      striped: false,
      class: 'community metadataSection',
    }, [
      m(TableRow, {
        title: 'Name',
        defaultValue: vnode.state.name,
        onChangeHandler: (v) => { vnode.state.name = v; },
      }),
      m(TableRow, {
        title: 'Description',
        defaultValue: vnode.state.description,
        onChangeHandler: (v) => { vnode.state.description = v; },
      }),
      m(TableRow, {
        title: 'URL',
        defaultValue: `commonwealth.im/${vnode.state.url}`,
        disabled: true,
        onChangeHandler: (v) => { vnode.state.url = v; },
      }),
      m(ToggleRow, {
        title: 'Private Community?',
        defaultValue: vnode.attrs.community.privacyEnabled,
        onToggle: (v) => { vnode.state.privacyToggled = !vnode.state.privacyToggled; },
      }),
      m(ToggleRow, {
        title: 'Invites Enabled?',
        defaultValue: vnode.attrs.community.invitesEnabled,
        onToggle: (v) => { vnode.state.invitesToggled = !vnode.state.invitesToggled; },
      }),
      m('tr', [
        m('td', 'Admins'),
        m('td', [ m(RoleRow, {
          roledata: vnode.attrs.admins,
          onRoleUpdate: (x, y) => { vnode.attrs.onRoleUpdate(x, y); },
        }), ]),
      ]),
      vnode.attrs.mods.length > 0 &&
        m('tr', [
          m('td', 'Moderators'),
          m('td', [ m(RoleRow, {
            roledata: vnode.attrs.mods,
            onRoleUpdate: (x, y) => { vnode.attrs.onRoleUpdate(x, y); },
          }), ])
        ]),
    ]),
    m(Button, {
      label: 'submit',
      onclick: () => {
        vnode.attrs.community.updateCommunityData(
          vnode.state.name,
          vnode.state.description,
          vnode.state.privacyToggled,
          vnode.state.invitesToggled,
        );
        vnode.attrs.onChangeHandler(false);
      },
    }),
    ]);
  },
};

interface IChainMetadataState {
  name: string;
  description: string;
  url: string;
  loadingFinished: boolean;
  loadingStarted: boolean;
  iconUrl: string;
  network: ChainNetwork;
  symbol: string;
}

const ChainMetadata: m.Component<IChainCommunityAttrs, IChainMetadataState> = {
  oninit: (vnode) => {
    vnode.state.name = vnode.attrs.chain.name;
    vnode.state.description = vnode.attrs.chain.description;
    vnode.state.url = vnode.attrs.chain.id;
    vnode.state.iconUrl = vnode.attrs.chain.iconUrl;
    vnode.state.network = vnode.attrs.chain.network;
    vnode.state.symbol = vnode.attrs.chain.symbol;
  },
  view: (vnode) => {
    return m('.ChainMetadata', [
      m(Table, {
        bordered: false,
        interactive: false,
        striped: false,
        class: 'chain metadataSection',
      }, [
        m(TableRow, {
          title: 'Name',
          defaultValue: vnode.state.name,
          onChangeHandler: (v) => { vnode.state.name = v; },
        }),
        m(TableRow, {
          title: 'Description',
          defaultValue: vnode.state.description,
          onChangeHandler: (v) => { vnode.state.description = v; },
        }),
        m(TableRow, {
          title: 'URL',
          defaultValue: `commonwealth.im/${vnode.state.url}`,
          disabled: true,
          onChangeHandler: (v) => { vnode.state.url = v; },
        }),
        m(TableRow, {
          title: 'Network',
          defaultValue: vnode.state.network,
          disabled: true,
          onChangeHandler: (v) => { vnode.state.network = v; },
        }),
        m(TableRow, {
          title: 'Symbol',
          defaultValue: vnode.state.symbol,
          disabled: true,
          onChangeHandler: (v) => { vnode.state.symbol = v; },
        }),
        m(TableRow, {
          title: 'Icon',
          defaultValue: vnode.state.iconUrl,
          disabled: true,
          onChangeHandler: (v) => { vnode.state.iconUrl = v; },
        }),
        m('tr', [
          m('td', 'Admins'),
          m('td', [ m(RoleRow, {
            roledata: vnode.attrs.admins,
            onRoleUpdate: (x, y) => { vnode.attrs.onRoleUpdate(x, y); },
          }), ]),
        ]),
        vnode.attrs.mods.length > 0 &&
          m('tr', [
            m('td', 'Moderators'),
            m('td', [ m(RoleRow, {
              roledata: vnode.attrs.mods,
              onRoleUpdate: (x, y) => { vnode.attrs.onRoleUpdate(x, y); },
            }), ])
          ]),
      ]),
      m(Button, {
        label: 'submit',
        onclick: () => {
          vnode.attrs.chain.updateChainData(vnode.state.name, vnode.state.description);
          vnode.attrs.onChangeHandler(false);
        },
      }),
    ]);
  },
};

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
      class: 'Webhooks',
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
                      const idx = vnode.attrs.webhooks.findIndex((webhook) => webhook.url === `${webhook.url}`);
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
          class: 'PanelButton',
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

const UpgradeRolesTab: m.Component<{roleData: any[], onRoleUpgrade: Function, }, {role: string, user: string, }> = {
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
    return m('.UpgradeRoles', [
      m('h3', 'Select Member:'),
      m(RadioGroup, {
        name: 'members/mods',
        class: 'membersList',
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
        class: 'PanelButton',
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

interface ITabPanelAttrs {
  defaultTab: number;
  roleData: any[];
  onRoleUpgrade: Function;
  webhooks;
}

const TabPanel: m.Component<ITabPanelAttrs, {index: number, }> = {
  oninit: (vnode) => {
    vnode.state.index = vnode.attrs.defaultTab;
  },
  view: (vnode) => {
    return m('.TabPanel', [
      m(Tabs, {
        align: 'center',
        bordered: true,
        fluid: true,
        size: 'xs',
      }, [
        m(TabItem, {
          label: 'Roles',
          active: vnode.state.index === 1,
          onclick: () => { vnode.state.index = 1; },
        }),
        m(TabItem, {
          label: 'Webhooks',
          active: vnode.state.index === 2,
          onclick: () => { vnode.state.index = 2; },
        }),
      ]),
      (vnode.state.index === 1) &&
        m(UpgradeRolesTab, {
          roleData: vnode.attrs.roleData,
          onRoleUpgrade: (x, y) => vnode.attrs.onRoleUpgrade(x, y),
        }),
      (vnode.state.index === 2) &&
        m(WebhooksTab, { webhooks: vnode.attrs.webhooks }),
    ]);
  },
};

interface IPanelState {
  roleData: RoleInfo[];
  webhooks;
  loadingFinished: boolean;
  loadingStarted: boolean;
}

const Panel: m.Component<{onChangeHandler: Function}, IPanelState> = {
  view: (vnode) => {
    const chainOrCommObj = app.chain ? { chain: app.activeChainId() } : { community: app.activeCommunityId() };
    const isCommunity = !!app.activeCommunityId();
    const loadRoles = async () => {
      try {
        const bulkMembers = await $.get(`${app.serverUrl()}/bulkMembers`, chainOrCommObj);
        if (bulkMembers.status !== 'Success') throw new Error('Could not fetch members');
        const webhooks = await $.get(`${app.serverUrl()}/getWebhooks`,
                                       { ...chainOrCommObj, auth: true, jwt: app.login.jwt });
        if (webhooks.status !== 'Success') throw new Error(`Could not fetch community webhooks`);
        vnode.state.webhooks = webhooks.result;
        vnode.state.roleData = bulkMembers.result;
        vnode.state.loadingFinished = true;
        m.redraw();
      } catch (err) {
        vnode.state.roleData = [];
        vnode.state.loadingFinished = true;
        m.redraw();
        console.error(err);
      }
    };

    if (!vnode.state.loadingStarted) {
      vnode.state.loadingStarted = true;
      loadRoles();
    }

    const admins = [];
    const mods = [];
    if (vnode.state.roleData?.length > 0) {
      vnode.state.roleData.sort(sortAdminsAndModsFirst).map((role) => {
        if (role.permission === RolePermission.admin) admins.push(role);
        else if (role.permission === RolePermission.moderator) mods.push(role);
      });
    }

    return m('.Panel', [
      m('.panel-left', [
        isCommunity
          ? vnode.state.loadingFinished
            && m(CommunityMetadata, {
              community: app.community.meta,
              admins,
              mods,
              onRoleUpdate: (x, y) => {
                y.Address = x.Address;
                vnode.state.roleData.splice(vnode.state.roleData.indexOf(x), 1, y);
                m.redraw();
              },
              onChangeHandler: vnode.attrs.onChangeHandler,
            })
          : vnode.state.loadingFinished
            && m(ChainMetadata, {
              chain: app.config.chains.getById(app.activeChainId()),
              admins,
              mods,
              onChangeHandler: vnode.attrs.onChangeHandler,
              onRoleUpdate: (x, y) => {
                y.Address = x.Address;
                vnode.state.roleData.splice(vnode.state.roleData.indexOf(x), 1, y);
                m.redraw();
              },
            }),
      ]),
      m('.panel-right', [
        vnode.state.loadingFinished &&
          m(TabPanel, {
            roleData: vnode.state.roleData,
            defaultTab: 1,
            onRoleUpgrade: (x, y) => {
              y.Address = x.Address;
              vnode.state.roleData.splice(vnode.state.roleData.indexOf(x), 1, y);
              m.redraw();
            },
            webhooks: vnode.state.webhooks,
          }),
      ]),
    ]);
  }
};

const AdminPanel: m.Component<{}, {isOpen: boolean}> = {
  oninit: (vnode) => {
    vnode.state.isOpen = false;
  },
  oncreate: (vnode) => {
  },
  view: (vnode) => {
    return [m(ListItem, {
      href: '#',
      class: 'AdminPanel',
      onclick: (e) => { e.preventDefault(); vnode.state.isOpen = true; },
      label: 'Manage Community',
      contentLeft: m(Icon, { name: Icons.SETTINGS, }),
    }),
    m(Dialog, {
      autofocus: true,
      basic: false,
      closeOnEscapeKey: true,
      closeOnOutsideClick: true,
      class: 'adminDialog',
      content: m(Panel, {
        onChangeHandler: (v) => { vnode.state.isOpen = v; },
      }),
      hasBackdrop: true,
      isOpen: vnode.state.isOpen,
      inline: false,
      onClose: () => { vnode.state.isOpen = false; },
      title:'Manage Community',
      transitionDuration: 200,
      footer: null,
    })];
  },
};

export default AdminPanel;

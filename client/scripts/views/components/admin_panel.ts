import m, { Vnode } from 'mithril';
import $ from 'jquery';
import { OffchainThread, OffchainTag, CommunityInfo, RolePermission, ChainInfo, ChainNetwork, RoleInfo } from 'models';
import { Button, Classes, Dialog, Icon, Icons, Tag, TagInput, ListItem, Table, Input, List, TextArea, Switch } from 'construct-ui';
import app from 'state';
import { sortAdminsAndModsFirst } from 'views/pages/discussions/roles';
import User from './widgets/user';
import 'components/admin_panel.scss';


const RoleRow: m.Component<{ roledata?, onRoleUpdate?: Function }> = {
  view: (vnode) => {
    return (vnode.attrs.roledata?.length > 0) &&
      m('RoleData', [
          vnode.attrs.roledata?.map((role) => {
            const chainOrCommObj = (app.activeChainId()) ? { chain: app.activeChainId() } : { community: app.activeCommunityId() };
            return m('.role-item', { style: 'display: inline-block; padding-right: 6px;' }, [
              m(User, {
                user: [role.Address.address, role.Address.chain],
                linkify: true,
                tooltip: true,
              }),
              m(Icon, {
                name: Icons.X,
                size: 'xs',
                style: 'padding-left: 2px;',
                onclick: () => {
                  $.post(`${app.serverUrl()}/upgradeMember`, {
                    ...chainOrCommObj,
                    new_role: 'member',
                    address: role.Address.address,
                    jwt: app.login.jwt,
                  }).then((res) => {
                    if (res.status !== 'Success') {
                      throw new Error(`got unsuccessful status: ${res.status}`);
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

const TableRow: m.Component<{title: string, defaultValue: string, disabled?: boolean, onChangeHandler: Function}> = {
  view: (vnode) => {
    return m('tr', [
      m('td', { style: 'width: 100px' }, vnode.attrs.title),
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

const ToggleRow: m.Component<{title: string, defaultValue: boolean, disabled?: boolean, onToggle: Function}, {toggled: boolean, checked: boolean}> = {
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
    return m('CommunityMetadata', [m(Table, {
      bordered: false,
      interactive: false,
      striped: false,
      class: '.community.metadata',
      style: 'table-layout: fixed;'
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

        }), ])
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
    return m('ChainMetadata', [
      m(Table, {
        bordered: false,
        interactive: false,
        striped: false,
        class: '.chain.metadata',
        style: 'table-layout: fixed;'
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
          m('td', [ m(RoleRow, { roledata: vnode.attrs.admins }), ])
        ]),
        vnode.attrs.mods.length > 0 &&
          m('tr', [
            m('td', 'Moderators'),
            m('td', [ m(RoleRow, { roledata: vnode.attrs.mods }), ])
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

interface IPanelState {
  roleData: RoleInfo[];
  loadingFinished: boolean;
  loadingStarted: boolean;
}

const Panel: m.Component<{onChangeHandler: Function}, IPanelState> = {
  view: (vnode) => {
    const chainOrCommObj = (app.chain) ? { chain: app.activeChainId() } : { community: app.activeCommunityId() };
    const isCommunity = !!app.activeCommunityId();
    const loadRoles = async () => {
      try {
        const bulkMembers = await $.get(`${app.serverUrl()}/bulkMembers`, chainOrCommObj);
        if (bulkMembers.status !== 'Success') throw new Error('Could not fetch members');
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
      m('.panel-left', {
        // style: 'width: 70%;'
      }, [
        (isCommunity)
          ? vnode.state.loadingFinished
            && m(CommunityMetadata, {
              community: app.community.meta,
              admins,
              mods,
              onRoleUpdate: (x, y) => {
                y.Address = x.Address;
                vnode.state.roleData.splice(vnode.state.roleData.indexOf(x), 1);
                vnode.state.roleData.push(y);
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
                vnode.state.roleData.splice(vnode.state.roleData.indexOf(x), 1);
                vnode.state.roleData.push(y);
                m.redraw();
              },
            }),
      ]),
      m('.panel-right', []),
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
    return m('AdminPanel', [
      m(ListItem, {
        href: '#',
        onclick: (e) => { e.preventDefault(); vnode.state.isOpen = true; },
        label: 'Manage Community',
      }),
      m(Dialog, {
        autofocus: true,
        basic: false,
        closeOnEscapeKey: true,
        closeOnOutsideClick: true,
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
      }),
    ]);
  },
};

export default AdminPanel;

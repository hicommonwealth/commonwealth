import m from 'mithril';

import { Tabs, TabItem } from 'construct-ui';
import UpgradeRolesForm from './upgrade_roles_form';
import WebhooksTab from './webhooks_tab';

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
      (vnode.state.index === 1) &&
        m(UpgradeRolesForm, {
          roleData: vnode.attrs.roleData,
          onRoleUpgrade: (x, y) => vnode.attrs.onRoleUpgrade(x, y),
        }),
      (vnode.state.index === 2) &&
        m(WebhooksTab, { webhooks: vnode.attrs.webhooks }),
    ]);
  },
};

export default AdminTabPanel;

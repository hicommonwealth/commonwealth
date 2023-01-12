/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

import type { RoleInfo, Webhook } from 'models';

import 'pages/manage_community/admin_panel_tabs.scss';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { UpgradeRolesForm } from './upgrade_roles_form';
import { WebhooksForm } from './webhooks_form';

type AdminPanelTabsAttrs = {
  defaultTab: number;
  onRoleUpgrade: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  roleData: Array<RoleInfo>;
  webhooks: Array<Webhook>;
};

export class AdminPanelTabs extends ClassComponent<AdminPanelTabsAttrs> {
  private index: number;

  oninit(vnode: m.Vnode<AdminPanelTabsAttrs>) {
    this.index = vnode.attrs.defaultTab;
  }

  view(vnode: m.Vnode<AdminPanelTabsAttrs>) {
    return (
      <div class="AdminPanelTabs">
        <CWTabBar>
          <CWTab
            label="Admins"
            isSelected={this.index === 1}
            onclick={() => {
              this.index = 1;
            }}
          />
          <CWTab
            label="Webhooks"
            isSelected={this.index === 2}
            onclick={() => {
              this.index = 2;
            }}
          />
        </CWTabBar>
        {this.index === 1 && (
          <UpgradeRolesForm
            roleData={vnode.attrs.roleData}
            onRoleUpgrade={(x, y) => vnode.attrs.onRoleUpgrade(x, y)}
          />
        )}
        {this.index === 2 && <WebhooksForm webhooks={vnode.attrs.webhooks} />}
      </div>
    );
  }
}

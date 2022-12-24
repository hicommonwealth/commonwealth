/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'pages/manage_community/admin_panel_tabs.scss';

import { Webhook, RoleInfo } from 'models';
import { WebhooksForm } from './webhooks_form';
import { UpgradeRolesForm } from './upgrade_roles_form';
import { CWTabBar, CWTab } from '../../components/component_kit/cw_tabs';

type AdminPanelTabsAttrs = {
  defaultTab: number;
  onRoleUpgrade: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  roleData: Array<RoleInfo>;
  webhooks: Array<Webhook>;
};

export class AdminPanelTabs extends ClassComponent<AdminPanelTabsAttrs> {
  private index: number;

  oninit(vnode: ResultNode<AdminPanelTabsAttrs>) {
    this.index = vnode.attrs.defaultTab;
  }

  view(vnode: ResultNode<AdminPanelTabsAttrs>) {
    return (
      <div className="AdminPanelTabs">
        <CWTabBar>
          <CWTab
            label="Admins"
            isSelected={this.index === 1}
            onClick={() => {
              this.index = 1;
            }}
          />
          <CWTab
            label="Webhooks"
            isSelected={this.index === 2}
            onClick={() => {
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

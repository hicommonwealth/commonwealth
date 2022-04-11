/* @jsx m */

import m from 'mithril';
import * as Cui from 'construct-ui';

import 'pages/manage_community/admin_panel_tabs.scss';

import { Webhook } from 'models';
import { WebhooksForm } from './webhooks_form';
import { UpgradeRolesForm } from './upgrade_roles_form';

type AdminPanelTabsAttrs = {
  defaultTab: number;
  onRoleUpgrade: (oldRole: string, newRole: string) => void;
  roleData: any[];
  webhooks: Webhook[];
};

export class AdminPanelTabs implements m.ClassComponent<AdminPanelTabsAttrs> {
  private index: number;

  oninit(vnode) {
    this.index = vnode.attrs.defaultTab;
  }

  view(vnode) {
    return (
      <div class="AdminPanelTabs">
        <Cui.Tabs align="left" bordered={true} fluid={true}>
          <Cui.TabItem
            label="Admins"
            active={this.index === 1}
            onclick={() => {
              this.index = 1;
            }}
          />
          <Cui.TabItem
            label="Webhooks"
            active={this.index === 2}
            onclick={() => {
              this.index = 2;
            }}
          />
        </Cui.Tabs>
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

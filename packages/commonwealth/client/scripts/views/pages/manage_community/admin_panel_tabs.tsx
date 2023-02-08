import React from 'react';

import 'pages/manage_community/admin_panel_tabs.scss';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { UpgradeRolesForm } from './upgrade_roles_form';
import { WebhooksForm } from './webhooks_form';
import type { RoleInfo, Webhook } from 'models';

type AdminPanelTabsProps = {
  onRoleUpgrade: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  roleData: Array<RoleInfo>;
  webhooks: Array<Webhook>;
};

export const AdminPanelTabs = (props: AdminPanelTabsProps) => {
  const { onRoleUpgrade, roleData, webhooks } = props;

  const [currentTab, setCurrentTab] = React.useState<number>(1);

  return (
    <div className="AdminPanelTabs">
      <CWTabBar>
        <CWTab
          label="Admins"
          isSelected={currentTab === 1}
          onClick={() => {
            setCurrentTab(1);
          }}
        />
        <CWTab
          label="Webhooks"
          isSelected={currentTab === 2}
          onClick={() => {
            setCurrentTab(2);
          }}
        />
      </CWTabBar>
      {currentTab === 1 && (
        <UpgradeRolesForm
          roleData={roleData}
          onRoleUpgrade={(x, y) => onRoleUpgrade(x, y)}
        />
      )}
      {currentTab === 2 && <WebhooksForm webhooks={webhooks} />}
    </div>
  );
};

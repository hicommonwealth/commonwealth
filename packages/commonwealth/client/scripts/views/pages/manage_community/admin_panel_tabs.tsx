import React from 'react';

import type RoleInfo from '../../../models/RoleInfo';

import 'pages/manage_community/admin_panel_tabs.scss';

import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import { UpgradeRolesForm } from './upgrade_roles_form';
import { WebhooksForm } from './webhooks_form';

type AdminPanelTabsProps = {
  onRoleUpdate: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  roleData: Array<RoleInfo>;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
};

export const AdminPanelTabs = ({
  onRoleUpdate,
  roleData,
  searchTerm,
  setSearchTerm,
}: AdminPanelTabsProps) => {
  const [currentTab, setCurrentTab] = React.useState<number>(1);

  return (
    <div className="AdminPanelTabs">
      <CWTabsRow>
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
      </CWTabsRow>
      {currentTab === 1 && (
        <UpgradeRolesForm
          roleData={roleData}
          onRoleUpdate={(x, y) => onRoleUpdate(x, y)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      )}
      {currentTab === 2 && <WebhooksForm />}
    </div>
  );
};

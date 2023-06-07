import React from 'react';

import type RoleInfo from '../../../models/RoleInfo';

import 'pages/manage_community/admin_panel_tabs.scss';

import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { UpgradeRolesForm } from './upgrade_roles_form';
import { WebhooksForm } from './webhooks_form';
import { AddPersona } from './add_persona';

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
        <CWTab
          label="Personas"
          isSelected={currentTab === 3}
          onClick={() => {
            setCurrentTab(3);
          }}
        />
      </CWTabBar>
      {currentTab === 1 && (
        <UpgradeRolesForm
          roleData={roleData}
          onRoleUpdate={(x, y) => onRoleUpdate(x, y)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      )}
      {currentTab === 2 && <WebhooksForm />}
      {currentTab === 3 && <AddPersona />}
    </div>
  );
};

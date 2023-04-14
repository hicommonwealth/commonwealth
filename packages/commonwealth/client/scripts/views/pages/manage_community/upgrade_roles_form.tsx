import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { formatAddressShort } from 'helpers';
import $ from 'jquery';

import 'pages/manage_community/upgrade_roles_form.scss';
import React, { useState } from 'react';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';

type UpgradeRolesFormProps = {
  onRoleUpgrade: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  roleData: RoleInfo[];
};

export const UpgradeRolesForm = ({
  onRoleUpgrade,
  roleData,
}: UpgradeRolesFormProps) => {
  const [role, setRole] = useState('');
  const [user, setUser] = useState('');

  const nonAdmins: RoleInfo[] = roleData.filter((_role) => {
    return (
      _role.permission === AccessLevel.Member ||
      _role.permission === AccessLevel.Moderator
    );
  });

  const nonAdminNames: string[] = nonAdmins.map((_role) => {
    // @TODO: @Profiles upgrade, clean this up
    const chainId = _role.chain_id ? _role.chain_id : _role.Address?.chain?.id;

    const displayName = app.newProfiles.getProfile(
      chainId as string,
      _role.Address.address
    ).name;

    const roletext = _role.permission === 'moderator' ? '(moderator)' : '';

    const fullText = `${displayName} - ${formatAddressShort(
      _role.Address.address
    )} ${roletext}`;

    return fullText;
  });

  const chainOrCommObj = { chain: app.activeChainId() };

  return (
    <div className="UpgradeRolesForm">
      <div className="members-container">
        <CWRadioGroup
          name="members/mods"
          options={nonAdminNames.map((n) => ({ label: n, value: n }))}
          toggledOption={user}
          onChange={(e) => {
            setUser(e.target.value);
          }}
        />
      </div>
      <div className="upgrade-buttons-container">
        <CWRadioGroup
          name="roles"
          options={[
            { label: 'Admin', value: 'Admin' },
            { label: 'Moderator', value: 'Moderator' },
          ]}
          toggledOption={role}
          onChange={(e) => {
            setRole(e.target.value);
          }}
        />
        <CWButton
          label="Upgrade Member"
          disabled={!role || !user}
          onClick={() => {
            const indexOfName = nonAdminNames.indexOf(user);

            const _user = nonAdmins[indexOfName];

            const newRole =
              role === 'Admin'
                ? 'admin'
                : role === 'Moderator'
                ? 'moderator'
                : '';

            $.post(`${app.serverUrl()}/upgradeMember`, {
              new_role: newRole,
              address: _user.Address.address,
              ...chainOrCommObj,
              jwt: app.user.jwt,
            }).then((r) => {
              if (r.status === 'Success') {
                notifySuccess('Member upgraded');
              } else {
                notifyError('Upgrade failed');
              }

              onRoleUpgrade(_user, r.result);
            });
          }}
        />
      </div>
    </div>
  );
};

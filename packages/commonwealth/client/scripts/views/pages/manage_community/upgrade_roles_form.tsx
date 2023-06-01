import React, { useMemo, useState } from 'react';
import $ from 'jquery';

import 'pages/manage_community/upgrade_roles_form.scss';

import app from 'state';
import { formatAddressShort } from 'helpers';
import type RoleInfo from '../../../models/RoleInfo';
import { AccessLevel } from '../../../../../shared/permissions';
import { notifySuccess, notifyError } from 'controllers/app/notifications';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';
import { MembersSearchBar } from '../../components/members_search_bar';

type UpgradeRolesFormProps = {
  onRoleUpdate: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  roleData: RoleInfo[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
};

export const UpgradeRolesForm = ({
  onRoleUpdate,
  roleData,
  searchTerm,
  setSearchTerm,
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

  const options = useMemo(() => {
    return nonAdminNames.map((n) => ({ label: n, value: n }));
  }, [nonAdminNames]);

  return (
    <div className="UpgradeRolesForm">
      <MembersSearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        chainName={app.activeChainId()}
      />
      <div className="members-container">
        <CWRadioGroup
          name="members/mods"
          options={options}
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

              onRoleUpdate(_user, r.result);
            });
          }}
        />
      </div>
    </div>
  );
};

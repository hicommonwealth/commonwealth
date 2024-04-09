import { AccessLevel } from '@hicommonwealth/shared';
import axios from 'axios';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { formatAddressShort } from 'helpers';
import React, { useMemo, useState } from 'react';
import app from 'state';
import RoleInfo from '../../../../../models/RoleInfo';
import { CWRadioGroup } from '../../../../components/component_kit/cw_radio_group';
import { CWButton } from '../../../../components/component_kit/new_designs/CWButton';
import { CWRadioButton } from '../../../../components/component_kit/new_designs/cw_radio_button';
import { MembersSearchBar } from '../../../../components/members_search_bar';
import './UpgradeRolesForm.scss';

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
  const [radioButtons, setRadioButtons] = useState([
    { id: 1, checked: false },
    { id: 2, checked: false },
  ]);

  const zeroOutRadioButtons = () => {
    const zeroedOutRadioButtons = radioButtons.map((radioButton) => ({
      ...radioButton,
      checked: false,
    }));
    setRadioButtons(zeroedOutRadioButtons);
  };

  const nonAdmins: RoleInfo[] = roleData.filter((_role) => {
    return (
      _role.permission === AccessLevel.Member ||
      _role.permission === AccessLevel.Moderator
    );
  });

  const nonAdminNames: string[] = nonAdmins.map((_role) => {
    const roletext = _role.permission === 'moderator' ? '(moderator)' : '';
    const fullText = `${(_role as any)?.displayName} - ${formatAddressShort(
      _role.Address.address,
    )} ${roletext}`;
    return fullText;
  });

  const options = useMemo(() => {
    return nonAdminNames.map((n) => ({ label: n, value: n }));
  }, [nonAdminNames]);

  const roleOptions = [
    { label: 'Admin', value: 'Admin' },
    { label: 'Moderator', value: 'Moderator' },
  ];

  const handleRadioButtonChange = (id) => {
    const updatedRadioButtons = radioButtons.map((radioButton) => ({
      ...radioButton,
      checked: radioButton.id === id,
    }));
    setRadioButtons(updatedRadioButtons);
  };

  const handleUpgradeMember = async () => {
    const indexOfName = nonAdminNames.indexOf(user);
    const _user = nonAdmins[indexOfName];
    const newRole =
      role === 'Admin' ? 'admin' : role === 'Moderator' ? 'moderator' : '';

    try {
      const response = await axios.post(`${app.serverUrl()}/upgradeMember`, {
        new_role: newRole,
        address: _user.Address.address,
        community_id: app.activeChainId(),
        jwt: app.user.jwt,
      });

      if (response.data.status === 'Success') {
        notifySuccess('Member upgraded');
        const createdRole = new RoleInfo({
          id: response.data.result.id,
          address_id: response.data.result.address_id,
          address_chain: response.data.result.community_id,
          address: response.data.result.address,
          community_id: response.data.result.community_id,
          permission: response.data.result.permission,
          allow: response.data.result.allow,
          deny: response.data.result.deny,
          is_user_default: response.data.result.is_user_default,
        });
        onRoleUpdate(_user, createdRole);
        zeroOutRadioButtons();
      } else {
        notifyError('Upgrade failed');
      }
    } catch (error) {
      console.error('Error upgrading member:', error);
      notifyError('Upgrade failed');
    }
  };

  return (
    <div className="UpgradeRolesForm">
      <MembersSearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        communityName={app.activeChainId()}
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
        {roleOptions.map((o, i) => (
          <div key={i}>
            <CWRadioButton
              key={i}
              checked={radioButtons[i].checked}
              name="roles"
              onChange={(e) => {
                setRole(e.target.value);
                handleRadioButtonChange(i + 1);
              }}
              value={o.value}
            />
          </div>
        ))}
        <CWButton
          label="Upgrade Member"
          disabled={!role || !user}
          onClick={handleUpgradeMember}
        />
      </div>
    </div>
  );
};

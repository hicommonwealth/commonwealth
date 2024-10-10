import { AddressRole, DEFAULT_NAME, Role } from '@hicommonwealth/shared';
import axios from 'axios';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { formatAddressShort } from 'helpers';
import React, { useMemo, useState } from 'react';
import app from 'state';
import { SERVER_URL } from 'state/api/config';
import useUserStore from 'state/ui/user';
import { CWRadioGroup } from '../../../../components/component_kit/cw_radio_group';
import { CWButton } from '../../../../components/component_kit/new_designs/CWButton';
import { CWRadioButton } from '../../../../components/component_kit/new_designs/cw_radio_button';
import { MembersSearchBar } from '../../../../components/members_search_bar';
import { MemberResult } from '../../../search/helpers';
import './UpgradeRolesForm.scss';

type UpgradeRolesFormProps = {
  onRoleUpdate: (oldRole: AddressRole, newRole: AddressRole) => void;
  roleData: MemberResult[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
};

type UserDisplayRow = {
  profile_name: string | null | undefined;
  user_id: number;
  avatar_url: string | null | undefined;
  role: string;
  address_id: number;
  address: string;
};

export const UpgradeRolesForm = ({
  onRoleUpdate,
  roleData,
  searchTerm,
  setSearchTerm,
}: UpgradeRolesFormProps) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [radioButtons, setRadioButtons] = useState([
    { id: 1, checked: false },
    { id: 2, checked: false },
  ]);

  const userData = useUserStore();

  const zeroOutRadioButtons = () => {
    const zeroedOutRadioButtons = radioButtons.map((radioButton) => ({
      ...radioButton,
      checked: false,
    }));
    setRadioButtons(zeroedOutRadioButtons);
  };

  const rows: UserDisplayRow[] = roleData.flatMap((r) => {
    return r.addresses.map((address) => ({
      profile_name: r.profile_name,
      user_id: r.user_id,
      avatar_url: r.avatar_url,
      role: address.role,
      address_id: address.id,
      address: address.address,
    }));
  });

  const options = useMemo(() => {
    return rows.map((r) => {
      const roleText = r.role !== 'member' ? `(${r.role})` : '';
      const text = `${r?.profile_name || DEFAULT_NAME} - ${formatAddressShort(
        r.address,
      )} ${roleText}`;

      return { label: text, value: r.address };
    });
  }, [rows]);

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
    const newRole =
      selectedRole === 'Admin'
        ? 'admin'
        : selectedRole === 'Moderator'
          ? 'moderator'
          : '';

    try {
      const response = await axios.post(`${SERVER_URL}/upgradeMember`, {
        new_role: newRole,
        address: selectedAddress,
        community_id: app.activeChainId(),
        jwt: userData.jwt,
      });

      if (response.data.status === 'Success') {
        notifySuccess('Member upgraded');
        onRoleUpdate(
          {
            address: selectedAddress as string,
            role: selectedRole as Role,
          },
          {
            address: response.data.result.address as string,
            role: response.data.result.role as Role,
          },
        );
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
        communityName={app.activeChainId() || ''}
      />
      <div className="members-container">
        <CWRadioGroup
          name="members/mods"
          options={options}
          toggledOption={selectedAddress}
          onChange={(e) => {
            setSelectedAddress(e.target.value);
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
                setSelectedRole(e.target.value);
                handleRadioButtonChange(i + 1);
              }}
              value={o.value}
            />
          </div>
        ))}
        <CWButton
          label="Upgrade Member"
          disabled={!selectedRole || !selectedAddress}
          onClick={handleUpgradeMember}
        />
      </div>
    </div>
  );
};

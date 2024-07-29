import { AddressRole } from '@hicommonwealth/shared';
import axios from 'axios';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { formatAddressShort } from 'helpers';
import React, { useMemo, useState } from 'react';
import app from 'state';
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

  const userData = useUserStore();

  const zeroOutRadioButtons = () => {
    const zeroedOutRadioButtons = radioButtons.map((radioButton) => ({
      ...radioButton,
      checked: false,
    }));
    setRadioButtons(zeroedOutRadioButtons);
  };

  const nonAdmins: MemberResult[] = roleData.filter(({ addresses }) => {
    return !addresses.some(({ role: r }) => r === 'admin');
  });

  const nonAdminNames: string[] = nonAdmins.map(
    ({ profile_name, addresses }) => {
      const roletext = addresses.some(({ role: r }) => r === 'moderator')
        ? '(moderator)'
        : '';
      // TODO: we don't actually know if this is the right address?
      const fullText = `${profile_name} - ${formatAddressShort(
        addresses?.[0].address,
      )} ${roletext}`;
      return fullText;
    },
  );

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
        // TODO: allow setting any address (??)
        address: _user.addresses[0].address,
        community_id: app.activeChainId(),
        jwt: userData.jwt,
      });

      if (response.data.status === 'Success') {
        notifySuccess('Member upgraded');
        onRoleUpdate(
          {
            // TODO: allow setting any address (??)
            address: _user.addresses[0].address,
            // @ts-expect-error StrictNullChecks
            role: _user.addresses[0].role,
          },
          {
            address: response.data.result.address,
            role: response.data.result.role,
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

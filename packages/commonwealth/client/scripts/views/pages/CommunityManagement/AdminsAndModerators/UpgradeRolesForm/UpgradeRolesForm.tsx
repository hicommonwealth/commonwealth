import { AccessLevel } from '@hicommonwealth/core';
import updateRole from 'client/scripts/state/api/members/updateRoles';
import { formatAddressShort } from 'helpers';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import app from 'state';
import RoleInfo from '../../../../../models/RoleInfo';
import { CWLabel } from '../../../../components/component_kit/cw_label';
import { CWRadioGroup } from '../../../../components/component_kit/cw_radio_group';
import { CWButton } from '../../../../components/component_kit/new_designs/cw_button';
import { CWRadioButton } from '../../../../components/component_kit/new_designs/cw_radio_button';
import { MembersSearchBar } from '../../../../components/members_search_bar';
import './UpgradeRolesForm.scss';

type UpgradeRolesFormProps = {
  label?: string;
  onRoleUpdate: (oldRole, newRole) => void;
  refetchMembers: () => any;
  roleData: RoleInfo[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  isLoadingProfiles: boolean;
};

export const UpgradeRolesForm = ({
  onRoleUpdate,
  label,
  isLoadingProfiles,
  refetchMembers,
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

  let upgradedUser;
  let newRoleToBeUpgraded;
  const membersRef = useRef();

  const { useUpgradeRoleMutation } = updateRole;
  const { mutateAsync: upgradeRole } = useUpgradeRoleMutation({
    onRoleUpdate,
    newRoleToBeUpgraded,
    upgradedUser,
  });

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoadingProfiles) {
        refetchMembers?.();
      }
    });

    if (membersRef.current) {
      observer.observe(membersRef.current);
    }

    return () => {
      observer?.disconnect();
    };
  }, [isLoadingProfiles, membersRef, refetchMembers]);

  const zeroOutRadioButtons = () => {
    const zeroedOutRadioButtons = radioButtons.map((radioButton) => ({
      ...radioButton,
      checked: false,
    }));
    setRadioButtons(zeroedOutRadioButtons);
  };

  const handleUpgrade = async () => {
    const indexOfName = nonAdminNames.indexOf(user);
    upgradedUser = nonAdmins[indexOfName];
    newRoleToBeUpgraded =
      role === 'Admin' ? 'admin' : role === 'Moderator' ? 'moderator' : '';
    await upgradeRole({ upgradedUser, onRoleUpdate, newRoleToBeUpgraded });
    zeroOutRadioButtons();
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

  return (
    <div className="UpgradeRolesForm">
      <CWLabel label={label} />
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
            <div ref={membersRef} style={{ height: '1px' }}></div>
          </div>
        ))}
        <CWButton
          label="Upgrade Member"
          disabled={!role || !user}
          onClick={handleUpgrade}
        />
      </div>
    </div>
  );
};

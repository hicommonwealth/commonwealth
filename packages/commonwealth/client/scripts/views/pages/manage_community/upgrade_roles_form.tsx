import { AccessLevel } from '@hicommonwealth/core';
import { formatAddressShort } from 'helpers';
import 'pages/manage_community/upgrade_roles_form.scss';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import app from 'state';
import upgradeRoles from 'state/api/members/upgradeRoles';
import { useFlag } from '../../../hooks/useFlag';
import type RoleInfo from '../../../models/RoleInfo';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';
import { CWButton } from '../../components/component_kit/new_designs/cw_button';
import { CWRadioButton } from '../../components/component_kit/new_designs/cw_radio_button';
import { MembersSearchBar } from '../../components/members_search_bar';

type UpgradeRolesFormProps = {
  label?: string;
  onRoleUpdate: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  refetchMembers: () => any;
  roleData: RoleInfo[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  isLoadingProfiles: boolean;
};

export const UpgradeRolesForm = ({
  label,
  isLoadingProfiles,
  onRoleUpdate,
  refetchMembers,
  roleData,
  searchTerm,
  setSearchTerm,
}: UpgradeRolesFormProps) => {
  const newAdminOnboardingEnabled = useFlag('newAdminOnboarding');
  const [role, setRole] = useState('');
  const [user, setUser] = useState('');
  const [radioButtons, setRadioButtons] = useState([
    { id: 1, checked: false },
    { id: 2, checked: false },
  ]);

  const membersRef = useRef();

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

  const newAdminOnboardingEnabledOptions = [
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

  const handleUpgrade = async () => {
    const indexOfName = nonAdminNames.indexOf(user);

    const _user = nonAdmins[indexOfName];
    const newRole =
      role === 'Admin' ? 'admin' : role === 'Moderator' ? 'moderator' : '';
    await upgradeRoles({ _user, onRoleUpdate, newRole });
    zeroOutRadioButtons();
  };

  return (
    <div>
      <CWLabel label={label} />
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
          {newAdminOnboardingEnabled ? (
            <>
              {newAdminOnboardingEnabledOptions.map((o, i) => (
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
              <div ref={membersRef} style={{ height: '1px' }}></div>
            </>
          ) : (
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
          )}
          <CWButton
            label="Upgrade Member"
            disabled={!role || !user}
            onClick={handleUpgrade}
          />
        </div>
      </div>
    </div>
  );
};

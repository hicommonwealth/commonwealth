import axios from 'axios';
import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import { formatAddressShort } from 'client/scripts/helpers';
import useUserStore from 'client/scripts/state/ui/user';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'client/scripts/views/components/component_kit/new_designs/CWModal';
import { CWTag } from 'client/scripts/views/components/component_kit/new_designs/CWTag';
import { CWRadioButton } from 'client/scripts/views/components/component_kit/new_designs/cw_radio_button';
import React, { useState } from 'react';
import app from 'state';
import { SERVER_URL } from 'state/api/config';
import './ManageOnchainModal.scss';
import { AddressInfo } from './MembersSection';

type ManageOnchainModalProps = {
  onClose: () => void;
  Addresses: AddressInfo[] | undefined;
  refetch?: () => void;
};

export const ManageOnchainModal = ({
  onClose,
  Addresses,
  refetch,
}: ManageOnchainModalProps) => {
  const [userRole, setUserRole] = useState(Addresses);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const userData = useUserStore();

  const handleRoleChange = (id: number, newRole: string) => {
    setUserRole((prevData) =>
      (prevData || []).map((user) => {
        const updatedUser = user.id === id ? { ...user, role: newRole } : user;
        setHasChanges((prev) => prev || user.role !== newRole);
        return updatedUser;
      }),
    );
  };

  const updateRoles = async () => {
    if (!hasChanges) return;
    try {
      setLoading(true);
      if (!userRole || !Addresses) return;
      const updates = userRole
        .filter((user, index) => user.role !== Addresses[index]?.role)
        .map(({ id, role }) => ({ id, newRole: role }));
      if (updates.length === 0) return;
      const updatePromises = updates.map(({ id, newRole }) => {
        const user = userRole.find((u) => u.id === id);
        if (!user)
          return Promise.reject(new Error(`User with ID ${id} not found`));

        return axios.post(`${SERVER_URL}/upgradeMember`, {
          new_role: newRole,
          address: user.address,
          community_id: app.activeChainId(),
          jwt: userData.jwt,
        });
      });
      const responses = await Promise.all(updatePromises);
      responses.forEach((response) => {
        if (response.data.status === 'Success') {
          notifySuccess('Role Updated');
        } else {
          notifyError('Update failed');
        }
      });
      if (refetch) refetch();
      onClose();
    } catch (error) {
      console.error('Error upgrading members:', error);
      notifyError(`${error?.response?.data?.error}`);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="ManageOnchainModal">
      <CWModalHeader
        label="Manage onchain privileges"
        subheader="This action cannot be undone."
        onModalClose={onClose}
      />
      <CWModalBody>
        <div className="address-list">
          {userRole?.map((address) => (
            <div key={address.id} className="address-item">
              <div className="address-info">
                <CWTag
                  label={formatAddressShort(address.address)}
                  type="address"
                  iconName="ethereum"
                />
              </div>
              <div className="role-selection">
                <CWRadioButton
                  label="Admin"
                  name={`role-${address.id}`}
                  value="admin"
                  checked={address.role === 'admin'}
                  onChange={() => handleRoleChange(address.id, 'admin')}
                />
                <CWRadioButton
                  label="Moderator"
                  name={`role-${address.id}`}
                  value="moderator"
                  checked={address.role === 'moderator'}
                  onChange={() => handleRoleChange(address.id, 'moderator')}
                />
                <CWRadioButton
                  label="Member"
                  name={`role-${address.id}`}
                  value="member"
                  checked={address.role === 'member'}
                  onChange={() => handleRoleChange(address.id, 'member')}
                />
              </div>
            </div>
          ))}
        </div>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Confirm"
          buttonType="secondary"
          onClick={() => updateRoles()}
          buttonHeight="sm"
          disabled={loading || !hasChanges}
        />
      </CWModalFooter>
    </div>
  );
};

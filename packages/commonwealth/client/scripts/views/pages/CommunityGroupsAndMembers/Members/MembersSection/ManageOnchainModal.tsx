import axios from 'axios';
import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import { formatAddressShort } from 'client/scripts/helpers';
import useMintAdminTokenMutation from 'client/scripts/state/api/members/mintAdminRoleonChain';
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
  namespace: string;
  chainRpc: string;
  ethChainId: number;
  chainId: string;
};

export const ManageOnchainModal = ({
  onClose,
  Addresses,
  refetch,
  namespace,
  chainRpc,
  ethChainId,
  chainId,
}: ManageOnchainModalProps) => {
  const [userRole, setUserRole] = useState(Addresses);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const userData = useUserStore();
  const mintAdminTokenMutation = useMintAdminTokenMutation();

  const handleRoleChange = (id: number, newRole: string) => {
    setUserRole((prevData) =>
      (prevData || []).map((user) => {
        if (user.id === id && user.role !== newRole) {
          setHasChanges(true);
          return { ...user, role: newRole };
        }
        return user;
      }),
    );
  };

  const updateRolesOnServer = async () => {
    if (!hasChanges) return;
    try {
      setLoading(true);
      if (!userRole || !Addresses) return;
      const updates = userRole.filter(
        (user, index) => user.role !== Addresses[index]?.role,
      );
      if (updates.length === 0) return;
      const axiosPromises = updates.map(({ role, address }) =>
        axios.post(`${SERVER_URL}/upgradeMember`, {
          new_role: role,
          address: address,
          community_id: app.activeChainId(),
          jwt: userData.jwt,
        }),
      );
      const responses = await Promise.all(axiosPromises);
      responses.forEach((response) => {
        if (response.data.status === 'Success') {
          notifySuccess('Role Updated');
        } else {
          notifyError('Update failed');
        }
      });
      if (refetch) refetch();
    } catch (error: any) {
      console.error('Error upgrading members:', error);
      notifyError(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAndMint = async () => {
    try {
      await updateRolesOnServer();

      const adminUpdates = (userRole || []).filter(
        (user, index) =>
          user.role !== Addresses?.[index]?.role && user.role === 'admin',
      );

      if (adminUpdates.length > 0) {
        await Promise.all(
          adminUpdates.map(async (update) => {
            await mintAdminTokenMutation.mutateAsync({
              namespace,
              walletAddress: userData.activeAccount?.address!,
              adminAddress: update.address,
              chainRpc,
              ethChainId,
              chainId,
            });
            notifySuccess(
              `Admin token minted for ${formatAddressShort(update.address)}`,
            );
          }),
        );
      }
    } catch (err) {
      console.error(err);
      notifyError('An error occurred while updating roles and minting tokens.');
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
          label="Confirm & Mint"
          buttonType="secondary"
          onClick={updateAndMint}
          buttonHeight="sm"
          disabled={loading || !hasChanges}
        />
        <CWButton label="Close" onClick={onClose} buttonHeight="sm" />
      </CWModalFooter>
    </div>
  );
};

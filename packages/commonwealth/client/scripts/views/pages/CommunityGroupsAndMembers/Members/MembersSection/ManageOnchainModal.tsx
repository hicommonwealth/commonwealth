import { Role } from '@hicommonwealth/shared';
import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import { formatAddressShort } from 'client/scripts/helpers';
import {
  useGetCommunityByIdQuery,
  useUpdateRoleMutation,
} from 'client/scripts/state/api/communities';
import useMintAdminTokenMutation from 'client/scripts/state/api/members/mintAdminRoleonChain';
import useUserStore from 'client/scripts/state/ui/user';
import { getChainIcon } from 'client/scripts/utils/chainUtils';
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
  communityNamespace: boolean;
};

export const ManageOnchainModal = ({
  onClose,
  Addresses,
  refetch,
  namespace,
  chainRpc,
  ethChainId,
  chainId,
  communityNamespace,
}: ManageOnchainModalProps) => {
  const [userRole, setUserRole] = useState(Addresses);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { mutateAsync: updateRole } = useUpdateRoleMutation();

  const userData = useUserStore();
  const mintAdminTokenMutation = useMintAdminTokenMutation();

  // Get community data to determine chain base
  const { data: community } = useGetCommunityByIdQuery({
    id: chainId,
    enabled: !!chainId,
  });

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
      await Promise.all(
        updates.map(({ role, address }) =>
          updateRole({
            community_id: app.activeChainId()!,
            address,
            role: role as Role,
          }),
        ),
      );
      if (refetch) refetch();
    } catch (error) {
      console.error('Error upgrading members:', error);
      notifyError(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const mintPermission = async () => {
    try {
      const walletAddress = userData.activeAccount?.address;
      if (!walletAddress) {
        notifyError('Wallet Address Not Found');
        throw new Error('Wallet Address Not Found');
      }

      // Filter the updates to only those that are admin changes
      const adminUpdates = (userRole || []).filter(
        (user, index) =>
          user.role !== Addresses?.[index]?.role && user.role === 'admin',
      );

      if (adminUpdates.length > 0) {
        await Promise.all(
          adminUpdates.map(async (update) => {
            await mintAdminTokenMutation.mutateAsync({
              namespace,
              walletAddress,
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
    } catch (error) {
      console.error('Error minting permissions:', error);
      notifyError(error?.response?.data?.error || error.message);
      throw new Error(error);
    }
  };

  const handleUpdate = async () => {
    try {
      if (communityNamespace) await mintPermission();
      await updateRolesOnServer();
    } catch (err) {
      console.error(err);
      notifyError('Minting failed, permissions were not updated.');
    } finally {
      onClose();
    }
  };

  return (
    <div className="ManageOnchainModal">
      <CWModalHeader
        label={communityNamespace ? 'Manage onchain privileges' : 'Manage Role'}
        subheader={communityNamespace ? 'This action cannot be undone.' : ''}
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
                  iconName={getChainIcon(address, community?.base)}
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
          label={communityNamespace ? 'Confirm & Mint' : 'Confirm'}
          buttonType="secondary"
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={handleUpdate}
          buttonHeight="sm"
          disabled={loading || !hasChanges}
        />
        <CWButton label="Close" onClick={onClose} buttonHeight="sm" />
      </CWModalFooter>
    </div>
  );
};

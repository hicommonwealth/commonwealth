import React from 'react';

import { formatAddressShort } from 'client/scripts/helpers';
import {
  useDeleteAddressMutation,
  useDeleteAllAddressesMutation,
} from 'client/scripts/state/api/communities/deleteAddress';
import AddressInfo from '../../models/AddressInfo';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import './delete_address_modal.scss';

type DeleteAddressModalAttrs = {
  addresses: AddressInfo[];
  address: AddressInfo;
  chain: string;
  closeModal: () => void;
  isBulkDelete?: boolean;
  communityName: string;
  isLastCommunityAddress?: boolean;
};

export const DeleteAddressModal = ({
  address,
  chain,
  closeModal,
  isBulkDelete = false,
  communityName,
  isLastCommunityAddress = false,
}: DeleteAddressModalAttrs) => {
  const { mutate: deleteAddress } = useDeleteAddressMutation();
  const { mutate: deleteAllAddresses } = useDeleteAllAddressesMutation();

  const onDeleteAddress = async () => {
    if (isBulkDelete)
      await deleteAllAddresses({
        community_id: chain,
        address: address?.address,
      });
    else
      await deleteAddress({ community_id: chain, address: address?.address });
    closeModal();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();

    onDeleteAddress()
      .then(() => undefined)
      .catch(console.error);
  };

  return (
    <div className="DeleteAddressModal">
      <CWModalHeader
        label={
          isLastCommunityAddress
            ? 'Are you sure you want to leave this community?'
            : isBulkDelete
              ? 'Disconnect All Addresses'
              : `Disconnect ${formatAddressShort(address?.address || '')}`
        }
        icon="danger"
        onModalClose={closeModal}
      />
      <CWModalBody>
        <CWText>
          {isLastCommunityAddress
            ? `By removing the following address, ${formatAddressShort(
                address?.address || '',
              )}, you will be leaving ${communityName}. 
              If you’d like to interact with this community in the future you can rejoin.`
            : isBulkDelete
              ? `By leaving ${communityName} you will disconnect all 
            linked addresses. Your threads will remain intact.`
              : `By removing this address you will be disconnecting from ${communityName}. 
            Your contributions and comments will remain. Don't worry, you can rejoin anytime.`}
        </CWText>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Cancel"
          buttonType="secondary"
          onClick={closeModal}
          buttonHeight="sm"
        />
        <CWButton
          label={
            isLastCommunityAddress
              ? 'Leave Community'
              : isBulkDelete
                ? 'Disconnect All'
                : 'Disconnect Address'
          }
          buttonType="destructive"
          onClick={handleDelete}
          buttonHeight="sm"
        />
      </CWModalFooter>
    </div>
  );
};

import React from 'react';

import { SERVER_URL } from 'state/api/config';
import {
  notifyError,
  notifySuccess,
} from '../../controllers/app/notifications';
import AddressInfo from '../../models/AddressInfo';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';

import axios from 'axios';
import { formatAddressShort } from 'client/scripts/helpers';
import useUserStore from 'state/ui/user';
import './delete_address_modal.scss';

type DeleteAddressModalAttrs = {
  addresses: AddressInfo[];
  address: AddressInfo;
  chain: string;
  closeModal: () => void;
  isBulkDelete?: boolean;
  communityName: string;
  islastCommunityAddress?: boolean;
};

export const DeleteAddressModal = ({
  address,
  chain,
  closeModal,
  isBulkDelete = false,
  communityName,
  islastCommunityAddress = false,
}: DeleteAddressModalAttrs) => {
  const user = useUserStore();

  const onDeleteAddress = async () => {
    try {
      const payload = { address: address?.address, chain, jwt: user.jwt };

      const endpoint = isBulkDelete
        ? `${SERVER_URL}/deleteAllAddresses`
        : `${SERVER_URL}/deleteAddress`;

      const response = await axios.post(endpoint, payload);

      if (response?.data.status === 'Success') {
        const updatedAddresses = [...user.addresses].filter(
          (a) =>
            a.addressId !== address.addressId ||
            a.community?.id !== address.community?.id,
        );
        const updatedAccounts = user.accounts.filter(
          (a) => a.address !== address.address && a.community.id !== chain,
        );
        const remainingJoinedCommunities = updatedAddresses.map(
          (a) => a.community.id,
        );
        user.setData({
          addresses: updatedAddresses,
          communities: [...user.communities].filter((c) =>
            remainingJoinedCommunities.includes(c.id),
          ),
          accounts: updatedAccounts,
          ...(user.accounts.length === 1 && { activeAccount: null }),
        });

        notifySuccess('Address has been successfully removed.');
      }
    } catch (err) {
      notifyError(err.response.data.error);
    }

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
          islastCommunityAddress
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
          {islastCommunityAddress
            ? `By removing the following address, ${formatAddressShort(
                address?.address || '',
              )}, you will be leaving ${communityName}. 
              If you’d like to interact with this community in the future you can rejoin.`
            : isBulkDelete
              ? `By leaving ${communityName} you will disconnect all 
            linked addresses. Your threads will remain intact.`
              : `By removing this address you will be leaving the ${communityName}. 
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
            islastCommunityAddress
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

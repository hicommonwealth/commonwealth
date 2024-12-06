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
};

export const DeleteAddressModal = ({
  address,
  addresses,
  chain,
  closeModal,
  isBulkDelete = false,
}: DeleteAddressModalAttrs) => {
  const user = useUserStore();

  const onDeleteAddress = async () => {
    if (addresses.length === 1) {
      notifyError(
        'You must have at least one address linked to a profile. Please add another address before removing this one.',
      );
    }

    try {
      const payload = { address: address?.address, chain, jwt: user.jwt };

      const endpoint = isBulkDelete
        ? `${SERVER_URL}/deleteAllAddresses`
        : `${SERVER_URL}/deleteAddress`;

      const response = await axios.post(endpoint, payload);

      if (response?.data.status === 'Success') {
        const updatedAddresses = [...user.addresses].filter(
          (a) =>
            a.addressId !== address.addressId &&
            a.community?.id !== address.community?.id,
        );
        const remainingJoinedCommunities = updatedAddresses.map(
          (a) => a.community.id,
        );
        user.setData({
          addresses: updatedAddresses,
          communities: [...user.communities].filter((c) =>
            remainingJoinedCommunities.includes(c.id),
          ),
          accounts: user.accounts.filter(
            (a) => a.address !== address.address && a.community.id !== chain,
          ),
        });

        notifySuccess('Address has been successfully removed.');
      }
    } catch (err) {
      notifyError('Address was not successfully deleted, please try again.');
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
          isBulkDelete
            ? 'Disconnect All Addresses'
            : `Disconnect ${formatAddressShort(address?.address || '')}`
        }
        icon="danger"
        onModalClose={closeModal}
      />
      <CWModalBody>
        <CWText>
          {isBulkDelete
            ? `By leaving ${address?.community.id} you will disconnect all linked addresses. Your threads will remain intact.`
            : `By removing this address you will be leaving the ${address?.community.id}. Your contributions and comments will remain. Don't worry, you can rejoin anytime.`}
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
          label={isBulkDelete ? 'Disconnect All' : 'Disconnect Address'}
          buttonType="destructive"
          onClick={handleDelete}
          buttonHeight="sm"
        />
      </CWModalFooter>
    </div>
  );
};

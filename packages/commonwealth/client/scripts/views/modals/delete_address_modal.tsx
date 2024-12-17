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
};

export const DeleteAddressModal = ({
  address,
  addresses,
  chain,
  closeModal,
}: DeleteAddressModalAttrs) => {
  const user = useUserStore();

  const onDeleteAddress = async () => {
    if (addresses.length === 1) {
      notifyError(
        'You must have at least one address linked to a profile. Please add another address before removing this one.',
      );
    }

    try {
      const response = await axios.post(`${SERVER_URL}/deleteAddress`, {
        address: address.address,
        chain,
        jwt: user.jwt,
      });

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
      notifyError(err.response.data.error);
    } finally {
      user.setData({
        ...(user.accounts.length === 1 && { activeAccount: null }),
      });
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
        label={`Disconnect ${formatAddressShort(address.address)}`}
        icon="danger"
        onModalClose={closeModal}
      />
      <CWModalBody>
        <CWText>
          By removing this address you will be leaving the{' '}
          {address.community.id}. Your contributions and comments will remain.
          Don&apos;t worry, you can rejoin anytime.
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
          label="Disconnect Address"
          buttonType="destructive"
          onClick={handleDelete}
          buttonHeight="sm"
        />
      </CWModalFooter>
    </div>
  );
};

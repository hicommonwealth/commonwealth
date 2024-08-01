import jdenticon from 'jdenticon';
import React from 'react';

import {
  notifyError,
  notifySuccess,
} from '../../controllers/app/notifications';
import AddressInfo from '../../models/AddressInfo';
import NewProfile from '../../models/NewProfile';
import app from '../../state';
import { CWText } from '../components/component_kit/cw_text';
import { CWTruncatedAddress } from '../components/component_kit/cw_truncated_address';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';

import { DEFAULT_NAME } from '@hicommonwealth/shared';
import axios from 'axios';
import useUserStore from 'state/ui/user';
import '../../../styles/modals/delete_address_modal.scss';

type DeleteAddressModalAttrs = {
  profile: NewProfile;
  addresses: AddressInfo[];
  address: string;
  chain: string;
  closeModal: () => void;
};

export const DeleteAddressModal = ({
  address,
  addresses,
  chain,
  closeModal,
  profile,
}: DeleteAddressModalAttrs) => {
  const user = useUserStore();

  const onDeleteAddress = async () => {
    if (addresses.length === 1) {
      notifyError(
        'You must have at least one address linked to a profile. Please add another address before removing this one.',
      );
    }

    try {
      const response = await axios.post(`${app.serverUrl()}/deleteAddress`, {
        address,
        chain,
        jwt: user.jwt,
      });

      if (response?.data.status === 'Success') {
        user.setData({
          accounts: user.accounts.filter(
            (a) => a.address !== address && a.community.id !== chain,
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

  const { name } = profile;
  const defaultAvatar = jdenticon.toSvg(profile.userId, 90);

  return (
    <div className="DeleteAddressModal">
      <CWModalHeader
        label="Delete Address"
        icon="danger"
        onModalClose={closeModal}
      />
      <CWModalBody>
        <CWText>
          Address will be removed from the following linked profile.
        </CWText>
        <div className="profile">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} />
          ) : (
            <img
              src={`data:image/svg+xml;utf8,${encodeURIComponent(
                defaultAvatar,
              )}`}
            />
          )}
          <CWText fontWeight="bold">{name || DEFAULT_NAME}</CWText>
        </div>
        <div className="confirmation">
          <CWText>Are you sure you want to remove this address?</CWText>
          <CWTruncatedAddress address={address} />
        </div>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Cancel"
          buttonType="secondary"
          onClick={closeModal}
          buttonHeight="sm"
        />
        <CWButton
          label="Delete"
          buttonType="destructive"
          onClick={handleDelete}
          buttonHeight="sm"
        />
      </CWModalFooter>
    </div>
  );
};

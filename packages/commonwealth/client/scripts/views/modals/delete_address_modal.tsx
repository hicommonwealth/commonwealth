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
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { CWButton } from '../components/component_kit/new_designs/cw_button';

import axios from 'axios';
import '../../../styles/modals/delete_address_modal.scss';

type DeleteAddressModalAttrs = {
  profile: NewProfile;
  addresses: AddressInfo[];
  address: string;
  chain: string;
  closeModal: () => void;
};

export const DeleteAddressModal = (props: DeleteAddressModalAttrs) => {
  const onDeleteAddress = async (
    e: React.MouseEvent,
    passedProps: Partial<DeleteAddressModalAttrs>,
  ) => {
    const { addresses, address, chain } = passedProps;

    e.preventDefault();

    if (addresses.length === 1) {
      notifyError(
        'You must have at least one address linked to a profile. Please add another address before removing this one.',
      );
    }

    try {
      const response = await axios.post(`${app.serverUrl()}/deleteAddress`, {
        address,
        chain,
        jwt: app.user.jwt,
      });
      // remove deleted role from app.roles
      const foundAddressInfo = addresses.find((a) => a.address === address);
      app.roles.deleteRole({
        address: foundAddressInfo,
        community: chain,
      });

      if (response?.data.status === 'Success') {
        notifySuccess('Address has been successfully removed.');
      }
    } catch (err) {
      notifyError('Address was not successfully deleted, please try again.');
    }

    closeModal();
  };

  const { profile, address, closeModal } = props;
  const { name } = profile;
  const defaultAvatar = jdenticon.toSvg(props.profile.id, 90);

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
          <CWText fontWeight="bold">{name || 'Anonymous user'}</CWText>
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
          onClick={(e: React.MouseEvent) => onDeleteAddress(e, props)}
          buttonHeight="sm"
        />
      </CWModalFooter>
    </div>
  );
};

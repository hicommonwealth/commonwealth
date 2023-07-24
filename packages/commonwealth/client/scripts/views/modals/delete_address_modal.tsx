import React from 'react';
import $ from 'jquery';
import jdenticon from 'jdenticon';

import 'modals/delete_address_modal.scss';

import app from 'state';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import AddressInfo from '../../models/AddressInfo';
import NewProfile from '../../models/NewProfile';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWTruncatedAddress } from '../components/component_kit/cw_truncated_address';

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
    passedProps: Partial<DeleteAddressModalAttrs>
  ) => {
    const { addresses, address, chain } = passedProps;

    e.preventDefault();

    if (addresses.length === 1) {
      notifyError(
        'You must have at least one address linked to a profile. Please add another address before removing this one.'
      );

      $(e.target).trigger('modalexit');
      return;
    }

    try {
      const response: any = await $.post(`${app.serverUrl()}/deleteAddress`, {
        address,
        chain,
        jwt: app.user.jwt,
      });
      // remove deleted role from app.roles
      const foundAddressInfo = addresses.find(a => a.address === address)
      app.roles.deleteRole({
        address: foundAddressInfo,
        chain: chain,
      })

      if (response?.status === 'Success') {
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
      <div className="title">
        <CWText type="h4" fontWeight="semiBold">
          Delete Address
        </CWText>
        <CWIconButton iconName="close" onClick={closeModal} />
      </div>
      <div className="body">
        <CWText>
          Address will be removed from the following linked profile.
        </CWText>
        <div className="profile">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} />
          ) : (
            <img
              src={`data:image/svg+xml;utf8,${encodeURIComponent(
                defaultAvatar
              )}`}
            />
          )}
          <CWText fontWeight="bold">{name || 'Anonymous user'}</CWText>
        </div>
        <div className="confirmation">
          <CWText>Are you sure you want to remove this address?</CWText>
          <CWTruncatedAddress address={address} />
        </div>
        <div className="actions">
          <CWButton
            label="Delete"
            buttonType="secondary-red"
            onClick={(e: React.MouseEvent) => onDeleteAddress(e, props)}
          />
          <CWButton
            label="Cancel"
            buttonType="primary-black"
            onClick={closeModal}
          />
        </div>
      </div>
    </div>
  );
};

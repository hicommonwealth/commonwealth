import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';
import $ from 'jquery';
import jdenticon from 'jdenticon';

import 'modals/move_address_modal.scss';

import app from 'state';
import type { NewProfile as Profile } from 'client/scripts/models';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWTruncatedAddress } from '../components/component_kit/cw_truncated_address';

type MoveAddressModalAttrs = {
  profile: Profile;
  profiles: Profile[];
  address: string;
  closeModal: () => void;
};

type MoveAddressRowAttrs = {
  profile: Profile;
  selected?: boolean;
  onclick?: (e: any) => void;
};

export class MoveAddressRow extends ClassComponent<MoveAddressRowAttrs> {
  view(vnode: ResultNode<MoveAddressRowAttrs>) {
    const { profile, selected, onclick } = vnode.attrs;
    const { name, username } = profile;
    const defaultAvatar = jdenticon.toSvg(vnode.attrs.profile.id, 90);

    return (
      <div
        className={selected ? 'MoveAddressRow selected' : 'MoveAddressRow'}
        onClick={onclick}
      >
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} />
        ) : (
          <img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(defaultAvatar)}`}
          />
        )}
        <CWText type="b2">{name || username}</CWText>
      </div>
    );
  }
}

export class MoveAddressModal extends ClassComponent<MoveAddressModalAttrs> {
  private selectedProfile: Profile;

  private onMoveAddress = async (
    e: Event,
    vnode: ResultNode<MoveAddressModalAttrs>
  ) => {
    const { address, profile, closeModal } = vnode.attrs;

    e.preventDefault();

    try {
      const response: any = await $.post(`${app.serverUrl()}/moveAddress`, {
        addressHash: address,
        oldProfileId: profile.id,
        newProfileId: this.selectedProfile.id,
        jwt: app.user.jwt,
      });
      if (response?.status === 'Success') {
        const { name, username } = this.selectedProfile;
        const displayName = name || username;
        setTimeout(() => {
          notifySuccess(
            `Address has been successfully moved to profile '${displayName}'`
          );
        }, 1000);
      }
    } catch (err) {
      setTimeout(() => {
        notifyError(
          'Address was not successfully transferred, please try again.'
        );
      }, 1000);
    }

    closeModal();
  };

  view(vnode: ResultNode<MoveAddressModalAttrs>) {
    const { profile, profiles, address, closeModal } = vnode.attrs;
    const moveToOptions = profiles.filter((p) => {
      return p.id !== profile.id;
    });

    return (
      <div className="MoveAddressModal">
        <div className="title">
          <CWText type="h4">Transfer Address</CWText>
          <CWIconButton iconName="close" onClick={closeModal} />
        </div>
        <div className="body">
          <CWText type="caption">Address to be moved</CWText>
          <CWTruncatedAddress address={address} />
          <CWText type="caption">Currently In</CWText>
          <div className="current-address">
            <MoveAddressRow profile={profile} />
          </div>
          <CWText type="caption">Move To</CWText>
          <div className="move-to-address">
            {moveToOptions.length === 0 ? (
              <CWText type="b2" className="no-options">
                No other profiles available
              </CWText>
            ) : (
              moveToOptions.map((option) => (
                <MoveAddressRow
                  profile={option}
                  selected={option.id === this.selectedProfile?.id}
                  onclick={() => {
                    this.selectedProfile = option;
                    this.redraw();
                  }}
                />
              ))
            )}
          </div>
          <div className="actions">
            <CWButton
              label="Cancel"
              buttonType="secondary-black"
              onClick={closeModal}
            />
            <CWButton
              label="Save"
              buttonType="primary-black"
              onClick={(e: any) => this.onMoveAddress(e, vnode)}
            />
          </div>
        </div>
      </div>
    );
  }
}

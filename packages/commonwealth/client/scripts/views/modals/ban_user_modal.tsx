import React from 'react';
import $ from 'jquery';
import { WarningOctagon, X } from '@phosphor-icons/react';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import type MinimumProfile from '../../models/MinimumProfile';
import app from 'state';
import { CWButton } from '../components/component_kit/new_designs/cw_button';
import { CWText } from '../components/component_kit/cw_text';

import 'modals/ban_user_modal.scss';

type BanUserModalAttrs = {
  onModalClose: () => void;
  profile: MinimumProfile;
};

export const BanUserModal = (props: BanUserModalAttrs) => {
  const { profile, onModalClose } = props;

  return (
    <div className="BanUserModal">
      <div className="compact-modal-title">
        <div className="Frame">
          <WarningOctagon className="warning-icon" weight="fill" size={24} />
          <CWText className="title-text" type="h4">
            Are You Sure?
          </CWText>
        </div>
        <X className="close-icon" onClick={() => onModalClose()} size={24} />
      </div>
      <div className="compact-modal-body">
        <div>
          Banning an address prevents it from interacting with the forum.
        </div>
      </div>
      <div className="compact-modal-footer">
        <CWButton
          label="Ban address"
          buttonType="destructive"
          buttonHeight="sm"
          onClick={async () => {
            try {
              // ZAK TODO: Update Banned User Table with userProfile
              if (!profile.address) {
                notifyError('CW Data error');
                return;
              }
              await $.post('/api/banAddress', {
                jwt: app.user.jwt,
                address: profile.address,
                chain_id: app.activeChainId(),
              });
              onModalClose();
              notifySuccess('Banned Address');
            } catch (e) {
              notifyError('Ban Address Failed');
            }
          }}
        />
      </div>
    </div>
  );
};

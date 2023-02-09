import React from 'react';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import $ from 'jquery';

import type { Profile } from 'models';
import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

type BanUserModalAttrs = {
  onModalClose: () => void;
  profile: Profile;
};

export const BanUserModal = (props: BanUserModalAttrs) => {
  const { profile, onModalClose } = props;

  return (
    <React.Fragment>
      <div className="compact-modal-title ban-user">
        <h3>Are You Sure?</h3>
        <CWIconButton iconName="close" onClick={() => onModalClose()} />
      </div>
      <div className="compact-modal-body">
        <div>
          Banning an address prevents it from interacting with the forum.
        </div>
        <div className="ban-modal-content">
          <CWButton
            label="Ban Address (just click once and wait)"
            buttonType="primary-red"
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
    </React.Fragment>
  );
};

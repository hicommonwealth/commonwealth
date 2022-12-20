/* @jsx m */
import m from 'mithril';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component } from 'mithrilInterop';
import $ from 'jquery';

import { Profile } from 'models';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';

type BanUserModalAttrs = {
  profile: Profile;
};

export class BanUserModal extends ClassComponent<BanUserModalAttrs> {
  view(vnode: ResultNode<BanUserModalAttrs>) {
    const { address } = vnode.attrs.profile;

    const exitModal = () => {
      $(vnode.dom).trigger('modalexit');
      redraw();
    };

    return (
      <>
        <div class="compact-modal-title ban-user">
          <h3>Are You Sure?</h3>
        </div>
        <div class="compact-modal-body">
          <div>
            Banning an address prevents it from interacting with the forum.
          </div>
          <div class="ban-modal-content">
            <CWButton
              label="Ban Address (just click once and wait)"
              buttonType="primary-red"
              onclick={async () => {
                try {
                  // ZAK TODO: Update Banned User Table with userProfile
                  if (!address) {
                    notifyError('CW Data error');
                    return;
                  }
                  await $.post('/api/banAddress', {
                    jwt: app.user.jwt,
                    address,
                    chain_id: app.activeChainId(),
                  });
                  exitModal();
                  notifySuccess('Banned Address');
                } catch (e) {
                  notifyError('Ban Address Failed');
                }
              }}
            />
          </div>
        </div>
      </>
    );
  }
}

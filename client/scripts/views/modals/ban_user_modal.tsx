/* @jsx m */

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import m from 'mithril';
import $ from 'jquery';
import { CWButton } from '../components/component_kit/cw_button';

export class BanUserModal implements m.ClassComponent {
  view(vnode) {
    const userProfile = vnode.attrs.profile;

    const exitModal = () => {
      $(vnode.dom).trigger('modalexit');
      m.redraw();
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
              label="Ban Address"
              buttonType="primary-red"
              onclick={() => {
                try {
                  // ZAK TODO: Update Banned User Table with userProfile

                  exitModal();
                  notifySuccess('Banned Address');
                } catch (e) {
                  notifyError('Ban Address Failed');
                }
              }}
            ></CWButton>
          </div>
        </div>
      </>
    );
  }
}

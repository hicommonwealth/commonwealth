/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';
import jdenticon from 'jdenticon';

import 'modals/delete_address_modal.scss';

import app from 'state';
import { NewProfile as Profile } from 'client/scripts/models';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWTruncatedAddress } from '../components/component_kit/cw_truncated_address';

type DeleteAddressModalAttrs = {
  profile: Profile;
  address: string;
  chain: string;
}

export class DeleteAddressModal extends ClassComponent<DeleteAddressModalAttrs> {
  private defaultAvatar: string;
  private error: boolean;

  private onDeleteAddress = async (e: Event, vnode: m.Vnode<DeleteAddressModalAttrs>) => {
    const { address, chain } = vnode.attrs;

    e.preventDefault();

    const response: any = await $.post(`${app.serverUrl()}/deleteAddress`, {
      address,
      chain,
      jwt: app.user.jwt,
    }).catch(() => {
      this.error = true;
      setTimeout(() => {
        this.error = false;
        m.redraw();
      }, 2500);
    });

    if (response?.status === 'Success') {
      // Redirect
      m.redraw();
    } else {
      this.error = true;
      setTimeout(() => {
        this.error = false;
        m.redraw();
      }, 2500);
    }

    $(e.target).trigger('modalcomplete');
    setTimeout(() => {
      $(e.target).trigger('modalexit');
    }, 0);
  };

  oninit(vnode: m.Vnode<DeleteAddressModalAttrs>) {
    this.defaultAvatar = jdenticon.toSvg(vnode.attrs.profile.id, 90);
    this.error = false;
  }

  view(vnode: m.Vnode<DeleteAddressModalAttrs>) {
    const { profile, address } = vnode.attrs;

    return (
      <div class="DeleteAddressModal">
        <div class="title">
          <CWText type="h4" fontWeight="semiBold">Delete Address</CWText>
          <CWIconButton
            iconName="close"
            onclick={(e) => {
              e.preventDefault();
              $(e.target).trigger('modalcomplete');
              setTimeout(() => {
                $(e.target).trigger('modalexit');
              }, 0);
            }}
          />
        </div>
        <div class="body">
          <CWText>
            Address will be removed from the following linked profile.
          </CWText>
          <div className="profile">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} />
            ) : (
              <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(
                  this.defaultAvatar
                )}`}
              />
            )}
            <CWText fontWeight="bold">
              {profile.name}
            </CWText>
          </div>
          <div className="confirmation">
            <CWText>
              Are you sure you want to remove this address?
            </CWText>
            <CWTruncatedAddress address={address} />
          </div>
          <div className="actions">
            <CWButton
              label="Delete"
              buttonType="secondary-red"
              onclick={(e) => this.onDeleteAddress(e, vnode)}
            />
            <CWButton
              label="Cancel"
              buttonType="primary-black"
              onclick={(e) => {
                e.preventDefault();
                $(e.target).trigger('modalcomplete');
                setTimeout(() => {
                  $(e.target).trigger('modalexit');
                }, 0);
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

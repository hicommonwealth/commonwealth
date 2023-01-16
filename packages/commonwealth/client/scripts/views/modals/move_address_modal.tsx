/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';
import jdenticon from 'jdenticon';

import 'modals/move_address_modal.scss';

import app from 'state';
import { NewProfile as Profile } from 'client/scripts/models';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

type MoveAddressModalAttrs = {
  profile: Profile;
  profiles: Profile[];
  address: string;
}

type MoveAddressRowAttrs = {
  profile: Profile;
  selected?: boolean;
  onclick?: (e: Event) => void;
}

export class MoveAddressRow extends ClassComponent<MoveAddressRowAttrs> {
  view(vnode: m.Vnode<MoveAddressRowAttrs>) {
    const { profile, selected, onclick } = vnode.attrs;
    const defaultAvatar = jdenticon.toSvg(vnode.attrs.profile.id, 90);

    return (
      <div class={selected ? 'MoveAddressRow selected': 'MoveAddressRow'} onclick={onclick}>
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} />
        ) : (
          <img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(defaultAvatar)}`}
          />
        )}
        <CWText type="b2">
          {profile.name}
        </CWText>
      </div>
    );
  }
}

export class MoveAddressModal extends ClassComponent<MoveAddressModalAttrs> {
  private selectedProfile: Profile;
  private error: boolean;

  private onMoveAddress = async (e: Event, vnode: m.Vnode<MoveAddressModalAttrs>) => {
    const { address, profile } = vnode.attrs;

    e.preventDefault();

    const response: any = await $.post(`${app.serverUrl()}/moveAddress`, {
      addressHash: address,
      oldProfileId: profile.id,
      newProfileId: this.selectedProfile.id,
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

  oninit() {
    this.error = false;
  }

  view(vnode: m.Vnode<MoveAddressModalAttrs>) {
    const { profile, profiles } = vnode.attrs;
    const moveToOptions = profiles.filter((p) => { return p.id !== profile.id; });

    return (
      <div class="MoveAddressModal">
        <div class="title">
          <CWText type="h4">Move Address</CWText>
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
          <CWText type="caption">
            Currently In
          </CWText>
          <div className="current-address">
            <MoveAddressRow
              profile={profile}
            />
          </div>
          <CWText type="caption">
            Move To
          </CWText>
          <div className="move-to-address">
            {moveToOptions.length === 0 ? (
              <CWText type="b2">
                No other profiles available
              </CWText>
            ) : (
              moveToOptions.map((option) => (
                <MoveAddressRow
                  profile={option}
                  selected={option.id === this.selectedProfile?.id}
                  onclick={(e) => {
                    e.preventDefault();
                    this.selectedProfile = option;
                    m.redraw();
                  }}
                />
              ))
            )}
          </div>
          <div className="actions">
            <CWButton
              label="Cancel"
              buttonType="secondary-black"
              onclick={(e) => {
                e.preventDefault();
                $(e.target).trigger('modalcomplete');
                setTimeout(() => {
                  $(e.target).trigger('modalexit');
                }, 0);
              }}
            />
            <CWButton
              label="Save"
              buttonType="primary-black"
              onclick={(e) => this.onMoveAddress(e, vnode)}
            />
          </div>
        </div>
      </div>
    );
  }
}

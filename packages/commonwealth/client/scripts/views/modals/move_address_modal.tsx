/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';

import 'modals/move_address_modal.scss';

import { NewProfile as Profile } from 'client/scripts/models';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

type MoveAddressModalAttrs = {
  profile: Profile;
  profiles: Profile[];
}

export class MoveAddressModal extends ClassComponent<MoveAddressModalAttrs> {
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
            <img src={profile.avatarUrl} />
            <CWText type="b2">
              {profile.name}
            </CWText>
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
              moveToOptions.map((p) => <CWText type="b2">{p.name}</CWText>)
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
            />
          </div>
        </div>
      </div>
    );
  }
}

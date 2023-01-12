/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import jdenticon from 'jdenticon';

import 'pages/new_profile/new_profile_header.scss';

import app from 'state';
import { NewProfile as Profile } from 'client/scripts/models';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { SocialAccounts } from '../../components/social_accounts';

type NewProfileHeaderAttrs = {
  address: string;
  profile: Profile;
};

export class NewProfileHeader extends ClassComponent<NewProfileHeaderAttrs> {
  private defaultAvatar: string;

  oninit(vnode: m.Vnode<NewProfileHeaderAttrs>) {
    this.defaultAvatar = jdenticon.toSvg(vnode.attrs.address, 90);
  }

  view(vnode: m.Vnode<NewProfileHeaderAttrs>) {
    const { profile, address } = vnode.attrs;

    if (!profile) return;
    const bio = profile.bio;

    const isCurrentUser = app.isLoggedIn() && app.user.addresses
      .map((addressInfo) => addressInfo.address)
      .includes(address);

    return (
      <div class="ProfileHeader">
        <div className="edit">
          {isCurrentUser && (
            <CWButton
              label="Edit"
              buttonType="mini-white"
              iconLeft="write"
              onclick={() =>
                m.route.set(`/profile/${m.route.param('address')}/edit`)
              }
            />
          )
        }
        </div>
        <div class="profile-image">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} />
          ) : (
            <img
              src={`data:image/svg+xml;utf8,${encodeURIComponent(
                this.defaultAvatar
              )}`}
            />
          )}
        </div>
        <div class="profile-name-and-bio">
          <CWText type="h3" className={profile.name ? 'name hasMargin' : 'name'}>
            {profile.name ? profile.name : `Anonymous (${address.slice(0, 5)}...)` }
          </CWText>
          <div class="buttons">
            {/* TODO: Add delegate and follow buttons */}
            {/* <CWButton label="Delegate" buttonType="mini-black" onClick={() => {}} />
            <CWButton label="Follow" buttonType="mini-black" onClick={() => {}} /> */}
          </div>
          <SocialAccounts profile={profile} />
          {bio && (
            <div>
              <CWText type="h4">Bio</CWText>
              <CWText className="bio">
                {renderQuillTextBody(bio)}
              </CWText>
            </div>
          )}
        </div>
      </div>
    );
  }
}

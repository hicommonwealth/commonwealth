/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import jdenticon from 'jdenticon';

import 'components/profile_preview.scss';

import { AddressInfo, NewProfile as Profile } from 'models';
import { CWText } from './component_kit/cw_text';
import { renderQuillTextBody } from './quill/helpers';
import { SocialAccounts } from './social_accounts';
import { CWButton } from './component_kit/cw_button';
import { LinkedAddresses } from './linked_addresses';

type ProfilePreviewAttrs = {
  profiles: Profile[];
  profile: Profile;
  addresses: AddressInfo[];
};

export class ProfilePreview extends ClassComponent<ProfilePreviewAttrs> {
  private defaultAvatar: string;

  oninit(vnode: m.Vnode<ProfilePreviewAttrs>) {
    // this.defaultAvatar = jdenticon.toSvg(vnode.attrs.profile.address, 90);
  }

  view(vnode: m.Vnode<ProfilePreviewAttrs>) {
    const { profiles, profile, addresses } = vnode.attrs;
    const { name, bio, avatarUrl } = profile;
    const address = addresses.find((a) => a.profileId === profile.id).address;

    return (
      <div className="ProfilePreview">
        <div className="profile">
          <div className="avatar">
            <img src={avatarUrl} />
          </div>
          <div className="right-side">
            <div className="content">
              <CWText type="h4">
                {name}
              </CWText>
              <CWText>
                {renderQuillTextBody(bio)}
              </CWText>
              <SocialAccounts profile={profile} />
            </div>
            <div className="actions">
              <CWButton
                label="View"
                buttonType="mini-white"
                onclick={() =>
                  m.route.set(`/profile/${address}`)
                }
              />
              <CWButton
                label="Edit"
                buttonType="mini-white"
                onclick={() =>
                  m.route.set(`/profile/${address}/edit`)
                }
              />
            </div>
          </div>
        </div>
        <div className="addresses">
          <CWText type="h5">
            Linked Addresses
          </CWText>
          <LinkedAddresses profiles={profiles} profile={profile} addresses={addresses} />
        </div>
      </div>
    );
  }
}

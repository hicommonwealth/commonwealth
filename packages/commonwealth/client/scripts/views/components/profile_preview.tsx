/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import jdenticon from 'jdenticon';

import 'components/profile_preview.scss';

import { NewProfile as Profile } from 'models';
import { CWText } from './component_kit/cw_text';
import { renderQuillTextBody } from './quill/helpers';
import { SocialAccounts } from './social_accounts';
import { CWButton } from './component_kit/cw_button';

type ProfilePreviewAttrs = {
  profile: Profile;
};

export class ProfilePreview extends ClassComponent<ProfilePreviewAttrs> {
  private defaultAvatar: string;

  oninit(vnode: m.Vnode<ProfilePreviewAttrs>) {
    // this.defaultAvatar = jdenticon.toSvg(vnode.attrs.profile.address, 90);
  }

  view(vnode: m.Vnode<ProfilePreviewAttrs>) {
    const { profile } = vnode.attrs;
    const { name, bio, avatarUrl, socials } = profile;

    console.log('profile', profile)

    return (
      <div className="ProfilePreview">
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
          <div className="action">
            <CWButton
              label="Edit"
              buttonType="mini-white"
              onclick={() =>
                m.route.set(`/profile/${m.route.param('address')}/edit`)
              }
            />
          </div>
        </div>
      </div>
    );
  }
}

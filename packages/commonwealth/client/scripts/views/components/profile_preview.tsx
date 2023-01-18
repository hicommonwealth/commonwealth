/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import jdenticon from 'jdenticon';

import 'components/profile_preview.scss';

import app from 'state';
import { AddressInfo, NewProfile as Profile } from 'models';
import { CWText } from './component_kit/cw_text';
import { renderQuillTextBody } from './quill/helpers';
import { SocialAccounts } from './social_accounts';
import { CWButton } from './component_kit/cw_button';
import { LinkedAddresses } from './linked_addresses';
import { NewLoginModal } from '../modals/login_modal';
import { formatAnonymousUsername } from '../../../../shared/utils';

type ProfilePreviewAttrs = {
  profiles: Profile[];
  profile: Profile;
  addresses?: AddressInfo[];
};

export class ProfilePreview extends ClassComponent<ProfilePreviewAttrs> {
  private defaultAvatar: string;

  oninit(vnode: m.Vnode<ProfilePreviewAttrs>) {
    this.defaultAvatar = jdenticon.toSvg(vnode.attrs.profile.id, 90);
  }

  view(vnode: m.Vnode<ProfilePreviewAttrs>) {
    const { profiles, profile, addresses } = vnode.attrs;
    const { bio, avatarUrl, username, name } = profile;

    return (
      <div className="ProfilePreview">
        <div className="profile">
          <div className="avatar">
            {avatarUrl ? (
              <img src={avatarUrl} />
            ) : (
              <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(
                  this.defaultAvatar
                )}`}
              />
            )}
          </div>
          <div className="content">
            <CWText type="h4">
              {name || formatAnonymousUsername(username)}
            </CWText>
            <div className="actions">
              <CWButton
                label="View"
                buttonType="mini-white"
                iconLeft="views"
                onclick={() =>
                  m.route.set(`/profile/${username}`)
                }
              />
              <CWButton
                label="Edit"
                buttonType="mini-white"
                iconLeft="write"
                onclick={() =>
                  m.route.set(`/profile/${username}/edit`)
                }
              />
            </div>
            {bio && (
              <CWText>
                {renderQuillTextBody(bio)}
              </CWText>
            )}
            <SocialAccounts profile={profile} />
          </div>
          <div className="desktop-actions">
            <CWButton
              label="View"
              buttonType="mini-white"
              iconLeft="views"
              onclick={() =>
                m.route.set(`/profile/${username}`)
              }
            />
            <CWButton
              label="Edit"
              buttonType="mini-white"
              iconLeft="write"
              onclick={() =>
                m.route.set(`/profile/${username}/edit`)
              }
            />
          </div>
        </div>
        <div className="addresses">
          <div className={addresses.length === 0 ? 'title no-margin' : 'title'}>
            <CWText type="h5">
              Linked Addresses
            </CWText>
            <CWButton
              label="Connect Address"
              buttonType="mini-white"
              onclick={() => {
                app.modals.create({
                  modal: NewLoginModal,
                });
              }}
              iconLeft="plus"
            />
          </div>
          {addresses && addresses.length > 0 && (
            <LinkedAddresses profiles={profiles} profile={profile} addresses={addresses} />
          )}
        </div>
      </div>
    );
  }
}

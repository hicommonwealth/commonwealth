import React from 'react';

import type {
  ResultNode
} from 'mithrilInterop';
import {
  ClassComponent,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
} from 'mithrilInterop';
import { NavigationWrapper } from 'mithrilInterop/helpers';
import jdenticon from 'jdenticon';

import 'components/profile_preview.scss';

import app from 'state';
import type { AddressInfo, NewProfile as Profile } from 'models';
import { CWText } from './component_kit/cw_text';
import { renderQuillTextBody } from './quill/helpers';
import { SocialAccounts } from './social_accounts';
import { CWButton } from './component_kit/cw_button';
import { LinkedAddresses } from './linked_addresses';
import { LoginModal } from '../modals/login_modal';

type ProfilePreviewAttrs = {
  profiles: Profile[];
  profile: Profile;
  addresses?: AddressInfo[];
  refreshProfiles: () => Promise<void>;
};

class ProfilePreview extends ClassComponent<ProfilePreviewAttrs> {
  private defaultAvatar: string;

  oninit(vnode: ResultNode<ProfilePreviewAttrs>) {
    this.defaultAvatar = jdenticon.toSvg(vnode.attrs.profile.id, 90);
  }

  view(vnode: ResultNode<ProfilePreviewAttrs>) {
    const { profiles, profile, addresses, refreshProfiles } = vnode.attrs;
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
            <CWText type="h4">{name || username}</CWText>
            <div className="actions">
              <CWButton
                label="View"
                buttonType="mini-white"
                iconLeft="views"
                onClick={() => this.navigateToSubpage(`/${username}`)}
              />
              <CWButton
                label="Edit"
                buttonType="mini-white"
                iconLeft="write"
                onClick={() => this.navigateToSubpage(`/${username}/edit`)}
              />
            </div>
            {bio && <CWText>{renderQuillTextBody(bio)}</CWText>}
            <SocialAccounts profile={profile} />
          </div>
          <div className="desktop-actions">
            <CWButton
              label="View"
              buttonType="mini-white"
              iconLeft="views"
              onClick={() => this.navigateToSubpage(`/${username}`)}
            />
            <CWButton
              label="Edit"
              buttonType="mini-white"
              iconLeft="write"
              onClick={() => this.navigateToSubpage(`/${username}/edit`)}
            />
          </div>
        </div>
        <div className="addresses">
          <div className={addresses.length === 0 ? 'title no-margin' : 'title'}>
            <CWText type="h5">Linked Addresses</CWText>
            <CWButton
              label="Connect Address"
              buttonType="mini-white"
              onClick={() => {
                app.modals.create({
                  modal: LoginModal,
                  exitCallback: () => {
                    refreshProfiles();
                  },
                });
              }}
              iconLeft="plus"
            />
          </div>
          {addresses && addresses.length > 0 && (
            <LinkedAddresses
              profiles={profiles}
              profile={profile}
              addresses={addresses}
              refreshProfiles={refreshProfiles}
            />
          )}
        </div>
      </div>
    );
  }
}

export default NavigationWrapper(ProfilePreview);

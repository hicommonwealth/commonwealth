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

import 'pages/new_profile/new_profile_header.scss';

import app from 'state';
import type { NewProfile as Profile } from 'client/scripts/models';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { SocialAccounts } from '../../components/social_accounts';

type NewProfileHeaderAttrs = {
  profile: Profile;
  isOwner: boolean;
};

class NewProfileHeaderComponent extends ClassComponent<NewProfileHeaderAttrs> {
  private defaultAvatar: string;

  oninit(vnode: ResultNode<NewProfileHeaderAttrs>) {
    this.defaultAvatar = jdenticon.toSvg(vnode.attrs.profile.id, 90);
  }

  view(vnode: ResultNode<NewProfileHeaderAttrs>) {
    const { profile, isOwner } = vnode.attrs;

    if (!profile) return;
    const { bio, name, username } = profile;

    const isCurrentUser = app.isLoggedIn() && isOwner;

    return (
      <div className="ProfileHeader">
        <div className="edit">
          {isCurrentUser && (
            <CWButton
              label="Edit"
              buttonType="mini-white"
              iconLeft="write"
              onClick={() => this.navigateToSubpage(`/${username}/edit`)}
            />
          )}
        </div>
        <div className="profile-image">
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
        <div className="profile-name-and-bio">
          <CWText type="h3" className={name ? 'name hasMargin' : 'name'}>
            {name || username}
          </CWText>
          <div className="buttons">
            {/* TODO: Add delegate and follow buttons */}
            {/* <CWButton label="Delegate" buttonType="mini-black" onClick={() => {}} />
            <CWButton label="Follow" buttonType="mini-black" onClick={() => {}} /> */}
          </div>
          <SocialAccounts profile={profile} />
          {bio && (
            <div>
              <CWText type="h4">Bio</CWText>
              <CWText className="bio">{renderQuillTextBody(bio)}</CWText>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export const NewProfileHeader = NavigationWrapper(NewProfileHeaderComponent);

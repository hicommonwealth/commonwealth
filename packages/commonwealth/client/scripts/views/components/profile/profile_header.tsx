import React from 'react';
import { useNavigate } from 'react-router-dom';
import jdenticon from 'jdenticon';

import 'components/profile/profile_header.scss';

import type { NewProfile as Profile } from 'client/scripts/models';
import { CWButton } from '../component_kit/cw_button';
import { CWText } from '../component_kit/cw_text';
import { renderQuillTextBody } from '../react_quill_editor/helpers';
import { SocialAccounts } from '../social_accounts';
import useUserLoggedIn from 'hooks/useUserLoggedIn';

type ProfileHeaderProps = {
  profile: Profile;
  isOwner: boolean;
};

const ProfileHeader = (props: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const { isLoggedIn } = useUserLoggedIn();

  const { profile, isOwner } = props;

  if (!profile) return;
  const { bio, name } = profile;

  const isCurrentUser = isLoggedIn && isOwner;

  return (
    <div className="ProfileHeader">
      <div className="edit">
        {isCurrentUser && (
          <CWButton
            label="Edit"
            buttonType="mini-white"
            iconLeft="write"
            onClick={() => navigate(`/profile/edit`)}
          />
        )}
      </div>
      <div className="profile-image">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} />
        ) : (
          <img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(
              jdenticon.toSvg(profile.id, 90)
            )}`}
          />
        )}
      </div>
      <div className="profile-name-and-bio">
        <CWText type="h3" className={name ? 'name hasMargin' : 'name'}>
          {name || 'Anonymous user'}
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
};

export default ProfileHeader;

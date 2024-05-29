import jdenticon from 'jdenticon';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import 'components/Profile/ProfileHeader.scss';

import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { renderQuillDeltaToText } from '../../../../../shared/utils';
import type NewProfile from '../../../models/NewProfile';
import { CWText } from '../component_kit/cw_text';
import { QuillRenderer } from '../react_quill_editor/quill_renderer';
import { SocialAccounts } from '../social_accounts';

type ProfileHeaderProps = {
  profile: NewProfile;
  isOwner: boolean;
};

const ProfileHeader = ({ profile, isOwner }: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const { isLoggedIn } = useUserLoggedIn();

  if (!profile) return;
  const { bio, name } = profile;

  const isCurrentUser = isLoggedIn && isOwner;
  const hasBio = () => {
    try {
      if (!bio || bio.trim().length === 0) return false;
      return renderQuillDeltaToText(JSON.parse(decodeURIComponent(bio)));
    } catch {
      return true;
    }
  };

  return (
    <div className="ProfileHeader">
      <div className="edit">
        {isCurrentUser && (
          <CWButton
            buttonHeight="sm"
            label="Edit"
            buttonType="tertiary"
            iconLeft="write"
            onClick={() => navigate(`/profile/edit`)}
          />
        )}
      </div>
      <div className="profile-image">
        {profile?.avatarUrl ? (
          <img src={profile.avatarUrl} />
        ) : (
          <img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(
              jdenticon.toSvg(profile.id, 90),
            )}`}
          />
        )}
      </div>
      <div className="profile-name-and-bio">
        <CWText type="h3" className={name ? 'name hasMargin' : 'name'}>
          {name || 'Anonymous user'}
        </CWText>
        <SocialAccounts profile={profile} />
        {hasBio() && (
          <div>
            <CWText type="h4">Bio</CWText>
            <CWText className="bio">
              <QuillRenderer doc={bio} />
            </CWText>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;

import jdenticon from 'jdenticon';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import './ProfileHeader.scss';

import {
  DEFAULT_NAME,
  getDecodedString,
  renderQuillDeltaToText,
} from '@hicommonwealth/shared';
import { useFlag } from 'hooks/useFlag';
import { useInviteLinkModal } from 'state/ui/modals';
import useUserStore from 'state/ui/user';
import { MarkdownViewerWithFallback } from 'views/components/MarkdownViewerWithFallback/MarkdownViewerWithFallback';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import type NewProfile from '../../../models/NewProfile';
import { CWText } from '../component_kit/cw_text';
import { SocialAccounts } from '../social_accounts';

type ProfileHeaderProps = {
  profile: NewProfile;
  isOwner: boolean;
};

const ProfileHeader = ({ profile, isOwner }: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const user = useUserStore();
  const { setIsInviteLinkModalOpen } = useInviteLinkModal();
  const referralsEnabled = useFlag('referrals');

  console.log('user', user);

  if (!profile) return;
  const { bio, name } = profile;

  const isCurrentUser = user.isLoggedIn && isOwner;
  const hasBio = () => {
    try {
      if (!bio || bio.trim().length === 0) return false;
      return renderQuillDeltaToText(JSON.parse(getDecodedString(bio)));
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
              jdenticon.toSvg(profile.userId, 90),
            )}`}
          />
        )}
      </div>
      <div className="profile-name-and-bio">
        <CWText type="h3" className="name">
          {name || DEFAULT_NAME}
        </CWText>

        {referralsEnabled && isCurrentUser && (
          <CWButton
            buttonType="tertiary"
            buttonHeight="sm"
            label="Get referral link"
            className="referral-link-button"
            onClick={() => setIsInviteLinkModalOpen(true)}
          />
        )}
        <SocialAccounts profile={profile} />
        {hasBio() && (
          <div>
            <CWText type="h4">Bio</CWText>
            <CWText className="bio">
              <MarkdownViewerWithFallback markdown={bio} />
            </CWText>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;

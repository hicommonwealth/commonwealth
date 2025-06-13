import jdenticon from 'jdenticon';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import './ProfileHeader.scss';

import {
  DEFAULT_NAME,
  getDecodedString,
  renderQuillDeltaToText,
} from '@hicommonwealth/shared';
import { useMutualConnections } from 'client/scripts/state/api/user';
import { useFlag } from 'hooks/useFlag';
import { useInviteLinkModal } from 'state/ui/modals';
import useUserStore from 'state/ui/user';
import { MarkdownViewerWithFallback } from 'views/components/MarkdownViewerWithFallback/MarkdownViewerWithFallback';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import type NewProfile from '../../../../models/NewProfile';
import { SharePopover } from '../../SharePopover';
import TrustLevelRole from '../../TrustLevelRole';
import { CWText } from '../../component_kit/cw_text';
import { SocialAccounts } from '../../social_accounts';

type ProfileHeaderProps = {
  profile: NewProfile;
  isOwner: boolean;
};

const ProfileHeader = ({ profile, isOwner }: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const user = useUserStore();
  const { setIsInviteLinkModalOpen } = useInviteLinkModal();
  const referralsEnabled = useFlag('referrals');

  const { data: mutualConnections } = useMutualConnections(
    {
      user_id_1: user.id,
      user_id_2: profile.userId,
      limit: 5,
    },
    { enabled: !isOwner && user.isLoggedIn },
  );

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
          <TrustLevelRole type="user" level={profile.tier} />
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
        <div className="icon-container">
          <SocialAccounts profile={profile} />
          <SharePopover linkToShare={window.location.href} />
        </div>
        {hasBio() && (
          <div>
            <CWText type="h4">Bio</CWText>
            <CWText className="bio">
              <MarkdownViewerWithFallback markdown={bio} />
            </CWText>
          </div>
        )}
        <div className="user-stats">
          <div className="stats-container">
            <div className="stat-item">
              <CWText type="b1" className="stat-value">
                150
              </CWText>
              <CWText type="caption">Token Votes Delegated</CWText>
            </div>
            <div className="stat-item">
              <CWText type="b1" className="stat-value">
                45
              </CWText>
              <CWText type="caption">Karma earned across Common</CWText>
            </div>
          </div>
        </div>
        {!isOwner && mutualConnections?.mutual_communities?.length > 0 && (
          <div className="mutual-connections">
            <div className="mutual-icons">
              {mutualConnections.mutual_communities
                .slice(0, 5)
                .map(
                  (
                    community: { id: string | number; icon_url?: string },
                    idx: number,
                  ) =>
                    community.icon_url ? (
                      <img
                        key={community.id}
                        src={community.icon_url}
                        alt=""
                        className="mutual-community-icon"
                        style={{ zIndex: 10 - idx }}
                      />
                    ) : null,
                )}
            </div>
            <CWText type="b1" style={{ marginLeft: 24 }}>
              {mutualConnections.mutual_communities.length > 50
                ? '50+'
                : mutualConnections.mutual_communities.length}{' '}
              mutual communities
            </CWText>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;

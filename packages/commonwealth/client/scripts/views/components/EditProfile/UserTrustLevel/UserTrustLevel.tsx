import {
  hasTierClientInfo,
  Tier,
  USER_TIERS,
  UserTierMap,
} from '@hicommonwealth/shared';
import { useFetchProfileByIdQuery } from 'client/scripts/state/api/profiles';
import useUserStore from 'client/scripts/state/ui/user';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from 'views/modals/AuthModal';
import CommunitySelectionModal from './CommunitySelectionModal';
import { levels } from './constants/levels';
import LevelBox from './LevelBox';
import { Status, VerificationItem, VerificationItemType } from './types';
import './UserTrustLevel.scss';

const UserTrustLevel = () => {
  const userData = useUserStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] =
    useState<VerificationItemType | null>(null);
  const navigate = useNavigate();

  const { data } = useFetchProfileByIdQuery({
    apiCallEnabled: userData.isLoggedIn,
  });

  const currentTier = data?.tier || 0;

  const getLevelStatus = (level: number): Status => {
    return level <= currentTier ? 'Done' : 'Not Started';
  };

  const getTierIcon = (level: number) => {
    const tierEntry = Object.entries(USER_TIERS).find(([key]) => {
      const tier = USER_TIERS[parseInt(key) as UserTierMap] as Tier & {
        clientInfo: { trustLevel: number; componentIcon: string };
      };
      return (
        hasTierClientInfo(parseInt(key) as UserTierMap) &&
        tier.clientInfo.trustLevel === level
      );
    });
    return tierEntry
      ? (
          USER_TIERS[parseInt(tierEntry[0]) as UserTierMap] as Tier & {
            clientInfo: { componentIcon: string };
          }
        ).clientInfo.componentIcon
      : undefined;
  };

  const handleItemClick = (item: VerificationItem) => {
    if (item.type === VerificationItemType.VERIFY_SOCIAL) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedAction(item.type);
    setIsCommunityModalOpen(true);
  };

  const handleCommunitySelect = (communityId: string | null) => {
    if (!communityId) {
      switch (selectedAction) {
        case VerificationItemType.LAUNCH_COIN:
          navigate('/createTokenCommunity');
          break;
        case VerificationItemType.VERIFY_COMMUNITY:
        case VerificationItemType.COMPLETE_CONTEST:
          navigate('/createCommunity');
          break;
      }
    } else {
      switch (selectedAction) {
        case VerificationItemType.LAUNCH_COIN:
          navigate(`/${communityId}/manage/integrations/token`);
          break;
        case VerificationItemType.VERIFY_COMMUNITY:
          navigate(`/${communityId}/manage/integrations/stake`);
          break;
        case VerificationItemType.COMPLETE_CONTEST:
          navigate(`/${communityId}/manage/contests`);
          break;
      }
    }
    setIsCommunityModalOpen(false);
    setSelectedAction(null);
  };

  return (
    <div className="verification-container">
      {levels.map((level) => {
        const status = getLevelStatus(level.level);
        const isLocked = level.level > currentTier + 1;
        const icon = getTierIcon(level.level);

        return (
          <LevelBox
            key={level.level}
            level={level.level}
            title={level.title}
            description={level.description}
            color={level.color}
            status={status}
            isLocked={isLocked}
            icon={icon}
            items={level.items}
            showArrow={level.redirect}
            onItemClick={handleItemClick}
          />
        );
      })}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        showAuthOptionTypesFor={['sso']}
      />
      <CommunitySelectionModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
        onSelect={handleCommunitySelect}
        communities={userData.communities}
      />
    </div>
  );
};

export default UserTrustLevel;

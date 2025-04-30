import {
  Tier,
  USER_TIERS,
  UserTierMap,
  UserVerificationItem,
  UserVerificationItemType,
} from '@hicommonwealth/shared';
import { useFetchProfileByIdQuery } from 'client/scripts/state/api/profiles';
import useUserStore from 'client/scripts/state/ui/user';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from 'views/modals/AuthModal';
import CommunitySelectionModal from './CommunitySelectionModal';
import {
  getLevelRedirect,
  getLevelStatus,
  getTierIcon,
} from './helpers/helpers';
import LevelBox from './LevelBox';
import './UserTrustLevel.scss';

type Status = 'Done' | 'Not Started';

const UserTrustLevel = () => {
  const userData = useUserStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] =
    useState<UserVerificationItemType | null>(null);
  const navigate = useNavigate();

  const { data } = useFetchProfileByIdQuery({
    apiCallEnabled: userData.isLoggedIn,
  });

  const currentTier = data?.tier || 0;

  const handleItemClick = (item: UserVerificationItem) => {
    if (item.type === 'VERIFY_SOCIAL') {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedAction(item.type as UserVerificationItemType);
    setIsCommunityModalOpen(true);
  };

  const handleCommunitySelect = (communityId: string | null) => {
    if (!communityId) {
      switch (selectedAction) {
        case 'LAUNCH_COIN':
          navigate('/createTokenCommunity');
          break;
        case 'VERIFY_COMMUNITY':
        case 'COMPLETE_CONTEST':
          navigate('/createCommunity');
          break;
      }
    } else {
      switch (selectedAction) {
        case 'LAUNCH_COIN':
          navigate(`/${communityId}/manage/integrations/token`);
          break;
        case 'VERIFY_COMMUNITY':
          navigate(`/${communityId}/manage/integrations/stake`);
          break;
        case 'COMPLETE_CONTEST':
          navigate(`/${communityId}/manage/contests`);
          break;
      }
    }
    setIsCommunityModalOpen(false);
    setSelectedAction(null);
  };

  const tiers = Object.entries(USER_TIERS)
    .filter(([key]) => {
      const tier = parseInt(key) as UserTierMap;
      return (
        tier >= UserTierMap.NewlyVerifiedWallet &&
        tier <= UserTierMap.ManuallyVerified
      );
    })
    .map(([key, tier]) => {
      const tierNum = parseInt(key) as UserTierMap;
      const tierWithClientInfo = tier as Tier & {
        clientInfo?: {
          trustLevel: number;
          verificationItems?: Record<string, UserVerificationItem>;
        };
      };
      return {
        level: tierWithClientInfo.clientInfo?.trustLevel || 0,
        title: tier.name,
        description: tier.description,
        status: getLevelStatus(
          tierWithClientInfo.clientInfo?.trustLevel || 0,
          currentTier,
        ),
        items: tierWithClientInfo.clientInfo?.verificationItems
          ? Object.values(tierWithClientInfo.clientInfo.verificationItems).map(
              (item) => ({
                ...item,
                status: getLevelStatus(
                  tierWithClientInfo.clientInfo?.trustLevel || 0,
                  currentTier,
                ),
              }),
            )
          : [],
        redirect: getLevelRedirect(tierNum),
      };
    })
    .sort((a, b) => a.level - b.level);

  return (
    <div className="verification-container">
      {tiers.map((level) => {
        const isLocked = level.level > currentTier + 1;
        const icon = getTierIcon(level.level);

        return (
          <LevelBox
            key={level.level}
            level={level.level}
            title={level.title}
            description={level.description}
            status={level.status}
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

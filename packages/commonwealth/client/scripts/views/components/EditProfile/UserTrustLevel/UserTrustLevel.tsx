import { UserProfileViewType } from '@hicommonwealth/schemas';
import {
  UserTierMap,
  UserVerificationItem,
  UserVerificationItemType,
} from '@hicommonwealth/shared';
import { useFetchProfileByIdQuery } from 'client/scripts/state/api/profiles';
import useUserStore from 'client/scripts/state/ui/user';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from 'views/modals/AuthModal';
import TrustLevelRole from '../../TrustLevelRole/TrustLevelRole';
import CommunitySelectionModal from './CommunitySelectionModal';
import { getCommunityNavigation, mapTiers } from './helpers/helpers';
import LevelBox from './LevelBox';
import './UserTrustLevel.scss';

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

  const currentTier: UserTierMap =
    (data?.tier as UserTierMap) ?? (userData.tier as UserTierMap);

  const handleItemClick = (item: UserVerificationItem) => {
    if (item.type === 'VERIFY_SOCIAL') {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedAction(item.type as UserVerificationItemType);
    setIsCommunityModalOpen(true);
  };

  const handleCommunitySelect = (communityId: string | null) => {
    if (selectedAction) {
      navigate(getCommunityNavigation(selectedAction, communityId));
    }
    setIsCommunityModalOpen(false);
    setSelectedAction(null);
  };

  if (!data) return null;

  const tiers = mapTiers(data as UserProfileViewType);

  return (
    <div className="UserTrustLevel">
      {tiers.map((tierInfo) => {
        let isLocked = false;
        if (
          tierInfo.tier === UserTierMap.ManuallyVerified &&
          data.tier !== UserTierMap.ManuallyVerified
        ) {
          isLocked = true;
        }
        const isCurrentTier = tierInfo.tier === currentTier;

        return (
          <LevelBox
            key={tierInfo.level}
            level={tierInfo.level}
            title={tierInfo.title}
            description={tierInfo.description}
            status={tierInfo.status}
            isLocked={isLocked}
            icon={
              <TrustLevelRole
                type="user"
                tier={tierInfo.tier}
                size="xl"
                withTooltip={isCurrentTier}
              />
            }
            items={tierInfo.items}
            showArrow={tierInfo.redirect}
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

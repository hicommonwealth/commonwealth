import {
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
    if (selectedAction) {
      navigate(getCommunityNavigation(selectedAction, communityId));
    }
    setIsCommunityModalOpen(false);
    setSelectedAction(null);
  };

  const tiers = mapTiers(currentTier);

  return (
    <div className="verification-container">
      {tiers.map((level) => {
        const isLocked = level.level > currentTier + 1;

        return (
          <LevelBox
            key={level.level}
            level={level.level}
            title={level.title}
            description={level.description}
            status={level.status}
            isLocked={isLocked}
            icon={<TrustLevelRole type="user" level={level.level} size="xl" />}
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

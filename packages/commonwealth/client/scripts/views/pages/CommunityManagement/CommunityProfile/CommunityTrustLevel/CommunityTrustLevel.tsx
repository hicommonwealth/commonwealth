import {
  CommunityVerificationItemType,
  UserVerificationItem,
} from '@hicommonwealth/shared';
import app from 'client/scripts/state';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from 'views/modals/AuthModal';
import './CommunityTrustLevel.scss';
import CommunityTrustLevelItem from './CommunityTrustLevelItem';
import { getCommunityNavigation } from './helpers/getCommunityNavigation';
import { mapTiers } from './helpers/mapTiers';
import { Status } from './types';

const CommunityTrustLevel = () => {
  const communityId = app.activeChainId() || '';
  const navigate = useNavigate();
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const currentTier = community?.tier || 0;
  const tiers = mapTiers(currentTier);

  const handleItemClick = (item: UserVerificationItem) => {
    if (item.type === 'VERIFY_SOCIAL') {
      setIsAuthModalOpen(true);
      return;
    }
    navigate(
      getCommunityNavigation(
        item.type as CommunityVerificationItemType,
        communityId,
      ),
    );
  };

  return (
    <div className="CommunityTrustLevel">
      {tiers.map((level) => (
        <CommunityTrustLevelItem
          key={level.level}
          level={level.level}
          title={level.title}
          description={level.description}
          status={level.status as Status}
          isLocked={false}
          icon={level.icon}
          items={level.items}
          showArrow={level.redirect}
          onItemClick={handleItemClick}
          color="gray"
        />
      ))}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        showAuthOptionTypesFor={['sso']}
      />
    </div>
  );
};

export default CommunityTrustLevel;

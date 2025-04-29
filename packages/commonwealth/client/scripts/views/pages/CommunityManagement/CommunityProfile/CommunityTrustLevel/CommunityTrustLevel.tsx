import {
  COMMUNITY_TIERS,
  CommunityTierMap,
  hasCommunityTierClientInfo,
  Tier,
} from '@hicommonwealth/shared';
import app from 'client/scripts/state';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import React, { useState } from 'react';
import { ButtonType } from 'views/components/component_kit/new_designs/CWButton/CWButton';
import { AuthModal } from 'views/modals/AuthModal';
import './CommunityTrustLevel.scss';
import LevelBox from './LevelBox';
import { Status } from './types';

const CommunityTrustLevel = () => {
  const communityId = app.activeChainId() || '';
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const currentTier = community?.tier || 0;

  const getLevelStatus = (level: number): Status => {
    return level <= currentTier ? 'Done' : 'Not Started';
  };

  const getTierIcon = (level: number) => {
    const tierEntry = Object.entries(COMMUNITY_TIERS).find(([key]) => {
      const tier = COMMUNITY_TIERS[
        parseInt(key) as CommunityTierMap
      ] as Tier & {
        clientInfo: { trustLevel: number; componentIcon: string };
      };
      return (
        hasCommunityTierClientInfo(parseInt(key) as CommunityTierMap) &&
        tier.clientInfo.trustLevel === level
      );
    });
    return tierEntry
      ? (
          COMMUNITY_TIERS[
            parseInt(tierEntry[0]) as CommunityTierMap
          ] as Tier & {
            clientInfo: { componentIcon: string };
          }
        ).clientInfo.componentIcon
      : undefined;
  };

  const getButtonConfig = (level: number) => {
    switch (level) {
      case 4:
        return {
          showButton: true,
          buttonLabel: 'Request Review',
          buttonType: 'primary' as ButtonType,
        };
      case 5:
        return {
          showButton: true,
          buttonLabel: 'Subscribe',
          buttonType: 'secondary' as ButtonType,
        };
      default:
        return {
          showButton: false,
          buttonLabel: 'Verify',
          buttonType: 'primary' as ButtonType,
        };
    }
  };

  const handleLevelClick = (level: number) => {
    if (level === 2) {
      setIsAuthModalOpen(true);
    }
  };

  const getLevels = () => {
    return Object.entries(COMMUNITY_TIERS)
      .filter(([key]) => {
        const tier = COMMUNITY_TIERS[
          parseInt(key) as CommunityTierMap
        ] as Tier & {
          clientInfo?: { trustLevel: number };
        };
        return (
          hasCommunityTierClientInfo(parseInt(key) as CommunityTierMap) &&
          tier.clientInfo?.trustLevel
        );
      })
      .map(([key]) => {
        const tier = COMMUNITY_TIERS[
          parseInt(key) as CommunityTierMap
        ] as Tier & {
          clientInfo: { trustLevel: number; componentIcon: string };
        };
        return {
          level: tier.clientInfo.trustLevel,
          title: tier.name,
          description: tier.description,
          color: 'gray',
          items: [],
          redirect: false,
        };
      })
      .sort((a, b) => a.level - b.level);
  };

  return (
    <div className="CommunityTrustLevel">
      {getLevels().map((level) => {
        const status = getLevelStatus(level.level);
        const icon = getTierIcon(level.level);
        const { showButton, buttonLabel, buttonType } = getButtonConfig(
          level.level,
        );

        return (
          <LevelBox
            key={level.level}
            level={level.level}
            title={level.title}
            description={level.description}
            color={level.color}
            status={status}
            isLocked={false}
            icon={icon}
            items={level.items}
            showArrow={level.redirect}
            onClick={() => handleLevelClick(level.level)}
            showButton={showButton}
            buttonLabel={buttonLabel}
            buttonType={buttonType}
            onButtonClick={() => handleLevelClick(level.level)}
          />
        );
      })}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        showAuthOptionTypesFor={['sso']}
      />
    </div>
  );
};

export default CommunityTrustLevel;

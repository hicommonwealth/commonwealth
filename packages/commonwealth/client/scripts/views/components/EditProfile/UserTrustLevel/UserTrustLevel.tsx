import {
  hasTierClientInfo,
  Tier,
  USER_TIERS,
  UserTierMap,
} from '@hicommonwealth/shared';
import { useFetchProfileByIdQuery } from 'client/scripts/state/api/profiles';
import useUserStore from 'client/scripts/state/ui/user';
import React, { useState } from 'react';
import { AuthModal } from 'views/modals/AuthModal';
import { levels } from './constants/levels';
import LevelBox from './LevelBox';
import { Status } from './types';
import './UserTrustLevel.scss';

const UserTrustLevel = () => {
  const userData = useUserStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

  const handleLevelClick = (level: number) => {
    if (level === 3) {
      setIsAuthModalOpen(true);
    }
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
            onClick={() => handleLevelClick(level.level)}
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

export default UserTrustLevel;

import {
  hasTierClientInfo,
  Tier,
  USER_TIERS,
  UserTierMap,
} from '@hicommonwealth/shared';
import { useFetchProfileByIdQuery } from 'client/scripts/state/api/profiles';
import useUserStore from 'client/scripts/state/ui/user';
import React from 'react';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
import { CWTag } from '../../component_kit/new_designs/CWTag';
import { levels } from './constants/levels';
import { Status } from './types';
import './UserTrustLevel.scss';

const getTagType = (status: Status): 'passed' | 'proposal' => {
  return status === 'Done' ? 'passed' : 'proposal';
};

const UserTrustLevel = () => {
  const userData = useUserStore();

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
      : null;
  };

  return (
    <div className="verification-container">
      {levels.map((level) => {
        const status = getLevelStatus(level.level);
        const isLocked = level.level > currentTier;
        const icon = getTierIcon(level.level);
        return (
          <div
            key={level.level}
            className={`level-box level-${level.color} ${
              isLocked ? 'disabled' : ''
            }`}
          >
            <div className="tier-icon">
              {icon && <CWIcon iconName={icon} iconSize="large" />}
            </div>
            <div className="level-box-content">
              <div className="level-header">
                <div className="level-title">
                  <CWText type="h5" fontWeight="semiBold">
                    Level {level.level}: {level.title}
                  </CWText>
                </div>
                <CWTag type={getTagType(status)} label={status} />
              </div>
              <CWText type="b2" className="level-description">
                {level.description}
              </CWText>
              {!isLocked && level.items && level.items.length > 0 && (
                <div className="level-items">
                  {level.items.map((item, idx) => (
                    <div key={idx} className="level-item">
                      <CWTag type={getTagType(status)} label={status} />
                      <CWText type="b2" className="item-label">
                        {item.label}
                      </CWText>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserTrustLevel;

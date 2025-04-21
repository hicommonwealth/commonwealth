import { useFetchProfileByIdQuery } from 'client/scripts/state/api/profiles';
import useUserStore from 'client/scripts/state/ui/user';
import React from 'react';
import { CWText } from '../../component_kit/cw_text';
import { CWTag } from '../../component_kit/new_designs/CWTag';
import { levels } from './constants/levels';
import { Status } from './types';
import './UserTrustlevel.scss';

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

  return (
    <div className="verification-container">
      {levels.map((level) => {
        const status = getLevelStatus(level.level);
        const isLocked = level.level > currentTier;

        return (
          <div
            key={level.level}
            className={`level-box level-${level.color} ${
              isLocked ? 'disabled' : ''
            }`}
          >
            <div className="level-header">
              <CWText type="h5" fontWeight="semiBold">
                Level {level.level}: {level.title}
              </CWText>
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
        );
      })}
    </div>
  );
};

export default UserTrustLevel;

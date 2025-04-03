import React from 'react';

import { getCommunityTrustLevel, getUserTrustLevel } from 'utils/trustLevel';

import './TrustLevelRole.scss';

interface TrustLevelRoleProps {
  type: 'community' | 'user';
  level: number;
}

const TrustLevelRole = ({ type, level }: TrustLevelRoleProps) => {
  const { icon } =
    type === 'community'
      ? getCommunityTrustLevel(level)
      : getUserTrustLevel(level);

  return <span className="TrustLevelRole">{icon}</span>;
};

export default TrustLevelRole;

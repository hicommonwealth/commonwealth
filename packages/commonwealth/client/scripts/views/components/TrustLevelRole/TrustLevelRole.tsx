import React from 'react';

import { useFlag } from 'hooks/useFlag';
import { getCommunityTrustLevel, getUserTrustLevel } from 'utils/trustLevel';

interface TrustLevelRoleProps {
  type: 'community' | 'user';
  level: number;
}

const TrustLevelRole = ({ type, level }: TrustLevelRoleProps) => {
  const isTrustLevelEnabled = useFlag('trustLevel');

  if (!isTrustLevelEnabled) return null;

  const { icon } =
    type === 'community'
      ? getCommunityTrustLevel(level)
      : getUserTrustLevel(level);

  return <span className="TrustLevelRole">{icon}</span>;
};

export default TrustLevelRole;

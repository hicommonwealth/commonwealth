import React from 'react';

import { useFlag } from 'hooks/useFlag';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { getCommunityTrustLevel, getUserTrustLevel } from './utils';

interface TrustLevelRoleProps {
  type: 'community' | 'user';
  level: number;
  size?: 'small' | 'medium' | 'large' | 'xl';
}

const TrustLevelRole = ({
  type,
  level,
  size = 'small',
}: TrustLevelRoleProps) => {
  const isTrustLevelEnabled = useFlag('trustLevel');

  if (!isTrustLevelEnabled) return null;

  const { icon } =
    type === 'community'
      ? getCommunityTrustLevel(level)
      : getUserTrustLevel(level);

  return <CWIcon iconName={icon} iconSize={size} />;
};

export default TrustLevelRole;

import React from 'react';

import {
  COMMUNITY_TIERS,
  CommunityTierMap,
  Tier,
  USER_TIERS,
  UserTier,
  UserTierMap,
} from '@hicommonwealth/shared';
import { handleMouseEnter, handleMouseLeave } from 'views/menus/utils';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';
import { getCommunityTrustLevel, getUserTrustLevelIcon } from './utils';

interface TrustLevelRoleProps {
  type: 'community' | 'user';
  tier?: UserTierMap | CommunityTierMap;
  size?: 'small' | 'medium' | 'large' | 'xl';
  withTooltip?: boolean;
}

const TrustLevelRole = ({
  type,
  tier,
  size = 'small',
  withTooltip = false,
}: TrustLevelRoleProps) => {
  const { icon } =
    type === 'community'
      ? getCommunityTrustLevel(tier)
      : getUserTrustLevelIcon(tier as UserTierMap);

  const tiers = type === 'community' ? COMMUNITY_TIERS : USER_TIERS;
  const tierData: Tier | UserTier = tier ? tiers[tier] : undefined;

  const tooltipContent = tierData ? (
    <div style={{ maxWidth: 240 }}>
      <CWText type="b2">
        {tierData.name}: {tierData.description}
      </CWText>
      <a
        href="https://docs.common.xyz/commonwealth/account-overview/user-trust-levels#trust-levels-on-common"
        target="_blank"
        rel="noopener noreferrer"
      >
        See more
      </a>
    </div>
  ) : null;

  if (withTooltip && tooltipContent) {
    return (
      <CWTooltip
        placement="bottom"
        content={tooltipContent}
        renderTrigger={(handleInteraction, isTooltipOpen) => (
          <span
            onMouseEnter={(e) =>
              handleMouseEnter({ e, isTooltipOpen, handleInteraction })
            }
            onMouseLeave={(e) =>
              handleMouseLeave({ e, isTooltipOpen, handleInteraction })
            }
          >
            <CWIcon iconName={icon} iconSize={size} />
          </span>
        )}
      />
    );
  }

  return <CWIcon iconName={icon} iconSize={size} />;
};

export default TrustLevelRole;

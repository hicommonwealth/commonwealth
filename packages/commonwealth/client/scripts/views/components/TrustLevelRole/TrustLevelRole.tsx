import React from 'react';

import { COMMUNITY_TIERS, USER_TIERS } from '@hicommonwealth/shared';
import { useFlag } from 'hooks/useFlag';
import { handleMouseEnter, handleMouseLeave } from 'views/menus/utils';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';
import { getCommunityTrustLevel, getUserTrustLevel } from './utils';

interface TrustLevelRoleProps {
  type: 'community' | 'user';
  level?: number;
  size?: 'small' | 'medium' | 'large' | 'xl';
  withTooltip?: boolean;
}

const TrustLevelRole = ({
  type,
  level,
  size = 'small',
  withTooltip = false,
}: TrustLevelRoleProps) => {
  const isTrustLevelEnabled = useFlag('trustLevel');

  if (!isTrustLevelEnabled) return null;

  const { icon } =
    type === 'community'
      ? getCommunityTrustLevel(level)
      : getUserTrustLevel(level);

  const tiers = type === 'community' ? COMMUNITY_TIERS : USER_TIERS;
  const tier =
    level !== undefined
      ? Object.values(tiers).find(
          (t) => t.clientInfo?.trustLevel === level,
        )
      : undefined;

  const tooltipContent = tier ? (
    <div style={{ maxWidth: 240 }}>
      <CWText type="b2">
        {tier.name}: {tier.description}
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
        placement="top"
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

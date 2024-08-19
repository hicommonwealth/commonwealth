import React from 'react';
import { Link } from 'react-router-dom';
import { CWCommunityAvatar } from 'views/components/component_kit/cw_community_avatar';
import { CWText } from 'views/components/component_kit/cw_text';
import { IconSize } from '../cw_icons/types';
import './CommunityInfo.scss';

type CommunityInfoProps = {
  name: string;
  symbol?: string;
  iconUrl: string;
  iconSize?: IconSize;
  communityId: string;
};

const CommunityInfo = ({
  name,
  symbol,
  iconUrl,
  iconSize = 'medium',
  communityId = '',
}: CommunityInfoProps) => {
  return (
    <Link className="CommunityInfo" rel="noreferrer" to={`/${communityId}`}>
      <CWCommunityAvatar size={iconSize} community={{ iconUrl, name }} />
      <div className="info-container">
        {symbol && (
          <CWText type="b1" fontWeight="semiBold" className="symbol">
            {symbol}
          </CWText>
        )}
        <CWText type="b2" className="name">
          {name}
        </CWText>
      </div>
    </Link>
  );
};

export { CommunityInfo };

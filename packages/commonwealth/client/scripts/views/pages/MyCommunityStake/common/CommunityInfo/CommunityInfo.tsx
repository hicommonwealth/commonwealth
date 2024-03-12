import ChainInfo from 'client/scripts/models/ChainInfo';
import { CWCommunityAvatar } from 'client/scripts/views/components/component_kit/cw_community_avatar';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import React from 'react';
import { Link } from 'react-router-dom';
import './CommunityInfo.scss';

type CommunityInfoProps = {
  name: string;
  symbol: string;
  iconUrl: string;
  communityId: string;
};

const CommunityInfo = ({
  name,
  symbol,
  iconUrl,
  communityId = '',
}: CommunityInfoProps) => {
  return (
    <Link
      className="CommunityInfo"
      target="_blank"
      rel="noreferrer"
      to={`/${communityId}`}
    >
      <CWCommunityAvatar
        size="medium"
        community={{ iconUrl, name } as ChainInfo}
      />
      <div className="info-container">
        <CWText type="b1" fontWeight="semiBold" className="symbol">
          {symbol}
        </CWText>
        <CWText type="b2" className="name">
          {name}
        </CWText>
      </div>
    </Link>
  );
};

export { CommunityInfo };

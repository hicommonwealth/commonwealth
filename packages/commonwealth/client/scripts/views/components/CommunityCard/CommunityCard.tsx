import React from 'react';

import './CommunityCard.scss';

import { isCommandClick } from 'helpers';
import { useCommonNavigate } from 'navigation/helpers';
import type ChainInfo from '../../../models/ChainInfo';
import { CWButton } from '../component_kit/cw_button';
import { CWCard } from '../component_kit/cw_card';
import { CWCommunityAvatar } from '../component_kit/cw_community_avatar';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWText } from '../component_kit/cw_text';

type CommunityCardProps = { community: ChainInfo };

export const CommunityCard = ({ community }: CommunityCardProps) => {
  const navigate = useCommonNavigate();

  const redirectFunction = (e) => {
    e.preventDefault();
    if (isCommandClick(e)) {
      window.open(`/${community.id}`, '_blank');
      return;
    }
    localStorage['home-scrollY'] = window.scrollY;
    navigate(`/${community.id}`);
  };

  // Potentially Temporary (could be built into create community flow)
  let prettyDescription = '';

  if (community.description) {
    prettyDescription =
      community.description[community.description.length - 1] === '.'
        ? community.description
        : `${community.description}.`;
  }

  return (
    <CWCard
      elevation="elevation-2"
      interactive
      className="community-card"
      onClick={redirectFunction}
    >
      <div className="top-content">
        <CWCommunityAvatar community={community} size="xxl" />
        <CWText
          type="h4"
          fontWeight="semiBold"
          className="chain-name"
          title={community.name}
          noWrap
        >
          {community.name}
        </CWText>
      </div>
      <div className="bottom-content">
        <CWText
          className="card-description"
          type="caption"
          title={prettyDescription}
        >
          {prettyDescription}
        </CWText>
        <CWButton
          buttonType="secondary-black"
          label="See More"
          onClick={redirectFunction}
        />
        {/* for mobile */}
        <CWIconButton iconName="expand" onClick={redirectFunction} />
      </div>
    </CWCard>
  );
};

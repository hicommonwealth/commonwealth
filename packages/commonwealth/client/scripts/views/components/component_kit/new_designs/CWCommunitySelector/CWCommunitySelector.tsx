import React from 'react';

import { ComponentType } from '../../types';

import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';

import './CWCommunitySelector.scss';

type CommunityType = 'ethereum' | 'cosmos' | 'polygon' | 'solana';

interface CWCommunitySelectorProps {
  type: CommunityType;
  title: string;
  isRecommended?: boolean;
  description: string;
  onClick: (type: CommunityType) => void;
}

const CWCommunitySelector = ({
  type,
  title,
  isRecommended,
  description,
  onClick,
}: CWCommunitySelectorProps) => {
  return (
    <div
      className={ComponentType.CommunitySelector}
      onClick={() => onClick(type)}
    >
      <div className="chain-logo-container">
        <img src={`static/img/communitySelector/${type}.svg`} alt={title} />
      </div>
      <div className="content-container">
        <div className="title-row">
          <CWText type="h5" fontWeight="bold">
            {title}
          </CWText>
          {isRecommended && (
            <CWTag label="Recommended" type="stage" classNames="phase-7" />
          )}
        </div>
        <CWText className="description">{description}</CWText>
      </div>
    </div>
  );
};

export default CWCommunitySelector;

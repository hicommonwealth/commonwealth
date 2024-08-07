import React from 'react';

import { ComponentType } from '../../types';

import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';

import { ChainBase } from '@hicommonwealth/shared';
import './CWCommunitySelector.scss';

export enum CommunityType {
  Blast = 'blast',
  Base = 'base',
  Ethereum = 'ethereum',
  Cosmos = 'cosmos',
  Polygon = 'polygon',
  Solana = 'solana',
}

export type SelectedCommunity = {
  type: CommunityType;
  chainBase: ChainBase;
};

interface CWCommunitySelectorProps {
  img: string;
  title: string;
  isRecommended?: boolean;
  description: string;
  onClick: () => void;
}

const CWCommunitySelector = ({
  img,
  title,
  isRecommended,
  description,
  onClick,
}: CWCommunitySelectorProps) => {
  return (
    <div className={ComponentType.CommunitySelector} onClick={onClick}>
      <div className="chain-logo-container">
        <img src={img} alt={title} />
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

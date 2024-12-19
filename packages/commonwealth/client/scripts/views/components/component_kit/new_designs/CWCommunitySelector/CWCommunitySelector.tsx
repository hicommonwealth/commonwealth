import React from 'react';

import { ComponentType } from '../../types';

import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';

import { ChainBase } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { CWRadioButton, RadioButtonProps } from '../cw_radio_button';
import './CWCommunitySelector.scss';

export enum CommunityType {
  Blast = 'blast',
  Base = 'base',
  Ethereum = 'ethereum',
  Cosmos = 'cosmos',
  Polygon = 'polygon',
  Solana = 'solana',
  Skale = 'skale',
}

export type SelectedCommunity = {
  type: CommunityType;
  chainBase: ChainBase;
};

interface CWCommunitySelectorProps {
  img: string;
  title: string;
  isRecommended?: boolean;
  description?: string;
  onClick: () => void;
  withRadioButton?: RadioButtonProps;
}

const CWCommunitySelector = ({
  img,
  title,
  isRecommended,
  description,
  onClick,
  withRadioButton,
}: CWCommunitySelectorProps) => {
  return (
    <div
      className={clsx(ComponentType.CommunitySelector, {
        active: withRadioButton?.checked,
        withRadio: !!withRadioButton,
      })}
      onClick={onClick}
    >
      {withRadioButton && (
        <div className="radio-button">
          <CWRadioButton {...withRadioButton} />
        </div>
      )}
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
        {description && <CWText className="description">{description}</CWText>}
      </div>
    </div>
  );
};

export default CWCommunitySelector;
